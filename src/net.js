import { getRelaySockets, joinRoom as trysteroJoin, selfId } from '../vendor/trystero/nostr.js';
import { chooseHostCandidate, colorsForPair, roomIsFull } from './matchmaking.js';

/**
 * Two players find each other only on a relay they both dial, and trystero
 * dials every url in this list rather than a sample of it, so the list is a
 * shared rendezvous rather than a preference. That has two consequences.
 *
 * Entries are only ever added. Removing one strands a player still running a
 * cached older build on a relay the newer build no longer dials, and the
 * service worker means old builds outlive a deploy by a visit or two.
 *
 * And the list wants to be longer than feels necessary. These are volunteer
 * relays that come and go; matchmaking survives until the last one stops
 * answering, so every extra name is another whole outage that goes unnoticed.
 * The additions come from trystero's own maintained default list.
 */
export const RELAYS = [
  'wss://relay.snort.social',
  'wss://nostr.sathoarder.com',
  'wss://nostr.vulpem.com',
  'wss://relay.primal.net',
  'wss://nostr.mom',
  'wss://offchain.pub',
  'wss://eu.purplerelay.com',
  'wss://nostr.data.haus',
  'wss://relay.fountain.fm',
  'wss://relay.nostromo.social',
];

const APP_ID = 'schness-v2';
const PROTOCOL = 1;
const SOCKET_OPEN = 1;

/**
 * How many of the relays we asked for are actually answering. Trystero opens
 * them in the background and never reports a failure, so without this a player
 * whose network blocks the relays waits on "listening" until they give up.
 */
export function relayReach(sockets = getRelaySockets()) {
  const open = Object.values(sockets ?? {})
    .filter((socket) => socket?.readyState === SOCKET_OPEN).length;
  return { total: RELAYS.length, open };
}

