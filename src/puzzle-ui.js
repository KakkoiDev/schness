import { applyAction, BLACK, WHITE, actionKey, getResult } from './rules.js';
import { recordAction } from './history.js';
import { actionAt, actionsForSelection, bankSelection, boardSelection } from './interaction.js';
import { decodeAction } from './library.js';
import { decodePuzzlePosition } from './puzzle.js';
import { initTheme } from './theme.js';

initTheme();
const $ = (selector) => document.querySelector(selector);
const PIECE_CODE = { king: 'K', rook: 'R', bishop: 'B', knight: 'N' };
let corpus;
let queue = [];
let puzzle;
let position;
let attacker;
let selection;
let chosenLine;
let lineIndex = 0;
let history = [];
let finished = false;
let replyTimer;

$('#puzzle-level').addEventListener('change', resetQueue);
$('#puzzle-next').addEventListener('click', nextPuzzle);
$('#puzzle-reveal').addEventListener('click', reveal);
load();

async function load() {
  try {
    const response = await fetch('./data/puzzles.json');
    if (!response.ok) throw new Error(`Puzzle collection unavailable (${response.status})`);
    corpus = await response.json();
    resetQueue();
  } catch (error) {
    $('#puzzle-prompt').textContent = 'Puzzles are still being generated';
    $('#puzzle-status').textContent = error.message;
  }
}

function resetQueue() {
  if (!corpus) return;
  const level = $('#puzzle-level').value;
  queue = shuffle(corpus.puzzles.filter((item) => level === 'all' || item.mate === Number(level)));
  if (!queue.length) {
    $('#puzzle-prompt').textContent = `No mate-in-${level} puzzles were found`;
    $('#puzzle-status').textContent = 'Choose another difficulty.';
    $('#puzzle-progress').textContent = '';
    return;
  }
  nextPuzzle();
}

function nextPuzzle() {
  clearTimeout(replyTimer);
  if (!queue.length) return resetQueue();
  puzzle = queue.pop();
  position = decodePuzzlePosition(puzzle.position);
  attacker = position.turn;
  selection = null;
  chosenLine = null;
  lineIndex = 0;
  history = [];
  finished = false;
  buildBoard();
  $('#puzzle-prompt').textContent = `${attacker === WHITE ? 'White' : 'Black'} to move · mate in ${puzzle.mate}`;
  $('#puzzle-status').textContent = 'Find the forced checkmate.';
  $('#puzzle-progress').textContent = `${queue.length + 1} puzzles left in this shuffle`;
  $('#puzzle-sources').replaceChildren(...puzzle.sources.slice(0, 30).map(([game, ply]) => textElement(`Game #${game}, after ply ${ply}`)));
  render();
}

function buildBoard() {
  const indices = Array.from({ length: 16 }, (_, index) => attacker === BLACK ? 15 - index : index);
  const board = $('#puzzle-board');
  board.replaceChildren();
  for (let rowIndex = 0; rowIndex < 4; rowIndex += 1) {
    const row = document.createElement('div');
    row.className = 'board-row';
    row.setAttribute('role', 'row');
    for (const index of indices.slice(rowIndex * 4, rowIndex * 4 + 4)) {
      const square = document.createElement('button');
      square.type = 'button';
      square.className = 'square';
      square.dataset.index = index;
      square.setAttribute('role', 'gridcell');
      square.addEventListener('click', () => chooseSquare(index));
      row.append(square);
    }
    board.append(row);
  }
}

function chooseSquare(square) {
  if (finished || position.turn !== attacker) return;
  const action = actionAt(position, selection, square);
  if (action) return tryAction(action);
  const occupant = position.board[square];
  selection = occupant?.owner === attacker ? boardSelection(square) : null;
  render();
}

function chooseReserve(piece) {
  if (finished || position.turn !== attacker) return;
  selection = selection?.type === 'bank' && selection.piece === piece ? null : bankSelection(piece);
  render();
}

