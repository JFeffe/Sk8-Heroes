import assert from 'node:assert/strict';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {readFileSync,writeFileSync,appendFileSync,mkdirSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import * as M from '../public/match.js';
import * as E from '../public/engine.js';
import {SKATERS} from '../public/skaters.js';
import {SPECIALTIES,specialtyActions} from '../public/specialties.js';
import {decide} from '../public/npc.js';
import {npcContext,draftValue} from '../public/npc-strategy.js';
import {npcDifficulty} from '../public/npc-difficulty.js';
import {npcGameView} from '../public/npc-view.js';

function hash(s){let n=2166136261;for(let i=0;i<s.length;i++)n=Math.imul(n^s.charCodeAt(i),16777619);n^=n>>>16;n=Math.imul(n,0x7feb352d);n^=n>>>15;n=Math.imul(n,0x846ca68b);return(n^(n>>>16))>>>0;}
const stream=key=>{let i=0;return()=>hash(key+':'+i++)/2**32;};
const ids=SKATERS.map(s=>s.id),compositions=[];
for(let a=0;a<3;a++)for(let b=a+1;b<4;b++)for(let c=b+1;c<5;c++)for(let d=c+1;d<6;d++)compositions.push([ids[a],ids[b],ids[c],ids[d]]);
const snapshots=()=>Object.fromEntries(['package.json',...readdirSync('public').filter(f=>f.endsWith('.js')).map(f=>'public/'+f)].map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')]));

function initial(job){
 const m=M.newMatch({seed:job.seed,mode:'advanced',npcCount:3,npcDifficulty:job.policy});
 for(const p of m.players){const skater=SKATERS.find(s=>s.id===job.group[(p.seat+job.rotation)%4]);Object.assign(p,{kind:'npc',caution:1,skaterId:skater.id,color:skater.color});Object.assign(p.game,{skaterId:skater.id,name:skater.name});}
 return JSON.parse(JSON.stringify(m));
}
function play(raw,job,arm){
 const copy=structuredClone(raw);if(arm==='base'){copy.mode='base';for(const p of copy.players)p.game.mode='base';}
 const m=M.restore(copy),disabled=arm.startsWith('without:')?arm.slice(8):null;
 let random=stream(job.seed+':other');Object.defineProperty(m,'randomSource',{value:()=>random(),configurable:true});
 if(disabled==='sol'&&SPECIALTIES.sol.passive)m.players.find(p=>p.skaterId==='sol').game.mode='base';
 const counters=new Map(),uses=Object.fromEntries(ids.map(id=>[id,[]])),eligible=Object.fromEntries(ids.map(id=>[id,new Set()]));let steps=0,checks=0;
 const capacity=Object.fromEntries(ids.map(id=>[id,{fourthGains:0,maxAdjust:0,previous:0}]));
 function trackCapacity(){for(const p of m.players){const c=capacity[p.skaterId],n=p.game.bank.adjust;if(n===4&&c.previous<4)c.fourthGains++;c.maxAdjust=Math.max(c.maxAdjust,n);c.previous=n;}}
 function inventory(){const cards=[...m.deck,...m.market.cards,...m.discard,...m.players.flatMap(p=>p.game.hand)];assert.equal(cards.length,85);assert.equal(new Set(cards.map(c=>c.uid)).size,85);for(const p of m.players)assert(Object.entries(p.game.bank).every(([t,n])=>n>=0&&n<=E.bonusLimit(p.game,t)));checks++;}
 while(m.phase!=='complete'){
  trackCapacity();
  assert(++steps<3000,'Deadlock '+JSON.stringify({job,arm}));
  if(m.phase==='recap'){random=stream(job.seed+':market:'+m.module);assert(M.advance(m));inventory();continue;}
  if(m.phase==='draft-summary'){assert(M.startModule(m));if(disabled){const target=m.players.find(p=>p.skaterId===disabled).game;target.specialty.used=true;if(disabled==='sol'&&SPECIALTIES.sol.passive)target.mode='base';}inventory();continue;}
  const p=M.pendingNpc(m),g=p.game;assert(p);
  const view=npcGameView(g),options=specialtyActions(view),context=npcContext(m,p);
  // Targeted control: preserve the new Sol and all opponents, but reconstruct
  // Jade's previous greedy return and generic planner, including its old
  // repeated-card reward forecast. Only this audit view is altered.
  const legacyJade=arm==='legacy-jade'&&p.skaterId==='jade';
  const action=legacyJade&&options.length?[...options].sort((a,b)=>draftValue(view.hand.find(c=>c.uid===b.cardId),view,npcDifficulty(context.difficulty))-draftValue(view.hand.find(c=>c.uid===a.cardId),view,npcDifficulty(context.difficulty)))[0]:decide(legacyJade?{...view,mode:'base',specialty:{used:true}}:view,context);assert(action);
  if(options.length)eligible[p.skaterId].add(m.module);
  const lucky=action.type==='specialty'&&p.skaterId==='ruby',reroll=action.type==='bonus'&&action.bonusType==='reroll',rolling=action.type==='roll'||reroll||lucky;
  let draws=0,rollingIds=[];
  if(rolling){
   rollingIds=lucky?[action.id]:E.rerollableDice(g).map(d=>d.id);
   const key=[job.seed,'dice',p.seat,m.module,g.attempt,g.landed.length,lucky?'lucky':reroll?'reroll':'roll'].join(':');
   const ordinal=counters.get(key)||0;counters.set(key,ordinal+1);
   random=()=>{assert(draws<rollingIds.length);return hash(key+':'+ordinal+':'+rollingIds[draws++])/2**32;};
  }else random=stream([job.seed,'decision',m.module,m.phase,m.draftRound].join(':'));
  if(action.type==='specialty'){
   const target=action.cardId||g.active;
   uses[p.skaterId].push({module:m.module,attempt:g.attempt,target,choice:action.choice||null,from:action.bonusType||null,matchedBefore:g.phase==='rolled'?!!E.findMatch(E.activeCard(g),E.freeDice(g),E.wildColor(g)):null});
  }
  assert(M.dispatch(m,{...action,playerId:p.id}),JSON.stringify({job,arm,action,phase:g.phase}));
  if(rolling)assert.equal(draws,rollingIds.length);
  if(action.type==='specialty'){
   const event=uses[p.skaterId].at(-1);event.matchedAfter=g.phase==='rolled'?!!E.findMatch(E.activeCard(g),E.freeDice(g),E.wildColor(g)):null;
   assert(g.specialty.used);inventory();
  }
 }
 trackCapacity();inventory();const max=Math.max(...m.players.map(p=>p.game.pv)),winners=m.players.filter(p=>p.game.pv===max).length;
 return {family:job.family,block:job.block,seed:job.seed,rep:job.rep,policy:job.policy,group:job.group,rotation:job.rotation,arm,route:m.route,steps,checks,players:m.players.map(p=>{
  const g=p.game,events=uses[p.skaterId];assert.equal(g.history.length,6);assert.equal(g.pv,g.history.reduce((n,h)=>n+h.pv,0));
  for(const event of events){const attempt=g.history[event.module].attempts[event.attempt];event.bankedTarget=!!event.target&&attempt.points>0&&(attempt.entries||[]).some(e=>e.card===event.target&&e.confirmed);}
  const attempts=g.history.flatMap(h=>h.attempts);assert.equal(attempts.length,12);
  return {capacity:{fourthGains:capacity[p.skaterId].fourthGains,maxAdjust:capacity[p.skaterId].maxAdjust},id:p.skaterId,seat:p.seat,firstPosition:raw.order.indexOf(p.seat),pv:g.pv,win:g.pv===max?1/winners:0,winOrTie:g.pv===max?1:0,best:g.history.reduce((n,h)=>n+h.best,0)/6,points:attempts.reduce((n,a)=>n+a.points,0)/12,falls:attempts.filter(a=>a.reason==='fall').length/12,uses:events,eligibleModules:[...eligible[p.skaterId]],rounds:g.history.map((h,i)=>({module:h.module,pv:h.pv,best:h.best,used:events.some(e=>e.module===i)?1:0})),tokens:m.statistics.players[p.id],remaining:{...g.bank}};
 })};
}

if(!isMainThread){
 const file=resolve(workerData.out,'worker-'+workerData.index+'.jsonl');writeFileSync(file,'');let games=0;
 for(const job of workerData.jobs){const raw=initial(job);for(const arm of job.arms){const record=play(raw,job,arm);appendFileSync(file,JSON.stringify(record)+'\n');games++;}parentPort.postMessage({families:1,games:job.arms.length});}
 parentPort.postMessage({done:true,file,games});
}else{
 const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')));
 const config={normal:Number(args.normal??20),expert:Number(args.expert??10),ablation:Number(args.ablation??5),expertAblation:Number(args['expert-ablation']??0),onlyAblation:args['only-ablation']==='true',legacyJade:args['legacy-jade']==='true',workers:Number(args.workers??6),groups:Number(args.groups??15),out:args.out||'tests/specialty-balance-061'};
 assert(config.workers>=1&&config.groups>=1&&config.groups<=15);
 mkdirSync(config.out,{recursive:true});const before=snapshots(),jobs=[];
 for(const policy of ['normal','expert'])for(let rep=0;rep<config[policy];rep++)for(const [groupIndex,group] of compositions.slice(0,config.groups).entries())for(let rotation=0;rotation<4;rotation++){
  const block=rep+':'+groupIndex,seed=hash('sk8-specialty-061:'+block),arms=config.legacyJade?(group.includes('jade')?['legacy-jade']:[]):config.onlyAblation?[]:['advanced','base'];
  if(!config.legacyJade&&rep<(policy==='normal'?config.ablation:config.expertAblation))arms.push(...group.map(id=>'without:'+id));
  if(!arms.length)continue;
  jobs.push({family:policy+':'+block+':'+rotation,block,seed,rep,policy,group,rotation,arms});
 }
 const planned=jobs.reduce((n,j)=>n+j.arms.length,0),start=Date.now();let completed=0,families=0;
 console.log(JSON.stringify({config,families:jobs.length,games:planned}));
 const timer=setInterval(()=>console.log(JSON.stringify({completed,families,planned,elapsedSeconds:Math.round((Date.now()-start)/1000)})),15000);
 try{
  const files=await Promise.all(Array.from({length:config.workers},(_,index)=>new Promise((resolveWorker,reject)=>{
   const worker=new Worker(new URL(import.meta.url),{workerData:{out:config.out,index,jobs:jobs.filter((_,i)=>i%config.workers===index)}});
   let file;worker.on('message',m=>{if(m.done)file=m.file;else{completed+=m.games;families+=m.families;}});worker.on('error',reject);worker.on('exit',code=>code?reject(Error('Worker exited '+code)):resolveWorker(file));
  })));
  const after=snapshots();assert.deepEqual(after,before,'Production sources changed during audit');assert.equal(completed,planned);
  writeFileSync(resolve(config.out,'run.json'),JSON.stringify({build:JSON.parse(readFileSync('package.json')).version,rules:E.RULESET_VERSION,saveVersion:M.MATCH_VERSION,createdAt:new Date().toISOString(),config,planned,completed,families,elapsedSeconds:(Date.now()-start)/1000,files,sourceUnchanged:true,sourceHashes:before,powers:SPECIALTIES,method:{players:4,modules:6,compositions:'All 15 subsets of four among six skaters',rotations:'Four cyclic rider-to-seat assignments per composition and seed; all cautions = 1',win:'Fractional credit 1 / number of tied winners',pairing:'Identical starting state and independent keyed streams for each draft and each seat/module/attempt/trick/die; Ruby extra reroll has its own stream',ablation:'Only one named specialty disabled; opponents retain powers; not a change to production rules',controller:config.legacyJade?'Production opponents with reconstructed 0.6.1 Jade decisions in an isolated view; new Sol unchanged':'Unmodified production NPC controller; common difficulty in each game; no knowledge of future rolls',intervalUnit:'Seed × composition, averaging four correlated rotations'}},null,2));
  console.log(JSON.stringify({completed,elapsedSeconds:(Date.now()-start)/1000,sourceUnchanged:true}));
 }finally{clearInterval(timer);}
}
