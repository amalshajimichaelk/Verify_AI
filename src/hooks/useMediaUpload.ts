/**
 * useMediaUpload Hook
 * Manages media selection, drag-and-drop, client-side validation, progress tracking, and aborts.
 */

import React, { useState, useCallback, useRef } from 'react';
import { MediaAsset, UploadResponse } from '../types';
import { mediaApi } from '../api/mediaApi';
import { validateMediaFile, validateMediaUrl } from '../validation/mediaValidation';

export interface UseMediaUploadReturn {
  isDragging: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  uploadedAsset: MediaAsset | null;
  preFlightValidation: UploadResponse['preFlightValidation'] | null;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => Promise<void>;
  selectFile: (file: File) => Promise<void>;
  submitUrl: (url: string) => Promise<void>;
  cancelUpload: () => void;
  retryUpload: () => Promise<void>;
  clearMedia: () => void;
  stageSampleMedia: (sample: MediaAsset) => void;
}

export function useMediaUpload(onUploadSuccess?: (res: UploadResponse) => void): UseMediaUploadReturn {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedAsset, setUploadedAsset] = useState<MediaAsset | null>(null);
  const [preFlightValidation, setPreFlightValidation] = useState<UploadResponse['preFlightValidation'] | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFileRef = useRef<File | null>(null);
  const lastUrlRef = useRef<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
    setError('Upload cancelled by user.');
  }, []);

  const selectFile = useCallback(
    async (file: File) => {
      setError(null);
      const validation = validateMediaFile(file);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file.');
        return;
      }

      lastFileRef.current = file;
      lastUrlRef.current = null;
      setIsUploading(true);
      setUploadProgress(5);
      abortControllerRef.current = new AbortController();

      try {
        const response = await mediaApi.uploadMedia(
          file,
          (progress) => setUploadProgress(progress),
          abortControllerRef.current.signal
        );

        setUploadedAsset(response.asset);
        setPreFlightValidation(response.preFlightValidation);
        setIsUploading(false);
        setUploadProgress(100);
        onUploadSuccess?.(response);
      } catch (err) {
        setIsUploading(false);
        setError(err instanceof Error ? err.message : 'Media upload failed.');
      }
    },
    [onUploadSuccess]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        await selectFile(file);
      }
    },
    [selectFile]
  );

  const submitUrl = useCallback(
    async (url: string) => {
      setError(null);
      const validation = validateMediaUrl(url);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid URL target.');
        return;
      }

      lastUrlRef.current = url;
      lastFileRef.current = null;
      setIsUploading(true);
      setUploadProgress(15);
      abortControllerRef.current = new AbortController();

      try {
        const response = await mediaApi.ingestUrl(url, abortControllerRef.current.signal);
        setUploadedAsset(response.asset);
        setPreFlightValidation(response.preFlightValidation);
        setIsUploading(false);
        setUploadProgress(100);
        onUploadSuccess?.(response);
      } catch (err) {
        setIsUploading(false);
        setError(err instanceof Error ? err.message : 'URL ingestion failed.');
      }
    },
    [onUploadSuccess]
  );

  const retryUpload = useCallback(async () => {
    if (lastFileRef.current) {
      await selectFile(lastFileRef.current);
    } else if (lastUrlRef.current) {
      await submitUrl(lastUrlRef.current);
    }
  }, [selectFile, submitUrl]);

  const clearMedia = useCallback(() => {
    cancelUpload();
    setUploadedAsset(null);
    setPreFlightValidation(null);
    setError(null);
    setUploadProgress(0);
  }, [cancelUpload]);

  const stageSampleMedia = useCallback((sample: MediaAsset) => {
    setUploadedAsset(sample);
    setPreFlightValidation({
      passed: true,
      c2paDetected: false,
      audioStreamPresent: sample.type === 'video' || sample.type === 'audio',
      queuedDetectors: 10,
      containerIntegrity: 'VALID',
    });
    setError(null);
  }, []);

  return {
    isDragging,
    isUploading,
    uploadProgress,
    error,
    uploadedAsset,
    preFlightValidation,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    selectFile,
    submitUrl,
    cancelUpload,
    retryUpload,
    clearMedia,
    stageSampleMedia,
  };
}
