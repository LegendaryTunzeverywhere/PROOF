/**
 * Chess Types and Interfaces
 * 
 * TypeScript definitions for chess-related data structures
 * matching the backend API and database schema.
 */

// ============================================================================
// Enums
// ============================================================================

export type ChessDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ChessTheme =
  | 'pin'
  | 'fork'
  | 'skewer'
  | 'discovery'
  | 'deflection'
  | 'decoy'
  | 'greek-gift'
  | 'zwischenzug'
  | 'windmill'
  | 'smothered-mate'
  | 'back-rank'
  | 'double-attack'
  | 'general';

export type ChessPositionType = 'puzzle' | 'opening' | 'endgame' | 'middlegame';

export type ChessColor = 'white' | 'black';

export type ChessStatus = 'solving' | 'correct' | 'incorrect' | 'timeout';

// ============================================================================
// Core Data Structures
// ============================================================================

export interface ChessPosition {
  id: string;
  fen: string;
  type: ChessPositionType;
  sideToMove: ChessColor;
  evaluation?: number;
  description?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}

export interface ChessPuzzle {
  id: string;
  positionId: string;
  title: string;
  difficulty: ChessDifficulty;
  themes: ChessTheme[];
  solution: string[]; // Array of moves in algebraic notation
  solutionExplanation: string;
  hints: string[];
  rating: number;
  popularity: number;
  topicSlug: string;
  createdAt?: string;
  // Related data
  position?: ChessPosition;
}

export interface ChessPuzzleAttempt {
  id: string;
  userId: string;
  puzzleId: string;
  moves: string[];
  correct: boolean;
  hintsUsed: number;
  timeSpentMs: number;
  score: number;
  createdAt: string;
  // Related data
  puzzle?: ChessPuzzle;
}

export interface ChessOpeningRepertoire {
  id: string;
  userId: string;
  name: string;
  color: ChessColor;
  eco: string | null; // ECO code (e.g., "B90")
  moves: string[];
  notes: string;
  timesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  accuracy: number;
  lastPracticed: string;
  createdAt?: string;
}

export interface ChessGameAnalysis {
  id: string;
  userId: string;
  pgn: string;
  players: {
    white: string;
    black: string;
  };
  result: string;
  analysis: GameAnalysisData;
  notes: string;
  topicSlug: string | null;
  createdAt: string;
}

export interface GameAnalysisData {
  moves: AnalyzedMove[];
  mistakes: MoveClassification[];
  blunders: MoveClassification[];
  inaccuracies: MoveClassification[];
  goodMoves: MoveClassification[];
  bestMoves: MoveClassification[];
  accuracy: {
    white: number;
    black: number;
  };
}

export interface AnalyzedMove {
  moveNumber: number;
  move: string;
  fen: string;
  evaluation: number;
  bestMove: string;
  classification: 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  evalDrop: number;
}

export interface MoveClassification {
  moveNumber: number;
  move: string;
  evalDrop?: number;
}

