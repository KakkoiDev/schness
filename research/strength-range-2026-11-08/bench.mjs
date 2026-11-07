import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
const root=new URL('../../',import.meta.url).pathname;
const {analyzeAction}=await import(root+'src/bot.js');
const corpus=JSON.parse(await readFile(root+'research/search-performance-v2/positions.json'));
const probe=analyzeAction(corpus[0].position,{strength:3});
console.log('fields',Object.keys(probe).join(','));
for(const p of corpus.slice(0,3)) analyzeAction(p.position,{strength:4});
const levels=[0,1,2,3,4,5,6,7,8,9,10,12,15,20,30,50,100];
const ref=corpus.map(p=>analyzeAction(p.position,{strength:8}).action);
for(const s of levels){
  const ms=[],cd=[],nodes=[];let agree=0;
  corpus.forEach((p,i)=>{const t=performance.now();const r=analyzeAction(p.position,{strength:s});ms.push(performance.now()-t);cd.push(r.completedDepth??NaN);nodes.push(r.nodes??r.stats?.nodes??NaN);if(JSON.stringify(r.action)===JSON.stringify(ref[i]))agree++;});
  ms.sort((a,b)=>a-b);const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  console.log(JSON.stringify({strength:s,medianMs:+ms[16].toFixed(1),p95Ms:+ms[30].toFixed(1),maxMs:+ms[31].toFixed(1),meanCompletedDepth:+mean(cd).toFixed(2),minCompleted:Math.min(...cd),meanNodes:Math.round(mean(nodes)),agreeWithD8:agree}));
}
