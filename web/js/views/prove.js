/**
 * Prove — proof hub, challenge runner, server-side evaluation, result moment.
 * The client NEVER sends a score — only content. The server decides (§62).
 */
import { api } from '../api.js';
import { refreshMe, app } from '../state.js';
import { esc, el, $, $$, ico, toast, sheet, confettiBurst, countUp, animateRings, scoreRing, fmtNim, timeAgo, walletStatusBadge, emptyState } from '../ui.js';

export async function hub(root) {
  const [pathsRes, dailyRes, attemptsRes, sponsoredRes] = await Promise.all([
    api.get('/api/paths'), api.get('/api/daily'), api.get('/api/me/attempts'), api.get('/api/sponsored'),
  ]);
  const paths = pathsRes.paths;
  const proofs = [];
  for (const p of paths) {
    for (const d of p.days) {
      for (const i of d.items) {
        if (i.challengeId && !i.attempt) proofs.push({ p, d, i });
      }
    }
  }
  proofs.sort((a, b) => a.d.index - b.d.index);

  root.innerHTML = `<div class="pad" style="padding-top:max(16px, env(safe-area-inset-top))">
    <div class="row-between" style="margin-bottom:16px">
      <div>
        <h1 class="h1">Prove your skill</h1>
        <p class="sub mt8">Watching lessons proves nothing. These do.</p>
      </div>
      <div id="walletStatusPlaceholder"></div>
    </div>

    <div class="card mt16 card-click ${dailyRes.done ? '' : ''}" id="dailyCard" style="${dailyRes.done ? 'opacity:.8' : 'box-shadow:0 10px 30px rgba(233,178,19,.2);border-color:rgba(233,178,19,.4);border-width:2px'}">
      <div class="row-between" style="margin-bottom:10px">
        <span class="eyebrow">TODAY'S PROOF</span>
        <span class="chip chip-nim" style="font-weight:800">${ico.coin} +${dailyRes.challenge.rewardNim} NIM</span>
      </div>
      <b style="display:block;font-size:16px;font-weight:700;line-height:1.3">${esc(dailyRes.challenge.title)}</b>
      <div class="row-between mt12"><span class="sub">${dailyRes.done ? (dailyRes.passed ? 'Passed 🔥 +streak' : 'Attempted — try again after the cooldown') : '~10 minutes · one per day'}</span>
        ${dailyRes.done ? '<span class="chip chip-ok" style="padding:6px 12px">✓</span>' : `<span class="btn btn-nim btn-sm">Start proof</span>`}</div>
    </div>

    <div class="section"><div class="section-head"><span class="eyebrow">🎯 YOUR PROOF CHECKPOINTS</span></div>
      ${proofs.length ? `<div class="stack">${proofs.slice(0, 6).map(({ p, d, i }) => `
        <div class="card card-click" data-ch="${i.challengeId}" style="padding:16px 18px">
          <div class="row-between">
            <div style="flex:1;min-width:0"><b style="font-size:15px;font-weight:700;line-height:1.3">${esc(i.title)}</b>
              <div class="tiny mt8" style="color:var(--muted)">${p.skillEmoji} ${esc(p.skillName)} · Day ${d.index} · ${i.kind === 'final' ? 'FINAL' : i.kind === 'project' ? 'PROJECT' : 'CHECKPOINT'}</div></div>
            ${i.rewardNim ? `<span class="chip chip-nim" style="font-weight:800;flex-shrink:0">${ico.coin} ${i.rewardNim}</span>` : `<span class="chip chip-primary" style="flex-shrink:0">+${i.xp} XP</span>`}
          </div>
        </div>`).join('')}</div>`
      : `<div class="card"><div class="empty"><span class="big">🗺️</span><b style="font-size:14px;display:block;margin-top:8px">No proofs queued yet</b><span class="sub">Start learning to unlock proof checkpoints with real rewards.</span><a href="#/learn" class="btn btn-soft mt12" style="display:inline-flex">Start Learning</a></div></div>`}
    </div>

    <div class="section"><div class="section-head"><span class="eyebrow">💰 SPONSORED CHALLENGES</span></div>
      ${sponsoredRes.sponsored.length ? `<div class="stack">${sponsoredRes.sponsored.map((s) => `
        <div class="card" style="padding:16px 18px">
          <div class="row-between" style="margin-bottom:10px"><div class="row" style="gap:12px;align-items:center;min-width:0;flex:1"><span style="font-size:24px;line-height:1;flex-shrink:0">${s.emoji}</span><b style="font-size:15px;font-weight:700;overflow:hidden;text-overflow:ellipsis">${esc(s.title)}</b></div>
            <span class="chip chip-nim" style="font-weight:800;flex-shrink:0">${fmtNim(s.poolNim)} NIM</span></div>
          <div class="tiny" style="color:var(--muted);line-height:1.5">${esc(s.sponsor)} · ${s.participants} proofers · top ${fmtNim(s.topNim)} + qualified share ${fmtNim(s.qualifiedNim)}</div>
          <button class="btn ${s.joined ? 'btn-ghost' : 'btn-soft'} btn-sm mt12" data-join="${s.id}" ${s.joined ? 'disabled' : ''}>${s.joined ? '✓ Joined — pass the final proof' : 'Join challenge'}</button>
        </div>`).join('')}</div>` : `<div class="card"><div class="empty"><span class="big">💰</span><b style="font-size:14px;display:block;margin-top:8px">No live challenges right now</b><span class="sub">Sponsors fund challenge pools — when they're live, anyone can join and prove their way to the prize pool.</span></div></div>`}</div>

    ${attemptsRes.attempts.length ? `<div class="section bento-full"><div class="section-head"><span class="eyebrow">📜 PROOF HISTORY</span><a class="link" href="#/profile">Profile →</a></div>
      <div class="stack">${attemptsRes.attempts.slice(0, 5).map((a) => `
        <div class="card card-click" data-att="${a.id}" style="padding:12px 16px">
          <div class="row-between"><span style="font-size:13.5px;font-weight:650">${esc(a.challenge?.title || 'Challenge')}</span>
            <span class="chip ${a.status === 'passed' ? 'chip-ok' : 'chip-bad'}" style="padding:4px 10px">${a.score}/100</span></div>
          <div class="tiny mt8" style="color:var(--muted)">${timeAgo(a.submittedAt)}</div>
        </div>`).join('')}</div></div>` : ''}
  </div>`;

  // Add wallet status display
  const walletStatusEl = root.querySelector('#walletStatusPlaceholder');
  if (walletStatusEl) {
    walletStatusEl.innerHTML = walletStatusBadge(app.me?.walletMode, app.me?.walletModeIsDemo);
  }

  root.querySelector('#dailyCard').addEventListener('click', () => { location.hash = '#/daily'; });
  $$('[data-ch]', root).forEach((n) => n.addEventListener('click', () => { location.hash = `#/prove/challenge/${n.dataset.ch}`; }));
  $$('[data-att]', root).forEach((n) => n.addEventListener('click', () => { location.hash = `#/prove/attempt/${n.dataset.att}`; }));
  $$('[data-join]', root).forEach((n) => n.addEventListener('click', async () => {
    try {
      await api.post(`/api/sponsored/${n.dataset.join}/join`);
      n.textContent = '✓ Joined — pass the final proof'; n.disabled = true; n.className = 'btn btn-ghost btn-sm mt8';
      toast("You're in! Pass the final assessment to qualify for the pool. 🏆", 'ok', 3200);
    } catch (e) { toast(esc(e.message), 'bad'); }
  }));
}

