/**
 * Misc — leaderboard, notifications, public proofer profiles.
 */
import { api } from '../api.js';
import { app } from '../state.js';
import { esc, $, $$, ico, toast, fmtNim, timeAgo, walletStatusBadge } from '../ui.js';

const CATS = [
  ['proofs', '🎯 Most proofs'], ['score', '📐 Best average'], ['consistent', '🔥 Most consistent'],
  ['teacher', '🎓 Best teacher'], ['helpful', '🌟 Most helpful'], ['tasks', '💼 Most gigs'], ['earned', '🪙 Most NIM'],
];

export async function leaderboardScreen(root) {
  let cat = 'proofs';
  root.innerHTML = `<div class="pad bento-read" style="padding-top:max(14px, env(safe-area-inset-top))">
    <div class="row-between">
      <button class="btn btn-ghost btn-sm" onclick="history.back()">${ico.back} Back</button>
      <div id="walletStatusPlaceholder"></div>
    </div>
    <p class="sub mt8">Ranked by demonstrated ability — never by self-claims.</p>
    <div class="chip-scroll mt16" style="margin:0 -18px" id="cats">
      ${CATS.map(([id, label]) => `<button class="chip ${id === cat ? 'chip-primary' : ''}" data-cat="${id}">${label}</button>`).join('')}
    </div>
    <div id="lbBody" class="mt16"></div>
  </div>`;
  const walletStatusEl = root.querySelector('#walletStatusPlaceholder');
  if (walletStatusEl) walletStatusEl.innerHTML = walletStatusBadge(app.me?.walletMode, app.me?.walletModeIsDemo);

  async function load(c) {
    cat = c;
    $$('#cats .chip', root).forEach((b) => b.classList.toggle('chip-primary', b.dataset.cat === c));
    const { entries } = await api.get(`/api/leaderboard?cat=${c}`);
    root.querySelector('#lbBody').innerHTML = `<div class="stack">${entries.map((e, i) => `
      <div class="card" style="padding:13px 16px"><div class="row" style="gap:12px">
        <b style="width:26px;text-align:center;font-size:15px;color:${i === 0 ? 'var(--nim-deep)' : i === 1 ? 'var(--primary-deep)' : 'var(--faint)'}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</b>
        <div class="avatar av-32">${e.avatar}</div><div style="flex:1;min-width:0">
          <b style="font-size:14px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.username)} ${e.walletAddress && !e.isDemo ? '<span style="color:var(--primary);font-size:11px;margin-left:4px">✓</span>' : ''} ${e.isDemo ? '<span class="tiny" style="color:var(--muted);margin-left:4px">(demo)</span>' : ''}</b>
          ${e.walletAddress && !e.isDemo ? `<div class="tiny" style="color:var(--primary);font-family:monospace;margin-top:2px">${e.walletAddress.substring(0, 20)}...</div>` : `<span class="tiny">Level ${e.level} · ⭐ ${e.reputation} · ${e.proofsPassed} proofs</span>`}
        </div><b class="num" style="font-size:14px;color:var(--primary-deep)">${e.value}</b>
      </div></div>`).join('') || '<div class="card"><div class="empty">No entries yet.</div></div>'}</div>`;
  }
  $$('#cats .chip', root).forEach((b) => b.addEventListener('click', () => load(b.dataset.cat)));
  await load(cat);
}

function notificationIcon(notification) {
  const text = `${notification?.title || ''} ${notification?.body || ''}`.toLowerCase();
  if (text.includes('proof') || text.includes('verified') || text.includes('passed')) return ico.prove;
  if (text.includes('review') || text.includes('learn') || text.includes('lesson')) return ico.learn;
  if (text.includes('nim') || text.includes('reward') || text.includes('earned') || text.includes('payout')) return ico.coin;
  if (text.includes('task') || text.includes('gig') || text.includes('work')) return ico.work;
  if (text.includes('teacher') || text.includes('teach')) return ico.users;
  return ico.bell;
}

