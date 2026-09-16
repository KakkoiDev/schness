import test from 'node:test';
import assert from 'node:assert/strict';
import { RELAYS, relayReach } from '../src/net.js';

const OPEN = 1, CONNECTING = 0, CLOSED = 3;

test('relay reach counts only the sockets that are actually open', () => {
  assert.deepEqual(relayReach({ a: { readyState: OPEN }, b: { readyState: OPEN } }),
    { total: RELAYS.length, open: 2 });
  assert.deepEqual(relayReach({ a: { readyState: OPEN }, b: { readyState: CONNECTING } }),
    { total: RELAYS.length, open: 1 });
});

test('a room still opening is not mistaken for a reachable one', () => {
  // Every relay mid-handshake reads as unreachable, which is why the caller
  // waits out a grace period before it tells the player anything is wrong.
  assert.equal(relayReach({ a: { readyState: CONNECTING }, b: { readyState: CONNECTING } }).open, 0);
  assert.equal(relayReach({ a: { readyState: CLOSED } }).open, 0);
});

test('reach survives the shapes trystero can hand back before it connects', () => {
  for (const sockets of [undefined, null, {}, { a: undefined }, { a: null }]) {
    assert.equal(relayReach(sockets).open, 0);
  }
});

test('the relay list is plural, so one dead relay is not one dead app', () => {
  // Matchmaking survives until the last relay stops answering.
  assert.ok(RELAYS.length >= 8, 'the relay pool has shrunk below a safe margin');
  assert.equal(new Set(RELAYS).size, RELAYS.length, 'a relay is listed twice');
  for (const url of RELAYS) assert.match(url, /^wss:\/\/[a-z0-9.-]+(\/\S*)?$/i);
});

test('no relay is ever dropped from the rendezvous list', () => {
  // A player on a cached older build still dials these. Removing one strands
  // them on a relay the newer build no longer joins, and the service worker
  // keeps old builds alive for a visit or two after a deploy. Add, never cut.
  const published = [
    'wss://relay.snort.social',
    'wss://nostr.sathoarder.com',
    'wss://nostr.vulpem.com',
    'wss://relay.primal.net',
    'wss://nostr.mom',
    'wss://offchain.pub',
  ];
  for (const url of published) {
    assert.ok(RELAYS.includes(url), `${url} was removed; older builds still dial it`);
  }
});

test('two browsers recover if their initial hello packets are lost', async () => {
  const { joinMatchmaking } = await import('../src/net.js');
  const rooms = new Map();
  const withheld = new Set(['a', 'b']);
  function joinRoom(_config, roomId, id) {
    const handlers = new Map();
    const room = {
      onPeerJoin(handler) { this.join = handler; },
      onPeerLeave(handler) { this.leaveHandler = handler; },
      onPeerStream() {},
      makeAction(name) {
        return [(packet, target) => {
          if (name === 'hello' && withheld.has(id)) {
            withheld.delete(id);
            return;
          }
          for (const [peerId, other] of rooms) {
            if (peerId !== id && (!target || target === peerId))
              queueMicrotask(() => other.handlers.get(name)?.(packet, id));
          }
        }, handler => handlers.set(name, handler)];
      },
      leave() { rooms.delete(id); },
    };
    room.handlers = handlers;
    rooms.set(id, room);
    return room;
  }
  const a = joinMatchmaking('00000000-0000-4000-8000-000000000001', {
    joinRoom: (config, roomId) => joinRoom(config, roomId, 'a'), localId: 'a', helloIntervalMs: 10,
  });
  const b = joinMatchmaking('00000000-0000-4000-8000-000000000001', {
    joinRoom: (config, roomId) => joinRoom(config, roomId, 'b'), localId: 'b', helloIntervalMs: 10,
  });
  try {
    const outcomes = [];
    a.onMatch(info => outcomes.push(['a', info.color]));
    b.onMatch(info => outcomes.push(['b', info.color]));
    rooms.get('a').join('b');
    rooms.get('b').join('a');
    await new Promise(resolve => setTimeout(resolve, 80));
    assert.equal(a.matched, true);
    assert.equal(b.matched, true);
    assert.deepEqual(outcomes.sort(), [['a', 'white'], ['b', 'black']]);
  } finally {
    a.leave();
    b.leave();
  }
});
