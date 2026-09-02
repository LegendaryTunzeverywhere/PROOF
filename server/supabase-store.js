/**
 * SupabaseStore — Drop-in replacement for Store (server/store.js)
 * Provides the same interface but backed by Supabase PostgreSQL
 * 
 * Usage:
 *   import { SupabaseStore } from './supabase-store.js';
 *   const store = await new SupabaseStore().open();
 */

import { createClient } from '@supabase/supabase-js';

export class SupabaseStore {
  constructor(opts = {}) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Table name mapping (Supabase uses PascalCase, we use lowercase)
    this.tableMap = {
      'users': 'User',
      'skills': 'Skill',
      'user_skills': 'UserSkill',
      'learning_paths': 'LearningPath',
      'paths': 'LearningPath',  // Alias for learning_paths
      'challenges': 'Challenge',
      'attempts': 'ChallengeAttempt',  // Alias for challenge_attempts
      'challenge_attempts': 'ChallengeAttempt',
      'submissions': 'Submission',
      'evaluations': 'Evaluation',
      'skill_proofs': 'SkillProof',
      'achievements': 'Achievement',
      'user_achievements': 'UserAchievement',
      'rewards': 'Reward',
      'wallet_transactions': 'WalletTransaction',
      'wallet_txs': 'WalletTransaction',  // Alias for wallet_transactions
      'notifications': 'Notification',
      'sponsored_challenges': 'SponsoredChallenge',
      'sponsored_participants': 'SponsoredParticipant',
      'marketplace_tasks': 'MarketplaceTask',
      'task_applications': 'TaskApplication',
      'teaching_sessions': 'TeachingSession',
      'bookings': 'Booking',
      'reviews': 'Review',
      'review_schedule': 'ReviewSchedule',  // Add review schedule mapping
      'sessions': 'sessions',
      'nonces': 'nonces',
      'socratic_sessions': 'socratic_sessions',
      'user_glossary': 'user_glossary',
      'review_schedules': 'ReviewSchedule',
      'learning_sessions': 'LearningSession',
      'user_stats': 'UserStats',
      'learning_goals': 'LearningGoal',
      'mastery_badges': 'MasteryBadge',
      'exercise_attempts': 'ExerciseAttempt',
      'quiz_results': 'QuizResult',
      'knowledge_nodes': 'KnowledgeNode',
      'user_mastery': 'UserMastery'
    };

    // App field name → DB column name (services use NIM-friendly names;
    // the DB stores luna BigInts / differently named columns).
    this.fieldMap = {
      'challenges': { rewardNim: 'rewardLuna' },
      'teaching_sessions': { rating: 'ratingSum' },
    };

