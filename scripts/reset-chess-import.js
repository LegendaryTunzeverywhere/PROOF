import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
let inputPath = null;
let targetPerBucket = 5000;
let clearOnly = false;
let dryRun = false;
let source = 'lichess';

for (const arg of args) {
  if (arg === '--clear-only') clearOnly = true;
  else if (arg === '--dry-run') dryRun = true;
  else if (arg === '--all') source = 'all';
  else if (arg.startsWith('--source=')) source = arg.split('=')[1];
  else if (!inputPath) inputPath = arg;
  else if (!Number.isNaN(Number(arg))) targetPerBucket = Number(arg);
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function describeSourceFilter() {
  return source === 'all' ? 'all imported chess rows' : `${source} rows`;
}

async function countRows(tableName) {
  if (source === 'all') {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  }

  if (tableName === 'ChessPosition') {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .filter('metadata->>source', 'eq', source);
    if (error) throw error;
    return count || 0;
  }

  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
    .eq('source', source);
  if (error) throw error;
  return count || 0;
}

async function deleteMatchingRows(tableName, label) {
  const beforeCount = await countRows(tableName);

  let query = supabase.from(tableName).delete();

  if (source !== 'all') {
    if (tableName === 'ChessPosition') {
      query = query.filter('metadata->>source', 'eq', source);
    } else {
      query = query.eq('source', source);
    }
  } else {
    query = query.neq('id', '');
  }

  if (dryRun) {
    console.log(`DRY RUN: would delete ${beforeCount} ${label} rows.`);
    return beforeCount;
  }

  const { error: deleteError } = await query;
  if (deleteError) throw deleteError;

  const afterCount = await countRows(tableName);
  console.log(`Deleted ${beforeCount - afterCount} ${label} rows. Remaining: ${afterCount}.`);
  return beforeCount - afterCount;
}

async function clearChessData() {
  console.log(`Clearing ${describeSourceFilter()}...`);
  const positionCount = await countRows('ChessPosition');
  const puzzleCount = await countRows('ChessPuzzle');

  console.log(`Found ${positionCount} ChessPosition rows and ${puzzleCount} ChessPuzzle rows to clear.`);

  if (dryRun) {
    console.log('Dry run complete. No database rows were deleted.');
    return;
  }

  await deleteMatchingRows('ChessPosition', 'ChessPosition');
  await deleteMatchingRows('ChessPuzzle', 'ChessPuzzle');
  console.log('Chess data cleared.');
}

async function reimportFreshData() {
  if (!inputPath) {
    throw new Error('Usage: node scripts/reset-chess-import.js [--clear-only|--dry-run|--all] <lichess-puzzles.tsv> [target-per-level-and-theme]');
  }

  console.log(`Re-importing fresh ${source === 'all' ? 'all' : source} puzzle data...`);
  const { spawn } = await import('node:child_process');
  const child = spawn(process.execPath, ['scripts/import-lichess-puzzles.js', inputPath, String(targetPerBucket)], {
    stdio: 'inherit',
    env: process.env,
    cwd: process.cwd(),
  });

  child.on('exit', (code) => {
    if (code === 0) {
      console.log('Fresh import completed successfully.');
      return;
    }
    console.error(`Importer exited with code ${code}`);
    process.exit(code ?? 1);
  });
}

async function main() {
  if (clearOnly) {
    await clearChessData();
    return;
  }

  await clearChessData();
  if (inputPath) {
    await reimportFreshData();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
