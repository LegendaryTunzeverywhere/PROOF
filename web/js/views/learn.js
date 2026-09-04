/**
 * Learn — paths, path detail, lesson (EXPLAIN → PRACTICE → PROVE) + AI tutor.
 */
import { api } from '../api.js';
import { app } from '../state.js';
import { esc, el, $, $$, ico, toast, fmtNim, walletStatusBadge } from '../ui.js';
import { generateAndOpenPath } from './generate.js';
import { startSocraticSession } from './socratic.js';

// Cache for path skill lookups to avoid repeated API calls
const pathSkillCache = new Map();

/**
 * Helper to extract skillSlug from a pathId by fetching the path.
 * Caches results to avoid repeated API calls.
 */
async function pathSkill(pathId) {
  if (pathSkillCache.has(pathId)) {
    return pathSkillCache.get(pathId);
  }
  try {
    const { path } = await api.get(`/api/paths/${pathId}`);
    const skillSlug = path.skillSlug || 'web-development'; // fallback
    pathSkillCache.set(pathId, skillSlug);
    return skillSlug;
  } catch (err) {
    console.warn('Failed to fetch path skill:', err);
    return 'web-development'; // fallback to default
  }
}

const SKILLS_CATALOG = [
  ['web-development', '💻', 'Web Development', 'Sites & apps: HTML, CSS, JS, APIs'],
  ['python', '🐍', 'Python', 'Automate & analyze'],
  ['ui-design', '🎨', 'UI Design', 'Interfaces people understand'],
  ['ai', '🤖', 'AI', 'Prompts & real workflows'],
  ['marketing', '📈', 'Marketing', 'Positioning & campaigns'],
  ['data-analysis', '📊', 'Data Analysis', 'Find the story in numbers'],
  ['writing', '✍️', 'Writing', 'Clear, persuasive words'],
  ['social-media', '📱', 'Social Media', 'Content systems that grow'],
  ['business', '💼', 'Business', 'Models that survive customers'],
  ['languages', '🗣️', 'Languages', 'German, French, Spanish, Mandarin'],
  ['music-production', '🎵', 'Music Production', 'Chords to finished tracks'],
  ['practical-skills', '🔧', 'Practical Skills', 'Budgeting & life ops'],
  ['nimiq-blockchain', '⛓️', 'Nimiq Blockchain', 'Keys, wallets, staking & building'],
];

export async function hub(root) {
  const [pathsRes, streakRes] = await Promise.all([
    api.get('/api/paths'),
    api.get('/api/stats/streak')
  ]);
  const paths = pathsRes.paths;
  const streak = streakRes.streak;
  
  root.innerHTML = `<div class="pad" style="padding-top:max(16px, env(safe-area-inset-top))">
    <div class="row-between" style="margin-bottom:16px">
      <h1 class="h1">Learning</h1>
      <div id="walletStatusPlaceholder"></div>
    </div>

    ${streakWidget(streak)}

    ${paths.length ? `<div class="section" style="margin-top:0">
      <div class="section-head">
        <span class="eyebrow">YOUR PATHS</span>
        <button class="btn btn-soft btn-xs" id="newPath">${ico.sparkle.replace('<svg', '<svg width="14" height="14"')} New</button>
      </div>
      <div class="stack">${paths.map((p) => pathCard(p)).join('')}</div></div>` : `
      <div class="card mt16 card-hero" style="padding:28px 24px">
        <div style="font-size:40px;margin-bottom:10px;line-height:1">✨</div>
        <h2 class="h2" style="color:#fff;margin:0;font-size:20px">Start your learning journey</h2>
        <p class="sub mt10" style="color:rgba(255,255,255,.82);font-size:15px;line-height:1.5">Tell PROOF what you want to learn — get a personalized path with proof checkpoints and NIM rewards.</p>
        <button class="btn btn-nim mt20" id="newPath" style="width:100%">${ico.sparkle.replace('<svg', '<svg width="18" height="18"')} Create your first path</button>
      </div>`}

    <div class="section ${paths.length ? '' : 'bento-full'}"><div class="section-head"><span class="eyebrow">${paths.length ? 'EXPLORE SKILLS' : 'OR PICK A SKILL'}</span></div>
      <div class="grid2">
        ${SKILLS_CATALOG.map(([slug, emoji, name, blurb]) => `
          <div class="card card-click skill-card" data-skill="${slug}" style="padding:16px 14px">
            <div style="font-size:28px;line-height:1" class="skill-emoji">${emoji}</div>
            <b style="font-size:14px;display:block;margin-top:8px;font-weight:700">${name}</b>
            <span class="tiny" style="opacity:.7">${blurb}</span>
          </div>`).join('')}
      </div></div>
  </div>`;

  // Add wallet status display
  const walletStatusEl = root.querySelector('#walletStatusPlaceholder');
  if (walletStatusEl) {
    walletStatusEl.innerHTML = walletStatusBadge(app.me?.walletMode, app.me?.walletModeIsDemo);
  }

  root.querySelector('#newPath')?.addEventListener('click', () => {
    showGoalModal((goal) => {
      if (goal) generateAndOpenPath({ goal, anchor: document.getElementById('app') }).catch((e) => toast(esc(e.message), 'bad'));
    });
  });
  root.querySelectorAll('[data-skill]').forEach((n) => n.addEventListener('click', () => {
    const slug = n.dataset.skill;
    const skillName = SKILLS_CATALOG.find(([s]) => s === slug)?.[2] || slug.replace(/-/g, ' ');
    showGoalModal((goal) => {
      if (goal) {
        generateAndOpenPath({ goal: goal || `I want to learn ${skillName.toLowerCase()}`, domain: slug, anchor: document.getElementById('app') }).catch((e) => toast(esc(e.message), 'bad'));
      }
    });
  }));
  $$('[data-path]', root).forEach((n) => n.addEventListener('click', () => { location.hash = `#/learn/path/${n.dataset.path}`; }));
}

