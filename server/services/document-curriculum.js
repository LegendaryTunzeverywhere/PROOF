/**
 * Document Curriculum Service
 * Parses uploaded documents (PDF, DOCX, TXT) and generates personalized
 * learning curriculum using AI. Each curriculum is unique to the user.
 */
import { store } from '../index.js';
import { uid, now } from '../util.js';
import { generateLearningPath, generateLesson } from '../ai/service.js';
import { llmEnabled, llmJson } from '../ai/providers.js';
import { checkLearningPath } from '../ai/curriculum-quality.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

let pdfParse;
let mammoth;

async function loadParsers() {
  if (!pdfParse) {
    pdfParse = (await import('pdf-parse')).default;
  }
  if (!mammoth) {
    mammoth = (await import('mammoth')).default;
  }
}

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.mimetype) && !ALLOWED_EXTENSIONS.some(ext => file.originalname.toLowerCase().endsWith(ext))) {
    throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT files.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum size is 10MB.');
  }
}

async function parseDocument(file) {
  await loadParsers();
  validateFile(file);

  let text = '';
  const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

  if (file.mimetype === 'application/pdf' || ext === '.pdf') {
    const data = await pdfParse(file.buffer);
    text = data.text;
  } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === '.docx') {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    text = result.value;
  } else if (file.mimetype === 'text/plain' || ext === '.txt') {
    text = file.buffer.toString('utf-8');
  }

  if (!text || text.trim().length < 100) {
    throw new Error('Document appears to be empty or too short to generate a curriculum.');
  }

  return text.trim();
}

function slugify(value) {
  return String(value || 'topic')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'topic';
}

function makeTopicTitle(text, fallback = 'Document concept') {
  const clean = String(text || fallback).replace(/\s+/g, ' ').trim();
  const clipped = clean.length > 72 ? `${clean.slice(0, 69).trim()}...` : clean;
  return clipped || fallback;
}

function buildTopicQuiz(topicTitle, contextSentence) {
  return [
    {
      question: `Which statement best explains ${topicTitle}?`,
      options: [
        `It focuses on the core idea described in the document: ${contextSentence}`,
        'It is unrelated to the document and should be skipped.',
        'It only matters if the document is very short.',
        'It is just a random title without meaning.'
      ],
      correctIndex: 0,
      explanation: `The main idea is to understand the concept in context, not memorize a label. ${contextSentence}`,
    },
    {
      question: `Why is ${topicTitle} worth studying?`,
      options: [
        'It helps you connect the document to a practical, usable skill.',
        'It is only useful for experts and not beginners.',
        'It replaces the need to read the document.',
        'It has no relationship to the key topic.'
      ],
      correctIndex: 0,
      explanation: 'Studying the topic creates a clearer mental model and makes it easier to apply the material later.',
    }
  ];
}

function buildDocumentQuiz(documentText, fallbackTitle, fallbackSentence) {
  const sourceQuestions = [...String(documentText || '').matchAll(/\bMCQ\s*\d+\s*:\s*([\s\S]*?)(?=\bMCQ\s*\d+\s*:|$)/gi)]
    .map((match) => match[1].replace(/\s+/g, ' ').trim())
    .map((entry) => {
      const answerMatch = entry.match(/^([\s\S]*?)\bAnswer\s*:\s*([\s\S]*)$/i);
      if (!answerMatch) return null;
      const question = answerMatch[1].replace(/[_-]{2,}/g, '').replace(/\s+/g, ' ').trim();
      const answer = answerMatch[2].replace(/\s+/g, ' ').trim();
      return question && answer ? { question, answer } : null;
    })
    .filter(Boolean);

  const answers = [...new Set(sourceQuestions.map((item) => item.answer))];
  if (sourceQuestions.length >= 1 && answers.length >= 4) {
    return sourceQuestions.slice(0, 5).map((item) => {
      const options = [item.answer, ...answers.filter((answer) => answer !== item.answer).slice(0, 3)];
      return {
        q: item.question,
        choices: options,
        answerIdx: 0,
        why: `The uploaded document identifies "${item.answer}" as the answer.`,
      };
    });
  }

  return buildTopicQuiz(fallbackTitle, fallbackSentence);
}

