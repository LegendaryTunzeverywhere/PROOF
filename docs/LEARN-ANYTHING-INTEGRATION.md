# Learn Anything Integration Plan for PROOF

## 🎯 What Learn Anything Brings

Learn Anything is an AI-powered recursive learning system with 6 powerful features:

1. **Knowledge Maps** - Visual hierarchies of topics
2. **Recursive Explanations** - Deep-dive as far as needed
3. **TDD-Style Practice** - Code exercises with feedback
4. **Adaptive Quizzes** - Graded Q&A with question banks
5. **Spaced Repetition** - Smart review scheduling
6. **Visual Dashboard** - Browse learning data

## 🔄 How to Integrate with PROOF

### **Phase 1: Core Features (Week 1-2)**

#### 1. Knowledge Map Generation
**Current**: AI generates linear paths
**Enhanced**: Generate hierarchical knowledge maps

```javascript
// server/ai/knowledge-mapper.js
export class KnowledgeMapper {
  async generateMap(skill, level) {
    // Use AI to create hierarchical topic structure
    return {
      root: skill,
      nodes: [
        { id: 'fundamentals', children: [...] },
        { id: 'intermediate', children: [...] },
        { id: 'advanced', children: [...] }
      ],
      edges: [ /* dependencies */ ]
    };
  }
}
```

**UI Addition**: Interactive knowledge graph view
- Force-directed graph layout
- Click nodes to start lessons
- Color-coded by mastery level
- Show prerequisite connections

#### 2. Recursive Explanations (AI Tutor Enhancement)
**Current**: AI tutor gives single-level answers
**Enhanced**: "Explain deeper" button for recursion

```javascript
// web/js/views/learn.js - Enhance tutor
const recursiveTutor = {
  depth: 0,
  maxDepth: 5,
  explainDeeper(concept) {
    if (this.depth < this.maxDepth) {
      this.depth++;
      return api.post('/api/tutor/recurse', {
        concept,
        depth: this.depth,
        context: this.history
      });
    }
  }
};
```

**UI**: Add "🔍 Explain deeper" button to tutor responses

#### 3. Spaced Repetition System
**Current**: No review system
**Enhanced**: Track mastery & schedule reviews

```javascript
// server/services/spaced-repetition.js
export class SpacedRepetition {
  // SM-2 algorithm (SuperMemo 2)
  calculateNextReview(quality, repetitions, easeFactor, interval) {
    if (quality < 3) {
      return { repetitions: 0, interval: 1, easeFactor };
    }
    
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);
    
    return {
      repetitions: repetitions + 1,
      interval,
      easeFactor,
      nextReview: Date.now() + interval * 86400000
    };
  }
}
```

**Database Schema Addition**:
```sql
CREATE TABLE review_schedule (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic_slug TEXT NOT NULL,
  repetitions INTEGER DEFAULT 0,
  ease_factor REAL DEFAULT 2.5,
  interval INTEGER DEFAULT 1,
  next_review_at INTEGER NOT NULL,
  last_quality INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

---

### **Phase 2: Advanced Features (Week 3-4)**

#### 4. TDD-Style Practice Enhancement
**Current**: Single challenge per lesson
**Enhanced**: Progressive exercise series

```javascript
// server/ai/exercise-generator.js
export class ExerciseGenerator {
  async generateSeries(topic, difficulty) {
    return [
      {
        id: 1,
        type: 'fill-blank',
        starter: '// TODO: Complete this function\nfunction add(a, b) {\n  \n}',
        tests: ['add(2,3) === 5', 'add(-1,1) === 0'],
        solution: 'return a + b;'
      },
      {
        id: 2,
        type: 'fix-bug',
        buggy: 'function add(a, b) { return a - b; }',
        tests: ['add(2,3) === 5'],
        solution: 'return a + b;'
      },
      {
        id: 3,
        type: 'from-scratch',
        instructions: 'Write add function',
        tests: ['add(2,3) === 5', 'add(0,0) === 0'],
        solution: 'function add(a, b) { return a + b; }'
      }
    ];
  }
}
```

#### 5. Quiz System
**Current**: Practice questions in lessons
**Enhanced**: Adaptive quiz mode

```javascript
// server/services/quiz.js
export class AdaptiveQuiz {
  async generateQuiz(userId, topicSlug, count = 10) {
    const weakAreas = await this.identifyWeakAreas(userId, topicSlug);
    const questions = await this.selectQuestions(weakAreas, count);
    
    return {
      id: generateId(),
      questions,
      adaptiveLevel: true,
      timeLimit: count * 60 // 1 min per question
    };
  }
  
