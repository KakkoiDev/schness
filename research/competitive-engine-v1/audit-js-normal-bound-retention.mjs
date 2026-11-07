import {cp, mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';

const run=resolve(process.argv[2]);
await mkdir(run);
const base=resolve(run,'baseline'), audit=resolve(run,'instrumented');
await cp('src',base,{recursive:true});
await cp(base,audit,{recursive:true});
await writeFile(resolve(run,'package.json'),'{"type":"module"}\n');
const searchPath=resolve(audit,'search.js');
let code=await readFile(searchPath,'utf8');
function replace(from,to){
  if(code.split(from).length!==2) throw Error('Unexpected source anchor: '+from);
  code=code.replace(from,to);
}
replace('evalCache:options.cacheEvaluation','shadow:new Map(), evalCache:options.cacheEvaluation');
replace('const startAlpha=alpha, startBeta=beta, cached=ctx.cache?.get(key);',`const startAlpha=alpha, startBeta=beta, cached=ctx.cache?.get(key);
    const seen=ctx.shadow.get(key);
    if(cached && cached.type!=='exact' && seen && seen.lower<=seen.upper){
      const a=cached.type==='lower'?Math.max(alpha,cached.value):alpha;
      const b=cached.type==='upper'?Math.min(beta,cached.value):beta;
      if(a<b && Math.max(a,seen.lower)>=Math.min(b,seen.upper))
        ctx.options.onBoundAudit('potential',{key,depth,alpha,beta,cached:{type:cached.type,value:cached.value},...seen});
    }`);
replace("boundedSet(ctx.cache,key,{...best,type:best.value<=startAlpha ? 'upper' : best.value>=startBeta ? 'lower' : 'exact'},ctx);",`const entry={...best,type:best.value<=startAlpha ? 'upper' : best.value>=startBeta ? 'lower' : 'exact'};
    if(ctx.cache){
      if(!ctx.cache.has(key) && ctx.cache.size>=ctx.maxTableEntries)ctx.shadow.delete(ctx.cache.keys().next().value);
      if(entry.type==='exact')ctx.shadow.delete(key);
      else {
        if(cached && cached.type!=='exact' && cached.type!==entry.type)ctx.options.onBoundAudit('replacements');
        const s=ctx.shadow.get(key)??{lower:-Infinity,upper:Infinity};
        if(entry.type==='lower')s.lower=Math.max(s.lower,entry.value);
        else s.upper=Math.min(s.upper,entry.value);
        if(s.lower>s.upper)ctx.options.onBoundAudit('inversions');
        ctx.shadow.set(key,s);
      }
    }
    boundedSet(ctx.cache,key,entry,ctx);`);
await writeFile(searchPath,code);
const path='research/competitive-engine-v1/js-legal-recaptures.json';
const input=await readFile(path);
const cases=JSON.parse(input).cases.slice(0,128).filter((_,i)=>i%4===0);
if(cases.length!==32)throw Error('Unexpected sample size');
const hash=createHash('sha256').update(input).digest('hex');
await writeFile(resolve(run,'inputs.json'),JSON.stringify({path,hash,cases},null,2));
const mod=(dir,file)=>import(pathToFileURL(resolve(dir,file)).href);
const [original,observed,rules]=await Promise.all([mod(base,'bot.js'),mod(audit,'bot.js'),mod(base,'rules.js')]);
const shared={profile:'competitive',iterativeDeepening:true,quiescenceDepth:4,quiescenceChecks:true,quiescenceEvasionDepth:2,cacheEvaluation:true,cacheQuiescence:false,reducePrincipalVariation:true,reduceQuietDrops:false,stopOnProvenWin:false};
const arms=[{...shared,depth:4,lateMoveReduction:false,maxNodes:100000,maxMillis:200},{...shared,depth:20,lateMoveReduction:true,maxMillis:100}];
const results=[], errors=[];
for(const [arm,options] of arms.entries()){
  const rows=[],examples=[];
  for(const instrumented of [true,false]){
    for(const [index,c] of cases.entries()){
      const counters={replacements:0,inversions:0,potential:0},snapshot=JSON.stringify(c.position);
      const onBoundAudit=(kind,event)=>{counters[kind]++;if(event&&examples.length<12)examples.push({index,id:c.id,...event});};
      const start=performance.now();
      const result=(instrumented?observed:original).analyzeAction(c.position,{...options,...(instrumented?{onBoundAudit}:{})});
      const ms=performance.now()-start;
      if(JSON.stringify(c.position)!==snapshot)errors.push({arm,instrumented,index,error:'Input changed'});
      let p=c.position;
      try{
        if(!rules.legalActionsUnchecked(p).some(a=>rules.actionKey(a)===rules.actionKey(result.action)))throw Error('Invalid root action');
        if(result.pv.length&&rules.actionKey(result.pv[0])!==rules.actionKey(result.action))throw Error('PV starts with another action');
        for(const a of result.pv)p=rules.applyAction(p,a);
      }catch(e){errors.push({arm,instrumented,index,error:String(e)});}
      rows.push({index,id:c.id,instrumented,counters,ms,result});
    }
  }
  let joint=0;
  if(arm===0)for(let i=0;i<32;i++){
    const a=rows[i].result,b=rows[32+i].result;
    if(a.completedDepth!==4||b.completedDepth!==4)continue;
    joint++;
    for(const k of ['action','score','completedDepth','nodes','pv'])if(JSON.stringify(a[k])!==JSON.stringify(b[k]))errors.push({arm,index:i,mismatch:k});
  }
  const auditRows=rows.slice(0,32);
  results.push({options,rows,examples,joint,roots:auditRows.filter(r=>r.counters.potential>0).length,
    totals:Object.fromEntries(['replacements','inversions','potential'].map(k=>[k,auditRows.reduce((sum,r)=>sum+r.counters[k],0)]))});
}
const pass=errors.length===0&&results[0].joint>0&&results[0].totals.inversions===0&&results.every(r=>r.roots>=8&&r.totals.potential>=32);
const summary={pass,errors,arms:results.map(({joint,roots,totals,rows})=>({joint,roots,totals,depths:[rows.slice(0,32),rows.slice(32)].map(group=>group.map(r=>r.result.completedDepth))}))};
await writeFile(resolve(run,'results.json'),JSON.stringify({summary,results,system:{node:process.version,platform:process.platform,arch:process.arch}},null,2));
console.log(JSON.stringify(summary));
