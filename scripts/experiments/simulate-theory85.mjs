import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {availableParallelism} from 'node:os';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {root,productionHashes} from './theory85-runtime.mjs';

const profiles=['balanced','two','three','four'];
const fourCalibration=JSON.parse(await readFile(path.join(root,'tests/theory85-forced-results.json'),'utf8').catch(error=>{if(error.code==='ENOENT')return '{"results":[]}';throw error;})).results.filter(r=>r.variant==='approved'&&r.cost===4);
if(isMainThread?process.argv.includes('--probe-four'):workerData.probeFour)assert.equal(fourCalibration.length,9,'Run forced 1000 before the four-die probe.');
const mix=x=>{x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return(x^(x>>>15))>>>0;};
const rngFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const costBucket=()=>({selected:0,landed:0,banked:0,points:0,opened:0,falls:0,attemptPoints:0,three:0,availableAtOpening:0,inWinningBest:0});
const roleBucket=()=>({games:0,matchWins:0,moduleWins:0,finalWins:0,pv:0,attempts:0,falls:0,three:0,score:0,choices:0,tokenGained:0,tokenSpent:0,tokenEnd:0,initialAdvanced:0});
function aggregate(){return {sessions:0,commands:0,modules:0,attempts:0,falls:0,three:0,points:0,ties:0,unawarded:0,moduleConditions:{},byCost:Object.fromEntries([2,3,4].map(n=>[n,costBucket()])),finalByCost:Object.fromEntries([2,3,4].map(n=>[n,costBucket()])),byProfile:Object.fromEntries(profiles.map(p=>[p,roleBucket()])),byModule:Array.from({length:6},()=>({games:0,attempts:0,score:0,falls:0,three:0,best:0,winningScore:0,stocks:[],costPoints:{2:0,3:0,4:0},costCards:{2:0,3:0,4:0}})),cards:{},marketOld:0,marketNew:0,marketDraws:0,marketSizes:[],stockMax:0,matchResults:[],attemptSamples:[]};}
function addInto(a,b){for(const [k,v]of Object.entries(b)){
 if(k==='stockMax'){a[k]=Math.max(a[k]||0,v);continue;}
 if(k==='cards'){for(const [name,row]of Object.entries(v)){a.cards[name]??={cost:row.cost,tier:row.tier,type:row.type,drafted:0,selected:0,landed:0,banked:0,points:0,inWinningBest:0};for(const key of ['drafted','selected','landed','banked','points','inWinningBest'])a.cards[name][key]+=row[key];}continue;}
 if(typeof v==='number')a[k]=(a[k]||0)+v;else if(Array.isArray(v)){if(k==='byModule'){v.forEach((row,i)=>addInto(a[k][i],row));}else{a[k]??=[];a[k].push(...v);}}else if(v&&typeof v==='object'){a[k]??={};addInto(a[k],v);}
 }return a;}

