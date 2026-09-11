import {
  BANK_PIECES, BLACK, KING, WHITE, applyAction, createInitialPosition, getResult,
} from './rules.js';
import { recordAction } from './history.js';
import { actionAt, actionsForSelection, bankSelection, boardSelection, setupActionAt, setupDestinations } from './interaction.js';
import { buildEditedPosition, controllerSearch, putEditorPiece } from './arena.js';
import { movedEnough } from './drag.js';
import { pieceElement, renderReserve as renderPieceReserve } from './piece-ui.js';
import { createBoard, renderBoard } from './board-ui.js';
import { initTheme } from './theme.js';
import { initI18n } from './i18n.js?v=63';
import { resultLabel, sideName } from './watch.js';

initTheme();
initI18n();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));

const $ = (selector) => document.querySelector(selector);
const board = $('#watch-board');
const status = $('#watch-status');
const moves = $('#watch-moves');
const worker = new Worker('./src/bot-worker.js', { type: 'module' });
let timeline = [createInitialPosition()];
let history = [];
let reviewIndex = 0;
let selection = null;
let request = 0;
let thinking = false;
let aisPaused = false;
let nextMoveTimer;
let editorBoard = [];
let editorPiece = { owner: WHITE, piece: KING };
let pointerDrag = null;
let suppressClick = false;

const imported = loadImportedPosition();
if (imported) timeline = [imported];

buildBoard(board, false);
buildBoard($('#position-board'), true);
buildEditorTools();
bindControls();
render();

function loadImportedPosition() {
  if (new URLSearchParams(location.search).get('position') !== 'library') return null;
  try {
    const saved = JSON.parse(sessionStorage.getItem('schness-arena-position'));
    sessionStorage.removeItem('schness-arena-position');
    return buildEditedPosition(saved.board, saved.turn);
  } catch {
    return null;
  }
}

function bindControls() {
  $('#watch-previous').addEventListener('click', () => review(-1));
  $('#watch-next').addEventListener('click', () => review(1));
  $('#watch-live').addEventListener('click', goLive);
  $('#watch-branch').addEventListener('click', branchHere);
  $('#watch-auto').addEventListener('click', () => {
    aisPaused = !aisPaused;
    cancelSearch();
    render();
    scheduleBot();
  });
  $('#watch-restart').addEventListener('click', restart);
  $('#watch-edit').addEventListener('click', openEditor);
  $('#position-close').addEventListener('click', () => $('#position-dialog').close());
  $('#position-clear').addEventListener('click', () => { editorBoard = Array(16).fill(null); renderEditor(); });
  $('#position-apply').addEventListener('click', applyEditor);
  for (const select of [$('#white-level'), $('#black-level')]) {
    select.addEventListener('change', () => {
      cancelSearch();
      selection = null;
      goLive(false);
      render();
      scheduleBot();
    });
  }
  worker.addEventListener('message', receiveBotMove);
  document.addEventListener('pointermove', movePointerDrag, { passive: false });
  document.addEventListener('pointerup', endPointerDrag);
  document.addEventListener('pointercancel', cancelPointerDrag);
}

function controller(side) {
  return $(side === WHITE ? '#white-level' : '#black-level').value;
}

function current() {
  return timeline[reviewIndex];
}

function live() {
  return timeline.at(-1);
}

function cancelSearch() {
  request += 1;
  thinking = false;
  clearTimeout(nextMoveTimer);
}

function receiveBotMove({ data }) {
  if (data.request !== request) return;
  thinking = false;
  if (data.error) {
    status.textContent = `AI error: ${data.error}`;
    aisPaused = true;
    return render();
  }
  if (!data.action || aisPaused || reviewIndex !== history.length || controller(live().turn) === 'human') return render();
  playAction(data.action, true);
}

function scheduleBot() {
  clearTimeout(nextMoveTimer);
  const position = live();
  const search = controllerSearch(controller(position.turn));
  if (aisPaused || thinking || reviewIndex !== history.length || getResult(position) || !search) return render();
  thinking = true;
  request += 1;
  render();
  worker.postMessage({ position, ...search, request });
}

function playAction(action, botMoved = false) {
  const before = live();
  const after = applyAction(before, action);
  history = recordAction(history, before, action, after);
  timeline.push(after);
  reviewIndex = history.length;
  selection = null;
  render();
  if (!getResult(after)) {
    if (botMoved) nextMoveTimer = setTimeout(scheduleBot, 700);
    else scheduleBot();
  }
}

