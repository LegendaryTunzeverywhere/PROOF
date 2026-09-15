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

function speechTokens(value) {
  return low(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function evalSpeech(payload, challenge, cfg) {
  const transcript = C(payload.transcript);
  const targets = Array.isArray(cfg.targets) ? cfg.targets.map(C).filter(Boolean) : [];
  const heard = speechTokens(transcript);
  const target = targets[0] || '';
  const expected = speechTokens(target);
  const heardSet = new Set(heard);
  const matched = expected.filter((token) => heardSet.has(token)).length;
  const coverage = expected.length ? matched / expected.length : 0;
  const lengthFit = expected.length ? Math.min(1, heard.length / expected.length) : 0;
  const hash = sha256(`speech:${transcript.replace(/\s+/g, ' ').toLowerCase()}`);
  const criteria = [
    crit('target-words', 'Target words recognized', 70, coverage, {
      improve: `Recognized ${matched}/${expected.length} target word(s).`,
      next: 'Listen again, slow down, and repeat the complete phrase clearly.',
    }),
    crit('complete-phrase', 'Complete spoken phrase', 20, lengthFit, {
      improve: 'The transcript was shorter than the model phrase.',
      next: 'Say the whole phrase, including the small connecting words.',
    }),
    crit('original-speech', 'Speech captured', 10, transcript.trim() ? 1 : 0, {
      improve: 'No speech transcript was captured.',
      next: 'Allow microphone access and try the phrase again.',
    }),
  ];
  if (!transcript.trim()) return finish(criteria, { passScore: challenge.passScore, meta: { hash, type: 'speech', matched, expected: expected.length } });
  return finish(criteria, { passScore: challenge.passScore, meta: { hash, type: 'speech', matched, expected: expected.length, targetLanguage: cfg.language } });
}

/* ───────────────────────────── CHESS ──────────────────────────────── */
function evalChess(payload, challenge, cfg, ctx) {
  const mode = cfg.mode || 'puzzle';
  const hash = sha256('chess:' + JSON.stringify(payload));

  // Chess proofs are board play. ChallengeService replays each SAN line from
  // its FEN before this evaluator runs, so client-submitted moves are verified.
  if (Array.isArray(payload.positions) && payload.positions.length) {
    return evalChessBoardProof(payload, challenge, cfg, hash);
  }
  
  // Chess evaluation by mode
  switch (mode) {
    case 'puzzle':
      return evalChessPuzzle(payload, challenge, cfg, ctx, hash);
    case 'opening':
      return evalChessOpening(payload, challenge, cfg, ctx, hash);
    case 'endgame':
      return evalChessEndgame(payload, challenge, cfg, ctx, hash);
    case 'analysis':
      return evalChessAnalysis(payload, challenge, cfg, ctx, hash);
    case 'setup':
      return evalChessSetup(payload, challenge, cfg, ctx, hash);
    case 'tournament-sim':
      return evalChessTournament(payload, challenge, cfg, ctx, hash);
    case 'comprehensive':
      return evalChessComprehensive(payload, challenge, cfg, ctx, hash);
    default:
      return evalChessPuzzle(payload, challenge, cfg, ctx, hash);
  }
}

function evalChessBoardProof(payload, challenge, cfg, hash) {
  const records = payload.positions || [];
  const chess = challenge.chess || challenge.evaluator?.chess || {};
  const configured = [
    ...(chess.scenarios || []),
    ...(chess.positions || []),
    ...(chess.puzzles || []),
  ];
  const targetCount = Math.max(1, configured.length || cfg.scenarios || cfg.positions || cfg.puzzleCount || 1);
  const checked = records.map((record) => {
    const source = Number.isInteger(record.positionKey) ? configured[record.positionKey] : configured.find((entry) => entry.fen === record.initialFen);
    const expected = source?.correctMoves || source?.solution || [];
    return { ...record, expected, expectedFound: expected.length ? expected.every((move) => record.moves.includes(move)) : null };
  });
  const totalMoves = checked.reduce((sum, record) => sum + record.moves.length, 0);

  if (cfg.mode === 'special-moves') {
    const moveDetails = checked.flatMap((record) => record.moveDetails || []);
    const hasCastled = moveDetails.some((move) => /[kq]/.test(move.flags || ''));
    const hasEnPassant = moveDetails.some((move) => (move.flags || '').includes('e'));
    const hasPromoted = moveDetails.some((move) => (move.flags || '').includes('p') || move.promotion);
    const criteria = [
      crit('positions', 'All three rule positions', 25, clamp(checked.length / targetCount, 0, 1), {
        improve: `Play ${Math.max(0, targetCount - checked.length)} more position${targetCount - checked.length === 1 ? '' : 's'}.`,
        next: 'Record one legal line for every special-move scenario.',
      }),
      crit('castling', 'Castling', 25, hasCastled ? 1 : 0, {
        improve: 'No castle was recorded.', next: 'Move the king two squares toward its rook in the castling position.',
      }),
      crit('enPassant', 'En passant', 25, hasEnPassant ? 1 : 0, {
        improve: 'No en passant capture was recorded.', next: 'Capture the pawn through the en passant target square immediately.',
      }),
      crit('promotion', 'Pawn promotion', 25, hasPromoted ? 1 : 0, {
        improve: 'No pawn promotion was recorded.', next: 'Advance the pawn to the last rank and choose a promoted piece.',
      }),
    ];
    return finish(criteria, {
      passScore: challenge.passScore,
      meta: { hash, type: 'chess-special-moves', positions: checked.length, moves: totalMoves, hasCastled, hasEnPassant, hasPromoted },
    });
  }

  const exactLines = checked.filter((record) => record.expectedFound === true).length;
  const hasSolutions = checked.some((record) => record.expected.length);
  const mates = checked.filter((record) => record.outcome === 'checkmate').length;
  const noStalemates = checked.every((record) => record.outcome !== 'stalemate');
  const endgame = cfg.mode === 'endgame';
  const execution = endgame
    ? mates / targetCount
    : hasSolutions
      ? exactLines / targetCount
      : clamp(totalMoves / Math.max(3, targetCount * 2), 0, 1);
  const criteria = [
    crit('positions', 'Required positions played', 35, clamp(checked.length / targetCount, 0, 1), {
      improve: `Play ${Math.max(0, targetCount - checked.length)} more board position${targetCount - checked.length === 1 ? '' : 's'}.`,
      next: 'Record a legal line for every listed FEN.',
    }),
    crit('execution', endgame ? 'Checkmate execution' : 'Target moves found', 40, clamp(execution, 0, 1), {
      improve: endgame ? 'Convert every position to checkmate without stalemating.' : 'Find the required tactical or opening moves in each line.',
      next: 'Use the AI evaluation after each move, then continue the legal variation.',
    }),
    crit('calculation', 'Legal move depth', 15, clamp(totalMoves / Math.max(3, targetCount * 3), 0, 1), {
      improve: `Only ${totalMoves} verified move${totalMoves === 1 ? '' : 's'} recorded so far.`,
      next: 'Play a concrete continuation instead of stopping after the first move.',
    }),
    crit('conversion', 'Clean finish', 10, noStalemates ? 1 : 0, {
      improve: 'A line ended in stalemate. Reset that position and preserve an escape square until mate.',
      next: 'Check the board status before finalizing your move.',
    }),
  ];
  return finish(criteria, { passScore: challenge.passScore, meta: { hash, type: 'chess-board-proof', mode: cfg.mode || 'puzzle', positions: checked.length, moves: totalMoves, mates } });
}

function evalChessWrittenProof(payload, challenge, cfg, hash) {
  const analysis = C(payload.analysis);
  const wc = wordCount(analysis);
  const mode = cfg.mode || 'puzzle';
  const modeTerms = {
    puzzle: ['tactic', 'candidate', 'variation', 'move', 'threat', 'calculate'],
    opening: ['center', 'develop', 'castle', 'king', 'piece', 'plan'],
    endgame: ['king', 'pawn', 'checkmate', 'opposition', 'position', 'plan'],
    analysis: ['threat', 'candidate', 'variation', 'evaluation', 'plan', 'position'],
    setup: ['square', 'piece', 'rank', 'file', 'move', 'position'],
    'tournament-sim': ['time', 'position', 'strategy', 'plan', 'decision', 'game'],
    comprehensive: ['tactic', 'opening', 'endgame', 'analysis', 'plan', 'position'],
  }[mode] || ['threat', 'candidate', 'variation', 'plan', 'position', 'move'];
  const termHits = modeTerms.filter((term) => low(analysis).includes(term)).length;
  const hasVariation = /\b(if|after|then|variation|line)\b/i.test(analysis);
  const hasConclusion = /\b(best|therefore|because|plan|advantage|winning|equal)\b/i.test(analysis);
  const hasStructure = /\b(threat|candidate|calculation|evaluation|conclusion)\b/i.test(analysis);
  const criteria = [
    crit('specifics', 'Chess-specific reasoning', 35, clamp(termHits / 4, 0, 1), {
      improve: `Use more of the concrete ideas required by this ${mode.replace('-', ' ')} proof.`,
      next: `Address the position with ${modeTerms.slice(0, 3).join(', ')} and a concrete move sequence.`,
    }),
    crit('calculation', 'Calculation and variations', 30, hasVariation ? 1 : 0.2, {
      improve: 'Show at least one candidate move, likely reply, and continuation.',
      next: 'Use “if … then …” to make your calculation visible.',
    }),
    crit('judgement', 'Final evaluation', 20, hasConclusion ? 1 : 0.25, {
      improve: 'Finish by naming the best plan or move and why it works.',
      next: 'State your conclusion after comparing the candidate moves.',
    }),
    crit('depth', 'Depth of explanation', 15, clamp(wc / 140, 0, 1) * (hasStructure ? 1 : 0.65), {
      improve: `${wc} words submitted — expand the explanation and organize your thinking.`,
      next: 'Write a structured explanation of about 140 words or more.',
    }),
  ];
  return finish(criteria, { passScore: challenge.passScore, meta: { hash, type: 'chess-written-proof', mode, words: wc } });
}

function evalChessPuzzle(payload, challenge, cfg, ctx, hash) {
  const moves = payload.moves || [];
  const puzzlesSolved = payload.puzzlesSolved || [];
  const themes = payload.themes || [];
  const hints = payload.hintsUsed || 0;
  const attempts = payload.attempts || 1;
  
  const puzzleCount = cfg.puzzleCount || 6;
  const exactMoves = cfg.exactMoves || false;
  const stockfishVerify = cfg.stockfishVerify || false;
  
  // Calculate solve rate
  const solveRate = puzzlesSolved.length / puzzleCount;
  const avgAccuracy = puzzlesSolved.reduce((sum, p) => sum + (p.correct ? 1 : 0), 0) / Math.max(puzzlesSolved.length, 1);
  const themeIdentification = themes.filter(t => t.correct).length / Math.max(themes.length, 1);
  
  // Penalty for hints and attempts
  const hintPenalty = Math.min(hints * 0.05, 0.3);
  const attemptBonus = attempts === 1 ? 0.1 : 0;
  
  const criteria = [
    crit('solve-rate', 'Puzzles solved correctly', 40, 
      clamp(solveRate - hintPenalty + attemptBonus, 0, 1), {
        improve: `Solved ${puzzlesSolved.length}/${puzzleCount} puzzles. ${hints > 0 ? `Used ${hints} hints.` : ''}`,
        next: 'Study tactical patterns and try again without hints.',
        strength: `Excellent tactical vision! Solved ${puzzlesSolved.length}/${puzzleCount} puzzles.`,
      }),
    crit('accuracy', 'Move accuracy', 30, avgAccuracy, {
      improve: `${Math.round(avgAccuracy * 100)}% accuracy. Find the precise winning moves.`,
      next: 'Calculate variations more carefully before moving.',
      strength: 'Precise calculation! Found the best moves consistently.',
    }),
    crit('theme-recognition', 'Pattern recognition', 20, themeIdentification, {
      improve: `Identified ${themes.filter(t => t.correct).length}/${themes.length} tactical themes.`,
      next: 'Study common patterns: pins, forks, skewers, discoveries.',
      strength: 'Strong pattern recognition!',
    }),
    crit('efficiency', 'Solution efficiency', 10, 
      clamp(1 - (attempts - 1) * 0.2, 0, 1), {
        improve: `Took ${attempts} ${attempts === 1 ? 'attempt' : 'attempts'} per puzzle average.`,
        next: 'Think before moving to reduce trial-and-error.',
        strength: 'Solved efficiently on first attempts!',
      }),
  ];
  
  return finish(criteria, { 
    passScore: challenge.passScore, 
    meta: { hash, type: 'chess-puzzle', puzzleCount, solved: puzzlesSolved.length, hints, attempts } 
  });
}

function evalChessOpening(payload, challenge, cfg, ctx, hash) {
  const moves = payload.moves || [];
  const systems = payload.systems || [];
  const principles = payload.principles || {};
  
  const systemsRequired = cfg.systems?.length || 2;
  const checkPrinciples = cfg.checkPrinciples || false;
  const penalizeMistakes = cfg.penalizeMistakes || false;
  
  const systemsPlayed = systems.filter(s => s.completed).length;
  const systemAccuracy = systems.reduce((sum, s) => sum + (s.accuracy || 0), 0) / Math.max(systems.length, 1);
  
  // Opening principles adherence
  const centerControl = principles.centerControl || 0;
  const development = principles.development || 0;
  const kingSafety = principles.kingSafety || 0;
  const principlesScore = (centerControl + development + kingSafety) / 3;
  
  const mistakes = payload.mistakes || [];
  const mistakePenalty = penalizeMistakes ? Math.min(mistakes.length * 0.1, 0.4) : 0;
  
  const criteria = [
    crit('systems-knowledge', 'Opening systems', 40, 
      clamp(systemsPlayed / systemsRequired, 0, 1), {
        improve: `Demonstrated ${systemsPlayed}/${systemsRequired} opening systems.`,
        next: 'Study and practice each opening system move order.',
        strength: `Solid opening repertoire! Knows ${systemsPlayed} systems.`,
      }),
    crit('accuracy', 'Move accuracy', 25, clamp(systemAccuracy - mistakePenalty, 0, 1), {
      improve: `${Math.round(systemAccuracy * 100)}% accurate moves. ${mistakes.length > 0 ? `Made ${mistakes.length} mistakes.` : ''}`,
      next: 'Review opening theory for your chosen systems.',
      strength: 'Precise opening play!',
    }),
    crit('principles', 'Opening principles', 25, principlesScore, {
      improve: `Center control: ${Math.round(centerControl * 100)}%, Development: ${Math.round(development * 100)}%, King safety: ${Math.round(kingSafety * 100)}%`,
      next: 'Follow the principles: control center, develop pieces, castle early.',
      strength: 'Excellent adherence to opening principles!',
    }),
    crit('understanding', 'Strategic understanding', 10, 
      payload.explanationQuality || 0, {
        improve: 'Explain the ideas behind your opening moves.',
        next: 'Study why these moves are played, not just memorize.',
        strength: 'Deep understanding of opening ideas!',
      }),
  ];
  
  return finish(criteria, { 
    passScore: challenge.passScore, 
    meta: { hash, type: 'chess-opening', systems: systemsPlayed, mistakes: mistakes.length } 
  });
}

function evalChessEndgame(payload, challenge, cfg, ctx, hash) {
  const positions = payload.positions || [];
  const scenarios = cfg.scenarios || 3;
  const requireCheckmate = cfg.requireCheckmate || false;
  const maxMoves = cfg.maxMoves || [20, 20, 20];
  
  const positionsWon = positions.filter(p => p.won).length;
  const avgMoveCount = positions.reduce((sum, p) => sum + (p.moves || 0), 0) / Math.max(positions.length, 1);
  const avgOptimality = positions.reduce((sum, p) => sum + (p.optimality || 0), 0) / Math.max(positions.length, 1);
  
  const stalemates = positions.filter(p => p.stalemate).length;
  const timeouts = positions.filter(p => p.timeout).length;
  
  const criteria = [
    crit('wins', 'Positions won', 50, positionsWon / scenarios, {
      improve: `Won ${positionsWon}/${scenarios} endgame positions.`,
      next: 'Study basic endgame techniques: opposition, square rule, key squares.',
      strength: `Excellent endgame technique! Won all ${positionsWon} positions.`,
    }),
    crit('technique', 'Technique efficiency', 25, avgOptimality, {
      improve: `Average optimality: ${Math.round(avgOptimality * 100)}%. ${avgMoveCount} moves average.`,
      next: 'Learn the fastest winning methods for each endgame type.',
      strength: 'Efficient technique! Found optimal winning methods.',
    }),
    crit('avoidance', 'Avoid stalemate', 15, 
      clamp(1 - stalemates * 0.5, 0, 1), {
        improve: `${stalemates} ${stalemates === 1 ? 'stalemate' : 'stalemates'}. Always leave the opponent a legal move until checkmate.`,
        next: 'Check for stalemate before every move in winning positions.',
        strength: 'No stalemates! Careful winning technique.',
      }),
    crit('speed', 'Move efficiency', 10, 
      clamp(1 - timeouts * 0.3, 0, 1), {
        improve: timeouts > 0 ? `Exceeded move limit in ${timeouts} position(s).` : 'Good move efficiency.',
        next: 'Learn the standard winning plans to avoid wasting moves.',
        strength: 'Won within move limits!',
      }),
  ];
  
  return finish(criteria, { 
    passScore: challenge.passScore, 
    meta: { hash, type: 'chess-endgame', positions: scenarios, won: positionsWon, stalemates, timeouts } 
  });
}

function evalChessAnalysis(payload, challenge, cfg, ctx, hash) {
  const analysis = C(payload.analysis || '');
  const wc = wordCount(analysis);
  const positions = payload.positions || [];
  const explanations = payload.explanations || [];
  
  const requireExplanation = cfg.requireExplanation || false;
  const checkThinking = cfg.checkThinking || false;
  const minWords = cfg.minWords || 100;
  
  // Check for key analytical concepts
  const concepts = ['threat', 'weakness', 'advantage', 'plan', 'tactic', 'strategy', 'piece', 'pawn', 'king', 'attack', 'defense', 'position'];
  const conceptMatches = concepts.filter(c => low(analysis).includes(c)).length;
  const conceptRatio = conceptMatches / concepts.length;
  
  // Check for specific thinking process elements
  const hasThreats = /threat|attacking|defending/i.test(analysis);
  const hasCandidates = /candidate|consider|option|alternative/i.test(analysis);
  const hasCalculation = /if.*then|after.*white|variation|line/i.test(analysis);
  const hasEvaluation = /better|worse|equal|advantage|winning|losing/i.test(analysis);
  const thinkingScore = [hasThreats, hasCandidates, hasCalculation, hasEvaluation].filter(Boolean).length / 4;
  
  const positionAccuracy = positions.reduce((sum, p) => sum + (p.correct ? 1 : 0), 0) / Math.max(positions.length, 1);
  const explanationQuality = explanations.reduce((sum, e) => sum + (e.quality || 0), 0) / Math.max(explanations.length, 1);
  
  const criteria = [
    crit('position-evaluation', 'Position understanding', 30, positionAccuracy, {
      improve: `Correctly evaluated ${Math.round(positionAccuracy * 100)}% of positions.`,
      next: 'Consider material, king safety, piece activity, and pawn structure.',
      strength: 'Accurate position evaluation!',
    }),
    crit('concepts', 'Chess concepts', 25, conceptRatio, {
      improve: `Used ${conceptMatches}/${concepts.length} key chess concepts in analysis.`,
      next: 'Describe threats, weaknesses, plans, and tactical opportunities.',
      strength: 'Rich analytical vocabulary!',
    }),
    crit('thinking-process', 'Systematic thinking', 25, thinkingScore, {
      improve: 'Show your thinking: threats → candidates → calculation → evaluation.',
      next: 'Use the structured thinking process from the lessons.',
      strength: 'Excellent systematic analysis!',
    }),
    crit('explanation', 'Explanation quality', 20, 
      clamp((wc / minWords) * explanationQuality, 0, 1), {
        improve: `${wc} words. ${explanationQuality < 0.7 ? 'Explain ideas more clearly.' : ''}`,
        next: 'Provide concrete variations and explain why moves are good/bad.',
        strength: 'Clear, detailed explanations!',
      }),
  ];
  
  if (wc < 20) {
    return finish([crit('empty', 'Submission received', 100, 0.02, { 
      improve: 'Analysis too short.', 
      next: 'Write a complete position analysis.' 
    })], { 
      passScore: challenge.passScore, 
      meta: { hash, type: 'chess-analysis' } 
    });
  }
  
  return finish(criteria, { 
    passScore: challenge.passScore, 
    meta: { hash, type: 'chess-analysis', words: wc, positions: positions.length } 
  });
}

function evalChessSetup(payload, challenge, cfg, ctx, hash) {
  const placement = payload.placement || {};
  const moves = payload.moves || [];
  const demonstrations = payload.demonstrations || [];
  
  const verifyPlacement = cfg.verifyPlacement || false;
  const testMoves = cfg.testMoves || false;
  
  const placementCorrect = placement.correct || false;
  const placementScore = placementCorrect ? 1 : (placement.accuracy || 0);
  
  const moveDemonstrations = demonstrations.filter(d => d.correct).length;
  const totalDemonstrations = demonstrations.length;
  
  const criteria = [
    crit('setup', 'Correct piece placement', 50, placementScore, {
      improve: placementCorrect ? '' : 'Some pieces are in wrong positions.',
      next: 'Review the starting position of all pieces.',
      strength: 'Perfect board setup!',
    }),
    crit('coordinates', 'Square identification', 25, placement.coordinateAccuracy || 0, {
      improve: 'Practice identifying squares by their coordinates (e.g., e4, d7).',
      next: 'Quiz yourself on square names until they\'re automatic.',
      strength: 'Excellent coordinate knowledge!',
    }),
    crit('movement', 'Piece movement', 25, 
      totalDemonstrations > 0 ? moveDemonstrations / totalDemonstrations : 0, {
        improve: `Correctly demonstrated ${moveDemonstrations}/${totalDemonstrations} piece movements.`,
        next: 'Review how each piece moves (especially knight L-shape and pawn captures).',
        strength: 'Perfect understanding of piece movement!',
      }),
  ];
  
  return finish(criteria, { 
    passScore: challenge.passScore, 
    meta: { hash, type: 'chess-setup', placementCorrect, demonstrations: totalDemonstrations } 
  });
}

function evalChessTournament(payload, challenge, cfg, ctx, hash) {
  const games = payload.games || [];
  const timeManagement = payload.timeManagement || {};
  const practicalSkills = payload.practicalSkills || {};
  
  const gamesRequired = cfg.games || 3;
  const evaluatePracticalSkills = cfg.evaluatePracticalSkills || false;
  
  const gamesCompleted = games.filter(g => g.completed).length;
  const avgTimeUsed = games.reduce((sum, g) => sum + (g.timeUsed || 0), 0) / Math.max(games.length, 1);
  const timeScore = timeManagement.score || 0;
  const strategyScore = practicalSkills.strategy || 0;
  const composureScore = practicalSkills.composure || 0;
  
  const criteria = [
    crit('completion', 'Games completed', 30, gamesCompleted / gamesRequired, {
      improve: `Completed ${gamesCompleted}/${gamesRequired} tournament games.`,
      next: 'Complete all tournament simulation games.',
      strength: 'Completed all tournament games!',
    }),
    crit('time-management', 'Time management', 30, timeScore, {
      improve: `Time management score: ${Math.round(timeScore * 100)}%. ${avgTimeUsed > 80 ? 'Used too much time early.' : ''}`,
      next: 'Allocate time wisely: quick moves in opening, more time for critical positions.',
      strength: 'Excellent time management!',
    }),
    crit('practical-strategy', 'Practical decision-making', 25, strategyScore, {
      improve: 'Apply practical strategies: simplify when better, complicate when worse.',
      next: 'Review tournament skills lesson on practical play.',
      strength: 'Strong practical play!',
    }),
    crit('composure', 'Mental composure', 15, composureScore, {
      improve: 'Stay calm after mistakes, focus on recovery.',
      next: 'Practice maintaining composure under pressure.',
      strength: 'Excellent mental composure!',
    }),
  ];
  
  return finish(criteria, { 
    passScore: challenge.passScore, 
    meta: { hash, type: 'chess-tournament', games: gamesCompleted, avgTime: Math.round(avgTimeUsed) } 
  });
}

function evalChessComprehensive(payload, challenge, cfg, ctx, hash) {
  const puzzles = payload.puzzles || [];
  const openings = payload.openings || [];
  const endgames = payload.endgames || [];
  const analysis = payload.analysis || [];
  
  const puzzlesSolved = puzzles.filter(p => p.correct).length;
  const puzzlesRequired = cfg.puzzles || 10;
  const openingsDemo = openings.filter(o => o.accurate).length;
  const openingsRequired = cfg.openings || 3;
  const endgamesWon = endgames.filter(e => e.won).length;
  const endgamesRequired = cfg.endgames || 2;
  const analysisQuality = analysis.length > 0 ? analysis[0].quality || 0 : 0;
  
  const criteria = [
    crit('tactics', 'Tactical puzzles', 30, puzzlesSolved / puzzlesRequired, {
      improve: `Solved ${puzzlesSolved}/${puzzlesRequired} tactical puzzles.`,
      next: 'Practice more tactical patterns.',
      strength: `Excellent tactical vision! ${puzzlesSolved}/${puzzlesRequired} solved.`,
    }),
    crit('openings', 'Opening knowledge', 25, openingsDemo / openingsRequired, {
      improve: `Demonstrated ${openingsDemo}/${openingsRequired} opening systems accurately.`,
      next: 'Study opening theory and principles.',
      strength: 'Strong opening repertoire!',
    }),
    crit('endgames', 'Endgame technique', 25, endgamesWon / endgamesRequired, {
      improve: `Won ${endgamesWon}/${endgamesRequired} endgame positions.`,
      next: 'Practice basic endgame techniques.',
      strength: 'Solid endgame skills!',
    }),
    crit('analysis', 'Position analysis', 20, analysisQuality, {
      improve: 'Demonstrate deeper position understanding in analysis.',
      next: 'Explain ideas, plans, and concrete variations.',
      strength: 'Excellent analytical skills!',
    }),
  ];
  
  return finish(criteria, { 
    passScore: challenge.passScore, 
    meta: { 
      hash, 
      type: 'chess-comprehensive', 
      puzzles: puzzlesSolved, 
      openings: openingsDemo, 
      endgames: endgamesWon,
      analysisQuality: Math.round(analysisQuality * 100)
    } 
  });
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
  speech: evalSpeech,
  explain: (p, ch, cfg, ctx) => evalText(p, ch, { ...cfg, keyConceptRatio: (cfg.keyConceptRatio ?? 0.4) }, ctx),
  chess: evalChess,
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
    case 'speech':
      return sha256('speech:' + C(payload.transcript).replace(/\s+/g, ' ').toLowerCase());
    case 'chess':
      return sha256('chess:' + JSON.stringify(payload));
    default:
      return sha256(type + ':' + JSON.stringify(payload));
  }
}
