function normalizePathGroupKey(path) {
  const skill = String(path?.skillSlug || '').trim();
  if (skill) return `skill:${skill}`;
  const goal = String(path?.goal || '').trim();
  if (goal) return `goal:${goal}`;
  return `title:${String(path?.title || '').trim() || 'untitled'}`;
}

function mergeProgressValues(target, source) {
  if (!source || typeof source !== 'object') return target;
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined || value === null) continue;
    target[key] = value;
  }
  return target;
}

function mergeDayItems(existingItems, candidateItems) {
  const merged = [...existingItems];
  const ids = new Set(merged.map((item) => `${item.kind || 'item'}:${item.topic || item.id || 'unknown'}`));

  for (const item of candidateItems || []) {
    if (!item || typeof item !== 'object') continue;
    const fingerprint = `${item.kind || 'item'}:${item.topic || item.id || 'unknown'}`;
    if (ids.has(fingerprint)) continue;
    merged.push({ ...item });
    ids.add(fingerprint);
  }

  return merged;
}

export async function cleanupDuplicateSkillPaths(store, userId = null) {
  const rows = store.filter('paths', (p) => (!userId || p.userId === userId));
  const groups = new Map();

  for (const path of rows) {
    const key = `${path.userId ?? 'anon'}:${normalizePathGroupKey(path)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(path);
  }

  let removedCount = 0;
  let mergedCount = 0;

  for (const group of groups.values()) {
    if (group.length <= 1) continue;

    const sorted = [...group].sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
    const canonical = sorted[0];
    const mergedProgress = { ...(canonical.progress || {}) };
    const mergedDays = Array.isArray(canonical.days) ? canonical.days.map((day) => ({
      ...day,
      items: Array.isArray(day.items) ? day.items.map((item) => ({ ...item })) : [],
    })) : [];

    for (const path of sorted.slice(1)) {
      mergeProgressValues(mergedProgress, path.progress || {});
      for (const day of Array.isArray(path.days) ? path.days : []) {
        if (!day || !Array.isArray(day.items)) continue;
        const existingIndex = mergedDays.findIndex((entry) => Number(entry.index ?? 0) === Number(day.index ?? 0));
        if (existingIndex === -1) {
          mergedDays.push({
            ...day,
            items: day.items.map((item) => ({ ...item })),
          });
          continue;
        }
        mergedDays[existingIndex].items = mergeDayItems(mergedDays[existingIndex].items || [], day.items || []);
      }
    }

    await store.update('paths', canonical.id, {
      progress: mergedProgress,
      days: mergedDays,
      updatedAt: Date.now(),
      title: canonical.title || 'Learning path',
      description: canonical.description || '',
    });

    for (const path of sorted.slice(1)) {
      await store.remove('paths', path.id);
      removedCount += 1;
    }

    mergedCount += 1;
  }

  if (removedCount > 0) {
    await store.save();
  }

  return { removedCount, mergedCount };
}
