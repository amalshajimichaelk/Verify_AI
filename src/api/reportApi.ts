/**
 * Report API Client
 *
 * Real HTTP client for /api/reports/*.
 */

import { VerificationReport, AnalysisResult } from '../types';
import { apiRequest, IS_DEMO_MODE, simulateLatency } from './client';
import { INITIAL_REPORTS } from '../mock/mockDatabase';

let demoReports: VerificationReport[] = [...INITIAL_REPORTS];

export const reportApi = {
  async listReports(): Promise<VerificationReport[]> {
    if (!IS_DEMO_MODE && typeof window !== 'undefined') {
      try {
        const data = await apiRequest<{ reports: VerificationReport[] }>('/api/reports');
        return data.reports;
      } catch (err) {
        console.warn('[reportApi] listReports failed, using demo', err);
      }
    }

    await simulateLatency(100);
    return [...demoReports];
  },

  async generateReport(
    analysisResult: AnalysisResult,
    analystOverride?: { name?: string; organization?: string; notes?: string }
  ): Promise<VerificationReport> {
    if (!IS_DEMO_MODE && typeof window !== 'undefined') {
      try {
        const result = await apiRequest<{ report: VerificationReport }>('/api/reports', {
          method: 'POST',
          body: JSON.stringify({
            analysisResult,
            analystName: analystOverride?.name ?? 'Lead Analyst',
            analystOrganization: analystOverride?.organization ?? 'VerifyAI',
            analystNotes: analystOverride?.notes ?? '',
          }),
        });
        return result.report;
      } catch (err) {
        console.warn('[reportApi] generateReport failed, using demo', err);
      }
    }

    await simulateLatency(300);

    const reportId = `rep_${Date.now().toString(36)}`;
    const caseNumber = `CASE-${Math.floor(1000 + Math.random() * 9000)}`;

    const keyFindings = analysisResult.signals
      .slice(0, 4)
      .map((s) => `${s.name}: ${s.primaryFinding}`);

    const jsonLdExport = JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'ClaimReview',
        claimReviewed: `Verification of media: ${analysisResult.asset.name}`,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: analysisResult.classification === 'LIKELY_AUTHENTIC' ? '5' : '2',
          bestRating: '5',
          alternateName: analysisResult.classification,
        },
        author: {
          '@type': 'Organization',
          name: `${analystOverride?.organization ?? 'VerifyAI'} via VerifyAI Forensic Engine`,
        },
        itemReviewed: {
          '@type': 'MediaObject',
          name: analysisResult.asset.name,
          sha256: analysisResult.asset.hashSha256,
        },
      },
      null,
      2
    );

    const report: VerificationReport = {
      id: reportId,
      caseNumber,
      title: `Forensic Verification Dossier: ${analysisResult.asset.name}`,
      classification: analysisResult.classification,
      confidence: analysisResult.calibratedConfidence,
      summary: analysisResult.summaryRationale,
      keyFindings,
      analystNotes:
        analystOverride?.notes || 'Evaluated per IEEE Media Forensics standards. [DEMO]',
      analystName: analystOverride?.name ?? 'Lead Analyst',
      analystOrganization: analystOverride?.organization ?? 'VerifyAI',
      createdAt: new Date().toISOString(),
      sha256Hash: analysisResult.asset.hashSha256,
      c2paValid: analysisResult.c2paValidation?.isValid ?? false,
      jsonLdExport,
    };

    demoReports.unshift(report);
    return report;
  },
};
