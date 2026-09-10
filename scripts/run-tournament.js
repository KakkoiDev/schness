import { mkdir, writeFile } from 'node:fs/promises';
import { availableParallelism } from 'node:os';
import { resolve } from 'node:path';
import { isMainThread, parentPort, workerData, Worker } from 'node:worker_threads';
import { playTournamentGame, resultKey } from '../src/tournament.js';

async function playShard(options) {
  const records = [];
  const counts = {};
  for (let index = options.shard; index < options.games; index += options.shards) {
    const game = playTournamentGame({ index, seed: options.seed, white: options.white, black: options.black, maxPlies: options.maxPlies });
    records.push(JSON.stringify(game));
    const key = resultKey(game.result);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  await mkdir(options.output, { recursive: true });
  const name = `shard-${String(options.shard).padStart(2, '0')}`;
  await writeFile(resolve(options.output, `${name}.jsonl`), `${records.join('\n')}\n`);
  await writeFile(resolve(options.output, `${name}.json`), JSON.stringify({ shard: options.shard, shards: options.shards, games: records.length, counts }, null, 2));
  return records.length;
}

if (!isMainThread) {
  const completed = await playShard(workerData);
  parentPort.postMessage({ completed });
} else {
  const parsed = args(process.argv.slice(2));
  const games = positive(parsed.games, 1000);
  const workers = Math.min(games, positive(parsed.workers, Math.min(4, availableParallelism())));
  const shared = {
    games,
    shards: workers,
    output: resolve(parsed.output ?? 'tournament-shards'),
    seed: Number(parsed.seed ?? 20260910),
    white: parsed.white ?? 'sharp',
    black: parsed.black ?? 'sharp',
    maxPlies: positive(parsed.maxPlies, 200),
  };
  const jobs = Array.from({ length: workers }, (_, shard) => new Promise((resolveJob, reject) => {
    const worker = new Worker(new URL(import.meta.url), { workerData: { ...shared, shard } });
    worker.once('message', resolveJob);
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Tournament worker ${shard} exited with ${code}`));
    });
  }));
  const completed = (await Promise.all(jobs)).reduce((sum, item) => sum + item.completed, 0);
  console.log(`${completed} games completed across ${workers} workers in ${shared.output}`);
}

function args(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 2) result[values[index].replace(/^--/, '')] = values[index + 1];
  return result;
}

function positive(value, fallback) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new TypeError(`expected a positive integer, received ${value}`);
  return parsed;
}