function streakWidget(streak) {
  if (streak.currentStreak === 0) return '';
  const emoji = streak.emoji;
  const barColor = streak.atRisk ? 'var(--warn)' : 'var(--ok)';
  const message = streak.atRisk ? 'Complete a lesson today to keep your streak alive!' : `${streak.currentStreak} days strong! Keep learning to maintain your streak.`;
  return `<div class="card" style="padding:14px 16px;background:linear-gradient(135deg, rgba(33,188,165,.1) 0%, #FFF 100%);border:1px solid rgba(33,188,165,.35);margin-bottom:12px"><div class="row" style="gap:10px;align-items:center"><span style="font-size:24px">${emoji}</span><div style="flex:1"><div class="row" style="gap:6px;align-items:baseline"><b style="font-size:15px;color:var(--ink)">${streak.currentStreak}-day streak</b>${streak.atRisk ? `<span class="chip" style="background:var(--warn-soft);color:var(--warn);padding:2px 6px;font-size:9px;font-weight:800">AT RISK</span>` : ''}</div><div class="tiny" style="color:var(--ink-2);margin-top:2px">${message}</div></div><div style="text-align:center;min-width:42px"><b class="num" style="font-size:20px;color:${barColor};display:block">${streak.currentStreak}</b><span class="tiny" style="color:var(--muted);font-size:9px">DAYS</span></div></div></div>`;
}

function showGoalModal(callback) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-card"><div class="modal-header"><h2 class="modal-title">What do you want to learn?</h2><button class="modal-close" id="modalClose">${ico.x.replace('<svg', '<svg width="20" height="20"')}</button></div><div class="modal-body"><input type="text" class="input" id="goalInput" placeholder="e.g., Build responsive websites, Master Python, Learn French..." autocomplete="off" autofocus/><div class="modal-suggestions" id="modalSuggestions"><span class="modal-suggestion-label">Quick picks:</span>${SKILLS_CATALOG.slice(0, 6).map(([slug, emoji, name]) => `<button class="chip chip-suggest" data-goal="I want to learn ${name.toLowerCase()}">${emoji} ${name}</button>`).join('')}</div></div><div class="modal-footer"><button class="btn btn-ghost" id="modalCancel">Cancel</button><button class="btn btn-primary" id="modalSubmit">Create Path</button></div></div>`;
  document.body.appendChild(overlay);
  const input = overlay.querySelector('#goalInput');
  const submitBtn = overlay.querySelector('#modalSubmit');
  const cancelBtn = overlay.querySelector('#modalCancel');
  const closeBtn = overlay.querySelector('#modalClose');
  setTimeout(() => input.focus(), 100);
  const close = (value) => { overlay.remove(); callback(value); };
  const submit = () => { const goal = input.value.trim(); if (goal.length >= 3) close(goal); else { input.classList.add('input-error'); setTimeout(() => input.classList.remove('input-error'), 300); } };
  submitBtn.addEventListener('click', submit);
  cancelBtn.addEventListener('click', () => close(null));
  closeBtn.addEventListener('click', () => close(null));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(null); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') close(null); });
  overlay.querySelectorAll('[data-goal]').forEach((chip) => chip.addEventListener('click', () => { input.value = chip.dataset.goal; input.focus(); }));
}

