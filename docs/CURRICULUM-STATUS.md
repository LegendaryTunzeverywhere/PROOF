# PROOF Curriculum Status & Roadmap

## Current Coverage (1063 lines of comprehensive content)

### ✅ **Fully Developed Courses**

#### 1. **Web Development** 💻
**Status**: Complete Basic → Intermediate
- ✅ HTML Fundamentals (25 min) - Semantic structure, tags, accessibility
- ✅ CSS Fundamentals (30 min) - Selectors, box model, flex/grid
- ✅ Responsive Layout (30 min) - Mobile-first, media queries, fluid units
- ✅ JavaScript Basics (35 min) - Variables, functions, loops, arrays
- ✅ The DOM & Events (30 min) - querySelector, addEventListener, forms
- ✅ Working with APIs (30 min) - fetch, async/await, JSON
- ✅ Final Assessment - Full landing page with interactive features

**Progression**: Basic → Intermediate → Final Project

#### 2. **Python** 🐍
**Status**: Complete Basic → Intermediate
- ✅ Python Syntax & Variables (25 min) - Indentation, types, f-strings
- ✅ Loops, Functions & Logic (30 min) - for/while, def, guards
- ✅ Lists, Dicts & Data Wrangling (30 min) - Comprehensions, grouping
- ✅ Final Assessment - Automation script with CSV processing

**Progression**: Fundamentals → Control Flow → Data Manipulation

#### 3. **UI Design** 🎨
**Status**: Complete Basic → Intermediate
- ✅ Design Principles (25 min) - Hierarchy, white space, alignment
- ✅ Typography & Color (30 min) - Font pairing, contrast, palettes
- ✅ Layout Systems (30 min) - Grids, spacing scales, consistency
- ✅ Final Assessment - Design & defend a UI concept

**Progression**: Principles → Visual Design → Systems Thinking

#### 4. **Marketing** 📈
**Status**: Complete Basic → Intermediate
- ✅ Positioning & Audience (25 min) - Target market, unique value
- ✅ Messaging & Copy (30 min) - Headlines, benefits vs features
- ✅ Campaigns & Channels (30 min) - Channel selection, budgeting
- ✅ Final Assessment - Complete campaign brief

**Progression**: Strategy → Execution → Campaign Planning

#### 5. **Data Analysis** 📊
**Status**: Complete Basic → Intermediate
- ✅ Data Foundations (25 min) - Types, cleaning, integrity
- ✅ Analysis & Metrics (30 min) - Averages, distributions, trends
- ✅ Visualization & Communication (30 min) - Charts, storytelling
- ✅ Final Assessment - Analyze dataset & defend findings

**Progression**: Fundamentals → Analysis → Communication

### 🚧 **Partially Developed**

#### 6. **AI** 🤖
**Current**: Basic prompting, tool usage
**Needs**: 
- Advanced prompt engineering
- Workflow automation with AI
- AI tool integration

#### 7. **Writing** ✍️
**Current**: Basic web writing
**Needs**:
- Technical writing
- Persuasive writing
- Content structure

#### 8. **Social Media** 📱
**Current**: Content basics
**Needs**:
- Platform-specific strategies
- Analytics & optimization
- Content calendar systems

#### 9. **Business** 💼
**Current**: Business model basics
**Needs**:
- Financial modeling
- Pricing strategy
- Operations & scaling

#### 10. **Languages** 🗣️
**Current**: French conversation basics
**Needs**:
- Grammar fundamentals
- Practical vocabulary
- Conversation patterns

#### 11. **Music Production** 🎵
**Current**: Basic theory
**Needs**:
- DAW basics
- Arrangement patterns
- Mixing fundamentals

#### 12. **Practical Skills** 🔧
**Current**: Limited coverage
**Needs**:
- Personal finance
- Home maintenance
- Time management

---

## Content Quality Standards

### ✅ Each Lesson Includes:
1. **TL;DR** - One-sentence takeaway
2. **3 Sections** - Concept breakdown with examples
3. **Code/Visual Example** - Concrete demonstration
4. **Thought Question** - Critical thinking prompt
5. **Key Points** (4 items) - Bullet-point summary
6. **Common Misconception** - What people get wrong

### ✅ Each Practice Includes:
- Multiple-choice questions (2-3 per lesson)
- Hints for scaffolding
- Detailed "why" explanations

