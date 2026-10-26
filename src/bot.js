import {boardMasks, masksAfter, masksInCheck, masksAttack} from './board-masks.js';
import {createSearchEngine} from './search.js';
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
} from './rules.js';

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
    competitive:options.profile==='competitive',historyCounts:new Map(),
    maskStack:[],maskDepth:0,paths:new Map(),pathLimit:options.maxTableEntries ?? 50000});
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
  // A buffer belongs to one active stack frame. Siblings reuse it only after
  // unmake has restored the parent's distinct buffer.
  const scratch=state.maskStack[state.maskDepth] ??= new Uint16Array(9);
  state.maskDepth++;
  state.masks=masksAfter(state.masks,position.board,player,action,scratch);
  const undo=makeSearchAction(position,action);
  state.key=undo.key ?? positionKey(position);
  if(state.competitive){
    if(undo.key)state.historyCounts.set(undo.key,(state.historyCounts.get(undo.key)??0)+1);
    return {undo,saved};
  }
  const path=`${state.history}:${state.key}`;
  let id=state.paths.get(path);
  if(id===undefined){id=state.nextHistory++;if(state.paths.size>=state.pathLimit)state.paths.delete(state.paths.keys().next().value);state.paths.set(path,id);}
  state.history=id;
  return {undo,saved};
}
function unmake(position,{undo,saved}) {
  unmakeSearchAction(position,undo);const state=searchState.get(position);
  if(state.competitive && undo.key){const n=state.historyCounts.get(undo.key)-1;if(n)state.historyCounts.set(undo.key,n);else state.historyCounts.delete(undo.key);}
  state.maskDepth--;Object.assign(state,saved);
}


/** Variant adapter keeps Schness legality, objectives and evaluation out of search. */
export const schnessSearch = createSearchEngine({
  prepare, make, unmake,
  scoreStep:1,
  isTactical:(p,a)=>a.type==='move' && Boolean(p.board[a.to]),
  canReduce:(p,a,options={})=>p.phase==='play' && ((a.type==='move' && !p.board[a.to]) ||
    (a.type==='drop' && options.reduceQuietDrops===true)) &&
    !(searchState.has(p)?masksInCheck(searchState.get(p).masks,p.turn):isInCheck(p,p.turn)),
  actions: p=>legalActionsUnchecked(p,searchState.get(p)?.masks),
  countActions:p=>countLegalActionsUnchecked(p,searchState.get(p)?.masks),
  actionKey,
  apply: applyLegalAction,
  turn: p => p.turn,
  key: p => {const s=searchState.get(p);
    // The root history is constant for this search. Counts of its extensions,
    // rather than their traversal order, determine repetition adjudication.
    if(s?.competitive)return s.key+'|counts:'+JSON.stringify([...s.historyCounts].sort(([a],[b])=>a<b?-1:a>b?1:0));
    return s?`${s.key}|history-id:${s.history}`:`${positionKey(p)}|history:${JSON.stringify(Object.entries(p.repetitions ?? {}).sort(([a],[b])=>a<b?-1:a>b?1:0))}`;},
  hintKey: p => searchState.get(p)?.key ?? positionKey(p),
  terminal: (p, player, depth, facts) => {
    const state=searchState.get(p);
    const result=getResultUnchecked(p, facts.actionCount(),state?.key,state?.masks);
    return !result ? null : result.type==='draw' ? 0 : result.winner===player ? MATE+depth : -MATE-depth;
  },
  evaluate,
  isProvenWin:score=>score>=MATE,
  inDanger: p => searchState.has(p)?masksInCheck(searchState.get(p).masks,p.turn):isInCheck(p,p.turn),
  noisyActions: (p, actions, options) => {
    if(!options.includeChecks)return actions.filter(a => a.type === 'move' && p.board[a.to]);
    const masks=searchState.get(p)?.masks ?? boardMasks(p.board),scratch=new Uint16Array(9);
    const enemy=p.turn===WHITE?BLACK:WHITE;
    // The input is already legal: variant-specific forbidden checks and mates
    // cannot enter this list. This includes checking drops when permitted.
    return actions.filter(a => a.type==='move' && p.board[a.to] ||
      masksInCheck(masksAfter(masks,p.board,p.turn,a,scratch),enemy));
  },
  order: orderActions,
  repetitions: p => p.repetitions[searchState.get(p)?.key ?? positionKey(p)] ?? 0,
});

