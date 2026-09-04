/**
 * Work — marketplace (find work), teach-to-earn, sponsored challenges.
 */
import { api } from '../api.js';
import { refreshMe, app } from '../state.js';
import { esc, $, $$, ico, toast, sheet, confettiBurst, fmtNim, timeAgo, walletStatusBadge } from '../ui.js';
import { openTask } from './home.js';

export async function hub(root, { tab = 'market' } = {}) {
  root.innerHTML = `<div class="pad" style="padding-top:max(16px, env(safe-area-inset-top))">
    <div class="row-between">
      <div>
        <h1 class="h1 bento-full">Work</h1>
        <p class="sub mt8 bento-full">Your verified skills are worth something. Here's where.</p>
      </div>
      <div id="walletStatusPlaceholder"></div>
    </div>
    <div class="chip-row mt16 bento-full" id="tabs">
      <button class="chip ${tab === 'market' ? 'chip-primary' : ''}" data-tab="market">💼 Find work</button>
      <button class="chip ${tab === 'teach' ? 'chip-primary' : ''}" data-tab="teach">🎓 Teach</button>
      <button class="chip ${tab === 'sponsored' ? 'chip-primary' : ''}" data-tab="sponsored">🏆 Sponsored</button>
    </div>
    <div id="tabBody" class="mt16 bento-full">${spinnerHtml()}</div>
  </div>`;

  // Add wallet status display
  const walletStatusEl = root.querySelector('#walletStatusPlaceholder');
  if (walletStatusEl) {
    walletStatusEl.innerHTML = walletStatusBadge(app.me?.walletMode, app.me?.walletModeIsDemo);
  }

  $$('#tabs .chip', root).forEach((c) => c.addEventListener('click', () => { location.hash = `#/work/${c.dataset.tab}`; }));
  const body = root.querySelector('#tabBody');
  if (tab === 'teach') renderTeach(body);
  else if (tab === 'sponsored') renderSponsored(body);
  else renderMarket(body);
}

const spinnerHtml = () => `<div class="skeleton" style="height:120px;border-radius:20px"></div>`;

/* ── marketplace ── */
async function renderMarket(body) {
  const [tasksRes, myRes, walletRes] = await Promise.all([
    api.get('/api/market/tasks'), api.get('/api/market/my'), api.get('/api/wallet'),
  ]);
  // Defensive: a malformed response must degrade to an empty state, never a crash.
  const tasks = Array.isArray(tasksRes?.tasks) ? tasksRes.tasks : [];
  const applied = Array.isArray(myRes?.applied) ? myRes.applied : [];
  body.innerHTML = `
    <div class="card" style="padding:14px 16px;background:linear-gradient(120deg,#211F52,#4A3AA8);color:#fff;border:0">
      <div class="row-between">
        <div><span class="eyebrow" style="color:rgba(255,255,255,.55)">YOUR BALANCE</span>
          <div style="font-size:22px;font-weight:850;margin-top:2px">${fmtNim(walletRes?.balanceNim ?? 0, 2)} NIM</div></div>
        <span class="chip chip-dark">${tasks.filter((t) => t.qualification?.qualified).length} tasks open to you</span>
      </div>
    </div>

    <div class="section"><div class="section-head"><span class="eyebrow">RECOMMENDED FOR YOU</span></div>
      <div class="stack">
        ${tasks.length ? tasks.map((t) => taskCard(t)).join('') : `<div class="card"><div class="empty"><span class="big">💼</span><b style="font-size:14px;display:block;margin-top:8px">No open tasks right now</b><span class="sub">New paid work appears here when clients post tasks. Your verified skills unlock opportunities.</span></div></div>`}
      </div></div>

    ${applied.length ? `<div class="section"><div class="section-head"><span class="eyebrow">MY GIGS</span></div>
      <div class="stack">${applied.map((a) => `
        <div class="card" style="padding:14px 16px">
          <div class="row-between"><b style="font-size:14px">${esc(a.task?.title || 'Task')}</b>
            <span class="chip ${a.status === 'accepted' || a.status === 'completed' ? 'chip-ok' : a.status === 'pending' ? 'chip-primary' : 'chip-bad'}" style="padding:4px 10px">${esc(a.status)}</span></div>
          <div class="row-between mt8"><span class="tiny">${fmtNim(a.task?.budgetNim || 0)} NIM · ${esc(a.task?.client?.username || '')}</span>
            ${a.status === 'accepted' ? `<button class="btn btn-ok btn-sm" data-complete="${a.taskId}">Mark delivered 💰</button>` : ''}</div>
        </div>`).join('')}</div></div>` : ''}

    <div class="section"><div class="section-head"><span class="eyebrow">NEED SOMETHING DONE?</span></div>
      <button class="btn btn-soft btn-block" id="postTask">Post a task (escrowed in NIM)</button></div>`;

  $$('[data-task-open]', body).forEach((n) => n.addEventListener('click', () => openTask(n.dataset.taskOpen)));
  $$('[data-complete]', body).forEach((n) => n.addEventListener('click', async () => {
    try {
      const r = await api.post(`/api/market/tasks/${n.dataset.complete}/complete`);
      confettiBurst();
      toast(`Paid! +${(r.netLuna / 100000).toFixed(2)} NIM 💰`, 'nim', 3400);
      refreshMe(); renderMarket(body);
    } catch (e) { toast(esc(e.message), 'bad'); }
  }));
  body.querySelector('#postTask').addEventListener('click', () => postTaskSheet(body));
}

