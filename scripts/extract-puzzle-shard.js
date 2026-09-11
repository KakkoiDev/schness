import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { applyAction, createInitialPosition, createPosition, positionKey } from '../src/rules.js';
import { decodeAction, encodeAction } from '../src/library.js';
import { encodePuzzlePosition, forcedMate, solutionLine } from '../src/puzzle.js';

const options = args(process.argv.slice(2));
const shard = integer(options.shard, 0);
const shards = integer(options.shards, 1);
const output = resolve(options.output ?? 'puzzle-shards');
const library = JSON.parse(await readFile(resolve(options.input ?? 'data/games.json'), 'utf8'));
const positions = new Map();

for (const game of library.games) {
  let position = createInitialPosition();
  const timeline = [position];
  for (const encoded of game.actions) {
    position = applyAction(position, decodeAction(encoded));
    timeline.push(position);
  }
  // Final positions are already terminal. Walk exactly as requested: the
  // last playable position first, then all the way to the opening.
  for (let ply = timeline.length - 2; ply >= 2; ply -= 1) {
    const original = timeline[ply];
    const key = positionKey(original);
    if (hash(key) % shards !== shard) continue;
    const existing = positions.get(key);
    if (existing) existing.sources.push([game.id, ply]);
    else positions.set(key, { original, sources: [[game.id, ply]] });
  }
}

const memo = new Map();
const puzzles = [];
let checked = 0;
for (const [key, candidate] of positions) {
  if (memo.size > 2_000_000) memo.clear();
  const position = fresh(candidate.original);
  const mate = forcedMate(position, 4, memo);
  checked += 1;
  if (!mate) continue;
  puzzles.push({
    key,
    mate: mate.moves,
    position: encodePuzzlePosition(position),
    solutions: mate.actions.map((action) => solutionLine(position, action, mate.moves, memo).map(encodeAction)),
    sources: candidate.sources,
  });
}

await mkdir(output, { recursive: true });
await writeFile(resolve(output, `shard-${String(shard).padStart(3, '0')}.json`), JSON.stringify({ shard, shards, checked, puzzles }));
console.log(`Shard ${shard}/${shards}: checked ${checked}, found ${puzzles.length}`);

function fresh(position) {
  const base = createPosition({ board: position.board, banks: position.banks, turn: position.turn, phase: 'play' });
  return createPosition({ board: base.board, banks: base.banks, turn: base.turn, phase: 'play', repetitions: { [positionKey(base)]: 1 } });
}

function hash(text) {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) value = Math.imul(value ^ text.charCodeAt(index), 16777619);
  return value >>> 0;
}

function args(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 2) parsed[values[index].replace(/^--/, '')] = values[index + 1];
  return parsed;
}

function integer(value, fallback) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 0) throw new TypeError(`Expected a non-negative integer, received ${value}`);
  return parsed;
}
