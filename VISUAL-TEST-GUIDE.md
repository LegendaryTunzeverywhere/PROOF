# Visual Testing Guide - What You Should See

## 🎯 Testing the Two Main Fixes

### Fix #1: Language Detection - "german" → Languages ✅

#### What to Test
Type "german" (or "spanish", "mandarin") in the "What do you want to learn?" input

#### What You Should See BEFORE Fix
```
❌ Input: "german"
❌ Shows: 💻 Web Development
❌ Blurb: "Build real websites and web apps"
```

#### What You Should See AFTER Fix (Now)
```
✅ Input: "german"
✅ Shows: 🗣️ Languages
✅ Blurb: "Hold real conversations — German, French, Spanish, Mandarin & more."
```

#### Visual Indicators
- **Correct Emoji:** 🗣️ (speaking head) not 💻 (computer)
- **Correct Title:** "Languages" not "Web Development"
- **Correct Description:** Mentions "German, French, Spanish, Mandarin"

---

### Fix #2: Grilling Session Navigation ✅

#### What to Test
Click any grilling button (4 types available):
1. Pre-lesson "Start Grilling (2-3 min)" button
2. Checkpoint "Quick Check-In" button (yellow callouts)
3. Reflection "Start Reflection (2 min)" button (green prompt)
4. "Wait, what?" button (orange, top-right of lesson)

#### What You Saw BEFORE Fix
```
❌ Click button
❌ Error message appears: "Failed to start grilling session. Please try again."
❌ Nothing happens
❌ Session doesn't start
```

#### What You Should See AFTER Fix (Now)
```
✅ Click button
✅ Smooth navigation to socratic view
✅ Session UI appears with:
   - Progress bar (Question X of Y)
   - Question card with gradient background
   - Large textarea for response
   - "Skip for now" and "Submit Response" buttons
✅ No error messages
```

#### Visual Indicators of Success
- **Progress Bar:** Shows "Question 1 of 3" (or similar)
- **Question Card:** Purple gradient background with 💡 icon
- **Textarea:** Large input area with placeholder text
- **Button States:** Submit button disabled until 10 chars typed
- **Smooth Transition:** No flash or error, just smooth page change

---

## 🎨 What Each Session Type Looks Like

### 1. Pre-Lesson Grilling (Before Starting Lesson)

**Where:** Appears automatically when entering a new lesson (lessonDone = false)

**Visual Style:**
```
┌─────────────────────────────────────────┐
│  🎯 Before We Start...                  │
│                                         │
│  Pre-lesson questions help you:         │
│                                         │
│  ✨ Surface what you already know       │
│  🎯 Focus on what matters to you        │
│  🔗 Connect new ideas to experience     │
│                                         │
│  [Start Grilling (2-3 min)]  [Skip]    │
└─────────────────────────────────────────┘
```

**Colors:** Purple/pink gradient background, white text
**Position:** Center of screen, before lesson content
**Actions:** Two buttons - start or skip

---

### 2. Checkpoint Questions (During Lesson)

**Where:** 2 locations per lesson:
- Midway through lesson sections
- Before practice section

**Visual Style:**
```
┌─────────────────────────────────────────┐
│  🎯 Checkpoint                          │
│                                         │
│  In your own words, what have you      │
│  learned so far?                        │
│                                         │
│         [Quick Check-In]                │
└─────────────────────────────────────────┘
```

**Colors:** Yellow/white gradient, orange left border
**Position:** Between lesson sections
**Size:** Compact card, not full-width
**Actions:** One button - start checkpoint

---

### 3. Post-Lesson Reflection (After Practice)

**Where:** Appears after completing practice questions, before proof challenge

**Visual Style:**
```
┌─────────────────────────────────────────┐
│  🤔 Practice Complete!                  │
│                                         │
│  You scored 80%                         │
│                                         │
│  Take 2 minutes to reflect on what     │
│  you learned before moving forward.     │
│                                         │
│  [Start Reflection (2 min)] [Skip]     │
└─────────────────────────────────────────┘
```