function pathCard(p) {
  return `<div class="card card-click" data-path="${p.id}" style="padding:18px"><div class="row-between" style="margin-bottom:10px"><span class="chip chip-primary">${p.skillEmoji} ${esc(p.skillName)}</span><span class="tiny" style="white-space:nowrap;opacity:.7">${p.days.length} days · ${fmtNim(p.rewardNim ?? 0)} NIM</span></div><b style="display:block;font-size:16px;font-weight:700;line-height:1.3">${esc(p.title)}</b><div class="row mt12" style="gap:10px;align-items:center"><div class="bar" style="flex:1"><i style="width:${p.percent}%"></i></div><span class="tiny num" style="font-weight:800;color:var(--primary)">${p.percent}%</span></div></div>`;
}

export async function pathScreen(root, { id }) {
  const { path: p } = await api.get(`/api/paths/${id}`);
  root.innerHTML = `<div class="pad" style="padding-top:max(14px, env(safe-area-inset-top))"><div class="row-between"><button class="btn btn-ghost btn-sm" id="back">${ico.back} Learning</button><div id="walletStatusPlaceholder"></div></div><div class="row-between mt8"><div></div><span class="chip chip-nim">${ico.coin} ${fmtNim(p.rewardNim ?? 0)} NIM in this path</span></div><div class="card card-hero mt16" style="padding:20px"><div style="font-size:30px">${p.skillEmoji}</div><h1 class="h1 mt8" style="color:#fff">${esc(p.title)}</h1><p class="sub mt8" style="color:rgba(255,255,255,.72)">${esc(p.description)}</p><div class="row mt12" style="gap:10px;align-items:center"><div class="bar" style="flex:1;background:rgba(255,255,255,.2)"><i style="width:${p.percent}%;background:var(--nim-grad)"></i></div><b class="num" style="color:#fff;font-size:14px">${p.percent}%</b></div><div class="row mt12" style="gap:8px;flex-wrap:wrap"><span class="chip chip-dark">${p.level}</span><span class="chip chip-dark">${p.minutesPerDay} min/day</span><span class="chip chip-dark">${p.totalXp} XP total</span></div></div><div class="section bento-full"><div class="section-head"><span class="eyebrow">${p.days.length}-DAY SKILL PATH</span><span class="tiny">tap a day</span></div><div>${p.days.map((d) => dayBlock(p, d)).join('')}</div></div></div>`;
  const walletStatusEl = root.querySelector('#walletStatusPlaceholder');
  if (walletStatusEl) walletStatusEl.innerHTML = walletStatusBadge(app.me?.walletMode, app.me?.walletModeIsDemo);
  root.querySelector('#back').addEventListener('click', () => { location.hash = '#/learn'; });
  $$('.day-head', root).forEach((h) => h.addEventListener('click', () => h.parentElement.classList.toggle('open')));
  $$('[data-challenge]', root).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); location.hash = `#/prove/challenge/${b.dataset.challenge}`; }));
  $$('[data-lesson]', root).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); location.hash = `#/learn/lesson/${id}/${b.dataset.lesson}?day=${b.dataset.day}`; }));
  const current = p.days.find((d) => d.items.some((i) => !i.lessonDone && !i.practiceDone && !i.attempt));
  if (current) $(`.day[data-index="${current.index}"]`, root)?.classList.add('open'); else $('.day', root)?.classList.add('open');
}

function dayBlock(p, d) {
  const allDone = d.items.every((i) => i.lessonDone || i.attempt);
  const icon = d.kind === 'final' ? '🏆' : d.kind !== 'study' ? '🎯' : allDone ? '✅' : ['📖', '📗', '📘'][d.index % 3];
  return `<div class="day ${d.kind !== 'study' ? 'proof-day' : ''} ${allDone ? 'done' : ''}" data-index="${d.index}"><div class="day-head"><div class="day-num">${d.kind !== 'study' ? icon : d.index}</div><div style="flex:1"><b style="font-size:14.5px">Day ${d.index} · ${esc(d.title)}</b><div class="tiny">${d.estMin} min · +${d.xp} XP ${d.rewardNim ? `· <span style="color:var(--nim-deep);font-weight:800">+${d.rewardNim} NIM</span>` : ''}</div></div>${allDone ? '<span class="chip chip-ok" style="padding:4px 10px">✓</span>' : `<span class="tiny">${d.kind !== 'study' ? 'PROOF' : ''}</span>`}</div><div class="day-body">${d.items.map((i) => itemRow(d, i)).join('')}</div></div>`;
}

