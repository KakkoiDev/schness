import {gunzipSync} from 'node:zlib';
import {readFile,writeFile} from 'node:fs/promises';
const root='research/browser-engine-v1/',d=JSON.parse(await readFile(root+'results.json','utf8').catch(async()=>gunzipSync(await readFile(root+'results.json.gz')).toString()));
if(d.error||d.parity.some(p=>p.mismatches.length)||d.search.length!==96)throw Error('Incomplete or incompatible benchmark');
const median=a=>{a=[...a].sort((a,b)=>a-b);return (a[47]+a[48])/2;};
const summary={positions:d.parity.length,legalLeaves:d.parity.reduce((n,r)=>n+r.nodes,0),parityDepth:4,repeats:3,budgetMillis:100,engines:{}};
for(const name of ['ours','fairy']){const r=d.search.map(x=>x[name]),millis=r.reduce((s,x)=>s+x.millis,0),nodes=r.reduce((s,x)=>s+x.nodes,0);summary.engines[name]={medianMillis:median(r.map(x=>x.millis)),totalMillis:millis,nodes,nodesPerSecond:nodes/millis*1000,medianReportedCompletedDepth:median(r.map(x=>x.depth)),minDepth:Math.min(...r.map(x=>x.depth)),maxDepth:Math.max(...r.map(x=>x.depth))};}
summary.nodeThroughputRatio=summary.engines.fairy.nodesPerSecond/summary.engines.ours.nodesPerSecond;
summary.perftWallMillis=d.timings.reduce((s,r)=>({ours:s.ours+r.ourMs,fairy:s.fairy+r.fairyMs}),{ours:0,fairy:0});
await writeFile(root+'summary.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
