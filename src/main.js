import {
  BLACK, BISHOP, KING, KNIGHT, ROOK, WHITE,
  applyAction, createInitialPosition, getResult, isInCheck, legalActions, opponent,
} from './rules.js';
import { actionAt, bankSelection, boardSelection, destinations, setupActionAt, setupDestinations } from './interaction.js';
import { applyActionMessage, makeActionMessage } from './game-message.js';
import { createGameId, gameRoute, gameUrl } from './navigation.js';
import { createChatMessage, parseChatMessage } from './chat.js';
import {
  communicationPacket, parseCommunicationPacket,
} from './communication.js';
import { initSettings } from './settings.js';
import { actionHighlights } from './board-ui.js';
import { movedEnough } from './drag.js';
import { initTheme } from './theme.js';

initTheme();

const SYMBOLS = {
  [WHITE]: { [KING]: '♚', [ROOK]: '♜', [BISHOP]: '♝', [KNIGHT]: '♞' },
  [BLACK]: { [KING]: '♚', [ROOK]: '♜', [BISHOP]: '♝', [KNIGHT]: '♞' },
};
const board = document.querySelector('#board');
const humanBank = document.querySelector('#human-bank');
const opponentBank = document.querySelector('#opponent-bank');
const humanName = document.querySelector('#human-name');
const opponentName = document.querySelector('#opponent-name');
const status = document.querySelector('#status');
const networkNote = document.querySelector('#network-note');
const invite = document.querySelector('#invite');
const inviteUrl = document.querySelector('#invite-url');
const copyInvite = document.querySelector('#copy-invite');
const alternateButton = document.querySelector('#alternate-mode');
const alternateTitle = document.querySelector('#alternate-mode-title');
const alternateNote = document.querySelector('#alternate-mode-note');
const resetButton = document.querySelector('#reset');
const rulesDialog = document.querySelector('#rules-dialog');
const matchChat = document.querySelector('#match-chat');
const chatLog = document.querySelector('#chat-log');
const chatForm = document.querySelector('#chat-form');
const chatMessage = document.querySelector('#chat-message');
const chatNote = document.querySelector('#chat-note');
const quickChat = document.querySelector('#quick-chat');
const voiceStatus = document.querySelector('#voice-status');
const voiceToggle = document.querySelector('#voice-toggle');
const hearOpponent = document.querySelector('#hear-opponent');
const peerAudio = document.querySelector('#peer-audio');
const route = gameRoute(window.location.search);
const communicationSettings = initSettings(onCommunicationSettingsChange);

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
let peerCommunication = null;
let microphoneStream = null;
let microphoneStarting = false;
let lastAction = null;
let pointerDrag = null;
let suppressClick = false;

for (let visual = 0; visual < 16; visual += 1) {
  const button = document.createElement('button');
  button.className = 'square';
  button.type = 'button';
  button.dataset.visual = String(visual);
  button.addEventListener('click', () => {
    if (!suppressClick) onSquare(Number(button.dataset.square));
  });
  button.addEventListener('pointerdown', (event) => beginBoardDrag(event, button));
  board.append(button);
}

window.addEventListener('pointermove', movePointerDrag, { passive: false });
window.addEventListener('pointerup', endPointerDrag);
window.addEventListener('pointercancel', cancelPointerDrag);

alternateButton.addEventListener('click', switchMode);
resetButton.addEventListener('click', startNewGame);
copyInvite.addEventListener('click', copyInviteLink);
chatForm.addEventListener('submit', sendChatMessage);
quickChat.addEventListener('click', (event) => {
  const text = event.target.closest('[data-quick-message]')?.dataset.quickMessage;
  if (text) sendChatText(text);
});
voiceToggle.addEventListener('click', toggleMicrophone);
hearOpponent.addEventListener('click', () => {
  peerAudio.play().then(() => {
    hearOpponent.hidden = true;
    voiceStatus.textContent = 'Voice connected.';
  }).catch(() => { voiceStatus.textContent = 'Your browser is still blocking incoming audio.'; });
});
document.querySelectorAll('[data-open-rules]').forEach((button) =>
  button.addEventListener('click', () => rulesDialog.showModal()));
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
if (route?.mode === 'bot') startBotMatch();
else if (route?.mode === 'online') startOnlineSearch(route.gameId);
else window.location.replace('./');

function startBotGame() {
  window.location.assign(gameUrl(window.location.href, 'bot'));
}

