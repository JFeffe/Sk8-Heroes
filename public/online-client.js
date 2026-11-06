const KEY='sk8-online-connections-v1';
const connections=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{};}catch{return {};}};
export const lastConnection=()=>Object.values(connections()).sort((a,b)=>b.updated-a.updated)[0]||null;
export const savedConnection=id=>connections()[id]||null;
export function rememberConnection(connection){const saved=connections();saved[connection.roomId]={roomId:connection.roomId,token:connection.token,viewerId:connection.viewerId,isHost:connection.isHost,updated:Date.now()};localStorage.setItem(KEY,JSON.stringify(saved));}
export function forgetConnection(id){const saved=connections();delete saved[id];localStorage.setItem(KEY,JSON.stringify(saved));}
export async function onlineApi(path,{method='GET',body,token,localKey}={}){
 const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(token)headers.Authorization='Bearer '+token;if(localKey)headers['X-Sk8-Local-Key']=localKey;
 const response=await fetch('/api/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(path==='share'?55000:15000)});
 let data;try{data=await response.json();}catch{throw Error('Le serveur multijoueur n’est pas disponible sur cette adresse.');}
 if(!response.ok){const error=Error(data.error||'Connexion impossible.');error.status=response.status;throw error;}return data;
}
export class OnlineClient{
 constructor(connection,{onState,onConnection}={}){Object.assign(this,connection);this.onState=onState;this.onConnection=onConnection;this.closed=false;this.signature=null;this.timer=null;}
 accept(view){if(this.closed||view.revision<(this.view?.revision??-1))return;this.view=view;this.viewerId=view.viewerId;this.isHost=view.isHost;const signature=JSON.stringify([view.revision,view.members,view.publicBaseUrl]);if(signature!==this.signature){this.signature=signature;this.onState?.(view);}this.onConnection?.(true);}
 async refresh(){const result=await onlineApi('rooms/'+this.roomId+(this.view?'?revision='+this.view.revision:''),{token:this.token});const view=result.unchanged?{...this.view,members:result.members,publicBaseUrl:result.publicBaseUrl}:result;this.accept(view);return view;}
 async start(view){if(view)this.accept(view);else await this.refresh();rememberConnection(this);this.poll();}
 poll(){if(this.closed)return;this.timer=setTimeout(async()=>{try{await this.refresh();}catch(error){if(!this.closed)this.onConnection?.(false,error);}this.poll();},this.view?.started?900:300);}
 async send(action){
  const payload={action,revision:this.view.revision,requestId:crypto.randomUUID()};
  for(let attempt=0;attempt<2;attempt++){
   try{const view=await onlineApi('rooms/'+this.roomId+'/command',{method:'POST',token:this.token,body:payload});this.accept(view);return view;}
   catch(error){if(error.status===409){await this.refresh();throw error;}if(error.status||attempt===1)throw error;}
  }
 }
 stop(){this.closed=true;clearTimeout(this.timer);}
}