function buildDocumentLessonFallback(documentText, topicSlug, lessonTitle) {
  const cleanText = String(documentText || '').replace(/\s+/g, ' ').trim();
  const sourceSentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
    .filter((sentence) => sentence.length > 25);

  const conceptLine = sourceSentences[0] || 'This topic is a key concept from your uploaded document.';
  const supportingLine = sourceSentences[1] || 'The document gives practical guidance that becomes clearer when you break it into parts and apply it in a small example.';
  const applicationLine = sourceSentences[2] || 'You can use this idea by explaining it in your own words, connecting it to an example, and checking whether the same principle appears elsewhere.';

  const keyPoints = [
    `Focus on the central idea behind ${lessonTitle}.`,
    'Connect the concept to a concrete example in the document.',
    'Explain it out loud in your own words before moving on.',
    'Check how the idea appears in a real task or decision.'
  ];

  const sections = [
    {
      h: 'Overview',
      body: `${lessonTitle} is a core idea from the uploaded document. ${conceptLine}`
    },
    {
      h: 'Key Concepts',
      body: `${supportingLine} The important part is to recognize the main idea, identify the supporting details, and connect them to the larger argument or process.`
    },
    {
      h: 'Practical Use',
      body: `${applicationLine} Use this knowledge by summarizing it, applying it to one example, and testing whether you can explain it without rereading the document.`
    }
  ];

  const practice = [
    {
      q: `Which summary best captures the meaning of ${lessonTitle}?`,
      choices: [
        `It is the main idea being explained and applied in the document.`,
        'It is a random label with no useful meaning.',
        'It only matters to the author, not the learner.',
        'It should never be connected to examples.'
      ],
      answerIdx: 0,
      why: 'The best summary makes the concept concrete and tied to the document’s purpose.'
    },
    {
      q: 'What should you do right after learning a concept?',
      choices: [
        'Explain it in your own words and apply it to an example.',
        'Ignore it and move on to unrelated content.',
        'Memorize only the title without understanding it.',
        'Delete your notes so the idea feels fresh.'
      ],
      answerIdx: 0,
      why: 'Teaching the concept back to yourself and applying it helps the idea stick.'
    }
  ];

  const quiz = buildDocumentQuiz(cleanText, lessonTitle, conceptLine);

  return {
    topic: topicSlug,
    title: lessonTitle,
    tldr: `${lessonTitle} matters because it helps you grasp the document’s main idea and apply it in a useful way.`,
    ask: `How would you explain ${lessonTitle} in one sentence using your own words?`,
    sections,
    keyPoints,
    practice,
    quiz,
    recall: ['Explain the main idea in your own words.', 'Name one example from the document.', 'State why the concept matters.'],
    summary: `You should now be able to describe ${lessonTitle}, explain why it matters, and connect it to a practical example from the uploaded material.`
  };
}

