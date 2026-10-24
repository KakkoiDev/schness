import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { VARIANTS, description } from './research-variants.js';

const variant = process.argv[2];
if (!Object.hasOwn(VARIANTS, variant)) throw new Error('Unknown variant');
const seeds = [20261030, 20261031, 20261101];
const root = resolve(`research-v4-results/${variant}`);
await mkdir(root, { recursive: true });
async function run(seed, mode) {
  const output = `${root}/seed-${seed}`;
  await new Promise((done, fail) => {
    const child = spawn(process.execPath, ['scripts/run-research-suite.js', variant, output], {
      env: { ...process.env, RESEARCH_SEED: String(seed), RESEARCH_MODE: mode }, stdio: 'inherit',
    });
    child.on('error', fail);
    child.on('exit', code => code === 0 ? done() : fail(new Error(`Experiment exited ${code}`)));
  });
  return JSON.parse(await readFile(`${output}/${mode === 'full' ? 'full-summary' : 'summary'}.json`, 'utf8'));
}
const pilots = [];
for (const seed of seeds) pilots.push((await run(seed, 'pilot')).pilot);
const games = [];
for (const seed of seeds) games.push(...(await readFile(`${root}/seed-${seed}/pilot/bundle/games.jsonl`, 'utf8')).trim().split('\n').map(JSON.parse));
const counts = {};
for (const g of games) { const key = g.result.winner ?? g.result.reason; counts[key] = (counts[key] ?? 0) + 1; }
const decisive = (counts.white ?? 0) + (counts.black ?? 0);
const lengths = games.map(g => g.transcript.filter(e => e.phase === 'play').length).sort((a,b) => a-b);
const medianNormalPlayPlies = (lengths[119] + lengths[120]) / 2;
const uniqueTranscripts = new Set(games.map(g => JSON.stringify(g.transcript.map(e => e.action)))).size;
const whiteShare = decisive ? (counts.white ?? 0) / decisive : null;
const controls = ['canonical', 'unrestricted', 'protected-recurring'];
const eligible = !controls.includes(variant) && decisive >= 48 && whiteShare >= 0.4 && whiteShare <= 0.6 &&
  !(counts['setup-blocked']) && medianNormalPlayPlies >= 20 && uniqueTranscripts >= 120;
const summary = { variant, description: description(VARIANTS[variant]), seeds, pilots,
  combined: { games: games.length, counts, decisive, whiteShare, medianNormalPlayPlies, uniqueTranscripts },
  gate: { eligible, minDecisive:48, whiteShare:[0.4,0.6], minMedianNormalPlayPlies:20, minUniqueTranscripts:120, maxSetupBlocked:0 },
  caveat: 'Screening only; full runs include pilot prefixes. Do not pool stages. Hidden setup uses independent uniform legal sampling, not strategic hidden-information search.' };
await writeFile(`${root}/summary.json`, JSON.stringify(summary,null,2));
if (eligible) {
  summary.full = [];
  for (const seed of seeds) {
    summary.full.push(await run(seed, 'full'));
    await writeFile(`${root}/summary.json`, JSON.stringify(summary,null,2));
  }
}
console.log(JSON.stringify(summary,null,2));
