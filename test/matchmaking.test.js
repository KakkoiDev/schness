import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseHostCandidate, colorsForPair, roomIsFull } from '../src/matchmaking.js';

test('only the lower peer id offers, choosing the smallest waiting candidate', () => {
  const peers = new Map([
    ['z9', { waiting: true }],
    ['a0', { waiting: true }],
    ['m5', { waiting: false }],
    ['n7', { waiting: true }],
  ]);
  assert.equal(chooseHostCandidate('m0', peers), 'n7');
  assert.equal(chooseHostCandidate('zz', peers), null);
});

test('the lower peer is white and the higher peer is black', () => {
  assert.deepEqual(colorsForPair('abc', 'xyz'), { abc: 'white', xyz: 'black' });
  assert.throws(() => colorsForPair('xyz', 'abc'), /lower peer id/);
});

test('a waiting third player detects an existing pair as a full room', () => {
  assert.equal(roomIsFull(new Map([
    ['player-1', { waiting: false }],
    ['player-2', { waiting: false }],
  ])), true);
  assert.equal(roomIsFull(new Map([
    ['remaining-player', { waiting: false }],
    ['waiting-player', { waiting: true }],
  ])), false);
});
