import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {contractRequests,wireRequest,assertContract,graphCorpus} from '../scripts/engine-contract.js';
import {executeContract} from '../scripts/engine-contract-js.js';
import {VARIANTS} from '../src/variants.js';
const requests=contractRequests();

test('portable contracts cover exact search, independent mates and all production rule presets',()=>{
 assert.equal(requests.length,174);assert.equal(new Set(requests.map(r=>r.id)).size,requests.length);
 for(const request of requests){
  const before=structuredClone(request),response=executeContract(wireRequest(request));
  assertContract(request,response);assert.deepEqual(request,before,request.id+' input ownership');
 }
 const rules=requests.filter(r=>r.game==='schness-rules-v1');
 assert.equal(rules.length,142);
 for(const id of Object.keys(VARIANTS))assert(rules.some(r=>r.id.startsWith(`rules:${id}:`)),id);
});

test('hand-authored graph answers agree with an independent exhaustive horizon oracle',()=>{
 for(const c of graphCorpus.cases){
  const game=graphCorpus.games[c.game],who=game.nodes[game.root].turn,sign=who==='A'?1:-1;
  const depth=c.options.depth??c.options.strength??4;
  if(!depth||c.options.maxNodes)continue;
  function exhaustive(p,d,q,e){
   const n=game.nodes[p];if(n.terminal!==undefined)return n.terminal*sign;
   const stand=(n.value??0)*sign,maximum=n.turn===who;
   const combine=values=>maximum?Math.max(...values):Math.min(...values);
   if(d)return combine(Object.values(n.next).map(next=>exhaustive(next,d-1,q,e)));
   if(!q&&!(n.danger&&e))return stand;
   const candidates=Object.entries(n.next??{}).filter(([action])=>n.danger||(n.noisy??[]).includes(action));
   const values=candidates.map(([,next])=>exhaustive(next,0,Math.max(0,q-1),q?e:e-1));
   if(!n.danger)values.push(stand);return combine(values);
  }
  assert.equal(exhaustive(game.root,depth,c.options.quiescenceDepth??0,c.options.quiescenceEvasionDepth??0),c.expected.score,c.id);
 }
});

test('portable exact answers survive cache, PVS and iteration strategy changes',()=>{
 for(const request of requests.filter(r=>r.game==='graph-v1'&&!r.options.maxNodes)){
  for(const mode of [{useCache:false},{cacheQuiescence:true,cacheEvaluation:true},{iterativeDeepening:true,aspirationWindow:1},{principalVariation:false,maxTableEntries:1}]){
   assertContract(request,executeContract({...wireRequest(request),options:{...request.options,...mode}}));
  }
 }
});

test('rules fixture expectations are tied to the frozen independent source hashes',()=>{
 const corpus=JSON.parse(readFileSync(new URL('./fixtures/engine-contract/rules.json',import.meta.url)));
 for(const source of corpus.sources)assert.equal(createHash('sha256').update(readFileSync(new URL('../'+source.path,import.meta.url))).digest('hex'),source.sha256,source.path);
});

test('conformance runner rejects wrong scores, fake depths, illegal lines and state corruption',()=>{
 const request=requests.find(r=>r.id==='horizon-two-actions'),good=executeContract(wireRequest(request));
 for(const mutation of [{score:99},{completedDepth:20},{pv:['imaginary']},{id:'another-request'},{stopped:true}])assert.throws(()=>assertContract(request,{...good,...mutation}));
 const rules=requests.find(r=>r.game==='schness-rules-v1'),result=executeContract(wireRequest(rules));
 assert.throws(()=>assertContract(rules,{...result,legalActionKeys:[]}));
 assert.throws(()=>assertContract(rules,{...result,nextState:{}}));
});

test('standalone JSON-lines harness validates a backend and correlates malformed-request errors',()=>{
 assert.match(execFileSync(process.execPath,['scripts/check-engine-contract.js'],{encoding:'utf8'}),/Passed 174/);
 const valid=wireRequest(requests[0]);
 const text=execFileSync(process.execPath,['scripts/engine-contract-js.js'],{input:'{bad json}\n'+JSON.stringify({...valid,schemaVersion:999})+'\n'+JSON.stringify(valid)+'\n',encoding:'utf8'});
 const replies=text.trim().split('\n').map(JSON.parse);
 assert(replies[0].error);assert.equal(replies[0].id,null);
 assert(replies[1].error);assert.equal(replies[1].id,valid.id);
 assertContract(requests[0],replies[2]);
});