**Colors:** Green gradient background, white text
**Position:** After practice section
**Shows:** Practice score prominently
**Actions:** Two buttons - start or skip

---

### 4. "Wait, What?" Button (On Demand)

**Where:** Top-right corner of every lesson screen

**Visual Style:**
```
┌─────────────────────────────────────────┐
│  Lesson Title              [Wait, what?]│  ← Orange button
└─────────────────────────────────────────┘
```

**Colors:** Orange/warning style, stands out
**Position:** Always visible, top-right
**Purpose:** Instant help when confused
**Behavior:** Starts WAIT_WHAT session, returns to same lesson after

---

## 📝 Active Session UI (All Types)

**Once any grilling session starts, you see:**

```
┌─────────────────────────────────────────┐
│  ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░  Question 1 of 3
│
│  ┌───────────────────────────────────┐
│  │  💡                               │
│  │                                   │
│  │  What do you already know         │
│  │  about HTML?                      │
│  │                                   │
│  │  Take your time. The goal is     │
│  │  deep thinking, not quick answers.│
│  └───────────────────────────────────┘
│
│  ┌───────────────────────────────────┐
│  │ Type your response here...        │
│  │ Be specific and use examples.     │
│  │                                   │
│  │                                   │
│  │                                   │
│  │                                   │
│  └───────────────────────────────────┘
│
│  [Skip for now]  [Submit Response] ← Disabled until 10 chars
│
└─────────────────────────────────────────┘
```

**Key Visual Elements:**
1. **Progress Bar:** Filled bar showing current question number
2. **Question Card:** Purple gradient, large text, icon
3. **Hint Text:** Gray, encouraging, non-judgmental
4. **Response Area:** Large textarea, 6+ rows
5. **Button Row:** Secondary (skip) and primary (submit)
6. **Character Limit:** Shows hint if < 10 characters

---

## ✅ Session Complete Screen

**After finishing any session:**

```
┌─────────────────────────────────────────┐
│              🎉                         │
│       Session Complete!                 │
│                                         │
│    Here's what we learned about        │
│    your understanding                   │
│                                         │
│         ┌───────┐                      │
│         │  78   │ ← Readiness Score    │
│         │ Ready │                       │
│         └───────┘                      │
│                                         │
│    📝 3 Questions  💡 2 Deep Responses │
│                                         │
│  💡 Your Key Insights                  │
│  ┌─────────────────────────────────┐  │
│  │ You understand semantic HTML    │  │
│  │ means describing content meaning│  │
│  └─────────────────────────────────┘  │
│                                         │
│       [Continue Learning]              │
└─────────────────────────────────────────┘
```

**Key Visual Elements:**
1. **Celebration Icon:** 🎉 at top
2. **Score Circle:** Large, colored by score (green = high, yellow = medium)
3. **Stats Row:** Questions, deep responses, insights count
4. **Insight Cards:** Gray boxes with key learnings
5. **Primary Action:** Return to lesson or next step

---

## 📚 Glossary View

