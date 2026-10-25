import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {analyzeAction as baseline} from '../research/search-performance-v3/baseline-bot.js';
import {analyzeAction as candidate} from '../src/bot.js';
import {createInitialPosition,applyAction,getResult,positionKey,actionKey,legalActions} from '../src/rules.js';
const root='research/search-performance-v3/',games=[];
const config={depth:100,maxNodes:10000000,maxMillis:25,maxPlies:100,openings:16,colorsSwapped:true,randomness:'none',rules:'Classic quiet drops',baselineCommit:'d1db2c5b7146f4b44887cce00b92be56aa2398d8'};
const sources={};for(const path of ['src/search.js','src/bot.js','src/rules.js','src/board-masks.js','scripts/bench-search-play-v3.js',...['search','rules','bot'].map(n=>root+'baseline-'+n+'.js')])sources[path]=createHash('sha256').update(await readFile(path)).digest('hex');
const summary={candidateWins:0,baselineWins:0,draws:0,reasons:{},completedDepth:{candidate:{},baseline:{}}};
for(const fn of [baseline,candidate]){let p=createInitialPosition();p=applyAction(p,{type:'place-king',to:15});p=applyAction(p,{type:'place-king',to:0});fn(p,{depth:3});}
for(let opening=0;opening<16;opening++)for(const candidateColor of ['white','black']){
 let p=createInitialPosition();p=applyAction(p,{type:'place-king',to:12+Math.floor(opening/4)});p=applyAction(p,{type:'place-king',to:opening%4});
 const game={opening,candidateColor,transcript:[]};
 for(let ply=0;ply<config.maxPlies&&!getResult(p);ply++){
  const name=p.turn===candidateColor?'candidate':'baseline',t=performance.now(),r=(name==='candidate'?candidate:baseline)(p,{depth:config.depth,maxNodes:config.maxNodes,maxMillis:config.maxMillis,repetitionAversion:true}),millis=performance.now()-t;
  assert(r.nodes<=config.maxNodes);assert(legalActions(p).some(a=>actionKey(a)===actionKey(r.action)));
  summary.completedDepth[name][r.completedDepth]=(summary.completedDepth[name][r.completedDepth]??0)+1;
  p=applyAction(p,r.action);game.transcript.push({action:r.action,resultingKey:positionKey(p),nodes:r.nodes,completedDepth:r.completedDepth,millis});
 }
 game.result=getResult(p)??{type:'draw',reason:'ply-limit'};game.finalPosition=p;games.push(game);
 if(game.result.winner)summary[game.result.winner===candidateColor?'candidateWins':'baselineWins']++;else summary.draws++;
 summary.reasons[game.result.reason]=(summary.reasons[game.result.reason]??0)+1;
 await writeFile(root+'play-progress.json',JSON.stringify({completed:games.length,total:32,summary},null,2)+'\n');
 console.log(`${games.length}/32: ${game.result.winner??game.result.reason}`);
}
const raw=Buffer.from(games.map(g=>JSON.stringify(g)).join('\n')+'\n'),compressed=gzipSync(raw,{level:9});await writeFile(root+'play-games.jsonl.gz',compressed);
await writeFile(root+'play-results.json',JSON.stringify({config,sources,games:games.length,summary,archive:{compressedSha256:createHash('sha256').update(compressed).digest('hex'),rawSha256:createHash('sha256').update(raw).digest('hex')}},null,2)+'\n');console.log(JSON.stringify(summary));