function localDocumentCurriculum(text, userGoal = '') {
  const sections = String(text || '')
    .split(/\n+|(?<=[.!?])\s+/)
    .map((section) => section.replace(/\s+/g, ' ').trim())
    .filter((section) => section.length >= 25);
  const sourceSections = sections.length ? sections : [String(text || '').replace(/\s+/g, ' ').trim()];

  const buildDayTitle = (dayIndex, section) => {
    const idea = makeTopicTitle(section, `Core idea ${dayIndex}`);
    const phrase = idea.replace(/\s+/g, ' ').trim();
    return `${phrase.slice(0, 48)}${phrase.length > 48 ? '…' : ''}`;
  };

  const days = Array.from({ length: 7 }, (_, dayIndex) => {
    const items = Array.from({ length: 3 }, (_, itemIndex) => {
      const section = sourceSections[(dayIndex * 3 + itemIndex) % sourceSections.length] || sourceSections[0];
      const title = makeTopicTitle(section, `Study item ${dayIndex + 1}-${itemIndex + 1}`);
      const topic = slugify(`${dayIndex + 1}-${title}`);
      return {
        topic,
        title,
        kind: 'study',
        estMin: 12 + itemIndex * 6,
        xp: 15 + itemIndex * 10,
        challengeTemplate: {
          title: `${title} check-in`,
          brief: `Explain ${title.toLowerCase()} in your own words and connect it to the document.`,
          requirements: ['Summarize the idea in plain language', 'Give one concrete example', 'Explain why the idea matters'],
          timeMin: 15,
          passScore: 70,
          rewardNim: 1,
          xp: 40,
          type: 'text',
          submissionFields: ['text'],
          quiz: buildTopicQuiz(title, section) || []
        }
      };
    });

    return {
      index: dayIndex + 1,
      title: `Day ${dayIndex + 1}: ${buildDayTitle(dayIndex + 1, sourceSections[dayIndex % sourceSections.length])}`,
      estMin: 30,
      xp: 60,
      kind: 'study',
      items,
    };
  });

  return {
    skillSlug: 'document-study',
    skillName: userGoal || 'Document study',
    skillEmoji: '📚',
    title: userGoal ? `${userGoal} — Document Path` : 'Document Study Path',
    description: 'A structured seven-day study path built from the ideas, examples, and concepts in your uploaded document.',
    level: 'beginner',
    minutesPerDay: 30,
    totalXp: 7 * 60,
    days,
    keyConcepts: sourceSections.slice(0, 5).map((section, index) => makeTopicTitle(section, `Concept ${index + 1}`)),
    engine: 'proof-engine',
  };
}

function normalizeDocumentCurriculum(curriculum, userGoal = '') {
  const normalized = {
    ...curriculum,
    skillSlug: curriculum.skillSlug || 'document-study',
    skillName: curriculum.skillName || userGoal || 'Document study',
    skillEmoji: curriculum.skillEmoji || '📚',
    title: curriculum.title || `${userGoal || 'Document study'} — Document Path`,
    description: curriculum.description || 'A structured path built from your uploaded document.',
    level: curriculum.level || 'beginner',
    minutesPerDay: Number(curriculum.minutesPerDay) || 30,
    days: Array.isArray(curriculum.days) ? curriculum.days.slice(0, 14) : [],
  };

  normalized.days = normalized.days.map((day, dayIndex) => {
    const sourceItems = Array.isArray(day.items) ? day.items.slice(0, 3) : [];
    const items = sourceItems.map((item, itemIndex) => ({
      ...item,
      topic: item.topic || slugify(`${dayIndex + 1}-${item.title || `document-concept-${itemIndex + 1}`}`),
      title: item.title || `Document concept ${dayIndex + 1}.${itemIndex + 1}`,
      kind: itemIndex === sourceItems.length - 1 ? 'proof' : 'study',
      estMin: Number(item.estMin) || (itemIndex === sourceItems.length - 1 ? 18 : 15),
      xp: Number(item.xp) || (itemIndex === sourceItems.length - 1 ? 50 : 20),
    }));

    if (items.length < 3) {
      items.push({
        topic: slugify(`${dayIndex + 1}-document-proof`),
        title: `Day ${dayIndex + 1} document proof`,
        kind: 'proof', estMin: 18, xp: 50,
      });
    }

    const proof = items.at(-1);
    proof.kind = 'proof';
    proof.challengeTemplate = proof.challengeTemplate || {
      title: `Prove: ${proof.title}`,
      brief: `Explain ${proof.title} in your own words, connect it to the uploaded document, and give one concrete example.`,
      requirements: ['summarize the idea in plain language', 'connect it to the document', 'give one concrete example'],
      timeMin: 18, passScore: 70, rewardNim: 1, xp: 50, type: 'text', submissionFields: ['text'],
    };

    const studyItems = items.slice(0, -1).map(({ challengeTemplate, ...item }) => item);
    return {
      ...day,
      index: dayIndex + 1,
      kind: 'proof',
      title: day.title || `Day ${dayIndex + 1}: Document study`,
      items: [...studyItems, proof],
      estMin: studyItems.reduce((sum, item) => sum + item.estMin, 0) + proof.estMin,
      xp: studyItems.reduce((sum, item) => sum + item.xp, 0) + proof.xp,
      rewardNim: Number(day.rewardNim) || proof.challengeTemplate.rewardNim || 1,
    };
  });

  normalized.totalXp = normalized.days.reduce((sum, day) => sum + day.xp, 0);
  normalized.engine = curriculum.engine || 'document-ai';
  return normalized;
}

