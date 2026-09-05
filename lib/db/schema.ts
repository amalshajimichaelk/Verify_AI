/**
 * Drizzle ORM Schema — VerifyAI PostgreSQL Database
 *
 * Design principles:
 * - UUIDs for all primary keys
 * - Foreign keys with cascading deletes where appropriate
 * - Soft deletes (deletedAt) for media assets
 * - JSONB for arrays/objects (key findings, evidence)
 * - Indexes on all frequently-queried columns
 * - Timestamps on all tables
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const mediaTypeEnum = pgEnum('media_type', ['image', 'audio', 'video', 'url']);

export const jobStatusEnum = pgEnum('job_status', [
  'QUEUED',
  'UPLOADING',
  'PROCESSING',
  'METADATA_ANALYSIS',
  'MEDIA_ANALYSIS',
  'SOURCE_ANALYSIS',
  'AGGREGATING',
  'EXPLANATION',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

export const classificationEnum = pgEnum('classification_type', [
  'LIKELY_AUTHENTIC',
  'POTENTIAL_MANIPULATION',
  'LIKELY_AI_GENERATED',
  'INCONCLUSIVE',
]);

export const evidenceStrengthEnum = pgEnum('evidence_strength', [
  'HIGH',
  'MODERATE',
  'LOW',
  'INSUFFICIENT',
]);

export const investigationStatusEnum = pgEnum('investigation_status', [
  'OPEN',
  'IN_REVIEW',
  'CONCLUDED',
]);

// ─── Tables ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: varchar('token_type', { length: 255 }),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: text('session_token').notNull().unique(),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const mediaAssets = pgTable(
  'media_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    blobUrl: text('blob_url').notNull(),
    blobKey: text('blob_key').notNull(),
    name: varchar('name', { length: 500 }).notNull(),
    sanitizedName: varchar('sanitized_name', { length: 500 }).notNull(),
    mimeType: varchar('mime_type', { length: 255 }).notNull(),
    size: integer('size').notNull(),
    mediaType: mediaTypeEnum('media_type').notNull(),
    sha256: varchar('sha256', { length: 64 }).notNull(),
    pHash: varchar('p_hash', { length: 128 }),
    widthPx: integer('width_px'),
    heightPx: integer('height_px'),
    durationSeconds: real('duration_seconds'),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('media_assets_user_id_idx').on(table.userId),
    sha256Idx: index('media_assets_sha256_idx').on(table.sha256),
    uploadedAtIdx: index('media_assets_uploaded_at_idx').on(table.uploadedAt),
    mediaTypeIdx: index('media_assets_media_type_idx').on(table.mediaType),
  })
);

export const analysisJobs = pgTable(
  'analysis_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    mediaAssetId: uuid('media_asset_id')
      .notNull()
      .references(() => mediaAssets.id, { onDelete: 'cascade' }),
    status: jobStatusEnum('status').default('QUEUED').notNull(),
    progressPercent: integer('progress_percent').default(0).notNull(),
    currentStage: text('current_stage').default('Queued for processing').notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 255 }),
    isDemoData: boolean('is_demo_data').default(false).notNull(),
    error: text('error'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('analysis_jobs_user_id_idx').on(table.userId),
    statusIdx: index('analysis_jobs_status_idx').on(table.status),
    startedAtIdx: index('analysis_jobs_started_at_idx').on(table.startedAt),
    idempotencyIdx: index('analysis_jobs_idempotency_idx').on(table.idempotencyKey),
  })
);

export const analysisResults = pgTable(
  'analysis_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .unique()
      .references(() => analysisJobs.id, { onDelete: 'cascade' }),
    classification: classificationEnum('classification').notNull(),
    calibratedConfidence: real('calibrated_confidence').notNull(),
    confidenceRangeLow: real('confidence_range_low').notNull(),
    confidenceRangeHigh: real('confidence_range_high').notNull(),
    evidenceStrength: evidenceStrengthEnum('evidence_strength').notNull(),
    coverageActive: integer('coverage_active').notNull(),
    coverageTotal: integer('coverage_total').notNull(),
    primaryFinding: text('primary_finding').notNull(),
    summaryRationale: text('summary_rationale').notNull(),
    uncertaintyExplanation: text('uncertainty_explanation').notNull(),
    c2paPresent: boolean('c2pa_present').default(false),
    c2paIsValid: boolean('c2pa_is_valid').default(false),
    c2paSigner: text('c2pa_signer'),
    c2paChainValidated: boolean('c2pa_chain_validated').default(false),
    limitations: jsonb('limitations'),
    generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    jobIdIdx: index('analysis_results_job_id_idx').on(table.jobId),
    classificationIdx: index('analysis_results_classification_idx').on(table.classification),
  })
);

export const detectionSignals = pgTable(
  'detection_signals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    resultId: uuid('result_id')
      .notNull()
      .references(() => analysisResults.id, { onDelete: 'cascade' }),
    signalKey: varchar('signal_key', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    score: real('score').notNull(),
    confidence: real('confidence').notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    weight: real('weight').notNull(),
    primaryFinding: text('primary_finding').notNull(),
    technicalDetails: text('technical_details').notNull(),
    modelVersion: varchar('model_version', { length: 100 }).notNull(),
  },
  (table) => ({
    resultIdIdx: index('detection_signals_result_id_idx').on(table.resultId),
  })
);

export const metadataRecords = pgTable(
  'metadata_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    resultId: uuid('result_id')
      .notNull()
      .references(() => analysisResults.id, { onDelete: 'cascade' }),
    field: varchar('field', { length: 255 }).notNull(),
    value: text('value').notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    notes: text('notes'),
    category: varchar('category', { length: 50 }).notNull(),
  },
  (table) => ({
    resultIdIdx: index('metadata_records_result_id_idx').on(table.resultId),
  })
);

export const sourceMatches = pgTable(
  'source_matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    resultId: uuid('result_id')
      .notNull()
      .references(() => analysisResults.id, { onDelete: 'cascade' }),
    relationship: varchar('relationship', { length: 100 }).notNull(),
    domain: varchar('domain', { length: 500 }).notNull(),
    url: text('url').notNull(),
    sourceTimestamp: varchar('source_timestamp', { length: 100 }),
    similarityScore: real('similarity_score').notNull(),
    sourceType: varchar('source_type', { length: 50 }).notNull(),
    context: text('context'),
    hasC2paSignature: boolean('has_c2pa_signature').default(false),
  },
  (table) => ({
    resultIdIdx: index('source_matches_result_id_idx').on(table.resultId),
  })
);

export const timelineEvents = pgTable(
  'timeline_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    resultId: uuid('result_id')
      .notNull()
      .references(() => analysisResults.id, { onDelete: 'cascade' }),
    eventTimestamp: varchar('event_timestamp', { length: 100 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    eventType: varchar('event_type', { length: 50 }).notNull(),
    source: text('source'),
  },
  (table) => ({
    resultIdIdx: index('timeline_events_result_id_idx').on(table.resultId),
  })
);

export const investigations = pgTable(
  'investigations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    status: investigationStatusEnum('status').default('OPEN').notNull(),
    leadAnalyst: varchar('lead_analyst', { length: 255 }),
    organization: varchar('organization', { length: 255 }),
    bookmarkedSignals: jsonb('bookmarked_signals').default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('investigations_user_id_idx').on(table.userId),
    statusIdx: index('investigations_status_idx').on(table.status),
  })
);

export const investigationItems = pgTable(
  'investigation_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    investigationId: uuid('investigation_id')
      .notNull()
      .references(() => investigations.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 500 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    content: text('content').notNull(),
    mediaUrl: text('media_url'),
    badge: varchar('badge', { length: 100 }),
    pinned: boolean('pinned').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    investigationIdIdx: index('investigation_items_investigation_id_idx').on(table.investigationId),
  })
);

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    resultId: uuid('result_id').references(() => analysisResults.id, { onDelete: 'set null' }),
    caseNumber: varchar('case_number', { length: 50 }).notNull(),
    title: text('title').notNull(),
    classification: classificationEnum('classification').notNull(),
    confidence: real('confidence').notNull(),
    summary: text('summary').notNull(),
    keyFindings: jsonb('key_findings').notNull(),
    analystNotes: text('analyst_notes'),
    analystName: varchar('analyst_name', { length: 255 }).notNull(),
    analystOrganization: varchar('analyst_organization', { length: 255 }).notNull(),
    sha256Hash: varchar('sha256_hash', { length: 64 }).notNull(),
    c2paValid: boolean('c2pa_valid').default(false).notNull(),
    jsonLdExport: text('json_ld_export').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('reports_user_id_idx').on(table.userId),
    createdAtIdx: index('reports_created_at_idx').on(table.createdAt),
  })
);

export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 100 }).notNull(),
    resourceType: varchar('resource_type', { length: 100 }),
    resourceId: uuid('resource_id'),
    metadata: jsonb('metadata'),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('audit_events_user_id_idx').on(table.userId),
    actionIdx: index('audit_events_action_idx').on(table.action),
    createdAtIdx: index('audit_events_created_at_idx').on(table.createdAt),
  })
);

// ─── Type Exports (Drizzle inferred) ─────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type MediaAssetRow = typeof mediaAssets.$inferSelect;
export type NewMediaAsset = typeof mediaAssets.$inferInsert;
export type AnalysisJobRow = typeof analysisJobs.$inferSelect;
export type NewAnalysisJob = typeof analysisJobs.$inferInsert;
export type AnalysisResultRow = typeof analysisResults.$inferSelect;
export type NewAnalysisResult = typeof analysisResults.$inferInsert;
export type InvestigationRow = typeof investigations.$inferSelect;
export type InvestigationItemRow = typeof investigationItems.$inferSelect;
export type ReportRow = typeof reports.$inferSelect;
export type AuditEventRow = typeof auditEvents.$inferSelect;
