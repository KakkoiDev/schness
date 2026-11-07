/** All r5 losses: early observed score swings, not a strength holdout. */
import {nativeEngine} from '../../scripts/native-engine-client.js';
import * as r from '../../src/rules.js';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
const root='output/local-experiments/rust-r5-fairy-screen-2026-10-27';
const m=JSON.parse(await readFile(root+'/manifest.json'));
const binary=root+'/runtime/engine-rust/target/release/schness-engine';
const cases=[],results=[];
for(const file of (await readdir(root+'/games')).sort()){
 const g=JSON.parse(await readFile(root+'/games/'+file));if(!g.result.winner||g.result.winner===g.task.color)continue;
 let p=r.createInitialPosition(m.rules);const decisions=[];
 for(let ply=0;ply<g.transcript.length;ply++){
  const e=g.transcript[ply];if(e.engine==='candidate')decisions.push({ply,position:p,playedAction:e.action,playedScore:e.score,playedDepth:e.completedDepth});p=r.applyAction(p,e.action);
 }
 const early=decisions.slice(0,12);let index=early.findIndex((x,i)=>i>0&&Number.isFinite(x.playedScore)&&Number.isFinite(early[i-1].playedScore)&&x.playedScore<=-300&&early[i-1].playedScore>=-100);
 let selection='first crossing from >=-100 to <=-300, preceding candidate decision';
 if(index<0){index=early.findIndex((x,i)=>i>0&&Number.isFinite(x.playedScore)&&early[i-1].playedScore-x.playedScore>=300);selection='first >=300 observed drop, preceding candidate decision';}
 if(index<0){index=1;selection='no qualifying early observed swing; first candidate decision';}
 const entry=early[index-1];if(entry)cases.push({id:g.task.id,...entry,selection,trajectory:early.map(({ply,playedScore,playedDepth})=>({ply,score:playedScore,depth:playedDepth}))});
}
const options={profile:'competitive',depth:6,iterativeDeepening:true,quiescenceDepth:4,quiescenceChecks:true,quiescenceEvasionDepth:2,lateMoveReduction:false,cacheEvaluation:true,stopOnProvenWin:false,repetitionAversion:true,multiPv:3,maxNodes:200000,maxMillis:1500};
const client=nativeEngine(binary,[],{watchdogMillis:10000});
try{for(const c of cases){const start=performance.now(),best=await client.request('schness-v1',c.position,options);let replay=c.position;for(const a of best.pv)replay=r.applyAction(replay,a);
 const child=r.applyAction(c.position,c.playedAction),forced=await client.request('schness-v1',child,{...options,depth:5,multiPv:1});
 const comparable=best.completedDepth===6&&(forced.completedDepth===5||r.getResult(child)!==null);
 const playedScore=forced.score===null?null:forced.score*(child.turn===c.position.turn?1:-1);
 results.push({id:c.id,millis:performance.now()-start,best,forced,comparable,playedScore,gap:comparable?best.score-playedScore:null});
}}finally{client.close();}
const data={purpose:'Selected early observed swings from ALL29r5losses; first12candidate decisions only. Diagnostic not strength/holdout. Changing completed depths can cause observed score swings. Explicit200000node/1500ms cap per query; compare only complete depth6 best versus complete depth5 forced child or terminal. No selective reductions.',options,sourceFingerprint:m.sourceFingerprint,binary:{path:binary,sha256:createHash('sha256').update(await readFile(binary)).digest('hex')},scriptSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),cases,results};
await writeFile('research/competitive-engine-v1/rust-r5-early-swings.json',JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify(results.map(x=>({id:x.id,complete:x.comparable,bestDepth:x.best.completedDepth,forcedDepth:x.forced.completedDepth,gap:x.gap,best:x.best.score,played:x.playedScore}))));
