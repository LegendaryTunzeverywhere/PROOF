/**
 * UserService — profiles, XP/levels, streaks, achievements, public profiles.
 * XP and levels are derived server-side from completed proofs. Users can
 * never set their own level, score, XP, or balance.
 */
import { uid, now, clamp } from '../util.js';

const ADJ = ['Swift', 'Bright', 'Keen', 'Bold', 'Lucid', 'Prime', 'Nova', 'Sharp'];
const NOUN = ['Otter', 'Falcon', 'Panda', 'Comet', 'Maple', 'Orbit', 'Ember', 'Cedar'];
const AVATARS = ['🦊', '🐼', '🦉', '🐝', '🦋', '🐙', '🦜', '🐳', '🦁', '🐬'];

export class UserService {
  constructor(store, config) {
    this.store = store;
    this.config = config;
    store.declareUniques('users', ['usernameLower']);
  }

  createUser({ walletAddress = null, walletMode = null, isDemo = false, username = null } = {}) {
    const handle = username || `${ADJ[Math.floor(Math.random() * ADJ.length)]}${NOUN[Math.floor(Math.random() * NOUN.length)]}${Math.floor(10 + Math.random() * 89)}`;
    const user = this.store.insert('users', {
      id: uid('u'),
      username: handle,
      usernameLower: handle.toLowerCase(),
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      walletAddress,
      walletMode,
      publicKey: null,
      level: 1,
      xp: 0,
      reputation: 50,
      balanceLuna: 0,
      earnedLuna: 0,
      proofsPassed: 0,
      proofsAttempted: 0,
      streak: { current: 0, longest: 0, lastDay: null },
      isDemo,
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
    return this.store.find('users', (u) => u.walletAddress && u.walletAddress.replace(/\s+/g, '') === String(address).replace(/\s+/g, ''));
  }

  findByPublicKey(pubKey) {
    return this.store.find('users', (u) => u.publicKey === pubKey);
  }

  update(user, patch) {
    delete patch.id; delete patch.balanceLuna; delete patch.earnedLuna; delete patch.xp; delete patch.level; delete patch.reputation;
    patch.updatedAt = now();
    const next = this.store.update('users', user.id, patch);
    this.store.save();
    return next;
  }

  /** XP curve: level n needs 60·(n−1)² xp. */
  xpForLevel(level) { return 60 * (level - 1) * (level - 1); }

  addXp(userId, amount, reason = '') {
    const user = this.get(userId);
    if (!user || !(amount > 0)) return { user, leveledUp: false };
    const before = user.level;
    user.xp += Math.round(amount);
    let lvl = 1;
    while (this.xpForLevel(lvl + 1) <= user.xp) lvl++;
    user.level = lvl;
    user.updatedAt = now();
    this.store.save();
    return { user, leveledUp: lvl > before, newLevel: lvl, reason };
  }

  /* ── streaks (encouraging, never punitive — spec §53) ── */
  touchStreak(userId) {
    const user = this.get(userId);
    if (!user) return user.streak;
    const today = new Date().toISOString().slice(0, 10);
    const s = user.streak || { current: 0, longest: 0, lastDay: null };
    if (s.lastDay === today) return s;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    s.current = s.lastDay === yesterday ? s.current + 1 : 1;
    s.longest = Math.max(s.longest, s.current);
    s.lastDay = today;
    user.streak = s;
    user.updatedAt = now();
    this.store.save();
    return s;
  }

  addReputation(userId, delta) {
    const user = this.get(userId);
    if (!user || !delta) return;
    user.reputation = clamp(user.reputation + delta, 0, 100);
    user.updatedAt = now();
    this.store.save();
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

  checkAchievements(userId) {
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
    const skills = this.store.filter('user_skills', (s) => s.userId === userId);
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
  publicProfile(userId) {
    const user = this.get(userId);
    if (!user) return null;
    const skills = this.store.filter('user_skills', (s) => s.userId === userId)
      .sort((a, b) => b.score - a.score)
      .map((s) => ({ skillSlug: s.skillSlug, score: s.score, tier: s.tier, verified: s.verified, verifiedAt: s.verifiedAt, proofs: s.proofs }));
    const proofs = this.store.filter('skill_proofs', (p) => p.userId === userId)
      .sort((a, b) => b.completedAt - a.completedAt).slice(0, 20);
    const tasks = this.store.filter('task_applications', (a) => a.userId === userId && a.status === 'accepted').length;
    const teaching = this.store.filter('teaching_sessions', (t) => t.teacherId === userId).length;
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
      achievements: this.store.filter('achievements', (a) => a.userId === userId)
        .map((a) => ({ ...this.ACHIEVEMENTS.find((d) => d.id === a.achievementId), unlockedAt: a.unlockedAt })),
      memberSince: user.createdAt,
      streak: user.streak,
    };
  }

  leaderboard(category = 'proofs', limit = 10) {
    const users = this.store.all('users').filter((u) => !u.isClient);
    const score = {
      proofs: (u) => u.proofsPassed * 10 + u.xp / 50,
      score: (u) => avgScore(this.store, u.id),
      helpful: (u) => this.store.count('reviews', (r) => r.revieweeId === u.id && r.rating >= 4) * 8 + u.reputation,
      teacher: (u) => this.store.count('teaching_sessions', (t) => t.teacherId === u.id && t.bookings > 0) * 12 + this.store.count('reviews', (r) => r.revieweeId === u.id && r.rating >= 4) * 4,
      consistent: (u) => (u.streak?.longest || 0) * 6 + u.proofsPassed,
      tasks: (u) => this.store.count('task_applications', (a) => a.userId === u.id && a.status === 'accepted') * 15,
      earned: (u) => u.earnedLuna / 100000,
    }[category] || ((u) => u.proofsPassed);
    return users
      .map((u) => ({ user: u, value: Math.round(score(u) * 10) / 10 }))
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

function avgScore(store, userId) {
  // Only count passed attempts for average score calculation
  const passed = store.filter('attempts', (a) => a.userId === userId && a.submittedAt && a.score != null && a.status === 'passed');
  if (!passed.length) return 0;
  return passed.reduce((a, x) => a + x.score, 0) / passed.length;
}
