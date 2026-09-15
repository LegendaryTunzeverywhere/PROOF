/**
 * ProofEngine — the local, deterministic intelligence behind PROOF.
 * Works with zero API keys: generates learning paths, delivers lessons,
 * runs tutor conversations, identifies weaknesses, recommends next skills.
 * When an LLM key is configured, AIService blends this engine with the
 * provider (engine output is always the authoritative structure).
 */
import { KB, SKILLS, suggestDomain, topicBySlug, skillKb } from './kb.js';
import { clamp, seededPick } from '../util.js';
import { learningDesign } from './curriculum-quality.js';

const STUDY_MIN = 25;

const LANGUAGE_OPTIONS = {
  french: { code: 'fr', name: 'French', emoji: '🇫🇷', hello: 'Bonjour', goodbye: 'Au revoir', namePhrase: 'Je m’appelle', request: 'Je voudrais', thanks: 'Merci', please: 's’il vous plaît', yes: 'Oui', no: 'Non', where: 'Où est', past: 'J’ai', future: 'Je vais', opinion: 'À mon avis', connector: 'parce que', formal: 'vous' },
  spanish: { code: 'es', name: 'Spanish', emoji: '🇪🇸', hello: 'Hola', goodbye: 'Adiós', namePhrase: 'Me llamo', request: 'Quisiera', thanks: 'Gracias', please: 'por favor', yes: 'Sí', no: 'No', where: 'Dónde está', past: 'He', future: 'Voy a', opinion: 'En mi opinión', connector: 'porque', formal: 'usted' },
  german: { code: 'de', name: 'German', emoji: '🇩🇪', hello: 'Hallo', goodbye: 'Auf Wiedersehen', namePhrase: 'Ich heiße', request: 'Ich hätte gern', thanks: 'Danke', please: 'bitte', yes: 'Ja', no: 'Nein', where: 'Wo ist', past: 'Ich habe', future: 'Ich werde', opinion: 'Meiner Meinung nach', connector: 'weil', formal: 'Sie' },
  portuguese: { code: 'pt', name: 'Portuguese', emoji: '🇵🇹', hello: 'Olá', goodbye: 'Até logo', namePhrase: 'Eu me chamo', request: 'Eu gostaria de', thanks: 'Obrigado/a', please: 'por favor', yes: 'Sim', no: 'Não', where: 'Onde fica', past: 'Eu tenho', future: 'Eu vou', opinion: 'Na minha opinião', connector: 'porque', formal: 'você' },
  mandarin: { code: 'zh', name: 'Mandarin', emoji: '🇨🇳', hello: '你好 (nǐ hǎo)', goodbye: '再见 (zài jiàn)', namePhrase: '我叫 (wǒ jiào)', request: '我想要 (wǒ xiǎng yào)', thanks: '谢谢 (xièxie)', please: '请 (qǐng)', yes: '是 (shì)', no: '不 (bù)', where: '在哪里 (zài nǎlǐ)', past: '我已经 (wǒ yǐjīng)', future: '我会 (wǒ huì)', opinion: '我认为 (wǒ rènwéi)', connector: '因为 (yīnwèi)', formal: '您 (nín)' },
};

function languageForGoal(goal = '') {
  const normalized = String(goal).toLowerCase();
  return Object.entries(LANGUAGE_OPTIONS).find(([key, language]) =>
    normalized.includes(key) || normalized.includes(language.name.toLowerCase())
  )?.[1] || LANGUAGE_OPTIONS.french;
}

