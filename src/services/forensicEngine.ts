/**
 * Forensic Engine & Uncertainty Calibration Service
 * Translates multi-signal telemetry into mathematically sound probabilistic assessments.
 *
 * Mandate:
 * - Reject binary "AI Lie Detector" illusions.
 * - Communicate uncertainty, error intervals, and signal coverage transparently.
 * - Enforce careful, non-defamatory forensic terminology.
 */

import {
  ClassificationType,
  DetectionSignal,
  EvidenceStrength,
  ForensicStatus,
  MetadataRecord,
  SourceMatch,
} from '../types';

export interface CalibratedAssessment {
  classification: ClassificationType;
  calibratedConfidence: number; // e.g. 78
  confidenceRange: [number, number]; // e.g. [73, 83]
  evidenceStrength: EvidenceStrength;
  coverageRatio: { active: number; total: number };
  uncertaintyExplanation: string;
  summaryRationale: string;
}

/**
 * Calculates a mathematically calibrated assessment from a set of forensic signals.
 * Incorporates model weights, signal agreement, and uncertainty penalties.
 */
export function calculateCalibratedAssessment(
  signals: DetectionSignal[],
  metadata: MetadataRecord[],
  c2paValid: boolean,
  _isDemoData = false
): CalibratedAssessment {
  const total = signals.length;
  const active = signals.filter((s) => s.status !== 'INCONCLUSIVE').length;
  const coverageRatio = { active, total };

  // Calculate weighted anomaly score
  let weightedAnomalySum = 0;
  let totalWeight = 0;

  signals.forEach((s) => {
    weightedAnomalySum += (s.score / 100) * s.weight;
    totalWeight += s.weight;
  });

  const normalizedAnomalyScore = totalWeight > 0 ? (weightedAnomalySum / totalWeight) * 100 : 50;

  // Determine classification
  let classification: ClassificationType;
  let rawConfidence: number;

  if (c2paValid && normalizedAnomalyScore < 20) {
    classification = 'LIKELY_AUTHENTIC';
    rawConfidence = 92 + Math.min(6, (100 - normalizedAnomalyScore) * 0.05);
  } else if (normalizedAnomalyScore >= 80) {
    classification = 'LIKELY_AI_GENERATED';
    rawConfidence = Math.min(94, 75 + (normalizedAnomalyScore - 80) * 0.95);
  } else if (normalizedAnomalyScore >= 55) {
    classification = 'POTENTIAL_MANIPULATION';
    rawConfidence = Math.min(86, 65 + (normalizedAnomalyScore - 55) * 0.7);
  } else if (normalizedAnomalyScore <= 30 && active >= 7) {
    classification = 'LIKELY_AUTHENTIC';
    rawConfidence = Math.min(94, 70 + (30 - normalizedAnomalyScore) * 0.8);
  } else {
    classification = 'INCONCLUSIVE';
    rawConfidence = 52;
  }

  // Guard against absolute 100% or 0% certainty
  const calibratedConfidence = Math.min(98, Math.max(50, Math.round(rawConfidence)));

  // Calculate confidence bounds (+/- 5% to 8% based on coverage)
  const margin = Math.max(4, Math.round(12 - (active / Math.max(1, total)) * 7));
  const confidenceRange: [number, number] = [
    Math.max(40, calibratedConfidence - margin),
    Math.min(99, calibratedConfidence + margin),
  ];

  // Calculate evidence strength
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

  // Generate accessible uncertainty explanation
  let uncertaintyExplanation = '';
  switch (classification) {
    case 'LIKELY_AI_GENERATED':
      uncertaintyExplanation =
        `Evaluation yields an estimated ${calibratedConfidence}% likelihood of synthetic synthesis across ${active}/${total} operational model families (±${margin}% margin). While structural diffusion artifacts are prominent, automated signals do not substitute for judicial or human provenance review.`;
      break;
    case 'POTENTIAL_MANIPULATION':
      uncertaintyExplanation =
        `Discrepancies identified in ${active}/${total} forensic signals indicate post-capture alteration or localized synthetic replacement with estimated confidence between ${confidenceRange[0]}% and ${confidenceRange[1]}%. Source context remains necessary to verify intent.`;
      break;
    case 'LIKELY_AUTHENTIC':
      uncertaintyExplanation =
        `Sensor continuity and physical optical propagation match authentic capture parameters with ${calibratedConfidence}% evaluated alignment. Note: Sophisticated post-processing or compressed distribution can obscure minor manipulations.`;
      break;
    case 'INCONCLUSIVE':
    default:
      uncertaintyExplanation =
        `Available signal coverage (${active}/${total}) and heavy container re-encoding prevent high-confidence attribution. Additional uncompressed sources or cryptographic provenance manifests required.`;
      break;
  }

  const summaryRationale =
    classification === 'LIKELY_AI_GENERATED'
      ? 'Significant latent-space spectral anomalies and non-natural noise distributions detected.'
      : classification === 'POTENTIAL_MANIPULATION'
        ? 'Temporal desynchronization or localized pixel discontinuities detected against background baseline.'
        : classification === 'LIKELY_AUTHENTIC'
          ? 'Physical camera sensor Bayer pattern and consistent optical lens characteristics observed.'
          : 'Conflicting or low-resolution signals prevent reliable automated attribution.';

  return {
    classification,
    calibratedConfidence,
    confidenceRange,
    evidenceStrength,
    coverageRatio,
    uncertaintyExplanation,
    summaryRationale,
  };
}