  async gradeAndAdapt(quizId, answers) {
    const results = this.grade(answers);
    const nextTopics = this.suggestNext(results);
    
    return {
      score: results.score,
      correct: results.correct,
      total: results.total,
      weakAreas: results.weak,
      nextTopics
    };
  }
}
```

#### 6. Visual Dashboard
**Current**: List-based lesson view
**Enhanced**: Rich visual learning dashboard

Create new dashboard route:
```javascript
// web/js/views/dashboard.js
export async function dashboard(root) {
  const data = await api.get('/api/dashboard/learning');
  
  root.innerHTML = `
    <div class="dashboard-grid">
      <div class="knowledge-map-card">
        <canvas id="knowledgeGraph"></canvas>
      </div>
      
      <div class="progress-heatmap">
        <!-- Calendar heatmap like GitHub -->
      </div>
      
      <div class="review-schedule">
        <h3>Due for Review</h3>
        <div class="review-cards">
          ${data.dueReviews.map(renderReviewCard).join('')}
        </div>
      </div>
      
      <div class="weak-spots">
        <h3>Areas Needing Practice</h3>
        <div class="weak-areas">
          ${data.weakAreas.map(renderWeakArea).join('')}
        </div>
      </div>
      
      <div class="recent-activity">
        <h3>Recent Learning Sessions</h3>
        ${data.sessions.map(renderSession).join('')}
      </div>
    </div>
  `;
  
  initKnowledgeGraph(data.knowledgeMap);
  initHeatmap(data.activityData);
}
```

---

### **Phase 3: Integration & Polish (Week 5-6)**

#### New API Endpoints

```javascript
// server/index.js additions

// Knowledge map
route('GET', '/api/knowledge-map/:skillSlug', async (ctx) => {
  const map = await knowledgeMapper.getMap(ctx.params.skillSlug);
  json(ctx.res, 200, { map });
});

// Recursive explanation
route('POST', '/api/tutor/recurse', async (ctx) => {
  const { concept, depth, context } = ctx.body;
  const explanation = await aiService.recursiveExplain(concept, depth, context);
  json(ctx.res, 200, { explanation, depth });
});

// Spaced repetition
route('GET', '/api/reviews/due', async (ctx) => {
  const reviews = await spacedRepetition.getDueReviews(ctx.user.id);
  json(ctx.res, 200, { reviews });
});

route('POST', '/api/reviews/:id/complete', async (ctx) => {
  const { quality } = ctx.body; // 0-5 rating
  const next = await spacedRepetition.recordReview(ctx.params.id, quality);
  json(ctx.res, 200, { nextReview: next });
});

// Exercise series
route('GET', '/api/exercises/:topicSlug', async (ctx) => {
  const exercises = await exerciseGenerator.generateSeries(ctx.params.topicSlug);
  json(ctx.res, 200, { exercises });
});

// Adaptive quiz
route('POST', '/api/quiz/generate', async (ctx) => {
  const quiz = await adaptiveQuiz.generateQuiz(ctx.user.id, ctx.body.topicSlug);
  json(ctx.res, 200, { quiz });
});

route('POST', '/api/quiz/:id/submit', async (ctx) => {
  const results = await adaptiveQuiz.gradeAndAdapt(ctx.params.id, ctx.body.answers);
  json(ctx.res, 200, results);
});

