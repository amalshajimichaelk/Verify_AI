/**
 * Historical Case Registry & Verification History API
 */

import { AnalysisResult } from '../types';
import { simulateLatency } from './client';
import { BENCHMARK_CASES } from '../mock/mockDatabase';

export interface HistoryFilter {
  query?: string;
  classification?: string;
  mediaType?: string;
  page?: number;
  pageSize?: number;
}

export interface HistoryResponse {
  items: AnalysisResult[];
  total: number;
  page: number;
  totalPages: number;
}

export const historyApi = {
  /**
   * Retrieves past verification records with filtering and pagination.
   */
  async getHistory(filters: HistoryFilter = {}): Promise<HistoryResponse> {
    await simulateLatency(250);

    let all = Object.values(BENCHMARK_CASES);

    if (filters.classification && filters.classification !== 'ALL') {
      all = all.filter((c) => c.classification === filters.classification);
    }

    if (filters.mediaType && filters.mediaType !== 'ALL') {
      all = all.filter((c) => c.asset.type === filters.mediaType);
    }

    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      all = all.filter(
        (c) =>
          c.asset.name.toLowerCase().includes(q) ||
          c.primaryFinding.toLowerCase().includes(q) ||
          c.jobId.toLowerCase().includes(q)
      );
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);

    return {
      items,
      total: all.length,
      page,
      totalPages: Math.max(1, Math.ceil(all.length / pageSize)),
    };
  },
};
