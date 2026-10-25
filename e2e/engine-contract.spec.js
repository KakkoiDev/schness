import {test,expect} from '@playwright/test';

test('real browser worker supports exact requested levels, legal lines and legacy replies',async({page})=>{
 await page.goto('/src/search.js');
 const result=await page.evaluate(async()=>{
  const {createInitialPosition,applyAction,legalActions,actionKey}=await import('/src/rules.js');
  let position=createInitialPosition();position=applyAction(position,{type:'place-king',to:15});position=applyAction(position,{type:'place-king',to:0});
  const worker=new Worker('/src/bot-worker.js',{type:'module'});
  async function request(payload){return await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Worker timeout')),10000);worker.onmessage=({data})=>{clearTimeout(timer);resolve(data);};worker.onerror=e=>{clearTimeout(timer);reject(Error(e.message));};worker.postMessage({position,...payload});});}
  try {
   const levels=[];
   for(const strength of [0,1,11,100]){
    const reply=await request({strength,maxNodes:200,analyze:true,multiPv:3,request:String(strength)});
    if(reply.error)throw Error(reply.error);
    if(!legalActions(position).some(a=>actionKey(a)===actionKey(reply.action)))throw Error('Illegal worker action');
    for(const v of reply.analysis.variations){let p=position;for(const a of v.pv)p=applyAction(p,a);}
    levels.push({level:strength,requested:reply.analysis.requestedDepth,completed:reply.analysis.completedDepth,nodes:reply.analysis.nodes,stopped:reply.analysis.stopped});
   }
   const legacy=await request({depth:1,request:'legacy'}),invalid=await request({strength:101,request:'invalid'});
   return {levels,legacyKeys:Object.keys(legacy).sort(),invalid};
  } finally {worker.terminate();}
 });
 expect(result.levels.map(x=>x.requested)).toEqual([0,1,11,100]);
 expect(result.levels[0]).toMatchObject({completed:0,nodes:0,stopped:false});
 for(const r of result.levels){expect(r.nodes).toBeLessThanOrEqual(200);expect(r.completed).toBeLessThanOrEqual(r.requested);}
 expect(result.levels[3].stopped).toBe(true);
 expect(result.legacyKeys).toEqual(['action','request']);expect(result.invalid.request).toBe('invalid');expect(result.invalid.error).toContain('Level');
});

test('optimized worker preserves variant rights and legal continuations',async({page})=>{
 await page.goto('/src/search.js');
 const checked=await page.evaluate(async()=>{
  const rules=await import('/src/rules.js'),{VARIANTS}=await import('/src/variants.js');
  const worker=new Worker('/src/bot-worker.js',{type:'module'});
  try {
   let count=0;
   for(const [id,recipe] of Object.entries(VARIANTS)){
    let p=rules.createInitialPosition(recipe);
    for(let ply=0;ply<8;ply++){
     const actions=rules.legalActions(p);if(rules.getResult(p)||!actions.length)break;
     p=rules.applyAction(p,actions[(ply*7+3)%actions.length]);
    }
    if(rules.getResult(p))continue;
    const saved=JSON.stringify(p);
    const response=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Worker timeout '+id)),10000);worker.onmessage=({data})=>{clearTimeout(timeout);resolve(data);};worker.onerror=e=>{clearTimeout(timeout);reject(Error(e.message));};worker.postMessage({position:p,strength:100,maxNodes:256,analyze:true,multiPv:3,request:id});});
    if(response.error)throw Error(id+': '+response.error);
    if(response.request!==id||response.analysis.nodes>256)throw Error('Worker protocol/budget '+id);
    if(!rules.legalActions(p).some(a=>rules.actionKey(a)===rules.actionKey(response.action)))throw Error('Illegal action '+id);
    for(const v of response.analysis.variations){let q=p;for(const a of v.pv)q=rules.applyAction(q,a);}
    if(JSON.stringify(p)!==saved)throw Error('Mutated source '+id);count++;
   }
   return count;
  }finally{worker.terminate();}
 });
 expect(checked).toBeGreaterThan(20);
});
