/** Aggregate paired decisions without treating a Fairy move or Schness score as ground truth. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const out=resolve(process.argv[2]),json=async p=>JSON.parse(await readFile(out+'/'+p));
const m=await json('manifest.json'),bench=await json('analysis/progress.json'),deep=await json('deep-analysis/progress.json');
assert.equal(bench.status,'completed');assert.equal(deep.status,'completed');assert.equal(bench.plies,deep.plies);
const r=await import(pathToFileURL(out+'/runtime/src/rules.js').href);
const bins={},examples=[],pairs={},fairyTypes={},jsTypes={};
const bump=(map,key)=>{map[key]=(map[key]??0)+1;};
let n=0;
const classify=(p,a)=>a.type==='drop'?'drop':p.board[a.to]?'capture':'quiet move';
for(const task of m.tasks){
 const g=await json('games/'+task.id+'.json'),b=await json('analysis/'+task.id+'.json'),d=await json('deep-analysis/'+task.id+'.json');
 assert.equal(b.sourceSha256,d.sourceSha256);assert.equal(g.plies-2,b.rows.length);assert.equal(d.rows.length,b.rows.length);
 let p=r.createInitialPosition(m.rules);
 for(const [ply,e] of g.transcript.entries()){
  if(ply>=2){
   const x=b.rows[ply-2],y=d.rows[ply-2],h=y.horizons.at(-1);assert.equal(y.ply,ply);assert.equal(x.ply,ply);
   const f=classify(p,e.action),j=classify(p,x.js.action),stage=ply<14?'first 12 decisions':ply<34?'decisions 13–32':'decision 33 onward',checked=r.isInCheck(p,p.turn);
   bump(fairyTypes,f);bump(jsTypes,j);bump(pairs,f+' → '+j);
   for(const name of ['all',stage,'Fairy '+f,checked?'in check':'not in check',p.turn]){
    const c=bins[name]??={plies:0,agreement:0,fairyTop3:0,fairyBest:0,deepPrefersFairy:0,deepPrefersSchness:0,deepTie:0,benchNoDepth:0,deepSix:0};
    c.plies++;c.agreement+=Number(x.same);c.fairyTop3+=Number(h.fairyRank<=3);c.fairyBest+=Number(h.fairyRank===1);
    c.deepPrefersFairy+=Number(h.fairyScore>h.benchScore);c.deepPrefersSchness+=Number(h.fairyScore<h.benchScore);c.deepTie+=Number(h.fairyScore===h.benchScore);
    c.benchNoDepth+=Number(x.js.completedDepth===0);c.deepSix+=Number(h.depth===6);
   }
   if(!x.same&&h.fairyScore!==h.benchScore){
    const actionText=a=>a.type==='drop'?a.piece+'@'+square(a.to):square(a.from)+'–'+square(a.to);
    const square=i=>'abcd'[i%4]+(4-(i>>2));
    const depth=h.depth,delta=h.fairyScore-h.benchScore;
    const branches=y.events.filter(q=>q.kind==='finish'&&q.depth===depth);
    examples.push({game:task.id,ply:ply-1,side:p.turn,fairy:actionText(e.action),js:actionText(x.js.action),depth,delta,fairyRank:h.fairyRank,scoreFairy:h.fairyScore,scoreJS:h.benchScore,
     fairyPV:branches.find(q=>r.actionKey(q.action)===r.actionKey(e.action)).pv.map(actionText),
     jsPV:branches.find(q=>r.actionKey(q.action)===r.actionKey(x.js.action)).pv.map(actionText)});
   }
   n++;
  }
  p=r.applyAction(p,e.action);
 }
 assert.deepEqual(p,g.finalPosition);
}
assert.equal(n,bench.plies);
const uniqueExamples=(sign)=>{const games=new Set();return examples.filter(e=>sign*e.delta>0).sort((a,b)=>sign*(b.delta-a.delta)).filter(e=>{if(games.has(e.game))return false;games.add(e.game);return true;}).slice(0,4);};
const highlights={favorsFairy:uniqueExamples(1),favorsSchness:uniqueExamples(-1)};
const pct=(x,y)=>(100*x/y).toFixed(1)+'%';
const all=bins.all;
const lines=[
 '# Fairy-Stockfish self-play and Schness replay',
 '',
 `Fairy played both sides in all ${deep.games} king layouts before Schness analysis began. The recorded games contain ${n} engine decisions; fixed king placements are excluded. Results: ${Object.entries(bench.results).map(([k,v])=>v+' '+k).join(', ')}.`,
 '',
 `Schness agreed at 100 ms on ${all.agreement}/${n} moves (${pct(all.agreement,n)}). The deeper replay had no clock cap, reached depth six on ${deep.atTarget}/${n}, and retained ${deep.scoredBranches.toLocaleString('en-US')} finished root branches across all depths. Root rankings use the last fully completed depth for each position, never the partial final iteration.`,
 '',
 'On disagreements, the deeper Schness search preferred the Fairy move over the 100 ms Schness move in '+all.deepPrefersFairy+' cases, the Schness move in '+all.deepPrefersSchness+', and gave the same score in '+(all.deepTie-all.agreement)+'. These are within-engine scores at a finite horizon, not objective move-quality labels.',
 '',
 '| Position or move group | Moves | Same at 100 ms | Fairy top 3 in deeper Schness | Fairy strictly preferred | Schness strictly preferred |',
 '|---|---:|---:|---:|---:|---:|',
 ...Object.entries(bins).map(([name,c])=>`| ${name} | ${c.plies} | ${c.agreement} | ${c.fairyTop3} | ${c.deepPrefersFairy} | ${c.deepPrefersSchness} |`),
 '',
 '### Examples with the largest score differences',
 '',
 'At most one example per game per direction. Mate-band and ordinary scores are kept raw and are not comparable in magnitude.',
 ...Object.entries(highlights).flatMap(([name,rows])=>['',name+':',...rows.map(x=>`- ${x.game}, decision ${x.ply}, ${x.side}: Fairy ${x.fairy}; Schness ${x.js}. At depth ${x.depth}, Schness scored them ${x.scoreFairy} and ${x.scoreJS}.`)]),
 '',
 'This is a decision comparison, not a head-to-head match or a training run. The 16 games share a ruleset and opening family; adjacent positions are correlated. For any future learning experiment, split by entire game or layout and reserve fresh games for validation. The raw paired data preserve move class, score, search depth, nodes, and continuations.'
];
await writeFile(out+'/report.md',lines.join('\n')+'\n');
await writeFile(out+'/comparison-summary.json',JSON.stringify({bins,pairs,fairyTypes,jsTypes,highlights,deep,bench},null,2)+'\n');
console.log(JSON.stringify({all,highlights}));
