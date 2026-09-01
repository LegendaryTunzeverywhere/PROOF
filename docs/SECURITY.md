# SECURITY

## Threat model → controls

| Threat | Control |
|---|---|
| Client claims "I scored 100" | Impossible: submissions carry **content + typing telemetry only**. Extra fields (`score`, `status`, `rewardNim`) are stripped by `ChallengeService.validatePayload` and ignored. Proven in `tests/challenges.test.js`. |
| Copy-paste / AI-dump farming | Type-only proofs (see next row): paste → rejected; implausible typing → forced fail, no reward. |
| Reward farming (resubmit loops) | Server-side min interval per challenge (`MIN_ATTEMPT_INTERVAL_MS`, enforced in `startAttempt` → HTTP 429), daily rewarded-attempt cap, daily NIM cap. |
| Double-claiming one reward | `rewards.key = "userId:sourceId"` with a **unique index** — the DB rejects duplicates. One passing challenge = one reward, ever. |
| Copy-pasted/duplicate submissions | SHA-256 content hash per evaluation; identical hashes per user+challenge flag the attempt `duplicate` → ineligible for rewards. Verbatim brief-copying is score-penalized in text evaluations. |
| Copy-pasted/AI-generated submissions | **Type-only proofs.** The client blocks paste/drop in proof fields and reports edit telemetry (`effort`, `pastes`, `ms`) with the submission. The server **rejects pasted submissions outright** (`PASTE_DETECTED`) and **fails submissions whose edit-count/timing is implausible for a human** (no pass, no reward). Submissions without telemetry (API bypass) are rejected (`TYPING_REQUIRED`). Honest limitation: a fully custom client can fabricate telemetry — production adds real keystroke dynamics (dwell/flight-time entropy) and content-stylometry checks; `TYPING_VERIFICATION=off` disables the gate for load tests. |
| Wallet impersonation | Address ≠ auth. Sessions require an Ed25519 signature over a server-issued single-use nonce (10-min TTL) in the Nimiq signed-message format. Nonce endpoints are rate-limited per IP. |
| XP/level/score tampering | Derived server-side only; `UserService.update()` physically deletes protected fields (`xp`, `level`, `balanceLuna`, …) from any client patch. |
| Qualification fraud | Task/teaching gates read *verified* `UserSkill.score` — derived from server-evaluated proofs — never self-declared claims. |
| XSS | All user/AI content is escaped (`esc()`) before interpolation; `innerHTML` never receives raw user data; the code-preview iframe is `sandbox=""` (no scripts). |
| Oversized payloads / DoS | Request body cap (1.5 MB), submission cap (`MAX_SUBMISSION_BYTES`), payload shape allowlists per challenge type. |
| Session theft | HttpOnly + SameSite=Lax cookie; 30-day expiry; server-side session table. |
| Arbitrary code execution | **Never** — user code is analyzed statically, not executed on the API server (spec §11). Production adds an isolated sandbox worker if execution checks are wanted. |
| Secret leakage | All secrets via env (`AUTH_SECRET`, `AI_API_KEY`, `TREASURY_KEY`); `.env` gitignored; `.env.example` documents shape; demo mode needs **no** secrets and uses an ephemeral dev secret with a boot warning. |

## Economy integrity invariants (asserted by tests)

1. A reward exists at most once per `(user, source)` — even across restarts.
2. Daily reward total ≤ `DAILY_REWARD_CAP_NIM`; rewarded attempts ≤ `DAILY_REWARDED_ATTEMPTS_CAP`.
3. Every tx passes through `pending` and ends `confirmed | failed | cancelled`, with a network label (`demo-ledger` vs `nimiq`) — the UI may never claim unconfirmed money.
4. Task/teaching payments escrow or fail atomically; the platform fee (2%) is computed server-side on release.
5. Reputation changes are event-driven (completed gigs, received reviews) — never client-settable.

## Known MVP limits (documented, intentional)

- Rate limiting and nonces are in-memory per process → move to Redis for multi-instance.
- Ed25519 verification supports the documented Nimiq signed-message format; when running inside Nimiq Pay, signature verification against the live provider response should also be cross-checked via RPC if strict parity is required.
- No CSRF tokens: the API is cookie-authenticated JSON; SameSite=Lax covers the MVP's same-origin UI. Production adds CSRF tokens for state-changing routes.
