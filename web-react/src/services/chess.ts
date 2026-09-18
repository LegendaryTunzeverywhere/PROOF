/**
 * Chess API Service
 * 
 * Service layer for interacting with chess-related backend endpoints.
 * Handles all API calls for puzzles, analysis, repertoire, and progress.
 */

import type {
  ChessPuzzle,
  ChessPuzzleAttempt,
  ChessOpeningRepertoire,
  ChessUserProgress,
  PuzzleFilters,
  PuzzleAttemptRequest,
  PuzzleAttemptResponse,
  HintResponse,
  PositionAnalysisRequest,
  PositionAnalysisResponse,
  GameAnalysisRequest,
  GameAnalysisResponse,
  MoveValidationRequest,
  MoveValidationResponse,
  ThemeStats,
} from '../types/chess';

const API_BASE = '/api/chess';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Makes an API request with credentials
 */
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Builds query string from parameters
 */
function buildQueryString(params: Record<string, any>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });
  return query.toString();
}

// ============================================================================
// Puzzle API
// ============================================================================

export const puzzleApi = {
  /**
   * Fetch random puzzles based on filters
   */
  async getRandom(filters: PuzzleFilters = {}): Promise<ChessPuzzle[]> {
    const query = buildQueryString(filters);
    const data = await apiRequest<{ puzzles: ChessPuzzle[] }>(
      `${API_BASE}/puzzles/random?${query}`
    );
    return data.puzzles;
  },

  /**
   * Fetch puzzles for a specific topic
   */
  async getByTopic(topicSlug: string): Promise<ChessPuzzle[]> {
    const data = await apiRequest<{ puzzles: ChessPuzzle[] }>(
      `${API_BASE}/puzzles/${topicSlug}`
    );
    return data.puzzles;
  },

  /**
   * Submit a puzzle attempt
   */
  async submitAttempt(
    puzzleId: string,
    attempt: PuzzleAttemptRequest
  ): Promise<PuzzleAttemptResponse> {
    return apiRequest<PuzzleAttemptResponse>(
      `${API_BASE}/puzzles/${puzzleId}/attempt`,
      {
        method: 'POST',
        body: JSON.stringify(attempt),
      }
    );
  },

  /**
   * Get a hint for a puzzle
   */
  async getHint(puzzleId: string, level: number = 1): Promise<HintResponse> {
    return apiRequest<HintResponse>(
      `${API_BASE}/puzzles/${puzzleId}/hint?level=${level}`
    );
  },
};

// ============================================================================
// Analysis API
// ============================================================================

