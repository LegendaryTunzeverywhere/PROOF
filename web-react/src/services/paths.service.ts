/**
 * Learning Paths Service
 * Handles learning path creation, retrieval, and progress tracking
 */

import { api } from '../lib/api';
import type {
  LearningPath,
  PathsResponse,
  CreatePathRequest,
  CreatePathResponse,
  ProgressUpdate,
  ProgressResponse,
} from '../types/api';

export const pathsService = {
  /**
   * Create a new learning path
   */
  async createPath(data: CreatePathRequest): Promise<CreatePathResponse> {
    return api.post<CreatePathResponse>('/api/paths', data);
  },

  /**
   * Get all user's learning paths
   */
  async getPaths(): Promise<PathsResponse> {
    return api.get<PathsResponse>('/api/paths');
  },

  /**
   * Get single learning path by ID
   */
  async getPath(id: string): Promise<{ path: LearningPath }> {
    return api.get<{ path: LearningPath }>(`/api/paths/${id}`);
  },

  /**
   * Update progress on a path item
   */
  async updateProgress(pathId: string, data: ProgressUpdate): Promise<ProgressResponse> {
    return api.post<ProgressResponse>(`/api/paths/${pathId}/progress`, data);
  },

  /**
   * Create curriculum from uploaded document
   */
  async createFromDocument(file: File, goal?: string): Promise<CreatePathResponse> {
    const formData = new FormData();
    formData.append('document', file);
    if (goal) {
      formData.append('goal', goal);
    }

    // Use native fetch for file uploads
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/curriculum/from-document`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      let message = 'Failed to upload document';
      try {
        const error = await response.json();
        message = error?.error?.message || error?.message || error?.error || message;
      } catch {
        message = response.statusText || message;
      }
      throw new Error(message);
    }

    return response.json();
  },

  /**
   * Get all document-based curricula
   */
  async getDocumentCurricula(): Promise<PathsResponse> {
    return api.get<PathsResponse>('/api/curriculum/documents');
  },

  /**
   * Get specific document curriculum
   */
  async getDocumentCurriculum(id: string): Promise<{ path: LearningPath }> {
    return api.get<{ path: LearningPath }>(`/api/curriculum/documents/${id}`);
  },
};
