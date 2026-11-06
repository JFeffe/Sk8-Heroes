import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../public/engine.js';
import * as M from '../public/match.js';
import {TRICKS} from '../public/data.js';
const cmd=(m,type,extra={})=>M.dispatch(m,{playerId:M.currentPlayer(m).id,type,...extra});
function match(){const m=M.newMatch({seed:21,length:4});while(m.phase==='initial')assert(cmd(m,'draft',{cardId:M.currentPlayer(m).game.offer[0]}));M.startModule(m);return m;}
function recap(){const m=match(),banks=m.players.map(p=>structuredClone(p.game.bank));for(let i=0;i<8;i++){assert(cmd(m,'pass'));assert(cmd(m,'proceed'));}assert.deepEqual(m.players.map(p=>p.game.bank),banks);assert.equal(m.phase,'recap');return m;}
const inventory=m=>[...m.deck,...m.discard,...m.market.cards,...m.players.flatMap(p=>p.game.hand)];
function turn(types=['kick','kick','slide','air']){const g=E.newGame({},()=>.3);g.route=[4,3];g.phase='select';g.hand=types.map((type,i)=>({...TRICKS[0],type,cost:2,pattern:'at-most',threshold:6,points:4,comboBonus:null,uid:`test-${i}`}));return g;}
function land(g,i){assert(E.chooseCard(g,g.hand[i].uid));assert(E.roll(g,()=>.4));assert(E.autoPlace(g));assert(E.land(g));}

test('paired market preserves ascending order and grants exactly one card and one token per player',()=>{
 const m=recap(),order=[...m.order],scores=[8,3,3,12];order.forEach((seat,i)=>{m.recaps[0].rows.find(r=>r.id===m.players[seat].id).best=scores[i];});
 const deck=new Set(m.deck.map(c=>c.uid));assert(M.advance(m));assert.deepEqual(m.draftOrder,[order[1],order[2],order[0],order[3]]);assert.deepEqual(m.order,order);
 assert.equal(m.market.cards.length,4);assert.equal(m.market.tokens.length,4);assert.equal(new Set(m.market.tokens.map(t=>t.id)).size,4);
 assert(m.market.cards.every(c=>deck.has(c.uid)&&!m.deck.some(d=>d.uid===c.uid)));
 for(let i=0;i<4;i++){
  const current=M.currentPlayer(m),before=JSON.stringify(m);assert(!cmd(m,'draft-skip'));assert(!cmd(m,'draft',{cardId:m.market.cards[0].uid}));assert(!cmd(m,'draft-bonus',{choice:m.market.tokens[0].type}));assert.equal(JSON.stringify(m),before);
  assert.equal(current.seat,m.draftOrder[i]);const token=m.market.tokens[0],stock=current.game.bank[token.type],hand=current.game.hand.length;
  assert(cmd(m,'draft-pair',{cardId:m.market.cards[0].uid,tokenId:token.id}));assert.equal(current.game.bank[token.type],stock+1);assert.equal(current.game.hand.length,hand+1);
  assert.equal(m.market.cards.length,3-i);assert.equal(m.market.tokens.length,3-i);
 }
 assert.equal(m.phase,'draft-summary');assert.equal(m.discard.length,0);assert.equal(m.discardedBonuses.length,0);assert.equal(m.leftover,null);assert.equal(inventory(m).length,85);
 assert(M.startModule(m));assert.deepEqual(m.order,[...order.slice(1),order[0]]);assert.equal(m.module,1);assert(m.players.every(p=>p.game.hand.length===7&&p.game.module===1));
});

test('paired draft is atomic; duplicate token types remain individually selectable across saves',()=>{
 let m=recap();M.advance(m);m.market.tokens.forEach(t=>t.type='freeze');
 const actor=M.currentPlayer(m),cardId=m.market.cards[0].uid,tokenId=m.market.tokens[0].id,before=JSON.stringify(m);
 for(const bad of [{cardId},{tokenId},{cardId,tokenId:'missing'},{cardId:'missing',tokenId}]){assert(!cmd(m,'draft-pair',bad));assert.equal(JSON.stringify(m),before);}
 const stock=actor.game.bank.freeze;assert(cmd(m,'draft-pair',{cardId,tokenId}));assert.equal(actor.game.bank.freeze,stock+1);
 const after=JSON.stringify(m);assert(!cmd(m,'draft-pair',{cardId:m.market.cards[0].uid,tokenId}));assert(!cmd(m,'draft-pair',{cardId,tokenId:m.market.tokens[0].id}));assert.equal(JSON.stringify(m),after);
 for(let i=0;i<3;i++){m=M.restore(JSON.parse(JSON.stringify(m)));assert.equal(m.market.cards.length,3-i);assert.strictEqual(M.currentPlayer(m).game.draftTokens,m.market.tokens);assert(cmd(m,'draft-pair',{cardId:m.market.cards[0].uid,tokenId:m.market.tokens[0].id}));}
 assert.equal(m.market.cards.length,0);assert.equal(m.market.tokens.length,0);assert.equal(m.discard.length,0);assert.equal(new Set(inventory(m).map(c=>c.uid)).size,85);
 const log=m.draftLog.filter(e=>e.kind==='recovery');assert.equal(log.length,4);assert(log.every(e=>e.name&&e.bonus==='freeze'));assert.equal(new Set(log.map(e=>e.tokenId)).size,4);
});

