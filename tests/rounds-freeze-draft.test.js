import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../public/engine.js';
import * as M from '../public/match.js';
import {TRICKS,sortHand} from '../public/data.js';
const cmd=(m,type,extra={})=>M.dispatch(m,{playerId:M.currentPlayer(m).id,type,...extra});
function prepared(){const m=M.newMatch({seed:42,length:4});while(m.phase==='initial')assert(cmd(m,'draft',{cardId:M.currentPlayer(m).game.offer[0]}));assert(M.startModule(m));return m;}
function turn(){const g=E.newGame({},()=>.3);g.route=[3];g.phase='select';g.hand=[0,1,9,10].map((id,i)=>({...TRICKS[id],pattern:'at-most',threshold:6,cost:2,comboBonus:null,uid:`fixture-${i}`}));return g;}
function land(g,index){assert(E.chooseCard(g,g.hand[index].uid));assert(E.roll(g,()=>.3));assert(E.place(g,E.freeDice(g).slice(0,2).map(d=>d.id)));assert(E.land(g));}

test('random order is a permutation, first attempts precede second attempts, and each module rotates the first seat',()=>{
 const firsts=new Set();for(let seed=1;seed<=30;seed++){const m=M.newMatch({seed});assert.deepEqual([...m.order].sort(),[0,1,2,3]);firsts.add(m.order[0]);}assert.equal(firsts.size,4);
 const m=prepared(),order=[...m.order],seen=[];
 for(let round=0;round<2;round++)for(const seat of order){assert.equal(m.round,round);assert.equal(m.active,seat);assert.equal(M.currentPlayer(m).game.attempt,round);seen.push([round,seat]);assert(cmd(m,'pass'));assert(cmd(m,'proceed'));}
 assert.equal(m.phase,'recap');assert.equal(seen.length,8);assert(M.advance(m));assert.deepEqual(m.order,order);assert.deepEqual(m.draftOrder,order);
 while(m.phase==='recovery')assert(cmd(m,'draft-pair',{cardId:m.market.cards[0].uid,tokenId:m.market.tokens[0].id}));
 assert.equal(m.phase,'draft-summary');const restored=M.restore(JSON.parse(JSON.stringify(m)));assert.deepEqual(restored.order,m.order);
 assert(M.startModule(restored));assert.equal(restored.module,1);assert.equal(restored.active,order[1]);assert.equal(restored.round,0);
});

test('initial draft requires six cards for every player, forbids bonus and skip, and offers no token',()=>{
 const m=M.newMatch({seed:12});let step=0;
 while(m.phase==='initial'){
  const g=M.currentPlayer(m).game;assert.equal(g.offer.length,3);assert.equal(g.bonusOffer,null);
  const before=JSON.stringify(m);assert(!cmd(m,'draft-bonus',{choice:'freeze'}));assert(!cmd(m,'draft-skip'));assert.equal(JSON.stringify(m),before);
  assert(!E.chooseBonus(g,'freeze'));assert(!E.skipDraft(g));assert(cmd(m,'draft',{cardId:g.offer[0]}));step++;
 }
 assert.equal(step,24);assert.equal(m.phase,'draft-summary');assert.equal(m.draftLog.length,24);
 for(const p of m.players){assert.equal(p.game.hand.length,6);assert.equal(p.game.draftPick,6);}
 assert.equal(m.deck.length,61);assert(M.startModule(m));
});

test('without an eligible card the player falls and both attempts can finish',()=>{
 const m=prepared();for(const p of m.players)p.game.hand=[];
 for(let i=0;i<8;i++){assert(cmd(m,'fall'));assert.equal(M.currentPlayer(m).game.reason,'fall');assert(cmd(m,'proceed'));}
 assert.equal(m.phase,'recap');assert(m.recaps[0].rows.every(r=>r.best===0));
});

test('changing cards before rolling preserves dice and is forbidden after rolling',()=>{
 const g=turn(),dice=structuredClone(g.dice);assert(E.chooseCard(g,g.hand[0].uid));assert(E.chooseCard(g,g.hand[1].uid));assert.equal(g.active,g.hand[1].uid);assert.deepEqual(g.dice,dice);assert.equal(g.rolls,0);
 assert(!E.chooseCard(g,'missing'));assert(E.roll(g,()=>.3));const before=JSON.stringify(g);assert(!E.chooseCard(g,g.hand[0].uid));assert.equal(JSON.stringify(g),before);
});

test('freeze commits continuation, survives saving and stays on an unused free die',()=>{
 let g=turn();assert(!E.bonus(g,'freeze',0));land(g,0);const locked=structuredClone(g.dice.slice(0,2));g.dice[5].face=1;
 assert(!E.bonus(g,'freeze',0));assert(E.bonus(g,'freeze',5));assert.equal(g.bank.freeze,0);assert.equal(g.phase,'select');assert(!E.stop(g));assert(!E.pass(g));assert(!E.bonus(g,'freeze',4));
 g=JSON.parse(JSON.stringify(g));assert(E.chooseCard(g,g.hand[1].uid));assert(E.chooseCard(g,g.hand[2].uid));let calls=0;assert(E.roll(g,()=>{calls++;return .9;}));assert.equal(calls,3);assert.equal(g.dice[5].face,1);assert.deepEqual(g.dice.slice(0,2),locked);assert.deepEqual(g.frozen,[5]);
 assert(E.place(g,[2,3]));assert(E.land(g));assert(E.continueRun(g));assert(E.chooseCard(g,g.hand[1].uid));calls=0;assert(E.roll(g,()=>{calls++;return .9;}));assert.equal(calls,1);assert.equal(g.dice[5].face,1);
});

test('freeze cannot spend absent stock or commit an impossible continuation',()=>{
 const g=turn();land(g,0);g.bank.freeze=0;const before=JSON.stringify(g);assert(!E.bonus(g,'freeze',3));assert.equal(JSON.stringify(g),before);
 g.bank.freeze=3;g.hand=g.hand.slice(0,1);assert(!E.bonus(g,'freeze',3));assert.equal(g.bank.freeze,3);
});

test('hand sort always groups Kick, Slide, Air without mutating the source',()=>{
 const cards=[32,16,0,34,1,18].map(id=>({...TRICKS[id],uid:`${id}`})),before=cards.map(c=>c.id);
 assert.deepEqual(sortHand(cards).map(c=>c.type),['kick','kick','slide','slide','air','air']);assert.deepEqual(cards.map(c=>c.id),before);
});