export const analysisApi = {
  /**
   * Analyze a chess position
   */
  async analyzePosition(
    request: PositionAnalysisRequest
  ): Promise<PositionAnalysisResponse> {
    return apiRequest<PositionAnalysisResponse>(
      `${API_BASE}/analyze/position`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  },

  /**
   * Analyze a complete game
   */
  async analyzeGame(
    request: GameAnalysisRequest
  ): Promise<GameAnalysisResponse> {
    return apiRequest<GameAnalysisResponse>(`${API_BASE}/analyze/game`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Validate if a move is legal
   */
  async validateMove(
    request: MoveValidationRequest
  ): Promise<MoveValidationResponse> {
    return apiRequest<MoveValidationResponse>(`${API_BASE}/validate/move`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },
};

// ============================================================================
// Opening Repertoire API
// ============================================================================

export const repertoireApi = {
  /**
   * Get user's opening repertoire
   */
  async getAll(): Promise<ChessOpeningRepertoire[]> {
    const data = await apiRequest<{ repertoire: ChessOpeningRepertoire[] }>(
      `${API_BASE}/repertoire`
    );
    return data.repertoire;
  },

  /**
   * Create a new opening in repertoire
   */
  async create(
    opening: Partial<ChessOpeningRepertoire>
  ): Promise<ChessOpeningRepertoire> {
    const data = await apiRequest<{ opening: ChessOpeningRepertoire }>(
      `${API_BASE}/repertoire`,
      {
        method: 'POST',
        body: JSON.stringify(opening),
      }
    );
    return data.opening;
  },

  /**
   * Update an existing opening
   */
  async update(
    id: string,
    updates: Partial<ChessOpeningRepertoire>
  ): Promise<ChessOpeningRepertoire> {
    const data = await apiRequest<{ opening: ChessOpeningRepertoire }>(
      `${API_BASE}/repertoire/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
    return data.opening;
  },

  /**
   * Delete an opening from repertoire
   */
  async delete(id: string): Promise<void> {
    await apiRequest<{ success: boolean }>(`${API_BASE}/repertoire/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// Progress API
// ============================================================================

export const progressApi = {
  /**
   * Get user's overall chess progress
   */
  async getOverall(): Promise<ChessUserProgress> {
    const data = await apiRequest<{ progress: ChessUserProgress }>(
      `${API_BASE}/progress`
    );
    return data.progress;
  },

  /**
   * Get progress breakdown by tactical theme
   */
  async getByTheme(): Promise<ThemeStats[]> {
    const data = await apiRequest<{ themes: ThemeStats[] }>(
      `${API_BASE}/progress/themes`
    );
    return data.themes;
  },

  /**
   * Get recent puzzle attempt history
   */
  async getHistory(limit: number = 20): Promise<ChessPuzzleAttempt[]> {
    const data = await apiRequest<{ attempts: ChessPuzzleAttempt[] }>(
      `${API_BASE}/progress/history?limit=${limit}`
    );
    return data.attempts;
  },
};

export const curriculumApi = {
  async create(level: 'beginner' | 'intermediate' | 'advanced') {
    const data = await apiRequest<{ path: any; source: string }>(`${API_BASE}/curriculum`, {
      method: 'POST',
      body: JSON.stringify({ level }),
    });
    return data;
  },
};

// ============================================================================
// Challenge API
// ============================================================================

export const challengeApi = {
  /**
   * Start a chess challenge
   */
  async start(challengeId: string): Promise<{ attempt: any; resumed: boolean }> {
    return apiRequest<{ attempt: any; resumed: boolean }>(
      `${API_BASE}/challenge/start`,
      {
        method: 'POST',
        body: JSON.stringify({ challengeId }),
      }
    );
  },

  /**
   * Submit a challenge solution
   */
  async submit(attemptId: string, solution: any): Promise<any> {
    return apiRequest(`${API_BASE}/challenge/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify(solution),
    });
  },
};

// ============================================================================
// Combined Export
// ============================================================================

const chessService = {
  puzzles: puzzleApi,
  analysis: analysisApi,
  repertoire: repertoireApi,
  progress: progressApi,
  challenges: challengeApi,
};

export default chessService;

// ============================================================================
// React Query / SWR Keys (for caching)
// ============================================================================

export const chessQueryKeys = {
  puzzles: {
    all: ['chess', 'puzzles'] as const,
    random: (filters: PuzzleFilters) => ['chess', 'puzzles', 'random', filters] as const,
    byTopic: (topicSlug: string) => ['chess', 'puzzles', 'topic', topicSlug] as const,
  },
  analysis: {
    position: (fen: string) => ['chess', 'analysis', 'position', fen] as const,
    game: (pgn: string) => ['chess', 'analysis', 'game', pgn] as const,
  },
  repertoire: {
    all: ['chess', 'repertoire'] as const,
    detail: (id: string) => ['chess', 'repertoire', id] as const,
  },
  progress: {
    overall: ['chess', 'progress'] as const,
    themes: ['chess', 'progress', 'themes'] as const,
    history: (limit: number) => ['chess', 'progress', 'history', limit] as const,
  },
};

// ============================================================================
// Error Handling Utilities
// ============================================================================

export class ChessApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ChessApiError';
  }
}

export function isChessApiError(error: unknown): error is ChessApiError {
  return error instanceof ChessApiError;
}

export function handleChessApiError(error: unknown): string {
  if (isChessApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
