import { joinRoom as p2pJoinRoom, RELAYS as SHARED_RELAYS } from '../vendor/p2p-core/p2p-core.js';
import { matchmake } from '../vendor/p2p-core/extras/matchmaking.js';
import { colorsForPair } from './matchmaking.js';

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
 *
 * The list itself now lives in p2p-core (`vendor/p2p-core/src/relays.js`),
 * shared with every other app built on it, under the same append-only rule.
 * It is spread here so this file still names the rendezvous it dials.
 */
export const RELAYS = [...SHARED_RELAYS];

const APP_ID = 'schness-v2';
const PROTOCOL = 1;
const SOCKET_OPEN = 1;

/**
 * How many of the relays we asked for are actually answering. Trystero opens
 * them in the background and never reports a failure, so without this a player
 * whose network blocks the relays waits on "listening" until they give up.
 *
 * Called with no argument it reads the live room; the argument is for tests.
 */
let liveRoom = null;
export function relayReach(sockets) {
  if (sockets === undefined) {
    const relays = liveRoom?.status().transports.relays;
    return { total: RELAYS.length, open: relays?.open ?? 0 };
  }
  const open = Object.values(sockets ?? {})
    .filter((socket) => socket?.readyState === SOCKET_OPEN).length;
  return { total: RELAYS.length, open };
}

/**
 * A p2p-core room in trystero's call shape, so tests can hand in a fake
 * trystero joinRoom. Besides the relays, p2p-core finds a second tab of this
 * same browser directly, and a local `p2p-core serve` the page was loaded
 * from, so two tabs and an offline classroom can both play.
 */
function defaultJoinRoom(config, roomId) {
  const room = p2pJoinRoom({ app: config.appId, room: roomId, relays: config.relayUrls });
  liveRoom = room;
  return room;
}

export function joinMatchmaking(gameId, {
  joinRoom = defaultJoinRoom, localId, helloIntervalMs = 4000,
} = {}) {
  if (!/^[0-9a-f-]{36}$/i.test(gameId)) throw new Error('Invalid match id');
  const room = joinRoom({ appId: APP_ID, relayUrls: RELAYS }, `match-${gameId}`);
  // Pairing (hello / offer / accept / decline / start, lost-hello recovery,
  // the room-full rule) is p2p-core's `matchmake`, extracted from this file.
  // The wire format is unchanged, so builds from before the move still pair.
  const match = matchmake(room, { selfId: localId ?? room.selfId, protocol: PROTOCOL, helloIntervalMs });
  const selfId = match.selfId;
  const [sendGame, onGame] = match.channel('game');
  const [sendChatPacket, onChatPacket] = match.channel('chat');
  const [sendPreferencesPacket, onPreferencesPacket] = match.channel('prefs');
  const [sendControlPacket, onControlPacket] = match.channel('control');
  const matchHandlers = [], gameHandlers = [], chatHandlers = [], preferenceHandlers = [], controlHandlers = [];
  let lastPreferences = null;

  match.onMatch(({ opponentId, host }) => {
    const color = host ? colorsForPair(selfId, opponentId)[selfId] : colorsForPair(opponentId, selfId)[selfId];
    matchHandlers.forEach((handler) => handler({ color, opponentId }));
  });
  onGame((payload) => gameHandlers.forEach((handler) => handler(payload)));
  onChatPacket((payload) => chatHandlers.forEach((handler) => handler(payload)));
  onControlPacket((payload) => controlHandlers.forEach((handler) => handler(payload)));
  onPreferencesPacket((payload) => {
    lastPreferences = payload;
    preferenceHandlers.forEach((handler) => handler(payload));
  });

  return {
    selfId,
    onMatch: (handler) => matchHandlers.push(handler),
    onRoomFull: match.onRoomFull,
    onGame: (handler) => gameHandlers.push(handler),
    onChat: (handler) => chatHandlers.push(handler),
    onPreferences(handler) {
      preferenceHandlers.push(handler);
      if (lastPreferences) queueMicrotask(() => handler(lastPreferences));
    },
    onControl: (handler) => controlHandlers.push(handler),
    onPeerStream: match.onPeerStream,
    onOpponentLeave: match.onOpponentLeave,
    onError: match.onError,
    sendGame: (payload) => { sendGame(payload); },
    sendChat: (payload) => { sendChatPacket(payload); },
    sendPreferences: (payload) => { sendPreferencesPacket(payload); },
    /** Out-of-band match control: take-back requests and resignations. */
    sendControl: (payload) => { sendControlPacket(payload); },
    addStream: (stream) => { match.addStream(stream); },
    removeStream: (stream) => { match.removeStream(stream); },
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
      const connection = match.matched ? match.connection() : null;
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
      match.leave();
      if (liveRoom === room) liveRoom = null;
    },
    get matched() { return match.matched; },
  };
}
