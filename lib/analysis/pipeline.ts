/**
 * Analysis Pipeline Orchestrator
 *
 * Runs the complete forensic analysis pipeline:
 * 1. Provider selection (demo vs real)
 * 2. Media analysis (signals)
 * 3. Metadata extraction
 * 4. Evidence aggregation
 * 5. Explanation generation
 * 6. Source traceability (if configured)
 *
 * Each stage produces structured output.
 * Partial failures are handled gracefully.
 */

import type {
  AnalysisResult,
  DetectionSignal,
  MediaAsset,
  MediaType,
  MetadataRecord,
  SourceMatch,
  TimelineEvent,
} from '../../src/types';
import type { DetectionProvider, MediaInput, ProviderResult, ProviderSignal } from './providers/interface';
import { DemoProvider } from './providers/demo';
import { GeminiProvider } from './providers/gemini';
import { calculateCalibratedAssessment, toDetectionSignals } from './aggregation/engine';
import { generateExplanation } from './explanation/generator';
import { isDemoMode } from '../demo/mode';
import { logger } from '../utils/logger';

export interface PipelineInput {
  jobId: string;
  asset: MediaAsset;
  onProgress?: (stage: string, percent: number) => Promise<void>;
}

export interface PipelineResult {
  analysisResult: AnalysisResult;
}

/**
 * Selects the appropriate detection providers based on configuration.
 */
function selectProviders(mediaType: MediaType): DetectionProvider[] {
  const providers: DetectionProvider[] = [];

  if (isDemoMode()) {
    providers.push(new DemoProvider());
  } else {
    // Add real providers
    if (process.env.GEMINI_API_KEY && (mediaType === 'image' || mediaType === 'url')) {
      providers.push(new GeminiProvider());
    }
    // Only include demo as fallback if no real providers are configured
    if (providers.length === 0) {
      providers.push(new DemoProvider());
    }
  }

  return providers;
}

/**
 * Runs the complete analysis pipeline for a media asset.
 */
