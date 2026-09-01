/**
 * Socratic Tutor Service
 * Implements grilling-based learning inspired by mattpocock/skills
 * 
 * Philosophy: Ask probing questions before, during, and after lessons
 * to ensure deep understanding rather than passive consumption.
 */

import { uid, now } from '../util.js';

let _store = null;
export const setStore = (s) => { _store = s; };
const store = () => {
  if (!_store) throw new Error('Store not initialized - call setStore() first');
  return _store;
};

/**
 * Session types for different learning scenarios
 */
const SESSION_TYPES = {
  PRE_LESSON: 'pre_lesson',     // Before starting a lesson
  CHECKPOINT: 'checkpoint',      // During a lesson
  REFLECTION: 'reflection',      // After completing a lesson
  WAIT_WHAT: 'wait_what',       // When learner is confused
  DEEP_DIVE: 'deep_dive'        // Wants to go deeper
};

/**
 * Start a Socratic learning session
 */
export async function startGrillingSession(userId, {
  type,
  topicSlug,
  topicTitle,
  context = {}
}) {
  const sessionId = uid('soc');
  
  const session = {
    id: sessionId,
    userId,
    type,
    topicSlug,
    topicTitle,
    context,
    questions: generateQuestions(type, topicSlug, context),
    responses: [],
    insights: [],
    status: 'active',
    currentQuestionIndex: 0,
    startedAt: now(),
    completedAt: null
  };
  
  store().insert('socratic_sessions', session);
  store().save();
  
  return {
    sessionId: session.id,
    firstQuestion: session.questions[0]
  };
}

/**
 * Generate contextual questions based on session type
 */
function generateQuestions(type, topicSlug, context) {
  const questionSets = {
    pre_lesson: [
      {
        id: 'q1',
        text: 'What specific problem are you hoping to solve by learning this?',
        purpose: 'ground_motivation',
        followUp: true
      },
      {
        id: 'q2',
        text: 'Have you tried to solve this problem before? What happened?',
        purpose: 'surface_context',
        followUp: true
      },
      {
        id: 'q3',
        text: 'What do you already know about this topic?',
        purpose: 'assess_baseline',
        followUp: false
      },
      {
        id: 'q4',
        text: 'How will you know when you truly understand this?',
        purpose: 'define_success',
        followUp: false
      }
    ],
    
    checkpoint: [
      {
        id: 'c1',
        text: 'In your own words, what does this concept mean?',
        purpose: 'verify_understanding',
        followUp: true
      },
      {
        id: 'c2',
        text: 'What confuses you most about what we just covered?',
        purpose: 'surface_confusion',
        followUp: true
      },
      {
        id: 'c3',
        text: 'How would you explain this to a friend?',
        purpose: 'test_explanation',
        followUp: false
      }
    ],
    
    reflection: [
      {
        id: 'r1',
        text: 'What clicked for you in this lesson?',
        purpose: 'identify_insights',
        followUp: false
      },
      {
        id: 'r2',
        text: 'What\'s still fuzzy or unclear?',
        purpose: 'surface_gaps',
        followUp: true
      },
      {
        id: 'r3',
        text: 'Where will you use this in the next project you build?',
        purpose: 'connect_reality',
        followUp: true
      },
      {
        id: 'r4',
        text: 'If you had to teach this to someone tomorrow, what would you say?',
        purpose: 'solidify_learning',
        followUp: false
      }
    ],
    
    wait_what: [
      {
        id: 'w1',
        text: 'What exactly is confusing you? Point to the specific part.',
        purpose: 'pinpoint_confusion',
        followUp: true
      },
      {
        id: 'w2',
        text: 'What do you think it means? (Your best guess helps me explain better)',
        purpose: 'surface_assumptions',
        followUp: false
      }
    ],
    
    deep_dive: [
      {
        id: 'd1',
        text: 'What specifically do you want to understand more deeply?',
        purpose: 'focus_dive',
        followUp: true
      },
      {
        id: 'd2',
        text: 'Why does this topic interest you?',
        purpose: 'understand_motivation',
        followUp: false
      }
    ]
  };
  
  return questionSets[type] || questionSets.pre_lesson;
}

