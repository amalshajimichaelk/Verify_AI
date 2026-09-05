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
import Google from 'next-auth/providers/google';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '../db/client';
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from '../db/schema';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Request minimal scopes
          scope: 'openid email profile',
        },
      },
    }),

    // Email magic link — only if Resend is configured
    ...(process.env.AUTH_RESEND_KEY
      ? [
          Resend({
            apiKey: process.env.AUTH_RESEND_KEY,
            from: process.env.AUTH_EMAIL_FROM || 'VerifyAI <noreply@verifyai.app>',
          }),
        ]
      : []),
  ],

  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    /** Expose userId in the session object for API route access */
    session: async ({ session, user }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      };
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  // Security: Trust the provided secret, not a fallback
  secret: process.env.NEXTAUTH_SECRET,
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
