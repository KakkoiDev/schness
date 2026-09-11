import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const input = resolve(process.argv[2] ?? 'puzzle-shards');
const output = resolve(process.argv[3] ?? 'puzzle-results');
const files = (await readdir(input)).filter((name) => name.endsWith('.json')).sort();
if (!files.length) throw new Error('No puzzle shards found');
const byKey = new Map();
let checked = 0;
for (const file of files) {
  const shard = JSON.parse(await readFile(resolve(input, file), 'utf8'));
  checked += shard.checked;
  for (const puzzle of shard.puzzles) {
    const existing = byKey.get(puzzle.key);
    if (existing) existing.sources.push(...puzzle.sources);
    else byKey.set(puzzle.key, puzzle);
  }
}
const puzzles = [...byKey.values()]
  .sort((a, b) => a.mate - b.mate || a.key.localeCompare(b.key))
  .map(({ key, ...puzzle }, index) => ({ id: index + 1, ...puzzle }));
const counts = Object.fromEntries([1, 2, 3, 4].map((mate) => [mate, puzzles.filter((puzzle) => puzzle.mate === mate).length]));
const result = { schema: 1, generated: new Date().toISOString(), checkedPositions: checked, counts, puzzles };
await mkdir(output, { recursive: true });
await writeFile(resolve(output, 'puzzles.json'), `${JSON.stringify(result)}\n`);
await writeFile(resolve(output, 'manifest.json'), JSON.stringify({ schema: 1, checkedPositions: checked, uniquePuzzles: puzzles.length, counts, definition: 'Shortest forced checkmate in one to four moves by the side to move, against every legal defense. Repetition history starts fresh at the puzzle position.' }, null, 2));
console.log(`Checked ${checked} positions; wrote ${puzzles.length} unique puzzles`);
