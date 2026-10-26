import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const run=resolve(process.argv[2]),server=spawn('python3',['-u','-c',"from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler\nclass H(SimpleHTTPRequestHandler):\n def end_headers(self):\n  self.send_header('Cross-Origin-Opener-Policy','same-origin');self.send_header('Cross-Origin-Embedder-Policy','require-corp');super().end_headers()\n def log_message(self,*args):pass\nThreadingHTTPServer(('127.0.0.1',4189),H).serve_forever()"],{cwd:run+'/runtime',stdio:'ignore'});let browser;
try{
 for(let n=0;n<100;n++){try{await fetch('http://127.0.0.1:4189/package.json');break;}catch{await new Promise(r=>setTimeout(r,100));if(n===99)throw Error('Server unavailable');}}
 browser=await chromium.launch({headless:true});const page=await browser.newPage();await page.goto('http://127.0.0.1:4189/research/fairy-match-v1/harness.html');const uci=await page.evaluate(()=>ready);assert(uci.some(s=>s.includes('b2e693ef')));
 const result=await page.evaluate(async()=>{
  const r=await import('/src/rules.js'),b=await import('/src/bot.js');sf.FS.writeFile('/variant.ini',await(await fetch('/research/fairy-match-v1/variant.ini')).text());for(const c of ['setoption name Use NNUE value false','setoption name Threads value 1','setoption name Hash value 16','setoption name Move Overhead value 0','setoption name VariantPath value /variant.ini','setoption name UCI_Variant value schnessbench'])sf.postMessage(c);await command('isready',/^readyok/);
  const code={king:'k',rook:'r',bishop:'b',knight:'n'},sq=i=>'abcd'[i%4]+(4-Math.floor(i/4)),move=a=>a.type==='drop'?code[a.piece].toUpperCase()+'@'+sq(a.to):sq(a.from)+sq(a.to);let positions=0,searches=0;
  for(let i=0;i<16;i++){
   let p=r.createInitialPosition({allowCheckingDrops:false,experiment:'capture-bank',bankCapacity:6});p=r.applyAction(p,{type:'place-king',to:12+i%4});p=r.applyAction(p,{type:'place-king',to:Math.floor(i/4)});
   let start='';for(let y=0;y<4;y++){let empty=0,row='';for(let x=0;x<4;x++){const o=p.board[y*4+x];if(!o){empty++;continue;}if(empty)row+=empty;empty=0;const c=code[o.piece];row+=o.owner==='white'?c.toUpperCase():c;}if(empty)row+=empty;start+=(y?'/':'')+row;}start+='[RBNrbn] w - - 0 1';const moves=[];
   sf.postMessage('ucinewgame');await command('isready',/^readyok/);
   for(let ply=0;ply<2;ply++){
    const legal=r.legalActions(p),keys=legal.map(move).sort();sf.postMessage('position fen '+start+(moves.length?' moves '+moves.join(' '):''));const lines=await command('go perft 1',/Nodes searched/),ext=lines.filter(x=>/^\S+: \d+$/.test(x)).map(x=>x.split(': ')[0]).sort();if(JSON.stringify(keys)!==JSON.stringify(ext))throw Error('Parity mismatch '+i+'/'+ply);positions++;
    const own=b.analyzeAction(p,{depth:100,maxNodes:100000000,maxMillis:100,repetitionAversion:true,quiescenceDepth:0,lateMoveReduction:false});if(!own.action||!keys.includes(move(own.action)))throw Error('Illegal candidate action');const output=await command('go movetime 100',/^bestmove /),best=output.find(x=>/^bestmove /.test(x)).split(' ')[1];if(!keys.includes(best))throw Error('Illegal Fairy action');searches+=2;const a=ply===0?own.action:legal.find(x=>move(x)===best);moves.push(move(a));p=r.applyAction(p,a);
   }
  }
  return {positions,searches,legal:true};
 });await writeFile(run+'/adapter-verification.json',JSON.stringify({date:new Date().toISOString(),browser:browser.version(),uci,...result},null,2)+'\n');console.log(result);
}finally{await browser?.close();server.kill();}
