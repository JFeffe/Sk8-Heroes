import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {productionHashes} from './theory85-runtime.mjs';
import * as E from '../../.local-games/theory85-modules-v3-runtime/engine.js';
import {MODULES,TRICKS} from '../../.local-games/theory85-modules-v3-runtime/data.js';
import {moduleBonusPoints} from '../../.local-games/theory85-modules-v3-runtime/module-rules.js';
import {bestPlacement} from '../../.local-games/theory85-modules-v3-runtime/npc-strategy.js';
import {npcGameView} from '../../.local-games/theory85-modules-v3-runtime/npc-view.js';
import {projectedBonus} from '../../.local-games/theory85-modules-v3-runtime/module-trace.js';
const before=await productionHashes(),checks=[];
const oldFixture=JSON.parse(await readFile(new URL('../../tests/fixtures/theory85-modules-v2.json',import.meta.url),'utf8'));
const check=(name,run)=>{run();checks.push(name);};
function game(module,names){const g=E.newGame({skaterId:'neo'},()=>.4);g.route=[module];g.module=0;g.phase='select';g.deck=[];g.bank={adjust:5,reroll:3,freeze:3};g.hand=names.map((name,i)=>({...TRICKS.find(c=>c.name===name),uid:'c'+i}));return g;}
function choose(g,i){assert(E.chooseCard(g,g.hand[i].uid));}
function roll(g,faces,reroll=false){let i=0;const rng=()=>{assert(i<faces.length);return(faces[i++]-.5)/6;};assert(reroll?E.bonus(g,'reroll',null,0,rng):E.roll(g,rng));assert.equal(i,faces.length);}
function land(g,ids){assert(E.place(g,ids,true));assert(E.land(g));}
function play(g,i,faces,ids){choose(g,i);roll(g,faces);land(g,ids);}
function next(g){assert(E.continueRun(g));}
function stop(g){if(g.phase==='decision')assert(E.stop(g));assert.equal(g.phase,'result');if(g.score>0)assert.equal(E.sequenceView(g).confirmed.points,g.score);assert.equal(g.last.points,g.score);}
check('Seven revised goals, five unchanged; stage eligibility, PV, +2 and two-trick minimum preserved.',()=>{
 const old=oldFixture;
 assert.deepEqual([0,1,2].map(s=>MODULES.filter(m=>m.stage===s).length),[4,6,2]);
 for(const m of MODULES){assert.equal(m.pv,[2,3,4][m.stage]);assert.equal(m.bonusPoints,2);assert.equal(m.bonus.minimumTricks,2);assert.deepEqual(m.rounds,old.modules[m.id].rounds);}
 for(const id of [1,3,4,5,11])assert.deepEqual(MODULES[id],old.modules[id]);
 assert.equal(new Set(MODULES.map(m=>m.bonus.kind)).size,12);
});
check('All twelve goals reject zero or one trick, even a four-die Epic showing four distinct faces.',()=>{
 for(const m of MODULES)for(const cards of [[],[{uid:'solo',tier:'epic',cost:4,points:16}]])assert.equal(moduleBonusPoints(m,cards,{used:{reroll:0},moduleTrace:{entries:[{card:'solo',dice:[1,2,3,4].map(face=>({face})),initialPossible:false,rerolls:1,carriedFrozen:[0]}]}}),0);
});

