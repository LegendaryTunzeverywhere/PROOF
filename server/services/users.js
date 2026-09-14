/**
 * UserService — profiles, XP/levels, streaks, achievements, public profiles.
 * XP and levels are derived server-side from completed proofs. Users can
 * never set their own level, score, XP, or balance.
 */
import { uid, now, clamp, normalizeNimiqAddress, looksLikeNimiqAddress } from '../util.js';

const ADJ = ['Swift', 'Bright', 'Keen', 'Bold', 'Lucid', 'Prime', 'Nova', 'Sharp'];
const NOUN = ['Otter', 'Falcon', 'Panda', 'Comet', 'Maple', 'Orbit', 'Ember', 'Cedar'];
const AVATARS = ['🦊', '🐼', '🦉', '🐝', '🦋', '🐙', '🦜', '🐳', '🦁', '🐬'];

function streakEmoji(current) {
  if (current >= 30) return '👑';
  if (current >= 7) return '⚡';
  if (current >= 3) return '🔥';
  return '📚';
}

function normalizeStreakShape(streak = null) {
  const s = streak && typeof streak === 'object' ? streak : { current: 0, longest: 0, lastDay: null };
  const current = Number(s.current) || 0;
  const longest = Number(s.longest) || 0;
  return {
    current,
    longest,
    lastDay: s.lastDay || null,
    emoji: streakEmoji(current),
    atRisk: false,
  };
}

export class UserService {
  constructor(store, config) {
    this.store = store;
    this.config = config;
    store.declareUniques('users', ['usernameLower']);
  }

  async createUser({ walletAddress = null, walletMode = null, isDemo = false, username = null, avatar = null } = {}) {
    const handle = username || `${ADJ[Math.floor(Math.random() * ADJ.length)]}${NOUN[Math.floor(Math.random() * NOUN.length)]}${Math.floor(10 + Math.random() * 89)}`;
    const canonicalWalletAddress = walletAddress ? normalizeNimiqAddress(walletAddress) : null;
    const chosenAvatar = avatar || AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const user = await this.store.insert('users', {
      id: uid('u'),
      username: handle,
      usernameLower: handle.toLowerCase(),
      avatar: chosenAvatar,
      walletAddress: canonicalWalletAddress,
      walletMode,
      publicKey: null,
      level: 1,
      xp: 0,
      reputation: 50,
      balanceLuna: 0,
      earnedLuna: 0,
      proofsPassed: 0,
      proofsAttempted: 0,
      streak: { current: 0, longest: 0, lastDay: null, emoji: '📚', atRisk: false },
      isDemo,
      isAdmin: false, // Admin flag for analytics access
      prefs: { goal: '', level: '', minutesPerDay: 30, style: 'practical', interests: [] },
      createdAt: now(),
      updatedAt: now(),
    });
    this.store.save();
    return user;
  }

  get(id) { return this.store.get('users', id); }

  findByUsername(username) {
    return this.store.find('users', (u) => u.usernameLower === String(username || '').toLowerCase());
  }

  findByWallet(address) {
    const target = normalizeNimiqAddress(String(address || ''));
    return this.store.find('users', (u) => {
      const source = normalizeNimiqAddress(u.walletAddress || '');
      return looksLikeNimiqAddress(source) && source === target;
    });
  }

  findByPublicKey(pubKey) {
    return this.store.find('users', (u) => u.publicKey === pubKey);
  }

  async update(user, patch) {
    delete patch.id; delete patch.balanceLuna; delete patch.earnedLuna; delete patch.xp; delete patch.level; delete patch.reputation; delete patch.isAdmin;
    if (patch.avatar) patch.avatar = String(patch.avatar).trim().slice(0, 4);
    if (patch.username) {
      const name = String(patch.username).trim().slice(0, 24).replace(/[^\w\d -]/g, '');
      patch.username = name;
      patch.usernameLower = name.toLowerCase();
    }
    patch.updatedAt = now();
    const next = await this.store.update('users', user.id, patch);
    this.store.save();
    return next;
  }

  listWalletAccounts() {
    const users = this.store.all('users');
    const demo = [];
    const real = [];
    for (const u of users) {
      const row = {
        id: u.id,
        username: u.username,
        avatar: u.avatar || '🙂',
        walletMode: u.walletMode || 'none',
        walletAddress: u.walletAddress ? normalizeNimiqAddress(u.walletAddress) : null,
        isDemo: Boolean(u.isDemo || u.walletMode === 'demo'),
        publicKey: u.publicKey || null,
      };
      if (row.isDemo || row.walletMode === 'demo') demo.push(row);
      else real.push(row);
    }
    return { demo, real };
  }

