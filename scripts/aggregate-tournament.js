import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { resultKey } from '../src/tournament.js';

const input = resolve(process.argv[2] ?? 'tournament-shards');
const output = resolve(process.argv[3] ?? 'tournament-results');
await mkdir(output, { recursive: true });
const names = (await readdir(input)).filter((name) => name.endsWith('.jsonl')).sort();
if (!names.length) throw new Error(`no tournament shards found in ${input}`);
const games = [];
for (const name of names) {
  const text = await readFile(resolve(input, name), 'utf8');
  for (const line of text.split('\n')) if (line.trim()) games.push(JSON.parse(line));
}
games.sort((a, b) => a.index - b.index);

const groups = new Map();
const totals = {};
for (const game of games) {
  const result = resultKey(game.result);
  totals[result] = (totals[result] ?? 0) + 1;
  const key = `${game.startingKings.white}|${game.startingKings.black}`;
  const group = groups.get(key) ?? { whiteKing: game.startingKings.white, blackKing: game.startingKings.black, games: 0, plies: 0 };
  group.games += 1;
  group.plies += game.plies;
  group[result] = (group[result] ?? 0) + 1;
  groups.set(key, group);
}
const resultColumns = [...new Set(games.map((game) => resultKey(game.result)))].sort();
const header = ['white_king', 'black_king', 'games', 'average_plies', ...resultColumns];
const rows = [...groups.values()].sort((a, b) => `${a.whiteKing}${a.blackKing}`.localeCompare(`${b.whiteKing}${b.blackKing}`));
const csv = [header.join(','), ...rows.map((row) => [row.whiteKing, row.blackKing, row.games, (row.plies / row.games).toFixed(2), ...resultColumns.map((key) => row[key] ?? 0)].join(','))].join('\n');
const manifest = {
  schema: 1,
  generatedAt: new Date().toISOString(),
  games: games.length,
  levels: games[0].levels,
  totals,
  files: {
    'games.jsonl': 'One complete, self-contained game per line.',
    'summary.csv': 'Results grouped by the two starting king squares.',
    'manifest.json': 'Experiment metadata and overall totals.',
    'ANALYZE.md': 'Field guide and suggested questions for an AI analyst.',
  },
};
const guide = `# Schness tournament dataset\n\nThis ZIP contains ${games.length} reproducible games: ${games[0].levels.white} White versus ${games[0].levels.black} Black.\n\n## Start here\n\n1. Read \`manifest.json\`.\n2. Use \`summary.csv\` to compare king placements.\n3. Stream \`games.jsonl\`; each line is one complete game with its seed, actions, notation, result, and final position.\n\n## Questions to test\n\n- Do corner kings win more often than inner kings after controlling for color?\n- Which first deployments correlate with wins?\n- Which actions precede a decisive checkmate?\n- How often does Sharp repeat rather than convert an advantage?\n- Are apparent patterns stable across all opposing king placements?\n\nDo not call a correlation a rule. Re-run targeted matchups with new seeds before proposing strategy.\n`;
await Promise.all([
  writeFile(resolve(output, 'games.jsonl'), `${games.map(JSON.stringify).join('\n')}\n`),
  writeFile(resolve(output, 'summary.csv'), `${csv}\n`),
  writeFile(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2)),
  writeFile(resolve(output, 'ANALYZE.md'), guide),
]);
console.log(`aggregated ${games.length} games from ${names.length} shards into ${basename(output)}`);
