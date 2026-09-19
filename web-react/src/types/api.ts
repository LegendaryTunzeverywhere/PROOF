/**
 * TypeScript types for PROOF API responses
 * Matches the backend data structures
 */

export interface User {
  id: string;
  username: string;
  avatar: string;
  level: number;
  xp: number;
  xpEarned?: number;
  totalXpEarned?: number;
  reputation: number;
  balanceNim: number;
  ledgerBalanceNim?: number;
  walletBalanceNim?: number;
  earnedNim: number;
  unreadNotifications?: number;
  verifiedSkillCount?: number;
  wallet: {
    mode: 'demo' | 'nimiqpay' | 'hub' | 'none';
    address?: string;
    connected: boolean;
  };
  walletAccounts?: string[];
  streak: {
    current: number;
    longest: number;
    emoji: string;
    atRisk: boolean;
  };
  prefs?: {
    goal?: string;
    level?: string;
    minutesPerDay?: number;
    style?: string;
    interests?: string[];
    theme?: 'light' | 'dark' | 'system';
    language?: 'en' | 'es' | 'fr' | 'pt' | 'de' | 'zh';
  };
  proofsPassed?: number;
  walletModeIsDemo: boolean;
  recentTransactions?: Transaction[];
}

export interface Transaction {
  id: string;
  kind: string;
  direction: 'credit' | 'debit';
  amountNim: number;
  status: string;
  note?: string;
  ref?: string | null;
  createdAt: number | string;
}

export interface Skill {
  skillSlug: string;
  name: string;
  score: number;
  verified: boolean;
  tier?: string;
  proofCount?: number;
}

export interface SkillCatalog {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
  popularity?: number;
  learners?: number;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  goal: string;
  skillSlug: string;
  skillName: string;
  skillEmoji: string;
  level: string;
  minutesPerDay: number;
  totalXp: number;
  rewardNim: number;
  days: PathDay[];
  percent: number;
  createdAt: number;
  engine?: string;
}

export interface PathDay {
  index: number;
  day: number;
  title: string;
  estMin: number;
  xp: number;
  rewardNim: number;
  kind: string;
  items: PathItem[];
}

export interface PathItem {
  title: string;
  topic: string;
  kind: 'study' | 'checkpoint' | 'project' | 'final';
  estMin?: number;
  rewardNim?: number;
  challengeId?: string;
  lessonDone?: boolean;
  practiceDone?: boolean;
  attempt?: Attempt | null;
}

export interface Challenge {
  id: string;
  skillSlug: string;
  title: string;
  description?: string;
  brief?: string;
  requirements?: string | string[];
  instructions?: string;
  rewardNim: number;
  rewardXp?: number;
  xp?: number;
  difficulty?: string;
  estimatedMinutes?: number;
  timeMin?: number;
  passScore?: number;
  kind?: string;
  type?: string;
  tags?: string[];
  submissionFields?: string[];
  chess?: {
    fen?: string;
    tasks?: string[];
    scenarios?: ChessChallengePosition[];
    positions?: ChessChallengePosition[];
    puzzles?: ChessChallengePosition[];
  } | null;
  speech?: {
    target: string;
    language: string;
  };
}

export interface ChessChallengePosition {
  name?: string;
  fen: string;
  task?: string;
  hint?: string;
  correctMoves?: string[];
  solution?: string[];
}

export interface Attempt {
  id: string;
  userId: string;
  challengeId: string;
  code: string;
  score: number;
  status: 'passed' | 'failed';
  feedback: string;
  submittedAt: number;
  timings?: any;
  reward?: {
    granted: boolean;
    amountNim?: number;
    reason?: string;
  };
}

export interface RewardResult {
  granted: boolean;
  amountNim?: number;
  reason?: string;
}

export interface DailyChallenge extends Challenge {
  done: boolean;
  passed: boolean;
}

export interface SponsoredChallenge {
  id: string;
  emoji: string;
  title: string;
  sponsor: string;
  skillSlug: string;
  poolNim: number;
  topNim: number;
  qualifiedNim: number;
  participants: number;
  description: string;
  endsInDays: number;
  joined: boolean;
}

