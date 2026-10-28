/** Run any backend speaking the documented JSON-lines protocol, without a shell. */
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {contractRequests,wireRequest,assertContract} from './engine-contract.js';
let executable=process.execPath,args=[fileURLToPath(new URL('./engine-contract-js.js',import.meta.url))];
for(let i=2;i<process.argv.length;i++){
 if(process.argv[i]==='--engine'){executable=process.argv[++i];args=[];}
 else if(process.argv[i]==='--arg')args.push(process.argv[++i]);
 else throw Error('Usage: node scripts/check-engine-contract.js [--engine PATH] [--arg VALUE]');
}
const requests=contractRequests(),run=spawnSync(executable,args,{input:requests.map(r=>JSON.stringify(wireRequest(r))).join('\n')+'\n',encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024});
if(run.error)throw run.error;if(run.status!==0)throw Error(`Backend exited ${run.status}: ${run.stderr}`);
const replies=run.stdout.trim().split('\n').map(line=>JSON.parse(line));
if(replies.length!==requests.length)throw Error(`Expected ${requests.length} replies, received ${replies.length}`);
for(let i=0;i<requests.length;i++){try{assertContract(requests[i],replies[i]);}catch(e){throw Error(`${requests[i].id}: ${e.message}`);}}
console.log(`Passed ${requests.length} portable engine contract cases.`);
