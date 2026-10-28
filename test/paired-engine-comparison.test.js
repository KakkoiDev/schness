import test from 'node:test';
import assert from 'node:assert/strict';
import {comparePaired,assertComparable} from '../research/competitive-engine-v1/compare-paired.js';
const game=(color,seed,winner)=>({task:{color,seed},startFen:'same',result:{type:winner?'win':'draw',winner}});
test('matched color rows distinguish gained and lost wins rather than mixing white advantage',()=>{
 const a=[game('white',1,'white'),game('black',1,'white')],b=[game('black',1,'black'),game('white',1,'black')];
 const r=comparePaired(a,b);assert.equal(r.rows.white.lostWins,1);assert.equal(r.rows.black.gainedWins,1);assert.equal(r.rows.white.rawWinRateChange,-1);assert.equal(r.rows.black.rawWinRateChange,1);
});
test('paired reports reject duplicates, incomplete schedules, unmatched seeds and missing colors',()=>{
 const a=[game('white',1,'white'),game('black',1,null)];
 for(const b of [[a[0]],[a[0],a[0]],[a[0],game('black',2,null)]])assert.throws(()=>comparePaired(a,b));
 assert.throws(()=>comparePaired([a[0]],[a[0]]));
});

test('comparison requires identical frozen rules, opponent and budgets',()=>{
 const a={rules:{drop:false},external:{version:'pinned'},candidateMillis:100,budgetMillis:100,maxPlies:200};
 assert.doesNotThrow(()=>assertComparable(a,structuredClone(a)));
 for(const k of Object.keys(a)){const b=structuredClone(a);delete b[k];assert.throws(()=>assertComparable(a,b));b[k]='changed';assert.throws(()=>assertComparable(a,b));}
});
test('malformed identities and outcomes cannot silently become draws',()=>{
 const a=[game('white',1,'white'),game('black',1,null)];
 for(const mutate of [g=>delete g.task.seed,g=>delete g.result,g=>g.result.winner='invalid',g=>g.result.type='pending']){const b=structuredClone(a);mutate(b[0]);assert.throws(()=>comparePaired(a,b));}
});
