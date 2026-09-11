import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { actionSequenceKey, encodeAction, engineLabel, resultCode } from '../src/library.js';

export async function buildLibrary(inputs) {
  const unique = new Map();
  let records = 0;
  for (const input of inputs) {
    const lines = (await readFile(input.path, 'utf8')).trim().split('\n').filter(Boolean);
    for (const line of lines) {
      const game = JSON.parse(line);
      const key = actionSequenceKey(game);
      const white = game.engines?.white ?? { level: game.levels.white, version: input.sharpVersion && game.levels.white === 'sharp' ? input.sharpVersion : 1 };
      const black = game.engines?.black ?? { level: game.levels.black, version: input.sharpVersion && game.levels.black === 'sharp' ? input.sharpVersion : 1 };
      const source = [input.run, game.index, engineLabel(white), engineLabel(black)];
      if (unique.has(key)) {
        unique.get(key).sources.push(source);
      } else {
        unique.set(key, {
          result: resultCode(game.result),
          plies: game.plies,
          starts: [game.transcript[0].action.to, game.transcript[1].action.to],
          actions: game.transcript.map(({ action }) => encodeAction(action)),
          sources: [source],
        });
      }
      records += 1;
    }
  }
  const games = [...unique.values()].map((game, index) => ({ id: index + 1, ...game }));
  return {
    schema: 1,
    generated: new Date().toISOString().slice(0, 10),
    records,
    uniqueGames: games.length,
    duplicatesRemoved: records - games.length,
    runs: inputs.map(({ run, label, sharpVersion }) => ({ run, label, sharpVersion })),
    games,
  };
}

function parseInput(value) {
  const [run, sharpVersion, path] = value.split(':');
  if (!run || !sharpVersion || !path) throw new Error(`Invalid --input: ${value}`);
  return { run: Number(run), sharpVersion: Number(sharpVersion), label: basename(dirname(resolve(path))), path };
}

if (process.argv[1] && import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href) {
  const inputs = [];
  let output = 'data/games.json';
  for (let index = 2; index < process.argv.length; index += 1) {
    if (process.argv[index] === '--input') inputs.push(parseInput(process.argv[++index]));
    else if (process.argv[index] === '--output') output = process.argv[++index];
  }
  if (!inputs.length) throw new Error('Provide at least one --input run:sharpVersion:path');
  const library = await buildLibrary(inputs);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(library)}\n`);
  console.log(`Wrote ${library.uniqueGames} unique games from ${library.records} records to ${output}`);
}
