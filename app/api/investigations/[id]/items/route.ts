/**
 * POST /api/investigations/[id]/items — add item
 * GET  /api/investigations/[id]/items — list items
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, created, fromError, generateRequestId } from '../../../../../lib/api/response';
import { getRequiredSession, assertOwnership } from '../../../../../lib/auth/session';
import { Errors } from '../../../../../lib/errors';
import type { InvestigationItem } from '../../../../../src/types';

const AddItemSchema = z.object({
  title: z.string().min(1).max(500),
  type: z.enum(['MEDIA', 'EVIDENCE', 'SOURCE', 'NOTE', 'TIMELINE']),
  content: z.string().min(1).max(5000),
  mediaUrl: z.string().url().optional(),
  badge: z.string().max(100).optional(),
  pinned: z.boolean().optional().default(false),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id: investigationId } = await params;

  try {
    const session = await getRequiredSession();
    const body = await req.json();
    const parsed = AddItemSchema.safeParse(body);

    if (!parsed.success) {
      throw Errors.invalidInput(parsed.error.message);
    }

    if (!process.env.DATABASE_URL) {
      const mockItem: InvestigationItem = {
        id: `item_demo_${Date.now().toString(36)}`,
        ...parsed.data,
        createdAt: new Date().toISOString(),
      };
      return created({ item: mockItem, isDemoMode: true }, requestId);
    }

    const { db } = await import('../../../../../lib/db/client');
    const { investigations, investigationItems } = await import('../../../../../lib/db/schema');
    const { eq } = await import('drizzle-orm');

    // Verify ownership
    const [inv] = await db
      .select({ userId: investigations.userId })
      .from(investigations)
      .where(eq(investigations.id, investigationId))
      .limit(1);

    if (!inv) throw Errors.notFound('Investigation');
    assertOwnership(session.userId, inv.userId, 'investigation');

    const [item] = await db
      .insert(investigationItems)
      .values({
        investigationId,
        title: parsed.data.title,
        type: parsed.data.type,
        content: parsed.data.content,
        mediaUrl: parsed.data.mediaUrl ?? null,
        badge: parsed.data.badge ?? null,
        pinned: parsed.data.pinned ?? false,
      })
      .returning();

    // Update investigation's updatedAt
    await db
      .update(investigations)
      .set({ updatedAt: new Date() })
      .where(eq(investigations.id, investigationId));

    const result: InvestigationItem = {
      id: item.id,
      title: item.title,
      type: item.type as InvestigationItem['type'],
      content: item.content,
      mediaUrl: item.mediaUrl ?? undefined,
      badge: item.badge ?? undefined,
      pinned: item.pinned,
      createdAt: item.createdAt.toISOString(),
    };

    return created({ item: result, isDemoMode: false }, requestId);
  } catch (err) {
    return fromError(err, requestId);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id: investigationId } = await params;

  try {
    const session = await getRequiredSession();
    const body = await _req.json();
    const { itemId } = body;
    if (!itemId) throw Errors.invalidInput('itemId is required');

    if (!process.env.DATABASE_URL) {
      return ok({ deleted: true, isDemoMode: true }, requestId);
    }

    const { db } = await import('../../../../../lib/db/client');
    const { investigations, investigationItems } = await import('../../../../../lib/db/schema');
    const { eq, and } = await import('drizzle-orm');

    const [inv] = await db
      .select({ userId: investigations.userId })
      .from(investigations)
      .where(eq(investigations.id, investigationId))
      .limit(1);

    if (!inv) throw Errors.notFound('Investigation');
    assertOwnership(session.userId, inv.userId, 'investigation');

    await db
      .delete(investigationItems)
      .where(
        and(
          eq(investigationItems.id, itemId),
          eq(investigationItems.investigationId, investigationId)
        )
      );

    return ok({ deleted: true, isDemoMode: false }, requestId);
  } catch (err) {
    return fromError(err, requestId);
  }
}