function startBotMatch() {
  stopNetwork();
  resetState('bot', WHITE);
  opponentName.textContent = 'Bot';
  showAlternative('online');
  showMatch();
}

async function startOnlineSearch(gameId) {
  if (!navigator.onLine) return;
  stopNetwork();
  resetState('online', WHITE);
  board.closest('.play-area').hidden = true;
  networkNote.hidden = false;
  networkNote.textContent = 'Waiting for the other player…';
  invite.hidden = false;
  inviteUrl.value = window.location.href;
  alternateButton.hidden = true;
  searchTimer = setTimeout(() => showAlternative('bot'), 5000);
  try {
    const { joinMatchmaking } = await import('./net.js');
    if (mode !== 'online') return;
    network = joinMatchmaking(gameId);
    network.onMatch(({ color }) => beginOnlineMatch(color));
    network.onGame(receivePeerAction);
    network.onChat(receiveChatMessage);
    network.onPreferences(receiveCommunicationPreferences);
    network.onPeerStream(receivePeerStream);
    network.onOpponentLeave(() => {
      disconnected = true;
      stopMicrophone();
      render();
    });
    network.onError((message) => { networkNote.textContent = message; });
  } catch (error) {
    networkNote.textContent = `Could not start online play: ${error.message}`;
    showAlternative('bot');
  }
}

function beginOnlineMatch(color) {
  clearTimeout(searchTimer);
  humanColor = color;
  position = createInitialPosition();
  selection = null;
  disconnected = false;
  opponentName.textContent = 'Online player';
  networkNote.hidden = true;
  invite.hidden = true;
  alternateButton.hidden = true;
  board.closest('.play-area').hidden = false;
  matchChat.hidden = false;
  network.sendPreferences(communicationPacket(communicationSettings));
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
  if (!communicationSettings.text || !peerCommunication?.text) return;
  try {
    const message = parseChatMessage(payload);
    appendChatMessage(message.text, 'Opponent');
  } catch {
    // Ignore malformed peer messages without interrupting the match.
  }
}

function receiveCommunicationPreferences(payload) {
  try {
    peerCommunication = parseCommunicationPacket(payload);
    if (!peerCommunication.voice) stopMicrophone();
    updateCommunicationUi();
    startVoiceIfReady();
  } catch {
    // Ignore malformed capability announcements.
  }
}

function onCommunicationSettingsChange() {
  if (mode === 'online' && network?.matched) {
    network.sendPreferences(communicationPacket(communicationSettings));
  }
  if (!communicationSettings.voice) stopMicrophone();
  updateCommunicationUi();
  startVoiceIfReady();
}

function canTextChat() {
  return mode === 'online' && !disconnected && network?.matched && communicationSettings.text && peerCommunication?.text;
}

function updateCommunicationUi() {
  const anyLocalCommunication = communicationSettings.text || communicationSettings.voice;
  matchChat.hidden = mode !== 'online' || !anyLocalCommunication;
  chatLog.hidden = !communicationSettings.text;
  quickChat.hidden = !communicationSettings.text;
  chatForm.hidden = !communicationSettings.text;
  const textReady = canTextChat();
  chatMessage.disabled = !textReady;
  chatForm.querySelector('button').disabled = !textReady;
  quickChat.querySelectorAll('button').forEach((button) => { button.disabled = !textReady; });
  chatMessage.placeholder = peerCommunication && !peerCommunication.text
    ? 'Opponent has text chat off' : 'Message your opponent…';
  chatNote.textContent = communicationSettings.text && communicationSettings.voice
    ? 'Text and voice · peer-to-peer · not saved' : communicationSettings.voice
      ? 'Voice · peer-to-peer · not saved' : 'Text · peer-to-peer · not saved';
  voiceStatus.hidden = !communicationSettings.voice;
  if (communicationSettings.voice && !peerCommunication) voiceStatus.textContent = 'Waiting for voice preference…';
  else if (communicationSettings.voice && !peerCommunication.voice) voiceStatus.textContent = 'Opponent has voice chat off.';
}

async function startVoiceIfReady() {
  if (!communicationSettings.voice || !peerCommunication?.voice || microphoneStream || microphoneStarting || disconnected) return;
  microphoneStarting = true;
  voiceStatus.textContent = 'Requesting microphone access…';
  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    if (disconnected || mode !== 'online') return stopMicrophone();
    network.addStream(microphoneStream);
    voiceStatus.textContent = 'Voice connected.';
    voiceToggle.hidden = false;
    setMicrophoneState(true);
  } catch (error) {
    voiceStatus.textContent = error.name === 'NotAllowedError'
      ? 'Microphone permission was not granted.' : 'Could not start the microphone.';
  } finally {
    microphoneStarting = false;
  }
}