async function analyzeDocumentWithAI(text, userGoal = '') {
  if (!llmEnabled()) return localDocumentCurriculum(text, userGoal);

  const systemPrompt = `You are PROOF's document-learning architect. Read the supplied document as the source of truth before designing the curriculum. Extract its central thesis, named people and organizations, definitions, claims, examples, procedures, and evidence. Build a progressive 7-day path from those facts. Do not invent facts, citations, topics, or examples that are not supported by the document. Keep JSON complete, valid, and concise.`;

  // Reduced from 8000 to 4000 chars to prevent HTTP 413 (Request Too Large)
  const textSample = text.slice(0, 4000);
  const userPrompt = `
Read this document carefully, create a compact internal digest, then create a 7-day curriculum from that digest.

Planning requirements:
- Identify the document's main purpose and 4-8 factual concepts before sequencing lessons.
- Start with orientation and vocabulary, then move through the document's major ideas, examples, and implications.
- Give each lesson one distinct concept and a title that reflects the document, not a generic filler phrase.
- Keep every lesson grounded in the supplied text. If a detail is unclear or absent, do not guess.
- Make proof tasks ask learners to explain or apply ideas that actually appear in the document.

Document excerpt:
${textSample}

Goal: ${userGoal || 'Learn this material'}

Return JSON (7 days, 3 lessons each):
{
  "skillSlug": "short-name",
  "skillName": "Name",
  "skillEmoji": "📚",
  "title": "Title",
  "description": "Description (max 150 chars)",
  "level": "beginner",
  "minutesPerDay": 30,
  "totalXp": 350,
  "days": [
    {"index": 1, "title": "Day 1 Title", "estMin": 30, "xp": 50, "kind": "study", "items": [
      {"topic": "topic-1", "title": "Lesson 1", "kind": "study", "estMin": 10, "xp": 15},
      {"topic": "topic-2", "title": "Lesson 2", "kind": "study", "estMin": 10, "xp": 15},
      {"topic": "topic-3", "title": "Lesson 3", "kind": "study", "estMin": 10, "xp": 20}
    ]}
  ],
  "keyConcepts": ["concept1", "concept2", "concept3", "concept4"]
}

Keep it complete and valid. 7 days exactly.`;

  try {
    const curriculum = await llmJson({
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 2500 // Increased for 7 days
    });
    
    // Validate structure
    if (!curriculum.skillSlug || !curriculum.days || !Array.isArray(curriculum.days)) {
      throw new Error('Invalid curriculum structure from AI');
    }
    
    // Ensure we have at least some content
    if (curriculum.days.length === 0) {
      throw new Error('Curriculum has no days');
    }
    
    const normalized = normalizeDocumentCurriculum(curriculum, userGoal);
    const qualityErrors = checkLearningPath(normalized);
    if (qualityErrors.length) throw new Error(`CURRICULUM_QUALITY: ${qualityErrors.join('; ')}`);
    return normalized;
  } catch (e) {
    console.error('[DocumentCurriculum] AI generation failed:', e);
    console.error('[DocumentCurriculum] Error details:', {
      message: e.message,
      stack: e.stack,
      name: e.name
    });
    throw new Error(`Failed to generate curriculum: ${e.message}`);
  }
}