export interface MarketplaceTask {
  id: string;
  title: string;
  client?: {
    username: string;
    avatar: string;
    reputation?: number;
  } | null;
  budgetNim: number;
  status: 'open' | 'assigned' | 'completed' | 'cancelled' | string;
  postedAt: string | number;
  applicants: number;
  applicationDetails?: Array<{
    id: string;
    userId: string;
    username: string;
    avatar: string;
    pitch: string;
    status: string;
    appliedAt: string | number;
  }>;
  minProof?: {
    skillSlug: string;
    min: number;
  } | null;
  tags?: string[];
  description: string;
}

export interface TeachingSession {
  id: string;
  teacherUsername: string;
  teacherAvatar: string;
  title: string;
  skillSlug: string;
  verified: number;
  rating: number;
  ratingCount: number;
  description: string;
  priceNim: number;
  duration: string;
  bookings: number;
  maxStudents: number;
  recentReview?: string | null;
}

export interface Notification {
  id: string;
  type: string;
  emoji: string;
  title: string;
  body: string;
  createdAt: number | string;
  read: boolean;
  href?: string;
}

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  body: string;
  type: string;
  createdAt: string | number;
  reward: string;
  unlocked?: boolean;
}

export interface RecentAchievement {
  id: string;
  title: string;
  detail?: string;
  xp: number;
  nim: number;
  completedAt: number;
  type: string;
}

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress?: number;
}

export interface LeaderboardEntry {
  userId?: string;
  rank: number;
  username: string;
  avatar: string;
  value: number;
  xp?: number;
  totalXpEarned?: number;
  streak?: number;
  walletMode?: string;
  address?: string;
  level?: number;
  reputation?: number;
}

export interface Review {
  id: string;
  topicSlug: string;
  topicTitle: string;
  skillSlug: string;
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReviewAt: number;
  lastQuality: number | null;
  lastReviewedAt: number | null;
  suspended: boolean;
  createdAt: number;
  updatedAt: number;
  // Enriched fields from backend
  question?: {
    q: string;
    choices: string[];
    answerIdx: number;
    why?: string;
  } | null;
  prompt?: string | null;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  level: 'beginner' | 'intermediate' | 'expert';
  source?: string | null;
}

export interface SocraticSession {
  id: string;
  type: 'pre_lesson' | 'checkpoint' | 'reflection' | 'wait_what' | 'deep_dive';
  status: 'active' | 'completed' | 'abandoned';
  topicTitle: string;
  responseCount: number;
  duration?: string;
  createdAt: number | string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  xp?: number;
  badge?: string;
  timeLimit?: string;
}

export interface SpacedRepetitionCard {
  id: string;
  topic: string;
  skillSlug: string;
  skillEmoji: string;
  repetitions: number;
  easeFactor: number;
  dueDate: string;
  overdue: boolean;
}

export interface TrendingProof {
  id: string;
  emoji: string;
  title: string;
  slug: string;
  learners: number;
  difficulty: string;
  rewardNim: number;
}

export interface RecommendedSkill {
  slug: string;
  name: string;
  emoji: string;
  reason: string;
}

// API Response types
export interface MeResponse {
  user: User | null;
  skills: Skill[];
  unread: number;
  opportunities: number;
}

export interface HomeResponse {
  user: User;
  continueLearning: LearningPath | null;
  mySkills: Skill[];
  daily: DailyChallenge;
  trending: SkillCatalog[];
  sponsored: SponsoredChallenge[];
  recommendedTasks: MarketplaceTask[];
  recommendedSkills: RecommendedSkill[];
  recentAchievements: RecentAchievement[];
  discovery: {
    topProofers: LeaderboardEntry[];
    newTasks: MarketplaceTask[];
    teachers: TeachingSession[];
  };
}

export interface AuthResponse {
  user: User;
  demo?: boolean;
}

export interface PathsResponse {
  paths: LearningPath[];
}

export interface CreatePathRequest {
  goal: string;
  domain?: string;
  level?: string;
  minutesPerDay?: number;
  style?: string;
}

export interface CreatePathResponse {
  path: LearningPath;
  generatedBy: string;
}

export interface ProgressUpdate {
  dayIndex: number;
  topicSlug: string;
  part: 'lesson' | 'practice';
}

export interface ProgressResponse {
  progress: Record<string, number>;
  percent: number;
  xpAwarded: number;
}
