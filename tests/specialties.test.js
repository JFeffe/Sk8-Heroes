import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../public/match.js';
import * as E from '../public/engine.js';
import {SPECIALTIES,specialtyActions,applySpecialty} from '../public/specialties.js';
import {skaterMat,specialtyToken} from '../public/physical-table.js';
import {TRICKS} from '../public/data.js';
import {npcGameView} from '../public/npc-view.js';
import {decide} from '../public/npc.js';
const cmd=(m,type,extra={})=>M.dispatch(m,{playerId:M.currentPlayer(m).id,type,...extra});
function fixture(skaterId,mode='advanced'){
 const m=M.newMatch({skaterId,mode,seed:601,npcCount:3});
 while(m.phase==='initial')assert(cmd(m,'draft',{cardId:M.currentPlayer(m).game.offer[0]}));
 assert(M.startModule(m));m.active=0;m.order=[0,1,2,3];m.position=0;
 return {m,g:m.players[0].game};
}
const inventory=m=>[...m.deck,...m.market.cards,...m.players.flatMap(p=>[...p.game.hand])];
function rolled(g){g.phase='rolled';g.rolls=1;g.active=g.hand[0].uid;g.dice.forEach(d=>d.face=4);}

test('Base has no usable specialties, and only Advanced skater cards show powers and tokens',()=>{
 for(const skater of Object.keys(SPECIALTIES)){
  const {m,g}=fixture(skater,'base');rolled(g);const before=JSON.stringify(m);
  assert.deepEqual(specialtyActions(g),[]);assert(!cmd(m,'specialty',{choice:'adjust',bonusType:'freeze',id:0,delta:2}));assert(!cmd(m,'specialty-start',{cardId:g.hand[0].uid}));assert.equal(JSON.stringify(m),before);
  assert(!skaterMat(m.players[0]).includes('skater-specialty'));assert.equal(specialtyToken(m.players[0]),'');
  const advanced=fixture(skater).m.players[0];assert(skaterMat(advanced).includes(SPECIALTIES[skater].name));assert(specialtyToken(advanced,true).includes(skater==='sol'?'Passif':'Disponible'));
 }
 assert.throws(()=>M.newMatch({mode:'unknown'}));
});
test('Troc validates caps and ownership, spends once across both attempts, survives restore and refreshes next module',()=>{
 let {m,g}=fixture('neo');g.bank={adjust:2,reroll:1,freeze:3};
 const action={type:'specialty',bonusType:'freeze',choice:'reroll'};
 assert(!M.dispatch(m,{...action,playerId:'p1'}));assert(!cmd(m,'specialty',{bonusType:'adjust',choice:'freeze'}));
 assert(cmd(m,action.type,action));assert.deepEqual(g.bank,{adjust:2,reroll:2,freeze:2});assert(g.specialty.used);
 assert(!cmd(m,action.type,action));m=M.restore(JSON.parse(JSON.stringify(m)));g=m.players[0].game;assert(g.specialty.used);
 assert(E.pass(g));assert(E.proceed(g));assert.equal(g.attempt,1);assert(g.specialty.used);assert.deepEqual(specialtyActions(g),[]);
 E.nextModule(g);assert(!g.specialty.used);assert(specialtyActions(g).length);assert(specialtyToken(m.players[0],true).includes('Disponible'));
});
test('lucky die rolls only the available personal die, cannot roll a frozen/locked die, and spends no ordinary token',()=>{
 const {m,g}=fixture('ruby');rolled(g);const own=g.dice.find(d=>d.color==='red'),bank={...g.bank};
 assert(!cmd(m,'specialty',{id:0}));g.frozen=[own.id];assert(!cmd(m,'specialty',{id:own.id}));g.frozen=[];own.locked='x';assert(!cmd(m,'specialty',{id:own.id}));own.locked=null;
 let draws=0;Object.defineProperty(m,'randomSource',{value:()=>{draws++;return 0;}});g.pending=[own.id];
 assert(cmd(m,'specialty',{id:own.id}));assert.equal(draws,1);assert.equal(own.face,1);assert(g.dice.filter(d=>d!==own).every(d=>d.face===4));assert.deepEqual(g.bank,bank);assert.deepEqual(g.pending,[]);assert(g.specialty.used);
});
test('Trick signature returns one secured card on attempt two, preserves the first score and physical inventory across restore',()=>{
 let {m,g}=fixture('jade');const uids=inventory(m).map(c=>c.uid).sort();
 assert.deepEqual(specialtyActions(g),[]);
 const card=E.options(g)[0];assert(cmd(m,'choose',{cardId:card.uid}));assert(E.roll(g,()=>.5));assert(cmd(m,'auto'));assert(cmd(m,'land'));if(g.phase==='decision')assert(cmd(m,'stop'));
 const first=structuredClone(g.sequences[0]),score=g.score;assert(g.secured.includes(card.uid));assert(!cmd(m,'specialty',{cardId:card.uid}));
 assert(cmd(m,'proceed'));for(let i=0;i<3;i++){assert(cmd(m,'pass'));assert(cmd(m,'proceed'));}
 assert.equal(M.currentPlayer(m).id,'p0');assert.equal(g.attempt,1);assert(!E.eligible(g,card.uid));
 assert(!cmd(m,'specialty',{cardId:'invalid'}));assert(!cmd(m,'specialty',{cardId:g.hand.find(c=>c.uid!==card.uid).uid}));
 assert(cmd(m,'specialty',{cardId:card.uid}));assert(E.eligible(g,card.uid));assert.equal(g.specialty.returnedCard,card.uid);assert(g.specialty.used);
 assert.deepEqual(g.sequences[0],first);assert.equal(g.attempts[0].points,score);assert.deepEqual(inventory(m).map(c=>c.uid).sort(),uids);
 m=M.restore(JSON.parse(JSON.stringify(m)));g=m.players[0].game;assert(!cmd(m,'specialty',{cardId:card.uid}));assert(E.eligible(g,card.uid));
 assert(cmd(m,'choose',{cardId:card.uid}));assert(E.roll(g,()=>.5));assert(cmd(m,'auto'));assert(cmd(m,'land'));if(g.phase==='decision')assert(cmd(m,'stop'));
 assert.equal(g.attempts.length,2);assert.deepEqual(g.sequences[0],first);assert(g.secured.includes(card.uid));assert.deepEqual(inventory(m).map(c=>c.uid).sort(),uids);
 E.nextModule(g);assert(!g.specialty.used);assert(!g.specialty.returnedCard);assert.deepEqual(specialtyActions(g),[]);
});
test('Trick signature cannot recover cards after a first-attempt fall or after the second attempt ends',()=>{
 const {m,g}=fixture('jade');g.attempt=1;g.attempts=[{points:0,reason:'fall'}];assert.deepEqual(specialtyActions(g),[]);assert(!cmd(m,'specialty',{cardId:g.hand[0].uid}));
 g.sequences=[{attempt:0,entries:[{card:g.hand[0].uid}]}];g.secured=[g.hand[0].uid];g.phase='result';assert.deepEqual(specialtyActions(g),[]);
});
test('a signature trick earns its deferred physical-card reward only once even when banked on both attempts',()=>{
 const g=E.newGame({mode:'advanced',skaterId:'jade'},()=>.4),card={...TRICKS.find(c=>c.name==='Nollie'),uid:'signature-nollie'};
 g.hand=[card];g.route=[3];g.phase='select';
 const bank=()=>{assert(E.chooseCard(g,card.uid));assert(E.roll(g,()=>.5));assert(E.autoPlace(g));assert(E.land(g));if(g.phase==='decision')assert(E.stop(g));};
 bank();assert.equal(g.earned.adjust,1);assert(E.proceed(g));assert(applySpecialty(g,{type:'specialty',cardId:card.uid}));bank();assert.equal(g.earned.adjust,1);
 assert(E.proceed(g));assert.equal(g.bank.adjust,2);assert.equal(g.trickRewards.length,1);assert.equal(g.history[0].attempts.length,2);
});
test('Sol passively stores four adjustments across attempts, modules and restore, with three of each other type',()=>{
 const {m,g}=fixture('sol');assert.equal(g.bank.adjust,1);g.bank={adjust:3,reroll:3,freeze:3};
 assert.equal(E.bonusLimit(g,'adjust'),4);assert.equal(E.bonusSlots(g,'adjust'),1);assert(E.canAddBonus(g,'adjust'));
 assert(!E.addBonus(g,'reroll'));assert(!E.addBonus(g,'freeze'));
 g.phase='result';g.last={};g.attempts=[g.last];g.sequences=[{}];g.sequenceReward={pending:true,remaining:1,total:1,choices:[]};
 E.fitSequenceReward(g);assert(g.sequenceReward.pending);assert(cmd(m,'claim-sequence',{choice:'adjust'}));assert.equal(g.bank.adjust,4);assert(!E.addBonus(g,'adjust'));
 const restored=M.restore(JSON.parse(JSON.stringify(m)));assert.equal(restored.players[0].game.bank.adjust,4);
 rolled(g);assert.deepEqual(specialtyActions(g),[]);assert(!cmd(m,'specialty',{id:0,delta:1}));
 assert(E.bonus(g,'adjust',0,1));assert.equal(g.bank.adjust,3);assert.equal(g.used.adjust,1);assert(E.addBonus(g,'adjust'));
 g.phase='select';assert(E.pass(g));assert(E.proceed(g));assert.equal(g.bank.adjust,4);E.nextModule(g);assert.equal(g.bank.adjust,4);assert.equal(E.bonusLimit(g,'adjust'),4);
 const html=skaterMat(m.players[0]);assert(html.includes('4/4'));assert(html.includes('Passif'));assert(!html.includes('1 fois par module'));
 for(const skater of Object.keys(SPECIALTIES))for(const mode of ['base','advanced']){const x=fixture(skater,mode).g;x.bank.adjust=3;assert.equal(E.canAddBonus(x,'adjust'),skater==='sol'&&mode==='advanced');}
});

