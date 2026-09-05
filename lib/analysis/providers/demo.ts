/**
 * Demo Detection Provider
 *
 * Returns deterministic, structured forensic signals from BENCHMARK_CASES.
 * Used when:
 * - DEMO_MODE=true
 * - No real analysis providers are configured
 * - ENABLE_REAL_ANALYSIS !== 'true'
 *
 * NEVER disguises demo results as real analysis.
 * All results carry isDemoData: true.
 */

import type { DetectionProvider, MediaInput, ProviderResult, ProviderSignal } from './interface';
import type { MediaType } from '../../../src/types';

const IMAGE_SIGNALS: ProviderSignal[] = [
  {
    key: 'diffusion_spectral',
    name: 'GAN / Latent Diffusion Spectral Analysis',
    category: 'OPTICAL',
    score: 92,
    confidence: 94,
    status: 'CRITICAL',
    weight: 0.25,
    primaryFinding: 'Peak frequency attenuation at 16px tile boundary',
    technicalDetails: '2D-FFT reveals distinct grid pattern characteristic of U-Net decoder upsampling.',
    modelVersion: 'SpectraNet v4.2.0 [DEMO]',
  },
  {
    key: 'corneal_physics',
    name: 'Corneal Reflection Physics & Geometry',
    category: 'OPTICAL',
    score: 89,
    confidence: 91,
    status: 'CRITICAL',
    weight: 0.2,
    primaryFinding: 'Specular highlight mismatch between left and right iris',
    technicalDetails: '3D ray tracing indicates divergent light sources separated by 140° azimuth angle.',
    modelVersion: 'OcularPhys v2.1 [DEMO]',
  },
  {
    key: 'ela',
    name: 'Error Level Analysis (ELA)',
    category: 'OPTICAL',
    score: 84,
    confidence: 88,
    status: 'ANOMALOUS',
    weight: 0.15,
    primaryFinding: 'Hair perimeter error rates diverge from facial skin baseline by +42%',
    technicalDetails: 'Compression gradient inconsistency implies localized inpainting or generative refinement.',
    modelVersion: 'ELAForensics v3.1 [DEMO]',
  },
  {
    key: 'bayer_cfa',
    name: 'Bayer Color Filter Array (CFA) Inconsistency',
    category: 'METADATA',
    score: 95,
    confidence: 96,
    status: 'CRITICAL',
    weight: 0.15,
    primaryFinding: 'Total absence of demosaicing interpolation artifacts',
    technicalDetails: 'Direct pixel synthesis bypasses hardware sensor color filter array demosaicing steps.',
    modelVersion: 'SensorPhys v1.8 [DEMO]',
  },
  {
    key: 'facial_landmarks',
    name: 'Facial Landmark Symmetry & Micro-Texture',
    category: 'OPTICAL',
    score: 81,
    confidence: 85,
    status: 'ANOMALOUS',
    weight: 0.1,
    primaryFinding: 'Teeth boundary blur and ear cartilage deformation',
    technicalDetails: 'Ear anatomy deviates from anatomical ear antihelix cartographic norms.',
    modelVersion: 'FaceAnatomy v5.0 [DEMO]',
  },
  {
    key: 'c2pa',
    name: 'C2PA Cryptographic Provenance',
    category: 'PROVENANCE',
    score: 95,
    confidence: 100,
    status: 'CRITICAL',
    weight: 0.15,
    primaryFinding: 'No authentic cryptographic manifest discovered',
    technicalDetails: 'Payload lacks valid C2PA manifest or hardware CA signatures.',
    modelVersion: 'C2PA-Core v2.1 [DEMO]',
  },
];

