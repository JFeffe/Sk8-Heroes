import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../public/engine.js';
import {TRICKS} from '../public/data.js';

function turn(){const g=E.newGame({},()=>.3);g.route=[3];g.phase='select';g.hand=[0,1,9].map((id,i)=>({...TRICKS[id],type:i===2?'slide':'kick',cost:2,points:3,pattern:'at-most',threshold:6,comboBonus:null,uid:`test-${i}`}));return g;}
function land(g,index,ids){assert(E.chooseCard(g,g.hand[index].uid));assert(E.roll(g,()=>.4));assert(E.place(g,ids));assert(E.land(g));}

test('freeze protects a free die through rerolls, save/resume and subsequent tricks',()=>{
 let g=turn();land(g,0,[0,1]);g.dice[5].face=1;const locked=structuredClone(g.dice.slice(0,2));g.bank.reroll=3;
 assert(E.bonus(g,'freeze',5));assert.equal(g.bank.freeze,0);assert(E.chooseCard(g,g.hand[1].uid));assert(E.roll(g,()=>.99));
 for(let i=0;i<3;i++){
  assert(E.place(g,[5]));g=JSON.parse(JSON.stringify(g));let calls=0;
  assert(E.bonus(g,'reroll',undefined,0,()=>{calls++;return .7;}));
  assert.equal(calls,3);assert.equal(g.dice[5].face,1);assert.deepEqual(g.frozen,[5]);assert.deepEqual(g.pending,[]);assert.deepEqual(g.dice.slice(0,2),locked);
 }
 assert(E.place(g,[2,3]));assert(E.land(g));assert.deepEqual(g.frozen,[5]);assert.deepEqual(g.heldLastRoll,[]);
 assert(E.continueRun(g));assert(E.chooseCard(g,g.hand[2].uid));let calls=0;assert(E.roll(g,()=>{calls++;return .99;}));assert.equal(calls,1);assert.equal(g.dice[5].face,1);
});

test('a frozen die can be adjusted deliberately, and a fall clears the freeze without refund',()=>{
 const g=turn();land(g,0,[0,1]);g.dice[5].face=1;assert(E.bonus(g,'freeze',5));
 g.hand[1]={...g.hand[1],pattern:'exact',values:[6,6]};assert(E.chooseCard(g,g.hand[1].uid));assert(E.roll(g,()=>0));
 assert(E.bonus(g,'adjust',5,1));assert.equal(g.dice[5].face,2);assert(E.bonus(g,'reroll',undefined,0,()=>0));assert.equal(g.dice[5].face,2);
 assert(E.fall(g));assert.equal(g.score,0);assert.deepEqual(g.frozen,[]);assert.equal(g.bank.freeze,0);
});

test('three-trick sequence earns exactly one extra point on validation and preserves its breakdown',()=>{
 const g=turn();land(g,0,[0,1]);assert.equal(E.banked(g),3);assert(E.continueRun(g));land(g,1,[2,3]);assert.equal(E.banked(g),6);
 assert(E.continueRun(g));assert(E.chooseCard(g,g.hand[2].uid));assert(E.roll(g,()=>.4));assert(E.place(g,[4,5]));assert.equal(E.banked(g),6);
 assert(E.land(g));assert.equal(g.score,10);assert.equal(g.last.sequenceBonus,1);assert.equal(g.last.moduleBonus,0);assert.equal(g.last.bonus,1);assert.equal(g.last.base,9);assert.equal(g.sequences[0].sequenceBonus,1);
 assert(!E.land(g));assert.equal(g.attempts.length,1);assert.equal(g.score,10);
});

test('a failed third trick earns neither the sequence point nor the two landed tricks',()=>{
 const g=turn();land(g,0,[0,1]);E.continueRun(g);land(g,1,[2,3]);E.continueRun(g);g.hand[2]={...g.hand[2],pattern:'exact',values:[6,6]};
 E.chooseCard(g,g.hand[2].uid);E.roll(g,()=>0);assert(E.fall(g));assert.equal(g.score,0);assert.equal(g.last.sequenceBonus,0);assert.equal(g.sequences.length,0);
});

test('three- and four-die surcharge is already included in printed points, never awarded twice',()=>{
 for(const c of TRICKS){assert.equal(c.effortBonus,c.cost>=3?2:0);assert.equal(E.sequenceScore([c]).points,c.points);}
});
