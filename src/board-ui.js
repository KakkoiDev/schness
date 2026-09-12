import { pieceElement } from './piece-ui.js';
import { getResult, isInCheck, KING, kingSquare } from './rules.js';

const SIZE = 4;

/**
 * Build the one board DOM used by every playable and replay surface.
 * Callers own game rules; this module owns orientation, accessibility and
 * visual state so a replay cannot silently drift away from a live match.
 */
export function createBoard(element, {
  interactive = true, orientation = 'white', idPrefix = '', onSquare, onPointerDown,
} = {}) {
  element.dataset.schnessBoard = 'true';
  element.dataset.orientation = orientation;
  element.replaceChildren();
  const order = orientedSquares(orientation);
  for (let rank = 0; rank < SIZE; rank += 1) {
    const row = document.createElement('div');
    row.className = 'board-row';
    row.setAttribute('role', 'row');
    for (const square of order.slice(rank * SIZE, rank * SIZE + SIZE)) {
      const cell = document.createElement(interactive ? 'button' : 'div');
      cell.className = 'square';
      cell.dataset.visual = String(rank * SIZE + row.children.length);
      cell.dataset.index = String(square);
      cell.dataset.square = String(square);
      cell.setAttribute('role', 'gridcell');
      if (interactive) {
        cell.type = 'button';
        cell.tabIndex = -1;
        if (idPrefix) cell.id = `${idPrefix}-${square}`;
        cell.addEventListener('click', () => onSquare?.(square, cell));
        cell.addEventListener('pointerdown', (event) => onPointerDown?.(event, square, cell));
      }
      row.append(cell);
    }
    element.append(row);
  }
  return element;
}

export function setBoardOrientation(element, orientation = 'white') {
  element.dataset.orientation = orientation;
  const order = orientedSquares(orientation);
  [...element.querySelectorAll('.square')].forEach((cell, visual) => {
    cell.dataset.index = String(order[visual]);
    cell.dataset.square = String(order[visual]);
  });
}

export function renderBoard(element, position, {
  selected = null, targets = new Set(), placements = new Set(), last = null,
  dragging = null, disabled = false, checked = checkedSquares(position), cursor = null,
  mate = checked.size ? checkmateSquare(position) : null,
  label = defaultLabel,
} = {}) {
  for (const cell of element.querySelectorAll('.square')) {
    const square = Number(cell.dataset.square);
    const occupant = position.board[square];
    cell.replaceChildren(...(occupant ? [pieceElement(occupant.owner, occupant.piece)] : []));
    cell.classList.toggle('selected', selected === square);
    cell.classList.toggle('target', targets.has(square));
    cell.classList.toggle('placement', placements.has(square));
    cell.classList.toggle('capture', targets.has(square) && Boolean(occupant));
    cell.classList.toggle('in-check', checked.has(square));
    cell.classList.toggle('in-checkmate', mate === square);
    cell.classList.toggle('last-from', last?.from === square);
    cell.classList.toggle('last-to', last?.to === square);
    cell.classList.toggle('drag-source', dragging === square);
    cell.classList.toggle('is-cursor', cursor === square);
    if ('disabled' in cell) cell.disabled = Boolean(disabled);
    cell.setAttribute('aria-label', label(square, occupant,
      mate === square ? 'checkmate' : checked.has(square) ? 'check' : null));
  }
}

/** The warning follows the position on every board, including replays and puzzles. */
export function checkedSquares(position) {
  return new Set(position.board.flatMap((occupant, square) =>
    occupant?.piece === KING && isInCheck(position, occupant.owner) ? [square] : []));
}

export function checkmateSquare(position) {
  // An in-progress position editor may not have two kings or banks yet.
  if (position.phase !== 'play' || !position.banks) return null;
  return getResult(position)?.reason === 'checkmate' ? kingSquare(position, position.turn) : null;
}

export function orientedSquares(orientation = 'white') {
  const squares = Array.from({ length: SIZE * SIZE }, (_, square) => square);
  return orientation === 'black' ? squares.reverse() : squares;
}

function defaultLabel(square, occupant, warning) {
  return occupant ? `${occupant.owner} ${occupant.piece}, square ${square + 1}${warning ? `, in ${warning}` : ''}`
    : `Empty square ${square + 1}`;
}

export function actionHighlights(action) {
  if (!action || !Number.isInteger(action.to)) return { from: null, to: null };
  return { from: action.type === 'move' && Number.isInteger(action.from) ? action.from : null, to: action.to };
}