async function runtime(){
 const dir=workerData.modulesV3?'theory85-modules-v3-runtime':workerData.modulesV2?'theory85-modules-v2-runtime':'theory85-runtime';
 const M=await import(`../../.local-games/${dir}/match.js`),E=await import(`../../.local-games/${dir}/engine.js`),T=await import(`../../.local-games/${dir}/turn.js`);
 const {TRICKS,MODULES}=await import(`../../.local-games/${dir}/data.js`);
 const {decide}=await import(`../../.local-games/${dir}/npc.js`);
 const {npcContext,EXPERIMENT}=await import(`../../.local-games/${dir}/npc-strategy.js`);
 const {npcGameView}=await import(`../../.local-games/${dir}/npc-view.js`);
 return {M,E,T,TRICKS,MODULES,decide,npcContext,npcGameView,EXPERIMENT};
}
function setPremiums(R,variant){
 for(const c of R.TRICKS)c.points=c.difficultyPoints+(c.cost===3?variant.three:c.cost===4?variant.four:0);
 if(variant.modules==='routes-v1'){
  R.MODULES[1].bonus={kind:'ordered',types:['slide','kick']};
  R.MODULES[1].condition='Réussir Slide → Kick.';
  R.MODULES[5].bonus={kind:'ordered',types:['kick','air']};
  R.MODULES[5].condition='Réussir Kick → Air.';
  R.MODULES[10].bonus={kind:'dice-pair',costs:[3,3]};
  R.MODULES[10].condition='Réussir deux tricks à trois dés.';
  R.MODULES[11].bonus={kind:'all-dice'};
  R.MODULES[11].condition='Poser les six dés sur une séquence conservée.';
 }
}
function inventory(m){const cards=[...m.deck,...m.market.cards,...m.discard,...m.players.flatMap(p=>p.game.hand)];assert.equal(cards.length,85);assert.equal(new Set(cards.map(c=>c.uid)).size,85);}
function fourProbe(R,m,g,role){
 if(role!=='four'||g.bank.reroll<1||g.bank.adjust<1)return null;
 const {E,MODULES}=R;
 const success=c=>{
  const stock=Math.min(3,g.bank.adjust,g.bank.reroll,g.bank.freeze);
  const a=fourCalibration.find(r=>r.name===c.name&&r.stock===(stock>=1?1:0));
  const b=fourCalibration.find(r=>r.name===c.name&&r.stock===3);
  return a?(stock<=1?a.landed/a.trials:a.landed/a.trials+(b.landed/b.trials-a.landed/a.trials)*(stock-1)/2):0;
 };
 const ranked=cards=>cards.sort((a,b)=>b.points*success(b)-a.points*success(a)||a.id-b.id);
 if(m.phase==='recovery'&&m.module===4){
  const next=MODULES[m.route.at(-1)],cards=g.draftCards.filter(c=>c.cost===4&&(!next.needs.length||next.needs.includes(c.type)||g.hand.some(h=>next.needs.includes(h.type)&&h.cost===2)));
  if(next.needs.length===1)cards.sort((a,b)=>Number(next.needs.includes(b.type))-Number(next.needs.includes(a.type)));
  const priority=next.needs.length===1?cards.filter(c=>next.needs.includes(c.type)):cards;
  const card=ranked(priority.length?priority:cards)[0];
  if(card){const token=[...g.draftTokens].sort((a,b)=>g.bank[a.type]-g.bank[b.type])[0];return {type:'draft-pair',cardId:card.uid,tokenId:token.id};}
 }
 if(m.phase==='playing'&&MODULES[g.route[g.module]].bonus?.kind==='last-epic'){
  const epics=ranked(E.options(g).filter(c=>c.cost===4));
  if(g.phase==='select'&&!g.landed.length&&epics.length){
   const helper=E.options(g).filter(c=>c.cost===2).sort((a,b)=>a.points-b.points||a.id-b.id)[0];
   if(helper)return {type:'choose',cardId:helper.uid};
  }
  if(g.phase==='decision'&&g.landed.length===1&&epics.length)return {type:'continue'};
 }
 if(m.phase==='playing'&&g.phase==='select'){
  const card=ranked(E.options(g).filter(c=>c.cost===4))[0];if(card)return {type:'choose',cardId:card.uid};
 }
 return null;
}

