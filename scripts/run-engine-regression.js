import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { realpathSync } from 'node:fs';
import { mkdir, readFile, writeFile, rename, readdir, open, unlink } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { cpus, totalmem, availableParallelism } from 'node:os';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createInitialPosition, applyAction, positionKey, getResult, isInCheck } from '../src/rules.js';
import { VARIANTS, VARIANT_IDS, description } from '../src/variants.js';
import { seededRandom, hiddenSetupPlacements, TOURNAMENT_AI, tournamentRules } from '../src/tournament.js';
import {analyzeAction} from '../src/bot.js';
import {chooseAction as sharpV2} from '../research/engine-regression-v1/baseline/bot.js';
import * as legacyRules from '../research/engine-regression-v1/baseline/rules.js';
import {performance} from 'node:perf_hooks';

const hash = text => createHash('sha256').update(text).digest('hex');
async function atomic(path, value) { const tmp=`${path}.${randomUUID()}.tmp`; await writeFile(tmp,JSON.stringify(value,null,2));await rename(tmp,path); }
export function tasksFor(config) {
 return ['white','black'].flatMap(candidateColor=>config.variants.flatMap(variant=>config.seeds.flatMap(seed=>Array.from({length:16},(_,opening)=>({id:`${candidateColor}__${variant}__${seed}__${opening}`,candidateColor,variant,seed,index:opening,repetition:0,white:'sharp',black:'sharp'})))));
}
export function playGame(task,maxPlies){
 const ruleset=VARIANTS[task.variant],kings={white:12+task.index%4,black:Math.floor(task.index/4)},transcript=[];
 const random={candidate:seededRandom(task.seed),baseline:seededRandom((task.seed^0x9e3779b9)>>>0)};
 let p=createInitialPosition(ruleset);
 function step(action,metrics={}){const before=p,mover=p.turn;p=applyAction(p,action);assert.deepEqual(legacyRules.applyLegalAction(before,action),p);transcript.push({action,mover,phase:before.phase,resultingKey:positionKey(p),checkingDrop:action.type==='drop' && isInCheck(p,p.turn),...metrics});}
 step({type:'place-king',to:kings.white});step({type:'place-king',to:kings.black});
 const hidden=ruleset.hiddenSetup?hiddenSetupPlacements(kings,task.seed):null;
 if(hidden)for(let slot=0;slot<3;slot++)for(const player of ['white','black'])step(hidden[player][slot]);
 let result=getResult(p);
 while(!result&&transcript.length<maxPlies){
  assert.deepEqual(legacyRules.getResult(p),result);
  const engine=p.turn===task.candidateColor?'candidate':'baseline',start=performance.now();
  let action,completedDepth;
  if(engine==='candidate'){const r=analyzeAction(p,{depth:4,random:random.candidate,repetitionAversion:true,quiescenceDepth:0,lateMoveReduction:false});action=r.action;completedDepth=r.completedDepth;assert.equal(completedDepth,4);}
  else action=sharpV2(p,{depth:4,random:random.baseline,repetitionAversion:true});
  assert(action);step(action,{engine,millis:performance.now()-start,...(completedDepth===undefined?{}:{completedDepth})});result=getResult(p);
 }
 assert.deepEqual(legacyRules.getResult(p),result);
 return {index:task.index,seed:task.seed,levels:{white:'sharp',black:'sharp'},engines:{candidate:{version:7,depth:4},baseline:{version:2,depth:4}},candidateColor:task.candidateColor,ruleset,startingKings:kings,...(hidden?{hiddenSetup:hidden}:{}),result:result??{type:'draw',reason:'ply-limit'},plies:transcript.length,transcript,finalPosition:p};
}
function parse(values) {
  const a={};for(let i=0;i<values.length;i+=2){if(!values[i].startsWith('--')||values[i+1]===undefined)throw new Error('Use --option value');a[values[i].slice(2)]=values[i+1];}return a;
}
function positive(value,fallback){const n=Number(value??fallback);if(!Number.isInteger(n)||n<1)throw new Error('Expected positive integer');return n;}
async function prepare(a) {
  const output=resolve(a.output??`output/local-experiments/${new Date().toISOString().replace(/[:.]/g,'-')}`);
  const variants=a.variants?a.variants.split(','):VARIANT_IDS;
  if(new Set(variants).size!==variants.length||variants.some(id=>!VARIANTS[id]))throw new Error('Invalid or duplicate variants');
  const seeds=(a.seeds??'20261501,20261502,20261503,20261504,20261505,20261506').split(',').map(Number);
  if(new Set(seeds).size!==seeds.length||seeds.some(n=>!Number.isSafeInteger(n)||n<0||n>0xffffffff))throw new Error('Invalid or duplicate seeds');
  if(a['candidate-commit'] && !/^[0-9a-f]{40}$/.test(a['candidate-commit']))throw Error('Invalid candidate commit');
  const config={candidateCommit:a['candidate-commit']??null,variants,seeds,repetitions:positive(a.repetitions,1),maxPlies:positive(a['max-plies'],200),workers:positive(a.workers,Math.max(1,Math.min(8,availableParallelism()-2)))};
  await mkdir(dirname(output),{recursive:true});await mkdir(output);await mkdir(`${output}/games`);
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const paths=['package.json','scripts/run-engine-regression.js','research/engine-regression-v1/baseline/bot.js','research/engine-regression-v1/baseline/rules.js','research/engine-regression-v1/baseline/origin.json',...['bot','rules','board-masks','search','tournament','history','notation','watch','settings','variants'].map(p=>`src/${p}.js`)];
  const files=[];
  for(const path of paths){const content=await readFile(`${root}/${path}`);await mkdir(dirname(`${output}/runtime/${path}`),{recursive:true});await writeFile(`${output}/runtime/${path}`,content);files.push({path,sha256:hash(content)});}
  let git={};try{git={head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),status:execFileSync('git',['status','--short'],{cwd:root,encoding:'utf8'})};}catch{}
  const manifest={schema:1,createdAt:new Date().toISOString(),config,totalGames:tasksFor(config).length,sourceFingerprint:hash(JSON.stringify(files)),files,git,node:process.version,machine:{model:cpus()[0]?.model,cpus:cpus().length,memoryGiB:totalmem()/2**30},rules:Object.fromEntries(variants.map(id=>[id,{...VARIANTS[id],description:description(VARIANTS[id]),text:tournamentRules(VARIANTS[id])}])),ai:{candidate:TOURNAMENT_AI.sharp,baseline:{version:2,depth:4}},schedule:`Candidate-white then candidate-black tasks; ${seeds.length} seeds × 16 starts × ${variants.length} presets × 2 colors = ${tasksFor(config).length}`,notes:'Fixed depth four, no time/node cap, no speculative options. Six fresh seeds, all 16 starts and both fixed engine colors on 36 shared production presets. Candidate and frozen Sharp v2 have independent seeded tie streams. Other historical research objectives/armies require their own compatible adapter and are not pooled here. Not an equal-time match or proof of non-inferiority.'};
  await atomic(`${output}/manifest.json`,manifest);console.log(JSON.stringify({output,totalGames:manifest.totalGames,workers:config.workers,resume:`node ${output}/runtime/scripts/run-engine-regression.js --resume ${output}`},null,2));
}
async function run(output) {
  output=realpathSync(output);
  const manifest=JSON.parse(await readFile(`${output}/manifest.json`,'utf8'));
  const runtime=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  if(runtime!==resolve(output,'runtime'))throw new Error('Resume using the frozen runtime script named in manifest output');
  const files=[];for(const f of manifest.files){const sha256=hash(await readFile(`${runtime}/${f.path}`));if(sha256!==f.sha256)throw new Error(`Frozen source changed: ${f.path}`);files.push({path:f.path,sha256});}
  if(hash(JSON.stringify(files))!==manifest.sourceFingerprint)throw new Error('Source fingerprint mismatch');
  const lockPath=`${output}/run.lock`;let lock;
  try{lock=await open(lockPath,'wx');await lock.writeFile(String(process.pid));}catch(e){if(e.code!=='EEXIST')throw e;const pid=Number(await readFile(lockPath,'utf8'));try{process.kill(pid,0);throw new Error(`Run already active (PID ${pid})`);}catch(err){if(err.code!=='ESRCH')throw err;}await unlink(lockPath);lock=await open(lockPath,'wx');await lock.writeFile(String(process.pid));}
  const config=manifest.config,tasks=tasksFor(config),byId=new Map(tasks.map(t=>[t.id,t]));let completed=0;
  const summary={};for(const id of config.variants)summary[id]={games:0,white:0,black:0,draws:0,reasons:{},matchups:{},totalNormalPlies:0,totalNonKings:0,kingOnly:0,checkingDrops:0};
  function tally(game,task){const s=summary[task.variant],outcome=game.result.winner??game.result.reason;s.games++;s[game.result.winner??'draws']++;s.reasons[outcome]=(s.reasons[outcome]??0)+1;const key=task.candidateColor;s.matchups[key]??={white:0,black:0,draws:0};s.matchups[key][game.result.winner??'draws']++;s.totalNormalPlies+=game.transcript.filter(e=>e.phase==='play').length;const n=game.finalPosition.board.filter(p=>p&&p.piece!=='king').length+game.finalPosition.banks.white.length+game.finalPosition.banks.black.length;s.totalNonKings+=n;s.kingOnly+=Number(n===0);s.checkingDrops+=game.transcript.filter(e=>e.checkingDrop===true).length;completed++;}
  function verify(game,task){
    assert.equal(game.index,task.index);assert.equal(game.candidateColor,task.candidateColor);assert.deepEqual(game.levels,{white:task.white,black:task.black});
    assert.deepEqual(game.ruleset,VARIANTS[task.variant]);assert.equal(game.plies,game.transcript.length);
    let p=createInitialPosition(VARIANTS[task.variant]);
    for(const e of game.transcript){if(e.mover)assert.equal(e.mover,p.turn);p=applyAction(p,e.action);assert.equal(positionKey(p),e.resultingKey);}
    assert.deepEqual(p,game.finalPosition);const result=getResult(p);
    if(result)assert.deepEqual(game.result,result);else{assert.equal(game.result.reason,'ply-limit');assert.ok(game.plies>=config.maxPlies);}
  }
  const done=new Set();
  let timer;const workers=[];let status='running',failure=null;const startedAt=new Date().toISOString();
  async function progress(){await atomic(`${output}/progress.json`,{status,pid:process.pid,startedAt,updatedAt:new Date().toISOString(),sourceFingerprint:manifest.sourceFingerprint,completed,total:tasks.length,remaining:tasks.length-completed,workers:config.workers,inFlight:workers.filter(w=>w.task).map(w=>({task:w.task.id,startedAt:w.startedAt})),failure,variants:summary});}
  try{
    for(const file of (await readdir(`${output}/games`)).filter(n=>n.endsWith('.json'))){const game=JSON.parse(await readFile(`${output}/games/${file}`,'utf8'));const task=byId.get(game.localExperiment?.taskId);if(!task||game.localExperiment.sourceFingerprint!==manifest.sourceFingerprint||JSON.stringify(game.ruleset)!==JSON.stringify(VARIANTS[task.variant]))throw new Error(`Mismatched checkpoint ${file}`);if(done.has(task.id))throw new Error('Duplicate checkpoint');verify(game,task);done.add(task.id);tally(game,task);}
    const pending=tasks.filter(t=>!done.has(t.id));let cursor=0;await progress();
    if(pending.length){await new Promise((finish,reject)=>{
      let stopped=false,active=0;
      const stop=()=>{if(stopped)return;stopped=true;status='stopped';for(const w of workers)w.worker.terminate();finish();};process.once('SIGTERM',stop);process.once('SIGINT',stop);
      function fail(e){if(stopped)return;stopped=true;status='failed';failure=String(e.stack??e);for(const w of workers)w.worker.terminate();reject(e);}
      function assign(w){if(stopped)return;const task=pending[cursor++];if(!task){w.task=null;w.worker.terminate();if(active===0){process.removeListener('SIGTERM',stop);process.removeListener('SIGINT',stop);finish();}return;}w.task=task;w.startedAt=new Date().toISOString();active++;w.worker.postMessage({task,maxPlies:config.maxPlies});}
      for(let i=0;i<Math.min(config.workers,pending.length);i++){
        const worker=new Worker(new URL(import.meta.url),{workerData:{localExperimentWorker:true}});const w={worker,task:null};workers.push(w);
        worker.on('error',fail);worker.on('exit',code=>{if(!stopped&&w.task)fail(new Error(`Worker exited ${code} during ${w.task.id}`));});
        worker.on('message',async message=>{try{if(stopped)return;if(message.error)throw new Error(message.error);const task=w.task;const game=message.game;game.repetition=task.repetition;game.localExperiment={taskId:task.id,variant:task.variant,candidateColor:task.candidateColor,baseSeed:task.seed,sourceFingerprint:manifest.sourceFingerprint};verify(game,task);await atomic(`${output}/games/${task.id}.json`,game);tally(game,task);w.task=null;active--;console.log(`${completed}/${tasks.length} ${task.id}: ${game.result.winner??game.result.reason}`);assign(w);}catch(e){fail(e);}});assign(w);
      }
      timer=setInterval(()=>progress().catch(fail),10000);
    });}
    if(status==='running'){
      status='completed';await mkdir(`${output}/bundles`,{recursive:true});
      for(const variant of config.variants)for(const seed of config.seeds){const group=tasks.filter(t=>t.variant===variant&&t.seed===seed).sort((a,b)=>a.index-b.index);const lines=[];for(const task of group)lines.push(JSON.stringify(JSON.parse(await readFile(`${output}/games/${task.id}.json`,'utf8'))));await writeFile(`${output}/bundles/${variant}__${seed}.jsonl`,lines.join('\n')+'\n');}
    }
  }catch(e){status='failed';failure=String(e.stack??e);throw e;}finally{clearInterval(timer);await progress();for(const w of workers)await w.worker.terminate();await lock.close();await unlink(lockPath);}
}
if(!isMainThread){parentPort.on('message',({task,maxPlies})=>{try{const game=playGame(task,maxPlies);parentPort.postMessage({game});}catch(e){parentPort.postMessage({error:String(e.stack??e)});}});}
else if(process.argv[1]&&realpathSync(process.argv[1])===realpathSync(fileURLToPath(import.meta.url))){const a=parse(process.argv.slice(2));if(a.resume)await run(resolve(a.resume));else await prepare(a);}