function languageCurriculum(language) {
  const prefix = language.code;
  const phrase = (target, meaning, note = '') => ({ target, meaning, note });
  const speechChallenge = (title, target, meaning, xp = 90) => ({
    type: 'speech', kind: 'checkpoint', title, timeMin: 12,
    brief: `Listen to the model, then say “${target}” aloud in ${language.name}. The app compares your spoken transcript with the target phrase.`,
    requirements: ['listen to the model phrase', 'speak the phrase aloud', 'match the target words clearly'],
    passScore: 70, rewardNim: 1, xp,
    evaluator: { type: 'speech', config: { language: prefix, targets: [target], minWords: Math.max(1, target.split(/\s+/).length), similarity: 0.72 } },
  });
  const conversationChallenge = (title, brief, minTurns, rewardNim, xp) => ({
    type: 'conversation', kind: 'checkpoint', title, timeMin: 25, brief,
    requirements: [`at least ${minTurns} dialogue turns`, 'use the target language throughout', 'respond naturally to the situation', 'include a clear meaning or gloss'],
    passScore: 70, rewardNim, xp,
    evaluator: { type: 'conversation', config: { lang: prefix, minTurns, minWords: minTurns * 8, lexicon: [language.hello, language.thanks, language.goodbye, language.connector] } },
  });
  const topic = (level, slug, title, objective, phrases, challenge) => ({
    slug: `${prefix}-${slug}`, title: `${level} · ${title}`, estMin: level === 'C1' ? 45 : 30,
    difficulty: ['A1', 'A2', 'B1', 'B2', 'C1'].indexOf(level) + 1,
    cefr: level,
    lesson: {
      tldr: objective,
      sections: [
        { h: 'What you will do', body: objective },
        { h: 'Language you can use', body: phrases.map((item) => `${item.target} = ${item.meaning}${item.note ? ` (${item.note})` : ''}`).join('\n') },
        { h: 'Listen, notice, say', body: `Listen to each model phrase, notice its rhythm, then say it back slowly and once at natural speed. ${language.name} rewards clear meaning before perfect accent.` },
      ],
      example: { lang: 'text', code: phrases.map((item) => `${item.target} — ${item.meaning}`).join('\n') },
      ask: `How would you use “${phrases[0].target}” in a real ${language.name} conversation?`,
      keyPoints: phrases.map((item) => `${item.target} = ${item.meaning}`),
      misconception: 'Pronunciation practice is not a one-shot accent test. Listen, try, compare, and try again.',
    },
    practice: phrases.slice(0, 2).map((item, index) => ({
      q: `What does “${item.target}” mean?`,
      choices: [item.meaning, phrases[(index + 1) % phrases.length].meaning, 'A question about spelling', 'A goodbye only'],
      answerIdx: 0,
      why: `“${item.target}” is used to mean ${item.meaning}.`,
    })),
    quiz: phrases.slice(0, 2).map((item, index) => ({
      q: `Choose the ${language.name} phrase for “${item.meaning}”.`,
      choices: [item.target, phrases[(index + 1) % phrases.length].target, language.yes, language.no],
      answerIdx: 0,
      why: `The correct phrase is “${item.target}”.`,
    })),
    recall: phrases.map((item) => `Say “${item.target}” aloud, then explain: ${item.meaning}.`),
    challenge,
  });

  const topics = [
    topic('A1', 'survival', 'Greetings, names, and sounds', 'Handle the first thirty seconds of a conversation and build confidence with the sound system.', [phrase(language.hello, 'hello'), phrase(language.namePhrase, 'my name is'), phrase(language.goodbye, 'goodbye')], null),
    topic('A1', 'everyday-needs', 'Numbers, time, and simple requests', 'Ask for a basic item, understand a number, and use polite language in a short exchange.', [phrase(language.request, 'I would like'), phrase(language.please, 'please'), phrase(language.thanks, 'thank you')], speechChallenge(`Say essential ${language.name} phrases`, `${language.request} ${language.please}`, 'I would like … please')),
    topic('A1', 'places-and-directions', 'Places and directions', 'Ask where something is and follow a short, practical direction.', [phrase(language.where, 'where is'), phrase(language.yes, 'yes'), phrase(language.no, 'no')], null),
    topic('A1', 'listen-and-repeat', 'Listening loop: hear, copy, improve', 'Use a three-pass listening routine: hear the phrase, repeat it, then produce it without looking.', [phrase(language.hello, 'hello'), phrase(language.request, 'I would like'), phrase(language.goodbye, 'goodbye')], speechChallenge(`Listen and speak: ${language.name} basics`, language.hello, 'hello', 100)),
    topic('A2', 'daily-life', 'Daily routines and descriptions', 'Describe your day, your home, and familiar people with connected sentences.', [phrase(language.past, 'I have / I did'), phrase(language.future, 'I am going to / I will'), phrase(language.connector, 'because')], null),
    topic('A2', 'travel', 'Travel, food, and problem solving', 'Navigate a trip, order food, and explain a simple problem politely.', [phrase(language.where, 'where is'), phrase(language.request, 'I would like'), phrase(language.please, 'please')], speechChallenge(`Speak through a ${language.name} travel moment`, `${language.where} la station`, 'Where is the station?')),
    topic('A2', 'social-talk', 'Plans, invitations, and preferences', 'Invite someone, accept or decline, and give a simple reason.', [phrase(language.future, 'I will / I am going to'), phrase(language.yes, 'yes'), phrase(language.no, 'no'), phrase(language.connector, 'because')], null),
    topic('A2', 'pronunciation', 'Pronunciation clinic and connected speech', 'Shadow short phrases, link sounds naturally, and make yourself easy to understand.', [phrase(language.hello, 'hello'), phrase(language.thanks, 'thank you'), phrase(language.goodbye, 'goodbye')], speechChallenge(`Pronunciation clinic: ${language.name}`, `${language.thanks} ${language.please}`, 'Thank you, please', 110)),
    topic('B1', 'stories', 'Past experiences and stories', 'Tell a short story with a clear beginning, sequence, and ending.', [phrase(language.past, 'I did / I have'), phrase(language.connector, 'because'), phrase(language.opinion, 'in my opinion')], null),
    topic('B1', 'work-and-study', 'Work, study, and practical conversations', 'Explain your responsibilities, ask for clarification, and keep a conversation moving.', [phrase(language.formal, 'formal you'), phrase(language.connector, 'because'), phrase(language.opinion, 'in my opinion')], speechChallenge(`Speak about your day in ${language.name}`, `${language.opinion} ${language.connector}`, 'In my opinion … because …', 120)),
    topic('B1', 'opinions', 'Opinions, comparisons, and reasons', 'Give an opinion, compare alternatives, and support your view with a concrete reason.', [phrase(language.opinion, 'in my opinion'), phrase(language.connector, 'because'), phrase(language.future, 'I will / I am going to')], null),
    topic('B1', 'conversation', 'Conversation repair and fluency', 'Ask someone to repeat, reformulate an idea, and recover when you do not know a word.', [phrase(language.formal, 'formal you'), phrase(language.please, 'please'), phrase(language.connector, 'because')], speechChallenge(`Repair a conversation in ${language.name}`, language.please, 'please / a polite repair phrase', 125)),
    topic('B2', 'nuance', 'Nuance, register, and politeness', 'Shift between informal and formal language and choose a phrase that fits the relationship.', [phrase(language.formal, 'formal you'), phrase(language.opinion, 'in my opinion'), phrase(language.connector, 'because')], null),
    topic('B2', 'media', 'News, media, and abstract topics', 'Summarize a viewpoint, distinguish fact from opinion, and discuss an unfamiliar topic.', [phrase(language.opinion, 'in my opinion'), phrase(language.past, 'I have / I did'), phrase(language.future, 'I will / I am going to')], speechChallenge(`Summarize an idea in ${language.name}`, language.opinion, 'In my opinion', 135)),
    topic('B2', 'debate', 'Discussion, disagreement, and negotiation', 'Disagree respectfully, qualify a claim, and negotiate a practical outcome.', [phrase(language.opinion, 'in my opinion'), phrase(language.connector, 'because'), phrase(language.formal, 'formal you')], null),
    topic('B2', 'presentation', 'Presentations and persuasive speaking', 'Deliver a structured explanation with signposting, emphasis, and a clear conclusion.', [phrase(language.opinion, 'in my opinion'), phrase(language.connector, 'because'), phrase(language.future, 'I will / I am going to')], speechChallenge(`Deliver a clear ${language.name} opening`, `${language.opinion} ${language.connector}`, 'In my opinion … because …', 145)),
    topic('C1', 'precision', 'Precision, idiom, and implied meaning', 'Choose exact language, interpret what is implied, and avoid false friends or literal translations.', [phrase(language.opinion, 'in my opinion'), phrase(language.connector, 'because'), phrase(language.formal, 'formal you')], null),
    topic('C1', 'professional', 'Professional and academic communication', 'Write and speak with an appropriate register in a complex professional or academic situation.', [phrase(language.formal, 'formal you'), phrase(language.opinion, 'in my opinion'), phrase(language.future, 'I will / I am going to')], speechChallenge(`Professional speaking in ${language.name}`, language.formal, 'formal you', 155)),
    topic('C1', 'critical-thinking', 'Critical discussion and synthesis', 'Synthesize multiple viewpoints, qualify evidence, and defend a nuanced position.', [phrase(language.opinion, 'in my opinion'), phrase(language.connector, 'because'), phrase(language.past, 'I have / I did')], null),
    topic('C1', 'mastery', 'C1 conversation mastery', 'Sustain an unprepared conversation, handle ambiguity, and make your meaning precise without translating in your head.', [phrase(language.hello, 'hello'), phrase(language.opinion, 'in my opinion'), phrase(language.goodbye, 'goodbye')], conversationChallenge(`Sustain a nuanced ${language.name} conversation`, `Hold a ${minTurnsLabel(12)} conversation in ${language.name} about a complex real-world issue. Ask follow-up questions, give reasons, reformulate once, and close naturally.`, 12, 4, 220)),
  ];

  return {
    topics,
    finalAssessment: {
      type: 'conversation', kind: 'final', title: `C1 Final Assessment: ${language.name} Fluency`, timeMin: 55,
      brief: `Complete a ${minTurnsLabel(16)} ${language.name} conversation and a short written reflection about a complex real-world topic. Defend a position, ask follow-up questions, reformulate an idea, and close naturally.`,
      requirements: ['at least 16 dialogue turns', 'clear argument and counterpoint', 'follow-up questions', 'natural register and connectors'],
      passScore: 75, rewardNim: 6, xp: 300,
      evaluator: { type: 'conversation', config: { lang: prefix, minTurns: 16, minWords: 180, lexicon: [language.hello, language.thanks, language.goodbye, language.opinion, language.connector] } },
    },
  };
}

