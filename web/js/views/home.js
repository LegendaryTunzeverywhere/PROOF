/**
 * Home — "Learn anything. Prove it. Earn with it."
 */
import { api } from '../api.js';
import { app, refreshMe } from '../state.js';
import { esc, el, $, ico, toast, timeAgo, fmtNim, walletStatusBadge, skeletonCard } from '../ui.js';
import { generateAndOpenPath } from './generate.js';
import { walletEntry } from './onboarding.js';

export async function screen(root) {
  root.innerHTML = `<div class="pad home-pad" style="padding-top:max(16px, env(safe-area-inset-top))"><div class="skeleton" style="height:120px;border-radius:20px"></div></div>`;
  let d;
  try { d = await api.get('/api/home'); } catch { location.hash = '#/onboarding'; return; }
  const u = d.user;
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  root.innerHTML = `
  <div class="pad home-pad" style="padding-top:max(14px, env(safe-area-inset-top))">
    <div class="row-between">
      <div class="row" style="gap:10px">
        <a href="#/profile" class="avatar av-40" style="text-decoration:none">${u.avatar}</a>
        <div>
          <div style="font-size:13px;color:var(--muted);font-weight:600">${hello}</div>
          <a href="#/profile" style="font-weight:800;color:var(--ink);font-size:15px">${esc(u.username)}</a>
        </div>
      </div>
      <div class="row" style="gap:8px">
        <span class="chip" title="Learning streak">${ico.fire} ${u.streak.current}</span>
        <a href="#/notifications" class="chip" style="position:relative">${ico.bell}${app.unread ? `<b style="position:absolute;top:-4px;right:-4px;background:var(--bad);color:#fff;font-size:9px;min-width:16px;height:16px;border-radius:99px;display:grid;place-items:center">${app.unread}</b>` : ''}</a>
      </div>
    </div>

    <div class="card card-hero quest-hero mt16" style="padding:22px 20px">
      <div class="row-between">
        ${walletStatusBadge(u.wallet.mode, u.walletModeIsDemo)}
        <span class="chip chip-dark chip-nim" style="background:rgba(233,178,19,.22);border-color:rgba(233,178,19,.45);color:#F8DE7A">${ico.coin} ${fmtNim(u.balanceNim, 2)} NIM</span>
      </div>
      <h1 class="display quest-title mt16" style="font-size:25px;color:#fff">Learn anything.<br/>Prove it. <span style="background:var(--nim-grad);-webkit-background-clip:text;background-clip:text;color:transparent">Earn with it.</span></h1>
      <div class="quest-launcher mt16">
        <span class="quest-launcher-label">Start a new quest</span>
        <div class="row" style="gap:8px">
          <input id="homeGoal" class="input input-on-dark" style="flex:1;background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.25);color:#fff" placeholder="What skill do you want to learn?" aria-label="What skill do you want to learn?" maxlength="120"/>
          <button class="btn btn-nim" id="homeGo" style="padding:12px 16px" aria-label="Create my skill path" title="Create my skill path">${ico.bolt}</button>
        </div>
      </div>
      ${!u.wallet.connected ? `<button class="btn btn-sm mt12" id="connectWallet" style="background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.25)">${ico.wallet} Connect wallet to earn NIM</button>` : ''}
    </div>

    ${continueCard(d)}
    ${dailyCard(d.daily)}
    ${skillStrip(d)}
    ${trending(d)}
    ${sponsored(d)}
    ${tasks(d)}
    ${discovery(d)}
  </div>`;

  const go = () => {
    const v = $('#homeGoal', root).value.trim();
    if (v.length < 3) return toast('What do you want to learn? ✍️', 'bad');
    generateAndOpenPath({ goal: v, anchor: document.getElementById('app') }).catch((e) => toast(esc(e.message), 'bad'));
  };
  $('#homeGo', root).addEventListener('click', go);
  $('#homeGoal', root).addEventListener('keydown', (e) => e.key === 'Enter' && go());
  $('#connectWallet', root)?.addEventListener('click', () => walletEntry(root));
  bindActions(root, d);
}

