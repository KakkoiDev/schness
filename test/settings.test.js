import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SOUND, botDifficulty, clockMode, difficultyDepth, normalizeSound,
  rulesSeen, setBotDifficulty, setClockMode, setRulesSeen, setSoundSettings,
  soundSettings,
} from '../src/settings.js';

function fakeStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
  };
}

const hostile = {
  getItem() { throw new Error('blocked'); },
  setItem() { throw new Error('blocked'); },
};

test('the rules flag round-trips and defaults to unseen', () => {
  const storage = fakeStorage();
  assert.equal(rulesSeen(storage), false);
  setRulesSeen(true, storage);
  assert.equal(rulesSeen(storage), true);
});

test('bot strength defaults to steady and rejects nonsense', () => {
  const storage = fakeStorage();
  assert.equal(botDifficulty(storage), 'steady');
  setBotDifficulty('sharp', storage);
  assert.equal(botDifficulty(storage), 'sharp');
  setBotDifficulty('wizard', storage);
  assert.equal(botDifficulty(storage), 'steady');
});

test('strength maps to a search depth, with learning shallowest', () => {
  assert.ok(difficultyDepth('learning') < difficultyDepth('steady'));
  assert.ok(difficultyDepth('steady') < difficultyDepth('sharp'));
  assert.equal(difficultyDepth(undefined), difficultyDepth('steady'));
});

test('the clock defaults to untimed', () => {
  const storage = fakeStorage();
  assert.equal(clockMode(storage), 'untimed');
  setClockMode('3+2', storage);
  assert.equal(clockMode(storage), '3+2');
});

test('every sound cue is off until it is asked for', () => {
  const storage = fakeStorage();
  assert.deepEqual(soundSettings(storage), DEFAULT_SOUND);
  setSoundSettings({ move: true, capture: 'yes' }, storage);
  assert.deepEqual(soundSettings(storage), { ...DEFAULT_SOUND, move: true });
  assert.deepEqual(normalizeSound(null), DEFAULT_SOUND);
});

test('unreadable storage falls back to defaults rather than throwing', () => {
  assert.equal(rulesSeen(hostile), false);
  assert.equal(botDifficulty(hostile), 'steady');
  assert.equal(clockMode(hostile), 'untimed');
  assert.deepEqual(soundSettings(hostile), DEFAULT_SOUND);
  assert.equal(setRulesSeen(true, hostile), true);
});

test('corrupt stored sound settings fall back to defaults', () => {
  assert.deepEqual(soundSettings(fakeStorage({ 'schness-sound': '{oh no' })), DEFAULT_SOUND);
});
