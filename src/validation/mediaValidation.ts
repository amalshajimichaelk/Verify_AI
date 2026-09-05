/**
 * Centralized Client-side Media Validation
 *
 * IMPORTANT SECURITY NOTICE:
 * Client-side validation exists purely for rapid user experience and immediate feedback.
 * It is NOT a security boundary. Authoritative cryptographic validation, magic-byte inspection,
 * MIME enforcement, and virus/exploit checks are executed exclusively within isolated server-side
 * enclaves.
 */

export const MAX_FILE_SIZE_BYTES = 250 * 1024 * 1024; // 250MB as specified in Stitch design

export const SUPPORTED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff',
  'image/x-adobe-dng',
];

export const SUPPORTED_AUDIO_MIMES = [
  'audio/wav',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/flac',
  'audio/aac',
  'audio/ogg',
];

export const SUPPORTED_VIDEO_MIMES = [
  'video/mp4',
  'video/quicktime',
  'video/x-matroska',
  'video/webm',
];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  detectedType?: 'image' | 'audio' | 'video' | 'url';
  sanitizedName?: string;
}

/**
 * Sanitizes input filenames to prevent injection or directory path traversal.
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

/**
 * Validates a client-selected File object.
 */
export function validateMediaFile(file: File): ValidationResult {
  if (!file) {
    return { isValid: false, error: 'No media file provided.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size exceeds the 250MB enclave intake limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  if (file.size === 0) {
    return { isValid: false, error: 'File is empty (0 bytes).' };
  }

  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  let detectedType: 'image' | 'audio' | 'video' | undefined;

  if (SUPPORTED_IMAGE_MIMES.includes(mime) || /\.(jpe?g|png|webp|tiff?|raw|dng)$/i.test(name)) {
    detectedType = 'image';
  } else if (SUPPORTED_AUDIO_MIMES.includes(mime) || /\.(wav|mp3|flac|aac|ogg|m4a)$/i.test(name)) {
    detectedType = 'audio';
  } else if (SUPPORTED_VIDEO_MIMES.includes(mime) || /\.(mp4|mov|mkv|webm|avi)$/i.test(name)) {
    detectedType = 'video';
  }

  if (!detectedType) {
    return {
      isValid: false,
      error: 'Unsupported media container format. Accepted: JPG, PNG, WEBP, TIFF, WAV, MP3, FLAC, MP4, MOV, MKV, WebM.',
    };
  }

  return {
    isValid: true,
    detectedType,
    sanitizedName: sanitizeFilename(file.name),
  };
}

/**
 * Validates a media/social network URL.
 */
export function validateMediaUrl(rawUrl: string): ValidationResult {
  if (!rawUrl || !rawUrl.trim()) {
    return { isValid: false, error: 'URL cannot be empty.' };
  }

  const trimmed = rawUrl.trim();

  // Basic URL structure check
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: 'Invalid URL format. Must include protocol (e.g., https://).' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { isValid: false, error: 'Only secure HTTP/HTTPS endpoints are accepted.' };
  }

  // Prevent local/internal IP SSRF attempts on client side
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.local') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.')
  ) {
    return { isValid: false, error: 'Localhost and private network addresses are strictly prohibited.' };
  }

  return {
    isValid: true,
    detectedType: 'url',
    sanitizedName: parsed.hostname + parsed.pathname.slice(-20),
  };
}
