/**
 * PROOF — app shell + hash router.
 */
import { api } from './api.js';
import { app, refreshMe } from './state.js';
import { WalletService } from './wallet.js';
import { esc, $, ico } from './ui.js';
import './runtime-fixes.js';
import * as onboarding from './views/onboarding.js';
import * as home from './views/home.js';
import * as learn from './views/learn.js';
import * as prove from './views/prove.js';
import * as work from './views/work.js';
import * as profile from './views/profile.js';
import * as reviews from './views/reviews.js';
import * as socratic from './views/socratic.js';
import * as glossary from './views/glossary.js';
import * as misc from './views/misc.js';

const ROUTES = [
  ['onboarding', onboarding.screen, { public: true }],
  ['learn', learn.hub],
  ['learn/path/:id', learn.pathScreen],
  ['learn/lesson/:pathId/:topic', learn.lessonScreen],
  ['reviews', reviews.hub],
  ['reviews/:id', reviews.session],
  ['socratic', socratic.socratic],
  ['glossary', glossary.glossary],
  ['', home.screen],
  ['prove', prove.hub],
  ['prove/challenge/:id', prove.challengeScreen],
  ['prove/attempt/:id', prove.attemptScreen],
  ['daily', (screen) => prove.challengeScreen(screen, { id: 'daily' })],
  ['work', work.hub],
  ['work/:tab', work.hub],
  ['profile', profile.screen],
  ['leaderboard', misc.leaderboardScreen],
  ['notifications', misc.notificationsScreen],
  ['u/:username', misc.publicProfileScreen, { public: true }],
];

const NAV = [
  { href: '#/', ico: 'home', label: 'Home', match: ['', 'onboarding'], mobile: true },
  { href: '#/learn', ico: 'learn', label: 'Learn', match: ['learn'], mobile: true },
  { href: '#/reviews', ico: 'clock', label: 'Review', match: ['reviews'], mobile: true },
  { href: '#/prove', ico: 'prove', label: 'Prove', match: ['prove', 'daily'], mobile: true },
  { href: '#/work', ico: 'work', label: 'Work', match: ['work'], mobile: false },
  { href: '#/profile', ico: 'profile', label: 'You', match: ['profile'], mobile: true },
];

const appEl = () => document.getElementById('app');
let navRendered = false;
let reviewsDueCount = 0;

async function updateReviewsCount() {
  if (!app.me) return;
  try {
    const res = await api.get('/api/reviews/stats');
    reviewsDueCount = res.stats.dueToday || 0;
    updateNavBadge();
  } catch (e) { /* non-critical */ }
}

function updateNavBadge() {
  const nav = document.getElementById('bottomNav');
  if (!nav) return;
  const reviewLink = nav.querySelector('a[href="#/reviews"]');
  if (!reviewLink) return;
  let badge = reviewLink.querySelector('.nav-badge');
  if (reviewsDueCount > 0) {
    if (!badge) { badge = document.createElement('span'); badge.className = 'nav-badge'; reviewLink.appendChild(badge); }
    badge.textContent = reviewsDueCount > 9 ? '9+' : reviewsDueCount;
  } else if (badge) badge.remove();
}

function renderNav(activeKey) {
  if (!navRendered) {
    const nav = document.createElement('nav');
    nav.className = 'nav';
    nav.id = 'bottomNav';
    nav.setAttribute('aria-label', 'Primary navigation');
    nav.innerHTML = NAV.map((n) =>
      `<a href="${n.href}" data-key="${n.match[0]}" data-mobile="${n.mobile}" aria-label="${n.label}"><span class="nav-ico" data-ico="${n.ico}"></span><span class="nav-label">${n.label}</span></a>`
    ).join('');
    appEl().after(nav);
    navRendered = true;
    updateReviewsCount();
    setInterval(updateReviewsCount, 300000);
  }
  const nav = document.getElementById('bottomNav');
  nav.querySelectorAll('a').forEach((a) => {
    const key = a.dataset.key;
    const item = NAV.find((n) => n.match[0] === key);
    a.classList.toggle('active', item.match.includes(activeKey));
    const span = a.querySelector('.nav-ico');
    if (span && !span.dataset.done) { span.innerHTML = ico[item.ico]; span.dataset.done = '1'; }
  });
  updateNavBadge();
}

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  return raw.split('?')[0];
}

async function router() {
  const path = parseHash();
  const segs = path.split('/').filter(Boolean);
  for (const [pattern, view, opts = {}] of ROUTES) {
    const pp = pattern.split('/').filter(Boolean);
    if (pp.length !== segs.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(segs[i]);
      else if (pp[i] !== segs[i]) { ok = false; break; }
    }
    if (!ok) continue;
    if (!opts.public && !app.me) { location.hash = '#/onboarding'; return; }
    const activeKey = pp[0] || '';
    if (!opts.public) renderNav(activeKey); else document.getElementById('bottomNav')?.remove(), navRendered = false;
    const screen = document.createElement('div');
    screen.className = 'screen';
    screen.innerHTML = `<div class="pad" style="padding-top:max(16px, env(safe-area-inset-top))"><div class="skeleton" style="height:120px;border-radius:20px"></div><div class="skeleton mt12" style="height:84px;border-radius:16px"></div><div class="skeleton mt12" style="height:84px;border-radius:16px"></div></div>`;
    appEl().replaceChildren(screen);
    try { await view(screen, params); }
    catch (e) {
      screen.innerHTML = `<div class="pad" style="padding-top:60px;text-align:center"><div style="font-size:40px">🌧️</div><h2 class="h1 mt8">Something hiccuped</h2><p class="sub mt8">${esc(e.message || 'Please try again.')}</p><button class="btn btn-soft mt16" onclick="location.reload()">Reload</button></div>`;
    }
    window.scrollTo({ top: 0 });
    return;
  }
  location.hash = '#/';
}

window.addEventListener('hashchange', router);

(async function boot() {
  WalletService.restore();
  const me = await refreshMe();
  if (!me) location.hash = location.hash.startsWith('#/u/') ? location.hash : '#/onboarding';
  app.booted = true;
  router();
})();

export { api, app };
