/**
 * POST /api/media/upload-token
 *
 * Generates a signed Vercel Blob upload token for direct browser-to-Blob upload.
 * This bypasses Vercel's 4.5MB request body limit by having the browser upload
 * directly to Vercel Blob storage.
 *
 * Security:
 * - Requires authentication
 * - Validates MIME type and file size before issuing token
 * - Never exposes BLOB_READ_WRITE_TOKEN to the browser
 * - Rate limited
 * - Logs audit event
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fromError, generateRequestId } from '../../../lib/api/response';
import { getRequiredSession } from '../../../lib/auth/session';
import { generateClientUploadUrl } from '../../../lib/storage/blob';
import { checkRateLimit } from '../../../lib/security/rateLimit';
import { ALL_ALLOWED_MIMES, MAX_FILE_SIZE_BYTES, sanitizeFilename, getMimeCategory } from '../../../lib/validation/serverMediaValidation';
import { Errors } from '../../../lib/errors';
import { logger, hashUserId } from '../../../lib/utils/logger';

const RequestSchema = z.object({
  filename: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(100),
  sizeBytes: z.number().positive().max(MAX_FILE_SIZE_BYTES),
});

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();

  try {
    const session = await getRequiredSession();
    await checkRateLimit('upload', session.userId);

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      throw Errors.invalidInput('Invalid request body: ' + parsed.error.message);
    }

    const { filename, mimeType, sizeBytes } = parsed.data;

    // Validate MIME type
    const normalizedMime = mimeType.toLowerCase().trim();
    if (!ALL_ALLOWED_MIMES.has(normalizedMime)) {
      throw Errors.unsupportedMedia(`Unsupported media type: ${normalizedMime}`);
    }

    // Validate size
    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      const maxMb = Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024));
      throw Errors.fileTooLarge(maxMb);
    }

    const category = getMimeCategory(normalizedMime);
    const sanitizedName = sanitizeFilename(filename);

    logger.info('[upload-token] Generating upload token', {
      requestId,
      userId: hashUserId(session.userId),
      mediaType: category ?? 'unknown',
    });

    const { uploadUrl, blobKey } = await generateClientUploadUrl(session.userId, normalizedMime);

    return ok(
      {
        uploadUrl,
        blobKey,
        sanitizedName,
        mediaType: category,
        maxSizeBytes: MAX_FILE_SIZE_BYTES,
      },
      requestId
    );
  } catch (err) {
    return fromError(err, requestId);
  }
}
