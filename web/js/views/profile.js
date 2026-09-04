/**
 * Profile — identity, wallet, skill tree, verified skills, proofs,
 * achievements, transactions. The visual resume of capability.
 */
import { api } from '../api.js';
import { app, refreshMe } from '../state.js';
import { WalletService } from '../wallet.js';
import { esc, $, $$, ico, toast, sheet, fmtNim, timeAgo, walletStatusBadge, emptyState } from '../ui.js';
import { walletEntry } from './onboarding.js';

export async function screen(root) {
  await refreshMe();
  const u = app.me;
  const [walletRes, achRes, statsRes, goalsRes, badgesRes] = await Promise.all([
    api.get('/api/wallet'), api.get('/api/achievements'), api.get('/api/stats/streak'), api.get('/api/goals'), api.get('/api/badges'),
  ]);

  root.innerHTML = `<div class="pad" style="padding-top:max(14px, env(safe-area-inset-top))">
    <div class="row-between">
      <h1 class="h1">Profile</h1>
      <div class="row" style="gap:8px">
        <a href="#/notifications" class="chip">${ico.bell.replace('<svg', '<svg width="15" height="15"')}${app.unread ? ` <b style="color:var(--bad)">${app.unread}</b>` : ''}</a>
        <a href="#/leaderboard" class="chip">${ico.trophy.replace('<svg', '<svg width="15" height="15"')}</a>
      </div>
    </div>

    <div class="card mt16 card-hero" style="padding:20px">
      <div class="row" style="gap:14px">
        <div class="avatar av-56" style="background:rgba(255,255,255,.15)">${u.avatar}</div>
        <div style="flex:1">
          <b style="font-size:19px;color:#fff">${esc(u.username)}</b>
          <div class="tiny" style="color:rgba(255,255,255,.6)">Level ${u.level} · ${u.xp} XP · ⭐ reputation ${u.reputation}</div>
          <div class="bar mt8" style="background:rgba(255,255,255,.18);width:100%"><i style="width:${xpPercent(u.xp, u.level)}%;background:var(--nim-grad)"></i></div>
        </div>
        <button class="btn btn-sm" id="editUser" style="background:rgba(255,255,255,.15);color:#fff">✏️</button>
      </div>
      <div class="grid3 mt16">
        <div class="stat" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.15)"><b style="color:#FFC98A" class="num">${fmtNim(u.balanceNim, 2)}</b><span style="color:rgba(255,255,255,.6)">NIM balance</span></div>
        <div class="stat" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.15)"><b style="color:#fff" class="num">${fmtNim(u.earnedNim, 1)}</b><span style="color:rgba(255,255,255,.6)">NIM earned</span></div>
        <div class="stat" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.15)"><b style="color:#fff">${u.proofsPassed}</b><span style="color:rgba(255,255,255,.6)">proofs passed</span></div>
      </div>
    </div>

    ${streakCard(statsRes.streak)}
    ${goalsCard(goalsRes)}
    ${badgesCard(badgesRes)}

    ${walletCard(walletRes)}

    <div class="section"><div class="section-head"><span class="eyebrow">YOUR SKILL TREE</span><span class="tiny">tap a node</span></div>
      <div class="card" style="padding:10px"><div class="tree-wrap" id="treeWrap" style="height:300px">${''}</div></div></div>

    <div id="skillsZone" class="bento-full"></div>
    <div id="achievementsZone" class="bento-full"></div>
    <div id="txZone" class="bento-full"></div>

    <div class="section center bento-full">
      <button class="btn btn-ghost btn-sm" id="logout">Sign out</button>
      <p class="tiny mt8">${WalletService.isDemo ? '🧪 Demo wallet — rewards settle to the in-app demo ledger.' : WalletService.mode === 'hub' ? '🔗 Nimiq Hub connected — on-chain rewards' : WalletService.mode === 'nimiqpay' ? '⚡ Nimiq Pay connected — on-chain rewards' : 'No wallet connected'}</p>
    </div>
  </div>`;

  await renderTree(root, u);
  await renderSkills(root, u);
  await renderAchievements(root.querySelector('#achievementsZone'), achRes);
  renderTxs(root.querySelector('#txZone'), walletRes);

  root.querySelector('#editUser').addEventListener('click', () => editUsername(root));
  root.querySelector('#addGoal')?.addEventListener('click', () => addGoalSheet(root));
  $$('[data-delete-goal]', root).forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const goalId = btn.dataset.deleteGoal;
      try {
        await api.del(`/api/goals/${goalId}`);
        toast('Goal removed', 'ok');
        screen(root);
      } catch (err) {
        toast(esc(err.message), 'bad');
      }
    });
  });
  root.querySelector('#connect')?.addEventListener('click', () => walletEntry(root));
  root.querySelector('#payout')?.addEventListener('click', () => payoutSheet(root));
  root.querySelector('#logout').addEventListener('click', async () => {
    await api.post('/api/auth/logout');
    WalletService.disconnect();
    location.hash = '#/onboarding';
    setTimeout(() => location.reload(), 60);
  });
}