function fullMatch(R,index,variant,cohort,report,probe=false){
 const {M,E,TRICKS,decide,npcContext,npcGameView}=R;setPremiums(R,variant);
 const seed=mix(index+101),m=M.newMatch({seed,npcCount:3,length:6,skaterId:['neo','ruby','jade','sol','milo','iris'][index%6]});
 const roles=m.players.map((_,seat)=>cohort==='homogeneous'?'balanced':profiles[(seat+index)%4]);
 const ongoing=new Map(),attemptRows=[],recaps=new Set();let steps=0;
 function cardStat(c){return report.cards[c.name]??={cost:c.cost,tier:c.tier,type:c.type,drafted:0,selected:0,landed:0,banked:0,points:0,inWinningBest:0};}
 function bucket(cost,final=false){return(final?report.finalByCost:report.byCost)[cost];}
 function condition(id){return report.moduleConditions[id]??={games:0,attempts:0,banked:0,eligible:0,bonus:0,falls:0,three:0,points:0,pointsWithBonus:0,spent:0,bonusWinningAttempts:0,withoutTokens:0,bothAttempts:0,firstOnly:0,secondOnly:0,neither:0,samples:[],byAttempt:{0:{attempts:0,banked:0,bonus:0},1:{attempts:0,banked:0,bonus:0}},byOpening:{2:{attempts:0,banked:0,bonus:0},3:{attempts:0,banked:0,bonus:0},4:{attempts:0,banked:0,bonus:0}}};}
 function terminal(p,role){
  const g=p.game,key=p.id+':'+g.module+':'+g.attempt,state=ongoing.get(key)||{opening:0};
  const row={player:p.id,profile:role,module:g.module,attempt:g.attempt,points:g.score,reason:g.reason,opening:state.opening,landed:g.landed.map(e=>g.hand.find(c=>c.uid===e.card)),used:{...g.used}};
  attemptRows.push(row);report.attempts++;report.points+=row.points;if(row.reason==='fall')report.falls++;if(row.reason==='three')report.three++;
  const q=condition(m.route[g.module]);q.attempts++;q.banked+=Number(row.points>0);q.eligible+=Number(row.points>0&&g.landed.length>=2);q.bonus+=Number(g.last.moduleBonus>0);q.falls+=Number(row.reason==='fall');q.three+=Number(row.reason==='three');q.points+=row.points;q.pointsWithBonus+=g.last.moduleBonus>0?row.points:0;q.spent+=Object.values(g.used).reduce((a,b)=>a+b,0);q.withoutTokens+=Number(Object.values(g.used).every(v=>v===0));
  q.byAttempt[g.attempt].attempts++;q.byAttempt[g.attempt].banked+=Number(row.points>0);q.byAttempt[g.attempt].bonus+=Number(g.last.moduleBonus>0);
  if(q.byOpening[state.opening]){q.byOpening[state.opening].attempts++;q.byOpening[state.opening].banked+=Number(row.points>0);q.byOpening[state.opening].bonus+=Number(g.last.moduleBonus>0);}
  assert.equal(g.score>0?E.sequenceView(g).confirmed.points:0,g.score,'Live score must equal archived score');
  if(g.moduleTrace){assert.equal(g.moduleTrace.entries.length,g.landed.length);for(const entry of g.moduleTrace.entries)assert(entry.dice.every(d=>Number.isInteger(d.face)&&d.face>=1&&d.face<=6));}
  const roleRow=report.byProfile[role];roleRow.attempts++;roleRow.score+=row.points;roleRow.falls+=Number(row.reason==='fall');roleRow.three+=Number(row.reason==='three');
  const module=report.byModule[g.module];module.attempts++;module.score+=row.points;module.falls+=Number(row.reason==='fall');module.three+=Number(row.reason==='three');
  if(row.opening)for(const b of[bucket(row.opening),...(g.module===5?[bucket(row.opening,true)]:[])]){b.opened++;b.falls+=Number(row.reason==='fall');b.attemptPoints+=row.points;b.three+=Number(row.reason==='three');}
  if(row.points>0)for(const e of g.last.entries){
   if(!e.confirmed)continue;const c=g.hand.find(c=>c.uid===e.card),points=c.points+(e.bonus||0),stat=cardStat(c);stat.banked++;stat.points+=points;
   for(const b of[bucket(c.cost),...(g.module===5?[bucket(c.cost,true)]:[])]){b.banked++;b.points+=points;}
   module.costPoints[c.cost]+=points;module.costCards[c.cost]++;
  }
  if(report.attemptSamples.length<1000)report.attemptSamples.push({seed,index,role,module:row.module,attempt:row.attempt,points:row.points,reason:row.reason,opening:row.opening,costs:row.landed.map(c=>c.cost),cards:row.landed.map(c=>c.name)});
 }
 while(m.phase!=='complete'){
  assert(++steps<4000,'Simulation deadlock '+seed);
  if(m.phase==='draft-summary'){assert(M.startModule(m));inventory(m);continue;}
  if(m.phase==='recap'){
   if(!recaps.has(m.module)){
    recaps.add(m.module);const r=m.recaps.at(-1),mod=report.byModule[m.module];report.modules++;mod.games++;mod.winningScore+=r.rows[0].best;condition(m.route[m.module]).games++;
    const q=condition(m.route[m.module]);q.samples.push({index,seed,attempts:8,bonus:r.rows.reduce((n,row)=>n+row.attempts.filter(a=>a.moduleBonus>0).length,0)});
    for(const row of r.rows){const first=row.attempts[0].moduleBonus>0,second=row.attempts[1].moduleBonus>0;q[first&&second?'bothAttempts':first?'firstOnly':second?'secondOnly':'neither']++;}
    report.ties+=Number(r.winners.length>1);report.unawarded+=Number(!r.winners.length);
    for(const p of m.players){
     const role=roles[p.seat],row=r.rows.find(row=>row.id===p.id);mod.best+=row.best;mod.stocks.push({...p.game.bank});
     const credit=r.winners.includes(p.id)?1/r.winners.length:0;report.byProfile[role].moduleWins+=credit;if(m.module===5)report.byProfile[role].finalWins+=credit;
     if(credit)condition(m.route[m.module]).bonusWinningAttempts+=row.attempts.filter(a=>a.points===row.best&&a.moduleBonus>0).length;
     if(credit)for(const a of attemptRows.filter(a=>a.module===m.module&&a.player===p.id&&a.points===row.best))for(const c of a.landed){cardStat(c).inWinningBest++;bucket(c.cost).inWinningBest++;if(m.module===5)bucket(c.cost,true).inWinningBest++;}
    }
   }
   assert(M.advance(m));inventory(m);continue;
  }
  const p=M.currentPlayer(m),g=p.game,role=roles[p.seat],previous=g.phase,key=p.id+':'+g.module+':'+g.attempt;
  const action=(probe?fourProbe(R,m,npcGameView(g),role):null)||decide(npcGameView(g),{...npcContext(m,p),difficulty:'expert',strategy:role});assert(action,'No controller action');
  const active=E.activeCard(g),chosen=g.hand.find(c=>c.uid===action.cardId);
  if(action.type==='choose'){
   cardStat(chosen).selected++;bucket(chosen.cost).selected++;if(m.module===5)bucket(chosen.cost,true).selected++;
   if(!g.landed.length){ongoing.set(key,{opening:chosen.cost});for(const cost of new Set(E.options(g).map(c=>c.cost))){bucket(cost).availableAtOpening++;if(m.module===5)bucket(cost,true).availableAtOpening++;}}
   report.byProfile[role].choices++;
  }
  if(['draft','draft-pair'].includes(action.type)){
   const c=[...m.deck,...m.market.cards].find(c=>c.uid===action.cardId);assert(c);cardStat(c).drafted++;
   if(m.phase==='initial'&&c.tier==='advanced')report.byProfile[role].initialAdvanced++;
   if(m.phase==='recovery'){if(m.market.cards.some(c=>c.uid===action.cardId))report.marketNew++;else report.marketOld++;}
  }
  assert(M.dispatch(m,{playerId:p.id,...action}),JSON.stringify({seed,role,match:m.phase,phase:g.phase,action}));
  if(action.type==='land'){cardStat(active).landed++;bucket(active.cost).landed++;if(m.module===5)bucket(active.cost,true).landed++;}
  if(previous!=='result'&&g.phase==='result')terminal(p,role);
  for(const value of Object.values(g.bank)){assert(value>=0);report.stockMax=Math.max(report.stockMax,value);}
 }
 inventory(m);report.sessions++;report.commands+=steps;report.marketDraws+=m.experimentalMarkets.length;report.marketSizes.push(...m.experimentalMarkets.map(m=>m.size));
 const max=Math.max(...m.players.map(p=>p.game.pv)),winners=m.players.filter(p=>p.game.pv===max),summary=M.matchSummary(m);
 for(const p of m.players){
  const role=roles[p.seat],r=report.byProfile[role],s=summary.players.find(s=>s.id===p.id);r.games++;r.pv+=p.game.pv;r.matchWins+=winners.includes(p)?1/winners.length:0;
  r.tokenGained+=s.tokens.totalGained;r.tokenSpent+=s.tokens.totalSpent;r.tokenEnd+=s.tokens.remaining.adjust+s.tokens.remaining.reroll+s.tokens.remaining.freeze;
  assert.equal(p.game.pv,p.game.history.reduce((s,h)=>s+h.pv,0));
 }
 report.matchResults.push({index,seed,route:m.route,roles,pv:m.players.map(p=>p.game.pv),wins:m.players.map(p=>winners.includes(p)?1/winners.length:0),final:m.recaps.at(-1).winners.map(id=>roles[m.players.find(p=>p.id===id).seat])});
}

