/**
 * Inngest Analysis Job Function
 *
 * Runs the full forensic analysis pipeline asynchronously.
 * Called by the Inngest queue after job creation.
 *
 * Stages with DB progress updates:
 * QUEUED → UPLOADING → METADATA_ANALYSIS → MEDIA_ANALYSIS →
 * SOURCE_ANALYSIS → AGGREGATING → EXPLANATION → COMPLETED
 *
 * Retry config: 3 attempts with exponential backoff.
 * Each stage is idempotent — safe to retry.
 */

import { inngest } from './inngestClient';
import { runAnalysisPipeline } from '../analysis/pipeline';
import { logger } from '../utils/logger';
import type { MediaAsset, AnalysisResult } from '../../src/types';

export const analysisJobFunction = inngest.createFunction(
  {
    id: 'analyze-media',
    name: 'Analyze Media Asset',
    retries: 3,
    throttle: {
      limit: 10,
      period: '1m',
    },
    triggers: [{ event: 'verifyai/media.analyze' }],
  },

  async ({ event, step }: { event: { data: { jobId: string; mediaAssetId: string; userId: string; asset: MediaAsset } }; step: any }) => {
    const { jobId, asset } = event.data;

    logger.info('[inngest] Starting analysis job', { jobId });

    // Helper to update job progress in DB
    async function updateProgress(stage: string, percent: number, status: string = 'PROCESSING') {
      await step.run(`update-progress-${stage}`, async () => {
        const { db } = await import('../db/client');
        const { analysisJobs } = await import('../db/schema');
        const { eq } = await import('drizzle-orm');

        await db
          .update(analysisJobs)
          .set({
            status: status as never,
            progressPercent: percent,
            currentStage: stage,
          })
          .where(eq(analysisJobs.id, jobId));
      });
    }

    // Run the pipeline
    const result = await step.run('run-analysis-pipeline', async () => {
      try {
        await updateProgress('Fetching and validating media...', 10, 'UPLOADING');

        const { analysisResult } = await runAnalysisPipeline({
          jobId,
          asset,
          onProgress: async (stage, percent) => {
            const statusMap: Record<number, string> = {
              10: 'PROCESSING',
              45: 'AGGREGATING',
              65: 'AGGREGATING',
              75: 'EXPLANATION',
              85: 'SOURCE_ANALYSIS',
              95: 'EXPLANATION',
            };
            await updateProgress(stage, percent, statusMap[percent] ?? 'PROCESSING');
          },
        });

        return { success: true, result: analysisResult };
      } catch (err) {
        logger.error('[inngest] Pipeline failed', {
          jobId,
          errorCode: err instanceof Error ? err.message : 'unknown',
        });
        return { success: false, error: String(err) };
      }
    });

    if (!result.success || !result.result) {
      // Mark job as failed
      await step.run('mark-failed', async () => {
        const { db } = await import('../db/client');
        const { analysisJobs } = await import('../db/schema');
        const { eq } = await import('drizzle-orm');

        await db
          .update(analysisJobs)
          .set({
            status: 'FAILED',
            error: result.error ?? 'Analysis pipeline failed',
            completedAt: new Date(),
          })
          .where(eq(analysisJobs.id, jobId));
      });

      throw new Error(result.error ?? 'Analysis failed');
    }

    // Store result in DB
    await step.run('store-result', async () => {
      const { db } = await import('../db/client');
      const { analysisJobs, analysisResults, detectionSignals, metadataRecords, sourceMatches, timelineEvents } =
        await import('../db/schema');
      const { eq } = await import('drizzle-orm');

      const analysisResult = result.result! as AnalysisResult;

      // Insert analysis result
      const [storedResult] = await db
        .insert(analysisResults)
        .values({
          jobId,
          classification: analysisResult.classification as never,
          calibratedConfidence: analysisResult.calibratedConfidence,
          confidenceRangeLow: analysisResult.confidenceRange[0],
          confidenceRangeHigh: analysisResult.confidenceRange[1],
          evidenceStrength: analysisResult.evidenceStrength as never,
          coverageActive: analysisResult.coverageRatio.active,
          coverageTotal: analysisResult.coverageRatio.total,
          primaryFinding: analysisResult.primaryFinding,
          summaryRationale: analysisResult.summaryRationale,
          uncertaintyExplanation: analysisResult.uncertaintyExplanation,
          c2paPresent: analysisResult.c2paValidation?.present ?? false,
          c2paIsValid: analysisResult.c2paValidation?.isValid ?? false,
          c2paSigner: analysisResult.c2paValidation?.signer ?? null,
          c2paChainValidated: analysisResult.c2paValidation?.chainValidated ?? false,
          limitations: analysisResult.limitations as never,
        })
        .returning();

      // Insert signals
      if (analysisResult.signals.length > 0) {
        await db.insert(detectionSignals).values(
          analysisResult.signals.map((s) => ({
            resultId: storedResult.id,
            signalKey: s.id,
            name: s.name,
            category: s.category,
            score: s.score,
            confidence: s.confidence,
            status: s.status,
            weight: s.weight,
            primaryFinding: s.primaryFinding,
            technicalDetails: s.technicalDetails,
            modelVersion: s.modelVersion,
          }))
        );
      }

      // Insert metadata
      if (analysisResult.metadata.length > 0) {
        await db.insert(metadataRecords).values(
          analysisResult.metadata.map((m) => ({
            resultId: storedResult.id,
            field: m.field,
            value: m.value,
            status: m.status,
            notes: m.notes ?? null,
            category: m.category,
          }))
        );
      }

      // Insert sources
      if (analysisResult.sources.length > 0) {
        await db.insert(sourceMatches).values(
          analysisResult.sources.map((s) => ({
            resultId: storedResult.id,
            relationship: s.relationship,
            domain: s.domain,
            url: s.url,
            sourceTimestamp: s.timestamp,
            similarityScore: s.similarityScore,
            sourceType: s.sourceType,
            context: s.context,
            hasC2paSignature: s.hasC2paSignature,
          }))
        );
      }

      // Insert timeline
      if (analysisResult.timeline.length > 0) {
        await db.insert(timelineEvents).values(
          analysisResult.timeline.map((t) => ({
            resultId: storedResult.id,
            eventTimestamp: t.timestamp,
            title: t.title,
            description: t.description,
            eventType: t.eventType,
            source: t.source ?? null,
          }))
        );
      }

      // Mark job as completed
      await db
        .update(analysisJobs)
        .set({
          status: 'COMPLETED',
          progressPercent: 100,
          currentStage: 'Analysis complete.',
          completedAt: new Date(),
          isDemoData: analysisResult.isDemoData,
        })
        .where(eq(analysisJobs.id, jobId));
    });

    logger.info('[inngest] Analysis job completed', { jobId });
    return { jobId, status: 'COMPLETED' };
  }
);
