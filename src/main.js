import {
  BANK_PIECES, BLACK, BISHOP, KING, KNIGHT, ROOK, WHITE,
  applyAction, attackersOf, createInitialPosition, getResult, isInCheck, kingSquare,
  legalActions, opponent,
} from './rules.js';
import { colorName, pieceName, squareName } from './notation.js';
import { gameText, moveCount, pairMoves, pliesToUndo, recordAction } from './history.js';
import { isCursorKey, moveCursor, readEntry } from './keyboard.js';
import { actionAt, bankSelection, boardSelection, destinations, setupActionAt, setupDestinations } from './interaction.js';
import { applyActionMessage, makeActionMessage, outcomeSummary } from './game-message.js';
import { createGameId, gameRoute, gameUrl } from './navigation.js';
import { createChatMessage, parseChatMessage } from './chat.js';
import { actionHighlights } from './board-ui.js';
import { movedEnough } from './drag.js';
import {
  botDifficulty, clockMode, difficultyDepth,
  setSoundSettings, soundSettings,
} from './settings.js';
import { addIncrement, createClock, flagged, formatClock, isLow, isTimed, spend } from './clock.js';
import { createSoundBoard } from './sound.js';
import { initTheme } from './theme.js';

initTheme();

const PIECE_FILES = { [KING]: 'K', [ROOK]: 'R', [BISHOP]: 'B', [KNIGHT]: 'N' };
const board = document.querySelector('#board');
const humanBank = document.querySelector('#human-bank');
const opponentBank = document.querySelector('#opponent-bank');
const humanName = document.querySelector('#human-name');
const opponentName = document.querySelector('#opponent-name');
const turnCard = document.querySelector('#turn-card');
const turnTitle = document.querySelector('#turn-title');
const turnDetail = document.querySelector('#turn-detail');
const deselectButton = document.querySelector('#deselect');
const resultOverlay = document.querySelector('#result-overlay');
const resultCard = resultOverlay.querySelector('.result-card');
const resultEyebrow = document.querySelector('#result-eyebrow');
const resultHeadline = document.querySelector('#result-headline');
const resultDetail = document.querySelector('#result-detail');
const resultPrimary = document.querySelector('#result-primary');
const resultSecondary = document.querySelector('#result-secondary');
const resultHome = document.querySelector('#result-home');
const humanClock = document.querySelector('#human-clock');
const opponentClock = document.querySelector('#opponent-clock');
const soundDialog = document.querySelector('#sound-dialog');
const announcement = document.querySelector('#announcement');
const shortcutsDialog = document.querySelector('#shortcuts-dialog');
const reviewCard = document.querySelector('#review-card');
const reviewTitle = document.querySelector('#review-title');
const reviewLive = document.querySelector('#review-live');
const matchRail = document.querySelector('#match-rail');
const movesBody = document.querySelector('#moves-body');
const movesToggle = document.querySelector('#moves-toggle');
const lastMoveText = document.querySelector('#last-move-text');
const copyGame = document.querySelector('#copy-game');
const undoButton = document.querySelector('#undo');
const resignButton = document.querySelector('#resign');
const moveFirst = document.querySelector('#move-first');
const moveBack = document.querySelector('#move-back');
const moveForward = document.querySelector('#move-forward');
const opponentBankLabel = document.querySelector('#opponent-bank-label');
const humanBankLabel = document.querySelector('#human-bank-label');
const networkCard = document.querySelector('#network-card');
const cardStates = {
  waiting: document.querySelector('#card-waiting'),
  reconnect: document.querySelector('#card-reconnect'),
  expired: document.querySelector('#card-expired'),
};
const inviteUrl = document.querySelector('#invite-url');
const copyInvite = document.querySelector('#copy-invite');
const cancelSearch = document.querySelector('#cancel-search');
const searchStatus = document.querySelector('#search-status');
const searchPulse = document.querySelector('#search-pulse');
const searchStalled = document.querySelector('#search-stalled');
const stalledBot = document.querySelector('#stalled-bot');
const reconnectBar = document.querySelector('#reconnect-bar');
const reconnectLeft = document.querySelector('#reconnect-left');
const claimWin = document.querySelector('#claim-win');
const keepWaiting = document.querySelector('#keep-waiting');
const newOnline = document.querySelector('#new-online');
const botInstead = document.querySelector('#bot-instead');
const connectionStrip = document.querySelector('#connection-strip');
const connectionLabel = document.querySelector('#connection-label');
const connectionNote = document.querySelector('#connection-note');
const resetButton = document.querySelector('#reset');
const rulesDialog = document.querySelector('#rules-dialog');
const matchChat = document.querySelector('#match-chat');
const chatLog = document.querySelector('#chat-log');
const chatForm = document.querySelector('#chat-form');
const chatMessage = document.querySelector('#chat-message');
const chatNote = document.querySelector('#chat-note');
const chatBody = document.querySelector('#chat-body');
const chatToggle = document.querySelector('#chat-toggle');
const quickChat = document.querySelector('#quick-chat');
const voiceStatus = document.querySelector('#voice-status');
const voiceToggle = document.querySelector('#voice-toggle');
const videoToggle = document.querySelector('#video-toggle');
const videoStage = document.querySelector('#video-stage');
const localVideo = document.querySelector('#local-video');
const peerVideo = document.querySelector('#peer-video');
const hearOpponent = document.querySelector('#hear-opponent');
const peerAudio = document.querySelector('#peer-audio');
const route = gameRoute(window.location.search);
const mobileChatQuery = window.matchMedia('(max-width: 899px)');

let position = createInitialPosition();
let humanColor = WHITE;
let mode = null;
let selection = null;
let thinking = false;
let botRequest = 0;
let worker = createWorker();
let network = null;
let searchTimer = null;
let disconnected = false;
let microphoneStream = null;
let microphoneStarting = false;
let cameraStream = null;
let cameraStarting = false;
let chatEnabled = !mobileChatQuery.matches;
let unreadMessages = 0;
let lastAction = null;
let opponentLabel = 'Bot';
let failure = null;
let history = [];
let timeline = [position];
let reviewPly = null;
let resigned = null;
let outbox = [];
let sendFailed = false;
let reconnectDeadline = null;
let reconnectTimer = null;
let cursor = 0;
let keyboardActive = false;
let pendingFile = null;
let announceTimer = null;
let takebackPending = false;
let agreedDraw = false;
let drawOffered = false;
let resultDismissed = false;
let clock = createClock(clockMode());
let clockSince = null;
let clockTimer = null;
let sound = soundSettings();
const soundBoard = createSoundBoard(() => sound);
let pointerDrag = null;
let suppressClick = false;

