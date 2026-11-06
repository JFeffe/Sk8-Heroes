import {spawn} from 'node:child_process';
import {mkdirSync,createWriteStream} from 'node:fs';
const queue=[['normal',100,'tests/build-053-balance',0],['reference',100,'tests/build-053-balance',0],['expert',25,'tests/build-053-balance',0],['easy',25,'tests/build-053-balance',0],['mixed',50,'tests/build-053-balance',0],['normal',50,'tests/build-053-holdout',250]];
async function run(){while(queue.length){const [scenario,bases,directory,offset]=queue.shift();mkdirSync(directory,{recursive:true});
 await new Promise((resolve,reject)=>{const log=createWriteStream(directory+'/'+scenario+'-run.log'),child=spawn(process.execPath,['scripts/audit-build050.mjs',scenario,String(bases),directory,String(offset)],{windowsHide:true,stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',chunk=>{log.write(chunk);process.stdout.write(chunk);});child.stderr.on('data',chunk=>{log.write(chunk);process.stderr.write(chunk);});child.on('error',reject);child.on('close',code=>{log.end();code?reject(Error(directory+'/'+scenario+' failed '+code)):resolve();});
 });}}
await Promise.all([run(),run()]);
