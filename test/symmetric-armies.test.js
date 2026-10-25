import test from 'node:test';
import assert from 'node:assert/strict';
import {VARIANTS,VARIANT_IDS} from '../research/armies-v1/core/variants.js';
import {createInitialPosition,applyAction,positionKey} from '../research/armies-v1/core/rules.js';
import {playTournamentGame} from '../research/armies-v1/core/tournament.js';
import {tasksFor} from '../research/armies-v1/run.js';
test('all 31 symmetric armies use only Classic movement and capture rules',()=>{
 assert.equal(VARIANT_IDS.length,31);assert.equal(tasksFor({variants:VARIANT_IDS,seeds:[1,2,3],repetitions:1}).length,1488);
 const unique=new Set();for(const r of Object.values(VARIANTS)){const p=createInitialPosition(r);assert.deepEqual(p.banks.white,p.banks.black);assert.deepEqual(p.banks.white,r.army);assert.equal(p.rules.allowCheckingDrops,false);assert.equal(p.rules.experiment,undefined);assert.ok(!unique.has(r.army.join(',')));unique.add(r.army.join(','));}
});
test('each army replays and conserves material separately for both owners',()=>{
 for(const rules of Object.values(VARIANTS)){const g=playTournamentGame({index:0,seed:120,white:'learning',black:'learning',maxPlies:12,researchRules:rules});let p=createInitialPosition(rules);for(const e of g.transcript){p=applyAction(p,e.action);assert.equal(positionKey(p),e.resultingKey);}assert.deepEqual(p,g.finalPosition);
 for(const side of ['white','black'])assert.equal(p.board.filter(x=>x?.owner===side&&x.piece!=='king').length+p.banks[side].length,rules.army.length);
 }
});
test('standard RBN reproduces the frozen Classic baseline actions and results',async()=>{
 const {playTournamentGame:baseline}=await import('../research/data/balance-v1-2026-10-24/runtime/core/tournament.js');
 const options={index:5,seed:900,white:'learning',black:'learning',maxPlies:14};
 const a=baseline({...options,researchRules:{allowCheckingDrops:false}}),b=playTournamentGame({...options,researchRules:VARIANTS['army-RBN']});
 assert.deepEqual(b.transcript.map(e=>e.action),a.transcript.map(e=>e.action));assert.deepEqual(b.result,a.result);
});