for (let visual = 0; visual < 16; visual += 1) {
  const button = document.createElement('button');
  button.className = 'square';
  button.type = 'button';
  button.id = `square-${visual}`;
  button.tabIndex = -1;
  button.dataset.visual = String(visual);
  button.addEventListener('click', () => {
    if (!suppressClick) onSquare(Number(button.dataset.square));
  });
  button.addEventListener('pointerdown', (event) => beginBoardDrag(event, button));
  board.append(button);
}

// The board keeps a single tab stop; the cursor is tracked here rather than
// by moving focus, because a square is disabled whenever it is not your turn.
board.addEventListener('keydown', onBoardKey);
board.addEventListener('pointerdown', () => setKeyboardActive(false));

window.addEventListener('pointermove', movePointerDrag, { passive: false });
window.addEventListener('pointerup', endPointerDrag);
window.addEventListener('pointercancel', cancelPointerDrag);
mobileChatQuery.addEventListener('change', ({ matches }) => {
  chatEnabled = !matches;
  unreadMessages = 0;
  updateCommunicationUi();
});

resetButton.addEventListener('click', startNewGame);
deselectButton.addEventListener('click', () => {
  selection = null;
  render();
});
reviewLive.addEventListener('click', () => goToPly(null));
moveFirst.addEventListener('click', () => goToPly(0));
moveBack.addEventListener('click', () => stepReview(-1));
moveForward.addEventListener('click', () => stepReview(1));
undoButton.addEventListener('click', undoTurn);
resignButton.addEventListener('click', resign);
resultHome.addEventListener('click', () => window.location.assign('./'));
document.querySelectorAll('[data-open-sound]').forEach((button) =>
  button.addEventListener('click', () => soundDialog.showModal()));
soundDialog.querySelectorAll('[data-cue]').forEach((input) => {
  input.checked = sound[input.dataset.cue] === true;
  input.addEventListener('change', () => {
    sound = setSoundSettings({ ...sound, [input.dataset.cue]: input.checked });
    // Play the cue back so the switch is self-explanatory, and it is a gesture.
    if (input.checked && input.dataset.cue !== 'haptics') soundBoard.play(input.dataset.cue);
  });
});
copyGame.addEventListener('click', copyGameText);
movesToggle.addEventListener('click', () => {
  const open = matchRail.classList.toggle('is-open');
  movesToggle.setAttribute('aria-expanded', String(open));
});
// The board owns the arrow keys, so reviewing is bound to the panel itself.
matchRail.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
  event.preventDefault();
  stepReview(event.key === 'ArrowUp' ? -1 : 1);
});
copyInvite.addEventListener('click', copyInviteLink);
cancelSearch.addEventListener('click', () => window.location.assign('./'));
newOnline.addEventListener('click', () => window.location.assign(gameUrl(window.location.href, 'online', createGameId())));
botInstead.addEventListener('click', () => window.location.assign(gameUrl(window.location.href, 'bot', createGameId())));
stalledBot.addEventListener('click', () => window.location.assign(gameUrl(window.location.href, 'bot', createGameId())));
claimWin.addEventListener('click', () => {
  stopReconnectCountdown();
  resigned = opponent(humanColor);
  showCard(null);
  render();
});
keepWaiting.addEventListener('click', () => startReconnectCountdown());
window.addEventListener('online', onConnectionChange);
window.addEventListener('offline', onConnectionChange);
chatForm.addEventListener('submit', sendChatMessage);
chatToggle.addEventListener('click', toggleChat);
quickChat.addEventListener('click', (event) => {
  if (event.target.closest('[data-quick-action="draw"]')) return offerDraw();
  const text = event.target.closest('[data-quick-message]')?.dataset.quickMessage;
  if (text) sendChatText(text);
});
voiceToggle.addEventListener('click', toggleMicrophone);
videoToggle.addEventListener('click', toggleCamera);
hearOpponent.addEventListener('click', () => {
  peerAudio.play().then(() => {
    hearOpponent.hidden = true;
    voiceStatus.textContent = 'Voice connected.';
  }).catch(() => { voiceStatus.textContent = 'Your browser is still blocking incoming audio.'; });
});
document.querySelectorAll('[data-open-rules]').forEach((button) =>
  button.addEventListener('click', () => rulesDialog.showModal()));
// The rules open from the Rules button and nowhere else. A match that opens
// behind a modal is not the instant start the lobby promises, and the board
// itself teaches the game: the turn card names the one thing to do next.
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
if (route?.mode === 'bot') startBotMatch();
else if (route?.mode === 'online') startOnlineSearch(route.gameId);
else window.location.replace('./');

function showCard(state) {
  for (const [name, element] of Object.entries(cardStates)) element.hidden = name !== state;
  networkCard.hidden = state === null;
}

/**
 * The strip reports your own connection. Their trouble is a card, so the two
 * never get mistaken for each other.
 */
function renderConnection() {
  if (mode !== 'online' || !network?.matched || disconnected) {
    connectionStrip.hidden = true;
    return;
  }
  const offline = !navigator.onLine;
  connectionStrip.hidden = false;
  connectionStrip.classList.toggle('is-danger', offline);
  connectionStrip.classList.toggle('is-warn', !offline && sendFailed);
  connectionLabel.textContent = offline
    ? 'Offline · moves will send when you’re back'
    : sendFailed ? 'Your connection is unstable' : `Connected · ${opponentLabel} is on the board`;
  connectionNote.textContent = !offline && sendFailed ? 'Retrying' : '';
}

function onConnectionChange() {
  if (navigator.onLine) {
    flushOutbox();
    if (mode === 'online') announce('You are back online.');
  } else if (mode === 'online') {
    announce('You are offline. Moves will send when you are back.');
  }
  renderConnection();
}

/** Moves are queued rather than dropped, which is what the strip promises. */
function sendGameMessage(message) {
  outbox.push(message);
  flushOutbox();
}