export async function notificationsScreen(root) {
  const { notifications, unread } = await api.get('/api/notifications');
  root.innerHTML = `<div class="pad bento-read notifications-page" style="padding-top:max(14px, env(safe-area-inset-top))">
    <div class="notifications-head">
      <div class="row" style="gap:10px"><button class="btn btn-ghost btn-sm" onclick="history.back()">${ico.back} Back</button><span class="notification-page-title">${ico.bell}<span>Notifications</span>${unread ? `<b class="notification-count">${unread > 99 ? '99+' : unread}</b>` : ''}</span></div>
      <button class="btn btn-soft btn-sm" id="readAll" ${unread ? '' : 'disabled'}>Mark read</button>
    </div>
    <div id="walletStatusPlaceholder" class="mt8"></div>
    <div class="stack mt16 notification-list">
      ${notifications.map((n) => `
        <article class="card notification-item ${n.read ? 'is-read' : 'is-unread'}">
          <span class="notification-card-icon" aria-hidden="true">${notificationIcon(n)}</span>
          <div class="notification-copy"><div class="notification-title-row"><b>${esc(n.title)}</b>${!n.read ? '<span class="unread-dot" aria-label="Unread"></span>' : ''}</div>
            ${n.body ? `<div class="tiny notification-body">${esc(n.body)}</div>` : ''}
            <span class="tiny notification-time">${timeAgo(n.createdAt)}</span></div>
        </article>`).join('') || '<div class="card notification-empty"><span class="notification-empty-icon">✓</span><div><b>All caught up.</b><div class="tiny mt4">Go learn something new.</div></div></div>'}
    </div></div>`;

  const walletStatusEl = root.querySelector('#walletStatusPlaceholder');
  if (walletStatusEl) walletStatusEl.innerHTML = walletStatusBadge(app.me?.walletMode, app.me?.walletModeIsDemo);
  root.querySelector('#readAll').addEventListener('click', async () => {
    await api.post('/api/notifications/read');
    toast('All caught up ✓', 'ok');
    notificationsScreen(root);
  });
}

export async function publicProfileScreen(root, { username }) {
  let profile;
  try { profile = (await api.get(`/api/profile/${encodeURIComponent(username)}`)).profile; }
  catch { root.innerHTML = `<div class="pad mt24 center"><div style="font-size:40px">🔍</div><p class="sub mt8">Proofer not found.</p></div>`; return; }

  root.innerHTML = `<div class="pad bento-read" style="padding-top:max(14px, env(safe-area-inset-top))">
    <div class="row-between"><button class="btn btn-ghost btn-sm" onclick="history.back()">${ico.back} Back</button><div id="walletStatusPlaceholder"></div></div>
    <div class="card card-hero mt16" style="padding:22px 20px;text-align:center">
      <div class="avatar av-56" style="margin:0 auto;background:rgba(255,255,255,.15);font-size:30px">${profile.avatar}</div>
      <h1 class="h1 mt8" style="color:#fff">${esc(profile.username)}</h1>
      <div class="tiny" style="color:rgba(255,255,255,.65)">Level ${profile.level} · ⭐ reputation ${profile.reputation} · ${fmtNim(profile.earnedNim, 1)} NIM earned</div>
      <div class="row mt12" style="gap:8px;justify-content:center;flex-wrap:wrap"><span class="chip chip-dark">${profile.proofsCompleted} proofs passed</span><span class="chip chip-dark">${profile.tasksAccepted} gigs</span><span class="chip chip-dark">${profile.teachingSessions} sessions</span></div>
      ${profile.isDemoUser ? '<div class="tiny mt8" style="color:rgba(255,255,255,.5)">Demo profile — fictional identity for the competition build</div>' : ''}
    </div>
    <div class="section"><div class="section-head"><span class="eyebrow">✓ VERIFIED SKILLS</span></div><div class="stack">${profile.verifiedSkills.length ? profile.verifiedSkills.map((s) => `<div class="card" style="padding:14px 16px"><div class="row-between"><b style="font-size:14px;text-transform:capitalize">${esc(s.skillSlug.replace(/-/g, ' '))}</b><span class="chip chip-ok">✓ ${s.score}% · ${esc(s.tier)}</span></div><div class="bar bar-ok mt8"><i style="width:${s.score}%"></i></div></div>`).join('') : '<div class="card"><div class="empty" style="padding:16px">Nothing verified yet.</div></div>'}</div></div>
    ${profile.proofs.length ? `<div class="section"><div class="section-head"><span class="eyebrow">📜 PROOF HISTORY</span></div><div class="stack">${profile.proofs.slice(0, 10).map((p) => `<div class="card" style="padding:12px 16px"><div class="row-between"><span style="font-size:13px;font-weight:650">${esc(p.challengeTitle)}</span><span class="chip ${p.passed ? 'chip-ok' : 'chip-bad'}" style="padding:3px 9px;font-size:11px">${Math.round(p.score)}/100</span></div><div class="tiny mt8" style="color:var(--muted)">${timeAgo(p.completedAt)}</div></div>`).join('')}</div></div>` : ''}
    ${profile.achievements?.length ? `<div class="section"><div class="section-head"><span class="eyebrow">🏅 ACHIEVEMENTS</span></div><div class="chip-row">${profile.achievements.map((a) => `<span class="chip chip-primary">${a.emoji} ${esc(a.name)}</span>`).join('')}</div></div>` : ''}
  </div>`;
  const walletStatusEl = root.querySelector('#walletStatusPlaceholder');
  if (walletStatusEl) walletStatusEl.innerHTML = walletStatusBadge(app.me?.walletMode, app.me?.walletModeIsDemo);
}
