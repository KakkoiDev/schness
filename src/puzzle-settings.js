export const PUZZLE_LEVELS = Object.freeze([1, 2, 3, 4]);

export function normalizePuzzleLevels(levels, fallback = PUZZLE_LEVELS) {
  if (!Array.isArray(levels)) return [...fallback];
  const selected = [...new Set(levels.map(Number).filter((level) => PUZZLE_LEVELS.includes(level)))];
  return selected.length ? selected.sort() : [...fallback];
}

export function puzzlePool(puzzles, levels) {
  const selected = normalizePuzzleLevels(levels);
  return puzzles.filter((puzzle) => selected.includes(puzzle.mate));
}