async function createCurriculumFromDocument(userId, file, userGoal = '') {
  const text = await parseDocument(file);
  const curriculum = normalizeDocumentCurriculum(await analyzeDocumentWithAI(text, userGoal), userGoal);
  const qualityErrors = checkLearningPath(curriculum);
  if (qualityErrors.length) throw new Error(`CURRICULUM_QUALITY: ${qualityErrors.join('; ')}`);

  const pathId = uid('docpath');
  const pathRecord = {
    id: pathId,
    userId,
    goal: userGoal || curriculum.title,
    skillSlug: curriculum.skillSlug,
    skillName: curriculum.skillName,
    skillEmoji: curriculum.skillEmoji,
    title: curriculum.title,
    description: curriculum.description,
    level: curriculum.level,
    minutesPerDay: curriculum.minutesPerDay,
    days: curriculum.days,
    totalXp: curriculum.totalXp,
    engine: 'document-ai',
    progress: {},
    sourceDocument: {
      originalName: file.originalname,
      size: file.size,
      uploadedAt: now(),
      textLength: text.length,
      content: text.slice(0, 50000), // Store first 50k chars for lesson generation
    },
    isFromDocument: true,
    createdAt: now(),
  };

  await store.insert('paths', pathRecord);

  // Create challenges for proof days
  for (const day of curriculum.days) {
    for (const item of day.items) {
      if (item.challengeTemplate || day.kind !== 'study') {
        const template = item.challengeTemplate || {
          title: item.title,
          brief: `Prove your understanding of ${item.title}`,
          requirements: [`Explain ${item.title} in your own words`, 'Provide a practical example'],
          timeMin: 15,
          passScore: 70,
          rewardNim: 1,
          xp: 50,
          type: 'text',
          submissionFields: ['text'],
        };

        const chId = uid('ch');
        const challenge = {
          id: chId,
          skillSlug: curriculum.skillSlug,
          pathId,
          dayIndex: day.index,
          kind: day.kind === 'final' ? 'final' : day.kind === 'project' ? 'project' : 'checkpoint',
          type: template.type || 'text',
          title: template.title,
          brief: template.brief,
          requirements: template.requirements || [],
          timeMin: template.timeMin,
          passScore: template.passScore,
          rewardNim: template.rewardNim,
          xp: template.xp,
          evaluator: {
            type: template.type || 'text',
            config: template.evaluator?.config || {},
            submissionFields: template.submissionFields || ['text'],
            quiz: template.quiz || null,
            isFromDocument: true,
            documentPathId: pathId,
          },
          createdAt: now(),
        };

        await store.insert('challenges', challenge);
        item.challengeId = chId;
      }
    }
  }

  // Update path with challenge IDs
  await store.update('paths', pathId, { days: curriculum.days });

  return { path: pathRecord, curriculum };
}

async function getUserDocumentCurricula(userId) {
  const paths = await store.filter('paths', (p) => p.userId === userId && p.isFromDocument);
  return paths.sort((a, b) => b.createdAt - a.createdAt);
}

async function getDocumentCurriculum(userId, pathId) {
  const path = await store.get('paths', pathId);
  if (!path || path.userId !== userId || !path.isFromDocument) {
    throw new Error('Document curriculum not found');
  }
  return path;
}

/**
 * Generate lesson content for a specific topic in a document-based curriculum
 */