function tryAction(action) {
  if (!chosenLine) chosenLine = puzzle.solutions.find((line) => actionKey(decodeAction(line[0])) === actionKey(action));
  const expected = chosenLine && decodeAction(chosenLine[lineIndex]);
  if (!expected || actionKey(expected) !== actionKey(action)) {
    selection = null;
    $('#puzzle-status').textContent = 'That does not force checkmate. Try another move.';
    $('#puzzle-board').classList.remove('puzzle-wrong');
    requestAnimationFrame(() => $('#puzzle-board').classList.add('puzzle-wrong'));
    return render();
  }
  apply(action);
  if (getResult(position)) return complete();
  $('#puzzle-status').textContent = 'Correct. The opponent replies…';
  replyTimer = setTimeout(playReply, 550);
}

function playReply() {
  if (!chosenLine || lineIndex >= chosenLine.length) return;
  apply(decodeAction(chosenLine[lineIndex]));
  $('#puzzle-status').textContent = `Continue the mate in ${puzzle.mate}.`;
}

function apply(action) {
  const before = position;
  position = applyAction(position, action);
  history = recordAction(history, before, action, position);
  lineIndex += 1;
  selection = null;
  render();
}

function complete() {
  finished = true;
  $('#puzzle-status').textContent = 'Checkmate. Solved.';
  render();
}

function reveal() {
  if (!puzzle || finished) return;
  if (!chosenLine) chosenLine = puzzle.solutions[0];
  finished = true;
  clearTimeout(replyTimer);
  const step = () => {
    if (lineIndex >= chosenLine.length || getResult(position)) {
      $('#puzzle-status').textContent = 'Solution shown.';
      return;
    }
    apply(decodeAction(chosenLine[lineIndex]));
    replyTimer = setTimeout(step, 450);
  };
  step();
}

function render() {
  const legal = selection ? actionsForSelection(position, selection) : [];
  const targets = new Set(legal.map((action) => action.to));
  const last = history.at(-1)?.action;
  for (const square of $('#puzzle-board').querySelectorAll('.square')) {
    const index = Number(square.dataset.index);
    const occupant = position.board[index];
    square.replaceChildren(...(occupant ? [pieceElement(occupant.owner, occupant.piece)] : []));
    square.classList.toggle('selected', selection?.type === 'board' && selection.square === index);
    square.classList.toggle('target', targets.has(index));
    square.classList.toggle('capture', targets.has(index) && Boolean(occupant));
    square.classList.toggle('last-from', last?.from === index);
    square.classList.toggle('last-to', last?.to === index);
    square.disabled = finished || position.turn !== attacker;
  }
  $('#puzzle-player').textContent = `${attacker === WHITE ? 'White' : 'Black'} · You`;
  $('#puzzle-opponent').textContent = `${attacker === WHITE ? 'Black' : 'White'} · Defense`;
  $('#puzzle-reserve').replaceChildren(...position.banks[attacker].map((piece) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'watch-bank-piece';
    button.append(pieceElement(attacker, piece));
    button.disabled = finished || position.turn !== attacker;
    button.classList.toggle('selected', selection?.type === 'bank' && selection.piece === piece);
    button.addEventListener('click', () => chooseReserve(piece));
    return button;
  }));
  $('#puzzle-line').replaceChildren(...history.map((entry) => textElement(`${entry.ply}. ${entry.notation}`)));
}

function pieceElement(owner, piece) {
  const image = document.createElement('img');
  image.className = `piece piece-${owner}`;
  image.src = `./assets/pieces/${owner === WHITE ? 'w' : 'b'}${PIECE_CODE[piece]}.svg`;
  image.alt = `${owner} ${piece}`;
  return image;
}

function textElement(text) {
  const item = document.createElement('p');
  item.textContent = text;
  return item;
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const random = crypto.getRandomValues(new Uint32Array(1))[0] % (index + 1);
    [result[index], result[random]] = [result[random], result[index]];
  }
  return result;
}