/**
 * Record response to a question
 */
export async function recordResponse(sessionId, response) {
  const session = store().get('socratic_sessions', sessionId);
  if (!session) throw new Error('Session not found');
  
  const currentQuestion = session.questions[session.currentQuestionIndex];
  
  // Analyze response quality
  const analysis = analyzeResponse(response, currentQuestion);
  
  session.responses.push({
    questionId: currentQuestion.id,
    questionText: currentQuestion.text,
    response,
    analysis,
    timestamp: now()
  });
  
  // Extract insights from good responses
  if (analysis.quality === 'deep') {
    session.insights.push({
      text: response,
      context: currentQuestion.purpose,
      timestamp: now()
    });
  }
  
  // Move to next question or complete
  session.currentQuestionIndex++;
  
  if (session.currentQuestionIndex >= session.questions.length) {
    session.status = 'completed';
    session.completedAt = now();
  }
  
  store().update('socratic_sessions', sessionId, {
    responses: session.responses,
    insights: session.insights,
    currentQuestionIndex: session.currentQuestionIndex,
    status: session.status,
    completedAt: session.completedAt
  });
  
  store().save();
  
  // Return next question or completion summary
  if (session.status === 'completed') {
    return {
      complete: true,
      insights: session.insights,
      summary: generateSessionSummary(session)
    };
  }
  
  const nextQuestion = session.questions[session.currentQuestionIndex];
  
  // Generate follow-up if needed
  if (currentQuestion.followUp && analysis.needsFollowUp) {
    return {
      complete: false,
      followUp: generateFollowUpQuestion(currentQuestion, response, analysis),
      nextQuestion
    };
  }
  
  return {
    complete: false,
    nextQuestion
  };
}

/**
 * Analyze response quality
 */
function analyzeResponse(response, question) {
  const wordCount = response.trim().split(/\s+/).length;
  const hasExample = /for example|like when|such as/i.test(response);
  const hasQuestions = /\?/.test(response);
  
  let quality = 'shallow';
  let needsFollowUp = false;
  
  // Deep response: longer, has examples, shows thinking
  if (wordCount > 20 && hasExample) {
    quality = 'deep';
  }
  // Medium response: decent length, some thought
  else if (wordCount > 10) {
    quality = 'medium';
    needsFollowUp = question.purpose === 'surface_confusion' || question.purpose === 'surface_gaps';
  }
  // Shallow response: too short or unclear
  else {
    quality = 'shallow';
    needsFollowUp = true;
  }
  
  return {
    quality,
    wordCount,
    hasExample,
    hasQuestions,
    needsFollowUp
  };
}

/**
 * Generate dynamic follow-up based on response
 */
function generateFollowUpQuestion(originalQuestion, response, analysis) {
  const followUps = {
    'shallow': `I'd love to hear more. Can you give me a specific example or expand on "${response.slice(0, 30)}..."?`,
    'medium': `Interesting! Can you give me a concrete example of when you've seen this?`,
    'surface_confusion': `What specifically about "${response.slice(0, 30)}..." is confusing? Let's break it down.`,
    'surface_gaps': `Tell me more about what feels fuzzy there. What part loses you?`
  };
  
  if (analysis.quality === 'shallow') {
    return followUps.shallow;
  }
  
  if (originalQuestion.purpose === 'surface_confusion' || originalQuestion.purpose === 'surface_gaps') {
    return followUps[originalQuestion.purpose];
  }
  
  return followUps.medium;
}

/**
 * Generate session summary
 */