function flushOutbox() {
  while (outbox.length && network?.matched) {
    try {
      network.sendGame(outbox[0]);
      outbox.shift();
      sendFailed = false;
    } catch {
      sendFailed = true;
      break;
    }
  }
  renderConnection();
}

function startReconnectCountdown(seconds = 60) {
  stopReconnectCountdown();
  reconnectDeadline = Date.now() + seconds * 1000;
  reconnectTimer = setInterval(tickReconnect, 1000);
  tickReconnect();
}

function stopReconnectCountdown() {
  if (reconnectTimer) clearInterval(reconnectTimer);
  reconnectTimer = null;
  reconnectDeadline = null;
}

function tickReconnect() {
  const total = 60_000;
  const left = Math.max(0, reconnectDeadline - Date.now());
  reconnectBar.style.width = `${Math.round(((total - left) / total) * 100)}%`;
  const secondsLeft = Math.ceil(left / 1000);
  reconnectLeft.textContent = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')} left`;
  // The countdown never awards the game; the player decides.
  if (left === 0) stopReconnectCountdown();
}

function startBotMatch() {
  stopNetwork();
  resetState('bot', WHITE);
  opponentLabel = 'Bot';
  showMatch();
}

async function startOnlineSearch(gameId) {
  if (!navigator.onLine) return;
  stopNetwork();
  resetState('online', WHITE);
  board.closest('.play-area').hidden = true;
  // resetState already rendered, so the rail needs telling directly here.
  matchRail.hidden = true;
  inviteUrl.value = window.location.href;
  showCard('waiting');
  try {
    const { joinMatchmaking, relayReach } = await import('./net.js');
    if (mode !== 'online') return;
    network = joinMatchmaking(gameId);
    network.onMatch(({ color }) => beginOnlineMatch(color));
    network.onRoomFull(showRoomFull);
    network.onGame(receivePeerAction);
    network.onChat(receiveChatMessage);
    network.onControl(receiveControl);
    network.onPeerStream(receivePeerStream);
    network.onOpponentLeave(() => {
      disconnected = true;
      announce('Your opponent lost connection.');
      stopMicrophone();
      stopCamera();
      showCard('reconnect');
      startReconnectCountdown();
      render();
    });
    network.onError(announce);
    watchRelayReach(relayReach);
  } catch (error) {
    announce(`Could not start online play: ${error.message}`);
  }
}

/**
 * Trystero opens its relays in the background and never reports a failure, so
 * a blocked or dead relay list looked exactly like a friend who had not
 * clicked the link yet. Poll instead, after enough grace for a normal connect.
 */
function watchRelayReach(relayReach) {
  const startedAt = Date.now();
  const grace = 6000;
  const paint = () => {
    const stalled = relayReach().open === 0 && Date.now() - startedAt > grace;
    searchStatus.textContent = stalled
      ? 'Not connected to the matchmaking network'
      : 'Listening for a second player';
    searchPulse.hidden = stalled;
    searchStalled.hidden = !stalled;
  };
  clearInterval(searchTimer);
  paint();
  searchTimer = setInterval(paint, 2500);
}

function showRoomFull() {
  stopNetwork();
  showCard('expired');
}

function beginOnlineMatch(color) {
  clearInterval(searchTimer);
  humanColor = color;
  position = createInitialPosition();
  history = [];
  timeline = [position];
  reviewPly = null;
  resigned = null;
  takebackPending = false;
  agreedDraw = false;
  drawOffered = false;
  resultDismissed = false;
  clock = createClock(clockMode());
  // White owns the clock choice; Black adopts whatever White announces.
  if (color === WHITE) {
    try { network.sendControl({ kind: 'clock', mode: clock.mode }); } catch { /* Untimed for both. */ }
  }
  clockSince = isTimed(clock) ? Date.now() : null;
  startClockTicking();
  selection = null;
  disconnected = false;
  appendChatSeparator();
  opponentLabel = 'Online player';
  showCard(null);
  board.closest('.play-area').hidden = false;
  matchChat.hidden = false;
  updateCommunicationUi();
  render();
}

function sendChatMessage(event) {
  event.preventDefault();
  sendChatText(chatMessage.value);
}

function sendChatText(text) {
  if (!canTextChat()) return;
  try {
    const message = createChatMessage(text);
    network.sendChat(message);
    appendChatMessage(message.text, 'You');
    chatMessage.value = '';
  } catch (error) {
    chatMessage.setCustomValidity(error.message);
    chatMessage.reportValidity();
  }
}

function receiveChatMessage(payload) {
  try {
    const message = parseChatMessage(payload);
    appendChatMessage(message.text, 'Opponent');
    if (!chatEnabled) {
      unreadMessages += 1;
      updateCommunicationUi();
    }
  } catch {
    // Ignore malformed peer messages without interrupting the match.
  }
}

function canTextChat() {
  return mode === 'online' && !disconnected && network?.matched && chatEnabled;
}

function updateCommunicationUi() {
  matchChat.hidden = mode !== 'online';
  chatBody.hidden = !chatEnabled;
  matchChat.classList.toggle('chat-collapsed', mobileChatQuery.matches && !chatEnabled);
  chatToggle.textContent = chatEnabled
    ? (mobileChatQuery.matches ? 'Close' : 'Hide chat')
    : `Chat${unreadMessages ? ` (${unreadMessages})` : ''}`;
  chatToggle.setAttribute('aria-expanded', String(chatEnabled));
  const textReady = canTextChat();
  chatMessage.disabled = !textReady;
  chatForm.querySelector('button').disabled = !textReady;
  quickChat.querySelectorAll('button').forEach((button) => { button.disabled = !textReady; });
  const drawButton = quickChat.querySelector('[data-quick-action="draw"]');
  if (drawButton) drawButton.disabled = !textReady || drawOffered || agreedDraw || Boolean(getResult(position));
  chatMessage.placeholder = 'Message your opponent…';
  chatNote.textContent = 'Peer-to-peer · not saved';
}

async function startMicrophone() {
  if (microphoneStream || microphoneStarting || disconnected || !network?.matched) return;
  microphoneStarting = true;
  voiceStatus.textContent = 'Requesting microphone access…';
  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    if (disconnected || mode !== 'online') return stopMicrophone();
    network.addStream(microphoneStream);
    voiceStatus.textContent = 'Audio is on.';
    setMediaButton(voiceToggle, true, 'Audio');
  } catch (error) {
    voiceStatus.textContent = error.name === 'NotAllowedError'
      ? 'Microphone permission was not granted.' : 'Could not start the microphone.';
  } finally {
    microphoneStarting = false;
  }
}