export function joinMatchmaking(gameId, {
  joinRoom = trysteroJoin, localId = selfId, helloIntervalMs = 4000,
} = {}) {
  if (!/^[0-9a-f-]{36}$/i.test(gameId)) throw new Error('Invalid match id');
  const room = joinRoom({ appId: APP_ID, relayUrls: RELAYS }, `match-${gameId}`);
  const [sendHello, onHello] = room.makeAction('hello');
  const [sendOffer, onOffer] = room.makeAction('offer');
  const [sendAccept, onAccept] = room.makeAction('accept');
  const [sendDecline, onDecline] = room.makeAction('decline');
  const [sendStart, onStart] = room.makeAction('start');
  const [sendGame, onGame] = room.makeAction('game');
  const [sendChatPacket, onChatPacket] = room.makeAction('chat');
  const [sendPreferencesPacket, onPreferencesPacket] = room.makeAction('prefs');
  const [sendControlPacket, onControlPacket] = room.makeAction('control');
  const matchHandlers = [], fullHandlers = [], gameHandlers = [], chatHandlers = [], preferenceHandlers = [], controlHandlers = [], streamHandlers = [], leaveHandlers = [], errorHandlers = [];
  const peers = new Map();
  let phase = 'waiting', target = null, opponentId = null, pendingTimer = null, lastPreferences = null;

  room.onPeerJoin((id) => sendHelloPacket(id));
  room.onPeerLeave((id) => {
    peers.delete(id);
    if (id === opponentId) {
      opponentId = null;
      phase = 'closed';
      leaveHandlers.forEach((handler) => handler());
    } else if (id === target) {
      resetPending();
      seek();
    }
  });

  onHello((data, id) => {
    if (!validPacket(data)) return;
    peers.set(id, { waiting: data.waiting === true });
    if (phase === 'waiting' && roomIsFull(peers)) {
      phase = 'full';
      fullHandlers.forEach((handler) => handler());
      return;
    }
    seek();
  });
  onOffer((data, id) => {
    if (!validPacket(data)) return;
    if (phase !== 'waiting') return sendDecline({ v: PROTOCOL }, id);
    phase = 'pending-guest';
    target = id;
    armPending();
    sendAccept({ v: PROTOCOL }, id);
  });
  onAccept((data, id) => {
    if (!validPacket(data) || phase !== 'pending-host' || id !== target) return;
    clearPending();
    opponentId = id;
    phase = 'matched';
    sendStart({ v: PROTOCOL }, id);
    announceUnavailable();
    notifyMatch(colorsForPair(localId, id)[localId]);
  });
  onStart((data, id) => {
    if (!validPacket(data) || phase !== 'pending-guest' || id !== target) return;
    clearPending();
    opponentId = id;
    phase = 'matched';
    announceUnavailable();
    notifyMatch(colorsForPair(id, localId)[localId]);
  });
  onDecline((data, id) => {
    if (!validPacket(data) || id !== target || !phase.startsWith('pending')) return;
    resetPending();
    peers.set(id, { waiting: false });
    seek();
  });
  onGame((payload, id) => {
    if (phase === 'matched' && id === opponentId) gameHandlers.forEach((handler) => handler(payload));
  });
  onChatPacket((payload, id) => {
    if (phase === 'matched' && id === opponentId) chatHandlers.forEach((handler) => handler(payload));
  });
  onControlPacket((payload, id) => {
    if (phase === 'matched' && id === opponentId) controlHandlers.forEach((handler) => handler(payload));
  });
  onPreferencesPacket((payload, id) => {
    if (phase === 'matched' && id === opponentId) {
      lastPreferences = payload;
      preferenceHandlers.forEach((handler) => handler(payload));
    }
  });
  room.onPeerStream((stream, id) => {
    if (phase === 'matched' && id === opponentId) streamHandlers.forEach((handler) => handler(stream));
  });

  function validPacket(data) {
    if (data?.v === PROTOCOL) return true;
    errorHandlers.forEach((handler) => handler('A peer is using an incompatible game version.'));
    return false;
  }
  function sendHelloPacket(to) { sendHello({ v: PROTOCOL, waiting: phase === 'waiting' }, to); }
  function announceUnavailable() { sendHello({ v: PROTOCOL, waiting: false }); }
  function seek() {
    if (phase !== 'waiting') return;
    const candidate = chooseHostCandidate(localId, peers);
    if (!candidate) return;
    phase = 'pending-host';
    target = candidate;
    armPending();
    sendOffer({ v: PROTOCOL }, candidate);
  }
  function armPending() {
    clearPending();
    pendingTimer = setTimeout(() => {
      resetPending();
      announceWaiting();
      seek();
    }, 6000);
  }
  function clearPending() {
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  function resetPending() {
    clearPending();
    target = null;
    if (!opponentId) phase = 'waiting';
  }
  function announceWaiting() {
    if (phase === 'waiting') sendHello({ v: PROTOCOL, waiting: true });
  }
  function notifyMatch(color) { matchHandlers.forEach((handler) => handler({ color, opponentId })); }

  // A hello sent while the other page is still registering its action handler
  // can disappear. Reannounce while waiting so two open browsers recover
  // without a refresh, even if both initial hellos were missed.
  const helloTimer = setInterval(announceWaiting, helloIntervalMs);
  queueMicrotask(announceWaiting);
  return {
    selfId: localId,
    onMatch: (handler) => matchHandlers.push(handler),
    onRoomFull: (handler) => fullHandlers.push(handler),
    onGame: (handler) => gameHandlers.push(handler),
    onChat: (handler) => chatHandlers.push(handler),
    onPreferences(handler) {
      preferenceHandlers.push(handler);
      if (lastPreferences) queueMicrotask(() => handler(lastPreferences));
    },
    onControl: (handler) => controlHandlers.push(handler),
    onPeerStream: (handler) => streamHandlers.push(handler),
    onOpponentLeave: (handler) => leaveHandlers.push(handler),
    onError: (handler) => errorHandlers.push(handler),
    sendGame(payload) {
      if (phase !== 'matched' || !opponentId) throw new Error('No opponent is connected');
      sendGame(payload, opponentId);
    },
    sendChat(payload) {
      if (phase !== 'matched' || !opponentId) throw new Error('No opponent is connected');
      sendChatPacket(payload, opponentId);
    },
    sendPreferences(payload) {
      if (phase !== 'matched' || !opponentId) throw new Error('No opponent is connected');
      sendPreferencesPacket(payload, opponentId);
    },
    /** Out-of-band match control: take-back requests and resignations. */
    sendControl(payload) {
      if (phase !== 'matched' || !opponentId) throw new Error('No opponent is connected');
      sendControlPacket(payload, opponentId);
    },
    addStream(stream) {
      if (phase !== 'matched' || !opponentId) throw new Error('No opponent is connected');
      room.addStream(stream, opponentId);
    },
    removeStream(stream) {
      if (opponentId) room.removeStream(stream, opponentId);
    },
    /**
     * What the link actually is, read from the peer connection rather than
     * assumed: whether the selected candidate pair goes through a relay, and
     * the round-trip time. The bundled configuration carries STUN and no TURN,
     * so `relayed` cannot currently be true — the branch exists because the
     * interface has to stop claiming "nothing passes through a server" the
     * moment that stops being so, and adding a TURN server should not also
     * require remembering to make the strip honest.
     */
    async connectionReport() {
      if (phase !== 'matched' || !opponentId) return null;
      const connection = room.getPeers?.()[opponentId];
      if (!connection?.getStats) return null;
      let stats;
      try { stats = await connection.getStats(); } catch { return null; }
      let pair = null;
      stats.forEach((report) => {
        if (report.type !== 'candidate-pair') return;
        if (report.selected || (report.state === 'succeeded' && report.nominated)) pair = report;
      });
      if (!pair) return null;
      let remote = null;
      stats.forEach((report) => { if (report.id === pair.remoteCandidateId) remote = report; });
      return {
        relayed: remote?.candidateType === 'relay',
        latency: Number.isFinite(pair.currentRoundTripTime) ? pair.currentRoundTripTime * 1000 : null,
      };
    },
    leave() {
      clearPending();
      clearInterval(helloTimer);
      phase = 'closed';
      room.leave();
    },
    get matched() { return phase === 'matched'; },
  };
}
