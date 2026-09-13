/** Shared test bed: fresh store + wired services per test file. */
import { Store } from '../server/store.js';
import { config } from '../server/config.js';
import { seed } from '../server/seed.js';
import { AuthService } from '../server/auth.js';
import { UserService } from '../server/services/users.js';
import { SkillService } from '../server/services/skills.js';
import { RewardService } from '../server/services/rewards.js';
import { NotificationService } from '../server/services/notifications.js';
import { ChallengeService } from '../server/services/challenges.js';
import { MarketplaceService } from '../server/services/marketplace.js';
import { TeachingService } from '../server/services/teaching.js';

export async function testbed() {
  config.nimiq.rpcUrl = '';
  config.nimiq.treasuryAddress = '';
  config.nimiq.treasuryMnemonic = '';
  config.nimiq.treasuryKey = '';

  const store = new Store({ dataDir: './data/test-' + Math.random().toString(36).slice(2, 8) });
  await store.open(seed);
  const auth = new AuthService(store, config);
  const users = new UserService(store, config);
  const skills = new SkillService(store, config);
  const rewards = new RewardService(store, config);
  const notifications = new NotificationService(store);
  const challenges = new ChallengeService(store, config, { users, skills, rewards, notifications });
  const market = new MarketplaceService(store, config, { users, skills, rewards, notifications });
  const teaching = new TeachingService(store, config, { users, skills, rewards, notifications });
  return { store, config, auth, users, skills, rewards, notifications, challenges, market, teaching };
}

/**
 * Wraps a real (embedded) Store so the given method names genuinely
 * return Promises, matching SupabaseStore's actual async signatures for
 * count()/filter()/find()/all()/etc (the embedded store's versions are
 * synchronous). Catches the "forgot to await this" bug class directly:
 * un-awaited arithmetic on a Promise (e.g. `(await store.count(...)) * 8`
 * written without the await) produces NaN, which is exactly what would
 * happen against a real SupabaseStore in production.
 */
export function asyncStore(store, methods) {
  const methodSet = new Set(methods);
  return new Proxy(store, {
    get(target, prop) {
      if (methodSet.has(prop)) {
        return async (...args) => target[prop](...args);
      }
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

/**
 * Wraps a real (embedded) Store so get() on the given tables returns a
 * fresh shallow copy each time, instead of the same object reference.
 * This mimics SupabaseStore's behavior (it fetches a fresh row from
 * Postgres on every get(), and its save() is a documented no-op), which
 * makes bugs reproduce where code mutates a fetched row in place and
 * relies on store.save() to persist it — a pattern that only "works" on
 * the embedded store by accident, because of shared object references.
 */
export function copyOnReadStore(store, tables) {
  const tableSet = new Set(tables);
  const clone = (row) => (row ? { ...row } : row);
  return new Proxy(store, {
    get(target, prop) {
      if (prop === 'get') {
        return (table, id) => (tableSet.has(table) ? clone(target.get(table, id)) : target.get(table, id));
      }
      if (prop === 'find') {
        return (table, pred) => (tableSet.has(table) ? clone(target.find(table, pred)) : target.find(table, pred));
      }
      if (prop === 'filter') {
        return (table, pred) => (tableSet.has(table) ? target.filter(table, pred).map(clone) : target.filter(table, pred));
      }
      if (prop === 'all') {
        return (table) => (tableSet.has(table) ? target.all(table).map(clone) : target.all(table));
      }
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

/** Realistic hand-typing telemetry for a given text (what a real typist produces). */
export const typedMeta = (text) => {
  const chars = String(text).length;
  return {
    effort: Math.max(20, Math.ceil(chars * 0.6)), // ~1 edit per 1.7 chars (typos + corrections)
    pastes: 0,
    ms: Math.max(2500, Math.ceil(chars * 180)),   // ~3–4 chars/sec — slower than a casual typist
  };
};

/** A solid landing-page submission (should pass). */
export const goodHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Nimbus Kicks — restored sneakers.">
<title>Nimbus Kicks</title><style>
:root{--brand:#5b57d9;--space:16px}
body{font-family:system-ui;margin:0;color:#16182d}
header{display:flex;justify-content:space-between;padding:16px}
nav a{margin-right:12px}
.hero{padding:48px 16px;text-align:center}
.hero h1{font-size:clamp(28px,5vw,44px)}
.btn{background:var(--brand);color:#fff;padding:12px 24px;border-radius:12px}
.cards{display:grid;gap:16px;grid-template-columns:1fr;padding:16px}
@media(min-width:640px){.cards{grid-template-columns:repeat(3,1fr)}}
.card{background:#fff;border-radius:16px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
footer{padding:24px;text-align:center;color:#667}
/* layout comments for organization */
</style></head><body>
<header><h1>Nimbus Kicks</h1><nav><a href="#shop">Shop</a><a href="#about">About</a><a href="#contact">Contact</a></nav></header>
<main>
<section class="hero"><h2>Step into comfort</h2><p>Sneakers restored by hand, delivered in 48 hours.</p><a class="btn" href="#shop">Shop the drop</a></section>
<section class="cards" id="shop">
<article class="card"><h3>Deep clean</h3><p>Full restore.</p></article>
<article class="card"><h3>Sole swap</h3><p>Fresh soles.</p></article>
<article class="card"><h3>Custom paint</h3><p>Your design.</p></article>
</section>
<img src="shoe.jpg" alt="A restored white sneaker on a wooden table">
</main>
<footer><p>Nimbus Kicks · hello@nimbuskicks.example</p></footer>
</body></html>`;

/** Weaker submission with real flaws (should score meaningfully lower). */
export const weakHtml = `<html><head><title>x</title></head><body>
<div class="a"><div class="b">hello</div></div>
<p>text here</p>
<img src="x.jpg">
</body></html>`;
