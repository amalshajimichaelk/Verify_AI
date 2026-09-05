/**
 * Centralized Forensic Analysis API
 *
 * Real HTTP client wrapping /api/analyze/* endpoints.
 * Falls back to mock data in demo mode for UI compatibility.
 */

import { AnalysisJob, AnalysisResult, MediaAsset } from '../types';
import { apiRequest, IS_DEMO_MODE, simulateLatency } from './client';
import { BENCHMARK_CASES } from '../mock/mockDatabase';
import { calculateCalibratedAssessment } from '../services/forensicEngine';

// In-memory fallback for demo mode job simulation
const demoJobs = new Map<string, AnalysisJob>();

export const analysisApi = {
  /**
   * Creates a new forensic analysis job.
   * In production: POST /api/analyze → returns jobId for polling
   * In demo mode: runs synthetic progression simulation
   */
  async createJob(asset: MediaAsset, specificCaseId?: string): Promise<AnalysisJob> {
    if (!IS_DEMO_MODE && typeof window !== 'undefined') {
      try {
        const data = await apiRequest<{ job: AnalysisJob; isDemoMode: boolean }>(
          '/api/analyze',
          {
            method: 'POST',
            body: JSON.stringify({ asset }),
          }
        );
        return data.job;
      } catch (err: unknown) {
        // Handle duplicate job (idempotency)
        if (err instanceof Error && 'code' in err && (err as { code?: string }).code === 'DUPLICATE_JOB') {
          const details = (err as { details?: { existingJobId?: string } }).details;
          if (details?.existingJobId) {
            return this.getJobStatus(details.existingJobId);
          }
        }
        console.warn('[analysisApi] Real API call failed, falling back to demo', err);
      }
    }

    // Demo mode simulation
    await simulateLatency(250);
    const jobId = specificCaseId || 'job_' + Date.now().toString(36);

    const job: AnalysisJob = {
      id: jobId,
      asset,
      status: 'QUEUED',
      progressPercent: 5,
      currentStage: 'Ingesting bitstream into zero-retention enclave...',
      startedAt: new Date().toISOString(),
    };

    demoJobs.set(jobId, job);
    return job;
  },

  /**
   * Polls job status.
   * In production: GET /api/analyze/[id]/status
   * In demo mode: simulates stage progression
   */
  async getJobStatus(jobId: string): Promise<AnalysisJob> {
    // Check benchmark cases (always available)
    if (BENCHMARK_CASES[jobId as keyof typeof BENCHMARK_CASES]) {
      const benchmark = BENCHMARK_CASES[jobId as keyof typeof BENCHMARK_CASES];
      return {
        id: jobId,
        asset: benchmark.asset,
        status: 'COMPLETED',
        progressPercent: 100,
        currentStage: 'Analysis complete. Multi-signal dossier generated.',
        startedAt: benchmark.generatedAt,
        completedAt: benchmark.generatedAt,
        result: benchmark,
      };
    }

    if (!IS_DEMO_MODE && typeof window !== 'undefined') {
      try {
        const data = await apiRequest<{
          jobId: string;
          status: AnalysisJob['status'];
          progressPercent: number;
          currentStage: string;
          startedAt?: string;
          completedAt?: string;
          error?: string;
        }>(`/api/analyze/${jobId}/status`);

        // If completed, fetch full result
        if (data.status === 'COMPLETED') {
          return this.getFullJob(jobId);
        }

        // Return status-only response
        const job = demoJobs.get(jobId);
        return {
          id: jobId,
          asset: job?.asset ?? ({} as MediaAsset),
          status: data.status,
          progressPercent: data.progressPercent,
          currentStage: data.currentStage,
          startedAt: data.startedAt ?? new Date().toISOString(),
          completedAt: data.completedAt,
          error: data.error,
        };
      } catch (err) {
        console.warn('[analysisApi] Status poll failed, using demo progression', err);
      }
    }

    // Demo mode: simulate stage progression
    await simulateLatency(300);
    const job = demoJobs.get(jobId);
    if (!job) {
      // Return fallback benchmark
      const fallback = BENCHMARK_CASES['case-4891'];
      return {
        id: jobId,
        asset: fallback.asset,
        status: 'COMPLETED',
        progressPercent: 100,
        currentStage: 'Calibrated scientific telemetry ready.',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        result: { ...fallback, isDemoData: true },
      };
    }

    if (job.status !== 'COMPLETED' && job.status !== 'FAILED' && job.status !== 'CANCELLED') {
      if (job.progressPercent < 20) {
        job.status = 'UPLOADING';
        job.progressPercent = Math.min(25, job.progressPercent + 15);
        job.currentStage = 'Parsing container streams & verifying SHA-256 hash...';
      } else if (job.progressPercent < 45) {
        job.status = 'MEDIA_ANALYSIS';
        job.progressPercent = Math.min(50, job.progressPercent + 20);
        job.currentStage = 'Executing 2D Fourier transforms & ELA error analysis...';
      } else if (job.progressPercent < 75) {
        job.status = 'AGGREGATING';
        job.progressPercent = Math.min(80, job.progressPercent + 25);
        job.currentStage = '10 neural signal families evaluating latent artifact space...';
      } else if (job.progressPercent < 95) {
        job.status = 'SOURCE_ANALYSIS';
        job.progressPercent = 95;
        job.currentStage = 'Crawling earliest reverse appearance & C2PA validation...';
      } else {
        job.status = 'COMPLETED';
        job.progressPercent = 100;
        job.currentStage = 'Evidence under glass synthesized. Decisional dossier ready.';
        job.completedAt = new Date().toISOString();
        job.result = generateDynamicAnalysisResult(job.id, job.asset);
      }
    }

    return { ...job };
  },

  /**
   * Fetches a complete job with result from the API.
   */
  async getFullJob(jobId: string): Promise<AnalysisJob> {
    const data = await apiRequest<{ job: AnalysisJob; isDemoMode: boolean }>(
      `/api/analyze/${jobId}`
    );
    return data.job;
  },

  /**
   * Retrieves final analysis result for a completed job.
   */
  async getResult(jobId: string): Promise<AnalysisResult> {
    if (BENCHMARK_CASES[jobId as keyof typeof BENCHMARK_CASES]) {
      return BENCHMARK_CASES[jobId as keyof typeof BENCHMARK_CASES];
    }

    if (!IS_DEMO_MODE && typeof window !== 'undefined') {
      try {
        const data = await apiRequest<{ job: AnalysisJob }>(`/api/analyze/${jobId}`);
        if (data.job.result) return data.job.result;
      } catch (err) {
        console.warn('[analysisApi] getResult failed, using demo fallback', err);
      }
    }

    await simulateLatency(200);
    const job = demoJobs.get(jobId);
    if (job?.result) return job.result;

    return { ...BENCHMARK_CASES['case-4891'], isDemoData: true };
  },

  /**
   * Cancels a running analysis job.
   */
  async cancelJob(jobId: string): Promise<void> {
    if (!IS_DEMO_MODE && typeof window !== 'undefined') {
      try {
        await apiRequest(`/api/analyze/${jobId}/cancel`, { method: 'POST' });
        return;
      } catch (err) {
        console.warn('[analysisApi] cancelJob failed', err);
      }
    }

    await simulateLatency(150);
    const job = demoJobs.get(jobId);
    if (job) {
      job.status = 'CANCELLED';
      job.currentStage = 'Analysis aborted by operator.';
    }
  },
};

