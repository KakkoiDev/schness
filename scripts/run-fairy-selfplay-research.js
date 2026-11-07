import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir,cp,open,unlink,rename} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import * as rules from '../src/rules.js';
const sha=b=>createHash('sha256').update(b).digest('hex');
const args=Object.fromEntries(Array.from({length:(process.argv.length-2)/2},(_,i)=>[process.argv[2+i*2].replace(/^--/,''),process.argv[3+i*2]]));
const here=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const atomic=async(p,v)=>{const t=p+'.'+randomUUID()+'.tmp';await writeFile(t,JSON.stringify(v,null,2)+'\n');await rename(t,p);};
if(!args.resume){
 for(const name of ['root-tie-priority','king-escape-geometry','root-pvs','reduce-pv','protect-history','reserve-threats','fork-evasions'])assert(args[name]===undefined||['true','false'].includes(args[name]),'Invalid '+name);
 assert(args['exchange-ordering']===undefined||['true','false'].includes(args['exchange-ordering']),'Invalid exchange-ordering');
 assert(args['staged-moves']===undefined||['true','false'].includes(args['staged-moves']),'Invalid staged-moves');
 const out=resolve(args.output);await mkdir(out);await mkdir(out+'/games');
 const paths=['package.json','scripts/run-fairy-selfplay-research.js','research/fairy-match-v1/harness.html','research/fairy-match-v1/variant.ini',...['bot','rules','board-masks','search','exchange'].map(x=>'src/'+x+'.js'),...['stockfish.js','stockfish.wasm','stockfish.worker.js','AUTHORS','Copying.txt','source.tar.gz'].map(x=>'vendor/fairy-stockfish/'+x)];
 const files=[];for(const path of paths){await mkdir(dirname(out+'/runtime/'+path),{recursive:true});await cp(here+'/'+path,out+'/runtime/'+path);files.push({path,sha256:sha(await readFile(here+'/'+path))});}
 const integer=(name,fallback,min,max)=>{const n=Number(args[name]??fallback);assert(Number.isInteger(n)&&n>=min&&n<=max,name);return n;};
 const starts=integer('starts',16,1,16),seedCount=integer('seeds',6,1,6),depth=integer('depth',20,1,100),q=integer('quiescence',6,0,8);
 const candidateMillis=args['candidate-millis']===undefined?null:Number(args['candidate-millis']);assert(candidateMillis===null||Number.isFinite(candidateMillis)&&candidateMillis>0);
 const seedBase=integer('seed-base',20261701,1,2147483000);
 assert.equal(seedCount,1,'Self-play uses each king layout once');
 const tasks=Array.from({length:starts},(_,index)=>({id:`fairy__${index}`,index}));
 const manifest={schema:1,createdAt:new Date().toISOString(),files,sourceFingerprint:sha(JSON.stringify(files)),tasks,totalGames:tasks.length,budgetMillis:100,candidateMillis,maxPlies:200,port:integer('port',4191,1024,65535),rules:{allowCheckingDrops:false,experiment:'capture-bank',bankCapacity:6},candidate:{name:args.name??'Schness competitive research r2',profile:'competitive',rootTiePriority:args['root-tie-priority']==='true',kingEscapeGeometry:args['king-escape-geometry']==='true',rootPrincipalVariation:args['root-pvs']==='true',forkThreatEvasions:args['fork-evasions']==='true',reserveThreatEvaluation:args['reserve-threats']==='true',reducePrincipalVariation:args['reduce-pv']!=='false',protectHistoryMoves:args['protect-history']==='true',stagedMoveSelection:args['staged-moves']==='true',exchangeOrdering:args['exchange-ordering']==='true',cacheEvaluation:args['cache-evaluation']==='true',cacheQuiescence:args['cache-quiescence']==='true',reduceQuietDrops:args['reduce-drops']==='true',depthRequest:depth,iterativeDeepening:true,quiescenceDepth:q,quiescenceEvasionDepth:integer('evasion-depth',0,0,8),quiescenceChecks:args.checks!=='false',lateMoveReduction:args.reductions!=='false',stopOnProvenWin:true,repetitionAversion:true,maxTableEntries:100000},external:{package:'fairy-stockfish-nnue.wasm@1.1.12',reportedCommit:'b2e693ef',threads:1,hashMiB:16,NNUE:false},notes:'Phase 1: Fairy plays both seats, with cold hash each move and full history. Fixed 16 king layouts, 100 ms, pinned single-thread NNUE-off engine, legal parity, 200 total plies including the two fixed king placements. No Schness search runs in this phase. Phase 2 consumes frozen completed games only.'};
 await atomic(out+'/manifest.json',manifest);console.log(JSON.stringify({output:out,totalGames:tasks.length,fingerprint:manifest.sourceFingerprint}));
}else{
 const out=resolve(args.resume),m=JSON.parse(await readFile(out+'/manifest.json')),origin='http://127.0.0.1:'+m.port;assert.equal(here,out+'/runtime');
 for(const f of m.files)assert.equal(sha(await readFile(here+'/'+f.path)),f.sha256,`Frozen source changed: ${f.path}`);assert.equal(sha(JSON.stringify(m.files)),m.sourceFingerprint);
 let lock;try{lock=await open(out+'/run.lock','wx');await lock.writeFile(String(process.pid));}catch(e){if(e.code!=='EEXIST')throw e;const pid=Number(await readFile(out+'/run.lock'));try{process.kill(pid,0);throw Error('Runner active '+pid);}catch(e){if(e.code!=='ESRCH')throw e;}await unlink(out+'/run.lock');lock=await open(out+'/run.lock','wx');await lock.writeFile(String(process.pid));}
 let browser,server,status='running',failure=null,completed=0;const startedAt=new Date().toISOString();
 const progress=()=>atomic(out+'/progress.json',{status,pid:process.pid,startedAt,updatedAt:new Date().toISOString(),completed,total:m.totalGames,failure,sourceFingerprint:m.sourceFingerprint});
 const verify=(g,t)=>{assert.equal(g.task.id,t.id);assert.equal(g.sourceFingerprint,m.sourceFingerprint);let p=rules.createInitialPosition(m.rules);assert.equal(g.transcript.length,g.plies);for(const e of g.transcript){assert.equal(e.mover,p.turn);p=rules.applyAction(p,e.action);assert.equal(rules.positionKey(p),e.resultingKey);}assert.deepEqual(g.finalPosition,p);const result=rules.getResult(p);if(result)assert.deepEqual(result,g.result);else{assert.equal(g.result.reason,'ply-limit');assert.equal(g.plies,m.maxPlies);}};
 try{
  const done=new Set();for(const t of m.tasks){try{const g=JSON.parse(await readFile(out+'/games/'+t.id+'.json'));verify(g,t);done.add(t.id);completed++;}catch(e){if(e.code!=='ENOENT')throw e;}}
  await progress();
  if(completed<m.totalGames){
   server=spawn('python3',['-u','-c',"from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler\nclass H(SimpleHTTPRequestHandler):\n def end_headers(self):\n  self.send_header('Cross-Origin-Opener-Policy','same-origin');self.send_header('Cross-Origin-Embedder-Policy','require-corp');super().end_headers()\n def log_message(self,*args):pass\nThreadingHTTPServer(('127.0.0.1',"+m.port+"),H).serve_forever()"],{cwd:here,stdio:['ignore','ignore','pipe']});
   let serverError='';server.stderr.on('data',b=>serverError+=b);
   for(let n=0;n<100;n++){if(server.exitCode!==null)throw Error(serverError);try{await fetch(origin+'/package.json');break;}catch{await new Promise(r=>setTimeout(r,100));if(n===99)throw Error('Server did not start');}}
   browser=await chromium.launch({headless:true});const page=await browser.newPage();page.setDefaultTimeout(0);page.on('console',message=>console.log(message.text()));await page.goto(origin+'/research/fairy-match-v1/harness.html');const uci=await page.evaluate(()=>ready);assert(uci.some(x=>x.includes(m.external.reportedCommit)));await atomic(out+'/environment.json',{browser:browser.version(),uci});
   await page.evaluate(async()=>{sf.FS.writeFile('/variant.ini',await(await fetch('/research/fairy-match-v1/variant.ini')).text());for(const c of ['setoption name Use NNUE value false','setoption name Threads value 1','setoption name Hash value 16','setoption name Move Overhead value 0','setoption name VariantPath value /variant.ini','setoption name UCI_Variant value schnessbench'])sf.postMessage(c);await command('isready',/^readyok/);});
   for(const task of m.tasks){if(done.has(task.id))continue;
    const g=await page.evaluate(async({task,m})=>{
     const r=await import('/src/rules.js');const codes={king:'k',rook:'r',bishop:'b',knight:'n'},square=i=>'abcd'[i%4]+(4-Math.floor(i/4)),move=a=>a.type==='drop'?codes[a.piece].toUpperCase()+'@'+square(a.to):square(a.from)+square(a.to);
     const fen=p=>{const rows=[];for(let y=0;y<4;y++){let row='',empty=0;for(let x=0;x<4;x++){const o=p.board[y*4+x];if(!o){empty++;continue;}if(empty)row+=empty;empty=0;const c=codes[o.piece];row+=o.owner==='white'?c.toUpperCase():c;}if(empty)row+=empty;rows.push(row);}return rows.join('/')+'['+p.banks.white.map(x=>codes[x].toUpperCase()).join('')+p.banks.black.map(x=>codes[x]).join('')+'] '+(p.turn==='white'?'w':'b')+' - - 0 1';};
     let p=r.createInitialPosition(m.rules);const transcript=[],moves=[];const step=(action,metrics={})=>{const mover=p.turn;p=r.applyAction(p,action);transcript.push({action,mover,resultingKey:r.positionKey(p),...metrics});};step({type:'place-king',to:12+task.index%4});step({type:'place-king',to:Math.floor(task.index/4)});const startFen=fen(p);
     sf.postMessage('ucinewgame');sf.postMessage('setoption name Clear Hash');await command('isready',/^readyok/);
     let result=r.getResult(p);
     while(!result&&transcript.length<m.maxPlies){
      sf.postMessage('setoption name Clear Hash');await command('isready',/^readyok/);
      const legal=r.legalActions(p),byMove=new Map(legal.map(a=>[move(a),a]));sf.postMessage('position fen '+startFen+(moves.length?' moves '+moves.join(' '):''));const parity=await command('go perft 1',/Nodes searched/);const external=parity.filter(x=>/^\S+: \d+$/.test(x)).map(x=>x.split(': ')[0]).sort();if(JSON.stringify(external)!==JSON.stringify([...byMove.keys()].sort()))throw Error('Legal move mismatch '+task.id+' ply '+transcript.length);
      const t=performance.now(),out=await command('go movetime '+m.budgetMillis,/^bestmove /),millis=performance.now()-t,best=out.find(x=>/^bestmove /.test(x)).split(' ')[1],info=out.filter(x=>/^info depth .* nodes /.test(x)&&!/ (upperbound|lowerbound) /.test(x)).at(-1);
      const action=byMove.get(best),engine='fairy',metrics={engine,millis,completedDepth:Number(info?.match(/ depth (\d+)/)?.[1]),nodes:Number(info?.match(/ nodes (\d+)/)?.[1]),uci:out,uciMove:best,legalUci:[...byMove.keys()].sort()};
      if(!action||!byMove.has(move(action)))throw Error('Illegal action '+engine);moves.push(move(action));step(action,metrics);result=r.getResult(p);
     }
     return {task,sourceFingerprint:m.sourceFingerprint,result:result??{type:'draw',reason:'ply-limit'},plies:transcript.length,transcript,finalPosition:p,startFen};
    },{task,m});verify(g,task);await atomic(out+'/games/'+task.id+'.json',g);completed++;await progress();console.log(completed+'/'+m.totalGames+' '+task.id+': '+(g.result.winner??g.result.reason));
   }
  }
  await mkdir(out+'/bundles',{recursive:true});
  const games=[];for(const t of m.tasks)games.push(await readFile(out+'/games/'+t.id+'.json','utf8').then(JSON.parse));
  await writeFile(out+'/bundles/fairy-selfplay.jsonl',games.map(g=>JSON.stringify(g)).join('\n')+'\n');
  status='completed';
 }catch(e){status='failed';failure=String(e.stack??e);throw e;}finally{await browser?.close();server?.kill();await progress();await lock.close();await unlink(out+'/run.lock');}
}