function chooseSquare(square) {
  if (suppressClick) return;
  const position = current();
  if (reviewIndex !== history.length || getResult(position) || controller(position.turn) !== 'human') return;
  if (position.phase !== 'play') {
    const action = setupActionAt(position, square);
    if (action) playAction(action);
    return;
  }
  const action = actionAt(position, selection, square);
  if (action) return playAction(action);
  const occupant = position.board[square];
  selection = occupant?.owner === position.turn ? boardSelection(square) : null;
  render();
}

function chooseReserve(piece) {
  if (suppressClick) return;
  const position = current();
  if (reviewIndex !== history.length || getResult(position) || controller(position.turn) !== 'human' || position.phase !== 'play') return;
  selection = selection?.type === 'bank' && selection.piece === piece ? null : bankSelection(piece);
  render();
}

function review(direction) {
  aisPaused = true;
  cancelSearch();
  reviewIndex = Math.max(0, Math.min(history.length, reviewIndex + direction));
  selection = null;
  render();
}

function goLive(resume = true) {
  reviewIndex = history.length;
  selection = null;
  if (resume) aisPaused = false;
  render();
  scheduleBot();
}

function branchHere() {
  if (reviewIndex === history.length) return;
  history = history.slice(0, reviewIndex);
  timeline = timeline.slice(0, reviewIndex + 1);
  aisPaused = false;
  selection = null;
  render();
  scheduleBot();
}

function restart() {
  cancelSearch();
  timeline = [createInitialPosition()];
  history = [];
  reviewIndex = 0;
  selection = null;
  aisPaused = false;
  render();
  scheduleBot();
}

function buildBoard(element, editor) {
  createBoard(element, {
    onSquare: (square) => editor ? editSquare(square) : chooseSquare(square),
    onPointerDown: editor ? undefined : (event, square, button) => beginBoardDrag(event, square, button),
  });
}

function render() {
  const position = current();
  const humanTurn = reviewIndex === history.length && controller(position.turn) === 'human';
  const legal = selection ? actionsForSelection(position, selection) : [];
  const placements = position.phase === 'play' ? new Set() : setupDestinations(position);
  const targets = position.phase === 'play' ? new Set(legal.map((action) => action.to)) : new Set(placements);
  const last = history[reviewIndex - 1]?.action;
  renderBoard(board, position, {
    last, selected: selection?.type === 'board' ? selection.square : null, targets,
    placements: humanTurn ? placements : new Set(),
    dragging: pointerDrag?.active ? pointerDrag.selection?.square : null, disabled: !humanTurn,
  });
  renderReserve('#white-reserve', position.banks[WHITE], WHITE);
  renderReserve('#black-reserve', position.banks[BLACK], BLACK);
  renderMoves();
  const result = getResult(position);
  if (reviewIndex < history.length) status.textContent = `Reviewing ply ${reviewIndex} of ${history.length}`;
  else if (result) status.textContent = resultLabel(result);
  else if (thinking) status.textContent = `${sideName(position.turn)} ${controller(position.turn)} is thinking…`;
  else if (aisPaused && controller(position.turn) !== 'human') status.textContent = `Paused before ${sideName(position.turn)} moves`;
  else if (position.phase !== 'play') status.textContent = `${sideName(position.turn)}: place your king on the home row`;
  else status.textContent = `${sideName(position.turn)} to move · ${controller(position.turn) === 'human' ? 'Your seat' : controller(position.turn)}`;
  renderControls();
}

function renderReserve(selector, pieces, owner) {
  const element = $(selector);
  const interactive = reviewIndex === history.length && current().turn === owner && controller(owner) === 'human';
  renderPieceReserve(element, pieces, owner, {
    interactive,
    selected: selection?.type === 'bank' && current().turn === owner ? selection.piece : null,
    dragging: pointerDrag?.active ? pointerDrag.selection?.piece : null,
    disabled: !interactive,
    onSelect: chooseReserve,
    onPointerDown: beginBankDrag,
  });
}

function beginBoardDrag(event, square, button) {
  const position = current();
  const occupant = position.board[square];
  if (!event.isPrimary || reviewIndex !== history.length || controller(position.turn) !== 'human' ||
      position.phase !== 'play' || occupant?.owner !== position.turn || getResult(position)) return;
  pointerDrag = dragStart(event, boardSelection(square), occupant.owner, occupant.piece, button);
}

function beginBankDrag(event, piece, button) {
  const position = current();
  if (!event.isPrimary || reviewIndex !== history.length || controller(position.turn) !== 'human' ||
      position.phase !== 'play' || getResult(position)) return;
  pointerDrag = dragStart(event, bankSelection(piece), position.turn, piece, button);
}

