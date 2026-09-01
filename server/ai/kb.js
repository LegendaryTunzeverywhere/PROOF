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
};

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
