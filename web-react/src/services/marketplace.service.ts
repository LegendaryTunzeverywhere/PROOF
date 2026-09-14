/**
 * Marketplace Service
 * Handles marketplace tasks and job applications
 */

import { api } from '../lib/api';
import type { MarketplaceTask } from '../types/api';

export const marketplaceService = {
  /**
   * List available marketplace tasks
   */
  async getTasks(filters?: {
    onlyQualified?: boolean;
    skillSlug?: string;
  }): Promise<{ tasks: MarketplaceTask[] }> {
    const params = new URLSearchParams();
    if (filters?.onlyQualified) params.set('qualified', '1');
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<{ tasks: MarketplaceTask[] }>(`/api/market/tasks${query}`);
  },

  /**
   * Get the configured treasury wallet address that posters must fund.
   */
  async getTreasuryAddress(): Promise<{ treasuryAddress: string; configured: boolean }> {
    return api.get<{ treasuryAddress: string; configured: boolean }>('/api/market/treasury');
  },

  /**
   * Create a marketplace task and escrow the poster budget.
   */
  async postTask(payload: {
    title: string;
    description: string;
    budgetNim: number;
    skillSlug?: string | null;
    minScore?: number;
    tags?: string[];
  }): Promise<{ task: MarketplaceTask }> {
    return api.post<{ task: MarketplaceTask }>('/api/market/tasks', payload);
  },

  /**
   * Get details of a specific task
   */
  async getTask(id: string): Promise<{ task: MarketplaceTask }> {
    return api.get<{ task: MarketplaceTask }>(`/api/market/tasks/${id}`);
  },

  /**
   * Apply to a task
   */
  async applyToTask(taskId: string, pitch: string): Promise<{ application: unknown }> {
    return api.post(`/api/market/tasks/${taskId}/apply`, { pitch });
  },

  /**
   * Get user's applications
   */
  async getMyApplications(): Promise<{ applications: any[] }> {
    return api.get('/api/market/my');
  },
};