function itemRow(day, i) {
  const status = i.attempt ? `<span class="chip ${i.attempt.status === 'passed' ? 'chip-ok' : 'chip-bad'}" style="padding:4px 10px">${i.attempt.status === 'passed' ? '✓' : '·'} ${i.attempt.score}</span>` : i.practiceDone ? '<span class="chip chip-primary" style="padding:4px 10px">✓</span>' : '';
  return `<div class="row" style="padding:10px 4px;border-top:1px solid var(--line)"><span style="font-size:17px">${i.kind === 'study' ? (i.practiceDone ? '✏️' : '📖') : i.kind === 'final' ? '🏆' : i.kind === 'project' ? '🛠️' : '🎯'}</span><div style="flex:1"><b style="font-size:13.5px">${esc(i.title)}</b><div class="tiny">${i.kind === 'study' ? 'Lesson + practice' : `${i.kind === 'final' ? 'Final assessment' : i.kind === 'project' ? 'Project proof' : 'Proof checkpoint'} · ${i.estMin} min ${i.rewardNim ? `· ${i.rewardNim} NIM` : ''}`}</div></div>${status}${i.kind === 'study' ? `<button class="btn btn-soft btn-sm" data-lesson="${i.topic}" data-day="${day.index}">${i.lessonDone ? 'Review' : 'Learn'}</button>` : `<button class="btn ${i.attempt?.status === 'passed' ? 'btn-ghost' : 'btn-nim'} btn-sm" data-challenge="${i.challengeId}">${i.attempt ? (i.attempt.status === 'passed' ? 'Review' : 'Retry') : 'Start proof'}</button>`}</div>`;
}

export async function lessonScreen(root, { pathId, topic }) {
  const params = new URLSearchParams((location.hash.split('?')[1] || ''));
  const dayIndex = params.get('day') || '1';
  const skipGrilling = params.get('skip_grilling') === '1';
  const pathRes = await api.get(`/api/paths/${pathId}`);
  const p = pathRes.path;
  const skillSlug = topic.includes('/') ? topic.split('/')[0] : p.skillSlug;
  const lessonRes = await api.get(`/api/lesson/${skillSlug}/${topic}`);
  const lesson = lessonRes;
  const day = p.days.find((d) => String(d.index) === String(dayIndex)) || p.days[0];
  const item = day.items.find((i) => i.topic === topic) || day.items[0];
  if (!item.lessonDone && !skipGrilling) { showPreLessonPrompt(root, pathId, topic, dayIndex, lesson, p); return; }
  renderLessonContent(root, pathId, topic, dayIndex, p, day, item, lesson);
}

function showPreLessonPrompt(root, pathId, topic, dayIndex, lesson, path) {
  root.innerHTML = `<div class="pad" style="padding-top:max(14px, env(safe-area-inset-top))"><div class="row-between"><button class="btn btn-ghost btn-sm" id="back">${ico.back} Path</button><div id="walletStatusPlaceholder"></div></div><div class="pre-lesson-card"><div class="pre-lesson-icon">🎯</div><h2>Before we start...</h2><p class="pre-lesson-intro">Let's spend 2-3 minutes on a few questions about <strong>${esc(lesson.title)}</strong>.</p><p class="pre-lesson-why">This isn't a test — it helps you learn deeper by grounding what you're about to learn in your own context and experience.</p><div class="pre-lesson-benefits"><div class="benefit-item"><span class="benefit-icon">💡</span><span>Surface what you already know</span></div><div class="benefit-item"><span class="benefit-icon">🎯</span><span>Focus on what matters to you</span></div><div class="benefit-item"><span class="benefit-icon">🧠</span><span>Make connections that stick</span></div></div><div class="pre-lesson-actions"><button class="btn-primary btn-block" id="startGrilling">Start Pre-Lesson Questions</button><button class="btn-ghost btn-block mt12" id="skipGrilling">Skip and go straight to lesson</button></div></div></div>`;
  const walletStatusEl = root.querySelector('#walletStatusPlaceholder');
  if (walletStatusEl) walletStatusEl.innerHTML = walletStatusBadge(app.me?.walletMode, app.me?.walletModeIsDemo);
  root.querySelector('#back').addEventListener('click', () => { location.hash = `#/learn/path/${pathId}`; });
  root.querySelector('#startGrilling').addEventListener('click', () => { startSocraticSession('pre_lesson', topic, lesson.title, { skillSlug: path.skillSlug, lessonUrl: `#/learn/lesson/${pathId}/${topic}?day=${dayIndex}&skip_grilling=1` }); });
  root.querySelector('#skipGrilling').addEventListener('click', () => { location.hash = `#/learn/lesson/${pathId}/${topic}?day=${dayIndex}&skip_grilling=1`; });
}

