import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../public/engine.js';
import {TRICKS as CURRENT_TRICKS,makeDeck,MODULES} from '../public/data.js';
import {TRICKS} from './fixtures/turn-scenarios.js';
const rng=()=>.4;
// Stable turn fixtures isolate sequencing from later changes to the card catalogue.
const fixtures={0:{pattern:'exact',values:[1,1],points:9},1:{pattern:'parity',points:2},9:{pattern:'straight',points:3},10:{pattern:'exact',values:[2,3],points:6},18:{pattern:'even-distinct',points:4},19:{pattern:'exact',values:[1,1,2],points:14},23:{points:48}};
function ready(ids=[1,0,9,10,18,19]){const s=E.newGame({},rng);s.route=[0,7,11];s.hand=ids.map((id,i)=>({...TRICKS[id],...fixtures[id],comboBonus:null,uid:`test-${i}`}));s.phase='select';return s;}
function cast(s,values){let i=0;assert(E.roll(s,()=>((values[i++]||1)-.5)/6));}
function land(s,index,values){assert(E.chooseCard(s,s.hand[index].uid));cast(s,values);assert(E.autoPlace(s));assert(E.land(s));}

test('deck preserves all 41 tricks and 85 physical cards, with no additive difficulties',()=>{
 const deck=makeDeck();assert.equal(deck.length,85);assert.equal(new Set(deck.map(c=>c.uid)).size,85);assert.equal(CURRENT_TRICKS.length,41);
 for(const c of CURRENT_TRICKS){assert(c.cost>=2&&c.cost<=4);assert(!('difficulty' in c));assert(!('effect' in c));}
});
test('initial offers produce two of each type; short and long routes remain playable',()=>{
 for(const length of [4,6]){
  const s=E.newGame({length},rng);assert.equal(s.route.length,length);
  while(s.phase==='initial'){assert(s.offer.length);assert(!E.choose(s,'missing'));assert(E.choose(s,s.offer[0],rng));}
  assert.deepEqual(s.hand.map(c=>c.type),['kick','kick','slide','slide','air','air']);assert.equal(s.deck.length,79);
  assert.equal(s.dice.length,6);assert(E.options(s).length);assert.equal(s.bank.adjust,1);
 }
});
test('single-type modules constrain only the first card; selection precedes every roll',()=>{
 const s=ready();assert(!E.roll(s));assert(!E.chooseCard(s,s.hand[4].uid));
 land(s,0,[1,2,4,4,4,4]);assert.equal(s.phase,'decision');assert(!E.chooseCard(s,s.hand[4].uid));
 assert(E.continueRun(s));assert(E.chooseCard(s,s.hand[4].uid));assert(E.chooseCard(s,s.hand[1].uid));assert(E.chooseCard(s,s.hand[4].uid));
 const locked=s.dice.filter(d=>d.locked!==null).map(d=>({...d}));cast(s,[2,4,6,6]);
 assert.deepEqual(s.dice.filter(d=>d.locked!==null),locked);assert.equal(s.rolls,2);
});
test('stopping keeps cards on table; second attempt resets only dice',()=>{
 const s=ready();land(s,0,[1,2,3,4,5,6]);assert(E.stop(s));assert.equal(s.score,2);assert(s.last.success);assert.equal(s.attempts.length,1);
 assert(!E.stop(s));assert.equal(s.sequences.length,1);assert(E.proceed(s));assert.equal(s.attempt,1);assert.equal(E.freeDice(s).length,6);assert(!E.eligible(s,s.hand[0].uid));assert.equal(s.landed.length,0);
});
test('failed second trick loses the whole turn; cannot stop after committing to continue',()=>{
 const s=ready();land(s,0,[1,2,3,4,5,6]);assert(E.continueRun(s));assert(!E.stop(s));assert(!E.pass(s));
 assert(E.chooseCard(s,s.hand[1].uid));cast(s,[6,6,6,6]);assert(E.fall(s));assert.equal(s.score,0);assert.equal(s.last.failed,'Kickflip');assert.equal(s.last.cards.length,1);assert(!E.fall(s));
});
test('a possible match cannot be declared a fall and an impossible match cannot validate',()=>{
 const s=ready();assert(E.chooseCard(s,s.hand[0].uid));cast(s,[1,2,3,4,5,6]);assert(!E.fall(s));assert(!E.land(s));assert(E.autoPlace(s));assert(E.canLand(s));
});
test('three tricks end automatically; no fourth or repeat of a physical card',()=>{
 const s=ready();land(s,0,[1,2,3,4,5,6]);assert(E.continueRun(s));assert(!E.chooseCard(s,s.hand[0].uid));
 land(s,2,[1,2,4,6]);assert(E.continueRun(s));land(s,4,[2,4]);
 assert.equal(s.phase,'result');assert.equal(s.score,10);assert.equal(s.last.moduleBonus,0);assert.equal(s.rolls,3);assert(s.last.success);assert.equal(s.attempts.length,1);assert(!E.continueRun(s));
});
test('four-die figures lock four dice and allow only an affordable follow-up',()=>{
 const s=ready([23,1,19]);s.route[0]=11;land(s,0,[1,1,1,1,4,6]);assert.equal(E.freeDice(s).length,2);
 assert.equal(E.options(s).length,1);assert(E.continueRun(s));assert(!E.chooseCard(s,s.hand[2].uid));land(s,1,[1,2]);assert.equal(s.score,52);assert.equal(s.last.moduleBonus,2);assert.equal(s.phase,'result');
});
test('bonus rescue has bounds and each use consumes persistent stock',()=>{
 const s=ready();assert(E.chooseCard(s,s.hand[1].uid));assert(!E.bonus(s,'adjust',0,1));cast(s,[1,2,6,6,6,6]);
 assert(!E.bonus(s,'adjust',0,-1));assert(E.bonus(s,'adjust',1,-1));assert(E.autoPlace(s));assert(E.land(s));
 assert.equal(s.bank.adjust,0);assert(!E.bonus(s,'reroll',0));assert(E.stop(s));assert(E.proceed(s));assert.equal(s.bank.adjust,0);assert(!s.used.adjust);
 s.bank.adjust=2;assert(E.chooseCard(s,s.hand[0].uid));cast(s,[2,2,2,2,2,2]);assert(E.bonus(s,'adjust',0,-1));assert(E.bonus(s,'adjust',1,-1));assert.equal(s.bank.adjust,0);assert(!E.bonus(s,'adjust',2,-1));
});
test('save/resume preserves active card, pending dice, locks and spent bonus',()=>{
 let s=ready();land(s,0,[1,2,3,4,5,6]);E.continueRun(s);E.chooseCard(s,s.hand[1].uid);cast(s,[1,2,5,6]);E.bonus(s,'adjust',3,-1);E.autoPlace(s);
 s=JSON.parse(JSON.stringify(s));assert(E.canLand(s));assert(E.land(s));assert.equal(s.landed.length,2);assert.equal(s.bank.adjust,0);
});
test('module progression keeps best of two, awards PV once, then reward and draft',()=>{
 const s=ready();land(s,1,[1,1,3,4,5,6]);E.stop(s);E.proceed(s);E.pass(s);E.proceed(s);
 assert.equal(s.phase,'reward');assert.equal(s.pv,2);assert.equal(s.history[0].best,9);assert.equal(s.history[0].total,9);
 assert(!E.proceed(s));assert(!E.addBonus(s,'boost'));assert(E.claim(s,'reroll',rng));assert.equal(s.bank.adjust+s.bank.reroll,3);
 const n=s.hand.length;assert(E.choose(s,s.offer[0],rng));assert.equal(s.hand.length,n+1);assert.equal(s.module,1);assert.equal(s.phase,'select');assert.equal(s.attempts.length,0);
});
test('bonus reserve grows beyond three and final module goes straight to summary',()=>{
 const s=ready();s.bank={adjust:2,reroll:1};E.pass(s);E.proceed(s);E.pass(s);E.proceed(s);assert.equal(s.reward,'choice');
 assert(E.claim(s,'reroll',rng));assert(s.rewardAdded);assert.equal(s.bank.reroll,2);
 E.choose(s,s.offer[0],rng);s.module=s.route.length-1;E.pass(s);E.proceed(s);E.pass(s);E.proceed(s);assert.equal(s.phase,'complete');assert(!E.claim(s,'adjust'));assert.equal(s.pv,0);
});
test('every one of the 41 tricks can score through the actual campaign turn',()=>{
 for(const c of CURRENT_TRICKS){
  const s=ready([c.id]);s.hand[0]={...c,uid:s.hand[0].uid};s.route=[3];
  const values=c.values||c.choices?.[0]||(c.threshold?Array(c.cost).fill(c.threshold):null)||({parity:[1,2],straight:Array.from({length:c.cost},(_,i)=>i+1),'odd-distinct':[1,3],'even-distinct':[2,4]})[c.pattern];
  land(s,0,[...values,...Array(6-values.length).fill(6)]);
  assert.equal(s.phase,'result',c.name);assert.equal(s.score,c.points,c.name);assert.equal(s.landed[0].dice.length,c.cost);assert.equal(s.attempts.length,1);
 }
});
test('two physical copies may each be played once in the same turn',()=>{
 const s=ready([1,1]);s.route=[3];land(s,0,[1,2,3,4,5,6]);E.continueRun(s);land(s,1,[1,2,3,4]);
 assert.equal(s.phase,'result');assert.equal(s.score,4);assert.equal(new Set(s.landed.map(e=>e.card)).size,2);
});
