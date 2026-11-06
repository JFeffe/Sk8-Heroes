import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../public/match.js';
import * as E from '../public/engine.js';
import {decide} from '../public/npc.js';
import {MODULES} from '../public/data.js';
import {recap} from '../public/match-ui.js';
function cmd(m,type,extra={}){return M.dispatch(m,{playerId:M.currentPlayer(m).id,type,...extra});}
function ready(seed=7){const m=M.newMatch({npcCount:3,seed,length:4});while(m.phase==='initial')assert(cmd(m,'draft',{cardId:M.currentPlayer(m).game.offer[0]}));assert(M.startModule(m));return m;}
function advanceOne(m){
 if(m.phase==='recap')return M.advance(m);
 if(m.phase==='draft-summary')return M.startModule(m);
 if(M.currentPlayer(m).kind==='npc')return M.npcStep(m);
 const p=M.currentPlayer(m),action=decide(p.game);return M.dispatch(m,{playerId:p.id,...action});
}
function inventory(m){const cards=[...m.deck,...m.market.cards,...m.discard,...m.players.flatMap(p=>p.game.hand)];assert.equal(cards.length,85);assert.equal(new Set(cards.map(c=>c.uid)).size,85);for(const p of m.players){assert.strictEqual(p.game.deck,m.deck);assert(p.game.bank.adjust>=0&&p.game.bank.reroll>=0);assert.equal(p.game.dice.length,6);}}

test('players share one physical deck, route, turn rules and starting bonus stock',()=>{
 const m=ready();assert.equal(m.players.length,4);assert.equal(m.deck.length,61);inventory(m);
 for(const p of m.players){assert.deepEqual(p.game.route,m.route);assert.deepEqual(p.game.bank,{adjust:1,reroll:1,freeze:1});assert.deepEqual(p.game.hand.map(c=>c.type),['kick','kick','slide','slide','air','air']);}
 assert.equal(m.phase,'playing');assert.equal(M.currentPlayer(m).seat,m.order[0]);
 const saved=JSON.parse(JSON.stringify(m));assert(!('deck' in saved.players[0].game));inventory(M.restore(saved));
});
test('commands reject wrong actor, stale revision, wrong phase and malformed placement',()=>{
 const m=ready(),before=JSON.stringify(m);
 const wrong=m.players.find(p=>p.seat!==m.active).id;
 assert(!M.dispatch(m,{playerId:wrong,type:'pass'}));assert(!cmd(m,'pass',{revision:-1}));assert(!cmd(m,'draft',{cardId:m.deck[0].uid}));assert(!cmd(m,'place'));
 assert.equal(JSON.stringify(m),before);assert(cmd(m,'pass'));assert(cmd(m,'proceed'));assert.equal(M.currentPlayer(m).seat,m.order[1]);
 assert(!M.dispatch(m,{playerId:`p${m.order[0]}`,type:'roll'}));assert(advanceOne(m));
});
test('module ranks best whole attempt, keeps both attempts and awards the two highest distinct scores once',()=>{
 const m=ready();
 const samples=[[7,4],[8,0],[8,2],[0,0]];
 m.players.forEach((p,i)=>{p.game.history=[{best:Math.max(...samples[i]),attempts:samples[i].map(points=>({points,cards:[],reason:'stop'})),pv:0}];});
 assert(M.settleModule(m));const r=m.recaps[0];assert.deepEqual(r.rows.map(r=>r.id),['p1','p2','p0','p3']);assert.deepEqual(r.winners,['p1','p2']);
 assert.deepEqual(r.rows[2].attempts.map(a=>a.points),samples[0]);const award=MODULES[m.route[0]].pv;
 assert.deepEqual(r.runnersUp,['p0']);
 assert.deepEqual(m.players.map(p=>p.game.pv),[1,award,award,0]);assert(!M.settleModule(m));assert.deepEqual(m.players.map(p=>p.game.pv),[1,award,award,0]);
});
test('a 15–15–12–12 module pays all four riders and shows ranks 1, 1, 2, 2 after restore',()=>{
 const m=ready(),samples=[[15,2],[4,12],[9,15],[12,0]],prior=[4,5,6,7];
 for(const [i,p] of m.players.entries()){
  p.game.pv=prior[i];p.game.history=[{best:Math.max(...samples[i]),attempts:samples[i].map(points=>({points,cards:[],reason:'stop'})),pv:0}];
 }
 assert(M.settleModule(m));
 const restored=M.restore(JSON.parse(JSON.stringify(m))),r=restored.recaps[0],award=MODULES[m.route[0]].pv;
 assert.deepEqual(r.winners,['p0','p2']);assert.deepEqual(r.runnersUp,['p1','p3']);
 assert.deepEqual(r.rows.map(row=>row.gain),[award,award,1,1]);
 assert.deepEqual(restored.players.map(p=>p.game.pv),[4+award,6,6+award,8]);
 assert.deepEqual(restored.players.map(p=>p.game.history[0].pv),[award,1,award,1]);
 const html=recap(restored);
 assert.deepEqual([...html.matchAll(/class="rank">(\d)/g)].map(match=>Number(match[1])),[1,1,2,2]);
 assert.equal((html.match(/class="score-gain">\+1(?:\s|<)/g)||[]).length,2);
 assert.match(html,/data-score-from="7" data-score-to="8"/);
 assert.match(html,/2e place : 1 PV/);
});
test('equal best scores all win and leave no second distinct score',()=>{
 const m=ready();
 for(const p of m.players)p.game.history=[{best:15,attempts:[{points:15,cards:[],reason:'stop'},{points:0,cards:[],reason:'pass'}],pv:0}];
 assert(M.settleModule(m));assert.deepEqual(m.recaps[0].runnersUp,[]);
 assert(m.players.every(p=>p.game.pv===MODULES[m.route[0]].pv));
});
test('all zero scores never award victory points',()=>{
 const m=ready();for(const p of m.players)p.game.history=[{best:0,attempts:[{points:0,cards:[],reason:'fall'},{points:0,cards:[],reason:'pass'}],pv:0}];
 assert(M.settleModule(m));assert.deepEqual(m.recaps[0].winners,[]);assert.deepEqual(m.recaps[0].runnersUp,[]);assert(m.players.every(p=>p.game.pv===0));
});

