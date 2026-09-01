/**
 * UI kit — tiny DOM helpers + shared components.
 * All rendering is template-string based with esc() for user data (XSS-safe).
 */
export const esc = (s = '') => String(s)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function toast(msg, kind = '', ms = 2600) {
  const box = $('#toasts');
  const t = el(`<div class="toast ${kind}">${msg}</div>`);
  box.append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms);
}

export function confettiBurst(colors = ['#F5A623', '#5B57D9', '#12B76A', '#FF7AB2', '#FFD28A']) {
  const box = el('<div class="confetti"></div>');
  for (let i = 0; i < 26; i++) {
    const p = el(`<i style="left:${Math.random() * 100}%;background:${colors[i % colors.length]};
      animation-delay:${Math.random() * 0.35}s;animation-duration:${1 + Math.random() * 0.8}s;
      width:${5 + Math.random() * 6}px;height:${5 + Math.random() * 6}px"></i>`);
    box.append(p);
  }
  document.body.append(box);
  setTimeout(() => box.remove(), 2600);
}

/** Animated number counter. */
export function countUp(node, to, { ms = 900, from = 0, suffix = '', decimals = 0 } = {}) {
  const start = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - start) / ms);
    const eased = 1 - Math.pow(1 - k, 3);
    node.textContent = (from + (to - from) * eased).toFixed(decimals) + suffix;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ── icons (inline SVG, stroke-based) ── */
