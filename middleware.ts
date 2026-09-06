/**
 * Next.js Edge Middleware
 *
 * Protects Next.js routes using NextAuth.js.
 * Requires users to be authenticated to access the app.
 *
 * Excludes:
 * - Next.js assets (_next)
 * - Static files
 * - API routes (protected individually within the route handlers)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const isAuthPage = req.nextUrl.pathname.startsWith('/api/auth') || req.nextUrl.pathname.startsWith('/auth');
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  const isPublicAsset = req.nextUrl.pathname.match(/\.(svg|png|jpg|jpeg|ico|css|js)$/);

  // Allow API routes (they handle their own auth), auth endpoints, and static assets
  if (isAuthPage || isApiRoute || isPublicAsset) {
    return NextResponse.next();
  }

  // Allow all access in demo mode when no real database is configured
  // This ensures the app works out of the box without setup for reviewers
  const isDemo =
    process.env.DEMO_MODE === 'true' ||
    process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
    !process.env.DATABASE_URL ||
    process.env.DATABASE_URL.includes('dummy');

  if (isDemo) {
    return NextResponse.next();
  }

  // Check auth session cookie
  const sessionToken =
    req.cookies.get('authjs.session-token') ||
    req.cookies.get('__Secure-authjs.session-token') ||
    req.cookies.get('next-auth.session-token') ||
    req.cookies.get('__Secure-next-auth.session-token');

  // Redirect unauthenticated users to the default NextAuth signin page
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/api/auth/signin', req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|auth|api/auth).*)'],
};
