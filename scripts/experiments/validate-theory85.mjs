import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {writeFile} from 'node:fs/promises';
import * as M from '../../.local-games/theory85-runtime/match.js';
import * as E from '../../.local-games/theory85-runtime/engine.js';
import {TRICKS} from '../../.local-games/theory85-runtime/data.js';
import {decide} from '../../.local-games/theory85-runtime/npc.js';
import {npcContext} from '../../.local-games/theory85-runtime/npc-strategy.js';
import {npcGameView} from '../../.local-games/theory85-runtime/npc-view.js';
const checks=[];
const inventory=m=>{const cards=[...m.deck,...m.market.cards,...m.discard,...m.players.flatMap(p=>p.game.hand)];assert.equal(cards.length,85);assert.equal(new Set(cards.map(c=>c.uid)).size,85);};
const cmd=(m,type,extra={})=>M.dispatch(m,{playerId:M.currentPlayer(m).id,type,...extra});
function completeByPassing(m){while(m.phase==='playing'){const p=M.currentPlayer(m);assert(cmd(m,p.game.phase==='result'?'proceed':'pass'));}}
let m=M.newMatch({seed:7,npcCount:3,length:6});inventory(m);
while(m.phase==='initial'){
 const p=M.currentPlayer(m),cards=p.game.offer.map(uid=>m.deck.find(c=>c.uid===uid));
 if(m.draftRound%2===0){assert.equal(cards.filter(c=>c.tier==='base').length,2);assert.equal(cards.filter(c=>c.tier==='advanced').length,1);}
 assert(cmd(m,'draft',{cardId:cards.find(c=>c.tier==='advanced').uid}));inventory(m);
}
assert.equal(m.players.reduce((s,p)=>s+p.game.hand.filter(c=>c.tier==='advanced').length,0),24);
assert.equal(m.experimentalDraftDraws.filter(c=>c.tier==='base').length,24);assert.equal(m.experimentalDraftDraws.filter(c=>c.tier==='advanced').length,24);
for(const p of m.players)for(const type of ['kick','slide','air'])assert.equal(p.game.hand.filter(c=>c.type===type).length,2);
checks.push('Initial packets 2 Base + 1 Advanced; add Advanced; all 24 picks may be Advanced; exactly two cards per type/player.');
for(let module=0;module<6;module++){
 assert(M.startModule(m));completeByPassing(m);assert.equal(m.phase,'recap');
 if(module===5)break;
 assert(M.advance(m));assert.equal(m.market.cards.length,8);assert.equal(m.market.tokens.length,4);
 const tier=module===0?'base':module===4?'epic':'advanced';assert(m.market.cards.every(c=>c.tier===tier));
 while(m.phase==='recovery'){const p=M.currentPlayer(m),before=p.game.hand.length;assert(cmd(m,'draft-pair',{cardId:m.market.cards[0].uid,tokenId:m.market.tokens[0].id}));assert.equal(p.game.hand.length,before+1);inventory(m);}
 assert.equal(m.market.cards.length,0);assert.equal(m.market.tokens.length,0);m=M.restore(JSON.parse(JSON.stringify(m)));inventory(m);
}
assert.deepEqual(m.experimentalMarkets.map(c=>c.tier),['base','advanced','advanced','advanced','epic']);
assert(m.experimentalMarkets.every(c=>c.size===8));checks.push('Worst case: after all 24 Advanced starting picks, every recovery draft still has 8 correct-tier cards + 4 tokens; leftovers return; 85-card conservation and restoration.');