const minTurnsLabel = (count) => `${count}+ turn`;

/* ────────────────────────── learning paths ────────────────────────── */
/**
 * @param {{goal:string, domain?:string, level?:string, minutesPerDay?:number, style?:string}} input
 */
export function generateLearningPath(input) {
  const goal = String(input.goal || '').slice(0, 240);
  const suggestion = input.domain && skillKb(input.domain)
    ? { domain: input.domain, confident: true }
    : suggestDomain(goal);
  const selectedLanguage = suggestion.domain === 'languages' ? languageForGoal(goal) : null;
  const kb = selectedLanguage ? languageCurriculum(selectedLanguage) : skillKb(suggestion.domain);
  const skill = selectedLanguage
    ? { name: selectedLanguage.name, emoji: selectedLanguage.emoji }
    : SKILLS.find((s) => s.slug === suggestion.domain);
  const minutesPerDay = clamp(parseInt(input.minutesPerDay, 10) || 30, 15, 120);
  const level = ['novice', 'beginner', 'intermediate', 'advanced'].includes(String(input.level)) ? input.level : null;
  const design = learningDesign(input.style || 'practical');

  let topics = [...kb.topics].sort((a, b) => a.difficulty - b.difficulty);
  if (suggestion.domain !== 'languages') {
    if (level === 'intermediate' && topics.length > 4) topics = topics.slice(1);
    if (level === 'advanced' && topics.length > 4) topics = topics.slice(2);
  }

  const unitsPerDay = clamp(Math.round(minutesPerDay / 20), 1, 3);

  // Build the item sequence: study → proof checkpoints → final assessment.
  const seq = [];
  topics.forEach((t, i) => {
    seq.push({ kind: 'study', topic: t.slug, title: t.title, estMin: t.estMin, xp: 20, rewardNim: 0 });
    const ch = t.challenge;
    const isProject = ch?.kind === 'project';
    if (ch && (isProject || (i + 1) % 2 === 0 || i === topics.length - 1)) {
      seq.push({
        kind: isProject ? 'project' : 'proof',
        topic: t.slug,
        title: ch.title,
        estMin: ch.timeMin,
        xp: ch.xp,
        rewardNim: ch.rewardNim,
        challengeTemplate: ch,
      });
    }
  });
  const fin = kb.finalAssessment;
  if (fin) {
    seq.push({ kind: 'final', topic: topics[topics.length - 1]?.slug, title: fin.title, estMin: fin.timeMin, xp: fin.xp, rewardNim: fin.rewardNim, challengeTemplate: fin });
  }

  // Chunk into days (max 3 units/day), keeping proofs on their own day when day is full.
  const days = [];
  let cur = null;
  for (const item of seq) {
    const heavy = item.kind !== 'study';
    if (!cur || cur.items.length >= unitsPerDay || (heavy && cur.items.length > 0)) {
      cur = { items: [] };
      days.push(cur);
    }
    cur.items.push(item);
  }

  const rewardPool = seq.reduce((a, d) => a + (d.rewardNim || 0), 0);
  const levelLabel = level ? level[0].toUpperCase() + level.slice(1) : 'Beginner';
  return {
    goal,
    domain: suggestion.domain,
    skillSlug: suggestion.domain,
    skillName: skill?.name || suggestion.domain,
    skillEmoji: skill?.emoji || '📚',
    confidentMatch: suggestion.confident,
    title: `${skill?.name || 'Skill'} — ${levelLabel} Path`,
    description: `A ${days.length}-day ${design.label.toLowerCase()} path built from your goal: “${goal}”. The rhythm is ${design.cadence}; ${design.focus}. Earn up to ${rewardPool} NIM through real challenges.`,
    minutesPerDay,
    level: levelLabel,
    style: design.label.toLowerCase(),
    days: days.map((d, i) => {
      const mainItem = d.items.find((x) => x.kind !== 'study') || d.items[0];
      const proofItem = d.items.find((x) => x.kind === 'proof' || x.kind === 'project' || x.kind === 'final');
      return {
        index: i + 1,
        title: proofItem ? `Prove: ${shortTitle(proofItem.title)}` : shortTitle(d.items[0].title),
        kind: proofItem ? (proofItem.kind === 'final' ? 'final' : 'proof') : 'study',
        estMin: d.items.reduce((a, x) => a + x.estMin, 0),
        xp: d.items.reduce((a, x) => a + x.xp, 0),
        rewardNim: d.items.reduce((a, x) => a + (x.rewardNim || 0), 0),
        items: d.items,
      };
    }),
    totalXp: seq.reduce((a, x) => a + x.xp, 0),
    rewardNim: rewardPool,
    meta: {
      engine: 'proof-engine', generatedAt: Date.now(),
      learningDesign: { label: design.label, focus: design.focus, cadence: design.cadence },
    },
  };
}