async function generateDocumentLesson(skillSlug, topicSlug) {
  // Find the path that contains this lesson
  const paths = await store.filter('paths', (p) => p.skillSlug === skillSlug && p.isFromDocument);
  
  if (paths.length === 0) {
    return {
      topic: topicSlug,
      title: 'Document no longer available',
      tldr: 'This uploaded document was deleted, so its lesson content is no longer available.',
      sections: [{
        h: 'Document removed',
        body: 'Return to Learning to choose another path or upload the document again.'
      }],
      keyPoints: ['The source document is no longer available.', 'Choose another learning path or upload the document again.'],
      practice: [],
      quiz: [],
      recall: [],
      summary: 'This document curriculum has been deleted.'
    };
  }
  
  const path = paths[0];
  
  // Find the lesson in the curriculum structure
  let lessonTitle = topicSlug;
  for (const day of path.days) {
    const item = day.items.find(i => i.topic === topicSlug);
    if (item) {
      lessonTitle = item.title;
      break;
    }
  }
  
  // Generate lesson content using AI with document context
  const { llmJson } = await import('../ai/providers.js');
  
  // Keep enough source text for the model to find the requested topic and
  // cross-check quiz answers without sending the entire upload.
  const documentExcerpt = path.sourceDocument?.content 
    ? path.sourceDocument.content.slice(0, 12000)
    : '';
  
  if (!documentExcerpt) {
    throw new Error('Document content not available');
  }
  
  const systemPrompt = `You are PROOF's document lesson writer. Treat the uploaded document as the only factual source. First identify the passages relevant to the requested topic, then teach them clearly. Preserve names, definitions, dates, institutions, examples, and relationships accurately. Do not repeat raw MCQ stems, invent details, or turn the lesson title into an answer. Separate document facts from suggested study guidance.`;
  
  const userPrompt = `
Create a comprehensive lesson for "${lessonTitle}" from this document.

Document excerpt:
${documentExcerpt}

Return JSON:
{
  "topic": "${topicSlug}",
  "title": "${lessonTitle}",
  "sections": [
    {
      "heading": "Introduction",
      "paragraphs": ["What this topic is about (3-4 sentences)", "Why it matters (2-3 sentences)"]
    },
    {
      "heading": "Key Concepts",
      "paragraphs": ["First main concept explained (3-4 sentences)", "Second main concept (3-4 sentences)", "Third concept if relevant (3-4 sentences)"]
    },
    {
      "heading": "Practical Examples",
      "paragraphs": ["Real-world example 1 (3-4 sentences)", "Example 2 or how to apply (3-4 sentences)"]
    }
  ],
  "keyPoints": ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3", "Key takeaway 4"],
  "practice": [
    {"question": "Practice question 1?", "hint": "Helpful hint"},
    {"question": "Practice question 2?", "hint": "Helpful hint"},
    {"question": "Challenge question?", "hint": "Helpful hint"}
  ],
  "quiz": [
    {
      "question": "A question answered by the document",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this is correct"
    },
    {
      "question": "Quiz question 2?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 1,
      "explanation": "Why this is correct"
    }
  ],
  "summary": "Comprehensive 2-3 sentence summary of what was learned"
}

Quiz rules:
- Prefer extracting the document's own MCQ questions when they exist.
- Preserve each source question's meaning and correct answer.
- Build three plausible distractors from related facts in the same document; never use filler options such as "none of the above" or unrelated generic statements.
- Every option must be a concise answer to the question, and exactly one option must be correct.
- If the document does not contain enough evidence for a quiz question, do not invent one.

Make it educational and complete: 3 sections, 4 key points, 3 practice questions, and up to 5 evidence-based quiz questions.`;

  if (!llmEnabled()) {
    return buildDocumentLessonFallback(documentExcerpt, topicSlug, lessonTitle);
  }

  try {
    const lesson = await llmJson({
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 1500 // Increased from 500 for complete lessons with quizzes
    });
    
    return lesson;
  } catch (e) {
    console.error('[DocumentLesson] Failed to generate lesson:', e);
    return buildDocumentLessonFallback(documentExcerpt, topicSlug, lessonTitle);
  }
}

const TUTOR_STOP_WORDS = new Set([
  'about', 'after', 'also', 'answer', 'does', 'from', 'give', 'into', 'just',
  'like', 'that', 'the', 'this', 'what', 'when', 'where', 'which', 'with',
  'would', 'your', 'you', 'please', 'tell', 'explain', 'document',
]);

