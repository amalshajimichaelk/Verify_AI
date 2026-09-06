import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Resend from 'next-auth/providers/resend';

/**
 * Edge-compatible NextAuth configuration.
 * Does not import database adapters or heavy server-only libraries,
 * making it safe to use inside Next.js Edge Middleware.
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
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
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user && token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
};
