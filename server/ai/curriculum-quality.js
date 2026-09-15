/**
 * Deterministic curriculum quality checks.
 *
 * The generator may be AI-assisted, but the learning contract is local and
 * auditable: every path needs ordered study units, meaningful checkpoints,
 * valid day metadata, and no duplicate topics.
 */
export function checkLearningPath(path) {
  const errors = [];
  if (!path || typeof path !== 'object') return ['Path is not an object.'];
  if (!Array.isArray(path.days) || path.days.length === 0) return ['Path must contain at least one day.'];

  const units = new Set();
  let previousDifficulty = 0;
  let studyCount = 0;
  let proofCount = 0;

  path.days.forEach((day, dayIndex) => {
    if (day.index !== dayIndex + 1) errors.push(`Day index ${day.index} is out of order.`);
    if (!Array.isArray(day.items) || day.items.length === 0) {
      errors.push(`Day ${dayIndex + 1} has no learning items.`);
      return;
    }
    if (!(day.estMin > 0) || !(day.xp >= 0)) errors.push(`Day ${dayIndex + 1} has invalid time or XP.`);

    let dayHasStudy = false;
    day.items.forEach((item) => {
      if (!item?.topic || !item?.title) errors.push(`Day ${dayIndex + 1} contains an incomplete item.`);
      const unitKey = item.topic && item.kind ? `${item.topic}:${item.kind}` : null;
      if (unitKey && units.has(unitKey)) errors.push(`Learning unit ${unitKey} appears more than once.`);
      if (unitKey) units.add(unitKey);
      if (item.kind === 'study') {
        studyCount++;
        dayHasStudy = true;
      }
      if (['proof', 'project', 'final'].includes(item.kind)) proofCount++;
      if (Number.isFinite(item.difficulty) && item.difficulty < previousDifficulty) {
        errors.push(`Topic difficulty regresses at ${item.topic}.`);
      }
      if (Number.isFinite(item.difficulty)) previousDifficulty = item.difficulty;
    });

    if (day.kind === 'study' && !dayHasStudy) errors.push(`Study day ${dayIndex + 1} has no study item.`);
    if (day.kind !== 'study' && !day.items.some((item) => ['proof', 'project', 'final'].includes(item.kind))) {
      errors.push(`Assessment day ${dayIndex + 1} has no proof item.`);
    }
  });

  if (studyCount === 0) errors.push('Path has no study units.');
  if (proofCount === 0) errors.push('Path has no proof checkpoints.');
  if (!(path.totalXp > 0)) errors.push('Path must award XP.');
  return errors;
}

export function learningDesign(style = 'practical') {
  const designs = {
    practical: {
      label: 'Practical',
      focus: 'short demonstrations, hands-on exercises, and frequent real-world proofs',
      cadence: 'learn → try → prove',
    },
    theoretical: {
      label: 'Theoretical',
      focus: 'concept maps, explanations, examples, and deliberate recall before application',
      cadence: 'understand → connect → apply',
    },
    mixed: {
      label: 'Mixed',
      focus: 'balanced explanations, guided practice, reflection, and real-world proofs',
      cadence: 'understand → practice → prove',
    },
  };
  return designs[style] || designs.practical;
}
