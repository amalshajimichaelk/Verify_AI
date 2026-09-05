/**
 * Evidence Aggregation Engine
 *
 * This is the core forensic reasoning module.
 * It aggregates signals from multiple providers into a calibrated assessment.
 *
 * Design principles:
 * - No single signal determines the classification
 * - Weights are configurable
 * - Uncertainty is explicitly calculated and communicated
 * - Never claim 100% certainty
 * - Coverage ratio is always reported (honest about gaps)
 * - Classification result is driven by forensic math, NOT an LLM
 */

import type {
  ClassificationType,
  DetectionSignal,
  EvidenceStrength,
  MetadataRecord,
} from '../../../src/types';
import type { ProviderSignal } from '../providers/interface';

export interface CalibratedAssessment {
  classification: ClassificationType;
  calibratedConfidence: number; // 0–100 (never 100 or 0)
  confidenceRange: [number, number];
  evidenceStrength: EvidenceStrength;
  coverageRatio: { active: number; total: number };
  uncertaintyExplanation: string;
  summaryRationale: string;
  isDemoData: boolean;
}

/** Convert provider signals to DetectionSignal domain type */
export function toDetectionSignals(providerSignals: ProviderSignal[]): DetectionSignal[] {
  return providerSignals.map((s) => ({
    id: `sig_${s.key}_${Date.now().toString(36)}`,
    name: s.name,
    category: s.category,
    score: s.score,
    confidence: s.confidence,
    status: s.status,
    weight: s.weight,
    primaryFinding: s.primaryFinding,
    technicalDetails: s.technicalDetails,
    modelVersion: s.modelVersion,
  }));
}

/**
 * Calculates a calibrated forensic assessment from aggregated signals.
 *
 * Algorithm:
 * 1. Compute weighted anomaly score across all active signals
 * 2. Apply C2PA validity bonus (strong provenance reduces anomaly threshold)
 * 3. Classify based on normalized score thresholds
 * 4. Calculate confidence bounds based on coverage and agreement
 * 5. Generate uncertainty explanation
 */