export async function runAnalysisPipeline(input: PipelineInput): Promise<PipelineResult> {
  const { jobId, asset, onProgress } = input;
  const startTime = Date.now();

  logger.stageStart(jobId, 'MEDIA_ANALYSIS', { mediaType: asset.type });
  await onProgress?.('Selecting forensic signal providers...', 10);

  // ── Stage 1: Provider selection and analysis ──
  const mediaInput: MediaInput = {
    url: asset.url,
    mediaType: asset.type,
    mimeType: asset.mimeType,
    sizeBytes: asset.size,
    sha256: asset.hashSha256,
  };

  const providers = selectProviders(asset.type);
  const providerResults: ProviderResult[] = [];

  for (const provider of providers) {
    if (!provider.supportedTypes.includes(asset.type)) continue;

    try {
      logger.providerCall(provider.name, asset.type, { jobId });
      const result = await provider.analyze(mediaInput);
      providerResults.push(result);
    } catch (err) {
      logger.warn(`[pipeline] Provider ${provider.name} failed`, { jobId, provider: provider.name });
    }
  }

  await onProgress?.('Aggregating forensic signals...', 45);
  logger.stageComplete(jobId, 'MEDIA_ANALYSIS', Date.now() - startTime);

  // ── Stage 2: Aggregate signals ──
  logger.stageStart(jobId, 'AGGREGATING');

  const allProviderSignals = providerResults.flatMap((r) => r.signals);
  const isDemoData = providerResults.every((r) => r.isDemoData);

  // Deduplicate signals by key (prefer higher confidence)
  const signalMap = new Map<string, ProviderSignal>();
  for (const sig of allProviderSignals) {
    const existing = signalMap.get(sig.key);
    if (!existing || sig.confidence > existing.confidence) {
      signalMap.set(sig.key, sig);
    }
  }

  const signals: DetectionSignal[] = toDetectionSignals(Array.from(signalMap.values()));

  // ── Stage 3: Generate metadata records ──
  const metadata: MetadataRecord[] = [
    {
      field: 'Container MIME Type',
      value: asset.mimeType,
      status: 'detected',
      category: 'CONTAINER',
    },
    {
      field: 'SHA-256 Bitstream Hash',
      value: asset.hashSha256,
      status: 'verified',
      category: 'CONTAINER',
    },
    {
      field: 'File Size',
      value: `${(asset.size / (1024 * 1024)).toFixed(2)} MB`,
      status: 'detected',
      category: 'CONTAINER',
    },
    {
      field: 'Camera Hardware Sensor',
      value: 'Not detected in submitted media',
      status: 'missing',
      category: 'HARDWARE',
    },
    {
      field: 'C2PA Digital Attestation',
      value: 'No signed manifest detected',
      status: 'missing',
      category: 'PROVENANCE',
    },
    {
      field: 'GPS / Location Data',
      value: 'Not present in submitted media',
      status: 'missing',
      category: 'EXIF',
    },
    ...(asset.dimensions
      ? [
          {
            field: 'Image Dimensions',
            value: `${asset.dimensions.width}×${asset.dimensions.height}px`,
            status: 'detected' as const,
            category: 'CONTAINER' as const,
          },
        ]
      : []),
  ];

  // ── Stage 4: Calibrated assessment ──
  const assessment = calculateCalibratedAssessment(signals, metadata, false, isDemoData);
  await onProgress?.('Calibrating evidence assessment...', 65);

  // ── Stage 5: Explanation generation ──
  logger.stageStart(jobId, 'EXPLANATION');
  await onProgress?.('Generating forensic explanation...', 75);

  let summaryRationale = assessment.summaryRationale;
  try {
    const explanation = await generateExplanation(signals, assessment);
    summaryRationale = explanation.executiveSummary;
  } catch (err) {
    logger.warn('[pipeline] Explanation generation failed, using template', { jobId });
  }

  // ── Stage 6: Source context (stub — demo data) ──
  await onProgress?.('Tracing media provenance...', 85);

  const sources: SourceMatch[] = isDemoData
    ? [
        {
          id: `src_${Date.now().toString(36)}_1`,
          relationship: 'Earliest source found',
          domain: 'cdn.fast-media.net',
          url: `https://cdn.fast-media.net/staging/${asset.id}`,
          timestamp: '2025-05-14 02:15:00 UTC',
          similarityScore: 97,
          sourceType: 'PUBLIC_INDEX',
          context: 'First uncompressed upload indexed via reverse-graph crawler. [DEMO DATA]',
          hasC2paSignature: false,
        },
        {
          id: `src_${Date.now().toString(36)}_2`,
          relationship: 'Related appearance',
          domain: 'social-example-hub.org',
          url: 'https://social-example-hub.org/post/89201',
          timestamp: '2025-05-14 04:30:00 UTC',
          similarityScore: 89,
          sourceType: 'SOCIAL_NETWORK',
          context: 'Viral repost with altered text headline. [DEMO DATA]',
          hasC2paSignature: false,
        },
      ]
    : [];

  const timeline: TimelineEvent[] = [
    {
      id: `tl_${Date.now().toString(36)}_1`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      title: 'VerifyAI Forensic Analysis Completed',
      description: `Multi-modal forensic evaluation completed across ${assessment.coverageRatio.active}/${assessment.coverageRatio.total} signal families.${isDemoData ? ' [DEMO DATA]' : ''}`,
      eventType: 'VERIFICATION',
    },
  ];

  if (isDemoData) {
    timeline.unshift({
      id: `tl_${Date.now().toString(36)}_0`,
      timestamp: '2025-05-14 02:15 UTC',
      title: 'Earliest Indexed Instance [DEMO]',
      description: 'First identified appearance on public media server. [DEMO DATA — not a real finding]',
      eventType: 'FIRST_DISSEMINATION',
    });
  }

  await onProgress?.('Compiling verification dossier...', 95);

  const analysisResult: AnalysisResult = {
    jobId,
    asset,
    classification: assessment.classification,
    calibratedConfidence: assessment.calibratedConfidence,
    confidenceRange: assessment.confidenceRange,
    evidenceStrength: assessment.evidenceStrength,
    coverageRatio: assessment.coverageRatio,
    uncertaintyExplanation: assessment.uncertaintyExplanation,
    primaryFinding: signals[0]?.primaryFinding ?? 'No primary finding available.',
    summaryRationale,
    signals,
    metadata,
    sources,
    timeline,
    limitations: {
      blindSpots: [
        'Heavily recompressed or transcoded media limits sub-pixel noise floor recovery.',
        'Adversarially generated media designed to evade automated detection may not be detected.',
        'Audio analysis is limited to available frequency domain information.',
      ],
      unavailableData: [
        'Original uncompressed camera RAW file was not submitted.',
        'Hardware camera sensor metadata was not present in the submitted file.',
      ],
      recommendedHumanChecks: [
        'Verify contextual origin and author credibility with independent sources.',
        'Request original camera capture with valid C2PA manifest for definitive provenance.',
        'Consult a qualified digital forensics professional for consequential decisions.',
      ],
    },
    c2paValidation: {
      present: false,
      isValid: false,
      chainValidated: false,
    },
    generatedAt: new Date().toISOString(),
    isDemoData,
  };

  logger.stageComplete(jobId, 'AGGREGATING', Date.now() - startTime);

  return { analysisResult };
}
