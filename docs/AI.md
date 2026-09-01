# AI — how PROOF thinks

## Design rules

1. **No prompts in UI code.** Everything goes through `server/ai/service.js` (`AIService`).
2. **Schema-validated outputs.** Every AI response (LLM *or* engine) passes `util.validate()` before it touches the DB.
3. **Engine-first, LLM-enhanced.** The deterministic ProofEngine always computes structure and scores; an LLM (if configured) may only enrich *wording*. Rewards never depend on an LLM's opinion.
4. **Never overteach** (spec §50). Lessons are Explain → Example → Ask → Practice → Proof, all size-capped in the knowledge base.

## The ProofEngine (works with zero API keys)

`server/ai/engine.js` + `kb.js` + `evaluators.js`:

- **`generateLearningPath({goal, level, minutesPerDay})`** — keyword-matches the goal to one of 12 curriculum domains, orders topics by difficulty, paces them into 5–12 days by available time, and inserts proof checkpoints every ~2 topics + a final assessment. Each checkpoint carries XP and a NIM reward.
- **`lessonFor(domain, topic)`** — TL;DR, 2–3 sections, worked example, Socratic question, key points, misconception warning, 2 practice items with explanations.
- **`tutorReply({topic, question, history})`** — intent detection (explain / simpler / example / exercise / hint / debug / coach) grounded in the lesson's own content. Never hands over final answers; gives hints and makes the learner commit.
- **`dailyChallengeFor(dateKey)`** — deterministic per-day proof (explain/teach-back/post-mortem), 1 NIM.
- **Evaluators** — one per submission type, each scoring a **100-point rubric** with per-criterion notes, strengths, improvements, and a concrete next step:

| Evaluator | What it really checks |
|---|---|
| `html` | semantic landmarks, single h1, viewport meta, media queries, fluid units, `html[lang]`, alt-text coverage, heading order, class-based CSS, custom properties, required sections, meta description, addEventListener wiring, card counts |
| `js-static` | structural checks per challenge (function defined, normalization, sorting, boundaries) + edge-case explanation |
| `text` | length band, key-concept coverage ratio, paragraph/heading structure, sentence-length clarity, concreteness, verbatim-copy overlap penalty |
| `data` | numeric findings with trend language, real numbers cited, analytical framing, depth |
| `business` | required components (audience/pitch/pricing/channels/metrics…), numeric economics, structure |
| `design` | design-thinking concept coverage, concrete values (px/hex/steps), structure |
| `conversation` | turn count, target-language lexicon hits, question balance, glosses, fluency depth |

Every evaluation also emits a **content hash** feeding duplicate-submission detection, and `identifyWeaknesses()` maps failed criteria into the tutor's coaching.

## LLM provider: Google Gemini (optional)

`providers.js` calls the **Generative Language API** (`POST {baseUrl}/models/{model}:generateContent`) with:

- `systemInstruction` — the tutor/designer persona + "respond with ONLY valid JSON",
- `generationConfig.responseMimeType: 'application/json'` — native JSON mode,
- 20-second hard timeout and per-request abort.

Default model: `gemini-2.5-flash` (configurable via `AI_MODEL` — e.g. `gemini-2.0-flash`, `gemini-2.5-pro`). Set `AI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey) to enable. `AIService` uses Gemini for:

- **tutor replies** (grounded in the lesson context, hint-only policy),
- **path title/copy personalization** (topic sequence stays engine-owned),
- **feedback wording** for evaluations (score/criteria are engine-fixed; the LLM rewrites strengths/improvements/nextStep, schema-checked).

Any provider error → instant fallback to the engine. `AI_PROVIDER=engine` disables LLM entirely.

## Extending the curriculum

Add a domain to `server/ai/kb.js`: goal keywords, topics (lesson + practice + one challenge template with an evaluator config), and a final assessment. Path generation, lessons, tutor, and grading pick it up automatically — no other code changes.
