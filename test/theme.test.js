import test from 'node:test';
import assert from 'node:assert/strict';
import { nextTheme, preferredTheme } from '../src/theme.js';

test('saved theme overrides the device preference', () => {
  assert.equal(preferredTheme('light', true), 'light');
  assert.equal(preferredTheme('dark', false), 'dark');
});

test('device preference is used without a valid saved theme', () => {
  assert.equal(preferredTheme(null, true), 'dark');
  assert.equal(preferredTheme('unknown', false), 'light');
});

test('theme toggle alternates light and dark', () => {
  assert.equal(nextTheme('light'), 'dark');
  assert.equal(nextTheme('dark'), 'light');
});
