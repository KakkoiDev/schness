import {gunzipSync} from 'node:zlib';import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {analyzeAction,schnessSearch} from '../src/bot.js';import * as rules from '../src/rules.js';
const geometry=JSON.parse(gunzipSync(readFileSync(new URL('../research/competitive-engine-v1/js-king-escape-geometry.json.gz',import.meta.url)))),score=(p,on,mutable=true)=>schnessSearch.score(p,'white',0,{profile:'competitive',kingEscapeGeometry:on,useMutable:mutable});
test('optional king escape geometry corrects only resulting safe-square contributions',()=>{
 let changed=0;for(const c of geometry.cases){const saved=structuredClone(c.position),off=score(c.position,false),on=score(c.position,true),expected=geometry.rows.filter(r=>r.id===c.id).reduce((s,r)=>s+(r.resultingSafe-r.oldSafe)*(r.owner==='white'?1:-1)*14,0);assert.equal(on-off,expected);assert.equal(on,score(c.position,true,false));if(on!==off)changed++;assert.deepEqual(c.position,saved);}assert.equal(changed,3);
 const p=geometry.cases[0].position,options={profile:'competitive',depth:3,quiescenceDepth:0,lateMoveReduction:false};assert.deepEqual(analyzeAction(p,options),analyzeAction(p,{...options,kingEscapeGeometry:false}));assert.throws(()=>analyzeAction(p,{kingEscapeGeometry:1}),/kingEscapeGeometry/);
});
test('multiple and missing king malformed states retain historical evaluation policy',()=>{
 const c=geometry.cases.find(c=>c.id==='black__20262001__0:20');
 for(const mode of ['extra','missing']){const p=structuredClone(c.position);if(mode==='extra'){const i=p.board.findIndex(o=>!o);p.board[i]={owner:'white',piece:'king'};}else p.board=p.board.map(o=>o?.owner==='white'&&o.piece==='king'?null:o);const saved=structuredClone(p);assert.equal(score(p,true),score(p,false));assert.equal(score(p,true,false),score(p,true));assert.deepEqual(p,saved);}
});
test('corrected optional geometry retains all nineteen independent winning mate actions',()=>{
 const old=JSON.parse(readFileSync(new URL('../research/search-performance-v5/tactical-corpus.json',import.meta.url))).cases,newer=JSON.parse(readFileSync(new URL('./fixtures/broad-tactical-mates.json',import.meta.url))).cases;
 for(const c of [...old,...newer]){const saved=structuredClone(c.position),r=analyzeAction(c.position,{profile:'competitive',depth:c.depth??3,kingEscapeGeometry:true,quiescenceDepth:0,lateMoveReduction:false,stopOnProvenWin:false});assert(c.winningActions.includes(rules.actionKey(r.action)),c.id);assert(r.score>=1000000);let p=c.position;for(const a of r.pv)p=rules.applyAction(p,a);assert.deepEqual(c.position,saved);}
});
