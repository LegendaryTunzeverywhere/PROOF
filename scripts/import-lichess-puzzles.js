import fs from 'node:fs';
import readline from 'node:readline';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { Chess } from 'chess.js';

export function parseRow(line) {
  const fields = parseDelimitedLine(line);
  if (fields[0] === 'PuzzleId') return null;
  const [id, fen, moves, rating, , , , themes] = fields;
  if (!id || !fen || !moves) return null;
  return { id, fen, moves: moves.split(' '), rating: Number(rating) || 1200, themes: String(themes || '').split(' ').filter(Boolean) };
}

export function convertPuzzle(row) {
  const game = new Chess(row.fen);
  const solution = [];

  for (const uci of row.moves) {
    const move = game.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci[4],
    });
    if (!move) return null;
    solution.push(move.san);
  }

  const themes = [...new Set(row.themes.map((theme) => themeMap[theme]).filter(Boolean))];
  if (!themes.length) return null;
  const difficulty = difficultyForRating(row.rating);
  const positionId = `lichess-pos-${row.id}`;
  const puzzleId = `lichess-puzzle-${row.id}`;
  return {
    position: {
      id: positionId,
      fen: row.fen,
      type: 'puzzle',
      sideToMove: new Chess(row.fen).turn(),
      description: `Imported Lichess puzzle ${row.id}`,
      metadata: { source: 'lichess', sourceId: row.id },
    },
    puzzle: {
      id: puzzleId,
      positionId,
      title: `${themes[0].replaceAll('-', ' ')} puzzle`,
      difficulty,
      themes,
      solution,
      solutionExplanation: 'Find the strongest continuation and identify the tactical motif.',
      hints: ['Look for checks, captures, and threats.', `Theme: ${themes.join(', ')}`],
      rating: row.rating,
      topicSlug: `chess-${difficulty}`,
      source: 'lichess',
      metadata: { sourceId: row.id },
    },
  };
}

const inputPath = process.argv[2];
const targetPerBucket = Number(process.argv[3] || 5000);
let supabase;
const themeMap = {
  pin: 'pin',
  fork: 'fork',
  skewer: 'skewer',
  discoveredAttack: 'discovery',
  deflection: 'deflection',
  attraction: 'decoy',
  zwischenzug: 'zwischenzug',
  windmill: 'windmill',
  smotheredMate: 'smothered-mate',
  backRankMate: 'back-rank',
  doubleCheck: 'double-attack',
};

function difficultyForRating(rating) {
  if (rating < 1400) return 'beginner';
  if (rating < 1800) return 'intermediate';
  return 'advanced';
}

function parseDelimitedLine(line) {
  const fields = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && (char === ',' || char === '\t')) {
      fields.push(field);
      field = '';
    } else {
      field += char;
    }
  }
  fields.push(field);
  return fields;
}

const levels = ['beginner', 'intermediate', 'advanced'];
const themes = [...new Set(Object.values(themeMap))];
const targetBuckets = new Set(levels.flatMap((level) => themes.map((theme) => `${level}:${theme}`)));
const counts = new Map();
let imported = 0;
let scanned = 0;
let skipped = 0;
let positionBatch = [];
let puzzleBatch = [];

async function flushBatch() {
  if (!positionBatch.length) return;
  const { error: positionError } = await supabase.from('ChessPosition').upsert(positionBatch, { onConflict: 'id', ignoreDuplicates: true });
  if (positionError) throw positionError;
  const { error: puzzleError } = await supabase.from('ChessPuzzle').upsert(puzzleBatch, { onConflict: 'id', ignoreDuplicates: true });
  if (puzzleError) throw puzzleError;
  imported += puzzleBatch.length;
  console.log(`Imported ${imported} puzzles; scanned ${scanned} rows`);
  positionBatch = [];
  puzzleBatch = [];
}

function allBucketsFilled() {
  return [...targetBuckets].every((bucket) => (counts.get(bucket) || 0) >= targetPerBucket);
}

async function loadExistingCounts() {
  for (const difficulty of levels) {
    for (const theme of themes) {
      const result = await supabase
        .from('ChessPuzzle')
        .select('*', { count: 'exact', head: true })
        .eq('difficulty', difficulty)
        .contains('themes', [theme]);
      if (result.error) throw result.error;
      counts.set(`${difficulty}:${theme}`, result.count || 0);
    }
  }
  console.log(`Existing catalog: ${[...new Set(counts.values())].length ? [...counts.values()].reduce((sum, count) => sum + count, 0) : 0} bucket entries`);
}

async function main() {
  if (!inputPath) {
    console.error('Usage: node scripts/import-lichess-puzzles.js <lichess-puzzles.tsv> [target-per-level-and-theme]');
    process.exit(1);
  }
  if (!Number.isInteger(targetPerBucket) || targetPerBucket < 1) {
    throw new Error('target-per-level-and-theme must be a positive integer');
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await loadExistingCounts();
  const input = readline.createInterface({ input: fs.createReadStream(inputPath), crlfDelay: Infinity });
  for await (const line of input) {
    scanned++;
    if (scanned % 100000 === 0) console.log(`Scanned ${scanned} rows; imported ${imported} puzzles`);
    const row = parseRow(line);
    if (!row) { skipped++; continue; }
    const converted = convertPuzzle(row);
    if (!converted) { skipped++; continue; }
    const buckets = converted.puzzle.themes.map((theme) => `${converted.puzzle.difficulty}:${theme}`);
    const neededBuckets = buckets.filter((bucket) => targetBuckets.has(bucket) && (counts.get(bucket) || 0) < targetPerBucket);
    if (!neededBuckets.length) continue;
    positionBatch.push(converted.position);
    puzzleBatch.push(converted.puzzle);
    for (const bucket of neededBuckets) counts.set(bucket, (counts.get(bucket) || 0) + 1);
    if (puzzleBatch.length >= 500) await flushBatch();
    if (allBucketsFilled()) break;
  }

  await flushBatch();

  console.log(`Imported ${imported} puzzles; scanned ${scanned} rows; skipped ${skipped}.`);
  for (const [bucket, count] of [...counts.entries()].sort()) console.log(`${bucket}: ${count}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
