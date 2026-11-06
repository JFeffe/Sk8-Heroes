import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../public/engine.js';
import {MODULES} from '../public/data.js';
import {TRICKS} from './fixtures/turn-scenarios.js';
const rng=()=>.4;
const card=(id,i=0)=>({...TRICKS[id],uid:`${id}-${i}`});
function ready(ids=[1,0,10,18,7]){const s=E.newGame({},rng);s.route=[3,4];s.hand=ids.map(card);s.phase='select';return s;}
function land(s,i,faces){assert(E.chooseCard(s,s.hand[i].uid));let j=0;assert(E.roll(s,()=>((faces[j++]??6)-.5)/6));assert(E.autoPlace(s));assert(E.land(s));}
function stop(s){if(s.phase==='decision')assert(E.stop(s));assert.equal(s.phase,'result');}

test('companion bonuses exclude self, work in either order and count once per card',()=>{
 const pop=card(1),kick=card(0),heel=card(2);
 assert.equal(E.sequenceScore([pop]).bonus,0);
 assert.equal(E.sequenceScore([pop,kick]).points,6);
 assert.equal(E.sequenceScore([kick,pop]).points,6);
 assert.equal(E.sequenceScore([pop,kick,heel]).bonus,2);
 assert.equal(E.sequenceScore([pop,card(1,1)]).bonus,2);
 assert.equal(E.sequenceScore([pop,card(18)]).bonus,0);
 assert.equal(E.sequenceScore([card(10),kick]).points,6);
});
test('Air, Slide and three-type bonuses require the matching companions',()=>{
 assert.equal(E.sequenceScore([card(3),card(18)]).bonus,2);
 assert.equal(E.sequenceScore([card(12),card(18)]).bonus,2);
 assert.equal(E.sequenceScore([card(14),card(9)]).bonus,2);
 assert.equal(E.sequenceScore([card(5),card(9)]).bonus,0);
 assert.equal(E.sequenceScore([card(5),card(9),card(18)]).bonus,3);
});
test('later cards activate bonuses retroactively; falling loses the entire combo',()=>{
 const s=ready();land(s,0,[2,3,4,5,6,6]);assert.equal(E.banked(s),2);E.continueRun(s);
 land(s,1,[4,5,6,6]);assert.equal(E.banked(s),6);assert.equal(E.sequenceView(s).confirmed.cardBonus,1);assert.equal(E.sequenceView(s).confirmed.moduleBonus,0);E.continueRun(s);
 assert(E.chooseCard(s,s.hand[2].uid));assert(E.roll(s,()=>0));assert(E.fall(s));
 assert.equal(s.score,0);assert.equal(s.last.bonus,0);assert.deepEqual(s.secured,[]);assert.deepEqual(s.sequences,[]);
});
test('archived dice survive rerolls, bonus use and save/resume; old cards do not trigger new bonuses',()=>{
 let s=ready();land(s,0,[2,3,4,5,6,6]);stop(s);const saved=structuredClone(s.sequences);
 E.proceed(s);assert(!E.chooseCard(s,s.hand[0].uid));assert.equal(s.dice.filter(d=>d.face===null).length,6);
 assert(E.chooseCard(s,s.hand[2].uid));assert(E.roll(s,()=>.6));assert(E.bonus(s,'adjust',0,1));assert(E.autoPlace(s));assert(E.land(s));
 assert.equal(E.banked(s),2);assert.deepEqual(s.sequences,saved);
 s=JSON.parse(JSON.stringify(s));stop(s);assert.equal(s.sequences.length,2);assert.deepEqual(s.sequences[0],saved[0]);assert.equal(new Set(s.secured).size,2);
 assert(!E.stop(s));E.proceed(s);assert.deepEqual(s.history[0].sequences,s.sequences);
 assert(E.claim(s,'reroll',rng));assert(E.choose(s,s.offer[0],rng));
 assert.deepEqual(s.secured,[]);assert.deepEqual(s.sequences,[]);assert(E.eligible(s,s.hand[0].uid));
});
test('first-card module type is enforced for every module and both attempts',()=>{
 for(const m of MODULES){const s=ready([0,9,18]);s.route=[m.id,3];
  for(let attempt=0;attempt<2;attempt++){
   for(const c of s.hand)assert.equal(E.eligible(s,c.uid),!m.needs.length||m.needs.includes(c.type),m.name);
   const bad=s.hand.find(c=>m.needs.length&&!m.needs.includes(c.type));if(bad)assert(!E.chooseCard(s,bad.uid));
   assert(E.pass(s));assert(E.proceed(s));
  }
 }
});
test('module reward is usable after drafting and resets the per-attempt used flag',()=>{
 const s=ready();s.bank={adjust:0,reroll:0};s.used.adjust=true;
 E.pass(s);E.proceed(s);E.pass(s);E.proceed(s);assert(E.claim(s,'adjust',rng));
 assert.equal(s.bank.adjust,1);assert(E.choose(s,s.offer[0],rng));assert(!s.used.adjust);
 assert(E.chooseCard(s,s.hand[0].uid));assert(E.roll(s,()=>.4));assert(E.bonus(s,'adjust',0,1));
 assert.equal(s.dice[0].face,4);assert.equal(s.bank.adjust,0);
});
test('successful reward cards grant persistent stock at module end, but fallen ones grant nothing',()=>{
 for(const failed of [false,true]){const s=ready([8,7]);s.bank={adjust:0,reroll:0};
  land(s,0,[2,3,6,6,6,6]);
  if(failed){E.continueRun(s);E.chooseCard(s,s.hand[1].uid);E.roll(s,()=>.9);assert(E.fall(s));}else stop(s);
  assert.equal(s.bank.adjust,0);E.proceed(s);E.pass(s);E.proceed(s);
  assert.equal(s.bank.adjust,failed?0:1);assert.equal(s.trickRewards.length,failed?0:1);
 }
 const s=ready([16]);s.bank={adjust:2,reroll:1};land(s,0,[2,5,6,6,6,6]);E.proceed(s);E.pass(s);E.proceed(s);
 assert.deepEqual(s.trickRewards,[{type:'reroll',added:true}]);assert.deepEqual(s.bank,{adjust:2,reroll:2});
});