function receivePeerStream(stream) {
  if (!communicationSettings.voice || !peerCommunication?.voice) return;
  peerAudio.srcObject = stream;
  peerAudio.play().then(() => { hearOpponent.hidden = true; }).catch(() => {
    hearOpponent.hidden = false;
    voiceStatus.textContent = 'Tap “Hear opponent” to start incoming audio.';
  });
}

function toggleMicrophone() {
  const track = microphoneStream?.getAudioTracks()[0];
  if (!track) return;
  track.enabled = !track.enabled;
  setMicrophoneState(track.enabled);
  voiceStatus.textContent = track.enabled ? 'Voice connected.' : 'Your microphone is muted.';
}

function setMicrophoneState(enabled) {
  voiceToggle.textContent = enabled ? 'Mic on' : 'Mic muted';
  voiceToggle.classList.toggle('mic-on', enabled);
  voiceToggle.classList.toggle('mic-muted', !enabled);
  voiceToggle.setAttribute('aria-pressed', String(enabled));
  voiceToggle.setAttribute('aria-label', enabled ? 'Microphone is on; click to mute' : 'Microphone is muted; click to unmute');
}

function stopMicrophone() {
  if (!microphoneStream) return;
  network?.removeStream(microphoneStream);
  microphoneStream.getTracks().forEach((track) => track.stop());
  microphoneStream = null;
  peerAudio.srcObject = null;
  voiceToggle.hidden = true;
  hearOpponent.hidden = true;
}

function appendChatMessage(text, author) {
  chatLog.querySelector('.chat-empty')?.remove();
  const row = document.createElement('p');
  row.className = `chat-message ${author === 'You' ? 'chat-own' : 'chat-peer'}`;
  const name = document.createElement('strong');
  name.textContent = author;
  const body = document.createElement('span');
  body.textContent = text;
  row.append(name, body);
  chatLog.append(row);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function receivePeerAction(message) {
  if (mode !== 'online' || disconnected || position.turn === humanColor) return;
  try {
    position = applyActionMessage(position, message);
    lastAction = message.action;
    selection = null;
    render();
  } catch (error) {
    disconnected = true;
    status.textContent = `Game stopped: ${error.message}`;
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
  peerCommunication = null;
  lastAction = null;
  stopMicrophone();
  worker.terminate();
  worker = createWorker();
  networkNote.hidden = true;
  invite.hidden = true;
  matchChat.hidden = true;
  chatLog.replaceChildren(Object.assign(document.createElement('p'), { className: 'chat-empty', textContent: 'No messages yet.' }));
  chatMessage.value = '';
  board.closest('.play-area').hidden = false;
}

function startNewGame() {
  window.location.assign(gameUrl(window.location.href, mode ?? 'bot', createGameId()));
}

function switchMode() {
  const nextMode = mode === 'bot' ? 'online' : 'bot';
  window.location.assign(gameUrl(window.location.href, nextMode, createGameId()));
}

function showAlternative(targetMode) {
  alternateButton.hidden = false;
  alternateButton.dataset.mode = targetMode;
  alternateTitle.textContent = targetMode === 'online' ? 'Play a real player instead' : 'Play the bot instead';
  alternateNote.textContent = targetMode === 'online' ? 'Create a private invitation link' : 'Start immediately';
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
  networkNote.hidden = true;
  render();
}

function stopNetwork() {
  clearTimeout(searchTimer);
  searchTimer = null;
  stopMicrophone();
  network?.leave();
  network = null;
}

function createWorker() {
  const next = new Worker('./src/bot-worker.js', { type: 'module' });
  next.addEventListener('message', onBotMessage);
  next.addEventListener('error', () => {
    thinking = false;
    status.textContent = 'The bot hit an error. Start a new game to try again.';
  });
  return next;
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
    selection: boardSelection(square), sourceSquare: square, owner: occupant.owner, piece: occupant.piece };
}

function beginBankDrag(event, piece) {
  if (!event.isPrimary || !canHumanAct() || position.phase !== 'play') return;
  pointerDrag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
    selection: bankSelection(piece), sourcePiece: piece, owner: humanColor, piece };
}

