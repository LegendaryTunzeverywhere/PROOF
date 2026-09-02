# PROOF — Competition UI/UX Audit & Agent Handoff

## Current branch
`feat/competition-ui-ux-polish`

## Product
PROOF — Learn it. Prove it. Earn it.
Nimiq Mini App competition entry. Preserve the existing vanilla JS architecture, API contracts, Nimiq wallet flows, proof/evaluation logic, and deterministic server grading unless a real bug requires a change.

## Audit scope
Routes inspected:
- Onboarding
- Home
- Learn hub
- Learning path detail
- Lesson reader
- Pre-lesson Socratic flow
- Reviews hub
- Review session
- Prove hub
- Proof challenge runner
- Proof attempt/result
- Daily proof
- Work: Find work / Teach / Sponsored
- Profile
- Leaderboard
- Notifications
- Public profile
- Socratic sessions
- Glossary

Key source files:
- `web/index.html`
- `web/styles.css`
- `web/competition-polish.css`
- `web/js/main.js`
- `web/js/ui.js`
- `web/js/views/onboarding.js`
- `web/js/views/home.js`
- `web/js/views/learn.js`
- `web/js/views/reviews.js`
- `web/js/views/prove.js`
- `web/js/views/work.js`
- `web/js/views/profile.js`
- `web/js/views/misc.js`
- `web/js/views/socratic.js`
- `web/js/views/glossary.js`

## Problems found
1. Desktop navigation was effectively a mobile bottom nav and did not expose Work.
2. Desktop layouts were only partially re-composed; some pages still felt like a narrow mobile page placed on a large canvas.
3. Several pages use dense inline styles and generic card stacks, making hierarchy inconsistent.
4. Prove has a strong concept but the empty state and sponsored area can feel unfinished when data is absent.
5. Learn and lesson flows are feature-rich but can become visually dense on small screens.
6. Secondary Socratic/Glossary views use older styling conventions and should be brought into the main design system.
7. Navigation and content need stronger 44px touch targets and reduced-motion support.
8. Long usernames, skill names, and labels need robust wrapping/overflow handling.

## Changes already made
- Added `web/competition-polish.css` loaded after the existing stylesheet.
- Added responsive rules for <=360px, <=420px, tablet, and >=1024px desktop.
- Added desktop floating vertical navigation.
- Added Work to desktop navigation while keeping mobile at the original five primary destinations.
- Added accessible nav labels and minimum touch target sizing.
- Added desktop content offset so the dock does not overlap content.
- Improved home hero/card sizing on desktop.
- Improved pre-lesson presentation and focused lesson reader sizing.
- Improved proof emphasis and work tab scrolling.
- Added reduced-motion handling and overflow protection.
- Kept wallet/API/business logic untouched.

## Remaining high-priority work
### P0 — visual QA
Run the real app and capture every route at:
- 320x800
- 375x812
- 390x844
- 430x932
- 768x1024
- 1024x768
- 1280x800
- 1440x900

Check:
- no horizontal overflow
- no clipped buttons
- no nav overlap
- no huge unexplained blank regions
- no text collisions
- all interactive controls are reachable

### P0 — state QA
Test:
- logged out/onboarding
- demo wallet
- Nimiq Hub connected
- Nimiq Pay environment
- empty paths
- active path
- completed path
- no reviews / many reviews
- no proof checkpoints
- active proof
- passed proof
- failed proof
- rate-limited proof
- empty marketplace
- qualified/unqualified marketplace task
- empty profile
- populated profile
- API failure on every major route

### P1 — design consistency
Refactor secondary views to use the same visual system:
- Socratic sessions
- Glossary
- public profile
- notifications
- leaderboard

Prefer shared classes/components over more inline styles.

### P1 — Prove signature experience
Make the proof runner feel like PROOF's flagship moment:
1. clear task and reward
2. progress/time without anxiety
3. large focused answer area
4. requirements checklist
5. submission confidence state
6. analyzing state
7. score/result reveal
8. verified skill update
9. NIM reward moment
10. next action: Learn more / Find work / Share proof

### P1 — desktop information architecture
Desktop should feel like a real web product:
- persistent vertical nav
- content max-width around 1100–1180px
- strong two-column/bento composition on dashboard pages
- focused single-column reading surfaces
- no mobile bottom-nav behavior on desktop

### P2 — polish
- replace emoji-only visual hierarchy where appropriate with the existing inline SVG icon set
- normalize spacing tokens
- reduce unnecessary rounded-card nesting
- strengthen empty/loading/error states
- improve keyboard/focus behavior
- add subtle hover states without excessive motion