    // Cache for frequently accessed data
    this.cache = new Map();
    // Different TTLs for different types of data
    this.cacheTTLs = {
      'skills': 3600000,        // 1 hour - skills rarely change
      'challenges': 1800000,    // 30 minutes - challenges are static
      'achievements': 1800000,  // 30 minutes - achievements are static
      'users': 300000,          // 5 minutes - user data changes occasionally
      'sessions': 60000,        // 1 minute - sessions need to be fresh
      'default': 180000         // 3 minutes - default for everything else
    };
  }

  async open(bootstrap) {
    // Test connection
    const { error } = await this.client.from('User').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows, which is OK
      console.error('❌ Supabase connection failed:', error);
      throw new Error(`Supabase connection failed: ${error.message}`);
    }

    console.log('✅ Connected to Supabase');

    // Warm up cache for frequently accessed tables
    console.log('🔥 Warming up cache...');
    await Promise.all([
      this.all('skills'),        // Skills catalog - rarely changes
      this.all('challenges'),    // Challenge definitions - static
      this.all('achievements')   // Achievement definitions - static
    ]);
    console.log('✅ Cache warmed');

    // Run bootstrap if provided (for seeding)
    if (bootstrap) {
      await bootstrap(this);
    }

    return this;
  }

  async reset(bootstrap) {
    // Clear all tables (dangerous! Only for testing)
    console.warn('⚠️  Clearing all Supabase tables...');
    const tables = Object.values(this.tableMap);
    for (const table of tables) {
      await this.client.from(table).delete().neq('id', '00000000');
    }
    this.cache.clear();
    if (bootstrap) await bootstrap(this);
    return this;
  }

  declareUniques(table, fields) {
    // Supabase handles uniqueness at database level
    // This is a no-op for compatibility with Store interface
  }

  // Convert Unix timestamps (milliseconds) to ISO strings for PostgreSQL
  convertTimestamps(doc, tableName = null) {
    const converted = { ...doc };
    for (const [key, value] of Object.entries(converted)) {
      // For sessions table: keep bootTime, expiresAt, and createdAt as bigint
      // For other tables: only skip bootTime and expiresAt
      if (key === 'bootTime' || key === 'expiresAt') {
        continue;
      }
      if (tableName === 'sessions' && key === 'createdAt') {
        continue;
      }
      
      // Check if it's a timestamp field with a number value
      if (
        (key.endsWith('At') || key === 'postedAt' || key === 'bookedAt' || key === 'joinedAt' || 
         key === 'appliedAt' || key === 'respondedAt' || key === 'unlockedAt' || key === 'earnedAt' ||
         key === 'startedAt' || key === 'completedAt' || key === 'submittedAt' || key === 'confirmedAt' ||
         key === 'suspendedAt' || key === 'lastReviewedAt' || key === 'lastPracticedAt' || key === 'verifiedAt') &&
        typeof value === 'number' && value > 1000000000000
      ) {
        // Convert milliseconds to ISO string
        converted[key] = new Date(value).toISOString();
      }
    }
    return converted;
  }

  /**
   * App→DB field mapping: the service layer speaks NIM-friendly names while
   * some PostgreSQL columns use luna BigInts / different names.
   */
  mapFieldsForDb(doc, tableName) {
    const map = this.fieldMap[tableName];
    if (!map || !doc) return doc;
    const out = { ...doc };
    for (const [from, to] of Object.entries(map)) {
      if (out[from] === undefined) continue;
      out[to] = from === 'rewardNim' ? Math.round(out[from] * 100000) : out[from];
      delete out[from];
    }
    return out;
  }

  /** DB→App field mapping (reverse of mapFieldsForDb) + ISO→ms timestamps. */
  convertFromDatabase(row, tableName) {
    if (!row || typeof row !== 'object') return row;
    let out = { ...row };

    // Reverse field mapping first so mapped columns land under app names.
    const map = this.fieldMap[tableName];
    if (map) {
      for (const [appName, dbName] of Object.entries(map)) {
        if (out[dbName] === undefined) continue;
        out[appName] = appName === 'rewardNim' ? Math.round(Number(out[dbName])) / 100000 : out[dbName];
        delete out[dbName];
      }
    }

    // Reverse timestamp conversion: ISO strings back to epoch milliseconds so
    // comparisons/sorts against Date.now() (used throughout the app) hold.
    for (const [key, value] of Object.entries(out)) {
      if (value === null || value === undefined || typeof value !== 'string') continue;
      const isTsField = key.endsWith('At') || ['postedAt', 'bookedAt', 'joinedAt', 'appliedAt',
        'respondedAt', 'unlockedAt', 'earnedAt', 'startedAt', 'completedAt', 'submittedAt',
        'confirmedAt', 'suspendedAt', 'lastReviewedAt', 'lastPracticedAt', 'verifiedAt'].includes(key);
      if (!isTsField) continue;
      const t = Date.parse(value);
      if (!Number.isNaN(t)) out[key] = t;
    }
    return out;
  }

  async insert(table, doc) {
    const supabaseTable = this.tableMap[table] || table;
    
    // Generate ID if not provided
    if (!doc.id) {
      const prefix = table.substring(0, 3);
      doc.id = `${prefix}_${Math.random().toString(36).substr(2, 12)}`;
    }

    // Convert timestamps + field names to DB form
    const convertedDoc = this.convertTimestamps(this.mapFieldsForDb(doc, table), table);

    const { data, error } = await this.client
      .from(supabaseTable)
      .insert(convertedDoc)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        throw new Error(`UNIQUE_VIOLATION ${error.message}`);
      }
      throw new Error(`Insert failed: ${error.message}`);
    }

    // Invalidate cache
    this.cache.delete(`${table}:${data.id}`);
    this.cache.delete(`${table}:all`);

    return this.convertFromDatabase(data, table);
  }

  async get(table, id) {
    // Never query PostgREST with a null/undefined key: it would either match
    // nothing or (worse) spam `Get error (users/null)` when the origin is
    // slow/overloaded. Malformed rows are handled by callers (see auth.js).
    if (id === null || id === undefined || id === '') return null;

    const supabaseTable = this.tableMap[table] || table;
    const cacheKey = `${table}:${id}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.time < this.cacheTTL) {
      return cached.data;
    }

    // UserStats uses userId as primary key, not id
    const pkField = table === 'user_stats' ? 'userId' : 'id';

    const { data, error } = await this.client
      .from(supabaseTable)
      .select('*')
      .eq(pkField, id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error(`Get error (${table}/${id}):`, error);
      return null;
    }

    const row = this.convertFromDatabase(data, table);

    // Cache result
    this.cache.set(cacheKey, { data: row, time: Date.now() });

    return row;
  }

  async update(table, id, patch) {
    const supabaseTable = this.tableMap[table] || table;

    // Convert timestamps + field names in patch
    const convertedPatch = this.convertTimestamps(this.mapFieldsForDb(patch, table), table);

    // UserStats uses userId as primary key, not id
    const pkField = table === 'user_stats' ? 'userId' : 'id';

    const { data, error } = await this.client
      .from(supabaseTable)
      .update(convertedPatch)
      .eq(pkField, id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      if (error.code === '23505') {
        throw new Error(`UNIQUE_VIOLATION ${error.message}`);
      }
      throw new Error(`Update failed: ${error.message}`);
    }

    // Invalidate only this table's cache
    this.cache.delete(`${table}:all`);
    this.cache.delete(`${table}:${id}`);

    return this.convertFromDatabase(data, table);
  }

  async remove(table, id) {
    const supabaseTable = this.tableMap[table] || table;

    // UserStats uses userId as primary key, not id
    const pkField = table === 'user_stats' ? 'userId' : 'id';

    const { error } = await this.client
      .from(supabaseTable)
      .delete()
      .eq(pkField, id);

    if (error) {
      console.error(`Remove error (${table}/${id}):`, error);
      return false;
    }

    // Invalidate only this table's cache
    this.cache.delete(`${table}:all`);

    return true;
  }

  async all(table) {
    const supabaseTable = this.tableMap[table] || table;
    const cacheKey = `${table}:all`;

    // Check cache with table-specific TTL
    const cached = this.cache.get(cacheKey);
    const ttl = this.cacheTTLs[table] || this.cacheTTLs.default;
    if (cached && Date.now() - cached.time < ttl) {
      return cached.data;
    }

    const { data, error } = await this.client
      .from(supabaseTable)
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(1000); // Safety limit

    if (error) {
      console.error(`All error (${table}):`, error);
      return [];
    }

    const rows = (data || []).map((row) => this.convertFromDatabase(row, table));

    // Cache result
    this.cache.set(cacheKey, { data: rows, time: Date.now() });

    return rows;
  }

  async find(table, pred) {
    const rows = await this.all(table);
    return rows.find(pred) || null;
  }

  async filter(table, pred) {
    const rows = await this.all(table);
    return rows.filter(pred);
  }
  
  /**
   * Optimized find for common query patterns
   * Falls back to regular find() for complex predicates
   */
  async findOptimized(table, conditions) {
    const supabaseTable = this.tableMap[table] || table;

    let query = this.client.from(supabaseTable).select('*');
    
    for (const [key, value] of Object.entries(conditions)) {
      if (value === undefined) continue;
      if (value === null) {
        query = query.is(key, null);
      } else if (key.endsWith('_not_null')) {
        const fieldName = key.replace('_not_null', '');
        query = query.not(fieldName, 'is', null);
      } else {
        query = query.eq(key, value);
      }
    }
    
    query = query.limit(1);
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Optimized find error (${table}):`, error);
      return null;
    }
    
    return data[0] ? this.convertFromDatabase(data[0], table) : null;
  }
  
  /**
   * Optimized filter for common query patterns
   * Falls back to regular filter() for complex predicates
   */
  async filterOptimized(table, conditions) {
    const supabaseTable = this.tableMap[table] || table;
    
    let query = this.client.from(supabaseTable).select('*');
    
    for (const [key, value] of Object.entries(conditions)) {
      if (value === undefined) continue;
      if (value === null) {
        query = query.is(key, null);
      } else if (key.endsWith('_not_null')) {
        const fieldName = key.replace('_not_null', '');
        query = query.not(fieldName, 'is', null);
      } else {
        query = query.eq(key, value);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Optimized filter error (${table}):`, error);
      // Fall back to in-memory filter
      return [];
    }
    
    return data.map(row => this.convertFromDatabase(row, table));
  }

  async count(table, pred) {
    if (pred) {
      const rows = await this.filter(table, pred);
      return rows.length;
    }

    const supabaseTable = this.tableMap[table] || table;
    const { count, error } = await this.client
      .from(supabaseTable)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`Count error (${table}):`, error);
      return 0;
    }

    return count || 0;
  }

  // Advanced Supabase-specific queries
  async query(table, builder) {
    const supabaseTable = this.tableMap[table] || table;
    let query = this.client.from(supabaseTable).select('*');
    
    // Apply builder function if provided
    if (builder) {
      query = builder(query);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Query error (${table}):`, error);
      return [];
    }

    return data || [];
  }

  // Leaderboard query (optimized for real wallets)
  async getLeaderboard(limit = 10) {
    const { data, error } = await this.client
      .from('User')
      .select('id, username, walletAddress, earnedLuna, proofsPassed, avatar, level')
      .eq('isDemo', false)
      .not('walletAddress', 'is', null)
      .order('earnedLuna', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Leaderboard query error:', error);
      return [];
    }

    return data || [];
  }

  // Get user by wallet address
  async getUserByWallet(walletAddress) {
    const { data, error } = await this.client
      .from('User')
      .select('*')
      .eq('walletAddress', walletAddress)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Get user by wallet error:', error);
      return null;
    }

    return data;
  }

  // Get user's transaction history
  async getUserTransactions(userId, limit = 20) {
    const { data, error } = await this.client
      .from('WalletTransaction')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get transactions error:', error);
      return [];
    }

    return data || [];
  }

  // Save is a no-op in Supabase (auto-committed)
  async save() {
    return Promise.resolve();
  }

  async flushAndWait() {
    return Promise.resolve();
  }

  // Clear cache (useful for testing)
  clearCache() {
    this.cache.clear();
  }
}

// Helper to create store based on environment
export async function createStore() {
  const mode = process.env.DB_MODE || 'store';

  if (mode === 'supabase') {
    console.log('🗄️  Using Supabase (PostgreSQL)');
    return await new SupabaseStore().open();
  } else {
    console.log('🗄️  Using in-memory Store');
    const { Store } = await import('./store.js');
    return await new Store().open();
  }
}