function taskCard(t) {
  const q = t.qualification;
  return `<div class="card card-click" data-task-open="${t.id}" style="padding:15px 16px">
    <div class="row-between">
      <div style="flex:1;min-width:0">
        <b style="font-size:14.5px">${esc(t.title)}</b>
        <div class="tiny mt8" style="color:var(--muted)">${esc(t.client?.avatar || '🙂')} ${esc(t.client?.username || 'Client')} · ${timeAgo(t.postedAt)} · ${t.applications} applicants</div>
      </div>
      <span class="chip chip-nim">${fmtNim(t.budgetNim)} NIM</span>
    </div>
    ${t.minProof ? `
    <div class="mt8">
      <div class="row-between"><span class="tiny">needs <b>${esc(t.minProof.skillSlug.replace(/-/g, ' '))} ${t.minProof.min}+</b></span>
        <span class="chip ${q.qualified ? 'chip-ok' : ''}" style="font-size:10.5px;padding:3px 8px">${q.qualified ? '✓ you qualify' : `you: ${q.yourScore}%`}</span></div>
      <div class="qmeter mt8"><i style="width:${Math.min(100, q.yourScore)}%"></i><em style="left:${t.minProof.min}%"></em></div>
    </div>` : '<div class="tiny mt8">Open to all proofers</div>'}
  </div>`;
}

function postTaskSheet(body) {
  const s = sheet(`
    <h2 class="h1">Post a task</h2>
    <p class="sub mt8">Your NIM is escrowed immediately — proofers get paid on delivery.</p>
    <div class="field mt16"><label class="label">Title</label><input id="tTitle" class="input" placeholder="Build a landing page"/></div>
    <div class="field"><label class="label">Description</label><textarea id="tDesc" class="input" placeholder="What exactly do you need? Be concrete."></textarea></div>
    <div class="grid2">
      <div class="field"><label class="label">Budget (NIM)</label><input id="tBudget" class="input" type="number" min="1" value="20"/></div>
      <div class="field"><label class="label">Required skill</label>
        <select id="tSkill" class="input"><option value="">Any proofer</option>${['web-development', 'python', 'ui-design', 'ai', 'marketing', 'data-analysis', 'writing', 'social-media'].map((s) => `<option value="${s}">${s.replace(/-/g, ' ')}</option>`).join('')}</select></div>
    </div>
    <button class="btn btn-primary btn-block" id="tPost">Post & escrow</button>`);
  s.el.querySelector('#tPost').addEventListener('click', async () => {
    try {
      await api.post('/api/market/tasks', {
        title: s.el.querySelector('#tTitle').value,
        description: s.el.querySelector('#tDesc').value,
        budgetNim: Number(s.el.querySelector('#tBudget').value),
        skillSlug: s.el.querySelector('#tSkill').value || null,
        minScore: 60,
      });
      s.close(); toast('Task posted — funds escrowed ✅', 'ok');
      renderMarket(body);
    } catch (e) { toast(esc(e.message), 'bad'); }
  });
}