function continueCard(d) {
  if (!d.continueLearning) {
    return `<div class="card quest-card quest-card-progress mt12 card-click" id="startFirst">
      <div class="row" style="gap:14px">
        <div class="avatar av-40" style="background:var(--primary-soft)">${ico.sparkle.replace('viewBox', 'width="22" height="22" viewBox')}</div>
        <div style="flex:1"><b>Start your first skill path</b><div class="sub">AI builds it around your goal in seconds.</div></div>
        ${ico.arrow.replace('<svg', '<svg width="18" height="18" style="color:var(--faint)"')}
      </div></div>`;
  }
  const p = d.continueLearning;
  const nextDay = p.days.find((x) => x.items.some((i) => !i.lessonDone && !i.practiceDone && !i.attempt)) || p.days[p.days.length - 1];
  const nextItem = nextDay?.items.find((i) => !i.lessonDone && !i.practiceDone && !i.attempt) || nextDay?.items[0];
  return `<div class="card quest-card quest-card-progress mt12 card-click" id="goPath">
    <div class="row-between"><span class="eyebrow">CONTINUE LEARNING</span><span class="chip chip-primary">${p.skillEmoji} ${esc(p.skillName)}</span></div>
    <b style="font-size:16.5px;display:block;margin-top:8px">${esc(p.title)}</b>
    <div class="row mt8" style="gap:10px;align-items:center">
      <div class="bar" style="flex:1"><i style="width:${p.percent}%"></i></div>
      <span class="tiny num" style="font-weight:800;color:var(--ink-2)">${p.percent}%</span>
    </div>
    <div class="row-between mt8">
      <span class="sub">Next: ${esc(nextItem?.title || 'Final proof')}</span>
      ${nextDay?.rewardNim ? `<span class="chip chip-nim">${ico.coin} ${nextDay.rewardNim} NIM</span>` : `<span class="chip">+${nextDay?.xp || 0} XP</span>`}
    </div></div>`;
}

function dailyCard(daily) {
  return `<div class="card quest-card quest-card-daily mt12 ${daily.done ? '' : 'card-click'}" id="goDaily" style="${daily.done ? 'opacity:.75' : ''}">
    <div class="row-between">
      <span class="eyebrow">TODAY'S PROOF</span>
      <span class="chip chip-nim">${ico.coin} +${daily.rewardNim} NIM · +${daily.xp} XP</span>
    </div>
    <div class="row mt8" style="gap:12px">
      <div style="font-size:26px">🎯</div>
      <div style="flex:1"><b>${esc(daily.title)}</b><div class="sub">${daily.done ? (daily.passed ? 'Passed today — streak safe 🔥' : 'Attempted — review the feedback') : 'Small proof, real reward. One per day.'}</div></div>
      ${daily.done ? `<span class="chip chip-ok">${ico.check}</span>` : ''}
    </div></div>`;
}

function skillStrip(d) {
  if (!d.mySkills.length) return '';
  return `<div class="section home-section home-skills"><div class="section-head"><span class="eyebrow">YOUR VERIFIED SKILLS</span><a class="link" href="#/profile">Profile →</a></div>
    <div class="chip-scroll" style="margin:0 -18px">${d.mySkills.map((s) => `<span class="chip ${s.verified ? 'chip-ok' : 'chip-primary'}">${s.verified ? '✓' : '◌'} ${esc(s.skillSlug.replace(/-/g, ' '))} · ${s.score}%</span>`).join('')}</div></div>`;
}

function trending(d) {
  return `<div class="section home-section home-trending"><div class="section-head"><span class="eyebrow">🔥 TRENDING SKILLS</span><a class="link" href="#/learn">All skills →</a></div>
    <div class="chip-scroll" style="margin:0 -18px">${d.trending.map((s) => `<button class="chip card-click" data-skill="${esc(s.slug)}" style="padding:9px 14px">${s.emoji} ${esc(s.name)} <span class="tiny">· ${s.learners}</span></button>`).join('')}</div></div>`;
}

function sponsored(d) {
  if (!d.sponsored.length) return '';
  return `<div class="section home-section home-sponsored"><div class="section-head"><span class="eyebrow">💰 SPONSORED CHALLENGES</span><a class="link" href="#/work/sponsored">See all →</a></div>
    <div class="chip-scroll" style="margin:0 -18px;padding-bottom:4px">${d.sponsored.map((s) => `
      <div class="card card-click" data-sponsor="${s.id}" style="min-width:250px;margin:0;flex-shrink:0;padding:14px 16px">
        <div class="row-between"><span style="font-size:20px">${s.emoji}</span><span class="chip chip-nim">${fmtNim(s.poolNim)} NIM pool</span></div>
        <b style="display:block;margin-top:8px;font-size:14.5px">${esc(s.title)}</b>
        <div class="tiny mt8" style="color:var(--muted)">${s.participants} proofers · by ${esc(s.sponsor)} · ${s.endsInDays}d left</div>
      </div>`).join('')}</div></div>`;
}