m=M.newMatch({seed:8,npcCount:3});while(m.phase==='initial')assert(cmd(m,'draft',{cardId:M.currentPlayer(m).game.offer[0]}));assert(M.startModule(m));completeByPassing(m);assert(M.advance(m));
while(m.phase==='recovery')assert(cmd(m,'draft-pair',{cardId:m.market.cards[0].uid,tokenId:m.market.tokens[0].id}));assert(M.startModule(m));completeByPassing(m);assert(M.advance(m));
const reserve=M.currentPlayer(m).game.draftCards.find(c=>c.tier==='base');assert(reserve);const currentCount=m.market.cards.length;
assert(cmd(m,'draft-pair',{cardId:reserve.uid,tokenId:m.market.tokens[0].id}));assert.equal(m.market.cards.length,currentCount);assert(!m.deck.some(c=>c.uid===reserve.uid));inventory(m);
const hidden=m.deck.find(c=>c.tier==='advanced');assert(hidden);const beforeHidden=JSON.stringify(m);
assert(!cmd(m,'draft-pair',{cardId:hidden.uid,tokenId:m.market.tokens[0].id}));assert.equal(JSON.stringify(m),beforeHidden);
checks.push('Visible lower-tier Base can replace a new Advanced pick without consuming a new card; hidden current-tier deck cannot be selected.');

const card=name=>({...TRICKS.find(c=>c.name===name)});
const g=E.newGame({skaterId:'neo',route:[3,2,4,5,6,8]},()=>.4);g.phase='select';g.competitive=true;
g.hand=[0,1,2].map(i=>({...card('Nollie'),uid:'nollie'+i}));
for(let i=0;i<3;i++){assert(E.chooseCard(g,g.hand[i].uid));assert(E.roll(g,()=>.55));assert(E.autoPlace(g));assert(E.land(g));if(i<2)assert(E.continueRun(g));}
assert.equal(g.earned.adjust,3);assert(g.sequenceReward.pending);assert(E.claimSequenceReward(g,'freeze'));assert(E.proceed(g));assert(!E.chooseCard(g,g.hand[0].uid));assert(E.pass(g));assert(E.proceed(g));
assert.equal(g.bank.adjust,4);assert.equal(g.bank.freeze,2);assert.equal(g.trickRewards.filter(r=>r.type==='adjust').length,3);
checks.push('Three physical Nollies banked together award three deferred ±1 tokens, plus the separate immediate third-trick choice; secured cards cannot replay.');

for(const cost of [3,4]){
 const game=E.newGame({skaterId:'neo',route:[3,2,4,5,6,8]},()=>.4);game.phase='select';game.hand=[{...card(cost===3?'Varial Heelflip':'Hurricane'),uid:'heavy'},{...card('Ollie'),uid:'helper'}];
 assert(E.chooseCard(game,'heavy'));const faces=cost===3?[2,2,2,6,6,6]:[2,3,4,5,6,6];let i=0;
 assert(E.roll(game,()=>((faces[i++])-.5)/6));assert(E.autoPlace(game));assert(E.land(game));
 assert.equal(E.freeDice(game).length,6-cost);assert(E.continueRun(game));assert(E.chooseCard(game,'helper'));assert(E.roll(game,()=>.9));assert(E.autoPlace(game));assert(E.land(game));
 assert.equal(game.phase,'result');assert.equal(game.landed.length,2);assert(!game.sequenceReward);
}
checks.push('Cards using 3 or 4 dice leave 3 or 2 free dice; two-card sequences do not earn the three-trick point/token.');

m=M.newMatch({seed:17});let steps=0;
while(m.phase!=='complete'){
 assert(++steps<2500);if(m.phase==='draft-summary'){assert(M.startModule(m));continue;}if(m.phase==='recap'){assert(M.advance(m));continue;}
 const p=M.currentPlayer(m),view=npcGameView(p.game),before=JSON.stringify(m),rng=m.rngState;
 const action=decide(view,{...npcContext(m,p),difficulty:'expert'});
 assert.equal(JSON.stringify(m),before);assert.equal(m.rngState,rng);assert(!Object.hasOwn(view,'rngState'));assert(!Object.hasOwn(view,'randomSource'));
 assert(M.dispatch(m,{playerId:p.id,...action}));inventory(m);
}
checks.push('Complete expert-controlled six-module match: every move legal, public-only controller views, no state/RNG mutation during decisions, physical inventory conserved.');
const report={checks:checks.length,passed:true,details:checks};
await writeFile(fileURLToPath(new URL('../../tests/theory85-validation-results.json',import.meta.url)),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