## Important constraints
- Do NOT replace the vanilla JS architecture with React/Vue/Next.
- Do NOT replace the Nimiq wallet integration with browser Ethereum wallet flows.
- Do NOT weaken proof anti-farming/type-only safeguards.
- Do NOT move grading authority to the client.
- Do NOT add unnecessary dependencies or CDNs.
- Do NOT break existing hash routes.
- Keep NIM visually special but do not turn the UI into a crypto exchange.
- Prefer plain-language labels over blockchain jargon.

## Handoff prompt for the next agent

You are continuing work on **PROOF — Learn it. Prove it. Earn it.**, a Nimiq Mini App competition submission.

Repository: `avatarhang001/PROOF`
Current branch from the previous agent: `feat/competition-ui-ux-polish`

First, inspect the current branch and read this file completely. Then inspect the full `web/` implementation and compare it against the product goal and competition-level UX standards.

Your mission is NOT to rewrite the app. Your mission is to finish it to competition-winning quality while preserving functionality.

### Step 1 — understand the product
PROOF turns learning into demonstrated ability:
**LEARN → PRACTICE → PROVE → EARN → WORK → TEACH → EARN MORE**.

The signature differentiator is that users do practical proof challenges, receive server-graded verified scores, earn NIM, and can use verified skills to unlock paid work.

### Step 2 — inspect every route
Audit every route in `web/js/main.js`, including nested routes and stateful flows:
- onboarding
- home
- learn
- learning path
- lesson
- reviews
- review session
- socratic
- glossary
- prove
- proof challenge
- proof attempt/result
- daily proof
- work/market
- work/teach
- work/sponsored
- profile
- leaderboard
- notifications
- public profile

Do not assume a route is good because the main page looks good. Inspect the actual rendering code and event handlers.

### Step 3 — inspect all states
For each page identify and improve:
- loading
- empty
- populated
- success
- failure
- disabled
- disconnected wallet
- demo wallet
- real wallet
- mobile
- desktop
- keyboard/focus
- long text

### Step 4 — design direction
Use a premium learning-product aesthetic:
- warm off-white/lavender background
- deep indigo/ink for knowledge and navigation
- Nimiq orange only for NIM/reward moments
- green for verified/completed states
- restrained shadows
- clear typography hierarchy
- generous but purposeful whitespace
- strong editorial layout
- minimal visual noise

Avoid:
- generic crypto dashboards
- neon cyberpunk
- excessive gradients
- excessive glassmorphism
- giant empty sections
- tiny unreadable uppercase labels
- nested rounded rectangles everywhere

### Step 5 — responsive requirements
Must look intentional at:
320, 375, 390, 430, 768, 1024, 1280, 1440px widths.

Mobile:
- 5-item primary bottom nav
- 44px touch targets
- no horizontal scrolling except intentional chip/tab rails
- readable typography
- bottom-safe-area support

Desktop:
- persistent vertical nav with Work visible
- content offset so nav never overlaps content
- max content width ~1100–1180px
- dashboard bento/grid where useful
- focused single-column reading surfaces
- no mobile bottom navigation

### Step 6 — preserve functionality
Do not break:
- Nimiq Pay SDK behavior
- Nimiq Hub behavior
- demo wallet
- API endpoints
- hash routing
- server-side proof grading
- typing telemetry/type-only proof
- reward ledger
- marketplace qualification
- Socratic learning
- spaced repetition

### Step 7 — fix, don't just report
Make the code changes directly. Prefer small reusable CSS/classes/components over adding more inline styles.

### Step 8 — verify
Run available syntax/build/tests. If a browser is available, manually smoke-test all routes and widths. If a browser is unavailable, at minimum perform static checks for:
- JS syntax errors
- broken imports
- invalid selectors
- missing IDs/event targets
- route mismatches
- obvious overflow

### Step 9 — Git workflow
You MUST work on a feature branch. Commit coherent changes. Before you run out of context/time:
1. make sure the branch contains the latest working changes
2. create a PR into `main`
3. include a concise summary and testing notes
4. if all checks pass and there are no unresolved blockers, merge the PR
5. leave the repository on a clean, merged state

Do not stop at “I made changes locally.” The goal is a merged, usable repository.

### Step 10 — final report
Return:
- pages audited
- problems found
- files changed
- tests/checks run
- PR number
- merge commit SHA
- any remaining blockers

Be proactive. If you find an obvious UX bug while auditing a page, fix it rather than merely mentioning it.
