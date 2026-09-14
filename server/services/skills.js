/**
 * SkillService — the proof-of-skill core.
 * Skill scores are derived ONLY from completed proofs (never user-selected).
 * Tiers: Novice 0-20 · Beginner 21-40 · Intermediate 41-70 · Advanced 71-90 · Expert 91-100.
 */
import { uid, now, clamp } from '../util.js';
import { SKILLS } from '../ai/kb.js';

export class SkillService {
  constructor(store, config) {
    this.store = store;
    this.config = config;
    store.declareUniques('skills', ['slug']);
    store.declareUniques('user_skills', []);
  }

  async seedCatalog() {
    for (const s of SKILLS) {
      if (await this.store.find('skills', (x) => x.slug === s.slug)) continue;
      await this.store.insert('skills', { id: uid('sk'), ...s });
    }
    await this.store.save();
  }

  async catalog() { return await this.store.all('skills'); }
  async bySlug(slug) { return await this.store.find('skills', (s) => s.slug === slug); }

  tierFor(score) {
    const tiers = this.config.economy.skillTiers;
    for (const t of tiers) if (score <= t.max) return t.name;
    return 'Expert';
  }

  async ensureUserSkill(userId, skillSlug) {
    let us = await this.store.find('user_skills', (x) => x.userId === userId && x.skillSlug === skillSlug);
    if (!us) {
      us = await this.store.insert('user_skills', {
        id: uid('us'), userId, skillSlug,
        score: 0, tier: 'Novice', xp: 0,
        verified: false, verifiedScore: 0, verifiedAt: null,
        proofs: 0, passed: 0, updatedScoreAt: null,
      });
      await this.store.save();
    }
    return us;
  }

  /**
   * Apply a proof result to a user's skill.
   * First proof sets the score directly (the 0 → 84 moment); subsequent
   * proofs move the score as a weighted average that can rise or fall.
   */
  async applyProofResult(userId, skillSlug, { score, passed, challengeKind = 'proof' }) {
    const us = await this.ensureUserSkill(userId, skillSlug);
    const before = { score: us.score, tier: us.tier, verified: us.verified };

    const proofs = us.proofs + 1;
    const passedCount = passed ? us.passed + 1 : us.passed;
    const newScore = proofs === 1
      ? clamp(Math.round(score), 0, 100)
      : clamp(Math.round(us.score * 0.55 + score * 0.45), 0, 100);
    const tier = this.tierFor(newScore);
    const xp = us.xp + (passed ? (challengeKind === 'final' ? 250 : challengeKind === 'project' ? 150 : 100) : 15);

    let verified = us.verified, verifiedScore = us.verifiedScore, verifiedAt = us.verifiedAt;
    if (passed && newScore >= (this.config.economy.passThreshold)) {
      if (!verified || newScore > verifiedScore) {
        verified = true;
        verifiedScore = Math.max(verifiedScore, newScore);
        verifiedAt = now();
      }
    }
    // Persist via store.update() — mutating `us` in place and calling
    // store.save() only works on the embedded store (shared object
    // reference); SupabaseStore's save() is a no-op.
    const updated = await this.store.update('user_skills', us.id, {
      proofs, passed: passedCount, score: newScore, tier, xp,
      verified, verifiedScore, verifiedAt, updatedScoreAt: now(),
    });
    await this.store.save();
    const result = updated || { ...us, proofs, passed: passedCount, score: newScore, tier, xp, verified, verifiedScore, verifiedAt };
    return { userSkill: result, before, changed: before.score !== result.score || before.tier !== result.tier };
  }

  async userSkills(userId) {
    return await this.store.filter('user_skills', (s) => s.userId === userId);
  }

  async userSkill(userId, slug) {
    return await this.store.find('user_skills', (x) => x.userId === userId && x.skillSlug === slug);
  }

  /** Verified = score ≥ pass threshold on a completed proof. */
  isQualified(userId, skillSlug, minScore) {
    const us = this.userSkill(userId, skillSlug);
    return !!us && us.score >= minScore;
  }

  /** Record a completed proof (shareable). */
  async recordProof({ userId, skillSlug, challengeId, challengeTitle, kind, score, passed, evaluationId }) {
    if (!skillSlug || !String(skillSlug).trim()) {
      return null;
    }
    const proof = await this.store.insert('skill_proofs', {
      id: uid('pf'),
      publicId: uid('pf').replace('pf_', ''),
      userId, skillSlug, challengeId, challengeTitle, kind,
      score, passed, evaluationId,
      completedAt: now(),
    });
    await this.store.save();
    return proof;
  }

  async proofByPublicId(publicId) {
    return await this.store.find('skill_proofs', (p) => p.publicId === publicId || p.id === publicId);
  }

  /** Skill tree: nodes + progress + activation. */
  async skillTree(userId) {
    const userSkillsArray = await this.userSkills(userId);
    const mine = new Map(userSkillsArray.map((s) => [s.skillSlug, s]));
    // Tree layout: three branches off a trunk (Learn → Prove → Earn).
    const branches = [
      { name: 'Build', slugs: ['web-development', 'python', 'data-analysis'] },
      { name: 'Create', slugs: ['ui-design', 'writing', 'music-production', 'social-media'] },
      { name: 'Grow', slugs: ['marketing', 'business', 'ai', 'nimiq-blockchain', 'languages', 'practical-skills'] },
    ];
    let bi = 0, si = 0;
    const catalogItems = await this.catalog();
    return catalogItems.map((s) => {
      const us = mine.get(s.slug);
      const node = {
        skillSlug: s.slug, name: s.name, emoji: s.emoji,
        score: us?.score || 0,
        tier: us ? this.tierFor(us.score) : null,
        verified: !!us?.verified,
        status: us ? (us.verified ? 'verified' : 'active') : 'available',
        proofs: us?.proofs || 0,
      };
      // simple layout assignment
      node.x = 0.5 + (si % 2 === 0 ? -1 : 1) * (0.16 + 0.1 * Math.floor(si / 2)) * (bi === 1 ? 1 : -1);
      node.y = 0.12 + bi * 0.3 + si * 0.045;
      si++;
      if (si >= branches[bi].slugs.length) { si = 0; bi = Math.min(bi + 1, branches.length - 1); }
      return node;
    });
  }
}
