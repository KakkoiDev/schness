import {
  BLACK, BISHOP, KING, KNIGHT, ROOK, WHITE,
  applyAction, createInitialPosition, getResult, isInCheck, legalActions, opponent,
} from './rules.js';
import { actionAt, bankSelection, boardSelection, destinations, setupActionAt } from './interaction.js';
import { applyActionMessage, makeActionMessage } from './game-message.js';

const SYMBOLS = {
  [WHITE]: { [KING]: '♔', [ROOK]: '♖', [BISHOP]: '♗', [KNIGHT]: '♘' },
  [BLACK]: { [KING]: '♚', [ROOK]: '♜', [BISHOP]: '♝', [KNIGHT]: '♞' },
};
const menu = document.querySelector('#menu');
const match = document.querySelector('#match');
const board = document.querySelector('#board');
const humanBank = document.querySelector('#human-bank');
const opponentBank = document.querySelector('#opponent-bank');
const humanName = document.querySelector('#human-name');
const opponentName = document.querySelector('#opponent-name');
const status = document.querySelector('#status');
const networkNote = document.querySelector('#network-note');
const botButton = document.querySelector('#play-bot');
const onlineButton = document.querySelector('#play-online');
const fallbackButton = document.querySelector('#fallback-bot');
const resetButton = document.querySelector('#reset');
const menuButton = document.querySelector('#back-to-menu');

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

botButton.addEventListener('click', startBotGame);
onlineButton.addEventListener('click', startOnlineSearch);
fallbackButton.addEventListener('click', startBotGame);
resetButton.addEventListener('click', () => mode === 'bot' ? startBotGame() : startOnlineSearch());
menuButton.addEventListener('click', showMenu);
window.addEventListener('online', updateOnlineAvailability);
window.addEventListener('offline', updateOnlineAvailability);
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
showMenu();

function startBotGame() {
  stopNetwork();
  resetState('bot', WHITE);
  opponentName.textContent = 'Bot';
  showMatch();
}

async function startOnlineSearch() {
  if (!navigator.onLine) return;
  stopNetwork();
  resetState('online', WHITE);
  menu.hidden = true;
  match.hidden = false;
  board.closest('.play-area').hidden = true;
  networkNote.hidden = false;
  networkNote.textContent = 'Looking for another player…';
  fallbackButton.hidden = true;
  searchTimer = setTimeout(() => { fallbackButton.hidden = false; }, 5000);
  try {
    const { joinMatchmaking } = await import('./net.js');
    if (mode !== 'online') return;
    network = joinMatchmaking();
    network.onMatch(({ color }) => beginOnlineMatch(color));
    network.onGame(receivePeerAction);
    network.onOpponentLeave(() => {
      disconnected = true;
      render();
    });
    network.onError((message) => { networkNote.textContent = message; });
  } catch (error) {
    networkNote.textContent = `Could not start online play: ${error.message}`;
    fallbackButton.hidden = false;
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
  fallbackButton.hidden = true;
  board.closest('.play-area').hidden = false;
  render();
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
  board.closest('.play-area').hidden = false;
}

function showMenu() {
  stopNetwork();
  mode = null;
  menu.hidden = false;
  match.hidden = true;
  updateOnlineAvailability();
}

function showMatch() {
  menu.hidden = true;
  match.hidden = false;
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

function updateOnlineAvailability() {
  onlineButton.disabled = !navigator.onLine;
  onlineButton.querySelector('small').textContent = navigator.onLine
    ? 'Find another browser peer to peer' : 'Unavailable while offline';
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
  const targets = destinations(position, selection);
  const result = getResult(position);
  board.querySelectorAll('.square').forEach((button, visual) => {
    const square = humanColor === WHITE ? visual : 15 - visual;
    const occupant = position.board[square];
    button.dataset.square = String(square);
    button.textContent = occupant ? SYMBOLS[occupant.owner][occupant.piece] : '';
    button.classList.toggle('selected', selection?.type === 'board' && selection.square === square);
    button.classList.toggle('target', targets.has(square));
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
}

function renderBank(container, owner, interactive) {
  container.replaceChildren();
  const pieces = position.banks[owner];
  for (const piece of pieces) {
    const button = document.createElement('button');
    button.className = 'bank-piece';
    button.type = 'button';
    button.textContent = SYMBOLS[owner][piece];
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

function statusMessage(result) {
  if (disconnected) return 'Opponent left the game.';
  if (result?.type === 'win') return result.winner === humanColor ? 'Checkmate — you win.' : 'Checkmate — opponent wins.';
  if (result?.reason === 'stalemate') return 'Draw by stalemate.';
  if (result?.reason === 'threefold-repetition') return 'Draw by threefold repetition.';
  if (thinking) return position.phase === 'place-black-king' ? 'Bot is placing its king…' : 'Bot is thinking…';
  if (position.turn !== humanColor) return 'Opponent’s turn.';
  if (position.phase !== 'play') return 'Place your king on your home row.';
  if (isInCheck(position, humanColor)) return 'Your king is in check.';
  return selection?.type === 'bank' ? `Place your ${selection.piece}.` : 'Your turn — move or deploy a piece.';
}
