import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import * as E from '../../.local-games/theory85-modules-v2-runtime/engine.js';
import {TRICKS,MODULES} from '../../.local-games/theory85-modules-v2-runtime/data.js';
import {closestMatch,freezeChoice} from '../../.local-games/theory85-modules-v2-runtime/npc-dice.js';
import {rollProbability} from '../../.local-games/theory85-modules-v2-runtime/roll-probability.js';
import {productionHashes} from './theory85-runtime.mjs';
const before=await productionHashes(),count=Number(process.argv[2]||500),start=Date.now();
const cases=[
 {id:0,cards:['Ollie','50-50 Grind'],noTokens:true},
 {id:1,cards:['Noseslide','Nollie']},
 {id:2,cards:['180°','Backside Flip']},
 {id:3,cards:['Ollie','Kickflip']},
 {id:4,cards:['50-50 Grind','Kickflip']},
 {id:5,cards:['180°','Kickflip']},
 {id:6,cards:['180°','Noseslide']},
 {id:7,cards:['Noseslide','Nollie']},
 {id:8,cards:['Ollie','360 Flip']},
 {id:8,cards:['Ollie','Laser Flip']},
 {id:8,cards:['Ollie','Hurricane']},
 {id:9,cards:['Frontside Flip','Crooked Grind']},
 {id:10,cards:['Ollie','50-50 Grind']},
 {id:11,cards:['360°','Ollie','50-50 Grind']},
 {id:11,cards:['Stalefish','Backside Flip']},
 {id:11,cards:['900°','Ollie']},
 {id:8,cards:['Hurricane','Ollie'],reference:true}
];
for(const c of TRICKS)if(c.cost===4)c.points=c.difficultyPoints+2;
const mix=x=>{x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return(x^(x>>>15))>>>0;};
const rngFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
function placement(g,scenario){
 const card=E.activeCard(g),free=E.freeDice(g),own=E.wildColor(g),last=g.landed.length===scenario.cards.length-1;let best=null;
 function walk(i,ids){
  if(ids.length===card.cost){
   if(!E.findMatch(card,ids.map(id=>g.dice[id]),own))return;
   const copy=structuredClone(g);copy.pending=[...ids];assert(E.land(copy));
   const faces=ids.map(id=>g.dice[id].face),pair=new Set(faces).size<faces.length;
   let utility=E.sequenceView(copy).confirmed.moduleBonus*100;
   if(scenario.id===7&&pair)utility+=40;
   if(scenario.id===4)utility+=Number(ids.some(id=>g.dice[id].color===own))*(last?40:-40);
   if(scenario.id===5&&!last)utility+=E.freeDice(copy).filter(d=>E.isOwnStar(d,own)||d.face>=4).length*2;
   // Preserve the personal star for the remaining prescribed trick when the
   // current module goal does not dictate another placement.
   if(!last)utility+=E.freeDice(copy).filter(d=>E.isOwnStar(d,own)).length;
   if(!best||utility>best.utility)best={ids:[...ids],utility};return;
  }
  for(let j=i;j<free.length;j++)walk(j+1,[...ids,free[j].id]);
 }
 walk(0,[]);return best?.ids;
}
const results=[];
for(const [caseIndex,scenario]of cases.entries())for(const stock of [0,1,3]){
 const row={module:scenario.id,cards:scenario.cards,reference:!!scenario.reference,stock,trials:count,banked:0,bonus:0,falls:0,points:0,spent:{adjust:0,reroll:0,freeze:0}};
 for(let trial=0;trial<count;trial++){
  const rng=rngFor(mix(330001+trial*7919+caseIndex*271+stock*19)),g=E.newGame({skaterId:['neo','ruby','jade','sol','milo','iris'][trial%6]},()=>.4);
  g.route=[scenario.id];g.module=0;g.phase='select';g.deck=[];g.bank={adjust:stock,reroll:stock,freeze:stock};g.hand=[...scenario.cards,'Ollie'].map((name,i)=>({...TRICKS.find(c=>c.name===name),uid:'p'+i}));
  let steps=0;
  while(g.phase!=='result'){
   assert(++steps<120);
   if(g.phase==='select'){assert(E.chooseCard(g,g.hand[g.landed.length].uid));continue;}
   if(g.phase==='ready'){assert(E.roll(g,rng));continue;}
   if(g.phase==='decision'){
    if(g.landed.length===scenario.cards.length){assert(E.stop(g));continue;}
    if(scenario.id===5&&E.canFreeze(g)){
     const next=g.hand[g.landed.length],dice=E.freeDice(g),own=E.wildColor(g);
     const ranked=dice.filter(d=>!g.frozen.includes(d.id)).map(d=>({d,p:rollProbability(next,dice,own,[...g.frozen,d.id])})).sort((a,b)=>b.p-a.p);
     if(ranked.length){assert(E.bonus(g,'freeze',ranked[0].d.id));continue;}
    }
    assert(E.continueRun(g));continue;
   }
   assert.equal(g.phase,'rolled');
   const card=E.activeCard(g),dice=E.freeDice(g),own=E.wildColor(g),ids=placement(g,scenario);
   if(ids){assert(E.place(g,ids,true));assert(E.land(g));continue;}
   if(!scenario.noTokens){
    const close=closestMatch(card,dice,own);
    // Rescue goal: prefer the real reroll when the initial roll was already
    // insufficient. A possible initial roll is never deliberately spoiled.
    const rescue=scenario.id===6&&g.moduleTrace.current?.initialPossible===false&&g.moduleTrace.current.rerolls===0;
    if(!rescue&&close.distance<=g.bank.adjust&&close.step){assert(E.bonus(g,'adjust',close.step.id,close.step.delta));continue;}
    if(g.bank.reroll>0&&E.rerollableDice(g).length){
     const frozen=scenario.id===5?null:E.canFreeze(g)?freezeChoice(card,dice,own,g.frozen):null;
     if(frozen){assert(E.bonus(g,'freeze',frozen.id));continue;}
     assert(E.bonus(g,'reroll',null,0,rng));continue;
    }
    if(close.distance<=g.bank.adjust&&close.step){assert(E.bonus(g,'adjust',close.step.id,close.step.delta));continue;}
   }
   assert(E.fall(g));
  }
  assert.equal(g.score>0?E.sequenceView(g).confirmed.points:0,g.score);row.banked+=Number(g.score>0);row.bonus+=Number(g.last.moduleBonus>0);row.falls+=Number(g.score===0);row.points+=g.score;
  for(const type of ['adjust','reroll','freeze'])row.spent[type]+=g.used[type];
 }
 results.push(row);
}
assert.deepEqual(await productionHashes(),before);
const report={theoretical:true,version:2,trialsPerCell:count,totalTrials:results.reduce((s,r)=>s+r.trials,0),elapsedMs:Date.now()-start,methodology:'Prescribed compatible hand and sequence for each goal, plus one reference sequence playing Hurricane before Ollie and deliberately forgoing the ending-Epic goal; actual engine rolls and legal commands only. Placement aims for the goal using visible dice; no future RNG access. Uniform 0/1/3 stock of each token. Own-color star active; physical faces determine goals. Four-die premium +2. These measure prepared scenarios, not match win rates or ordinary hands.',results,productionUnchanged:true};
await writeFile(new URL('../../tests/theory85-module-v2-controlled-results.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify({cells:results.length,trials:report.totalTrials,elapsedMs:report.elapsedMs}));
