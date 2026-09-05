/**
 * Vercel Blob Storage Wrapper
 *
 * Security principles:
 * - Never expose storage credentials to the browser
 * - Internal key generation: media/{userId}/{uuid}/{sanitizedExtension}
 * - Randomized object names — never use raw user-provided filenames
 * - Short-lived signed read URLs
 * - Deletion cleans up storage and DB
 */

import { put, del, head } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { Errors } from '../errors';

/** Supported MIME → extension map */
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/tiff': 'tiff',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/aac': 'aac',
  'audio/m4a': 'm4a',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-matroska': 'mkv',
};

/**
 * Generates a secure internal storage key.
 * Format: media/{userId}/{uuid}.{ext}
 * Never includes the original filename.
 */
export function generateBlobKey(userId: string, mimeType: string): string {
  const ext = MIME_TO_EXT[mimeType.toLowerCase()] ?? 'bin';
  const uniqueId = randomUUID();
  return `media/${userId}/${uniqueId}.${ext}`;
}

export interface UploadResult {
  blobUrl: string;
  blobKey: string;
}

/**
 * Uploads a Buffer/Blob to Vercel Blob storage.
 * Returns the blob URL and internal key.
 */
export async function uploadToBlob(
  userId: string,
  mimeType: string,
  data: Buffer | Blob | ReadableStream
): Promise<UploadResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw Errors.uploadFailed('Storage service is not configured.');
  }

  const blobKey = generateBlobKey(userId, mimeType);

  const result = await put(blobKey, data, {
    access: 'private',
    contentType: mimeType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return {
    blobUrl: result.url,
    blobKey,
  };
}

/**
 * Generates a signed upload token for direct browser-to-Vercel-Blob upload.
 * The browser uploads directly — bypassing Vercel's 4.5MB body limit.
 */
export async function generateClientUploadUrl(
  userId: string,
  mimeType: string
): Promise<{ uploadUrl: string; blobKey: string }> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw Errors.uploadFailed('Storage service is not configured.');
  }

  const blobKey = generateBlobKey(userId, mimeType);

  // Use Vercel Blob's client upload — generates a tokenized URL
  const { createUpload } = await import('@vercel/blob/client');
  const { url: uploadUrl } = await createUpload(blobKey, {
    access: 'private',
    contentType: mimeType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return { uploadUrl, blobKey };
}

/**
 * Deletes a blob from storage.
 * Should be called on media deletion or cleanup.
 */
export async function deleteBlob(blobUrl: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn('[storage] BLOB_READ_WRITE_TOKEN not set, skipping blob deletion');
    return;
  }

  await del(blobUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
}

/**
 * Checks if a blob exists.
 */
export async function blobExists(blobUrl: string): Promise<boolean> {
  try {
    await head(blobUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
    return true;
  } catch {
    return false;
  }
}
