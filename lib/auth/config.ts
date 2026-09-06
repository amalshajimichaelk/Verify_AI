/**
 * NextAuth.js v5 Configuration
 *
 * Providers:
 * - Google OAuth (primary)
 * - Resend magic link email (fallback)
 *
 * Strategy: Database sessions (JWT for Edge compatibility)
 * Adapter: @auth/drizzle-adapter
 *
 * All auth state is stored in PostgreSQL via the Drizzle adapter.
 */

import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '../db/client';
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from '../db/schema';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db as any, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  } as any),
});

/** Extended session type with userId */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