function receivePeerStream(stream) {
  if (stream.getAudioTracks().length) {
    peerAudio.srcObject = stream;
    peerAudio.play().then(() => { hearOpponent.hidden = true; }).catch(() => {
      hearOpponent.hidden = false;
      voiceStatus.textContent = 'Tap “Hear audio” to listen.';
    });
  }
  if (stream.getVideoTracks().length) {
    peerVideo.srcObject = stream;
    videoStage.hidden = false;
    peerVideo.play().catch(() => {});
    stream.getVideoTracks()[0].addEventListener('ended', () => {
      peerVideo.srcObject = null;
      videoStage.hidden = !cameraStream;
    }, { once: true });
  }
}

function toggleMicrophone() {
  if (microphoneStream) stopMicrophone();
  else startMicrophone();
}

async function toggleCamera() {
  if (cameraStream) return stopCamera();
  if (cameraStarting || disconnected || !network?.matched) return;
  cameraStarting = true;
  voiceStatus.textContent = 'Requesting camera access…';
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    if (disconnected || mode !== 'online') return stopCamera();
    localVideo.srcObject = cameraStream;
    videoStage.hidden = false;
    await localVideo.play().catch(() => {});
    network.addStream(cameraStream);
    setMediaButton(videoToggle, true, 'Video');
    voiceStatus.textContent = 'Video is on.';
  } catch (error) {
    voiceStatus.textContent = error.name === 'NotAllowedError'
      ? 'Camera permission was not granted.' : 'Could not start the camera.';
  } finally {
    cameraStarting = false;
  }
}

function setMediaButton(button, enabled, label) {
  button.textContent = `${label} ${enabled ? 'on' : 'off'}`;
  button.classList.toggle('is-on', enabled);
  button.setAttribute('aria-pressed', String(enabled));
}

function stopMicrophone() {
  if (!microphoneStream) return;
  network?.removeStream(microphoneStream);
  microphoneStream.getTracks().forEach((track) => track.stop());
  microphoneStream = null;
  setMediaButton(voiceToggle, false, 'Audio');
  voiceStatus.textContent = 'Audio is off.';
}

function stopCamera() {
  if (!cameraStream) return;
  network?.removeStream(cameraStream);
  cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  localVideo.srcObject = null;
  setMediaButton(videoToggle, false, 'Video');
  videoStage.hidden = !peerVideo.srcObject;
  voiceStatus.textContent = 'Video is off.';
}

function toggleChat() {
  chatEnabled = !chatEnabled;
  if (chatEnabled) unreadMessages = 0;
  peerAudio.muted = !chatEnabled;
  if (!chatEnabled) {
    stopMicrophone();
    stopCamera();
  }
  updateCommunicationUi();
}

function appendChatMessage(text, author) {
  chatLog.querySelector('.chat-empty')?.remove();
  const row = document.createElement('p');
  row.className = `chat-message ${author === 'You' ? 'chat-own' : 'chat-peer'}`;
  const bubble = document.createElement('span');
  bubble.className = 'chat-bubble';
  bubble.textContent = text;
  const meta = document.createElement('span');
  meta.className = 'chat-meta';
  meta.textContent = `${author} · ${clockTime()}`;
  row.append(bubble, meta);
  chatLog.append(row);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function appendChatSeparator() {
  chatLog.querySelector('.chat-empty')?.remove();
  const row = document.createElement('p');
  row.className = 'chat-separator';
  row.textContent = `Match started · ${clockTime()}`;
  chatLog.append(row);
}

function clockTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function appendChatEvent(text, actions = []) {
  chatLog.querySelector('.chat-empty')?.remove();
  const row = document.createElement('p');
  row.className = 'chat-event';
  row.append(document.createTextNode(text));
  for (const { label, run } of actions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => {
      row.querySelectorAll('button').forEach((other) => other.remove());
      run();
    });
    row.append(button);
  }
  chatLog.append(row);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function receivePeerAction(message) {
  if (mode !== 'online' || disconnected || position.turn === humanColor) return;
  try {
    const before = position;
    position = applyActionMessage(before, message);
    history = recordAction(history, before, message.action, position);
    timeline.push(position);
    lastAction = message.action;
    selection = null;
    reviewPly = null;
    announceOpponentAction();
    render();
  } catch (error) {
    disconnected = true;
    failure = { title: 'Game stopped', detail: error.message };
    render();
  }
}

function resetState(nextMode, color) {
  botRequest += 1;
  position = createInitialPosition();
  humanColor = color;
  mode = nextMode;
  selection = null;
  thinking = false;
  disconnected = false;
  chatEnabled = !mobileChatQuery.matches;
  unreadMessages = 0;
  lastAction = null;
  failure = null;
  history = [];
  timeline = [position];
  reviewPly = null;
  resigned = null;
  takebackPending = false;
  agreedDraw = false;
  drawOffered = false;
  resultDismissed = false;
  clock = createClock(clockMode());
  clockSince = null;
  stopClockTicking();
  cursor = 0;
  pendingFile = null;
  announcement.textContent = '';
  matchRail.classList.remove('is-open');
  stopMicrophone();
  stopCamera();
  worker.terminate();
  worker = createWorker();
  showCard(null);
  outbox = [];
  sendFailed = false;
  stopReconnectCountdown();
  matchChat.hidden = true;
  chatLog.replaceChildren(Object.assign(document.createElement('p'), { className: 'chat-empty', textContent: 'No messages yet.' }));
  chatMessage.value = '';
  peerAudio.srcObject = null;
  peerVideo.srcObject = null;
  localVideo.srcObject = null;
  videoStage.hidden = true;
  board.closest('.play-area').hidden = false;
}

function startNewGame() {
  window.location.assign(gameUrl(window.location.href, mode ?? 'bot', createGameId()));
}

async function copyInviteLink() {
  try {
    await navigator.clipboard.writeText(inviteUrl.value);
    copyInvite.textContent = 'Copied';
  } catch {
    inviteUrl.select();
    copyInvite.textContent = 'Select link';
  }
}

function showMatch() {
  board.closest('.play-area').hidden = false;
  showCard(null);
  clockSince = isTimed(clock) ? Date.now() : null;
  startClockTicking();
  render();
}

function stopNetwork() {
  clearInterval(searchTimer);
  searchTimer = null;
  stopReconnectCountdown();
  stopClockTicking();
  stopMicrophone();
  stopCamera();
  network?.leave();
  network = null;
}

function createWorker() {
  const next = new Worker('./src/bot-worker.js', { type: 'module' });
  next.addEventListener('message', onBotMessage);
  next.addEventListener('error', () => {
    thinking = false;
    failure = { title: 'Bot error', detail: 'The bot hit an error. Start a new game to try again.' };
    render();
  });
  return next;
}

function onBoardKey(event) {
  // A click leaves focus on the square itself, so adopt it as the cursor and
  // let that button's own activation handle Enter rather than doubling up.
  const focused = event.target.closest?.('.square');
  if (focused) cursor = Number(focused.dataset.visual);
  if (event.key === '?') {
    shortcutsDialog.showModal();
    event.preventDefault();
    return;
  }
  if (isCursorKey(event.key)) {
    setKeyboardActive(true);
    cursor = moveCursor(cursor, event.key);
    pendingFile = null;
    event.preventDefault();
    // Keep focus and cursor together, so the next Enter acts where the ring is.
    if (focused) board.focus();
    render();
    return;
  }
  if (event.key === 'Enter' || event.key === ' ') {
    if (focused) return;
    setKeyboardActive(true);
    event.preventDefault();
    onSquare(squareAtCursor());
    return;
  }
  if (event.key === 'Escape') {
    setKeyboardActive(true);
    pendingFile = null;
    selection = null;
    render();
    return;
  }
  const entry = readEntry(pendingFile, event.key);
  const handled = entry.pending !== null || entry.square !== null || entry.reserve !== null;
  if (!handled && pendingFile === null) return;
  setKeyboardActive(true);
  pendingFile = entry.pending;
  if (entry.square !== null) cursor = visualOf(entry.square);
  if (entry.reserve !== null) return selectBank(BANK_PIECES[entry.reserve]);
  event.preventDefault();
  render();
}

function setKeyboardActive(active) {
  if (keyboardActive === active) return;
  keyboardActive = active;
  render();
}

/** The cursor lives in visual space; this is the same flip a click uses. */
function visualOf(square) {
  return humanColor === WHITE ? square : 15 - square;
}

function squareAtCursor() {
  return visualOf(cursor);
}

function announce(text) {
  announcement.textContent = text;
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => { announcement.textContent = ''; }, 6000);
}

