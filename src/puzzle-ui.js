import { applyAction, BLACK, WHITE, actionKey, getResult } from './rules.js';
import { recordAction } from './history.js';
import { actionAt, actionsForSelection, bankSelection, boardSelection } from './interaction.js';
import { decodeAction } from './library.js';
import { decodePuzzlePosition } from './puzzle.js';
import { normalizePuzzleLevels, puzzlePool } from './puzzle-settings.js';
import { movedEnough } from './drag.js';
import { pieceElement, renderReserve } from './piece-ui.js';
import { createBoard, renderBoard } from './board-ui.js';
import { initTheme } from './theme.js';
import { initI18n } from './i18n.js?v=68';

initTheme();
initI18n();
const $ = (selector) => document.querySelector(selector);
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
let pointerDrag;
let suppressClick = false;
let nextTimer;

document.querySelectorAll('[name="puzzle-level"]').forEach((input) => input.addEventListener('change', changeLevels));
$('#puzzle-hide-depth').addEventListener('change', () => { savePreferences(); renderPrompt(); });
$('#puzzle-auto-next').addEventListener('change', savePreferences);
$('#puzzle-next').addEventListener('click', nextPuzzle);
$('#puzzle-reveal').addEventListener('click', reveal);
document.addEventListener('pointermove', movePointerDrag, { passive: false });
document.addEventListener('pointerup', endPointerDrag);
document.addEventListener('pointercancel', cancelPointerDrag);
loadPreferences();
load();

async function load() {
  try {
    const response = await fetch('./data/puzzles.json');
    if (!response.ok) throw new Error(`Puzzle collection unavailable (${response.status})`);
    corpus = await response.json();
    resetQueue();
  } catch (error) {
    $('#puzzle-prompt').textContent = 'Puzzles are still being generated';
    feedback('wrong', error.message);
  }
}

function resetQueue() {
  if (!corpus) return;
  const levels = selectedLevels();
  queue = shuffle(puzzlePool(corpus.puzzles, levels));
  if (!queue.length) {
    $('#puzzle-prompt').textContent = 'Choose at least one puzzle type';
    feedback('wrong', 'At least one mate depth must stay selected.');
    $('#puzzle-progress').textContent = '';
    return;
  }
  nextPuzzle();
}

function nextPuzzle() {
  clearTimeout(replyTimer);
  clearTimeout(nextTimer);
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
  renderPrompt();
  feedback('ready', 'Find the forced checkmate.');
  $('#puzzle-progress').textContent = `${queue.length + 1} puzzles left in this shuffle`;
  $('#puzzle-sources').replaceChildren(...puzzle.sources.slice(0, 30).map(([game, ply]) => textElement(`Game #${game}, after ply ${ply}`)));
  render();
}

function buildBoard() {
  createBoard($('#puzzle-board'), {
    orientation: attacker, onSquare: chooseSquare,
    onPointerDown: (event, square, button) => beginBoardDrag(event, square, button),
  });
}

function chooseSquare(square) {
  if (suppressClick) return;
  if (finished || position.turn !== attacker) return;
  const action = actionAt(position, selection, square);
  if (action) return tryAction(action);
  const occupant = position.board[square];
  selection = occupant?.owner === attacker ? boardSelection(square) : null;
  render();
}

function chooseReserve(piece) {
  if (suppressClick) return;
  if (finished || position.turn !== attacker) return;
  selection = selection?.type === 'bank' && selection.piece === piece ? null : bankSelection(piece);
  render();
}

function tryAction(action) {
  if (!chosenLine) chosenLine = puzzle.solutions.find((line) => actionKey(decodeAction(line[0])) === actionKey(action));
  const expected = chosenLine && decodeAction(chosenLine[lineIndex]);
  if (!expected || actionKey(expected) !== actionKey(action)) {
    selection = null;
    feedback('wrong', 'That does not force checkmate. Try another move.');
    $('#puzzle-board').classList.remove('puzzle-wrong');
    requestAnimationFrame(() => $('#puzzle-board').classList.add('puzzle-wrong'));
    return render();
  }
  apply(action);
  if (getResult(position)) return complete();
  feedback('correct', 'Correct. The opponent replies…');
  replyTimer = setTimeout(playReply, 550);
}

function playReply() {
  if (!chosenLine || lineIndex >= chosenLine.length) return;
  apply(decodeAction(chosenLine[lineIndex]));
  feedback('correct', $('#puzzle-hide-depth').checked ? 'The defense moved. Keep calculating.' : `The defense moved. Continue the mate in ${puzzle.mate}.`);
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
  feedback('solved', `Checkmate — mate in ${puzzle.mate} solved.${$('#puzzle-auto-next').checked ? ' Next puzzle coming…' : ''}`);
  render();
  if ($('#puzzle-auto-next').checked) nextTimer = setTimeout(nextPuzzle, 1200);
}

