import {readFile, writeFile, readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function summarize(games) {
  const matchups = {};
  for (const game of games) {
    const {white, black} = game.levels;
    const key = `${white}-${black}`;
    const row = matchups[key] ??= {whiteLevel:white, blackLevel:black, games:0, white:0, black:0, draws:0, drawReasons:{}, totalPlies:0};
    row.games++;
    row.totalPlies += game.plies;
    if (game.result.winner) row[game.result.winner]++;
    else { row.draws++; row.drawReasons[game.result.reason] = (row.drawReasons[game.result.reason] ?? 0) + 1; }
  }
  return Object.values(matchups).map(row => {
    const wins = row.white + row.black;
    return {...row, decisiveRate:wins/row.games, whiteDecisiveShare:wins ? row.white/wins : null,
      averagePlies:row.totalPlies/row.games, equalLevel:row.whiteLevel===row.blackLevel};
  });
}

async function report(dir) {
  const manifest = JSON.parse(await readFile(`${dir}/manifest.json`, 'utf8'));
  const progress = JSON.parse(await readFile(`${dir}/progress.json`, 'utf8'));
  const games = [];
  for (const name of (await readdir(`${dir}/games`)).filter(n=>n.endsWith('.json')).sort()) {
    const game = JSON.parse(await readFile(`${dir}/games/${name}`, 'utf8'));
    if (game.localExperiment.sourceFingerprint !== manifest.sourceFingerprint) throw new Error('Checkpoint fingerprint mismatch');
    games.push(game);
  }
  if (games.length !== progress.completed) throw new Error('Checkpoint/progress count mismatch; report only an idle run');
  const rows = summarize(games), expected = manifest.config.seeds.length * 16 * manifest.config.repetitions;
  const pct = x => x===null ? '—' : `${(100*x).toFixed(1)}%`;
  const text = [
    `# Four-slot bank + one-turn capture cooldown — ${progress.status}`, '',
    `${progress.completed}/${manifest.totalGames} games. Source SHA-256: ${manifest.sourceFingerprint}`, '',
    'Frozen Learning v1 depth 2, Steady v1 depth 3 and Sharp v2 depth 4. All nine ordered pairings; fresh seeds and all 16 king placements per pairing. No numeric 0–100 profiles or production Sharp v3.',
    `${manifest.config.maxPlies} total plies maximum, including king placement. ${expected} games scheduled per pairing.`, '',
    'Only equal-level pairings assess color balance. Mixed-level color rates measure both engine strength and color; do not pool them into a balance claim. Six seeds repeat 16 starts, so games are not independent random positions. Screening targets remain >=80% decisive and White taking 45–55% of decisive games; no official adoption follows automatically.', '',
    '| White AI | Black AI | Games | White wins | Black wins | Draws | Decisive | White share of wins | Mean plies | Equal-level hit |',
    '|---|---|---:|---:|---:|---:|---:|---:|---:|---|',
    ...rows.map(r=>`| ${r.whiteLevel} | ${r.blackLevel} | ${r.games}/${expected} | ${r.white} | ${r.black} | ${r.draws} | ${pct(r.decisiveRate)} | ${pct(r.whiteDecisiveShare)} | ${r.averagePlies.toFixed(1)} | ${r.equalLevel && r.games===expected && r.decisiveRate>=0.8 && r.whiteDecisiveShare>=0.45 && r.whiteDecisiveShare<=0.55 ? 'yes' : '—'} |`),
    '', '## Draw reasons', '', ...rows.map(r=>`- ${r.whiteLevel} vs ${r.blackLevel}: ${JSON.stringify(r.drawReasons)}`),
    '', '## Rules', '', ...Object.values(manifest.rules).map(r=>r.description), '',
  ].join('\n');
  await writeFile(`${dir}/report.md`, text);
  await writeFile(`${dir}/rates.json`, JSON.stringify(rows,null,2)+'\n');
  console.log(text);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await report(resolve(process.argv[2]));
