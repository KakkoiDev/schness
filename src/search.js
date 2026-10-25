/** Two-player zero-sum search. The adapter owns all game-specific rules. */
export function strengthOptions(strength) {
  if (!Number.isInteger(strength) || strength < 0 || strength > 100) throw new RangeError('Level must be an integer 0–100');
  return {depth:strength, maxNodes:262144};
}

export function createSearchEngine(adapter) {
  for (const name of ['actions','apply','turn','terminal','evaluate','key']) {
    if (typeof adapter[name] !== 'function') throw new TypeError(`Missing search adapter: ${name}`);
  }
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
    merged.multiPv ??= 1;
    merged.maxTableEntries ??= 50000;
    for (const [name, min, max] of [['depth',0,100],['quiescenceDepth',0,8],['multiPv',1,10]]) {
      if (!Number.isInteger(merged[name]) || merged[name] < min || merged[name] > max) throw new RangeError(`Invalid ${name}`);
    }
    if (!Number.isInteger(merged.maxTableEntries) || merged.maxTableEntries < 1) throw new RangeError('Invalid table capacity');
    return merged;
  }
  function context(options) {
    const {maxNodes=Infinity, maxMillis=Infinity} = options;
    if (!(maxNodes === Infinity || Number.isInteger(maxNodes) && maxNodes >= 1)) throw new RangeError('Invalid node budget');
    if (!(maxMillis === Infinity || Number.isFinite(maxMillis) && maxMillis > 0)) throw new RangeError('Invalid time budget');
    return {nodes:0, quiescenceNodes:0, cutoffs:0, cacheHits:0, tableCutoffs:0, hintHits:0,
      rootResearches:0, evaluations:0, actionGenerations:0, transitions:0,
      maxNodes, deadline:maxMillis === Infinity ? Infinity : Date.now()+maxMillis,
      maxTableEntries:options.maxTableEntries, quiescenceDepth:options.quiescenceDepth ?? 0,
      cache:options.useCache === false ? null : new Map(), hints:options.useCache === false ? null : new Map()};
  }
  const actionIdentity = adapter.actionKey ?? (action => JSON.stringify(action));
  function boundedSet(table, key, value, ctx) {
    if (!table) return;
    if (!table.has(key) && table.size >= ctx.maxTableEntries) table.delete(table.keys().next().value);
    table.set(key,value);
  }
  function factsFor(p,ctx) {
    let actions;
    return {actions() {if (actions === undefined) {ctx.actionGenerations++;actions=adapter.actions(p);}return actions;}};
  }
  function apply(p,action,ctx) {ctx.transitions++;return adapter.apply(p,action);}
  function ordered(p,actions,hint,ctx) {
    const sorted=order(p,actions);
    if (hint === undefined) return sorted;
    const i=sorted.findIndex(a=>actionIdentity(a)===hint);
    if (i < 0) return sorted;
    ctx.hintHits++;
    return i === 0 ? sorted : [sorted[i],...sorted.slice(0,i),...sorted.slice(i+1)];
  }
  function enter(ctx, tactical) {
    if (ctx.nodes >= ctx.maxNodes || (ctx.deadline !== Infinity && Date.now() >= ctx.deadline)) throw STOP;
    ctx.nodes++;
    if (tactical) ctx.quiescenceNodes++;
  }
  function visit(p, depth, alpha, beta, player, ctx, remainingQ=ctx.quiescenceDepth) {
    enter(ctx, depth <= 0 && ctx.quiescenceDepth > 0);
    const facts=factsFor(p,ctx);
    const result = terminal(p, player, Math.max(0,depth),facts);
    if (result !== null) return {value:result, pv:[]};
    const maximizing = adapter.turn(p) === player;
    if (depth <= 0) {
      ctx.evaluations++;
      const standPat = finite(adapter.evaluate(p, player,facts), 'Evaluation');
      if (!remainingQ || (!adapter.noisyActions && !adapter.inDanger)) return {value:standPat,pv:[]};
      const danger = Boolean(adapter.inDanger?.(p));
      let best = {value:danger ? (maximizing ? -Infinity : Infinity) : standPat, pv:[]};
      if (!danger) {
        if (maximizing) alpha = Math.max(alpha, standPat);
        else beta = Math.min(beta, standPat);
        if (beta <= alpha) {ctx.cutoffs++;return best;}
      }
      const legal = facts.actions();
      if (!legal.length) throw new Error('Adapter must adjudicate a position without actions');
      const actions = danger ? legal : (adapter.noisyActions?.(p, legal) ?? []);
      for (const action of order(p, actions)) {
        const child = visit(apply(p,action,ctx), 0, alpha,beta,player,ctx,remainingQ-1);
        if (maximizing ? child.value > best.value : child.value < best.value) best = {value:child.value,pv:[action,...child.pv]};
        if (maximizing) alpha = Math.max(alpha,best.value);
        else beta = Math.min(beta,best.value);
        if (beta <= alpha) {ctx.cutoffs++;break;}
      }
      return best;
    }
    const stateKey = ctx.cache ? adapter.key(p) : null;
    // Bounds require the same remaining depth: generic terminal scores may depend on depth.
    const key = ctx.cache ? `${stateKey}|${depth}` : null;
    const startAlpha=alpha, startBeta=beta, cached=ctx.cache?.get(key);
    if (cached) {
      ctx.cacheHits++;
      if (cached.type === 'exact') return {value:cached.value,pv:cached.pv};
      if (cached.type === 'lower') alpha = Math.max(alpha,cached.value);
      else beta = Math.min(beta,cached.value);
      if (beta <= alpha) {ctx.tableCutoffs++;return {value:cached.value,pv:cached.pv};}
    }
    const actions = ordered(p,facts.actions(),ctx.hints?.get(stateKey),ctx);
    if (!actions.length) throw new Error('Adapter must adjudicate a position without actions');
    let best = {value:maximizing ? -Infinity : Infinity,pv:[]};
    for (const action of actions) {
      const child = visit(apply(p,action,ctx),depth-1,alpha,beta,player,ctx);
      if (maximizing ? child.value > best.value : child.value < best.value) best = {value:child.value,pv:[action,...child.pv]};
      if (maximizing) alpha=Math.max(alpha,best.value);
      else beta=Math.min(beta,best.value);
      if (beta <= alpha) {ctx.cutoffs++;break;}
    }
    boundedSet(ctx.cache,key,{...best,type:best.value<=startAlpha ? 'upper' : best.value>=startBeta ? 'lower' : 'exact'},ctx);
    boundedSet(ctx.hints,stateKey,actionIdentity(best.pv[0]),ctx);
    return best;
  }
  function choose(position, options={}) {
    options=optionsFor(options);
    const ctx=context(options), player=adapter.turn(position);
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
        let selected=null, repetitions=Infinity, ties=0;
        const lines=[];
        for (const action of actions) {
          let next=rootChildren.get(action);
          if (next === undefined) {next=apply(position,action,ctx);rootChildren.set(action,next);}
          const rep=options.repetitionAversion ? (adapter.repetitions?.(next) ?? 0) : 0;
          // Play carries the best root score forward. Multi-PV needs exact scores for every root.
          const alpha=options.multiPv === 1 && selected ? selected.score : -Infinity;
          let child=visit(next,depth-1,alpha,Infinity,player,ctx);
          // A fail-low equality is a bound, not a proven tie. Resolve it before random/repetition selection.
          if (selected && alpha !== -Infinity && child.value === selected.score &&
              (rep < repetitions || typeof options.random === 'function')) {
            ctx.rootResearches++;
            child=visit(next,depth-1,-Infinity,Infinity,player,ctx);
          }
          const line={action,score:child.value,pv:[action,...child.pv]};
          lines.push({line,rep});
          if (!selected || line.score>selected.score || line.score===selected.score && rep<repetitions) {
            selected=line; repetitions=rep; ties=1;
          } else if (line.score===selected.score && rep===repetitions && typeof options.random==='function') {
            ties++;
            if (options.random()<1/ties) selected=line;
          }
        }
        lines.sort((a,b)=>b.line.score-a.line.score || a.rep-b.rep);
        const ranked=[selected,...lines.map(x=>x.line).filter(line=>line!==selected)];
        completed={...selected,completedDepth:depth,stopped:false,variations:ranked.slice(0,options.multiPv)};
        // Previous completed scores order the next iteration; never publish a partial iteration.
        actions=ranked.map(line=>line.action);
      }
    } catch (error) {
      if (error !== STOP) throw error;
      completed.stopped=true;
    }
    return {...completed,requestedDepth:options.depth,nodes:ctx.nodes,quiescenceNodes:ctx.quiescenceNodes,
      stats:{cutoffs:ctx.cutoffs,cacheHits:ctx.cacheHits,tableCutoffs:ctx.tableCutoffs,hintHits:ctx.hintHits,
        rootResearches:ctx.rootResearches,evaluations:ctx.evaluations,actionGenerations:ctx.actionGenerations,
        transitions:ctx.transitions,tableEntries:ctx.cache?.size ?? 0,hintEntries:ctx.hints?.size ?? 0}};
  }
  function score(position, player, depth=3, options={}) {
    if (!Number.isInteger(depth) || depth<0 || depth>100) throw new RangeError('Depth must be 0–100');
    const resolved=optionsFor({...options,depth:Math.max(1,depth)});
    return visit(position,depth,-Infinity,Infinity,player,context(resolved)).value;
  }
  return Object.freeze({choose,score});
}
