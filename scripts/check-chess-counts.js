import { createClient } from '@supabase/supabase-js';

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const total = await db.from('ChessPuzzle').select('*', { count: 'exact', head: true });
if (total.error) throw total.error;

console.log(`rows ${total.count || 0}`);
for (const difficulty of ['beginner', 'intermediate', 'advanced']) {
  for (const theme of ['pin', 'fork', 'skewer', 'discovery', 'deflection', 'decoy', 'zwischenzug', 'windmill', 'smothered-mate', 'back-rank', 'double-attack']) {
    const result = await db
      .from('ChessPuzzle')
      .select('*', { count: 'exact', head: true })
      .eq('difficulty', difficulty)
      .contains('themes', [theme]);
    if (result.error) throw result.error;
    console.log(`${difficulty}:${theme} ${result.count || 0}`);
  }
}
