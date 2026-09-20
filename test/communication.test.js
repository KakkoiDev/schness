import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_COMMUNICATION_SETTINGS, communicationPacket, connectionSummary, loadCommunicationSettings,
  nextDegradation, normalizeCommunicationSettings, onAirLabel, onAirTitle, parseCommunicationPacket,
  saveCommunicationSettings,
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

test('the connection strip says whether the link is direct, and how slow', () => {
  assert.equal(connectionSummary({ relayed: false, latency: 42 }), 'Peer-to-peer · direct · ~42 ms');
  // There are no accounts and nothing passes through a server; when that stops
  // being true the interface has to say so rather than stay quiet.
  assert.equal(connectionSummary({ relayed: true, latency: 180 }), 'Relayed, not direct · ~180 ms');
  assert.equal(connectionSummary({ relayed: false, latency: null }), 'Peer-to-peer · direct');
  assert.equal(connectionSummary(), 'Peer-to-peer · direct');
});

test('a struggling connection gives up video, then audio, and never the clock', () => {
  assert.equal(nextDegradation({ video: true, audio: true, unstable: true }), 'video');
  assert.equal(nextDegradation({ video: false, audio: true, unstable: true }), 'audio');
  assert.equal(nextDegradation({ video: false, audio: false, unstable: true }), null);
  assert.equal(nextDegradation({ video: true, audio: true, unstable: false }), null);
});

test('being on air is said in the rail and in the tab title', () => {
  assert.equal(onAirLabel({ audio: true, video: false }), 'On air · mic');
  assert.equal(onAirLabel({ audio: false, video: true }), 'On air · camera');
  assert.equal(onAirLabel({ audio: true, video: true }), 'On air · mic and camera');
  assert.equal(onAirLabel({}), null);
  assert.equal(onAirTitle('Game · Schness', { audio: true }), '● On air — Game · Schness');
  // Idempotent: the title is rewritten on every change, not appended to.
  assert.equal(onAirTitle('● On air — Game · Schness', { audio: true }), '● On air — Game · Schness');
  assert.equal(onAirTitle('● On air — Game · Schness', {}), 'Game · Schness');
});
