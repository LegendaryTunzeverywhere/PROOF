# Chess Puzzle Data

PROOF's chess practice catalog uses the Lichess open puzzle database:

- Source: https://database.lichess.org/#puzzles
- License: Creative Commons Attribution-ShareAlike 4.0 International
- License text: https://creativecommons.org/licenses/by-sa/4.0/

The importer preserves the Lichess puzzle identifier in `metadata.sourceId`, stores `source: 'lichess'`, and maps Lichess motif names to PROOF's chess motif taxonomy.

## Importing More Puzzles

1. Apply `database/chess-tables.sql` to the target Supabase project. This is a first-time schema setup script and drops/recreates the chess tables, so do not rerun it over an existing catalog without a backup.
2. Download `lichess_db_puzzle.csv.zst` from the Lichess database page.
3. Decompress it with 7-Zip and rename the extracted tab-separated file to `lichess_db_puzzle.tsv`.
4. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`.
5. Import 5,000 puzzles per difficulty/motif bucket:

```powershell
npm run import:chess -- data\chess\lichess_db_puzzle.tsv 5000
```

The target is configurable. For a larger catalog, use for example:

```powershell
npm run import:chess -- data\chess\lichess_db_puzzle.tsv 10000
```

The importer uses upserts and can be rerun. It prints the final count for every populated bucket. Some buckets may remain below the requested target when the source corpus does not contain enough puzzles for that exact difficulty and motif.

## Verification

Run this in Supabase SQL Editor:

```sql
select
  difficulty,
  unnest(themes) as motif,
  count(*) as total
from "ChessPuzzle"
group by difficulty, motif
order by difficulty, motif;
```

Puzzle attempts are append-only in `ChessPuzzleAttempt`, so users can repeat puzzles. Progress, theme accuracy, and history are calculated from those real attempt rows.

## Attribution

This project uses data from Lichess. Lichess puzzle data is licensed under CC BY-SA 4.0. Keep this attribution with deployments and any redistributed puzzle data, and preserve the source metadata when transforming or exporting the records.
