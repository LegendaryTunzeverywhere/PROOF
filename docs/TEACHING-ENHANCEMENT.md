# Teaching Enhancement Plan
## Inspired by mattpocock/skills Engineering Philosophy

This document outlines how we'll integrate Matt Pocock's engineering-first teaching methodology into PROOF to create a superior learning experience.

---

## Core Philosophy Integration

### 1. **Grilling-Based Learning** (from `/grill-me` and `/grill-with-docs`)

**Problem in Current PROOF**: Learners passively consume lessons without deep engagement.

**Solution**: Implement **Socratic Learning Mode**
- Before lessons: AI asks probing questions about what learner wants to master
- During lessons: Interactive checkpoints with follow-up questions
- After lessons: Reflection interviews to solidify understanding

**Implementation**:
```javascript
// New teaching modes
const TEACHING_MODES = {
  PASSIVE: 'passive',      // Current: read and practice
  SOCRATIC: 'socratic',    // New: question-driven learning
  GRILLED: 'grilled'       // New: intensive Q&A before/after
};
```

### 2. **Domain Modeling & Shared Language** (from `/domain-modeling`)

**Problem**: Technical jargon creates barriers; learners struggle with terminology.

**Solution**: **Progressive Vocabulary Building**
- Each skill has a GLOSSARY.md with learner-appropriate definitions
- Terms introduced progressively (beginner → intermediate → expert)
- Learners build their own "language mastery" as they progress

**Example**:
```markdown
# Web Development Glossary

## Beginner Terms
- **HTML**: The structure of a webpage (like the skeleton of a building)
- **CSS**: The styling of a webpage (like paint and decoration)

## Intermediate Terms  
- **Semantic HTML**: Using HTML tags that describe their meaning
- **CSS Specificity**: Rules for which styles win when there's a conflict

## Expert Terms
- **Accessibility Tree**: Browser's representation of page structure for screen readers
- **CSS Containment**: Performance optimization technique
```

### 3. **Test-Driven Learning** (from `/tdd`)

**Problem**: Learners don't know if they truly understand until they try to build.

**Solution**: **Learn-Test-Build Cycle**
1. **Learn**: Short concept explanation (2-3 min)
2. **Test**: Quick quiz to verify understanding
3. **Build**: Apply concept in micro-project
4. **Feedback**: Immediate AI evaluation with hints

**Implementation**:
```javascript
// Lesson structure
{
  concept: "CSS Flexbox",
  learn: { duration: 3, content: "..." },
  test: {
    type: "multiple-choice",
    questions: [...]
  },
  build: {
    type: "code-challenge",
    prompt: "Create a centered card layout",
    tests: [...],
    hints: [...]
  }
}
```

### 4. **Deep Modules & Design Thinking** (from `/codebase-design`)

**Problem**: Learners build messy code without understanding good architecture.

**Solution**: **Architecture Awareness Track**
- Introduce design principles progressively
- Code reviews focus on "why" not just "what"
- Challenges explicitly teach: modules, interfaces, separation of concerns

**New Challenge Types**:
- **Refactoring Challenges**: "Make this code better"
- **Architecture Reviews**: "Critique this design"
- **Design Decisions**: "Choose between approaches A, B, C and defend"

### 5. **Feedback Loop Optimization** (from core philosophy)

**Problem**: Learners get feedback too late or not specific enough.

**Solution**: **Multi-Level Feedback System**

| Feedback Level | Timing | Type |
|---------------|---------|------|
| Instant | During typing | Syntax hints |
| Quick | On submit | Auto-tests |
| Deep | After review | AI analysis |
| Meta | Weekly | Progress insights |

---

## New Features to Implement

### Feature 1: **Skill Trees with Prerequisites**

Inspired by engineering fundamentals, create clear learning paths:

```
HTML Basics ──┐
              ├──> Semantic HTML ──> Accessibility
CSS Basics ───┘

JavaScript Basics ──> DOM Manipulation ──> Event Handling ──┐
                                                             ├──> Interactive Apps
                     Async Programming ────────────────────┘
```

**Database Schema**:
```sql
CREATE TABLE SkillDependencies (
  skillSlug TEXT PRIMARY KEY,
  prerequisiteSkills TEXT[], -- Array of required skills
  recommendedSkills TEXT[],  -- Nice to have
  difficultyLevel INTEGER,   -- 1-10
  estimatedHours INTEGER
);
```

### Feature 2: **Context-Aware AI Tutor**

Like `/wait-what` - learners can ask "Wait, what?" at any point:

```javascript
// New tutor modes
tutorModes: {
  explain: "Re-explain this concept simply",
  analogy: "Give me an analogy",
  example: "Show me a real-world example", 
  deeper: "Go deeper into this topic",
  related: "What else should I know?"
}
```

### Feature 3: **Project-Based Learning Paths**

Instead of isolated lessons, group into **Project Tracks**:

**Example**: "Build a Todo App" track
1. HTML Structure (lesson)
2. CSS Styling (lesson)
3. JavaScript Basics (lesson)
4. DOM Manipulation (lesson)
5. **Integration Project**: Build your Todo App
6. **Code Review**: AI reviews your implementation
7. **Refactoring**: Improve based on feedback

### Feature 4: **Debugging Challenges** (from `/diagnosing-bugs`)