function dragStart(event, chosen, owner, piece, element) {
  return { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
    selection: chosen, owner, piece, pieceRect: element.querySelector('.piece')?.getBoundingClientRect() };
}

function movePointerDrag(event) {
  if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
  if (!pointerDrag.active && movedEnough(pointerDrag, event)) {
    pointerDrag.active = true;
    selection = pointerDrag.selection;
    pointerDrag.ghost = pieceElement(pointerDrag.owner, pointerDrag.piece);
    pointerDrag.ghost.classList.add('drag-ghost');
    if (pointerDrag.pieceRect) Object.assign(pointerDrag.ghost.style, {
      width: `${pointerDrag.pieceRect.width}px`, height: `${pointerDrag.pieceRect.height}px`,
    });
    document.body.append(pointerDrag.ghost);
    render();
  }
  if (!pointerDrag.active) return;
  event.preventDefault();
  Object.assign(pointerDrag.ghost.style, { left: `${event.clientX}px`, top: `${event.clientY}px` });
}

function endPointerDrag(event) {
  if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
  const ended = pointerDrag;
  pointerDrag = null;
  ended.ghost?.remove();
  if (!ended.active) return;
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('#watch-board .square');
  const action = target ? actionAt(current(), ended.selection, Number(target.dataset.square)) : null;
  event.preventDefault();
  suppressClick = true;
  setTimeout(() => { suppressClick = false; }, 0);
  if (action) playAction(action); else { selection = null; render(); }
}

function cancelPointerDrag() {
  pointerDrag?.ghost?.remove();
  pointerDrag = null;
  selection = null;
  render();
}

function renderMoves() {
  moves.replaceChildren(...history.map((entry, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = index + 1 === reviewIndex ? 'current' : '';
    button.textContent = `${entry.ply}. ${entry.notation}`;
    button.addEventListener('click', () => {
      aisPaused = true;
      cancelSearch();
      reviewIndex = index + 1;
      selection = null;
      render();
    });
    return button;
  }));
  const currentMove = moves.querySelector('.current');
  if (currentMove) {
    const top = currentMove.offsetTop;
    const bottom = top + currentMove.offsetHeight;
    if (top < moves.scrollTop) moves.scrollTop = top;
    else if (bottom > moves.scrollTop + moves.clientHeight) moves.scrollTop = bottom - moves.clientHeight;
  }
}

function renderControls() {
  $('#watch-previous').disabled = reviewIndex === 0;
  $('#watch-next').disabled = reviewIndex === history.length;
  $('#watch-live').disabled = reviewIndex === history.length;
  $('#watch-branch').disabled = reviewIndex === history.length;
  $('#watch-auto').textContent = aisPaused ? 'Resume AIs' : 'Pause AIs';
  $('#watch-auto').setAttribute('aria-pressed', String(aisPaused));
}

function buildEditorTools() {
  const tools = $('#position-tools');
  for (const owner of [WHITE, BLACK]) {
    for (const piece of [KING, ...BANK_PIECES]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.owner = owner;
      button.dataset.piece = piece;
      button.append(pieceElement(owner, piece));
      button.setAttribute('aria-label', `${owner} ${piece}`);
      button.addEventListener('click', () => { editorPiece = { owner, piece }; renderEditor(); });
      tools.append(button);
    }
  }
  tools.querySelector('[data-piece="erase"]').addEventListener('click', () => { editorPiece = null; renderEditor(); });
}

function openEditor() {
  aisPaused = true;
  cancelSearch();
  editorBoard = current().board.map((occupant) => occupant ? { ...occupant } : null);
  $('#position-turn').value = current().turn;
  $('#position-error').textContent = '';
  render();
  renderEditor();
  $('#position-dialog').showModal();
}

function editSquare(square) {
  editorBoard = putEditorPiece(editorBoard, square, editorPiece);
  $('#position-error').textContent = '';
  renderEditor();
}

function renderEditor() {
  renderBoard($('#position-board'), { board: editorBoard });
  for (const button of $('#position-tools').querySelectorAll('button')) {
    const selected = editorPiece === null ? button.dataset.piece === 'erase'
      : button.dataset.owner === editorPiece.owner && button.dataset.piece === editorPiece.piece;
    button.classList.toggle('selected', selected);
  }
}

function applyEditor() {
  try {
    const position = buildEditedPosition(editorBoard, $('#position-turn').value);
    timeline = [position];
    history = [];
    reviewIndex = 0;
    selection = null;
    aisPaused = false;
    $('#position-dialog').close();
    render();
    scheduleBot();
  } catch (error) {
    $('#position-error').textContent = error.message;
  }
}
