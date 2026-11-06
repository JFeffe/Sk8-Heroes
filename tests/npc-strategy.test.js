import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../public/engine.js';
import * as M from '../public/match.js';
import {TRICKS} from './fixtures/turn-scenarios.js';
import {decide} from '../public/npc.js';
import {sequencePlanner,draftValue,bestPlacement,npcContext,tokenValue} from '../public/npc-strategy.js';

function game(ids,{module=3,attempt=1,prior=0}={}){
 const g=E.newGame({skaterId:'neo'},()=>.4);
 g.route=[module,0,1,4,5,8];g.module=0;g.phase='select';g.hand=ids.map((id,i)=>({...TRICKS[id],uid:`${id}-${i}`}));
 g.attempt=attempt;g.attempts=attempt?[{points:prior}]:[];g.bank={adjust:0,reroll:0,freeze:0};return g;
}
function landed(g,indices){
 g.phase='decision';let offset=0;
 for(const index of indices){const c=g.hand[index],ids=Array.from({length:c.cost},()=>offset++);g.landed.push({card:c.uid,dice:ids});ids.forEach(id=>Object.assign(g.dice[id],{locked:c.uid,face:3}));}
 return g;
}
test('NPC values the personal die module without an artificial trick-order restriction',()=>{
 const g=game([2,0],{module:3});g.hand.forEach((c,i)=>Object.assign(c,{points:i?3:4,cost:2,pattern:'at-most',threshold:6,comboBonus:null}));const plan=sequencePlanner(g,{leader:6});
 assert.equal(plan.path.length,2);assert.deepEqual(new Set(plan.path.map(c=>c.points)),new Set([3,4]));
 assert.equal(decide(g,{leader:6,difficulty:'expert'}).cardId,plan.card.uid);
});
test('NPC leaves enough dice for both mandatory types instead of choosing a doomed high score',()=>{
 const g=game([7,1,21],{module:5}),plan=sequencePlanner(g,{leader:5});
 assert(!plan.path.some(c=>c.id===7));assert.deepEqual(new Set(plan.path.map(c=>c.type)),new Set(['air','kick']));
 assert.equal(plan.path.reduce((n,c)=>n+c.cost,0),6);
});
test('second attempt changes from banking to chasing a higher opposing score',()=>{
 const g=landed(game([4,6]),[0]);g.bank.reroll=1;
 assert.equal(decide(g,{leader:0}).type,'stop');
 assert.equal(decide(g,{leader:10}).type,'continue');
 assert.equal(sequencePlanner(g,{leader:10}).goal,11);
});
test('a protected first attempt allows farming a module-end freeze reward',()=>{
 const g=landed(game([1,6],{prior:20}),[0]);
 assert.equal(decide(g,{leader:10}).type,'continue');
 assert.equal(sequencePlanner(g,{leader:10}).path[0].comboBonus.type,'freeze');
 const final={...g,module:5,route:[0,1,4,5,8,3]};
 assert.equal(decide(final,{leader:10}).type,'stop','no value assigned to a module-end token after the final attempt');
});
test('a protected first attempt still seeks the third-trick token and score bonus',()=>{
 const g=landed(game([1,10,9],{prior:20}),[0,1]);
 assert.equal(decide(g,{leader:10}).type,'continue');
 const plan=sequencePlanner(g,{leader:10});assert.equal(plan.path[0].id,9);assert(plan.utility>plan.stopUtility);
});
test('draft evaluates future visible module types and the large-air final bonus',()=>{
 const g=game([1,10,18],{attempt:0});g.phase='initial';
 const kick={...TRICKS[1],uid:'kick'},air={...kick,type:'air',uid:'air'};
 g.route=[2,2,6,5,6,11];const airEdge=draftValue(air,g)-draftValue(kick,g);
 g.route=[0,0,4,4,9,8];assert(airEdge>draftValue(air,g)-draftValue(kick,g));
 const big={...TRICKS[21],comboBonus:null,uid:'big'};
 g.route=[0,1,4,5,7,11];const largeWave=draftValue(big,g);
 g.route=[0,1,4,5,7,8];assert(largeWave>draftValue(big,g));
});
test('dice placement keeps the personal star for the later tricks when ordinary dice suffice',()=>{
 const g=game([1,1,10]);g.phase='rolled';g.active=g.hand[0].uid;
 g.dice.forEach((d,i)=>d.face=[1,2,3,4,5,6][i]);const before=JSON.stringify(g);
 assert(!bestPlacement(g,{leader:5}).includes(0));assert.equal(JSON.stringify(g),before);
});
test('expert NPC cannot replace a failed committed card with a better card',()=>{
 const g=game([6,1]);g.phase='rolled';g.active=g.hand[0].uid;g.dice.forEach(d=>d.face=2);
 const context={leader:2,difficulty:'expert'},before=JSON.stringify(g);
 assert.equal(decide(g,context).type,'fall');assert(!E.chooseCard(g,g.hand[1].uid));assert.equal(JSON.stringify(g),before);
});
test('planner decisions are read-only, deterministic after restore and do not peek at the deck or RNG',()=>{
 const g=game([1,4,9,16,18,19],{attempt:0});g.bank={adjust:1,reroll:1,freeze:1};const before=JSON.stringify(g);
 const first=decide(g,{leader:7});assert.equal(JSON.stringify(g),before);
 const restored=JSON.parse(before);assert.deepEqual(decide(restored,{leader:7}),first);
 for(const key of ['deck','rngState','randomSource'])Object.defineProperty(restored,key,{get(){throw Error('Hidden information read');}});
 assert.deepEqual(decide(restored,{leader:7}),first);
});
test('opponent target excludes own protected score and token value accounts for stock and remaining modules',()=>{
 const m=M.newMatch({seed:8,npcCount:1}),p=m.players[1];m.phase='playing';p.game.attempts=[{points:20}];m.players[0].game.attempts=[{points:8},{points:11}];
 assert.equal(npcContext(m,p).leader,11);
 const g=game([6]);const scarce=tokenValue('freeze',g);g.bank.freeze=5;assert(tokenValue('freeze',g)<scarce);
 g.attempt=1;g.module=g.route.length-1;assert(tokenValue('freeze',g)<scarce*.1);
});
