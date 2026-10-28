import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
/** Serial JSON-lines client; process failure rejects every outstanding call. */
export function nativeEngine(binary,args=[],{watchdogMillis=null}={}){
 const child=spawn(binary,args,{stdio:['pipe','pipe','pipe']}),pending=[];let counter=0,failed=null,stderr='';
 const fail=e=>{failed=e;for(const p of pending.splice(0)){clearTimeout(p.timer);p.reject(e);}};
 child.stderr.on('data',b=>stderr=(stderr+b).slice(-4000));child.on('error',fail);child.on('exit',(code,signal)=>fail(Error(`Native engine exited ${code??signal}: ${stderr}`)));
 createInterface({input:child.stdout}).on('line',line=>{const p=pending.shift();if(!p){fail(Error('Unsolicited native output'));return}clearTimeout(p.timer);try{const r=JSON.parse(line);if(r.id!==p.id)throw Error('Native response correlation mismatch');if(r.error)throw Error(r.error.message);p.resolve(r);}catch(e){p.reject(e);fail(e);child.kill();}});
 return {async request(game,state,options={},action=null){if(failed)throw failed;const id=++counter;return new Promise((resolve,reject)=>{const timer=watchdogMillis===null?null:setTimeout(()=>{fail(Error('Native response exceeded explicitly configured process watchdog'));child.kill();},watchdogMillis);pending.push({id,resolve,reject,timer});child.stdin.write(JSON.stringify({schemaVersion:1,id,game,state,options,action})+'\n');});},close(){child.stdin.end();child.kill();}};
}