const shortTitle = (t) => (t.length > 34 ? t.slice(0, 31).trimEnd() + '…' : t);

/* ────────────────────────── lessons & practice ────────────────────── */
export function lessonFor(domain, topicSlug) {
  const selectedLanguage = domain === 'languages'
    ? Object.values(LANGUAGE_OPTIONS).find((language) => topicSlug.startsWith(`${language.code}-`))
    : null;
  const topic = selectedLanguage
    ? languageCurriculum(selectedLanguage).topics.find((item) => item.slug === topicSlug)
    : topicBySlug(domain, topicSlug);
  if (!topic) return null;
  return {
    skillSlug: domain,
    topicSlug: topic.slug,
    title: topic.title,
    estMin: topic.estMin,
    lesson: topic.lesson,
    practice: topic.practice || [],
    // ── enriched "school-like" lesson fields (curriculum upgrade) ──
    objectives: topic.objectives || [],
    story: topic.story || '',
    memoryHook: topic.memoryHook || '',
    quiz: topic.quiz || [],
    recall: topic.recall || [],
    challenge: topic.challenge ? {
      title: topic.challenge.title,
      kind: topic.challenge.kind,
      type: topic.challenge.type,
      rewardNim: topic.challenge.rewardNim,
      xp: topic.challenge.xp,
      timeMin: topic.challenge.timeMin,
      speechTarget: topic.challenge.evaluator?.config?.targets?.[0] || null,
      speechMeaning: topic.challenge.type === 'speech' ? topic.challenge.requirements?.[0] || '' : null,
    } : null,
  };
}

