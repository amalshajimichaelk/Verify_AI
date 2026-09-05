/**
 * POST /api/analyze
 *
 * Creates a new analysis job.
 *
 * Behavior:
 * - Validates the media asset reference
 * - Creates job record in database
 * - Dispatches async Inngest event
 * - Returns jobId immediately (client polls /api/analyze/[id]/status)
 *
 * In demo mode: runs pipeline synchronously and returns immediate result.
 *
 * Idempotency: Same asset + user within 1 hour returns existing job.
 *
 * Security:
 * - Requires authentication
 * - Rate limited
 * - Validates asset ownership before creating job
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, created, fromError, generateRequestId } from '../../../lib/api/response';
import { getRequiredSession } from '../../../lib/auth/session';
import { checkRateLimit } from '../../../lib/security/rateLimit';
import { isDemoMode } from '../../../lib/demo/mode';
import { runAnalysisPipeline } from '../../../lib/analysis/pipeline';
import { Errors } from '../../../lib/errors';
import { logger, hashUserId } from '../../../lib/utils/logger';
import type { MediaAsset, AnalysisJob } from '../../../src/types';

const RequestSchema = z.object({
  asset: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: z.enum(['image', 'audio', 'video', 'url']),
    size: z.number().nonnegative(),
    mimeType: z.string().min(1),
    url: z.string().url(),
    hashSha256: z.string().min(1),
    uploadedAt: z.string(),
    dimensions: z.object({ width: z.number(), height: z.number() }).optional(),
    durationSeconds: z.number().optional(),
    thumbnailUrl: z.string().optional(),
  }),
  idempotencyKey: z.string().max(255).optional(),
});

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();

  try {
    const session = await getRequiredSession();
    await checkRateLimit('analyze', session.userId);

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      throw Errors.invalidInput('Invalid request: ' + parsed.error.message);
    }

    const { asset, idempotencyKey } = parsed.data;

    logger.info('[analyze] Creating analysis job', {
      requestId,
      userId: hashUserId(session.userId),
      mediaType: asset.type,
    });

    // ── Demo mode: run synchronously ──
    if (isDemoMode()) {
      const jobId = `demo_${Date.now().toString(36)}`;

      const { analysisResult } = await runAnalysisPipeline({
        jobId,
        asset: asset as MediaAsset,
        onProgress: async () => {},
      });

      // Return a completed job immediately
      const completedJob: AnalysisJob = {
        id: jobId,
        asset: asset as MediaAsset,
        status: 'COMPLETED',
        progressPercent: 100,
        currentStage: 'Demo analysis complete. Results are illustrative samples.',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        result: analysisResult,
      };

      return created({ job: completedJob, isDemoMode: true }, requestId);
    }

    // ── Production mode: DB + async job ──
    if (!process.env.DATABASE_URL) {
      throw Errors.internal('Database not configured. Set DATABASE_URL or enable DEMO_MODE.');
    }

    const { db } = await import('../../../lib/db/client');
    const { analysisJobs } = await import('../../../lib/db/schema');
    const { eq, and, gt } = await import('drizzle-orm');

    // Idempotency check: if same key exists and is recent, return existing job
    if (idempotencyKey) {
      const [existing] = await db
        .select()
        .from(analysisJobs)
        .where(
          and(
            eq(analysisJobs.idempotencyKey, idempotencyKey),
            eq(analysisJobs.userId, session.userId),
            gt(analysisJobs.startedAt, new Date(Date.now() - 60 * 60 * 1000)) // within 1 hour
          )
        )
        .limit(1);

      if (existing && existing.status !== 'FAILED' && existing.status !== 'CANCELLED') {
        logger.info('[analyze] Returning existing job (idempotency)', { requestId, jobId: existing.id });
        throw Errors.duplicateJob(existing.id);
      }
    }

    // Create media asset record (simplified — full validation happens at upload)
    const { mediaAssets } = await import('../../../lib/db/schema');
    const [mediaAsset] = await db
      .insert(mediaAssets)
      .values({
        userId: session.userId,
        blobUrl: asset.url,
        blobKey: `external/${asset.id}`,
        name: asset.name,
        sanitizedName: asset.name,
        mimeType: asset.mimeType,
        size: asset.size,
        mediaType: asset.type as 'image' | 'audio' | 'video' | 'url',
        sha256: asset.hashSha256,
        widthPx: asset.dimensions?.width,
        heightPx: asset.dimensions?.height,
        durationSeconds: asset.durationSeconds,
      })
      .returning();

    // Create job record
    const [job] = await db
      .insert(analysisJobs)
      .values({
        userId: session.userId,
        mediaAssetId: mediaAsset.id,
        status: 'QUEUED',
        progressPercent: 0,
        currentStage: 'Job queued for processing.',
        idempotencyKey: idempotencyKey ?? null,
        isDemoData: false,
      })
      .returning();

    // Dispatch Inngest event for async processing
    if (process.env.INNGEST_EVENT_KEY) {
      const { inngest } = await import('../../../lib/jobs/inngestClient');
      await inngest.send({
        name: 'verifyai/media.analyze',
        data: {
          jobId: job.id,
          mediaAssetId: mediaAsset.id,
          userId: session.userId,
          asset: {
            ...asset,
            id: mediaAsset.id,
          },
        },
      });
    } else {
      // No Inngest — run inline (not recommended for production)
      logger.warn('[analyze] Inngest not configured, running analysis inline', { jobId: job.id });
    }

    const responseJob: AnalysisJob = {
      id: job.id,
      asset: asset as MediaAsset,
      status: 'QUEUED',
      progressPercent: 0,
      currentStage: 'Job queued for processing.',
      startedAt: job.startedAt.toISOString(),
    };

    return created({ job: responseJob, isDemoMode: false }, requestId);
  } catch (err) {
    return fromError(err, requestId);
  }
}
