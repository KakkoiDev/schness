import {boardMasks, masksCheckAfterDrop, masksAfter, masksAttack, masksInCheck, maskAttackers, betweenMask, alignedSliders} from './board-masks.js';
export const BOARD_SIZE = 4;
export const WHITE = 'white';
export const BLACK = 'black';
export const KING = 'king';
export const ROOK = 'rook';
export const BISHOP = 'bishop';
export const KNIGHT = 'knight';
export const BANK_PIECES = Object.freeze([ROOK, BISHOP, KNIGHT]);
export const DEFAULT_RULES = Object.freeze({ allowCheckingDrops: false });
const CHECKING_DROPS_RULES = Object.freeze({ allowCheckingDrops: true });
// Normalized rules are frozen. Cache only primitive-valued configurations;
// callers may still mutate nested extension objects on otherwise frozen rules.
const RULE_SERIALIZATIONS = new WeakMap();
function serializedRules(rules) {
  let cached=RULE_SERIALIZATIONS.get(rules);
  if(cached===undefined){
    cached=Object.values(rules).every(v=>v===null || ['string','number','boolean','undefined'].includes(typeof v))?JSON.stringify(rules):null;
    RULE_SERIALIZATIONS.set(rules,cached);
  }
  return cached===null?JSON.stringify(rules):cached;
}
function bankKey(bank) {
  let bishops=0,knights=0,rooks=0;
  for(const piece of bank){if(piece===BISHOP)bishops++;else if(piece===KNIGHT)knights++;else if(piece===ROOK)rooks++;else return [...bank].sort().map(p=>PIECE_CODE[p]).join('');}
  return 'B'.repeat(bishops)+'N'.repeat(knights)+'R'.repeat(rooks);
}

const PLAYERS_ARRAY = [WHITE, BLACK];
const PLAYERS = new Set(PLAYERS_ARRAY);
const PIECES = new Set([KING, ...BANK_PIECES]);
const ORTHOGONAL = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIAGONAL = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
// Built once: `[...ORTHOGONAL, ...DIAGONAL]` inline allocated a new array on
// every king attack lookup, and that runs once per candidate move per node.
const KING_STEPS = [...ORTHOGONAL, ...DIAGONAL];
const KNIGHT_STEPS = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1],
];
const PIECE_CODE = { [KING]: 'K', [ROOK]: 'R', [BISHOP]: 'B', [KNIGHT]: 'N' };
// Fixed actions and geometry are immutable values, safe to share across positions.
const MOVE_ACTIONS=Array.from({length:16},(_,from)=>Array.from({length:16},(_,to)=>Object.freeze({type:'move',from,to})));
const DROP_ACTIONS=Object.fromEntries(BANK_PIECES.map(piece=>[piece,Array.from({length:16},(_,to)=>Object.freeze({type:'drop',piece,to}))]));
const KING_ACTIONS=Array.from({length:16},(_,to)=>Object.freeze({type:'place-king',to}));
const ACTION_KEYS=new WeakMap();
for(const row of MOVE_ACTIONS)for(const a of row)ACTION_KEYS.set(a,`move:${a.from}:${a.to}`);
for(const row of Object.values(DROP_ACTIONS))for(const a of row)ACTION_KEYS.set(a,`drop:${a.piece}:${a.to}`);
for(const a of KING_ACTIONS)ACTION_KEYS.set(a,`place-king:${a.to}`);
const STEP_TARGETS=Object.fromEntries([[KING,KING_STEPS],[KNIGHT,KNIGHT_STEPS]].map(([piece,steps])=>[piece,Array.from({length:16},(_,from)=>steps.map(([dy,dx])=>squareAt((from>>2)+dy,(from&3)+dx)).filter(to=>to!==null))]));
const RAY_TARGETS=Object.fromEntries([[ROOK,ORTHOGONAL],[BISHOP,DIAGONAL]].map(([piece,directions])=>[piece,Array.from({length:16},(_,from)=>directions.map(([dy,dx])=>{
 const ray=[];for(let distance=1;distance<4;distance++){const to=squareAt((from>>2)+dy*distance,(from&3)+dx*distance);if(to===null)break;ray.push(to);}return ray;
}))]));


/*
 * An occupant is a value, not an object with a life of its own. Exactly eight
 * exist — one per owner and piece — and they are frozen, so every board shares
 * them and a write to one throws (`'use strict'` is implicit in a module).
 * That is what makes it safe for `boardAfter` and `clonePosition` to share
 * occupants between boards: the invariant is enforced, not described.
 */
