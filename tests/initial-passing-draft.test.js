import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../public/match.js';
import * as E from '../public/engine.js';
import {npcContext} from '../public/npc-strategy.js';
const pick=(m,p,cardId=p.game.offer[0],extra={})=>M.dispatch(m,{playerId:p.id,type:'draft',cardId,draftRound:m.draftRound,...extra});
test('initial packets are separate physical cards of one type, and two remaining cards pass right',()=>{
 const m=M.newMatch({seed:123}),packets=structuredClone(m.initialPackets),choices={};
 assert.equal(new Set(Object.values(packets).flat()).size,12);
 for(const p of m.players){assert.equal(p.game.offer.length,3);assert(p.game.offer.every(uid=>m.deck.find(c=>c.uid===uid).type==='kick'));choices[p.id]=p.game.offer[0];}
 const rng=m.rngState;assert(pick(m,m.players[3]));assert.equal(m.rngState,rng);assert.equal(m.draftLog.length,0);
 for(const p of m.players.slice(0,3))assert(pick(m,p));
 assert.equal(m.draftRound,1);assert.equal(m.draftLog.length,4);
 for(let i=0;i<m.order.length;i++){
  const receiver=m.players[m.order[(i+1)%m.order.length]],sender=m.players[m.order[i]];
  const passed=packets[sender.id].filter(uid=>uid!==choices[sender.id]);
  assert(passed.every(uid=>receiver.game.offer.includes(uid)));assert.equal(receiver.game.offer.length,3);
 }
 assert.equal(m.deck.length+m.players.flatMap(p=>p.game.hand).length,85);
});
test('choice arrival order cannot affect passed cards, RNG, revealed choices or later waves',()=>{
 const a=M.newMatch({seed:124}),b=M.newMatch({seed:124});
 for(let wave=0;wave<6;wave++){
  const choices=Object.fromEntries(a.players.map(p=>[p.id,p.game.offer[wave%3]]));
  for(const p of a.players)assert(pick(a,p,choices[p.id]));
  for(const p of [...b.players].reverse())assert(pick(b,p,choices[p.id]));
  for(const key of ['deck','initialPackets','draftLog','rngState','order'])assert.deepEqual(a[key],b[key]);
 }
 assert.equal(a.phase,'draft-summary');for(const p of a.players)assert.deepEqual(p.game.hand.map(c=>c.type),['kick','kick','slide','slide','air','air']);
 assert(M.startModule(a));
});
test('partial waves restore and reject double choices, someone else’s cards and stale waves',()=>{
 let m=M.newMatch({seed:125});const p=m.players[2],uid=p.game.offer[0],revision=m.revision;
 assert(!pick(m,p,m.players[0].game.offer[0]));assert(pick(m,p,uid));assert(!pick(m,p,uid));
 m=M.restore(JSON.parse(JSON.stringify(m)));assert.equal(m.initialSelections[p.id],uid);assert(!M.canInitialPick(m,p.id));
 const q=m.players[0];assert(pick(m,q,q.game.offer[0],{revision}));
 for(const other of m.players.filter(p=>M.canInitialPick(m,p.id)))assert(pick(m,other));
 const before=JSON.stringify(m);assert(!pick(m,m.players[0],m.players[0].game.offer[0],{draftRound:0,revision}));assert.equal(JSON.stringify(m),before);
});
test('NPCs pick independently of a waiting human without seeing anyone’s unrevealed pick',()=>{
 const m=M.newMatch({seed:126});m.active=0;const before=m.players[0].game.offer.slice();
 while(M.hasNpcTurn(m))assert(M.npcStep(m));
 assert.equal(m.draftRound,0);assert.deepEqual(m.players[0].game.offer,before);assert.equal(Object.keys(m.initialSelections).length,3);
 assert.equal(m.draftLog.length,0);assert.equal(npcContext(m,m.players[1]).leader,0);
 assert(pick(m,m.players[0]));assert.equal(m.draftRound,1);
});
test('an older sequential starting draft can still be resumed and completed',()=>{
 const old=M.newMatch({seed:127});delete old.initialDraft;delete old.initialPackets;delete old.initialSelections;
 old.active=old.order[0];for(const p of old.players)p.game.offer=[];E.offer(M.currentPlayer(old).game,()=>.4);
 const m=M.restore(JSON.parse(JSON.stringify(old)));assert(!M.passingDraft(m));
 while(m.phase==='initial'){const p=M.currentPlayer(m);assert(M.dispatch(m,{playerId:p.id,type:'draft',cardId:p.game.offer[0]}));}
 assert.equal(m.phase,'draft-summary');assert(m.players.every(p=>p.game.hand.length===6));assert(M.startModule(m));
});
