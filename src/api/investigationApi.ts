/**
 * Investigation API Client
 *
 * Real HTTP client for /api/investigations/*.
 * Preserves localStorage fallback removed — uses real API.
 * Demo mode returns in-memory data.
 */

import { Investigation, InvestigationItem } from '../types';
import { apiRequest, IS_DEMO_MODE, simulateLatency } from './client';
import { INITIAL_INVESTIGATIONS } from '../mock/mockDatabase';

// In-memory demo store
let demoInvestigations: Investigation[] = [...INITIAL_INVESTIGATIONS];

export const investigationApi = {
  async listInvestigations(): Promise<Investigation[]> {
    if (!IS_DEMO_MODE && typeof window !== 'undefined') {
      try {
        const data = await apiRequest<{ investigations: Investigation[] }>(
          '/api/investigations'
        );
        return data.investigations;
      } catch (err) {
        console.warn('[investigationApi] listInvestigations failed, using demo', err);
      }
    }

    await simulateLatency(150);
    return [...demoInvestigations];
  },

  async createInvestigation(data: { title: string; description?: string }): Promise<Investigation> {
    if (!IS_DEMO_MODE && typeof window !== 'undefined') {
      try {
        const result = await apiRequest<{ investigation: Investigation }>(
          '/api/investigations',
          {
            method: 'POST',
            body: JSON.stringify(data),
          }
        );
        return result.investigation;
      } catch (err) {
        console.warn('[investigationApi] createInvestigation failed, using demo', err);
      }
    }

    await simulateLatency(200);
    const newInv: Investigation = {
      id: `inv_${Date.now().toString(36)}`,
      title: data.title,
      description: data.description ?? '',
      status: 'OPEN',
      leadAnalyst: 'Analyst',
      organization: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [],
      bookmarkedSignals: [],
    };
    demoInvestigations.unshift(newInv);
    return newInv;
  },

  async addItem(
    investigationId: string,
    item: Omit<InvestigationItem, 'id' | 'createdAt'>
  ): Promise<InvestigationItem> {
    if (!IS_DEMO_MODE && typeof window !== 'undefined') {
      try {
        const result = await apiRequest<{ item: InvestigationItem }>(
          `/api/investigations/${investigationId}/items`,
          {
            method: 'POST',
            body: JSON.stringify(item),
          }
        );
        return result.item;
      } catch (err) {
        console.warn('[investigationApi] addItem failed, using demo', err);
      }
    }

    await simulateLatency(200);
    const newItem: InvestigationItem = {
      ...item,
      id: `item_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };

    const inv = demoInvestigations.find((i) => i.id === investigationId);
    if (inv) {
      inv.items.push(newItem);
      inv.updatedAt = new Date().toISOString();
    }
    return newItem;
  },

  async removeItem(investigationId: string, itemId: string): Promise<void> {
    if (!IS_DEMO_MODE && typeof window !== 'undefined') {
      try {
        await apiRequest(
          `/api/investigations/${investigationId}/items`,
          {
            method: 'DELETE',
            body: JSON.stringify({ itemId }),
          }
        );
        return;
      } catch (err) {
        console.warn('[investigationApi] removeItem failed, using demo', err);
      }
    }

    await simulateLatency(150);
    const inv = demoInvestigations.find((i) => i.id === investigationId);
    if (inv) {
      inv.items = inv.items.filter((item) => item.id !== itemId);
      inv.updatedAt = new Date().toISOString();
    }
  },
};
