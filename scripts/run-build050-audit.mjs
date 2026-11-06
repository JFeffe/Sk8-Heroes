import {spawn} from 'node:child_process';
import {createWriteStream,writeFileSync,mkdirSync} from 'node:fs';
const queue=[['normal',100],['expert',50],['easy',50],['mixed',100],['control',100]],results=[];
mkdirSync('tests/build-050-balance',{recursive:true});
async function run(){while(queue.length){const [scenario,bases]=queue.shift();console.log('Starting '+scenario+' ('+(bases*4)+' games)');await new Promise((resolve,reject)=>{
 const log=createWriteStream('tests/build-050-balance/'+scenario+'-run.log');
 const child=spawn(process.execPath,['scripts/audit-build050.mjs',scenario,String(bases)],{windowsHide:true,stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',chunk=>{log.write(chunk);process.stdout.write(chunk);});child.stderr.on('data',chunk=>{log.write(chunk);process.stderr.write(chunk);});
 child.on('error',reject);child.on('close',code=>{log.end();if(code)reject(Error(scenario+' exited '+code));else{results.push(scenario);resolve();}});
 });}}
await Promise.all([run(),run()]);writeFileSync('tests/build-050-balance/run-complete.json',JSON.stringify({build:'0.5.0',games:1600,completed:results},null,2)+'\n');console.log('Audit complete: 1,600 games.');