/** Only the opponent's turn is announced: you know what you just played. */
function announceOpponentAction() {
  const entry = history.at(-1);
  if (!entry) return;
  const result = getResult(position);
  if (result?.type === 'win') {
    announce(`${entry.sentence}. Checkmate — ${result.winner === humanColor ? 'you win' : 'you lose'}.`);
    return;
  }
  if (result?.type === 'draw') {
    announce(`${entry.sentence}. The game is a draw.`);
    return;
  }
  if (isInCheck(position, humanColor)) {
    const attacker = attackersOf(position, kingSquare(position, humanColor), opponent(humanColor))[0];
    const from = attacker === undefined ? ''
      : ` from the ${position.board[attacker].piece} on ${squareName(attacker)}`;
    announce(`${entry.sentence}. Your king is in check${from}.`);
    return;
  }
  announce(`${entry.sentence}. Your turn.`);
}

function onSquare(square) {
  if (!canHumanAct()) return;
  if (position.phase !== 'play') {
    const action = setupActionAt(position, square);
    if (action) play(action);
    return;
  }
  const chosen = actionAt(position, selection, square);
  if (chosen) return play(chosen);
  const occupant = position.board[square];
  selection = occupant?.owner === humanColor ? boardSelection(square) : null;
  render();
}

function selectBank(piece) {
  if (!canHumanAct() || position.phase !== 'play') return;
  selection = selection?.type === 'bank' && selection.piece === piece ? null : bankSelection(piece);
  render();
}

function beginBoardDrag(event, button) {
  const square = Number(button.dataset.square);
  const occupant = position.board[square];
  if (!event.isPrimary || !canHumanAct() || position.phase !== 'play' || occupant?.owner !== humanColor) return;
  pointerDrag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
    pieceRect: button.querySelector('.piece')?.getBoundingClientRect(),
    selection: boardSelection(square), sourceSquare: square, owner: occupant.owner, piece: occupant.piece };
}

function beginBankDrag(event, piece) {
  if (!event.isPrimary || !canHumanAct() || position.phase !== 'play') return;
  pointerDrag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
    pieceRect: event.currentTarget.querySelector('.piece')?.getBoundingClientRect(),
    selection: bankSelection(piece), sourcePiece: piece, owner: humanColor, piece };
}

function movePointerDrag(event) {
  if (!pointerDrag || event.pointerId !== pointerDrag.pointerId) return;
  if (!pointerDrag.active && movedEnough(pointerDrag, event)) {
    pointerDrag.active = true;
    selection = pointerDrag.selection;
    pointerDrag.ghost = pieceElement(pointerDrag.owner, pointerDrag.piece);
    pointerDrag.ghost.classList.add('drag-ghost');
    if (pointerDrag.pieceRect) {
      pointerDrag.ghost.style.width = `${pointerDrag.pieceRect.width}px`;
      pointerDrag.ghost.style.height = `${pointerDrag.pieceRect.height}px`;
    }
    document.body.append(pointerDrag.ghost);
    render();
  }
  if (!pointerDrag.active) return;
  event.preventDefault();
  pointerDrag.ghost.style.left = `${event.clientX}px`;
  pointerDrag.ghost.style.top = `${event.clientY}px`;
}

function endPointerDrag(event) {
  if (!pointerDrag || event.pointerId !== pointerDrag.pointerId) return;
  const drag = pointerDrag;
  pointerDrag = null;
  drag.ghost?.remove();
  if (!drag.active) return;
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.square');
  const action = target ? actionAt(position, drag.selection, Number(target.dataset.square)) : null;
  event.preventDefault();
  suppressClick = true;
  setTimeout(() => { suppressClick = false; }, 0);
  if (action) play(action);
  else {
    selection = null;
    render();
  }
}

function cancelPointerDrag() {
  pointerDrag?.ghost?.remove();
  pointerDrag = null;
  render();
}

