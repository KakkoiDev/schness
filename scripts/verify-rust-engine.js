import {spawn,spawnSync} from 'node:child_process';
import {createInterface} from 'node:readline';
import assert from 'node:assert/strict';
import {VARIANTS} from '../src/variants.js';
import * as r from '../src/rules.js';
import {analyzeAction} from '../src/bot.js';
const binary=process.argv[2]??'engine-rust/target/release/schness-engine';
const rust=spawn(binary,[],{stdio:['pipe','pipe','inherit']}),lines=createInterface({input:rust.stdout});
const pending=[];lines.on('line',line=>{const p=pending.shift();if(!p)throw Error('Unsolicited response');p(JSON.parse(line));});
const ask=request=>new Promise(resolve=>{pending.push(resolve);rust.stdin.write(JSON.stringify(request)+'\n');});
let checked=0,searches=0,seed=271027;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
try{
 for(const [variant,preset] of Object.entries(VARIANTS)){let p=r.createInitialPosition(preset);
  for(let ply=0;ply<45;ply++){
   const legal=r.legalActions(p),result=r.getResult(p),action=legal[Math.floor(random()*legal.length)]??null;
   const next=action?r.applyAction(p,action):null;
   const answer=await ask({schemaVersion:1,id:`${variant}:${ply}`,game:'schness-rules-v1',state:p,action});
   assert(!answer.error,JSON.stringify(answer));assert.deepEqual(answer.legalActionKeys,legal.map(r.actionKey).sort());assert.deepEqual(answer.result,result);assert.deepEqual(answer.nextState,next);checked++;
   if(!result&&p.phase==='play'&&ply===12){const options={profile:'reference',depth:3,iterativeDeepening:false,quiescenceDepth:0,lateMoveReduction:false};const a=analyzeAction(p,options),b=await ask({schemaVersion:1,id:'search',game:'schness-v1',state:p,options});assert(!b.error);assert.equal(b.score,a.score,variant);assert.equal(b.completedDepth,3);assert(legal.some(x=>r.actionKey(x)===r.actionKey(b.action)));searches++;}
   if(result||!next)break;p=next;
  }
 }
 const valid=r.createInitialPosition(VARIANTS.canonical);
 for(const options of [{depth:-1},{strength:101},{maxNodes:0},{maxMillis:0},{depth:101},{profile:'invalid'}]){const answer=await ask({schemaVersion:1,id:'invalid-options',game:'schness-v1',state:valid,options});assert(answer.error);assert.equal(answer.id,'invalid-options');}
 const malformed=structuredClone(valid);malformed.turn='invalid';assert((await ask({schemaVersion:1,id:'bad-state',game:'schness-rules-v1',state:malformed})).error);
 assert(!(await ask({schemaVersion:1,id:'after-error',game:'schness-rules-v1',state:valid})).error);
 console.log(JSON.stringify({rulePositions:checked,exactSearchComparisons:searches,invalidRequestRecovery:8}));
}finally{rust.stdin.end();}
const contract=spawnSync(process.execPath,['scripts/check-engine-contract.js','--engine',binary],{encoding:'utf8'});process.stdout.write(contract.stdout);if(contract.status!==0)throw Error(contract.stderr);
