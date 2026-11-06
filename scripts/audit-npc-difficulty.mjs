import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as M from '../public/match.js';
import * as E from '../public/engine.js';
import {MODULES} from '../public/data.js';
import {decide} from '../public/npc.js';
import {npcContext} from '../public/npc-strategy.js';
import {npcGameView} from '../public/npc-view.js';
import {decide as reference} from '../tests/fixtures/npc-v14-baseline.mjs';

const games=Math.max(1,Number(process.argv[2])||100),round=n=>+n.toFixed(4);
const empty=()=>({seats:0,wins:0,pv:0,attempts:0,points:0,falls:0,threeTricks:0,scores18Plus:0,gained:0,spent:0,remaining:0,switchesAfterRoll:0,diceFaces:[0,0,0,0,0,0]});
const fingerprint=(m,g)=>JSON.stringify({revision:m.revision,rngState:m.rngState,dice:g.dice,bank:g.bank,hand:g.hand,phase:g.phase,market:m.market});
const report={gamesPerScenario:games,scenarios:{},note:'Four seats, three NPCs versus a fixed heuristic reference. The reference is not a human skill estimate. Controller seats, skaters and turn order vary. Same engine, physical deck and legal actions for all. No forced outcomes or altered dice. Different choices lead to diverging random streams.'};
for(const difficulty of ['easy','normal','expert']){
 const group={completed:0,npc:empty(),reference:empty()};
 for(let seed=1;seed<=games;seed++){
  let m=M.newMatch({seed:seed+2100,npcCount:3,npcDifficulty:difficulty}),steps=0;
  const referenceSeat=(seed-1)%4;
  while(m.phase!=='complete'){
   assert(++steps<2400,`Deadlock ${difficulty} ${seed}`);
   if(m.phase==='recap')assert(M.advance(m));else if(m.phase==='draft-summary')assert(M.startModule(m));else{
    const p=M.currentPlayer(m),g=p.game,stats=p.seat===referenceSeat?group.reference:group.npc;
    const view=npcGameView(g),before=fingerprint(m,g),action=p.seat===referenceSeat?reference(view,{leader:Math.max(0,...m.players.flatMap(x=>x.game.attempts.map(a=>a.points))),caution:1}):decide(view,npcContext(m,p));
    assert.equal(fingerprint(m,g),before,'Controller changed the live state');
    const stock={...g.bank},rolling=action?.type==='roll'||action?.type==='bonus'&&action.bonusType==='reroll'?E.rerollableDice(g).map(d=>d.id):[];
    assert(action&&M.dispatch(m,{playerId:p.id,...action}),`Illegal ${difficulty} action ${JSON.stringify(action)} seed ${seed} phase ${g.phase}`);
    if(action.type==='reset-placement')stats.switchesAfterRoll++;
    if(action.type==='bonus')for(const type of E.BONUS_TYPES)assert.equal(g.bank[type],stock[type]-(type===action.bonusType?1:0),'Incorrect token debit');
    for(const id of rolling)stats.diceFaces[g.dice[id].face-1]++;
    if(action.type==='land'){
     const used=g.landed.flatMap(e=>e.dice);assert.equal(used.length,new Set(used).size);assert(used.length<=6);
     for(const entry of g.landed){const c=g.hand.find(c=>c.uid===entry.card);assert.equal(entry.dice.length,c.cost);assert(E.findMatch(c,entry.dice.map(id=>g.dice[id]),E.wildColor(g)));}
    }
   }
   const cards=[...m.deck,...m.market.cards,...m.discard,...m.players.flatMap(p=>p.game.hand)];assert.equal(cards.length,72);assert.equal(new Set(cards.map(c=>c.uid)).size,72);
  }
  const top=Math.max(...m.players.map(p=>p.game.pv)),summary=M.matchSummary(m);
  for(const p of m.players){
   const stats=p.seat===referenceSeat?group.reference:group.npc,row=summary.players.find(x=>x.id===p.id),attempts=p.game.history.flatMap(h=>h.attempts);
   stats.seats++;stats.wins+=Number(p.game.pv===top);stats.pv+=p.game.pv;stats.attempts+=attempts.length;stats.points+=attempts.reduce((sum,a)=>sum+a.points,0);stats.falls+=row.falls;stats.threeTricks+=row.threeTrickSequences;stats.scores18Plus+=attempts.filter(a=>a.points>=18).length;
   stats.gained+=row.tokens.totalGained;stats.spent+=row.tokens.totalSpent;stats.remaining+=Object.values(row.tokens.remaining).reduce((a,b)=>a+b,0);
   for(const type of E.BONUS_TYPES)assert.equal(row.tokens.starting[type]+row.tokens.gained[type]-row.tokens.spent[type],row.tokens.remaining[type]);
   for(const h of p.game.history)for(const a of h.attempts){
    const cards=a.cards.map(name=>p.game.hand.find(c=>c.name===name));
    if(a.reason==='fall'||a.reason==='pass')assert.equal(a.points,0);else assert.equal(a.points,E.sequenceScore(cards,MODULES[h.module]).points);
   }
  }
  group.completed++;
 }
 for(const stats of [group.npc,group.reference]){
  stats.averagePV=round(stats.pv/stats.seats);stats.meanAttemptScore=round(stats.points/stats.attempts);stats.fallRate=round(stats.falls/stats.attempts);stats.threeRate=round(stats.threeTricks/stats.attempts);stats.score18Rate=round(stats.scores18Plus/stats.attempts);stats.winRate=round(stats.wins/stats.seats);stats.meanTokensGained=round(stats.gained/stats.seats);stats.meanTokensSpent=round(stats.spent/stats.seats);stats.meanTokensRemaining=round(stats.remaining/stats.seats);
  const draws=stats.diceFaces.reduce((a,b)=>a+b,0),expected=draws/6;stats.faceFractions=stats.diceFaces.map(n=>round(n/draws));stats.faceChiSquared=round(stats.diceFaces.reduce((sum,n)=>sum+(n-expected)**2/expected,0));
 }
 report.scenarios[difficulty]=group;
}
writeFileSync('tests/npc-difficulty-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(report.scenarios).map(([key,g])=>[key,{completed:g.completed,npc:{score:g.npc.meanAttemptScore,falls:g.npc.fallRate,highScores:g.npc.score18Rate,spent:g.npc.meanTokensSpent,left:g.npc.meanTokensRemaining,switches:g.npc.switchesAfterRoll,win:g.npc.winRate},reference:{score:g.reference.meanAttemptScore,win:g.reference.winRate},chi:g.npc.faceChiSquared}])),null,2));
