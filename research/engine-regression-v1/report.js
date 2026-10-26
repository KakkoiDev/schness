import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(process.argv[2]??'output/local-experiments/sharp-v7-v2-full-v1-2026-10-25');
const manifest=JSON.parse(await readFile(root+'/manifest.json'));
const expected=manifest.totalGames,rows={};
for(const v of manifest.config.variants)rows[v]=Object.fromEntries(['white','black'].map(color=>[color,{games:0,candidateWins:0,baselineWins:0,draws:0,drawReasons:{},totalPlies:0,candidateMillis:0,baselineMillis:0,candidateDecisions:0,baselineDecisions:0}]));
const seen=new Set();
for(const file of (await readdir(root+'/games')).filter(n=>n.endsWith('.json'))){
 const g=JSON.parse(await readFile(root+'/games/'+file)),meta=g.localExperiment;assert.equal(meta.sourceFingerprint,manifest.sourceFingerprint);assert(!seen.has(meta.taskId));seen.add(meta.taskId);
 const row=rows[meta.variant][g.candidateColor];assert(row);row.games++;row.totalPlies+=g.plies;
 if(g.result.winner)row[g.result.winner===g.candidateColor?'candidateWins':'baselineWins']++;else{row.draws++;row.drawReasons[g.result.reason]=(row.drawReasons[g.result.reason]??0)+1;}
 for(const e of g.transcript)if(e.engine){row[e.engine+'Millis']+=e.millis;row[e.engine+'Decisions']++;}
}
for(const colors of Object.values(rows))for(const r of Object.values(colors)){r.candidateMeanMillis=r.candidateDecisions?r.candidateMillis/r.candidateDecisions:null;r.baselineMeanMillis=r.baselineDecisions?r.baselineMillis/r.baselineDecisions:null;r.candidateWinRate=r.games?r.candidateWins/r.games:null;r.candidateScore=r.games?(r.candidateWins+r.draws/2)/r.games:null;r.decisiveRate=r.games?(r.candidateWins+r.baselineWins)/r.games:null;}
const complete=seen.size===expected,rates={complete,completed:seen.size,total:expected,sourceFingerprint:manifest.sourceFingerprint,rows};
await writeFile(root+'/rates.json',JSON.stringify(rates,null,2)+'\n');
const lines=[`# Sharp v7 depth ${manifest.config.candidateDepth??4} vs frozen Sharp v2 depth 4 — full shared-preset bench`,'',`Status: ${complete?'complete':'partial'} (${seen.size}/${expected}). Source fingerprint: ${manifest.sourceFingerprint}.`,'','Two separate fixed-color schedules; six seeds and 16 king starts per variant per color.',`Candidate searches ${manifest.config.candidateDepth??4} individual actions; baseline searches four. Seeded tie selection and repetition aversion.`,'No time/node cap, checking extension or late-move reduction. Standard 200-total-ply ceiling.','Both engines use the same legal rules; each saved transition is cross-checked against frozen v2.','','| Variant | New engine color | Games | New wins | v2 wins | Draws | New score | New mean ms/move | v2 mean ms/move | Draw reasons |','|---|---|---:|---:|---:|---:|---:|---:|---:|---|'];
for(const [variant,colors]of Object.entries(rows))for(const[color,r]of Object.entries(colors))lines.push(`| ${variant} | ${color} | ${r.games} | ${r.candidateWins} | ${r.baselineWins} | ${r.draws} | ${r.candidateScore===null?'—':(r.candidateScore*100).toFixed(1)+'%'} | ${r.candidateMeanMillis?.toFixed(2)??'—'} | ${r.baselineMeanMillis?.toFixed(2)??'—'} | ${Object.entries(r.drawReasons).map(([k,v])=>k+': '+v).join(', ')||'—'} |`);
lines.push('','Score counts a win as 1 and a draw as ½. A score of at least 50% is an observed benchmark result, not proof of universal non-inferiority. Seeds repeat the same 16 starts; no Elo or independent-game confidence interval is claimed. Ceiling draws are artificial. Color-specific counts are kept separate; mixed engine games do not measure intrinsic variant color balance.','', 'This covers all 36 shared production presets. Historical custom-army, capture-delay, objective and charge-bank datasets use distinct frozen rules/engine adapters and are not silently relabelled or pooled into this Sharp v2 comparison. Timing is recorded under parallel load and is not an isolated performance benchmark.');
await writeFile(root+'/report.md',lines.join('\n')+'\n');console.log(JSON.stringify({complete,completed:seen.size,total:expected}));
