/**
 * Source Provenance & Reverse Lookup API
 */

import { SourceMatch, TimelineEvent } from '../types';
import { simulateLatency } from './client';
import { BENCHMARK_CASES } from '../mock/mockDatabase';

export const sourceApi = {
  /**
   * Performs automated reverse search to reconstruct origin timeline & find earliest appearances.
   */
  async getSourcesForAsset(jobId: string): Promise<SourceMatch[]> {
    await simulateLatency(300);
    const benchmark = BENCHMARK_CASES[jobId];
    if (benchmark) {
      return benchmark.sources;
    }
    return BENCHMARK_CASES['case-4891'].sources;
  },

  /**
   * Retrieves chronological event graph for a media asset.
   */
  async getTimelineForAsset(jobId: string): Promise<TimelineEvent[]> {
    await simulateLatency(250);
    const benchmark = BENCHMARK_CASES[jobId];
    if (benchmark) {
      return benchmark.timeline;
    }
    return BENCHMARK_CASES['case-4891'].timeline;
  },
};
