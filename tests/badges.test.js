import test from 'node:test';
import assert from 'node:assert/strict';
import { testbed } from './helpers.js';
import {
  setStore,
  awardBadge,
  getUserBadges,
  getBadgeProgress,
  getNextBadges,
  checkAndAwardBadges,
} from '../server/services/mastery-badges.js';

// Regression for the Supabase production crash:
//   /api/badges → TypeError: getUserBadges(...).map is not a function
// getUserBadges is async; getNextBadges called it without await. Every badge
// function must be await-safe on BOTH the embedded store and SupabaseStore.
test('badges: award → get → progress → next are await-safe end to end', async () => {
  const tb = await testbed();
  setStore(tb.store);

  const user = await tb.users.createUser({});
  // user_stats is keyed by userId on both stores — mirror that for lookups.
  tb.store.insert('user_stats', {
    id: user.id,
    userId: user.id,
    totalLessonsCompleted: 1,
    totalPracticesCompleted: 3,
    totalReviewsDone: 0,
    currentStreak: 0,
  });
  tb.store.save();

  // Award a milestone badge.
  const first = await awardBadge(user.id, 'first_lesson');
  assert.ok(first && first.badgeId === 'first_lesson', 'award returns the badge');
  assert.equal(await awardBadge(user.id, 'first_lesson'), null, 'no duplicate awards');

  // GET /api/badges chain: getUserBadges / getBadgeProgress / getNextBadges.
  const badges = await getUserBadges(user.id);
  assert.equal(badges.length, 1);
  assert.equal(badges[0].definition.name, 'First Steps');

  const progress = await getBadgeProgress(user.id);
  assert.equal(progress.earned, 1);
  assert.ok(progress.total > 1);
  assert.ok(progress.byCategory.learning === 1);
  assert.equal(progress.recentBadges.length, 1);

  const next = await getNextBadges(user.id, 5);
  assert.ok(Array.isArray(next), 'getNextBadges resolves to an array');
  assert.ok(!next.some((n) => n.badgeId === 'first_lesson'), 'earned badge is excluded');
  // practice_3 is not a badge; with 3 practices done the closest practice badge
  // is practice_10 at 3/10 — ensure it is present and sorted ahead of 50.
  const practice = next.find((n) => n.badgeId === 'practice_10');
  assert.ok(practice && practice.target === 10 && practice.progress === 3, 'progress projection works');

  // checkAndAwardBadges must not re-award an existing badge (or crash).
  const awarded = await checkAndAwardBadges(user.id);
  assert.ok(Array.isArray(awarded));
  assert.ok(!awarded.some((b) => b.badgeId === 'first_lesson'), 'no duplicate from checkAndAwardBadges');
});
