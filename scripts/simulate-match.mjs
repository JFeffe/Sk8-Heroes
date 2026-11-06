import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as M from '../public/match.js';
import {BONUS_LIMIT,BONUS_TYPES,RULESET_VERSION} from '../public/engine.js';
import {MODULES,makeDeck} from '../public/data.js';
const size=makeDeck().length;
const report={rulesVersion:RULESET_VERSION,moduleEffectsVersion:1,draftCardsPerPlayer:1,sessions:100,completed:0,modules:0,attempts:0,commands:0,tiedModules:0,unawardedModules:0,maxTokenStock:0,effects:MODULES.map(m=>({id:m.id,name:m.name,kind:m.bonus.kind,attempts:0,awarded:0,extraPoints:0,extraTokens:0,byAttempt:[0,0]})),note:'Functional simulation: all seats use the public NPC controller; seeded dice, shared deck, save/restore after every transition. Not a balance or optimal-strategy claim.'};
const byType=()=>Object.fromEntries(BONUS_TYPES.map(type=>[type,0]));
const rewardTally=()=>({kept:byType(),discarded:{...byType(),unassigned:0}});
report.bonusLimit=BONUS_LIMIT;
report.bonusRewards={cards:rewardTally(),draft:rewardTally(),threeTricks:rewardTally(),moduleBonus:rewardTally()};
for(let seed=1;seed<=report.sessions;seed++){
 let m=M.newMatch({seed,npcCount:3,length:6}),steps=0;
 for(const p of m.players)p.kind='npc';
 while(m.phase!=='complete'){
  assert(++steps<2000,'deadlock');
  if(m.phase==='recap')assert(M.advance(m));
  else if(m.phase==='draft-summary')assert(M.startModule(m));
  else {
   const p=M.pendingNpc(m),history=p.game.history.length,log=m.draftLog.length;
   assert(M.npcStep(m));
   if(p.game.history.length>history)for(const reward of p.game.trickRewards)report.bonusRewards.cards[reward.added?'kept':'discarded'][reward.type]++;
   if(m.draftLog.length>log&&m.draftLog.at(-1).action==='draft-pair'){
    const pick=m.draftLog.at(-1);report.bonusRewards.draft[pick.bonusDiscarded?'discarded':'kept'][pick.bonus]++;
   }
  }
  const cards=[...m.deck,...m.market.cards,...m.discard,...m.players.flatMap(p=>p.game.hand)];assert.equal(cards.length,size);assert.equal(new Set(cards.map(c=>c.uid)).size,size);
  for(const p of m.players){assert(Object.values(p.game.bank).every(n=>n>=0&&n<=BONUS_LIMIT));report.maxTokenStock=Math.max(report.maxTokenStock,Object.values(p.game.bank).reduce((a,b)=>a+b,0));}
  m=M.restore(JSON.parse(JSON.stringify(m)));
 }
 for(const p of m.players){
  assert.equal(p.game.pv,p.game.history.reduce((n,h)=>n+h.pv,0));
  const ledger=m.statistics.players[p.id];
  for(const type of BONUS_TYPES)assert.equal(p.game.bank[type],ledger.starting[type]+ledger.gained[type]-ledger.spent[type]);
 }
 for(const recap of m.recaps){
  const effect=report.effects[recap.module];
  for(const row of recap.rows)row.attempts.forEach((a,i)=>{
   const earned=a.moduleEffect.points>0||a.moduleEffect.tokens>0;
   effect.attempts++;effect.awarded+=Number(earned);effect.extraPoints+=a.moduleEffect.points;effect.extraTokens+=a.moduleEffect.tokens;effect.byAttempt[i]+=Number(earned);
   assert(Number.isInteger(a.moduleBonus)&&a.moduleBonus>=0);assert([0,1,2].includes(a.sequenceBonus));assert(a.tokenRewards.length<=a.rewardTokens);
   for(let slot=0;slot<a.rewardTokens;slot++){
    const tally=report.bonusRewards[a.reason==='three'&&slot===0?'threeTricks':'moduleBonus'],type=a.tokenRewards[slot];
    if(type)tally.kept[type]++;else tally.discarded.unassigned++;
   }
  });
 }
 report.completed++;report.commands+=steps;report.modules+=m.recaps.length;report.attempts+=m.recaps.length*m.players.length*2;report.tiedModules+=m.recaps.filter(r=>r.winners.length>1).length;report.unawardedModules+=m.recaps.filter(r=>!r.winners.length).length;
}
writeFileSync(process.argv[2]||'tests/match-simulation-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
