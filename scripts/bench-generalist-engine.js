import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {analyzeAction as baseline} from '../research/engine-generalist-v1/baseline-bot.js';
import {analyzeAction as candidate} from '../src/bot.js';
import {createInitialPosition,applyAction,legalActions,getResult,actionKey,positionKey} from '../src/rules.js';
const destination=new URL('../research/engine-generalist-v1/',import.meta.url);
const maxNodes=1024,maxPlies=120,depth=4;
const games=[],summary={};
const digest=async path=>createHash('sha256').update(await readFile(new URL(path,import.meta.url))).digest('hex');
const manifest={baselineCommit:'bb6a09f85617027a051f60fcd778ff4b9b07e0e8',rules:'Classic Schness quiet drops; identical current rules for both engines',maxNodes,maxPlies,depth,starts:[0,1,2,3,4,5,6,7],profiles:['candidate-q0','candidate-q2'],sources:Object.fromEntries(await Promise.all(['../src/search.js','../src/bot.js','../src/rules.js','../research/engine-generalist-v1/baseline-search.js','../research/engine-generalist-v1/baseline-bot.js'].map(async p=>[p,await digest(p)])))};
await mkdir(destination,{recursive:true});
for(const profile of manifest.profiles){summary[profile]={candidateWins:0,baselineWins:0,draws:0,reasons:{},candidateNodes:0,baselineNodes:0,candidateMillis:0,baselineMillis:0,completedDepth:{candidate:{},baseline:{}}};
 for(const opening of manifest.starts)for(const candidateColor of ['white','black']){
  let p=createInitialPosition();p=applyAction(p,{type:'place-king',to:12+Math.floor(opening/4)});p=applyAction(p,{type:'place-king',to:opening%4});
  const game={profile,opening,candidateColor,transcript:[]},s=summary[profile];
  for(let ply=0;ply<maxPlies&&!getResult(p);ply++){
   const isCandidate=p.turn===candidateColor,name=isCandidate?'candidate':'baseline';const before=performance.now();
   const r=(isCandidate?candidate:baseline)(p,{depth,maxNodes,repetitionAversion:true,...(isCandidate?{quiescenceDepth:profile==='candidate-q2'?2:0}:{})});
   s[name+'Millis']+=performance.now()-before;s[name+'Nodes']+=r.nodes;s.completedDepth[name][r.completedDepth]=(s.completedDepth[name][r.completedDepth]??0)+1;
   if(!legalActions(p).some(a=>actionKey(a)===actionKey(r.action)))throw Error('Illegal benchmark action');
   p=applyAction(p,r.action);game.transcript.push({action:r.action,resultingKey:positionKey(p),nodes:r.nodes,completedDepth:r.completedDepth});
  }
  game.result=getResult(p)??{type:'draw',reason:'ply-limit'};game.finalPosition=p;
  if(game.result.winner)s[game.result.winner===candidateColor?'candidateWins':'baselineWins']++;else s.draws++;
  s.reasons[game.result.reason]=(s.reasons[game.result.reason]??0)+1;games.push(game);
  console.log(`${games.length}/32 ${profile} opening ${opening} candidate ${candidateColor}: ${game.result.winner??game.result.reason}`);
  await writeFile(new URL('progress.json',destination),JSON.stringify({completed:games.length,total:32,summary},null,2)+'\n');
 }
}
// Replay every saved action and compare final state/result independently of search.
for(const game of games){let p=createInitialPosition();p=applyAction(p,{type:'place-king',to:12+Math.floor(game.opening/4)});p=applyAction(p,{type:'place-king',to:game.opening%4});for(const e of game.transcript){p=applyAction(p,e.action);if(positionKey(p)!==e.resultingKey)throw Error('Replay mismatch');}if(JSON.stringify(p)!==JSON.stringify(game.finalPosition))throw Error('Final state mismatch');}
await writeFile(new URL('manifest.json',destination),JSON.stringify(manifest,null,2)+'\n');
await writeFile(new URL('games.jsonl',destination),games.map(g=>JSON.stringify(g)).join('\n')+'\n');
await writeFile(new URL('results.json',destination),JSON.stringify({games:games.length,replaysVerified:true,summary},null,2)+'\n');