function xpPercent(xp, level) {
  const base = 60 * (level - 1) * (level - 1);
  const next = 60 * level * level;
  return Math.min(100, Math.round(((xp - base) / Math.max(next - base, 1)) * 100));
}

function streakCard(streak) {
  const emoji = streak.emoji;
  const statusColor = streak.atRisk ? 'var(--warn)' : 'var(--ok-deep)';
  const statusText = streak.atRisk ? 'Learn today to keep it alive!' : 'Active today';
  
  return `<div class="card mt12" style="padding:16px;background:linear-gradient(135deg, #FFF9F0 0%, #FFF 100%);border:1px solid #FFE8CC">
    <div class="row" style="gap:12px;align-items:center">
      <div class="avatar av-48" style="background:var(--nim-grad);font-size:26px">${emoji}</div>
      <div style="flex:1">
        <div class="row" style="gap:6px;align-items:center;margin-bottom:4px">
          <b style="font-size:18px;color:var(--ink)">${streak.currentStreak}-day streak</b>
          ${streak.atRisk ? `<span class="chip" style="background:var(--warn-soft);color:var(--warn);padding:3px 8px;font-size:10px;font-weight:800">⚠️ AT RISK</span>` : ''}
        </div>
        <div class="tiny" style="color:var(--ink-2)">${statusText} · Longest: ${streak.longestStreak} days</div>
      </div>
      <div class="stat" style="background:#FFF;padding:10px 12px;min-width:60px">
        <b class="num" style="font-size:22px;color:${statusColor}">${streak.currentStreak}</b>
        <span style="font-size:10px;color:var(--muted)">days</span>
      </div>
    </div>
  </div>`;
}