function forcedTrials(R,task,variant){
 const {E,T,TRICKS,MODULES,decide,npcGameView}=R;setPremiums(R,variant);
 const helperNames=task.helpers==='mature'?['Bigspin','Hardflip','Suski Grind','Overcrook','360°','Indy Grab','Kickflip','Nosegrind']:['Kickflip','Pop Shuvit','50-50 Grind','Nosegrind','180°','Indy Grab'];
 const candidate=TRICKS.find(c=>c.name===task.name),helpers=helperNames.filter(name=>name!==candidate.name).slice(0,6).map((name,i)=>({...TRICKS.find(c=>c.name===name),uid:'helper'+i}));
 const template=E.newGame({name:'Lab',skaterId:'neo',route:[3,2,4,5,6,8]},()=>.4);template.deck=[];
 MODULES[100]={id:100,name:'Neutral controlled lab',needs:[],pv:4,bonus:null,bonusPoints:0};
 const result={name:task.name,cost:candidate.cost,points:candidate.points,stock:task.stock,target:task.target,objective:task.objective||'pv',helpers:task.helpers||'base',trials:task.trials,landed:0,banked:0,falls:0,three:0,score:0,scoreSquared:0,spent:{adjust:0,reroll:0,freeze:0},deferred:0,immediate:0};
 const hand=[{...candidate,uid:'candidate'},...helpers];
 for(let trial=0;trial<task.trials;trial++){
  const rng=rngFor(mix(101010+trial*7919+candidate.id*131+task.stock*97+task.target*17));
  const final=task.target>=20;
  const g={...template,...T.newTurn(),route:final?[3,2,4,5,6,100]:[3,2,100,5,6,8],module:final?5:2,hand,bank:{adjust:task.stock,reroll:task.stock,freeze:task.stock},secured:[],sequences:[],earned:{adjust:0,reroll:0,freeze:0},attempts:[],history:[],offer:[],attempt:final?1:0,phase:'select'};
  assert(E.chooseCard(g,'candidate'));let steps=0;
  while(g.phase!=='result'){
   assert(++steps<300);const action=decide(npcGameView(g),{leader:task.target-1,parScore:task.target,difficulty:'expert',evaluation:task.objective==='score'?'score':'pv'});let ok=false;
   switch(action.type){
    case 'choose':ok=E.chooseCard(g,action.cardId);break;case 'roll':ok=E.roll(g,rng);break;case 'place':ok=E.place(g,action.ids,action.target);break;
    case 'bonus':ok=E.bonus(g,action.bonusType,action.id,action.delta,rng);break;case 'land':ok=E.land(g);break;case 'stop':ok=E.stop(g);break;case 'continue':ok=E.continueRun(g);break;case 'fall':ok=E.fall(g);break;
   }
   assert(ok,JSON.stringify({mode:'forced',card:candidate.name,phase:g.phase,action}));
  }
  if(g.sequenceReward?.pending){const action=decide(npcGameView(g),{difficulty:'expert'});assert(E.claimSequenceReward(g,action.choice));result.immediate++;}
  result.landed+=Number(g.landed.some(e=>e.card==='candidate'));result.banked+=Number(g.score>0);result.falls+=Number(g.reason==='fall');result.three+=Number(g.reason==='three');result.score+=g.score;result.scoreSquared+=g.score*g.score;
  for(const type of ['adjust','reroll','freeze'])result.spent[type]+=g.used[type];result.deferred+=Object.values(g.earned).reduce((s,n)=>s+n,0);
 }
 return result;
}

