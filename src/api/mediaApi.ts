/**
 * Media Ingestion & Upload API
 */

import { MediaAsset, UploadResponse } from '../types';
import { ApiError, generateRequestId, simulateLatency } from './client';
import { validateMediaFile, validateMediaUrl } from '../validation/mediaValidation';

export const mediaApi = {
  /**
   * Ingests a local user file into the zero-retention memory enclave.
   * Simulates progress callback, hash computation, and pre-flight metadata extraction.
   */
  async uploadMedia(
    file: File,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal
  ): Promise<UploadResponse> {
    const validation = validateMediaFile(file);
    if (!validation.isValid) {
      throw new ApiError(validation.error || 'Media validation rejected.', 400, 'VALIDATION_FAILED');
    }

    const requestId = generateRequestId();

    // Simulate chunked upload progress
    for (let p = 10; p <= 90; p += 25) {
      if (signal?.aborted) {
        throw new ApiError('Upload cancelled by user.', 499, 'UPLOAD_ABORTED');
      }
      await simulateLatency(120);
      onProgress?.(p);
    }

    if (signal?.aborted) {
      throw new ApiError('Upload cancelled by user.', 499, 'UPLOAD_ABORTED');
    }

    onProgress?.(100);
    await simulateLatency(150);

    // Compute mock SHA-256 hash
    const mockHash = Array.from(new Uint8Array(32))
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');

    const mediaType = validation.detectedType || 'image';

    const asset: MediaAsset = {
      id: 'asset_' + requestId,
      name: validation.sanitizedName || file.name,
      type: mediaType,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      url: URL.createObjectURL(file),
      hashSha256: mockHash,
      uploadedAt: new Date().toISOString(),
      dimensions: mediaType === 'image' || mediaType === 'video' ? { width: 1920, height: 1080 } : undefined,
      durationSeconds: mediaType === 'video' ? 32.5 : mediaType === 'audio' ? 45.0 : undefined,
    };

    return {
      success: true,
      asset,
      jobId: 'job_' + requestId,
      preFlightValidation: {
        passed: true,
        c2paDetected: Math.random() > 0.6,
        audioStreamPresent: mediaType === 'video' || mediaType === 'audio',
        queuedDetectors: 10,
        containerIntegrity: 'VALID',
      },
    };
  },

  /**
   * Ingests a remote media URL.
   */
  async ingestUrl(url: string, signal?: AbortSignal): Promise<UploadResponse> {
    const validation = validateMediaUrl(url);
    if (!validation.isValid) {
      throw new ApiError(validation.error || 'Invalid URL target.', 400, 'INVALID_URL');
    }

    await simulateLatency(500);

    if (signal?.aborted) {
      throw new ApiError('URL ingestion cancelled.', 499, 'INGESTION_ABORTED');
    }

    const requestId = generateRequestId();
    const isVideo = url.includes('.mp4') || url.includes('video') || url.includes('wire');
    const isAudio = url.includes('.mp3') || url.includes('.wav') || url.includes('audio');

    const asset: MediaAsset = {
      id: 'asset_url_' + requestId,
      name: url.split('/').pop() || 'remote_media_stream',
      type: isVideo ? 'video' : isAudio ? 'audio' : 'image',
      size: 14200000,
      mimeType: isVideo ? 'video/mp4' : isAudio ? 'audio/mpeg' : 'image/jpeg',
      url,
      hashSha256: '9f83a01b92c4e' + Math.random().toString(16).slice(2, 10),
      uploadedAt: new Date().toISOString(),
      dimensions: isVideo || !isAudio ? { width: 1920, height: 1080 } : undefined,
    };

    return {
      success: true,
      asset,
      jobId: 'job_' + requestId,
      preFlightValidation: {
        passed: true,
        c2paDetected: false,
        audioStreamPresent: isVideo || isAudio,
        queuedDetectors: 10,
        containerIntegrity: 'VALID',
      },
    };
  },
};