### ✅ Each Challenge Includes:
- Clear brief (what to build/write)
- Specific requirements (3-5 items)
- Time estimate
- Pass score threshold
- NIM reward + XP
- Server-side rubric evaluation

---

## Curriculum Philosophy

### **Learn → Practice → Prove**
1. **EXPLAIN** - Lesson content (20-35 min)
2. **PRACTICE** - Check understanding (built-in)
3. **PROVE** - Real challenge (20-45 min)

### **Progressive Difficulty**
- Level 1: Foundation concepts
- Level 2: Practical application
- Level 3: Real-world complexity
- Final: Comprehensive integration

### **Type-Only Proofs**
- All submissions are hand-typed
- Paste/drop disabled
- Keystroke tracking on server
- Anti-AI dump verification

---

## Recommended Expansion Plan

### Phase 1: Complete Partial Skills (Priority)
1. **AI** - Add 4-5 intermediate lessons on:
   - Prompt engineering patterns
   - RAG workflows
   - AI API integration
   - Ethical AI use

2. **Writing** - Add structured lessons:
   - Technical documentation
   - Email copywriting
   - Blog post structure
   - Editing techniques

3. **Social Media** - Platform-specific:
   - Instagram strategy
   - Twitter/X engagement
   - LinkedIn for professionals
   - Analytics & iteration

### Phase 2: Deepen Existing Skills (Advanced)
1. **Web Development**:
   - React fundamentals
   - State management
   - Testing basics
   - Performance optimization

2. **Python**:
   - File I/O & APIs
   - Error handling
   - Testing with pytest
   - Virtual environments

3. **UI Design**:
   - Component systems
   - Design tokens
   - Accessibility deep-dive
   - Motion design

### Phase 3: New Skills (Expansion)
1. **Backend Development** (Node.js/Express)
2. **Database Design** (SQL fundamentals)
3. **Git & Version Control**
4. **Command Line Essentials**
5. **Excel/Spreadsheets** (Formulas, pivot tables)
6. **Public Speaking**
7. **Video Editing**
8. **Photography Basics**

---

## Content Creation Guidelines

### For Each New Topic:
```javascript
{
  slug: 'topic-name',
  title: 'Topic Title',
  estMin: 25-35,
  difficulty: 1-3,
  
  lesson: {
    tldr: 'One clear sentence',
    sections: [
      { h: 'Concept', body: 'Explanation with concrete details' },
      { h: 'Application', body: 'How it works in practice' },
      { h: 'Gotchas', body: 'Common pitfalls & solutions' }
    ],
    example: { lang: 'js/html/css/python', code: 'Working example' },
    ask: 'Critical thinking question',
    keyPoints: ['4 bullet', 'point', 'takeaways', 'max'],
    misconception: 'What people wrongly believe'
  },
  
  practice: [
    { q: 'Question?', choices: [], answerIdx: 0, hint: '', why: '' }
  ],
  
  challenge: {
    type: 'html/js-static/data/text',
    kind: 'checkpoint/final',
    title: 'Build X',
    timeMin: 20-45,
    brief: 'Clear requirements',
    requirements: ['List', 'of', 'criteria'],
    passScore: 70-80,
    rewardNim: 2-5,
    xp: 100-250,
    evaluator: { type: '', config: {} }
  }
}
```

---

## Success Metrics

### Content Quality
- ✅ Every lesson: TL;DR + 3 sections + example + key points
- ✅ Every practice: Hint + why explanation
- ✅ Every challenge: Clear requirements + rubric

### Learning Outcomes
- 📊 Path completion rate >60%
- 📊 Challenge pass rate 65-75% (sweet spot)
- 📊 Retry engagement >40%
- 📊 Skill proof completion >50%

### User Feedback
- 💬 "I actually built something" sentiment
- 💬 Low "where do I start" confusion
- 💬 High NIM reward satisfaction
- 💬 Proof portfolio pride

---

## Next Steps

1. ✅ **Current**: 5 fully developed skills (Web Dev, Python, UI, Marketing, Data)
2. 🚧 **In Progress**: 7 partially developed skills
3. 📋 **Planned**: 8-10 new skill areas
4. 🎯 **Goal**: 15-20 comprehensive skills by Q4 2026

**Each skill should have:**
- 5-7 progressive lessons
- 2-3 practice questions per lesson
- 1 challenge per lesson
- 1 comprehensive final assessment

**Total per skill:**
- ~3 hours of lessons
- ~2 hours of challenges
- 5-8 hours total learning time
- Basic → Intermediate coverage
