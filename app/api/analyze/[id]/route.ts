/**
 * GET /api/analyze/[id]
 *
 * Returns the full analysis result for a completed job.
 * Includes signals, metadata, sources, timeline, and classification.
 *
 * Security: Auth + ownership check.
 */

import { NextRequest } from 'next/server';
import { ok, fromError, generateRequestId } from '../../../../lib/api/response';
import { getRequiredSession, assertOwnership } from '../../../../lib/auth/session';
import { Errors } from '../../../../lib/errors';
import type { AnalysisJob, AnalysisResult } from '../../../../src/types';
import { BENCHMARK_CASES } from '../../../../src/mock/mockDatabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = generateRequestId();
  const { id } = params;

  try {
    const session = await getRequiredSession();

    // Demo mode: return from BENCHMARK_CASES if available
    if (!process.env.DATABASE_URL) {
      const benchmark = BENCHMARK_CASES[id as keyof typeof BENCHMARK_CASES];
      if (benchmark) {
        return ok(
          {
            job: {
              id,
              asset: benchmark.asset,
              status: 'COMPLETED',
              progressPercent: 100,
              currentStage: 'Demo analysis complete.',
              startedAt: benchmark.generatedAt,
              completedAt: benchmark.generatedAt,
              result: benchmark,
            } as AnalysisJob,
            isDemoMode: true,
          },
          requestId
        );
      }

      // Generic demo result
      const fallback = BENCHMARK_CASES['case-4891'];
      return ok(
        {
          job: {
            id,
            asset: fallback.asset,
            status: 'COMPLETED',
            progressPercent: 100,
            currentStage: 'Demo analysis complete.',
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            result: { ...fallback, jobId: id, isDemoData: true },
          } as AnalysisJob,
          isDemoMode: true,
        },
        requestId
      );
    }

    // Production: fetch from database
    const { db } = await import('../../../../lib/db/client');
    const {
      analysisJobs,
      analysisResults,
      detectionSignals,
      metadataRecords,
      sourceMatches,
      timelineEvents,
      mediaAssets,
    } = await import('../../../../lib/db/schema');
    const { eq } = await import('drizzle-orm');

    const [job] = await db
      .select()
      .from(analysisJobs)
      .where(eq(analysisJobs.id, id))
      .limit(1);

    if (!job) throw Errors.notFound('Analysis job');
    assertOwnership(session.userId, job.userId, 'analysis job');

    const [asset] = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, job.mediaAssetId))
      .limit(1);

    if (job.status !== 'COMPLETED') {
      return ok(
        {
          job: {
            id: job.id,
            asset: asset
              ? {
                  id: asset.id,
                  name: asset.name,
                  type: asset.mediaType,
                  size: asset.size,
                  mimeType: asset.mimeType,
                  url: asset.blobUrl,
                  hashSha256: asset.sha256,
                  uploadedAt: asset.uploadedAt.toISOString(),
                }
              : null,
            status: job.status,
            progressPercent: job.progressPercent,
            currentStage: job.currentStage,
            startedAt: job.startedAt.toISOString(),
            error: job.error,
          },
          isDemoMode: false,
        },
        requestId
      );
    }

    // Fetch complete result
    const [result] = await db
      .select()
      .from(analysisResults)
      .where(eq(analysisResults.jobId, id))
      .limit(1);

    if (!result) throw Errors.notFound('Analysis result');

    const signals = await db.select().from(detectionSignals).where(eq(detectionSignals.resultId, result.id));
    const metadata = await db.select().from(metadataRecords).where(eq(metadataRecords.resultId, result.id));
    const sources = await db.select().from(sourceMatches).where(eq(sourceMatches.resultId, result.id));
    const timeline = await db.select().from(timelineEvents).where(eq(timelineEvents.resultId, result.id));

    const analysisResult: AnalysisResult = {
      jobId: id,
      asset: {
        id: asset.id,
        name: asset.name,
        type: asset.mediaType,
        size: asset.size,
        mimeType: asset.mimeType,
        url: asset.blobUrl,
        hashSha256: asset.sha256,
        uploadedAt: asset.uploadedAt.toISOString(),
        dimensions:
          asset.widthPx && asset.heightPx
            ? { width: asset.widthPx, height: asset.heightPx }
            : undefined,
        durationSeconds: asset.durationSeconds ?? undefined,
      },
      classification: result.classification as AnalysisResult['classification'],
      calibratedConfidence: result.calibratedConfidence,
      confidenceRange: [result.confidenceRangeLow, result.confidenceRangeHigh],
      evidenceStrength: result.evidenceStrength as AnalysisResult['evidenceStrength'],
      coverageRatio: { active: result.coverageActive, total: result.coverageTotal },
      primaryFinding: result.primaryFinding,
      summaryRationale: result.summaryRationale,
      uncertaintyExplanation: result.uncertaintyExplanation,
      signals: signals.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category as AnalysisResult['signals'][0]['category'],
        score: s.score,
        confidence: s.confidence,
        status: s.status as AnalysisResult['signals'][0]['status'],
        weight: s.weight,
        primaryFinding: s.primaryFinding,
        technicalDetails: s.technicalDetails,
        modelVersion: s.modelVersion,
      })),
      metadata: metadata.map((m) => ({
        field: m.field,
        value: m.value,
        status: m.status as AnalysisResult['metadata'][0]['status'],
        notes: m.notes ?? undefined,
        category: m.category as AnalysisResult['metadata'][0]['category'],
      })),
      sources: sources.map((s) => ({
        id: s.id,
        relationship: s.relationship as AnalysisResult['sources'][0]['relationship'],
        domain: s.domain,
        url: s.url,
        timestamp: s.sourceTimestamp ?? '',
        similarityScore: s.similarityScore,
        sourceType: s.sourceType as AnalysisResult['sources'][0]['sourceType'],
        context: s.context ?? '',
        hasC2paSignature: s.hasC2paSignature ?? false,
      })),
      timeline: timeline.map((t) => ({
        id: t.id,
        timestamp: t.eventTimestamp,
        title: t.title,
        description: t.description,
        eventType: t.eventType as AnalysisResult['timeline'][0]['eventType'],
        source: t.source ?? undefined,
      })),
      limitations: (result.limitations as AnalysisResult['limitations']) ?? {
        blindSpots: [],
        unavailableData: [],
        recommendedHumanChecks: [],
      },
      c2paValidation: {
        present: result.c2paPresent ?? false,
        isValid: result.c2paIsValid ?? false,
        signer: result.c2paSigner ?? undefined,
        chainValidated: result.c2paChainValidated ?? false,
      },
      generatedAt: result.generatedAt.toISOString(),
      isDemoData: job.isDemoData,
    };

    return ok(
      {
        job: {
          id: job.id,
          asset: analysisResult.asset,
          status: job.status,
          progressPercent: 100,
          currentStage: 'Analysis complete.',
          startedAt: job.startedAt.toISOString(),
          completedAt: job.completedAt?.toISOString(),
          result: analysisResult,
        } as AnalysisJob,
        isDemoMode: false,
      },
      requestId
    );
  } catch (err) {
    return fromError(err, requestId);
  }
}
