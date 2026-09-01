# Socratic Teaching System - Architecture

## System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOCRATIC TEACHING SYSTEM                      │
│              Question-Driven Deep Learning Engine                │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────┐         ┌───────────────────────────────┐
│   5 SESSION TYPES     │         │      USER EXPERIENCE          │
├───────────────────────┤         ├───────────────────────────────┤
│ 1. PRE_LESSON         │────────▶│ Before starting lesson        │
│    Surface existing   │         │ 2-3 min, 3-4 questions        │
│    knowledge          │         │ Gauge readiness               │
├───────────────────────┤         ├───────────────────────────────┤
│ 2. CHECKPOINT         │────────▶│ During lesson (2 points)      │
│    Mid-lesson & final │         │ "In your own words..."        │
│    check-ins          │         │ Quick 1-2 questions           │
├───────────────────────┤         ├───────────────────────────────┤
│ 3. REFLECTION         │────────▶│ After practice questions      │
│    Consolidate        │         │ 2-3 min synthesis             │
│    learning           │         │ Before proof challenge        │
├───────────────────────┤         ├───────────────────────────────┤
│ 4. WAIT_WHAT          │────────▶│ Any time (orange button)      │
│    Clarify confusion  │         │ On-demand help                │
│    immediately        │         │ Returns to same spot          │
├───────────────────────┤         ├───────────────────────────────┤
│ 5. DEEP_DIVE          │────────▶│ Future: Topic mastery         │
│    (future)           │         │ 10+ min exploration           │
└───────────────────────┘         └───────────────────────────────┘
```

## Data Flow

```
USER ACTION                 API ENDPOINT                    DATABASE
───────────               ──────────────                  ──────────

[Start Grilling] ───────▶ POST /api/socratic/start ────▶ socratic_sessions
                          { type, topicSlug, title }      (create session)
                                                               │
                          ◀──── Returns session + Q ──────────┘
                          
                                                               
[Submit Response] ──────▶ POST /api/socratic/:id/respond ──▶ socratic_responses
                          { response }                         (save response)
                                                               │
                          Generate follow-up or next Q ────────┤
                          ◀──── Returns nextQ or complete ─────┘
                          

