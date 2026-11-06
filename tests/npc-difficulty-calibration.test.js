import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../public/engine.js';
import * as M from '../public/match.js';
import {decide} from '../public/npc.js';
import {decide as previousDecide} from './fixtures/npc-052/npc.js';
import {npcDifficulty} from '../public/npc-difficulty.js';
import {npcContext,draftValue} from '../public/npc-strategy.js';
import {npcGameView} from '../public/npc-view.js';

function fixture(){
 const g=E.newGame({skaterId:'neo'},()=>.4);g.phase='select';g.route=[0,1,4,5,7,8];g.module=5;g.attempt=1;g.attempts=[{points:0}];g.bank={adjust:2,reroll:2,freeze:2};
 g.hand=[0,1,2].map(i=>({id:100+i,uid:'level-'+i,name:'Test '+i,type:'kick',tier:'base',points:5,cost:2,pattern:'at-most',threshold:6,comboBonus:null}));return g;
}
test('normal does not inherit full three-card scoring search from a known leader',()=>{
 const g=fixture();assert.equal(decide(g,{difficulty:'normal',leader:13}).type,'pass');assert.equal(decide(g,{difficulty:'expert',leader:13}).type,'choose');
});
test('normal still sees three free tricks when they provide a useful net token',()=>{
 const g=fixture();g.module=0;g.route[0]=8;g.hand.forEach(c=>c.points=1);assert.equal(decide(g,{difficulty:'normal',leader:13}).type,'choose');
 g.bank={adjust:3,reroll:3,freeze:3};assert.equal(decide(g,{difficulty:'normal',leader:13}).type,'pass');
});
test('normal reserves at most two bonus uses per attempt while Expert can invest more',()=>{
 const g=fixture();g.phase='rolled';g.active=g.hand[0].uid;g.hand=g.hand.slice(0,1);Object.assign(g.hand[0],{points:14,pattern:'at-least',threshold:4});g.dice.forEach((d,i)=>d.face=[3,4,2,2,2,2][i]);g.used={adjust:0,reroll:1,freeze:1};
 assert.equal(decide(g,{difficulty:'normal',leader:13}).type,'fall');assert.equal(decide(g,{difficulty:'expert',leader:13}).bonusType,'adjust');
 assert(E.bonus(g,'adjust',0,1),'the shared engine still permits a third token; the budget is an NPC decision');
});
test('Détente uses a smaller bonus budget than Normal',()=>{
 const g=fixture();g.phase='rolled';g.active=g.hand[0].uid;g.hand=g.hand.slice(0,1);Object.assign(g.hand[0],{points:14,pattern:'at-least',threshold:4});g.dice.forEach((d,i)=>d.face=[3,4,2,2,2,2][i]);g.used.freeze=1;
 assert.equal(decide(g,{difficulty:'easy',leader:13}).type,'fall');assert.equal(decide(g,{difficulty:'normal',leader:13}).bonusType,'adjust');
});
test('normal draft plans nearby modules while Expert retains full-route planning',()=>{
 const g=fixture();g.phase='initial';g.module=0;const card={...g.hand[0],cost:3};
 g.route=[0,1,4,5,7,11];const nearby=draftValue(card,g,npcDifficulty('normal')),expert=draftValue(card,g,npcDifficulty('expert'));
 g.route[5]=8;assert.equal(draftValue(card,g,npcDifficulty('normal')),nearby);assert(draftValue(card,g,npcDifficulty('expert'))<expert);
});
test('Expert retains exactly the reference initial draft decisions on three routes',()=>{
 for(const seed of [104,305,614]){
  const m=M.newMatch({seed,npcDifficulty:'expert'});let steps=0;
  while(m.phase==='initial'){
   assert(++steps<=24);
   const p=M.currentPlayer(m),view=npcGameView(p.game),context=npcContext(m,p),action=decide(view,context);assert.deepEqual(action,previousDecide(view,context));assert(M.dispatch(m,{playerId:p.id,...action}));
  }
 }
});
