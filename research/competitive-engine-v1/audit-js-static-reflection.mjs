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
replace('ctx.evaluations++;\n          standPat=finite', `ctx.evaluations++;
          let reflection, reflectedValue;
          if(evalKey!==null){
            const parts=evalKey.split('|'), index=parts.length-3;
            const board=parts[index];
            if(!/^(?:--|[wb][KBRN]){16}$/i.test(board))throw Error('Unexpected board encoding '+board);
            parts[index]=board.match(/.{8}/g).map(rank=>rank.match(/../g).reverse().join('')).join('');
            reflection=parts.join('|');
            if(reflection!==evalKey)reflectedValue=ctx.evalCache.get(reflection);
          }
          standPat=finite`);
replace('if(ctx.evalCache)boundedSet(ctx.evalCache,evalKey,standPat,ctx);', `if(ctx.evalCache){
            ctx.options.onReflection(reflectedValue===undefined ? null : {evalKey,reflection,reflectedValue,standPat});
            boundedSet(ctx.evalCache,evalKey,standPat,ctx);
          }`);
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
const arms=[{...shared,depth:4,lateMoveReduction:false,maxNodes:100000,maxMillis:200}];
const results=[], errors=[];
for(const [arm,options] of arms.entries()){
  const rows=[],examples=[];
  for(const instrumented of [true,false]){
    for(const [index,c] of cases.entries()){
      const counters={misses:0,potential:0,mismatches:0},snapshot=JSON.stringify(c.position);
      const onReflection=event=>{
        counters.misses++;
        if(!event)return;
        counters.potential++;
        if(event.reflectedValue!==event.standPat){
          counters.mismatches++;
          errors.push({index,id:c.id,...event});
        }
        if(examples.length<12)examples.push({index,id:c.id,...event});
      };
      const start=performance.now();
      const result=(instrumented?observed:original).analyzeAction(c.position,{...options,...(instrumented?{onReflection}:{})});
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
    totals:Object.fromEntries(['misses','potential','mismatches'].map(k=>[k,auditRows.reduce((sum,r)=>sum+r.counters[k],0)]))});
}
const pass=errors.length===0&&results[0].joint>=28&&results[0].roots>=8&&results[0].totals.potential>=0.05*results[0].totals.misses;
const summary={pass,errors,arms:results.map(({joint,roots,totals,rows})=>({joint,roots,totals,depths:[rows.slice(0,32),rows.slice(32)].map(group=>group.map(r=>r.result.completedDepth))}))};
await writeFile(resolve(run,'results.json'),JSON.stringify({summary,results,system:{node:process.version,platform:process.platform,arch:process.arch}},null,2));
console.log(JSON.stringify(summary));
