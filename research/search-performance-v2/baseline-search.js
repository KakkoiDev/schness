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
  function terminal(p, who, depth) {
    const value = adapter.terminal(p, who, depth);
    return value === null ? null : finite(value, 'Terminal score');
  }
  function optionsFor(options) {
    const merged = {...(options.strength === undefined ? {} : strengthOptions(options.strength)), ...options};
    merged.depth ??= 4;
    merged.quiescenceDepth ??= 0;
    merged.multiPv ??= 1;
    for (const [name, min, max] of [['depth',0,100],['quiescenceDepth',0,8],['multiPv',1,10]]) {
      if (!Number.isInteger(merged[name]) || merged[name] < min || merged[name] > max) throw new RangeError(`Invalid ${name}`);
    }
    return merged;
  }
  function context(options) {
    const {maxNodes=Infinity, maxMillis=Infinity} = options;
    if (!(maxNodes === Infinity || Number.isInteger(maxNodes) && maxNodes >= 1)) throw new RangeError('Invalid node budget');
    if (!(maxMillis === Infinity || Number.isFinite(maxMillis) && maxMillis > 0)) throw new RangeError('Invalid time budget');
    return {nodes:0, quiescenceNodes:0, maxNodes, deadline:Date.now()+maxMillis,
      quiescenceDepth:options.quiescenceDepth ?? 0, cache:options.useCache === false ? null : new Map()};
  }
  function enter(ctx, tactical) {
    if (ctx.nodes >= ctx.maxNodes || Date.now() >= ctx.deadline) throw STOP;
    ctx.nodes++;
    if (tactical) ctx.quiescenceNodes++;
  }
  function visit(p, depth, alpha, beta, player, ctx, remainingQ=ctx.quiescenceDepth) {
    enter(ctx, depth <= 0);
    const result = terminal(p, player, Math.max(0,depth));
    if (result !== null) return {value:result, pv:[]};
    const maximizing = adapter.turn(p) === player;
    if (depth <= 0) {
      const standPat = finite(adapter.evaluate(p, player), 'Evaluation');
      if (!remainingQ || (!adapter.noisyActions && !adapter.inDanger)) return {value:standPat,pv:[]};
      const danger = Boolean(adapter.inDanger?.(p));
      let best = {value:danger ? (maximizing ? -Infinity : Infinity) : standPat, pv:[]};
      if (!danger) {
        if (maximizing) alpha = Math.max(alpha, standPat);
        else beta = Math.min(beta, standPat);
        if (beta <= alpha) return best;
      }
      const legal = adapter.actions(p);
      if (!legal.length) throw new Error('Adapter must adjudicate a position without actions');
      const actions = danger ? legal : (adapter.noisyActions?.(p, legal) ?? []);
      for (const action of order(p, actions)) {
        const child = visit(adapter.apply(p,action), 0, alpha,beta,player,ctx,remainingQ-1);
        if (maximizing ? child.value > best.value : child.value < best.value) best = {value:child.value,pv:[action,...child.pv]};
        if (maximizing) alpha = Math.max(alpha,best.value);
        else beta = Math.min(beta,best.value);
        if (beta <= alpha) break;
      }
      return best;
    }
    const key = ctx.cache ? `${adapter.key(p)}|${depth}|q:${ctx.quiescenceDepth}|${player}` : null;
    const startAlpha=alpha, startBeta=beta, cached=ctx.cache?.get(key);
    if (cached) {
      if (cached.type === 'exact') return {value:cached.value,pv:cached.pv};
      if (cached.type === 'lower') alpha = Math.max(alpha,cached.value);
      else beta = Math.min(beta,cached.value);
      if (beta <= alpha) return {value:cached.value,pv:cached.pv};
    }
    const actions = order(p,adapter.actions(p));
    if (!actions.length) throw new Error('Adapter must adjudicate a position without actions');
    let best = {value:maximizing ? -Infinity : Infinity,pv:[]};
    for (const action of actions) {
      const child = visit(adapter.apply(p,action),depth-1,alpha,beta,player,ctx);
      if (maximizing ? child.value > best.value : child.value < best.value) best = {value:child.value,pv:[action,...child.pv]};
      if (maximizing) alpha=Math.max(alpha,best.value);
      else beta=Math.min(beta,best.value);
      if (beta <= alpha) break;
    }
    ctx.cache?.set(key,{...best,type:best.value<=startAlpha ? 'upper' : best.value>=startBeta ? 'lower' : 'exact'});
    return best;
  }
  function choose(position, options={}) {
    options=optionsFor(options);
    const ctx=context(options), player=adapter.turn(position);
    const outcome=terminal(position,player,options.depth);
    if (outcome !== null) return {action:null,score:outcome,requestedDepth:options.depth,nodes:0,quiescenceNodes:0,completedDepth:0,stopped:false,pv:[],variations:[]};
    let actions=order(position,adapter.actions(position));
    if (!actions.length) throw new Error('Adapter must adjudicate a position without actions');
    if (options.depth === 0) return {action:actions[0],score:null,completedDepth:0,requestedDepth:0,stopped:false,pv:[],variations:[],nodes:0,quiescenceNodes:0};
    let completed={action:actions[0],score:null,completedDepth:0,stopped:false,pv:[],variations:[]};
    const iterative=Number.isFinite(options.maxNodes) || Number.isFinite(options.maxMillis) || options.iterativeDeepening === true;
    try {
      for (let depth=iterative ? 1 : options.depth; depth<=options.depth; depth++) {
        let selected=null, repetitions=Infinity, ties=0;
        const lines=[];
        for (const action of actions) {
          const next=adapter.apply(position,action);
          const child=visit(next,depth-1,-Infinity,Infinity,player,ctx);
          const rep=options.repetitionAversion ? (adapter.repetitions?.(next) ?? 0) : 0;
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
    return {...completed,requestedDepth:options.depth,nodes:ctx.nodes,quiescenceNodes:ctx.quiescenceNodes};
  }
  function score(position, player, depth=3, options={}) {
    if (!Number.isInteger(depth) || depth<0 || depth>100) throw new RangeError('Depth must be 0–100');
    const resolved=optionsFor({...options,depth:Math.max(1,depth)});
    return visit(position,depth,-Infinity,Infinity,player,context(resolved)).value;
  }
  return Object.freeze({choose,score});
}