function tasks(d) {
  return `<div class="section home-section home-tasks"><div class="section-head"><span class="eyebrow">💼 RECOMMENDED FOR YOU</span><a class="link" href="#/work">Find work →</a></div>
    <div class="stack">${d.recommendedTasks.length ? d.recommendedTasks.map((t) => `
      <div class="card card-click" data-task="${t.id}" style="padding:14px 16px">
        <div class="row-between"><b style="font-size:14.5px">${esc(t.title)}</b><span class="chip chip-nim">${fmtNim(t.budgetNim)} NIM</span></div>
        <div class="row-between mt8"><span class="tiny">needs ${esc(t.minProof.skillSlug.replace(/-/g, ' '))} ${t.minProof.min}+</span>
          <span class="chip ${t.qualification.qualified ? 'chip-ok' : ''}" style="font-size:11px;padding:4px 9px">${t.qualification.qualified ? '✓ you qualify' : `you: ${t.qualification.yourScore}%`}</span></div>
      </div>`).join('') : `<div class="card"><div class="empty" style="padding:14px"><span class="big">🎯</span><b style="font-size:14px;display:block;margin-top:8px">Prove a skill to unlock work</b><span class="sub">Your verified skills unlock paid tasks matched to what you can actually do.</span><a href="#/prove" class="btn btn-soft btn-sm mt8" style="display:inline-flex">Start a proof →</a></div></div>`}
    </div></div>`;
}

function discovery(d) {
  const f = d.discovery;
  return `<div class="section bento-full"><div class="section-head"><span class="eyebrow">ALIVE ON PROOF</span><a class="link" href="#/leaderboard">Leaderboard →</a></div>
    <div class="grid2">
      <div class="card card-click" id="goTop" style="padding:14px">
        <span class="eyebrow">🏆 TOP PROOFERS</span>
        ${f.topProofers.slice(0, 3).map((t, i) => `<div class="row mt8" style="gap:8px"><span class="tiny" style="width:14px">${i + 1}.</span><span>${t.avatar}</span><b style="font-size:12.5px">${esc(t.username)}</b></div>`).join('')}
      </div>
      <div class="card card-click" id="goTeach" style="padding:14px">
        <span class="eyebrow">🎓 POPULAR TEACHERS</span>
        ${f.teachers.slice(0, 3).map((t) => `<div class="row mt8" style="gap:8px"><span>${t.teacher.avatar}</span><b style="font-size:12.5px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.teacher.username)}</b><span class="tiny">${t.priceNim} NIM</span></div>`).join('')}
      </div>
    </div>
    ${f.newTasks.map((t) => `<div class="card card-click mt8" data-task="${t.id}" style="padding:12px 16px"><div class="row-between"><span style="font-size:13.5px;font-weight:650">${esc(t.title)}</span><span class="tiny">${timeAgo(t.postedAt)}</span></div></div>`).join('')}
  </div>`;
}

function bindActions(root, d) {
  root.querySelector('#goPath')?.addEventListener('click', () => { location.hash = `#/learn/path/${d.continueLearning.id}`; });
  root.querySelector('#startFirst')?.addEventListener('click', () => { location.hash = '#/learn'; });
  root.querySelector('#goDaily')?.addEventListener('click', () => { if (!d.daily.done) location.hash = '#/daily'; });
  root.querySelector('#goTop')?.addEventListener('click', () => { location.hash = '#/leaderboard'; });
  root.querySelector('#goTeach')?.addEventListener('click', () => { location.hash = '#/work/teach'; });
  root.querySelectorAll('[data-skill]').forEach((n) => n.addEventListener('click', () => {
    const slug = n.dataset.skill;
    generateAndOpenPath({ goal: `I want to learn ${slug.replace(/-/g, ' ')}`, domain: slug, anchor: document.getElementById('app') }).catch((e) => toast(esc(e.message), 'bad'));
  }));
  root.querySelectorAll('[data-sponsor]').forEach((n) => n.addEventListener('click', () => { location.hash = '#/work/sponsored'; }));
  root.querySelectorAll('[data-task]').forEach((n) => n.addEventListener('click', () => openTask(n.dataset.task)));
}

