import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../public/engine.js';
import * as M from '../public/match.js';
import {TRICKS} from './fixtures/turn-scenarios.js';

function turn(){const g=E.newGame({},()=>.3);g.route=[3];g.phase='select';g.hand=[0,1,9].map((id,i)=>({...TRICKS[id],cost:2,points:3,pattern:'at-most',threshold:6,comboBonus:null,uid:`test-${i}`}));return g;}
function roll(g,index){assert(E.chooseCard(g,g.hand[index].uid));assert(E.roll(g,()=>.4));}

test('returning unconfirmed dice keeps the committed card, faces, freezes, tokens and landed tricks',()=>{
 let g=turn();roll(g,0);E.autoPlace(g);E.land(g);E.continueRun(g);roll(g,1);E.bonus(g,'freeze',3);E.bonus(g,'adjust',4,1);E.place(g,[3,4]);
 const dice=structuredClone(g.dice),bank=structuredClone(g.bank),landed=structuredClone(g.landed),rolls=g.rolls;
 assert(E.resetPlacement(g));assert.equal(g.active,g.hand[1].uid);assert.deepEqual(g.pending,[]);assert.equal(g.phase,'rolled');assert(!g.reuseRoll);
 assert.deepEqual(g.dice,dice);assert.deepEqual(g.bank,bank);assert.deepEqual(g.landed,landed);assert.deepEqual(g.frozen,[3]);assert.equal(g.rolls,rolls);assert(!E.pass(g));
 g=JSON.parse(JSON.stringify(g));assert(!E.chooseCard(g,g.hand[2].uid));assert.equal(g.active,g.hand[1].uid);assert.equal(g.phase,'rolled');assert(!E.roll(g));assert.deepEqual(g.dice,dice);assert.equal(g.rolls,rolls);
 assert(E.autoPlace(g));assert(E.land(g));assert.equal(g.landed.length,2);assert(!E.resetPlacement(g));
});

test('freeze activates during a roll, preserves phase and survives paid rerolls',()=>{
 const g=turn();roll(g,0);g.bank.freeze=2;E.place(g,[1]);
 assert(E.canFreeze(g));assert(E.bonus(g,'freeze',1));assert.equal(g.phase,'rolled');assert.deepEqual(g.pending,[1]);assert.equal(g.bank.freeze,1);
 assert(!E.bonus(g,'freeze',1));assert.equal(g.bank.freeze,1);
 assert(E.bonus(g,'freeze',2));const frozen=g.dice.slice(1,3).map(d=>d.face);let calls=0;
 assert(E.bonus(g,'reroll',undefined,0,()=>{calls++;return .99;}));assert.equal(calls,4);assert.deepEqual(g.dice.slice(1,3).map(d=>d.face),frozen);assert.deepEqual(g.pending,[]);
 assert(E.autoPlace(g));assert(E.land(g));assert.deepEqual(g.frozen,[2]);assert(!E.bonus(g,'freeze',0));
});

test('a reroll with every free die frozen is rejected without consuming a token',()=>{
 const g=turn();roll(g,0);g.bank.freeze=6;for(let i=0;i<6;i++)assert(E.bonus(g,'freeze',i));
 const before=JSON.stringify(g);assert(!E.bonus(g,'reroll'));assert.equal(JSON.stringify(g),before);
});

test('live sequence preview shows companion and third-trick points without awarding them',()=>{
 const g=turn();g.hand[0].comboBonus={kind:'companion',type:g.hand[1].type,points:2};roll(g,0);
 assert.equal(E.sequenceView(g).confirmed.points,0);assert.equal(E.sequenceView(g).preview.points,3);
 E.autoPlace(g);E.land(g);E.continueRun(g);roll(g,1);
 assert.equal(E.sequenceView(g).confirmed.points,3);assert.equal(E.sequenceView(g).preview.points,8);assert.equal(g.attempts.length,0);
 E.autoPlace(g);E.land(g);E.continueRun(g);roll(g,2);
 assert.equal(E.sequenceView(g).confirmed.points,8);assert.equal(E.sequenceView(g).preview.points,12);assert.equal(E.sequenceView(g).preview.sequenceBonus,1);assert.equal(E.sequenceView(g).preview.moduleBonus,0);
 assert(E.autoPlace(g));assert(E.resetPlacement(g));assert(E.sequenceView(g).hasPreview);assert.equal(E.sequenceView(g).confirmed.points,8);assert.equal(E.sequenceView(g).preview.points,12);
});

test('the multiplayer command boundary accepts placement reset only for the active player',()=>{
 const m=M.newMatch({seed:14});while(m.phase==='initial'){const p=M.currentPlayer(m);assert(M.dispatch(m,{playerId:p.id,type:'draft',cardId:p.game.offer[0]}));}M.startModule(m);
 const p=M.currentPlayer(m),g=p.game;E.chooseCard(g,E.options(g)[0].uid);E.roll(g,()=>.3);E.place(g,[0]);
 const before=JSON.stringify(m);assert(!M.dispatch(m,{playerId:m.players.find(other=>other.id!==p.id).id,type:'reset-placement'}));assert.equal(JSON.stringify(m),before);
 assert(M.dispatch(m,{playerId:p.id,type:'reset-placement'}));assert(!g.reuseRoll);assert(g.active);assert.equal(g.phase,'rolled');assert.equal(m.active,p.seat);
});