/* ── challenge runner ── */
export async function challengeScreen(root, { id }) {
  const isDaily = false;
  let ch, openAttemptId;
  try {
    if (id === 'daily') {
      const d = await api.get('/api/daily');
      ch = d.challenge; openAttemptId = null;
    } else {
      const r = await api.get(`/api/challenges/${id}`);
      ch = r.challenge; openAttemptId = r.openAttemptId;
    }
  } catch (e) { root.innerHTML = `<div class="pad mt24 center"><p class="sub">${esc(e.message)}</p></div>`; return; }

  let attemptId = openAttemptId;
  if (!attemptId) {
    try {
      const r = await api.post(`/api/challenges/${ch.id}/start`);
      attemptId = r.attemptId;
    } catch (e) {
      if (e.code === 'RATE_LIMITED') {
        root.innerHTML = rateLimited(e.retryInMs, ch);
        return;
      }
      root.innerHTML = `<div class="pad mt24 center"><p class="sub">${esc(e.message)}</p></div>`;
      return;
    }
  }

  const fields = ch.submissionFields || ['text'];
  const isCode = fields.includes('code');
  root.innerHTML = `<div class="pad" style="padding-top:max(14px, env(safe-area-inset-top))">
    <div class="row-between bento-full">
      <button class="btn btn-ghost btn-sm" id="back">${ico.back} Back</button>
      <div id="walletStatusPlaceholder"></div>
    </div>
    <div class="row-between bento-full mt12">
      <div></div>
      <div class="row" style="gap:10px;flex-wrap:wrap;justify-content:flex-end">
        ${ch.rewardNim ? `<span class="chip chip-nim" style="font-weight:800">${ico.coin} ${ch.rewardNim} NIM reward</span>` : `<span class="chip chip-primary">+${ch.xp} XP</span>`}
        <span class="chip" id="timer" style="font-weight:700;background:var(--surface-2);border-color:var(--line-2);display:inline-flex;align-items:center;gap:6px">${ico.clock.replace('<svg', '<svg width="14" height="14"')} ${ch.timeMin}:00</span>
      </div>
    </div>

    <div class="mt16 bento-full">
      <div class="card" style="background:var(--tint-gold, rgba(233,178,19,.13));border-color:rgba(233,178,19,.4);padding:12px 16px;display:inline-flex;align-items:center;gap:8px">
        <span style="font-size:18px">${ch.kind === 'final' ? '🏆' : ch.kind === 'project' ? '🛠️' : ch.kind === 'daily' ? '🎯' : '🎯'}</span>
        <span class="eyebrow" style="color:var(--nim-deep);margin:0">${ch.kind === 'final' ? 'FINAL ASSESSMENT' : ch.kind === 'project' ? 'PROJECT PROOF' : ch.kind === 'daily' ? "TODAY'S PROOF" : 'PROOF CHECKPOINT'}</span>
      </div>
      <h1 class="h1 mt12" style="font-size:24px">${esc(ch.title)}</h1>
    </div>

    <div class="card mt16">
      <p style="margin:0;font-size:15.5px;line-height:1.6;color:var(--ink)">${esc(ch.brief)}</p>
      ${ch.requirements?.length ? `<div class="mt16"><span class="eyebrow" style="color:var(--ink-2)">REQUIREMENTS</span><ul class="reqs">${ch.requirements.map((r) => `<li><span class="tick">✓</span> ${esc(r)}</li>`).join('')}</ul></div>` : ''}
      <div class="divider"></div>
      <div class="row-between">
        <span class="tiny">Pass score: <b style="color:var(--primary)">${ch.passScore}/100</b> · Server-graded</span>
        ${isCode ? `<button class="btn btn-soft btn-sm" id="preview">${ico.code.replace('<svg', '<svg width="14" height="14"')} Preview</button>` : ''}
        ${isCode && app.me?.walletModeIsDemo ? `<button class="btn btn-ghost btn-sm" id="autoType" title="Demo sandbox only — types the sample word by word">✍️ Demo auto-type</button>` : ''}
      </div>
    </div>

    <div class="mt20">
      ${isCode ? `<div class="field"><label class="label">Your ${ch.type === 'html' ? 'HTML' : 'code'}</label>
        <textarea id="fCode" class="input input-mono" spellcheck="false" style="min-height:280px" placeholder="${esc(ch.type === 'html' ? '<!DOCTYPE html>\n<html lang="en">\n  … build it here …' : 'function isPalindrome(text) {\n  …\n}')}"></textarea></div>` : ''}
      ${fields.includes('explanation') ? `<div class="field"><label class="label">Edge cases — how did you handle them? <span class="tiny">(2–3 sentences)</span></label>
        <textarea id="fExpl" class="input" style="min-height:120px" placeholder="Empty input, wrong types, boundaries…"></textarea></div>` : ''}
      ${fields.includes('text') ? `<div class="field"><label class="label">Your submission <span class="tiny">(<span id="wc">0</span> words)</span></label>
        <textarea id="fText" class="input" style="min-height:220px;font-size:15px;line-height:1.6" placeholder="${esc(textPlaceholder(ch))}"></textarea></div>` : ''}
      <button class="btn btn-primary btn-block" id="submit" style="padding:16px;font-size:15.5px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:10px">Submit my proof ${ico.send.replace('<svg', '<svg width="18" height="18"')}</button>
      <div class="card mt12" style="background:var(--surface-2);border-color:var(--line-2);padding:14px">
        <p class="tiny" style="margin:0;color:var(--ink-2);line-height:1.5"><b>⌨️ Type-only proof</b> — Paste and drop are disabled. Hand-typing is verified server-side. Rubric-graded on the server, so scores can't be faked.</p>
      </div>
    </div>
  </div>`;

  // Add wallet status display
  const walletStatusEl2 = root.querySelector('#walletStatusPlaceholder');
  if (walletStatusEl2) {
    walletStatusEl2.innerHTML = walletStatusBadge(app.me?.walletMode, app.me?.walletModeIsDemo);
  }

  root.querySelector('#back').addEventListener('click', () => { location.hash = '#/prove'; });
  const ta = $('#fText', root);
  ta?.addEventListener('input', () => { $('#wc', root).textContent = (ta.value.trim().match(/\S+/g) || []).length; });
  
  // Typing metadata tracking (for type-only proof verification)
  const typingMeta = { keystrokes: 0, pastes: 0, startTime: Date.now() };
  
  // Prevent paste and drop on all input fields (type-only proof verification)
  const preventPasteDrop = (field) => {
    if (!field) return;
    field.addEventListener('paste', (e) => {
      e.preventDefault();
      typingMeta.pastes++;
      toast('⌨️ Type-only proof — pasting is disabled', 'bad', 2000);
    });
    field.addEventListener('drop', (e) => {
      e.preventDefault();
      toast('⌨️ Type-only proof — dropping is disabled', 'bad', 2000);
    });
    field.addEventListener('dragover', (e) => e.preventDefault());
    field.addEventListener('keydown', () => typingMeta.keystrokes++);
  };
  
  preventPasteDrop($('#fText', root));
  preventPasteDrop($('#fCode', root));
  preventPasteDrop($('#fExpl', root));
  
  $('#preview', root)?.addEventListener('click', () => {
    const code = $('#fCode', root).value;
    if (!code.trim()) return toast('Write some HTML first.', 'bad');
    const w = window.open('', '_blank', 'width=400,height=600');
    w.document.write(code); w.document.close();
  });
  $('#autoType', root)?.addEventListener('click', () => {
    const ta = $('#fCode', root);
    if (!ta) return;
    const sample = 'function isPalindrome(text) {\n  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, \'\');\n  return clean === clean.split(\"\").reverse().join(\"\");\n}';
    let i = 0;
    const typeChar = () => {
      if (i < sample.length) { ta.value += sample[i]; i++; setTimeout(typeChar, 30 + Math.random() * 40); }
    };
    ta.value = ''; typeChar();
    toast('Demo auto-typing sample code…', '', 1500);
  });
  const submitBtn = $('#submit', root);
  submitBtn.addEventListener('click', async () => {
    submitBtn.disabled = true; 
    const originalHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Submitting proof…';
    try {
      const payload = { 
        attemptId,
        meta: {
          keystrokes: typingMeta.keystrokes,
          pastes: typingMeta.pastes,
          duration: Date.now() - typingMeta.startTime
        }
      };
      if (isCode) {
        payload.code = $('#fCode', root).value;
        payload.explanation = $('#fExpl', root)?.value || '';
      } else {
        payload.text = $('#fText', root).value;
        payload.explanation = $('#fExpl', root)?.value || '';
      }
      const r = await api.post(`/api/attempts/${attemptId}/submit`, payload);
      location.hash = `#/prove/attempt/${r.attemptId}`;
    } catch (e) {
      submitBtn.disabled = false; 
      submitBtn.innerHTML = originalHtml;
      toast(esc(e.message), 'bad');
    }
  });
  // timer
  let secondsLeft = ch.timeMin * 60;
  const tick = () => {
    const m = Math.floor(secondsLeft / 60);
    const s = String(secondsLeft % 60).padStart(2, '0');
    const timerEl = root.querySelector('#timer');
    if (timerEl) {
      timerEl.innerHTML = `${ico.clock.replace('<svg', '<svg width="14" height="14"')} ${m}:${s}`;
      // Warning state when less than 2 minutes remain
      if (secondsLeft <= 120 && secondsLeft > 0) {
        timerEl.style.background = 'var(--warn)';
        timerEl.style.borderColor = 'var(--warn)';
        timerEl.style.color = '#fff';
      }
    }
    if (secondsLeft-- <= 0) {
      submitBtn.disabled = true; submitBtn.textContent = 'Time is up!';
      if (timerEl) {
        timerEl.style.background = 'var(--bad)';
        timerEl.style.borderColor = 'var(--bad)';
        timerEl.style.color = '#fff';
      }
      toast('Time expired — submit before the timer runs out next time.', 'bad');
    } else { setTimeout(tick, 1000); }
  };
  tick();
}