/* ── teach ── */
async function renderTeach(body) {
  const [sessionsRes, mineRes] = await Promise.all([api.get('/api/teach/sessions'), api.get('/api/teach/mine')]);
  const verified = app.skills?.filter((s) => s.verified) || [];
  const canTeach = verified.some((s) => s.score >= 70);
  // Defensive: malformed responses degrade to empty states, never crashes.
  const allSessions = Array.isArray(sessionsRes?.sessions) ? sessionsRes.sessions : [];
  const mySessions = Array.isArray(mineRes?.sessions) ? mineRes.sessions : [];

  body.innerHTML = `
    <div class="card" style="padding:16px">
      <div class="row" style="gap:12px">
        <div style="font-size:24px">🎓</div>
        <div style="flex:1"><b style="font-size:15px">Teach what you know</b>
          <div class="sub mt8">Turn a verified skill into income. You keep 98% — students pay in NIM.</div></div>
      </div>
      ${canTeach
        ? `<button class="btn btn-primary btn-block mt12" id="createSession">${ico.sparkle.replace('<svg', '<svg width="16" height="16"')} Create a session</button>`
        : `<div class="callout callout-warn mt12">🔒 Teaching unlocks when one of your skills is <b>verified at 70+</b>. ${verified.length ? `Closest: <b>${esc(verified[0].skillSlug.replace(/-/g, ' '))} ${verified[0].score}%</b>.` : 'Pass a proof checkpoint to get there.'} <a href="#/prove" style="font-weight:800">Prove a skill →</a></div>`}
    </div>

    ${mySessions.length ? `<div class="section"><div class="section-head"><span class="eyebrow">YOUR SESSIONS</span></div>
      <div class="stack">${mySessions.map((t) => sessionCard(t, true)).join('')}</div></div>` : ''}

    <div class="section"><div class="section-head"><span class="eyebrow">BOOK A PROVEN TEACHER</span></div>
      ${allSessions.length ? `<div class="stack">${allSessions.map((t) => sessionCard(t)).join('')}</div>` : `<div class="card"><div class="empty"><span class="big">🎓</span><b style="font-size:14px;display:block;margin-top:8px">No sessions available yet</b><span class="sub">Teachers with verified skills can create paid 1-on-1 sessions. Check back soon.</span></div></div>`}</div>`;

  body.querySelector('#createSession')?.addEventListener('click', () => createSessionSheet(body, verified));
  $$('[data-book]', body).forEach((b) => b.addEventListener('click', async () => {
    try {
      await api.post(`/api/teach/sessions/${b.dataset.book}/book`);
      toast('Booked! The teacher will reach out. 🎓', 'ok'); refreshMe(); renderTeach(body);
    } catch (e) { toast(esc(e.message), 'bad'); }
  }));
  $$('[data-review]', body).forEach((b) => b.addEventListener('click', () => reviewSheet(body, b.dataset.review)));
}

function sessionCard(t, mine = false) {
  return `<div class="card" style="padding:14px 16px">
    <div class="row-between">
      <div class="row" style="gap:10px;min-width:0">
        <div class="avatar av-32">${t.teacher?.avatar || '🙂'}</div>
        <div style="min-width:0">
          <b style="font-size:14px;display:block">${esc(t.title)}</b>
          <span class="tiny">${esc(t.teacher?.username || '')} · ✓ ${Math.round(t.teacher?.skillScore || 0)}% verified · ⭐ ${t.rating || '—'} (${t.ratingCount})</span>
        </div>
      </div>
      <span class="chip chip-nim">${t.priceNim} NIM</span>
    </div>
    <p class="sub mt8" style="font-size:13px">${esc(t.description)}</p>
    <div class="row-between">
      <span class="tiny">${t.durationMin} min · ${t.bookings}/${t.maxStudents} booked</span>
      ${mine ? '<span class="chip chip-primary" style="font-size:11px">your session</span>'
        : t.soldOut ? '<span class="chip chip-bad" style="font-size:11px">sold out</span>'
        : `<button class="btn btn-nim btn-sm" data-book="${t.id}">Book · ${t.priceNim} NIM</button>`}
    </div>
    ${!mine && t.reviews?.length ? `<div class="divider"></div><div class="tiny" style="color:var(--muted);font-style:italic">“${esc(t.reviews[t.reviews.length - 1].text)}”</div>` : ''}
  </div>`;
}

