/**
 * POST /api/analyze/[id]/cancel
 *
 * Cancels a running analysis job.
 * Security: Auth + ownership.
 */

import { NextRequest } from 'next/server';
import { ok, fromError, generateRequestId } from '../../../../../lib/api/response';
import { getRequiredSession, assertOwnership } from '../../../../../lib/auth/session';
import { Errors } from '../../../../../lib/errors';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id } = await params;

  try {
    const session = await getRequiredSession();

    // Demo mode: nothing to cancel
    if (!process.env.DATABASE_URL) {
      return ok({ jobId: id, status: 'CANCELLED' }, requestId);
    }

    const { db } = await import('../../../../../lib/db/client');
    const { analysisJobs } = await import('../../../../../lib/db/schema');
    const { eq } = await import('drizzle-orm');

    const [job] = await db
      .select({ id: analysisJobs.id, userId: analysisJobs.userId, status: analysisJobs.status })
      .from(analysisJobs)
      .where(eq(analysisJobs.id, id))
      .limit(1);

    if (!job) throw Errors.notFound('Analysis job');
    assertOwnership(session.userId, job.userId, 'analysis job');

    if (job.status === 'COMPLETED' || job.status === 'CANCELLED') {
      return ok({ jobId: id, status: job.status }, requestId);
    }

    await db
      .update(analysisJobs)
      .set({ status: 'CANCELLED', currentStage: 'Cancelled by user.', completedAt: new Date() })
      .where(eq(analysisJobs.id, id));

    return ok({ jobId: id, status: 'CANCELLED' }, requestId);
  } catch (err) {
    return fromError(err, requestId);
  }
}