**Navigate to glossary (sidebar or #/glossary):**

```
┌─────────────────────────────────────────┐
│  📖 My Glossary                         │
│                                         │
│  [All] [🌱 Beginner] [🌿 Inter] [🌳 Expert]
│                                         │
│  ┌──────────────┐ ┌──────────────┐    │
│  │ Flexbox      │ │ Semantic     │    │
│  │ 🌿 Inter     │ │ HTML         │    │
│  │              │ │ 🌱 Beginner  │    │
│  │ A CSS layout │ │ HTML tags    │    │
│  │ system...    │ │ that describe│    │
│  │              │ │ meaning...   │    │
│  │ CSS lesson   │ │ HTML lesson  │    │
│  │       [×]    │ │       [×]    │    │
│  └──────────────┘ └──────────────┘    │
│                                         │
│            [+ Add Term]                 │
└─────────────────────────────────────────┘
```

**Key Visual Elements:**
1. **Filter Tabs:** All, Beginner, Intermediate, Expert with emojis
2. **Grid Layout:** Responsive, 2-3 columns
3. **Term Cards:** White background, rounded corners, shadow
4. **Level Badge:** Emoji + text at top
5. **Delete Button:** Small × in corner
6. **Add Button:** Prominent at bottom

---

## 🔍 Empty States

### No Glossary Terms Yet
```
┌─────────────────────────────────────────┐
│              💭                         │
│                                         │
│    No glossary terms yet                │
│                                         │
│    Build your personal vocabulary       │
│    as you learn. Add terms that matter │
│    to you.                              │
│                                         │
│         [Add Your First Term]          │
└─────────────────────────────────────────┘
```

### No Socratic Sessions Yet
```
┌─────────────────────────────────────────┐
│              💭                         │
│                                         │
│    No grilling sessions yet             │
│                                         │
│    Socratic sessions help you learn    │
│    deeply by asking probing questions  │
│    before, during, and after lessons.  │
│                                         │
│    Start a lesson to begin your first  │
│    grilling session!                    │
└─────────────────────────────────────────┘
```

---

## ⚡ Quick Visual Tests

### Test 1: Language Path (30 seconds)
1. Go to home/onboarding
2. Type "german" in input
3. **VERIFY:** See 🗣️ Languages with correct description
4. **VERIFY:** NOT seeing 💻 Web Development

### Test 2: Grilling Session (60 seconds)
1. Select any lesson you haven't completed
2. Click "Start Grilling (2-3 min)" on pre-lesson prompt
3. **VERIFY:** See progress bar "Question 1 of 3"
4. **VERIFY:** See purple question card with 💡 icon
5. **VERIFY:** Type 15 characters in textarea
6. **VERIFY:** Submit button becomes enabled
7. Click submit
8. **VERIFY:** Next question loads smoothly

### Test 3: Checkpoints (45 seconds)
1. Scroll through any lesson
2. **VERIFY:** See yellow checkpoint callout halfway through
3. Click "Quick Check-In"
4. **VERIFY:** Checkpoint session starts (not error)
5. Answer and submit
6. **VERIFY:** Returns to lesson

### Test 4: Glossary (30 seconds)
1. Navigate to glossary
2. **VERIFY:** See demo terms in grid layout
3. **VERIFY:** See filter tabs with emojis
4. Click "Add Term"
5. **VERIFY:** Modal appears with form
6. Fill and submit
7. **VERIFY:** New term appears in list

---

## 🎨 Color Reference

| Element | Color | Visual |
|---------|-------|--------|
| Pre-lesson prompt | Purple/pink gradient | #f093fb → #f5576c |
| Checkpoint callout | Yellow/white gradient | #ffeaa7 → #ffffff |
| Checkpoint border | Orange | #fdcb6e |
| Reflection prompt | Green/teal gradient | #00b894 → #00cec9 |
| Question card | Purple gradient | #667eea → #764ba2 |
| "Wait, what?" button | Orange/warning | #e17055 |
| Success color | Green | #00b894 |
| Score high | Green | var(--good) |
| Score medium | Blue | var(--primary) |
| Score low | Orange | var(--warning) |

---

## ✅ Success Checklist

When testing, verify you see:

- [ ] Correct skill (Languages) for "german" input
- [ ] Pre-lesson prompt with purple/pink gradient
- [ ] Yellow checkpoint callouts in lessons
- [ ] Green reflection prompt after practice
- [ ] Orange "Wait, what?" button always visible
- [ ] Purple question cards in sessions
- [ ] Progress bar showing question count
- [ ] Character counter / button enable at 10 chars
- [ ] Smooth transitions, no errors
- [ ] Completion screen with readiness score
- [ ] Glossary grid with term cards
- [ ] Level badges with emojis (🌱🌿🌳)

**If any of these are missing or wrong, report the specific issue!**

---

**Visual Guide Status:** ✅ Complete
**Use this guide:** While manually testing the system
**Expected result:** All visuals match descriptions above
