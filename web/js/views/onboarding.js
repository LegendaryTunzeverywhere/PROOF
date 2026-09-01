/**
 * Onboarding — "What do you want to learn?" + wallet entry.
 * Strong, fast, mobile-first. Goal → path in under 30 seconds (spec §79).
 */
import { api } from '../api.js';
import { refreshMe, app } from '../state.js';
import { WalletService } from '../wallet.js';
import { esc, el, $, toast, ico } from '../ui.js';
import { generateAndOpenPath } from './generate.js';

const CATS = [
  ['💻', 'Coding'], ['🎨', 'Design'], ['📈', 'Marketing'], ['🤖', 'AI'], ['🎵', 'Music'],
  ['🗣️', 'Languages'], ['💼', 'Business'], ['📱', 'Social Media'], ['✍️', 'Writing'], ['📊', 'Data'], ['🔧', 'Practical'],
];

export async function screen(root) {
  root.innerHTML = `
  <div class="pad bento-read" style="padding-top:max(20px, env(safe-area-inset-top))">
    <div class="row-between mt8">
      <div class="logo-mini" style="font-weight:900;letter-spacing:.3em;font-size:14px">PR<span style="color:var(--nim)">O</span>OF</div>
      <button class="btn btn-ghost btn-sm" id="btnWallet">${ico.wallet} Connect wallet</button>
    </div>

    <div class="mt24" style="padding:6px 2px">
      <div class="eyebrow">LEARN · PRACTICE · PROVE · EARN</div>
      <h1 class="display mt8" style="font-size:33px">Learn anything.<br/>Prove it.<br/><span style="background:var(--nim-grad);-webkit-background-clip:text;background-clip:text;color:transparent">Earn with it.</span></h1>
      <p class="sub mt8">Don't collect certificates. Build <b>proof</b> — AI-checked practical challenges that turn skill into verified ability and real NIM.</p>
    </div>

    <div class="card mt24">
      <label class="label" for="goalInput">What do you want to learn?</label>
      <input id="goalInput" class="input" placeholder="e.g. I want to learn web development" autocomplete="off" maxlength="120"/>
      <div class="chip-scroll mt8" style="margin:10px -18px 0">
        ${CATS.map(([e, l]) => `<button class="chip" data-cat="${esc(l)}">${e} ${esc(l)}</button>`).join('')}
      </div>
      <div class="grid2 mt16">
        <div class="field" style="margin:0">
          <label class="label">Your level</label>
          <select id="lvl" class="input"><option value="">New to it</option><option value="beginner">Basics down</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select>
        </div>
        <div class="field" style="margin:0">
          <label class="label">Time / day</label>
          <select id="mpd" class="input"><option value="20">20 min</option><option value="30" selected>30 min</option><option value="45">45 min</option><option value="60">1 hour+</option></select>
        </div>
      </div>
      <button class="btn btn-primary btn-block mt16" id="btnStart">Start my skill path ${ico.arrow}</button>
      <p class="tiny center mt8">Free to start · proofs can earn up to 5 NIM each</p>
    </div>

    <div class="row mt16" style="gap:10px;justify-content:center">
      <span class="tiny">🔥 Streaks · ✅ Verified skills · 💼 Paid tasks</span>
    </div>
    <p class="tiny center mt16" style="padding:0 20px">PROOF runs as a Nimiq Mini App. Connect Nimiq Pay for on-chain rewards — or explore first with a demo wallet.</p>
  </div>`;

  const input = $('#goalInput', root);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
  root.querySelectorAll('[data-cat]').forEach((c) => c.addEventListener('click', () => {
    input.value = `I want to learn ${c.dataset.cat.toLowerCase().replace('social media', 'social media growth').replace('practical', 'practical skills')}`;
    input.focus();
  }));
  $('#btnStart', root).addEventListener('click', () => start());
  $('#btnWallet', root).addEventListener('click', () => walletEntry(root));

  async function start() {
    const goal = input.value.trim();
    if (goal.length < 3) { toast('Tell us what you want to learn ✍️', 'bad'); input.focus(); return; }
    const btn = $('#btnStart', root);
    btn.disabled = true;
    try {
      if (!app.me) {
        await api.post('/api/onboard', { goal, level: $('#lvl', root).value, minutesPerDay: parseInt($('#mpd', root).value, 10) });
        await refreshMe();
      } else {
        await api.patch('/api/me', { prefs: { goal, level: $('#lvl', root).value, minutesPerDay: parseInt($('#mpd', root).value, 10) } });
      }
      await generateAndOpenPath({ goal, level: $('#lvl', root).value, minutesPerDay: parseInt($('#mpd', root).value, 10), anchor: document.getElementById('app') });
    } catch (e) {
      toast(esc(e.message), 'bad'); btn.disabled = false;
    }
  }
}