/* ────────────────────────── tutor ─────────────────────────────────── */
/**
 * Intent-based tutoring grounded in the lesson content.
 * @returns {{reply:string, exercise?:object, intent:string}}
 */
export function tutorReply({ domain, topicSlug, question, history = [] }) {
  const topic = topicBySlug(domain, topicSlug);
  if (!topic) {
    return { intent: 'generic', reply: 'Let’s anchor on the current lesson. Ask me about a specific concept from it — or say “exercise” and I’ll give you something to try.' };
  }
  const q = String(question || '').toLowerCase().trim();
  const L = topic.lesson;
  const name = topic.title.replace(/\b\w/g, (m) => m.toLowerCase());

  const wants = (arr) => arr.some((w) => q.includes(w));

  if (!q || wants(['exercise', 'practice', 'quiz me', 'test me', 'try me'])) {
    const ex = topic.practice[Math.floor(Math.random() * Math.max(topic.practice.length, 1))] || synthExercise(topic);
    return {
      intent: 'exercise',
      reply: `Try this one — take your time, and tell me your answer with why:\n\n${ex.q}` +
        (ex.choices ? `\n\n${ex.choices.map((c, i) => `${'ABCD'[i]}. ${c}`).join('\n')}` : ''),
      exercise: { q: ex.q, choices: ex.choices || null, hint: ex.hint },
    };
  }
  if (wants(['hint', 'stuck', 'help me', 'clue']) && history.length) {
    const ex = history.filter((m) => m.role === 'assistant' && m.exerciseHint).at(-1)?.exerciseHint;
    return { intent: 'hint', reply: ex ? `Hint: ${ex}\n\nYou can do it — I won’t give the answer away. Commit to a guess and tell me why.` : 'Break the problem into the smallest piece you can check. Which part feels unsure?' };
  }
  if (wants(['simpler', 'don’t understand', 'dont understand', 'confus', 'eli5', 'explain differently', 'easier'])) {
    const kp = L.keyPoints[0] || L.tldr;
    return { intent: 'simplify', reply: `No jargon this time. ${L.misconception ? `First — forget this myth: ${L.misconception}\n\n` : ''}The one-sentence version: ${kp}\n\nNow in plain words: ${plainVersion(topic)}\n\nDoes that land? Say “example” and I’ll show it in action.` };
  }
  if (wants(['example', 'show me', 'demo', 'sample'])) {
    return { intent: 'example', reply: `Here’s a working example:\n\n${codeBlock(L.example)}\n\nNotice how it uses: ${L.keyPoints.slice(0, 2).join('; ').replace(/\.$/, '')}.\n\nWant to try one yourself? Say “exercise”.` };
  }
  if (wants(['why', 'mistake', 'wrong', 'error', 'bug', 'not working', 'fail'])) {
    return { intent: 'debug', reply: `Let’s debug it together — I won’t fix it for you.\n\nThree most likely culprits in ${name}:\n1. ${L.keyPoints[1] || L.keyPoints[0]}\n2. ${L.misconception || 'A small mismatch between what you wrote and what you meant'}\n3. A detail from the example being skipped\n\nWhich line or step feels suspicious? Describe what you expected vs. what happened.` };
  }
  if (wants(['what is', 'what’s', 'explain', 'how does', 'how do', 'what are'])) {
    const section = L.sections.find((s) => q.split(/\s+/).some((w) => w.length > 3 && s.h.toLowerCase().includes(w) || s.body.toLowerCase().includes(w)));
    return {
      intent: 'explain',
      reply: `${L.tldr}\n\n${section ? `${section.h}: ${section.body}` : L.sections[0].h + ': ' + L.sections[0].body}\n\nKey points:\n${L.keyPoints.map((k) => '• ' + k).join('\n')}\n\nQuick check: ${L.ask}`,
    };
  }
  // default: coach around the goal
  return {
    intent: 'coach',
    reply: `Good question. In ${name}, the thing to hold onto is: ${L.keyPoints[0]}\n\n${L.sections.map((s) => s.h).join(' → ')} is the mental map.\n\nTo make this concrete, tell me: ${L.ask}`,
  };
}

