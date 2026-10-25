import {chromium} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:4173/src/search.js');
 const result=await page.evaluate(async()=>{
  const {analyzeAction:baseline}=await import('/research/search-performance-v5/baseline-bot.js'),{analyzeAction:candidate}=await import('/src/bot.js'),rules=await import('/src/rules.js');
  const corpus=await(await fetch('/research/search-performance-v2/positions.json')).json(),runs=[];
  for(const fn of [baseline,candidate])for(const item of corpus.slice(0,4))fn(item.position,{depth:3});
  for(let repeat=0;repeat<3;repeat++)for(const item of corpus){const row={id:item.id,repeat};for(const name of repeat%2?['candidate','baseline']:['baseline','candidate']){
   const t=performance.now(),r=(name==='baseline'?baseline:candidate)(item.position,{depth:100,maxNodes:10000000,maxMillis:100,repetitionAversion:true});
   if(!rules.legalActions(item.position).some(a=>rules.actionKey(a)===rules.actionKey(r.action)))throw Error('Illegal browser action');
   for(const v of r.variations){let p=item.position;for(const a of v.pv)p=rules.applyAction(p,a);}
   row[name]={...r,millis:performance.now()-t};
  }runs.push(row);}
  return {runs,userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency};
 });
 const sources={};for(const p of ['src/search.js','src/bot.js','src/rules.js','src/board-masks.js','scripts/bench-browser-search-v5.js',...['search','rules','bot','board-masks'].map(n=>'research/search-performance-v5/baseline-'+n+'.js'),'research/search-performance-v2/positions.json'])sources[p]=createHash('sha256').update(await readFile(p)).digest('hex');
 await writeFile('research/search-performance-v5/browser-results.json',JSON.stringify({browser:browser.version(),cpu:os.cpus()[0]?.model,arch:os.arch(),date:new Date().toISOString(),sources,...result},null,2)+'\n');
 const summary={};for(const name of ['baseline','candidate']){const rows=result.runs.map(x=>x[name]);summary[name]={searches:rows.length,meanDepth:rows.reduce((n,x)=>n+x.completedDepth,0)/rows.length,meanMillis:rows.reduce((n,x)=>n+x.millis,0)/rows.length,nodes:rows.reduce((n,x)=>n+x.nodes,0)};}
 await writeFile('research/search-performance-v5/browser-summary.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
}finally{await browser.close();}
