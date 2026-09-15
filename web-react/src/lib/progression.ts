export function xpForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  return 60 * (safeLevel - 1) ** 2;
}

export function xpProgress(xp: number, level: number) {
  const safeXp = Math.max(0, Number(xp) || 0);
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  const currentLevelXp = xpForLevel(safeLevel);
  const nextLevelXp = xpForLevel(safeLevel + 1);
  const span = Math.max(1, nextLevelXp - currentLevelXp);
  return {
    currentLevelXp,
    nextLevelXp,
    percent: Math.min(100, Math.max(0, ((safeXp - currentLevelXp) / span) * 100)),
  };
}
