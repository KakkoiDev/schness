import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseHostCandidate, colorsForPair, roomIsFull, searchMessage } from '../src/matchmaking.js';

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

test('the waiting line escalates, and a dead relay pool outranks the schedule', () => {
  assert.match(searchMessage(0, false), /^Listening for a second player$/);
  assert.match(searchMessage(19_999, false), /^Listening for a second player$/);
  assert.match(searchMessage(20_000, false), /no one has opened the link yet/);
  assert.match(searchMessage(89_999, false), /no one has opened the link yet/);
  // After a long wait it stops implying that patience is the answer, and names
  // what it cannot rule out without claiming to have detected it.
  assert.match(searchMessage(90_000, false), /this exact link/);
  assert.match(searchMessage(90_000, false), /neither network blocks a direct connection/);
  // Never over the stalled card, at any point on the schedule.
  for (const waited of [0, 20_000, 90_000, 600_000]) {
    assert.match(searchMessage(waited, true), /no relay is answering yet/);
  }
});