function renderLessonContent(root, pathId, topic, dayIndex, p, day, item, lesson) {
  const stages = [
    { key: 'hook', label: 'Hook', icon: '🧭' },
    { key: 'learn', label: 'Learn', icon: '📖' },
    { key: 'quiz', label: 'Quiz', icon: '❓' },
    { key: 'recall', label: 'Recall', icon: '🧠' },
    { key: 'practice', label: 'Practice', icon: '✍️' },
  ];
  const quizQs = (lesson.quiz || []).slice(0, 3);
  const recallPrompts = lesson.recall || [];
  let idx = 0;
  let quizDone = false;
  const completed = new Set();
  let lessonMarkedDone = false;

  root.innerHTML = `<div class="pad bento-read" style="padding-top:max(14px, env(safe-area-inset-top))"><div class="row-between"><button class="btn btn-ghost btn-sm" id="back">${ico.back} Path</button><div id="walletStatusPlaceholder"></div></div><div class="row-between mt8"><button class="btn btn-soft btn-sm" id="waitWhatBtn" style="background: var(--warn-soft); color: var(--warn); border: 1px solid var(--warn);">❓ Wait, what?</button><button class="btn btn-soft btn-sm" id="tutorBtn">${ico.chat.replace('<svg', '<svg width="16" height="16"')} Ask tutor</button></div><div class="mt16"><span class="eyebrow">DAY ${day.index} · LESSON</span><h1 class="h1 mt8">${esc(lesson.title)}</h1><div class="chip-row mt8"><span class="chip">⏱ ${lesson.estMin} min</span><span class="chip">+20 XP</span>${lesson.challenge ? `<span class="chip chip-nim">${ico.coin} ${lesson.challenge.rewardNim} NIM proof ahead</span>` : ''}</div></div><div class="stepper mt16" id="stepper">${stages.map((s, i) => `<div class="step ${i === 0 ? 'active' : ''}" data-step="${i}"><span class="step-dot">${s.icon}</span><span class="step-label">${s.label}</span></div>`).join('')}</div><div id="stageZone" class="mt16"></div><div class="row mt16" style="gap:10px" id="navRow"><button class="btn btn-ghost" style="flex:0 0 110px" id="prev">${ico.back} Back</button><button class="btn btn-primary btn-block" id="next">Next ${ico.arrow}</button></div></div>`;

  const zone = () => root.querySelector('#stageZone');
  const navRow = () => root.querySelector('#navRow');
  const nextBtn = () => root.querySelector('#next');
  const prevBtn = () => root.querySelector('#prev');
  const walletStatusEl = root.querySelector('#walletStatusPlaceholder');
  if (walletStatusEl) walletStatusEl.innerHTML = walletStatusBadge(app.me?.walletMode, app.me?.walletModeIsDemo);
  root.querySelector('#back').addEventListener('click', () => { location.hash = `#/learn/path/${pathId}`; });
  root.querySelector('#waitWhatBtn').addEventListener('click', () => { startSocraticSession('wait_what', topic, lesson.title, { skillSlug: p.skillSlug, lessonContent: lesson.lesson?.tldr || '' }); });
  root.querySelector('#tutorBtn').addEventListener('click', () => tutorChat(p.skillSlug, topic, lesson));

  function syncStepper() {
    root.querySelectorAll('.step').forEach((s, i) => {
      s.classList.toggle('active', i === idx);
      s.classList.toggle('done', completed.has(i) && i !== idx);
      const dot = s.querySelector('.step-dot');
      dot.textContent = completed.has(i) ? '✓' : stages[i].icon;
    });
    prevBtn().disabled = idx === 0;
    nextBtn().disabled = (idx === 2 && !quizDone);
    // Use innerHTML here because ico.arrow is SVG markup. textContent would
    // expose the markup literally and break the lesson navigation button.
    nextBtn().innerHTML = idx === 3 ? `Practice ${ico.arrow}` : `Next ${ico.arrow}`;
    zone().scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function markLessonDone() {
    if (lessonMarkedDone) return;
    lessonMarkedDone = true;
    await api.post(`/api/paths/${pathId}/progress`, { dayIndex: day.index, topicSlug: topic, part: 'lesson' });
  }

  function renderHook() {
    zone().innerHTML = `${lesson.story ? `<div class="story-card"><span class="story-emoji">${esc(p.skillEmoji || '💡')}</span><p>${esc(lesson.story)}</p></div>` : ''}<div class="card mt12"><span class="eyebrow">WHY THIS LESSON</span><p class="sub mt8" style="color:var(--ink-2)">${esc(lesson.lesson.tldr)}</p></div>${lesson.objectives?.length ? `<div class="card mt12"><span class="eyebrow">BY THE END, YOU WILL</span><ul class="objectives mt8">${lesson.objectives.map((o) => `<li>${esc(o)}</li>`).join('')}</ul></div>` : ''}<div class="callout callout-ask mt12"><b>Ready?</b> Read it, quiz it, recall it — then prove it.</div>`;
  }

  function renderLearn() {
    zone().innerHTML = `<div class="card">${lesson.lesson.sections.map((s) => `<div class="lesson-sec"><h4>${esc(s.h)}</h4><p>${esc(s.body)}</p></div>`).join('')}${exampleBlock(lesson.lesson.example)}<div class="callout callout-warn mt8">⚠️ ${esc(lesson.lesson.misconception)}</div><div class="lesson-sec mt16"><h4>Key points</h4><ul class="keypoints">${lesson.lesson.keyPoints.map((k) => `<li>${esc(k)}</li>`).join('')}</ul></div>${lesson.memoryHook ? `<div class="memory-hook mt12"><b>🧠 Remember:</b> ${esc(lesson.memoryHook)}</div>` : ''}<div class="divider"></div><button class="btn btn-soft btn-sm" id="socraticCheck">${ico.chat.replace('<svg', '<svg width="15" height="15"')} Socratic check-in</button><div class="tiny mt8" style="color:var(--muted)">${esc(lesson.lesson.ask)}</div></div>`;
    zone().querySelector('#socraticCheck')?.addEventListener('click', () => startCheckpointSession(1, topic, lesson.title, p.skillSlug));
  }

  function renderQuiz() {
    if (!quizQs.length) { quizDone = true; zone().innerHTML = `<div class="card center"><p class="sub">No quiz for this lesson — straight to recall.</p></div>`; return; }
    quizDone = false;
    let answered = 0;
    zone().innerHTML = `<div class="stack">${quizQs.map((q, i) => `<div class="card quiz-card" data-q="${i}"><div class="row-between"><span class="eyebrow">QUESTION ${i + 1} / ${quizQs.length}</span><span class="tiny" id="qstatus${i}" style="color:var(--muted)"></span></div><b style="display:block;margin-top:10px;font-size:15.5px">${esc(q.q)}</b><div class="mt12" data-opts>${q.choices.map((c, ci) => `<button class="opt" data-ci="${ci}">${'ABCD'[ci]}. ${esc(c)}</button>`).join('')}</div><div id="qverdict${i}"></div></div>`).join('')}</div>`;
    zone().querySelectorAll('[data-q]').forEach((card) => {
      const qi = parseInt(card.dataset.q, 10);
      const q = quizQs[qi];
      card.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
        const chosen = parseInt(b.dataset.ci, 10);
        const right = chosen === q.answerIdx;
        card.querySelectorAll('.opt').forEach((x) => (x.disabled = true));
        b.classList.add(right ? 'correct' : 'wrong');
        if (!right) card.querySelectorAll('.opt')[q.answerIdx]?.classList.add('correct');
        answered++;
        card.querySelector(`#qstatus${qi}`).textContent = right ? '✓ correct' : '✗ review';
        card.querySelector(`#qverdict${qi}`).innerHTML = `<div class="callout mt12" style="background:${right ? 'var(--ok-soft)' : 'var(--bad-soft)'};color:${right ? 'var(--ok-deep)' : 'var(--bad)'}"><b>${right ? 'Correct — ' : 'Not quite. '}</b>${esc(q.why || '')}</div>`;
        if (answered >= quizQs.length) { quizDone = true; completed.add(2); nextBtn().disabled = false; nextBtn().innerHTML = `Keep going — recall time ${ico.arrow}`; }
      }));
    });
    nextBtn().disabled = true;
  }

  function renderRecall() {
    zone().innerHTML = `<div class="card"><span class="eyebrow">ACTIVE RECALL</span><p class="sub mt8">Answer these in your own words — out loud or typed. Retrieval is what makes it stick.</p>${recallPrompts.length ? `<div class="stack mt12">${recallPrompts.map((rp, i) => `<div class="recall-card"><b style="font-size:14px">${i + 1}. ${esc(rp)}</b><textarea class="input mt8" rows="3" placeholder="Type your answer here — no one grades this but you…"></textarea><div class="row mt8" style="gap:8px"><button class="btn btn-soft btn-sm" data-feel="ok">✓ I knew that</button><button class="btn btn-soft btn-sm" data-feel="weak">↻ I need to review</button></div></div>`).join('')}</div>` : `<div class="callout callout-ask mt12"><b>No recall prompts here.</b> The quiz + practice cover this topic.</div>`}</div>`;
    zone().querySelectorAll('[data-feel]').forEach((b) => b.addEventListener('click', () => { const card = b.closest('.recall-card'); card.querySelectorAll('[data-feel]').forEach((x) => (x.disabled = true)); b.classList.toggle('recall-ok', b.dataset.feel === 'ok'); b.classList.toggle('recall-weak', b.dataset.feel === 'weak'); toast(b.dataset.feel === 'ok' ? 'Nice — retrieval locks it in 🧠' : 'Reviewing the weak spot is the smart move 💪', b.dataset.feel === 'ok' ? 'ok' : ''); }));
    quizDone = true;
  }

  async function renderPractice() {
    navRow().style.display = 'none';
    await markLessonDone();
    zone().innerHTML = `<div id="practiceZone"></div>`;
    runPractice(root, pathId, day, item, lesson);
  }

  function go(step) {
    idx = step;
    completed.add(Math.max(0, step - 1));
    if (idx === 4) { renderPractice(); return; }
    navRow().style.display = 'flex';
    if (idx === 0) renderHook(); else if (idx === 1) renderLearn(); else if (idx === 2) renderQuiz(); else renderRecall();
    syncStepper();
  }

  nextBtn().addEventListener('click', () => go(idx + 1));
  prevBtn().addEventListener('click', () => go(idx - 1));
  go(0);
}

