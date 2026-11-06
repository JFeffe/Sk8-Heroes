import {spawn} from 'node:child_process';
import {mkdirSync,openSync,closeSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),url='http://127.0.0.1:8000/';
async function ready(){try{const response=await fetch(url+'api/info',{signal:AbortSignal.timeout(1000)});return response.ok&&(await response.json()).online;}catch{return false;}}
if(!await ready()){
 const directory=fileURLToPath(new URL('../.local-games/',import.meta.url));mkdirSync(directory,{recursive:true});
 const output=openSync(directory+'server.stdout.log','a'),errors=openSync(directory+'server.stderr.log','a');
 const child=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'8000'},detached:true,windowsHide:true,stdio:['ignore',output,errors]});
 child.on('error',error=>console.error(error.message));child.unref();closeSync(output);closeSync(errors);
 let available=false;for(let i=0;i<20;i++){if(await ready()){available=true;break;}await new Promise(resolve=>setTimeout(resolve,250));}
 if(!available)throw Error('Le serveur ne répond pas. Vérifie le port 8000 et .local-games/server.stderr.log.');
}
console.log('Sk8 Heroes : '+url);
if(!process.argv.includes('--no-browser')){
 const command=process.platform==='win32'?'powershell.exe':process.platform==='darwin'?'open':'xdg-open';
 const args=process.platform==='win32'?['-NoProfile','-NonInteractive','-Command',"Start-Process 'http://127.0.0.1:8000/'"]:[url];
 const browser=spawn(command,args,{detached:true,windowsHide:true,stdio:'ignore'});browser.unref();
}
