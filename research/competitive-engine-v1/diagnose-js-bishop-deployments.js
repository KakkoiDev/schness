/** Matched-horizon diagnosis of the three earlier large bishop-deployment gaps. */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {analyzeAction} from '../../src/bot.js';
import {applyAction,getResult} from '../../src/rules.js';
const input=JSON.parse(await readFile('research/competitive-engine-v1/js-early-swings.json'));
const cases=input.cases.filter(c=>input.results.some(r=>r.id===c.id&&r.variant===c.variant&&r.comparable&&r.gap>=200)),results=[];
for(const c of cases)for(const depth of [6,7,8])for(const lateMoveReduction of [false,true]){
 const options={...input.options,depth,lateMoveReduction,protectHistoryMoves:c.variant==='history',maxNodes:500000,maxMillis:1500};
 const best=analyzeAction(c.position,options),child=applyAction(c.position,c.playedAction),forced=analyzeAction(child,{...options,depth:depth-1});
 for(const [p,r] of [[c.position,best],[child,forced]]){let next=p;for(const a of r.pv)next=applyAction(next,a);}
 const complete=best.completedDepth===depth&&(forced.completedDepth===depth-1||getResult(child)!==null),playedScore=forced.score*(child.turn===c.position.turn?1:-1);
 results.push({variant:c.variant,id:c.id,depth,options,best,forced,complete,playedScore,gap:complete?best.score-playedScore:null});
}
const hashes={};for(const p of ['src/search.js','src/bot.js','src/rules.js','src/exchange.js'])hashes[p]=createHash('sha256').update(await readFile(p)).digest('hex');
const data={purpose:'Three selected early bishop-deployment gaps, not strength or an independent tactical oracle. Matched best depthD versus forced childD-1 at explicit500000nodes/1500ms perquery. Compare only complete pairs. LMR remains selective and can hide alternatives.',hashes,scriptSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),inputSha256:createHash('sha256').update(await readFile('research/competitive-engine-v1/js-early-swings.json')).digest('hex'),cases,results};
await writeFile('research/competitive-engine-v1/js-bishop-deployment-diagnosis.json',JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify(results.map(r=>({variant:r.variant,id:r.id,depth:r.depth,lmr:r.options.lateMoveReduction,complete:r.complete,best:r.best.score,forced:r.playedScore,gap:r.gap,action:r.best.action,nodes:r.best.nodes}))));
