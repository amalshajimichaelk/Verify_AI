/**
 * VerifyAI Domain Types & Schemas
 * Strictly typed definitions for multi-modal forensic analysis,
 * calibrated confidence intervals, provenance chains, and investigation boards.
 */

export type MediaType = 'image' | 'audio' | 'video' | 'url';

export type ClassificationType =
  | 'LIKELY_AUTHENTIC'
  | 'POTENTIAL_MANIPULATION'
  | 'LIKELY_AI_GENERATED'
  | 'INCONCLUSIVE';

export type EvidenceStrength = 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT';

export type ForensicStatus = 'missing' | 'unavailable' | 'modified' | 'detected' | 'verified';

/** Canonical job status states as defined in the spec */
export type JobStatus =
  | 'QUEUED'
  | 'UPLOADING'
  | 'PROCESSING'
  | 'METADATA_ANALYSIS'
  | 'MEDIA_ANALYSIS'
  | 'SOURCE_ANALYSIS'
  | 'AGGREGATING'
  | 'EXPLANATION'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  // Legacy status aliases kept for UI compatibility
  | 'INGESTING'
  | 'SPECTRAL_SCAN'
  | 'NEURAL_PROBING'
  | 'PROVENANCE_TRACE'
  | 'CALIBRATING';

/** Typed error codes — never expose raw server errors to users */
export type ErrorCode =
  | 'INVALID_INPUT'
  | 'UNSUPPORTED_MEDIA'
  | 'FILE_TOO_LARGE'
  | 'RESOURCE_LIMIT'
  | 'UPLOAD_FAILED'
  | 'ANALYSIS_FAILED'
  | 'MODEL_UNAVAILABLE'
  | 'SOURCE_LOOKUP_FAILED'
  | 'REPORT_FAILED'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'UPLOAD_ABORTED'
  | 'INGESTION_ABORTED'
  | 'INVALID_URL'
  | 'API_ERROR'
  | 'SSRF_BLOCKED'
  | 'DUPLICATE_JOB';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
  };
  requestId?: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaType;
  size: number;
  mimeType: string;
  url: string;
  hashSha256: string;
  thumbnailUrl?: string;
  dimensions?: { width: number; height: number };
  durationSeconds?: number;
  uploadedAt: string;
}

export interface UploadResponse {
  success: boolean;
  asset: MediaAsset;
  jobId: string;
  preFlightValidation: {
    passed: boolean;
    c2paDetected: boolean;
    audioStreamPresent: boolean;
    queuedDetectors: number;
    containerIntegrity: 'VALID' | 'DAMAGED' | 'SUSPICIOUS';
  };
}

export interface DetectionSignal {
  id: string;
  name: string;
  category: 'OPTICAL' | 'ACOUSTIC' | 'METADATA' | 'PROVENANCE' | 'TEMPORAL' | 'CONTAINER';
  score: number; // 0 - 100
  confidence: number; // 0 - 100
  status: 'NORMAL' | 'ANOMALOUS' | 'CRITICAL' | 'INCONCLUSIVE';
  weight: number; // Model contribution weight (0 - 1)
  primaryFinding: string;
  technicalDetails: string;
  modelVersion: string;
}

export type ForensicSignal = DetectionSignal;
export type SignalCategory = DetectionSignal['category'];

export interface MetadataRecord {
  field: string;
  value: string;
  status: ForensicStatus;
  notes?: string;
  category: 'HARDWARE' | 'SOFTWARE' | 'EXIF' | 'CONTAINER' | 'PROVENANCE';
}

export type MetadataField = MetadataRecord;

export interface SourceMatch {
  id: string;
  relationship: 'Possible source' | 'Earliest source found' | 'Related appearance';
  domain: string;
  url: string;
  timestamp: string;
  similarityScore: number; // 0 - 100
  sourceType: 'NEWS_WIRE' | 'SOCIAL_NETWORK' | 'ARCHIVE' | 'PUBLIC_INDEX';
  context: string;
  hasC2paSignature: boolean;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  eventType: 'CREATION' | 'FIRST_DISSEMINATION' | 'MANIPULATION' | 'VIRAL_SPREAD' | 'VERIFICATION';
  source?: string;
}

export interface AnalysisResult {
  jobId: string;
  asset: MediaAsset;
  classification: ClassificationType;
  calibratedConfidence: number; // e.g. 78%
  confidenceRange: [number, number]; // e.g. [73, 83]
  evidenceStrength: EvidenceStrength;
  coverageRatio: { active: number; total: number }; // e.g. 8 / 10
  uncertaintyExplanation: string;
  primaryFinding: string;
  summaryRationale: string;
  signals: DetectionSignal[];
  metadata: MetadataRecord[];
  sources: SourceMatch[];
  timeline: TimelineEvent[];
  limitations: {
    blindSpots: string[];
    unavailableData: string[];
    recommendedHumanChecks: string[];
  };
  c2paValidation?: {
    present: boolean;
    signer?: string;
    certIssuer?: string;
    isValid: boolean;
    issuedAt?: string;
    chainValidated: boolean;
  };
  generatedAt: string;
  isDemoData: boolean;
}

export interface AnalysisJob {
  id: string;
  asset: MediaAsset;
  status: JobStatus;
  progressPercent: number;
  currentStage: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
  result?: AnalysisResult;
}

export interface InvestigationItem {
  id: string;
  title: string;
  type: 'MEDIA' | 'EVIDENCE' | 'SOURCE' | 'NOTE' | 'TIMELINE';
  content: string;
  mediaUrl?: string;
  badge?: string;
  pinned: boolean;
  createdAt: string;
}

export interface Investigation {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_REVIEW' | 'CONCLUDED';
  leadAnalyst: string;
  organization: string;
  createdAt: string;
  updatedAt: string;
  items: InvestigationItem[];
  bookmarkedSignals: string[];
}

export interface VerificationReport {
  id: string;
  caseNumber: string;
  title: string;
  classification: ClassificationType;
  confidence: number;
  summary: string;
  keyFindings: string[];
  analystNotes: string;
  analystName: string;
  analystOrganization: string;
  createdAt: string;
  sha256Hash: string;
  c2paValid: boolean;
  jsonLdExport: string;
}

/** User profile (populated from auth session) */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  image?: string;
}
