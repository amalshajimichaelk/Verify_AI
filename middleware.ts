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

import { auth } from './lib/auth/config';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/api/auth');
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  const isPublicAsset = req.nextUrl.pathname.match(/\.(svg|png|jpg|jpeg|ico|css|js)$/);

  // Allow API routes (they handle their own auth), auth endpoints, and static assets
  if (isAuthPage || isApiRoute || isPublicAsset) {
    return;
  }

  // Allow all access in demo mode when no real database is configured
  // This ensures the app works out of the box without setup for reviewers
  const isDemoMode =
    process.env.DEMO_MODE === 'true' ||
    process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
    !process.env.DATABASE_URL;

  if (isDemoMode) {
    return;
  }

  // Redirect unauthenticated users to the default NextAuth signin page
  if (!isLoggedIn) {
    return Response.redirect(new URL('/api/auth/signin', req.nextUrl));
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
