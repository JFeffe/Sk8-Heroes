import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../public/engine.js';
import {TRICKS} from '../public/data.js';
function turn(){const g=E.newGame({},()=>.3);g.route=[3];g.phase='select';g.hand=[0,1,9].map((id,i)=>({...TRICKS[id],cost:2,points:3,pattern:'at-most',threshold:6,comboBonus:null,uid:`carry-${i}`}));return g;}
function begin(g,index){assert(E.chooseCard(g,g.hand[index].uid));assert(E.roll(g,()=>.8));}
function land(g,ids){assert(E.place(g,ids));assert(E.land(g));}

test('an unused freeze survives card validation, save/resume and the roll between two tricks',()=>{
 let g=turn();begin(g,0);const face=g.dice[5].face;assert(E.bonus(g,'freeze',5));land(g,[0,1]);
 assert.deepEqual(g.frozen,[5]);assert.equal(g.bank.freeze,0);g=JSON.parse(JSON.stringify(g));assert(E.continueRun(g));assert(E.chooseCard(g,g.hand[1].uid));
 let calls=0;assert(E.roll(g,()=>{calls++;return 0;}));assert.equal(calls,3);assert.equal(g.dice[5].face,face);assert.deepEqual(g.heldLastRoll,[5]);
 assert(E.bonus(g,'reroll',undefined,0,()=>0));assert.equal(g.dice[5].face,face);land(g,[2,3]);assert.deepEqual(g.frozen,[5]);
 assert(E.continueRun(g));assert.deepEqual(g.frozen,[5]);assert(E.chooseCard(g,g.hand[2].uid));assert(E.roll(g,()=>0));assert.equal(g.dice[5].face,face);
});

test('new and already applied freezes both carry across tricks until their dice are used or the run ends',()=>{
 const g=turn();begin(g,0);g.bank.freeze=2;assert(E.bonus(g,'freeze',5));assert(E.bonus(g,'reroll',undefined,0,()=>.4));
 assert(E.bonus(g,'freeze',4));const face=g.dice[4].face,heldFace=g.dice[5].face;land(g,[0,1]);assert.deepEqual(g.frozen,[5,4]);
 assert(E.continueRun(g));assert(E.chooseCard(g,g.hand[1].uid));assert(E.roll(g,()=>0));assert.equal(g.dice[4].face,face);assert.equal(g.dice[5].face,heldFace);
 const locked=turn();begin(locked,0);assert(E.bonus(locked,'freeze',0));land(locked,[0,1]);assert.deepEqual(locked.frozen,[]);assert.equal(locked.bank.freeze,0);
 const stopped=turn();begin(stopped,0);assert(E.bonus(stopped,'freeze',5));land(stopped,[0,1]);assert(E.stop(stopped));assert.deepEqual(stopped.frozen,[]);assert.equal(stopped.bank.freeze,0);
});
