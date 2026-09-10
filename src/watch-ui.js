import { BLACK, WHITE, createInitialPosition, getResult } from './rules.js';
import { initTheme } from './theme.js';
import { advanceReview, applySpectatorAction, bufferNeeded, levelDepth, resultLabel, sideName } from './watch.js';

initTheme();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}

const PIECE_CODE = { king: 'K', rook: 'R', bishop: 'B', knight: 'N' };
const board = document.querySelector('#watch-board');
const status = document.querySelector('#watch-status');
const previousButton = document.querySelector('#watch-previous');
const nextButton = document.querySelector('#watch-next');
const autoButton = document.querySelector('#watch-auto');
const restartButton = document.querySelector('#watch-restart');
const whiteLevel = document.querySelector('#white-level');
const blackLevel = document.querySelector('#black-level');
const moves = document.querySelector('#watch-moves');
const worker = new Worker('./src/bot-worker.js', { type: 'module' });
let timeline = [createInitialPosition()];
let history = [];
let reviewIndex = 0;
let request = 0;
let thinking = false;
let autoplay = false;
let timer = null;
let pendingAdvance = false;
let started = false;
const BUFFER_AHEAD = 10;

for (let row = 0; row < 4; row += 1) {
  const rowElement = document.createElement('div');
  rowElement.className = 'board-row';
  rowElement.setAttribute('role', 'row');
  for (let column = 0; column < 4; column += 1) {
    const square = document.createElement('div');
    square.className = 'square';
    square.setAttribute('role', 'gridcell');
    square.dataset.index = String(row * 4 + column);
    rowElement.append(square);
  }
  board.append(rowElement);
}

previousButton.addEventListener('click', () => {
  pause();
  reviewIndex = advanceReview(reviewIndex, history.length, -1);
  render();
});
nextButton.addEventListener('click', advance);
autoButton.addEventListener('click', () => {
  autoplay = !autoplay;
  autoButton.textContent = autoplay ? 'Pause' : 'Auto · 1s';
  autoButton.setAttribute('aria-pressed', String(autoplay));
  if (autoplay) advance();
  else clearTimeout(timer);
});
restartButton.addEventListener('click', restart);
whiteLevel.addEventListener('change', restart);
blackLevel.addEventListener('change', restart);

worker.addEventListener('message', ({ data }) => {
  if (data.request !== request) return;
  thinking = false;
  if (data.error) {
    status.textContent = `AI error: ${data.error}`;
    autoplay = false;
    renderControls();
    return;
  }
  if (!data.action) return render();
  const current = timeline.at(-1);
  const applied = applySpectatorAction(current, history, data.action);
  history = applied.history;
  timeline.push(applied.position);
  render();
  if (pendingAdvance) {
    pendingAdvance = false;
    showNextPosition();
  }
  fillBuffer();
});

function advance() {
  if (reviewIndex < history.length) {
    showNextPosition();
    return;
  }
  if (getResult(timeline.at(-1))) return pause();
  pendingAdvance = true;
  started = true;
  fillBuffer();
}

function showNextPosition() {
  reviewIndex += 1;
  render();
  fillBuffer();
  if (autoplay && (reviewIndex < history.length || !getResult(timeline.at(-1)))) {
    clearTimeout(timer);
    timer = setTimeout(advance, 1000);
  }
}

function fillBuffer() {
  const position = timeline.at(-1);
  if (!started || thinking || !bufferNeeded(reviewIndex, history.length, Boolean(getResult(position)), BUFFER_AHEAD)) return;
  thinking = true;
  request += 1;
  render();
  const level = position.turn === WHITE ? whiteLevel.value : blackLevel.value;
  worker.postMessage({ position, depth: levelDepth(level), request });
}

function restart() {
  pause();
  request += 1;
  thinking = false;
  timeline = [createInitialPosition()];
  history = [];
  reviewIndex = 0;
  pendingAdvance = false;
  started = false;
  render();
}

function pause() {
  autoplay = false;
  clearTimeout(timer);
  autoButton.textContent = 'Auto · 1s';
  autoButton.setAttribute('aria-pressed', 'false');
}

function render() {
  const position = timeline[reviewIndex];
  const last = history[reviewIndex - 1]?.action;
  const result = getResult(position);
  for (const square of board.querySelectorAll('.square')) {
    const index = Number(square.dataset.index);
    square.replaceChildren();
    square.classList.toggle('last-from', last?.from === index);
    square.classList.toggle('last-to', last?.to === index);
    const occupant = position.board[index];
    if (!occupant) continue;
    const image = document.createElement('img');
    image.className = `piece piece-${occupant.owner}`;
    image.src = `./assets/pieces/${occupant.owner === WHITE ? 'w' : 'b'}${PIECE_CODE[occupant.piece]}.svg`;
    image.alt = `${occupant.owner} ${occupant.piece}`;
    square.append(image);
  }
  renderReserve('#white-reserve', position.banks[WHITE], WHITE);
  renderReserve('#black-reserve', position.banks[BLACK], BLACK);
  moves.replaceChildren(...history.map((entry, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = index + 1 === reviewIndex ? 'current' : '';
    item.textContent = `${entry.ply}. ${entry.notation}`;
    item.addEventListener('click', () => { pause(); reviewIndex = index + 1; render(); });
    return item;
  }));
  const ready = history.length - reviewIndex;
  if (reviewIndex < history.length) status.textContent = `Move ${reviewIndex} · ${ready} ready ahead`;
  else if (result) status.textContent = resultLabel(result);
  else if (thinking) status.textContent = `${sideName(position.turn)} is thinking…`;
  else status.textContent = `${sideName(position.turn)} to move`;
  renderControls();
}

function renderReserve(selector, pieces, owner) {
  const element = document.querySelector(selector);
  element.replaceChildren(...pieces.map((piece) => {
    const image = document.createElement('img');
    image.className = `piece piece-${owner}`;
    image.src = `./assets/pieces/${owner === WHITE ? 'w' : 'b'}${PIECE_CODE[piece]}.svg`;
    image.alt = `${owner} ${piece} in reserve`;
    return image;
  }));
}

function renderControls() {
  previousButton.disabled = reviewIndex === 0;
  nextButton.disabled = pendingAdvance || Boolean(getResult(timeline.at(-1)) && reviewIndex === history.length);
  whiteLevel.disabled = history.length > 0 || thinking;
  blackLevel.disabled = history.length > 0 || thinking;
}

render();
