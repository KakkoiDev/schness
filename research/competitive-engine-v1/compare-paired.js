/** Matched completed schedules; descriptive changes, never independent-game inference. */
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export function comparePaired(previous,current){
 const index=new Map();
 const key=g=>{if(!['white','black'].includes(g.task?.color)||!Number.isInteger(g.task.seed)||typeof g.startFen!=='string'||!g.startFen)throw Error('Invalid match identity');if(!g.result||!['win','draw'].includes(g.result.type)|| (g.result.type==='win'?!['white','black'].includes(g.result.winner):g.result.winner!=null))throw Error('Invalid outcome');return JSON.stringify([g.task.color,g.task.seed,g.startFen]);};
 const outcome=g=>g.result.winner?(g.result.winner===g.task.color?'win':'loss'):'draw';
 for(const g of previous){const k=key(g);if(index.has(k))throw Error('Duplicate previous pair');index.set(k,g);}
 const rows={white:{games:0,previousWins:0,currentWins:0,gainedWins:0,lostWins:0},black:{games:0,previousWins:0,currentWins:0,gainedWins:0,lostWins:0}};
 const seen=new Set();
 for(const g of current){const k=key(g);if(seen.has(k))throw Error('Duplicate current pair');seen.add(k);const old=index.get(k);if(!old)throw Error('Unmatched start/color/seed');const r=rows[g.task.color];if(!r)throw Error('Invalid candidate color');const a=outcome(old)==='win',b=outcome(g)==='win';r.games++;r.previousWins+=+a;r.currentWins+=+b;r.gainedWins+=+(!a&&b);r.lostWins+=+(a&&!b);}
 if(seen.size!==index.size)throw Error('Incomplete matched schedule');
 for(const r of Object.values(rows)){if(!r.games)throw Error('Both colors required');r.rawWinRateChange=(r.currentWins-r.previousWins)/r.games;}
 return {rows,independentSamples:false,claim:'Descriptive paired outcomes only; requires identical rules/opponent/budgets and fresh confirmation for strength claims.'};
}
export function assertComparable(a,b){
 for(const field of ['rules','external','candidateMillis','budgetMillis','maxPlies']){if(a[field]===undefined||b[field]===undefined)throw Error('Missing comparison contract: '+field);assert.deepEqual(a[field],b[field],'Comparison mismatch: '+field);}
}
async function load(root){const m=JSON.parse(await readFile(root+'/manifest.json'));const games=[];for(const f of await readdir(root+'/games'))if(f.endsWith('.json'))games.push(JSON.parse(await readFile(root+'/games/'+f)));if(games.length!==m.totalGames)throw Error('Completed schedule required');return {m,games};}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [a,b]=await Promise.all(process.argv.slice(2,4).map(load));
 assertComparable(a.m,b.m);
 // Exact rules/opponent identity are retained in both manifests for reviewer inspection.
 console.log(JSON.stringify(comparePaired(a.games,b.games),null,2));
}
