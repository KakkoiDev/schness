import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_COMMUNICATION_SETTINGS, communicationPacket, loadCommunicationSettings,
  normalizeCommunicationSettings, parseCommunicationPacket, saveCommunicationSettings,
} from '../src/communication.js';

function memoryStorage(initial = null) {
  let value = initial;
  return { getItem: () => value, setItem: (_key, next) => { value = next; } };
}

test('text and voice communication are off by default', () => {
  assert.deepEqual(loadCommunicationSettings(memoryStorage()), DEFAULT_COMMUNICATION_SETTINGS);
});

test('communication preferences are normalized and persisted locally', () => {
  const storage = memoryStorage();
  assert.deepEqual(saveCommunicationSettings({ text: true, voice: false }, storage), { text: true, voice: false });
  assert.deepEqual(loadCommunicationSettings(storage), { text: true, voice: false });
  assert.deepEqual(normalizeCommunicationSettings({ text: 1, voice: true }), { text: false, voice: true });
});

test('communication negotiation packets require explicit booleans', () => {
  assert.deepEqual(communicationPacket({ text: true, voice: true }), { v: 1, text: true, voice: true });
  assert.deepEqual(parseCommunicationPacket({ v: 1, text: false, voice: true }), { text: false, voice: true });
  assert.throws(() => parseCommunicationPacket({ v: 1, text: 'yes', voice: true }), /Invalid/);
});