function goalsCard(goalsRes) {
  const { activeGoals, completionRate, currentGoalStreak } = goalsRes;
  
  if (activeGoals === 0) {
    return `<div class="card mt12" style="padding:16px">
      <div class="row" style="gap:12px;align-items:center">
        <div class="avatar av-40" style="background:var(--primary-soft);color:var(--primary-deep);font-size:22px">🎯</div>
        <div style="flex:1">
          <b style="font-size:15px;color:var(--ink)">Set your learning goals</b>
          <div class="tiny" style="color:var(--ink-2)">Weekly targets to keep you on track</div>
        </div>
        <button class="btn btn-primary btn-sm" id="addGoal">Set goals</button>
      </div>
    </div>`;
  }
  
  return `<div class="card mt12" style="padding:16px">
    <div class="row-between" style="margin-bottom:12px">
      <div class="row" style="gap:10px;align-items:center">
        <div class="avatar av-40" style="background:var(--primary-soft);color:var(--primary-deep);font-size:22px">🎯</div>
        <div>
          <b style="font-size:15px;color:var(--ink)">This week's goals</b>
          <div class="tiny" style="color:var(--ink-2)">${activeGoals} active · ${completionRate}% success rate</div>
        </div>
      </div>
      <button class="btn btn-soft btn-xs" id="addGoal">+ Add</button>
    </div>
    <div class="stack" style="gap:10px">
      ${goalsRes.goals.map((g) => {
        const percent = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
        const isComplete = g.completed;
        const typeLabels = {
          'weekly_lessons': 'Complete lessons',
          'weekly_practices': 'Practice exercises', 
          'weekly_reviews': 'Review sessions',
          'daily_minutes': 'Learning minutes',
          'challenges_passed': 'Pass challenges'
        };
        return `<div style="padding:10px 12px;background:var(--surface-2);border-radius:var(--r-sm)">
          <div class="row-between" style="margin-bottom:6px">
            <span style="font-size:13px;font-weight:650;color:var(--ink-2)">${typeLabels[g.goalType] || g.goalType}</span>
            <div class="row" style="gap:4px;align-items:center">
              <span class="tiny num" style="font-weight:800;color:${isComplete ? 'var(--ok-deep)' : 'var(--ink-2)'}">
                ${g.currentValue}/${g.targetValue}
              </span>
              ${isComplete ? '<span style="font-size:14px">✓</span>' : `<button class="btn btn-ghost" style="padding:2px 6px;font-size:10px;min-height:unset" data-delete-goal="${g.id}">✕</button>`}
            </div>
          </div>
          <div class="bar" style="height:4px"><i style="width:${percent}%;background:${isComplete ? 'var(--ok-deep)' : 'var(--primary)'}"></i></div>
        </div>`;
      }).join('')}
    </div>
    ${currentGoalStreak > 0 ? `<div class="tiny center mt8" style="color:var(--muted)">🔥 ${currentGoalStreak}-week goal streak</div>` : ''}
  </div>`;
}