New challenge type: "Fix the Bug"
- Provides broken code
- Learner must:
  1. Reproduce the bug
  2. Form hypothesis
  3. Instrument/add console.logs
  4. Fix the issue
  5. Add regression test

### Feature 5: **Weekly Architecture Reviews** (from `/improve-codebase-architecture`)

**"Code Improvement Fridays"**:
- AI analyzes learner's past projects
- Suggests improvements: "Your Todo App could be deeper by..."
- Learner chooses one to refactor
- Earns "Craftsperson" badges

### Feature 6: **Collaborative Learning** (from shared language concept)

**Study Groups**:
- Learners can form study groups
- Shared glossary they build together
- Group challenges with peer review
- Discussion threads on confusing topics

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Add skill dependencies to database
- [ ] Implement Socratic learning mode
- [ ] Build progressive glossary system
- [ ] Add "Wait, what?" tutor feature

### Phase 2: Enhanced Learning (Weeks 3-4)
- [ ] Implement Learn-Test-Build cycle
- [ ] Add refactoring challenges
- [ ] Build project-based tracks
- [ ] Create debugging challenges

### Phase 3: Community & Polish (Weeks 5-6)
- [ ] Add study groups
- [ ] Weekly architecture reviews
- [ ] Peer review system
- [ ] Advanced analytics dashboard

---

## Key Metrics to Track

Following Matt's philosophy of feedback loops:

1. **Learning Velocity**: Time to master a skill (should decrease with better teaching)
2. **Retention Rate**: Do learners remember after 7/30/90 days?
3. **Code Quality**: Measured by AI review scores
4. **Engagement**: Questions asked per lesson (higher = better)
5. **Real-World Readiness**: Performance on refactoring/debugging vs building

---

## Example: Enhanced "CSS Flexbox" Lesson

### Before (Current):
```
Title: Learn Flexbox
Content: Flexbox is a layout system... [3 paragraphs]
Practice: Arrange these items
```

### After (Enhanced):
```
🎯 Pre-Lesson Grilling:
- "What layout problems have you faced?"
- "How do you currently center things?"
- "What frustrates you about CSS?"

📚 Concept (2min):
Flexbox solves the "how do I arrange things" problem.
[Interactive diagram]

✓ Quick Test:
Q: What property makes an element a flex container?
A: display: flex ✓

🔨 Micro-Build (5min):
Create a navbar with logo left, links right
[Live editor with tests]

💬 Reflection:
- "How would you use this in a real project?"
- "What surprised you about flexbox?"

📖 Add to Your Glossary:
flex-container, flex-item, justify-content, align-items

🎯 Next Steps:
- Grid Layout (requires: Flexbox ✓)
- Responsive Design (requires: Flexbox ✓, Media Queries)
```

---

## Technical Architecture

### New Services

```javascript
// server/services/teaching-enhanced.js
export class EnhancedTeachingService {
  // Socratic learning
  async startGrillingSession(userId, topic);
  async processGrillingResponse(sessionId, response);
  
  // Progressive glossary
  async addToGlossary(userId, term, level);
  async getGlossary(userId, level);
  
  // Project tracks
  async enrollInTrack(userId, trackId);
  async getTrackProgress(userId, trackId);
  
  // Code reviews
  async submitForReview(userId, code, challengeId);
  async getReviewFeedback(reviewId);
  
  // Study groups
  async createStudyGroup(userId, name, topic);
  async joinStudyGroup(userId, groupId);
}
```

### New Database Tables

```sql
-- Skill dependencies
CREATE TABLE SkillDependencies (
  skillSlug TEXT PRIMARY KEY,
  prerequisites JSON,
  difficulty INTEGER
);

-- Glossary terms
CREATE TABLE UserGlossary (
  id TEXT PRIMARY KEY,
  userId TEXT,
  term TEXT,
  definition TEXT,
  level TEXT, -- beginner/intermediate/expert
  masteryScore INTEGER,
  createdAt INTEGER
);

-- Project tracks
CREATE TABLE ProjectTracks (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  skills JSON, -- Array of required skills
  estimatedHours INTEGER
);

-- Study groups
CREATE TABLE StudyGroups (
  id TEXT PRIMARY KEY,
  name TEXT,
  topicSlug TEXT,
  memberIds JSON,
  sharedGlossary JSON,
  createdAt INTEGER
);
```

---

## UI Enhancements

### New Screens

1. **Skill Map** (visual tree of dependencies)
2. **My Glossary** (personal term collection)
3. **Project Workshop** (build integrated projects)
4. **Code Review** (AI feedback on submissions)
5. **Study Groups** (collaborative learning)

### Enhanced Navigation

```
Home | Learn | Review | Build | Groups | Profile
              ↓
       [Lessons] [Projects] [Glossary]
```

---

## Success Criteria

This enhancement is successful if:

1. **Retention**: 7-day retention increases by 30%
2. **Depth**: Average time per lesson increases (deeper engagement)
3. **Quality**: Code review scores improve over time
4. **Real Skills**: Learners can explain concepts in their own words
5. **Job Ready**: Projects in portfolio are interview-quality

---

## Inspiration References

- Matt Pocock's Skills: https://github.com/mattpocock/skills
- Domain-Driven Design (Eric Evans)
- Test-Driven Development (Kent Beck)
- The Pragmatic Programmer (Hunt & Thomas)
- A Philosophy of Software Design (Ousterhout)

---

*This is a living document. Update as we learn and iterate.*
