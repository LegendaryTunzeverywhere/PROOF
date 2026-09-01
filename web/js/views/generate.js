/**
 * Path generation experience — the "AI is designing your path" moment.
 * Shared by onboarding + home + learn.
 */
import { api } from '../api.js';
import { esc, el, $ } from '../ui.js';

const STEPS = [
  'Reading your goal…',
  'Selecting proof checkpoints…',
  'Sequencing lessons for your pace…',
  'Attaching NIM rewards…',
  'Your path is ready.',
];

export function showGenerating(anchor, goal) {
  const overlay = el(`<div class="screen" style="position:absolute;inset:0;background:var(--grad-hero);color:#fff;z-index:80;display:flex;flex-direction:column;justify-content:center;padding:32px">
    <div class="eyebrow" style="color:rgba(255,255,255,.55)">PROOF ENGINE</div>
    <h2 class="display mt8" style="color:#fff">Designing your<br/>skill path…</h2>
    <p class="sub" style="color:rgba(255,255,255,.7);margin-top:8px">“${esc(goal)}”</p>
    <div class="mt24 stack" id="genSteps" style="gap:14px">
      ${STEPS.map((s, i) => `<div class="row" data-step="${i}" style="opacity:.28;transition:opacity .3s">
        <span style="width:22px;height:22px;border-radius:50%;border:2px solid rgba(255,255,255,.3);display:grid;place-items:center;font-size:11px" class="gen-tick">${i + 1}</span>
        <span style="font-weight:650;font-size:14.5px">${s}</span></div>`).join('')}
    </div></div>`);
  anchor.append(overlay);
  return {
    async run(minMs = 1900) {
      const t0 = Date.now();
      for (let i = 0; i < STEPS.length; i++) {
        await new Promise((r) => setTimeout(r, minMs / STEPS.length));
        const row = overlay.querySelector(`[data-step="${i}"]`);
        if (row) {
          row.style.opacity = '1';
          const tick = row.querySelector('.gen-tick');
          tick.style.background = '#12B76A'; tick.style.borderColor = '#12B76A'; tick.textContent = '✓'; tick.style.color = '#04150c';
        }
      }
      const wait = Math.max(0, minMs - (Date.now() - t0));
      if (wait) await new Promise((r) => setTimeout(r, wait));
    },
    done() { overlay.remove(); },
  };
}

export async function generateAndOpenPath({ goal, level, minutesPerDay, anchor }) {
  const gen = showGenerating(anchor, goal);
  const runP = gen.run();
  let result;
  try {
    result = await api.post('/api/paths', { goal, level, minutesPerDay });
  } catch (e) {
    await runP;
    gen.done();
    throw e;
  }
  await runP;
  gen.done();
  location.hash = `#/learn/path/${result.path.id}`;
  return result.path;
}
