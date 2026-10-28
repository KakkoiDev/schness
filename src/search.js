/** Two-player zero-sum search. The adapter owns all game-specific rules. */
export function strengthOptions(strength) {
  if (!Number.isInteger(strength) || strength < 0 || strength > 100) throw new RangeError('Level must be an integer 0–100');
  return {depth:strength, maxNodes:Infinity};
}

export function createSearchEngine(adapter) {
  for (const name of ['actions','apply','turn','terminal','evaluate','key']) {
    if (typeof adapter[name] !== 'function') throw new TypeError(`Missing search adapter: ${name}`);
  }
  if ((typeof adapter.make === 'function') !== (typeof adapter.unmake === 'function')) throw new TypeError('Reversible search requires both make and unmake');
  if (adapter.scoreStep !== undefined && (!Number.isFinite(adapter.scoreStep) || adapter.scoreStep <= 0)) throw new TypeError('Invalid score step');
  const STOP = Symbol('search budget exhausted');
  const order = (p, actions) => adapter.order ? adapter.order(p, actions) : actions;
  const finite = (value, label) => {
    if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
    return value;
  };
  function terminal(p, who, depth, facts) {
    const value = adapter.terminal(p, who, depth, facts);
    return value === null ? null : finite(value, 'Terminal score');
  }
  function optionsFor(options) {
    const merged = {...(options.strength === undefined ? {} : strengthOptions(options.strength)), ...options};
    merged.depth ??= 4;
    merged.quiescenceDepth ??= 0;
    merged.quiescenceEvasionDepth ??= 0;
    merged.rootPrincipalVariation ??= false;
    if(typeof merged.rootPrincipalVariation!=='boolean')throw new TypeError('Invalid rootPrincipalVariation');
    merged.forkThreatEvasions ??= false;
    if(typeof merged.forkThreatEvasions!=='boolean')throw new TypeError('Invalid forkThreatEvasions');
    if(merged.forkThreatEvasions && typeof adapter.quiescenceDanger!=='function')throw new TypeError('Fork threat evasions require adapter.quiescenceDanger');
    merged.cacheEvaluation ??= false;
    if(typeof merged.cacheEvaluation!=='boolean')throw new TypeError('Invalid cacheEvaluation');
    if(merged.cacheEvaluation && typeof adapter.evaluationKey!=='function')throw new TypeError('Evaluation cache requires adapter.evaluationKey');
    merged.cacheQuiescence ??= false;
    if(typeof merged.cacheQuiescence!=='boolean')throw new TypeError('Invalid cacheQuiescence');
    merged.quiescenceChecks ??= false;
    if(typeof merged.quiescenceChecks!=='boolean')throw new TypeError('Invalid quiescenceChecks');
    merged.reducePrincipalVariation ??= true;
    merged.protectHistoryMoves ??= false;
    for(const name of ['reducePrincipalVariation','protectHistoryMoves'])if(typeof merged[name]!=='boolean')throw new TypeError(`Invalid ${name}`);
    merged.stagedMoveSelection ??= false;
    if(typeof merged.stagedMoveSelection!=='boolean')throw new TypeError('Invalid stagedMoveSelection');
    merged.lateMoveReduction ??= false;
    if(typeof merged.lateMoveReduction!=='boolean')throw new TypeError('Invalid lateMoveReduction');
    if(merged.lateMoveReduction && typeof adapter.canReduce!=='function')throw new TypeError('Late move reduction requires adapter.canReduce');
    if(merged.onIteration!==undefined && typeof merged.onIteration!=='function')throw new TypeError('Invalid onIteration');
    merged.stopOnProvenWin ??= false;
    if(typeof merged.stopOnProvenWin!=='boolean')throw new TypeError('Invalid stopOnProvenWin');
    merged.multiPv ??= 1;
    merged.maxTableEntries ??= 50000;
    merged.aspirationWindow ??= 50;
    if(!Number.isFinite(merged.aspirationWindow) || merged.aspirationWindow<=0)throw new RangeError('Invalid aspiration window');
    for (const [name, min, max] of [['depth',0,100],['quiescenceDepth',0,8],['quiescenceEvasionDepth',0,8],['multiPv',1,10]]) {
      if (!Number.isInteger(merged[name]) || merged[name] < min || merged[name] > max) throw new RangeError(`Invalid ${name}`);
    }
    if (!Number.isInteger(merged.maxTableEntries) || merged.maxTableEntries < 1) throw new RangeError('Invalid table capacity');
    return merged;
  }
  function context(options) {
    const {maxNodes=Infinity, maxMillis=Infinity} = options;
    if (!(maxNodes === Infinity || Number.isInteger(maxNodes) && maxNodes >= 1)) throw new RangeError('Invalid node budget');
    if (!(maxMillis === Infinity || Number.isFinite(maxMillis) && maxMillis > 0)) throw new RangeError('Invalid time budget');
    return {options,nodes:0, quiescenceNodes:0, cutoffs:0, cacheHits:0, tableCutoffs:0, hintHits:0,
      evaluationCacheHits:0,rootResearches:0, aspirationResearches:0, pvsResearches:0, historyHits:0, evaluations:0, actionGenerations:0, countGenerations:0, transitions:0,
      reducedSearches:0,reductionResearches:0,protectedReductions:0,lateMoveReduction:options.lateMoveReduction,
      maxNodes, deadline:maxMillis === Infinity ? Infinity : Date.now()+maxMillis,
      maxTableEntries:options.maxTableEntries, quiescenceDepth:options.quiescenceDepth ?? 0,
      noisyOptions:Object.freeze({includeChecks:options.quiescenceChecks}),
      pvs:options.principalVariation !== false && adapter.scoreStep !== undefined,
      history:options.useHistory === false ? null : new Map(),killers:new Map(),ranks:new Map(),
      reversible:options.useMutable !== false && typeof adapter.make === 'function',
      evalCache:options.cacheEvaluation ? new Map() : null,
      qCache:options.useCache === false || !options.cacheQuiescence ? null : new Map(),
      cache:options.useCache === false ? null : new Map(), hints:options.useCache === false ? null : new Map()};
  }
  const actionIdentity = adapter.actionKey ?? (action => JSON.stringify(action));
  function boundedSet(table, key, value, ctx) {
    if (!table) return;
    if (!table.has(key) && table.size >= ctx.maxTableEntries) table.delete(table.keys().next().value);
    table.set(key,value);
  }
  function factsFor(p,ctx,preferCount=false) {
    let actions,count;
    const facts={
      options:ctx.options,
      actions(){if(actions===undefined){ctx.actionGenerations++;actions=adapter.actions(p);if(count!==undefined && count!==actions.length)throw new Error('Action count disagrees with legal actions');count=actions.length;}return actions;},
      actionCount(){
        if(count===undefined){
          if(preferCount && adapter.countActions){ctx.countGenerations++;count=adapter.countActions(p);if(!Number.isInteger(count)||count<0)throw new TypeError('Action count must be a nonnegative integer');}
          else count=facts.actions().length;
        }
        return count;
      },
    };
    return facts;
  }
  function apply(p,action,ctx) {ctx.transitions++;return adapter.apply(p,action);}
  function withChild(p,action,ctx,fn,cachedChild) {
    if(!ctx.reversible)return fn(cachedChild ?? apply(p,action,ctx));
    ctx.transitions++;
    const undo=adapter.make(p,action);
    try {return fn(p);} finally {adapter.unmake(p,undo);}
  }
  function ordered(p,actions,hint,ctx,depth) {
    const player=adapter.turn(p),killers=ctx.killers.get(depth) ?? [];
    if(ctx.options.stagedMoveSelection && adapter.orderIndependent===true){
      // Only independent per-move base scoring may be deferred by groups.
      // Each group owns its actions so nested searches cannot overwrite it.
      const groups=new Map();let hasHint=false;
      for(const action of actions){
        const id=actionIdentity(action),history=ctx.history?.get(`${player}:${id}`)??0;
        if(history)ctx.historyHits++;
        if(hint!==undefined && id===hint)hasHint=true;
        const killer=killers.indexOf(id),tactical=Number(Boolean(adapter.isTactical?.(p,action)));
        const rank=((Number(id===hint)*2+tactical)*3+(killer<0?0:2-killer))*1000001+history;
        const group=groups.get(rank)??[];group.push(action);groups.set(rank,group);
      }
      if(hasHint)ctx.hintHits++;
      const ranks=[...groups.keys()].sort((a,b)=>b-a);
      return (function*(){for(const rank of ranks)yield* order(p,groups.get(rank));})();
    }
    const sorted=[...order(p,actions)];
    const ranks=ctx.options.stagedMoveSelection?new Map():ctx.ranks,stride=sorted.length+1;
    ranks.clear();let hasHint=false;
    for(let index=0;index<sorted.length;index++){
      const action=sorted[index],id=actionIdentity(action),history=ctx.history?.get(`${player}:${id}`) ?? 0;
      if(history)ctx.historyHits++;
      if(hint!==undefined && id===hint)hasHint=true;
      const killer=killers.indexOf(id),tactical=Number(Boolean(adapter.isTactical?.(p,action)));
      // Same lexicographic order as before, without one wrapper object per move.
      ranks.set(action,((((Number(id===hint)*2+tactical)*3+(killer<0?0:2-killer))*1000001+history)*stride-index));
    }
    if(hasHint)ctx.hintHits++;
    if(ctx.options.stagedMoveSelection){
      // Per-node ranks must survive nested searches. Yield only as many moves
      // as alpha-beta consumes; ties retain the original stable ordering.
      return (function*(){
        const remaining=sorted.slice();
        while(remaining.length){
          let best=0;
          for(let i=1;i<remaining.length;i++)if(ranks.get(remaining[i])>ranks.get(remaining[best]))best=i;
          const action=remaining[best];remaining.splice(best,1);yield action;
        }
      })();
    }
    sorted.sort((a,b)=>ranks.get(b)-ranks.get(a));
    return sorted;
  }
  function cutoff(p,action,depth,ctx){
    ctx.cutoffs++;
    if(!ctx.history || adapter.isTactical?.(p,action))return;
    const id=actionIdentity(action),key=`${adapter.turn(p)}:${id}`;
    boundedSet(ctx.history,key,Math.min(1000000,(ctx.history.get(key)??0)+depth*depth),ctx);
    const killers=ctx.killers.get(depth)??[];
    ctx.killers.set(depth,[id,...killers.filter(x=>x!==id)].slice(0,2));
  }
  function enter(ctx, tactical) {
    if (ctx.nodes >= ctx.maxNodes || (ctx.deadline !== Infinity && Date.now() >= ctx.deadline)) throw STOP;
    ctx.nodes++;
    if (tactical) ctx.quiescenceNodes++;
  }
  function visit(p, depth, alpha, beta, player, ctx, remainingQ=ctx.quiescenceDepth, remainingEvasions=ctx.options.quiescenceEvasionDepth) {
    enter(ctx, depth <= 0 && (ctx.quiescenceDepth > 0 || ctx.options.quiescenceEvasionDepth > 0));
    const facts=factsFor(p,ctx,depth<=0 && !remainingQ);
    const result = terminal(p, player, Math.max(0,depth),facts);
    if (result !== null) return {value:result, line:null};
    const maximizing = adapter.turn(p) === player;
    if (depth <= 0) {
      const qKey=ctx.qCache ? JSON.stringify([adapter.key(p),remainingQ,remainingEvasions]) : null;
      const startAlpha=alpha,startBeta=beta,cached=qKey===null?null:ctx.qCache.get(qKey);
      if(cached){
        ctx.cacheHits++;
        if(cached.type==='exact')return {value:cached.value,line:cached.line};
        if(cached.type==='lower')alpha=Math.max(alpha,cached.value);else beta=Math.min(beta,cached.value);
        if(beta<=alpha){ctx.tableCutoffs++;return {value:cached.value,line:cached.line};}
      }
      const finish=best=>{
        if(qKey!==null)boundedSet(ctx.qCache,qKey,{...best,type:best.value<=startAlpha?'upper':best.value>=startBeta?'lower':'exact'},ctx);
        return best;
      };
      const evalKey=ctx.evalCache ? adapter.evaluationKey(p) : null;
      let standPat=ctx.evalCache?.get(evalKey);
      if(standPat!==undefined)ctx.evaluationCacheHits++;
      else{
        ctx.evaluations++;
        standPat=finite(adapter.evaluate(p,player,facts),'Evaluation');
        if(ctx.evalCache)boundedSet(ctx.evalCache,evalKey,standPat,ctx);
      }
      const danger = Boolean(adapter.inDanger?.(p)) || Boolean(ctx.options.forkThreatEvasions &&
        (remainingQ || remainingEvasions) && adapter.quiescenceDanger(p));
      // A separate bounded allowance resolves checks at the quiescence horizon.
      // It never permits stand-pat cutoffs while an evasion is being searched.
      if ((!remainingQ && !(danger && remainingEvasions)) || (!adapter.noisyActions && !adapter.inDanger && !adapter.quiescenceDanger)) return finish({value:standPat,line:null});
      let best = {value:danger ? (maximizing ? -Infinity : Infinity) : standPat, line:null};
      if (!danger) {
        if (maximizing) alpha = Math.max(alpha, standPat);
        else beta = Math.min(beta, standPat);
        if (beta <= alpha) {ctx.cutoffs++;return finish(best);}
      }
      const legal = facts.actions();
      if (!legal.length) throw new Error('Adapter must adjudicate a position without actions');
      const actions = danger ? legal : (adapter.noisyActions?.(p, legal, ctx.noisyOptions) ?? []);
      for (const action of order(p, actions)) {
        const child = withChild(p,action,ctx,next=>visit(next, 0, alpha,beta,player,ctx,Math.max(0,remainingQ-1),remainingQ ? remainingEvasions : remainingEvasions-1));
        if (maximizing ? child.value > best.value : child.value < best.value) best = {value:child.value,line:{action,next:child.line}};
        if (maximizing) alpha = Math.max(alpha,best.value);
        else beta = Math.min(beta,best.value);
        if (beta <= alpha) {ctx.cutoffs++;break;}
      }
      return finish(best);
    }
    const stateKey = ctx.cache ? adapter.key(p) : null;
    // Bounds require the same remaining depth: generic terminal scores may depend on depth.
    const key = ctx.cache ? `${stateKey}|${depth}` : null;
    const hintKey=ctx.hints ? (adapter.hintKey?.(p) ?? stateKey) : null;
    const startAlpha=alpha, startBeta=beta, cached=ctx.cache?.get(key);
    if (cached) {
      ctx.cacheHits++;
      if (cached.type === 'exact') return {value:cached.value,line:cached.line};
      if (cached.type === 'lower') alpha = Math.max(alpha,cached.value);
      else beta = Math.min(beta,cached.value);
      if (beta <= alpha) {ctx.tableCutoffs++;return {value:cached.value,line:cached.line};}
    }
    const actions = ordered(p,facts.actions(),ctx.hints?.get(hintKey),ctx,depth);
    if (!facts.actionCount()) throw new Error('Adapter must adjudicate a position without actions');
    let best = {value:maximizing ? -Infinity : Infinity,line:null};
    let moveIndex=0;
    for (const action of actions) {
      const id=ctx.options.protectHistoryMoves?actionIdentity(action):null;
      const protectedMove=ctx.options.protectHistoryMoves && ((ctx.killers.get(depth)??[]).includes(id) ||
        (ctx.history?.get(`${adapter.turn(p)}:${id}`)??0)>=depth*depth);
      const eligible=ctx.lateMoveReduction && depth>=3 && moveIndex>=3 &&
        (ctx.options.reducePrincipalVariation || beta-alpha<=(adapter.scoreStep??1)) &&
        adapter.canReduce(p,action,ctx.options);
      if(eligible && protectedMove)ctx.protectedReductions++;
      const reduce=eligible && !protectedMove;
      moveIndex++;
      const child = withChild(p,action,ctx,next=>{
        // Experimental selective search, never part of the exact default mode.
        // A reduced fail-low can still hide a full-depth tactical improvement.
        if(reduce && !adapter.inDanger?.(next)){
          ctx.reducedSearches++;
          const reduced=visit(next,depth-2,alpha,beta,player,ctx);
          if(maximizing?reduced.value<=alpha:reduced.value>=beta)return reduced;
          ctx.reductionResearches++;
        }
        if(!ctx.pvs || !Number.isFinite(best.value))return visit(next,depth-1,alpha,beta,player,ctx);
        const step=adapter.scoreStep;
        let result=maximizing?visit(next,depth-1,alpha,Math.min(beta,alpha+step),player,ctx)
          :visit(next,depth-1,Math.max(alpha,beta-step),beta,player,ctx);
        if(result.value>alpha && result.value<beta){ctx.pvsResearches++;result=visit(next,depth-1,alpha,beta,player,ctx);}
        return result;
      });
      if (maximizing ? child.value > best.value : child.value < best.value) best = {value:child.value,line:{action,next:child.line}};
      if (maximizing) alpha=Math.max(alpha,best.value);
      else beta=Math.min(beta,best.value);
      if (beta <= alpha) {cutoff(p,action,depth,ctx);break;}
    }
    boundedSet(ctx.cache,key,{...best,type:best.value<=startAlpha ? 'upper' : best.value>=startBeta ? 'lower' : 'exact'},ctx);
    boundedSet(ctx.hints,hintKey,actionIdentity(best.line.action),ctx);
    return best;
  }
  function choose(position, options={}) {
    options=optionsFor(options);
    const ctx=context(options);
    if(ctx.reversible)position=adapter.prepare?adapter.prepare(position,options):structuredClone(position);
    const player=adapter.turn(position);
    const rootFacts=factsFor(position,ctx);
    const outcome=terminal(position,player,options.depth,rootFacts);
    if (outcome !== null) return {action:null,score:outcome,requestedDepth:options.depth,nodes:0,quiescenceNodes:0,completedDepth:0,stopped:false,pv:[],variations:[]};
    let actions=order(position,rootFacts.actions());
    if (!actions.length) throw new Error('Adapter must adjudicate a position without actions');
    if (options.depth === 0) return {action:actions[0],score:null,completedDepth:0,requestedDepth:0,stopped:false,pv:[],variations:[],nodes:0,quiescenceNodes:0};
    let completed={action:actions[0],score:null,completedDepth:0,stopped:false,pv:[],variations:[]};
    const iterative=Number.isFinite(options.maxNodes) || Number.isFinite(options.maxMillis) || options.iterativeDeepening === true;
    const rootChildren=new Map();
    try {
      for (let depth=iterative ? 1 : options.depth; depth<=options.depth; depth++) {
        const iteration=(lower,upper)=>{
        let selected=null, repetitions=Infinity, ties=0;
        const lines=[];
        for (const action of actions) {
          let next;
          if(!ctx.reversible){
            next=rootChildren.get(action);
            if(next===undefined){next=apply(position,action,ctx);rootChildren.set(action,next);}
          }
          const {rep,child}=withChild(position,action,ctx,next=>{
            const rep=options.repetitionAversion ? (adapter.repetitions?.(next) ?? 0) : 0;
            const alpha=options.multiPv === 1 ? Math.max(lower,selected?.score ?? -Infinity) : -Infinity;
            const probe=options.rootPrincipalVariation && ctx.pvs && options.multiPv===1 && selected && Number.isFinite(alpha);
            let child=visit(next,depth-1,alpha,probe?Math.min(upper,alpha+adapter.scoreStep):upper,player,ctx);
            if(probe && child.value>alpha && child.value<upper){
              ctx.pvsResearches++;
              child=visit(next,depth-1,alpha,upper,player,ctx);
            }
            // Fail-low equality is a bound. Resolve it before tie selection.
            if(selected && alpha!==-Infinity && child.value===selected.score &&
                (rep<repetitions || typeof options.random==='function')){
              ctx.rootResearches++;
              child=visit(next,depth-1,-Infinity,Infinity,player,ctx);
            }
            return {rep,child};
          },next);
          const pv=[action];for(let link=child.line;link;link=link.next)pv.push(link.action);
          const line={action,score:child.value,pv};
          lines.push({line,rep});
          if (!selected || line.score>selected.score || line.score===selected.score && rep<repetitions) {
            selected=line; repetitions=rep; ties=1;
          } else if (line.score===selected.score && rep===repetitions && typeof options.random==='function') {
            ties++;
            if (options.random()<1/ties) selected=line;
          }
          if(selected.score>=upper)break;
        }
        lines.sort((a,b)=>b.line.score-a.line.score || a.rep-b.rep);
        const ranked=[selected,...lines.map(x=>x.line).filter(line=>line!==selected)];
        return {...selected,ranked};
        };
        const aspiration=options.aspiration !== false && adapter.scoreStep !== undefined && options.multiPv===1 && Number.isFinite(completed.score);
        let window=options.aspirationWindow,lower=aspiration?completed.score-window:-Infinity,upper=aspiration?completed.score+window:Infinity;
        let result=iteration(lower,upper),retries=0;
        while(result.score<=lower || result.score>=upper){
          ctx.aspirationResearches++;window*=4;retries++;
          lower=retries<3?completed.score-window:-Infinity;
          upper=retries<3?completed.score+window:Infinity;
          result=iteration(lower,upper);
        }
        const {ranked,...selected}=result;
        completed={...selected,completedDepth:depth,stopped:false,variations:ranked.slice(0,options.multiPv)};
        // Publish and reorder only a fully completed, exact iteration.
        actions=ranked.map(line=>line.action);
        options.onIteration?.({depth,score:completed.score,nodes:ctx.nodes,pv:[...completed.pv]});
        // A selective fail-low may have skipped a defense: never call it a proof.
        if(options.stopOnProvenWin && !options.lateMoveReduction && !options.forkThreatEvasions && adapter.isProvenWin?.(completed.score))break;
      }
    } catch (error) {
      if (error !== STOP) throw error;
      completed.stopped=true;
    }
    return {...completed,requestedDepth:options.depth,nodes:ctx.nodes,quiescenceNodes:ctx.quiescenceNodes,
      stats:{cutoffs:ctx.cutoffs,cacheHits:ctx.cacheHits,tableCutoffs:ctx.tableCutoffs,hintHits:ctx.hintHits,
        rootResearches:ctx.rootResearches,pvsResearches:ctx.pvsResearches,aspirationResearches:ctx.aspirationResearches,historyHits:ctx.historyHits,evaluations:ctx.evaluations,actionGenerations:ctx.actionGenerations,countGenerations:ctx.countGenerations,
        reducedSearches:ctx.reducedSearches,reductionResearches:ctx.reductionResearches,protectedReductions:ctx.protectedReductions,
        transitions:ctx.transitions,tableEntries:ctx.cache?.size ?? 0,hintEntries:ctx.hints?.size ?? 0}};
  }
  function score(position, player, depth=3, options={}) {
    if (!Number.isInteger(depth) || depth<0 || depth>100) throw new RangeError('Depth must be 0–100');
    const resolved=optionsFor({...options,depth:Math.max(1,depth)});
    const ctx=context(resolved);
    if(ctx.reversible)position=adapter.prepare?adapter.prepare(position,resolved):structuredClone(position);
    return visit(position,depth,-Infinity,Infinity,player,ctx).value;
  }
  return Object.freeze({choose,score});
}
