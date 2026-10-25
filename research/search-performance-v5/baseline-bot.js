import {boardMasks, masksAfter, masksInCheck} from './baseline-board-masks.js';
import {createSearchEngine} from './baseline-search.js';
import {
  BISHOP,
  BLACK,
  KING,
  KNIGHT,
  ROOK,
  WHITE,
  applyLegalAction,
  createSearchPosition, makeSearchAction, unmakeSearchAction,
  getResultUnchecked,
  actionKey,
  isInCheck,
  legalActionsUnchecked, countLegalActionsUnchecked,
  positionKey,
} from './baseline-rules.js';

const VALUES = { [KING]: 0, [ROOK]: 500, [BISHOP]: 320, [KNIGHT]: 300 };
const MATE = 1_000_000;
const searchState = new WeakMap();
const materialBanks = p => ['capture-bank','permanent-loss'].includes(p.rules?.experiment);
function material(p) {
  let value=0;
  for(const o of p.board)if(o)value+=(o.owner===WHITE?1:-1)*(VALUES[o.piece]+(o.piece===KING?0:20));
  if(materialBanks(p))for(const owner of [WHITE,BLACK])for(const piece of p.banks[owner])value+=(owner===WHITE?1:-1)*VALUES[piece];
  return value;
}
function prepare(position,options) {
  const p=createSearchPosition(position);
  // IDs identify an ordered extension of this root's exact initial history.
  // Different histories never share an ID; equivalent reorderings may miss a hit.
  searchState.set(p,{material:material(p),masks:boardMasks(p.board),key:positionKey(p),history:1,nextHistory:2,
    paths:new Map(),pathLimit:options.maxTableEntries ?? 50000});
  return p;
}
function make(position,action) {
  const state=searchState.get(position),saved={material:state.material,masks:state.masks,key:state.key,history:state.history};
  const player=position.turn,sign=player===WHITE?1:-1;
  if(action.type==='drop')state.material+=sign*(VALUES[action.piece]+20-(materialBanks(position)?VALUES[action.piece]:0));
  if(action.type==='move'){
    const captured=position.board[action.to];
    if(captured){
      state.material-=(captured.owner===WHITE?1:-1)*(VALUES[captured.piece]+20);
      if(materialBanks(position) && position.rules.experiment==='capture-bank'){
        const recipient=position.banks[player].length<position.rules.bankCapacity?player:captured.owner;
        state.material+=(recipient===WHITE?1:-1)*VALUES[captured.piece];
      }
    }
  }
  state.masks=masksAfter(state.masks,position.board,player,action);
  const undo=makeSearchAction(position,action);
  state.key=undo.key ?? positionKey(position);
  const path=`${state.history}:${state.key}`;
  let id=state.paths.get(path);
  if(id===undefined){id=state.nextHistory++;if(state.paths.size>=state.pathLimit)state.paths.delete(state.paths.keys().next().value);state.paths.set(path,id);}
  state.history=id;
  return {undo,saved};
}
function unmake(position,{undo,saved}) {unmakeSearchAction(position,undo);Object.assign(searchState.get(position),saved);}


/** Variant adapter keeps Schness legality, objectives and evaluation out of search. */
export const schnessSearch = createSearchEngine({
  prepare, make, unmake,
  scoreStep:1,
  isTactical:(p,a)=>a.type==='move' && Boolean(p.board[a.to]),
  actions: p=>legalActionsUnchecked(p,searchState.get(p)?.masks),
  countActions:p=>countLegalActionsUnchecked(p,searchState.get(p)?.masks),
  actionKey,
  apply: applyLegalAction,
  turn: p => p.turn,
  key: p => {const s=searchState.get(p);return s?`${s.key}|history-id:${s.history}`:`${positionKey(p)}|history:${JSON.stringify(Object.entries(p.repetitions ?? {}).sort(([a],[b])=>a<b?-1:a>b?1:0))}`;},
  hintKey: p => searchState.get(p)?.key ?? positionKey(p),
  terminal: (p, player, depth, facts) => {
    const state=searchState.get(p);
    const result=getResultUnchecked(p, facts.actionCount(),state?.key,state?.masks);
    return !result ? null : result.type==='draw' ? 0 : result.winner===player ? MATE+depth : -MATE-depth;
  },
  evaluate,
  inDanger: p => searchState.has(p)?masksInCheck(searchState.get(p).masks,p.turn):isInCheck(p,p.turn),
  noisyActions: (p, actions) => actions.filter(a => a.type === 'move' && p.board[a.to]),
  order: orderActions,
  repetitions: p => p.repetitions[searchState.get(p)?.key ?? positionKey(p)] ?? 0,
});

/** Existing depth profiles stay supported; strength 0–100 enables bounded iterative search. */
export function chooseAction(position, options={}) { return analyzeAction(position,{...options,multiPv:1}).action; }
export function analyzeAction(position, options={}) { return schnessSearch.choose(position,options); }
/** White-positive score. */
export function scorePosition(position, depth=3) { return schnessSearch.score(position,WHITE,depth); }

function evaluate(position, player, facts) {
  const enemy = player === WHITE ? BLACK : WHITE;
  let score=(searchState.get(position)?.material ?? material(position))*(player===WHITE?1:-1);
  const masks=searchState.get(position)?.masks ?? boardMasks(position.board);
  score += ((position.turn===player?facts.actionCount():countLegalActionsUnchecked({...position,turn:player},masks))-
    (position.turn===enemy?facts.actionCount():countLegalActionsUnchecked({...position,turn:enemy},masks)))*2;
  if (masksInCheck(masks, enemy)) score += 30;
  if (masksInCheck(masks, player)) score -= 30;
  return score;
}

function orderActions(position, actions) {
  return [...actions].sort((a, b) => actionPriority(position, b) - actionPriority(position, a));
}

function actionPriority(position, action) {
  if (action.type === 'move' && position.board[action.to]) return 100 + VALUES[position.board[action.to].piece];
  if (action.type === 'move') return 20;
  if (action.type === 'drop') return 10 + VALUES[action.piece] / 100;
  return 0;
}