  /** XP curve: level n needs 60·(n−1)² xp. */
  xpForLevel(level) { return 60 * (level - 1) * (level - 1); }

  async addXp(userId, amount, reason = '') {
    const user = this.get(userId);
    if (!user || !(amount > 0)) return { user, leveledUp: false };
    const before = user.level;
    const xp = user.xp + Math.round(amount);
    let lvl = 1;
    while (this.xpForLevel(lvl + 1) <= xp) lvl++;
    const updatedAt = now();
    // Persist via store.update() — mutating `user` alone and calling
    // store.save() only works on the embedded store (shared object
    // reference); SupabaseStore's save() is a no-op, so this must be an
    // explicit write for xp/level to reach the database.
    const updated = await this.store.update('users', userId, { xp, level: lvl, updatedAt });
    await this.store.save();
    return { user: updated || { ...user, xp, level: lvl, updatedAt }, leveledUp: lvl > before, newLevel: lvl, reason };
  }

  /* ── streaks (encouraging, never punitive — spec §53) ── */
  async touchStreak(userId) {
    const user = this.get(userId);
    if (!user) return undefined;

    const today = new Date().toISOString().slice(0, 10);
    const s = user.streak || { current: 0, longest: 0, lastDay: null, emoji: '📚', atRisk: false };
    const lastDay = s.lastDay || null;

    if (lastDay === today) {
      return normalizeStreakShape({ ...s, emoji: streakEmoji(s.current || 0), atRisk: false });
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const next = {
      current: lastDay === yesterday ? (Number(s.current) || 0) + 1 : 1,
      longest: Number(s.longest) || 0,
      lastDay: today,
      emoji: '📚',
      atRisk: false,
    };
    next.longest = Math.max(next.longest, next.current);
    next.emoji = streakEmoji(next.current);

    await this.store.update('users', userId, { streak: next, updatedAt: now() });
    await this.store.save();
    return normalizeStreakShape(next);
  }

  async addReputation(userId, delta) {
    const user = this.get(userId);
    if (!user || !delta) return;
    const reputation = clamp(user.reputation + delta, 0, 100);
    await this.store.update('users', userId, { reputation, updatedAt: now() });
    await this.store.save();
  }

  /* ── achievements (spec §54) ── */
  ACHIEVEMENTS = [
    { id: 'first_proof', name: 'First Proof', desc: 'Complete your first proof challenge.', emoji: '🎯' },
    { id: 'nim_earner', name: 'NIM Earner', desc: 'Earn your first NIM.', emoji: '🪙' },
    { id: 'skill_builder', name: 'Skill Builder', desc: 'Reach Intermediate in any skill.', emoji: '🧱' },
    { id: 'verified', name: 'Verified', desc: 'Pass an advanced-tier proof.', emoji: '✅' },
    { id: 'streak_7', name: 'On Fire', desc: 'Keep a 7-day learning streak.', emoji: '🔥' },
    { id: 'first_gig', name: 'First Gig', desc: 'Get accepted for a marketplace task.', emoji: '💼' },
    { id: 'mentor', name: 'Mentor', desc: 'Host your first teaching session.', emoji: '🎓' },
    { id: 'knowledge_sharer', name: 'Knowledge Sharer', desc: 'Receive 5 positive reviews.', emoji: '🌟' },
  ];

  async checkAchievements(userId) {
    const user = this.get(userId);
    if (!user) return [];
    const unlocked = [];
    const has = (id) => this.store.find('achievements', (a) => a.userId === userId && a.achievementId === id);
    const give = (id) => {
      if (has(id)) return;
      const def = this.ACHIEVEMENTS.find((a) => a.id === id);
      this.store.insert('achievements', { id: uid('ach'), userId, achievementId: id, unlockedAt: now() });
      unlocked.push(def);
    };
    const skills = await this.store.filter('user_skills', (s) => s.userId === userId);
    if (user.proofsPassed >= 1) give('first_proof');
    if (user.earnedLuna > 0) give('nim_earner');
    if (skills.some((s) => s.tier === 'Intermediate' || s.tier === 'Advanced' || s.tier === 'Expert')) give('skill_builder');
    if (skills.some((s) => s.tier === 'Advanced' || s.tier === 'Expert')) give('verified');
    if ((user.streak?.current || 0) >= 7 || (user.streak?.longest || 0) >= 7) give('streak_7');
    if (this.store.count('task_applications', (a) => a.userId === userId && a.status === 'accepted') >= 1) give('first_gig');
    if (this.store.count('teaching_sessions', (t) => t.teacherId === userId && t.bookings > 0) >= 1) give('mentor');
    const goodReviews = this.store.count('reviews', (r) => r.revieweeId === userId && r.rating >= 4);
    if (goodReviews >= 5) give('knowledge_sharer');
    if (unlocked.length) this.store.save();
    return unlocked;
  }

  /* ── public profile ── */
  async publicProfile(userId) {
    const user = await this.get(userId);
    if (!user) return null;
    const skillsArray = await this.store.filter('user_skills', (s) => s.userId === userId);
    const skills = skillsArray
      .sort((a, b) => b.score - a.score)
      .map((s) => ({ skillSlug: s.skillSlug, score: s.score, tier: s.tier, verified: s.verified, verifiedAt: s.verifiedAt, proofs: s.proofs }));
    const proofsArray = await this.store.filter('skill_proofs', (p) => p.userId === userId);
    const proofs = proofsArray
      .sort((a, b) => b.completedAt - a.completedAt).slice(0, 20);
    const tasksArray = await this.store.filter('task_applications', (a) => a.userId === userId && a.status === 'accepted');
    const tasks = tasksArray.length;
    const teachingArray = await this.store.filter('teaching_sessions', (t) => t.teacherId === userId);
    const teaching = teachingArray.length;
    const achievementsArray = await this.store.filter('achievements', (a) => a.userId === userId);
    const achievements = achievementsArray
      .map((a) => ({ ...this.ACHIEVEMENTS.find((d) => d.id === a.achievementId), unlockedAt: a.unlockedAt }));
    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      level: user.level,
      xp: user.xp,
      reputation: user.reputation,
      earnedNim: Math.round(user.earnedLuna / 100000 * 100) / 100,
      proofsCompleted: user.proofsPassed,
      proofsAttempted: user.proofsAttempted,
      verifiedSkills: skills.filter((s) => s.verified),
      learningSkills: skills.filter((s) => !s.verified),
      proofs,
      tasksAccepted: tasks,
      teachingSessions: teaching,
      achievements,
      memberSince: user.createdAt,
      streak: user.streak,
    };
  }

