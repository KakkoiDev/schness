// Generate sparse tactical fixtures. Answers come from complete terminal-only
// AND/OR search, independent of the playing engine's evaluation and pruning.
import * as rules from '../research/search-performance-v5/baseline-rules.js';
import {writeFile} from 'node:fs/promises';
let seed=14313;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const recipes=[{allowCheckingDrops:false},{allowCheckingDrops:true},{allowCheckingDrops:true,experiment:'no-drop-mate'},{allowCheckingDrops:false,experiment:'permanent-loss'},{allowCheckingDrops:true,experiment:'capture-bank',bankCapacity:4}];
function force(p,who,depth){const result=rules.getResult(p);if(result)return result.winner===who;if(!depth)return false;const actions=rules.legalActions(p);return p.turn===who?actions.some(a=>force(rules.applyLegalAction(p,a),who,depth-1)):actions.every(a=>force(rules.applyLegalAction(p,a),who,depth-1));}
const cases=[];
for(let recipe=0;recipe<recipes.length;recipe++){
 let found=0;
 for(let trial=0;trial<400&&found<3;trial++){
  const board=Array(16).fill(null),squares=Array.from({length:16},(_,i)=>i);for(let i=15;i>0;i--){const j=Math.floor(random()*(i+1));[squares[i],squares[j]]=[squares[j],squares[i]];}
  board[squares[0]]={owner:'white',piece:'king'};board[squares[1]]={owner:'black',piece:'king'};
  const pieces=['rook','bishop','knight'];for(let i=2;i<5;i++)board[squares[i]]={owner:i===4?'black':'white',piece:pieces[Math.floor(random()*3)]};
  const turn=trial%2?'white':'black',banks={white:[],black:[]};if(trial%3===0)banks[turn]=[pieces[trial%3]];
  const p=rules.createPosition({board,banks,turn,rules:recipes[recipe]});
  // The side that just moved must have left its own king safe.
  if(rules.isInCheck(p,turn==='white'?'black':'white')||rules.getResult(p))continue;
  const actions=rules.legalActions(p),winning=actions.filter(a=>force(rules.applyLegalAction(p,a),turn,2)).map(rules.actionKey);
  if(!winning.length||winning.length===actions.length)continue;
  cases.push({id:`recipe-${recipe}-mate-${++found}`,position:p,depth:3,winningActions:winning});
 }
 if(found<3)throw Error('Insufficient fixtures for recipe '+recipe);
}
await writeFile('research/search-performance-v5/tactical-corpus.json',JSON.stringify({seed:14313,method:'Complete terminal-only AND/OR search, depth 3; sparse constructed positions, not claimed reachable from the initial state.',cases},null,2)+'\n');console.log('Saved '+cases.length+' exact tactical fixtures');
