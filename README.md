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

## Why Nimiq Makes This Possible

PROOF wouldn't work without Nimiq's unique advantages:

**Micro-Payments That Actually Make Sense**
- Traditional payment processors charge 2.9% + $0.30 per transaction
- On a $3 learning reward, that's 10%+ overhead before any platform cut
- Nimiq's near-zero fees make $0.50 - $5 skill rewards economically viable for the first time

**Global Access, Zero Gatekeepers**
- No account setup required
- No country restrictions or KYC barriers  
- 100% of your earnings go to you (not 70% after app store cuts)
- True peer-to-peer economy

**Instant Settlements, Real Ownership**
- Proof verified → NIM earned → immediately spendable
- No waiting periods, no holds, no chargebacks
- Your wallet, your crypto, your control
- On-chain transparency for every transaction

**Trust Through Verifiability**
- Every proof is server-graded and publicly shareable
- Transaction history is on-chain and auditable
- Skills are verified, not self-reported
- Reputation travels with you across the Nimiq ecosystem

---

## Quick start

```bash
cd proof
npm start          # → http://localhost:3001
```

**Zero required dependencies. Zero keys.** `npm start` boots with the bundled in-memory store and the local ProofEngine (deterministic paths, tutoring, and rubric-based grading). Only `DB_MODE=supabase` needs `npm install` (pulls `@supabase/supabase-js`). Optional upgrades via `.env`:

```bash
cp .env.example .env
# AI_API_KEY=…      → Google Gemini tutoring & feedback (schema-validated)
# NIMIQ_SEED_NODES=wss://…,...
# TREASURY_ADDRESS=NQ…
# TREASURY_KEY=…     → server-side key for automatic reward payouts
npm test           # 43 unit tests
npm run smoke      # end-to-end demo flow over the real HTTP API (needs the server running; see SMOKE_BASE)
```

### Chess puzzle data

The chess practice catalog is populated from the Lichess open puzzle database:

<https://database.lichess.org/#puzzles>

Import a larger catalog into Supabase with:

```bash
npm run import:chess -- path/to/lichess_db_puzzle.tsv 5000
```

The final argument is the target number of puzzles per difficulty-and-motif bucket. The importer defaults to 5,000 when the argument is omitted. See [docs/CHESS-DATA.md](docs/CHESS-DATA.md) for download, schema, verification, and attribution requirements.

Lichess puzzle data is provided under the [Creative Commons Attribution-ShareAlike 4.0 International license](https://creativecommons.org/licenses/by-sa/4.0/). PROOF preserves the source metadata and credits Lichess in its chess data documentation.

---

## What's inside

**287 hand-crafted lessons across 12 in-demand skills:**

💻 Web Development • 🐍 Python • 🎨 UI Design • 📈 Marketing • 📊 Data Analysis • 🤖 AI • ✍️ Writing • 📱 Social Media • 💼 Business • 🗣️ Languages • 🎵 Music Production • 🔧 Practical Skills • **Plus:** ⛓️ Blockchain & Nimiq

**Every lesson includes:**
- Clear explanations with real examples
- Practice questions with detailed "why" feedback
- Hands-on challenges with rubric grading
- Common misconceptions explicitly addressed
- AI Socratic tutoring on demand

**~288 hours of learning content** | **122 NIM in rewards** | **6,100 XP available**

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

- **No faked blockchain.** Without `NIMIQ_SEED_NODES`, `TREASURY_ADDRESS`, and `TREASURY_KEY`, rewards settle to an in-app **demo ledger**, labeled `demo-ledger` in every transaction. When all three are configured, every passing reward is signed by the treasury and broadcast to the user's connected Nimiq address; the on-chain transaction hash is recorded.
- **No client-trusted anything.** Scores, XP, levels, rewards, qualifications, and payouts are computed and stored server-side. Tests prove it (`tests/challenges.test.js`).
- **Demo identities are fictional and labeled** (`Tunz`, marketplace clients…) so judges are never misled by seeded data.

## Documentation

[ARCHITECTURE](docs/ARCHITECTURE.md) · [DATABASE](docs/DATABASE.md) · [AI](docs/AI.md) · [WALLET](docs/WALLET.md) · [SECURITY](docs/SECURITY.md) · [DEPLOYMENT](docs/DEPLOYMENT.md) · [COMPETITION-DEMO](docs/COMPETITION-DEMO.md)

---

**PROOF** — a global proof-of-skill network, one verified skill at a time. ⬢ Powered by Nimiq.

---

## 🏆 Competition Submission

**Category:** Education & Skill Verification  
**Competition:** Nimiq Mini Apps Competition - Cycle II

### The Problem We Solve

Traditional certificates prove you *watched* something. Employers don't trust self-reported skills. Learners can't monetize their abilities without expensive credentials or employment.

**PROOF creates verifiable, server-graded skill proofs that unlock immediate income opportunities.**

### What Makes PROOF Unique

1. **Server-Side Anti-Cheat** — Clients can't fake scores. Type-only verification with paste detection ensures genuine skill demonstration.

2. **Complete Learn → Earn Flow** — Not just a learning platform or just a marketplace. PROOF connects verified skills directly to paid opportunities.

3. **Portable Reputation** — Public proof pages (`/p/:id`) and shareable SVG skill cards mean your verified abilities travel with you.

4. **AI-Personalized Paths** — Every learning journey is custom-generated based on your goals, not one-size-fits-all courses.

### Built For Nimiq Pay

- **Economy powered entirely by NIM** — All rewards, marketplace payments, tips, and teaching fees
- **Showcases micro-payment viability** — $0.50 - $5 skill proofs are economically feasible 
- **Zero platform fees** — 100% of earnings go to users, demonstrating Nimiq's advantage over app stores
- **Mobile-first with Nimiq Pay SDK** — Native wallet integration, instant settlements
- **Open source** — Educational example for other Mini App builders

### Try It

1. Open Nimiq Pay or visit the [web demo](#)
2. Connect your wallet (or try demo mode with Ed25519 signatures)
3. Set a learning goal: "I want to learn JavaScript"
4. Complete a lesson, submit a hand-typed proof
5. Earn NIM, unlock marketplace opportunities

**No signup. No credit card. Just prove your skills and get paid.**
