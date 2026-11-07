import {copyFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';

const run=resolve(process.argv[2]);
await mkdir(run);
const base=resolve(run,'baseline'), audit=resolve(run,'instrumented');
for(const dir of [base,audit]){
  await mkdir(dir);
  for(const name of ['bot.js','rules.js','board-masks.js','exchange.js','search.js'])
    await copyFile(resolve('src',name),resolve(dir,name));
}
await writeFile(resolve(run,'package.json'),'{"type":"module"}\n');
const searchPath=resolve(audit,'search.js');
let code=await readFile(searchPath,'utf8');
function replace(from,to){
  if(code.split(from).length!==2) throw Error('Unexpected source anchor: '+from);
  code=code.replace(from,to);
}
replace('for (const action of order(p, actions)) {', `const quietDraw = !danger && remainingQ > 0 ? ctx.options.onQuietDraw(p,legal,actions) : null;
      for (const action of order(p, actions)) {`);
replace('return finish(best);\n    }', `if(quietDraw)ctx.options.onQuietReturn(p,quietDraw,best,maximizing,startAlpha,startBeta,remainingQ);
      return finish(best);
    }`);
await writeFile(searchPath,code);
const path='research/competitive-engine-v1/js-legal-recaptures.json';
const input=await readFile(path);
const cases=JSON.parse(input).cases.slice(0,128);
if(cases.length!==128)throw Error('Unexpected sample size');
const hash=createHash('sha256').update(input).digest('hex');
await writeFile(resolve(run,'inputs.json'),JSON.stringify({path,hash,cases},null,2));
const mod=(dir,file)=>import(pathToFileURL(resolve(dir,file)).href);
const [original,observed,rules]=await Promise.all([mod(base,'bot.js'),mod(audit,'bot.js'),mod(base,'rules.js')]);
const shared={profile:'competitive',iterativeDeepening:true,quiescenceDepth:4,quiescenceChecks:true,quiescenceEvasionDepth:2,cacheEvaluation:true,cacheQuiescence:false,reducePrincipalVariation:true,reduceQuietDrops:false,stopOnProvenWin:false};
const arms=[{...shared,depth:4,lateMoveReduction:false,maxNodes:100000,maxMillis:200}];
const results=[], errors=[];
for(const [arm,options] of arms.entries()){
  const rows=[],examples=[];
  for(const instrumented of [true,false]){
    for(const [index,c] of cases.entries()){
      const counters={transitions:0,capSkips:0,drawNodes:0,contradictions:0},snapshot=JSON.stringify(c.position);
      const onQuietDraw=(p,legal,noisy)=>{
        if(!Object.values(p.repetitions).some(n=>n>=2))return null;
        const keys=new Set(noisy.map(rules.actionKey));
        for(const action of legal){
          if(keys.has(rules.actionKey(action)))continue;
          if(counters.transitions>=1000){counters.capSkips++;return null;}
          counters.transitions++;
          const next=rules.applyAction(p,action);
          const nextKey=rules.positionKey(next);
          if(next.repetitions[nextKey]>=3&&rules.getResult(next)?.reason==='threefold-repetition'){
            counters.drawNodes++;
            return action;
          }
        }
        return null;
      };
      const onQuietReturn=(p,action,best,maximizing,alpha,beta,remainingQ)=>{
        if(maximizing?best.value>=0:best.value<=0)return;
        counters.contradictions++;
        if(examples.length<12){
          const pv=[];for(let link=best.line;link;link=link.next)pv.push(link.action);
          examples.push({index,id:c.id,position:structuredClone(p),action,value:best.value,maximizing,
            alpha:Number.isFinite(alpha)?alpha:String(alpha),beta:Number.isFinite(beta)?beta:String(beta),remainingQ,pv});
        }
      };
      const start=performance.now();
      const result=(instrumented?observed:original).analyzeAction(c.position,{...options,...(instrumented?{onQuietDraw,onQuietReturn}:{})});
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
  if(arm===0)for(let i=0;i<128;i++){
    const a=rows[i].result,b=rows[128+i].result;
    if(a.completedDepth!==4||b.completedDepth!==4)continue;
    joint++;
    for(const k of ['action','score','completedDepth','nodes','pv'])if(JSON.stringify(a[k])!==JSON.stringify(b[k]))errors.push({arm,index:i,mismatch:k});
  }
  const auditRows=rows.slice(0,128);
  results.push({options,rows,examples,joint,roots:auditRows.filter(r=>r.counters.contradictions>0).length,
    totals:Object.fromEntries(['transitions','capSkips','drawNodes','contradictions'].map(k=>[k,auditRows.reduce((sum,r)=>sum+r.counters[k],0)]))});
}
const pass=errors.length===0&&results[0].joint>=96&&results[0].roots>=8&&results[0].totals.contradictions>=16;
const summary={pass,errors,arms:results.map(({joint,roots,totals,rows})=>({joint,roots,totals,depths:[rows.slice(0,128),rows.slice(128)].map(group=>group.map(r=>r.result.completedDepth))}))};
await writeFile(resolve(run,'results.json'),JSON.stringify({summary,results,system:{node:process.version,platform:process.platform,arch:process.arch}},null,2));
console.log(JSON.stringify(summary));