const OCCUPANTS = {};
for (const owner of PLAYERS) {
  for (const piece of PIECES) OCCUPANTS[`${owner}:${piece}`] = Object.freeze({ owner, piece });
}

export function occupantOf(owner, piece) {
  return OCCUPANTS[`${owner}:${piece}`];
}

export function opponent(player) {
  return player === WHITE ? BLACK : WHITE;
}

export function createInitialPosition(rules = DEFAULT_RULES) {
  return {
    board: Array(BOARD_SIZE * BOARD_SIZE).fill(null),
    banks: {
      [WHITE]: [...BANK_PIECES],
      [BLACK]: [...BANK_PIECES],
    },
    turn: WHITE,
    phase: 'place-white-king',
    repetitions: {},
    research: { turns: { white: 0, black: 0 }, deployed: { white: [], black: [] }, checkingDrops: { white: 0, black: 0 }, lastCheckingDrop: { white: false, black: false } },
    rules: normalizeRules(rules),
  };
}

/** Create a checked position for tests, saved games, and network snapshots. */
export function createPosition({
  board,
  banks,
  turn = WHITE,
  phase = 'play',
  repetitions = {},
  rules = DEFAULT_RULES,
  research = { turns: { white: 0, black: 0 }, deployed: { white: [], black: [] } },
}) {
  const position = {
    board: board.map((occupant) => occupant ? occupantOf(occupant.owner, occupant.piece) : null),
    banks: {
      [WHITE]: [...banks[WHITE]],
      [BLACK]: [...banks[BLACK]],
    },
    turn,
    phase,
    repetitions: { ...repetitions },
    rules: normalizeRules(rules),
    research: { ...structuredClone(research), checkingDrops: { white: 0, black: 0, ...research.checkingDrops }, lastCheckingDrop: { white: false, black: false, ...research.lastCheckingDrop } },
  };
  validatePosition(position);
  return position;
}

/**
 * The exported entry point: validates, then generates. Everything outside the
 * engine comes through here, including a move arriving from a peer.
 */
export function legalActions(position) {
  validatePosition(position);
  return generateLegalActions(position).map(action=>({...action}));
}

/**
 * The same generation without the guard, for a caller that produced the
 * position itself — the bot's search, which visits tens of thousands of
 * positions this engine just built and re-validated every one of them.
 * Never call this on anything that came from outside the engine.
 */
export function legalActionsUnchecked(position, masks) {
  return generateLegalActions(position, masks);
}

function generateLegalActions(position, suppliedMasks, countOnly=false) {
  const actions=countOnly?null:[];
  let count=0;
  if(position.phase==='place-white-king'||position.phase==='place-black-king'){
    for(const to of homeRank(position.phase==='place-white-king'?WHITE:BLACK))if(!position.board[to]){count++;if(actions)actions.push(KING_ACTIONS[to]);}
    return countOnly?count:actions;
  }
  const player=position.turn,enemy=opponent(player),board=position.board;
  const masks=suppliedMasks ?? boardMasks(board),scratch=new Uint16Array(9),rules=rulesOf(position);
  const offset=player===WHITE?0:4,kings=masks[offset],own=masks[offset]|masks[offset+1]|masks[offset+2]|masks[offset+3];
  let evasion=65535,dropEvasion=65535;
  const pins=new Uint16Array(16);
  if(kings){
    const king=31-Math.clz32(kings&-kings);
    let checkers=maskAttackers(masks,king,enemy);
    while(checkers){const bit=checkers&-checkers,from=31-Math.clz32(bit),between=betweenMask(king,from);evasion&=between|bit;dropEvasion&=between;checkers^=bit;}
    let sliders=alignedSliders(masks,king,enemy);
    while(sliders){
      const bit=sliders&-sliders,from=31-Math.clz32(bit),between=betweenMask(king,from),blockers=between&masks[8];
      if(blockers && !(blockers&(blockers-1)) && (blockers&own))pins[31-Math.clz32(blockers)]=between|bit;
      sliders^=bit;
    }
  }
  function accept(action){
    // Evasion and absolute-pin filters already prove king safety for ordinary
    // non-king moves. There is no en passant or castling in these rules.
    // Preserve the historical first-king behavior on malformed multi-king boards.
    const singleKing=!(kings&(kings-1));
    if(action.type==='move' && board[action.from].piece!==KING && singleKing){
      count++;if(actions)actions.push(action);return;
    }
    const simpleDrop=action.type==='drop' && singleKing;
    const next=simpleDrop?null:masksAfter(masks,board,player,action,scratch);
    // Adding a piece cannot uncover an attack; drops must already block every
    // checking ray. King moves and malformed boards still need the full test.
    if((action.type!=='drop' || !singleKing) && masksInCheck(next,player))return;
    if(action.type==='drop' && (simpleDrop?masksCheckAfterDrop(masks,player,action.piece,action.to):masksInCheck(next,enemy))){
      if(!checkingDropAllowed(position,action))return;
      // Checking-drop replies consume reserves, so recursive mate legality terminates.
      if(rules.experiment==='no-drop-mate' && !generateLegalActions(applyUnchecked(position,action,false),undefined,true))return;
    }
    count++;if(actions)actions.push(action);
  }
  if(position.phase!=='setup')for(let from=0;from<16;from++){
    const occupant=board[from];if(!occupant||occupant.owner!==player)continue;
    function target(to){
      const other=board[to];if(other && (other.owner===player||other.piece===KING))return;
      if(occupant.piece!==KING && (!(evasion&(1<<to)) || (pins[from] && !(pins[from]&(1<<to)))))return;
      accept(MOVE_ACTIONS[from][to]);
    }
    if(STEP_TARGETS[occupant.piece])for(const to of STEP_TARGETS[occupant.piece][from])target(to);
    else for(const ray of RAY_TARGETS[occupant.piece][from])for(const to of ray){target(to);if(board[to])break;}
  }
  let seen=0;
  for(const piece of position.banks[player]){
    const bit=piece===ROOK?1:piece===BISHOP?2:4;if(seen&bit)continue;seen|=bit;
    for(let to=0;to<16;to++)if(!board[to] && (dropEvasion&(1<<to)) && !(position.phase==='setup' && rules.hiddenSetup && (player===WHITE?to<12:to>=4)))accept(DROP_ACTIONS[piece][to]);
  }
  return countOnly?count:actions;
}

