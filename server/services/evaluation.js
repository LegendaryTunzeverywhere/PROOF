/**
 * EvaluationService — persists evaluation results.
 * Scoring always happens through AIService (deterministic rubric engine,
 * optionally enriched by a validated LLM). Scores are never client-provided.
 */
import { uid, now } from '../util.js';
import { evaluateSubmission, identifyWeaknesses } from '../ai/service.js';

export class EvaluationService {
  constructor(store, config) { this.store = store; this.config = config; }

  async evaluate({ userId, challenge, payload }) {
    const result = await evaluateSubmission(payload, challenge, { userId });
    const row = this.store.insert('evaluations', {
      id: uid('ev'),
      userId, challengeId: challenge.id,
      score: result.score,
      pass: result.pass,
      passScore: result.passScore,
      criteria: result.criteria,
      strengths: result.strengths,
      improvements: result.improvements,
      nextStep: result.nextStep,
      engine: result.engine,
      evaluator: result.evaluator,
      contentHash: result.meta?.hash || null,
      meta: { stats: result.meta?.stats || {}, overlap: result.meta?.overlap ?? null },
      createdAt: now(),
    });
    this.store.save();
    return { evaluation: row, weaknesses: identifyWeaknesses(result) };
  }

  previousHashes(userId, challengeId) {
    return this.store.filter('evaluations', (e) => e.userId === userId && e.challengeId === challengeId)
      .map((e) => e.contentHash).filter(Boolean);
  }
}