export function calculateCalibratedAssessment(
  signals: DetectionSignal[],
  metadata: MetadataRecord[],
  c2paValid: boolean,
  isDemoData = false
): CalibratedAssessment {
  const total = signals.length;
  const active = signals.filter((s) => s.status !== 'INCONCLUSIVE').length;
  const coverageRatio = { active, total };

  if (total === 0) {
    return {
      classification: 'INCONCLUSIVE',
      calibratedConfidence: 50,
      confidenceRange: [40, 60],
      evidenceStrength: 'INSUFFICIENT',
      coverageRatio,
      uncertaintyExplanation:
        'No forensic signals were available. Insufficient data to assess this media.',
      summaryRationale: 'No signals available for assessment.',
      isDemoData,
    };
  }

  // ── Weighted anomaly score ──
  let weightedAnomalySum = 0;
  let totalWeight = 0;
  let criticalCount = 0;
  let anomalousCount = 0;

  signals.forEach((s) => {
    if (s.status !== 'INCONCLUSIVE') {
      weightedAnomalySum += (s.score / 100) * s.weight;
      totalWeight += s.weight;
      if (s.status === 'CRITICAL') criticalCount++;
      if (s.status === 'ANOMALOUS') anomalousCount++;
    }
  });

  const normalizedAnomalyScore =
    totalWeight > 0 ? (weightedAnomalySum / totalWeight) * 100 : 50;

  // ── Classification ──
  let classification: ClassificationType;
  let rawConfidence: number;

  if (c2paValid && normalizedAnomalyScore < 20) {
    classification = 'LIKELY_AUTHENTIC';
    rawConfidence = 92 + Math.min(6, (100 - normalizedAnomalyScore) * 0.05);
  } else if (normalizedAnomalyScore >= 80 && criticalCount >= 2) {
    classification = 'LIKELY_AI_GENERATED';
    rawConfidence = Math.min(94, 75 + (normalizedAnomalyScore - 80) * 0.95);
  } else if (normalizedAnomalyScore >= 55 || (criticalCount >= 1 && anomalousCount >= 2)) {
    classification = 'POTENTIAL_MANIPULATION';
    rawConfidence = Math.min(86, 65 + (normalizedAnomalyScore - 55) * 0.7);
  } else if (normalizedAnomalyScore <= 30 && active >= 5) {
    classification = 'LIKELY_AUTHENTIC';
    rawConfidence = Math.min(94, 70 + (30 - normalizedAnomalyScore) * 0.8);
  } else {
    classification = 'INCONCLUSIVE';
    rawConfidence = 52;
  }

  // Guard against absolute certainty — calibrated forensics never claim 100%
  const calibratedConfidence = Math.min(98, Math.max(50, Math.round(rawConfidence)));

  // Coverage-dependent margin
  const margin = Math.max(4, Math.round(12 - (active / Math.max(1, total)) * 7));
  const confidenceRange: [number, number] = [
    Math.max(40, calibratedConfidence - margin),
    Math.min(99, calibratedConfidence + margin),
  ];

  // ── Evidence strength ──
  let evidenceStrength: EvidenceStrength;
  if (active >= 8 && (calibratedConfidence >= 85 || c2paValid)) {
    evidenceStrength = 'HIGH';
  } else if (active >= 5 && calibratedConfidence >= 65) {
    evidenceStrength = 'MODERATE';
  } else if (active >= 3) {
    evidenceStrength = 'LOW';
  } else {
    evidenceStrength = 'INSUFFICIENT';
  }

  // ── Uncertainty explanation ──
  let uncertaintyExplanation: string;
  switch (classification) {
    case 'LIKELY_AI_GENERATED':
      uncertaintyExplanation = `Evaluation yields an estimated ${calibratedConfidence}% probability of synthetic generation across ${active}/${total} signal families (±${margin}% margin). ${criticalCount} critical anomalies and ${anomalousCount} secondary anomalies were identified. Automated signals do not substitute for human provenance review.`;
      break;
    case 'POTENTIAL_MANIPULATION':
      uncertaintyExplanation = `Discrepancies in ${active}/${total} forensic signals indicate possible post-capture alteration. Estimated confidence: ${confidenceRange[0]}–${confidenceRange[1]}%. Source context is necessary to determine manipulation intent.`;
      break;
    case 'LIKELY_AUTHENTIC':
      uncertaintyExplanation = `Physical optical parameters align with authentic capture characteristics (${calibratedConfidence}% evaluated alignment across ${active}/${total} signals). ${c2paValid ? 'C2PA cryptographic provenance is valid. ' : ''}Note: Sophisticated processing can obscure manipulations from automated analysis.`;
      break;
    case 'INCONCLUSIVE':
    default:
      uncertaintyExplanation = `Signal coverage (${active}/${total}) and data quality are insufficient for reliable classification. Additional uncompressed source material or cryptographic provenance manifests would improve assessment fidelity.`;
      break;
  }

  const summaryRationale =
    classification === 'LIKELY_AI_GENERATED'
      ? `${criticalCount} critical spectral and structural anomalies are characteristic of generative synthesis.`
      : classification === 'POTENTIAL_MANIPULATION'
        ? 'Localized inconsistencies and temporal desynchronization suggest targeted post-capture editing.'
        : classification === 'LIKELY_AUTHENTIC'
          ? 'Physical sensor characteristics and optical consistency match natural camera capture parameters.'
          : 'Conflicting or low-coverage signals prevent reliable automated classification.';

  return {
    classification,
    calibratedConfidence,
    confidenceRange,
    evidenceStrength,
    coverageRatio,
    uncertaintyExplanation,
    summaryRationale,
    isDemoData,
  };
}
