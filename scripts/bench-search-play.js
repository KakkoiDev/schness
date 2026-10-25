import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {analyzeAction as baseline} from '../research/search-performance-v2/baseline-bot.js';
import {analyzeAction as optimized} from '../src/bot.js';
import {createInitialPosition,applyAction,getResult,positionKey,actionKey,legalActions} from '../src/rules.js';
const dir=new URL('../research/search-performance-v2/',import.meta.url),games=[];
const config={depth:8,maxNodes:2048,maxPlies:120,openings:16,colorsSwapped:true,randomness:'none',rules:'Classic quiet drops',baselineCommit:'3d4dea355e2f9e9c79430bcc842f2ff2db25f8c3'};
const sources={};for(const path of ['../src/search.js','../src/bot.js','../src/rules.js','../research/search-performance-v2/baseline-search.js','../research/search-performance-v2/baseline-bot.js','../research/search-performance-v2/baseline-rules.js'])sources[path]=createHash('sha256').update(await readFile(new URL(path,import.meta.url))).digest('hex');
const summary={optimizedWins:0,baselineWins:0,draws:0,reasons:{},completedDepth:{optimized:{},baseline:{}}};
for(let opening=0;opening<16;opening++)for(const optimizedColor of ['white','black']){
 let p=createInitialPosition();p=applyAction(p,{type:'place-king',to:12+Math.floor(opening/4)});p=applyAction(p,{type:'place-king',to:opening%4});
 const g={opening,optimizedColor,transcript:[]};
 for(let ply=0;ply<config.maxPlies&&!getResult(p);ply++){
  const name=p.turn===optimizedColor?'optimized':'baseline',r=(name==='optimized'?optimized:baseline)(p,{depth:config.depth,maxNodes:config.maxNodes,repetitionAversion:true});
  assert.ok(r.nodes<=config.maxNodes);assert.ok(legalActions(p).some(a=>actionKey(a)===actionKey(r.action)));
  summary.completedDepth[name][r.completedDepth]=(summary.completedDepth[name][r.completedDepth]??0)+1;
  p=applyAction(p,r.action);g.transcript.push({action:r.action,resultingKey:positionKey(p),nodes:r.nodes,completedDepth:r.completedDepth});
 }
 g.result=getResult(p)??{type:'draw',reason:'ply-limit'};g.finalPosition=p;games.push(g);
 if(g.result.winner)summary[g.result.winner===optimizedColor?'optimizedWins':'baselineWins']++;else summary.draws++;
 summary.reasons[g.result.reason]=(summary.reasons[g.result.reason]??0)+1;
 await writeFile(new URL('play-progress.json',dir),JSON.stringify({completed:games.length,total:32,summary},null,2)+'\n');
 console.log(`${games.length}/32 opening ${opening} optimized ${optimizedColor}: ${g.result.winner??g.result.reason}`);
}
const raw=Buffer.from(games.map(g=>JSON.stringify(g)).join('\n')+'\n'),compressed=gzipSync(raw,{level:9});
await writeFile(new URL('play-games.jsonl.gz',dir),compressed);
await writeFile(new URL('play-results.json',dir),JSON.stringify({config,sources,games:games.length,summary,archive:{compressedSha256:createHash('sha256').update(compressed).digest('hex'),rawSha256:createHash('sha256').update(raw).digest('hex')}},null,2)+'\n');
console.log(JSON.stringify(summary));