function movePointerDrag(event) {
  if (!pointerDrag || event.pointerId !== pointerDrag.pointerId) return;
  if (!pointerDrag.active && movedEnough(pointerDrag, event)) {
    pointerDrag.active = true;
    selection = pointerDrag.selection;
    pointerDrag.ghost = pieceElement(pointerDrag.owner, pointerDrag.piece);
    pointerDrag.ghost.classList.add('drag-ghost');
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
  return !thinking && !disconnected && position.turn === humanColor && !getResult(position);
}

function play(action) {
  const message = mode === 'online' ? makeActionMessage(position, action) : null;
  position = applyAction(position, action);
  lastAction = action;
  selection = null;
  if (message) network.sendGame(message);
  render();
  if (mode === 'bot' && !getResult(position) && position.turn !== humanColor) requestBotMove();
}

function requestBotMove() {
  thinking = true;
  const request = ++botRequest;
  render();
  // Depth three stays responsive on phones; the worker keeps even slower devices fluid.
  worker.postMessage({ position, depth: 3, request });
}

function onBotMessage({ data }) {
  if (!thinking || data.request !== botRequest) return;
  if (data.error) {
    thinking = false;
    status.textContent = `Bot error: ${data.error}`;
    return;
  }
  if (data.action && position.turn !== humanColor) {
    position = applyAction(position, data.action);
    lastAction = data.action;
  }
  thinking = false;
  render();
}

function render() {
  const placingKing = position.phase !== 'play' && canHumanAct();
  const targets = placingKing ? setupDestinations(position) : destinations(position, selection);
  const result = getResult(position);
  const last = actionHighlights(lastAction);
  board.querySelectorAll('.square').forEach((button, visual) => {
    const square = humanColor === WHITE ? visual : 15 - visual;
    const occupant = position.board[square];
    button.dataset.square = String(square);
    button.replaceChildren();
    if (occupant) button.append(pieceElement(occupant.owner, occupant.piece));
    button.classList.toggle('selected', selection?.type === 'board' && selection.square === square);
    button.classList.toggle('target', targets.has(square));
    button.classList.toggle('placement', placingKing && targets.has(square));
    button.classList.toggle('capture', targets.has(square) && Boolean(occupant));
    button.classList.toggle('in-check', occupant?.piece === KING && isInCheck(position, occupant.owner));
    button.classList.toggle('last-from', square === last.from);
    button.classList.toggle('last-to', square === last.to);
    button.classList.toggle('drag-source', pointerDrag?.active && pointerDrag.sourceSquare === square);
    button.disabled = !canHumanAct();
    button.setAttribute('aria-label', occupant
      ? `${occupant.owner} ${occupant.piece}, square ${square + 1}` : `Empty square ${square + 1}`);
  });
  renderBank(opponentBank, opponent(humanColor), false);
  renderBank(humanBank, humanColor, true);
  humanName.textContent = humanColor === WHITE ? 'You · White' : 'You · Black';
  humanBank.closest('.player').classList.toggle('active-player', position.turn === humanColor && !result);
  opponentBank.closest('.player').classList.toggle('active-player', position.turn !== humanColor && !result);
  status.textContent = statusMessage(result);
  updateCommunicationUi();
}

function renderBank(container, owner, interactive) {
  container.replaceChildren();
  const pieces = position.banks[owner];
  for (const piece of pieces) {
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
    container.append(button);
  }
  if (!pieces.length) {
    const empty = document.createElement('span');
    empty.className = 'bank-empty';
    empty.textContent = 'No pieces in reserve';
    container.append(empty);
  }
}

function pieceElement(owner, piece) {
  const element = document.createElement('span');
  element.className = `piece piece-${owner} piece-${piece}`;
  element.textContent = SYMBOLS[owner][piece];
  element.setAttribute('aria-hidden', 'true');
  return element;
}

function statusMessage(result) {
  if (disconnected) return 'Opponent left the game.';
  if (result?.type === 'win') return result.winner === humanColor ? 'Checkmate — you win.' : 'Checkmate — opponent wins.';
  if (result?.reason === 'stalemate') return 'Draw by stalemate.';
  if (result?.reason === 'threefold-repetition') return 'Draw by threefold repetition.';
  if (thinking) return position.phase === 'place-black-king' ? 'Bot is placing its king…' : 'Bot is thinking…';
  if (position.turn !== humanColor) return 'Opponent’s turn.';
  if (position.phase !== 'play') return 'Place your king on your home row.';
  if (isInCheck(position, humanColor)) return 'Your king is in check — move, capture, or deploy a reserve piece to block.';
  return selection?.type === 'bank' ? `Place your ${selection.piece}.` : 'Your turn — move or deploy a piece.';
}
