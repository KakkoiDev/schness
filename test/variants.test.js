import test from 'node:test';
import assert from 'node:assert/strict';
import { VARIANTS, VARIANT_IDS, VARIANT_LABELS, resolveVariant, variantSettings } from '../src/variants.js';
import { pairMoves } from '../src/history.js';

test('random variants choose complete known presets and links retain the resolved identity', () => {
  assert.equal(resolveVariant('random',()=>0),'canonical');
  for(let i=0;i<VARIANT_IDS.length;i++) assert.equal(resolveVariant('random',()=>(i+.5)/VARIANT_IDS.length),VARIANT_IDS[i]);
  for(const id of VARIANT_IDS) {
    assert.ok(VARIANTS[id]); assert.ok(VARIANT_LABELS[id]);
    assert.deepEqual(variantSettings(`?variant=${id}&seed=4294967295`),{id,seed:4294967295,rules:VARIANTS[id]});
  }
  assert.throws(()=>variantSettings('?variant=unsupported'));
  assert.throws(()=>variantSettings('?variant=canonical&seed=-1'));
  assert.equal(variantSettings('').id,'canonical');
});

test('replay columns respect actual movers when Black starts normal play after setup', () => {
  const entries=[{ply:1,mover:'white'},{ply:2,mover:'black'},{ply:3,mover:'black'},{ply:4,mover:'white'}];
  const rows=pairMoves(entries);
  assert.equal(rows[0].white,entries[0]);assert.equal(rows[0].black,entries[1]);
  assert.equal(rows[1].white,null);assert.equal(rows[1].black,entries[2]);
  assert.equal(rows[2].white,entries[3]);
  assert.deepEqual(rows.map(r=>r.number),[1,2,3]);
});