function badgesCard(badgesRes) {
  const { badges, progress, next } = badgesRes;
  const recentBadges = badges.slice(0, 6);
  
  if (badges.length === 0) {
    return `<div class="card mt12" style="padding:16px">
      <div class="row" style="gap:12px;align-items:center">
        <div class="avatar av-40" style="background:linear-gradient(135deg, #8B5CF6, #A855F7);font-size:22px">🏅</div>
        <div style="flex:1">
          <b style="font-size:15px;color:var(--ink)">Earn your first badge</b>
          <div class="tiny" style="color:var(--ink-2)">Complete lessons and hit milestones to unlock achievements</div>
        </div>
      </div>
    </div>`;
  }
  
  return `<div class="card mt12" style="padding:16px;background:linear-gradient(135deg, #FDFBFF 0%, #F9F6FF 100%);border:1px solid #E8E0FF">
    <div class="row-between" style="margin-bottom:14px">
      <div class="row" style="gap:10px;align-items:center">
        <div class="avatar av-40" style="background:linear-gradient(135deg, #8B5CF6, #A855F7);font-size:22px">🏅</div>
        <div>
          <b style="font-size:15px;color:var(--ink)">Mastery badges</b>
          <div class="tiny" style="color:var(--ink-2)">${progress.earned} of ${progress.total} unlocked · ${progress.percentage}%</div>
        </div>
      </div>
    </div>
    
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
      ${recentBadges.map(b => `
        <div class="avatar av-48" style="background:var(--surface);border:2px solid var(--primary);box-shadow:0 4px 12px rgba(139,92,246,.2);font-size:26px" title="${esc(b.definition.name)}: ${esc(b.definition.description)}">${b.definition.emoji}</div>
      `).join('')}
      ${badges.length > 6 ? `<div class="avatar av-48" style="background:var(--surface-2);color:var(--ink-2);border:1px solid var(--line-2);font-size:15px;font-weight:800">+${badges.length - 6}</div>` : ''}
    </div>
    
    ${next.length > 0 ? `
      <div class="divider" style="margin:10px 0"></div>
      <div class="tiny" style="color:var(--muted);margin-bottom:8px;font-weight:700;letter-spacing:.05em">NEXT TO UNLOCK</div>
      <div class="stack" style="gap:8px">
        ${next.slice(0, 3).map(b => `
          <div style="padding:8px 10px;background:var(--surface);border-radius:var(--r-sm);border:1px solid var(--line)">
            <div class="row" style="gap:8px;align-items:center">
              <span style="font-size:18px">${b.emoji}</span>
              <div style="flex:1">
                <div style="font-size:12px;font-weight:700;color:var(--ink-2)">${esc(b.name)}</div>
                <div class="tiny" style="color:var(--muted)">${b.progress}/${b.target} · ${b.percentage}%</div>
              </div>
              <div class="bar" style="width:60px;height:4px"><i style="width:${b.percentage}%;background:var(--primary)"></i></div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
  </div>`;
}

function walletCard(w) {
  const modeLabel = w.mode === 'nimiqpay' ? 'Nimiq Pay' : w.mode === 'hub' ? 'Nimiq Hub' : w.mode === 'demo' ? 'Demo wallet' : 'No wallet';
  const modeIcon = w.mode === 'nimiqpay' ? '⚡' : w.mode === 'hub' ? '🔗' : w.mode === 'demo' ? '🧪' : ico.wallet;
  const modeColor = w.mode === 'hub' || w.mode === 'nimiqpay' ? 'var(--primary-deep)' : w.mode === 'demo' ? 'var(--nim-deep)' : 'var(--muted)';
  const isRealWallet = w.mode === 'nimiqpay' || w.mode === 'hub';

  return `<div class="card mt12" style="padding:16px">
    <div class="row-between" style="margin-bottom:${isRealWallet && w.address ? '12px' : '0'}">
      <div class="row" style="gap:10px">
        <div class="avatar av-40" style="background:var(--nim-soft)">${typeof modeIcon === 'string' ? modeIcon : modeIcon.replace('<svg', '<svg width="19" height="19" style="color:var(--nim-deep)"')}</div>
        <div><b style="font-size:14px;color:${modeColor}">${esc(modeLabel)}</b>
          <div class="tiny">${isRealWallet ? 'Real wallet' : w.address ? 'Demo address' : 'Not connected'} · ${esc(w.network)}</div></div>
      </div>
      ${w.mode ? `<button class="btn btn-soft btn-sm" id="payout">Withdraw</button>` : `<button class="btn btn-nim btn-sm" id="connect">Connect</button>`}
    </div>
    ${isRealWallet && w.address ? `
      <div style="padding:10px 12px;background:var(--surface-2);border-radius:var(--r-sm);border:1px solid var(--line)">
        <div class="tiny" style="color:var(--muted);margin-bottom:4px;font-weight:700;letter-spacing:.05em">YOUR NIMIQ ADDRESS</div>
        <div style="font-family:monospace;font-size:12px;color:var(--primary-deep);word-break:break-all;line-height:1.4">${esc(w.address)}</div>
        <button class="btn btn-ghost btn-xs mt8" onclick="navigator.clipboard.writeText('${esc(w.address)}').then(() => toast('Address copied ✅', 'ok'))">Copy address</button>
      </div>
    ` : ''}
    ${w.txs.length ? `<div class="divider"></div><span class="eyebrow">RECENT ACTIVITY</span>
      ${w.txs.slice(0, 4).map((t) => `<div class="row-between mt8"><span style="font-size:12.5px;color:var(--ink-2);font-weight:600">${esc(t.note || t.kind)}</span>
        <span class="num tiny" style="font-weight:800;color:${t.direction === 'credit' ? 'var(--ok-deep)' : 'var(--bad)'}">${t.direction === 'credit' ? '+' : '−'}${fmtNim(t.amountNim, 2)} NIM</span></div>`).join('')}` : ''}
  </div>`;
}

/* ── skill tree ── */
async function renderTree(root, u) {
  const mySkills = app.skills || [];
  const NODES = [
    ['web-development', '💻', 22, 18], ['python', '🐍', 55, 12], ['data-analysis', '📊', 82, 22],
    ['ui-design', '🎨', 30, 44], ['writing', '✍️', 66, 40], ['ai', '🤖', 86, 52],
    ['marketing', '📈', 24, 72], ['business', '💼', 56, 78], ['social-media', '📱', 82, 84],
    ['languages', '🗣️', 12, 56], ['music-production', '🎵', 88, 30], ['practical-skills', '🔧', 44, 92],
    ['nimiq-blockchain', '⛓️', 58, 60],
  ];
  const wrap = root.querySelector('#treeWrap');
  wrap.innerHTML = `
    <svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      ${[['web-development', 'ui-design'], ['web-development', 'python'], ['python', 'data-analysis'], ['ui-design', 'writing'], ['writing', 'ai'], ['python', 'ai'], ['ui-design', 'marketing'], ['marketing', 'business'], ['business', 'social-media'], ['languages', 'ui-design'], ['data-analysis', 'ai'], ['business', 'nimiq-blockchain'], ['ai', 'nimiq-blockchain']]
        .map(([a, b]) => {
          const A = NODES.find((n) => n[0] === a), B = NODES.find((n) => n[0] === b);
          return `<line x1="${A[2]}" y1="${A[3]}" x2="${B[2]}" y2="${B[3]}" stroke="#DCDAEE" stroke-width="0.7" stroke-dasharray="2 2"/>`;
        }).join('')}
    </svg>
    ${NODES.map(([slug, emoji, x, y]) => {
      const s = mySkills.find((x2) => x2.skillSlug === slug);
      const cls = s?.verified ? 'verified' : s ? 'active' : '';
      return `<div class="tree-node ${cls}" data-node="${slug}" style="left:${x}%;top:${y}%">
        <div class="tree-dot" title="${slug}">${emoji}</div>
        <small>${s ? s.score + '%' : ''}</small>
      </div>`;
    }).join('')}`;
  $$('.tree-node', wrap).forEach((n) => n.addEventListener('click', () => {
    toast(`${n.querySelector('.tree-dot').textContent} ${n.dataset.node.replace(/-/g, ' ')} — details below ↓`, '', 1800);
    root.querySelector('#skillsZone')?.scrollIntoView({ behavior: 'smooth' });
  }));
}

/* ── verified + learning skills ── */
async function renderSkills(root, u) {
  const zone = root.querySelector('#skillsZone');
  const skills = app.skills || [];
  const verified = skills.filter((s) => s.verified);
  const learning = skills.filter((s) => !s.verified && s.score > 0);
  const proofsRes = await api.get('/api/me/attempts');

  zone.innerHTML = `<div class="section">
    <div class="section-head"><span class="eyebrow">✓ VERIFIED SKILLS (${verified.length})</span></div>
    ${verified.length ? `<div class="stack">${verified.map((s) => `
      <div class="card" style="padding:16px 18px;background:linear-gradient(120deg,rgba(18,183,106,.05),rgba(18,183,106,.02));border-color:#BDEBD4">
        <div class="row-between" style="margin-bottom:10px">
          <div style="flex:1;min-width:0">
            <div class="row" style="gap:8px;align-items:center;margin-bottom:4px">
              <span style="font-size:20px;line-height:1">✓</span>
              <b style="font-size:15px;text-transform:capitalize;color:var(--ok-deep)">${esc(s.skillSlug.replace(/-/g, ' '))}</b>
            </div>
            <div class="tiny" style="color:var(--ink-2)">${s.tier} · ${s.proofs} ${s.proofs === 1 ? 'proof' : 'proofs'} passed</div>
          </div>
          <div class="row" style="gap:8px;align-items:center">
            <div style="text-align:center">
              <b class="num" style="font-size:22px;color:var(--ok-deep);display:block">${s.score}%</b>
              <span class="tiny" style="color:var(--ok);font-weight:800;font-size:10px">VERIFIED</span>
            </div>
            <button class="btn btn-soft btn-sm" data-share="${esc(s.skillSlug)}" title="Share this skill">${ico.share.replace('<svg', '<svg width="14" height="14"')}</button>
          </div>
        </div>
        <div class="bar bar-ok" style="height:6px"><i style="width:${s.score}%"></i></div>
      </div>`).join('')}</div>`
      : `<div class="card"><div class="empty"><span class="big">🎯</span><b style="font-size:14px;display:block;margin-top:8px">No verified skills yet</b><span class="sub">Pass a proof checkpoint to earn your first verified skill.</span><a href="#/prove" class="btn btn-primary mt12" style="display:inline-flex">Start a Proof</a></div></div>`}
    ${learning.length ? `<div class="mt16"><div class="section-head"><span class="eyebrow">IN PROGRESS</span></div>
      <div class="stack">${learning.map((s) => `
        <div class="card" style="padding:12px 16px"><div class="row-between">
          <b style="font-size:13.5px;text-transform:capitalize">${esc(s.skillSlug.replace(/-/g, ' '))}</b>
          <span class="tiny num">${s.score}% · ${s.tier}</span></div>
        <div class="bar mt8"><i style="width:${s.score}%"></i></div></div>`).join('')}</div></div>` : ''}

    <div class="section"><div class="section-head"><span class="eyebrow">📜 RECENT PROOFS</span></div>
      <div class="stack">${proofsRes.attempts.slice(0, 8).map((a) => `
        <div class="card card-click" data-att="${a.id}" style="padding:12px 16px">
          <div class="row-between"><span style="font-size:13px;font-weight:650">${esc(a.challenge?.title || 'Proof')}</span>
            <span class="chip ${a.status === 'passed' ? 'chip-ok' : 'chip-bad'}" style="padding:3px 9px;font-size:11px">${a.score}/100</span></div>
        </div>`).join('') || '<div class="card"><div class="empty" style="padding:16px">No proofs yet.</div></div>'}</div></div>
  </div>`;

  $$('[data-att]', zone).forEach((n) => n.addEventListener('click', () => { location.hash = `#/prove/attempt/${n.dataset.att}`; }));
  $$('[data-share]', zone).forEach((n) => n.addEventListener('click', () => shareBestProof(n.dataset.share)));
}

async function shareBestProof(skillSlug) {
  const { proofs } = await api.get(`/api/me/proofs?skill=${encodeURIComponent(skillSlug)}`);
  const best = proofs.filter((p) => p.passed).sort((a, b) => b.score - a.score)[0];
  if (!best) return toast('Pass a proof in this skill to share it.', 'bad');
  const proofId = best.publicId;
  const url = `${location.origin}/p/${proofId}`;
  const s = sheet(`
    <h2 class="h1">Share your proof</h2>
    <p class="sub mt8">A portable, verifiable page — clients can trust it because it's earned, not claimed.</p>
    <img src="/share/${esc(proofId)}.svg" alt="PROOF skill card" style="width:100%;border-radius:18px;margin-top:12px;box-shadow:var(--shadow-1)"/>
    <div class="row mt12" style="gap:8px">
      <button class="btn btn-primary" id="copyLink" style="flex:1">Copy link</button>
      <a class="btn btn-soft" href="/share/${esc(proofId)}.svg" download="proof-${esc(skillSlug)}.svg">Save card</a>
    </div>
    <p class="tiny center mt8">${esc(url)}</p>`);
  s.el.querySelector('#copyLink').addEventListener('click', async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'My verified skill on PROOF', url });
      else { await navigator.clipboard.writeText(url); toast('Link copied ✅', 'ok'); }
    } catch { /* dismissed */ }
  });
}

