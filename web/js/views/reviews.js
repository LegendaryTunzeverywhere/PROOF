/**
 * Reviews — Spaced repetition review interface
 * Shows due reviews and allows users to rate their recall quality
 */
import { api } from '../api.js';
import { app } from '../state.js';
import { esc, $, $$, ico, toast, fmtNim } from '../ui.js';

/**
 * Reviews hub - shows due reviews and stats
 */
export async function hub(root) {
  const [reviewsRes, statsRes] = await Promise.all([
    api.get('/api/reviews/due'),
    api.get('/api/reviews/stats')
  ]);

  const { reviews, count } = reviewsRes;
  const { stats } = statsRes;

  root.innerHTML = `<div class="pad" style="padding-top:max(16px, env(safe-area-inset-top))">
    <div class="row-between" style="margin-bottom:16px">
      <h1 class="h1">Reviews</h1>
      <a href="#/learn" class="btn btn-ghost btn-sm">${ico.back} Learning</a>
    </div>

    ${statsCard(stats)}

    ${count > 0 ? `
      <div class="section">
        <div class="section-head">
          <span class="eyebrow">DUE TODAY (${count})</span>
          <span class="tiny">Keep your knowledge fresh</span>
        </div>
        <div class="stack">
          ${reviews.map(r => reviewListItem(r)).join('')}
        </div>
      </div>
    ` : `
      <div class="card mt16 card-hero" style="padding:28px 24px;text-align:center">
        <div style="font-size:40px;margin-bottom:10px">✨</div>
        <h2 class="h2" style="color:#fff;margin:0;font-size:20px">All caught up!</h2>
        <p class="sub mt10" style="color:rgba(255,255,255,.82);font-size:15px">
          No reviews due today. Check back tomorrow or complete more lessons to add reviews.
        </p>
        <a href="#/learn" class="btn btn-primary mt20">Continue learning</a>
      </div>
    `}

    ${stats.totalTopics > 0 ? `
      <div class="section">
        <div class="section-head">
          <span class="eyebrow">YOUR TOPICS</span>
        </div>
        <div class="grid3">
          <div class="stat">
            <b class="num" style="color:var(--ok-deep)">${stats.masteredTopics}</b>
            <span>Mastered</span>
          </div>
          <div class="stat">
            <b class="num" style="color:var(--primary)">${stats.totalTopics - stats.masteredTopics - stats.strugglingTopics}</b>
            <span>Learning</span>
          </div>
          <div class="stat">
            <b class="num" style="color:var(--warn)">${stats.strugglingTopics}</b>
            <span>Struggling</span>
          </div>
        </div>
      </div>
    ` : ''}
  </div>`;

  // Add event listeners for starting reviews
  $$('[data-review-id]', root).forEach((btn) => {
    btn.addEventListener('click', () => {
      const reviewId = btn.dataset.reviewId;
      location.hash = `#/reviews/${reviewId}`;
    });
  });
}

function statsCard(stats) {
  return `<div class="card" style="padding:16px">
    <div class="row" style="gap:12px;align-items:center">
      <div class="avatar av-48" style="background:var(--primary-grad);color:#fff;font-size:24px">📚</div>
      <div style="flex:1">
        <b style="font-size:16px;color:var(--ink)">Review statistics</b>
        <div class="tiny" style="color:var(--ink-2);margin-top:2px">
          ${stats.dueToday} due today · ${stats.upcoming7Days} next 7 days
        </div>
      </div>
      <div class="stat" style="background:var(--surface-2);padding:10px 12px;min-width:60px">
        <b class="num" style="font-size:20px;color:var(--primary)">${stats.totalReviews}</b>
        <span style="font-size:10px">total</span>
      </div>
    </div>
  </div>`;
}

