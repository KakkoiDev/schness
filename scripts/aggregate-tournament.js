import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { resultKey, TOURNAMENT_AI, TOURNAMENT_RULES, TOURNAMENT_SCHEMA } from '../src/tournament.js';

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
  const key = `${game.levels.white}|${game.levels.black}|${game.startingKings.white}|${game.startingKings.black}`;
  const group = groups.get(key) ?? { whiteLevel: game.levels.white, blackLevel: game.levels.black, whiteKing: game.startingKings.white, blackKing: game.startingKings.black, games: 0, plies: 0 };
  group.games += 1;
  group.plies += game.plies;
  group[result] = (group[result] ?? 0) + 1;
  groups.set(key, group);
}
const resultColumns = [...new Set(games.map((game) => resultKey(game.result)))].sort();
const header = ['white_level', 'black_level', 'white_king', 'black_king', 'games', 'average_plies', ...resultColumns];
const rows = [...groups.values()].sort((a, b) => `${a.whiteLevel}${a.blackLevel}${a.whiteKing}${a.blackKing}`.localeCompare(`${b.whiteLevel}${b.blackLevel}${b.whiteKing}${b.blackKing}`));
const csv = [header.join(','), ...rows.map((row) => [row.whiteLevel, row.blackLevel, row.whiteKing, row.blackKing, row.games, (row.plies / row.games).toFixed(2), ...resultColumns.map((key) => row[key] ?? 0)].join(','))].join('\n');
const manifest = {
  schema: TOURNAMENT_SCHEMA,
  generatedAt: new Date().toISOString(),
  games: games.length,
  matchups: [...new Set(games.map((game) => `${game.levels.white}-${game.levels.black}`))],
  totals,
  rules: TOURNAMENT_RULES,
  ai: TOURNAMENT_AI,
  files: {
    'games.jsonl': 'One complete, self-contained game per line.',
    'summary.csv': 'Results grouped by the two starting king squares.',
    'manifest.json': 'Experiment metadata and overall totals.',
    'ANALYZE.md': 'Field guide and suggested questions for an AI analyst.',
  },
};
const botNotes = Object.entries(TOURNAMENT_AI)
  .map(([level, profile]) => `- **${level[0].toUpperCase()}${level.slice(1)} v${profile.version}** — depth ${profile.depth}. ${profile.behavior}`)
  .join('\n');
const ruleNotes = TOURNAMENT_RULES.map((rule) => `- ${rule}`).join('\n');
const guide = `# Schness tournament dataset\n\nThis ZIP contains ${games.length} reproducible games across the canonical Sharp-vs-Sharp and Sharp-vs-lower-strength matchups in both colors.\n\n## Rules used\n\n${ruleNotes}\n\n## AI versions and behavior\n\nAll levels use the same material, deployment, mobility, and check evaluation, alpha-beta pruning, and a transposition cache. Search depth and the behavior below distinguish them. Random tie breaks are reproducible from each game's recorded seed.\n\n${botNotes}\n\n## Start here\n\n1. Read \`manifest.json\`.\n2. Use \`summary.csv\` to compare AI levels and king placements.\n3. Stream \`games.jsonl\`; each line is one complete game with its seed, actions, notation, result, final position, and exact AI profiles.\n\n## Questions to test\n\n- Do corner kings win more often than inner kings after controlling for color and AI level?\n- Which first deployments correlate with wins?\n- Which actions precede a decisive checkmate?\n- How much does Sharp gain against each lower level after switching colors?\n- Are apparent patterns stable across all opposing king placements?\n\nDo not call a correlation a rule. Re-run targeted matchups with new seeds before proposing strategy.\n`;
await Promise.all([
  writeFile(resolve(output, 'games.jsonl'), `${games.map(JSON.stringify).join('\n')}\n`),
  writeFile(resolve(output, 'summary.csv'), `${csv}\n`),
  writeFile(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2)),
  writeFile(resolve(output, 'ANALYZE.md'), guide),
]);
console.log(`aggregated ${games.length} games from ${names.length} shards into ${basename(output)}`);
