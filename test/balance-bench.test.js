import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialPosition,createPosition,applyAction,legalActions,positionKey,getResult,isInCheck} from '../research/balance-v1/core/rules.js';
import {VARIANTS,VARIANT_IDS} from '../research/balance-v1/core/variants.js';
import {tasksFor} from '../research/balance-v1/run.js';
import {playTournamentGame} from '../research/balance-v1/core/tournament.js';
function fixture(rules, timers=[0,0]) {
 const board=Array(16).fill(null);board[15]={owner:'white',piece:'king'};board[0]={owner:'black',piece:'king'};board[8]={owner:'white',piece:'rook'};board[4]={owner:'black',piece:'rook'};
 return createPosition({board,banks:{white:['bishop','knight'],black:['bishop','knight']},reserveTimers:{white:timers,black:[0,0]},rules});
}
test('balance screen includes all capacities and delays, Sharp-only balanced opening coverage',()=>{
 assert.equal(VARIANT_IDS.length,45);
 for(const cap of [3,4,5,6])for(const delay of [1,2,'weighted'])assert.ok(VARIANTS[`bank-${cap}-delay-${delay}`]);
 const plan=tasksFor({variants:VARIANT_IDS,seeds:[1,2,3,4,5,6],repetitions:1});assert.equal(plan.length,4320);assert.ok(plan.every(t=>t.white==='sharp'&&t.black==='sharp'));
 for(const id of VARIANT_IDS)assert.equal(new Set(plan.filter(t=>t.variant===id).map(t=>`${t.seed}:${t.index%16}`)).size,96);
});
test('capture delay starts full, ticks only on owner turns, and mixed duplicate copies drop ready copy',()=>{
 for(const delay of [1,2,'weighted']){
 const r=VARIANTS[`bank-4-delay-${delay}`];const p=fixture(r,[1,0]);const q=applyAction(p,{type:'move',from:8,to:4});
 assert.deepEqual(q.reserveTimers.white,[0,0,delay==='weighted'?4:delay]);assert.deepEqual(p.reserveTimers.white,[1,0]);
 const reply=legalActions(q).find(a=>a.type==='move');const n=applyAction(q,reply);assert.deepEqual(n.reserveTimers.white,q.reserveTimers.white);
 }
 const p=fixture(VARIANTS['bank-4-delay-weighted']);p.banks.white=['rook','rook'];p.reserveTimers.white=[4,0];p.board[8]=null;p.board[4]=null;
 const drop=legalActions(p).find(a=>a.type==='drop'&&a.piece==='rook');const q=applyAction(p,drop);assert.deepEqual(q.banks.white,['rook']);assert.deepEqual(q.reserveTimers.white,[3]);
 const other=createPosition({...p,reserveTimers:{white:[0,0],black:[0,0]}});assert.notEqual(positionKey(p),positionKey(other));
 const perm=createPosition({...p,reserveTimers:{white:[0,4],black:[0,0]}});assert.equal(positionKey(p),positionKey(perm));
});
test('weighted capture delay is three for bishop/knight, four for rook; overflow also cools',()=>{
 for(const piece of ['bishop','knight','rook']){
 const p=fixture(VARIANTS['bank-3-delay-weighted']);p.board[4]={owner:'black',piece};p.banks.white.push('knight');p.reserveTimers.white.push(0);
 const q=applyAction(p,{type:'move',from:8,to:4});assert.equal(q.banks.black.at(-1),piece);assert.equal(q.reserveTimers.black.at(-1),piece==='rook'?4:3);
 }
});
test('mutual unlock and checking cooldown compose and rights affect hashes',()=>{
 const p=fixture(VARIANTS['bank-4-mutual-2-check-cooldown']);p.board[8]=null;p.board[4]=null;p.banks.white=['rook'];p.reserveTimers.white=[0];
 assert.ok(!legalActions(p).some(a=>a.type==='drop'&&a.to===4));
 p.research.deployed={white:['bishop','knight'],black:['bishop','knight']};assert.ok(legalActions(p).some(a=>a.type==='drop'&&a.to===4));
 const key=positionKey(p);p.research.lastCheckingDrop.white=true;assert.ok(!legalActions(p).some(a=>a.type==='drop'&&a.to===4));assert.notEqual(positionKey(p),key);
});
test('forced wait requires cooling bank, no legal alternative, and no check',()=>{
 // Find a genuinely stalemated king position, then add a cooling reserve.
 let p;
 outer:for(let w=0;w<16;w++)for(let b=0;b<16;b++)for(let r=0;r<16;r++){
  if(new Set([w,b,r]).size!==3)continue;const board=Array(16).fill(null);board[w]={owner:'white',piece:'king'};board[b]={owner:'black',piece:'king'};board[r]={owner:'black',piece:'rook'};
  const q=createPosition({board,banks:{white:['knight'],black:[]},reserveTimers:{white:[2],black:[]},rules:VARIANTS['bank-4-delay-2']});
  if(!isInCheck(q,'white')&&legalActions(q).some(a=>a.type==='wait')){p=q;break outer;}
 }
 assert.ok(p);assert.equal(getResult(p),null);assert.deepEqual(legalActions(p),[{type:'wait'}]);const q=applyAction(p,{type:'wait'});assert.equal(q.turn,'black');assert.deepEqual(q.reserveTimers.white,[1]);
 const start=createInitialPosition(VARIANTS['bank-4-delay-2']);assert.ok(!legalActions(start).some(a=>a.type==='wait'));
 assert.throws(()=>createPosition({...p,reserveTimers:{white:[-1],black:[]}}),/timers/);
});
test('every recipe has legal full-game replay and conserves material',()=>{
 for(const id of VARIANT_IDS){const game=playTournamentGame({index:0,seed:901,white:'learning',black:'learning',maxPlies:12,researchRules:VARIANTS[id]});let p=createInitialPosition(VARIANTS[id]);for(const e of game.transcript){p=applyAction(p,e.action);assert.equal(positionKey(p),e.resultingKey);}assert.deepEqual(p,game.finalPosition);assert.equal(p.board.filter(Boolean).length+p.banks.white.length+p.banks.black.length,8);}
});