/** Search-only mobility counting; shares exact move legality without building an action array. */
export function countLegalActionsUnchecked(position,masks){return generateLegalActions(position,masks,true);}

export function applyAction(position, action) {
  const legal = legalActions(position);
  const wanted = actionKey(action);
  if (!legal.some((candidate) => actionKey(candidate) === wanted)) {
    throw new Error(`Illegal action: ${wanted}`);
  }
  return applyUnchecked(position, action, true);
}

/**
 * Apply an action already known to be legal for this exact position — it must
 * have come from `legalActions(position)` and nothing may have changed since.
 *
 * `applyAction` re-derives the entire legal move list and string-matches the
 * action against it. That is exactly right for a move arriving from a peer,
 * where the list is the security boundary, and it is pure waste inside a
 * search that generated the move itself one line earlier: it doubled move
 * generation at every node and allocated an `actionKey` string per candidate.
 * Only the bot should use this.
 */
export function applyLegalAction(position, action) {
  return applyUnchecked(position, action, true);
}

export function isSquareAttacked(position, square, byPlayer) {
  assertSquare(square);
  return boardAttacks(position.board, square, byPlayer);
}

function boardAttacks(board, square, byPlayer) {
  return masksAttack(boardMasks(board), square, byPlayer);
}

/**
 * Every square holding a piece of byPlayer that attacks the given square.
 * isSquareAttacked stays separate because the bot's search calls it for its
 * early exit and does not need the full list.
 */
export function attackersOf(position, square, byPlayer) {
  assertSquare(square);
  const attackers = [];
  for (let from = 0; from < position.board.length; from += 1) {
    const occupant = position.board[from];
    if (!occupant || occupant.owner !== byPlayer) continue;
    if (attackSquares(position.board, from, occupant.piece).includes(square)) attackers.push(from);
  }
  return attackers;
}

export function kingSquare(position, player) {
  const square = position.board.findIndex(
    (occupant) => occupant?.owner === player && occupant.piece === KING,
  );
  return square === -1 ? null : square;
}

export function isInCheck(position, player) {
  return boardInCheck(position.board, player);
}

function boardInCheck(board, player) {
  return masksInCheck(boardMasks(board), player);
}

