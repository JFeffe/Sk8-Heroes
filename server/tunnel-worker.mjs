import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const port=Number(process.argv[2]);
const bundled=fileURLToPath(new URL('../.tools/'+(process.platform==='win32'?'cloudflared.exe':'cloudflared'),import.meta.url));
const executable=process.env.CLOUDFLARED_BIN||(existsSync(bundled)?bundled:'cloudflared');
let url=null,registered=false,ready=false,stopping=false;
const child=spawn(executable,['tunnel','--no-autoupdate','--protocol','http2','--url',`http://127.0.0.1:${port}`],{windowsHide:true,stdio:['ignore','pipe','pipe']});
function stop(){if(stopping)return;stopping=true;child.kill();setTimeout(()=>process.exit(),500).unref();}
function consume(data){const text=data.toString();url??=text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com\b/)?.[0];registered||=text.includes('Registered tunnel connection');if(url&&registered&&!ready){ready=true;process.send?.({type:'ready',url});}}
child.stdout.on('data',consume);child.stderr.on('data',consume);
child.on('error',()=>{process.send?.({type:'error',message:'Cloudflared est introuvable. Installe-le pour activer le lien Internet.'});process.exitCode=1;setTimeout(()=>process.exit(1),100);});
child.on('exit',()=>{process.send?.({type:'closed'});process.exit();});
process.on('disconnect',stop);process.on('message',message=>{if(message==='stop')stop();});process.on('SIGTERM',stop);process.on('SIGINT',stop);
