export const BOARD_SIZE = 4;
export const WHITE = 'white';
export const BLACK = 'black';
export const KING = 'king';
export const ROOK = 'rook';
export const BISHOP = 'bishop';
export const KNIGHT = 'knight';
export const BANK_PIECES = Object.freeze([ROOK, BISHOP, KNIGHT]);

const PLAYERS = new Set([WHITE, BLACK]);
const PIECES = new Set([KING, ...BANK_PIECES]);
const ORTHOGONAL = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIAGONAL = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const KNIGHT_STEPS = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1],
];

export function opponent(player) {
  return player === WHITE ? BLACK : WHITE;
}

export function createInitialPosition() {
  return {
    board: Array(BOARD_SIZE * BOARD_SIZE).fill(null),
    banks: {
      [WHITE]: [...BANK_PIECES],
      [BLACK]: [...BANK_PIECES],
    },
    turn: WHITE,
    phase: 'place-white-king',
    repetitions: {},
  };
}

/** Create a checked position for tests, saved games, and network snapshots. */
export function createPosition({ board, banks, turn = WHITE, phase = 'play', repetitions = {} }) {
  const position = {
    board: board.map((occupant) => occupant ? { ...occupant } : null),
    banks: {
      [WHITE]: [...banks[WHITE]],
      [BLACK]: [...banks[BLACK]],
    },
    turn,
    phase,
    repetitions: { ...repetitions },
  };
  validatePosition(position);
  return position;
}

export function legalActions(position) {
  validatePosition(position);

  if (position.phase === 'place-white-king') {
    return homeRank(WHITE)
      .filter((to) => !position.board[to])
      .map((to) => ({ type: 'place-king', to }));
  }
  if (position.phase === 'place-black-king') {
    return homeRank(BLACK)
      .filter((to) => !position.board[to])
      .map((to) => ({ type: 'place-king', to }));
  }

  const player = position.turn;
  const enemy = opponent(player);
  const candidates = [];

  for (let from = 0; from < position.board.length; from += 1) {
    const occupant = position.board[from];
    if (!occupant || occupant.owner !== player) continue;
    for (const to of pseudoMoves(position, from, occupant.piece, player)) {
      if (position.board[to]?.piece === KING) continue;
      candidates.push({ type: 'move', from, to });
    }
  }

  for (const piece of position.banks[player]) {
    for (let to = 0; to < position.board.length; to += 1) {
      if (!position.board[to]) candidates.push({ type: 'drop', piece, to });
    }
  }

  return candidates.filter((action) => {
    const next = applyUnchecked(position, action, false);
    if (isInCheck(next, player)) return false;
    // A drop can defend our king, but it may never give check itself.
    if (action.type === 'drop' && isInCheck(next, enemy)) return false;
    return true;
  });
}

export function applyAction(position, action) {
  const legal = legalActions(position);
  const wanted = actionKey(action);
  if (!legal.some((candidate) => actionKey(candidate) === wanted)) {
    throw new Error(`Illegal action: ${wanted}`);
  }
  return applyUnchecked(position, action, true);
}

export function isSquareAttacked(position, square, byPlayer) {
  assertSquare(square);
  for (let from = 0; from < position.board.length; from += 1) {
    const occupant = position.board[from];
    if (!occupant || occupant.owner !== byPlayer) continue;
    if (attackSquares(position, from, occupant.piece).includes(square)) return true;
  }
  return false;
}

export function isInCheck(position, player) {
  const king = position.board.findIndex(
    (occupant) => occupant?.owner === player && occupant.piece === KING,
  );
  return king !== -1 && isSquareAttacked(position, king, opponent(player));
}

export function positionKey(position) {
  const board = position.board.map((occupant) => {
    if (!occupant) return '--';
    return `${occupant.owner[0]}${occupant.piece[0]}`;
  }).join('');
  const whiteBank = [...position.banks[WHITE]].sort().map((piece) => piece[0]).join('');
  const blackBank = [...position.banks[BLACK]].sort().map((piece) => piece[0]).join('');
  return `${position.phase}|${position.turn}|${board}|${whiteBank}|${blackBank}`;
}

export function getResult(position) {
  if (position.phase !== 'play') return null;
  const key = positionKey(position);
  if ((position.repetitions[key] ?? 0) >= 3) {
    return { type: 'draw', reason: 'threefold-repetition' };
  }

  if (legalActions(position).length > 0) return null;
  if (isInCheck(position, position.turn)) {
    return { type: 'win', winner: opponent(position.turn), reason: 'checkmate' };
  }
  return { type: 'draw', reason: 'stalemate' };
}

