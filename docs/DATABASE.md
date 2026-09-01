# DATABASE

## MVP (this repo)

The runnable MVP uses an **embedded JSON store** (`server/store.js`) — zero external services, atomic writes (tmp + rename), serialized write queue, and declared **unique indexes** that carry real integrity weight (e.g. `rewards.key` makes double-claiming impossible, enforced in `tests/challenges.test.js`).

All service code talks to the store through five primitives — `insert / get / find / filter / update / remove` — so the production swap is a data-layer change only.

## Production model: PostgreSQL + Prisma

`prisma/schema.prisma` (in repo) implements the full product model:

| Model | Purpose | Key constraints |
|---|---|---|
| `User` | wallet identity, username, level, xp, reputation | unique `walletAddress`, unique `username` |
| `Skill` | catalog (12 domains, categories, popularity) | unique `slug` |
| `UserSkill` | derived score/tier/verification per user+skill | unique `(userId, skillId)`; **never user-set** |
| `LearningPath` | AI-generated path (goal, days JSON, progress JSON) | belongs to user |
| `Challenge` | proofs from paths + daily + templates | rubric JSON, passScore, reward |
| `ChallengeAttempt` | one submission cycle | unique `(challengeId, userId, startedAt)`; status machine |
| `Submission` | payload content (text/code/url) | size-capped |
| `Evaluation` | rubric result: criteria[], score, pass, engine, contentHash | index `(userId, challengeId, contentHash)` for dupe detection |
| `SkillProof` | completed proof record w/ `publicId` for share pages | unique `publicId` |
| `Achievement` / `UserAchievement` | unlock records | unique `(userId, achievementId)` |
| `Reward` | NIM reward per source | **unique `key`** (`userId:sourceId`) — claim-once guarantee |
| `WalletTransaction` | every money movement | status: `pending → confirmed/failed/cancelled`; network + ref (on-chain hash or `ledger:` id) |
| `SponsoredChallenge` / `SponsoredParticipant` | funded pools, join records | unique `(userId, sponsoredId)` |
| `MarketplaceTask` / `TaskApplication` | gigs gated by min proof score | unique `(taskId, userId)` per application; escrow tx ref |
| `TeachingSession` / `Booking` / `Review` | teach-to-earn | teacher must hold verified skill ≥ 70 (service-enforced) |
| `Notification` | in-app feed | read flag |

## Derived, not stored

To keep one source of truth, several "fields" are always computed:

- **skill tier** — from `score` via configurable thresholds (Novice 0-20 / Beginner 21-40 / Intermediate 41-70 / Advanced 71-90 / Expert 91-100)
- **user level** — from `xp` (`60·(n−1)²` curve)
- **qualification** for a task — `userSkill.score ≥ task.minProof.min`
- **opportunity count** — open tasks whose requirements the user's verified scores meet

## Migrating to Postgres

```bash
npm i -D prisma && npm i @prisma/client
npx prisma migrate dev --name init
```

Then implement `store.js`'s interface over PrismaClient (or inject it into services — they only use the DAO primitives). `database/schema.sql` mirrors the model for non-Prisma stacks.
