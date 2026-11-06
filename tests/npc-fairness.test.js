import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../public/match.js';
import * as E from '../public/engine.js';
import {TRICKS} from './fixtures/turn-scenarios.js';
import {decide} from '../public/npc.js';
import {npcGameView} from '../public/npc-view.js';
import {sequencePlanner} from '../public/npc-strategy.js';
import {NPC_DIFFICULTIES} from '../public/npc-difficulty.js';

function fixture(ids=[6,1]){
 const m=M.newMatch({seed:611,npcCount:1});m.route=[3,0,4,5,7,8];m.phase='playing';m.active=0;
 for(const p of m.players)p.game.route=[...m.route];
 const g=m.players[0].game;g.phase='select';g.hand=ids.map((id,i)=>({...TRICKS[id],uid:`fair-${i}`}));g.offer=[];
 return {m,g};
}
test('NPC input exposes only its own offers and the public market, never the hidden deck or random source',()=>{
 const m=M.newMatch({seed:612}),g=M.currentPlayer(m).game,view=npcGameView(g);
 assert.equal(view.deck.length,g.offer.length);assert.deepEqual(view.deck.map(c=>c.uid),g.offer);assert(view.deck.length<m.deck.length);
 assert(!('rngState'in view));assert(!('randomSource'in view));
 const {m:playing,g:live}=fixture();live.rngState=123;live.randomSource=()=>{throw Error('No RNG access');};
 const shown=npcGameView(live);assert.deepEqual(shown.deck,[]);assert(!('rngState'in shown));assert(!('randomSource'in shown));
 const before=JSON.stringify(playing);shown.hand[0].points=999;shown.dice[0].face=6;shown.bank.adjust=999;assert.equal(JSON.stringify(playing),before);
});
test('every NPC difficulty and humans commit to the selected card after rolling',()=>{
 const {g}=fixture();g.phase='rolled';g.active=g.hand[0].uid;g.bank={adjust:0,reroll:0,freeze:0};g.dice.forEach(d=>d.face=2);
 for(const {id:difficulty} of NPC_DIFFICULTIES)assert.equal(decide(npcGameView(g),{difficulty,leader:2}).type,'fall');
 const before=JSON.stringify(g);assert(!E.resetPlacement(g));assert(!E.chooseCard(g,g.hand[1].uid));assert.equal(JSON.stringify(g),before);
});
test('all levels choose before fresh dice are known, without using Math.random or mutating the game',t=>{
 const {m,g}=fixture([1,4,9,16,18,19]);const first=npcGameView(g),second=npcGameView(g);first.dice.forEach(d=>d.face=1);second.dice.forEach(d=>d.face=6);
 for(const v of [first,second])for(const key of ['rngState','randomSource'])Object.defineProperty(v,key,{get(){throw Error('Hidden random source read');}});
 const before=JSON.stringify(m);t.mock.method(Math,'random',()=>{throw Error('Controller consumed dice randomness');});
 for(const {id:difficulty}of NPC_DIFFICULTIES)assert.deepEqual(decide(first,{difficulty}),decide(second,{difficulty}));
 assert.equal(JSON.stringify(m),before);
});
test('human and every NPC level receive exactly the same supplied dice stream and number of draws',()=>{
 const {m,g}=fixture([1,0]);g.landed=[{card:g.hand[0].uid,dice:[1,3]}];g.dice[1].locked=g.dice[3].locked=g.hand[0].uid;g.frozen=[2];g.dice[2].face=3;g.active=g.hand[1].uid;g.phase='ready';
 const saved=JSON.parse(JSON.stringify(m));let expected;
 for(const kind of ['human','easy','normal','expert']){
  const copy=M.restore(structuredClone(saved));copy.players[0].kind=kind==='human'?'human':'npc';copy.npcDifficulty=kind==='human'?'normal':kind;
  const samples=[.01,.5,.99];let draws=0;Object.defineProperty(copy,'randomSource',{value:()=>samples[draws++]});
  assert(M.dispatch(copy,{playerId:'p0',type:'roll'}));assert.equal(draws,3);assert.equal(copy.players[0].game.dice[2].face,3);
  const faces=copy.players[0].game.dice.map(d=>d.face);if(expected)assert.deepEqual(faces,expected);else expected=faces;
 }
});
test('a useful adjustment costs exactly one token for each level and can never use an empty stock',()=>{
 for(const {id:difficulty}of NPC_DIFFICULTIES){
  const {m,g}=fixture([6]);g.phase='rolled';g.active=g.hand[0].uid;g.dice.forEach((d,i)=>d.face=[4,3,2,5,6,2][i]);
  const action=decide(npcGameView(g),{difficulty,leader:6});assert.equal(action.type,'bonus');assert.equal(action.bonusType,'adjust');
  assert(M.dispatch(m,{playerId:'p0',...action}));assert.equal(g.bank.adjust,0);assert.equal(g.used.adjust,1);assert.equal(M.matchSummary(m).players[0].tokens.spent.adjust,1);
  assert(!M.dispatch(m,{playerId:'p0',type:'bonus',bonusType:'adjust',id:0,delta:1}));assert.equal(g.bank.adjust,0);
 }
});
test('normal and relaxed planning never substitutes a doomed first mandatory type for a feasible pair',()=>{
 const {g}=fixture([7,1,21]);g.route[0]=5;
 for(let example=0;example<24;example++){
  const variant=npcGameView(g);variant.hand.forEach((c,i)=>c.uid=`variant-${example}-${i}`);
  for(const difficulty of ['easy','normal'])assert.notEqual(decide(variant,{difficulty}).cardId,variant.hand[0].uid);
 }
});
test('both attempts target the opposing best score once one has been secured',()=>{
 const {g}=fixture([1,10]);const context={leader:18,parScore:7,chaseFirst:false};
 assert.equal(sequencePlanner(g,context).goal,19);g.attempt=1;g.attempts=[{points:8}];assert.equal(sequencePlanner(g,context).goal,19);
});
test('difficulty is saved, defaults to normal in old saves, and does not alter starting resources',()=>{
 for(const {id}of NPC_DIFFICULTIES){const m=M.newMatch({seed:613,npcDifficulty:id});assert.equal(M.restore(JSON.parse(JSON.stringify(m))).npcDifficulty,id);for(const p of m.players)assert.deepEqual(p.game.bank,{adjust:1,reroll:1,freeze:1});}
 const old=M.newMatch({seed:614});delete old.npcDifficulty;assert.equal(M.restore(JSON.parse(JSON.stringify(old))).npcDifficulty,'normal');
 assert.equal(M.newMatch({npcDifficulty:'unknown'}).npcDifficulty,'normal');
});