function reviewListItem(review) {
  const daysOverdue = Math.floor((Date.now() - review.nextReviewAt) / 86400000);
  const overdueLabel = daysOverdue > 0 ? `${daysOverdue}d overdue` : 'Due today';
  
  return `<div class="card card-click" data-review-id="${review.id}" style="padding:14px 16px">
    <div class="row-between">
      <div style="flex:1">
        <b style="font-size:14px;display:block;margin-bottom:4px">${esc(review.topicTitle)}</b>
        <div class="row" style="gap:6px;flex-wrap:wrap">
          <span class="chip chip-xs" style="background:var(--primary-soft);color:var(--primary-deep)">${esc(review.skillSlug)}</span>
          <span class="tiny" style="color:var(--muted)">
            ${review.repetitions} reviews · EF ${review.easeFactor.toFixed(1)}
          </span>
        </div>
      </div>
      <div style="text-align:right">
        <span class="chip ${daysOverdue > 0 ? 'chip-warn' : 'chip-primary'}" style="padding:4px 10px;font-size:11px">
          ${overdueLabel}
        </span>
      </div>
    </div>
  </div>`;
}

/**
 * Review session screen - flashcard-style review
 */
export async function session(root, { id }) {
  try {
    const reviewsRes = await api.get('/api/reviews/due');
    const currentReview = reviewsRes.reviews.find(r => r.id === id);
    
    if (!currentReview) {
      root.innerHTML = `<div class="pad center" style="padding-top:max(80px, env(safe-area-inset-top))">
        <div class="card" style="max-width:400px;padding:32px;text-align:center">
          <div style="font-size:48px;margin-bottom:16px">❓</div>
          <h2 class="h2">Review not found</h2>
          <p class="sub mt8">This review may have been completed or removed.</p>
          <a href="#/reviews" class="btn btn-primary mt16">Back to reviews</a>
        </div>
      </div>`;
      return;
    }

    root.innerHTML = `<div class="pad" style="padding-top:max(16px, env(safe-area-inset-top))">
      <div class="row-between" style="margin-bottom:16px">
        <a href="#/reviews" class="btn btn-ghost btn-sm">${ico.back} Reviews</a>
        <span class="chip">${currentReview.repetitions} reviews · EF ${currentReview.easeFactor.toFixed(1)}</span>
      </div>

      <div class="card review-card" style="padding:24px;text-align:center;min-height:300px;display:flex;flex-direction:column;justify-content:center">
        <span class="chip chip-primary" style="margin:0 auto 16px">${esc(currentReview.skillSlug)}</span>
        <h1 class="h1" style="margin-bottom:16px">${esc(currentReview.topicTitle)}</h1>
        <p class="sub">How well do you remember this topic?</p>
        
        <div id="revealContent" class="mt16" style="display:none;text-align:left">
          ${currentReview.question ? `
            <div class="callout callout-ask">
              <b>Try to answer from memory first:</b>
              <div style="margin-top:8px;font-size:14.5px">${esc(currentReview.question.q)}</div>
              <div class="mt8 stack" style="gap:6px" id="reviewOpts">
                ${currentReview.question.choices.map((c, i) => `<button class="opt" data-ci="${i}" style="text-align:left">${'ABCD'[i]}. ${esc(c)}</button>`).join('')}
              </div>
              <div id="reviewVerdict" class="mt8"></div>
            </div>` : ''}
          ${currentReview.prompt ? `
            <div class="callout callout-ask mt12">
              <b>Say it in your own words:</b>
              <div style="margin-top:6px;font-size:14px;color:var(--ink-2)">${esc(currentReview.prompt)}</div>
              <textarea class="input mt8" rows="3" placeholder="Type or say your answer before rating yourself…"></textarea>
            </div>` : ''}
          <div class="tiny mt12" style="color:var(--muted)">Recall first, <i>then</i> rate how well you remembered. The struggle is the point — it is how memories strengthen.</div>
        </div>

        <button class="btn btn-primary btn-block mt20" id="revealBtn" style="max-width:300px;margin:20px auto 0">
          Show answer
        </button>
      </div>

      <div id="qualityButtons" style="display:none">
        <div class="section">
          <div class="section-head">
            <span class="eyebrow">RATE YOUR RECALL</span>
          </div>
          <div class="stack" style="gap:8px">
            ${qualityButton(5, 'Perfect', 'Instant recall, no hesitation', 'var(--ok-deep)')}
            ${qualityButton(4, 'Good', 'Correct after some thought', 'var(--ok)')}
            ${qualityButton(3, 'Fair', 'Difficult but eventually remembered', 'var(--primary)')}
            ${qualityButton(2, 'Hard', 'Struggled significantly', 'var(--warn)')}
            ${qualityButton(1, 'Wrong', 'Incorrect answer', 'var(--bad)')}
            ${qualityButton(0, 'Forgot', 'Complete blackout', 'var(--bad-deep)')}
          </div>
        </div>
      </div>
    </div>`;

    // Show answer button
    $('#revealBtn', root)?.addEventListener('click', () => {
      $('#revealContent', root).style.display = 'block';
      $('#revealBtn', root).style.display = 'none';
      $('#qualityButtons', root).style.display = 'block';

      // Active-recall mini quiz: reveal correct/wrong for the topic question
      const q = currentReview.question;
      $$('#reviewOpts .opt', root).forEach((b) => b.addEventListener('click', () => {
        const chosen = parseInt(b.dataset.ci, 10);
        const right = chosen === q.answerIdx;
        $$('#reviewOpts .opt', root).forEach((x) => (x.disabled = true));
        b.classList.add(right ? 'correct' : 'wrong');
        if (!right) $$('#reviewOpts .opt', root)[q.answerIdx]?.classList.add('correct');
        $('#reviewVerdict', root).innerHTML = `<div class="tiny mt8" style="color:${right ? 'var(--ok-deep)' : 'var(--bad)'}"><b>${right ? '✓ Correct' : '✗ Not quite'}</b>${q.why ? ' — ' + esc(q.why) : ''}</div>`;
      }));

      // Scroll to quality buttons
      setTimeout(() => {
        $('#qualityButtons', root)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    });

    // Quality rating buttons
    $$('[data-quality]', root).forEach((btn) => {
      btn.addEventListener('click', async () => {
        const quality = parseInt(btn.dataset.quality, 10);
        await submitReview(root, id, quality, reviewsRes.count);
      });
    });

  } catch (err) {
    toast(esc(err.message), 'bad');
    location.hash = '#/reviews';
  }
}

function qualityButton(quality, label, description, color) {
  return `<button class="card card-click quality-btn" data-quality="${quality}" style="padding:14px 16px;text-align:left;border:2px solid transparent;transition:all .2s">
    <div class="row" style="gap:12px;align-items:center">
      <div class="avatar av-40" style="background:${color};color:#fff;font-weight:800;font-size:18px">${quality}</div>
      <div style="flex:1">
        <b style="font-size:15px;display:block;margin-bottom:2px">${label}</b>
        <span class="tiny" style="color:var(--ink-2)">${description}</span>
      </div>
      <div style="color:${color};font-size:20px">→</div>
    </div>
  </button>`;
}

async function submitReview(root, reviewId, quality, remainingCount) {
  try {
    const result = await api.post(`/api/reviews/${reviewId}/complete`, { quality });
    
    // Show success message with next review info
    const nextReviewDays = result.review.interval;
    const nextDate = new Date(result.review.nextReviewAt).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });

    root.innerHTML = `<div class="pad center" style="padding-top:max(60px, env(safe-area-inset-top))">
      <div class="card" style="max-width:420px;padding:32px;text-align:center">
        <div style="font-size:56px;margin-bottom:16px">${quality >= 4 ? '✨' : quality >= 2 ? '💪' : '📖'}</div>
        <h2 class="h2">Review complete!</h2>
        <p class="sub mt8">
          Next review: <b>${nextDate}</b> (${nextReviewDays} day${nextReviewDays !== 1 ? 's' : ''})
        </p>
        
        <div class="stat mt16" style="background:var(--surface-2)">
          <b class="num">${result.review.repetitions}</b>
          <span>Total reviews</span>
        </div>

        ${remainingCount > 1 ? `
          <a href="#/reviews" class="btn btn-primary btn-block mt20">
            Continue reviews (${remainingCount - 1} left)
          </a>
        ` : `
          <div class="callout callout-ok mt16">
            <b>All done! ✅</b> You've completed all reviews for today.
          </div>
          <a href="#/learn" class="btn btn-primary btn-block mt16">Back to learning</a>
        `}
        <a href="#/reviews" class="btn btn-ghost btn-block mt8">View all reviews</a>
      </div>
    </div>`;

  } catch (err) {
    toast(esc(err.message), 'bad');
  }
}