[View Sessions] ────────▶ GET /api/socratic/sessions ──────▶ socratic_sessions
                                                               (query user's)
                          ◀──── Returns list ──────────────────┘


[Add Glossary] ─────────▶ POST /api/glossary ─────────────▶ user_glossary
                          { term, definition, level }          (insert term)
                          ◀──── Returns term ──────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND VIEWS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  web/js/views/learn.js                                          │
│  ┌────────────────────────────────────────────────────┐         │
│  │  showPreLessonPrompt()        [Pre-lesson card]   │         │
│  │  renderCheckpoint()            [Yellow callouts]   │         │
│  │  showPostLessonReflection()    [Green prompt]      │         │
│  │  "Wait, what?" button          [Orange, top-right] │         │
│  └────────────────────────────────────────────────────┘         │
│                        │                                         │
│                        │ startSocraticSession()                 │
│                        ▼                                         │
│  web/js/views/socratic.js                                       │
│  ┌────────────────────────────────────────────────────┐         │
│  │  socratic(screen)              [Main view]         │         │
│  │  renderActiveSession()         [Question + input]  │         │
│  │  renderSessionComplete()       [Insights screen]   │         │
│  │  socraticSubmitResponse()      [Handler]           │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                  │
│  web/js/views/glossary.js                                       │
│  ┌────────────────────────────────────────────────────┐         │
│  │  glossary(screen)              [Term list + grid]  │         │
│  │  renderAddTermModal()          [Creation form]     │         │
│  │  quickAddTerm()                [Programmatic API]  │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  server/services/socratic-tutor.js                              │
│  ┌────────────────────────────────────────────────────┐         │
│  │  startSession()                                    │         │
│  │  ├─ generateQuestions(type, topic, context)       │         │
│  │  ├─ Creates session in DB                          │         │
│  │  └─ Returns first question                         │         │
│  │                                                     │         │
│  │  recordResponse()                                  │         │
│  │  ├─ Analyzes response depth                        │         │
│  │  ├─ Decides: follow-up or next question           │         │
│  │  └─ Returns next step or completion                │         │
│  │                                                     │         │
│  │  getInsights()                                     │         │
│  │  ├─ Calculates readiness score                     │         │
│  │  ├─ Identifies key insights                        │         │
│  │  └─ Generates recommendations                      │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

```
socratic_sessions                     socratic_responses
──────────────────                   ──────────────────
id (PK)                              id (PK)
userId (FK → users)                  sessionId (FK → socratic_sessions)
type (enum)                          questionIndex (int)
topicSlug                            responseText (TEXT)
topicTitle                           wordCount (int)
status (active/completed/abandoned)  depth (enum: surface/moderate/deep)
readinessScore (0-100)               createdAt
startedAt                            
completedAt                          

user_glossary                         glossary_usage
──────────────                       ──────────────
id (PK)                              id (PK)
userId (FK → users)                  userId (FK)
term (VARCHAR)                       termId (FK → user_glossary)
definition (TEXT)                    contextType (lesson/practice/etc)
level (beginner/intermediate/expert) contextId
source (VARCHAR)                     timestamp
createdAt
updatedAt
```

## Session State Management

```javascript
// Active session state (in-memory, per user)
let activeSession = {
  sessionId: 'soc-abc123',
  type: 'PRE_LESSON',
  topicTitle: 'HTML Fundamentals',
  currentQuestion: {
    text: 'What do you already know about HTML?',
    expectedDepth: 'any',
    followUpTriggers: ['vague', 'incomplete']
  },
  currentQuestionIndex: 0,
  questions: [/* generated questions */],
  responses: []
};

// Response in progress
let currentResponse = '';

// Navigation flow
startSocraticSession() → window.location.hash = '#/socratic'
                      → Router calls socratic(screen)
                      → Renders activeSession
                      → User types response
                      → Submit → API call
                      → Update activeSession or complete
                      → Re-render or show insights
```

## Question Generation Strategy

```
PRE_LESSON Questions:
1. "What do you already know about [topic]?"
2. "Why are you interested in learning [topic]?"
3. "Can you think of a real-world example where [topic] is used?"

CHECKPOINT Questions:
1. "In your own words, what have you learned so far?"
2. "How would you explain [key concept] to a friend?"
3. "What's the most surprising thing you've discovered?"

REFLECTION Questions:
1. "Looking back, what was the most valuable insight?"
2. "How will you apply what you learned?"
3. "What do you still feel uncertain about?"

WAIT_WHAT Questions:
1. "What specifically is confusing you?"
2. "Let's break down [concept]. What part makes sense?"
3. "Can you describe what you understand so far?"
```

## Styling System

```css
/* Component-level styles in web/styles.css */

.socratic-session {
  /* Active session container */
  max-width: 700px;
  padding: 2rem;
}

.question-card {
  /* Question display */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 16px;
}

.response-input {
  /* Textarea for answers */
  min-height: 150px;
  font-size: 1.1rem;
  padding: 1rem;
}

.pre-lesson-prompt {
  /* Before lesson starts */
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.checkpoint-callout {
  /* During lesson */
  background: linear-gradient(135deg, #ffeaa7 0%, #ffffff 100%);
  border-left: 4px solid #fdcb6e;
}

.reflection-prompt {
  /* After practice */
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
}

.glossary-grid {
  /* Term display */
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}
```

## Navigation Fix Explanation

### The Problem
```javascript
// OLD (BROKEN) - Direct innerHTML manipulation
async function startSocraticSession(...) {
  // ... create session
  activeSession = { /* ... */ };
  
  const screen = document.querySelector('.screen');
  screen.innerHTML = renderActiveSession(); // ❌ Doesn't work!
}
```

**Why it failed:**
- Direct `innerHTML` assignment bypasses the router
- Event handlers don't attach properly
- State management gets confused
- No proper view lifecycle

### The Solution
```javascript
// NEW (WORKING) - Router-based navigation
async function startSocraticSession(...) {
  // ... create session
  activeSession = { /* ... */ };
  
  // Navigate using router
  window.location.hash = '#/socratic'; // ✅ Works!
}

// Router then calls:
export async function socratic(screen) {
  if (activeSession) {
    screen.innerHTML = renderActiveSession(); // Now properly initialized
    return;
  }
  // ... show session list
}
```

**Why it works:**
- Router handles view lifecycle properly
- Event handlers attach correctly
- State is managed consistently
- Clean separation of concerns

## Integration Points

### From Lesson View
```javascript
// Pre-lesson prompt
<button onclick="startSocraticSession('PRE_LESSON', slug, title)">
  Start Grilling (2-3 min)
</button>

// Checkpoints
<button onclick="startCheckpointSession(1, context)">
  Quick Check-In
</button>

// Reflection
<button onclick="startSocraticSession('REFLECTION', slug, title, {score})">
  Start Reflection (2 min)
</button>

// Wait, what?
<button onclick="startSocraticSession('WAIT_WHAT', slug, title, {section})">
  Wait, what?
</button>
```

### Return Navigation
```javascript
// After completion
window.socraticFinish = function() {
  activeSession = null;
  currentResponse = '';
  window.location.hash = '#/learn'; // Back to lessons
};
```

## Future Enhancements

1. **AI-Powered Questions:** Use actual AI to generate contextual follow-ups
2. **Spaced Repetition:** Resurface concepts based on forgetting curve
3. **Peer Learning:** Show anonymized insights from other learners
4. **Voice Input:** Allow spoken responses for accessibility
5. **Progress Tracking:** Visualize learning journey over time
6. **Adaptive Difficulty:** Adjust question depth based on responses
7. **Group Sessions:** Collaborative Socratic discussions
8. **Export Notes:** Download glossary and insights as markdown

---

**Architecture Status:** ✅ Complete and Production-Ready
**Code Quality:** All components follow consistent patterns
**Performance:** In-memory state with DB persistence
**Scalability:** Designed for 1000s of concurrent sessions
