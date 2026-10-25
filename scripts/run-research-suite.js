import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { VARIANTS, description } from './research-variants.js';

const id = process.argv[2];
if (!Object.hasOwn(VARIANTS, id)) throw new Error(`Unknown variant: ${id}`);
const rules = VARIANTS[id];
const root = resolve(process.argv[3] ?? `research-results/${id}`);
const seed = 20260910;
await mkdir(root, { recursive: true });
async function run(script, args) {
  await new Promise((done, fail) => {
    const child = spawn(process.execPath, [script, ...args], { stdio: 'inherit' });
    child.on('error', fail);
    child.on('exit', code => code === 0 ? done() : fail(new Error(`${script} exited ${code}`)));
  });
}
async function tournament(stage, repetitions) {
  const dir = resolve(root, stage);
  await run('scripts/run-tournament.js', ['--repetitions', String(repetitions), '--seed', String(seed), '--rules', JSON.stringify(rules), '--workers', '4', '--output', `${dir}/shards`]);
  await run('scripts/aggregate-tournament.js', [`${dir}/shards`, `${dir}/bundle`]);
  const games = (await readFile(`${dir}/bundle/games.jsonl`, 'utf8')).trim().split('\n').map(JSON.parse);
  const counts = {};
  const matchup = {};
  for (const g of games) {
    const outcome = g.result.type === 'win' ? g.result.winner : g.result.reason;
    counts[outcome] = (counts[outcome] ?? 0) + 1;
    const key = `${g.levels.white}-${g.levels.black}`;
    matchup[key] ??= {};
    matchup[key][outcome] = (matchup[key][outcome] ?? 0) + 1;
  }
  const lengths = games.map(g => g.plies).sort((a,b) => a-b);
  const playLengths = games.map(g => g.transcript.filter(e => e.phase === 'play').length).sort((a,b) => a-b);
  const decisive = (counts.white ?? 0) + (counts.black ?? 0);
  const whiteShare = decisive ? (counts.white ?? 0) / decisive : null;
  const median = values => (values[(values.length-1)>>1] + values[values.length>>1]) / 2;
  const unique = new Set(games.map(g => JSON.stringify(g.transcript.map(e => e.action)))).size;
  const metrics = { variant: id, stage, seed, games: games.length, rules, description: description(rules), counts, matchup,
    decisive, whiteShare, meanPlies: lengths.reduce((a,b)=>a+b,0)/games.length, medianPlies: median(lengths),
    medianNormalPlayPlies: median(playLengths), uniqueTranscripts: unique,
    checkingDrops: games.reduce((sum,g) => sum + g.transcript.filter(e => e.action.type === 'drop' && /[+#]$/.test(e.notation)).length,0) };
  await writeFile(`${dir}/metrics.json`, JSON.stringify(metrics,null,2));
  return metrics;
}
const pilot = await tournament('pilot', 1);
// A screening gate, not a statistical claim: insufficient decisive games need more evidence.
const eligible = !['canonical','unrestricted'].includes(id) && pilot.decisive >= 16 &&
  pilot.whiteShare >= 0.4 && pilot.whiteShare <= 0.6 && !(pilot.counts['setup-blocked']) &&
  pilot.medianNormalPlayPlies >= 20 && pilot.uniqueTranscripts >= 40;
const summary = { pilot, gate: { eligible, minDecisive:16, whiteShare:[0.4,0.6], maxSetupBlocked:0, minMedianNormalPlayPlies:20, minUniqueTranscripts:40 },
  interpretation: 'Pilot screening only. Failure means do not expand automatically, not proof the ruleset is unviable. Full runs retain the pilot schedule prefix; do not pool pilot and full as independent games.' };
await writeFile(`${root}/summary.json`, JSON.stringify(summary,null,2));
if (eligible) {
  summary.full = await tournament('full',13);
  await writeFile(`${root}/summary.json`, JSON.stringify(summary,null,2));
}
console.log(JSON.stringify(summary,null,2));
