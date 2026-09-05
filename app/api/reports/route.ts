/**
 * GET /api/reports — list user's reports
 * POST /api/reports — generate a new report
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, created, fromError, generateRequestId } from '../../../lib/api/response';
import { getRequiredSession } from '../../../lib/auth/session';
import { checkRateLimit } from '../../../lib/security/rateLimit';
import { Errors } from '../../../lib/errors';
import { INITIAL_REPORTS } from '../../../src/mock/mockDatabase';
import type { VerificationReport, AnalysisResult } from '../../../src/types';

const GenerateReportSchema = z.object({
  analysisResult: z.object({
    jobId: z.string(),
    classification: z.string(),
    calibratedConfidence: z.number(),
    primaryFinding: z.string(),
    summaryRationale: z.string(),
    signals: z.array(z.object({ name: z.string(), primaryFinding: z.string() })),
    asset: z.object({ name: z.string(), hashSha256: z.string() }),
    c2paValidation: z.object({ isValid: z.boolean() }).optional(),
  }),
  analystName: z.string().max(255).default('Analyst'),
  analystOrganization: z.string().max(255).default('VerifyAI'),
  analystNotes: z.string().max(5000).default(''),
});

export async function GET(_req: NextRequest) {
  const requestId = generateRequestId();
  try {
    const session = await getRequiredSession();

    if (!process.env.DATABASE_URL) {
      return ok({ reports: INITIAL_REPORTS, isDemoMode: true }, requestId);
    }

    const { db } = await import('../../../lib/db/client');
    const { reports } = await import('../../../lib/db/schema');
    const { eq, desc } = await import('drizzle-orm');

    const rows = await db
      .select()
      .from(reports)
      .where(eq(reports.userId, session.userId))
      .orderBy(desc(reports.createdAt));

    const result: VerificationReport[] = rows.map((r) => ({
      id: r.id,
      caseNumber: r.caseNumber,
      title: r.title,
      classification: r.classification as VerificationReport['classification'],
      confidence: r.confidence,
      summary: r.summary,
      keyFindings: (r.keyFindings as string[]) ?? [],
      analystNotes: r.analystNotes ?? '',
      analystName: r.analystName,
      analystOrganization: r.analystOrganization,
      createdAt: r.createdAt.toISOString(),
      sha256Hash: r.sha256Hash,
      c2paValid: r.c2paValid,
      jsonLdExport: r.jsonLdExport,
    }));

    return ok({ reports: result, isDemoMode: false }, requestId);
  } catch (err) {
    return fromError(err, requestId);
  }
}

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  try {
    const session = await getRequiredSession();
    await checkRateLimit('reportGenerate', session.userId);

    const body = await req.json();
    const parsed = GenerateReportSchema.safeParse(body);

    if (!parsed.success) {
      throw Errors.invalidInput(parsed.error.message);
    }

    const { analysisResult, analystName, analystOrganization, analystNotes } = parsed.data;

    const reportId = `rep_${Date.now().toString(36)}`;
    const caseNumber = `CASE-${Math.floor(1000 + Math.random() * 9000)}`;

    const keyFindings = analysisResult.signals
      .slice(0, 4)
      .map((s: { name: string; primaryFinding: string }) => `${s.name}: ${s.primaryFinding}`);

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
          name: `${analystOrganization} via VerifyAI Forensic Engine`,
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

    if (!process.env.DATABASE_URL) {
      const mockReport: VerificationReport = {
        id: reportId,
        caseNumber,
        title: `Forensic Verification Dossier: ${analysisResult.asset.name}`,
        classification: analysisResult.classification as VerificationReport['classification'],
        confidence: analysisResult.calibratedConfidence,
        summary: analysisResult.summaryRationale,
        keyFindings,
        analystNotes: analystNotes || 'Evaluated per IEEE Media Forensics standards.',
        analystName,
        analystOrganization,
        createdAt: new Date().toISOString(),
        sha256Hash: analysisResult.asset.hashSha256,
        c2paValid: analysisResult.c2paValidation?.isValid ?? false,
        jsonLdExport,
      };
      return created({ report: mockReport, isDemoMode: true }, requestId);
    }

    const { db } = await import('../../../lib/db/client');
    const { reports } = await import('../../../lib/db/schema');

    const [report] = await db
      .insert(reports)
      .values({
        userId: session.userId,
        caseNumber,
        title: `Forensic Verification Dossier: ${analysisResult.asset.name}`,
        classification: analysisResult.classification as never,
        confidence: analysisResult.calibratedConfidence,
        summary: analysisResult.summaryRationale,
        keyFindings: keyFindings as never,
        analystNotes: analystNotes || 'Evaluated per IEEE Media Forensics standards.',
        analystName,
        analystOrganization,
        sha256Hash: analysisResult.asset.hashSha256,
        c2paValid: analysisResult.c2paValidation?.isValid ?? false,
        jsonLdExport,
      })
      .returning();

    const result: VerificationReport = {
      id: report.id,
      caseNumber: report.caseNumber,
      title: report.title,
      classification: report.classification as VerificationReport['classification'],
      confidence: report.confidence,
      summary: report.summary,
      keyFindings: (report.keyFindings as string[]) ?? [],
      analystNotes: report.analystNotes ?? '',
      analystName: report.analystName,
      analystOrganization: report.analystOrganization,
      createdAt: report.createdAt.toISOString(),
      sha256Hash: report.sha256Hash,
      c2paValid: report.c2paValid,
      jsonLdExport: report.jsonLdExport,
    };

    return created({ report: result, isDemoMode: false }, requestId);
  } catch (err) {
    return fromError(err, requestId);
  }
}
