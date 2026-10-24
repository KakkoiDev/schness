import test from 'node:test';
import assert from 'node:assert/strict';
import {createPosition,createInitialPosition,legalActions,applyAction,positionKey} from '../src/rules.js';
import {scorePosition} from '../src/bot.js';
import {playTournamentGame,tournamentRules} from '../src/tournament.js';
import {VARIANTS} from '../src/variants.js';
function fixture(id,side='white'){
 let board=Array(16).fill(null);board[15]={owner:'white',piece:'king'};board[0]={owner:'black',piece:'king'};board[8]={owner:'white',piece:'rook'};board[4]={owner:'black',piece:'knight'};
 if(side==='black')board=board.reverse().map(p=>p?{...p,owner:p.owner==='white'?'black':'white'}:null);
 return createPosition({board,turn:side,banks:{white:['bishop'],black:['bishop']},rules:VARIANTS[id]});
}
test('captures permanently remove material in either color, without changing banks or input',()=>{
 for(const side of ['white','black'])for(const id of ['permanent-loss-quiet','permanent-loss-checking']){const p=fixture(id,side);const q=applyAction(p,{type:'move',from:side==='white'?8:7,to:side==='white'?4:11});assert.deepEqual(q.banks,p.banks);assert.equal(q.board.filter(Boolean).length,3);assert.equal(p.board.filter(Boolean).length,4);assert.equal(q.board.some(p=>p?.piece==='knight'),false);assert.equal(legalActions(q).some(a=>a.type==='drop'&&a.piece==='knight'),false);}
 const classic=applyAction(fixture('canonical'),{type:'move',from:8,to:4});assert.ok(classic.banks.black.includes('knight'));
});
test('unused reserves still deploy, quiet/checking policies differ and reserve material matters',()=>{
 for(const id of ['permanent-loss-quiet','permanent-loss-checking']){const p=fixture(id);p.board[8]=null;p.board[4]=null;p.banks.white=['rook'];assert.equal(legalActions(p).some(a=>a.type==='drop'&&a.to===4),id.endsWith('checking'));const q=applyAction(p,{type:'drop',piece:'rook',to:10});assert.deepEqual(q.banks.white,[]);assert.equal(q.board[10].piece,'rook');const empty=createPosition({...p,banks:{white:[],black:p.banks.black}});assert.ok(scorePosition(p,0)>scorePosition(empty,0)+450);}
 assert.notEqual(positionKey(fixture('permanent-loss-quiet')),positionKey(fixture('canonical')));
});
test('finite-material tournament transcripts replay exactly and record the capture/evaluation policy',()=>{
 for(const id of ['permanent-loss-quiet','permanent-loss-checking']){const g=playTournamentGame({index:1,seed:20261102,white:'learning',black:'learning',maxPlies:28,researchRules:VARIANTS[id]});let p=createInitialPosition(VARIANTS[id]);let total=8;for(const e of g.transcript){p=applyAction(p,e.action);assert.equal(positionKey(p),e.resultingKey);const now=p.board.filter(Boolean).length+p.banks.white.length+p.banks.black.length+(p.phase==='place-white-king'?2:p.phase==='place-black-king'?1:0);assert.ok(now<=total);total=now;}assert.deepEqual(p,g.finalPosition);assert.match(g.evaluationPolicy,/finite-material-v1/);assert.ok(tournamentRules(g.ruleset).some(t=>t.includes('permanently')));}
});
