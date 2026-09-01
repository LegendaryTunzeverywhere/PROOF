/**
 * Socratic Session View
 * Question-driven learning sessions inspired by mattpocock/skills
 */

import { api } from '../api.js';
import { esc } from '../ui.js';

// Active session state
let activeSession = null;
let currentResponse = '';

/**
 * Main Socratic view - shows active session or session list
 */
export async function socratic(screen) {
  if (activeSession) {
    screen.innerHTML = renderActiveSession();
    return;
  }
  
  // Show recent sessions list
  const { sessions } = await api('GET', '/api/socratic/sessions?limit=10');
  
  screen.innerHTML = `
    <div class="container socratic-hub">
      <header class="hub-header">
        <h1>🎯 Grilling Sessions</h1>
        <p class="subtitle">Deep learning through powerful questions</p>
      </header>
      
      ${sessions.length === 0 ? renderEmptyState() : renderSessionsList(sessions)}
    </div>
  `;
}

/**
 * Empty state when no sessions exist
 */
function renderEmptyState() {
  return `
    <div class="empty-state">
      <div class="empty-icon">💭</div>
      <h2>No grilling sessions yet</h2>
      <p>
        Socratic sessions help you learn deeply by asking probing questions
        before, during, and after lessons. They ensure real understanding,
        not passive consumption.
      </p>
      <p class="hint">
        Start a lesson to begin your first grilling session!
      </p>
    </div>
  `;
}

/**
 * List of past sessions
 */
function renderSessionsList(sessions) {
  return `
    <div class="sessions-list">
      <h2>Recent Sessions</h2>
      ${sessions.map(s => renderSessionCard(s)).join('')}
    </div>
  `;
}

/**
 * Individual session card
 */
function renderSessionCard(session) {
  const typeLabels = {
    pre_lesson: '📚 Pre-Lesson',
    checkpoint: '🎯 Checkpoint',
    reflection: '🤔 Reflection',
    wait_what: '❓ Wait, What?',
    deep_dive: '🔬 Deep Dive'
  };
  
  const statusColors = {
    active: 'var(--primary)',
    completed: 'var(--good)',
    abandoned: 'var(--neutral)'
  };
  
  const duration = session.completedAt 
    ? formatDuration(session.completedAt - session.startedAt)
    : 'In progress';
  
  return `
    <div class="session-card" onclick="showSessionInsights('${session.id}')">
      <div class="session-header">
        <span class="session-type">${typeLabels[session.type]}</span>
        <span class="session-status" style="color: ${statusColors[session.status]}">
          ${session.status}
        </span>
      </div>
      <h3>${esc(session.topicTitle)}</h3>
      <div class="session-meta">
        <span>📝 ${session.responses?.length || 0} responses</span>
        <span>⏱️ ${duration}</span>
        <span>📅 ${formatRelativeTime(session.startedAt)}</span>
      </div>
    </div>
  `;
}

/**
 * Active session UI - shows current question and response input
 */
function renderActiveSession() {
  const { currentQuestion, currentQuestionIndex, questions } = activeSession;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  return `
    <div class="container socratic-session">
      <div class="session-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <span class="progress-text">
          Question ${currentQuestionIndex + 1} of ${questions.length}
        </span>
      </div>
      
      <div class="question-card">
        <div class="question-icon">💡</div>
        <h2 class="question-text">${esc(currentQuestion.text)}</h2>
        <p class="question-hint">
          Take your time. The goal is deep thinking, not quick answers.
        </p>
      </div>
      
      <div class="response-area">
        <textarea 
          class="response-input"
          placeholder="Type your response here... Be specific and use examples."
          rows="6"
          oninput="window.socraticUpdateResponse(event.target.value)"
        >${esc(currentResponse)}</textarea>
        
        <div class="response-actions">
          <button 
            class="btn-secondary" 
            onclick="window.socraticSkipQuestion()">
            Skip for now
          </button>
          <button 
            class="btn-primary" 
            onclick="window.socraticSubmitResponse()"
            ${currentResponse.trim().length < 10 ? 'disabled' : ''}>
            Submit Response
          </button>
        </div>
        
        ${currentResponse.trim().length > 0 && currentResponse.trim().length < 10 
          ? `<p class="response-hint">Write at least 10 characters for a meaningful response</p>` 
          : ''}
      </div>
    </div>
  `;
}

/**
 * Session completion screen with insights
 */