export function positionKey(position) {
  const board = position.board.map((occupant) => {
    if (!occupant) return '--';
    return `${occupant.owner[0]}${PIECE_CODE[occupant.piece]}`;
  }).join('');
  const whiteBank = bankKey(position.banks[WHITE]);
  const blackBank = bankKey(position.banks[BLACK]);
  const rules = rulesOf(position).allowCheckingDrops ? 'checking-drops' : 'quiet-drops';
  const researchRules = rulesOf(position);
  const rights = researchRules.experiment === 'protected-opening' ? PLAYERS_ARRAY.map(player => position.research.deployed[player].length > 0)
    : ['grace', 'first-turn-quiet', 'protected-first-turn'].includes(researchRules.experiment) ? position.research.turns
      : ['mutual-one', 'mutual-two'].includes(researchRules.experiment) ? position.research.deployed
        : researchRules.experiment === 'limited-check' ? position.research.checkingDrops
          : researchRules.experiment === 'cooldown' ? position.research.lastCheckingDrop
      : researchRules.experiment === 'quiet-return' ? { turns: position.research.turns, deployed: position.research.deployed } : null;
  const extra = researchRules.experiment ? `|${serializedRules(researchRules)}|${JSON.stringify(rights)}` : '';
  return `${rules}${extra}|${position.phase}|${position.turn}|${board}|${whiteBank}|${blackBank}`;
}

export function getResult(position) {
  return resultWithActions(position, () => legalActions(position));
}

/** Search-only adjudication: reuse legal actions generated from an immutable trusted state. */
export function getResultUnchecked(position, actions, key, masks) {
  return resultWithActions(position, () => typeof actions==='number'?{length:actions}:actions ?? legalActionsUnchecked(position, masks), key, masks);
}

function resultWithActions(position, actions, suppliedKey, masks) {
  if (position.phase === 'setup') {
    return actions().length ? null : { type: 'draw', reason: 'setup-blocked' };
  }
  if (position.phase !== 'play') return null;
  const key = suppliedKey ?? positionKey(position);
  if ((position.repetitions[key] ?? 0) >= 3) {
    return { type: 'draw', reason: 'threefold-repetition' };
  }

  if (actions().length > 0) return null;
  if (masks ? masksInCheck(masks, position.turn) : isInCheck(position, position.turn)) {
    return { type: 'win', winner: opponent(position.turn), reason: 'checkmate' };
  }
  return { type: 'draw', reason: 'stalemate' };
}

export function actionKey(action) {
  if (!action || typeof action !== 'object') return 'invalid';
  const cached=ACTION_KEYS.get(action);if(cached!==undefined)return cached;
  if (action.type === 'place-king') return `place-king:${action.to}`;
  if (action.type === 'move') return `move:${action.from}:${action.to}`;
  if (action.type === 'drop') return `drop:${action.piece}:${action.to}`;
  return 'invalid';
}

function applyUnchecked(position, action, countRepetition) {
  const next = clonePosition(position);
  advancePosition(next, action, countRepetition);
  return next;
}

/** Isolated mutable state for a single synchronous search, never a UI/replay state. */
export function createSearchPosition(position) { return clonePosition(position); }

/** Search-only reversible transition. Supply a generated legal action; optional masks must describe its resulting board. */
export function makeSearchAction(position, action, nextMasks) {
  const player=position.turn;
  const undo={action,turn:player,phase:position.phase,to:position.board[action.to],
    from:action.type==='move'?position.board[action.from]:null};
  if(rulesOf(position).experiment && action.type!=='place-king'){
    undo.research={turns:position.research.turns[player],checkingDrops:position.research.checkingDrops[player],
      lastCheckingDrop:position.research.lastCheckingDrop[player],deployed:position.research.deployed[player].slice()};
  }
  advancePosition(position,action,true,undo,nextMasks);
  return undo;
}

export function unmakeSearchAction(position, undo) {
  const {action,turn:player}=undo;
  position.board[action.to]=undo.to;
  if(action.type==='move')position.board[action.from]=undo.from;
  if(undo.bank){const b=undo.bank;if(b.added)position.banks[b.owner].splice(b.index,1);else position.banks[b.owner].splice(b.index,0,b.piece);}
  if(undo.research){for(const field of ['turns','checkingDrops','lastCheckingDrop','deployed'])position.research[field][player]=undo.research[field];}
  if(undo.key){if(undo.hadCount)position.repetitions[undo.key]=undo.count;else delete position.repetitions[undo.key];}
  position.turn=player;position.phase=undo.phase;
}

