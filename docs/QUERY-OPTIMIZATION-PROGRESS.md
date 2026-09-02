# Query Optimization Progress

## Problem Summary
The application was experiencing severe performance issues:
- Home page: 5+ minutes load time
- Other pages (Learn, Review, Prove, YOI): Cascading slowness
- Multiple API endpoints timing out (10s+)

## Root Causes Identified

### 1. N+1 Query Pattern in Task Applications (FIXED ✅)
**Location**: `server/services/marketplace.js`
**Problem**: 
- `listTasks()` was calling `taskView()` for each task individually
- Each `taskView()` was fetching task_applications separately
- Result: 100+ queries instead of 1

**Solution**:
- Batch fetch ALL task_applications once
- Pass pre-fetched data to `taskView()`
- Modified `taskView(task, userId, allApplications, userSkillsMap)` to accept optional params
- **Impact**: 100+ queries → 2 queries

### 2. N+1 Query Pattern in User Skills (FIXED ✅)
**Location**: `server/services/marketplace.js`
**Problem**:
- Each task was looking up user skills individually via cache
- 1000+ cache HIT operations (still O(n) lookups)
- Array.find() is O(n) per lookup = O(n²) total

**Solution**:
- Batch fetch user skills once
- Create `Map<skillSlug, userSkill>` for O(1) lookups
- **Impact**: 1000+ cache lookups → 1 query + O(1) Map lookups

### 3. Fetch-All-Then-Filter Anti-Pattern in Supabase Store (IN PROGRESS 🔄)
**Location**: `server/supabase-store.js`
**Problem**:
```javascript
async filter(table, pred) {
  const rows = await this.all(table); // Fetches ALL rows
  return rows.filter(pred);            // Filters in memory
}
```
- `attempts` table fetch: 3.3 seconds (thousands of rows)
- `task_applications` fetch: 1.9 seconds
- `marketplace_tasks` fetch: 860ms
- Network latency + large data transfer

**Solution** (Implemented):
- Added `findOptimized(table, conditions)` method
- Added `filterOptimized(table, conditions)` method
- Pushes WHERE clauses to Supabase (PostgreSQL level)
- Only fetches matching rows instead of all rows

**Updated Endpoints**:
1. `/api/home` - dailyDone query
   - Before: `store.find('attempts', (a) => a.userId === user.id && a.challengeId === daily.id && a.submittedAt)`
   - After: `store.findOptimized('attempts', { userId: user.id, challengeId: daily.id, submittedAt_not_null: true })`
   - **Impact**: 3.3s → 1.6s (51% faster)

2. `/api/daily` - daily challenge check
   - Before: `store.find('attempts', ...)`
   - After: `store.findOptimized('attempts', ...)`
   
3. `pathView()` - user attempts batch fetch
   - Before: `store.filter('attempts', (a) => a.userId === userId && a.submittedAt)`
   - After: `store.filterOptimized('attempts', { userId: userId, submittedAt_not_null: true })`

## Performance Results

### Home Page (`/api/home`)
| Optimization | Time | Improvement |
|---|---|---|
| **Before all fixes** | 300+ seconds (5+ min) | baseline |
| After task_applications N+1 fix | 1.7s | 99.4% faster |
| After user_skills N+1 fix | 1.7s | maintained |
| After findOptimized (attempts) | 1.6s | ~50% faster on dailyDone query |
| **Current** | ~2.5s | **99.2% total improvement** |

### Bottlenecks Remaining

From latest logs:
```
[perf] dailyDone: 1588ms          ← Still slow (Supabase query)
[perf] discoveryFeed: 1589ms      ← task_applications + teaching_sessions
[perf] listTasks: 1603ms          ← task_applications (already optimized in app logic)
[perf] Total /api/home took 1604ms
```

## Next Steps

### Priority 1: Database Indexes
The optimized queries are still slow because the database lacks proper indexes.

**Required Indexes**:
```sql
-- attempts table
CREATE INDEX idx_attempts_user_challenge_submitted 
ON "ChallengeAttempt" (userId, challengeId) 
WHERE submittedAt IS NOT NULL;

CREATE INDEX idx_attempts_user_submitted 
ON "ChallengeAttempt" (userId, submittedAt);

-- task_applications table
CREATE INDEX idx_task_applications_task 
ON "TaskApplication" (taskId);

CREATE INDEX idx_task_applications_user 
ON "TaskApplication" (userId);

-- teaching_sessions table
CREATE INDEX idx_teaching_sessions_skill 
ON "TeachingSession" (skillSlug);

-- paths table
CREATE INDEX idx_paths_user 
ON "LearningPath" (userId);

-- user_skills table  
CREATE INDEX idx_user_skills_user 
ON "UserSkill" (userId);
```

### Priority 2: Additional Endpoint Optimizations
Several endpoints are still using the old `filter()` pattern:

1. `/api/skills/tree` - timing out
2. `/api/market/tasks` - timing out
3. Discovery feed queries
4. Teaching sessions queries

### Priority 3: Caching Strategy
- Current cache TTLs may need tuning
- Consider Redis for high-traffic queries
- Pre-warm cache for authenticated users

## Files Modified
- `c:\Users\princ\Downloads\proof\server\services\marketplace.js` (task applications + user skills N+1 fixes)
- `c:\Users\princ\Downloads\proof\server\supabase-store.js` (added findOptimized, filterOptimized)
- `c:\Users\princ\Downloads\proof\server\index.js` (updated /api/home, /api/daily, pathView to use optimized queries)

## Test Results
Latest test run shows:
- ✅ Auth: working (slow on first request)
- ✅ Home: 2.5s (was 300s+)
- ❌ Skills endpoints: timing out
- ❌ Daily challenge: timing out (needs testing with auth)
- ❌ Marketplace: timing out

## Recommendations
1. **Add database indexes immediately** - This will have the biggest impact on query performance
2. **Continue converting filter() calls to filterOptimized()** - Target high-traffic endpoints first
3. **Profile remaining slow endpoints** - Use performance logging to identify bottlenecks
4. **Consider query result caching** - Cache expensive aggregations and joins
5. **Monitor production metrics** - Track P95/P99 latencies for all endpoints
