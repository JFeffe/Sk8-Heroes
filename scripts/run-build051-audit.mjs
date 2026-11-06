import {spawn} from 'node:child_process';
import {mkdirSync,createWriteStream} from 'node:fs';
// The paired Normal sample is launched separately. This queue uses one worker
// beside it, then verifies the frozen policy on 100 fresh, untuned seed blocks.
const queue=[['easy',50,'tests/build-051-balance',0],['expert',50,'tests/build-051-balance',0],['mixed',100,'tests/build-051-balance',0],['normal',100,'tests/build-051-holdout',100]];
for(const [scenario,bases,directory,offset] of queue){
 mkdirSync(directory,{recursive:true});
 await new Promise((resolve,reject)=>{
  const log=createWriteStream(directory+'/'+scenario+'-run.log');
  const child=spawn(process.execPath,['scripts/audit-build050.mjs',scenario,String(bases),directory,String(offset)],{windowsHide:true,stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',chunk=>{log.write(chunk);process.stdout.write(chunk);});child.stderr.on('data',chunk=>{log.write(chunk);process.stderr.write(chunk);});
  child.on('error',reject);child.on('close',code=>{log.end();code?reject(Error(scenario+' failed '+code)):resolve();});
 });
}
