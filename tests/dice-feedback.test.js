import test from 'node:test';
import assert from 'node:assert/strict';
import {validDiceIds,detectRolls} from '../public/dice-feedback.js';
import * as E from '../public/engine.js';
import * as M from '../public/match.js';
import {TRICKS} from '../public/data.js';
test('glow includes all dice in legal combinations and respects dice already placed',()=>{
 const card=TRICKS.find(c=>c.cost===2),dice=Array.from({length:6},(_,id)=>({id,color:'blue',face:id+1}));
 const valid=validDiceIds(card,dice),expected=new Set();
 for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)if(E.findMatch(card,[dice[i],dice[j]])){expected.add(i);expected.add(j);}
 assert.deepEqual(valid,expected);
 for(const id of valid){const constrained=validDiceIds(card,dice,null,[id]);assert(constrained.has(id));for(const other of constrained)assert(E.findMatch(card,[dice[id],dice[other]])||other===id);}
 assert.equal(validDiceIds(card,[dice[0]]).size,0);
});
test('glow uses the same personal star resolver as landing',()=>{
 const card=TRICKS.find(c=>c.cost===2),dice=[{id:0,color:'blue',face:1},{id:1,color:'red',face:6}];
 assert.equal(validDiceIds(card,dice,'blue').size,E.findMatch(card,dice,'blue')?2:0);
});
test('roll and paid reroll animations are detected for every player and skip held/locked dice',()=>{
 const m=M.newMatch({seed:14}),p=m.players[2],g=p.game;g.phase='ready';
 const first=detectRolls(m);assert.deepEqual(first.rolled,{});
 g.phase='rolled';g.rolls=1;g.heldLastRoll=[0];g.dice[1].locked='card';
 const rolled=detectRolls(structuredClone(m),first.stamps);assert.deepEqual(rolled.rolled[p.id],[2,3,4,5]);
 assert.deepEqual(detectRolls(m,rolled.stamps).rolled,{});
 g.used.reroll++;assert.deepEqual(detectRolls(m,rolled.stamps).rolled[p.id],[2,3,4,5]);
 g.attempt++;g.rolls=1;g.used.reroll=0;assert(detectRolls(m,rolled.stamps).rolled[p.id]);
});