function canHumanAct() {
  return !thinking && !disconnected && !resigned && !agreedDraw && reviewPly === null &&
    position.turn === humanColor && !getResult(position);
}

function displayedPosition() {
  return reviewPly === null ? position : timeline[reviewPly];
}

function goToPly(ply) {
  reviewPly = ply === null || ply >= history.length ? null : Math.max(0, ply);
  selection = null;
  render();
}

function stepReview(delta) {
  goToPly((reviewPly ?? history.length) + delta);
}

function undoTurn() {
  if (mode === 'online') return requestTakeback();
  takeBack(humanColor);
}

/** Walks the board back to that player's turn: against the bot, a full turn. */
function takeBack(player) {
  const taken = pliesToUndo(history, timeline, player);
  if (!taken) return;
  history = history.slice(0, history.length - taken);
  timeline = timeline.slice(0, timeline.length - taken);
  position = timeline[timeline.length - 1];
  lastAction = history.at(-1)?.action ?? null;
  selection = null;
  reviewPly = null;
  thinking = false;
  takebackPending = false;
  // Any reply already in flight from the worker no longer applies.
  botRequest += 1;
  render();
}

function requestTakeback() {
  if (takebackPending || !network?.matched || !pliesToUndo(history, timeline, humanColor)) return;
  takebackPending = true;
  try {
    network.sendControl({ kind: 'takeback-request', ply: history.length });
    appendChatEvent('You asked to take back your move');
  } catch {
    takebackPending = false;
  }
  render();
}

/** A draw offer is a game event, so it lives in the stream, not a dialog. */
function offerDraw() {
  if (drawOffered || agreedDraw || !network?.matched || getResult(position)) return;
  drawOffered = true;
  try {
    network.sendControl({ kind: 'draw-offer' });
    appendChatEvent('You offered a draw');
  } catch {
    drawOffered = false;
  }
  updateCommunicationUi();
}

function acceptDraw() {
  agreedDraw = true;
  drawOffered = false;
  selection = null;
  reviewPly = null;
  appendChatEvent('Draw agreed');
  announce('The match is a draw by agreement.');
  render();
}

function receiveControl(payload) {
  if (payload?.kind === 'clock' && humanColor !== WHITE) {
    clock = createClock(payload.mode);
    clockSince = isTimed(clock) ? Date.now() : null;
    startClockTicking();
    renderClocks();
    return;
  }
  if (payload?.kind === 'draw-offer') {
    appendChatEvent(`${opponentLabel} offered a draw`, [
      { label: 'Accept', run: () => { network.sendControl({ kind: 'draw-accept' }); acceptDraw(); } },
      {
        label: 'Decline',
        run: () => {
          network.sendControl({ kind: 'draw-decline' });
          appendChatEvent(`${opponentLabel} offered a draw · declined`);
        },
      },
    ]);
    return;
  }
  if (payload?.kind === 'draw-accept' && drawOffered) return acceptDraw();
  if (payload?.kind === 'draw-decline' && drawOffered) {
    drawOffered = false;
    appendChatEvent('You offered a draw · declined');
    updateCommunicationUi();
    return;
  }
  if (payload?.kind === 'resign') {
    resigned = opponent(humanColor);
    appendChatEvent(`${opponentLabel} resigned`);
    announce(`${opponentLabel} resigned.`);
    render();
    return;
  }
  if (payload?.kind === 'takeback-request') {
    const asker = opponent(humanColor);
    appendChatEvent(`${opponentLabel} asked to take back move ${moveCount(history)}`, [
      { label: 'Allow', run: () => { network.sendControl({ kind: 'takeback-allow' }); takeBack(asker); } },
      { label: 'No', run: () => network.sendControl({ kind: 'takeback-decline' }) },
    ]);
    return;
  }
  if (payload?.kind === 'takeback-allow' && takebackPending) {
    takeBack(humanColor);
    appendChatEvent('Take-back allowed');
    return;
  }
  if (payload?.kind === 'takeback-decline' && takebackPending) {
    takebackPending = false;
    appendChatEvent('Take-back declined');
    render();
  }
}

function resign() {
  if (resigned || getResult(position) || !history.length) return;
  resigned = humanColor;
  if (mode === 'online' && network?.matched) {
    try { network.sendControl({ kind: 'resign' }); } catch { /* Nothing left to tell them. */ }
    appendChatEvent('You resigned');
  }
  selection = null;
  reviewPly = null;
  render();
}

async function copyGameText() {
  const text = gameText(history);
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copyGame.textContent = 'Copied';
  } catch {
    copyGame.textContent = 'Copy failed';
  }
}

function play(action) {
  const message = mode === 'online' ? makeActionMessage(position, action) : null;
  commit(action);
  if (message) sendGameMessage(message);
  render();
  if (mode === 'bot' && !getResult(position) && position.turn !== humanColor) requestBotMove();
  if (flagged(clock)) stopClockTicking();
}

/** Applies an action and records it, so history and position never diverge. */
function commit(action) {
  const before = position;
  const mover = before.turn;
  const captured = action.type === 'move' && Boolean(before.board[action.to]);
  position = applyAction(before, action);
  history = recordAction(history, before, action, position);
  timeline.push(position);
  lastAction = action;
  selection = null;
  reviewPly = null;
  chargeClock(mover);
  playCue(action, captured);
}

function playCue(action, captured) {
  if (captured) soundBoard.play('capture');
  else if (action.type === 'drop') soundBoard.play('deploy');
  else soundBoard.play('move');
  soundBoard.vibrate();
  if (isInCheck(position, position.turn)) soundBoard.play('check');
}

/**
 * Each side runs the clock locally off the moves it sees, so the two stay in
 * step without a shared timer to negotiate.
 */
function chargeClock(mover) {
  if (!isTimed(clock)) return;
  if (clockSince !== null) clock = spend(clock, mover, Date.now() - clockSince);
  clock = addIncrement(clock, mover);
  clockSince = position.phase === 'play' && !getResult(position) ? Date.now() : null;
  renderClocks();
}

function startClockTicking() {
  stopClockTicking();
  if (!isTimed(clock)) return;
  clockTimer = setInterval(() => {
    if (clockSince === null) return;
    const running = position.turn;
    const left = clock[running] - (Date.now() - clockSince) / 1000;
    if (left <= 0) {
      clock = spend(clock, running, Date.now() - clockSince);
      clockSince = null;
      resigned = running;
      announce(`${running === humanColor ? 'You' : opponentLabel} ran out of time.`);
      render();
      return;
    }
    renderClocks();
  }, 250);
}

