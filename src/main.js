import {
  BLACK, BISHOP, KING, KNIGHT, ROOK, WHITE,
  applyAction, createInitialPosition, getResult, isInCheck, legalActions, opponent,
} from './rules.js';
import { actionAt, bankSelection, boardSelection, destinations, setupActionAt, setupDestinations } from './interaction.js';
import { applyActionMessage, makeActionMessage } from './game-message.js';
import { createGameId, gameRoute, gameUrl } from './navigation.js';
import { createChatMessage, parseChatMessage } from './chat.js';
import { actionHighlights } from './board-ui.js';
import { movedEnough } from './drag.js';
import { initTheme } from './theme.js';

initTheme();

const PIECE_FILES = { [KING]: 'K', [ROOK]: 'R', [BISHOP]: 'B', [KNIGHT]: 'N' };
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
let chatEnabled = true;
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

resetButton.addEventListener('click', startNewGame);
copyInvite.addEventListener('click', copyInviteLink);
chatForm.addEventListener('submit', sendChatMessage);
chatToggle.addEventListener('click', toggleChat);
quickChat.addEventListener('click', (event) => {
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
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
if (route?.mode === 'bot') startBotMatch();
else if (route?.mode === 'online') startOnlineSearch(route.gameId);
else window.location.replace('./');

function startBotMatch() {
  stopNetwork();
  resetState('bot', WHITE);
  opponentName.textContent = 'Bot';
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
  try {
    const { joinMatchmaking } = await import('./net.js');
    if (mode !== 'online') return;
    network = joinMatchmaking(gameId);
    network.onMatch(({ color }) => beginOnlineMatch(color));
    network.onGame(receivePeerAction);
    network.onChat(receiveChatMessage);
    network.onPeerStream(receivePeerStream);
    network.onOpponentLeave(() => {
      disconnected = true;
      stopMicrophone();
      stopCamera();
      render();
    });
    network.onError((message) => { networkNote.textContent = message; });
  } catch (error) {
    networkNote.textContent = `Could not start online play: ${error.message}`;
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
  chatToggle.textContent = chatEnabled ? 'Hide chat' : 'Show chat';
  chatToggle.setAttribute('aria-expanded', String(chatEnabled));
  const textReady = canTextChat();
  chatMessage.disabled = !textReady;
  chatForm.querySelector('button').disabled = !textReady;
  quickChat.querySelectorAll('button').forEach((button) => { button.disabled = !textReady; });
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
  chatEnabled = true;
  lastAction = null;
  stopMicrophone();
  stopCamera();
  worker.terminate();
  worker = createWorker();
  networkNote.hidden = true;
  invite.hidden = true;
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
  networkNote.hidden = true;
  render();
}

function stopNetwork() {
  clearTimeout(searchTimer);
  searchTimer = null;
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
  const element = document.createElement('img');
  element.className = `piece piece-${owner} piece-${piece}`;
  element.src = `./assets/pieces/${owner === WHITE ? 'w' : 'b'}${PIECE_FILES[piece]}.svg`;
  element.alt = '';
  element.draggable = false;
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