function generateSessionSummary(session) {
  return {
    type: session.type,
    topic: session.topicTitle,
    questionsAnswered: session.responses.length,
    deepResponses: session.responses.filter(r => r.analysis.quality === 'deep').length,
    keyInsights: session.insights,
    duration: session.completedAt - session.startedAt,
    readinessScore: calculateReadinessScore(session)
  };
}

/**
 * Calculate how ready the learner is based on session
 */
function calculateReadinessScore(session) {
  const deepCount = session.responses.filter(r => r.analysis.quality === 'deep').length;
  const totalResponses = session.responses.length;
  const insightCount = session.insights.length;
  
  // Score out of 100
  const deepnessScore = (deepCount / totalResponses) * 60;
  const insightScore = Math.min(insightCount * 10, 40);
  
  return Math.round(deepnessScore + insightScore);
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(userId, limit = 10) {
  return store().filter('socratic_sessions', (s) => s.userId === userId)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, limit);
}

/**
 * Get session insights (for showing learner their "aha" moments)
 */
export async function getSessionInsights(sessionId) {
  const session = store().get('socratic_sessions', sessionId);
  if (!session) throw new Error('Session not found');
  
  return {
    insights: session.insights,
    summary: generateSessionSummary(session),
    recommendations: generateRecommendations(session)
  };
}

/**
 * Generate personalized recommendations based on session
 */
function generateRecommendations(session) {
  const recommendations = [];
  
  // Check if they need more practice
  const readiness = calculateReadinessScore(session);
  if (readiness < 60) {
    recommendations.push({
      type: 'practice',
      message: 'Your responses suggest you might benefit from hands-on practice before moving forward.',
      action: 'Try the practice exercises first'
    });
  }
  
  // Check for persistent confusion
  const confusedResponses = session.responses.filter(r => 
    r.analysis.hasQuestions || r.response.toLowerCase().includes('confused')
  );
  
  if (confusedResponses.length > 1) {
    recommendations.push({
      type: 'clarity',
      message: 'You mentioned confusion a few times. Let\'s get crystal clear on the basics.',
      action: 'Review fundamentals first'
    });
  }
  
  // Check for deep engagement
  if (readiness >= 80) {
    recommendations.push({
      type: 'advance',
      message: 'You\'re showing strong understanding! You\'re ready for more advanced material.',
      action: 'Try the advanced challenges'
    });
  }
  
  return recommendations;
}

/**
 * Quick "Wait, what?" intervention
 */
export async function triggerWaitWhat(userId, { topicSlug, specificText }) {
  return await startGrillingSession(userId, {
    type: SESSION_TYPES.WAIT_WHAT,
    topicSlug,
    topicTitle: 'Clarification needed',
    context: { specificText }
  });
}

/**
 * Add term to user's glossary from session insights
 */
export async function addToGlossary(userId, { term, definition, level, source }) {
  const glossaryId = uid('gloss');
  
  const entry = {
    id: glossaryId,
    userId,
    term,
    definition,
    level, // beginner, intermediate, expert
    source, // sessionId or manual
    masteryScore: 0,
    reviewCount: 0,
    lastReviewedAt: null,
    createdAt: now()
  };
  
  store().insert('user_glossary', entry);
  store().save();
  
  return entry;
}

/**
 * Get user's progressive glossary
 */
export async function getGlossary(userId, options = {}) {
  const { level, limit = 50 } = options;
  
  let entries = store().filter('user_glossary', (g) => g.userId === userId);
  
  if (level) {
    entries = entries.filter(g => g.level === level);
  }
  
  return entries
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

/**
 * Delete a glossary term
 */
export async function deleteGlossaryTerm(userId, termId) {
  const term = store().get('user_glossary', termId);
  
  if (!term) {
    throw new Error('Glossary term not found');
  }
  
  if (term.userId !== userId) {
    throw new Error('Not authorized to delete this term');
  }
  
  store().delete('user_glossary', termId);
  store().save();
  
  return { deleted: true };
}

// Export session types for use in API
export { SESSION_TYPES };