/** Competitive search is explicit until independently validated against v7.
 * Depth counts individual player actions (plies). No implicit node/time budget.
 */
export const COMPETITIVE_OPTIONS=Object.freeze({profile:'competitive',depth:20,
  iterativeDeepening:true,quiescenceDepth:6,quiescenceChecks:true,
  lateMoveReduction:true,stopOnProvenWin:true,repetitionAversion:true,maxTableEntries:100000});
export function chooseAction(position, options={}) { return analyzeAction(position,{...options,multiPv:1}).action; }
export function analyzeAction(position, options={}) {
  if(options.reduceQuietDrops!==undefined && typeof options.reduceQuietDrops!=='boolean')throw new TypeError('Invalid reduceQuietDrops');
  if(options.profile!==undefined && !['reference','competitive'].includes(options.profile))throw new RangeError('Unknown search profile');
  return schnessSearch.choose(position,options.profile==='competitive'?{...COMPETITIVE_OPTIONS,...options}:options);
}
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
  if(facts.options.profile==='competitive')score+=positionalScore(position,masks)*(player===WHITE?1:-1);
  return score;
}

// Small-board king confinement and exposed material supplement the reference
// material/mobility evaluation. Attacks are geometric, not legal captures.
function positionalScore(p,masks){
  let value=0;
  for(let square=0;square<16;square++){
    const o=p.board[square];if(!o)continue;
    const sign=o.owner===WHITE?1:-1,enemy=o.owner===WHITE?BLACK:WHITE;
    const x=square%4,y=square>>2;
    if(o.piece===KING){
      let safe=0,pressure=0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const xx=x+dx,yy=y+dy;if((!dx&&!dy)||xx<0||xx>3||yy<0||yy>3)continue;
        const to=yy*4+xx;
        if(masksAttack(masks,to,enemy))pressure++;
        else if(p.board[to]?.owner!==o.owner)safe++;
      }
      value+=sign*(safe*14-pressure*20);
    }else{
      const attacked=masksAttack(masks,square,enemy),defended=masksAttack(masks,square,o.owner);
      value+=sign*((x===1||x===2?6:0)+(y===1||y===2?6:0)+(defended?12:0));
      if(attacked)value-=sign*Math.round(VALUES[o.piece]*(defended?0.12:0.45));
    }
  }
  return value;
}

function orderActions(position, actions) {
  const state=searchState.get(position);
  if(state?.competitive){
    const enemy=position.turn===WHITE?BLACK:WHITE,scratch=new Uint16Array(9),priority=new Map();
    for(const action of actions){
      const next=masksAfter(state.masks,position.board,position.turn,action,scratch);
      const victim=position.board[action.to],piece=action.type==='move'?position.board[action.from].piece:action.piece;
      const capture=victim?10000+VALUES[victim.piece]*10-(VALUES[piece]??0):0;
      const check=masksInCheck(next,enemy)?2000:0;
      const central=(action.to%4===1||action.to%4===2?8:0)+((action.to>>2)===1||(action.to>>2)===2?8:0);
      const exposed=piece!==KING && masksAttack(next,action.to,enemy)?(VALUES[piece]??0)/2:0;
      priority.set(action,capture+check+central-exposed);
    }
    return [...actions].sort((a,b)=>priority.get(b)-priority.get(a));
  }
  return [...actions].sort((a, b) => actionPriority(position, b) - actionPriority(position, a));
}

function actionPriority(position, action) {
  if (action.type === 'move' && position.board[action.to]) return 100 + VALUES[position.board[action.to].piece];
  if (action.type === 'move') return 20;
  if (action.type === 'drop') return 10 + VALUES[action.piece] / 100;
  return 0;
}
