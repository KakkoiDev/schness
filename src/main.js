import {
  BLACK, BISHOP, KING, KNIGHT, ROOK, WHITE,
  applyAction, createInitialPosition, getResult, isInCheck, legalActions, opponent,
} from './rules.js';
import { actionAt, bankSelection, boardSelection, destinations, setupActionAt, setupDestinations } from './interaction.js';
import { applyActionMessage, makeActionMessage } from './game-message.js';
import { createGameId, gameRoute, gameUrl } from './navigation.js';
import { createChatMessage, parseChatMessage } from './chat.js';
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

for (let visual = 0; visual < 16; visual += 1) {
  const button = document.createElement('button');
  button.className = 'square';
  button.type = 'button';
  button.dataset.visual = String(visual);
  button.addEventListener('click', () => onSquare(Number(button.dataset.square)));
  board.append(button);
}

alternateButton.addEventListener('click', switchMode);
resetButton.addEventListener('click', startNewGame);
copyInvite.addEventListener('click', copyInviteLink);
chatForm.addEventListener('submit', sendChatMessage);
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
    network.onOpponentLeave(() => {
      disconnected = true;
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
  render();
}

function sendChatMessage(event) {
  event.preventDefault();
  if (mode !== 'online' || disconnected || !network?.matched) return;
  try {
    const message = createChatMessage(chatMessage.value);
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

function canHumanAct() {
  return !thinking && !disconnected && position.turn === humanColor && !getResult(position);
}

function play(action) {
  const message = mode === 'online' ? makeActionMessage(position, action) : null;
  position = applyAction(position, action);
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
  if (data.action && position.turn !== humanColor) position = applyAction(position, data.action);
  thinking = false;
  render();
}

function render() {
  const placingKing = position.phase !== 'play' && canHumanAct();
  const targets = placingKing ? setupDestinations(position) : destinations(position, selection);
  const result = getResult(position);
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
    button.disabled = !canHumanAct();
    button.setAttribute('aria-label', occupant
      ? `${occupant.owner} ${occupant.piece}, square ${square + 1}` : `Empty square ${square + 1}`);
  });
  renderBank(opponentBank, opponent(humanColor), false);
  renderBank(humanBank, humanColor, true);
  humanName.textContent = humanColor === WHITE ? 'You · White' : 'You · Black';
  status.textContent = statusMessage(result);
  chatMessage.disabled = disconnected;
  chatForm.querySelector('button').disabled = disconnected;
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
    button.disabled = !interactive || !canHumanAct() || position.phase !== 'play' ||
      !legalActions(position).some((action) => action.type === 'drop' && action.piece === piece);
    if (interactive) button.addEventListener('click', () => selectBank(piece));
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
  element.className = `piece piece-${owner}`;
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