function textPlaceholder(ch) {
  if (ch.type === 'html') return '<!DOCTYPE html>\n<html>\n  <head><title>My page</title></head>\n  <body>\n    <h1>Hello world</h1>\n    <p>My first HTML page.</p>\n  </body>\n</html>';
  if (ch.type === 'python') return '# Write a function\n# Use proper indentation\n\ndef hello(name):\n    return f"Hello, {name}!"';
  if (ch.type === 'javascript') return '// Write a function\n// Use proper syntax\n\nfunction hello(name) {\n  return `Hello, ${name}!`;\n}';
  if (ch.type === 'css') return '/* Write styles */\n\nbody {\n  font-family: Arial;\n  color: #333;\n}';
  if (ch.type === 'json') return '{\n  "name": "value",\n  "nested": {\n    "key": "value"\n  }\n}';
  if (ch.type === 'markdown') return '# My Document\n\n## Section\n\n- Item 1\n- Item 2';
  if (ch.type === 'sql') return '-- Write a query\n\nSELECT * FROM users WHERE active = 1;';
  if (ch.type === 'conversation') return '— Bonjour ! Je m\'appelle …\n— Bonjour ! Comment ça va ?\n…';
  return 'Write your answer here…';
}

function rateLimited(retryInMs, ch) {
  const mins = Math.ceil(retryInMs / 60000);
  return `<div class="pad mt24 center">
    <div style="font-size:40px">⏳</div>
    <p class="sub mt8">Rate limited — try again in ${mins} minute${mins > 1 ? 's' : ''}</p>
    <p class="tiny" style="color:var(--muted)">${esc(ch.title)}</p>
  </div>`;
}