function startCheckpointSession(checkpointNum, topicSlug, lessonTitle, skillSlug) {
  startSocraticSession('checkpoint', topicSlug, lessonTitle, { skillSlug, checkpointNumber: checkpointNum, checkpointContext: 'Mid-lesson understanding check' });
}

function exampleBlock(ex) {
  if (!ex) return '';
  if (ex.code) return `<div class="code-block mt8">${esc(ex.code)}</div>`;
  return `<div class="card mt8" style="box-shadow:none;background:var(--surface-2)"><span class="tiny" style="color:var(--muted);font-weight:800">EXAMPLE</span><p class="sub" style="color:var(--ink-2);margin:6px 0 0">${esc(ex.text || '')}</p></div>`;
}

function runPractice(root, pathId, day, item, lesson) {
  const qs = lesson.practice || [];
  const zone = root.querySelector('#practiceZone');
  if (!qs.length) { zone.innerHTML = `<div class="card mt12 center"><b>Practice ready on the proof</b><p class="sub mt8">This topic proves itself in the challenge.</p></div>`; return; }
  let idx = 0; let correct = 0;
  zone.scrollIntoView({ behavior: 'smooth', block: 'start' });
  render();
  function render() {
    const q = qs[idx];
    zone.innerHTML = `<div class="card mt12"><div class="row-between"><span class="eyebrow">PRACTICE ${idx + 1}/${qs.length}</span><span class="tiny">+10 XP when done</span></div><b style="display:block;margin-top:10px;font-size:15.5px">${esc(q.q)}</b><div class="mt12" id="opts">${q.choices.map((c, i) => `<button class="opt" data-i="${i}">${'ABCD'[i]}. ${esc(c)}</button>`).join('')}</div><div id="verdict"></div></div>`;
    $$('#opts .opt', zone).forEach((b) => b.addEventListener('click', () => {
      const chosen = parseInt(b.dataset.i, 10);
      const right = chosen === q.answerIdx;
      $$('#opts .opt', zone).forEach((x) => (x.disabled = true));
      b.classList.add(right ? 'correct' : 'wrong');
      if (!right) zone.querySelectorAll('#opts .opt')[q.answerIdx].classList.add('correct');
      if (right) correct++;
      zone.querySelector('#verdict').innerHTML = `<div class="callout mt12" style="background:${right ? 'var(--ok-soft)' : 'var(--bad-soft)'};color:${right ? 'var(--ok-deep)' : 'var(--bad)'}"><b>${right ? 'Correct — ' : 'Not quite. '}</b>${esc(q.why || q.hint || '')}</div><button class="btn btn-primary btn-block mt12" id="nextQ">${idx + 1 < qs.length ? 'Next question' : 'Finish practice'}</button>`;
      zone.querySelector('#nextQ').addEventListener('click', async () => {
        idx++;
        if (idx < qs.length) render();
        else {
          await api.post(`/api/paths/${pathId}/progress`, { dayIndex: day.index, topicSlug: item.topic, part: 'practice' });
          showPostLessonReflection(zone, pathId, day, item, lesson, correct, qs.length);
        }
      });
    }));
  }
}