function stopClockTicking() {
  if (clockTimer) clearInterval(clockTimer);
  clockTimer = null;
}

function renderClocks() {
  const timed = isTimed(clock);
  humanClock.hidden = !timed;
  opponentClock.hidden = !timed;
  if (!timed) return;
  const enemy = opponent(humanColor);
  const running = clockSince === null ? null : position.turn;
  for (const [element, owner] of [[humanClock, humanColor], [opponentClock, enemy]]) {
    const spent = running === owner ? (Date.now() - clockSince) / 1000 : 0;
    const left = Math.max(0, clock[owner] - spent);
    element.textContent = formatClock(left);
    element.classList.toggle('is-low', running === owner && isLow(left));
  }
}

function requestBotMove() {
  thinking = true;
  const request = ++botRequest;
  render();
  // The worker keeps slower devices fluid even at the deeper setting.
  worker.postMessage({ position, depth: difficultyDepth(botDifficulty()), request });
}

function onBotMessage({ data }) {
  if (!thinking || data.request !== botRequest) return;
  if (data.error) {
    thinking = false;
    failure = { title: 'Bot error', detail: data.error };
    render();
    return;
  }
  if (data.action && position.turn !== humanColor) {
    commit(data.action);
    announceOpponentAction();
  }
  thinking = false;
  render();
}

function render() {
  const placingKing = position.phase !== 'play' && canHumanAct();
  const targets = placingKing ? setupDestinations(position) : destinations(position, selection);
  const result = getResult(position);
  const shown = displayedPosition();
  const last = actionHighlights(reviewPly === null ? lastAction : history[reviewPly - 1]?.action ?? null);
  board.closest('.play-area').classList.toggle('is-reviewing', reviewPly !== null);
  // Undo and Resign are about a match; while one is being set up there is
  // nothing to undo or resign, so the rail follows the board on or off screen.
  matchRail.hidden = board.closest('.play-area').hidden;
  board.classList.toggle('keyboard-active', keyboardActive);
  if (keyboardActive) board.setAttribute('aria-activedescendant', `square-${cursor}`);
  else board.removeAttribute('aria-activedescendant');
  board.querySelectorAll('.square').forEach((button, visual) => {
    const square = humanColor === WHITE ? visual : 15 - visual;
    const occupant = shown.board[square];
    button.dataset.square = String(square);
    button.dataset.name = squareName(square);
    button.classList.toggle('is-cursor', keyboardActive && visual === cursor);
    button.replaceChildren();
    if (occupant) button.append(pieceElement(occupant.owner, occupant.piece));
    button.classList.toggle('selected', selection?.type === 'board' && selection.square === square);
    button.classList.toggle('target', targets.has(square));
    button.classList.toggle('placement', placingKing && targets.has(square));
    button.classList.toggle('capture', targets.has(square) && Boolean(occupant));
    button.classList.toggle('in-check', occupant?.piece === KING && isInCheck(shown, occupant.owner));
    button.classList.toggle('last-from', square === last.from);
    button.classList.toggle('last-to', square === last.to);
    button.classList.toggle('drag-source', pointerDrag?.active && pointerDrag.sourceSquare === square);
    button.disabled = !canHumanAct();
    button.setAttribute('aria-label', occupant
      ? `${occupant.owner} ${occupant.piece}, square ${square + 1}` : `Empty square ${square + 1}`);
  });
  renderBank(opponentBank, opponent(humanColor), false, shown);
  renderBank(humanBank, humanColor, true, shown);
  const enemy = opponent(humanColor);
  opponentName.textContent = `${opponentLabel} · ${colorName(enemy)}`;
  humanName.textContent = colorName(humanColor);
  opponentBankLabel.textContent = `${colorName(enemy)} reserve · ${shown.banks[enemy].length}`;
  humanBankLabel.textContent = shown.banks[humanColor].length
    ? 'Your reserve · tap to deploy' : 'Your reserve · empty';
  humanBank.closest('.player').classList.toggle('active-player', position.turn === humanColor && !result);
  opponentBank.closest('.player').classList.toggle('active-player', position.turn !== humanColor && !result);
  renderTurnCard(result);
  renderMoves();
  renderResult();
  renderClocks();
  renderConnection();
  updateCommunicationUi();
}

function renderTurnCard(result) {
  const { title, detail, waiting } = turnCardContent(result);
  turnTitle.textContent = title;
  turnDetail.textContent = detail;
  turnDetail.hidden = !detail;
  turnCard.classList.toggle('is-waiting', waiting);
  turnCard.hidden = reviewPly !== null;
  reviewCard.hidden = reviewPly === null;
  reviewTitle.textContent = reviewPly === 0
    ? 'Reviewing · before the first move'
    : `Reviewing · move ${Math.ceil((reviewPly ?? 0) / 2)} of ${moveCount(history)}`;
  deselectButton.hidden = !selection || !canHumanAct();
}

/** One sentence, generated from the finished position, over the live board. */
function renderResult() {
  const summary = outcomeSummary({
    position, timeline, history, humanColor, resigned, agreedDraw, opponentName: opponentLabel,
  });
  if (!summary || resultDismissed || reviewPly !== null) {
    resultOverlay.hidden = true;
    return;
  }
  resultOverlay.hidden = false;
  // The overlay says how it ended, over the board. Leaving the turn card up
  // printed the same two sentences again, directly underneath it.
  turnCard.hidden = true;
  resultCard.classList.toggle('is-win', summary.tone === 'win');
  resultEyebrow.textContent = summary.eyebrow;
  resultHeadline.textContent = summary.headline;
  resultDetail.textContent = summary.detail;

  const rematch = mode === 'online' ? 'Invite for a rematch' : 'Play again';
  const lost = summary.tone !== 'win' && summary.eyebrow === 'Checkmate';
  resultPrimary.textContent = lost ? rematch.replace('Play again', 'Rematch') : rematch;
  resultPrimary.onclick = startNewGame;
  // A loss points at the turn where something else was still possible.
  resultSecondary.textContent = lost && history.length > 1 ? 'See that move' : 'Review moves';
  resultSecondary.onclick = () => {
    resultDismissed = true;
    goToPly(lost && history.length > 1 ? Math.max(0, history.length - 2) : 0);
  };
}

