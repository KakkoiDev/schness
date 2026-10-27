/** Language-neutral requests and semantic assertions for future engine backends. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {legalActions,applyAction,actionKey} from '../src/rules.js';
export const graphCorpus=JSON.parse(readFileSync(new URL('../test/fixtures/engine-contract/graphs.json',import.meta.url)));
const ruleCorpus=JSON.parse(readFileSync(new URL('../test/fixtures/engine-contract/rules.json',import.meta.url)));
const tactics=JSON.parse(readFileSync(new URL('../research/search-performance-v5/tactical-corpus.json',import.meta.url)));
export function contractRequests(){
 const graphs=graphCorpus.cases.map(c=>({schemaVersion:1,id:c.id,game:'graph-v1',state:graphCorpus.games[c.game],options:c.options,expected:c.expected}));
 const mates=tactics.cases.map(c=>({schemaVersion:1,id:`schness:${c.id}`,game:'schness-v1',state:c.position,options:{profile:'reference',depth:c.depth,quiescenceDepth:0,lateMoveReduction:false},expected:{winningActions:c.winningActions,completedDepth:c.depth}}));
 return [...graphs,...mates,...ruleCorpus.cases];
}
export function wireRequest({expected,...request}){return request;}
export function assertContract(request,result){
 const {expected,options}=request;
 assert.equal(result.id,request.id,'response correlation');
 if(request.game==='schness-rules-v1'){
  assert.deepEqual(result.legalActionKeys,expected.legalActionKeys,'complete legal action set');
  assert.deepEqual(result.result,expected.result,'terminal adjudication');
  assert.deepEqual(result.nextState,expected.nextState,'full transition including banks/rights/history');return;
 }
 assert(!result.error,JSON.stringify(result.error));
 assert.equal(result.requestedDepth,options.depth??options.strength??4,'requested depth');
 assert.equal(result.completedDepth,expected.completedDepth,'completed depth');
 assert.equal(result.stopped,expected.stopped??false,'budget status');
 assert(Number.isInteger(result.nodes)&&result.nodes>=0,'node count');
 if(options.maxNodes)assert(result.nodes<=options.maxNodes,'shared node budget');
 if('score'in expected)assert.equal(result.score,expected.score,'root-perspective score');
 else assert(Number.isFinite(result.score)&&result.score>=1_000_000,'winning mate score');
 if(expected.bestActions)assert(expected.bestActions.includes(result.action),'optimal/legal action');
 if(expected.winningActions)assert(expected.winningActions.includes(actionKey(result.action)),'independent mate action');
 assert(Array.isArray(result.pv)&&Array.isArray(result.variations),'published continuations');
 if(result.score===null){assert.deepEqual(result.pv,[]);assert.deepEqual(result.variations,[]);}
 if(result.action!==null&&result.completedDepth>0){
  assert.deepEqual(result.pv[0],result.action,'PV starts with chosen move');
  assert.deepEqual(result.variations[0].action,result.action);assert.equal(result.variations[0].score,result.score);
 }
 if(expected.variationScores)assert.deepEqual(result.variations.map(v=>v.score),expected.variationScores);
 const ids=new Set();
 const replay=line=>{
  if(request.game==='graph-v1'){
   let p=request.state.root;
   for(const action of line){assert(Object.hasOwn(request.state.nodes[p].next??{},action),'legal graph continuation');p=request.state.nodes[p].next[action];}
  }else{let p=request.state;for(const action of line){assert(legalActions(p).some(a=>actionKey(a)===actionKey(action)),'legal Schness continuation');p=applyAction(p,action);}}
 };
 replay(result.pv);
 for(let i=0;i<result.variations.length;i++){
  const v=result.variations[i],id=JSON.stringify(v.action);assert(!ids.has(id),'unique root alternatives');ids.add(id);
  assert(Number.isFinite(v.score));if(i)assert(result.variations[i-1].score>=v.score,'ranked root alternatives');
  assert.deepEqual(v.pv[0],v.action);replay(v.pv);
 }
}
