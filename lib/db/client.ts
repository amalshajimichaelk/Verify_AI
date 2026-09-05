/**
 * Neon PostgreSQL Serverless Client
 *
 * Uses @neondatabase/serverless for edge-compatible connection pooling.
 * Single instance per function invocation (safe for serverless).
 *
 * Connection is lazy — only established on first query.
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Fail fast at startup if DATABASE_URL is missing
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is required. Set it in .env.local or Vercel environment variables.'
  );
}

const sql = neon(process.env.DATABASE_URL);

/**
 * Drizzle ORM database instance.
 * Use this in all server-side code (API routes, Inngest functions).
 */
export const db = drizzle(sql, { schema });

export type Database = typeof db;
