/**
 * GET /api/investigations — list user's investigations
 * POST /api/investigations — create a new investigation
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, created, fromError, generateRequestId } from '../../../lib/api/response';
import { getRequiredSession } from '../../../lib/auth/session';
import { Errors } from '../../../lib/errors';
import { INITIAL_INVESTIGATIONS } from '../../../src/mock/mockDatabase';
import type { Investigation } from '../../../src/types';

const CreateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  leadAnalyst: z.string().max(255).optional(),
  organization: z.string().max(255).optional(),
});

export async function GET(_req: NextRequest) {
  const requestId = generateRequestId();
  try {
    const session = await getRequiredSession();

    if (!process.env.DATABASE_URL) {
      // Demo mode: return initial investigations
      return ok({ investigations: INITIAL_INVESTIGATIONS, isDemoMode: true }, requestId);
    }

    const { db } = await import('../../../lib/db/client');
    const { investigations, investigationItems } = await import('../../../lib/db/schema');
    const { eq, desc } = await import('drizzle-orm');

    const rows = await db
      .select()
      .from(investigations)
      .where(eq(investigations.userId, session.userId))
      .orderBy(desc(investigations.updatedAt));

    const result: Investigation[] = await Promise.all(
      rows.map(async (inv) => {
        const items = await db
          .select()
          .from(investigationItems)
          .where(eq(investigationItems.investigationId, inv.id));

        return {
          id: inv.id,
          title: inv.title,
          description: inv.description ?? '',
          status: inv.status,
          leadAnalyst: inv.leadAnalyst ?? '',
          organization: inv.organization ?? '',
          createdAt: inv.createdAt.toISOString(),
          updatedAt: inv.updatedAt.toISOString(),
          bookmarkedSignals: (inv.bookmarkedSignals as string[]) ?? [],
          items: items.map((item) => ({
            id: item.id,
            title: item.title,
            type: item.type as Investigation['items'][0]['type'],
            content: item.content,
            mediaUrl: item.mediaUrl ?? undefined,
            badge: item.badge ?? undefined,
            pinned: item.pinned,
            createdAt: item.createdAt.toISOString(),
          })),
        };
      })
    );

    return ok({ investigations: result, isDemoMode: false }, requestId);
  } catch (err) {
    return fromError(err, requestId);
  }
}

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  try {
    const session = await getRequiredSession();
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);

    if (!parsed.success) {
      throw Errors.invalidInput(parsed.error.message);
    }

    if (!process.env.DATABASE_URL) {
      // Demo mode
      const mockInv: Investigation = {
        id: `inv_demo_${Date.now().toString(36)}`,
        title: parsed.data.title,
        description: parsed.data.description ?? '',
        status: 'OPEN',
        leadAnalyst: parsed.data.leadAnalyst ?? session.name ?? 'Analyst',
        organization: parsed.data.organization ?? '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
        bookmarkedSignals: [],
      };
      return created({ investigation: mockInv, isDemoMode: true }, requestId);
    }

    const { db } = await import('../../../lib/db/client');
    const { investigations } = await import('../../../lib/db/schema');

    const [inv] = await db
      .insert(investigations)
      .values({
        userId: session.userId,
        title: parsed.data.title,
        description: parsed.data.description,
        leadAnalyst: parsed.data.leadAnalyst ?? session.name ?? undefined,
        organization: parsed.data.organization,
        status: 'OPEN',
      })
      .returning();

    const result: Investigation = {
      id: inv.id,
      title: inv.title,
      description: inv.description ?? '',
      status: inv.status,
      leadAnalyst: inv.leadAnalyst ?? '',
      organization: inv.organization ?? '',
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
      items: [],
      bookmarkedSignals: [],
    };

    return created({ investigation: result, isDemoMode: false }, requestId);
  } catch (err) {
    return fromError(err, requestId);
  }
}
