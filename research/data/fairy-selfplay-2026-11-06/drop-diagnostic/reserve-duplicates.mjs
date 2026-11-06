import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as r from '../runtime/src/rules.js';
const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const {tasks,rules}=json('../manifest.json');
const values={rook:500,bishop:320,knight:300,king:0};
const dup=bank=>bank.length-new Set(bank).size;
const rows=[];let decisions=0;
const count={};
function increment(k){count[k]=(count[k]??0)+1}
for(const {id} of tasks){
 const game=json('../games/'+id+'.json'),bench=json('../analysis/'+id+'.json');
 let p=r.createInitialPosition(rules);
 for(const [ply,e] of game.transcript.entries()){
  if(ply>=2){
   const b=bench.rows[ply-2],mover=p.turn,other=r.opponent(mover);
   assert.equal(b.ply,ply);
   assert.equal(b.positionKey,r.positionKey(p));
   assert.deepEqual(b.fairyMove,e.action);
   assert.equal(b.same,r.actionKey(e.action)===r.actionKey(b.js.action));
   decisions++;
   if(!b.same){
    const analyze=a=>{
     const next=r.applyAction(p,a);
     const side=owner=>next.board.reduce((s,x)=>s+(x?.owner===owner&&x.piece!=='king'?values[x.piece]+20:0),0)+next.banks[owner].reduce((s,x)=>s+values[x],0);
     const captured=a.type==='move'?p.board[a.to]?.piece??null:null;
     return {action:a,kind:a.type==='drop'?'drop':captured?'capture':'quiet',captured,deployed:a.type==='drop'?a.piece:null,banks:next.banks,terminal:r.getResult(next),material:side(mover)-side(other),duplicates:dup(next.banks[mover])-dup(next.banks[other])};
    };
    const fairy=analyze(e.action),schness=analyze(b.js.action);
    const excluded=[...(fairy.terminal||schness.terminal?['terminal']:[]),...(fairy.kind!==schness.kind?['mixed-class']:[]),...(fairy.material!==schness.material?['different-material']:[])];
    for(const k of excluded)increment(k);
    const verdict=excluded.length?'excluded':fairy.duplicates<schness.duplicates?'fairy-fewer':fairy.duplicates>schness.duplicates?'fairy-more':'tie';
    increment(verdict);
    rows.push({id,ply,mover,banks:p.banks,fairy,schness,excluded,verdict});
   }
  }
  p=r.applyAction(p,e.action);
 }
 assert.deepEqual(p,game.finalPosition);
}
assert.equal(decisions,964);assert.equal(rows.length,321);
const informative=rows.filter(x=>['fairy-fewer','fairy-more'].includes(x.verdict));
const strata=Object.groupBy(informative,x=>x.fairy.kind);
const byGame=Object.groupBy(informative,x=>x.id);
const fewer=count['fairy-fewer']??0,more=count['fairy-more']??0;
console.log(JSON.stringify({decisions,disagreements:rows.length,count,informative:informative.length,games:Object.keys(byGame).length,strata:Object.fromEntries(Object.entries(strata).map(([k,v])=>[k,v.map(x=>x.verdict)])),passed:informative.length>=24&&Object.keys(byGame).length>=8&&fewer>=2*more,rows},null,2));
