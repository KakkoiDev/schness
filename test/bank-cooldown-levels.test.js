import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {tasksFor} from '../research/bank-cooldown-levels-v1/run.js';
import {startingKings} from '../research/bank-cooldown-levels-v1/core/tournament.js';
import {summarize} from '../research/bank-cooldown-levels-v1/report.js';

test('all-level cooldown schedule covers every ordered pair and all 16 starts per seed', () => {
  const seeds=[20261501,20261502,20261503,20261504,20261505,20261506];
  const tasks=tasksFor({variants:['bank-4-delay-1'],seeds,repetitions:1});
  assert.equal(tasks.length,864);
  assert.equal(new Set(tasks.map(t=>t.id)).size,864);
  for (const white of ['learning','steady','sharp']) for (const black of ['learning','steady','sharp']) for (const seed of seeds) {
    const group=tasks.filter(t=>t.white===white&&t.black===black&&t.seed===seed);
    assert.equal(group.length,16);
    assert.equal(new Set(group.map(t=>JSON.stringify(startingKings(t.index)))).size,16);
  }
});

test('follow-up preserves the screened rules and AI implementation byte for byte', async () => {
  for (const name of ['rules.js','bot.js','watch.js','variants.js']) {
    assert.deepEqual(await readFile(new URL(`../research/bank-cooldown-levels-v1/core/${name}`,import.meta.url)),await readFile(new URL(`../research/data/balance-v1-2026-10-24/runtime/core/${name}`,import.meta.url)));
  }
});

test('report separates equal and mixed levels and preserves draw reasons', () => {
  const rows=summarize([
    {levels:{white:'sharp',black:'sharp'},plies:20,result:{winner:'white'}},
    {levels:{white:'sharp',black:'sharp'},plies:40,result:{reason:'stalemate'}},
    {levels:{white:'learning',black:'sharp'},plies:10,result:{winner:'black'}},
  ]);
  assert.equal(rows[0].equalLevel,true);assert.equal(rows[0].decisiveRate,0.5);
  assert.equal(rows[0].whiteDecisiveShare,1);assert.equal(rows[0].averagePlies,30);
  assert.deepEqual(rows[0].drawReasons,{stalemate:1});assert.equal(rows[1].equalLevel,false);
});
