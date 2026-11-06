import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../public/engine.js';
import {decide} from '../public/npc.js';
import {signatureChoice,chooseToken,sequencePlanner} from '../public/npc-strategy.js';
import {applySpecialty} from '../public/specialties.js';

const card=(id,extra={})=>({id:100+id,uid:'power-'+id,name:'Test '+id,type:'kick',tier:'base',cost:2,points:4,pattern:'at-most',threshold:6,...extra});
function game(skaterId){
 const g=E.newGame({mode:'advanced',skaterId},()=>.4);
 Object.assign(g,{phase:'select',route:[8,0,4,5,7,11],module:0,hand:[],bank:{adjust:0,reroll:0,freeze:0}});return g;
}
function signature(){
 const g=game('jade');g.attempt=1;g.attempts=[{points:5}];
 g.hand=[card(0,{cost:4,points:8}),card(1),card(2),card(3)];
 g.secured=g.hand.slice(0,2).map(c=>c.uid);g.sequences=[{attempt:0,entries:g.secured.map(card=>({card}))}];return g;
}
test('Jade recovers the affordable signature after two tricks, rather than the higher-value four-die card',()=>{
 const g=signature();g.landed=g.hand.slice(2).map((c,i)=>({card:c.uid,dice:[i*2,i*2+1]}));g.phase='decision';
 for(let i=0;i<4;i++)g.dice[i].locked=g.hand[2+Math.floor(i/2)].uid;
 const before=JSON.stringify(g),action=decide(g,{difficulty:'expert',leader:10});
 assert.equal(action.type,'specialty');assert.equal(action.cardId,g.hand[1].uid);assert.equal(JSON.stringify(g),before);
 assert(applySpecialty(g,action));assert.equal(decide(g,{difficulty:'expert',leader:10}).type,'continue');
});
test('Jade keeps her signature when it cannot improve the record or produce a new reward',()=>{
 const g=signature();g.route=[8];g.attempts=[{points:35}];assert.equal(signatureChoice(g,{leader:35}),null);assert.equal(decide(g,{difficulty:'expert',leader:35}).type,'pass');
});
test('Jade does not forecast the same physical-card token a second time',()=>{
 const g=signature();g.route=[8,0];g.hand=[card(0,{comboBonus:{kind:'reward',type:'freeze'}})];g.secured=[g.hand[0].uid];g.attempts=[{points:35}];g.sequences=[{attempt:0,entries:[{card:g.hand[0].uid}]}];
 assert.equal(signatureChoice(g,{leader:35}),null);
});
test('Sol NPC accepts a fourth adjustment when other reserves are full, then respects the new cap',()=>{
 const g=game('sol');g.bank={adjust:3,reroll:3,freeze:3};
 assert.equal(chooseToken(E.BONUS_TYPES,g),'adjust');assert.deepEqual(E.draftBonusChoices(g,[{type:'adjust'},{type:'freeze'}]),[{type:'adjust'}]);
 assert(E.addBonus(g,'adjust'));assert(!E.canAddBonus(g,'adjust'));assert.equal(E.bonusSlots(g,'adjust'),0);
});

test('Sol NPC pays for corrections and never forecasts or activates a free correction',()=>{
 const g=game('sol');g.hand=[card(0,{pattern:'at-least',threshold:4})];g.phase='rolled';g.active=g.hand[0].uid;g.rolls=1;g.dice.forEach(d=>d.face=3);g.dice[0].face=4;
 assert.equal(decide(g,{difficulty:'expert'}).type,'fall');g.bank.adjust=4;
 const before=JSON.stringify(g),action=decide(g,{difficulty:'expert'});assert.equal(action.type,'bonus');assert.equal(action.bonusType,'adjust');assert.equal(JSON.stringify(g),before);
 assert(E.bonus(g,action.bonusType,action.id,action.delta));assert.equal(g.bank.adjust,3);assert.equal(g.used.adjust,1);
 g.bank.adjust=0;g.dice.forEach(d=>d.face=3);g.dice[0].face=4;g.phase='select';g.reuseRoll=true;assert.equal(sequencePlanner(g).p,0);
});
