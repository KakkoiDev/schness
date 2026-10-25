import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {analyzeAction as baseline} from '../research/search-performance-v5/baseline-bot.js';
import {analyzeAction as candidate} from '../src/bot.js';
import {analyzeAction as kingSafety} from '../research/search-performance-v5/king-safety-runtime/bot.js';
import {createInitialPosition,applyAction,getResult,positionKey,actionKey,legalActions} from '../src/rules.js';
const root='research/search-performance-v5/',games=[],mode=process.argv[2]??'exact';
if(!['exact','tactical','reduced','king-safety'].includes(mode))throw Error('Invalid mode');
const candidateOptions=mode==='tactical'?{quiescenceDepth:2,quiescenceChecks:true}:mode==='reduced'?{lateMoveReduction:true}:{};
const config={depth:100,maxNodes:10000000,maxMillis:25,maxPlies:100,openings:16,colorsSwapped:true,randomness:'none',rules:'Classic quiet drops',baselineDescription:'frozen local round-four engine; exact source hashes below'};
if(mode==='king-safety')config.baselineDescription='current exact engine; same kernel, king-safety evaluation bonus only';
const sources={};for(const path of ['src/search.js','src/bot.js','src/rules.js','src/board-masks.js','scripts/bench-search-play-v5.js',...['search','bot','rules','board-masks'].map(n=>root+'king-safety-runtime/'+n+'.js'),...['search','rules','bot','board-masks'].map(n=>root+'baseline-'+n+'.js')])sources[path]=createHash('sha256').update(await readFile(path)).digest('hex');
const summary={candidateWins:0,baselineWins:0,draws:0,reasons:{},completedDepth:{candidate:{},baseline:{}}};
for(const fn of [baseline,candidate,kingSafety]){let p=createInitialPosition();p=applyAction(p,{type:'place-king',to:15});p=applyAction(p,{type:'place-king',to:0});fn(p,{depth:3});}
for(let opening=0;opening<16;opening++)for(const candidateColor of ['white','black']){
 let p=createInitialPosition();p=applyAction(p,{type:'place-king',to:12+Math.floor(opening/4)});p=applyAction(p,{type:'place-king',to:opening%4});
 const game={opening,candidateColor,transcript:[]};
 for(let ply=0;ply<config.maxPlies&&!getResult(p);ply++){
  const name=p.turn===candidateColor?'candidate':'baseline',t=performance.now(),r=(name==='candidate'?(mode==='king-safety'?kingSafety:candidate):(mode==='king-safety'?candidate:baseline))(p,{...(name==='candidate'?candidateOptions:{}),depth:config.depth,maxNodes:config.maxNodes,maxMillis:config.maxMillis,repetitionAversion:true}),millis=performance.now()-t;
  assert(r.nodes<=config.maxNodes);assert(legalActions(p).some(a=>actionKey(a)===actionKey(r.action)));
  summary.completedDepth[name][r.completedDepth]=(summary.completedDepth[name][r.completedDepth]??0)+1;
  p=applyAction(p,r.action);game.transcript.push({action:r.action,resultingKey:positionKey(p),nodes:r.nodes,completedDepth:r.completedDepth,millis});
 }
 game.result=getResult(p)??{type:'draw',reason:'ply-limit'};game.finalPosition=p;games.push(game);
 if(game.result.winner)summary[game.result.winner===candidateColor?'candidateWins':'baselineWins']++;else summary.draws++;
 summary.reasons[game.result.reason]=(summary.reasons[game.result.reason]??0)+1;
 await writeFile(root+mode+'-play-progress.json',JSON.stringify({completed:games.length,total:32,summary},null,2)+'\n');
 console.log(`${games.length}/32: ${game.result.winner??game.result.reason}`);
}
const raw=Buffer.from(games.map(g=>JSON.stringify(g)).join('\n')+'\n'),compressed=gzipSync(raw,{level:9});await writeFile(root+mode+'-play-games.jsonl.gz',compressed);
await writeFile(root+mode+'-play-results.json',JSON.stringify({config:{...config,candidateOptions},sources,games:games.length,summary,archive:{compressedSha256:createHash('sha256').update(compressed).digest('hex'),rawSha256:createHash('sha256').update(raw).digest('hex')}},null,2)+'\n');console.log(JSON.stringify(summary));