async function work(task){
 const R=await runtime();R.EXPERIMENT.draftModel=task.draftModel||'legacy';
 if(task.mode==='forced')return forcedTrials(R,task.task,task.variant);
 const result=aggregate();for(let index=task.start;index<task.end;index++)fullMatch(R,index,task.variant,task.cohort,result,task.probeFour);return result;
}

async function pool(tasks,workers){
 const results=Array(tasks.length);let cursor=0,done=0;
 await Promise.all(Array.from({length:workers},async()=>{
  while(cursor<tasks.length){const i=cursor++,task=tasks[i];
   results[i]=await new Promise((resolve,reject)=>{const worker=new Worker(new URL(import.meta.url),{workerData:task});let received=false;worker.on('message',value=>{received=true;resolve(value);});worker.on('error',reject);worker.on('exit',code=>{if(code&&!received)reject(Error('Worker exit '+code));});});
   done++;if(done%8===0||done===tasks.length)console.log(JSON.stringify({done,tasks:tasks.length,mode:task.mode}));
  }
 }));return results;
}

if(!isMainThread){try{parentPort.postMessage(await work(workerData));}catch(error){throw error;}}
else{
 const mode=process.argv[2]||'matches',count=Number(process.argv[3]||200),workers=Math.min(4,availableParallelism()),draftModel=process.argv.includes('--sequence-draft')?'sequence':'legacy';
 const before=await productionHashes(),start=Date.now();
 const focused=process.argv.includes('--focused'),modules=process.argv.includes('--module-routes'),probeFour=process.argv.includes('--probe-four'),modulesV2=process.argv.includes('--modules-v2'),modulesV3=process.argv.includes('--modules-v3');
 const variants=modulesV3?[{id:'conditions-v3-four2',three:2,four:2}]:modulesV2?[{id:'conditions-v2-four2',three:2,four:2},{id:'conditions-v2-four4',three:2,four:4}]:probeFour?[{id:'old-four2',three:2,four:2},{id:'old-four4',three:2,four:4},{id:'routes-v1-four2',three:2,four:2,modules:'routes-v1'},{id:'routes-v1-four4',three:2,four:4,modules:'routes-v1'}]:modules?[{id:'routes-v1-four2',three:2,four:2,modules:'routes-v1'},{id:'routes-v1-four4',three:2,four:4,modules:'routes-v1'}]:focused?[{id:'four-lower',three:2,four:2},{id:'four-higher',three:2,four:6},{id:'three-higher',three:3,four:4}]:[{id:'no-premium',three:0,four:0},{id:'approved',three:2,four:4},{id:'strong-premium',three:3,four:6}];
 if(mode==='matches'){
  const tasks=[];for(const variant of variants)for(let i=0;i<count;i+=25)tasks.push({mode:'matches',variant,cohort:'mixed',start:i,end:Math.min(count,i+25)});
  if(modulesV2||modulesV3)for(let i=0;i<count;i+=25)tasks.push({mode:'matches',variant:variants[0],cohort:'homogeneous',start:10000+i,end:10000+Math.min(count,i+25)});
  else if(!focused&&!modules&&!probeFour)for(let i=0;i<Math.max(100,Math.floor(count/2));i+=25)tasks.push({mode:'matches',variant:variants[1],cohort:'homogeneous',start:10000+i,end:10000+Math.min(Math.max(100,Math.floor(count/2)),i+25)});
  tasks.forEach(t=>{t.draftModel=draftModel;t.probeFour=probeFour;t.modulesV2=modulesV2;t.modulesV3=modulesV3;});
  const results=await pool(tasks,workers),cohorts={};
  results.forEach((r,i)=>{const key=tasks[i].variant.id+'-'+tasks[i].cohort;cohorts[key]??=aggregate();addInto(cohorts[key],r);});
  const report={mode,draftModel,probeFour,countPerVariant:count,elapsedMs:Date.now()-start,variants,methodology:{players:4,modules:6,initial:'2 Base + 1 Advanced; choose simultaneously, pass right, add Advanced; all 6 choices free',recovery:'8 current-tier cards + 4 tokens; each player takes one card and one token; visible lower tiers may replace current tier; unpicked cards return',tokens:'Each physical reward card in a conserved attempt awards one token at module end, no cap by type',dice:'All real engine rules, own-color wild star, persistent freeze, multiple ±1 tokens, full free-dice rerolls',controllers:probeFour?'Four-die profile explicitly drafts a usable 4-die card and opens with it when it has at least one adjust and one reroll; card ranking uses empirical precomputed success rates, never future rolls. Other profiles unchanged.':'Expert public-information bounded search, mild cost preferences; not proven optimal or human behavior',profiles,preferenceUtility:{two:'2 dice +1.5; other costs -1.5',three:'3 dice +2',four:'4 dice +3',balanced:'none'},differencesFromProduction:'Sandbox-only catalog/draft/token patches; isolated planner counts all card rewards, uses fresh odds and avoids trial-landing mutations'},cohorts,productionUnchanged:true};
  report.modulesV2=modulesV2;
  report.modulesV3=modulesV3;
  if(modulesV3){report.methodology.moduleBonus='Seven revised V3 conditions, +2 independently per banked attempt, minimum two tricks; physical stars count as 1 for module goals. 25% target includes falls. Unknown face variety uses compatible normal-face distributions for planning only; actual snapshots/actions determine every awarded point.';report.methodology.scorePremiums='Three-die and four-die cards both receive +2 over difficulty points.';}
  if(modulesV2){report.methodology.moduleBonus='V2 diverse conditions; physical face snapshots and real actions for scoring; all goals require at least two banked tricks. Planner uses explicit heuristic probabilities for unknown future faces/actions; no bonus is awarded from those estimates.';report.methodology.fourDieProbe='On Boucle du Lagon the four-die profile plays a cheap two-die helper before its Epic, instead of forcing the Epic to open. All commands use actual engine rules.';}
  assert.deepEqual(await productionHashes(),before);await writeFile(path.join(root,modulesV3?'tests/theory85-module-v3-results.json':modulesV2?'tests/theory85-module-v2-results.json':probeFour?'tests/theory85-module-probe-results.json':modules?'tests/theory85-module-routes-results.json':focused?'tests/theory85-premium-sensitivity-results.json':draftModel==='sequence'?'tests/theory85-sequence-draft-results.json':'tests/theory85-simulation-results.json'),JSON.stringify(report,null,2));
  for(const [key,r]of Object.entries(cohorts))console.log(JSON.stringify({key,sessions:r.sessions,fall:r.falls/r.attempts,three:r.three/r.attempts,mean:r.points/r.attempts,roles:Object.fromEntries(Object.entries(r.byProfile).map(([p,x])=>[p,{win:x.games?x.matchWins/x.games:0,final:x.games?x.finalWins/x.games:0,pv:x.games?x.pv/x.games:0}]))}));
 }else if(mode==='forced'){
  const mature=process.argv.includes('--mature-hands');
  const names=['Varial Kickflip','Frontside Flip','Bigspin','Backside Flip','Varial Heelflip','Inward Heelflip','Hardflip','720°','360 Flip','Bluntslide','Laser Flip','Impossible','Hurricane','900°','1080°'];
  const tasks=[];for(const variant of mature?variants.filter(v=>v.id==='approved'):variants)for(const name of names)for(const stock of [0,1,3])tasks.push({mode:'forced',variant,task:{name,stock,target:['360 Flip','Bluntslide','Laser Flip','Impossible','Hurricane','900°','1080°'].includes(name)?20:12,trials:count,helpers:mature?'mature':'base',objective:mature?'score':'pv'}});
  const results=await pool(tasks,workers);assert.deepEqual(await productionHashes(),before);
  await writeFile(path.join(root,mature?'tests/theory85-mature-hand-results.json':'tests/theory85-forced-results.json'),JSON.stringify({trialsPerCell:count,elapsedMs:Date.now()-start,methodology:mature?'Forced opening, identical six powerful 2-die supporting cards, neutral module without module bonus, expert controller optimizes expected conserved points rather than fixed target; stage 3 for Advanced and stage 6 attempt 2 for Epic, star active, stock of each bonus kind 0/1/3':'Forced opening card, identical six basic support cards, neutral module without module bonus, actual expert controller for subsequent legal actions; Advanced candidates tested in module 3 attempt 1 targeting 12, Epic candidates in final module attempt 2 targeting 20 so unused tokens have no future value; stocks are per bonus kind; no draft-selection bias; star active',results:results.map((r,i)=>({...r,variant:tasks[i].variant.id})),productionUnchanged:true},null,2));
  console.log(JSON.stringify({cells:results.length,trials:results.reduce((s,r)=>s+r.trials,0),ms:Date.now()-start}));
 }else throw Error('Unknown mode');
}
