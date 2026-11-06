import {fork} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export class InternetTunnel{
 constructor(port){this.port=port;this.url=process.env.PUBLIC_BASE_URL||null;this.worker=null;this.starting=null;}
 async start(){
  if(this.url)return this.url;if(this.starting)return this.starting;
  this.starting=new Promise((resolve,reject)=>{
   const worker=this.worker=fork(fileURLToPath(new URL('./tunnel-worker.mjs',import.meta.url)),[String(this.port)],{windowsHide:true,stdio:['ignore','ignore','ignore','ipc']});
   const timeout=setTimeout(()=>{this.stop();reject(Error('Le lien Internet n’a pas pu être établi. Réessaie dans un instant.'));},45000);
   worker.on('message',message=>{if(message.type==='ready'){this.url=message.url;clearTimeout(timeout);resolve(this.url);}if(message.type==='error'){clearTimeout(timeout);this.stop();reject(Error(message.message));}});
   worker.on('error',error=>{clearTimeout(timeout);this.stop();reject(error);});
   worker.on('exit',()=>{clearTimeout(timeout);if(this.worker===worker){this.worker=null;this.url=null;}reject(Error('Le partage Internet a été arrêté.'));});
  }).finally(()=>this.starting=null);return this.starting;
 }
 stop(){if(this.worker?.connected)this.worker.send('stop');this.worker=null;this.url=null;}
}