function renderMoves() {
  const shownPly = reviewPly ?? history.length;
  movesBody.replaceChildren(...pairMoves(history).map(({ number, white, black }) => {
    const row = document.createElement('div');
    row.className = 'moves-row';
    row.setAttribute('role', 'row');
    const label = document.createElement('span');
    label.setAttribute('role', 'cell');
    label.textContent = `${number}.`;
    row.append(label, moveCell(white, shownPly), moveCell(black, shownPly));
    return row;
  }));
  lastMoveText.textContent = shownPly === 0
    ? 'Start of the game' : `Last: ${history[shownPly - 1].sentence}`;
  moveFirst.disabled = !history.length || shownPly === 0;
  moveBack.disabled = shownPly === 0;
  moveForward.disabled = reviewPly === null;
  undoButton.disabled = disconnected || Boolean(resigned) || takebackPending ||
    !pliesToUndo(history, timeline, humanColor);
  undoButton.textContent = mode === 'online' ? 'Ask to undo' : 'Undo';
  resignButton.disabled = !history.length || Boolean(resigned) || Boolean(getResult(position));
}

function moveCell(entry, shownPly) {
  const cell = document.createElement('span');
  cell.setAttribute('role', 'cell');
  if (!entry) return cell;
  const button = document.createElement('button');
  button.className = 'move-cell';
  button.type = 'button';
  button.textContent = entry.notation;
  // The plain-language note rides along rather than crowding the three columns.
  button.title = entry.note;
  button.setAttribute('aria-label', `${entry.notation}. ${entry.note}`);
  button.classList.toggle('is-current', entry.ply === shownPly);
  button.addEventListener('click', () => goToPly(entry.ply));
  cell.append(button);
  return cell;
}

/**
 * A reserve never holds two of the same piece, so the three slots keep fixed
 * positions and a missing piece leaves a dashed gap instead of closing up.
 */
function renderBank(container, owner, interactive, shown) {
  const held = shown.banks[owner];
  container.replaceChildren(...BANK_PIECES.map((piece) => {
    if (!held.includes(piece)) {
      const slot = document.createElement('span');
      slot.className = 'bank-slot';
      slot.setAttribute('role', 'img');
      slot.setAttribute('aria-label', `Empty ${piece} slot`);
      return slot;
    }
    const button = document.createElement('button');
    button.className = 'bank-piece';
    button.type = 'button';
    button.append(pieceElement(owner, piece));
    button.setAttribute('aria-label', `${owner} ${piece} in reserve`);
    button.classList.toggle('selected', interactive && selection?.type === 'bank' && selection.piece === piece);
    button.classList.toggle('drag-source', pointerDrag?.active && pointerDrag.sourcePiece === piece);
    button.disabled = !interactive || !canHumanAct() || position.phase !== 'play' ||
      !legalActions(position).some((action) => action.type === 'drop' && action.piece === piece);
    if (interactive) {
      button.addEventListener('click', () => { if (!suppressClick) selectBank(piece); });
      button.addEventListener('pointerdown', (event) => beginBankDrag(event, piece));
    }
    return button;
  }));
}

function pieceElement(owner, piece) {
  const element = document.createElement('img');
  element.className = `piece piece-${owner} piece-${piece}`;
  element.src = `./assets/pieces/${owner === WHITE ? 'w' : 'b'}${PIECE_FILES[piece]}.svg`;
  element.alt = '';
  element.draggable = false;
  element.setAttribute('aria-hidden', 'true');
  return element;
}

/** Every playable state names both legal action types: move, or deploy. */
function turnCardContent(result) {
  if (failure) return { ...failure, waiting: true };
  if (disconnected) {
    return { title: 'Opponent left', detail: 'The board is yours. Start a new game when you are ready.', waiting: true };
  }
  if (agreedDraw) {
    return { title: 'Draw', detail: 'You and your opponent agreed to a draw.', waiting: true };
  }
  if (resigned) {
    return {
      title: resigned === humanColor ? 'You resigned' : `${opponentLabel} resigned`,
      detail: `The match ended on move ${moveCount(history)}. You can still walk back through it.`,
      waiting: true,
    };
  }
  if (result?.type === 'win') {
    return {
      title: 'Checkmate',
      detail: result.winner === humanColor ? 'You win.' : 'Your opponent wins.',
      waiting: true,
    };
  }
  if (result?.reason === 'stalemate') {
    return { title: 'Draw', detail: 'Stalemate — no legal move, and no check.', waiting: true };
  }
  if (result?.reason === 'threefold-repetition') {
    return { title: 'Draw', detail: 'The same position came up three times.', waiting: true };
  }
  if (thinking) {
    return {
      title: position.phase === 'place-black-king' ? 'Bot is placing its king' : 'Bot is thinking',
      detail: 'It is choosing from the same moves and deployments you have.',
      waiting: true,
    };
  }
  if (position.turn !== humanColor) {
    return { title: 'Opponent’s turn', detail: 'Waiting for their move.', waiting: true };
  }
  if (position.phase !== 'play') {
    return {
      title: 'Place your king',
      detail: 'Pick any marked square on your home row. White places first, then Black.',
      waiting: false,
    };
  }
  return { title: 'Your turn', detail: playDetail(), waiting: false };
}

function playDetail() {
  if (isInCheck(position, humanColor)) {
    const attacker = attackersOf(position, kingSquare(position, humanColor), opponent(humanColor))[0];
    const from = attacker === undefined ? ''
      : ` from the ${position.board[attacker].piece} on ${squareName(attacker)}`;
    return `Your king is in check${from}. Move it, capture the attacker, or deploy a piece to block.`;
  }
  if (selection?.type === 'board') {
    return `${pieceName(position.board[selection.square]?.piece)} on ${squareName(selection.square)} is selected. ` +
      'Move it to a marked square, or pick a reserve piece to deploy instead.';
  }
  if (selection?.type === 'bank') {
    return `${pieceName(selection.piece)} from your reserve is selected. ` +
      'Drop it on a marked empty square, or pick a piece on the board to move instead.';
  }
  // Nothing to say: "Your turn" over a board you can read is the whole message.
  // The standing rules belong in the rules dialog, not on every single turn.
  return '';
}