/* ── result screen — THE moment ── */
export async function attemptScreen(root, { id }) {
  let bundle = null;
  try { bundle = JSON.parse(sessionStorage.getItem('proof_result') || 'null'); } catch { /* ignore */ }
  let attempt, evaluation, challenge, extra = bundle?.result && bundle.attemptId === id ? bundle.result : null;

  if (extra) {
    attempt = extra.attempt; evaluation = extra.evaluation; challenge = null;
    const chRes = await api.get(`/api/challenges/${attempt.challengeId}`).catch(() => null);
    challenge = chRes?.challenge;
  } else {
    const r = await api.get(`/api/attempts/${id}`);
    attempt = r.attempt; evaluation = r.evaluation; challenge = r.challenge;
    if (evaluation) extra = { reward: { granted: false }, xpGained: attempt.status === 'passed' ? challenge?.xp || 0 : 10 };
  }
  const me = app.me || (await refreshMe()).user;

  const passed = evaluation?.pass;
  const reward = extra?.reward;
  const skill = extra?.skill;
  const title = challenge?.title || attempt.challengeTitle || 'Your proof';

  root.innerHTML = `<div class="pad center bento-read" style="padding-top:max(28px, env(safe-area-inset-top))">
    <div class="row-between bento-full">
      <button class="btn btn-ghost btn-sm" id="back">${ico.back} Back</button>
      <div id="walletStatusPlaceholder"></div>
    </div>
    ${passed ? `<div class="float-reward">
      <div class="eyebrow" style="color:var(--ok-deep)">PROOF VERIFIED</div>
      <h1 class="display mt8" style="font-size:30px">You passed.</h1>
    </div>` : `<div class="float-reward">
      <div class="eyebrow" style="color:var(--warn)">NOT YET — BUT CLOSE</div>
      <h1 class="display mt8" style="font-size:30px">Keep going.</h1>
    </div>`}

    <div class="mt16" style="display:flex;justify-content:center">${scoreRing(Math.round(evaluation?.score || 0), { pass: passed, label: passed ? 'PASS' : 'KEEP GOING' })}</div>

    <div class="row mt16" style="gap:8px;justify-content:center;flex-wrap:wrap">
      <span class="chip chip-primary">+${extra?.xpGained ?? 0} XP</span>
      ${reward?.granted ? `<span class="chip chip-nim" id="nimChip" style="animation:floatUp .9s">${ico.coin} +${reward.amountNim} NIM</span>` : ''}
      ${extra?.leveledUp ? `<span class="chip chip-ok">⬆️ Level ${extra.newLevel}</span>` : ''}
      ${attempt.typed === true ? '<span class="chip chip-ok">⌨️ hand-typed ✓</span>' : ''}
      ${attempt.typed === false ? '<span class="chip chip-bad">⌨️ typing verification failed</span>' : ''}
    </div>

    ${skill ? skillCard(skill) : ''}
    ${reward?.granted && extra?.qualification ? qualifyCard(extra.qualification) : ''}
    ${extra?.newAchievements?.length ? `<div class="card mt12 center" style="background:linear-gradient(120deg,rgba(233,178,19,.16),rgba(233,178,19,.06))">${extra.newAchievements.map((a) => `<div><b>${a.emoji} ${esc(a.name)}</b><div class="tiny" style="color:#6B5410">${esc(a.desc)}</div></div>`).join('<div class="divider" style="margin:8px 0"></div>')}</div>` : ''}

    <div class="card mt12" style="text-align:left">
      <b style="font-size:14.5px">${esc(title)}</b>
      ${evaluation?.strengths?.length ? `<div class="mt16"><span class="eyebrow" style="color:var(--ok-deep)">WHAT YOU DID WELL</span>
        <ul class="keypoints">${evaluation.strengths.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>` : ''}
      ${evaluation?.improvements?.length ? `<div class="mt16"><span class="eyebrow" style="color:var(--bad)">IMPROVE</span>
        <ul class="keypoints">${evaluation.improvements.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>` : ''}
      ${evaluation?.nextStep ? `<div class="callout callout-ask mt16"><b>Next step → </b>${esc(evaluation.nextStep)}</div>` : ''}
      ${evaluation?.criteria?.length ? rubricTable(evaluation) : ''}
    </div>

    ${passed && extra?.proof?.publicId ? shareCard(extra.proof.publicId) : ''}

    <div class="mt16 stack">
      ${passed
        ? `<a class="btn btn-primary btn-block" href="#/learn">Continue the path ${ico.arrow}</a>
           ${extra?.qualification?.opportunities ? `<a class="btn btn-nim btn-block" href="#/work">${ico.work.replace('<svg', '<svg width="17" height="17"')} See your ${extra.qualification.opportunities} opportunities</a>` : ''}`
        : `<button class="btn btn-primary btn-block" id="retry">Try again (${Math.round((evaluation?.score || 0))}/100 → ${evaluation?.passScore || 70}+)</button>
           <a class="btn btn-soft btn-block" href="#/learn">Review the lessons</a>`}
    </div>
    <p class="tiny center mt16">Evaluated server-side by ${esc(evaluation?.engine || 'the PROOF engine')} · rubric-based · content hash ${esc((evaluation?.contentHash || '').slice(0, 10))}…</p>
  </div>`;

  // Add wallet status display
  const walletStatusEl3 = root.querySelector('#walletStatusPlaceholder');
  if (walletStatusEl3) {
    walletStatusEl3.innerHTML = walletStatusBadge(app.me?.walletMode, app.me?.walletModeIsDemo);
  }

  animateRings(root);
  if (passed) setTimeout(() => confettiBurst(), 250);
  root.querySelector('#back')?.addEventListener('click', () => { location.hash = '#/prove'; });
  root.querySelector('#retry')?.addEventListener('click', () => { location.hash = `#/prove/challenge/${attempt.challengeId}`; });
  root.querySelector('#copyProof')?.addEventListener('click', async () => {
    const pid = extra?.proof?.publicId;
    const url = `${location.origin}/p/${pid}`;
    try {
      if (navigator.share) await navigator.share({ title: 'My verified skill on PROOF', url });
      else { await navigator.clipboard.writeText(url); toast('Proof link copied ✅', 'ok'); }
    } catch { /* dismissed */ }
  });
}

function skillCard(skill) {
  return `<div class="card mt12" style="background:linear-gradient(120deg,rgba(233,178,19,.12),rgba(233,178,19,.05));border-color:rgba(233,178,19,.4)">
    <div class="row" style="gap:12px">
      <div style="font-size:24px">${skill.emoji}</div>
      <div style="flex:1">
        <b style="font-size:14px">${esc(skill.name)}</b>
        <div class="tiny" style="color:var(--muted)">Verified at <b>${skill.score}%</b> · ${skill.tier}</div>
      </div>
      <span class="chip chip-nim">+${skill.xp} XP</span>
    </div>
    <div class="bar bar-ok mt12"><i style="width:${skill.score}%"></i></div>
  </div>`;
}

function qualifyCard(q) {
  return `<div class="card mt12" style="background:linear-gradient(120deg,rgba(95,75,139,.12),rgba(95,75,139,.05));border-color:rgba(95,75,139,.35)">
    <b style="font-size:14px">🎯 You now qualify for ${q.opportunities} opportunities!</b>
    <p class="tiny mt8" style="color:var(--muted)">Your verified skill unlocked access to paid work and teaching sessions.</p>
  </div>`;
}

function shareCard(proofId) {
  return `<div class="card mt12 center" style="padding:16px">
    <b style="font-size:14px">Share this proof</b>
    <p class="tiny mt8" style="color:var(--muted)">A portable, verifiable page — clients can trust it because it's earned, not claimed.</p>
    <img src="/share/${esc(proofId)}.svg" alt="PROOF skill card" style="width:100%;border-radius:18px;margin-top:12px;box-shadow:var(--shadow-1)"/>
    <button class="btn btn-primary btn-block mt12" id="copyProof">Copy share link</button>
  </div>`;
}

function rubricTable(evaluation) {
  return `<div class="mt16"><span class="eyebrow">RUBRIC</span>
    <table class="rubric">
      <thead><tr><th>Criteria</th><th>Max</th><th>Score</th></tr></thead>
      <tbody>${evaluation.criteria.map((c) => `
        <tr><td>${esc(c.label)}</td><td>${c.max}</td><td><b>${c.earned}/${c.max}</b></td></tr>`).join('')}
      </tbody>
    </table></div>`;
}
