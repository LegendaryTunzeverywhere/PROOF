/**
 * Document Curriculum Service
 * Parses uploaded documents (PDF, DOCX, TXT) and generates personalized
 * learning curriculum using AI. Each curriculum is unique to the user.
 */
import { store } from '../index.js';
import { uid, now } from '../util.js';
import { generateLearningPath, generateLesson } from '../ai/service.js';
import { llmEnabled, llmJson } from '../ai/providers.js';

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

function localDocumentCurriculum(text, userGoal = '') {
  const sections = text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((section) => section.replace(/\s+/g, ' ').trim())
    .filter((section) => section.length >= 20);
  const sourceSections = sections.length ? sections : [text.replace(/\s+/g, ' ').trim()];
  const lessonTitle = (section, index) => {
    const words = section.split(' ').slice(0, 8).join(' ');
    return `${words || 'Document fundamentals'}${words.endsWith('.') ? '' : '...'} (${index + 1})`;
  };

  const days = Array.from({ length: 7 }, (_, dayIndex) => ({
    index: dayIndex + 1,
    title: `Document study day ${dayIndex + 1}`,
    estMin: 30,
    xp: 50,
    kind: 'study',
    items: Array.from({ length: 3 }, (_, itemIndex) => {
      const index = dayIndex * 3 + itemIndex;
      const section = sourceSections[index % sourceSections.length];
      return {
        topic: `document-${dayIndex + 1}-${itemIndex + 1}`,
        title: lessonTitle(section, index),
        kind: 'study',
        estMin: 10,
        xp: 15 + (itemIndex === 2 ? 5 : 0),
      };
    }),
  }));

  return {
    skillSlug: 'document-study',
    skillName: userGoal || 'Document study',
    skillEmoji: '📚',
    title: userGoal ? `${userGoal} — Document Path` : 'Document Study Path',
    description: 'A structured seven-day study path generated from your document.',
    level: 'beginner',
    minutesPerDay: 30,
    totalXp: 350,
    days,
    keyConcepts: sourceSections.slice(0, 4).map((section, index) => lessonTitle(section, index)),
    engine: 'proof-engine',
  };
}

async function analyzeDocumentWithAI(text, userGoal = '') {
  if (!llmEnabled()) return localDocumentCurriculum(text, userGoal);

  const systemPrompt = `Create comprehensive learning curricula. Keep JSON complete and valid.`;

  // Reduced from 8000 to 4000 chars to prevent HTTP 413 (Request Too Large)
  const textSample = text.slice(0, 4000);
  const userPrompt = `
Create a 7-day curriculum from this document.

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
    
    return curriculum;
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
  const curriculum = await analyzeDocumentWithAI(text, userGoal);

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
          kind: day.kind === 'final' ? 'final' : day.kind === 'project' ? 'project' : 'checkpoint',
          type: template.type || 'text',
          title: template.title,
          brief: template.brief,
          requirements: template.requirements || [],
          timeMin: template.timeMin,
          passScore: template.passScore,
          rewardNim: template.rewardNim,
          xp: template.xp,
          submissionFields: template.submissionFields || ['text'],
          quiz: template.quiz || null,
          isFromDocument: true,
          documentPathId: pathId,
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
    throw new Error('Document curriculum not found for this skill');
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
  
  // Limit document excerpt to prevent HTTP 413 errors
  // Groq has strict request size limits, so we use a small excerpt
  const documentExcerpt = path.sourceDocument?.content 
    ? path.sourceDocument.content.slice(0, 3000) // Reduced from 6000 to 3000 chars
    : '';
  
  if (!documentExcerpt) {
    throw new Error('Document content not available');
  }
  
  const systemPrompt = `You are an expert educator. Create comprehensive, engaging lesson content based on the provided document.`;
  
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
      "question": "Quiz question 1?",
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

Make it educational and complete - 3 sections, 4 key points, 3 practice questions, 2 quiz questions.`;

  try {
    const lesson = await llmJson({
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 1500 // Increased from 500 for complete lessons with quizzes
    });
    
    return lesson;
  } catch (e) {
    console.error('[DocumentLesson] Failed to generate lesson:', e);
    // Return fallback structure
    return {
      topic: topicSlug,
      title: lessonTitle,
      sections: [
        {
          heading: 'Overview',
          paragraphs: [
            `This lesson covers ${lessonTitle}.`,
            'The content is derived from your uploaded document.'
          ]
        }
      ],
      keyPoints: [],
      practice: [],
      summary: `Learn about ${lessonTitle} from your document.`
    };
  }
}

export {
  parseDocument,
  analyzeDocumentWithAI,
  createCurriculumFromDocument,
  getUserDocumentCurricula,
  getDocumentCurriculum,
  generateDocumentLesson,
};