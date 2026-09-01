-- ============================================================
-- PROOF Complete Database Schema for Supabase
-- Includes: Core tables + Learn Anything features
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
DO $$ BEGIN
  CREATE TYPE "WalletMode" AS ENUM ('nimiqpay', 'demo');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AttemptStatus" AS ENUM ('in_progress', 'passed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ChallengeKind" AS ENUM ('checkpoint', 'project', 'final', 'daily', 'sponsored');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TxStatus" AS ENUM ('pending', 'confirmed', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TxKind" AS ENUM ('reward', 'payout', 'tip', 'task_escrow', 'task_payment', 'session_payment', 'platform_fee', 'sponsor_funding');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'accepted', 'rejected', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- User table (core)
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY DEFAULT ('usr_' || substr(md5(random()::text), 1, 12)),
  "walletAddress" TEXT UNIQUE,
  "walletMode" "WalletMode",
  "publicKey" TEXT,
  username TEXT UNIQUE NOT NULL,
  "usernameLower" TEXT,
  avatar TEXT DEFAULT '🙂',
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  reputation INT DEFAULT 50,
  "balanceLuna" BIGINT DEFAULT 0,
  "earnedLuna" BIGINT DEFAULT 0,
  "proofsPassed" INT DEFAULT 0,
  "proofsAttempted" INT DEFAULT 0,
  streak JSONB DEFAULT '{"current": 0, "longest": 0, "lastDay": null}',
  "isDemo" BOOLEAN DEFAULT false,
  prefs JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Skill table