function advancePosition(next, action, countRepetition, undo, suppliedNextMasks) {
  const player = next.turn;
  const phase = next.phase;
  const rules = rulesOf(next);

  if (action.type === 'place-king') {
    next.board[action.to] = occupantOf(player, KING);
    if (phase === 'place-white-king') {
      next.phase = 'place-black-king';
      next.turn = BLACK;
    } else {
      next.phase = rules.setup ? 'setup' : 'play';
      next.turn = WHITE;
    }
  } else if (action.type === 'move') {
    const moving = next.board[action.from];
    const captured = next.board[action.to];
    next.board[action.to] = moving;
    next.board[action.from] = null;
    if (captured && rules.experiment !== 'permanent-loss') {
      const policy = rules.experiment;
      const transfers = policy === 'capture-bank';
      const recipient = transfers && next.banks[player].length < rules.bankCapacity
        ? player : captured.owner;
      if (undo) undo.bank = {owner:recipient,index:next.banks[recipient].length,added:true};
      next.banks[recipient].push(captured.piece);
    }
    next.turn = opponent(player);
  } else if (action.type === 'drop') {
    const bankIndex = next.banks[player].indexOf(action.piece);
    if (undo) undo.bank = {owner:player,index:bankIndex,piece:action.piece,added:false};
    next.banks[player].splice(bankIndex, 1);
    next.board[action.to] = occupantOf(player, action.piece);
    next.turn = opponent(player);
  }

  if (rules.experiment && action.type !== 'place-king') {
    const wasCheckingDrop = action.type === 'drop' && (suppliedNextMasks ? masksInCheck(suppliedNextMasks,opponent(player)) : boardInCheck(next.board, opponent(player)));
    next.research.checkingDrops[player] = Math.min(1, next.research.checkingDrops[player] + Number(wasCheckingDrop));
    next.research.lastCheckingDrop[player] = wasCheckingDrop;
    next.research.turns[player] = Math.min(3, next.research.turns[player] + 1);
    if (action.type === 'drop' && !next.research.deployed[player].includes(action.piece)) {
      next.research.deployed[player].push(action.piece);
      next.research.deployed[player].sort();
    }
    if (phase === 'setup' && !next.banks.white.length && !next.banks.black.length) {
      next.phase = 'play';
      next.turn = rules.firstPlayer;
    }
  }

  if (countRepetition && next.phase === 'play') {
    const key = positionKey(next);
    if (undo) {undo.key=key;undo.hadCount=Object.hasOwn(next.repetitions,key);undo.count=next.repetitions[key];}
    next.repetitions[key] = (next.repetitions[key] ?? 0) + 1;
  }
  return next;
}

function attackSquares(board,from,piece){
  if(STEP_TARGETS[piece])return STEP_TARGETS[piece][from];
  const result=[];
  for(const ray of RAY_TARGETS[piece]?.[from]??[])for(const to of ray){result.push(to);if(board[to])break;}
  return result;
}

function homeRank(player) {
  const row = player === WHITE ? BOARD_SIZE - 1 : 0;
  return Array.from({ length: BOARD_SIZE }, (_, column) => row * BOARD_SIZE + column);
}

function squareAt(row, column) {
  if (row < 0 || row >= BOARD_SIZE || column < 0 || column >= BOARD_SIZE) return null;
  return row * BOARD_SIZE + column;
}

/**
 * The board an action would leave behind — read-only, and only ever handed to
 * `boardInCheck`. Occupants are frozen shared values (see `OCCUPANTS`), so
 * copying the array is copying the board.
 */
function boardAfter(position, action) {
  const board = position.board.slice();
  if (action.type === 'move') {
    board[action.to] = board[action.from];
    board[action.from] = null;
  } else if (action.type === 'drop') {
    board[action.to] = occupantOf(position.turn, action.piece);
  } else {
    board[action.to] = occupantOf(position.turn, KING);
  }
  return board;
}

function coordinates(square) {
  return [Math.floor(square / BOARD_SIZE), square % BOARD_SIZE];
}

/** Public transitions and search preparation own their copies. Reversible search
 * updates the working repetition map in place instead of cloning it per node. */
function clonePosition(position) {
  return {
    board: position.board.slice(),
    banks: {
      [WHITE]: [...position.banks[WHITE]],
      [BLACK]: [...position.banks[BLACK]],
    },
    turn: position.turn,
    phase: position.phase,
    repetitions: { ...position.repetitions },
    rules: rulesOf(position),
    research: position.research ? { checkingDrops: { white: 0, black: 0, ...position.research.checkingDrops }, lastCheckingDrop: { white: false, black: false, ...position.research.lastCheckingDrop }, turns: { ...position.research.turns }, deployed: { white: [...position.research.deployed.white], black: [...position.research.deployed.black] } } : { turns: { white: 0, black: 0 }, deployed: { white: [], black: [] } },
  };
}

