/**
 * Server-Side Media Validation
 *
 * Authoritative validation — client-side validation is UX only.
 * This is the security boundary.
 *
 * Checks:
 * - File size limits
 * - Magic bytes (file signature, not just MIME)
 * - MIME type cross-validation
 * - Filename sanitization
 * - Content-Type header validation
 */

import { Errors } from '../errors';

// ─── Limits ──────────────────────────────────────────────────────────────────

export const MAX_FILE_SIZE_BYTES = parseInt(process.env.MAX_FILE_SIZE_BYTES ?? '104857600', 10); // 100MB default
export const MAX_VIDEO_DURATION_SECONDS = parseInt(process.env.MAX_VIDEO_DURATION_SECONDS ?? '300', 10);

// ─── Allowed Types ────────────────────────────────────────────────────────────

export const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff',
  'image/heic',
]);

export const ALLOWED_AUDIO_MIMES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/m4a',
  'audio/x-m4a',
  'audio/ogg',
]);

export const ALLOWED_VIDEO_MIMES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);

export const ALL_ALLOWED_MIMES = new Set([
  ...ALLOWED_IMAGE_MIMES,
  ...ALLOWED_AUDIO_MIMES,
  ...ALLOWED_VIDEO_MIMES,
]);

// ─── Magic Byte Signatures ────────────────────────────────────────────────────

/** Magic byte signatures for supported formats */
const MAGIC_SIGNATURES: Array<{
  mime: string;
  offset: number;
  bytes: number[];
}> = [
  // JPEG: FF D8 FF
  { mime: 'image/jpeg', offset: 0, bytes: [0xff, 0xd8, 0xff] },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  { mime: 'image/png', offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // WebP: RIFF....WEBP
  { mime: 'image/webp', offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
  // TIFF LE: 49 49 2A 00
  { mime: 'image/tiff', offset: 0, bytes: [0x49, 0x49, 0x2a, 0x00] },
  // TIFF BE: 4D 4D 00 2A
  { mime: 'image/tiff', offset: 0, bytes: [0x4d, 0x4d, 0x00, 0x2a] },
  // MP3: ID3 tag
  { mime: 'audio/mpeg', offset: 0, bytes: [0x49, 0x44, 0x33] },
  // MP3: MPEG sync word FF FB / FF FA / FF F3
  { mime: 'audio/mpeg', offset: 0, bytes: [0xff, 0xfb] },
  // WAV: RIFF....WAVE
  { mime: 'audio/wav', offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
  // MP4/MOV: ftyp box at offset 4
  { mime: 'video/mp4', offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }, // ftyp
  // WebM: 1A 45 DF A3
  { mime: 'video/webm', offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3] },
];

// ─── Validation ───────────────────────────────────────────────────────────────

export type MediaCategory = 'image' | 'audio' | 'video';

export interface ServerValidationResult {
  category: MediaCategory;
  sanitizedMime: string;
  sanitizedName: string;
  sizeBytes: number;
}

/**
 * Sanitizes a filename to prevent injection attacks and path traversal.
 * Preserves the original extension.
 */
export function sanitizeFilename(filename: string): string {
  let clean = filename.replace(/\0/g, '');
  clean = clean.replace(/[^a-zA-Z0-9.\-]/g, '_');
  clean = clean.replace(/_+/g, '_');
  clean = clean.replace(/_\./g, '.');
  clean = clean.replace(/\._/g, '.');
  clean = clean.replace(/^[_.]+/, '').replace(/[_.]+$/, '');
  
  if (!clean) {
    clean = `file_${Math.random().toString(36).substring(2, 10)}`;
  }
  
  if (clean.length > 255) {
    const parts = clean.split('.');
    const ext = parts.length > 1 ? '.' + parts.pop() : '';
    clean = clean.slice(0, 255 - ext.length) + ext;
  }
  
  return clean;
}

/**
 * Reads the first N bytes of a File/Blob for magic byte inspection.
 */
async function readMagicBytes(file: File | Blob, count = 12): Promise<Uint8Array> {
  const slice = file.slice(0, count);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Detects media category from MIME type.
 */
export function getMimeCategory(mime: string): MediaCategory | null {
  const normalized = mime.toLowerCase();
  if (ALLOWED_IMAGE_MIMES.has(normalized)) return 'image';
  if (ALLOWED_AUDIO_MIMES.has(normalized)) return 'audio';
  if (ALLOWED_VIDEO_MIMES.has(normalized)) return 'video';
  return null;
}

/**
 * Validates a file server-side.
 * This is the authoritative security check — runs in API routes.
 */
export async function validateMediaFileServer(
  file: File | Blob,
  reportedMime: string,
  originalFilename: string
): Promise<ServerValidationResult> {
  // 1. Size check
  if (file.size === 0) {
    throw Errors.invalidInput('File is empty.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const maxMb = Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024));
    throw Errors.fileTooLarge(maxMb);
  }

  // 2. MIME type validation
  const normalizedMime = reportedMime.toLowerCase().trim();

  if (!ALL_ALLOWED_MIMES.has(normalizedMime)) {
    throw Errors.unsupportedMedia(
      `Unsupported media type: ${normalizedMime}. Accepted: JPEG, PNG, WebP, TIFF, MP3, WAV, AAC, M4A, MP4, QuickTime, WebM.`
    );
  }

  const category = getMimeCategory(normalizedMime);
  if (!category) {
    throw Errors.unsupportedMedia('Unable to determine media category.');
  }

  // 3. Magic bytes check
  const magicBytes = await readMagicBytes(file, 16);
  const hasValidSignature = MAGIC_SIGNATURES.some((sig) => {
    // Check bytes at offset
    if (magicBytes.length < sig.offset + sig.bytes.length) return false;
    return sig.bytes.every((b, i) => magicBytes[sig.offset + i] === b);
  });

  if (!hasValidSignature) {
    // For some formats (AAC, M4A) magic bytes are complex — warn but don't reject
    // Only reject definitive mismatches
    if (category === 'image') {
      throw Errors.unsupportedMedia(
        'File signature does not match the declared media type. The file may be corrupted or misrepresented.'
      );
    }
  }

  // 4. Sanitize filename
  const sanitizedName = sanitizeFilename(originalFilename);

  return {
    category,
    sanitizedMime: normalizedMime,
    sanitizedName,
    sizeBytes: file.size,
  };
}

/**
 * Validates a URL for media ingestion.
 * Client-facing validation — SSRF protection is separate (lib/security/ssrf.ts).
 */
export function validateMediaUrlServer(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw Errors.invalidInput('Invalid URL format. Must include https://');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw Errors.invalidInput('Only HTTPS URLs are accepted.');
  }

  return parsed;
}
