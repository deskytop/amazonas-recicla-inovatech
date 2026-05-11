export const LEVELS = [
  { id: 1, name: "Semente", min: 0, max: 499 },
  { id: 2, name: "Broto", min: 500, max: 1999 },
  { id: 3, name: "Folha", min: 2000, max: 4999 },
  { id: 4, name: "Galho", min: 5000, max: 9999 },
  { id: 5, name: "Árvore", min: 10000, max: null as number | null },
] as const;

export type Level = (typeof LEVELS)[number];

export function levelForLifetimePoints(lifetimePoints: number): Level {
  for (const level of LEVELS) {
    if (level.max === null || lifetimePoints <= level.max) {
      return level;
    }
  }
  return LEVELS[LEVELS.length - 1]!;
}

export function progressToNextLevel(lifetimePoints: number): {
  current: Level;
  next: Level | null;
  pointsToNext: number;
  percentToNext: number;
} {
  const current = levelForLifetimePoints(lifetimePoints);
  const currentIndex = LEVELS.findIndex((l) => l.id === current.id);
  const next = currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1]! : null;

  if (!next) {
    return { current, next: null, pointsToNext: 0, percentToNext: 100 };
  }

  const pointsToNext = next.min - lifetimePoints;
  const range = next.min - current.min;
  const percentToNext = ((lifetimePoints - current.min) / range) * 100;

  return { current, next, pointsToNext, percentToNext };
}
