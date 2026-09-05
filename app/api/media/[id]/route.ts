/**
 * DELETE /api/media/[id]
 *
 * Deletes a media asset:
 * 1. Verifies authentication and ownership (prevents IDOR)
 * 2. Deletes from Vercel Blob storage
 * 3. Marks as deleted in database (soft delete)
 * 4. Logs audit event
 *
 * Security: User can only delete their own media.
 */

import { NextRequest } from 'next/server';
import { ok, fromError, noContent, generateRequestId } from '../../../../lib/api/response';
import { getRequiredSession, assertOwnership } from '../../../../lib/auth/session';
import { deleteBlob } from '../../../../lib/storage/blob';
import { Errors } from '../../../../lib/errors';
import { logger, hashUserId } from '../../../../lib/utils/logger';

// Dynamic import to avoid DB connection at module load (demo mode compatibility)
async function getDb() {
  const { db } = await import('../../../../lib/db/client');
  const { mediaAssets } = await import('../../../../lib/db/schema');
  return { db, mediaAssets };
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id } = await params;

  try {
    const session = await getRequiredSession();

    // In demo mode, return success without DB operations
    if (!process.env.DATABASE_URL) {
      logger.info('[media] Demo mode deletion (no-op)', { requestId, mediaAssetId: id });
      return noContent();
    }

    const { db, mediaAssets } = await getDb();
    const { eq, and, isNull } = await import('drizzle-orm');

    // Fetch the asset to verify ownership
    const [asset] = await db
      .select()
      .from(mediaAssets)
      .where(and(eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt)))
      .limit(1);

    if (!asset) {
      throw Errors.notFound('Media asset');
    }

    // IDOR check: verify ownership before deletion
    assertOwnership(session.userId, asset.userId, 'media asset');

    // Delete from Vercel Blob storage
    try {
      await deleteBlob(asset.blobUrl);
    } catch (err) {
      // Log but don't fail — still mark as deleted in DB
      logger.warn('[media] Blob deletion failed, continuing with DB soft-delete', {
        requestId,
        mediaAssetId: id,
      });
    }

    // Soft delete in database
    await db
      .update(mediaAssets)
      .set({ deletedAt: new Date() })
      .where(eq(mediaAssets.id, id));

    logger.info('[media] Media asset deleted', {
      requestId,
      userId: hashUserId(session.userId),
      mediaAssetId: id,
    });

    return noContent();
  } catch (err) {
    return fromError(err, requestId);
  }
}
