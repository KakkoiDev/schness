import { actionKey, applyAction, getResult, kingSquare, legalActions, opponent, positionKey } from './rules.js';
import { colorName, squareName } from './notation.js';
import { deploymentCount, moveCount } from './history.js';

export function makeActionMessage(position, action) {
  const wanted = actionKey(action);
  const legal = legalActions(position).find((candidate) => actionKey(candidate) === wanted);
  if (!legal) throw new Error('Cannot send an illegal action');
  const next = applyAction(position, legal);
  return { type: 'action', action: legal, before: positionKey(position), after: positionKey(next) };
}

export function applyActionMessage(position, message) {
  if (!message || message.type !== 'action' || typeof message.before !== 'string' ||
      typeof message.after !== 'string' || !message.action) throw new Error('Malformed game message');
  if (message.before !== positionKey(position)) throw new Error('Peer position is out of sync');
  const wanted = actionKey(message.action);
  const legal = legalActions(position).find((candidate) => actionKey(candidate) === wanted);
  if (!legal) throw new Error('Peer sent an illegal action');
  const next = applyAction(position, legal);
  if (message.after !== positionKey(next)) throw new Error('Peer position hash does not match');
  return next;
}

/**
 * The end-of-game sentence, generated rather than canned: the outcome is here
 * and the position is in rules.js, so naming the mating piece and the square
 * is what turns a loss into something learnable.
 */
export function outcomeSummary({
  position, timeline = [], history = [], humanColor,
  resigned = null, onTime = false, agreedDraw = false, opponentName = 'Your opponent',
}) {
  if (agreedDraw) {
    return {
      eyebrow: 'Draw', headline: 'Draw agreed', tone: 'neutral',
      detail: `Neither side pressed on. The match ended on move ${moveCount(history)}.`,
    };
  }
  if (resigned && onTime) {
    // The clock, not a choice, ended it. Calling that a resignation misreports
    // the game to the player who lost it and to the one who won it.
    const mine = resigned === humanColor;
    return {
      eyebrow: 'Time',
      headline: mine ? 'You ran out of time' : `${opponentName} ran out of time`,
      tone: mine ? 'neutral' : 'win',
      detail: `${mine ? 'Your' : 'Their'} clock hit zero on move ${moveCount(history)}. You can still walk back through it.`,
    };
  }
  if (resigned) {
    const mine = resigned === humanColor;
    return {
      eyebrow: 'Resigned',
      headline: mine ? 'You resigned' : `${opponentName} resigned`,
      tone: mine ? 'neutral' : 'win',
      detail: `The match ended on move ${moveCount(history)}. You can still walk back through it.`,
    };
  }
  const result = getResult(position);
  if (result?.type === 'win') {
    return result.winner === humanColor
      ? winSummary(position, history)
      : lossSummary(position, timeline, history, humanColor);
  }
  if (result?.reason === 'stalemate') return stalemateSummary(position);
  if (result?.reason === 'threefold-repetition') {
    return {
      eyebrow: 'Draw', headline: 'Threefold repetition', tone: 'neutral',
      detail: 'The same position came up three times, so the game is drawn.',
    };
  }
  return null;
}

/**
 * The action the losing side could have played instead. Runs once, when the
 * result card appears, so a shallow two-ply check is affordable.
 */
export function missedDefence(timeline, history, player) {
  const node = timeline[history.length - 2];
  if (!node || node.turn !== player) return null;
  const played = actionKey(history[history.length - 2]?.action ?? null);
  for (const action of legalActions(node)) {
    if (actionKey(action) === played) continue;
    if (!hasMateInOne(applyAction(node, action))) return action;
  }
  return null;
}

function winSummary(position, history) {
  const last = history.at(-1);
  const square = last ? squareName(last.action.to) : null;
  const piece = last?.action.type === 'drop'
    ? last.action.piece : position.board[last?.action.to]?.piece;
  const deployed = last && arrivedFromReserve(history, last.action.to) ? 'deployed ' : '';
  const opening = piece && square
    ? `The ${deployed}${piece} on ${square} closed off the last square.`
    : 'There was no square left for the king.';
  return {
    eyebrow: 'Checkmate', headline: 'You win', tone: 'win',
    detail: `${opening} ${moveCount(history)} moves, ${deploymentCount(history)} deployments.`,
  };
}

function lossSummary(position, timeline, history, humanColor) {
  const king = kingSquare(position, humanColor);
  const where = king === null ? '' : ` on ${squareName(king)}`;
  const missed = missedDefence(timeline, history, humanColor);
  const advice = missed
    ? ` ${describeDefence(missed, timeline[history.length - 2])} would have blocked it.`
    : ' Nothing on the board or in your reserve could have stopped it.';
  return {
    eyebrow: 'Checkmate',
    headline: `${colorName(opponent(humanColor))} wins`,
    tone: 'neutral',
    detail: `Your king ran out of squares${where}.${advice}`,
  };
}

function stalemateSummary(position) {
  const stuck = position.turn;
  // With reserves in play, players assume they must always have a move.
  const why = position.banks[stuck].length
    ? ' Not even a deployment from the reserve changes it.'
    : ' That reserve is empty, so nothing could change it.';
  return {
    eyebrow: 'Draw', headline: 'Stalemate', tone: 'neutral',
    detail: `${colorName(stuck)} has no legal move and is not in check.${why}`,
  };
}

function describeDefence(action, node) {
  if (action.type === 'drop') return `A deployment on ${squareName(action.to)}`;
  const piece = node?.board[action.from]?.piece ?? 'piece';
  return `Moving the ${piece} to ${squareName(action.to)}`;
}

function hasMateInOne(position) {
  const already = getResult(position);
  if (already) return already.type === 'win';
  return legalActions(position)
    .some((action) => getResult(applyAction(position, action))?.reason === 'checkmate');
}

/** Follows a piece back through its moves to see if it began as a deployment. */
function arrivedFromReserve(history, square) {
  let target = square;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const action = history[index].action;
    if (action.to !== target) continue;
    if (action.type === 'drop') return true;
    if (action.type === 'place-king') return false;
    target = action.from;
  }
  return false;
}