export async function openTask(taskId) {
  const { sheet } = await import('../ui.js');
  let d;
  try { d = (await api.get(`/api/market/tasks/${taskId}`)).task; } catch (e) { return toast(esc(e.message), 'bad'); }
  const q = d.qualification;
  const s = sheet(`
    <div class="row-between">
      <span class="chip chip-nim">${ico.coin} ${fmtNim(d.budgetNim)} NIM</span>
      <span class="tiny">${timeAgo(d.postedAt)} · ${d.applications} applicants</span>
    </div>
    <h2 class="h1 mt8">${esc(d.title)}</h2>
    <p class="sub mt8">${esc(d.description)}</p>
    ${d.tags?.length ? `<div class="chip-row mt8">${d.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
    ${d.minProof ? `
    <div class="card mt16" style="box-shadow:none;background:var(--surface-2)">
      <div class="row-between"><span class="tiny" style="color:var(--muted)">REQUIREMENT</span><b style="font-size:13px">${esc(d.minProof.skillSlug.replace(/-/g, ' '))} ${d.minProof.min}+</b></div>
      <div class="qmeter mt8"><i style="width:${Math.min(100, q.yourScore)}%"></i><em style="left:${d.minProof.min}%"></em></div>
      <div class="row-between mt8"><span class="tiny">your proof: <b>${q.yourScore}%</b></span>
        <span class="chip ${q.qualified ? 'chip-ok' : 'chip-bad'}" style="font-size:11px">${q.qualified ? '✓ qualified' : esc(q.reason)}</span></div>
    </div>` : '<div class="card mt16" style="box-shadow:none;background:var(--surface-2)"><span class="tiny" style="color:var(--muted)">Open to all proofers</span></div>'}
    ${d.myApplication ? `
      <div class="card mt12" style="box-shadow:none;background:var(--primary-soft)">
        <b style="font-size:14px">Application ${esc(d.myApplication.status)}</b>
        ${d.myApplication.status === 'accepted' ? `<p class="sub mt8">Accepted! Deliver the work, then mark it complete to receive ${fmtNim(d.budgetNim)} NIM.</p>
        <button class="btn btn-ok btn-block mt8" id="btnComplete">${ico.check} Mark delivered & get paid</button>` : '<p class="sub mt8">Waiting for the client.</p>'}
      </div>`
      : `<div class="field mt16"><label class="label">Your pitch (1–2 sentences)</label>
         <textarea id="pitch" class="input" maxlength="400" placeholder="I've verified ${esc((d.minProof?.skillSlug || 'this skill').replace(/-/g, ' '))} and built similar work — here's my plan…"></textarea></div>
         <button class="btn btn-primary btn-block" id="btnApply" ${q.qualified ? '' : 'disabled'}>${q.qualified ? `Apply for this task · ${fmtNim(d.budgetNim)} NIM` : 'Prove the skill to unlock'}</button>`}
  `);
  s.el.querySelector('#btnApply')?.addEventListener('click', async () => {
    try {
      await api.post(`/api/market/tasks/${d.id}/apply`, { pitch: s.el.querySelector('#pitch').value });
      s.close();
      confettiIfAvail();
      toast('Applied — the client accepted! 🤝 Check Work → My gigs.', 'ok', 3400);
      setTimeout(() => location.reload(), 900);
    } catch (e) { toast(esc(e.message), 'bad'); }
  });
  s.el.querySelector('#btnComplete')?.addEventListener('click', async () => {
    try {
      const r = await api.post(`/api/market/tasks/${d.id}/complete`);
      s.close(); confettiIfAvail();
      toast(`Task complete — ${(r.netLuna / 100000).toFixed(2)} NIM added 💰`, 'nim', 3600);
      refreshMe();
      setTimeout(() => location.reload(), 900);
    } catch (e) { toast(esc(e.message), 'bad'); }
  });
}

function confettiIfAvail() {
  import('../ui.js').then(({ confettiBurst }) => confettiBurst());
}
