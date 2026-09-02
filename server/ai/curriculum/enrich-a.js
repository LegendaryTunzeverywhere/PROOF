/**
 * Curriculum enrichment — web development, python, ui-design.
 * Adds story hooks, learning objectives, memory hooks, mid-lesson quizzes
 * and recall drills to every existing topic. Merged into kb.js at load time.
 */

export const ENRICH_A = {
  /* ─────────────────────────── WEB DEVELOPMENT ─────────────────────── */
  'web-development': {
    'html-fundamentals': {
      objectives: [
        'Write a complete, semantic HTML page from scratch',
        'Choose the right tag for the meaning (nav, article, footer…)',
        'Explain why semantics matter more than appearance',
      ],
      story: 'Every website you have ever used — the news, the shop, the game — starts as a pile of plain text with labels on it. Those labels are HTML. Learn to label meaning, and the browser, search engines, and screen readers all start to “get” what you built.',
      memoryHook: 'HTML is the skeleton. If the bones are wrong, no amount of skin (CSS) saves it.',
      quiz: [
        { q: 'Which tag is the BEST choice for the main navigation links?', choices: ['<div>', '<nav>', '<footer>', '<span>'], answerIdx: 1, why: '<nav> says “this is navigation” to screen readers and search engines.' },
        { q: 'Where does the page <title> live?', choices: ['Inside <body>', 'Inside <head>', 'Inside <header>', 'Nowhere'], answerIdx: 1, why: '<title> belongs in <head>; it is what the browser tab shows.' },
        { q: 'The attribute that describes an image for people who cannot see it is…', choices: ['src', 'alt', 'href', 'title'], answerIdx: 1, why: 'alt provides a text alternative for images.' },
      ],
      recall: [
        'From memory, write the skeleton of a page: doctype, html[lang], head with title + viewport, and body.',
        'Explain in one sentence what each of these means: <header>, <main>, <article>, <footer>.',
      ],
    },
    'css-fundamentals': {
      objectives: [
        'Explain the box model (content, padding, border, margin)',
        'Use flex and grid for the right situations',
        'Use custom properties to keep a design consistent',
      ],
      story: 'HTML gives the page bones; CSS gives it a wardrobe. One style rule can restyle a thousand elements at once. The secret is not memorizing properties — it is understanding the box model and the cascade, the two ideas behind every layout you will ever build.',
      memoryHook: 'CSS is a rulebook: pick a selector, declare the look. Specificity + order decide who wins.',
      quiz: [
        { q: 'Which adds space INSIDE the border of an element?', choices: ['margin', 'padding', 'gap', 'outline'], answerIdx: 1, why: 'Padding is internal spacing; margin pushes neighbors away.' },
        { q: 'Flexbox is the natural tool for…', choices: ['A one-axis row/column of items', 'A full two-axis page grid', 'Styling text', 'Storing data'], answerIdx: 0, why: 'Flex lays out along one axis; grid handles rows AND columns.' },
        { q: ':root { --brand: #5b57d9; } defines a…', choices: ['Class', 'Custom property (variable)', 'Media query', 'Pseudo-element'], answerIdx: 1, why: '--name defines a custom property you reuse with var(--name).' },
      ],
      recall: [
        'Draw (in words) the box model around an element: content, padding, border, margin — and where each space lives.',
        'When would you reach for grid instead of flex? Give a concrete layout example.',
      ],
    },
    'responsive-layout': {
      objectives: [
        'Build mobile-first with fluid units (rem, %, clamp)',
        'Add media queries only where the layout must change',
        'Debug the most common mobile breakages',
      ],
      story: 'You design on a big screen, but your users are on phones on a bus. A layout that survives every screen is not an afterthought — it is a mindset: start small, stay fluid, and only branch when you truly must.',
      memoryHook: 'Design for the smallest screen first; the big screen is just a wider version of the same idea.',
      quiz: [
        { q: 'Which unit scales with the user’s font-size preference?', choices: ['px', 'rem', 'vw only', 'in'], answerIdx: 1, why: 'rem is relative to the root font size — more accessible than fixed px.' },
        { q: 'The #1 cause of “my site is zoomed-out on iPhone” is…', choices: ['Too many images', 'Missing viewport meta tag', 'No JavaScript', 'Too many colors'], answerIdx: 1, why: 'Without <meta name="viewport">, mobile browsers render the desktop layout zoomed out.' },
        { q: 'A media query should be added when…', choices: ['The layout genuinely breaks', 'Every 10px', 'Never', 'Only for colors'], answerIdx: 0, why: 'Fluid layout does most of the work; queries rebalance only where needed.' },
      ],
      recall: [
        'Explain “mobile-first” in two sentences and why it is easier than desktop-first.',
        'List three fluid techniques that avoid needing media queries at all.',
      ],
    },
    'javascript-basics': {
      objectives: [
        'Declare and use variables, conditionals, and loops',
        'Write and call a function with parameters and return',
        'Explain why events make pages feel alive',
      ],
      story: 'HTML is the bones, CSS the wardrobe — JavaScript is the personality. It is the difference between a page that sits there and a page that reacts: a button that counts, a form that checks itself, a menu that opens. Variables are your ingredients, functions your recipes, events your doorbell.',
      memoryHook: 'Variables = ingredients. Functions = recipes. Events = the doorbell that starts one.',
      quiz: [
        { q: 'What does a function with no return statement return?', choices: ['0', 'null', 'undefined', 'an error'], answerIdx: 2, why: 'JavaScript functions implicitly return undefined.' },
        { q: 'Which is used to store a value you can change?', choices: ['const (always immutable)', 'let', 'a tag', 'a query'], answerIdx: 1, hint: 'const is for values that never change.', why: 'let declares a mutable binding; const declares an immutable one.' },
        { q: 'if (x > 10) { … } is an example of…', choices: ['a loop', 'a conditional', 'a function', 'an event'], answerIdx: 1, why: 'It is a conditional — code that runs only when a condition is true.' },
      ],
      recall: [
        'Write, in words, a function that takes a price and returns it with a 15% tip added.',
        'Name the three building blocks (ingredients, recipes, doorbell) and give one real example of each.',
      ],
    },
    'dom-events': {
      objectives: [
        'Explain the DOM as a live model of the page',
        'Attach an event listener and update the page',
        'Choose textContent over innerHTML for user text',
      ],
      story: 'Your page is not a static picture — it is a living tree your script holds by reference. Touch the tree and the screen updates. Events are the “someone did something” signals: a click, a keystroke, a scroll. This is where pages start to feel like apps.',
      memoryHook: 'The DOM is a live tree you can reach into; events are the taps on your shoulder telling you something happened.',
      quiz: [
        { q: 'The safest way to put user-typed text on the page is…', choices: ['innerHTML', 'textContent', 'document.write', 'eval'], answerIdx: 1, why: 'textContent escapes HTML, so typed text can never inject markup.' },
        { q: 'addEventListener("click", fn) does what?', choices: ['Removes a listener', 'Runs fn whenever the click event fires', 'Clicks the element', 'Loads a script'], answerIdx: 1, why: 'It registers fn to run when the click event fires on the element.' },
        { q: 'querySelector(".card") returns…', choices: ['All cards', 'The first matching element', 'A new card', 'Nothing ever'], answerIdx: 1, why: 'querySelector returns the first match; querySelectorAll returns all.' },
      ],
      recall: [
        'Describe what happens between a user clicking a button and the page text changing.',
        'Why does innerHTML with user text risk XSS? Explain in one sentence.',
      ],
    },
    'apis-fetch': {
      objectives: [
        'Fetch JSON from an API with fetch()',
        'Handle promises and the not-ok response',
        'Render fetched data and handle failure gracefully',
      ],
      story: 'Most useful apps are conversations between your page and someone else’s server. fetch() is the phone call: you dial a URL, wait politely for the reply, and decide what to show — including what to do when nobody picks up.',
      memoryHook: 'fetch() = you text the server “send me data”, wait, then paint the reply — and plan for “message failed”.',
      quiz: [
        { q: 'fetch() rejected, but res.ok is false. What happened?', choices: ['The network failed', 'The server answered with 404/500', 'JSON was invalid', 'Nothing'], answerIdx: 1, why: 'Only network failure rejects; HTTP errors still resolve — you must check res.ok.' },
        { q: 'The correct way to read a JSON response is…', choices: ['res.text()', 'res.json()', 'res.body', 'JSON.parse(res)'], answerIdx: 1, why: 'res.json() parses the body into an object and returns a promise.' },
        { q: 'async/await is…', choices: ['A database', 'A readable syntax over promises', 'A new HTML tag', 'A CSS property'], answerIdx: 1, why: 'async/await is syntactic sugar for working with promises sequentially.' },
      ],
      recall: [
        'List the two kinds of “failure” fetch can have, and how you detect each.',
        'Explain why you should always show a fallback when an API call fails.',
      ],
    },
    'web-project': {
      objectives: [
        'Combine semantic HTML, responsive CSS, and JS into one page',
        'Test for the smallest screen and accessibility',
        'Ship a small, complete project and iterate',
      ],
      story: 'You know the pieces. Now the real skill: putting them together into something that ships. A great first project is small, finishes fully, and works where your users actually are — not just on your laptop.',
      memoryHook: 'Finish small, finish fully, test where your users are — then ship and iterate.',
      quiz: [
        { q: 'The FIRST thing to check after a page “looks done” is…', choices: ['Colors', '320px + accessibility basics', 'More features', 'Fonts'], answerIdx: 1, why: 'Test where users actually are — small screens and assistive tech — before adding anything.' },
        { q: 'A good first project is…', choices: ['Huge and unfinished', 'Small, complete, and shippable', 'Copy-pasted', 'Desktop-only'], answerIdx: 1, why: 'Completing a small thing teaches more than starting a big one.' },
        { q: 'Semantic HTML + responsive CSS + a sprinkle of JS is…', choices: ['Overkill', 'The proven base for a real page', 'Outdated', 'Only for demos'], answerIdx: 1, why: 'It is the foundation every production site is built on.' },
      ],
      recall: [
        'Describe your own “done” checklist for a one-page project in five bullet points.',
        'What does “ship, then iterate” mean, and why is it better than perfect-first?',
      ],
    },
  },

  /* ───────────────────────────── PYTHON ────────────────────────────── */
  python: {
    'python-syntax': {
      objectives: [
        'Declare variables and use f-strings',
        'Read and write indentation-based blocks',
        'Use lists and dicts for everyday data',
      ],
      story: 'Python reads like a calm, well-organized to-do list: names point to values, indentation is the grammar, and f-strings let you build sentences out of data. It is the friendliest door into automating the boring parts of your day.',
      memoryHook: 'Indentation IS the code block. Miss a space, change the meaning.',
      quiz: [
        { q: 'f"Hi {name}" is…', choices: ['A regex', 'An f-string (interpolated string)', 'A list', 'A decorator'], answerIdx: 1, why: 'f-strings interpolate expressions inside { } directly into the string.' },
        { q: 'user["name"] reads a value from a…', choices: ['List', 'Dict', 'Tuple', 'Set'], answerIdx: 1, why: 'Dicts map keys to values and are accessed with ["key"].' },
        { q: 'What opens a code block in Python?', choices: ['{ }', 'begin/end', 'A colon + indentation', 'do…end'], answerIdx: 2, why: 'A colon introduces the block; consistent 4-space indentation defines it.' },
      ],
      recall: [
        'From memory, write a small snippet that stores a name and prints “Hi, <name>!”.',
        'Explain what happens when indentation is inconsistent inside one block.',
      ],
    },
    'python-control': {
      objectives: [
        'Write for loops (with enumerate) over sequences',
        'Define functions with parameters, defaults, and return',
        'Guard against empty inputs before dividing',
      ],
      story: 'Loops do the boring work a thousand times; functions package your cleverness once and reuse it forever. Together they turn “I could automate this” into “I automated this.”',
      memoryHook: 'for does the repetition, def packages the logic, return hands back the result.',
      quiz: [
        { q: 'len([1, 2, 3]) returns…', choices: ['2', '3', 'None', 'a TypeError'], answerIdx: 1, why: 'len() counts items in any sequence.' },
        { q: 'Which value is falsy?', choices: ['"0"', '[]', '{x: 1}', '-1'], answerIdx: 1, why: 'An empty list is falsy; non-empty strings and negative numbers are truthy.' },
        { q: 'Why is "if not numbers:" a good guard before len(numbers)?', choices: ['It is faster', 'It avoids dividing by zero on an empty list', 'It looks neat', 'It is required syntax'], answerIdx: 1, why: 'Guarding empty input prevents a ZeroDivisionError.' },
      ],
      recall: [
        'Write, in words, a function average(numbers) that returns 0 for an empty list.',
        'What does enumerate() give you that a plain for over a list does not?',
      ],
    },
    'python-data': {
      objectives: [
        'Read and clean messy data with lists and dicts',
        'Compute totals, averages, and top values',
        'Write a mini-analysis with real numbers',
      ],
      story: 'Real data is messy — missing values, weird types, duplicates. The skill is not the math, it is the wrangling: turning a pile of rows into a clean list of numbers you can trust, then answering “what actually happened?” with numbers, not vibes.',
      memoryHook: 'Garbage in, garbage out — clean the data before you believe the numbers.',
      quiz: [
        { q: 'The safest way to convert a string "42" to an integer is…', choices: ['str(42)', 'int("42")', 'float("42")', '42 + ""'], answerIdx: 1, hint: 'You want an integer.', why: 'int() converts a numeric string to an integer.' },
        { q: 'The average of [2, 4, 6] is…', choices: ['3', '4', '6', '12'], answerIdx: 1, why: '(2+4+6)/3 = 4.' },
        { q: 'You spot a row with value 99999 among prices 10–100. Likely it is…', choices: ['A great deal', 'An outlier/error to investigate', 'The average', 'A duplicate'], answerIdx: 1, why: 'Outliers are often data errors — investigate before trusting them.' },
      ],
      recall: [
        'Describe the steps to go from a raw CSV string to an average price you trust.',
        'Why should you show BOTH an average and the spread (min/max) of your data?',
      ],
    },
  },

  /* ─────────────────────────── UI DESIGN ───────────────────────────── */
  'ui-design': {
    'visual-hierarchy': {
      objectives: [
        'Explain how size, weight, and spacing create hierarchy',
        'Direct the eye to ONE primary action per screen',
        'Audit a screen and spot hierarchy mistakes',
      ],
      story: 'Users do not read screens — they scan them. In a fraction of a second, the eye decides what matters. Visual hierarchy is the quiet skill of making that decision for them: one big thing first, everything else in proportion.',
      memoryHook: 'If everything is emphasized, nothing is. Make ONE thing loud.',
      quiz: [
        { q: 'The strongest tool for hierarchy is…', choices: ['More decoration', 'Contrast in size, weight, and spacing', 'More colors', 'Longer text'], answerIdx: 1, why: 'Size, weight, and whitespace differences do the heavy lifting for hierarchy.' },
        { q: 'A screen should generally have…', choices: ['Every button equally loud', 'ONE primary action', 'No buttons', 'Only text'], answerIdx: 1, why: 'One primary action per screen keeps the user’s decision easy.' },
        { q: 'White space is…', choices: ['Wasted space', 'An active design tool that groups and separates', 'A bug', 'Only for aesthetics'], answerIdx: 1, why: 'Whitespace groups related items and separates unrelated ones.' },
      ],
      recall: [
        'Pick any app screen you use and describe its hierarchy: what do you see first, second, third?',
        'Explain why “make the logo bigger” is usually the wrong fix for a weak hierarchy.',
      ],
    },
    'color-type': {
      objectives: [
        'Choose an accessible color contrast',
        'Pair a display typeface with a readable one',
        'Build a tiny type scale with consistent rhythm',
      ],
      story: 'Color and type are the voice of a product — they set the mood before a single word is read. But voice fails if it cannot be heard: low contrast and cramped type quietly chase people away. Good design here is measurable, not just taste.',
      memoryHook: 'Type sets the voice; contrast keeps it audible. Design for the tired eye.',
      quiz: [
        { q: 'Body text should meet a contrast ratio of at least…', choices: ['1.5:1', '4.5:1', '20:1', 'no rule'], answerIdx: 1, why: 'WCAG AA requires ≈4.5:1 for normal body text.' },
        { q: 'A good pairing is usually…', choices: ['Two decorative fonts', 'A display font for headings + a highly readable body font', 'One font everywhere at 10px', 'All caps everywhere'], answerIdx: 1, why: 'Contrast the display face with a clean, legible body face.' },
        { q: 'Line-height for comfortable reading is roughly…', choices: ['0.8', '1.4–1.6', '3.0', 'irrelevant'], answerIdx: 1, why: '1.4–1.6 gives the eye room to track lines.' },
      ],
      recall: [
        'Name two ways to check contrast, and what ratio you are aiming for.',
        'Explain why mixing two nearly-identical fonts looks broken but two clearly different ones looks intentional.',
      ],
    },
    'mobile-ui-patterns': {
      objectives: [
        'Recognize common mobile patterns (cards, tabs, bottom nav)',
        'Design thumb-friendly touch targets',
        'Apply a consistent spacing scale',
      ],
      story: 'Phones are used one-handed, on the move, at arm’s length. The best mobile UIs respect the thumb: big targets, reachable navigation, and a rhythm of spacing that feels inevitable. Patterns exist because thumbs do.',
      memoryHook: 'Design for the thumb, not the cursor: 44px targets, reachable nav, one idea per card.',
      quiz: [
        { q: 'A comfortable minimum touch target is about…', choices: ['20px', '44px', '8px', '1px'], answerIdx: 1, why: 'Apple/Google guidelines point to ≈44–48px for reliable tapping.' },
        { q: 'Primary navigation on a phone usually lives…', choices: ['Top-left hamburger only', 'Bottom of the screen (thumb zone)', 'A hidden menu', 'A popup'], answerIdx: 1, why: 'Bottom nav sits in the natural thumb reach.' },
        { q: 'A card is a good pattern for…', choices: ['Grouping one idea with its action', 'Dense tables', 'Hiding everything', 'Print layouts'], answerIdx: 0, why: 'Cards bundle one idea + its action into a scannable unit.' },
      ],
      recall: [
        'List three thumb-zone patterns and why they beat desktop patterns on mobile.',
        'Describe a consistent spacing scale and why it matters more than “eyeballing” gaps.',
      ],
    },
  },
};
