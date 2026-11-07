/** JSON-lines reference backend; stdout contains protocol responses only. */
import {pathToFileURL} from 'node:url';
import {legalActions,applyAction,actionKey,getResult} from '../src/rules.js';
import {createInterface} from 'node:readline';
import {createSearchEngine} from '../src/search.js';
import {analyzeAction} from '../src/bot.js';
export function executeContract(request){
 if(request.schemaVersion!==1)throw Error('Unsupported contract schema');
 if(request.game==='schness-rules-v1')return {id:request.id,legalActionKeys:legalActions(request.state).map(actionKey).sort(),result:getResult(request.state),nextState:request.action?applyAction(request.state,request.action):null};
 if(request.game==='schness-v1')return {id:request.id,...analyzeAction(request.state,request.options)};
 if(request.game!=='graph-v1')throw Error('Unsupported game');
 const {nodes,root}=request.state;
 const engine=createSearchEngine({
  actions:p=>Object.keys(nodes[p].next??{}),apply:(p,a)=>nodes[p].next[a],turn:p=>nodes[p].turn,key:String,evaluationKey:String,
  terminal:(p,who)=>nodes[p].terminal===undefined?null:nodes[p].terminal*(who==='A'?1:-1),
  evaluate:(p,who)=>(nodes[p].value??0)*(who==='A'?1:-1),
  inDanger:p=>Boolean(nodes[p].danger),noisyActions:(p,actions)=>actions.filter(a=>(nodes[p].noisy??[]).includes(a)),
 });
 return {id:request.id,...engine.choose(root,request.options)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 for await(const line of createInterface({input:process.stdin,crlfDelay:Infinity})){
  if(!line.trim())continue;let request;
  try{request=JSON.parse(line);console.log(JSON.stringify(executeContract(request)));}
  catch(error){console.log(JSON.stringify({id:request?.id??null,error:{message:String(error.message)}}));}
 }
}
