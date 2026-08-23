import { joinRoom as trysteroJoin, selfId } from '../vendor/trystero/nostr.js';
import { chooseHostCandidate, colorsForPair } from './matchmaking.js';

export const RELAYS = [
  'wss://relay.snort.social',
  'wss://nostr.sathoarder.com',
  'wss://nostr.vulpem.com',
  'wss://relay.primal.net',
  'wss://nostr.mom',
  'wss://offchain.pub',
];

const APP_ID = 'schness-v2';
const PROTOCOL = 1;

export function joinMatchmaking(gameId) {
  if (!/^[0-9a-f-]{36}$/i.test(gameId)) throw new Error('Invalid match id');
  const room = trysteroJoin({ appId: APP_ID, relayUrls: RELAYS }, `match-${gameId}`);
  const [sendHello, onHello] = room.makeAction('hello');
  const [sendOffer, onOffer] = room.makeAction('offer');
  const [sendAccept, onAccept] = room.makeAction('accept');
  const [sendDecline, onDecline] = room.makeAction('decline');
  const [sendStart, onStart] = room.makeAction('start');
  const [sendGame, onGame] = room.makeAction('game');
  const [sendChatPacket, onChatPacket] = room.makeAction('chat');
  const matchHandlers = [], gameHandlers = [], chatHandlers = [], leaveHandlers = [], errorHandlers = [];
  const peers = new Map();
  let phase = 'waiting', target = null, opponentId = null, pendingTimer = null;

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
    notifyMatch(colorsForPair(selfId, id)[selfId]);
  });
  onStart((data, id) => {
    if (!validPacket(data) || phase !== 'pending-guest' || id !== target) return;
    clearPending();
    opponentId = id;
    phase = 'matched';
    announceUnavailable();
    notifyMatch(colorsForPair(id, selfId)[selfId]);
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

  function validPacket(data) {
    if (data?.v === PROTOCOL) return true;
    errorHandlers.forEach((handler) => handler('A peer is using an incompatible game version.'));
    return false;
  }
  function sendHelloPacket(to) { sendHello({ v: PROTOCOL, waiting: phase === 'waiting' }, to); }
  function announceUnavailable() { sendHello({ v: PROTOCOL, waiting: false }); }
  function seek() {
    if (phase !== 'waiting') return;
    const candidate = chooseHostCandidate(selfId, peers);
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

  queueMicrotask(announceWaiting);
  return {
    selfId,
    onMatch: (handler) => matchHandlers.push(handler),
    onGame: (handler) => gameHandlers.push(handler),
    onChat: (handler) => chatHandlers.push(handler),
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
    leave() {
      clearPending();
      phase = 'closed';
      room.leave();
    },
    get matched() { return phase === 'matched'; },
  };
}
