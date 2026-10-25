import {chromium} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();page.on('pageerror',e=>console.error(e.message));
 await page.goto('http://127.0.0.1:4187/research/browser-engine-v1/harness.html');const uci=await page.evaluate(()=>ready);
 const result=await page.evaluate(async()=>{
  const rules=await import('/src/rules.js'),bot=await import('/src/bot.js');
  sf.FS.writeFile('/variant.ini',await (await fetch('/research/browser-engine-v1/variant.ini')).text());
  for(const c of ['setoption name Use NNUE value false','setoption name Threads value 1','setoption name Hash value 16','setoption name Move Overhead value 0','setoption name VariantPath value /variant.ini','setoption name UCI_Variant value schnessbench'])sf.postMessage(c);
  await command('isready',/^readyok/);
  const codes={king:'k',rook:'r',bishop:'b',knight:'n'},square=i=>'abcd'[i%4]+(4-Math.floor(i/4));
  const move=a=>a.type==='drop'?codes[a.piece].toUpperCase()+'@'+square(a.to):square(a.from)+square(a.to);
  const fen=p=>{const rows=[];for(let y=0;y<4;y++){let row='',empty=0;for(let x=0;x<4;x++){const o=p.board[y*4+x];if(!o){empty++;continue;}if(empty)row+=empty;empty=0;const c=codes[o.piece];row+=o.owner==='white'?c.toUpperCase():c;}if(empty)row+=empty;rows.push(row);}return rows.join('/')+'['+p.banks.white.map(x=>codes[x].toUpperCase()).join('')+p.banks.black.map(x=>codes[x]).join('')+'] '+(p.turn==='white'?'w':'b')+' - - 0 1';};
  const corpus=(await(await fetch('/research/search-performance-v2/positions.json')).json()).map(item=>({...item,position:rules.createPosition({...item.position,repetitions:{},rules:{allowCheckingDrops:false,experiment:'capture-bank',bankCapacity:6}})}));
  const perft=(p,d)=>d===0?1:rules.legalActionsUnchecked(p).reduce((n,a)=>n+perft(rules.applyLegalAction(p,a),d-1),0);
  const parity=[],timings=[],search=[];
  // Legal-tree comparison includes every root move's subtree, so capture-to-bank semantics are checked too.
  for(let i=0;i<corpus.length;i++){
   const {id,position:p}=corpus[i],depth=4;sf.postMessage('position fen '+fen(p));
   const t=performance.now(),out=await command('go perft '+depth,/Nodes searched/),fairyMs=performance.now()-t;
   const theirs=Object.fromEntries(out.filter(x=>/^\S+: \d+$/.test(x)).map(x=>{const [m,n]=x.split(': ');return[m,Number(n)];}));
   const t2=performance.now(),ours=Object.fromEntries(rules.legalActions(p).map(a=>[move(a),perft(rules.applyLegalAction(p,a),depth-1)])),ourMs=performance.now()-t2;
   const keys=new Set([...Object.keys(ours),...Object.keys(theirs)]),mismatches=[...keys].filter(k=>ours[k]!==theirs[k]);
   parity.push({id,depth,nodes:Object.values(ours).reduce((a,b)=>a+b,0),mismatches,ours,theirs});timings.push({id,depth,fairyMs,ourMs});
  }
  if(parity.some(p=>p.mismatches.length))return {startupMs,parity,timings,error:'Rule parity failed; search comparison withheld'};
  // Warm up both searches, then alternate order across three repeats. Fresh hash each external search.
  bot.analyzeAction(corpus[0].position,{depth:3});sf.postMessage('position fen '+fen(corpus[0].position));await command('go movetime 100',/^bestmove /);
  for(let repeat=0;repeat<3;repeat++)for(const {id,position:p} of corpus){
   const row={id,repeat};for(const name of repeat%2?['ours','fairy']:['fairy','ours']){
    if(name==='ours'){const t=performance.now(),r=bot.analyzeAction(p,{depth:100,maxNodes:10000000,maxMillis:100,repetitionAversion:false});row.ours={millis:performance.now()-t,nodes:r.nodes,depth:r.completedDepth,move:move(r.action),stopped:r.stopped};}
    else{sf.postMessage('setoption name Clear Hash');sf.postMessage('position fen '+fen(p));await command('isready',/^readyok/);const t=performance.now(),out=await command('go movetime 100',/^bestmove /),info=out.filter(x=>/^info depth .* nodes /.test(x)&&!/ (upperbound|lowerbound) /.test(x)).at(-1),best=out.find(x=>/^bestmove /.test(x)).split(' ')[1];row.fairy={millis:performance.now()-t,nodes:Number(info?.match(/ nodes (\d+)/)?.[1]),depth:Number(info?.match(/ depth (\d+)/)?.[1]),move:best,info,output:out};}
   }
   const legal=new Set(rules.legalActions(p).map(move));if(!legal.has(row.ours.move)||!legal.has(row.fairy.move))throw Error('Illegal engine move '+JSON.stringify(row));search.push(row);
  }
  return {startupMs,parity,timings,search,environment:{userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency,crossOriginIsolated}};
 });
 const sources={};for(const p of ['src/search.js','src/bot.js','src/rules.js','scripts/bench-browser-engines.js','research/browser-engine-v1/variant.ini','/tmp/schness-browser-engines/package/stockfish.js','/tmp/schness-browser-engines/package/stockfish.wasm'])sources[p]=createHash('sha256').update(await readFile(p)).digest('hex');
 const data={date:new Date().toISOString(),browser:browser.version(),cpu:os.cpus()[0]?.model,platform:os.platform(),arch:os.arch(),externalPackage:'fairy-stockfish-nnue.wasm@1.1.12',externalNNUE:false,externalThreads:1,uci,sources,...result};
 await writeFile('research/browser-engine-v1/results.json',JSON.stringify(data,null,2)+'\n');
 console.log(JSON.stringify({positions:result.parity.length,parityFailures:result.parity.filter(p=>p.mismatches.length),searches:result.search?.length,startupMs:result.startupMs,error:result.error},null,2));
}finally{await browser.close();}