export interface ChessUserProgress {
  id: string;
  userId: string;
  puzzleRating: number;
  puzzlesSolved: number;
  averageAccuracy: number;
  strongThemes: ChessTheme[];
  weakThemes: ChessTheme[];
  currentStreak: number;
  bestStreak: number;
  totalTimeSpentMs: number;
  lastSolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface PuzzleFilters {
  difficulty?: ChessDifficulty;
  theme?: ChessTheme;
  limit?: number;
  topicSlug?: string;
}

export interface PuzzleAttemptRequest {
  moves: string[];
  timeSpentMs: number;
  hintsUsed: number;
}

export interface PuzzleAttemptResponse {
  attempt: ChessPuzzleAttempt;
  correct: boolean;
  score: number;
  ratingDelta?: number;
  previousRating?: number;
  newRating?: number;
  reward?: { amountNim: number } | null;
  rewardReason?: string | null;
  xpGained?: number;
  leveledUp?: boolean;
  newLevel?: number | null;
  streak?: { current: number; longest: number; lastDay: string | null; emoji?: string; atRisk?: boolean };
  newAchievements?: Array<{ id: string; name: string; desc: string; emoji: string }>;
}

export interface HintResponse {
  hint: string;
  hasMore: boolean;
  bestMove?: string | null;
}

export interface PositionAnalysisRequest {
  fen: string;
  depth?: number;
}

export interface PositionAnalysisResponse {
  evaluation: {
    score: number;
    mate: number | null;
    bestMove: string;
    pv: string[];
    depth: number;
    fen: string;
  };
  hints: {
    bestMove: string;
    evaluation: number;
    threats: string[];
    tactics: string[];
  };
}

export interface GameAnalysisRequest {
  pgn: string;
  topicSlug?: string;
}

export interface GameAnalysisResponse {
  analysis: GameAnalysisData;
  analysisId: string;
}

export interface MoveValidationRequest {
  fen: string;
  move: string;
}

export interface MoveValidationResponse {
  legal: boolean;
  newFen?: string;
  move?: any;
  error?: string;
}

export interface ThemeStats {
  theme: ChessTheme;
  total: number;
  correct: number;
  accuracy: number;
}

// ============================================================================
// Component Props
// ============================================================================

export interface ChessBoardProps {
  initialFen?: string;
  onMove?: (move: any, newFen: string) => void;
  orientation?: ChessColor;
  playerColor?: ChessColor;
  highlightSquares?: string[];
  disabled?: boolean;
  showCoordinates?: boolean;
  animationDuration?: number;
  theme?: ChessBoardTheme;
  showTurnPrompt?: boolean;
}

export type ChessBoardTheme =
  | 'classic'
  | 'blue'
  | 'green'
  | 'purple'
  | 'red'
  | 'gray'
  | 'ocean'
  | 'wood'
  | 'ice'
  | 'coral'
  | 'emerald'
  | 'amber'
  | 'tournament'
  | 'neon'
  | 'marble';

export interface PuzzleSolverProps {
  puzzle: ChessPuzzle;
  onComplete?: (result: PuzzleAttemptResponse) => void;
  onGiveUp?: () => void;
  onRetry?: () => void;
  onNext?: () => void;
}

export interface PositionAnalyzerProps {
  initialFen?: string;
  onAnalysisComplete?: (analysis: PositionAnalysisResponse) => void;
}

export interface ProgressDashboardProps {
  userId?: string;
}

export interface RepertoireManagerProps {
  userId?: string;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface PuzzleState {
  puzzle: ChessPuzzle | null;
  currentMoves: string[];
  hintsUsed: number;
  hintsShown: string[];
  status: ChessStatus;
  feedback: string;
  startTime: number;
  loading: boolean;
  error: string | null;
}

export interface AnalysisState {
  fen: string;
  analysis: PositionAnalysisResponse | null;
  loading: boolean;
  error: string | null;
}

export interface ProgressState {
  progress: ChessUserProgress | null;
  themes: ThemeStats[];
  history: ChessPuzzleAttempt[];
  loading: boolean;
  error: string | null;
}

export interface RepertoireState {
  repertoire: ChessOpeningRepertoire[];
  selectedOpening: ChessOpeningRepertoire | null;
  isCreating: boolean;
  isEditing: boolean;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface Square {
  file: number;
  rank: number;
  square: string;
}

export interface Move {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
  san?: string;
  lan?: string;
  before?: string;
  after?: string;
  piece?: string;
  captured?: string;
  flags?: string;
}

export interface ChessGame {
  fen: string;
  turn: ChessColor;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
  history: string[];
  moves: string[];
}

// ============================================================================
// Constants
// ============================================================================

export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const DIFFICULTY_COLORS: Record<ChessDifficulty, string> = {
  beginner: '#4ade80',
  intermediate: '#fbbf24',
  advanced: '#ef4444',
};

export const DIFFICULTY_LABELS: Record<ChessDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const THEME_LABELS: Record<ChessTheme, string> = {
  pin: 'Pin',
  fork: 'Fork',
  skewer: 'Skewer',
  discovery: 'Discovered Attack',
  deflection: 'Deflection',
  decoy: 'Decoy',
  'greek-gift': 'Greek Gift',
  zwischenzug: 'Zwischenzug',
  windmill: 'Windmill',
  'smothered-mate': 'Smothered Mate',
  'back-rank': 'Back Rank',
  'double-attack': 'Double Attack',
  general: 'General',
};

export const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};