const codeBlock = (ex) => (ex?.code ? ex.code.split('\n').map((l) => '  ' + l).join('\n') : ex?.text || '—');

function plainVersion(topic) {
  const t = topic.title.toLowerCase();
  const map = {
    'html fundamentals': 'HTML is like labeling boxes before moving: every tag tells the browser what the thing IS — a title, a list, a picture — and the browser does the carrying.',
    'css fundamentals': 'If HTML is the skeleton, CSS is the outfit: one rulebook that says how each labeled box should look.',
    'responsive layout': 'Build for the smallest screen first, then let the layout expand like a fold-out map as the screen grows.',
    'javascript basics': 'JavaScript is a recipe book: variables are ingredients, functions are recipes you wrote once and reuse, events are the doorbell that starts a recipe.',
    'the dom & events': 'The page is a live model you can reach into and rearrange — and events are the “user did something” doorbell.',
    'working with apis': 'Your page texts another computer “send me data”, waits politely, and paints the reply. Sometimes the message fails — plan for that.',
  };
  return map[t] || `${topic.lesson.tldr} In practice: ${topic.lesson.keyPoints.join(' · ')}`;
}

function synthExercise(topic) {
  return { q: `In one or two sentences: why does “${topic.lesson.keyPoints[0].toLowerCase()}” matter when working with ${topic.title.toLowerCase()}?`, hint: topic.lesson.ask };
}