/**
 * Generates a realistic forensic result for demo mode.
 * Clearly marked as isDemoData: true.
 */
function generateDynamicAnalysisResult(jobId: string, asset: MediaAsset): AnalysisResult {
  const isVideo = asset.type === 'video';
  const isAudio = asset.type === 'audio';

  const signals = [
    {
      id: 'dyn-sig-1',
      name: isAudio ? 'Vocal Formant Acoustic Jitter' : 'Diffusion Latent Grid Analysis',
      category: isAudio ? ('ACOUSTIC' as const) : ('OPTICAL' as const),
      score: 86,
      confidence: 90,
      status: 'CRITICAL' as const,
      weight: 0.25,
      primaryFinding: isAudio
        ? 'Synthetic harmonic truncation observed above 3.8kHz'
        : 'Discontinuous high-frequency spectral falloff in central image quadrant',
      technicalDetails: 'Model detected latent space reconstruction boundaries.',
      modelVersion: 'DeepDetect v4.1 [DEMO]',
    },
    {
      id: 'dyn-sig-2',
      name: isVideo ? 'Phoneme-Viseme Sync Matrix' : 'Bayer CFA Filter Continuity',
      category: isVideo ? ('ACOUSTIC' as const) : ('METADATA' as const),
      score: 78,
      confidence: 85,
      status: 'ANOMALOUS' as const,
      weight: 0.2,
      primaryFinding: isVideo ? '118ms lip-sync latency gap' : 'Inconsistent demosaicing interpolation',
      technicalDetails: 'Physical hardware signatures do not match reported container software.',
      modelVersion: 'AcousticVision v2.9 [DEMO]',
    },
    {
      id: 'dyn-sig-3',
      name: 'Error Level Analysis (ELA)',
      category: 'OPTICAL' as const,
      score: 82,
      confidence: 88,
      status: 'ANOMALOUS' as const,
      weight: 0.2,
      primaryFinding: 'Localized compression gradient anomaly (+38% vs baseline)',
      technicalDetails: 'Residual quantization tables indicate multiple re-compression stages.',
      modelVersion: 'ELAEngine v3.2 [DEMO]',
    },
    {
      id: 'dyn-sig-4',
      name: 'C2PA Cryptographic Provenance',
      category: 'PROVENANCE' as const,
      score: 95,
      confidence: 100,
      status: 'CRITICAL' as const,
      weight: 0.2,
      primaryFinding: 'No authentic cryptographic manifest discovered',
      technicalDetails: 'Payload lacks valid C2PA manifest or hardware CA signatures.',
      modelVersion: 'C2PA-Core v2.1 [DEMO]',
    },
  ];

  const metadata = [
    { field: 'Container MIME Type', value: asset.mimeType, status: 'detected' as const, category: 'CONTAINER' as const },
    { field: 'SHA-256 Bitstream Hash', value: asset.hashSha256, status: 'verified' as const, category: 'CONTAINER' as const },
    { field: 'Camera Hardware Sensor', value: 'Stripped or Unavailable', status: 'missing' as const, category: 'HARDWARE' as const },
    { field: 'C2PA Digital Attestation', value: 'No Signed Manifest [DEMO]', status: 'missing' as const, category: 'PROVENANCE' as const },
  ];

  const assessment = calculateCalibratedAssessment(signals, metadata, false, true);

  return {
    jobId,
    asset,
    classification: assessment.classification,
    calibratedConfidence: assessment.calibratedConfidence,
    confidenceRange: assessment.confidenceRange,
    evidenceStrength: assessment.evidenceStrength,
    coverageRatio: assessment.coverageRatio,
    uncertaintyExplanation: assessment.uncertaintyExplanation,
    primaryFinding: signals[0].primaryFinding,
    summaryRationale: assessment.summaryRationale,
    signals,
    metadata,
    sources: [
      {
        id: 'dyn-src-1',
        relationship: 'Earliest source found',
        domain: 'cdn.fast-media.net',
        url: 'https://cdn.fast-media.net/staging/' + asset.id,
        timestamp: '2025-05-14 02:15:00 UTC',
        similarityScore: 97,
        sourceType: 'PUBLIC_INDEX',
        context: 'First uncompressed upload indexed via reverse-graph crawler. [DEMO DATA]',
        hasC2paSignature: false,
      },
    ],
    timeline: [
      {
        id: 'dyn-tl-1',
        timestamp: '2025-05-14 02:15 UTC',
        title: 'Earliest Indexed Instance [DEMO]',
        description: 'First identified appearance on public media server. [DEMO DATA]',
        eventType: 'FIRST_DISSEMINATION',
      },
      {
        id: 'dyn-tl-2',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
        title: 'VerifyAI Demo Analysis Executed',
        description: 'Deterministic demo analysis executed. Not a real forensic finding.',
        eventType: 'VERIFICATION',
      },
    ],
    limitations: {
      blindSpots: [
        'Heavily recompressed web media limits sub-pixel noise floor recovery.',
        'DEMO MODE: results are deterministic samples, not real forensic analysis.',
      ],
      unavailableData: ['Original hardware camera RAW file was not submitted.'],
      recommendedHumanChecks: [
        'This is demo data. Configure real providers for production use.',
        'Request original camera capture with valid C2PA manifest.',
      ],
    },
    c2paValidation: {
      present: false,
      isValid: false,
      chainValidated: false,
    },
    generatedAt: new Date().toISOString(),
    isDemoData: true,
  };
}
