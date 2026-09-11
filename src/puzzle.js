import {
  BLACK, WHITE, applyLegalAction, createPosition, isInCheck, legalActionsUnchecked, opponent, positionKey,
} from './rules.js';

const OCCUPANTS = [
  null,
  [WHITE, 'king'], [WHITE, 'rook'], [WHITE, 'bishop'], [WHITE, 'knight'],
  [BLACK, 'king'], [BLACK, 'rook'], [BLACK, 'bishop'], [BLACK, 'knight'],
];

/** Conventional mate distance: one unit is one move by the attacking side. */
export function forcedMate(position, maximum = 4, memo = new Map()) {
  const attacker = position.turn;
  for (let moves = 1; moves <= maximum; moves += 1) {
    const actions = winningActions(position, attacker, moves, memo);
    if (actions.length) return { moves, actions };
  }
  return null;
}

export function winningActions(position, attacker, moves, memo = new Map()) {
  if (position.turn !== attacker || moves < 1) return [];
  return legalActionsUnchecked(position).filter((action) => {
    const next = applyLegalAction(position, action);
    return forcesMate(next, attacker, moves - 1, memo);
  });
}

export function solutionLine(position, firstAction, moves, memo = new Map()) {
  const attacker = position.turn;
  const line = [firstAction];
  let current = applyLegalAction(position, firstAction);
  let remaining = moves - 1;
  while (!terminalResult(current)) {
    const actions = legalActionsUnchecked(current);
    let chosen;
    if (current.turn === attacker) {
      chosen = actions.find((action) => forcesMate(applyLegalAction(current, action), attacker, remaining - 1, memo));
      remaining -= 1;
    } else {
      // The root proof established that every defense loses. A stable action
      // order gives the corpus a reproducible representative line.
      chosen = actions.find((action) => forcesMate(applyLegalAction(current, action), attacker, remaining, memo));
    }
    if (!chosen) throw new Error('Forced-mate proof could not produce a continuation');
    line.push(chosen);
    current = applyLegalAction(current, chosen);
  }
  return line;
}

export function encodePuzzlePosition(position) {
  return {
    b: position.board.map((occupant) => OCCUPANTS.findIndex((item) => item?.[0] === occupant?.owner && item?.[1] === occupant?.piece)),
    t: position.turn === WHITE ? 'w' : 'b',
  };
}

export function decodePuzzlePosition(encoded) {
  const board = encoded.b.map((code) => {
    const item = OCCUPANTS[code];
    return item ? { owner: item[0], piece: item[1] } : null;
  });
  const banks = { [WHITE]: [], [BLACK]: [] };
  for (const owner of [WHITE, BLACK]) {
    for (const piece of ['rook', 'bishop', 'knight']) {
      if (!board.some((occupant) => occupant?.owner === owner && occupant.piece === piece)) banks[owner].push(piece);
    }
  }
  const turn = encoded.t === 'b' ? BLACK : WHITE;
  const base = createPosition({ board, banks, turn, phase: 'play' });
  return createPosition({ board, banks, turn, phase: 'play', repetitions: { [positionKey(base)]: 1 } });
}

/** True only if mate survives every legal defense. */
export function forcesMate(position, attacker, moves, memo = new Map()) {
  const result = terminalResult(position);
  if (result) return result.type === 'win' && result.winner === attacker;
  if (moves < 0) return false;
  const key = searchKey(position, attacker, moves);
  if (memo.has(key)) return memo.get(key);
  const actions = legalActionsUnchecked(position);
  let answer;
  if (position.turn === attacker) {
    if (moves === 0) answer = false;
    else answer = actions.some((action) => forcesMate(applyLegalAction(position, action), attacker, moves - 1, memo));
  } else {
    answer = actions.every((action) => forcesMate(applyLegalAction(position, action), attacker, moves, memo));
  }
  memo.set(key, answer);
  return answer;
}

function terminalResult(position) {
  const repetition = position.repetitions[positionKey(position)] ?? 0;
  if (repetition >= 3) return { type: 'draw', reason: 'threefold-repetition' };
  const actions = legalActionsUnchecked(position);
  if (actions.length) return null;
  return isInCheck(position, position.turn)
    ? { type: 'win', winner: opponent(position.turn), reason: 'checkmate' }
    : { type: 'draw', reason: 'stalemate' };
}

function searchKey(position, attacker, moves) {
  const repeated = Object.entries(position.repetitions)
    .filter(([, count]) => count > 1)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => `${key}:${count}`)
    .join(';');
  return `${attacker}|${moves}|${positionKey(position)}|${repeated}`;
}