function showPostLessonReflection(zone, pathId, day, item, lesson, correctCount, totalCount) {
  const proofItem = day.items.find((x) => x.challengeId);
  zone.innerHTML = `<div class="card mt12"><div class="reflection-header"><div style="font-size:36px">${correctCount === totalCount ? '🌟' : '💪'}</div><b>${correctCount}/${totalCount} correct</b></div><div class="reflection-prompt"><div class="reflection-icon">🤔</div><div class="reflection-content"><h3>Take a moment to reflect...</h3><p>Before moving on, let's solidify what you learned.</p><button class="btn-primary btn-block" id="startReflection">Start Reflection (2 min)</button><button class="btn-ghost btn-block mt8" id="skipReflection">Skip reflection</button></div></div></div>`;
  zone.querySelector('#startReflection').addEventListener('click', () => { startSocraticSession('reflection', item.topic, lesson.title, { skillSlug: lesson.skillSlug || 'web-development', practiceScore: `${correctCount}/${totalCount}`, proofAhead: !!proofItem }); });
  zone.querySelector('#skipReflection').addEventListener('click', () => { showProofOrComplete(zone, pathId, proofItem); });
}

function showProofOrComplete(zone, pathId, proofItem) {
  zone.innerHTML = `<div class="card mt12 center"><div style="font-size:36px">✅</div><b>Lesson complete!</b><p class="sub mt8">${proofItem ? 'You know the concepts. Now prove it for real.' : 'Concepts locked in. Keep the streak alive tomorrow.'}</p>${proofItem ? `<button class="btn btn-nim btn-block mt8" id="goProof">${ico.bolt.replace('<svg', '<svg width="16" height="16"')} Start proof · ${proofItem.rewardNim ? `+${proofItem.rewardNim} NIM` : `+${proofItem.xp} XP`}</button>` : `<a href="#/learn/path/${pathId}" class="btn btn-soft btn-block mt8">Back to path</a>`}</div>`;
  zone.querySelector('#goProof')?.addEventListener('click', () => { location.hash = `#/prove/challenge/${proofItem.challengeId}`; });
}

