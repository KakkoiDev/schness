import {
  BLACK, WHITE, applyAction, createInitialPosition, createPosition, getResult, legalActions, occupantOf,
} from './rules.js';
import { actionAt, actionsForSelection, bankSelection, boardSelection, setupActionAt, setupDestinations } from './interaction.js';
import { movedEnough } from './drag.js';
import { pieceElement, renderReserve } from './piece-ui.js';

const LESSONS = {
  kings: { title: 'Place the kings', instruction: 'Put your king on any highlighted home-row square. Black will place theirs, then the game continues.' },
  deploy: { title: 'Move or deploy', instruction: 'Move your king, or pick a reserve piece and deploy it. A deployment may not immediately check Black.' },
  capture: { title: 'Nothing is lost', instruction: 'Capture the black knight with your rook. Watch it return to Black’s reserve, ready to come back.' },
};

export function initTutorial() {
  const root = document.querySelector('#rules-demo');
  if (!root) return;
  const $ = (selector) => root.querySelector(selector);
  const worker = new Worker('./src/bot-worker.js', { type: 'module' });
  let lesson = 'kings';
  let position = lessonPosition(lesson);
  let selection = null;
  let thinking = false;
  let request = 0;
  let drag;
  let suppressClick = false;

  buildBoard();
  document.querySelectorAll('.rule-demo-trigger').forEach((button) => button.addEventListener('click', () => open(button.dataset.lesson)));
  document.querySelector('#replay-tutorial')?.addEventListener('click', (event) => {
    event.currentTarget.closest('dialog')?.close();
    open('kings');
  });
  $('#demo-close').addEventListener('click', () => { root.hidden = true; cancel(); });
  $('#demo-restart').addEventListener('click', () => open(lesson, false));
  worker.addEventListener('message', ({ data }) => {
    if (data.request !== request) return;
    thinking = false;
    if (data.action) position = applyAction(position, data.action);
    setFeedback(getResult(position) ? 'solved' : 'ready', getResult(position) ? resultText() : 'The machine moved. Your turn.');
    render();
  });
  document.addEventListener('pointermove', moveDrag, { passive: false });
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', cancelDrag);
  if (!tutorialSeen()) setTimeout(() => open('kings'), 0);

  function open(next, scroll = true) {
    cancel();
    lesson = next;
    position = lessonPosition(lesson);
    selection = null;
    root.hidden = false;
    rememberTutorial();
    $('#demo-title').textContent = LESSONS[lesson].title;
    $('#demo-instruction').textContent = LESSONS[lesson].instruction;
    setFeedback('ready', lesson === 'kings' ? 'Place your king on the highlighted row.' : 'Your turn — tap or drag a piece.');
    render();
    if (scroll) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cancel() {
    request += 1;
    thinking = false;
    cancelDrag();
  }

  function buildBoard() {
    for (let row = 0; row < 4; row += 1) {
      const line = document.createElement('div');
      line.className = 'board-row';
      for (let column = 0; column < 4; column += 1) {
        const square = row * 4 + column;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'square';
        button.dataset.square = square;
        button.addEventListener('click', () => { if (!suppressClick) chooseSquare(square); });
        button.addEventListener('pointerdown', (event) => beginBoardDrag(event, square, button));
        line.append(button);
      }
      $('#demo-board').append(line);
    }
  }

  function chooseSquare(square) {
    if (!canAct()) return;
    const action = position.phase === 'play' ? actionAt(position, selection, square) : setupActionAt(position, square);
    if (action) return play(action);
    const occupant = position.board[square];
    selection = occupant?.owner === WHITE ? boardSelection(square) : null;
    render();
  }

  function chooseReserve(piece) {
    if (!canAct() || position.phase !== 'play') return;
    selection = selection?.type === 'bank' && selection.piece === piece ? null : bankSelection(piece);
    render();
  }

  function play(action) {
    position = applyAction(position, action);
    selection = null;
    render();
    if (getResult(position)) return setFeedback('solved', resultText());
    thinking = true;
    request += 1;
    setFeedback('correct', lesson === 'capture' && action.type === 'move' && action.to === 5
      ? 'Captured — the knight is back in Black’s reserve. The machine is replying…'
      : 'Legal move. The machine is replying…');
    render();
    worker.postMessage({ position, depth: 2, repetitionAversion: true, request });
  }

  function canAct() { return !thinking && position.turn === WHITE && !getResult(position); }

  function render() {
    const legal = selection ? actionsForSelection(position, selection) : [];
    const targets = new Set(legal.map((action) => action.to));
    const placements = position.phase === 'play' ? new Set() : setupDestinations(position);
    for (const square of $('#demo-board').querySelectorAll('.square')) {
      const index = Number(square.dataset.square);
      const occupant = position.board[index];
      square.replaceChildren(...(occupant ? [pieceElement(occupant.owner, occupant.piece)] : []));
      square.classList.toggle('selected', selection?.type === 'board' && selection.square === index);
      square.classList.toggle('target', targets.has(index));
      square.classList.toggle('capture', targets.has(index) && Boolean(occupant));
      square.classList.toggle('placement', canAct() && placements.has(index));
      square.classList.toggle('drag-source', drag?.active && drag.selection?.square === index);
      square.disabled = !canAct();
    }
    renderReserve($('#demo-white-reserve'), position.banks[WHITE], WHITE, {
      interactive: true, selected: selection?.type === 'bank' ? selection.piece : null,
      dragging: drag?.active ? drag.selection?.piece : null,
      disabled: !canAct() || position.phase !== 'play', onSelect: chooseReserve, onPointerDown: beginBankDrag,
    });
    renderReserve($('#demo-black-reserve'), position.banks[BLACK], BLACK);
    $('#demo-white-label').textContent = `Your reserve · ${position.banks[WHITE].length}`;
    $('#demo-black-label').textContent = `Black reserve · ${position.banks[BLACK].length}`;
  }

  function setFeedback(state, message) {
    const box = $('#demo-feedback');
    box.dataset.state = state;
    box.querySelector('span').textContent = state === 'solved' || state === 'correct' ? '✓' : '●';
    box.querySelector('p').textContent = message;
  }

  function resultText() {
    const result = getResult(position);
    return result?.type === 'win' ? `${result.winner === WHITE ? 'You win' : 'Black wins'} by checkmate.` : 'The demo ended in a draw.';
  }

  function beginBoardDrag(event, square, button) {
    const occupant = position.board[square];
    if (!event.isPrimary || !canAct() || occupant?.owner !== WHITE || position.phase !== 'play') return;
    drag = dragStart(event, boardSelection(square), WHITE, occupant.piece, button);
  }

  function beginBankDrag(event, piece, button) {
    if (!event.isPrimary || !canAct() || position.phase !== 'play') return;
    drag = dragStart(event, bankSelection(piece), WHITE, piece, button);
  }

  function dragStart(event, chosen, owner, piece, element) {
    return { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      selection: chosen, owner, piece, pieceRect: element.querySelector('.piece')?.getBoundingClientRect() };
  }

  function moveDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.active && movedEnough(drag, event)) {
      drag.active = true;
      selection = drag.selection;
      drag.ghost = pieceElement(drag.owner, drag.piece);
      drag.ghost.classList.add('drag-ghost');
      if (drag.pieceRect) Object.assign(drag.ghost.style, { width: `${drag.pieceRect.width}px`, height: `${drag.pieceRect.height}px` });
      document.body.append(drag.ghost);
      render();
    }
    if (!drag.active) return;
    event.preventDefault();
    Object.assign(drag.ghost.style, { left: `${event.clientX}px`, top: `${event.clientY}px` });
  }

  function endDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const ended = drag;
    drag = null;
    ended.ghost?.remove();
    if (!ended.active) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('#demo-board .square');
    const action = target ? actionAt(position, ended.selection, Number(target.dataset.square)) : null;
    event.preventDefault();
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    if (action) play(action); else { selection = null; render(); }
  }

  function cancelDrag() { drag?.ghost?.remove(); drag = null; }
}

function tutorialSeen() {
  try { return localStorage.getItem('schness-tutorial-seen') === '1'; } catch { return false; }
}

function rememberTutorial() {
  try { localStorage.setItem('schness-tutorial-seen', '1'); } catch { /* Private storage must not block learning. */ }
}

export function lessonPosition(lesson) {
  if (lesson === 'kings') return createInitialPosition();
  const board = Array(16).fill(null);
  board[1] = occupantOf(BLACK, 'king');
  board[13] = occupantOf(WHITE, 'king');
  if (lesson === 'capture') {
    board[5] = occupantOf(BLACK, 'knight');
    board[9] = occupantOf(WHITE, 'rook');
  }
  return createPosition({ board, banks: {
    [WHITE]: lesson === 'capture' ? ['bishop', 'knight'] : ['rook', 'bishop', 'knight'],
    [BLACK]: lesson === 'capture' ? ['rook', 'bishop'] : ['rook', 'bishop', 'knight'],
  }, turn: WHITE, phase: 'play' });
}