function createSessionSheet(body, verified) {
  const s = sheet(`
    <h2 class="h1">Create a teaching session</h2>
    <div class="field mt16"><label class="label">Title</label><input id="sTitle" class="input" placeholder="Python for Beginners — 20 minutes"/></div>
    <div class="field"><label class="label">What will students get?</label><textarea id="sDesc" class="input" placeholder="From zero to a working script…"></textarea></div>
    <div class="grid2">
      <div class="field"><label class="label">Skill</label><select id="sSkill" class="input">${verified.filter((v) => v.score >= 70).map((v) => `<option value="${v.skillSlug}">${v.skillSlug.replace(/-/g, ' ')} · ${v.score}%</option>`).join('')}</select></div>
      <div class="field"><label class="label">Duration</label><select id="sDur" class="input"><option>20</option><option>30</option><option>45</option><option>60</option></select></div>
    </div>
    <div class="grid2">
      <div class="field"><label class="label">Price (NIM)</label><input id="sPrice" class="input" type="number" min="1" value="5"/></div>
      <div class="field"><label class="label">Max students</label><input id="sMax" class="input" type="number" min="1" max="50" value="8"/></div>
    </div>
    <button class="btn btn-primary btn-block" id="sCreate">Publish session</button>
    <p class="tiny center mt8">Students pay NIM · you receive 98% (2% platform fee)</p>`);
  s.el.querySelector('#sCreate').addEventListener('click', async () => {
    try {
      await api.post('/api/teach/sessions', {
        title: s.el.querySelector('#sTitle').value,
        description: s.el.querySelector('#sDesc').value,
        skillSlug: s.el.querySelector('#sSkill').value,
        durationMin: Number(s.el.querySelector('#sDur').value),
        priceNim: Number(s.el.querySelector('#sPrice').value),
        maxStudents: Number(s.el.querySelector('#sMax').value),
      });
      s.close(); toast('Session published 🎓', 'ok'); renderTeach(body);
    } catch (e) { toast(esc(e.message), 'bad'); }
  });
}

function reviewSheet(body, sessionId) {
  const s = sheet(`<h2 class="h1">Rate your session</h2>
    <div class="row mt16" style="gap:8px;justify-content:center" id="stars">
      ${[1, 2, 3, 4, 5].map((i) => `<button class="chip" data-r="${i}" style="font-size:20px;padding:8px 14px">${'⭐'}</button>`).join('')}
    </div>
    <textarea id="rText" class="input mt16" placeholder="What was great? What could improve?"></textarea>
    <button class="btn btn-primary btn-block mt8" id="rSend">Send review</button>`);
  let rating = 5;
  s.el.querySelectorAll('#stars .chip').forEach((b) => b.addEventListener('click', () => {
    rating = Number(b.dataset.r);
    s.el.querySelectorAll('#stars .chip').forEach((x, i) => (x.style.opacity = i < rating ? 1 : 0.35));
  }));
  s.el.querySelector('#rSend').addEventListener('click', async () => {
    try {
      await api.post(`/api/teach/sessions/${sessionId}/review`, { rating, text: s.el.querySelector('#rText').value });
      s.close(); toast('Review sent — thanks! ⭐', 'ok'); renderTeach(body);
    } catch (e) { toast(esc(e.message), 'bad'); }
  });
}

/* ── sponsored ── */
async function renderSponsored(body) {
  const { sponsored } = await api.get('/api/sponsored');
  body.innerHTML = `<div class="stack">
    <div class="card" style="padding:14px 16px;background:var(--nim-soft);border-color:#FFDFBF">
      <b style="font-size:14px;color:#7A4A10">How sponsorship works</b>
      <p class="tiny mt8" style="color:#8A5A20">A sponsor funds a pool (e.g. 500 NIM). Top performers take the top slice; everyone who passes the final proof shares the rest. Communities fund education, learners get paid to prove it.</p>
    </div>
    ${sponsored.map((s) => `
      <div class="card" style="padding:16px">
        <div class="row-between"><div class="row" style="gap:10px"><span style="font-size:24px">${s.emoji}</span>
          <div><b style="font-size:15px">${esc(s.title)}</b><div class="tiny">by ${esc(s.sponsor)} · ${esc(s.skillSlug.replace(/-/g, ' '))}</div></div></div>
          <span class="chip chip-nim">${fmtNim(s.poolNim)} NIM</span></div>
        <p class="sub mt8" style="font-size:13.5px">${esc(s.description)}</p>
        <div class="grid3 mt8">
          <div class="stat"><b>${fmtNim(s.topNim)}</b><span>top slice</span></div>
          <div class="stat"><b>${fmtNim(s.qualifiedNim)}</b><span>qualified pool</span></div>
          <div class="stat"><b>${s.participants}</b><span>proofers</span></div>
        </div>
        <div class="row-between mt12"><span class="tiny">ends in ${s.endsInDays} days</span>
          <button class="btn ${s.joined ? 'btn-ghost' : 'btn-primary'} btn-sm" data-join2="${s.id}" ${s.joined ? 'disabled' : ''}>${s.joined ? '✓ Joined' : 'Join challenge'}</button></div>
      </div>`).join('')}
  </div>`;
  $$('[data-join2]', body).forEach((b) => b.addEventListener('click', async () => {
    try {
      await api.post(`/api/sponsored/${b.dataset.join2}/join`);
      toast('Joined! Pass the final proof to qualify. 🏆', 'ok');
      renderSponsored(body);
    } catch (e) { toast(esc(e.message), 'bad'); }
  }));
}
