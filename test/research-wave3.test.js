import test from 'node:test';
import assert from 'node:assert/strict';
import { createPosition, legalActions, applyAction, createInitialPosition, positionKey } from '../src/rules.js';
import { VARIANTS } from '../src/variants.js';
import { playTournamentGame } from '../src/tournament.js';
const ids=['home-half-check','distant-check','supported-check','countercheck-only','knight-check','bishop-check','rook-check'];
function fixture(id, owner='white') {
 const board=Array(16).fill(null); board[15]={owner:'white',piece:'king'};board[0]={owner:'black',piece:'king'};
 const p=createPosition({board,turn:'white',banks:{white:['rook','bishop','knight'],black:[]},rules:VARIANTS[id]});
 if(owner==='black'){p.board=p.board.reverse().map(x=>x?{...x,owner:x.owner==='white'?'black':'white'}:null);p.turn='black';p.banks={white:[],black:['rook','bishop','knight']};}return p;
}
const has=(p,piece,to)=>legalActions(p).some(a=>a.type==='drop'&&a.piece===piece&&a.to===to);
test('spatial checking restrictions are symmetric and leave quiet drops legal',()=>{
 for(const owner of ['white','black']){const sq=n=>owner==='white'?n:15-n;
  const home=fixture('home-half-check',owner);assert.equal(has(home,'rook',sq(4)),false);assert.equal(has(home,'rook',sq(8)),true);
  const distant=fixture('distant-check',owner);assert.equal(has(distant,'rook',sq(4)),false);assert.equal(has(distant,'rook',sq(8)),true);
  const supported=fixture('supported-check',owner);assert.equal(has(supported,'rook',sq(8)),false);supported.board[sq(14)]={owner,piece:'knight'};assert.equal(has(supported,'rook',sq(8)),true);
  for(const id of ids)assert.equal(has(fixture(id,owner),'bishop',sq(6)),true);
 }
});
test('piece-specific checking permissions reject only the disallowed checking piece',()=>{
 const checks={rook:4,bishop:5,knight:6};
 for(const piece of Object.keys(checks))for(const [other,to]of Object.entries(checks))assert.equal(has(fixture(`${piece}-check`),other,to),piece===other);
});
test('countercheck drops require an existing check and still resolve king safety',()=>{
 const p=fixture('countercheck-only');assert.equal(has(p,'rook',3),false);
 p.board[3]={owner:'black',piece:'rook'};assert.equal(has(p,'rook',7),true);
 // White king d1 is checked down file d; a rook on d3 blocks and checks Black king a3.
 p.board[0]=null;p.board[4]={owner:'black',piece:'king'};
 assert.equal(has(p,'rook',7),true);assert.equal(has(p,'rook',8),false);
});
test('all wave-three presets preserve rules, keys and exact tournament replay',()=>{
 for(const id of ids){const game=playTournamentGame({index:0,seed:20261027,white:'learning',black:'learning',maxPlies:12,researchRules:VARIANTS[id]});let p=createInitialPosition(VARIANTS[id]);for(const e of game.transcript){p=applyAction(p,e.action);assert.equal(positionKey(p),e.resultingKey);}assert.deepEqual(p,game.finalPosition);assert.equal(p.rules.experiment,id);}
 assert.equal(new Set(ids.map(id=>positionKey(fixture(id)))).size,ids.length);
});
