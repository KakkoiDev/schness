import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_CHAT_LENGTH, createChatMessage, parseChatMessage } from '../src/chat.js';

test('chat messages are trimmed and versioned', () => {
  assert.deepEqual(createChatMessage('  good move  '), { v: 1, text: 'good move' });
});

test('empty and oversized chat messages are rejected', () => {
  assert.throws(() => createChatMessage('   '), /Enter a message/);
  assert.throws(() => createChatMessage('x'.repeat(MAX_CHAT_LENGTH + 1)), /at most 280/);
});

test('peer chat packets must have the supported shape', () => {
  assert.deepEqual(parseChatMessage({ v: 1, text: 'hello' }), { v: 1, text: 'hello' });
  assert.throws(() => parseChatMessage({ v: 2, text: 'hello' }), /Invalid/);
  assert.throws(() => parseChatMessage({ v: 1, text: 42 }), /Invalid/);
});