async function getProofPublicId(attemptId, skillSlug) {
  const { proofs } = await api.get(`/api/me/proofs${skillSlug ? `?skill=${encodeURIComponent(skillSlug)}` : ''}`);
  const match = proofs.find((p) => p.attemptId === attemptId) || proofs[0];
  return match?.publicId || null;
}

/* ── achievements ── */
async function renderAchievements(zone, achRes) {
  zone.innerHTML = `<div class="section"><div class="section-head"><span class="eyebrow">🏅 ACHIEVEMENTS</span></div>
    <div class="grid3">${achRes.achievements.map((a) => `
      <div class="stat" style="${a.unlocked ? '' : 'opacity:.4;filter:grayscale(1)'}">
        <div style="font-size:20px">${a.emoji}</div>
        <b style="font-size:12px;margin-top:2px">${esc(a.name)}</b>
        <span style="text-transform:none;letter-spacing:0;font-size:10px">${a.unlocked ? 'unlocked' : esc(a.desc)}</span>
      </div>`).join('')}</div></div>`;
}

function renderTxs(zone, w) {
  zone.innerHTML = `<div class="section"><div class="section-head"><span class="eyebrow">💳 TRANSACTIONS</span><span class="tiny">${esc(w.network)}</span></div>
    ${w.txs.length ? `<div class="stack">${w.txs.map((t) => `
      <div class="card" style="padding:12px 16px">
        <div class="row-between">
          <div><b style="font-size:13px">${esc(t.note || t.kind)}</b>
            <div class="tiny">${new Date(t.createdAt).toLocaleString()} · ${esc(t.status)} · ${esc(t.network)}</div></div>
          <span class="num" style="font-weight:800;color:${t.direction === 'credit' ? 'var(--ok-deep)' : 'var(--bad)'}">${t.direction === 'credit' ? '+' : '−'}${fmtNim(t.amountNim, 2)}</span>
        </div></div>`).join('')}</div>` : '<div class="card"><div class="empty" style="padding:16px">No transactions yet.</div></div>'}</div>`;
}

