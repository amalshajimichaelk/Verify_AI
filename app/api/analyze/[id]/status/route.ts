/**
 * GET /api/analyze/[id]/status
 *
 * Lightweight status polling endpoint.
 * Returns only job status and progress — not the full result.
 * Client uses this for polling during analysis.
 *
 * Security: Auth + ownership check.
 */

import { NextRequest } from 'next/server';
import { ok, fromError, generateRequestId } from '../../../../../lib/api/response';
import { getRequiredSession, assertOwnership } from '../../../../../lib/auth/session';
import { Errors } from '../../../../../lib/errors';
import type { JobStatus } from '../../../../../src/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id } = await params;

  try {
    const session = await getRequiredSession();

    // Demo mode: return mock status
    if (!process.env.DATABASE_URL) {
      return ok(
        {
          jobId: id,
          status: 'COMPLETED' as JobStatus,
          progressPercent: 100,
          currentStage: 'Demo analysis complete.',
          isDemoMode: true,
        },
        requestId
      );
    }

    const { db } = await import('../../../../../lib/db/client');
    const { analysisJobs } = await import('../../../../../lib/db/schema');
    const { eq } = await import('drizzle-orm');

    const [job] = await db
      .select({
        id: analysisJobs.id,
        userId: analysisJobs.userId,
        status: analysisJobs.status,
        progressPercent: analysisJobs.progressPercent,
        currentStage: analysisJobs.currentStage,
        startedAt: analysisJobs.startedAt,
        completedAt: analysisJobs.completedAt,
        error: analysisJobs.error,
      })
      .from(analysisJobs)
      .where(eq(analysisJobs.id, id))
      .limit(1);

    if (!job) throw Errors.notFound('Analysis job');

    // IDOR: verify ownership
    assertOwnership(session.userId, job.userId, 'analysis job');

    return ok(
      {
        jobId: job.id,
        status: job.status,
        progressPercent: job.progressPercent,
        currentStage: job.currentStage,
        startedAt: job.startedAt.toISOString(),
        completedAt: job.completedAt?.toISOString(),
        error: job.error,
        isDemoMode: false,
      },
      requestId
    );
  } catch (err) {
    return fromError(err, requestId);
  }
}