export function actionKey(action) {
  if (!action || typeof action !== 'object') return 'invalid';
  if (action.type === 'place-king') return `place-king:${action.to}`;
  if (action.type === 'move') return `move:${action.from}:${action.to}`;
  if (action.type === 'drop') return `drop:${action.piece}:${action.to}`;
  return 'invalid';
}

function applyUnchecked(position, action, countRepetition) {
  const next = clonePosition(position);
  const player = position.turn;

  if (action.type === 'place-king') {
    next.board[action.to] = { owner: player, piece: KING };
    if (position.phase === 'place-white-king') {
      next.phase = 'place-black-king';
      next.turn = BLACK;
    } else {
      next.phase = 'play';
      next.turn = WHITE;
    }
  } else if (action.type === 'move') {
    const moving = next.board[action.from];
    const captured = next.board[action.to];
    next.board[action.to] = moving;
    next.board[action.from] = null;
    if (captured) next.banks[captured.owner].push(captured.piece);
    next.turn = opponent(player);
  } else if (action.type === 'drop') {
    const bankIndex = next.banks[player].indexOf(action.piece);
    next.banks[player].splice(bankIndex, 1);
    next.board[action.to] = { owner: player, piece: action.piece };
    next.turn = opponent(player);
  }

  if (countRepetition && next.phase === 'play') {
    const key = positionKey(next);
    next.repetitions[key] = (next.repetitions[key] ?? 0) + 1;
  }
  return next;
}

function pseudoMoves(position, from, piece, owner) {
  return attackSquares(position, from, piece).filter((to) => {
    const occupant = position.board[to];
    return !occupant || occupant.owner !== owner;
  });
}

function attackSquares(position, from, piece) {
  const [row, column] = coordinates(from);
  if (piece === KNIGHT) {
    return KNIGHT_STEPS
      .map(([dr, dc]) => squareAt(row + dr, column + dc))
      .filter((square) => square !== null);
  }
  if (piece === KING) {
    return [...ORTHOGONAL, ...DIAGONAL]
      .map(([dr, dc]) => squareAt(row + dr, column + dc))
      .filter((square) => square !== null);
  }
  if (piece === ROOK) return raySquares(position, row, column, ORTHOGONAL);
  if (piece === BISHOP) return raySquares(position, row, column, DIAGONAL);
  return [];
}

function raySquares(position, row, column, directions) {
  const squares = [];
  for (const [dr, dc] of directions) {
    for (let distance = 1; distance < BOARD_SIZE; distance += 1) {
      const square = squareAt(row + dr * distance, column + dc * distance);
      if (square === null) break;
      squares.push(square);
      if (position.board[square]) break;
    }
  }
  return squares;
}

function homeRank(player) {
  const row = player === WHITE ? BOARD_SIZE - 1 : 0;
  return Array.from({ length: BOARD_SIZE }, (_, column) => row * BOARD_SIZE + column);
}

function squareAt(row, column) {
  if (row < 0 || row >= BOARD_SIZE || column < 0 || column >= BOARD_SIZE) return null;
  return row * BOARD_SIZE + column;
}

function coordinates(square) {
  return [Math.floor(square / BOARD_SIZE), square % BOARD_SIZE];
}

function clonePosition(position) {
  return {
    board: position.board.map((occupant) => occupant ? { ...occupant } : null),
    banks: {
      [WHITE]: [...position.banks[WHITE]],
      [BLACK]: [...position.banks[BLACK]],
    },
    turn: position.turn,
    phase: position.phase,
    repetitions: { ...position.repetitions },
  };
}

function validatePosition(position) {
  if (!position || !Array.isArray(position.board) || position.board.length !== 16) {
    throw new Error('A Schness board must contain exactly 16 squares');
  }
  if (!PLAYERS.has(position.turn)) throw new Error('Invalid player turn');
  if (!['place-white-king', 'place-black-king', 'play'].includes(position.phase)) {
    throw new Error('Invalid game phase');
  }
  for (const occupant of position.board) {
    if (!occupant) continue;
    if (!PLAYERS.has(occupant.owner) || !PIECES.has(occupant.piece)) {
      throw new Error('Invalid board occupant');
    }
  }
  for (const player of PLAYERS) {
    if (!Array.isArray(position.banks?.[player]) ||
        position.banks[player].some((piece) => !BANK_PIECES.includes(piece))) {
      throw new Error('Invalid bank');
    }
  }
}

function assertSquare(square) {
  if (!Number.isInteger(square) || square < 0 || square >= 16) {
    throw new Error(`Invalid square: ${square}`);
  }
}