function renderSessionComplete(insights) {
  const { summary, recommendations } = insights;
  const readinessColor = summary.readinessScore >= 80 ? 'var(--good)' 
    : summary.readinessScore >= 60 ? 'var(--primary)' 
    : 'var(--warning)';
  
  return `
    <div class="container session-complete">
      <div class="complete-header">
        <div class="complete-icon">🎉</div>
        <h1>Session Complete!</h1>
        <p>Here's what we learned about your understanding</p>
      </div>
      
      <div class="readiness-score">
        <div class="score-circle" style="border-color: ${readinessColor}">
          <span class="score-value" style="color: ${readinessColor}">
            ${summary.readinessScore}
          </span>
          <span class="score-label">Readiness</span>
        </div>
      </div>
      
      <div class="session-stats">
        <div class="stat">
          <span class="stat-value">${summary.questionsAnswered}</span>
          <span class="stat-label">Questions</span>
        </div>
        <div class="stat">
          <span class="stat-value">${summary.deepResponses}</span>
          <span class="stat-label">Deep Responses</span>
        </div>
        <div class="stat">
          <span class="stat-value">${summary.keyInsights.length}</span>
          <span class="stat-label">Insights</span>
        </div>
      </div>
      
      ${summary.keyInsights.length > 0 ? `
        <div class="insights-section">
          <h2>💡 Your Key Insights</h2>
          ${summary.keyInsights.map(insight => `
            <div class="insight-card">
              <p>${esc(insight.text)}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${recommendations.length > 0 ? `
        <div class="recommendations-section">
          <h2>📋 Recommendations</h2>
          ${recommendations.map(rec => renderRecommendation(rec)).join('')}
        </div>
      ` : ''}
      
      <div class="complete-actions">
        <button class="btn-primary" onclick="window.socraticFinish()">
          Continue Learning
        </button>
      </div>
    </div>
  `;
}

/**
 * Recommendation card
 */
function renderRecommendation(rec) {
  const icons = {
    practice: '🎯',
    clarity: '💡',
    advance: '🚀'
  };
  
  return `
    <div class="recommendation-card">
      <div class="rec-icon">${icons[rec.type]}</div>
      <div class="rec-content">
        <p class="rec-message">${esc(rec.message)}</p>
        <p class="rec-action">${esc(rec.action)}</p>
      </div>
    </div>
  `;
}

/**
 * Start a new Socratic session
 */
export async function startSocraticSession(type, topicSlug, topicTitle, context = {}) {
  try {
    const { session } = await api('POST', '/api/socratic/start', {
      type,
      topicSlug,
      topicTitle,
      context
    });
    
    activeSession = {
      sessionId: session.sessionId,
      currentQuestion: session.firstQuestion,
      currentQuestionIndex: 0,
      questions: [session.firstQuestion], // Will be populated as we go
      type,
      topicTitle
    };
    
    currentResponse = '';
    
    // Navigate to socratic view
    window.location.hash = '#/socratic';
    
  } catch (err) {
    console.error('Failed to start session:', err);
    alert('Failed to start grilling session. Please try again.');
  }
}

/**
 * Submit response to current question
 */
window.socraticSubmitResponse = async function() {
  if (!activeSession || currentResponse.trim().length < 10) return;
  
  try {
    const result = await api('POST', `/api/socratic/${activeSession.sessionId}/respond`, {
      response: currentResponse.trim()
    });
    
    const screen = document.querySelector('.screen');
    if (!screen) return;
    
    if (result.complete) {
      // Show completion screen
      screen.innerHTML = renderSessionComplete(result);
      activeSession = null;
      currentResponse = '';
    } else {
      // Move to next question
      if (result.followUp) {
        // Show follow-up prompt
        showFollowUpPrompt(result.followUp, result.nextQuestion);
      } else {
        activeSession.currentQuestion = result.nextQuestion;
        activeSession.currentQuestionIndex++;
        currentResponse = '';
        
        // Re-render
        screen.innerHTML = renderActiveSession();
      }
    }
    
  } catch (err) {
    console.error('Failed to submit response:', err);
    alert('Failed to submit response. Please try again.');
  }
};

/**
 * Update response text
 */
window.socraticUpdateResponse = function(value) {
  currentResponse = value;
  
  // Update submit button state
  const submitBtn = document.querySelector('.response-actions .btn-primary');
  if (submitBtn) {
    submitBtn.disabled = value.trim().length < 10;
  }
};

/**
 * Skip current question
 */
window.socraticSkipQuestion = async function() {
  if (!activeSession) return;
  
  // Submit empty response to move forward
  currentResponse = '[Skipped]';
  await window.socraticSubmitResponse();
};

/**
 * Show follow-up prompt
 */
function showFollowUpPrompt(followUpText, nextQuestion) {
  const screen = document.querySelector('.screen');
  if (!screen) return;
  
  screen.innerHTML = `
    <div class="container socratic-followup">
      <div class="followup-card">
        <div class="followup-icon">🤔</div>
        <h2>Let's dig a bit deeper...</h2>
        <p class="followup-text">${esc(followUpText)}</p>
        
        <div class="followup-actions">
          <button class="btn-secondary" onclick="window.socraticSkipFollowup()">
            Skip to next question
          </button>
          <button class="btn-primary" onclick="window.socraticAnswerFollowup()">
            Answer this
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Store next question for later
  activeSession.pendingNextQuestion = nextQuestion;
}

/**
 * Skip follow-up and go to next question
 */
window.socraticSkipFollowup = function() {
  if (!activeSession || !activeSession.pendingNextQuestion) return;
  
  const screen = document.querySelector('.screen');
  if (!screen) return;
  
  activeSession.currentQuestion = activeSession.pendingNextQuestion;
  activeSession.currentQuestionIndex++;
  currentResponse = '';
  delete activeSession.pendingNextQuestion;
  
  screen.innerHTML = renderActiveSession();
};

/**
 * Answer the follow-up
 */
window.socraticAnswerFollowup = function() {
  const screen = document.querySelector('.screen');
  if (!screen) return;
  
  // Just re-render the session with the same question
  screen.innerHTML = renderActiveSession();
};

/**
 * Finish session and return to main view
 */
window.socraticFinish = function() {
  activeSession = null;
  currentResponse = '';
  window.location.hash = '#/learn';
};

/**
 * Show session insights
 */
window.showSessionInsights = async function(sessionId) {
  try {
    const insights = await api('GET', `/api/socratic/${sessionId}/insights`);
    
    const screen = document.querySelector('.screen');
    if (screen) {
      screen.innerHTML = renderSessionComplete(insights);
    }
    
  } catch (err) {
    console.error('Failed to load insights:', err);
    alert('Failed to load session insights.');
  }
};

/**
 * Utility: Format duration in milliseconds to human readable
 */
function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'Less than a minute';
  if (minutes === 1) return '1 minute';
  if (minutes < 60) return `${minutes} minutes`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
}

/**
 * Utility: Format relative time
 */
function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}
