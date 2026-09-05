/**
 * Detection Provider Interface
 *
 * All forensic analysis providers implement this interface.
 * This abstraction ensures:
 * - No provider-specific logic leaks into the pipeline
 * - Providers are swappable without changing orchestration code
 * - Each provider declares what media types it supports
 * - Failures are contained and produce structured results
 */

import type { MediaType, DetectionSignal, MetadataRecord } from '../../../src/types';

export interface MediaInput {
  /** Blob URL for fetching media content */
  url: string;
  /** Media type */
  mediaType: MediaType;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  sizeBytes: number;
  /** SHA-256 hash */
  sha256: string;
}

export type SignalStatus = 'NORMAL' | 'ANOMALOUS' | 'CRITICAL' | 'INCONCLUSIVE';
export type SignalCategory = 'OPTICAL' | 'ACOUSTIC' | 'METADATA' | 'PROVENANCE' | 'TEMPORAL' | 'CONTAINER';

export interface ProviderSignal {
  key: string; // Unique signal identifier within this provider
  name: string;
  category: SignalCategory;
  score: number; // 0–100 (anomaly score)
  confidence: number; // 0–100 (confidence in the score)
  status: SignalStatus;
  weight: number; // Provider contribution weight 0–1
  primaryFinding: string;
  technicalDetails: string;
  modelVersion: string;
}

export interface ProviderResult {
  providerName: string;
  providerVersion: string;
  signals: ProviderSignal[];
  metadata?: MetadataRecord[];
  durationMs: number;
  /** Whether this result is from demo/mock data */
  isDemoData: boolean;
  /** Signals that were attempted but unavailable */
  unavailableSignals?: string[];
}

export interface DetectionProvider {
  readonly name: string;
  readonly version: string;
  readonly supportedTypes: readonly MediaType[];

  /**
   * Runs analysis on the media input.
   * Should never throw — return inconclusive signals on failure.
   */
  analyze(input: MediaInput): Promise<ProviderResult>;
}