const examples=[
 ['Ollie','50-50 Grind'],['50-50 Grind','Ollie'],['180°','Backside Flip'],['Ollie','Kickflip'],
 ['50-50 Grind','Ollie'],['180°','Kickflip'],['180°','50-50 Grind'],['Noseslide','Ollie'],
 ['Backside Flip','50-50 Grind'],['Frontside Flip','Nosegrind'],['Stalefish','Backside Flip'],['Stalefish','Backside Flip']
];
function successful(g,module,offset){
 switch(module){
  case 0:play(g,offset,[2,3,6,6,6,6],[0,1]);next(g);play(g,offset+1,[4,5,6,6],[2,3]);break;
  case 1:play(g,offset,[2,3,6,6,6,6],[0,1]);next(g);play(g,offset+1,[3,4,6,6],[2,3]);break;
  case 2:play(g,offset,[2,3,6,6,6,6],[0,1]);next(g);play(g,offset+1,[1,3,5,6],[2,3,4]);break;
  case 3:play(g,offset,[2,3,6,6,6,6],[0,1]);next(g);play(g,offset+1,[4,5,6,6],[2,3]);break;
  case 4:play(g,offset,[6,2,3,6,6,6],[1,2]);assert(!E.canStop(g));next(g);play(g,offset+1,[3,4,5,6],[0,3]);break;
  case 5:choose(g,offset);roll(g,[1,2,3,6,6,6]);assert(E.bonus(g,'freeze',0));land(g,[1,2]);next(g);assert(g.frozen.includes(0));choose(g,offset+1);roll(g,[4,5,6]);land(g,[0,3]);break;
  case 6:choose(g,offset);roll(g,[6,6,6,6,6,6]);roll(g,[2,3,6,6,6,6],true);land(g,[0,1]);next(g);play(g,offset+1,[4,5,6,6],[2,3]);break;
  case 7:play(g,offset,[3,3,6,6,6,6],[0,1]);next(g);play(g,offset+1,[4,5,6,6],[2,3]);break;
  case 8:play(g,offset,[1,3,5,6,6,6],[0,1,2]);next(g);play(g,offset+1,[2,4,6],[3,4]);break;
  case 9:play(g,offset,[3,5,6,6,6,6],[0,1]);next(g);play(g,offset+1,[2,4,6,6],[2,3]);break;
  case 10:case 11:play(g,offset,[1,3,5,6,6,6],[0,1,2]);next(g);play(g,offset+1,[2,4,6],[3,4,5]);break;
 }
 stop(g);assert.equal(g.last.moduleBonus,2);
}
for(let id=0;id<12;id++)check(`${MODULES[id].name}: both attempts independently earn +2 with distinct physical cards.`,()=>{
 const g=game(id,[...examples[id],...examples[id]]);successful(g,id,0);const first=g.score;assert(E.proceed(g));assert.equal(g.attempt,1);assert.deepEqual(g.moduleTrace.entries,[]);assert.deepEqual(g.used,{adjust:0,reroll:0,freeze:0});
 assert(!E.chooseCard(g,g.hand[0].uid));successful(g,id,2);assert.equal(g.attempts.length,2);assert.deepEqual(g.attempts.map(a=>a.moduleBonus),[2,2]);assert(E.proceed(g));assert.equal(g.history[0].best,Math.max(first,g.score));assert.deepEqual(g.history[0].attempts.map(a=>a.moduleBonus),[2,2]);
});
check('Îlot permits adjustments and freeze, but a real reroll removes its bonus for that attempt only.',()=>{
 for(const reroll of [false,true]){
  const g=game(0,['Ollie','50-50 Grind']);choose(g,0);roll(g,[2,3,4,5,6,6]);assert(E.bonus(g,'adjust',5,-1));assert(E.bonus(g,'freeze',4));if(reroll)roll(g,[2,3,4,5,5],true);land(g,[0,1]);next(g);choose(g,1);roll(g,[4,5,6]);land(g,[2,3]);stop(g);assert.equal(g.last.moduleBonus,reroll?0:2);
 }
});
check('Petite Vague accepts Advanced then Base, but never combines separate all-Base and all-Advanced attempts.',()=>{
 let g=game(2,['Melon Grab','Ollie']);play(g,0,[2,5,6,6,6,6],[0,1]);next(g);play(g,1,[3,4,6,6],[2,3]);stop(g);assert.equal(g.last.moduleBonus,2);
 g=game(2,['180°','Ollie','Melon Grab','Backside Flip']);play(g,0,[2,3,6,6,6,6],[0,1]);next(g);play(g,1,[3,4,6,6],[2,3]);stop(g);assert.equal(g.last.moduleBonus,0);assert(E.proceed(g));play(g,2,[2,5,6,6,6,6],[0,1]);next(g);play(g,3,[1,3,5,6],[2,3,4]);stop(g);assert.deepEqual(g.attempts.map(a=>a.moduleBonus),[0,0]);
});
check('Coping Bleu accepts a genuine ±1 rescue; adjusting an unused die after an already possible first roll earns nothing.',()=>{
 for(const rescue of [true,false]){
  const g=game(6,['180°','50-50 Grind']);choose(g,0);roll(g,rescue?[2,5,6,6,6,6]:[2,3,6,6,6,6]);assert(E.bonus(g,'adjust',rescue?1:5,-1));land(g,[0,1]);next(g);play(g,1,[4,5,6,6],[2,3]);stop(g);assert.equal(g.last.moduleBonus,rescue?2:0);
 }
});
check('A possible first roll cannot be spoiled with ±1 to manufacture a rescue bonus.',()=>{
 const g=game(6,['180°','50-50 Grind']);choose(g,0);roll(g,[4,4,6,6,6,6]);assert(E.bonus(g,'adjust',0,1));roll(g,[2,3,6,6,6,6],true);land(g,[0,1]);next(g);play(g,1,[4,5,6,6],[2,3]);stop(g);assert.equal(g.last.moduleBonus,0);
});
check('Double Quai counts physical faces, not the personal star’s resolved wildcard value.',()=>{
 const g=game(7,['Noseslide','Ollie']);play(g,0,[1,3,6,6,6,6],[0,1]);assert.equal(g.dice[0].wildValue,3);next(g);play(g,1,[4,5,6,6],[2,3]);stop(g);assert.equal(g.last.moduleBonus,0);
});
check('Boucle du Lagon counts the physical star as 1, and cannot accumulate distinct faces across attempts.',()=>{
 let g=game(8,['360 Flip','Ollie']);play(g,0,[1,4,6,6,6,6],[0,1]);next(g);play(g,1,[2,3,6,6],[2,3]);stop(g);assert.equal(g.last.moduleBonus,2);
 g=game(8,['50-50 Grind','Ollie','50-50 Grind','Ollie']);play(g,0,[2,3,6,6,6,6],[0,1]);next(g);play(g,1,[3,4,6,6],[2,3]);stop(g);assert.equal(g.last.moduleBonus,0);assert(E.proceed(g));play(g,2,[4,5,6,6,6,6],[0,1]);next(g);play(g,3,[5,6,6,6],[2,3]);stop(g);assert.deepEqual(g.attempts.map(a=>a.moduleBonus),[0,0]);
});
check('Marches uses only companion effects inside the current sequence; token rewards and third-trick bonuses do not count.',()=>{
 const cards=['Nollie','Lipslide','180°'].map((name,i)=>({...TRICKS.find(c=>c.name===name),uid:'p'+i}));assert.equal(moduleBonusPoints(MODULES[9],cards),0);
 const g=game(9,['Pop Shuvit','50-50 Grind','Kickflip','50-50 Grind']);play(g,0,[2,3,6,6,6,6],[0,1]);next(g);play(g,1,[4,5,6,6],[2,3]);stop(g);assert.equal(g.last.moduleBonus,0);assert(E.proceed(g));play(g,2,[4,5,6,6,6,6],[0,1]);next(g);play(g,3,[2,3,6,6],[2,3]);stop(g);assert.deepEqual(g.attempts.map(a=>a.moduleBonus),[0,0]);
});
check('Embruns accepts two three-die tricks automatically banked; continuing to a third trick removes its +2.',()=>{
 const g=game(10,['Ollie','50-50 Grind','180°']);play(g,0,[2,3,6,6,6,6],[0,1]);next(g);play(g,1,[4,5,6,6],[2,3]);assert.equal(E.sequenceView(g).confirmed.moduleBonus,2);next(g);play(g,2,[2,3],[4,5]);stop(g);assert.equal(g.last.moduleBonus,0);assert.equal(g.last.sequenceBonus,1);
});
check('Falls cancel the bonus and missing a required second type prevents banking.',()=>{
 const g=game(6,['180°','Overcrook']);play(g,0,[2,3,6,6,6,6],[0,1]);assert(!E.stop(g));next(g);choose(g,1);roll(g,[6,6,6,6]);assert(E.fall(g));assert.equal(g.score,0);assert.equal(g.last.moduleBonus,0);
});
check('Forecasts and trial NPC placements never fabricate points or mutate real evidence; serialized evidence restores correctly.',()=>{
 const g=game(8,['Backside Flip','50-50 Grind']);assert(projectedBonus(MODULES[8],g.hand,g)>0);assert.equal(E.sequenceScore(g.hand,MODULES[8],g).moduleBonus,0);choose(g,0);roll(g,[1,3,5,2,4,6]);
 const view=npcGameView(g),snapshot=JSON.stringify(view);assert(bestPlacement(view,{evaluation:'score'}));assert.equal(JSON.stringify(view),snapshot);const restored=JSON.parse(JSON.stringify(g));land(restored,[0,1,2]);next(restored);play(restored,1,[2,4,6],[3,4]);stop(restored);assert.equal(restored.last.moduleBonus,2);
});
check('A reroll in the first Îlot attempt does not disqualify a later attempt played without rerolls.',()=>{
 const g=game(0,['Ollie','50-50 Grind','Ollie','50-50 Grind']);choose(g,0);roll(g,[2,3,6,6,6,6]);roll(g,[2,3,6,6,6,6],true);land(g,[0,1]);next(g);play(g,1,[4,5,6,6],[2,3]);stop(g);assert.equal(g.last.moduleBonus,0);assert(E.proceed(g));successful(g,0,2);assert.deepEqual(g.attempts.map(a=>a.moduleBonus),[0,2]);
});
check('A failed first attempt cannot supply rescue evidence for an initially possible roll in the second attempt.',()=>{
 const g=game(6,['180°','50-50 Grind']);choose(g,0);roll(g,[6,6,6,6,6,6]);assert(E.fall(g));assert(E.proceed(g));choose(g,0);roll(g,[2,3,6,6,6,6]);roll(g,[2,3,6,6,6,6],true);land(g,[0,1]);next(g);play(g,1,[4,5,6,6],[2,3]);stop(g);assert.deepEqual(g.attempts.map(a=>a.moduleBonus),[0,0]);
});
check('Boucle du Lagon supports a four-die Epic first, followed by a two-die trick; the Epic need not be last.',()=>{
 const g=game(8,['Hurricane','Ollie']);play(g,0,[2,3,4,5,6,6],[0,1,2,3]);assert.equal(E.sequenceView(g).confirmed.moduleBonus,0);next(g);play(g,1,[2,3],[4,5]);stop(g);assert.equal(g.last.moduleBonus,2);
});
assert.deepEqual(await productionHashes(),before);
const report={theoretical:true,version:3,passed:true,groups:checks.length,checks,productionUnchanged:true};await writeFile(new URL('../../tests/theory85-module-v3-validation-results.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
