import { describe, it, expect } from 'vitest';
import {
  ALL_ALLOWED_MIMES,
  MAX_FILE_SIZE_BYTES,
  getMimeCategory,
  sanitizeFilename,
} from '../../lib/validation/serverMediaValidation';

describe('Server Media Validation', () => {
  describe('MIME Types', () => {
    it('allows standard image formats', () => {
      expect(ALL_ALLOWED_MIMES.has('image/jpeg')).toBe(true);
      expect(ALL_ALLOWED_MIMES.has('image/png')).toBe(true);
      expect(ALL_ALLOWED_MIMES.has('image/webp')).toBe(true);
    });

    it('allows standard audio formats', () => {
      expect(ALL_ALLOWED_MIMES.has('audio/mpeg')).toBe(true);
      expect(ALL_ALLOWED_MIMES.has('audio/wav')).toBe(true);
    });

    it('allows standard video formats', () => {
      expect(ALL_ALLOWED_MIMES.has('video/mp4')).toBe(true);
      expect(ALL_ALLOWED_MIMES.has('video/webm')).toBe(true);
    });

    it('rejects executable formats', () => {
      expect(ALL_ALLOWED_MIMES.has('application/x-msdownload')).toBe(false);
      expect(ALL_ALLOWED_MIMES.has('application/x-sh')).toBe(false);
      expect(ALL_ALLOWED_MIMES.has('application/javascript')).toBe(false);
    });
  });

  describe('getMimeCategory', () => {
    it('correctly categorizes images', () => {
      expect(getMimeCategory('image/jpeg')).toBe('image');
      expect(getMimeCategory('image/heic')).toBe('image');
    });

    it('correctly categorizes audio', () => {
      expect(getMimeCategory('audio/ogg')).toBe('audio');
    });

    it('correctly categorizes video', () => {
      expect(getMimeCategory('video/quicktime')).toBe('video');
    });

    it('returns null for unknown or invalid MIME types', () => {
      expect(getMimeCategory('application/pdf')).toBeNull();
      expect(getMimeCategory('invalid-mime')).toBeNull();
    });
  });

  describe('sanitizeFilename', () => {
    it('removes path traversal characters', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etc_passwd');
      expect(sanitizeFilename('..\\windows\\system32')).toBe('windows_system32');
    });

    it('removes null bytes', () => {
      expect(sanitizeFilename('test\0.jpg')).toBe('test.jpg');
    });

    it('replaces spaces and special characters with underscores', () => {
      expect(sanitizeFilename('my cool file.jpg')).toBe('my_cool_file.jpg');
      expect(sanitizeFilename('file!@#$%^&*().png')).toBe('file.png');
    });

    it('preserves valid extensions', () => {
      expect(sanitizeFilename('report_final.v2.mp4')).toBe('report_final.v2.mp4');
    });

    it('truncates excessively long filenames', () => {
      const longName = 'a'.repeat(300) + '.jpg';
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
      expect(sanitized.endsWith('.jpg')).toBe(true);
    });

    it('provides a default name if original name is stripped empty', () => {
      expect(sanitizeFilename('../..')).toMatch(/^file_[a-z0-9]+$/);
    });
  });

  describe('Constants', () => {
    it('sets MAX_FILE_SIZE_BYTES to 100MB', () => {
      expect(MAX_FILE_SIZE_BYTES).toBe(100 * 1024 * 1024);
    });
  });
});
