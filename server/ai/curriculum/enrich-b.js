/**
 * Curriculum enrichment — marketing, ai, writing, data-analysis, languages,
 * business, social-media, music-production, practical-skills.
 * Adds story hooks, learning objectives, memory hooks, mid-lesson quizzes
 * and recall drills to every existing topic. Merged into kb.js at load time.
 */

export const ENRICH_B = {
  /* ───────────────────────────── MARKETING ─────────────────────────── */
  marketing: {
    positioning: {
      objectives: [
        'Define a positioning statement for a product',
        'Identify an audience’s real problem (not just demographics)',
        'Differentiate against obvious competitors',
      ],
      story: 'Most marketing fails before a single ad runs, because nobody can say — in one sentence — who it is for and why it beats the alternative. Positioning is that sentence. Get it right and everything else (copy, ads, pricing) gets easier.',
      memoryHook: 'Positioning = the one sentence that says who it is for and why it wins.',
      quiz: [
        { q: 'A positioning statement must name…', choices: ['The founder', 'The audience, the problem, and the difference', 'The stock price', 'The office location'], answerIdx: 1, why: 'Positioning is audience + problem + differentiation, concisely.' },
        { q: '“Our users are 18–35” is…', choices: ['A complete strategy', 'Demographics, not a real problem', 'A positioning statement', 'A channel plan'], answerIdx: 1, why: 'Demographics describe who; positioning describes the problem you solve for them.' },
        { q: 'The test of good positioning is…', choices: ['Everyone likes it', 'It excludes the wrong customers as much as it attracts the right ones', 'It mentions every feature', 'It is long'], answerIdx: 1, why: 'Strong positioning is specific — it turns some people away on purpose.' },
      ],
      recall: [
        'Write a one-sentence positioning statement for a product you actually use.',
        'Explain why “great for everyone” is the same as “great for no one”.',
      ],
    },
    'campaign-basics': {
      objectives: [
        'Pick the right channels for a given audience',
        'Write a hook, message, and call-to-action',
        'Define the one metric a campaign must move',
      ],
      story: 'A campaign is a bet: this message, in this channel, will move this number. You cannot be everywhere, so you choose the channels where your audience already is, and measure one thing that proves the bet paid off.',
      memoryHook: 'Message × channel × one metric. If you cannot name the metric, it is not a campaign yet.',
      quiz: [
        { q: 'A campaign should be built around…', choices: ['Every channel at once', 'A clear message in a chosen channel, moving one metric', 'The biggest budget', 'The trendiest app'], answerIdx: 1, why: 'Focus beats coverage: one message, one channel, one measurable outcome.' },
        { q: 'A hook is…', choices: ['A legal disclaimer', 'The opening line that earns the next second of attention', 'A checkout page', 'A receipt'], answerIdx: 1, why: 'The hook stops the scroll and buys attention for the rest.' },
        { q: 'The CTA should…', choices: ['Be vague', 'Ask for exactly one next action', 'List ten options', 'Be hidden'], answerIdx: 1, why: 'One clear call-to-action converts far better than many.' },
      ],
      recall: [
        'For a product you like, write a hook, a two-line message, and a CTA.',
        'Explain how you would pick between two channels (e.g. TikTok vs newsletter) for one audience.',
      ],
    },
  },

  /* ─────────────────────────────── AI ──────────────────────────────── */
  ai: {
    prompting: {
      objectives: [
        'Write a specific, context-rich prompt',
        'Iterate on a weak answer instead of starting over',
        'Spot when an AI answer needs verification',
      ],
      story: 'The AI does not know what you want — it guesses from what you give it. A vague prompt gets a vague answer; a prompt with role, context, and a format gets work you can use. Prompting is just clear thinking written down.',
      memoryHook: 'Garbage prompt in, garbage answer out. Give it role, context, and a format.',
      quiz: [
        { q: 'A strong prompt usually includes…', choices: ['A greeting', 'Role, context, and desired format', 'Only keywords', 'A password'], answerIdx: 1, why: 'Role + context + format gives the model the constraints it needs.' },
        { q: 'The best response to a weak AI answer is…', choices: ['Give up', 'Refine the prompt with specifics and re-ask', 'Copy it anyway', 'Yell in caps'], answerIdx: 1, why: 'Iterating the prompt with more specifics is the core skill.' },
        { q: 'AI answers should be…', choices: ['Trusted blindly', 'Treated as a draft to verify', 'Ignored', 'Published as-is'], answerIdx: 1, why: 'Models can be confidently wrong — verify facts before relying on them.' },
      ],
      recall: [
        'Rewrite this weak prompt into a strong one: “help me with my essay”.',
        'Name three things you can add to a prompt to get a much better answer.',
      ],
    },
    'ai-workflows': {
      objectives: [
        'Break a real task into AI-assisted steps',
        'Chain AI outputs into one workflow',
        'Add a human check where accuracy matters',
      ],
      story: 'One prompt is a trick; a workflow is leverage. The professionals chain steps — draft, critique, refine, format — with a human gate where it matters. That is how one person ships work that used to need a team.',
      memoryHook: 'One prompt is a trick. A chain of prompts with a human check is a system.',
      quiz: [
        { q: 'A workflow is…', choices: ['A single long prompt', 'A sequence of AI steps with defined hand-offs', 'A list of apps', 'A team meeting'], answerIdx: 1, why: 'Workflows chain outputs: each step’s result feeds the next.' },
        { q: 'Where accuracy matters (facts, numbers, code), you should…', choices: ['Skip checks to save time', 'Keep a human verification step', 'Assume the AI is right', 'Use a longer prompt only'], answerIdx: 1, why: 'A human gate at the accuracy-critical point prevents confident errors.' },
        { q: 'The biggest time-saver in an AI workflow is…', choices: ['Typing faster', 'Automating the repetitive draft-edit loop', 'More tabs', 'Fewer breaks'], answerIdx: 1, why: 'Automating the repetitive draft→critique→refine loop is where hours come back.' },
      ],
      recall: [
        'Design a three-step AI workflow for writing a weekly report, with a human check marked.',
        'Explain where you would NOT trust the AI in that workflow, and why.',
      ],
    },
  },

  /* ───────────────────────────── WRITING ───────────────────────────── */
  writing: {
    'clarity-first': {
      objectives: [
        'Cut filler and write shorter, stronger sentences',
        'Put the main point first',
        'Explain jargon in plain words',
      ],
      story: 'Nobody is confused by writing that is too clear. Clarity is a discipline: short sentences, main point first, jargon translated. The reader’s attention is a gift — spend it on meaning, not decoration.',
      memoryHook: 'If you cannot explain it simply, you do not understand it yet. Short sentences win.',
      quiz: [
        { q: 'The main point should appear…', choices: ['At the end after suspense', 'First', 'In a footnote', 'Nowhere'], answerIdx: 1, why: 'Lead with the point; readers skim and decide in seconds.' },
        { q: 'A clear sentence is usually…', choices: ['Long with many clauses', 'One idea, plain words', 'Full of jargon', 'Passive and indirect'], answerIdx: 1, why: 'One idea per sentence, in plain words, maximizes understanding.' },
        { q: 'The best fix for jargon is…', choices: ['More jargon', 'A plain-word translation', 'Italics', 'A longer sentence'], answerIdx: 1, why: 'Translate the term into what it actually means for the reader.' },
      ],
      recall: [
        'Rewrite this into one clear sentence: “It is important to note that the utilization of the aforementioned process should be effectuated.”',
        'Explain why the passive voice often weakens clarity, with an example.',
      ],
    },
    'persuasive-structure': {
      objectives: [
        'Build an argument: claim, evidence, objection, reply',
        'Use concrete specifics instead of vague claims',
        'End with one clear ask',
      ],
      story: 'Persuasion is not decoration — it is structure. A claim, backed by evidence, tested against the strongest objection, ending in one clear ask. Master that skeleton and you can persuade in an email, a pitch, or a landing page.',
      memoryHook: 'Claim → evidence → objection → reply → one ask. The skeleton of every argument.',
      quiz: [
        { q: 'A persuasive argument should address…', choices: ['Only praise', 'The strongest objection', 'Nothing risky', 'Only the conclusion'], answerIdx: 1, why: 'Answering the strongest objection makes the case credible.' },
        { q: '“Lots of people love it” is…', choices: ['Strong evidence', 'A vague claim — add specifics', 'A statistic', 'A call to action'], answerIdx: 1, why: 'Specifics (numbers, names, outcomes) persuade; vagueness does not.' },
        { q: 'The ending of persuasive writing should…', choices: ['Introduce a new topic', 'Make one clear ask', 'Apologize', 'Ramble'], answerIdx: 1, why: 'One clear ask converts the argument into action.' },
      ],
      recall: [
        'Outline an argument (claim, evidence, objection, reply, ask) for why a friend should learn to code.',
        'Turn “our product is great” into a specific, evidence-backed claim.',
      ],
    },
  },

  /* ────────────────────────── DATA ANALYSIS ────────────────────────── */
  'data-analysis': {
    'ask-the-question': {
      objectives: [
        'Turn a vague goal into a measurable question',
        'List the data you would need to answer it',
        'Avoid the most common analysis traps',
      ],
      story: 'Analysis without a question is just poking at a spreadsheet. The professionals start with the question — “did our new feature raise retention?” — then gather only the data that can answer it. A sharp question is half the analysis.',
      memoryHook: 'No question, no analysis. Ask “what decision does this data need to support?” first.',
      quiz: [
        { q: 'The first step of a good analysis is…', choices: ['Opening Excel', 'Defining the question to answer', 'Making a chart', 'Collecting everything'], answerIdx: 1, why: 'The question determines what data matters and how to judge the answer.' },
        { q: '“Did X cause Y?” from a single chart is usually…', choices: ['Proof of causation', 'A hint of correlation at best', 'Impossible to ask', 'A full answer'], answerIdx: 1, why: 'Correlation is not causation — charts hint, they rarely prove.' },
        { q: 'The best question is one that…', choices: ['Supports a decision', 'Sounds impressive', 'Has no answer', 'Uses the most data'], answerIdx: 0, why: 'Good analysis informs a decision someone can act on.' },
      ],
      recall: [
        'Turn “I want to know how my shop is doing” into a measurable question.',
        'Name the data you would need to answer it, and one trap to avoid.',
      ],
    },
    'trend-reading': {
      objectives: [
        'Read direction, magnitude, and period from a chart',
        'Separate real trends from noise',
        'Spot and explain outliers',
      ],
      story: 'A chart is a story with a number on it. Reading trends means asking three questions: which direction? how big? over what period? And always checking whether the “trend” is real — or just a lucky blip or a suspicious outlier.',
      memoryHook: 'Direction, magnitude, period — and always ask “is this real, or noise?”',
      quiz: [
        { q: 'A trend has three parts…', choices: ['Color, font, size', 'Direction, magnitude, period', 'Title, axis, legend', 'Mean, median, mode'], answerIdx: 1, why: 'State the direction, how big the change is, and over what time period.' },
        { q: 'A spike on one day is most likely…', choices: ['Always a new trend', 'Noise or an outlier to investigate', 'A bug in the axis', 'The average'], answerIdx: 1, why: 'Single points are noise until they repeat; investigate before believing.' },
        { q: 'An outlier should be…', choices: ['Deleted immediately', 'Investigated — explained or corrected', 'Averaged in silently', 'Ignored'], answerIdx: 1, why: 'Outliers can be real signals or errors — investigate, then decide.' },
      ],
      recall: [
        'Describe a trend you would expect in weekly sales around a holiday, with direction, magnitude, and period.',
        'Explain how you would decide whether a “growth” line is real or just noise.',
      ],
    },
  },

  /* ───────────────────────────── LANGUAGES ─────────────────────────── */
  languages: {
    'fr-greetings': {
      objectives: [
        'Greet someone and introduce yourself in French',
        'Use formal (vous) vs informal (tu) appropriately',
        'Ask and answer “how are you?”',
      ],
      story: 'The first ten words of a conversation set its tone. In French, that means choosing tu or vous — the difference between friendly and polite. Nail the greeting and the whole exchange flows more easily than you expect.',
      memoryHook: 'Bonjour opens the door; tu or vous decides how warm the room is.',
      quiz: [
        { q: '“Comment vous appelez-vous ?” means…', choices: ['How old are you?', 'What is your name? (formal)', 'Where do you live?', 'What time is it?'], answerIdx: 1, why: 'It is the formal way to ask someone’s name.' },
        { q: 'You use “vous” with…', choices: ['A close friend', 'A stranger or elder (polite)', 'A pet', 'Your sibling'], answerIdx: 1, why: 'vous is the polite/formal “you”; tu is for friends and peers.' },
        { q: 'A typical reply to “Ça va ?” is…', choices: ['Ça va bien, merci', 'Oui, je suis un chat', 'Au revoir', 'Dix heures'], answerIdx: 0, why: '“Ça va bien, merci” = “I’m fine, thanks”.' },
      ],
      recall: [
        'Write a short self-introduction: greeting, name, where you are from, how you are.',
        'Explain when you would switch from vous to tu in a new friendship.',
      ],
    },
    'fr-daily': {
      objectives: [
        'Order food and ask for things politely',
        'Use key daily-life phrases with correct politeness',
        'Handle “I don’t understand” gracefully',
      ],
      story: 'Daily life in a language is made of small requests: a coffee, a direction, the bill. Each one is a tiny script — a polite opener, the request, a thanks. Master a handful of scripts and you can survive a whole day in French.',
      memoryHook: 'Every request is a script: bonjour → the ask → s’il vous plaît → merci.',
      quiz: [
        { q: '“Je voudrais un café, s’il vous plaît” means…', choices: ['I would like a coffee, please', 'Where is the café?', 'The coffee is cold', 'I paid already'], answerIdx: 0, why: 'Je voudrais = “I would like”, s’il vous plaît = “please”.' },
        { q: 'To ask for the bill you say…', choices: ['L’addition, s’il vous plaît', 'Bonjour', 'Merci', 'C’est combien ?'], answerIdx: 0, why: 'L’addition = the bill/check.' },
        { q: '“Pouvez-vous répéter, s’il vous plaît ?” is for…', choices: ['Paying', 'Asking someone to repeat', 'Saying goodbye', 'Ordering dessert'], answerIdx: 1, why: 'It asks someone to repeat what they said, politely.' },
      ],
      recall: [
        'Script a short café exchange: greet, order a coffee and a croissant, ask for the bill.',
        'Write two ways to say you did not understand, one formal and one informal.',
      ],
    },
  },

  /* ───────────────────────────── BUSINESS ──────────────────────────── */
  business: {
    'business-models': {
      objectives: [
        'Explain how a business actually makes money',
        'Distinguish revenue models (subscription, marketplace…)',
        'Test whether a model can survive contact with customers',
      ],
      story: '“Cool idea” is not a business. A business model is the honest answer to “how does this make money, from whom, and does it cost less to deliver than it earns?” Ideas die in the gap between those two numbers.',
      memoryHook: 'Who pays, how much, how often — and does it cost you less than that to deliver?',
      quiz: [
        { q: 'A business model describes…', choices: ['The logo', 'How the business creates and captures value (who pays, for what)', 'The office', 'The founders’ hobbies'], answerIdx: 1, why: 'A model = who pays, for what value, and how the economics work.' },
        { q: 'A subscription model earns by…', choices: ['One-off sales only', 'Recurring payments over time', 'Donations', 'Ad clicks only'], answerIdx: 1, why: 'Subscriptions are recurring revenue — customers pay periodically.' },
        { q: '“Surviving contact with customers” means…', choices: ['Customers like the logo', 'The model holds up when real people use and pay for it', 'Avoiding customers', 'Having a big launch'], answerIdx: 1, why: 'Models are tested by real usage and payment behavior, not slides.' },
      ],
      recall: [
        'Pick a business you use and write its model: who pays, how much, how often, and the unit economics.',
        'Explain why “more users” is not a business model by itself.',
      ],
    },
  },

  /* ────────────────────────── SOCIAL MEDIA ─────────────────────────── */
  'social-media': {
    'content-systems': {
      objectives: [
        'Build a repeatable content system instead of random posts',
        'Choose formats that fit your strengths and audience',
        'Plan a batch of content from one core idea',
      ],
      story: 'Going viral is luck; growing is a system. Creators who win do not post randomly — they run a repeatable engine: one core idea, broken into formats, produced in batches, posted on a rhythm. Luck meets you halfway when you show up consistently.',
      memoryHook: 'One core idea → many formats → a batching rhythm. Systems beat bursts of luck.',
      quiz: [
        { q: 'A content system is…', choices: ['Posting whenever inspired', 'A repeatable idea → format → schedule engine', 'One viral post', 'Buying followers'], answerIdx: 1, why: 'Systems turn one idea into consistent, scheduled output.' },
        { q: 'The best format for you depends on…', choices: ['What everyone else does', 'Your strengths and where your audience is', 'The newest app only', 'Random choice'], answerIdx: 1, why: 'Match format to your strengths and your audience’s platform.' },
        { q: 'Batching means…', choices: ['Posting all at once', 'Producing several pieces in one focused session', 'Deleting old posts', 'Copying competitors'], answerIdx: 1, why: 'Batching creates a buffer so posting stays consistent.' },
      ],
      recall: [
        'Pick one core idea and break it into three different content formats.',
        'Design a simple weekly posting rhythm for those formats.',
      ],
    },
  },

  /* ───────────────────────── MUSIC PRODUCTION ───────────────────────── */
  'music-production': {
    'chords-progressions': {
      objectives: [
        'Build a chord progression that resolves',
        'Explain the role of tension and release',
        'Sketch a simple track arrangement',
      ],
      story: 'Almost every song you love is a conversation between tension and release — chords that wander away from “home” and then come back. Learn a handful of progressions and you hold the emotional grammar behind most of modern music.',
      memoryHook: 'Chords are a story: leave home, create tension, come back. Tension → release.',
      quiz: [
        { q: 'The “home” chord of a progression is called the…', choices: ['Bridge', 'Tonic', 'Refrain', 'Drop'], answerIdx: 1, why: 'The tonic is the chord that feels like “home” and resolves tension.' },
        { q: 'A classic four-chord loop is…', choices: ['I–V–vi–IV', 'ii–V–I only', 'Any random chords', 'Just one chord'], answerIdx: 0, why: 'I–V–vi–IV underpins thousands of pop songs.' },
        { q: 'Tension in music comes from…', choices: ['Chords that want to resolve but haven’t', 'Silence only', 'Loudness only', 'The album cover'], answerIdx: 0, why: 'Unresolved chords create pull; resolution releases it.' },
      ],
      recall: [
        'Describe, in words, a I–V–vi–IV progression and where you feel the “arrival”.',
        'Explain the difference between tension and release, with an everyday analogy.',
      ],
    },
  },

  /* ───────────────────────── PRACTICAL SKILLS ──────────────────────── */
  'practical-skills': {
    'budgeting-basics': {
      objectives: [
        'Build a simple monthly budget with categories',
        'Apply a savings rule (e.g. pay yourself first)',
        'Run a weekly money check-in',
      ],
      story: 'Money stress rarely comes from earning too little — it comes from not knowing where the money goes. A budget is not a cage; it is permission to spend without guilt, because you already decided what matters.',
      memoryHook: 'A budget is permission, not punishment: decide first, spend guilt-free.',
      quiz: [
        { q: '“Pay yourself first” means…', choices: ['Buy wants immediately', 'Save/invest before spending the rest', 'Pay bills last', 'Skip saving if money is tight'], answerIdx: 1, why: 'Savings leave on day one; you live on what remains.' },
        { q: 'In 50/30/20, the 20% goes to…', choices: ['Rent', 'Wants', 'Savings & debt payoff', 'Taxes'], answerIdx: 2, why: '20% targets savings and debt reduction.' },
        { q: 'The point of a weekly check-in is…', choices: ['To feel guilty', 'To catch drift early and adjust', 'To avoid spending ever', 'To log every cent forever'], answerIdx: 1, why: 'Weekly reviews catch small drift before it becomes big drift.' },
      ],
      recall: [
        'Write your own monthly budget categories and a rough split that fits your life.',
        'Explain the biggest spending risk you personally face, and the rule that guards against it.',
      ],
    },
  },
};