CREATE TABLE IF NOT EXISTS "Skill" (
  id TEXT PRIMARY KEY DEFAULT ('skl_' || substr(md5(random()::text), 1, 12)),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  emoji TEXT DEFAULT '📚',
  blurb TEXT DEFAULT '',
  popularity INT DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- UserSkill table (many-to-many)
CREATE TABLE IF NOT EXISTS "UserSkill" (
  id TEXT PRIMARY KEY DEFAULT ('usk_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "skillId" TEXT NOT NULL REFERENCES "Skill"(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  tier TEXT DEFAULT 'Novice',
  xp INT DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  "verifiedScore" INT DEFAULT 0,
  "verifiedAt" TIMESTAMP,
  proofs INT DEFAULT 0,
  passed INT DEFAULT 0,
  UNIQUE("userId", "skillId")
);

-- LearningPath table
CREATE TABLE IF NOT EXISTS "LearningPath" (
  id TEXT PRIMARY KEY DEFAULT ('pth_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  "skillSlug" TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  level TEXT NOT NULL,
  "minutesPerDay" INT NOT NULL,
  days JSONB NOT NULL,
  progress JSONB DEFAULT '{}',
  engine TEXT DEFAULT 'proof-engine',
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Challenge table
CREATE TABLE IF NOT EXISTS "Challenge" (
  id TEXT PRIMARY KEY DEFAULT ('chl_' || substr(md5(random()::text), 1, 12)),
  "skillSlug" TEXT,
  "pathId" TEXT REFERENCES "LearningPath"(id) ON DELETE CASCADE,
  "dayIndex" INT,
  kind "ChallengeKind" DEFAULT 'checkpoint',
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  brief TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  "timeMin" INT DEFAULT 30,
  "passScore" INT DEFAULT 70,
  "rewardLuna" BIGINT DEFAULT 0,
  xp INT DEFAULT 100,
  evaluator JSONB NOT NULL,
  "dailyKey" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- ChallengeAttempt table
CREATE TABLE IF NOT EXISTS "ChallengeAttempt" (
  id TEXT PRIMARY KEY DEFAULT ('att_' || substr(md5(random()::text), 1, 12)),
  "challengeId" TEXT NOT NULL REFERENCES "Challenge"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  status "AttemptStatus" DEFAULT 'in_progress',
  "startedAt" TIMESTAMP DEFAULT NOW(),
  "submittedAt" TIMESTAMP,
  score INT,
  "evaluationId" TEXT,
  "rewardClaimed" BOOLEAN DEFAULT false,
  duplicate BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS "idx_attempt_user_challenge" ON "ChallengeAttempt"("userId", "challengeId", "submittedAt");

-- Submission table
CREATE TABLE IF NOT EXISTS "Submission" (
  id TEXT PRIMARY KEY DEFAULT ('sub_' || substr(md5(random()::text), 1, 12)),
  "attemptId" TEXT UNIQUE NOT NULL REFERENCES "ChallengeAttempt"(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Evaluation table
CREATE TABLE IF NOT EXISTS "Evaluation" (
  id TEXT PRIMARY KEY DEFAULT ('ev_' || substr(md5(random()::text), 1, 12)),
  "attemptId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  score INT NOT NULL,
  pass BOOLEAN NOT NULL,
  "passScore" INT NOT NULL,
  criteria JSONB NOT NULL,
  strengths TEXT[] DEFAULT '{}',
  improvements TEXT[] DEFAULT '{}',
  "nextStep" TEXT NOT NULL,
  engine TEXT NOT NULL,
  "contentHash" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_eval_user_challenge" ON "Evaluation"("userId", "challengeId", "contentHash");

-- SkillProof table (verified achievements)
CREATE TABLE IF NOT EXISTS "SkillProof" (
  id TEXT PRIMARY KEY DEFAULT ('prf_' || substr(md5(random()::text), 1, 12)),
  "publicId" TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "skillSlug" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "challengeTitle" TEXT NOT NULL,
  kind TEXT NOT NULL,
  score INT NOT NULL,
  passed BOOLEAN NOT NULL,
  "completedAt" TIMESTAMP DEFAULT NOW()
);

-- Achievement tables
CREATE TABLE IF NOT EXISTS "Achievement" (
  id TEXT PRIMARY KEY DEFAULT ('ach_' || substr(md5(random()::text), 1, 12)),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  "desc" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "UserAchievement" (
  id TEXT PRIMARY KEY DEFAULT ('uac_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "achievementId" TEXT NOT NULL REFERENCES "Achievement"(id) ON DELETE CASCADE,
  "unlockedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("userId", "achievementId")
);

-- Reward table
CREATE TABLE IF NOT EXISTS "Reward" (
  id TEXT PRIMARY KEY DEFAULT ('rwd_' || substr(md5(random()::text), 1, 12)),
  key TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "challengeId" TEXT NOT NULL,
  "sourceKind" TEXT NOT NULL,
  "amountLuna" BIGINT NOT NULL,
  currency TEXT DEFAULT 'NIM',
  status TEXT DEFAULT 'credited',
  "transactionId" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- WalletTransaction table (blockchain txs)
CREATE TABLE IF NOT EXISTS "WalletTransaction" (
  id TEXT PRIMARY KEY DEFAULT ('tx_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  kind "TxKind" NOT NULL,
  direction TEXT NOT NULL,
  "amountLuna" BIGINT NOT NULL,
  status "TxStatus" DEFAULT 'pending',
  network TEXT DEFAULT 'demo-ledger',
  ref TEXT,
  note TEXT NOT NULL,
  meta JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "confirmedAt" TIMESTAMP
);

-- Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
  id TEXT PRIMARY KEY DEFAULT ('not_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  emoji TEXT DEFAULT '🔔',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT,
  read BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- SponsoredChallenge table
CREATE TABLE IF NOT EXISTS "SponsoredChallenge" (
  id TEXT PRIMARY KEY DEFAULT ('spc_' || substr(md5(random()::text), 1, 12)),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  "skillSlug" TEXT NOT NULL,
  sponsor TEXT NOT NULL,
  "poolLuna" BIGINT NOT NULL,
  "topLuna" BIGINT NOT NULL,
  "qualifiedLuna" BIGINT NOT NULL,
  participants INT DEFAULT 0,
  "endsInDays" INT DEFAULT 14
);

-- SponsoredParticipant table
CREATE TABLE IF NOT EXISTS "SponsoredParticipant" (
  id TEXT PRIMARY KEY DEFAULT ('spp_' || substr(md5(random()::text), 1, 12)),
  key TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL,
  "sponsoredId" TEXT NOT NULL REFERENCES "SponsoredChallenge"(id) ON DELETE CASCADE,
  "joinedAt" TIMESTAMP DEFAULT NOW()
);

-- MarketplaceTask table
CREATE TABLE IF NOT EXISTS "MarketplaceTask" (
  id TEXT PRIMARY KEY DEFAULT ('mkt_' || substr(md5(random()::text), 1, 12)),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  "budgetLuna" BIGINT NOT NULL,
  "minProof" JSONB,
  "minProofSkill" TEXT,
  "minProofMin" INT,
  "clientId" TEXT,
  status TEXT DEFAULT 'open',
  "autoAccept" BOOLEAN DEFAULT false,
  "escrowTxId" TEXT,
  "postedAt" TIMESTAMP DEFAULT NOW()
);

-- TaskApplication table
CREATE TABLE IF NOT EXISTS "TaskApplication" (
  id TEXT PRIMARY KEY DEFAULT ('app_' || substr(md5(random()::text), 1, 12)),
  "taskId" TEXT NOT NULL REFERENCES "MarketplaceTask"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  pitch TEXT NOT NULL,
  status "ApplicationStatus" DEFAULT 'pending',
  "appliedAt" TIMESTAMP DEFAULT NOW(),
  "respondedAt" TIMESTAMP,
  UNIQUE("taskId", "userId")
);

-- TeachingSession table
CREATE TABLE IF NOT EXISTS "TeachingSession" (
  id TEXT PRIMARY KEY DEFAULT ('tch_' || substr(md5(random()::text), 1, 12)),
  "teacherId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "skillSlug" TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  "durationMin" INT NOT NULL,
  "priceLuna" BIGINT NOT NULL,
  "maxStudents" INT DEFAULT 5,
  bookings INT DEFAULT 0,
  "ratingSum" INT DEFAULT 0,
  "ratingCount" INT DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Booking table
CREATE TABLE IF NOT EXISTS "Booking" (
  id TEXT PRIMARY KEY DEFAULT ('bkg_' || substr(md5(random()::text), 1, 12)),
  "sessionId" TEXT NOT NULL REFERENCES "TeachingSession"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "txId" TEXT,
  "bookedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("sessionId", "userId")
);

-- Review table
CREATE TABLE IF NOT EXISTS "Review" (
  id TEXT PRIMARY KEY DEFAULT ('rev_' || substr(md5(random()::text), 1, 12)),
  "sessionId" TEXT NOT NULL REFERENCES "TeachingSession"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "revieweeId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  rating INT NOT NULL,
  text TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("sessionId", "userId")
);

-- Auth tables (sessions and nonces)
CREATE TABLE IF NOT EXISTS "sessions" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "bootTime" BIGINT NOT NULL,
  "expiresAt" BIGINT NOT NULL,
  entropy TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "nonces" (
  id TEXT PRIMARY KEY,
  nonce TEXT UNIQUE NOT NULL,
  message TEXT NOT NULL,
  subject TEXT,
  used BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_nonces_nonce" ON "nonces"(nonce) WHERE used = false;
CREATE INDEX IF NOT EXISTS "idx_sessions_user" ON "sessions"("userId");

-- ============================================================
-- SOCRATIC TEACHING TABLES
-- ============================================================

-- Socratic Sessions
CREATE TABLE IF NOT EXISTS "socratic_sessions" (
  id TEXT PRIMARY KEY DEFAULT ('soc_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  "topicSlug" TEXT NOT NULL,
  "topicTitle" TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  "readinessScore" INT,
  "startedAt" TIMESTAMP DEFAULT NOW(),
  "completedAt" TIMESTAMP,
  context JSONB DEFAULT '{}'
);

-- User Glossary
CREATE TABLE IF NOT EXISTS "user_glossary" (
  id TEXT PRIMARY KEY DEFAULT ('gloss_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  level TEXT NOT NULL,
  source TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- LEARN ANYTHING FEATURES
-- ============================================================

-- Review Schedule (Spaced Repetition)
CREATE TABLE IF NOT EXISTS "ReviewSchedule" (
  id TEXT PRIMARY KEY DEFAULT ('rev_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "topicSlug" TEXT NOT NULL,
  "topicTitle" TEXT NOT NULL,
  "skillSlug" TEXT NOT NULL,
  repetitions INT DEFAULT 0,
  "easeFactor" REAL DEFAULT 2.5,
  interval INT DEFAULT 1,
  "nextReviewAt" TIMESTAMP NOT NULL,
  "lastQuality" INT,
  "lastReviewedAt" TIMESTAMP,
  suspended BOOLEAN DEFAULT false,
  "suspendedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_review_schedule_user_next" ON "ReviewSchedule"("userId", "nextReviewAt");
CREATE INDEX IF NOT EXISTS "idx_review_schedule_user_topic" ON "ReviewSchedule"("userId", "topicSlug");

-- Learning Sessions
CREATE TABLE IF NOT EXISTS "LearningSession" (
  id TEXT PRIMARY KEY DEFAULT ('ls_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "topicSlug" TEXT NOT NULL,
  "skillSlug" TEXT NOT NULL,
  "sessionType" TEXT NOT NULL,
  depth INT DEFAULT 0,
  "durationSeconds" INT,
  notes TEXT,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_learning_session_user_created" ON "LearningSession"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_learning_session_user_topic" ON "LearningSession"("userId", "topicSlug");

-- User Stats (Streaks, Totals)
CREATE TABLE IF NOT EXISTS "UserStats" (
  "userId" TEXT PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,
  "currentStreak" INT DEFAULT 0,
  "longestStreak" INT DEFAULT 0,
  "lastActivityDate" TEXT,
  "totalLearningMinutes" INT DEFAULT 0,
  "totalReviewsDone" INT DEFAULT 0,
  "totalLessonsCompleted" INT DEFAULT 0,
  "totalPracticesCompleted" INT DEFAULT 0,
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Learning Goals
CREATE TABLE IF NOT EXISTS "LearningGoal" (
  id TEXT PRIMARY KEY DEFAULT ('goal_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "goalType" TEXT NOT NULL,
  "targetValue" INT NOT NULL,
  "currentValue" INT DEFAULT 0,
  period TEXT NOT NULL,
  "startsAt" TIMESTAMP NOT NULL,
  "endsAt" TIMESTAMP NOT NULL,
  completed BOOLEAN DEFAULT false,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_learning_goal_user_ends" ON "LearningGoal"("userId", "endsAt");
CREATE INDEX IF NOT EXISTS "idx_learning_goal_user_completed" ON "LearningGoal"("userId", completed);

-- Mastery Badges
CREATE TABLE IF NOT EXISTS "MasteryBadge" (
  id TEXT PRIMARY KEY DEFAULT ('badge_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "skillSlug" TEXT NOT NULL,
  "topicSlug" TEXT,
  "badgeType" TEXT NOT NULL,
  level TEXT NOT NULL,
  "masteryScore" REAL NOT NULL,
  criteria TEXT NOT NULL,
  "earnedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_mastery_badge_user" ON "MasteryBadge"("userId");
CREATE INDEX IF NOT EXISTS "idx_mastery_badge_user_skill" ON "MasteryBadge"("userId", "skillSlug");

-- Exercise Attempts
CREATE TABLE IF NOT EXISTS "ExerciseAttempt" (
  id TEXT PRIMARY KEY DEFAULT ('ex_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "exerciseId" TEXT NOT NULL,
  "topicSlug" TEXT NOT NULL,
  "skillSlug" TEXT NOT NULL,
  code TEXT NOT NULL,
  "testsPassed" INT NOT NULL,
  "testsTotal" INT NOT NULL,
  completed BOOLEAN DEFAULT false,
  "timeSpentSeconds" INT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_exercise_attempt_user_exercise" ON "ExerciseAttempt"("userId", "exerciseId");

-- Quiz Results
CREATE TABLE IF NOT EXISTS "QuizResult" (
  id TEXT PRIMARY KEY DEFAULT ('quiz_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "quizId" TEXT NOT NULL,
  "topicSlug" TEXT NOT NULL,
  "skillSlug" TEXT NOT NULL,
  score INT NOT NULL,
  total INT NOT NULL,
  answers TEXT NOT NULL,
  "timeTakenSeconds" INT,
  difficulty TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_quiz_result_user_topic" ON "QuizResult"("userId", "topicSlug");

-- Knowledge Nodes
CREATE TABLE IF NOT EXISTS "KnowledgeNode" (
  id TEXT PRIMARY KEY DEFAULT ('node_' || substr(md5(random()::text), 1, 12)),
  "skillSlug" TEXT NOT NULL,
  "topicSlug" TEXT NOT NULL,
  title TEXT NOT NULL,
  level INT NOT NULL,
  prerequisites TEXT,
  "estimatedMinutes" INT NOT NULL,
  category TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("skillSlug", "topicSlug")
);

CREATE INDEX IF NOT EXISTS "idx_knowledge_node_skill" ON "KnowledgeNode"("skillSlug");

-- User Mastery
CREATE TABLE IF NOT EXISTS "UserMastery" (
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "nodeId" TEXT NOT NULL REFERENCES "KnowledgeNode"(id) ON DELETE CASCADE,
  "masteryScore" REAL DEFAULT 0,
  attempts INT DEFAULT 0,
  "lastPracticedAt" TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY ("userId", "nodeId")
);

CREATE INDEX IF NOT EXISTS "idx_user_mastery_user_score" ON "UserMastery"("userId", "masteryScore");

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS "idx_user_wallet" ON "User"("walletAddress") WHERE "walletAddress" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_user_demo" ON "User"("isDemo", "earnedLuna") WHERE "isDemo" = false;
CREATE INDEX IF NOT EXISTS "idx_proof_user" ON "SkillProof"("userId", "completedAt");
CREATE INDEX IF NOT EXISTS "idx_glossary_user" ON "user_glossary"("userId");

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SkillProof" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WalletTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "socratic_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_glossary" ENABLE ROW LEVEL SECURITY;

-- Public leaderboard policy
DROP POLICY IF EXISTS "Public leaderboard" ON "User";
CREATE POLICY "Public leaderboard" ON "User"
FOR SELECT USING ("isDemo" = false);

-- Users can read their own data
DROP POLICY IF EXISTS "Users read own data" ON "User";
CREATE POLICY "Users read own data" ON "User"
FOR SELECT USING (true);

-- Users can read their own proofs
DROP POLICY IF EXISTS "Users read own proofs" ON "SkillProof";
CREATE POLICY "Users read own proofs" ON "SkillProof"
FOR SELECT USING (true);

-- Users can read their own transactions
DROP POLICY IF EXISTS "Users read own transactions" ON "WalletTransaction";
CREATE POLICY "Users read own transactions" ON "WalletTransaction"
FOR SELECT USING (true);

-- Users can manage their own sessions
DROP POLICY IF EXISTS "Users manage own sessions" ON "socratic_sessions";
CREATE POLICY "Users manage own sessions" ON "socratic_sessions"
FOR ALL USING (true);

-- Users can manage their own glossary
DROP POLICY IF EXISTS "Users manage own glossary" ON "user_glossary";
CREATE POLICY "Users manage own glossary" ON "user_glossary"
FOR ALL USING (true);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_glossary_updated_at ON "user_glossary";
CREATE TRIGGER update_glossary_updated_at BEFORE UPDATE ON "user_glossary"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Complete migration successful! ✅' as status;
