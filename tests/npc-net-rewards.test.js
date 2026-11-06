import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../public/engine.js';
import {decide} from '../public/npc.js';
import {bonusPlan,sequencePlanner} from '../public/npc-strategy.js';
import {npcGameView} from '../public/npc-view.js';

function game({attempt=0,prior=0,cards=2,module=8,reward=false}={}){
 const g=E.newGame({skaterId:'neo'},()=>.4);g.phase='select';g.route=[module,0,4,5,7,11];g.module=0;g.attempt=attempt;g.attempts=attempt?[{points:prior}]:[];
 g.hand=Array.from({length:cards},(_,i)=>({id:100+i,uid:'net-'+i,name:'Test '+i,type:module===7?'slide':'kick',tier:'base',points:1,cost:2,pattern:'at-most',threshold:6,comboBonus:reward?{kind:'reward',type:'freeze'}:null}));
 g.bank={adjust:0,reroll:0,freeze:0};return g;
}
function land(g,count){for(let i=0;i<count;i++){const c=g.hand[i],ids=[i*2,i*2+1];g.landed.push({card:c.uid,dice:ids});ids.forEach(id=>Object.assign(g.dice[id],{face:6,locked:c.uid}));}g.phase='decision';return g;}
function lastTrick({cardReward=false}={}){
 const g=land(game({cards:3}),2);g.active=g.hand[2].uid;g.phase='rolled';Object.assign(g.hand[2],{pattern:'at-least',threshold:4,comboBonus:cardReward?{kind:'reward',type:'freeze'}:null});
 g.dice[4].face=3;g.dice[5].face=4;g.bank={adjust:2,reroll:2,freeze:2};return g;
}
for(const difficulty of ['easy','normal','expert']){
 for(const attempt of [0,1])test(difficulty+' passes an unprofitable sub-13 sequence on attempt '+(attempt+1),()=>{
  const g=game({attempt});const before=JSON.stringify(g),action=decide(g,{difficulty,leader:13});assert.deepEqual(action,{type:'pass'});assert.equal(JSON.stringify(g),before);assert(E.pass(g));assert.equal(g.reason,'pass');
 });
 test(difficulty+' does not replay a weaker pointless sequence below its own protected 13',()=>{
  const g=game({attempt:1,prior:13});assert.equal(decide(g,{difficulty,leader:8}).type,'pass');
 });
 test(difficulty+' plans three free tricks for their token despite a higher score already secured',()=>{
  const g=game({cards:3});assert.equal(decide(g,{difficulty,leader:13}).type,'choose');
  land(g,2);assert.equal(decide(g,{difficulty,leader:13}).type,'continue');
 });
 test(difficulty+' refuses to pay one token to recover only one, including on its first attempt',()=>{
  const g=lastTrick(),before=JSON.stringify(g);assert.equal(decide(g,{difficulty,leader:13}).type,'fall');assert.equal(JSON.stringify(g),before);
 });
 test(difficulty+' can pay one adjustment for two rewards below the scoring target',()=>{
  const g=lastTrick({cardReward:true}),action=decide(g,{difficulty,leader:13});assert.equal(action.type,'bonus');assert.equal(action.bonusType,'adjust');
  assert(E.bonus(g,action.bonusType,action.id,action.delta));assert(E.autoPlace(g));assert(E.land(g));assert.equal(g.last.rewardTokens,1);assert.equal(g.earned.freeze,1);assert.equal(g.used.adjust,1);assert.equal(g.last.points<13,true);
 });
}
test('a legal scoring path above 13 still justifies tokens independently of resource rewards',()=>{
 const g=lastTrick();g.hand[2].points=15;const action=decide(g,{leader:13,difficulty:'normal'});assert.equal(action.type,'bonus');assert.equal(action.bonusType,'adjust');
});
test('one-shot and two-trick rewards are legitimate objectives even on the first attempt',()=>{
 const card=game({cards:1,reward:true});assert.equal(decide(card,{leader:13}).type,'choose');
 const recovery=game({cards:2,module:7});assert.equal(decide(recovery,{leader:13}).type,'choose');assert.equal(sequencePlanner(recovery,{leader:13}).path.length,2);
});
test('the cost of an earlier adjustment or freeze is included before further farming spends',()=>{
 const g=lastTrick({cardReward:true});g.used.freeze=1;
 assert.equal(bonusPlan(g,{leader:13},'adjust',4,1),null);assert.equal(bonusPlan(g,{leader:13},'reroll'),null);
});
test('freeze followed by reroll counts as two spends, and freeze between tricks also costs one',()=>{
 const g=lastTrick({cardReward:true});assert.equal(bonusPlan(g,{leader:13},'freeze',5),null);
 const next=land(game({cards:3}),2);next.bank.freeze=1;assert.equal(bonusPlan(next,{leader:13},'freeze',4),null);
});
test('banking already earned rewards salvages past spending without spending another token',()=>{
 const g=land(game({cards:2,reward:true,attempt:1,prior:13}),1);g.hand[1].comboBonus=null;g.used.adjust=2;
 assert.equal(decide(g,{leader:13}).type,'stop');
});
test('a fresh profitable resource plan does not count rewards from the previous attempt twice',()=>{
 const g=game({cards:2,attempt:1,prior:13});g.earned.freeze=3;assert.equal(decide(g,{leader:13}).type,'pass');
});
test('a table without a protected score can still secure its first points',()=>{
 const g=game({cards:1});assert.equal(decide(g,{leader:0}).type,'choose');
});
test('a one-token farming plan forecasts unassisted dice rather than assuming a paid rescue',()=>{
 const g=lastTrick();g.phase='decision';g.active=null;
 const plan=sequencePlanner(g,{leader:13});assert.equal(plan.tokenBudget,0);assert(Math.abs(plan.p-.25)<1e-8);
});
test('bonus previews are isolated, deterministic, and never inspect hidden state or draw randomness',t=>{
 const g=lastTrick({cardReward:true}),before=JSON.stringify(g);for(const key of ['deck','rngState','randomSource'])Object.defineProperty(g,key,{configurable:true,get(){throw Error('Hidden read');}});
 t.mock.method(Math,'random',()=>{throw Error('Randomness consumed');});const a=bonusPlan(g,{leader:13},'adjust',4,1);assert(a);assert.deepEqual(bonusPlan(npcGameView(g),{leader:13},'adjust',4,1),a);
 for(const key of ['deck','rngState','randomSource'])delete g[key];const original=JSON.parse(before);for(const key of ['deck','rngState','randomSource'])delete original[key];assert.equal(JSON.stringify(g),JSON.stringify(original));
});
