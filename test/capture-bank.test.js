import test from 'node:test';
import assert from 'node:assert/strict';
import {createPosition,createInitialPosition,legalActions,applyAction,positionKey} from '../src/rules.js';
import {scorePosition} from '../src/bot.js';
import {VARIANTS} from '../src/variants.js';
import {playTournamentGame,tournamentRules} from '../src/tournament.js';
const ids=[3,4,5,6].flatMap(n=>['quiet','checking'].map(c=>`capture-bank-${n}-${c}`));
function fixture(id,held=['bishop','knight'],other=['bishop','knight']){
 const board=Array(16).fill(null);board[15]={owner:'white',piece:'king'};board[0]={owner:'black',piece:'king'};
 board[8]={owner:'white',piece:'rook'};board[4]={owner:'black',piece:'rook'};
 return createPosition({board,banks:{white:held,black:other},rules:VARIANTS[id]});
}
test('capture transfers the piece to capturer, while canonical returns it to victim',()=>{
 for(const id of [...ids,'canonical']){const p=fixture(id);const q=applyAction(p,{type:'move',from:8,to:4});assert.equal(q.banks.white.length,id==='canonical'?2:3);assert.equal(q.banks.black.length,id==='canonical'?3:2);assert.deepEqual(p.banks.white,['bishop','knight']);}
});
test('capacity counts all held pieces and returns overflow at every supported boundary',()=>{
 for(const cap of [3,4,5,6])for(const heldCount of [cap-1,cap]){const held=Array(heldCount).fill('knight');const p=fixture(`capture-bank-${cap}-quiet`,held,[]);const q=applyAction(p,{type:'move',from:8,to:4});assert.equal(q.banks.white.length,cap);assert.equal(q.banks.black.includes('rook'),heldCount===cap);}
 assert.throws(()=>fixture('capture-bank-3-quiet',['rook','rook','bishop','knight'],[]),/overflow/);
 for(const bankCapacity of [2,7,3.5])assert.throws(()=>createInitialPosition({allowCheckingDrops:false,experiment:'capture-bank',bankCapacity}),/capacity/);
});
test('ownership can change repeatedly and duplicate drops are distinct actions only by type and square',()=>{
 const p=fixture('capture-bank-6-quiet');p.board[5]={owner:'black',piece:'rook'};p.board[4]={owner:'black',piece:'bishop'};
 const q=applyAction(p,{type:'move',from:8,to:4});const r=applyAction(q,{type:'move',from:5,to:4});assert.equal(r.banks.black.at(-1),'rook');
 const dup=fixture('capture-bank-6-quiet',['rook','rook'],[]);dup.board[8]=null;dup.board[4]=null;
 const actions=legalActions(dup);assert.equal(new Set(actions.map(JSON.stringify)).size,actions.length);
 const drop=actions.find(a=>a.type==='drop'&&a.piece==='rook');const next=applyAction(dup,drop);assert.equal(next.board[drop.to].owner,'white');assert.deepEqual(next.banks.white,['rook']);
 const single=createPosition({...dup,banks:{white:['rook'],black:[]}});assert.notEqual(positionKey(dup),positionKey(single));
});
test('capture presets keep king safety, drop policy and exact tournament replay',()=>{
 for(const id of ids){const p=fixture(id);p.board[8]=null;p.board[4]=null;p.banks.white=['rook'];assert.equal(legalActions(p).some(a=>a.type==='drop'&&a.to===4),id.endsWith('checking'));
 const game=playTournamentGame({index:0,seed:20261030,white:'learning',black:'learning',maxPlies:24,researchRules:VARIANTS[id]});let q=createInitialPosition(VARIANTS[id]);for(const e of game.transcript){q=applyAction(q,e.action);assert.equal(positionKey(q),e.resultingKey);}assert.deepEqual(q,game.finalPosition);
 assert.equal(q.board.filter(Boolean).length+q.banks.white.length+q.banks.black.length,8);
 assert.ok(tournamentRules(VARIANTS[id]).some(t=>t.includes('capturer')));assert.ok(!legalActions(p).some(a=>a.type==='move'&&p.board[a.to]?.piece==='king'));}
});

test('capture-aware search values duplicate reserve material',()=>{const p=fixture('capture-bank-6-quiet',['rook','rook'],[]);const q=createPosition({...p,banks:{white:['rook'],black:[]}});assert.ok(scorePosition(p,0)-scorePosition(q,0)>450);});

test('capacity is part of position identity',()=>{assert.notEqual(positionKey(fixture('capture-bank-3-quiet')),positionKey(fixture('capture-bank-6-quiet')));});
