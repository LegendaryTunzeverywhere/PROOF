/**
 * Onboarding — "What do you want to learn?" + wallet entry.
 * Strong, fast, mobile-first. Goal → path in under 30 seconds.
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
  <div class="pad bento-read onboarding-shell" style="padding-top:max(14px, env(safe-area-inset-top))">
    <header class="brand-header">
      <a class="brand-lockup" href="#/" aria-label="PROOF home">
        <img src="/assets/proof-logo.svg" alt="PROOF" class="brand-logo" />
      </a>
      <div class="brand-actions">
        <button class="icon-action" id="btnNotifications" aria-label="Notifications" title="Notifications">
          ${ico.bell}<span class="notification-dot" hidden></span>
        </button>
        <button class="btn btn-ghost btn-sm wallet-action" id="btnWallet">${ico.wallet}<span>Connect wallet</span></button>
      </div>
    </header>

    <section class="onboarding-intro">
      <div class="eyebrow">LEARN · PRACTICE · PROVE · EARN</div>
      <h1 class="display">Learn anything.<br/>Prove it.<br/><span class="highlight-nim">Earn with it.</span></h1>
      <p class="sub">Don't collect certificates. Build <b>proof</b> — AI-checked practical challenges that turn skill into verified ability and real NIM.</p>
    </section>

    <section class="card onboarding-form" aria-labelledby="goalHeading">
      <label class="label" id="goalHeading" for="goalInput">What do you want to learn?</label>
      <div class="goal-input-wrap">
        <span class="goal-search" aria-hidden="true">${ico.sparkle}</span>
        <input id="goalInput" class="input" placeholder="e.g. Web development, Python, DeFi" autocomplete="off" maxlength="120"/>
      </div>

      <div class="section-head compact-head">
        <span class="label">Popular skills</span>
        <button class="link-button" id="toggleCategories" type="button">View all</button>
      </div>
      <div class="skill-picks" id="skillPicks">
        ${CATS.slice(0, 6).map(([e, l]) => `<button class="skill-pick" data-cat="${esc(l)}" type="button"><span class="skill-pick-icon">${e}</span><span>${esc(l)}</span></button>`).join('')}
      </div>
      <div class="skill-picks skill-picks-more" id="moreCategories" hidden>
        ${CATS.slice(6).map(([e, l]) => `<button class="skill-pick" data-cat="${esc(l)}" type="button"><span class="skill-pick-icon">${e}</span><span>${esc(l)}</span></button>`).join('')}
      </div>

      <div class="form-grid mt16">
        <div class="field" style="margin:0">
          <label class="label" for="lvl">Your level</label>
          <select id="lvl" class="input"><option value="">New to it</option><option value="beginner">Basics down</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select>
        </div>
        <div class="field" style="margin:0">
          <label class="label" for="mpd">Time per day</label>
          <select id="mpd" class="input"><option value="20">20 min</option><option value="30" selected>30 min</option><option value="45">45 min</option><option value="60">1 hour+</option></select>
        </div>
      </div>
      <button class="btn btn-primary btn-block mt16 start-path" id="btnStart" type="button">Start my skill path <span class="button-arrow">${ico.arrow}</span></button>
      <p class="tiny center mt8">Free to start · proofs can earn up to 5 NIM each</p>
    </section>

    <div class="onboarding-value-row">
      <span>🔥 Streaks</span><span>✓ Verified skills</span><span>💼 Paid tasks</span>
    </div>
    <p class="tiny center onboarding-footnote">PROOF runs as a Nimiq Mini App. Connect a wallet when you're ready — or explore first with a demo wallet.</p>
  </div>`;

  const input = $('#goalInput', root);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
  root.querySelectorAll('[data-cat]').forEach((c) => c.addEventListener('click', () => {
    input.value = `I want to learn ${c.dataset.cat.toLowerCase().replace('social media', 'social media growth').replace('practical', 'practical skills')}`;
    input.focus();
  }));
  $('#toggleCategories', root).addEventListener('click', () => {
    const more = $('#moreCategories', root);
    const open = more.hidden;
    more.hidden = !open;
    $('#toggleCategories', root).textContent = open ? 'Show less' : 'View all';
  });
  $('#btnStart', root).addEventListener('click', () => start());
  $('#btnWallet', root).addEventListener('click', () => walletEntry(root));
  $('#btnNotifications', root).addEventListener('click', () => { location.hash = '#/notifications'; });

  async function start() {
    const goal = input.value.trim();
    if (goal.length < 3) { toast('Tell us what you want to learn ✍️', 'bad'); input.focus(); return; }
    const btn = $('#btnStart', root);
    btn.disabled = true;
    btn.classList.add('is-loading');
    try {
      if (!app.me) {
        await api.post('/api/onboard', { goal, level: $('#lvl', root).value, minutesPerDay: parseInt($('#mpd', root).value, 10) });
        await refreshMe();
      } else {
        await api.patch('/api/me', { prefs: { goal, level: $('#lvl', root).value, minutesPerDay: parseInt($('#mpd', root).value, 10) } });
      }
      await generateAndOpenPath({ goal, level: $('#lvl', root).value, minutesPerDay: parseInt($('#mpd', root).value, 10), anchor: document.getElementById('app') });
    } catch (e) {
      toast(esc(e.message), 'bad'); btn.disabled = false; btn.classList.remove('is-loading');
    }
  }
}

/** Wallet entry used before a session exists — options adapt to the environment. */
export async function walletEntry(root) {
  const { sheet } = await import('../ui.js');
  const { environment, WalletService } = await import('../wallet.js');
  const env = environment();

  const payBtn = `<button class="btn ${env.kind === 'nimiqpay' ? 'btn-primary' : 'btn-ghost'} btn-block ${env.kind === 'nimiqpay' ? 'mt16' : 'mt8'}" id="wNimiq">${ico.wallet} Connect Nimiq Pay</button>`;
  const hubBtn = `<button class="btn btn-primary btn-block mt16" id="wHub">${ico.link} Connect Nimiq Hub</button>`;
  const demoBtn = `<button class="btn ${env.kind === 'nimiqpay' ? 'btn-soft' : 'btn-nim'} btn-block mt8" id="wDemo">${ico.flask} Explore with demo wallet</button>`;

  let options;
  let note;
  if (env.kind === 'nimiqpay') {
    options = payBtn + demoBtn;
    note = 'Running inside Nimiq Pay — your keys never leave the wallet. Rewards can be on-chain.';
  } else if (env.kind === 'desktop') {
    options = hubBtn + demoBtn + `<button class="btn btn-ghost btn-block mt8" id="wNimiq" style="opacity:.75">${ico.bolt} Nimiq Pay <span class="tiny">· mobile app only</span></button>`;
    note = 'Desktop detected → use Nimiq Hub for on-chain rewards, or explore instantly with the demo wallet.';
  } else {
    options = hubBtn + demoBtn + payBtn;
    note = 'Use Nimiq Hub in this browser, or open PROOF inside Nimiq Pay for native wallet access.';
  }

  const s = sheet(`<h2 class="h1">Connect your wallet</h2><p class="sub mt8">Your wallet holds your NIM rewards. Keys never leave it — you approve every action.</p><div class="wallet-options mt16">${options}</div><p class="tiny center mt8 wallet-note">${note}</p>`);

  s.el.querySelector('#wHub')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true; btn.classList.add('is-loading'); btn.innerHTML = `${ico.link} Connecting to Nimiq Hub…`;
    try {
      await WalletService.connectNimiqHub(); await refreshMe(); s.close(); toast('Nimiq Hub connected ✅ On-chain rewards enabled!', 'ok'); location.hash = '#/';
    } catch (err) {
      btn.disabled = false; btn.classList.remove('is-loading'); btn.innerHTML = `${ico.link} Connect Nimiq Hub`;
      const msg = String(err.message || err); let hint = '';
      if (msg.includes('HUB_TIMEOUT') || msg.includes('Connection was closed')) hint = 'Hub popup timed out. Click again to retry.';
      else if (msg.includes('timeout') || msg.includes('popup')) hint = 'Popup may be blocked. Allow popups for this site and retry.';
      else if (msg.includes('NO_ACCOUNTS')) hint = 'No accounts found. Create an account in Nimiq Hub first.';
      else if (msg.includes('SCRIPT_LOAD') || msg.includes('TRACKING') || msg.includes('storage')) hint = 'Browser tracking prevention blocked the wallet script. Try disabling protection for this site.';
      toast('Nimiq Hub connection failed. ' + hint, 'bad', 5000);
    }
  });

  s.el.querySelector('#wNimiq')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    if (env.kind === 'desktop') { toast('Nimiq Pay is mobile-only. On desktop, use Nimiq Hub.', '', 4200); return; }
    if (!env.inNimiqPay) { toast('Open PROOF inside Nimiq Pay to connect it. Browser users can use Nimiq Hub or demo wallet.', '', 5000); return; }
    btn.disabled = true; btn.classList.add('is-loading'); btn.innerHTML = `${ico.bolt} Connecting to Nimiq Pay…`;
    try { await WalletService.connectNimiqPay(); await refreshMe(); s.close(); toast('Nimiq Pay connected ✅ On-chain rewards enabled!', 'ok'); location.hash = '#/'; }
    catch (err) {
      btn.disabled = false; btn.classList.remove('is-loading'); btn.innerHTML = `${ico.bolt} Connect Nimiq Pay`;
      const msg = String(err.message || err); let hint = '';
      if (msg.includes('NIMIQ_SDK_UNAVAILABLE')) hint = 'The wallet SDK could not load. Reopen PROOF from Nimiq Pay.';
      else if (msg.includes('NIMIQ_PAY_UNAVAILABLE')) hint = 'Nimiq Pay host not detected. Open PROOF inside Nimiq Pay.';
      else if (msg.includes('NO_ACCOUNTS')) hint = 'Create an account in Nimiq Pay first, then retry.';
      else if (msg.includes('TIMEOUT') || msg.includes('timeout')) hint = 'The wallet did not respond. Reopen PROOF and try again.';
      toast('Nimiq Pay connection failed. ' + hint, 'bad', 4500);
    }
  });

  s.el.querySelector('#wDemo').addEventListener('click', async (e) => {
    const btn = e.currentTarget; btn.disabled = true; btn.classList.add('is-loading'); btn.textContent = 'Creating demo wallet…';
    try { await WalletService.connectDemo(); await refreshMe(); s.close(); toast('Demo wallet ready! Full experience with simulated rewards.', 'ok', 3500); location.hash = '#/'; }
    catch (err) { btn.disabled = false; btn.classList.remove('is-loading'); btn.innerHTML = `${ico.flask} Explore with demo wallet`; const errorMsg = err?.message?.includes('BAD_NONCE') ? 'Sign-in request expired. Please try again.' : err?.message || 'Could not create demo wallet. Please try again.'; toast(errorMsg, 'bad', 4000); }
  });
}
