import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import * as M from '../public/match.js';
import {decide as current} from '../public/npc.js';
import {npcContext} from '../public/npc-strategy.js';
import {decide as previous} from '../tests/fixtures/npc-v14-baseline.mjs';

const seeds=Math.max(1,Number(process.argv[2])||50),started=performance.now();
const empty=()=>({wins:0,pv:0,attempts:0,falls:0,threeTricks:0,moduleBonusAttempts:0,cardTokens:0,secondAttempts:0,secondBeatsLeader:0,commands:0,decisionMs:0,maxDecisionMs:0});
const report={sessions:seeds*2,completed:0,modules:0,ties:0,current:empty(),previous:empty(),note:'Head-to-head heuristic comparison, two six-module games per seed with controller seats exchanged. Same engine, fair seeded dice and shared physical deck. Streams diverge after different choices; this is not proof of optimal play or human balance.'};
for(let seed=1;seed<=seeds;seed++)for(const newSeat of [0,1]){
 const m=M.newMatch({seed,npcCount:1,length:6,npcDifficulty:'expert'}),secondStarts=new Map();let steps=0;
 const label=p=>p.seat===newSeat?'current':'previous';
 while(m.phase!=='complete'){
  assert(++steps<2000,`Deadlock: seed ${seed}, new seat ${newSeat}`);
  if(m.phase==='recap'){
   const recap=m.recaps.at(-1);report.modules++;
   for(const p of m.players){const stats=report[label(p)],row=recap.rows.find(r=>r.id===p.id);
    stats.pv+=row.gain;stats.attempts+=2;stats.falls+=row.attempts.filter(a=>a.reason==='fall').length;
    stats.threeTricks+=row.attempts.filter(a=>a.reason==='three').length;
    stats.moduleBonusAttempts+=row.attempts.filter(a=>a.moduleBonus>0).length;stats.cardTokens+=(p.game.trickRewards||[]).length;
    stats.secondAttempts++;stats.secondBeatsLeader+=Number(row.attempts[1].points>(secondStarts.get(`${m.module}:${p.id}`)||0));
   }
   assert(M.advance(m));
  }else if(m.phase==='draft-summary')assert(M.startModule(m));
  else{
   const p=M.currentPlayer(m),key=`${m.module}:${p.id}`,stats=report[label(p)];
   if(m.phase==='playing'&&p.game.attempt===1&&!secondStarts.has(key))secondStarts.set(key,Math.max(0,...m.players.filter(x=>x!==p).flatMap(x=>x.game.attempts.map(a=>a.points))));
   const t=performance.now(),context=p.seat===newSeat?npcContext(m,p):{leader:Math.max(0,...m.players.flatMap(x=>x.game.attempts.map(a=>a.points))),caution:p.caution};
   const action=(p.seat===newSeat?current:previous)(p.game,context),duration=performance.now()-t;
   stats.commands++;stats.decisionMs+=duration;stats.maxDecisionMs=Math.max(stats.maxDecisionMs,duration);
   assert(action&&M.dispatch(m,{playerId:p.id,...action}),`Invalid ${label(p)} action ${JSON.stringify(action)}, ${p.game.phase}, seed ${seed}`);
  }
  const cards=[...m.deck,...m.market.cards,...m.discard,...m.players.flatMap(p=>p.game.hand)];assert.equal(cards.length,72);assert.equal(new Set(cards.map(c=>c.uid)).size,72);
  for(const p of m.players)assert(Object.values(p.game.bank).every(n=>Number.isInteger(n)&&n>=0));
 }
 const [a,b]=m.players;if(a.game.pv===b.game.pv)report.ties++;else report[label(a.game.pv>b.game.pv?a:b)].wins++;
 report.completed++;
}
for(const label of ['current','previous']){
 const s=report[label];s.averagePV=+(s.pv/report.completed).toFixed(2);s.fallRate=+(s.falls/s.attempts).toFixed(4);s.averageDecisionMs=+(s.decisionMs/s.commands).toFixed(3);s.maxDecisionMs=+s.maxDecisionMs.toFixed(2);delete s.decisionMs;
}
report.elapsedSeconds=+((performance.now()-started)/1000).toFixed(2);
writeFileSync('tests/npc-strategy-comparison.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
