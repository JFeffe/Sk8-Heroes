import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../public/match.js';
import * as E from '../public/engine.js';
import {TRICKS} from './fixtures/turn-scenarios.js';
import {decide} from '../public/npc.js';
import {npcContext} from '../public/npc-strategy.js';
import {matchSummary,formatDuration,finishClock} from '../public/match-statistics.js';
import {statisticsPanel} from '../public/match-ui.js';

const command=(m,type,extra={})=>M.dispatch(m,{playerId:M.currentPlayer(m).id,type,...extra});
function fixture(){
 const m=M.newMatch({seed:19,npcCount:1});
 while(m.phase==='initial')assert(command(m,'draft',{cardId:M.currentPlayer(m).game.offer[0]}));
 m.route=[3,0,4,5,7,8];for(const p of m.players)p.game.route=[...m.route];m.order=[0,1];assert(M.startModule(m));
 m.players[0].game.hand=[16,1,18,6].map((id,i)=>({...TRICKS[id],uid:`stats-${i}`}));return m;
}
function roll(m,faces){
 const g=M.currentPlayer(m).game,rolling=E.rerollableDice(g);let i=0;
 Object.defineProperty(m,'randomSource',{value:()=>((faces[rolling[i++].id]||1)-.5)/6,configurable:true});
 return command(m,g.phase==='ready'?'roll':'bonus',{bonusType:'reroll'});
}
test('starting tokens are stock, not earned rewards',()=>{
 const m=M.newMatch({seed:20}),summary=matchSummary(m);
 for(const row of summary.players){assert.equal(row.tokens.totalGained,0);assert.equal(row.tokens.totalSpent,0);assert.deepEqual(row.tokens.starting,{adjust:1,reroll:1,freeze:1});assert.deepEqual(row.tokens.remaining,row.tokens.starting);assert.equal(row.falls,0);assert.equal(row.threeTrickSequences,0);}
 assert.equal(summary.durationMs,null);
});
test('counts each bonus spend, three-trick claim, module reward and shared draft exactly once, including a fall',()=>{
 let m=fixture();const p=m.players[0],g=p.game;
 assert(command(m,'choose',{cardId:g.hand[0].uid}));assert(roll(m,[2,5,3,4,2,6]));
 assert(command(m,'bonus',{bonusType:'adjust',id:4,delta:1}));assert(command(m,'bonus',{bonusType:'freeze',id:2}));
 assert(roll(m,[2,5,3,4,3,6]));assert(command(m,'auto'));assert(command(m,'land'));
 for(const index of [1,2]){assert(command(m,'continue'));assert(command(m,'choose',{cardId:g.hand[index].uid}));assert(roll(m,[4,4,4,4,4,4]));assert(command(m,'auto'));assert(command(m,'land'));}
 assert.equal(g.reason,'three');assert.equal(matchSummary(m).players[0].threeTrickSequences,1);
 assert.equal(matchSummary(m).players[0].tokens.totalGained,0,'the pending choice and deferred module reward are not yet credited');
 assert(command(m,'claim-sequence',{choice:'freeze'}));const claimed=JSON.stringify(m.statistics);
 assert(!command(m,'claim-sequence',{choice:'freeze'}));assert.equal(JSON.stringify(m.statistics),claimed);
 assert(command(m,'proceed'));assert(command(m,'pass'));assert(command(m,'proceed'));
 assert.equal(M.currentPlayer(m).id,'p0');assert(command(m,'choose',{cardId:g.hand[3].uid}));assert(roll(m,[3,3,3,3,3,3]));
 assert(command(m,'bonus',{bonusType:'freeze',id:2}));assert(command(m,'fall'));assert(command(m,'proceed'));
 assert(command(m,'pass'));assert(command(m,'proceed'));assert.equal(m.phase,'recap');
 let row=matchSummary(m).players[0];assert.equal(row.attempts,2);assert.equal(row.falls,1);assert.equal(row.threeTrickSequences,1);
 assert.deepEqual(row.tokens.gained,{adjust:0,reroll:1,freeze:1});assert.deepEqual(row.tokens.spent,{adjust:1,reroll:1,freeze:2});assert.deepEqual(row.tokens.remaining,{adjust:0,reroll:1,freeze:0});
 m=M.restore(JSON.parse(JSON.stringify(m)));assert.deepEqual(matchSummary(m).players[0],row);
 Object.defineProperty(m,'randomSource',{value:()=>.1,configurable:true});assert(M.advance(m));
 while(m.phase==='recovery')assert(command(m,'draft-pair',{cardId:m.market.cards[0].uid,tokenId:m.market.tokens[0].id}));
 row=matchSummary(m).players[0];assert.deepEqual(row.tokens.gained,{adjust:1,reroll:1,freeze:1});assert.equal(row.tokens.totalGained,3);
 for(const type of E.BONUS_TYPES)assert.equal(row.tokens.starting[type]+row.tokens.gained[type]-row.tokens.spent[type],row.tokens.remaining[type]);
});
test('an automatic fall on landing is counted, while a passed attempt is not a fall',()=>{
 const m=fixture(),g=m.players[0].game;m.route[0]=6;for(const p of m.players)p.game.route=[...m.route];
 g.hand=[21,13].map((id,i)=>({...TRICKS[id],uid:`forced-${i}`}));
 assert(command(m,'choose',{cardId:g.hand[0].uid}));assert(roll(m,[1,2,3,4,5,6]));assert(command(m,'auto'));assert(command(m,'land'));
 assert.equal(g.reason,'fall');assert.equal(matchSummary(m).players[0].falls,1);assert(command(m,'proceed'));assert(command(m,'pass'));
 assert.equal(matchSummary(m).players[1].falls,0);
});
test('rejected and stale commands change neither token counters nor measured duration',()=>{
 const m=fixture();let now=100;M.setClockRunning(m,true,()=>now);const before=JSON.stringify(m);now=500;
 assert(!command(m,'bonus',{bonusType:'reroll'}));assert(!command(m,'claim-sequence',{choice:'adjust'}));
 assert(!command(m,'pass',{revision:-1}));assert(!M.dispatch(m,{playerId:'p1',type:'pass'}));assert.equal(JSON.stringify(m),before);
});
test('duration excludes explicit pauses and time between restored sessions, then stays frozen after completion',()=>{
 let m=M.newMatch({seed:21}),now=1000;M.setClockRunning(m,true,()=>now);
 now=8000;M.checkpointClock(m);assert.equal(matchSummary(m).durationMs,7000);
 now=11000;M.setClockRunning(m,false);now=61000;M.setClockRunning(m,true);now=66000;M.checkpointClock(m);
 assert.equal(matchSummary(m).durationMs,15000);const saved=JSON.parse(JSON.stringify(m));assert(!JSON.stringify(saved).includes('clockRuntime'));
 now+=86400000;m=M.restore(saved);M.setClockRunning(m,true,()=>now);assert.equal(matchSummary(m).durationMs,15000);
 now+=12000;finishClock(m);const end=JSON.stringify(m.statistics.clock);assert.equal(matchSummary(m).durationMs,27000);
 now+=100000;M.setClockRunning(m,true);M.checkpointClock(m);finishClock(m);assert.equal(JSON.stringify(m.statistics.clock),end);
});
test('a backwards wall clock cannot subtract or count the same interval twice',()=>{
 const m=M.newMatch({seed:22});let now=1000;M.setClockRunning(m,true,()=>now);
 now=2000;M.checkpointClock(m);now=1500;M.checkpointClock(m);now=2500;M.checkpointClock(m);
 assert.equal(matchSummary(m).durationMs,1500);
});
test('legacy saves report missing duration and partial token history instead of inventing totals',()=>{
 let m=fixture();delete m.statistics;m=M.restore(JSON.parse(JSON.stringify(m)));
 assert.equal(matchSummary(m).durationMs,null);assert(!matchSummary(m).durationComplete);assert(!matchSummary(m).players[0].tokens.complete);
 const html=statisticsPanel(m);assert.match(html,/Non mesurée/);assert.match(html,/Ancienne sauvegarde/);assert.match(html,/≥ 0/);
 m.viewerId='p0';assert.match(statisticsPanel(m),/hors pauses NPC et arrêt du serveur/);
});
test('summary aggregation agrees with an independent event audit across a six-module game and repeated restores',()=>{
 let m=M.newMatch({seed:823,npcCount:3}),now=1000,steps=0,expectedTime=0;
 const audit=Object.fromEntries(m.players.map(p=>[p.id,{falls:0,three:0,gained:{adjust:0,reroll:0,freeze:0},spent:{adjust:0,reroll:0,freeze:0}}]));
 M.setClockRunning(m,true,()=>now);
 while(m.phase!=='complete'){
  assert(++steps<2000);const finished=m.phase==='recap'&&m.module===5;
  now+=1234;if(!finished)expectedTime+=1234;
  const before=m.players.map(p=>({...p.game.bank}));
  if(m.phase==='recap')assert(M.advance(m));else if(m.phase==='draft-summary')assert(M.startModule(m));else{
   const p=M.currentPlayer(m),phase=p.game.phase;assert(M.dispatch(m,{playerId:p.id,...decide(p.game,npcContext(m,p))}));
   if(phase!=='result'&&p.game.phase==='result'){audit[p.id].falls+=Number(p.game.reason==='fall');audit[p.id].three+=Number(p.game.reason==='three');}
  }
  m.players.forEach((p,i)=>{for(const type of E.BONUS_TYPES){const delta=p.game.bank[type]-before[i][type];if(delta>0)audit[p.id].gained[type]+=delta;else audit[p.id].spent[type]-=delta;}});
  if(steps%17===0){m=M.restore(JSON.parse(JSON.stringify(m)));M.setClockRunning(m,true,()=>now);}
 }
 const summary=matchSummary(m);assert.equal(summary.durationMs,expectedTime);assert(summary.durationComplete);
 for(const row of summary.players){const expected=audit[row.id];assert.equal(row.attempts,12);assert.equal(row.falls,expected.falls);assert.equal(row.threeTrickSequences,expected.three);assert.deepEqual(row.tokens.gained,expected.gained);assert.deepEqual(row.tokens.spent,expected.spent);for(const type of E.BONUS_TYPES)assert.equal(1+expected.gained[type]-expected.spent[type],row.tokens.remaining[type]);}
 const before=JSON.stringify(m),html=statisticsPanel(m);assert.equal(JSON.stringify(m),before);assert.match(html,/Durée de jeu/);assert.match(html,/Jetons dépensés/);assert.equal((html.match(/data-statistics-player=/g)||[]).length,4);
});
test('duration formatting keeps seconds and hours, without rounding time upward',()=>{
 assert.equal(formatDuration(0),'0 s');assert.equal(formatDuration(59999),'59 s');assert.equal(formatDuration(62000),'1 min 02 s');assert.equal(formatDuration(3661000),'1 h 01 min 01 s');assert.equal(formatDuration(null),'Non mesurée');
});
