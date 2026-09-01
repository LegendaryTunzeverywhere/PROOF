# ARCHITECTURE

## Principles

1. **The product is the proof pipeline.** Every layer exists to make *learn → prove → earn* real, auditable, and fast.
2. **Server-authoritative everything.** Clients submit *content*; servers decide *meaning* (scores, XP, rewards, qualification).
3. **Blockchain for economic integrity only.** Off-chain: lessons, AI, XP, profiles, reputation. On-chain: NIM payments, sponsored pools, payouts, tips.
4. **Zero-dependency core.** The MVP runs on Node stdlib alone — it boots anywhere, instantly, with no install step. Every boundary is an interface so production swaps (Postgres, LLM, sandboxed runners) are drop-in.

## System map

```
┌────────────────────────── Nimiq Pay (WebView) ──────────────────────────┐
│  web/ SPA (no build step)                                               │
│   main.js (router) → views/* → api.js (fetch) → ui.js (design system)   │
│   wallet.js  ← THE ONLY blockchain module (Nimiq Pay SDK | demo)        │
└──────────────┬──────────────────────────────────────────────┬───────────┘
               │ HTTPS (session cookie)                        │ provider calls
┌──────────────▼──────────────────────────────────────────────┐───────────┤
│ server/index.js — HTTP router + static + /p/:id + /share    │  Nimiq    │
│ ┌─ auth.js ───────────── nonce → Ed25519 verify → session ─┐│  Pay host │
│ ├─ services/                                               │└───────────┘
│ │   users.js        XP, levels, streaks, achievements      │
│ │   skills.js       score/tier/verification from proofs    │
│ │   challenges.js   attempts, rate limits, anti-cheat      │
│ │   evaluation.js   persists rubric results                │
│ │   rewards.js      NIM ledger, caps, fees, escrow, tips   │
│ │   marketplace.js  tasks, qualification, escrow→payout    │
│ │   teaching.js     sessions, booking, reviews             │
│ │   notifications.js feed                                    │
│ ├─ ai/service.js — AIService facade (schema-validated)      │
│ │   ├─ engine.js      ProofEngine: paths, tutor, daily      │
│ │   ├─ kb.js          curriculum corpus (12 domains)        │
│ │   ├─ evaluators.js  deterministic rubric graders          │
│ │   └─ providers.js   optional LLM (OpenAI/Anthropic)       │
│ └─ store.js — embedded JSON store (unique indexes, atomic)  │
└──────────────────────────────────────────────────────────────┘
```

## Request lifecycle: submitting a proof

```
POST /api/attempts/:id/submit { code }        ← content only; no score field is honored
  → ChallengeService.submitAttempt()
      1. validate ownership + in_progress status + payload shape/size
      2. EvaluationService → AIService.evaluateSubmission()
           engine evaluator (deterministic rubric)  ← authoritative score
           (+ optional LLM feedback wording, schema-checked, score-proof)
      3. duplicate-content hash check vs user's prior submissions
      4. SkillService.applyProofResult() → score, tier, verification
      5. RewardService.rewardForAttempt()
           unique key (user:challenge) → one reward, ever
           daily NIM cap + rewarded-attempt cap
           wallet_tx: pending → confirmed (or on-chain ref in production)
      6. UserService.addXp / touchStreak / checkAchievements
      7. notifications
  ← { attempt, evaluation, reward, skill, qualification, achievements }
```

## Why the stack is shaped this way

| Decision | Rationale |
|---|---|
| Zero-dep Node server | Mini App sandbox + competition environment: instant boot, no install, `node_modules` never required. Interfaces (`Store`, `AIService`, `WalletService`) isolate every external concern. |
| Embedded JSON store | Same DAO surface as Prisma models (see `prisma/schema.prisma`); unique indexes enforce reward idempotency today; Postgres swap is a data-layer change only. |
| Hand-built SPA | The in-app preview iframe blocks CDNs; a no-build SPA is ~40 KB, loads instantly on 3G, and keeps the design system fully owned. |
| Deterministic engine-first AI | AI grading must be auditable for rewards (SECURITY.md). LLM adds flavor; the rubric engine always guards the score. Works with zero API keys. |
| Static analysis instead of server-side JS execution | The spec forbids executing arbitrary user code on the API server. HTML/CSS/JS submissions are analyzed structurally; production would add an isolated sandbox worker for execution-based checks. |

## Frontend architecture

- **Hash router** (`main.js`) — five primary destinations matching the bottom nav, plus deep routes (path, lesson, challenge, attempt, public profile).
- **Views** are functions `(container, params) → Promise`; each fetches its own data through `api.js` and renders template strings with `esc()` everywhere (XSS-safe by construction).
- **`state.js`** holds `me`/`skills`/`unread`; refreshed after money-affecting actions.
- **`wallet.js`** is the single blockchain boundary: SDK detection (`@nimiq/mini-app-sdk` → `init()`), `listAccounts/sign/sendBasicTransaction`, demo fallback. Views never touch providers.
- **`ui.js`** — design system: score rings, sheets, toasts, confetti (fast, `transform/opacity`-only animations), icon set (inline SVG).

## Scaling path

1. Swap `store.js` → Prisma/Postgres (schema ready).
2. Swap `providers.js` → hosted LLM w/ structured outputs (already integrated).
3. Add sandbox worker pool for execution-based coding checks (isolated-vm/Firecracker) behind `EvaluationService`.
4. Move rate-limit/nonce state to Redis; sessions to signed JWT + rotation.
5. Nimiq settlement worker: watch treasury payouts via RPC `getTransactionByHash`, flip ledger txs `pending → confirmed` on receipt.
