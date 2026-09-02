/**
 * Nimiq Blockchain Education — a full standalone skill.
 *
 * Written to the same schema as every other skill in kb.js so it flows
 * through the existing path → lesson → practice → proof pipeline unchanged:
 *   topics[]: { slug, title, estMin, difficulty, lesson{}, practice[], challenge{} }
 * plus the enriched lesson fields (objectives, story, memoryHook, quiz, recall)
 * introduced by the curriculum upgrade.
 *
 * Facts are deliberately conservative and accurate to Nimiq 2.0
 * (Proof-of-Stake, live since Nov 2024). Educational content — not
 * financial advice.
 */

export const NIMIQ_SKILL = {
  slug: 'nimiq-blockchain',
  name: 'Nimiq Blockchain',
  category: 'blockchain',
  emoji: '⛓️',
  blurb: 'Understand the browser-first payment blockchain — keys, wallets, staking, and building on Nimiq.',
};

export const NIMIQ_KB = {
  goalKeywords: ['nimiq', 'blockchain', 'crypto', 'cryptocurrency', 'web3', 'wallet', 'staking', 'nim', 'payment', 'decentralized', 'cryptocurrencies'],
  topics: [
    {
      slug: 'blockchain-basics',
      title: 'What Is a Blockchain?',
      estMin: 25,
      difficulty: 1,
      objectives: [
        'Explain what a blockchain is in one plain sentence',
        'Describe how hashing links blocks and makes history tamper-evident',
        'Say why a shared public ledger removes the middleman',
      ],
      story:
        'Two strangers who have never met want to trade — no bank, no app, no middleman. How can they trust each other? A blockchain answers that question: a shared notebook that everyone can read, that no single person can quietly edit, and that strangers can rely on without knowing each other at all.',
      memoryHook: 'A blockchain is a chain of receipts. Tear one receipt, and every receipt after it shows the tear.',
      lesson: {
        tldr: 'A blockchain is a shared, tamper-evident ledger. Records are bundled into blocks, chained with hashes, and kept by many computers instead of one company.',
        sections: [
          { h: 'A ledger everyone shares', body: 'A blockchain is a list of records — transactions — bundled into blocks. Each block carries a fingerprint (a hash) of the one before it, so the blocks form a chain. Thousands of computers keep an identical copy, so no single company or government owns the truth.' },
          { h: 'Why hashes make it tamper-evident', body: 'A hash is a short code computed from data: change one character and the hash changes completely. Since each block contains the previous block’s hash, editing one old record breaks the link — and every block after it. To fake history you would have to rewrite all later blocks on most of the network at once.' },
          { h: 'Trust without a middleman', body: 'Because the ledger is public and verified by many independent computers, you can send value directly to a stranger. Nobody has to ask a bank “is this real?” — the network already agreed on it, out in the open.' },
        ],
        example: {
          text: 'Ada sends 10 NIM to Ben. Her wallet signs the transaction with her private key. The network checks: does Ada have the funds, and is the signature real? Validators agree, the transaction is bundled into block #4812, and the block is appended to the chain. Ben’s wallet now shows +10 NIM — no bank involved.',
        },
        ask: 'If someone secretly edits one old block, what happens to every block that came after it?',
        keyPoints: [
          'Blocks of records, chained by hashes',
          'Copies live on many computers — no single owner',
          'Edit history and the chain visibly breaks',
          'NIM is the native asset of the Nimiq blockchain',
        ],
        misconception: '“Blockchain = Bitcoin.” Many different blockchains exist. Nimiq is a separate network specialized for fast, cheap payments that run in any browser.',
      },
      practice: [
        { q: 'What links one block to the next?', choices: ['A password', 'The previous block’s hash', 'A bank signature', 'The block’s color'], answerIdx: 1, hint: 'It is a short code computed from the data.', why: 'Each block stores the previous block’s hash — that is the “chain” part.' },
        { q: 'Why is a blockchain hard to tamper with?', choices: ['It is stored in one vault', 'Changing one block breaks every later block and copies are everywhere', 'Only one company can edit it', 'Blocks are encrypted so nobody can read them'], answerIdx: 1, hint: 'Think about the chain of hashes.', why: 'Editing a block changes its hash, which invalidates the next link — and you would need to redo this on most of the network.' },
      ],
      quiz: [
        { q: 'A hash is best described as…', choices: ['A secret password', 'A fingerprint computed from data', 'A block of transactions', 'A type of wallet'], answerIdx: 1, why: 'Hashes are deterministic “fingerprints” of data — same input, same hash; any change, totally different hash.' },
        { q: 'Who owns the “single source of truth” on a public blockchain?', choices: ['The founder', 'A regulator', 'No one — copies are shared across the network', 'The largest bank'], answerIdx: 2, why: 'The ledger is replicated across many independent computers; no single party controls it.' },
        { q: 'NIM is…', choices: ['A Nimiq wallet brand', 'The native asset of the Nimiq blockchain', 'A programming language', 'A mining rig'], answerIdx: 1, why: 'NIM is the native coin used for value transfer, staking and fees on Nimiq.' },
      ],
      recall: [
        'In your own words, explain to an 8-year-old why you cannot just “delete” a payment from a blockchain.',
        'Describe, step by step, what happens between someone pressing “send” and the receiver seeing the funds.',
      ],
      challenge: {
        type: 'explain', kind: 'checkpoint', title: 'Explain a blockchain to a friend', timeMin: 25,
        brief: 'Explain what a blockchain is and why it can be trusted, in 100–160 of your own words — as if teaching a non-technical friend. Cover blocks, hashing, and why no middleman is needed. Use a concrete everyday analogy.',
        requirements: ['defines blockchain plainly', 'explains blocks + hashing', 'says why no middleman is needed', 'uses an analogy', '100+ words'],
        passScore: 70, rewardNim: 2, xp: 100,
        evaluator: { type: 'explain', config: { minWords: 90, targetWords: 150, keyConcepts: ['block', 'hash', 'ledger', 'trust', 'chain', 'transact'], keyConceptRatio: 0.5, headings: 1 } },
      },
    },
    {
      slug: 'nimiq-accounts',
      title: 'Accounts, Addresses & Keys',
      estMin: 30,
      difficulty: 2,
      objectives: [
        'Distinguish a private key from a public key and an address',
        'Explain what “signing a transaction” means',
        'List the safety rules that protect a Nimiq account',
      ],
      story:
        'You just received 100 NIM. What actually happened? Somewhere on the network, a message was signed with a key that only you hold — and your address is the public label the world can see. Everything in crypto is built on this one idea: a secret that proves ownership.',
      memoryHook: 'Private key = the PIN that can never be changed. Address = the account number you can safely show everyone.',
      lesson: {
        tldr: 'Your Nimiq account is a pair of keys. The private key stays secret and signs transactions; the public key and address are shared so others can find you and verify your signature.',
        sections: [
          { h: 'Keys: public and private', body: 'Every account is a pair of keys. The private key is a secret number only you hold — it is the ability to move funds. From it, a public key is derived, and from that, your address (on Nimiq, addresses look like “NQ…”). This is one-way math: anyone can go private → public → address, but nobody can reverse it.' },
          { h: 'Signing proves ownership', body: 'To send NIM, your wallet signs the transaction with your private key, producing a signature. Anyone can verify that signature against your public key, proving the spender really owns the account — without ever seeing the private key.' },
          { h: 'Recovery words', body: 'Most wallets display a recovery phrase — usually 24 words — when you first create an account. Those words ARE the key, written in human-readable form. Whoever has them controls the account. Write them down offline; never type them into a website.' },
        ],
        example: {
          text: 'Your private key is like the key to a mailbox. Your address is the mailbox number painted on the outside: everyone can see it and drop mail in, but only the key opens it. Signing a transaction is like stamping your wax seal on a note — anyone can check the seal is yours, but only you can make it.',
        },
        ask: 'Why can you share your Nimiq address openly, but must never share your recovery words?',
        keyPoints: [
          'Private key = control. Public key + address = identity',
          'Transactions are signed; signatures are verifiable by anyone',
          'Recovery words (≈24) ARE your private key',
          '“Not your keys, not your coins”',
        ],
        misconception: '“My coins live in my wallet app.” Coins are entries on the blockchain; the wallet only holds the keys that control them. Lose the keys and the coins stay locked on-chain forever.',
      },
      practice: [
        { q: 'What can you safely share with anyone?', choices: ['Your private key', 'Your recovery words', 'Your address', 'Your key file'], answerIdx: 2, hint: 'Which one is meant to be public?', why: 'The address is the public identifier; the private key and recovery words are secrets.' },
        { q: 'A transaction signature proves…', choices: ['The transaction is fast', 'The sender holds the private key', 'The receiver is honest', 'The fee was paid'], answerIdx: 1, hint: 'It is verified against a public key.', why: 'Only the holder of the private key can produce a signature that verifies against the public key.' },
      ],
      quiz: [
        { q: 'Your recovery phrase is best described as…', choices: ['A login password for the app', 'Your private key in word form', 'A customer support code', 'A public nickname'], answerIdx: 1, why: 'The mnemonic encodes the private key — possession of the words means control of the funds.' },
        { q: 'Which is one-way (easy one direction, impossible the other)?', choices: ['address → private key', 'private key → address', 'signature → private key', 'public key → private key'], answerIdx: 1, hint: 'You derive the address FROM the key.', why: 'Deriving the address from the private key is fast; reversing it is computationally infeasible.' },
        { q: 'The safest place for recovery words is…', choices: ['A screenshot in your camera roll', 'A note in your email', 'Paper stored offline (fire-safe)', 'A message to a friend'], answerIdx: 2, why: 'Offline, physical storage cannot be reached by malware or a leaked cloud account.' },
      ],
      recall: [
        'Explain the difference between a private key, a public key, and an address — in one paragraph.',
        'List three real-world ways people lose access to their funds, and the rule that prevents each one.',
      ],
      challenge: {
        type: 'explain', kind: 'checkpoint', title: 'Keys & signing explained', timeMin: 30,
        brief: 'Explain how a Nimiq account works in 120–180 of your own words: private vs public key vs address, what signing does, and the exact safety rules for recovery words. Imagine your reader will store NIM for the first time tomorrow.',
        requirements: ['private vs public key vs address', 'explains signing', 'recovery-word safety rules', 'why “not your keys, not your coins”', '120+ words'],
        passScore: 70, rewardNim: 2, xp: 100,
        evaluator: { type: 'explain', config: { minWords: 110, targetWords: 170, keyConcepts: ['private', 'public', 'address', 'sign', 'recovery', 'key'], keyConceptRatio: 0.55, headings: 1 } },
      },
    },
    {
      slug: 'nimiq-consensus',
      title: 'How Nimiq Stays Honest (Proof of Stake)',
      estMin: 30,
      difficulty: 2,
      objectives: [
        'Explain why a blockchain needs agreement (consensus)',
        'Describe how Nimiq’s Proof of Stake works in plain terms',
        'State what staking and delegation are, and the risks',
      ],
      story:
        'If anyone can add a block, what stops someone from adding a fake “I have a million NIM” block? Nothing — unless the network has a way to agree. Nimiq’s answer is Proof of Stake: the people who verify blocks put their own NIM on the line.',
      memoryHook: 'Validators put skin in the game: behave, and earn; misbehave, and get benched (and lose rewards).',
      lesson: {
        tldr: 'Nimiq 2.0 uses Proof of Stake: validators lock up NIM as collateral, take turns proposing and verifying blocks, and earn rewards for honesty — while misbehavior is punished, so cheating does not pay.',
        sections: [
          { h: 'Why consensus exists', body: 'A blockchain is only as trustworthy as the agreement about which blocks are real. Consensus is the rule set that lets thousands of independent computers agree on one history — and ignore anyone who tries to write a different one.' },
          { h: 'Proof of Stake on Nimiq', body: 'In Nimiq 2.0 (live since 2024), validators stake NIM to participate. Validators are chosen to produce and check blocks; honest work earns rewards. Misbehaving validators can be temporarily jailed for up to about four days — losing rewards, not their principal.' },
          { h: 'Staking & delegation', body: 'You do not need to run a validator to participate: you can delegate NIM to a validator or staking pool (from as little as 100 NIM) and share rewards. Delegation is non-custodial — your funds stay under your control, and you can redelegate if a validator goes quiet.' },
        ],
        example: {
          text: 'You delegate 500 NIM to a validator. Each day the validator produces blocks and collects rewards, then shares them with delegators proportional to their stake. If the validator starts misbehaving, it is jailed and rewards stop — but your 500 NIM remains yours, and you can move it to a different validator.',
        },
        ask: 'Why would a rational validator prefer behaving honestly over trying to cheat?',
        keyPoints: [
          'Consensus = agreeing on one shared history',
          'Validators stake NIM and earn for honest work',
          'Misbehavior → temporary jailing, not loss of principal',
          'Delegation is non-custodial; you stay in control',
        ],
        misconception: '“Staking gives away your coins.” On Nimiq, delegation is non-custodial — you never hand over ownership, only a vote of trust. (Always verify the specific wallet/pool you use.)',
      },
      practice: [
        { q: 'What do validators put at risk to participate?', choices: ['Their reputation points', 'Staked NIM (rewards, and their ability to earn)', 'Their email account', 'Nothing'], answerIdx: 1, hint: 'Think “skin in the game”.', why: 'Validators stake NIM; misbehavior costs them rewards via jailing.' },
        { q: 'Delegating NIM to a pool means…', choices: ['Giving the pool your private keys', 'Lending your NIM so it can be spent', 'Trusting them to validate while you keep ownership', 'Selling your NIM'], answerIdx: 2, hint: 'Non-custodial.', why: 'Delegation is non-custodial — your funds remain yours.' },
      ],
      quiz: [
        { q: 'The main job of a consensus mechanism is…', choices: ['Making blocks bigger', 'Agreeing on one true history', 'Encrypting transactions', 'Printing new coins'], answerIdx: 1, why: 'Consensus lets independent computers agree which blocks are valid — one shared history.' },
        { q: 'On Nimiq, a misbehaving validator is…', choices: ['Banned forever and funds burned', 'Temporarily jailed (up to ~4 days) and loses rewards', 'Ignored but still paid', 'Rewarded for trying'], answerIdx: 1, why: 'Nimiq’s PoS jails misbehaving validators temporarily; they stop earning during that window.' },
        { q: 'Proof of Stake is more energy-efficient than Proof of Work because…', choices: ['It uses no computers', 'Validators are chosen by stake, not by racing to solve puzzles', 'It has no fees', 'It only has one validator'], answerIdx: 1, why: 'PoS selects block producers by stake rather than massive compute races, cutting energy use dramatically.' },
      ],
      recall: [
        'Explain, as if to a skeptical friend, why someone staking thousands of NIM is unlikely to attack the network.',
        'Compare staking by running your own validator versus delegating to a pool — two pros and two cons each.',
      ],
      challenge: {
        type: 'explain', kind: 'checkpoint', title: 'Explain Proof of Stake', timeMin: 30,
        brief: 'In 120–180 of your own words, explain how Nimiq’s Proof of Stake keeps the network honest: what validators do, how staking works, what happens to misbehaving validators, and what delegation means for a normal holder.',
        requirements: ['what validators do', 'how staking works', 'punishment for misbehavior', 'delegation explained', '120+ words'],
        passScore: 70, rewardNim: 2, xp: 100,
        evaluator: { type: 'explain', config: { minWords: 110, targetWords: 170, keyConcepts: ['stake', 'validator', 'delegate', 'reward', 'jail', 'consensus'], keyConceptRatio: 0.55, headings: 1 } },
      },
    },
    {
      slug: 'nimiq-wallets',
      title: 'Wallets: Nimiq Wallet, Hub & Pay',
      estMin: 30,
      difficulty: 2,
      objectives: [
        'Explain what a self-custodial wallet really stores',
        'Tell Nimiq Wallet, Nimiq Hub, and Nimiq Pay apart',
        'Write a sensible wallet safety checklist',
      ],
      story:
        'Your first NIM arrives — where does it “go”? Not into an app. It stays on the blockchain; your wallet is the key-ring. Choosing and securing that key-ring is the difference between owning your money and hoping someone else keeps it safe.',
      memoryHook: 'The wallet stores keys, not coins. Guard the key-ring and the coins guard themselves.',
      lesson: {
        tldr: 'A wallet is software that holds your keys and signs transactions. Nimiq offers a browser-first stack — the Nimiq Wallet (web app with staking), Nimiq Hub (browser extension), and Nimiq Pay — all built around self-custody.',
        sections: [
          { h: 'What a wallet actually is', body: 'A wallet does not contain coins. It stores your private keys (or recovery phrase), shows your balances by reading the blockchain, and signs transactions when you approve them. Lose the wallet software, not the problem — the keys are what matter.' },
          { h: 'The Nimiq wallet family', body: 'Nimiq Wallet is the official web app: send/receive NIM, manage BTC and USDC/USDT (e.g. on Polygon), and stake NIM — all from the browser. Nimiq Hub is the browser-extension wallet that websites can connect to with one tap. Nimiq Pay is a wallet experience aimed at everyday payments. All are non-custodial: you hold the keys.' },
          { h: 'The demo wallet (in PROOF)', body: 'PROOF adds a demo wallet so you can try the full earn-and-prove loop without real funds. Its keys exist only for the demo experience. For real NIM, you use Nimiq Wallet, Hub, or Pay — and you, not the app, control the recovery words.' },
        ],
        example: {
          text: 'A website says “Connect wallet.” You click, Nimiq Hub opens, and you approve a connection — the site can now see your address and ask you to sign requests. Nothing moves without your approval, because only your keys can sign. That is self-custody in action.',
        },
        ask: 'If you delete the Nimiq Wallet app from your phone but kept your recovery words, are your coins gone?',
        keyPoints: [
          'Wallets store keys and sign; coins stay on-chain',
          'Nimiq Wallet: web app with staking + multi-asset',
          'Nimiq Hub: browser extension for one-tap site connections',
          'Demo wallet in PROOF = practice keys only',
        ],
        misconception: '“A hardware/app wallet is where coins live.” Coins never leave the blockchain. Any compatible wallet that has your recovery words can access them.',
      },
      practice: [
        { q: 'What does a self-custodial wallet actually store?', choices: ['A copy of your coins', 'Your private keys', 'The whole blockchain', 'Your bank login'], answerIdx: 1, hint: 'Coins stay on-chain.', why: 'The wallet holds keys and signs; the blockchain holds the balances.' },
        { q: 'Which is the browser-extension wallet for connecting to sites?', choices: ['Nimiq Pay only', 'Nimiq Hub', 'A PDF file', 'Nimiq Explorer'], answerIdx: 1, hint: 'Extensions live in the browser.', why: 'Nimiq Hub is the browser extension sites connect to.' },
      ],
      quiz: [
        { q: 'You uninstall your wallet app but kept your 24 words. Your funds are…', choices: ['Gone', 'Recoverable in any compatible wallet', 'Only recoverable via support', 'Converted to points'], answerIdx: 1, why: 'The recovery words are the key — import them into any compatible wallet to regain access.' },
        { q: 'The demo wallet in PROOF is for…', choices: ['Real NIM trading', 'Practicing the loop with fake keys', 'Mining', 'Storing your recovery phrase'], answerIdx: 1, why: 'It simulates the wallet experience so you can learn without real funds.' },
        { q: 'A safe routine after creating a real wallet is…', choices: ['Post a photo of the words online', 'Write words on paper offline and test a small send', 'Save words in a note app', 'Share words with support when asked'], answerIdx: 1, why: 'Offline paper backup + a small test transaction verifies everything works before you commit large amounts.' },
      ],
      recall: [
        'Write a five-step safety checklist for someone storing NIM for the first time.',
        'Explain the difference between Nimiq Wallet, Nimiq Hub, and Nimiq Pay in two sentences each.',
      ],
      challenge: {
        type: 'explain', kind: 'checkpoint', title: 'Design a wallet setup', timeMin: 30,
        brief: 'Recommend and justify a wallet setup for a beginner who will earn small NIM payments: which wallet, how they should back it up, and a numbered safety checklist. 120–180 words, your own words.',
        requirements: ['which wallet + why', 'backup method', 'numbered safety checklist', 'mentions recovery words', '120+ words'],
        passScore: 70, rewardNim: 2, xp: 100,
        evaluator: { type: 'explain', config: { minWords: 110, targetWords: 170, keyConcepts: ['wallet', 'key', 'recovery', 'backup', 'phrase', 'self-custody'], keyConceptRatio: 0.55, headings: 2 } },
      },
    },
    {
      slug: 'building-on-nimiq',
      title: 'Sending Value & Building on Nimiq',
      estMin: 45,
      difficulty: 3,
      objectives: [
        'Explain the lifecycle of a NIM transaction',
        'Describe why Nimiq is suited to browser apps',
        'Sketch (in pseudocode) a Nimiq-powered payment flow',
      ],
      story:
        'You have built apps before. Now imagine paying inside one — tipping a creator, unlocking a lesson, settling a gig — with no card processor, no 3% fee, no payout delay. That is what building on Nimiq feels like: payments as a feature your code can call.',
      memoryHook: 'On Nimiq, “send money” is just another function your app can call — from the browser, to anyone.',
      lesson: {
        tldr: 'Sending NIM is a signed transaction the network confirms in about a second. Because Nimiq is browser-first, apps can connect to a wallet, request signatures, and move value directly — no server-side card processor required.',
        sections: [
          { h: 'The life of a transaction', body: 'A transaction states: from, to, amount, fee. Your wallet signs it; validators include it in a block; and once finalized, the receiver’s balance updates. On Nimiq 2.0 confirmations are fast (targeting about a second), with low fees.' },
          { h: 'The browser-first advantage', body: 'Nimiq was designed for the web: a wallet runs as an extension or web app, and client libraries let any page talk to it. A web app can ask the wallet to sign a payment, then submit it to the network — value transfer without asking users to leave your page.' },
          { h: 'Patterns for builders', body: 'A typical flow: connect to the wallet → get the user’s address → build a transaction → ask the user to sign → broadcast → watch for confirmation → update your UI. Treat the wallet as the user’s approval layer: your app requests, the user signs, the network settles.' },
        ],
        example: {
          lang: 'text',
          code: [
            '// Pseudocode — a tipping button in a web app',
            'wallet = await connectNimiqHub()', // user approves once
            'recipient = "NQxx ..."', // the creator’s address
            'tx = wallet.buildTransaction({ to: recipient, amount: 5 /* NIM */, fee })',
            'await wallet.signAndSend(tx)', // user approves in the wallet
            'await waitForConfirmation(tx.hash)',
            'show("Tip sent!")',
          ].join('\n'),
        },
        ask: 'Why does the app ask the wallet to sign, instead of signing the transaction itself?',
        keyPoints: [
          'Transaction = from, to, amount, fee — signed by the owner',
          'Nimiq 2.0: fast (~1s) confirmations, low fees',
          'Wallet = the user’s approval layer; app requests, user signs',
          'Payments work in-browser with no card processor',
        ],
        misconception: '“Crypto payments need a whole blockchain backend.” The browser wallet + client library handle keys and signing; you can keep your normal app architecture and treat payments as an API.',
      },
      practice: [
        { q: 'Which party must approve (sign) every NIM transaction?', choices: ['The app developer', 'The wallet owner', 'A validator’s support desk', 'Nobody'], answerIdx: 1, hint: 'Only the key holder can sign.', why: 'Only the private key’s owner can produce a valid signature.' },
        { q: 'The right pattern for a web app is…', choices: ['The app holds user keys', 'App requests, user signs in their wallet, network settles', 'Bypass the wallet', 'Store the recovery words in localStorage'], answerIdx: 1, hint: 'Never hold user keys.', why: 'The wallet stays the approval layer; the app never touches private keys.' },
      ],
      quiz: [
        { q: 'A transaction record must include…', choices: ['A hashtag', 'From, to, amount, and a valid signature', 'An email address', 'A photo ID'], answerIdx: 1, why: 'From/to/amount/fee plus a signature that proves ownership of the “from” address.' },
        { q: 'Why is Nimiq called “browser-first”?', choices: ['It only works in Chrome', 'Wallets and client libraries are designed to run in the browser', 'It has no mobile support', 'It requires a plugin for everything'], answerIdx: 1, why: 'Nimiq was built so wallets and apps run natively on the web platform.' },
        { q: 'An app that stores users’ private keys is…', choices: ['More convenient and equally safe', 'A security risk — users should keep their own keys', 'Required by law', 'The only way to build'], answerIdx: 1, why: 'Custodial apps become honeypots; the safe pattern is self-custody with wallet-side signing.' },
      ],
      recall: [
        'Trace a 5 NIM tip from click to the creator’s balance, naming each actor (app, wallet, validators, chain).',
        'List three things an app should NOT do with a user’s keys, and the correct alternative for each.',
      ],
      challenge: {
        type: 'js-static', kind: 'project', title: 'Sketch a Nimiq payment flow', timeMin: 45,
        brief: 'Write pseudocode (in one block) for a Nimiq-powered flow — e.g. tipping a creator or paying for a lesson — that connects a wallet, builds a transaction, asks for signing, sends it, and handles the result. Then explain in comments: what each step does, how the user is protected, and one edge case (e.g. the user rejects, or the network is busy).',
        requirements: ['connect to wallet', 'build a transaction (to/amount)', 'sign + send', 'wait for confirmation / handle result', 'edge case explained'],
        passScore: 70, rewardNim: 3, xp: 150,
        evaluator: { type: 'js-static', config: {
          checks: [
            { id: 'connect', label: 'connects to a wallet', pattern: 'connect|wallet', weight: 20 },
            { id: 'build', label: 'builds a transaction with recipient + amount', pattern: 'to\\s*[:=]|amount|recipient', weight: 20 },
            { id: 'sign', label: 'signs the transaction', pattern: 'sign', weight: 20 },
            { id: 'send', label: 'sends / broadcasts', pattern: 'send|broadcast|submit', weight: 20 },
            { id: 'edge', label: 'handles the result or an edge case', pattern: 'confirm|wait|reject|error|catch|if', weight: 20 },
          ],
          explainMinWords: 30,
        } },
      },
    },
  ],
  finalAssessment: {
    type: 'explain', kind: 'final', title: 'Final Assessment: Design a Nimiq-Powered Product', timeMin: 45,
    brief: 'Design a real product that uses Nimiq (a tipping feature, a pay-per-lesson course, a creator subscription, a gig escrow…). Explain in 180–260 words: what it is, how a transaction flows through it, how keys and wallets keep it secure, whether staking or holding is involved, and the main risk + how you would handle it. Make it concrete with numbers where possible.',
    requirements: ['product idea + user flow', 'transaction lifecycle', 'key/wallet security', 'staking or holding (if relevant)', 'risk + mitigation', '180+ words'],
    passScore: 75, rewardNim: 5, xp: 250,
    evaluator: { type: 'explain', config: { minWords: 170, targetWords: 250, keyConcepts: ['nimiq', 'transaction', 'wallet', 'key', 'sign', 'stake', 'risk'], keyConceptRatio: 0.5, headings: 3 } },
  },
};