function findDocumentEvidence(documentText, question) {
  const terms = String(question || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((term) => term.length > 2 && !TUTOR_STOP_WORDS.has(term));
  if (!terms.length) return '';

  const chunks = String(documentText || '')
    .split(/\n{2,}|(?<=[.!?])\s+/)
    .map((chunk) => chunk.replace(/\s+/g, ' ').trim())
    .filter((chunk) => chunk.length >= 35);

  return chunks
    .map((chunk, index) => {
      const normalized = chunk.toLowerCase();
      const score = terms.reduce((total, term) => total + (normalized.includes(term) ? 1 : 0), 0);
      return { chunk, index, score };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 2)
    .map((candidate) => candidate.chunk)
    .join('\n\n');
}

function buildDocumentTutorFallback({ question, documentText, lesson }) {
  const normalizedQuestion = String(question || '').toLowerCase().trim();
  const practice = Array.isArray(lesson?.practice) ? lesson.practice : [];
  if (/\b(exercise|practice|quiz|test me)\b/.test(normalizedQuestion) && practice.length) {
    const item = practice[0];
    return {
      intent: 'exercise',
      reply: `Try this from the lesson:\n\n${item.q || item.question}${item.choices?.length ? `\n\n${item.choices.map((choice, index) => `${'ABCD'[index]}. ${choice}`).join('\n')}` : ''}`,
      engine: 'proof-engine',
    };
  }

  const evidence = findDocumentEvidence(documentText, question);
  if (evidence) {
    return {
      intent: 'explain',
      reply: `Based on your uploaded document:\n\n${evidence}\n\nThat is the closest passage I found for your question. Ask me about another phrase or section and I’ll trace it back to the document.`,
      engine: 'proof-engine',
    };
  }

  const lessonPoint = lesson?.keyPoints?.[0] || lesson?.tldr;
  return {
    intent: 'coach',
    reply: `I could not find a passage in the uploaded document that answers that precisely. The current lesson focuses on ${lesson?.title || 'this topic'}.${lessonPoint ? ` The main takeaway here is: ${lessonPoint}` : ''}\n\nTry naming a person, concept, or phrase from the document and I’ll search for it directly.`,
    engine: 'proof-engine',
  };
}

async function documentTutorReply({ skillSlug, topicSlug, pathId = '', question, history = [], lessonContext }) {
  const paths = await store.filter('paths', (path) =>
    path.isFromDocument && (!pathId || path.id === pathId) && path.skillSlug === skillSlug
  );
  const path = paths[0];

  if (!path) {
    return {
      intent: 'generic',
      reply: 'This uploaded document is no longer available. Return to Learning to choose another path or upload the document again.',
      engine: 'proof-engine',
    };
  }

  const item = (path.days || []).flatMap((day) => day.items || []).find((candidate) => candidate.topic === topicSlug);
  const lessonTitle = item?.title || topicSlug.replace(/-/g, ' ');
  const documentExcerpt = path.sourceDocument?.content?.slice(0, 5000) || '';
  const localLesson = lessonContext || buildDocumentLessonFallback(documentExcerpt, topicSlug, lessonTitle);

  if (!llmEnabled()) {
    return buildDocumentTutorFallback({ question, documentText: path.sourceDocument?.content || '', lesson: localLesson });
  }

  try {
    const response = await llmJson({
      system: 'You are PROOF Document Tutor. First understand the uploaded document and the current lesson digest, then answer the learner question accurately. Use only those sources. Do not repeat the question, lesson title, or raw MCQ text. If the sources do not contain the answer, say that clearly and ask for a more specific term or section. For exercises, guide without revealing the answer. Return JSON: {"reply": string, "intent": "explain|simplify|example|exercise|hint|coach"}.',
      prompt: JSON.stringify({
        lessonTitle,
        lessonContext: localLesson,
        documentExcerpt,
        question,
        history: history.slice(-6),
      }),
      maxTokens: 700,
    });
    if (!response || typeof response.reply !== 'string' || !response.reply.trim()) {
      throw new Error('INVALID_TUTOR_RESPONSE');
    }
    return { reply: response.reply, intent: response.intent || 'explain', engine: 'llm+document' };
  } catch (error) {
    console.error('[DocumentTutor] Falling back to document lesson:', error.message);
    return {
      intent: 'explain',
      reply: `${localLesson.tldr}\n\n${localLesson.sections[0].body}\n\nKey points:\n${localLesson.keyPoints.map((point) => `• ${point}`).join('\n')}`,
      engine: 'proof-engine',
    };
  }
}

export {
  localDocumentCurriculum,
  buildDocumentLessonFallback,
  parseDocument,
  analyzeDocumentWithAI,
  createCurriculumFromDocument,
  getUserDocumentCurricula,
  getDocumentCurriculum,
  generateDocumentLesson,
  documentTutorReply,
};