function reveal() {
  if (!puzzle || finished) return;
  if (!chosenLine) chosenLine = puzzle.solutions[0];
  finished = true;
  clearTimeout(replyTimer);
  const step = () => {
    if (lineIndex >= chosenLine.length || getResult(position)) {
      feedback('revealed', 'Solution shown. Try the next puzzle when ready.');
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
  renderBoard($('#puzzle-board'), position, {
    selected: selection?.type === 'board' ? selection.square : null, targets, last,
    dragging: pointerDrag?.active ? pointerDrag.selection?.square : null,
    disabled: finished || position.turn !== attacker,
  });
  const defender = attacker === WHITE ? BLACK : WHITE;
  renderSeat('top', defender, 'Defense', false);
  renderSeat('bottom', attacker, 'You', true);
  $('#puzzle-line').replaceChildren(...history.map((entry) => textElement(`${entry.ply}. ${entry.notation}`)));
}

function renderSeat(place, owner, name, interactive) {
  $(`#puzzle-${place}-player`).textContent = `${owner === WHITE ? 'White' : 'Black'} · ${name}`;
  $(`#puzzle-${place}-label`).textContent = `${owner === attacker ? 'Your' : 'Their'} reserve · ${position.banks[owner].length}`;
  renderReserve($(`#puzzle-${place}-reserve`), position.banks[owner], owner, {
    interactive,
    selected: selection?.type === 'bank' ? selection.piece : null,
    dragging: pointerDrag?.active ? pointerDrag.selection?.piece : null,
    disabled: finished || position.turn !== attacker,
    onSelect: chooseReserve,
    onPointerDown: beginBankDrag,
  });
}

function feedback(state, message) {
  const card = $('#puzzle-feedback');
  card.dataset.state = state;
  $('#puzzle-feedback-icon').textContent = { ready: '●', correct: '✓', solved: '✓', wrong: '×', revealed: '→' }[state];
  $('#puzzle-status').textContent = message;
}

function renderPrompt() {
  if (!puzzle) return;
  $('#puzzle-prompt').textContent = `${attacker === WHITE ? 'White' : 'Black'} to move · ${$('#puzzle-hide-depth').checked ? 'find the fastest mate' : `mate in ${puzzle.mate}`}`;
}

function selectedLevels() {
  return [...document.querySelectorAll('[name="puzzle-level"]:checked')].map((input) => Number(input.value));
}

function changeLevels(event) {
  if (!selectedLevels().length) {
    event.currentTarget.checked = true;
    feedback('wrong', 'Keep at least one mate depth selected.');
    return;
  }
  savePreferences();
  resetQueue();
}

function loadPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem('schness-puzzle-settings'));
    if (Array.isArray(saved?.levels) && saved.levels.length) {
      const levels = normalizePuzzleLevels(saved.levels);
      document.querySelectorAll('[name="puzzle-level"]').forEach((input) => { input.checked = levels.includes(Number(input.value)); });
    }
    $('#puzzle-hide-depth').checked = saved?.hideDepth === true;
    $('#puzzle-auto-next').checked = saved?.autoNext === true;
  } catch { /* Invalid local preferences fall back to the visible defaults. */ }
}

function savePreferences() {
  try {
    localStorage.setItem('schness-puzzle-settings', JSON.stringify({
      levels: selectedLevels(), hideDepth: $('#puzzle-hide-depth').checked, autoNext: $('#puzzle-auto-next').checked,
    }));
  } catch { /* The puzzle remains fully usable when storage is unavailable. */ }
}

function beginBoardDrag(event, square, button) {
  const occupant = position.board[square];
  if (!event.isPrimary || finished || position.turn !== attacker || occupant?.owner !== attacker) return;
  pointerDrag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
    pieceRect: button.querySelector('.piece')?.getBoundingClientRect(), selection: boardSelection(square),
    owner: attacker, piece: occupant.piece };
}

function beginBankDrag(event, piece, button) {
  if (!event.isPrimary || finished || position.turn !== attacker) return;
  pointerDrag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
    pieceRect: button.querySelector('.piece')?.getBoundingClientRect(), selection: bankSelection(piece),
    owner: attacker, piece };
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
  if (action) tryAction(action);
  else { selection = null; render(); }
}

function cancelPointerDrag() {
  pointerDrag?.ghost?.remove();
  pointerDrag = null;
  selection = null;
  render();
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
