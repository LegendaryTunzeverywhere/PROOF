# COMPETITION DEMO — the 90-second story

**Goal:** the judge watches *learning → proof → money* happen in one continuous breath, and feels the climax:

> "You don't just have a certificate. **You have PROOF.**"

## Setup (30 seconds, before judging)

```bash
npm start                       # or: npm run dev
# optional fresh economy:
rm -rf data && npm start        # reseeds demo content on boot
```

Open the preview on a phone-sized viewport (390×844 is the design target).

## The flow (with what to say)

**0:00 — Hook (Home).**
"Learning platforms sell certificates. Certificates don't pay rent. This is PROOF."
→ Point at the hero: **Learn anything. Prove it. Earn with it.** and the NIM balance chip.

**0:10 — The goal.**
Type: `I want to learn web development` → **Start**.
The PROOF engine overlay runs: *Reading your goal → Selecting proof checkpoints → Attaching NIM rewards.*
"This took the judge's goal and built a personal path — 8 days, checkpoints every two days, **14 NIM** of rewards attached."

**0:25 — Learn (Path).**
Open Day 1 → a lesson: TL;DR, sections, working example, misconception warning, key points.
"Concise on purpose. Explain, example, ask — then it makes you *do* things."
Tap **Got it — practice** → answer a question with instant feedback. Open the **tutor** → "Explain simpler" → it coaches without giving answers.

**0:45 — PROVE.**
Back to the path → **Start proof** on the checkpoint.
Show the brief: requirements checklist, timer, pass mark, reward — and the **⌨️ Type-only proof** notice: "paste and drop are disabled; hand-typing is verified server-side."
Demo wallets get a **✍️ Demo auto-type** button — tap it and let the page type itself word-by-word (paste never happens; the judge watches the typing-verification system's own demo affordance). The analyzing animation: *Parsing your HTML… auditing accessibility… verifying hand-typed originality… scoring 6 rubric criteria…*

**0:55 — THE MOMENT.**
**86/100 · PASS ✓** · confetti · the chips row shows `⌨️ hand-typed ✓` · `+150 XP · +2 NIM` · the skill bar animates **Web Development 0% → 86% · ✓ VERIFIED** · then:
**"💼 You qualify for 2 opportunities."**
"Learning just became *earning*. That qualification isn't self-declared — the server graded real, hand-typed work against a rubric. No pasting, no AI dumps. Clients can't fake it, and neither can users."

**1:10 — EARN (Work).**
Tap through to **Find work** → *Build a landing page — 50 NIM · requires Web Development 70+* → the meter shows "you qualify."
Apply → demo client accepts → **Mark delivered** → `+49.00 NIM` (2% platform fee) lands in the balance.

**1:25 — Close (Profile + share).**
Profile: skill tree lighting up, verified skills, achievements, transactions (`demo-ledger` labeled honestly).
Tap **share** on Web Development → the public proof card (`/p/:id`): *PROOF VERIFIED · Tunz-style portability.*
"Connect Nimiq Pay and these rewards settle on-chain. Don't just say you can build — **Prove it.**"

## The prepared submission

The **Demo auto-type** button (visible for demo wallets on HTML challenges) types a realistic, slightly flawed landing page word-by-word — no alt text on one image, no meta description, single breakpoint. It scores **86/100 — PASS with visible improvement notes**, which demos the rubric's honesty better than a perfect 100. Prefer typing manually? Do that — paste is disabled either way.

(For scripted runs, the same page lives in `tests/fixtures/demo-submission.html`.)

## If something breaks live

- **Wallet:** demo mode needs no Nimiq Pay — "Connect wallet → Try with a demo wallet" is real Ed25519 auth, honestly labeled. On desktop the sheet defaults to **Nimiq Hub** (popup flow); if the CDN is unreachable in the preview sandbox, use the demo wallet.
- **Rate limit on retry:** by design — say "we block reward farming" and show the Work tab instead.
- **Anything else:** `npm run smoke` re-verifies the whole flow over HTTP in ~300 ms.

## The 10-second elevator version

"PROOF turns learning into demonstrated ability, and demonstrated ability into income — AI builds the path, the server grades real work against rubrics, verified skills unlock NIM-paid gigs and teaching. Nimiq is the economic rail."