const AUDIO_SIGNALS: ProviderSignal[] = [
  {
    key: 'vocal_formant',
    name: 'Vocal Formant Acoustic Jitter',
    category: 'ACOUSTIC',
    score: 86,
    confidence: 90,
    status: 'CRITICAL',
    weight: 0.25,
    primaryFinding: 'Synthetic harmonic truncation observed above 3.8kHz',
    technicalDetails: 'Vocoder artifact patterns consistent with neural TTS synthesis (TorToise/Bark architecture).',
    modelVersion: 'VocalForensics v3.1 [DEMO]',
  },
  {
    key: 'background_consistency',
    name: 'Acoustic Background Consistency',
    category: 'ACOUSTIC',
    score: 72,
    confidence: 78,
    status: 'ANOMALOUS',
    weight: 0.2,
    primaryFinding: 'Abrupt background noise floor transitions at 0:14 and 0:31',
    technicalDetails: 'Natural recordings exhibit gradual noise floor drift; synthetic cuts show abrupt transitions.',
    modelVersion: 'BackgroundAnalysis v2.0 [DEMO]',
  },
  {
    key: 'spectral_clipping',
    name: 'Spectral Clipping & Compression',
    category: 'ACOUSTIC',
    score: 65,
    confidence: 70,
    status: 'ANOMALOUS',
    weight: 0.15,
    primaryFinding: 'Frequency band rolloff pattern inconsistent with declared recording device',
    technicalDetails: 'High-frequency rolloff at 8kHz inconsistent with claimed 48kHz studio recording.',
    modelVersion: 'SpectralAudit v1.5 [DEMO]',
  },
];

const VIDEO_SIGNALS: ProviderSignal[] = [
  {
    key: 'phoneme_viseme',
    name: 'Phoneme-Viseme Synchronization Matrix',
    category: 'ACOUSTIC',
    score: 88,
    confidence: 92,
    status: 'CRITICAL',
    weight: 0.3,
    primaryFinding: '142ms lip-sync latency gap between bilabial plosive and lip closure',
    technicalDetails: 'Lip motion vectors lag 142ms behind audio peak amplitudes — exceeds 80ms natural threshold.',
    modelVersion: 'LipSyncDetect v3.2 [DEMO]',
  },
  {
    key: 'temporal_consistency',
    name: 'Temporal Frame Consistency',
    category: 'TEMPORAL',
    score: 74,
    confidence: 80,
    status: 'ANOMALOUS',
    weight: 0.25,
    primaryFinding: 'Motion inconsistencies detected at frames 341–356',
    technicalDetails: 'Optical flow discontinuities in the perioral region indicate localized frame synthesis.',
    modelVersion: 'TemporalNet v2.4 [DEMO]',
  },
  {
    key: 'face_consistency',
    name: 'Facial Geometry Temporal Consistency',
    category: 'OPTICAL',
    score: 82,
    confidence: 87,
    status: 'ANOMALOUS',
    weight: 0.2,
    primaryFinding: 'Facial landmark drift exceeds natural head movement envelope',
    technicalDetails: 'Face tracking residuals show periodic synthetic correction patterns at 8.3Hz.',
    modelVersion: 'FaceTrack v4.1 [DEMO]',
  },
];

function getSignalsForMediaType(mediaType: MediaType): ProviderSignal[] {
  switch (mediaType) {
    case 'video':
      return VIDEO_SIGNALS;
    case 'audio':
      return AUDIO_SIGNALS;
    default:
      return IMAGE_SIGNALS;
  }
}

export class DemoProvider implements DetectionProvider {
  readonly name = 'DemoProvider';
  readonly version = '1.0.0-demo';
  readonly supportedTypes: readonly MediaType[] = ['image', 'audio', 'video', 'url'];

  async analyze(input: MediaInput): Promise<ProviderResult> {
    // Simulate realistic analysis time
    await new Promise((r) => setTimeout(r, 800));

    const signals = getSignalsForMediaType(input.mediaType);

    return {
      providerName: this.name,
      providerVersion: this.version,
      signals,
      isDemoData: true,
      durationMs: 800,
      unavailableSignals: ['deep_fake_detector_v5', 'provenance_blockchain_lookup'],
    };
  }
}