function validatePosition(position) {
  if (!position || !Array.isArray(position.board) || position.board.length !== 16) {
    throw new Error('A Schness board must contain exactly 16 squares');
  }
  if (!PLAYERS.has(position.turn)) throw new Error('Invalid player turn');
  if (!['place-white-king', 'place-black-king', 'setup', 'play'].includes(position.phase)) {
    throw new Error('Invalid game phase');
  }
  if (position.rules && typeof position.rules.allowCheckingDrops !== 'boolean') {
    throw new Error('Invalid ruleset');
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
    if (position.rules?.experiment === 'capture-bank' && position.banks[player].length > position.rules.bankCapacity) throw new Error('Capture bank overflow');
  }
}

function normalizeRules(rules) {
  if (!rules || typeof rules.allowCheckingDrops !== 'boolean') {
    throw new Error('Invalid ruleset');
  }
  if (rules.experiment) {
    if (!['protected-recurring', 'protected-opening', 'grace', 'quiet-return', 'setup', 'first-turn-quiet', 'protected-first-turn', 'mutual-one', 'mutual-two', 'limited-check', 'cooldown', 'no-drop-mate', 'home-half-check', 'distant-check', 'supported-check', 'countercheck-only', 'knight-check', 'bishop-check', 'rook-check', 'capture-bank', 'permanent-loss'].includes(rules.experiment)) throw new Error('Unknown experiment');
    if (rules.experiment === 'capture-bank' && (!Number.isInteger(rules.bankCapacity) || rules.bankCapacity < 3 || rules.bankCapacity > 6)) throw new Error('Invalid bank capacity');
    if (rules.experiment === 'setup' && (!rules.setup || !PLAYERS.has(rules.firstPlayer))) throw new Error('Invalid setup rules');
    return Object.freeze(rules);
  }
  return rules.allowCheckingDrops
    ? CHECKING_DROPS_RULES
    : DEFAULT_RULES;
}

function rulesOf(position) {
  return position.rules ? normalizeRules(position.rules) : DEFAULT_RULES;
}

function assertSquare(square) {
  if (!Number.isInteger(square) || square < 0 || square >= 16) {
    throw new Error(`Invalid square: ${square}`);
  }
}

function checkingDropAllowed(position, action) {
  const rules = rulesOf(position);
  if (!rules.allowCheckingDrops || position.phase === 'setup') return false;
  const enemy = opponent(position.turn);
  // These policies restrict checking drops only; quiet drops remain ordinary legal actions.
  if (action.type !== 'drop') return true;
  if (rules.experiment === 'home-half-check') return position.turn === WHITE ? action.to >= 8 : action.to < 8;
  if (rules.experiment === 'distant-check') {
    const king = kingSquare(position, enemy);
    return Math.max(Math.abs(Math.floor(action.to / 4) - Math.floor(king / 4)), Math.abs(action.to % 4 - king % 4)) >= 2;
  }
  if (rules.experiment === 'supported-check') return boardAttacks(boardAfter(position, action), action.to, position.turn);
  if (rules.experiment === 'countercheck-only') return boardInCheck(position.board, position.turn);
  if (['knight-check', 'bishop-check', 'rook-check'].includes(rules.experiment)) return action.piece === rules.experiment.split('-')[0];
  if (['first-turn-quiet', 'protected-first-turn'].includes(rules.experiment) && position.research.turns[position.turn] === 0) return false;
  if (['mutual-one', 'mutual-two'].includes(rules.experiment)) {
    const required = rules.experiment === 'mutual-one' ? 1 : 2;
    if (Math.min(position.research.deployed.white.length, position.research.deployed.black.length) < required) return false;
  }
  if (rules.experiment === 'limited-check' && position.research.checkingDrops[position.turn] >= 1) return false;
  if (rules.experiment === 'cooldown' && position.research.lastCheckingDrop[position.turn]) return false;
  if (['protected-recurring', 'protected-first-turn'].includes(rules.experiment)) {
    return position.board.some(piece => piece?.owner === enemy && piece.piece !== KING);
  }
  if (rules.experiment === 'protected-opening') return position.research.deployed[enemy].length > 0;
  if (rules.experiment === 'grace' || rules.experiment === 'quiet-return') {
    if (Math.min(position.research.turns.white, position.research.turns.black) < 3) return false;
    if (rules.experiment === 'quiet-return' && position.research.deployed[position.turn].includes(action.piece)) return false;
  }
  return true;
}
