/**
 * Seed — demo identities and content so PROOF never looks empty.
 * All demo users are fictional and flagged isDemo/isClient so the UI can
 * distinguish demo content from real user data (spec §65).
 */
import { uid, now, luna } from './util.js';
import { SKILLS } from './ai/kb.js';

const POPULARITY = {
  'web-development': 98, python: 92, 'ui-design': 84, ai: 88, marketing: 76,
  'data-analysis': 72, writing: 61, 'social-media': 70, business: 64,
  languages: 52, 'music-production': 44, 'practical-skills': 38,
};

export async function seed(store) {
  /* skills catalog (seedCatalog in SkillService will skip these) */
  for (const s of SKILLS) {
    store.insert('skills', { id: uid('sk'), ...s, popularity: POPULARITY[s.slug] || 40 });
  }

  const mkUser = (o) => store.insert('users', {
    id: uid('u'), usernameLower: o.username.toLowerCase(),
    walletMode: o.walletMode || null, walletAddress: o.walletAddress || null,
    publicKey: o.publicKey || null, isDemo: true, isClient: false,
    balanceLuna: 0, earnedLuna: 0, proofsAttempted: 0, proofsPassed: 0,
    streak: { current: 0, longest: 0, lastDay: null },
    prefs: { goal: '', level: '', minutesPerDay: 30, style: 'practical', interests: [] },
    createdAt: now() - (o.ageDays || 90) * 86400000,
    updatedAt: now(),
    ...o,
  });

  const tunz = mkUser({
    username: 'Tunz', avatar: '🦅', level: 12, xp: 7420, reputation: 91,
    proofsAttempted: 23, proofsPassed: 19, earnedLuna: luna(214.2), balanceLuna: luna(48.5),
    streak: { current: 12, longest: 21, lastDay: new Date().toISOString().slice(0, 10) },
    ageDays: 210,
  });
  const amara = mkUser({
    username: 'AmaraOkafor', avatar: '🦋', level: 10, xp: 4930, reputation: 88,
    proofsAttempted: 18, proofsPassed: 15, earnedLuna: luna(132.4), balanceLuna: luna(31.2),
    streak: { current: 6, longest: 15, lastDay: new Date().toISOString().slice(0, 10) },
    ageDays: 160,
  });
  const kofi = mkUser({
    username: 'KofiMensah', avatar: '🦁', level: 8, xp: 3010, reputation: 79,
    proofsAttempted: 12, proofsPassed: 10, earnedLuna: luna(78.9), balanceLuna: luna(12.4),
    streak: { current: 3, longest: 9, lastDay: new Date().toISOString().slice(0, 10) },
    ageDays: 120,
  });
  const lena = mkUser({
    username: 'LenaFischer', avatar: '🐙', level: 9, xp: 3920, reputation: 85,
    proofsAttempted: 15, proofsPassed: 13, earnedLuna: luna(102.7), balanceLuna: luna(22.8),
    streak: { current: 8, longest: 11, lastDay: new Date().toISOString().slice(0, 10) },
    ageDays: 140,
  });
  const diego = mkUser({
    username: 'DiegoRuiz', avatar: '🐬', level: 7, xp: 2260, reputation: 74,
    proofsAttempted: 11, proofsPassed: 8, earnedLuna: luna(41.3), balanceLuna: luna(6.1),
    streak: { current: 2, longest: 6, lastDay: new Date().toISOString().slice(0, 10) },
    ageDays: 100,
  });
  const priya = mkUser({
    username: 'PriyaSharma', avatar: '🦜', level: 9, xp: 4010, reputation: 83,
    proofsAttempted: 14, proofsPassed: 12, earnedLuna: luna(96.5), balanceLuna: luna(18.0),
    streak: { current: 5, longest: 10, lastDay: new Date().toISOString().slice(0, 10) },
    ageDays: 130,
  });

  // poster identities for marketplace (demo clients)
  for (const [name, avatar] of [['KickLayer', '👟'], ['Zoo Road Brews', '🍺'], ['SaveNest', '🐦'], ['Mama Nkechi Foods', '🍲'], ['SwiftDrop', '🚀'], ['Hajar Textiles', '🧵'], ['Bara Studio', '🛠️']]) {
    mkUser({ username: name, avatar, level: 1, xp: 0, reputation: 70, isClient: true, ageDays: 30 });
  }

  /* user skills + proofs */
  const mkSkill = (user, slug, score, proofs = [], opts = {}) => {
    const verified = score >= (opts.passThreshold ?? 70);
    store.insert('user_skills', {
      id: uid('us'), userId: user.id, skillSlug: slug,
      score, tier: score <= 20 ? 'Novice' : score <= 40 ? 'Beginner' : score <= 70 ? 'Intermediate' : score <= 90 ? 'Advanced' : 'Expert',
      xp: score * 40, verified, verifiedScore: verified ? score : 0, verifiedAt: verified ? now() - (opts.verifiedDaysAgo || 30) * 86400000 : null,
      proofs: proofs.length, passed: proofs.filter((p) => p.passed).length, updatedScoreAt: now(),
    });
    for (const p of proofs) {
      store.insert('skill_proofs', {
        id: uid('pf'), publicId: p.publicId || uid('pf').replace('pf_', ''),
        userId: user.id, skillSlug: slug, challengeId: 'seed', challengeTitle: p.title,
        kind: p.kind || 'proof', score: p.score, passed: p.passed,
        evaluationId: null, completedAt: now() - (p.daysAgo || 10) * 86400000,
      });
    }
  };

  mkSkill(tunz, 'web-development', 87, [
    { title: 'Build a responsive product landing page', score: 84, passed: true, kind: 'project', daysAgo: 60, publicId: 'tunz-landing-84' },
    { title: 'Final Skill Assessment: Full Landing Experience', score: 91, passed: true, kind: 'final', daysAgo: 42, publicId: 'tunz-final-91' },
    { title: 'Interactive page with JavaScript', score: 86, passed: true, daysAgo: 51 },
  ]);
  mkSkill(tunz, 'ui-design', 76, [{ title: 'Design a mobile banking dashboard', score: 78, passed: true, kind: 'project', daysAgo: 35 }]);
  mkSkill(tunz, 'ai', 82, [{ title: 'Design an AI workflow', score: 85, passed: true, kind: 'project', daysAgo: 21 }]);
  mkSkill(tunz, 'marketing', 68, [{ title: 'Write a product campaign', score: 68, passed: false, daysAgo: 9 }]);
  mkSkill(amara, 'python', 92, [
    { title: 'Final Skill Assessment: Automation Script', score: 94, passed: true, kind: 'final', daysAgo: 40, publicId: 'amara-python-92' },
    { title: 'Analyze a small dataset', score: 90, passed: true, daysAgo: 48 },
  ]);
  mkSkill(amara, 'data-analysis', 78, [{ title: 'Analyze a dataset & defend it', score: 80, passed: true, daysAgo: 33 }]);
  mkSkill(kofi, 'marketing', 74, [{ title: 'Write a product campaign', score: 76, passed: true, daysAgo: 28 }]);
  mkSkill(kofi, 'social-media', 81, [{ title: 'Build your content engine', score: 83, passed: true, daysAgo: 18 }]);
  mkSkill(lena, 'ui-design', 88, [{ title: 'Design a mobile banking dashboard', score: 90, passed: true, kind: 'project', daysAgo: 25 }]);
  mkSkill(lena, 'writing', 72, [{ title: 'Write a 400-word product launch piece', score: 73, passed: true, daysAgo: 15 }]);
  mkSkill(diego, 'writing', 79, [{ title: 'Publish-ready essay', score: 81, passed: true, kind: 'final', daysAgo: 20 }]);
  mkSkill(diego, 'languages', 66, [{ title: 'Survive a café scenario', score: 66, passed: false, daysAgo: 6 }]);
  mkSkill(priya, 'ai', 85, [{ title: 'AI Ops Plan', score: 87, passed: true, kind: 'final', daysAgo: 22 }]);
  mkSkill(priya, 'python', 73, [{ title: 'Automate a boring task', score: 74, passed: true, daysAgo: 30 }]);

  /* sponsored challenges (spec §14) */
  store.insert('sponsored_challenges', {
    id: 'spon_python', title: 'Community Python Challenge', skillSlug: 'python',
    description: 'Sponsored by the Naija Tech Community. Learn Python, pass the final assessment, split the pool.',
    emoji: '🐍', sponsor: 'Naija Tech Community',
    poolLuna: luna(500), topLuna: luna(200), qualifiedLuna: luna(300),
    participants: 87, endsInDays: 12,
  });
  store.insert('sponsored_challenges', {
    id: 'spon_web', title: 'Web Dev Sprint', skillSlug: 'web-development',
    description: 'Ship your first landing page in 14 days. Every qualified proofer earns from the pool.',
    emoji: '💻', sponsor: 'Bara Studio',
    poolLuna: luna(250), topLuna: luna(100), qualifiedLuna: luna(150),
    participants: 41, endsInDays: 9,
  });
  store.insert('sponsored_challenges', {
    id: 'spon_ai', title: 'AI Workflow Weekend', skillSlug: 'ai',
    description: 'Design an AI workflow that saves a real business hours. Best proofs share 180 NIM.',
    emoji: '🤖', sponsor: 'Hajar Textiles',
    poolLuna: luna(180), topLuna: luna(80), qualifiedLuna: luna(100),
    participants: 23, endsInDays: 5,
  });

  /* teaching sessions (spec §15) */
  const mkSession = (teacher, o) => {
    const { daysAgo, ratings, ...rest } = o;
    return store.insert('teaching_sessions', {
      id: uid('ts'), teacherId: teacher.id, bookings: o.bookings || 0,
      rating: ratings ? ratings.reduce((a, b) => a + b, 0) : null,
      ratingCount: ratings ? ratings.length : 0,
      createdAt: now() - (daysAgo || 20) * 86400000,
      ...rest,
    });
  };
  mkSession(tunz, {
    skillSlug: 'python', title: 'Python for Beginners — 20 minutes',
    description: 'From zero to your first working script. We install, write, run, and you leave with a real automation idea for your own work.',
    durationMin: 20, priceLuna: luna(5), maxStudents: 8, bookings: 5, ratings: [5, 5, 4, 5], daysAgo: 25,
  });
  mkSession(tunz, {
    skillSlug: 'web-development', title: 'Landing page teardown — 30 minutes',
    description: 'Bring your page. We fix hierarchy, responsiveness and accessibility together, live.',
    durationMin: 30, priceLuna: luna(8), maxStudents: 6, bookings: 3, ratings: [5, 5, 5], daysAgo: 18,
  });
  mkSession(amara, {
    skillSlug: 'data-analysis', title: 'Find the story in your data',
    description: 'Bring any spreadsheet. You leave with three findings you can defend.',
    durationMin: 25, priceLuna: luna(4), maxStudents: 10, bookings: 6, ratings: [5, 4, 5, 5, 4], daysAgo: 22,
  });
  mkSession(lena, {
    skillSlug: 'ui-design', title: 'UI critique, live and kind',
    description: 'I review your screen design against a real rubric — hierarchy, spacing, states.',
    durationMin: 20, priceLuna: luna(8), maxStudents: 5, bookings: 2, ratings: [5, 5], daysAgo: 12,
  });
  mkSession(kofi, {
    skillSlug: 'marketing', title: 'Your first 100 customers',
    description: 'Positioning + one channel, chosen together. You leave with a 2-week plan.',
    durationMin: 30, priceLuna: luna(6), maxStudents: 8, bookings: 4, ratings: [4, 5, 4], daysAgo: 15,
  });

  /* a few reviews so leaderboards feel alive */
  const review = (session, by, rating, text, daysAgo) => store.insert('reviews', {
    id: uid('rv'), sessionId: session.id, userId: by.id, revieweeId: session.teacherId,
    rating, text, createdAt: now() - daysAgo * 86400000,
  });
  const sessions = store.all('teaching_sessions');
  review(sessions[0], amara, 5, 'Tunz made functions click in minutes. Worth every luna.', 20);
  review(sessions[0], kofi, 5, 'Patient, practical, zero fluff.', 16);
  review(sessions[0], diego, 4, 'Great pace — I wanted 10 more minutes.', 12);
  review(sessions[0], priya, 5, 'Left with a working script on day one.', 8);
  review(sessions[1], amara, 5, 'My page finally looks professional on mobile.', 10);
  review(sessions[2], tunz, 5, 'Amara found a trend I’d been sitting on for weeks.', 14);
  review(sessions[3], tunz, 5, 'Kind, specific, immediately useful.', 7);
  review(sessions[4], diego, 4, 'Concrete plan — launching next week.', 9);

  /* ── Learn Anything Features: Initialize user stats for demo users ── */
  const today = new Date().toISOString().split('T')[0];
  
  // Initialize UserStats for demo users with activity
  const initStats = (user, stats) => {
    if (!store.tables['user_stats']) store.tables['user_stats'] = {};
    store.tables['user_stats'][user.id] = {
      userId: user.id,
      currentStreak: stats.currentStreak || 0,
      longestStreak: stats.longestStreak || 0,
      lastActivityDate: stats.lastActivityDate || null,
      totalLearningMinutes: stats.totalLearningMinutes || 0,
      totalReviewsDone: stats.totalReviewsDone || 0,
      totalLessonsCompleted: stats.totalLessonsCompleted || 0,
      totalPracticesCompleted: stats.totalPracticesCompleted || 0,
      updatedAt: now()
    };
  };
  
  initStats(tunz, { currentStreak: 12, longestStreak: 21, lastActivityDate: today, totalLearningMinutes: 840, totalLessonsCompleted: 42, totalPracticesCompleted: 38, totalReviewsDone: 15 });
  initStats(amara, { currentStreak: 6, longestStreak: 15, lastActivityDate: today, totalLearningMinutes: 620, totalLessonsCompleted: 31, totalPracticesCompleted: 28, totalReviewsDone: 12 });
  initStats(kofi, { currentStreak: 3, longestStreak: 9, lastActivityDate: today, totalLearningMinutes: 410, totalLessonsCompleted: 21, totalPracticesCompleted: 18, totalReviewsDone: 8 });
  initStats(lena, { currentStreak: 8, longestStreak: 11, lastActivityDate: today, totalLearningMinutes: 530, totalLessonsCompleted: 26, totalPracticesCompleted: 24, totalReviewsDone: 10 });
  initStats(diego, { currentStreak: 2, longestStreak: 6, lastActivityDate: today, totalLearningMinutes: 280, totalLessonsCompleted: 14, totalPracticesCompleted: 12, totalReviewsDone: 5 });
  initStats(priya, { currentStreak: 5, longestStreak: 10, lastActivityDate: today, totalLearningMinutes: 490, totalLessonsCompleted: 24, totalPracticesCompleted: 22, totalReviewsDone: 9 });

  // Initialize empty tables for other Learn Anything features
  if (!store.tables['review_schedule']) store.tables['review_schedule'] = {};
  if (!store.tables['learning_sessions']) store.tables['learning_sessions'] = {};
  if (!store.tables['learning_goals']) store.tables['learning_goals'] = {};
  if (!store.tables['mastery_badges']) store.tables['mastery_badges'] = {};
  if (!store.tables['exercise_attempts']) store.tables['exercise_attempts'] = {};
  if (!store.tables['quiz_results']) store.tables['quiz_results'] = {};
  if (!store.tables['knowledge_nodes']) store.tables['knowledge_nodes'] = {};
  if (!store.tables['user_mastery']) store.tables['user_mastery'] = {};

  // ── Learning Goals: Create sample goals for demo users ──
  const createGoalHelper = (user, goalType, target, currentVal, period = 'weekly') => {
    const goalId = uid('goal');
    const todayDate = new Date();
    let startsAt, endsAt;
    
    if (period === 'weekly') {
      const dayOfWeek = todayDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startsAt = new Date(todayDate.setDate(todayDate.getDate() - daysToMonday)).setHours(0, 0, 0, 0);
      endsAt = new Date(startsAt + 7 * 86400000 - 1).getTime();
    } else if (period === 'daily') {
      startsAt = new Date(todayDate.setHours(0, 0, 0, 0)).getTime();
      endsAt = new Date(todayDate.setHours(23, 59, 59, 999)).getTime();
    }
    
    if (!store.tables['learning_goals']) store.tables['learning_goals'] = {};
    store.tables['learning_goals'][goalId] = {
      id: goalId,
      userId: user.id,
      goalType,
      targetValue: target,
      currentValue: currentVal,
      period,
      startsAt,
      endsAt,
      completed: currentVal >= target,
      completedAt: currentVal >= target ? now() : null,
      createdAt: now()
    };
  };
  
  // Tunz (high performer) - all goals progressing well
  createGoalHelper(tunz, 'weekly_lessons', 5, 4, 'weekly');
  createGoalHelper(tunz, 'weekly_practices', 3, 3, 'weekly');
  createGoalHelper(tunz, 'daily_minutes', 30, 25, 'daily');
  
  // Amara - some goals completed
  createGoalHelper(amara, 'weekly_lessons', 5, 5, 'weekly'); // completed
  createGoalHelper(amara, 'weekly_practices', 4, 2, 'weekly');
  
  // Kofi - just started
  createGoalHelper(kofi, 'weekly_lessons', 3, 1, 'weekly');
  createGoalHelper(kofi, 'daily_minutes', 20, 15, 'daily');
  
  // Lena - mid-progress
  createGoalHelper(lena, 'weekly_lessons', 5, 3, 'weekly');
  createGoalHelper(lena, 'weekly_practices', 3, 2, 'weekly');

  // ── Mastery Badges: Award some badges to demo users ──
  const awardBadgeHelper = (user, badgeId) => {
    const badge = {
      id: uid('badge'),
      userId: user.id,
      badgeId,
      earnedAt: now() - Math.floor(Math.random() * 7 * 86400000) // earned within last week
    };
    if (!store.tables['mastery_badges']) store.tables['mastery_badges'] = {};
    store.tables['mastery_badges'][badge.id] = badge;
  };
  
  // Tunz (most experienced) - multiple badges
  awardBadgeHelper(tunz, 'first_lesson');
  awardBadgeHelper(tunz, 'first_practice');
  awardBadgeHelper(tunz, 'lesson_streak_3');
  awardBadgeHelper(tunz, 'lesson_streak_7');
  awardBadgeHelper(tunz, 'practice_10');
  awardBadgeHelper(tunz, 'first_goal');
  
  // Amara - solid progress
  awardBadgeHelper(amara, 'first_lesson');
  awardBadgeHelper(amara, 'first_practice');
  awardBadgeHelper(amara, 'lesson_streak_3');
  awardBadgeHelper(amara, 'practice_10');
  awardBadgeHelper(amara, 'first_goal');
  
  // Lena - getting started
  awardBadgeHelper(lena, 'first_lesson');
  awardBadgeHelper(lena, 'first_practice');
  awardBadgeHelper(lena, 'lesson_streak_3');
  awardBadgeHelper(lena, 'first_goal');
  
  // Kofi - early stage
  awardBadgeHelper(kofi, 'first_lesson');
  awardBadgeHelper(kofi, 'first_practice');
  awardBadgeHelper(kofi, 'first_goal');
  
  // Priya - moderate progress
  awardBadgeHelper(priya, 'first_lesson');
  awardBadgeHelper(priya, 'first_practice');
  awardBadgeHelper(priya, 'lesson_streak_3');
  awardBadgeHelper(priya, 'first_goal');

  // ── Socratic Teaching System: Initialize tables and demo data ──
  if (!store.tables['socratic_sessions']) store.tables['socratic_sessions'] = {};
  if (!store.tables['user_glossary']) store.tables['user_glossary'] = {};
  if (!store.tables['skill_dependencies']) store.tables['skill_dependencies'] = {};
  if (!store.tables['project_tracks']) store.tables['project_tracks'] = {};
  if (!store.tables['user_project_progress']) store.tables['user_project_progress'] = {};
  if (!store.tables['lesson_checkpoints']) store.tables['lesson_checkpoints'] = {};
  if (!store.tables['checkpoint_responses']) store.tables['checkpoint_responses'] = {};
  if (!store.tables['code_reviews']) store.tables['code_reviews'] = {};
  if (!store.tables['study_groups']) store.tables['study_groups'] = {};
  if (!store.tables['group_discussions']) store.tables['group_discussions'] = {};

  // Helper to create Socratic sessions
  const createSession = (user, type, topicTitle, opts = {}) => {
    const sessionId = uid('soc');
    const daysAgo = opts.daysAgo || Math.floor(Math.random() * 14);
    const startedAt = now() - daysAgo * 86400000;
    const duration = opts.duration || (15 + Math.floor(Math.random() * 10)) * 60000; // 15-25 min
    
    store.tables['socratic_sessions'][sessionId] = {
      id: sessionId,
      userId: user.id,
      type,
      topicSlug: opts.topicSlug || 'intro-to-topic',
      topicTitle,
      context: opts.context || {},
      questions: opts.questions || [],
      responses: opts.responses || [],
      insights: opts.insights || [],
      status: opts.status || 'completed',
      currentQuestionIndex: opts.currentQuestionIndex || 4,
      startedAt,
      completedAt: opts.status === 'completed' ? startedAt + duration : null
    };
  };

  // Tunz - experienced learner with multiple sessions
  createSession(tunz, 'pre_lesson', 'HTML Basics', {
    topicSlug: 'html-basics',
    daysAgo: 12,
    responses: [
      { questionId: 'q1', response: 'I want to build websites for local businesses in my area', analysis: { quality: 'deep' } },
      { questionId: 'q2', response: 'Tried to make a page once but it looked broken on my phone', analysis: { quality: 'medium' } },
      { questionId: 'q3', response: 'Know that websites are made with code, but not sure how it works', analysis: { quality: 'medium' } },
    ],
    insights: [
      { text: 'Clear motivation: helping local businesses', context: 'ground_motivation' },
    ]
  });
  
  createSession(tunz, 'checkpoint', 'CSS Flexbox', {
    topicSlug: 'css-flexbox',
    daysAgo: 8,
    responses: [
      { questionId: 'c1', response: 'Flexbox is like organizing items in a container where you can control spacing and alignment easily', analysis: { quality: 'deep' } },
      { questionId: 'c2', response: 'Still confused about when to use flex-direction vs flex-wrap', analysis: { quality: 'medium' } },
    ],
    insights: [
      { text: 'Good grasp of core concept with clear analogy', context: 'verify_understanding' },
    ]
  });

  createSession(tunz, 'reflection', 'JavaScript Functions', {
    topicSlug: 'js-functions',
    daysAgo: 3,
    responses: [
      { questionId: 'r1', response: 'The idea that functions are reusable blocks of code really clicked', analysis: { quality: 'deep' } },
      { questionId: 'r2', response: 'Parameters and arguments are still a bit fuzzy', analysis: { quality: 'medium' } },
      { questionId: 'r3', response: 'I will use functions to validate form inputs on my next project', analysis: { quality: 'deep' } },
    ],
    insights: [
      { text: 'Strong connection to real-world application', context: 'connect_reality' },
      { text: 'Clear about what needs more work', context: 'surface_gaps' },
    ]
  });

  // Amara - active learner
  createSession(amara, 'pre_lesson', 'Python Lists', {
    topicSlug: 'python-lists',
    daysAgo: 7,
    responses: [
      { questionId: 'q1', response: 'Need to analyze survey data from my community research project', analysis: { quality: 'deep' } },
      { questionId: 'q2', response: 'I know arrays from JavaScript but not sure if Python lists are the same', analysis: { quality: 'medium' } },
    ],
    insights: [
      { text: 'Has prior programming knowledge to build on', context: 'assess_baseline' },
    ]
  });

  createSession(amara, 'wait_what', 'List Comprehensions', {
    topicSlug: 'python-list-comprehension',
    daysAgo: 6,
    responses: [
      { questionId: 'w1', response: 'The square bracket syntax with the for loop inside - it looks backwards to me', analysis: { quality: 'medium' } },
      { questionId: 'w2', response: 'Maybe it reads the whole expression left to right?', analysis: { quality: 'medium' } },
    ]
  });

  createSession(amara, 'reflection', 'Python Dictionaries', {
    topicSlug: 'python-dicts',
    daysAgo: 2,
    responses: [
      { questionId: 'r1', response: 'Dictionaries as key-value pairs make so much sense for storing structured data', analysis: { quality: 'deep' } },
      { questionId: 'r4', response: 'I would explain it as a phone book - look up by name, get the number', analysis: { quality: 'deep' } },
    ],
    insights: [
      { text: 'Strong mental model with excellent analogy', context: 'solidify_learning' },
    ]
  });

  // Lena - UI design learner
  createSession(lena, 'pre_lesson', 'Color Theory Basics', {
    topicSlug: 'color-theory',
    daysAgo: 10,
    responses: [
      { questionId: 'q1', response: 'Want to make my designs feel more professional and cohesive', analysis: { quality: 'medium' } },
      { questionId: 'q3', response: 'I know primary colors but not sure how to pick colors that work together', analysis: { quality: 'medium' } },
    ]
  });

  createSession(lena, 'checkpoint', 'Typography Hierarchy', {
    topicSlug: 'typography',
    daysAgo: 5,
    responses: [
      { questionId: 'c1', response: 'Typography hierarchy is about making the most important text stand out through size, weight, and spacing', analysis: { quality: 'deep' } },
    ],
    insights: [
      { text: 'Understands core principles clearly', context: 'verify_understanding' },
    ]
  });

  // Kofi - marketing learner
  createSession(kofi, 'pre_lesson', 'Customer Personas', {
    topicSlug: 'customer-personas',
    daysAgo: 4,
    responses: [
      { questionId: 'q1', response: 'Need to understand who my customers actually are so I can market better', analysis: { quality: 'medium' } },
    ]
  });

  // Helper to create glossary entries
  const createGlossaryTerm = (user, term, definition, level, source) => {
    const termId = uid('gloss');
    const daysAgo = Math.floor(Math.random() * 20);
    
    store.tables['user_glossary'][termId] = {
      id: termId,
      userId: user.id,
      term,
      definition,
      level, // beginner, intermediate, expert
      source,
      masteryScore: 0,
      reviewCount: 0,
      lastReviewedAt: null,
      createdAt: now() - daysAgo * 86400000
    };
  };

  // Tunz's glossary - web development terms
  createGlossaryTerm(tunz, 'Flexbox', 'A CSS layout system that arranges items in rows or columns with flexible sizing', 'intermediate', 'CSS Flexbox lesson');
  createGlossaryTerm(tunz, 'Semantic HTML', 'HTML tags that describe the meaning of content, not just appearance', 'beginner', 'HTML Basics lesson');
  createGlossaryTerm(tunz, 'Callback Function', 'A function passed as an argument to another function to be executed later', 'intermediate', 'JavaScript Functions lesson');
  createGlossaryTerm(tunz, 'Responsive Design', 'Design approach where layouts adapt to different screen sizes', 'intermediate', 'Manual entry');
  createGlossaryTerm(tunz, 'Event Delegation', 'Attaching event listeners to parent elements instead of individual children', 'expert', 'Advanced JS lesson');

  // Amara's glossary - Python and data
  createGlossaryTerm(amara, 'List Comprehension', 'Python syntax for creating lists in a single line using a for loop', 'intermediate', 'Python Lists lesson');
  createGlossaryTerm(amara, 'Dictionary', 'Python data structure that stores key-value pairs', 'beginner', 'Python Dicts lesson');
  createGlossaryTerm(amara, 'Lambda Function', 'Anonymous one-line function in Python', 'intermediate', 'Manual entry');
  createGlossaryTerm(amara, 'Pandas DataFrame', 'Table-like data structure for data analysis in Python', 'expert', 'Data Analysis lesson');

  // Lena's glossary - design terms
  createGlossaryTerm(lena, 'Hierarchy', 'Visual arrangement that shows importance of elements', 'beginner', 'Typography lesson');
  createGlossaryTerm(lena, 'Contrast', 'Difference between elements that creates visual interest', 'beginner', 'Color Theory lesson');
  createGlossaryTerm(lena, 'White Space', 'Empty space around elements that improves readability', 'intermediate', 'Layout Principles lesson');
  createGlossaryTerm(lena, 'Gestalt Principles', 'How humans perceive visual elements as organized patterns', 'expert', 'Design Psychology lesson');

  // Kofi's glossary - marketing terms
  createGlossaryTerm(kofi, 'Customer Persona', 'Fictional character representing your ideal customer', 'beginner', 'Customer Personas lesson');
  createGlossaryTerm(kofi, 'Value Proposition', 'Clear statement of benefits you offer to customers', 'beginner', 'Manual entry');
  createGlossaryTerm(kofi, 'Conversion Rate', 'Percentage of visitors who take a desired action', 'intermediate', 'Marketing Metrics lesson');

  // Priya's glossary - AI and Python
  createGlossaryTerm(priya, 'Prompt Engineering', 'Crafting inputs to get better outputs from AI models', 'intermediate', 'AI Prompts lesson');
  createGlossaryTerm(priya, 'API', 'Interface that allows programs to communicate with each other', 'intermediate', 'Python APIs lesson');
  createGlossaryTerm(priya, 'Token', 'Unit of text that AI models process', 'beginner', 'AI Basics lesson');

  await Promise.resolve();
  return store;
}
