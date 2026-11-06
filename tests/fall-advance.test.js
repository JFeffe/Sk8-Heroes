import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../public/match.js';
import * as E from '../public/engine.js';

const command=(m,type,extra={})=>M.dispatch(m,{playerId:M.currentPlayer(m).id,type,...extra});
function ready(){
 const m=M.newMatch({seed:37,length:4});
 while(m.phase==='initial')assert(command(m,'draft',{cardId:M.currentPlayer(m).game.offer[0]}));
 assert(M.startModule(m));return m;
}
function missedRoll(m){
 const g=M.currentPlayer(m).game;
 for(const card of E.options(g))for(let face=2;face<=6;face++){
  if(E.findMatch(card,g.dice.map(d=>({...d,face})),E.wildColor(g)))continue;
  Object.defineProperty(m,'randomSource',{value:()=>(face-.5)/6,configurable:true});
  assert(command(m,'choose',{cardId:card.uid}));assert(command(m,'roll'));assert(E.canFall(g));return g;
 }
 throw Error('No missed roll available in fixture');
}

test('one fall command advances each seat, then the second attempt, then the module recap',()=>{
 const m=ready(),order=[...m.order];
 for(let turn=0;turn<order.length*2;turn++){
  assert.equal(m.active,order[turn%order.length]);assert.equal(m.round,Math.floor(turn/order.length));
  const g=missedRoll(m),id=M.currentPlayer(m).id,revision=m.revision;
  assert(command(m,'fall',{advance:true}));assert.equal(m.revision,revision+1);
  assert.equal(g.attempts.length,Math.floor(turn/order.length)+1);
  assert.equal(g.attempts.at(-1).reason,'fall');assert.equal(g.attempts.at(-1).points,0);
  assert.equal(M.matchSummary(m).players.find(p=>p.id===id).falls,Math.floor(turn/order.length)+1);
  if(turn<order.length*2-1){assert.equal(m.phase,'playing');assert.equal(m.active,order[(turn+1)%order.length]);}
 }
 assert.equal(m.phase,'recap');assert.equal(m.recaps.length,1);assert.deepEqual(m.recaps[0].winners,[]);
 assert(m.recaps[0].rows.every(r=>r.attempts.length===2));assert(m.players.every(p=>p.game.pv===0));
});

test('immediate handoff preserves the same cards, tokens, dice and statistics as fall then proceed',()=>{
 const m=ready(),g=missedRoll(m);
 assert(command(m,'bonus',{bonusType:'freeze',id:0}));
 const conventional=M.restore(JSON.parse(JSON.stringify(m)));
 assert(command(conventional,'fall'));assert(command(conventional,'proceed'));
 assert(command(m,'fall',{advance:true}));
 assert.deepEqual(m.players,conventional.players);assert.deepEqual(m.statistics,conventional.statistics);
 assert.equal(m.rngState,conventional.rngState);assert.equal(m.active,conventional.active);
 assert.equal(g.bank.freeze,0);assert.equal(M.matchSummary(m).players.find(p=>p.id===m.players[m.order[0]].id).tokens.spent.freeze,1);
 assert.deepEqual(M.restore(JSON.parse(JSON.stringify(m))).players,m.players);
});

test('automatic handoff cannot bypass fall legality, turn ownership or stale revisions',()=>{
 const m=ready(),before=JSON.stringify(m);
 assert(!command(m,'fall',{advance:true}));assert.equal(JSON.stringify(m),before);
 missedRoll(m);const actor=M.currentPlayer(m).id,other=m.players.find(p=>p.id!==actor).id,rolled=JSON.stringify(m);
 assert(!M.dispatch(m,{playerId:other,type:'fall',advance:true}));
 assert(!command(m,'fall',{advance:true,revision:-1}));assert.equal(JSON.stringify(m),rolled);
 assert(command(m,'fall',{advance:true}));const handedOff=JSON.stringify(m);
 assert(!M.dispatch(m,{playerId:actor,type:'fall',advance:true}));assert.equal(JSON.stringify(m),handedOff);
});