test('one conserved point wins when all other attempts are zero, with no module minimum',()=>{
 const m=ready();for(const p of m.players)p.game.history=[{best:p.seat===0?1:0,attempts:[{points:p.seat===0?1:0,cards:[],reason:'stop'},{points:0,cards:[],reason:'fall'}],pv:0}];
 assert(M.settleModule(m));assert.deepEqual(m.recaps[0].winners,['p0']);assert.deepEqual(m.recaps[0].runnersUp,[]);assert.equal(m.players[0].game.pv,MODULES[m.route[0]].pv);
});
test('each token reserve caps independently and several tokens can still be spent in one attempt',()=>{
 const g=M.human(ready()).game;
 for(const type of E.BONUS_TYPES){while(g.bank[type]<E.BONUS_LIMIT)assert(E.addBonus(g,type));assert(!E.addBonus(g,type));}
 assert(E.chooseCard(g,E.options(g)[0].uid));assert(E.roll(g,()=>.3));
 assert(E.bonus(g,'adjust',0,1));assert(E.bonus(g,'adjust',0,1));assert.equal(g.bank.adjust,1);assert.equal(g.dice[0].face,4);
 assert(E.bonus(g,'reroll',0,0,()=>0));assert(E.bonus(g,'reroll',0,0,()=>.9));assert.equal(g.bank.reroll,1);assert.equal(g.dice[0].face,6);
 assert(!E.bonus(g,'adjust',0,1));assert.equal(g.bank.adjust,1);assert(E.addBonus(g,'adjust'));assert.equal(g.bank.adjust,2);
});
test('save/resume during NPC play preserves RNG, inventory, decisions and results',()=>{
 let m=ready(123);cmd(m,'pass');cmd(m,'proceed');cmd(m,'pass');cmd(m,'proceed');M.npcStep(m);M.npcStep(m);
 let copy=M.restore(JSON.parse(JSON.stringify(m)));
 for(let steps=0;m.phase!=='complete';steps++){
  assert(steps<1500);assert(advanceOne(m));assert(advanceOne(copy));assert.equal(JSON.stringify(m),JSON.stringify(copy));copy=M.restore(JSON.parse(JSON.stringify(copy)));
 }
 inventory(copy);assert.equal(m.recaps.length,4);assert(m.players.every(p=>p.game.history.length===4));
 for(const p of m.players)assert.equal(p.game.pv,p.game.history.reduce((n,h)=>n+h.pv,0));
});
test('100 complete competitive sessions finish with conserved cards and no duplicate awards',()=>{
 for(let seed=1;seed<=100;seed++){
  let m=M.newMatch({seed,npcCount:1+seed%3,length:seed%2?4:6});let steps=0;
  while(m.phase!=='complete'){
   assert(++steps<2000,`deadlock seed ${seed}`);assert(advanceOne(m));inventory(m);
   if(m.phase==='recap'){assert.equal(m.recaps.length,m.module+1);assert(m.recaps.at(-1).rows.every(r=>r.attempts.length===2));}
   m=M.restore(JSON.parse(JSON.stringify(m)));
  }
  assert.equal(m.recaps.length,m.route.length);for(const p of m.players)assert.equal(p.game.pv,m.recaps.reduce((n,r)=>n+r.rows.find(r=>r.id===p.id).gain,0));
  for(const r of m.recaps)for(const row of r.rows){
   const higher=new Set(r.rows.filter(other=>other.best>row.best).map(other=>other.best)).size;
   const expected=row.best<=0?0:higher===0?MODULES[r.module].pv:higher===1?1:0;
   assert.equal(row.gain,expected,`seed ${seed}, module ${r.module}, rider ${row.id}`);
  }
 }
});
