/** Two-player, zero-sum alpha-beta search. Rules and objectives belong to the adapter. */
export function strengthOptions(strength) {
  if (!Number.isFinite(strength) || strength < 0 || strength > 100) throw new RangeError('Strength must be 0–100');
  return {depth:1+Math.floor(strength/20),maxNodes:Math.round(256*2**(strength/10))};
}

export function createSearchEngine(adapter) {
  for (const key of ['actions','apply','turn','terminal','evaluate','key']) if(typeof adapter[key]!=='function') throw new TypeError(`Missing search adapter: ${key}`);
  const order=(p,a)=>adapter.order?adapter.order(p,a):a;
  const STOP=Symbol('search budget exhausted');
  const terminal=(p,who,d)=>{const score=adapter.terminal(p,who,d);if(score!==null&&!Number.isFinite(score))throw new TypeError('Terminal score must be finite or null');return score;};
  function context(options) {
    const {maxNodes=Infinity,maxMillis=Infinity}=options;
    if (!(maxNodes===Infinity||Number.isInteger(maxNodes)&&maxNodes>=1)) throw new RangeError('Invalid node budget');
    if (!(maxMillis===Infinity||Number.isFinite(maxMillis)&&maxMillis>0)) throw new RangeError('Invalid time budget');
    return {nodes:0,deadline:Date.now()+maxMillis,maxNodes,cache:options.useCache===false?null:new Map()};
  }
  function visit(p,depth,alpha,beta,player,ctx) {
    if(ctx.nodes>=ctx.maxNodes||Date.now()>=ctx.deadline)throw STOP;
    ctx.nodes++;
    const result=terminal(p,player,depth);
    if(result!==null)return result;
    if(depth<=0)return adapter.evaluate(p,player);
    const key=ctx.cache?`${adapter.key(p)}|${depth}|${player}`:null;
    const startAlpha=alpha,startBeta=beta,cached=ctx.cache?.get(key);
    if(cached){if(cached.type==='exact')return cached.value;if(cached.type==='lower')alpha=Math.max(alpha,cached.value);else beta=Math.min(beta,cached.value);if(alpha>=beta)return cached.value;}
    const maximizing=adapter.turn(p)===player;
    let value=maximizing?-Infinity:Infinity;
    const actions=order(p,adapter.actions(p));
    if(!actions.length)throw new Error('Adapter must adjudicate a position without actions');
    for(const action of actions){const score=visit(adapter.apply(p,action),depth-1,alpha,beta,player,ctx);if(maximizing){value=Math.max(value,score);alpha=Math.max(alpha,value);}else{value=Math.min(value,score);beta=Math.min(beta,value);}if(beta<=alpha)break;}
    ctx.cache?.set(key,{value,type:value<=startAlpha?'upper':value>=startBeta?'lower':'exact'});return value;
  }
  function optionsFor(options){const merged={...(options.strength===undefined?{}:strengthOptions(options.strength)),...options};merged.depth??=4;if(!Number.isInteger(merged.depth)||merged.depth<1||merged.depth>12)throw new RangeError('Depth must be 1–12');return merged;}
  function choose(position,options={}) {
    options=optionsFor(options);const ctx=context(options),player=adapter.turn(position);
    const result=terminal(position,player,options.depth);
    if(result!==null)return {action:null,score:result,nodes:0,completedDepth:0,stopped:false};
    const actions=order(position,adapter.actions(position));if(!actions.length)throw new Error('Adapter must adjudicate a position without actions');
    let completed={action:actions[0],score:null,nodes:0,completedDepth:0,stopped:false};
    const iterative=Number.isFinite(options.maxNodes)||Number.isFinite(options.maxMillis);
    try {for(let depth=iterative?1:options.depth;depth<=options.depth;depth++){
      let action=actions[0],score=-Infinity,repetitions=Infinity,ties=0;
      for(const candidate of actions){const next=adapter.apply(position,candidate);const value=visit(next,depth-1,-Infinity,Infinity,player,ctx);const rep=options.repetitionAversion?(adapter.repetitions?.(next)??0):0;
        if(value>score||value===score&&rep<repetitions){score=value;repetitions=rep;action=candidate;ties=1;}else if(value===score&&rep===repetitions&&typeof options.random==='function'){ties++;if(options.random()<1/ties)action=candidate;}}
      completed={action,score,nodes:ctx.nodes,completedDepth:depth,stopped:false};
    }}catch(e){if(e!==STOP)throw e;completed.stopped=true;}
    return {...completed,nodes:ctx.nodes};
  }
  function score(position,player,depth=3){if(!Number.isInteger(depth)||depth<0||depth>12)throw new RangeError('Depth must be 0–12');return visit(position,depth,-Infinity,Infinity,player,context({}));}
  return Object.freeze({choose,score});
}
