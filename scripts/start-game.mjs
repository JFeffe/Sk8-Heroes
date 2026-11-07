import {spawn} from 'node:child_process';
import {mkdirSync,openSync,closeSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import net from 'node:net';
import {hostIdentity} from '../server/host-identity.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),instanceId=hostIdentity(fileURLToPath(new URL('../public/',import.meta.url)));
const online=process.argv.includes('--online');
if(online&&!existsSync(fileURLToPath(new URL('../.tools/cloudflared'+(process.platform==='win32'?'.exe':''),import.meta.url)))&&!process.env.CLOUDFLARED_BIN){
 console.log('Préparation du partage Internet…');
 await import('./install-share.mjs');
}
async function ready(port){try{const response=await fetch(`http://127.0.0.1:${port}/api/info`,{signal:AbortSignal.timeout(1000)});const info=await response.json();return response.ok&&info.online&&info.instanceId===instanceId;}catch{return false;}}
async function free(port){return new Promise(resolve=>{const probe=net.createServer();probe.once('error',()=>resolve(false));probe.listen(port,'127.0.0.1',()=>probe.close(()=>resolve(true)));});}
let port,reuse=false;
for(let candidate=8000;candidate<8010;candidate++){if(await ready(candidate)){port=candidate;reuse=true;break;}if(port===undefined&&await free(candidate))port=candidate;}
if(port===undefined)throw Error('Les ports 8000 à 8009 sont occupés. Ferme un ancien serveur du jeu puis réessaie.');
const url=`http://127.0.0.1:${port}/`,launchUrl=url+(online?'?host=1':'');
if(!reuse){
 const directory=fileURLToPath(new URL('../.local-games/',import.meta.url));mkdirSync(directory,{recursive:true});
 const output=openSync(directory+'server.stdout.log','a'),errors=openSync(directory+'server.stderr.log','a');
 const child=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:String(port)},detached:true,windowsHide:true,stdio:['ignore',output,errors]});
 child.on('error',error=>console.error(error.message));child.unref();closeSync(output);closeSync(errors);
 let available=false;for(let i=0;i<20;i++){if(await ready(port)){available=true;break;}await new Promise(resolve=>setTimeout(resolve,250));}
 if(!available)throw Error(`Le serveur ne répond pas. Vérifie le port ${port} et .local-games/server.stderr.log.`);
}
console.log('Sk8 Heroes : '+launchUrl);
if(!process.argv.includes('--no-browser')){
 const command=process.platform==='win32'?'powershell.exe':process.platform==='darwin'?'open':'xdg-open';
 const args=process.platform==='win32'?['-NoProfile','-NonInteractive','-Command',`Start-Process '${launchUrl}'`]:[launchUrl];
 const browser=spawn(command,args,{detached:true,windowsHide:true,stdio:'ignore'});browser.unref();
}