test('unmodified controls reproduce the shipped research engine exactly',async()=>{
 const {playTournamentGame:baseline}=await import('../research/data/balance-v1-2026-10-24/runtime/core/tournament.js');
 const controls=[['canonical',{allowCheckingDrops:false}],['mutual-two',{allowCheckingDrops:true,experiment:'mutual-two'}]];
 for(const [id,researchRules] of controls){const options={index:3,seed:114,white:'learning',black:'learning',maxPlies:18,researchRules};const a=baseline(options),b=playTournamentGame(options);assert.deepEqual(b.transcript,a.transcript);assert.deepEqual(b.result,a.result);}
});
test('mirrored opening works for all king starts and each piece type',()=>{
 for(const piece of ['rook','bishop','knight'])for(let i=0;i<16;i++){
 let p=createInitialPosition(VARIANTS[`bank-4-mirrored-${piece}`]);p=applyAction(p,{type:'place-king',to:12+i%4});p=applyAction(p,{type:'place-king',to:Math.floor(i/4)});
 const actions=legalActions(p);assert.ok(actions.length>0,`${piece} ${i}`);assert.ok(actions.every(a=>a.type==='drop'&&a.piece===piece));
 p=applyAction(p,actions[0]);const replies=legalActions(p);assert.equal(replies.length,1);assert.equal(replies[0].to,15-actions[0].to);p=applyAction(p,replies[0]);assert.equal(p.turn,'white');
 }
});
test('cooling reserves never postpone checkmate',()=>{
 let found=false;
 outer:for(let w=0;w<16;w++)for(let b=0;b<16;b++)for(let r=0;r<16;r++){
 if(new Set([w,b,r]).size!==3)continue;const board=Array(16).fill(null);board[w]={owner:'white',piece:'king'};board[b]={owner:'black',piece:'king'};board[r]={owner:'black',piece:'rook'};
 const p=createPosition({board,banks:{white:['knight'],black:[]},reserveTimers:{white:[2],black:[]},rules:VARIANTS['bank-4-delay-2']});
 if(isInCheck(p,'white')&&!legalActions(p).length){assert.equal(getResult(p).reason,'checkmate');found=true;break outer;}
 }assert.ok(found);
});
test('home-row setup restricts all placements, forbids check, then enables selected normal rules',()=>{
 for(const checking of [false,true]){
 let p=createInitialPosition(VARIANTS[`home-setup-${checking?'checking':'quiet'}`]);p=applyAction(p,{type:'place-king',to:15});p=applyAction(p,{type:'place-king',to:0});assert.equal(p.phase,'setup');
 const finish=q=>{if(q.phase==='play')return q;for(const a of legalActions(q)){assert.equal(a.type,'drop');assert.ok(q.turn==='white'?a.to>=12:a.to<4);const n=applyAction(q,a);assert.ok(!isInCheck(n,n.turn));const result=finish(n);if(result)return result;}return null;};
 p=finish(p);assert.ok(p);assert.equal(p.turn,'white');assert.ok(p.board.slice(4,12).every(x=>x===null));assert.equal(p.banks.white.length+p.banks.black.length,0);assert.equal(p.rules.allowCheckingDrops,checking);
 }
});
