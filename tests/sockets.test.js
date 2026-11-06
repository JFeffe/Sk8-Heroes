import test from 'node:test';
import assert from 'node:assert/strict';
import {matches,arrangeDice} from '../public/combinations.js';
import {TRICKS} from '../public/data.js';
import {probability} from '../scripts/dice-probability.mjs';
const dice=values=>values.map((face,id)=>({face,id}));
test('inclusive bounds apply to EACH die and do not accept a sufficient sum',()=>{
 const high=TRICKS.find(c=>c.name==='Kickflip'),low={pattern:'at-most',threshold:3,cost:2};
 assert(matches(high,[4,4]));assert(matches(high,[4,6]));assert(!matches(high,[3,6]));assert(!matches(high,[6]));
 assert(matches(low,[3,3]));assert(matches(low,[1,3]));assert(!matches(low,[1,4]));assert(!matches(low,[0,3]));
 assert.deepEqual(arrangeDice(high,dice([6])),[0,null]);assert.equal(arrangeDice(high,dice([3])),null);
});
test('probability caches distinguish different threshold values',()=>{
 for(const [threshold,p] of [[2,25/36],[3,16/36],[4,9/36],[5,4/36]]){
  const c={pattern:'at-least',threshold,cost:2};assert(Math.abs(probability(c,2)-p)<1e-12);
  assert(Math.abs(probability({...c,pattern:'at-most',threshold:7-threshold},2)-p)<1e-12);
 }
});
test('dice snap into the correct printed sockets regardless of drop order',()=>{
 const c={pattern:'exact',values:[1,1,2],cost:3};
 assert.deepEqual(arrangeDice(c,dice([2])),[null,null,0]);
 assert.deepEqual(arrangeDice(c,dice([2,1])),[1,null,0]);
 assert.deepEqual(arrangeDice(c,dice([2,1,1])),[1,2,0]);
 assert.equal(arrangeDice(c,dice([2,2])),null);
 assert.equal(arrangeDice(c,[{id:0,face:1},{id:0,face:1}]),null);
});
test('partial sockets preserve relational constraints and leave a possible completion',()=>{
 const straight={pattern:'straight',cost:2},parity={pattern:'parity',cost:2},different={pattern:'even-distinct',cost:2};
 assert.deepEqual(arrangeDice(straight,dice([6])),[null,0]);assert.deepEqual(arrangeDice(straight,dice([6,5])),[1,0]);
 assert.equal(arrangeDice(straight,dice([6,1])),null);assert.deepEqual(arrangeDice(parity,dice([3])),[null,0]);
 assert.equal(arrangeDice(different,dice([4,4])),null);assert.deepEqual(arrangeDice(different,dice([4,6])),[0,1]);
});
test('all complete matches on two dice can be placed in the sockets',()=>{
 for(const c of TRICKS.filter(c=>c.cost===2))for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)assert.equal(!!arrangeDice(c,dice([a,b])),matches(c,[a,b]),c.name);
});

test('printed P and I slots receive even and odd dice in that order, including a personal star',()=>{
 for(const c of TRICKS.filter(c=>c.requirementCode==='mixed')){
  assert.deepEqual(arrangeDice(c,dice([1])),[null,0]);
  assert.deepEqual(arrangeDice(c,dice([1,2])),[1,0]);
  assert.deepEqual(arrangeDice(c,dice([5,4])),[1,0]);
  assert.deepEqual(arrangeDice(c,[{id:0,color:'blue',face:1},{id:1,color:'red',face:3}],'blue'),[0,1]);
 }
});

test('new multi-die requirements snap into their printed slots, with valid partial completions',()=>{
 assert.deepEqual(arrangeDice(TRICKS.find(c=>c.name==='Backside Flip'),dice([6])),[null,null,0]);
 assert.deepEqual(arrangeDice(TRICKS.find(c=>c.name==='Backside Flip'),dice([6,1,4])),[1,2,0]);
 assert.equal(arrangeDice(TRICKS.find(c=>c.name==='540°'),dice([1,5])),null);
 assert.deepEqual(arrangeDice(TRICKS.find(c=>c.name==='540°'),dice([6,4,5])),[1,2,0]);
 assert.deepEqual(arrangeDice(TRICKS.find(c=>c.name==='720°'),dice([6,2,4])),[1,2,0]);
 assert.equal(arrangeDice(TRICKS.find(c=>c.name==='900°'),dice([4,5,6])),null);
 assert.equal(arrangeDice(TRICKS.find(c=>c.name==='1080°'),dice([4,5])),null);
 for(const c of TRICKS.filter(c=>c.cost>2)){
  function walk(values){
   if(values.length===c.cost){assert.equal(!!arrangeDice(c,dice(values)),matches(c,values),`${c.name} ${values}`);return;}
   for(let v=1;v<=6;v++)walk([...values,v]);
  }
  walk([]);
 }
});
