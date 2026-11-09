import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as M from '../public/match.js';
import * as E from '../public/engine.js';
import {SKATERS} from '../public/skaters.js';
import {decide} from '../public/npc.js';
import {npcContext} from '../public/npc-strategy.js';
import {npcGameView} from '../public/npc-view.js';

const out=process.argv[2]||'tests/token-pressure-audit';
const groups=[];
for(let a=0;a<3;a++)for(let b=a+1;b<4;b++)for(let c=b+1;c<5;c++)for(let d=c+1;d<6;d++)groups.push([a,b,c,d]);
const records=[],started=Date.now();
const sourceFiles=['engine','specialties','match','npc','npc-strategy','turn','module-rules'];
const hashes=()=>Object.fromEntries(sourceFiles.map(f=>[f,createHash('sha256').update(readFileSync('public/'+f+'.js')).digest('hex')]));
const sourceHashes=hashes();
for(const policy of ['normal','expert'])for(const [groupIndex,group] of groups.entries())for(let rotation=0;rotation<4;rotation++){
 const m=M.newMatch({seed:70001+groupIndex,mode:'advanced',npcCount:3,npcDifficulty:policy});
 const data={};
 for(const p of m.players){const skater=SKATERS[group[(p.seat+rotation)%4]];Object.assign(p,{kind:'npc',caution:1,skaterId:skater.id,color:skater.color});Object.assign(p.game,{skaterId:skater.id,name:skater.name});data[p.id]={skater:skater.id,attemptStarts:0,anyFull:0,allFull:0,totalStock:0,gained:{},spent:0,clipped:{draft:0,cards:0,sequence:0}};}
 const seen=new Set();let commands=0;
 while(m.phase!=='complete'){
  assert(++commands<3000);
  if(m.phase==='recap'){assert(M.advance(m));continue;}
  if(m.phase==='draft-summary'){assert(M.startModule(m));continue;}
  const p=M.pendingNpc(m);assert(p);const g=p.game,r=data[p.id],key=[m.module,g.attempt,p.id].join(':');
  if(m.phase==='playing'&&!seen.has(key)){
   seen.add(key);r.attemptStarts++;r.totalStock+=Object.values(g.bank).reduce((a,b)=>a+b,0);
   r.anyFull+=E.BONUS_TYPES.some(t=>g.bank[t]===E.bonusLimit(g,t));r.allFull+=E.BONUS_TYPES.every(t=>g.bank[t]===E.bonusLimit(g,t));
  }
  const action=decide(npcGameView(g),npcContext(m,p)),before={...g.bank},phase=g.phase;assert(action);
  assert(M.dispatch(m,{...action,playerId:p.id}));
  const gain=E.BONUS_TYPES.reduce((n,t)=>n+Math.max(0,g.bank[t]-before[t]),0),spent=E.BONUS_TYPES.reduce((n,t)=>n+Math.max(0,before[t]-g.bank[t]),0);
  const source=action.type==='draft-pair'?'draft':action.type==='claim-sequence'?'sequence':action.type==='specialty'?p.skaterId==='neo'?'exchange':p.skaterId:action.type==='proceed'?'cards':action.type;
  if(gain)r.gained[source]=(r.gained[source]||0)+gain;
  if(source!=='exchange')r.spent+=spent;
  if(action.type==='draft-pair'&&!gain)r.clipped.draft++;
  if(action.type==='proceed'&&g.trickRewards&&phase==='result'&&g.phase!=='select')r.clipped.cards+=g.trickRewards.filter(x=>!x.added).length;
  if(phase!=='result'&&g.phase==='result')r.clipped.sequence+=Math.max(0,(g.last?.rewardTokens||0)-(g.sequenceReward?.remaining||0));
 }
 for(const p of m.players){assert.equal(data[p.id].attemptStarts,12);records.push({policy,groupIndex,rotation,...data[p.id]});}
 if((records.length/4)%30===0)console.log('Audited '+records.length/4+' games');
}
assert.deepEqual(hashes(),sourceHashes);
const summaries=[];
for(const policy of ['normal','expert'])for(const skater of SKATERS){
 const rows=records.filter(r=>r.policy===policy&&r.skater===skater.id),sum=f=>rows.reduce((n,r)=>n+f(r),0),attempts=sum(r=>r.attemptStarts);
 summaries.push({policy,skater:skater.id,games:rows.length,attempts,anyFullAtStart:sum(r=>r.anyFull)/attempts,allFullAtStart:sum(r=>r.allFull)/attempts,averageStockAtStart:sum(r=>r.totalStock)/attempts,gainedPerGame:Object.fromEntries([...new Set(rows.flatMap(r=>Object.keys(r.gained)))].map(s=>[s,sum(r=>r.gained[s]||0)/rows.length])),spentPerGame:sum(r=>r.spent)/rows.length,clippedPerGame:Object.fromEntries(['draft','cards','sequence'].map(s=>[s,sum(r=>r.clipped[s])/rows.length]))});
}
mkdirSync(out,{recursive:true});writeFileSync(out+'/summary.json',JSON.stringify({games:records.length/4,elapsedSeconds:(Date.now()-started)/1000,sourceHashes,method:'One seed per four-skater composition, four cyclic seat rotations; 60 games per difficulty, 120 games total. Each skater appears in 40 games per difficulty. Stock measured once at the start of each attempt. NPC decisions use the current production policy. Exploratory descriptive sample; not a human-play estimate or a paired balance comparison.',summaries,records},null,2));
console.log(JSON.stringify(summaries));