const I = (paths, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ${extra}>${paths}</svg>`;

export const ico = {
  home: I('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>'),
  learn: I('<path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M6 10.5V16c0 1.6 2.7 3 6 3s6-1.4 6-3v-5.5"/><path d="M22 8v6"/>'),
  prove: I('<circle cx="12" cy="9" r="6"/><path d="m8.5 14 -1.5 7 5-3 5 3-1.5-7"/>'),
  work: I('<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A2.5 2.5 0 0 1 11.5 3h1A2.5 2.5 0 0 1 15 5.5V7"/><path d="M3 12h18"/>'),
  profile: I('<circle cx="12" cy="8" r="4"/><path d="M4.5 21c1.3-3.6 4.1-5.5 7.5-5.5s6.2 1.9 7.5 5.5"/>'),
  bolt: I('<path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z"/>'),
  fire: I('<path d="M12 3s1 2.5-1 5c-1.6 2-3 3.6-3 6a4 4 0 0 0 8 0c0-1-.3-2-.9-2.9-.6 1-1.4 1.6-1.4 1.6.4-2.8-.7-7.2-1.7-9.7Z"/>'),
  check: I('<path d="m4.5 12.5 5 5 10-11"/>'),
  x: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  arrow: I('<path d="M5 12h14m-6-6 6 6-6 6"/>'),
  back: I('<path d="M19 12H5m6 6-6-6 6-6"/>'),
  star: I('<path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2-5.6-3.2L6.4 20l1.3-6.2L3 9.5l6.3-.7L12 3Z"/>'),
  share: I('<circle cx="6" cy="12" r="2.6"/><circle cx="17.5" cy="5.5" r="2.6"/><circle cx="17.5" cy="18.5" r="2.6"/><path d="m8.4 10.8 6.8-4m-6.8 6.4 6.8 4"/>'),
  chat: I('<path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12Z"/>'),
  wallet: I('<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18"/><circle cx="16.5" cy="15" r="1.3" fill="currentColor" stroke="none"/>'),
  trophy: I('<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 5H4.5a0 0 0 0 0 0 0c0 3 1.5 4.5 3.5 4.5M16 5h3.5c0 3-1.5 4.5-3.5 4.5"/><path d="M12 13v4m-3.5 4h7m-5.5-4h4"/>'),
  bell: I('<path d="M6 9.5a6 6 0 0 1 12 0c0 5 1.8 6 1.8 6H4.2s1.8-1 1.8-6"/><path d="M10.3 19.5a2 2 0 0 0 3.4 0"/>'),
  clock: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  book: I('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/>'),
  code: I('<path d="m8 8-4.5 4L8 16m8-8 4.5 4L16 16m-2.5-11-3 14"/>'),
  send: I('<path d="m21 3-9.5 9.5M21 3l-6.5 18-3-7.5L4 10.5 21 3Z"/>'),
  users: I('<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20c1.1-3 3.6-4.7 6.5-4.7s5.4 1.7 6.5 4.7"/><path d="M16 5.4a3.5 3.5 0 0 1 0 6.2M18.5 15.6c1.5.7 2.6 2.1 3 4.4"/>'),
  coin: I('<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2c-.6-.8-1.6-1.2-2.8-1.2-1.8 0-3 .9-3 2.1 0 2.9 6 1.3 6 4.1 0 1.2-1.3 2.1-3 2.1-1.3 0-2.4-.5-3-1.4M12 6.5v11"/>'),
  sparkle: I('<path d="M12 3.5 13.8 9 19 10.8 13.8 12.6 12 18l-1.8-5.4L5 10.8 10.2 9 12 3.5Z"/><path d="M19 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z"/>'),
};

/* ── shared components ── */
export function scoreRing(score, { size = 128, stroke = 10, pass = true, label = 'PASS' } = {}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const id = 'g' + Math.random().toString(36).slice(2, 7);
  const color = pass ? '#12B76A' : '#F79009';
  return `<div class="ring" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${pass ? '#34D399' : '#FFC069'}"/><stop offset="1" stop-color="${color}"/></linearGradient></defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="#ECEBF6" stroke-width="${stroke}" fill="none"/>
      <circle class="ring-fill" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="url(#${id})" stroke-width="${stroke}"
        fill="none" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-target="${c * (1 - score / 100)}"/>
    </svg>
    <div class="val"><b class="num" data-count="${score}">0</b><span class="tiny" style="font-weight:800;letter-spacing:.12em;color:${pass ? 'var(--ok-deep)' : 'var(--warn)'}">${esc(label)}</span></div>
  </div>`;
}

export function animateRings(root) {
  $$('.ring-fill', root).forEach((c) => {
    requestAnimationFrame(() => { c.style.strokeDashoffset = c.dataset.target; });
  });
  $$('[data-count]', root).forEach((n) => countUp(n, Number(n.dataset.count), { decimals: Number(n.dataset.decimals || 0) }));
}

export function sheet(html, { onClose } = {}) {
  const veil = el('<div class="sheet-veil"></div>');
  const s = el(`<div class="sheet"><div class="sheet-grab"></div>${html}</div>`);
  const close = () => { veil.remove(); s.remove(); onClose && onClose(); };
  veil.addEventListener('click', close);
  document.body.append(veil, s);
  return { el: s, close };
}

export function timeAgo(ts) {
  const s = Math.max(1, (Date.now() - ts) / 1000);
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function fmtNim(n, decimals = 0) {
  return Number(n).toFixed(decimals).replace(/\.00$/, '');
}

export function spinner(label = 'Loading…') {
  return `<div class="analyze"><div class="scan-wrap"><div class="scan-ring"></div></div><div class="scan-step">${esc(label)}</div></div>`;
}

/**
 * Wallet connection status helpers - consistent display across all pages
 */
export function getWalletStatusLabel(mode, isDemo = false) {
  if (!mode) return { label: 'No wallet', icon: ico.wallet, color: 'var(--muted)' };
  if (isDemo) return { label: 'Demo wallet', icon: '🧪', color: 'var(--nim-deep)' };
  if (mode === 'hub') return { label: 'Nimiq Hub', icon: '🔗', color: 'var(--primary-deep)' };
  if (mode === 'nimiqpay') return { label: 'Nimiq Pay', icon: '⚡', color: 'var(--nim-deep)' };
  return { label: mode, icon: ico.wallet, color: 'var(--muted)' };
}

export function walletStatusBadge(mode, isDemo = false) {
  const status = getWalletStatusLabel(mode, isDemo);
  const modeClass = mode === 'nimiqpay' ? 'wallet-badge nimiqpay' : mode === 'hub' ? 'wallet-badge hub' : mode === 'demo' ? 'wallet-badge demo' : '';
  return `<span class="chip ${modeClass}" style="color:${status.color}" title="${status.label}">${status.icon} ${status.label}</span>`;
}

/**
 * Skeleton loading components for better UX
 */
export function skeletonCard(height = '80px') {
  return `<div class="skeleton" style="height:${height};border-radius:var(--radius)"></div>`;
}

export function skeletonText(width = '60%', height = '16px') {
  return `<div class="skeleton" style="width:${width};height:${height};border-radius:4px"></div>`;
}

export function skeletonAvatar(size = '40px') {
  return `<div class="skeleton" style="width:${size};height:${size};border-radius:50%"></div>`;
}

export function loadingOverlay(message = 'Loading…') {
  return `<div class="loading-overlay">
    <div class="spinner-large"></div>
    <p class="mt8" style="color:var(--muted)">${esc(message)}</p>
  </div>`;
}

/**
 * Empty state components
 */
export function emptyState(emoji, title, subtitle = '', actionHtml = '') {
  return `<div class="empty">
    <span class="big">${emoji}</span>
    <b style="font-size:14px;display:block;margin-top:8px">${esc(title)}</b>
    ${subtitle ? `<span class="sub">${esc(subtitle)}</span>` : ''}
    ${actionHtml}
  </div>`;
}
