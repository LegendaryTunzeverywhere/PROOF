# PROOF — Smoke Test & Feedback Report

**Date:** 2026-09-04 · **Commit:** `1c316b4` (`fix(user-stats): await async store calls…`, branch `arena/01a06a1a-proof`)
**Environment:** Node v22.22.3 · npm 10.9.8 · default config (no `.env` — local ProofEngine, demo ledger)
**Scope:** server boot → unit tests (`npm test`) → end-to-end smoke (`npm run smoke`) → live probe of every major API route → `npm run typecheck`

---

## Verdict

| Gate | Result |
|---|---|
| Server boots (`npm start`) | ❌ **Fails out of the box** — works only after `npm install` |
| Unit tests (`npm test`) | ❌ **19 / 43 pass · 24 fail** |
| Smoke test (`npm run smoke`) | ❌ **12 / 13 checks pass, then crashes** at the marketplace step |
| Live API probe (13 routes) | ⚠️ **4 routes return `{}` instead of data** (Work & Teach surfaces broken) |
| `npm run typecheck` | ✅ Clean |

**Bottom line:** the core Learn → Prove → Earn loop works end-to-end and is genuinely impressive for a zero-framework stack, but the async-store refactor (commit #7) was only partially applied. Un-awaited async calls break the marketplace, teaching, and qualification surfaces in production code, and the test suite was never updated. Demo-blocking until B1–B4 are fixed.

---

## Findings

### 🔴 B1 — Server does not boot without `npm install` (README says "Zero dependencies")

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@supabase/supabase-js'
  imported from server/supabase-store.js
```

- `server/index.js:12` statically imports `./supabase-store.js`, which imports `@supabase/supabase-js` — **even when `DB_MODE=store`** (in-memory mode, the default).
- README's "Zero dependencies. Zero keys." / `npm start` quick-start is therefore wrong for a fresh clone.
- **Fix:** lazy-import `SupabaseStore` only when `DB_MODE=supabase` (`await import('./supabase-store.js')`), or vendor a stub. Alternatively, update the README — but lazy import is the better fix and keeps the "instant demo" promise.

### 🔴 B2 — Un-awaited async service calls: 4 API routes return `{}` (user-visible breakage)

The Supabase migration made service methods `async`; several route handlers in `server/index.js` still call them synchronously. A Promise serialized by `JSON.stringify` becomes `{}`.

| Route | Handler | Call not awaited | Live response |
|---|---|---|---|
| `GET /api/market/tasks` | `index.js:638` | `market.listTasks(…)` | `{"tasks":{}}` |
| `GET /api/market/tasks/:id` | `index.js:642` | `market.get(…)` (→ async `taskView`) | `{"task":{}}` |
| `GET /api/teach/sessions` | `index.js:667` | `teaching.list(…)` | `{"sessions":{}}` |
| `GET /api/teach/mine` | `index.js:675` | `teaching.mine(…)` | `{"sessions":{}}` |

**Impact on the UI:** `web/js/views/work.js:46-52` does `tasks.filter(…)` / `tasks.map(…)` on the response — the **Work page throws in the browser** ("No open tasks" is never rendered; it's a hard crash). Teach listings are equally broken.

**Fix:** make the handlers `async` and `await` the calls (mirroring the already-correct `GET /api/market/my` at `index.js:660` and `GET /api/leaderboard` at `index.js:689`). Then re-run `npm run smoke`.

### 🔴 B3 — `qualification` in the proof-submit response is a Promise

- `server/services/challenges.js:292`: `const qualification = this.qualificationSnapshot(userId);` — but `qualificationSnapshot` is `async` (line 306).
- Result: the submit response's `qualification` serializes to `{}`, so `result.qualification.opportunities` is `undefined` (this is exactly the smoke check that failed: `✗ opportunities unlocked — undefined tasks`).
- **Fix:** `const qualification = await this.qualificationSnapshot(userId);` (`submitAttempt` is already `async`).

### 🔴 B4 — Unit test suite: 24 / 43 failing (stale tests, not engine bugs)

Every failing suite calls the now-`async` service methods **without `await`**, so e.g. `tb.users.createUser({})` returns a Promise; `user.id` → `undefined`; downstream lookups return `null` → `TypeError: Cannot read properties of null (reading 'proofsAttempted')`.

| Suite | Fail | Examples of missing await |
|---|---|---|
| `tests/auth.test.js` | 3/4 | `tb.auth.issueNonce(…)` (now `async`, `auth.js:31`) not awaited in tests 1–2; `createUser`/`createSession`/`userFromToken` (all `async`) not awaited in test 3 — also triggers the unhandled rejection `token.includes is not a function` |
| `tests/challenges.test.js` | 6/6 | `tb.users.createUser({})` at lines 7, 32, 49, 61… |
| `tests/economy.test.js` | 3/4 | same pattern (lines 7, 13, 32-33, 45-46…) |
| `tests/marketplace.test.js` | 2/3 | `createUser` at lines 7, 15, 41-42, 55-56 |
| `tests/typing.test.js` | 5/7 | `createUser` at lines 11, 41, 59, 70, 86 |
| `tests/badges.test.js` | 1/1 | `awardBadge` assertion fails downstream of un-awaited `createUser` path (note: this suite awaits correctly at line 20 — its failure is the `first_lesson` badge not awarding, worth a second look after B2/B4 fixes) |
| `tests/wallet-service.test.js` | 1/3 | test 38 |

**Fix:** add `await` at the listed call sites. Commit #7 fixed `user-stats` helpers only; the same sweep is needed across the tests. Passing suites (`evaluation`, `store`, `typing` core, `wallet-service` 2/3) show the engine itself is healthy.

### 🟠 M1 — `tests/smoke.js` port + robustness

- Header comment says "assumes the server is running on **:3000**" but `BASE = 'http://localhost:3001'` (line 4). Confusing for anyone following the README (which says start on 3000).
- The script **crashes with an unhandled `TypeError`** (`tasks.find is not a function`, line 84) instead of recording a failed check — caused by B2, but the harness should fail gracefully like its other checks (`ok(...)`).
- Exit-code behavior is otherwise good (`process.exitCode = 1`).

### 🟠 M2 — `/api/paths` response is missing `rewardNim`

- Smoke prints `8 days · undefined NIM pool` — the check passes only because it asserts `days.length >= 5`. `path.rewardNim` no longer exists in the response (the pool only survives inside the free-text `description`: "worth up to 14 NIM"). Either restore the field or update the smoke test; the frontend's use should be audited too.

### 🟡 Minor / polish

1. **README drift:** claims "32 unit tests"; there are 43 (24 failing). Also "Zero dependencies" (see B1).
2. `.gitignore` lists `prompt.txt`, yet `prompt.txt` (28 KB) is committed.
3. Root-level ad-hoc scripts (`test-all-apis.js`, `verify-fixes.js`, `test-home-performance.js`) aren't wired into `package.json` scripts and duplicate coverage; consider moving to `scripts/` or deleting.
4. `tests/helpers.js` seeds each test into `./data/test-*` dirs but nothing cleans them up — `data/` is gitignored, fine, but repeated runs litter the workspace.
5. Server log output during smoke was clean — no 500s logged, which silently masks B2/B3 (responses are 200 `{}`). Consider logging a warning when a route handler returns a Promise.

---

## What works well (credit where due)

- **Core loop is solid:** onboard → 8-day path generated in **12 ms** (deterministic engine) → lesson → Socratic tutor (`intent=simplify`) → XP → paste rejection → hand-typed submission scored **100/100** → **+2 NIM** → skill verified 0→100% → rate-limit on instant retry. All over real HTTP.
- **Anti-cheat actually works over the wire:** pasted submission rejected (`PASTE_DETECTED`) without consuming the attempt; client-injected `score/status` fields are ignored (covered by unit tests 12, 23 that pass).
- **Public proof surfaces:** `/p/:id` page renders "PROOF VERIFIED"; `/share/:id.svg` serves SVG with correct content-type.
- **Healthy routes:** `/api/home`, `/api/me`, `/api/onboard`, `/api/paths`, `/api/lesson/*`, `/api/tutor`, `/api/skills`, `/api/skills/tree`, `/api/leaderboard`, `/api/market/my`, `/api/wallet`, static assets, daily challenge.
- **`npm run typecheck` clean**; honest degraded-mode startup banners (engine/ledger/secret warnings) are excellent developer UX.

---

## Prioritized fix list

| # | Fix | File(s) | Effort |
|---|---|---|---|
| 1 | `await` the four broken route handlers (B2) | `server/index.js:638,642,667,675` | ~15 min |
| 2 | `await this.qualificationSnapshot(userId)` (B3) | `server/services/challenges.js:292` | 2 min |
| 3 | Sweep `await` through failing tests (B4) | `tests/*.test.js` | ~1 h |
| 4 | Lazy-import Supabase store so `npm start` works with zero deps (B1) | `server/index.js:12`, `server/supabase-store.js` | ~30 min |
| 5 | Harden smoke.js (graceful failure, fix port comment, `BASE` from `env.PORT` or 3000) | `tests/smoke.js:4,84` | ~15 min |
| 6 | Restore `path.rewardNim` in API response (M2) | `server/services/learning-goals.js` / route | ~15 min |
| 7 | README test-count + zero-deps claims; sweep stale `data/test-*` | `README.md`, `tests/helpers.js` | ~15 min |

**Repro:**

```bash
npm install                 # required today (see B1)
PORT=3001 node server/index.js &
npm run smoke               # 12 ✓ then crash at line 84 (B2)
npm test                    # 19 pass / 24 fail (B4)
curl -s localhost:3001/api/market/tasks   # → {"tasks":{}}  (B2)
curl -s localhost:3001/api/teach/sessions # → {"sessions":{}} (B2)
```

*Report generated from a live run; server log tail and raw outputs available on request. No source code was modified during this test pass.*
