import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {RoomStore,RoomError} from './rooms.mjs';
import {InternetTunnel} from './tunnel.mjs';
import {hostIdentity} from './host-identity.mjs';

const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'};
const secureEqual=(a,b)=>typeof a==='string'&&/^[a-f0-9]{64}$/.test(a)&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function createGameServer({root,directory,port=8000,npcDelay=850}={}){
 const rooms=new RoomStore(directory,{npcDelay}),tunnel=new InternetTunnel(port),localKey=randomBytes(32).toString('hex'),instanceId=hostIdentity(root);
 const local=req=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)&&/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host||'')&&!req.headers['cf-ray']&&!req.headers['cf-connecting-ip']&&!req.headers['x-forwarded-for'];
 const hostAccess=req=>{if(!local(req)||!secureEqual(req.headers['x-sk8-local-key'],localKey))throw new RoomError(403,'Crée et gère le partage depuis le navigateur de l’hôte sur localhost.');};
 const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data?.match?{...data,publicBaseUrl:tunnel.url}:data));};
 async function body(req){
  if(!req.headers['content-type']?.startsWith('application/json'))throw new RoomError(415,'Format de requête invalide.');
  let bytes=0,text='';for await(const chunk of req){bytes+=chunk.length;if(bytes>16384)throw new RoomError(413,'Requête trop volumineuse.');text+=chunk;}
  try{return JSON.parse(text);}catch{throw new RoomError(400,'Requête illisible.');}
 }
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  try{
   const url=new URL(req.url,'http://localhost');
   if(url.pathname.startsWith('/api/')){
    if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)throw new RoomError(403,'Origine de requête invalide.');
    if(req.method==='GET'&&url.pathname==='/api/info')return json(res,200,{online:true,canHost:local(req),localKey:local(req)?localKey:null,instanceId:local(req)?instanceId:null,publicBaseUrl:tunnel.url});
    if(req.method==='POST'&&url.pathname==='/api/share'){hostAccess(req);return json(res,200,{publicBaseUrl:await tunnel.start()});}
    if(req.method==='DELETE'&&url.pathname==='/api/share'){hostAccess(req);tunnel.stop();return json(res,200,{publicBaseUrl:null});}
    if(req.method==='POST'&&url.pathname==='/api/rooms'){hostAccess(req);return json(res,201,await rooms.create(await body(req)));}
    const route=url.pathname.match(/^\/api\/rooms\/([a-f0-9]{24})(?:\/(lobby|join|command))?$/);if(!route)throw new RoomError(404,'Service inconnu.');
    const room=await rooms.get(route[1]);
    if(req.method==='GET'&&route[2]==='lobby')return json(res,200,rooms.lobby(room));
    if(req.method==='POST'&&route[2]==='join')return json(res,200,await rooms.join(room,await body(req)));
    const viewer=rooms.authenticate(room,req.headers.authorization?.replace(/^Bearer /,''));
    if(req.method==='GET'&&!route[2]){
     if(url.searchParams.get('revision')===String(room.revision))return json(res,200,{unchanged:true,roomId:room.id,revision:room.revision,members:rooms.presence(room),publicBaseUrl:tunnel.url});
     return json(res,200,rooms.view(room,viewer));
    }
    if(req.method==='POST'&&route[2]==='command')return json(res,200,await rooms.command(room,viewer,await body(req)));
    throw new RoomError(405,'Action indisponible.');
   }
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
   const pathname=decodeURIComponent(url.pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname)),relative=path.relative(root,file);
   if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403).end();return;}
   const content=await readFile(file);
   // Content-versioned layers stay decoded/cached across repeated table renders.
   // Rules, saves, API responses and unversioned artwork remain uncached.
   if((pathname.startsWith('/assets/tricks/')||pathname.startsWith('/assets/modules/lagoon/layers/'))&&/^[a-f0-9]{12}$/.test(url.searchParams.get('v')||''))res.setHeader('Cache-Control','public, max-age=31536000, immutable');
   res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:content);
  }catch(error){if(!res.headersSent)json(res,error.status||(error.code==='ENOENT'?404:500),{error:error.status?error.message:error.code==='ENOENT'?'Introuvable.':'Le serveur n’a pas pu enregistrer cette action.'});else res.end();}
 });
 server.headersTimeout=15000;server.requestTimeout=60000;
 server.on('close',()=>{rooms.close();tunnel.stop();});
 return {server,rooms,tunnel};
}