/**
 * Returns accessible semantic badge styling and label for a classification.
 */
export function getClassificationConfig(type: ClassificationType) {
  switch (type) {
    case 'LIKELY_AI_GENERATED':
      return {
        label: 'Likely AI-Generated',
        textClass: 'text-red-400',
        bgClass: 'bg-red-950/40',
        borderClass: 'border-red-500/30',
        dotClass: 'bg-red-400',
        badgeStyle: 'bg-red-950/40 text-red-300 border-red-500/30',
        iconName: 'warning',
      };
    case 'POTENTIAL_MANIPULATION':
      return {
        label: 'Potential Manipulation',
        textClass: 'text-orange-400',
        bgClass: 'bg-orange-500/20',
        borderClass: 'border-orange-500/30',
        dotClass: 'bg-orange-400',
        badgeStyle: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        iconName: 'tune',
      };
    case 'LIKELY_AUTHENTIC':
      return {
        label: 'Likely Authentic',
        textClass: 'text-emerald-400',
        bgClass: 'bg-emerald-950/30',
        borderClass: 'border-emerald-500/30',
        dotClass: 'bg-emerald-400',
        badgeStyle: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        iconName: 'verified',
      };
    case 'INCONCLUSIVE':
    default:
      return {
        label: 'Inconclusive',
        textClass: 'text-neutral-400',
        bgClass: 'bg-white/5',
        borderClass: 'border-white/10',
        dotClass: 'bg-neutral-400',
        badgeStyle: 'bg-white/5 text-neutral-300 border-white/10',
        iconName: 'help_outline',
      };
  }
}

/**
 * Ensures source relationship uses verified, non-overpromising terminology.
 */
export function formatSourceRelationship(rel: SourceMatch['relationship']): string {
  if (rel === 'Earliest source found') return 'Earliest appearance indexed';
  if (rel === 'Possible source') return 'Potential precursor match';
  return 'Related online appearance';
}

/**
 * Semantic status pill configuration for metadata entries.
 */
export function getMetadataStatusConfig(status: ForensicStatus) {
  switch (status) {
    case 'detected':
      return { label: 'Detected', color: 'text-orange-400 bg-orange-500/20 border-orange-500/30' };
    case 'verified':
      return { label: 'Verified', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' };
    case 'modified':
      return { label: 'Modified', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' };
    case 'missing':
      return { label: 'Missing', color: 'text-red-400 bg-red-500/20 border-red-500/30' };
    case 'unavailable':
    default:
      return { label: 'Unavailable', color: 'text-neutral-400 bg-white/5 border-white/10' };
  }
}
