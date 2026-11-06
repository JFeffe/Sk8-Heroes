import test from 'node:test';
import assert from 'node:assert/strict';
import {MODULES,TRICKS} from '../public/data.js';
import * as E from '../public/engine.js';
import {moduleBonusPoints,moduleBonusEarned,sequenceTokenCount} from '../public/module-rules.js';
import {moduleGoalPresentation,thirdTrickOffer} from '../public/module-goals.js';
import {bestPlacement} from '../public/npc-strategy.js';
const card=(i,type='kick',cost=2,tier='base')=>({...TRICKS[0],uid:'c'+i,name:'Test '+i,type,cost,tier,points:3,pattern:'at-most',threshold:6,comboBonus:null});
function game(id,cards){const g=E.newGame({skaterId:'neo'},()=>.4);g.route=[id];g.phase='select';g.hand=cards;g.bank={adjust:1,freeze:1,reroll:1};return g;}
function land(g,i,faces=[2,3,4,5,6,6],ids=null){assert(E.chooseCard(g,g.hand[i].uid));let n=0;assert(E.roll(g,()=>((faces[n++]||2)-.5)/6));if(ids)assert(E.place(g,ids));else assert(E.autoPlace(g));assert(E.land(g));}
function next(g){assert(E.continueRun(g));}
function stop(g){if(g.phase==='decision')assert(E.stop(g));assert.equal(g.phase,'result');}
function claim(g){while(g.sequenceReward?.pending)assert(E.claimSequenceReward(g,['freeze','adjust','reroll'].find(type=>E.canAddBonus(g,type))));}
test('all twelve effects match the approved grid, including the Coping Bleu / Double Quai swap',()=>{
 const kinds=['base','favored','favored','signature','favored','stars','amplitude','recovery','three-score','three-score','three-tokens','amplitude'];
 const needs=[['kick'],['slide'],['air'],[],['slide','kick'],['air','kick'],['air','slide'],['slide'],[],['kick','slide'],[],['air']];
 assert.equal(MODULES.length,12);for(const [i,m]of MODULES.entries()){assert.equal(m.bonus.kind,kinds[i]);assert.deepEqual(m.needs,needs[i]);assert.equal(m.pv,[2,3,4][m.stage]);assert.deepEqual(m.rounds,[[1,2],[3,4,5],[6]][m.stage]);assert(!('minimumTricks' in m.bonus));assert(!('target'in m));assert(moduleGoalPresentation(m).title);}
 assert.deepEqual([1,2,4].map(i=>MODULES[i].bonus.type),['kick','slide','air']);
});
test('Base pays per physical card, including a single trick; Advanced and Epic do not count',()=>{
 for(const tier of ['base','advanced','epic']){const g=game(0,[card(0,'kick',2,tier)]);land(g,0);assert.equal(g.score,tier==='base'?4:3);assert.equal(g.last.moduleBonus,tier==='base'?1:0);}
 assert.equal(moduleBonusPoints(MODULES[0],[card(0),card(1),card(2,'kick',2,'epic')]),2);
});
for(const [id,first,favored]of [[1,'slide','kick'],[2,'air','slide'],[4,'slide','air']])test(MODULES[id].name+': each favored trick counts, other types do not',()=>{
 const cards=[card(0,first),card(1,id===4?'kick':favored),card(2,favored)],g=game(id,cards);land(g,0);next(g);land(g,1);next(g);land(g,2);assert.equal(g.last.moduleBonus,id===4?1:2);assert.equal(g.score,10+g.last.moduleBonus);assert.equal(g.last.rewardTokens,1);
 assert.equal(moduleBonusPoints(MODULES[id],[card(0,first)]),0);
});
test('signature uses the personal die on any trick, once per attempt, even on an ordinary face',()=>{
 const g=game(3,[card(0),card(1)]);land(g,0,[6,2,3,4,5,6],[0,1]);assert.equal(E.banked(g),5);next(g);land(g,1,[2,3,4,5],[2,3]);stop(g);assert.equal(g.last.moduleBonus,2);assert.equal(g.score,8);
 const other=game(3,[card(0)]);land(other,0,[2,3,4,5,6,6],[1,2]);assert.equal(other.last.moduleBonus,0);assert.equal(other.score,3);
});
test('stars count physical ones of all colors, ignoring resolved joker values and unspent dice',()=>{
 const g=game(5,[card(0,'air'),card(1)]);land(g,0,[1,1,1,4,5,6],[0,1]);g.dice[0].wildValue=6;next(g);land(g,1,[1,3,4,5],[2,3]);stop(g);assert.equal(g.last.moduleBonus,3);assert.equal(g.score,9);
 const ordinary=game(5,[card(0,'air'),card(1)]);land(ordinary,0);next(ordinary);land(ordinary,1);stop(ordinary);assert.equal(ordinary.last.moduleBonus,0);
});
for(const id of [6,11])test(MODULES[id].name+': amplitude pays +2 for each 3/4-die trick, including the first',()=>{
 const first=id===6?'air':'air',second=id===6?'slide':'kick';
 for(const costs of [[3,3],[4,2],[2,4]]){const g=game(id,[card(0,first,costs[0]),card(1,second,costs[1])]);land(g,0);next(g);land(g,1);stop(g);const bonus=costs.filter(n=>n>=3).length*2;assert.equal(g.last.moduleBonus,bonus);assert.equal(g.score,6+bonus);}
});
test('Grande Vague permits banking a single large Air with its amplitude bonus',()=>{const g=game(11,[card(0,'air',4)]);land(g,0);assert.equal(g.last.moduleBonus,2);assert.equal(g.score,5);assert.equal(g.last.rewardTokens,0);});
test('recovery offers one token only after banking exactly two tricks, including automatic banking',()=>{
 for(const costs of [[2,2],[3,3]]){let g=game(7,[card(0,'slide',costs[0]),card(1,'kick',costs[1])]);land(g,0);next(g);land(g,1);assert.equal(g.bank.freeze,1);stop(g);assert.equal(g.last.rewardTokens,1);assert(!E.proceed(g));g=JSON.parse(JSON.stringify(g));assert(E.claimSequenceReward(g,'freeze'));assert.equal(g.bank.freeze,2);assert(!E.claimSequenceReward(g,'freeze'));assert.equal(g.last.moduleBonus,0);assert.deepEqual(g.last.tokenRewards,['freeze']);}
 const short=game(7,[card(0,'slide')]);land(short,0);assert.equal(short.sequenceReward,null);
 const three=game(7,[card(0,'slide'),card(1),card(2)]);land(three,0);next(three);land(three,1);assert.equal(E.sequenceView(three).confirmed.moduleEffect.tokens,1);next(three);land(three,2);assert.equal(three.last.rewardTokens,1);assert.equal(three.last.moduleEffect.tokens,0);
});
for(const id of [8,9])test(MODULES[id].name+': three tricks give +2 total sequence points and one normal token',()=>{
 const g=game(id,[card(0),card(1,'slide'),card(2)]);land(g,0);next(g);land(g,1);assert.equal(E.banked(g),6);next(g);land(g,2);assert.equal(g.last.sequenceBonus,2);assert.equal(g.last.moduleBonus,0);assert.equal(g.score,11);assert.equal(g.last.moduleEffect.points,1);assert.equal(g.last.rewardTokens,1);assert.deepEqual(thirdTrickOffer(MODULES[id]),{points:2,tokens:1});
});
test('Embruns gives two separate choices, supports identical choices, and preserves both across save/resume',()=>{
 for(const choices of [['freeze','adjust'],['freeze','freeze']]){let g=game(10,[card(0),card(1),card(2)]);land(g,0);next(g);land(g,1);next(g);land(g,2);assert.equal(g.score,10);assert.equal(g.last.sequenceBonus,1);assert.equal(g.last.rewardTokens,2);assert(E.claimSequenceReward(g,choices[0]));assert(g.sequenceReward.pending);assert.equal(g.sequenceReward.remaining,1);assert(!E.proceed(g));g=JSON.parse(JSON.stringify(g));assert(E.claimSequenceReward(g,choices[1]));assert(!g.sequenceReward.pending);assert(!E.claimSequenceReward(g,'freeze'));assert.deepEqual(g.last.tokenRewards,choices);assert.deepEqual(g.attempts[0].tokenRewards,choices);assert.deepEqual(g.sequences[0].tokenRewards,choices);assert.equal(g.bank.freeze,choices[1]==='freeze'?3:2);assert(E.proceed(g));assert(E.pass(g));assert(E.proceed(g));assert.deepEqual(g.history[0].attempts[0].tokenRewards,choices);}
});
test('a later fall cancels every point effect and recovery never grants its pending token early',()=>{
 for(const id of [0,1,2,3,4,5,6,7,8,9,10,11]){const types=MODULES[id].needs,cards=[card(0,types[0]||'kick'),card(1,types[1]||'kick'),card(2)];if(id===6||id===11)cards[0].cost=3;const g=game(id,cards);land(g,0);next(g);land(g,1);if(g.phase==='result')continue;next(g);g.hand[2].pattern='exact';g.hand[2].values=[6,6];assert(E.chooseCard(g,g.hand[2].uid));assert(E.roll(g,()=>.2));assert(E.fall(g));assert.equal(g.score,0);assert.equal(g.last.moduleBonus,0);assert.equal(g.last.rewardTokens,0);assert.equal(g.sequenceReward,null);assert.deepEqual(g.bank,{adjust:1,freeze:1,reroll:1});}
});
for(const id of [0,7,8,10])test(MODULES[id].name+': both attempts independently score/reward and history remains stable',()=>{
 const count=id===7?2:3,types=id===7?['slide','kick']:['kick','slide','kick'],g=game(id,Array.from({length:count*2},(_,i)=>card(i,types[i%count])));
 for(let a=0;a<2;a++){for(let j=0;j<count;j++){if(j)next(g);land(g,a*count+j);}stop(g);claim(g);assert(E.proceed(g));}
 const rewards=id===10?4:2;assert.equal(g.bank.freeze,3);assert.equal(g.history[0].attempts.reduce((sum,a)=>sum+a.tokenRewards.length,0),rewards);assert.equal(g.history[0].attempts.length,2);assert.equal(g.history[0].best,Math.max(...g.history[0].attempts.map(a=>a.points)));assert(!E.proceed(g));
});
test('physical score previews and NPC trial placements never mutate validated evidence or award tokens',()=>{
 const g=game(3,[card(0),card(1)]);land(g,0,[2,3,4,5,6,6],[1,2]);next(g);assert(E.chooseCard(g,g.hand[1].uid));assert(E.roll(g,()=>.4));assert(E.place(g,[0,3]));const before=JSON.stringify(g);assert.equal(E.sequenceView(g).preview.moduleBonus,2);assert.equal(E.sequenceView(g).confirmed.moduleBonus,0);assert.equal(JSON.stringify(g),before);assert(bestPlacement(g,{difficulty:'expert'}));assert.equal(JSON.stringify(g),before);
});
test('empty sequences never score or grant tokens; token-only modules never invent score bonuses',()=>{
 for(const m of MODULES){assert.equal(moduleBonusPoints(m,[]),0);assert(!moduleBonusEarned(m,[]));assert.equal(sequenceTokenCount(m,[]),0);}
 for(const id of [7,10])assert.equal(moduleBonusPoints(MODULES[id],[card(0),card(1),card(2)]),0);
});
