import {deckInventory} from '../public/physical-table.js';
import {randomBytes,randomInt,timingSafeEqual} from 'node:crypto';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import * as M from '../public/match.js';
import {getSkater} from '../public/skaters.js';
import {riderChoices,lobbyReady,reserveRider} from './lobby-riders.mjs';

export class RoomError extends Error{constructor(status,message){super(message);this.status=status;}}
const fail=(status,message)=>{throw new RoomError(status,message);};
const secret=()=>randomBytes(32).toString('hex');
const entropy=()=>randomInt(2**32)/2**32;
const bindEntropy=m=>{Object.defineProperty(m,'randomSource',{value:entropy,enumerable:false,configurable:true});return m;};
const cleanName=value=>typeof value==='string'?value.trim().slice(0,24):'';
const sameSecret=(a,b)=>typeof a==='string'&&typeof b==='string'&&/^[a-f0-9]{64}$/.test(a)&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const playable=new Set(['draft','draft-pair','choose','roll','place','auto','reset-placement','bonus','land','stop','continue','fall','pass','proceed','claim-sequence','specialty']);

export class RoomStore{
 constructor(directory,{npcDelay=850,now=Date.now}={}){this.directory=directory;this.npcDelay=npcDelay;this.now=now;this.rooms=new Map();this.loading=new Map();this.closed=false;}
 async persist(room){
  await mkdir(this.directory,{recursive:true});
  const file=path.join(this.directory,room.id+'.json'),tmp=file+'.'+randomBytes(4).toString('hex')+'.tmp';
  await writeFile(tmp,JSON.stringify({version:1,id:room.id,match:room.match,members:room.members,riderChoices:riderChoices(room),started:room.started,paused:room.paused,fast:room.fast,revision:room.revision,created:room.created,updated:Date.now(),receipts:room.receipts}),{mode:0o600});
  await rename(tmp,file);
 }
 attach(room){room.queue=Promise.resolve();room.timer=null;room.seen={};this.rooms.set(room.id,room);return room;}
 async create(options={}){
  if(this.rooms.size>=32)fail(429,'Trop de salons ouverts sur cet hôte.');
  const token=secret(),match=M.newMatch({name:cleanName(options.name)||'Hôte',npcCount:options.npcCount,npcDifficulty:options.npcDifficulty,mode:options.mode||'base',skaterId:options.skaterId||'neo',length:6,randomSource:entropy});
  const room=this.attach({id:randomBytes(12).toString('hex'),match,members:{p0:{token,host:true}},riderChoices:{p0:getSkater(options.skaterId)?.id||null},started:false,paused:false,fast:false,revision:0,created:Date.now(),receipts:[]});
  room.seen.p0=Date.now();try{await this.persist(room);}catch(error){this.rooms.delete(room.id);throw error;}return {token,...this.view(room,'p0')};
 }
 async get(id){
  if(!/^[a-f0-9]{24}$/.test(id||''))fail(404,'Partie introuvable.');
  if(this.rooms.has(id))return this.rooms.get(id);
  if(!this.loading.has(id))this.loading.set(id,(async()=>{
   let raw;try{raw=JSON.parse(await readFile(path.join(this.directory,id+'.json'),'utf8'));}catch{fail(404,'Partie introuvable sur cet hôte.');}
   if(raw.version!==1||raw.id!==id)fail(409,'Sauvegarde du salon incompatible.');
   if(raw.match.version!==M.MATCH_VERSION)fail(409,'Cette partie utilise les anciennes règles des modules. Crée une nouvelle partie pour jouer les modules mis à jour.');
   const migratedDraft=raw.match.phase==='recovery'&&raw.match.market?.cardsPerPlayer!==1;
   const room={...raw,match:bindEntropy(M.restore(raw.match)),revision:raw.revision+(migratedDraft?1:0),receipts:raw.receipts||[]};
   if(migratedDraft)await this.persist(room);
   this.attach(room);
   M.setClockRunning(room.match,room.started&&!room.paused,this.now);this.schedule(room);return room;
  })().finally(()=>this.loading.delete(id)));
  return this.loading.get(id);
 }
 authenticate(room,token){const id=Object.keys(room.members).find(id=>sameSecret(room.members[id].token,token));if(!id)fail(403,'Accès à la partie invalide. Rejoins-la avec ton invitation.');room.seen[id]=Date.now();return id;}
 async serial(room,run){
  const task=room.queue.then(async()=>{
   const clock=M.clockState(room.match),previous={match:structuredClone(room.match),members:structuredClone(room.members),riderChoices:structuredClone(riderChoices(room)),started:room.started,paused:room.paused,fast:room.fast,revision:room.revision,updated:room.updated,receipts:structuredClone(room.receipts)};
   try{return await run();}catch(error){Object.assign(room,previous,{match:bindEntropy(M.restore(previous.match))});M.restoreClockState(room.match,clock);throw error;}
  });room.queue=task.catch(()=>{});return task;
 }
 lobby(room){return {roomId:room.id,started:room.started,mode:room.match.mode,riderChoices:riderChoices(room),complete:room.match.phase==='complete',players:room.match.players.map(p=>({id:p.id,name:p.game.name,skaterId:p.skaterId,color:p.color,kind:p.kind,available:p.kind==='npc'}))};}
 presence(room){return room.match.players.map(p=>({id:p.id,connected:p.kind==='npc'||Date.now()-(room.seen[p.id]||0)<45000}));}
 view(room,viewerId){
  const m=structuredClone(room.match);delete m.rngState;m.deckCounts=deckInventory(room.match);m.deck=[];m.viewerId=viewerId;
  m.draftLog=m.draftLog.map(({offered,offeredBonus,...entry})=>entry);
  for(const p of m.players){
   const original=room.match.players.find(x=>x.id===p.id).game,g=p.game;
   // Hands and tables are public; the unchosen offers, deck and RNG remain private.
   g.handCount=original.hand.length;
   g.deck=p.id===viewerId?original.offer.map(uid=>room.match.deck.find(c=>c.uid===uid)).filter(Boolean):[];
   if(p.id!==viewerId)g.offer=[];
   if(m.phase==='initial'&&M.passingDraft(m)&&p.id!==viewerId&&room.match.initialSelections[p.id])g.hand=g.hand.filter(c=>c.uid!==room.match.initialSelections[p.id]);
   g.draftCards=[...m.market.cards,...(m.market.reserve||[])];g.draftTokens=m.market.tokens;
  }
  if(M.passingDraft(m)){m.initialPackets=m.phase==='initial'?{[viewerId]:room.match.initialPackets[viewerId]||[]}:{};m.initialSelections=Object.fromEntries(Object.keys(room.match.initialSelections||{}).map(id=>[id,true]));}
  return {roomId:room.id,viewerId,isHost:!!room.members[viewerId]?.host,revision:room.revision,started:room.started,riderChoices:riderChoices(room),ready:lobbyReady(room),paused:room.paused,fast:room.fast,savedAt:room.updated||room.created,match:m,members:this.presence(room)};
 }
 async join(room,{name,seatId,skaterId}={}){
  return this.serial(room,async()=>{
   if(room.match.phase==='complete')fail(409,'Cette partie est terminée.');
   const p=room.match.players.find(p=>(!seatId||p.id===seatId)&&p.kind==='npc');if(!p)fail(409,'Cette place vient d’être prise. Choisis un autre NPC.');
   if(!cleanName(name))fail(400,'Indique ton nom.');
   if(room.started&&skaterId&&skaterId!==p.skaterId)fail(409,'En cours de partie, tu conserves le skater et la couleur du NPC.');
   room.riderChoices={...riderChoices(room),[p.id]:room.started?p.skaterId:null};
   p.kind='human';p.game.name=cleanName(name);
   if(!room.started&&skaterId&&!reserveRider(room,p.id,skaterId))fail(409,'Ce skater est déjà choisi ou indisponible.');
   const token=secret();room.members[p.id]={token,host:false};room.seen[p.id]=Date.now();room.revision++;room.updated=Date.now();
   M.checkpointClock(room.match);await this.persist(room);this.schedule(room);return {token,...this.view(room,p.id)};
  });
 }
 async command(room,viewerId,{action,revision,requestId}={}){
  return this.serial(room,async()=>{
   if(typeof requestId!=='string'||requestId.length>80||requestId.length<8)fail(400,'Identifiant de commande manquant.');
   if(room.receipts.some(r=>r.viewerId===viewerId&&r.requestId===requestId))return this.view(room,viewerId);
   const simultaneous=action&&M.concurrentInitialChoice(room.match,{...action,playerId:viewerId});
   const choosingRider=action?.type==='select-rider'&&!room.started&&!!room.members[viewerId];
   if(revision!==room.revision&&!simultaneous&&!choosingRider)fail(409,'La partie a avancé. Les dernières informations ont été rechargées.');
   if(!action||typeof action.type!=='string')fail(400,'Action invalide.');
   const member=room.members[viewerId];let changed=false;
   if(action.type==='select-rider'){
    if(!room.members[viewerId])fail(403,'Rejoins le salon pour choisir ton skater.');
    if(!reserveRider(room,viewerId,action.skaterId))fail(409,'Ce skater vient d’être choisi, ou la partie a déjà commencé.');
    changed=true;
   }else if(['start','start-module','next-module','npc-pause','npc-speed','release-seat'].includes(action.type)){
    if(!member?.host)fail(403,'Cette action appartient à l’hôte.');
    if(action.type==='start'){if(room.started)fail(409,'La partie est déjà lancée.');if(!lobbyReady(room))fail(409,'Chaque joueur doit choisir son skater avant de lancer la partie.');room.started=true;M.setClockRunning(room.match,!room.paused,this.now);changed=true;}
    if(action.type==='start-module')changed=room.started&&M.startModule(room.match);
    if(action.type==='next-module')changed=room.started&&M.advance(room.match);
    if(action.type==='npc-pause'){room.paused=!!action.paused;M.setClockRunning(room.match,room.started&&!room.paused,this.now);changed=true;}
    if(action.type==='npc-speed'){room.fast=!!action.fast;changed=true;}
    if(action.type==='release-seat'){
     const p=room.match.players.find(p=>p.id===action.seatId&&p.id!=='p0'&&p.kind==='human');
     if(!p)fail(400,'Place indisponible.');if(Date.now()-(room.seen[p.id]||0)<45000)fail(409,'Ce joueur est encore connecté.');
     p.kind='npc';delete room.members[p.id];room.riderChoices={...riderChoices(room)};delete room.riderChoices[p.id];changed=true;
    }
   }else{
    if(!room.started||!playable.has(action.type))fail(400,'Action indisponible.');
    if(!room.members[viewerId]||room.match.players.find(p=>p.id===viewerId)?.kind!=='human')fail(403,'Cette place est contrôlée par un NPC.');
    const allowed={type:action.type,playerId:viewerId,revision:room.match.revision};
    for(const key of ['cardId','tokenId','ids','target','bonusType','id','delta','choice','draftRound','advance'])if(Object.hasOwn(action,key))allowed[key]=action[key];
    changed=M.dispatch(room.match,allowed);
   }
   if(!changed)fail(409,'Cette action ne respecte pas la phase ou les règles de la partie.');
   M.checkpointClock(room.match);
   room.revision++;room.updated=Date.now();room.receipts.push({viewerId,requestId});room.receipts=room.receipts.slice(-128);
   await this.persist(room);this.schedule(room);return this.view(room,viewerId);
  });
 }
 schedule(room){
  clearTimeout(room.timer);room.timer=null;
  if(this.closed||!room.started||room.paused||!M.hasNpcTurn(room.match))return;
  room.timer=setTimeout(()=>this.serial(room,async()=>{
   if(!room.paused&&M.hasNpcTurn(room.match)&&M.npcStep(room.match)){room.revision++;room.updated=Date.now();await this.persist(room);}
   this.schedule(room);
  }).catch(error=>{room.paused=true;M.setClockRunning(room.match,false,this.now);console.error('NPC interrompu :',error.message);}),room.fast?100:this.npcDelay);
  room.timer.unref?.();
 }
 close(){this.closed=true;for(const room of this.rooms.values())clearTimeout(room.timer);}
}