function editUsername(root) {
  const s = sheet(`<h2 class="h1">Your proofer name</h2>
    <input id="un" class="input mt16" maxlength="24" value="${esc(app.me.username)}"/>
    <button class="btn btn-primary btn-block mt8" id="save">Save</button>`);
  s.el.querySelector('#save').addEventListener('click', async () => {
    try {
      await api.patch('/api/me', { username: s.el.querySelector('#un').value });
      s.close(); toast('Updated ✅', 'ok'); screen(root);
    } catch (e) { toast(esc(e.message), 'bad'); }
  });
}

function payoutSheet(root) {
  const s = sheet(`<h2 class="h1">Withdraw to wallet</h2>
    <p class="sub mt8">Balance: <b>${fmtNim(app.me.balanceNim, 2)} NIM</b> · minimum 1 NIM.
    ${WalletService.isDemo ? 'Demo mode: settles to the in-app ledger (labeled). Connect Nimiq Pay for on-chain settlement.' : 'Settles to your Nimiq Pay address.'}</p>
    <input id="amt" class="input mt16" type="number" min="1" step="0.5" value="${Math.max(1, Math.floor(app.me.balanceNim))}"/>
    <button class="btn btn-nim btn-block mt8" id="go">Request payout</button>`);
  s.el.querySelector('#go').addEventListener('click', async () => {
    try {
      await api.post('/api/wallet/payout', { amountNim: Number(s.el.querySelector('#amt').value) });
      s.close(); toast('Payout recorded — see Transactions ✅', 'ok');
      refreshMe(); screen(root);
    } catch (e) { toast(esc(e.message), 'bad'); }
  });
}

