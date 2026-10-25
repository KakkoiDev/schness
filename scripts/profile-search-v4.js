import {readFile} from 'node:fs/promises';
import {analyzeAction as baseline} from '../research/search-performance-v4/baseline-bot.js';
import {analyzeAction as candidate} from '../src/bot.js';
const name=process.argv[2];if(!['baseline','candidate'].includes(name))throw Error('Choose baseline or candidate');
const positions=JSON.parse(await readFile('research/search-performance-v2/positions.json'));
for(let repeat=0;repeat<25;repeat++)for(const p of positions)(name==='baseline'?baseline:candidate)(p.position,{depth:4,repetitionAversion:true});
console.log('Profiled '+name+': 25 passes × 32 positions at depth 4');