test('a capped draft offer is only selectable if all remaining offers would be returned',()=>{
 const m=recap();assert(M.advance(m));
 const actor=M.currentPlayer(m),cardId=m.market.cards[0].uid;
 actor.game.bank.freeze=3;m.market.tokens.forEach(t=>t.type='freeze');
 m.market.tokens[1].type='reroll';
 const full=m.market.tokens[0],before=JSON.stringify(m);
 assert(!cmd(m,'draft-pair',{cardId,tokenId:full.id}));assert.equal(JSON.stringify(m),before);
 assert.deepEqual(E.draftBonusChoices(actor.game,m.market.tokens),[m.market.tokens[1]]);
 m.market.tokens[1].type='freeze';
 assert(cmd(m,'draft-pair',{cardId,tokenId:full.id}));assert.equal(actor.game.bank.freeze,3);
 assert(actor.game.hand.some(c=>c.uid===cardId));assert(!m.market.tokens.some(t=>t.id===full.id));
 assert.equal(m.draftLog.at(-1).bonusDiscarded,true);assert.equal(m.statistics.players[actor.id].gained.freeze,0);
});

test('market draws N cards and N tokens for two, three and four players without automatic rewards',()=>{
 for(const npcCount of [1,2,3]){const m=M.newMatch({seed:9,npcCount,length:4});while(m.phase==='initial')cmd(m,'draft',{cardId:M.currentPlayer(m).game.offer[0]});M.startModule(m);const banks=m.players.map(p=>structuredClone(p.game.bank));for(let i=0;i<m.players.length*2;i++){assert(cmd(m,'pass'));assert(cmd(m,'proceed'));}assert.deepEqual(m.players.map(p=>p.game.bank),banks);assert(M.advance(m));assert.equal(m.market.cards.length,m.players.length);assert.equal(m.market.tokens.length,m.players.length);assert(m.market.tokens.every(t=>['adjust','reroll','freeze'].includes(t.type)));}
});

test('two-type modules force the missing type second, then allow any third type and banking',()=>{
 const g=turn();land(g,0);assert.deepEqual(E.requiredTypes(g),['slide']);assert(!E.stop(g));assert(E.canFall(g));assert(E.continueRun(g));assert(!E.chooseCard(g,g.hand[1].uid));assert(!E.chooseCard(g,g.hand[3].uid));land(g,2);assert.deepEqual(E.requiredTypes(g),[]);assert(E.canStop(g));assert(E.continueRun(g));land(g,3);assert.equal(g.score,14);assert.equal(g.last.moduleBonus,1);
 const reversed=turn();land(reversed,2);assert.deepEqual(E.requiredTypes(reversed),['kick']);assert(E.continueRun(reversed));land(reversed,0);assert(E.stop(reversed));assert.equal(reversed.score,8);assert.equal(reversed.last.moduleBonus,0);
});

test('missing type or insufficient dice causes a fall with zero points, not automatic banking',()=>{
 for(const only of [true,false]){const g=turn(only?['kick','kick']:['kick','slide']);if(!only){g.hand[0].cost=4;g.hand[1].cost=3;}land(g,0);assert.equal(g.phase,'result');assert.equal(g.reason,'fall');assert.equal(g.score,0);assert.equal(g.attempts.length,1);assert.equal(g.secured.length,0);assert.equal(g.sequences.length,0);}
 const g=turn();land(g,0);assert(E.fall(g));assert.equal(g.score,0);assert(!E.fall(g));
});

test('three-type modules still accept one matching type, as requested',()=>{
 const g=turn();g.route=[8,3];land(g,0);assert(E.stop(g));assert.equal(g.score,4);
});

test('reroll token rerolls every unvalidated die, clears pending sockets and preserves landed dice',()=>{
 const g=turn();g.route=[3,3];land(g,0);const locked=structuredClone(g.dice.slice(0,2));assert(E.continueRun(g));assert(E.chooseCard(g,g.hand[1].uid));assert(E.roll(g,()=>0));assert(E.place(g,[2]));let calls=0;
 assert(E.bonus(g,'reroll',undefined,0,()=>{calls++;return .99;}));assert.equal(calls,4);assert.deepEqual(g.dice.slice(0,2),locked);assert(E.freeDice(g).every(d=>d.face===6));assert.deepEqual(g.pending,[]);assert.equal(g.bank.reroll,0);assert(!E.bonus(g,'reroll'));
});
