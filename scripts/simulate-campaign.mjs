import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as E from '../public/engine.js';
import {MODULES,TRICKS} from '../public/data.js';
import {ODDS} from '../public/odds.js';
import {closestMatch} from '../public/npc.js';
let seed=20261025;
const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const report={seed,sessions:1000,completed:0,attempts:0,falls:0,successfulModules:0,modules:0,averagePV:0,playedTricks:[],note:'Policy: random drafts, expected immediate points for card choice, stop after two legal tricks; at most one adjustment and one whole-pool reroll per attempt. This is a functional solo simulation, not an optimal strategy or a proof of game balance.'};
const played=new Set();
for(let run=0;run<report.sessions;run++){
 let s=E.newGame({length:run%2?6:4},rng),steps=0;
 while(s.phase!=='complete'){
  assert(++steps<500,'campaign deadlock');let changed;
  if(['initial','draft'].includes(s.phase))changed=E.choose(s,s.offer[Math.floor(rng()*s.offer.length)],rng);
  else if(s.phase==='select'){
   const n=E.freeDice(s).length;
   const choices=E.options(s).sort((a,b)=>ODDS.cards[b.id].noBonus[n]*b.points-ODDS.cards[a.id].noBonus[n]*a.points);
   if(choices.length){played.add(choices[0].id);changed=E.chooseCard(s,choices[0].uid);}else changed=E.fall(s);
  }else if(s.phase==='ready')changed=E.roll(s,rng);
  else if(s.phase==='rolled'){
   if(E.autoPlace(s))changed=E.land(s);
   else{
    const dice=E.freeDice(s),plan=closestMatch(E.activeCard(s),dice);
    changed=!s.used.adjust&&s.bank.adjust>0&&plan.step?E.bonus(s,'adjust',plan.step.id,plan.step.delta,rng):!s.used.reroll&&s.bank.reroll>0?E.bonus(s,'reroll',undefined,0,rng):E.fall(s);
   }
  }else if(s.phase==='decision')changed=E.canStop(s)&&s.landed.length>=2?E.stop(s):E.continueRun(s);
  else if(s.phase==='result'){if(s.sequenceReward?.pending)changed=E.claimSequenceReward(s,[...E.BONUS_TYPES].sort((a,b)=>s.bank[a]-s.bank[b])[0]);else{report.attempts++;if(s.reason==='fall')report.falls++;changed=E.proceed(s);}}
  else if(s.phase==='reward')changed=E.claim(s,s.bank.adjust<s.bank.reroll?'adjust':'reroll',rng);
  assert(changed,`stalled in ${s.phase}`);
  assert.equal(s.hand.length+s.deck.length,72);assert.equal(new Set([...s.hand,...s.deck].map(c=>c.uid)).size,72);
  assert.equal(s.dice.length,6);assert(s.bank.adjust>=0&&s.bank.reroll>=0);assert(s.landed.length<=3);
  assert.equal(new Set(s.landed.flatMap(e=>e.dice)).size,s.landed.reduce((n,e)=>n+e.dice.length,0));
  // Exercise persistence at every transition, including result/reward/draft.
  s=JSON.parse(JSON.stringify(s));
 }
 assert.equal(s.history.length,s.route.length);assert(s.history.every(h=>h.attempts.length===2));
 assert.equal(s.pv,s.history.reduce((n,h)=>n+h.pv,0));
 for(const h of s.history){assert.equal(h.best,Math.max(...h.attempts.map(a=>a.points)));assert.equal(h.pv,h.best>0?MODULES[h.module].pv:0);}
 report.completed++;report.modules+=s.history.length;report.successfulModules+=s.history.filter(h=>h.pv).length;report.averagePV+=s.pv;
}
report.averagePV/=report.sessions;report.playedTricks=[...played].sort((a,b)=>a-b).map(id=>TRICKS[id].name);
writeFileSync('tests/campaign-simulation-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