test('Bon rythme requires a banked two-trick sequence of different types and pays after the normal reward',()=>{
 const {m,g}=fixture('milo');g.phase='result';g.score=8;g.landed=[{card:g.hand[0].uid},{card:g.hand[1].uid}];
 assert.deepEqual(specialtyActions(g),[]);g.landed[1].card=g.hand.find(c=>c.type!==g.hand[0].type).uid;
 g.sequenceReward={pending:true,choices:[],remaining:1,total:1};assert.deepEqual(specialtyActions(g),[]);g.last={points:8};g.attempts=[{points:8}];g.sequences=[{points:8}];
 assert(cmd(m,'claim-sequence',{choice:'freeze',advance:true}));assert.equal(M.currentPlayer(m).id,'p0');assert.equal(g.phase,'result');
 assert(cmd(m,'specialty',{choice:'freeze'}));assert.equal(g.bank.freeze,3);assert(g.specialty.used);assert.equal(g.attempts[0].specialtyReward,'freeze');
});
test('Rebond refunds only a spent token after a fall and prevents auto-advance from skipping the choice',()=>{
 const {m,g}=fixture('iris');rolled(g);g.hand[0]={...g.hand[0],pattern:'exact',values:[6,6],cost:2};g.dice.forEach(d=>d.face=2);g.used.reroll=1;g.bank.reroll=0;
 assert(cmd(m,'fall',{advance:true}));assert.equal(M.currentPlayer(m).id,'p0');assert.equal(g.phase,'result');assert(!cmd(m,'specialty',{choice:'adjust'}));
 assert(cmd(m,'specialty',{choice:'reroll'}));assert.equal(g.bank.reroll,1);assert.equal(g.score,0);assert(g.specialty.used);assert(cmd(m,'proceed'));assert.notEqual(M.currentPlayer(m).id,'p0');
});
test('NPC uses an eligible Rebond instead of losing it on proceed',()=>{
 const {g}=fixture('iris');g.phase='result';g.score=0;g.reason='fall';g.used.freeze=1;g.bank.freeze=0;
 assert.deepEqual(decide(npcGameView(g)),{type:'specialty',choice:'freeze',label:'Récupérer Gel'});
});
test('Advanced NPC sessions complete all six modules with conserved cards, capped stocks and two attempts',()=>{
 for(const seed of [601,602]){
  let m=M.newMatch({mode:'advanced',seed,npcDifficulty:'normal'});m.players.forEach(p=>p.kind='npc');let steps=0;
  while(m.phase!=='complete'&&steps++<5000){
   if(m.phase==='draft-summary')assert(M.startModule(m));else if(m.phase==='recap')assert(M.advance(m));else assert(M.npcStep(m));
   assert.equal(inventory(m).length,85);assert.equal(new Set(inventory(m).map(c=>c.uid)).size,85);
   assert(m.players.every(p=>Object.entries(p.game.bank).every(([t,n])=>n>=0&&n<=E.bonusLimit(p.game,t))));
   if(steps%47===0)m=M.restore(JSON.parse(JSON.stringify(m)));
  }
  assert.equal(m.phase,'complete');assert.equal(m.recaps.length,6);assert(m.players.every(p=>p.game.history.every(h=>h.attempts.length===2)));
 }
});
