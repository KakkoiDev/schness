/** Diagnostic decomposition of current competitive evaluation; no fitting or strength claim. */
import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {schnessSearch} from '../../src/bot.js';
import {applyAction,getResult,legalActionsUnchecked,WHITE,BLACK} from '../../src/rules.js';
import {boardMasks,masksAttack,masksInCheck} from '../../src/board-masks.js';
const values={king:0,rook:500,bishop:320,knight:300};
function components(p){
 const m=boardMasks(p.board),r={board:0,reserve:0,mobility:0,check:0,king:0,central:0,defended:0,exposed:0};
 for(let sq=0;sq<16;sq++){const o=p.board[sq];if(!o)continue;const sign=o.owner===WHITE?1:-1,enemy=o.owner===WHITE?BLACK:WHITE,x=sq%4,y=sq>>2;r.board+=sign*(values[o.piece]+(o.piece==='king'?0:20));
  if(o.piece==='king'){let safe=0,pressure=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if((!dx&&!dy)||xx<0||xx>3||yy<0||yy>3)continue;const to=yy*4+xx;if(masksAttack(m,to,enemy))pressure++;else if(p.board[to]?.owner!==o.owner)safe++;}r.king+=sign*(safe*14-pressure*20);}
  else{const defended=masksAttack(m,sq,o.owner);r.central+=sign*((x===1||x===2?6:0)+(y===1||y===2?6:0));r.defended+=sign*(defended?12:0);if(masksAttack(m,sq,enemy))r.exposed-=sign*Math.round(values[o.piece]*(defended?.12:.45));}
 }
 if(['capture-bank','permanent-loss'].includes(p.rules?.experiment))for(const owner of [WHITE,BLACK])for(const piece of p.banks[owner])r.reserve+=(owner===WHITE?1:-1)*values[piece];
 r.mobility=(legalActionsUnchecked({...p,turn:WHITE},m).length-legalActionsUnchecked({...p,turn:BLACK},m).length)*2;r.check=(masksInCheck(m,BLACK)?30:0)-(masksInCheck(m,WHITE)?30:0);r.total=Object.values(r).reduce((a,b)=>a+b,0);
 if(!getResult(p))assert.equal(r.total,schnessSearch.score(p,WHITE,0,{profile:'competitive',quiescenceDepth:0,quiescenceEvasionDepth:0}));return r;
}
const input=JSON.parse(await readFile('research/competitive-engine-v1/js-early-swings.json')),deep=JSON.parse(await readFile('research/competitive-engine-v1/js-bishop-deployment-diagnosis.json'));
const rows=input.cases.map(c=>{const best=input.results.find(r=>r.id===c.id&&r.variant===c.variant&&r.comparable)?.best?.action;const root=components(c.position),played=components(applyAction(c.position,c.playedAction));return {id:c.id,variant:c.variant,playedAction:c.playedAction,root,played,bestAction:best,best:best?components(applyAction(c.position,best)):null};});
const leaves=[];for(const c of deep.cases){const r=deep.results.find(r=>r.id===c.id&&r.variant===c.variant&&r.depth===8&&!r.options.lateMoveReduction);if(!r?.complete)continue;for(const kind of ['best','forced']){let p=kind==='forced'?applyAction(c.position,c.playedAction):c.position;for(const a of r[kind].pv)p=applyAction(p,a);leaves.push({id:c.id,variant:c.variant,kind,searchScore:r[kind].score,terminal:getResult(p),components:components(p),position:p});}}
const hashes={};for(const p of ['src/bot.js','src/rules.js','src/board-masks.js','research/competitive-engine-v1/js-early-swings.json','research/competitive-engine-v1/js-bishop-deployment-diagnosis.json'])hashes[p]=createHash('sha256').update(await readFile(p)).digest('hex');
await writeFile('research/competitive-engine-v1/js-evaluation-components.json',JSON.stringify({purpose:'Decompose exact current competitive static evaluation on all55 selected early loss roots/played children and matched depth8 principal-variation leaves for3selected cases. Assert totals against engine depth0 evaluation on nonterminal states. Search scores need not equal leaf static scores because quiescence/terminal/root perspective differ. No tuning, independent labels, strength or causal claim.',hashes,scriptSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),rows,leaves},null,2)+'\n');console.log(JSON.stringify({roots:rows.length,leaves:leaves.map(({id,variant,kind,components})=>({id,variant,kind,components}))}));
