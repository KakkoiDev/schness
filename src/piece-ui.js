import { BANK_PIECES, WHITE } from './rules.js';

const FILE = { king: 'K', rook: 'R', bishop: 'B', knight: 'N' };

export function pieceElement(owner, piece, alt = '') {
  const image = document.createElement('img');
  image.className = `piece piece-${owner} piece-${piece}`;
  image.src = `./assets/pieces/${owner === WHITE ? 'w' : 'b'}${FILE[piece]}.svg`;
  image.alt = alt;
  image.draggable = false;
  if (!alt) image.setAttribute('aria-hidden', 'true');
  return image;
}

/** The same stable rook/bishop/knight tray used by a live match. */
export function renderReserve(element, held, owner, {
  interactive = false, selected = null, dragging = null, disabled = false, onSelect, onPointerDown,
} = {}) {
  element.replaceChildren(...BANK_PIECES.map((piece) => {
    if (!held.includes(piece)) {
      const slot = document.createElement('span');
      slot.className = 'bank-slot';
      slot.setAttribute('role', 'img');
      slot.setAttribute('aria-label', `Empty ${piece} slot`);
      return slot;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bank-piece';
    button.dataset.piece = piece;
    button.dataset.owner = owner;
    button.append(pieceElement(owner, piece));
    button.setAttribute('aria-label', `${owner} ${piece} in reserve`);
    button.classList.toggle('selected', interactive && selected === piece);
    button.classList.toggle('drag-source', dragging === piece);
    button.disabled = disabled || !interactive;
    if (interactive) {
      button.addEventListener('click', () => onSelect?.(piece));
      button.addEventListener('pointerdown', (event) => onPointerDown?.(event, piece, button));
    }
    return button;
  }));
}
