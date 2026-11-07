/** Explicit fixture maintenance only; CI never rewrites expectations. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as reference from '../research/search-performance-v5/baseline-rules.js';
import {VARIANTS} from '../src/variants.js';
const cases=[];let seed=271026;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
for(const [variant,rules] of Object.entries(VARIANTS)){
 let state=reference.createInitialPosition(rules),prefix=[];
 for(let ply=0;ply<=30;ply++){
  const legal=reference.legalActions(state),result=reference.getResult(state);
  if([0,2,12,30].includes(ply)||result){
   const action=result?null:legal.find(a=>a.type==='move'&&state.board[a.to])??legal[0]??null;
   cases.push({id:`rules:${variant}:${ply}`,game:'schness-rules-v1',schemaVersion:1,state,action,prefix,
    expected:{legalActionKeys:legal.map(reference.actionKey).sort(),result,nextState:action?reference.applyAction(state,action):null}});
  }
  if(result||!legal.length||ply===30)break;
  const action=legal[Math.floor(random()*legal.length)];state=reference.applyAction(state,action);prefix=[...prefix,action];
 }
}
const sources=['research/search-performance-v5/baseline-rules.js','research/search-performance-v5/baseline-board-masks.js','src/variants.js'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}));
writeFileSync(new URL('../test/fixtures/engine-contract/rules.json',import.meta.url),JSON.stringify({schemaVersion:1,provenance:'Fixed snapshots from independent frozen v5 rules, not current optimized rules. Seed271026. Prefixes retained for review. Changes require deliberate fixture review.',sources,cases},null,2)+'\n');
console.log(`Wrote ${cases.length} reviewed-rule candidates across ${Object.keys(VARIANTS).length} presets; review fixture diff before committing.`);
