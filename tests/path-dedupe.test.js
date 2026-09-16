import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanupDuplicateSkillPaths } from '../server/services/path-dedupe.js';
import { testbed } from './helpers.js';

test('path dedupe: same-skill duplicates are pruned and progress is merged', async () => {
  const tb = await testbed();
  const user = await tb.users.createUser({});

  const oldPath = await tb.store.insert('paths', {
    id: 'old-path',
    userId: user.id,
    skillSlug: 'web-development',
    skillName: 'Web Development',
    title: 'Old Path',
    goal: 'Learn web development',
    createdAt: 1000,
    progress: { '1:html.lesson': 1000 },
    days: [{ index: 0, items: [{ topic: 'html', lesson: true }] }],
  });

  const newPath = await tb.store.insert('paths', {
    id: 'new-path',
    userId: user.id,
    skillSlug: 'web-development',
    skillName: 'Web Development',
    title: 'New Path',
    goal: 'Learn web development',
    createdAt: 2000,
    progress: { '1:css.practice': 2000 },
    days: [{ index: 0, items: [{ topic: 'css', practice: true }] }],
  });

  const result = await cleanupDuplicateSkillPaths(tb.store, user.id);

  assert.equal(result.removedCount, 1);
  assert.equal(tb.store.count('paths', (p) => p.userId === user.id), 1);

  const kept = tb.store.get('paths', newPath.id) || tb.store.find('paths', (p) => p.userId === user.id);
  assert.ok(kept);
  assert.equal(kept.title, 'New Path');
  assert.equal(kept.progress['1:html.lesson'], 1000);
  assert.equal(kept.progress['1:css.practice'], 2000);
  assert.equal(tb.store.get('paths', oldPath.id), null);
});