  async leaderboard(category = 'proofs', limit = 10) {
    const allUsers = await this.store.all('users');
    const users = allUsers.filter((u) => !u.isClient);
    const score = {
      proofs: async (u) => u.proofsPassed * 10 + u.xp / 50,
      score: async (u) => avgScore(this.store, u.id),
      helpful: async (u) => (await this.store.count('reviews', (r) => r.revieweeId === u.id && r.rating >= 4)) * 8 + u.reputation,
      teacher: async (u) => (await this.store.count('teaching_sessions', (t) => t.teacherId === u.id && t.bookings > 0)) * 12 + (await this.store.count('reviews', (r) => r.revieweeId === u.id && r.rating >= 4)) * 4,
      consistent: async (u) => (u.streak?.longest || 0) * 6 + u.proofsPassed,
      tasks: async (u) => (await this.store.count('task_applications', (a) => a.userId === u.id && a.status === 'accepted')) * 15,
      earned: async (u) => u.earnedLuna / 100000,
    }[category] || (async (u) => u.proofsPassed);
    const scored = await Promise.all(users.map(async (u) => ({ user: u, value: Math.round((await score(u)) * 10) / 10 })));
    return scored
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)
      .map(({ user, value }, i) => ({
        rank: i + 1,
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        level: user.level,
        reputation: user.reputation,
        proofsPassed: user.proofsPassed,
        walletAddress: user.walletAddress, // Include real wallet address
        walletMode: user.walletMode, // Show wallet type (nimiqpay/demo)
        isDemo: user.isDemo, // Flag demo users
        value,
      }));
  }
}

async function avgScore(store, userId) {
  // Only count passed attempts for average score calculation
  const passed = await store.filter('attempts', (a) => a.userId === userId && a.submittedAt && a.score != null && a.status === 'passed');
  if (!passed.length) return 0;
  return passed.reduce((a, x) => a + x.score, 0) / passed.length;
}
