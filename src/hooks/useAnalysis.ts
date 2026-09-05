/**
 * useAnalysis Hook
 * Orchestrates analysis job creation, polling progress, error recovery, and cancellation.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnalysisJob, AnalysisResult, MediaAsset } from '../types';
import { analysisApi } from '../api/analysisApi';

export interface UseAnalysisReturn {
  job: AnalysisJob | null;
  result: AnalysisResult | null;
  isLoading: boolean;
  isPolling: boolean;
  error: string | null;
  startAnalysis: (asset: MediaAsset, specificCaseId?: string) => Promise<void>;
  cancelAnalysis: () => Promise<void>;
  retryAnalysis: () => Promise<void>;
  reset: () => void;
}

export function useAnalysis(initialJobId?: string): UseAnalysisReturn {
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const lastAssetRef = useRef<MediaAsset | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const pollJobStatus = useCallback(
    async (jobId: string) => {
      try {
        const updatedJob = await analysisApi.getJobStatus(jobId);
        setJob(updatedJob);

        if (updatedJob.status === 'COMPLETED' && updatedJob.result) {
          setResult(updatedJob.result);
          stopPolling();
          setIsLoading(false);
        } else if (updatedJob.status === 'FAILED' || updatedJob.status === 'CANCELLED') {
          setError(updatedJob.error || 'Forensic analysis was aborted.');
          stopPolling();
          setIsLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Telemetry polling error.');
        stopPolling();
        setIsLoading(false);
      }
    },
    [stopPolling]
  );

  const startAnalysis = useCallback(
    async (asset: MediaAsset, specificCaseId?: string) => {
      stopPolling();
      setIsLoading(true);
      setError(null);
      setResult(null);
      lastAssetRef.current = asset;

      try {
        const newJob = await analysisApi.createJob(asset, specificCaseId);
        setJob(newJob);

        // Immediate check if it's already a completed benchmark case
        if (specificCaseId && (specificCaseId.startsWith('case-') || specificCaseId === 'case-4891' || specificCaseId === 'case-4892' || specificCaseId === 'case-4893')) {
          const completed = await analysisApi.getJobStatus(specificCaseId);
          setJob(completed);
          if (completed.result) {
            setResult(completed.result);
            setIsLoading(false);
            return;
          }
        }

        setIsPolling(true);
        pollingTimerRef.current = setInterval(() => {
          pollJobStatus(newJob.id);
        }, 1200);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initiate analysis job.');
        setIsLoading(false);
      }
    },
    [pollJobStatus, stopPolling]
  );

  const cancelAnalysis = useCallback(async () => {
    if (job) {
      try {
        await analysisApi.cancelJob(job.id);
      } finally {
        stopPolling();
        setIsLoading(false);
        setJob((prev) => (prev ? { ...prev, status: 'CANCELLED', currentStage: 'Job cancelled by operator.' } : null));
      }
    }
  }, [job, stopPolling]);

  const retryAnalysis = useCallback(async () => {
    if (lastAssetRef.current) {
      await startAnalysis(lastAssetRef.current);
    }
  }, [startAnalysis]);

  const reset = useCallback(() => {
    stopPolling();
    setJob(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, [stopPolling]);

  // Handle initialJobId if passed
  useEffect(() => {
    if (initialJobId) {
      setIsLoading(true);
      analysisApi
        .getJobStatus(initialJobId)
        .then((j) => {
          setJob(j);
          if (j.result) {
            setResult(j.result);
            setIsLoading(false);
          } else if (j.status !== 'COMPLETED' && j.status !== 'FAILED' && j.status !== 'CANCELLED') {
            setIsPolling(true);
            pollingTimerRef.current = setInterval(() => {
              pollJobStatus(j.id);
            }, 1200);
          }
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : 'Failed to load initial job');
          setIsLoading(false);
        });
    }

    return () => {
      stopPolling();
    };
  }, [initialJobId, pollJobStatus, stopPolling]);

  return {
    job,
    result,
    isLoading,
    isPolling,
    error,
    startAnalysis,
    cancelAnalysis,
    retryAnalysis,
    reset,
  };
}