async function tutorChat(skillSlug, topicSlug, lesson) {
  const { sheet } = await import('../ui.js');
  const history = [];
  const s = sheet(`<div class="row-between" style="gap:10px"><div class="row" style="gap:10px"><div class="avatar av-32" style="background:var(--grad-hero);color:#fff">${ico.sparkle.replace('<svg', '<svg width="15" height="15"')}</div><div><b>PROOF Tutor</b><div class="tiny">${esc(lesson.title)} · guides, never just answers</div></div></div><button class="btn btn-ghost btn-icon" id="closeChat" title="Close">${ico.x.replace('<svg', '<svg width="18" height="18"')}</button></div><div class="chat mt8" id="chatLog"><div class="msg ai">Hey — I'm your tutor for <b>${esc(lesson.title)}</b>. Ask me anything, or pick one:</div></div><div class="chip-row" id="quick"><button class="chip" data-q="Explain it simpler">Explain simpler</button><button class="chip" data-q="Show me an example">Example</button><button class="chip" data-q="Give me an exercise">Exercise</button><button class="chip" data-q="I'm stuck, give me a hint">Hint</button></div><div class="row mt8" style="gap:8px"><input class="input" id="chatInput" placeholder="Ask about this lesson…" style="flex:1"/><button class="btn btn-primary" id="chatSend" style="padding:12px 15px">${ico.send.replace('<svg', '<svg width="17" height="17"')}</button></div>`, { });
  const log = s.el.querySelector('#chatLog');
  const input = s.el.querySelector('#chatInput');
  const closeBtn = s.el.querySelector('#closeChat');
  if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); s.close(); });
  const send = async (q) => {
    if (!q.trim()) return;
    log.append(el(`<div class="msg me">${esc(q)}</div>`));
    input.value = '';
    const typing = el('<div class="msg ai typing"><i></i><i></i><i></i></div>');
    log.append(typing);
    log.scrollTop = log.scrollHeight;
    try {
      const r = await api.post('/api/tutor', { skillSlug, topicSlug, question: q, history: history.slice(-6) });
      history.push({ role: 'user', content: q }, { role: 'assistant', content: r.reply, exerciseHint: r.exercise?.hint });
      typing.remove();
      log.append(el(`<div class="msg ai">${esc(r.reply)}</div>`));
      log.scrollTop = log.scrollHeight;
    } catch (e) {
      typing.remove();
      log.append(el(`<div class="msg ai">⚠️ ${esc(e.message)}</div>`));
    }
  };
  s.el.querySelector('#chatSend').addEventListener('click', () => send(input.value));
  input.addEventListener('keydown', (e) => e.key === 'Enter' && send(input.value));
  s.el.querySelectorAll('#quick .chip').forEach((c) => c.addEventListener('click', () => send(c.dataset.q)));
}
