import {BONUS_LIMIT,BONUS_TYPES} from './engine.js';

const stock=bank=>Object.fromEntries(BONUS_TYPES.map(type=>[type,bank?.[type]||0]));
const ledger=(bank,complete)=>({complete,starting:stock(bank),gained:stock(),spent:stock()});
const ended=m=>m.phase==='complete'||m.phase==='recap'&&m.module===m.route.length-1;
export function initializeStatistics(m,{legacy=false}={}){
 if(m.statistics?.version===1)return m.statistics;
 return m.statistics={version:1,clock:{elapsedMs:0,startedAt:null,finishedAt:null,complete:!legacy},players:Object.fromEntries(m.players.map(p=>[p.id,ledger(p.game.bank,!legacy)]))};
}
export function recordTokenChanges(m,player,before){
 const statistics=initializeStatistics(m,{legacy:true}),entry=statistics.players[player.id]??=ledger(before,false);
 for(const type of BONUS_TYPES){const delta=(player.game.bank[type]||0)-(before[type]||0);if(delta>0)entry.gained[type]+=delta;else if(delta<0)entry.spent[type]-=delta;}
}
export function limitSavedStock(m,player){
 const {bank}=player.game;
 for(const type of BONUS_TYPES){
  const excess=(bank[type]||0)-BONUS_LIMIT;
  if(excess<=0)continue;
  const entry=m.statistics.players[player.id]??=ledger(bank,false);
  const discarded=entry.discarded??=stock();
  discarded[type]+=excess;bank[type]=BONUS_LIMIT;
 }
}
// Runtime anchors never enter a save or network view. Restoring a match starts
// a new measured interval and therefore never counts time while it was closed.
export const clockState=m=>m.clockRuntime?{...m.clockRuntime}:null;
export function restoreClockState(m,state){if(state)Object.defineProperty(m,'clockRuntime',{value:{...state},writable:true,configurable:true});}
function checkpointAt(m,now){
 const runtime=m.clockRuntime,clock=initializeStatistics(m,{legacy:true}).clock;
 if(runtime?.running&&clock.finishedAt===null)clock.elapsedMs+=Math.max(0,now-runtime.last);
 if(runtime)runtime.last=Math.max(runtime.last,now);
}
export function checkpointClock(m){if(m.clockRuntime)checkpointAt(m,m.clockRuntime.now());}
export function setClockRunning(m,running,now=Date.now){
 const clock=initializeStatistics(m,{legacy:true}).clock;
 if(!m.clockRuntime)restoreClockState(m,{now,last:now(),running:false});
 const runtime=m.clockRuntime,time=runtime.now();checkpointAt(m,time);
 runtime.running=!!running&&!ended(m)&&clock.finishedAt===null;
 if(runtime.running&&clock.startedAt===null){clock.startedAt=time;if(m.revision>0)clock.complete=false;}
}
export function finishClock(m){
 const runtime=m.clockRuntime;if(!runtime)return;
 const now=runtime.now(),clock=initializeStatistics(m,{legacy:true}).clock;checkpointAt(m,now);
 if(clock.startedAt!==null&&clock.finishedAt===null)clock.finishedAt=now;
 runtime.running=false;
}
export function matchSummary(m){
 const statistics=m.statistics,clock=statistics?.clock;
 return {durationMs:clock?.startedAt!==null&&clock?.startedAt!==undefined?clock.elapsedMs:null,durationComplete:!!clock?.complete,
  players:m.players.map(p=>{
   const g=p.game,attempts=[...(g.history||[]).flatMap(h=>h.attempts),...((g.history||[]).length<=g.module?g.attempts:[])];
   const entry=statistics?.players[p.id];
   const gained=stock(entry?.gained),spent=stock(entry?.spent);
   return {id:p.id,name:g.name,attempts:attempts.length,falls:attempts.filter(a=>a.reason==='fall').length,threeTrickSequences:attempts.filter(a=>a.reason==='three').length,
    tokens:{complete:!!entry?.complete,starting:entry?stock(entry.starting):null,gained,spent,remaining:stock(g.bank),totalGained:Object.values(gained).reduce((a,b)=>a+b,0),totalSpent:Object.values(spent).reduce((a,b)=>a+b,0)}};
  })};
}
export function formatDuration(milliseconds){
 if(milliseconds===null||milliseconds===undefined)return 'Non mesurée';
 const seconds=Math.max(0,Math.floor(milliseconds/1000)),minutes=Math.floor(seconds/60),hours=Math.floor(minutes/60);
 return hours?`${hours} h ${String(minutes%60).padStart(2,'0')} min ${String(seconds%60).padStart(2,'0')} s`:minutes?`${minutes} min ${String(seconds%60).padStart(2,'0')} s`:`${seconds} s`;
}