/** Wallet entry used before a session exists — options adapt to the environment. */
export async function walletEntry(root) {
  const { sheet } = await import('../ui.js');
  const { environment, WalletService } = await import('../wallet.js');
  const env = environment();

  const payBtn = `<button class="btn ${env.kind === 'nimiqpay' ? 'btn-primary' : 'btn-ghost'} btn-block ${env.kind === 'nimiqpay' ? 'mt16' : 'mt8'}" id="wNimiq">${ico.wallet} Connect Nimiq Pay</button>`;
  const hubBtn = `<button class="btn btn-primary btn-block mt16" id="wHub">🔗 Connect Nimiq Hub</button>`;
  const demoBtn = `<button class="btn ${env.kind === 'nimiqpay' ? 'btn-soft' : 'btn-nim'} btn-block mt8" id="wDemo">🧪 Explore with demo wallet</button>`;

  let options;
  let note;
  if (env.kind === 'nimiqpay') {
    options = payBtn + demoBtn;
    note = '✅ Running inside Nimiq Pay — your keys never leave the wallet. All rewards are on-chain.';
  } else if (env.kind === 'desktop') {
    options = hubBtn + demoBtn +
      `<button class="btn btn-ghost btn-block mt8" id="wNimiq" style="opacity:.75">⚡ Nimiq Pay <span class="tiny">· mobile app only</span></button>`;
    note = '💻 Desktop detected → Use <b>Nimiq Hub</b> for on-chain rewards (secure popup). Or try the demo wallet instantly.';
  } else {
    options = hubBtn + demoBtn + payBtn;
    note = '📱 Use Nimiq Hub in this browser, or open PROOF inside the Nimiq Pay app for native wallet access.';
  }

  const s = sheet(`
    <h2 class="h1">Connect your wallet</h2>
    <p class="sub mt8">Your wallet holds your NIM rewards. Keys never leave it — you approve every action.</p>
    <div class="mt16">${options}</div>
    <p class="tiny center mt8" style="padding:0 8px">${note}</p>
  `);

  s.el.querySelector('#wHub')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true; btn.innerHTML = `🔗 Connecting to Nimiq Hub…`;
    try {
      await WalletService.connectNimiqHub();
      await refreshMe();
      s.close(); toast('Nimiq Hub connected ✅ On-chain rewards enabled!', 'ok');
      location.hash = '#/';
      location.reload();
    } catch (err) {
      btn.disabled = false; btn.innerHTML = hubBtn;
      const msg = String(err.message || err);
      let hint = '';
      if (msg.includes('HUB_TIMEOUT') || msg.includes('Connection was closed')) {
        hint = 'Hub popup timed out. Click again to retry - this is normal on first connect.';
      } else if (msg.includes('timeout') || msg.includes('popup')) {
        hint = 'Popup may have been blocked. Please allow popups for this site and try again.';
      } else if (msg.includes('NO_ACCOUNTS')) {
        hint = 'No accounts found. Please create an account in Nimiq Hub first.';
      } else if (msg.includes('SCRIPT_LOAD') || msg.includes('TRACKING') || msg.includes('storage')) {
        hint = 'Browser tracking prevention blocked the script. Try: 1) Use Brave/Firefox, 2) Disable tracking protection for this site, 3) Refresh the page.';
      }
      toast('Nimiq Hub connection failed. ' + hint, 'bad', 5000);
    }
  });

  s.el.querySelector('#wNimiq')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    if (env.kind === 'desktop') {
      toast('Nimiq Pay is mobile-only. On desktop, use Nimiq Hub for on-chain rewards.', '', 4200);
      return;
    }
    btn.disabled = true; btn.innerHTML = `⚡ Connecting to Nimiq Pay…`;
    try {
      await WalletService.connectNimiqPay();
      await refreshMe();
      s.close(); toast('Nimiq Pay connected ✅ On-chain rewards enabled!', 'ok');
      location.hash = '#/';
      location.reload();
    } catch (err) {
      btn.disabled = false; btn.innerHTML = payBtn;
      const msg = String(err.message || err);
      let hint = '';
      if (msg.includes('NIMIQ_') || msg.includes('timeout')) {
        hint = 'Connection timed out. Make sure you\'re using the Nimiq Pay app.';
      } else if (msg.includes('NO_ACCOUNTS')) {
        hint = 'No accounts found. Please create an account in Nimiq Pay first.';
      } else if (msg.includes('UNAVAILABLE') || msg.includes('SCRIPT_LOAD')) {
        hint = 'Nimiq Pay not available. Open PROOF inside the Nimiq Pay mobile app.';
      }
      toast('Nimiq Pay connection failed. ' + hint, 'bad', 4500);
    }
  });

  s.el.querySelector('#wDemo').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true; btn.textContent = 'Creating demo wallet…';
    try {
      await WalletService.connectDemo();
      await refreshMe();
      s.close(); toast('Demo wallet ready! 🧪 Full experience with simulated rewards.', 'ok', 3500);
      location.hash = '#/';
      location.reload();
    } catch (err) {
      btn.disabled = false; btn.innerHTML = demoBtn;
      console.error('[onboarding] Demo wallet error:', err);
      const errorMsg = err?.message?.includes('BAD_NONCE') 
        ? 'Sign-in request expired. Please try again.'
        : err?.message || 'Could not create demo wallet. Please check your connection and try again.';
      toast(errorMsg, 'bad', 4000);
    }
  });
}
