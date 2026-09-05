/**
 * Session & Authorization Helpers
 *
 * Used in every API route to:
 * 1. Require authentication (throws 401 if no session)
 * 2. Assert ownership (throws 403 if user doesn't own resource)
 *
 * IDOR prevention: never trust resource IDs alone.
 * Always verify userId === resource.userId.
 */

import { auth } from './config';
import { Errors, VerifyAIError } from '../errors';

export interface AuthSession {
  userId: string;
  email: string;
  name: string | null;
}

/**
 * Gets the current session and throws UNAUTHORIZED if not logged in.
 * Use in all protected API routes.
 */
export async function getRequiredSession(): Promise<AuthSession> {
  const session = await auth();

  if (!session?.user?.id) {
    throw Errors.unauthorized();
  }

  return {
    userId: session.user.id,
    email: session.user.email ?? '',
    name: session.user.name ?? null,
  };
}

/**
 * Asserts that the authenticated user owns a resource.
 * Throws FORBIDDEN if not — prevents IDOR vulnerabilities.
 *
 * @param userId - The authenticated user's ID
 * @param resourceUserId - The user ID on the resource being accessed
 * @param resource - Human-readable resource name for error messages
 */
export function assertOwnership(
  userId: string,
  resourceUserId: string,
  resource = 'resource'
): void {
  if (userId !== resourceUserId) {
    throw Errors.forbidden();
  }
}

/**
 * Gets the current session without throwing — returns null if not authenticated.
 * Use for public routes that have optional auth-aware behavior.
 */
export async function getOptionalSession(): Promise<AuthSession | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;
    return {
      userId: session.user.id,
      email: session.user.email ?? '',
      name: session.user.name ?? null,
    };
  } catch {
    return null;
  }
}
