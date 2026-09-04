# PROOF — Learn it. Prove it. Earn it.

**An AI-powered skill-verification marketplace, built as a Nimiq Mini App.**

Traditional platforms certify that you *watched* something. PROOF verifies that you can *do* something — then turns that verified ability into real income.

```
LEARN → PRACTICE → PROVE → EARN → WORK → TEACH → EARN MORE
```

> Don't tell people you know something. **Prove it.**

---

## The 60-second version

1. **Say what you want to learn** — "I want to learn web development."
2. The **AI builds a personalized path**: lessons, practice, and practical **proof checkpoints** with NIM rewards attached.
3. You **build real things** (a landing page, a campaign, an analysis) and submit them.
4. The **server grades your work against a rubric** — clients can never claim a score. `84/100 · PASS ✓`
5. Your **skill profile updates** (Web Development: 0 → 84%, VERIFIED) and **+3 NIM** lands in your wallet.
6. Your verified score **unlocks paid work**: "Build a landing page — 50 NIM · requires Web Development 70+."
7. Teach what you know. Tip others. Join sponsored challenge pools.

That's the whole product: **learning → proof → money.**

---

## Quick start

```bash
cd proof
npm start          # → http://localhost:3000
```

**Zero dependencies. Zero keys.** The bundled ProofEngine handles paths, tutoring, and rubric-based grading deterministically. Optional upgrades via `.env`:

```bash
cp .env.example .env
# AI_API_KEY=…      → Google Gemini tutoring & feedback (schema-validated)
# NIMIQ_RPC_URL=…   → on-chain balances + Nimiq settlement references
npm test           # 32 unit tests
npm run smoke      # end-to-end demo flow over the real HTTP API
```

---

## What's inside

| Area | Highlights |
|---|---|
| **Proof engine** | Rubric-based server-side evaluation: semantic HTML analysis, responsive/accessibility audits, code structure checks, text/data/business/design rubrics, verbatim-copy and duplicate-hash detection |
| **Type-only proofs** | Paste/drop blocked in proof fields; hand-typing telemetry verified server-side — pastes are rejected outright, implausible typing can't pass or earn. Cheating can't print money. |
| **AI layer** | `AIService` facade — deterministic ProofEngine + **Google Gemini** (schema-validated JSON mode); scores from the engine are authoritative |
| **NIM economy** | Reward ledger with `pending → confirmed/failed/cancelled` states, one-reward-per-source unique constraints, daily anti-farming caps, 2% platform fee on gigs/teaching, escrowed task budgets, tips, payouts |
| **Wallet** | Official **Nimiq Pay** Mini App SDK (`init()` → `listAccounts` / `sign` / `sendBasicTransaction`) on mobile, the **Nimiq Hub** (Accounts Manager popup) on desktop — plus a clearly-labeled demo wallet using **real Ed25519** signature verification |
| **Marketplace** | Tasks gated by *verified* skill scores, applications, demo-client auto-accept, delivery → payout |
| **Teach-to-earn** | Only verified skills (70+) can be taught; booking pays the teacher net of fee; reviews move reputation |
| **Gamification** | XP, levels, streaks (never punitive), 8 achievements, multi-category leaderboard ranked by *demonstrated* ability |
| **UI/UX** | Bento-card design system: stacked cards on mobile, a **multi-column bento dashboard from 1024px** (hero bands full-width, paired tiles, floating dock nav); transform/opacity-only animations |
| **Portable proof** | Public proof pages (`/p/:id`) + shareable SVG skill cards (`/share/:id.svg`) — reputation that travels |

## Screens

`Home` (goal input, continue learning, today's proof, trending, sponsored, tasks) · `Learn` (paths, lessons, practice, AI tutor) · `Prove` (challenge runner, analyzing animation, score moment) · `Work` (marketplace / teach / sponsored) · `Profile` (skill tree, verified skills, achievements, wallet, transactions) · public proof pages.

## Design system — Nimiq UI Kit

The whole UI is built on the official [Nimiq UI Kit](https://nimiqtoolbox.github.io/nimiq-ui-kit/) tokens (`@nimiq/style`): brand palette, gold signet, blue-gradient hero surfaces, text opacity ladder, Muli + Fira Mono, 8px grid radii, pill buttons, notices, cards and the Nimiq easing curve.

- `web/nimiq.css` — the kit layer: official `--nimiq-*` tokens plus `.nq-button`, `.nq-input`, `.nq-card`, `.nq-notice`, `.nq-label`, … and a bridge that re-skins PROOF's existing classes (`.btn`, `.chip`, `.card`, `.modal`, `.sheet`, `.toast`) so every page adopts the kit without markup changes.
- `web/ui-kit.html` — live component showcase (buttons, popups, toasts, icons, rings, spinner) rendered by the app's real stylesheets.
- `web/js/ui.js` — shared kit components: Nimiq signet/hexagon SVGs, notice-style toasts, the hexagon loader, score ring, sheet popup (Esc-to-close, scroll lock, `role="dialog"`).

## Project layout

```
proof/
├── server/            # zero-dependency Node server (ESM, JSDoc-typed)
│   ├── index.js       # HTTP router, static, public proof pages
│   ├── auth.js        # nonce → Ed25519 signature → session
│   ├── seed.js        # demo identities & content (fictional, labeled)
│   ├── store.js       # embedded JSON store (production: Prisma/Postgres)
│   ├── ai/            # kb.js · engine.js · evaluators.js · service.js · providers.js
│   └── services/      # users · skills · challenges · evaluation · rewards · marketplace · teaching · notifications
├── web/               # hand-built SPA — no frameworks, no CDN, instant load
│   ├── styles.css     # base styles (tokens follow the Nimiq UI Kit palette)
│   ├── nimiq.css      # Nimiq UI Kit layer — official tokens, nq-* components, PROOF bridge
│   ├── ui-kit.html    # live component showcase
│   └── js/            # api · ui · wallet · state · main · views/*
├── tests/             # node:test suites + smoke.js (the 90s demo over HTTP)
├── prisma/schema.prisma   # production data model
├── docs/              # ARCHITECTURE · DATABASE · AI · WALLET · SECURITY · DEPLOYMENT · COMPETITION-DEMO
└── .env.example
```

## Honest engineering notes

- **No faked blockchain.** Without an RPC/treasury configured, rewards settle to an in-app **demo ledger**, labeled `demo-ledger` in every transaction. With Nimiq Pay connected, payments go through the wallet's real `sendBasicTransaction` and the hash is recorded.
- **No client-trusted anything.** Scores, XP, levels, rewards, qualifications, and payouts are computed and stored server-side. Tests prove it (`tests/challenges.test.js`).
- **Demo identities are fictional and labeled** (`Tunz`, marketplace clients…) so judges are never misled by seeded data.

## Documentation

[ARCHITECTURE](docs/ARCHITECTURE.md) · [DATABASE](docs/DATABASE.md) · [AI](docs/AI.md) · [WALLET](docs/WALLET.md) · [SECURITY](docs/SECURITY.md) · [DEPLOYMENT](docs/DEPLOYMENT.md) · [COMPETITION-DEMO](docs/COMPETITION-DEMO.md)

---

**PROOF** — a global proof-of-skill network, one verified skill at a time. ⬢ Powered by Nimiq.