// Dashboard data
route('GET', '/api/dashboard/learning', async (ctx) => {
  const data = {
    knowledgeMap: await knowledgeMapper.getUserMap(ctx.user.id),
    dueReviews: await spacedRepetition.getDueReviews(ctx.user.id),
    weakAreas: await adaptiveQuiz.identifyWeakAreas(ctx.user.id),
    sessions: await store.filter('learning_sessions', s => s.userId === ctx.user.id).slice(0, 10),
    activityData: await analytics.getLearningActivity(ctx.user.id)
  };
  json(ctx.res, 200, data);
});
```

---

## 🎨 UI Enhancements

### 1. New "Dashboard" Tab
Add to bottom navigation:
```javascript
['dashboard', '📊', 'Dashboard'],
['learn', '📚', 'Learn'],
['prove', '🎯', 'Prove'],
['work', '💼', 'Work'],
['you', '👤', 'You']
```

### 2. Knowledge Graph View
- D3.js force-directed graph
- Nodes colored by mastery (red → yellow → green)
- Click to drill down
- Zoom and pan
- Show prerequisites as edges

### 3. Review Cards (Like Anki)
- Front: Question/concept
- Back: Answer + explanation
- Rate difficulty: Again, Hard, Good, Easy
- Next review date shown
- Progress bar for session

### 4. Progress Heatmap (Like GitHub)
- Calendar view of learning activity
- Color intensity = time spent
- Hover shows details
- Streak counter

### 5. Weak Spot Alerts
```html
<div class="weak-spot-card">
  <div class="topic">JavaScript Closures</div>
  <div class="stats">
    <span>2/5 attempts passed</span>
    <span>Last tried: 3 days ago</span>
  </div>
  <button class="btn btn-nim">Review Now</button>
</div>
```

---

## 📊 New Database Schema

```sql
-- Learning sessions with depth tracking
CREATE TABLE learning_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic_slug TEXT NOT NULL,
  session_type TEXT NOT NULL, -- 'explain' | 'practice' | 'quiz' | 'review'
  depth INTEGER DEFAULT 0, -- for recursive explanations
  duration_seconds INTEGER,
  notes TEXT,
  created_at INTEGER NOT NULL
);

-- Exercise attempts
CREATE TABLE exercise_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  topic_slug TEXT NOT NULL,
  code TEXT NOT NULL,
  tests_passed INTEGER NOT NULL,
  tests_total INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at INTEGER NOT NULL
);

-- Quiz results
CREATE TABLE quiz_results (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  quiz_id TEXT NOT NULL,
  topic_slug TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  answers TEXT NOT NULL, -- JSON
  time_taken_seconds INTEGER,
  created_at INTEGER NOT NULL
);

-- Knowledge graph nodes
CREATE TABLE knowledge_nodes (
  id TEXT PRIMARY KEY,
  skill_slug TEXT NOT NULL,
  topic_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  level INTEGER NOT NULL, -- 1=beginner, 2=intermediate, 3=advanced
  prerequisites TEXT, -- JSON array of node IDs
  estimated_minutes INTEGER NOT NULL
);

-- User mastery tracking
CREATE TABLE user_mastery (
  user_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  mastery_score REAL DEFAULT 0, -- 0-100
  attempts INTEGER DEFAULT 0,
  last_practiced_at INTEGER,
  PRIMARY KEY (user_id, node_id)
);
```

---

## 🚀 Implementation Priority

### Must-Have (MVP)
1. ✅ Spaced repetition system
2. ✅ Review cards interface
3. ✅ Weak spot identification
4. ✅ Dashboard view

### Should-Have
1. Knowledge graph visualization
2. Recursive explanations
3. Exercise series
4. Progress heatmap

### Nice-to-Have
1. Adaptive quizzes
2. Session analytics
3. Learning streaks
4. Social features (study groups)

---

## 💡 Key Improvements Over Learn Anything

1. **Blockchain-backed**: NIM rewards for learning
2. **Type-only proofs**: Can't cheat with copy-paste
3. **Job marketplace**: Verified skills → paid work
4. **Teaching economy**: Earn by teaching others
5. **Proof portfolio**: Public skill verification
6. **Mobile-first**: Works great on phones
7. **Gamified**: XP, levels, achievements
8. **Community**: Study groups, leaderboards

---

## 📈 Expected Outcomes

### User Engagement
- ↑ 40% session duration (recursive learning)
- ↑ 60% return rate (spaced repetition)
- ↑ 80% completion rate (better scaffolding)

### Learning Effectiveness
- ↑ 50% retention (spaced repetition)
- ↓ 30% time to mastery (adaptive)
- ↑ 70% confidence (more practice)

### Platform Growth
- ↑ 100% daily active users (review reminders)
- ↑ 150% NIM circulation (more challenges)
- ↑ 200% proof submissions (easier path)

---

## 🎯 Next Steps

1. **Week 1**: Implement spaced repetition backend
2. **Week 2**: Build review card UI
3. **Week 3**: Add knowledge graph
4. **Week 4**: Implement exercise series
5. **Week 5**: Create dashboard view
6. **Week 6**: Polish & test with beta users

**Goal**: Make PROOF the most effective, engaging, and rewarding learning platform in Web3.