function addGoalSheet(root) {
  const s = sheet(`<h2 class="h1">Set a learning goal</h2>
    <p class="sub mt8">Choose a weekly target to stay consistent</p>
    
    <label class="label mt16">Goal type</label>
    <select class="input" id="goalType">
      <option value="weekly_lessons">Complete lessons (weekly)</option>
      <option value="weekly_practices">Practice exercises (weekly)</option>
      <option value="weekly_reviews">Review sessions (weekly)</option>
      <option value="daily_minutes">Learning minutes (daily)</option>
      <option value="challenges_passed">Pass challenges (weekly)</option>
    </select>
    
    <label class="label mt12">Target</label>
    <input id="target" class="input" type="number" min="1" max="50" value="5"/>
    
    <button class="btn btn-primary btn-block mt16" id="create">Create goal</button>`);
  
  s.el.querySelector('#create').addEventListener('click', async () => {
    try {
      const goalType = s.el.querySelector('#goalType').value;
      const target = parseInt(s.el.querySelector('#target').value, 10);
      const period = goalType.startsWith('daily_') ? 'daily' : 'weekly';
      
      await api.post('/api/goals', { goalType, targetValue: target, period });
      s.close();
      toast('Goal created ✅', 'ok');
      screen(root);
    } catch (e) {
      toast(esc(e.message), 'bad');
    }
  });
}

let treeSkillsCache = null;