/* ────────────────────────── weaknesses & next ─────────────────────── */
export function identifyWeaknesses(evaluation) {
  const weak = (evaluation.criteria || []).filter((c) => c.max > 0 && c.earned / c.max < 0.7);
  return weak.map((c) => ({ area: c.label, advice: c.nextStep || c.improveNote || 'Review this criterion in the lesson.' }));
}

export function recommendNextSkill(userSkillSlugs = [], allSkillSlugs = []) {
  const remaining = SKILLS.filter((s) => !userSkillSlugs.includes(s.slug) && allSkillSlugs.includes(s.slug));
  const demandRank = ['web-development', 'python', 'cybersecurity', 'chess', 'ai', 'nimiq-blockchain', 'ui-design', 'marketing', 'data-analysis', 'writing', 'social-media', 'business', 'languages', 'music-production', 'practical-skills'];
  remaining.sort((a, b) => demandRank.indexOf(a.slug) - demandRank.indexOf(b.slug));
  return remaining.slice(0, 3).map((s) => ({ slug: s.slug, name: s.name, emoji: s.emoji, reason: `High marketplace demand — verified ${s.name} pros are earning on tasks right now.` }));
}

/* ────────────────────────── daily challenge ───────────────────────── */
const DAILY_POOL = [
  { topicKey: 'explain-yesterday', type: 'explain', title: 'Explain one thing you learned yesterday', brief: 'In 60–150 of your own words, explain one concept you learned recently as if teaching a friend. No copying the lesson — teaching proves understanding.', minWords: 50, targetWords: 110, passScore: 70, rewardNim: 1, xp: 50, timeMin: 15, keyConcepts: [] },
  { topicKey: 'teach-back', type: 'explain', title: 'Teach-back: your best takeaway', brief: 'Pick your strongest recent takeaway and explain it in plain words (60–150 words) with one concrete example from your own work.', minWords: 50, targetWords: 110, passScore: 70, rewardNim: 1, xp: 50, timeMin: 15, keyConcepts: [] },
  { topicKey: 'mistake-postmortem', type: 'explain', title: 'Post-mortem a mistake', brief: 'Describe one mistake you made while learning this week, what caused it, and the rule you now follow because of it (60–150 words).', minWords: 50, targetWords: 110, passScore: 70, rewardNim: 1, xp: 50, timeMin: 15, keyConcepts: [] },
];

export function dailyChallengeFor(dateKey) {
  const base = seededPick(dateKey, DAILY_POOL);
  return {
    id: `daily_${dateKey}`,
    dateKey,
    type: base.type,
    title: base.title,
    brief: base.brief,
    passScore: base.passScore,
    rewardNim: base.rewardNim,
    xp: base.xp,
    timeMin: base.timeMin,
    evaluator: { type: base.type, config: { minWords: base.minWords, targetWords: base.targetWords, keyConcepts: base.keyConcepts, headings: 0, keyConceptRatio: 0 } },
  };
}
