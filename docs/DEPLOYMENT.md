# DEPLOYMENT

## Run anywhere Node ≥ 18 runs

```bash
npm start   # binds 0.0.0.0:$PORT (default 3000) — no build, no install
```

Health: `GET /api/health`.

## Environment

Copy `.env.example` → `.env`. Minimum viable = no variables at all (demo mode).
Production checklist:

| Variable | Why |
|---|---|
| `AUTH_SECRET` | **required in prod** — persistent session tokens (`openssl rand -hex 32`) |
| `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL` | LLM-enhanced tutor/feedback (optional; engine otherwise) |
| `NIMIQ_RPC_URL`, `NIMIQ_NETWORK` | on-chain balance reads + settlement refs |
| `TREASURY_ADDRESS`, `TREASURY_KEY` | on-chain reward payouts (production; treat as hot-wallet material) |
| `PASS_THRESHOLD`, caps | economy tuning |

## Hosting shapes

**A. Static host + tiny VM (recommended for the competition)**
Any VM/container running `node server/index.js` behind TLS (Caddy/Traefik/nginx). The server serves both the SPA and the API — one process, one port.

**B. Split**
Serve `web/` from a CDN/edge; point `api.js`'s base at the API host; enable CORS allowlist for the app origin.

## Nimiq Pay submission

1. Deploy with HTTPS at your domain.
2. Register/list the mini app so Nimiq Pay recognizes the origin.
3. Share via `https://nimpay.app/miniapps/open/<your-domain>` or `nimiqpay://miniapp?url=<your-domain>`.
4. Inside Nimiq Pay, `@nimiq/mini-app-sdk`'s `init()` resolves the injected provider automatically — `WalletService` detects it with no code changes.

## Production hardening sequence

1. `store.js` → Prisma/Postgres (schema in `/prisma`), Redis for nonces + rate limits.
2. Process manager (systemd/pm2) + log drain; `NODE_ENV=production`.
3. Treasury payout worker: send from treasury via RPC, store tx hash in `wallet_txs.ref`, confirm on receipt (flip `pending → confirmed`).
4. Backups: Postgres PITR; the embedded store already does atomic writes for dev.
5. Observability: `/api/health` + request log → uptime check.

## CI

```bash
npm test          # unit suites (node:test)
npm run smoke     # boots nothing; walks the demo flow against a running server
```
