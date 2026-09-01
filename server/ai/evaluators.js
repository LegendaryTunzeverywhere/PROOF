/**
 * Evaluators — deterministic, rubric-based graders.
 *
 * Every evaluator receives (payload, challenge, ctx) and returns:
 *   { score, criteria:[{id,label,max,earned,passed,note}], strengths[],
 *     improvements[], nextStep, pass, meta:{hash,...} }
 *
 * Scores are computed SERVER-SIDE from the submission's actual content.
 * Clients never send scores; `meta.hash` feeds duplicate-submission checks.
 */
import { sha256, clamp } from '../util.js';

const words = (s) => (String(s).trim().match(/[\p{L}\p{N}’'-]+/gu) || []);
const wordCount = (s) => words(s).length;
const sentences = (s) => (String(s).split(/[.!?…]+(?:\s|$)/).filter((x) => wordCount(x) > 2));
const countMatches = (s, re) => (String(s).match(re) || []).length;

function finish(criteria, opts = {}) {
  const total = criteria.reduce((a, c) => a + c.max, 0);
  const earned = criteria.reduce((a, c) => a + c.earned, 0);
  const score = Math.round((earned / total) * 100 * (100 / 100));
  const norm = Math.round((earned / Math.max(total, 1)) * 100);
  const strengths = criteria.filter((c) => c.max > 0 && c.earned >= c.max * 0.85).map((c) => c.strengthNote || c.label);
  const improvements = criteria.filter((c) => c.max > 0 && c.earned < c.max * 0.6).map((c) => c.improveNote || c.label);
  const weakest = [...criteria].filter((c) => c.earned < c.max).sort((a, b) => a.earned / a.max - b.earned / b.max)[0];
  return {
    score: clamp(norm, 0, 100),
    criteria,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    nextStep: weakest?.nextStep || opts.nextStep || 'Review the rubric criteria and resubmit — small fixes move scores fast.',
    pass: norm >= (opts.passScore ?? 70),
    meta: opts.meta || {},
  };
}

const crit = (id, label, max, ratio, notes = {}) => ({
  id, label, max,
  earned: Math.round(max * clamp(ratio, 0, 1)),
  passed: ratio >= 0.7,
  note: notes.note || '',
  strengthNote: notes.strength, improveNote: notes.improve, nextStep: notes.next,
});

const C = (s) => String(s || '');
const low = (s) => C(s).toLowerCase();

/* ─────────────────────────── HTML / CSS / JS page ─────────────────── */
function evalHtml(payload, challenge, cfg, ctx) {
  const code = C(payload.code);
  const c = low(code);
  const has = (frag) => c.includes(frag);
  const el = (tag) => new RegExp(`<${tag}[\\s>]`, 'i').test(code);
  
  // Security check: detect script tags to prevent stored XSS
  const scriptTags = countMatches(code, /<script[\s>]/gi);
  if (scriptTags > 0 && !cfg.allowScripts) {
    return finish([
      crit('security', 'Security', 100, 0, { 
        improve: 'Script tags detected. For security, submissions cannot contain executable JavaScript. Use external event listeners in <script> blocks instead of inline scripts, or remove scripts entirely.', 
        next: 'Remove <script> tags or move JavaScript to event listeners.' 
      }),
    ], { passScore: challenge.passScore, meta: { hash: sha256('html:' + code.replace(/\s+/g, ' ').slice(0, 20000)), type: 'html', flagged: 'script_tags' } });
  }
  
  const navBlock = code.match(/<nav[\s\S]*?<\/nav>/i)?.[0] || '';
  const navLinks = countMatches(navBlock, /<a\s/i);
  const imgs = countMatches(code, /<img\b/gi);
  const imgsWithAlt = countMatches(code, /<img[^>]*\balt\s*=\s*["'][^"']+["']/gi);
  const headings = (code.match(/<h([1-6])[\s>]/gi) || []).map((h) => parseInt(h.match(/\d/)[0], 10));
  const mq = countMatches(code, /@media[^{]*\(/gi);
  const fluid = countMatches(c, /clamp\(|\d+(?:\.\d+)?(?:rem|%|vw|vh)|1fr|auto-fit|auto-fill/g);
  const customProps = countMatches(c, /--[a-z][a-z0-9-]*\s*:/g);
  const cssProps = countMatches(c, /[a-z-]+\s*:\s*[^;{}]+;/g);
  const classBased = countMatches(c, /\.(?!false|true)[a-z][a-z0-9-]*\s*\{[^}]*\}/g);
  const cards = Math.max(
    countMatches(c, /class\s*=\s*["'][^"']*card/gi),
    cfg.minCards ? 0 : 99,
  );
  const interactive = has('addeventlistener') || (has('<script') && (has('onclick') === false));
  const inlineOnClick = countMatches(code, /\sonclick\s*=/gi);

  // heading-order check (no skipped levels downward from first)
  let orderOk = headings.length > 0;
  let prev = 0;
  for (const h of headings) {
    if (prev === 0) { if (h !== 1) orderOk = false; }
    else if (h - prev > 1) orderOk = false;
    prev = h;
    if (!orderOk) break;
  }

  const needReq = cfg.required || [];
  const reqRatio = needReq.length ? needReq.filter((r) => el(r)).length / needReq.length : 1;

  const criteria = [
    crit('semantics', 'Semantic structure', 20,
      (needReq.includes('nav') ? (el('nav') ? 0.4 : 0) : 0.4) +
      ((needReq.includes('article') ? el('article') || el('main') : el('main') || el('article') || el('section')) ? 0.3 : 0) +
      (needReq.includes('footer') ? (el('footer') ? 0.15 : 0) : 0.15) +
      ((headings.filter((h) => h === 1).length === 1) ? 0.15 : 0),
      { strength: 'Clean semantic structure (nav/main/footer, single h1).', improve: 'Use semantic landmarks: <nav>, <main>/<article>, <footer>, exactly one <h1>.', next: 'Rebuild the page skeleton with semantic elements before styling.' }),
    crit('responsive', 'Responsive design', 20,
      (cfg.needViewport === false ? 0.25 : (has('viewport') ? 0.25 : 0)) +
      (cfg.minMediaQueries ? clamp(mq / cfg.minMediaQueries, 0, 1) * 0.45 : (mq > 0 ? 0.45 : 0)) +
      (cfg.wantFluidUnits === false ? 0.3 : (fluid >= 3 ? 0.3 : fluid * 0.1)),
      { strength: 'Responsive foundations in place (viewport, media queries, fluid units).', improve: 'Add a viewport meta tag, media queries, and fluid units (rem/%/clamp).', next: 'Make the layout fluid: add the viewport meta + at least one min-width media query.' }),
    crit('a11y', 'Accessibility', 15,
      (cfg.needLang === false ? 0.27 : (has('<html') && has('lang=') ? 0.27 : 0)) +
      (imgs === 0 ? 0.2 : clamp(imgsWithAlt / imgs, 0, 1) * 0.4) +
      (orderOk ? 0.2 : 0) +
      (inlineOnClick === 0 ? 0.13 : 0),
      { strength: 'Accessible markup: language set, image alt text, sensible headings.', improve: 'Add lang to <html>, meaningful alt text on every image, and ordered headings.', next: 'Accessibility pass: html[lang], alt text on all images, fix heading order.' }),
    crit('css', 'CSS quality', 15,
      (has('<style') || /<link[^>]*stylesheet/i.test(code) ? 0.35 : 0) +
      (classBased >= 3 ? 0.25 : classBased * 0.08) +
      (customProps > 0 ? 0.2 : 0) +
      clamp(cssProps / (cfg.minCssProps || 10), 0, 1) * 0.2,
      { strength: 'Well-organized CSS with reusable classes.', improve: 'Style via classes in a <style> block; use custom properties for consistency.', next: 'Move styling into classes/variables — avoid inline styling and magic numbers.' }),
    crit('content', 'Content completeness', 20, reqRatio,
      { strength: 'All required content sections are present.', improve: 'Missing required sections: ' + needReq.filter((r) => !el(r)).join(', '), next: 'Add the missing sections listed in the requirements checklist.' }),
    crit('polish', 'Polish & interactivity', 10,
      (has('<title') ? 0.3 : 0) +
      (/meta\s+name\s*=\s*["']description/i.test(code) ? 0.25 : 0) +
      (!/=\s*["']\s*["']/.test(code) ? 0.15 : 0) +
      (customProps > 0 || countMatches(code, /<!--/g) >= 2 ? 0.3 : 0) +
      (cfg.needEventListener ? (interactive && inlineOnClick === 0 ? 0 : -0.25) : 0),
      { strength: 'Polished details: title, meta description, organized styles.', improve: 'Add a <title>, meta description, and organized styles (custom properties or comments).', next: 'Finish the polish pass: title, meta description, tidy CSS organization.' }),
  ];

  if (cfg.minCards && cards < cfg.minCards) {
    const content = criteria.find((x) => x.id === 'content');
    content.earned = Math.max(0, content.earned - Math.round(20 * 0.3));
    content.improveNote = `Expected ≥${cfg.minCards} card components — found ${cards}.`;
    content.nextStep = 'Build the required cards (class="card" sections) as flex/grid children.';
  }

  const hash = sha256('html:' + code.replace(/\s+/g, ' ').slice(0, 20000));
  if (wordCount(code) < 20) {
    return finish([
      crit('empty', 'Submission received', 100, 0.02, { improve: 'The submission appears empty.', next: 'Paste your full HTML into the code editor and resubmit.' }),
    ], { passScore: challenge.passScore, meta: { hash, type: 'html' } });
  }
  return finish(criteria, { passScore: challenge.passScore, meta: { hash, type: 'html', stats: { imgs, mq, cssProps, customProps, cards } } });
}

/* ─────────────────────────── JS (static checks) ───────────────────── */
function evalJsStatic(payload, challenge, cfg, ctx) {
  const code = C(payload.code);
  const explanation = C(payload.explanation || payload.text || '');
  const c = low(code);
  const checks = cfg.checks || [];
  const criteria = checks.map((chk) =>
    crit(chk.id, chk.label, chk.weight, new RegExp(chk.pattern, 'i').test(code) ? 1 : 0, {
      improve: `Not found: ${chk.label}.`, next: `Implement: ${chk.label}.`,
    }));
  // Additive: checks may sum to <100 → scale total to 100 by adding explanation criterion
  const checkSum = checks.reduce((a, x) => a + x.weight, 0);
  const explWeight = Math.max(0, 100 - checkSum);
  if (explWeight > 0 || cfg.explainMinWords) {
    const wc = wordCount(explanation);
    const ratio = clamp(wc / Math.max(cfg.explainMinWords || 25, 1), 0, 1);
    criteria.push(crit('explanation', 'Edge-case explanation', Math.max(explWeight, 0) || 15, ratio, {
      improve: 'Explain how you handled edge cases (min ' + (cfg.explainMinWords || 25) + ' words).',
      next: 'Add 2–3 sentences on edge cases: empty input, wrong types, boundaries.',
    }));
  }
  if (wordCount(code) < 5 && wordCount(explanation) < 5) {
    return finish([crit('empty', 'Submission received', 100, 0.02, { improve: 'Submission is empty.', next: 'Write your solution before submitting.' })],
      { passScore: challenge.passScore, meta: { hash: sha256('js:' + code + explanation), type: 'js' } });
  }
  return finish(criteria, {
    passScore: challenge.passScore,
    meta: { hash: sha256('js:' + code.replace(/\s+/g, ' ')), type: 'js' },
  });
}

/* ─────────────────────────── Text family ──────────────────────────── */
function textCriteria(text, cfg, passScore, kind) {
  const wc = wordCount(text);
  const sents = sentences(text);
  const paras = text.split(/\n\s*\n|\n/).map((p) => wordCount(p)).filter((n) => n > 12).length;
  const avgSent = sents.length ? wc / sents.length : wc;
  const l = low(text);

  // length band
  const target = cfg.targetWords || cfg.minWords || 100;
  const minW = cfg.minWords || Math.round(target * 0.6);
  const lengthRatio = wc < minW ? clamp(wc / minW, 0, 1) * 0.8 : wc <= target * 1.6 ? 1 : clamp((target * 1.8 - wc) / (target * 0.6), 0.7, 1);

  // concept coverage
  const concepts = (cfg.keyConcepts || []).map((k) => k.toLowerCase());
  const hits = concepts.filter((k) => l.includes(k.slice(0, Math.max(4, k.length - 2)))).length;
  const conceptRatio = concepts.length ? hits / concepts.length : 1;
  const conceptNeed = cfg.keyConceptRatio ?? 0.5;

  // structure
  const headingsFound = countMatches(text, /^#{1,3}\s|\*\*[^*]+\*\*/gm);
  const structRatio = clamp(
    (Math.min(paras, 4) / 4) * 0.7 + (cfg.headings ? clamp(headingsFound / cfg.headings, 0, 1) : Math.min(paras, 2) / 2) * 0.3,
    0, 1);

  // clarity: ideal 8–25 words/sentence
  const clarityRatio = avgSent >= 8 && avgSent <= 25 ? 1 : avgSent < 8 ? 0.8 : clamp(25 / avgSent, 0.3, 0.9);

  // specificity: numbers / concrete markers
  const numbers = countMatches(text, /\b\d+([.,]\d+)?\b/g);
  const specRatio = clamp((numbers > 0 ? 0.6 : 0) + (cfg.minWords ? clamp(wc / target, 0, 1) * 0.4 : 0.4), 0, 1);

  const conceptScore = conceptRatio >= Math.max(conceptNeed, 0.01) ? 1 : conceptRatio / Math.max(conceptNeed, 0.01);

  const criteria = [
    crit('length', 'Completeness & depth', 25, lengthRatio, {
      improve: `Length: ${wc} words (target ≈${target}, minimum ${minW}).`, next: `Expand to at least ${minW} words with concrete detail.`,
    }),
    crit('concepts', 'Relevant concepts covered', 25, conceptScore, {
      improve: `Covered ${hits}/${concepts.length} key concepts (${concepts.slice(0, 4).join(', ')}…).`, next: 'Weave in the missing key concepts from the brief.',
    }),
    crit('structure', 'Structure & organization', 20, structRatio, {
      improve: `Only ${paras} substantial paragraph(s)${cfg.headings ? ` and ${headingsFound}/${cfg.headings} expected headings` : ''}.`, next: 'Break the work into clear paragraphs/headings — one idea each.',
    }),
    crit('clarity', 'Clarity', 15, clarityRatio, {
      improve: `Average sentence length is ${Math.round(avgSent)} words (aim 8–25).`, next: 'Split long sentences; aim for 8–25 words each.',
    }),
    crit('specific', 'Concreteness & specificity', 15, specRatio, {
      improve: numbers === 0 ? 'No concrete numbers or specifics found.' : 'Add concrete examples.', next: 'Make claims concrete: add numbers, names, or measurable outcomes.',
    }),
  ];
  return criteria;
}

function evalText(payload, challenge, cfg, ctx) {
  const text = C(payload.text || payload.code);
  const hash = sha256('text:' + text.replace(/\s+/g, ' ').toLowerCase());
  if (wordCount(text) < 10)
    return finish([crit('empty', 'Submission received', 100, 0.02, { improve: 'Submission is empty or too short.', next: 'Write your submission (see the minimum length in the brief).' })],
      { passScore: challenge.passScore, meta: { hash, type: 'text' } });

  // verbatim-copy guard: overlap with the brief itself
  const briefWords = new Set(words(challenge.brief).map((w) => w.toLowerCase()));
  const sub = words(text).map((w) => w.toLowerCase());
  const overlap = sub.filter((w) => briefWords.has(w)).length / Math.max(sub.length, 1);
  const criteria = textCriteria(text, cfg, challenge.passScore, 'text');
  const res = finish(criteria, { passScore: challenge.passScore, meta: { hash, type: 'text', overlap } });
  if (overlap > 0.85) {
    res.score = Math.min(res.score, 40);
    res.pass = false;
    res.improvements.unshift('Your submission closely mirrors the brief — rewrite it in your own words.');
  }
  return res;
}

function evalData(payload, challenge, cfg, ctx) {
  const text = C(payload.text);
  const hash = sha256('data:' + text.replace(/\s+/g, ' ').toLowerCase());
  const wc = wordCount(text);
  const numbers = countMatches(text, /\b\d+([.,]\d+)?\b/g);
  const l = low(text);
  const trendWords = countMatches(l, /trend|increase|decrease|grew|grew|decline|rose|up|down|average|growth|improv/g);
  const findingLines = text.split(/\n|\. /).filter((s) => /\d/.test(s) && /trend|increase|decrease|rose|grew|up|down|average|spike|peak|drop/i.test(s));
  const concepts = (cfg.keyConcepts || []).map((k) => k.toLowerCase());
  const hits = concepts.filter((k) => l.includes(k.slice(0, Math.max(4, k.length - 2)))).length;
  const conceptRatio = concepts.length ? hits / concepts.length : 1;

  const criteria = [
    crit('findings', 'Numeric findings', 30, clamp(findingLines.length / (cfg.minFindings || 3), 0, 1), {
      improve: `Found ${findingLines.length} numeric finding(s) — need ${cfg.minFindings || 3}.`, next: 'State each finding with its number: direction + magnitude + period.',
    }),
    crit('numbers', 'Uses the actual data', 20, clamp(numbers / (cfg.minNumbers || 4), 0, 1), {
      improve: `Only ${numbers} numeric reference(s) — cite the real values.`, next: 'Cite specific numbers from the dataset (do not invent).',
    }),
    crit('trends', 'Trend language & reasoning', 20, clamp(trendWords / 4, 0, 1), {
      improve: 'Little trend reasoning detected.', next: 'Explain direction, magnitude, and period for each trend.',
    }),
    crit('concepts', 'Analytical framing', 15, conceptRatio, {
      improve: 'Frame the analysis (trends, averages, outliers, recommendation).', next: 'Use analytical framing: average, trend, outlier, recommendation.',
    }),
    crit('depth', 'Depth', 15, clamp(wc / (cfg.minWords || 150), 0, 1), {
      improve: `${wc} words — target ≥${cfg.minWords}.`, next: `Expand the analysis to ≥${cfg.minWords} words.`,
    }),
  ];
  if (wc < 20) return finish([crit('empty', 'Submission received', 100, 0.02, { improve: 'Submission too short.', next: 'Write the full analysis.' })], { passScore: challenge.passScore, meta: { hash, type: 'data' } });
  return finish(criteria, { passScore: challenge.passScore, meta: { hash, type: 'data', numbers, wc } });
}

function evalBusiness(payload, challenge, cfg, ctx) {
  const text = C(payload.text);
  const hash = sha256('biz:' + text.replace(/\s+/g, ' ').toLowerCase());
  const wc = wordCount(text);
  const l = low(text);
  const numbers = countMatches(text, /\b\d+([.,]\d+)?\b/g);
  const concepts = (cfg.keyConcepts || []).map((k) => k.toLowerCase());
  const hits = concepts.filter((k) => l.includes(k.slice(0, Math.max(4, k.length - 2)))).length;
  const conceptRatio = concepts.length ? hits / concepts.length : 1;
  const sections = cfg.sections || [];
  const foundSections = sections.filter((group) => group.some((alias) => l.includes(alias))).length;
  const baseCriteria = textCriteria(text, { ...cfg, targetWords: cfg.minWords }, challenge.passScore, 'business');
  const criteria = [
    crit('sections', 'Required components', 30, sections.length ? clamp(foundSections / sections.length, 0, 1) : 1, {
      improve: `Missing components (${foundSections}/${sections.length} found).`, next: 'Cover every required component from the brief, each in its own part.',
    }),
    crit('numbers', 'Numbers & economics', 20, clamp(numbers / Math.max(cfg.minNumbers || 0, 1), 0, 1), {
      improve: `${numbers} numeric reference(s) — need ${cfg.minNumbers}.`, next: 'Add real numbers: prices, costs, targets, margins.',
    }),
    ...baseCriteria.slice(1, 4).map((c) => ({ ...c, max: Math.round(c.max * 0.84) })),
  ];
  if (wc < 20) return finish([crit('empty', 'Submission received', 100, 0.02, { improve: 'Submission too short.', next: 'Write the full response.' })], { passScore: challenge.passScore, meta: { hash, type: 'business' } });
  return finish(criteria, { passScore: challenge.passScore, meta: { hash, type: 'business', wc, numbers } });
}

function evalDesign(payload, challenge, cfg, ctx) {
  const text = C(payload.text);
  const hash = sha256('design:' + text.replace(/\s+/g, ' ').toLowerCase());
  const wc = wordCount(text);
  const l = low(text);
  const numbers = countMatches(text, /\b\d+(px|%|rem|pt)?\b/gi);
  const concepts = (cfg.keyConcepts || []).map((k) => k.toLowerCase());
  const hits = concepts.filter((k) => l.includes(k.slice(0, Math.max(4, k.length - 2)))).length;
  const conceptRatio = concepts.length ? hits / concepts.length : 1;
  const baseCriteria = textCriteria(text, { ...cfg, targetWords: cfg.minWords }, challenge.passScore, 'design');
  const criteria = [
    crit('concepts', 'Design thinking coverage', 30, conceptRatio, {
      improve: `Covered ${hits}/${concepts.length} expected design concepts.`, next: 'Address every concept in the brief explicitly (hierarchy, spacing, states…).',
    }),
    crit('specificity', 'Concrete decisions (sizes, values)', 25, clamp(numbers / 4, 0, 1), {
      improve: `Only ${numbers} concrete value(s) — designs live in specifics.`, next: 'Give real values: px sizes, hex colors, spacing steps.',
    }),
    ...baseCriteria.slice(1, 4).map((c) => ({ ...c, max: Math.round(c.max * 0.75) })),
  ];
  if (wc < 20) return finish([crit('empty', 'Submission received', 100, 0.02, { improve: 'Submission too short.', next: 'Describe the full design.' })], { passScore: challenge.passScore, meta: { hash, type: 'design' } });
  return finish(criteria, { passScore: challenge.passScore, meta: { hash, type: 'design', wc } });
}

function evalConversation(payload, challenge, cfg, ctx) {
  const text = C(payload.text);
  const hash = sha256('conv:' + text.replace(/\s+/g, ' ').toLowerCase());
  const lines = text.split('\n').map((s) => s.trim()).filter((s) => s.length > 2);
  const wc = wordCount(text);
  const l = low(text);
  const lex = (cfg.lexicon || []).map((k) => k.toLowerCase());
  const hits = lex.filter((k) => l.includes(k)).length;
  const questions = countMatches(text, /\?/g);
  const glosses = countMatches(text, /\[|\(/g);

  const criteria = [
    crit('turns', 'Conversation length', 30, clamp(lines.length / (cfg.minTurns || 6), 0, 1), {
      improve: `${lines.length} line(s) — need ${cfg.minTurns}.`, next: 'Extend the dialogue with more turns (alternate speakers per line).',
    }),
    crit('lexicon', 'Target-language phrases', 30, clamp(hits / Math.max(Math.ceil(lex.length * 0.4), 3), 0, 1), {
      improve: `Recognized ${hits}/${lex.length} expected phrases.`, next: 'Use the target-language phrases from the lesson naturally.',
    }),
    crit('questions', 'Two-way exchange', 20, clamp(questions / 3, 0, 1), {
      improve: `${questions} question(s) — conversations need both directions.`, next: 'Ask at least 3 questions to keep the exchange two-way.',
    }),
    crit('gloss', 'Understanding aids', 10, glosses >= lines.length * 0.5 ? 1 : glosses / Math.max(lines.length * 0.5, 1), {
      improve: 'Add English glosses in brackets after each line.', next: 'Gloss each line in [brackets] to show comprehension.',
    }),
    crit('depth', 'Fluency depth', 10, clamp(wc / (cfg.minWords || 60), 0, 1), {
      improve: `${wc} words — target ≥${cfg.minWords}.`, next: 'Say more per turn: opinions, reasons (parce que…).',
    }),
  ];
  if (wc < 10) return finish([crit('empty', 'Submission received', 100, 0.02, { improve: 'Submission too short.', next: 'Write the full dialogue.' })], { passScore: challenge.passScore, meta: { hash, type: 'conversation' } });
  return finish(criteria, { passScore: challenge.passScore, meta: { hash, type: 'conversation', lines: lines.length } });
}

/* ─────────────────────────── dispatcher ───────────────────────────── */
const REGISTRY = {
  html: evalHtml,
  'js-static': evalJsStatic,
  text: evalText,
  data: evalData,
  business: evalBusiness,
  design: evalDesign,
  conversation: evalConversation,
  explain: (p, ch, cfg, ctx) => evalText(p, ch, { ...cfg, keyConceptRatio: (cfg.keyConceptRatio ?? 0.4) }, ctx),
};

export function evaluateSubmission(payload, challenge, ctx = {}) {
  const cfg = challenge.evaluator?.config || {};
  const fn = REGISTRY[challenge.evaluator?.type] || evalText;
  const result = fn(payload, challenge, cfg, ctx);
  return {
    evaluator: challenge.evaluator?.type || 'text',
    engine: ctx.engineName || 'proof-engine',
    passScore: challenge.passScore ?? 70,
    ...result,
    pass: result.score >= (challenge.passScore ?? 70),
  };
}

export const evaluatorTypes = Object.keys(REGISTRY);


/**
 * Generate content hash for duplicate detection WITHOUT full evaluation.
 * Must match the hash generation logic in each evaluator.
 */
export function generateContentHash(payload, type) {
  const C = (s) => String(s || '');
  switch (type) {
    case 'html':
      return sha256('html:' + C(payload.code).replace(/\s+/g, ' ').slice(0, 20000));
    case 'js':
      return sha256('js:' + C(payload.code).replace(/\s+/g, ' '));
    case 'text':
    case 'essay':
    case 'article':
      return sha256('text:' + C(payload.text || payload.code).replace(/\s+/g, ' ').toLowerCase());
    case 'data':
      return sha256('data:' + C(payload.text).replace(/\s+/g, ' ').toLowerCase());
    case 'business':
      return sha256('biz:' + C(payload.text).replace(/\s+/g, ' ').toLowerCase());
    case 'design':
      return sha256('design:' + C(payload.text).replace(/\s+/g, ' ').toLowerCase());
    case 'conversation':
      return sha256('conv:' + C(payload.text).replace(/\s+/g, ' ').toLowerCase());
    default:
      return sha256(type + ':' + JSON.stringify(payload));
  }
}
