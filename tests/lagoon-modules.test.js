import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {MODULES} from '../public/data.js';
import {TRICKS} from './fixtures/turn-scenarios.js';
import * as E from '../public/engine.js';
import * as M from '../public/match.js';
import {moduleBonusEarned,validModuleRoute} from '../public/module-rules.js';
import {moduleCard,moduleRoute,moduleCatalog} from '../public/module-cards.js';
const cards=ids=>ids.map((id,i)=>({...TRICKS[id],uid:`card-${i}`}));
function game(module,ids){const g=E.newGame({},()=>.4);g.route=[module];g.module=0;g.phase='select';g.hand=cards(ids).map(c=>({...c,tier:'base'}));return g;}
function land(g,index,face=4){assert(E.chooseCard(g,g.hand[index].uid));assert(E.roll(g,()=>0));for(const d of E.freeDice(g))d.face=face;assert(E.autoPlace(g));assert(E.land(g));}
test('Le Lagon has four discoveries, four linking modules and four finales with exact approved rewards',()=>{
 assert.equal(MODULES.length,12);assert.deepEqual([0,1,2].map(stage=>MODULES.filter(m=>m.stage===stage).length),[4,4,4]);
 assert.equal(new Set(MODULES.map(m=>m.key)).size,12);
 assert.deepEqual(MODULES.filter(m=>m.stage===2).map(m=>m.key),['coping-bleu','boucle-lagon','marches-palmiers','grande-vague']);
 for(const m of MODULES){assert.equal(m.id,MODULES.indexOf(m));assert.equal(m.pv,[2,3,4][m.stage]);assert(m.bonus.kind);assert(!('minimumTricks'in m.bonus));assert(!('target'in m));assert.deepEqual(m.rounds,[[1,2],[3,4],[5,6]][m.stage]);}
});
test('module points, trick effects and the three-trick point stack once and grant the normal token choice',()=>{
 const g=game(0,[1,0,9]);land(g,0);assert(E.continueRun(g));land(g,1);
 assert.equal(E.banked(g),8);assert.equal(E.sequenceView(g).confirmed.moduleBonus,2);
 assert(E.continueRun(g));assert(E.chooseCard(g,g.hand[2].uid));assert.equal(E.sequenceView(g).preview.points,12);
 assert(E.roll(g,()=>.5));assert(E.autoPlace(g));assert.equal(E.sequenceView(g).preview.points,12);assert(E.land(g));
 assert.equal(g.score,12);assert.equal(g.last.base,7);assert.equal(g.last.cardBonus,1);assert.equal(g.last.sequenceBonus,1);assert.equal(g.last.moduleBonus,3);assert.equal(g.last.bonus,5);
 assert(g.sequenceReward.pending);assert(E.claimSequenceReward(g,'freeze'));assert(!E.claimSequenceReward(g,'freeze'));assert(!E.land(g));assert.equal(g.attempts.length,1);
});
test('each conserved attempt can earn its module bonus and the saved ledger does not pay twice',()=>{
 let g=game(1,[9,0,9,0]);g.competitive=true;
 land(g,0);E.continueRun(g);land(g,1);assert(E.stop(g));assert.equal(g.score,6);assert.equal(g.last.moduleBonus,1);
 g=JSON.parse(JSON.stringify(g));assert(E.proceed(g));land(g,2);E.continueRun(g);land(g,3);assert.equal(g.phase,'result');assert.equal(g.reason,'no-options');assert.equal(g.score,6);
 assert(E.proceed(g));assert.equal(g.history[0].best,6);assert.deepEqual(g.history[0].attempts.map(a=>a.moduleBonus),[1,1]);assert.equal(g.sequences.length,2);assert(!E.proceed(g));
});
test('a later fall removes the earned module bonus, previous trick effects and all attempt points',()=>{
 const g=game(0,[0,9,18]);land(g,0);E.continueRun(g);land(g,1);assert.equal(E.banked(g),7);
 E.continueRun(g);E.chooseCard(g,g.hand[2].uid);E.roll(g,()=>.99);assert(E.fall(g));assert.equal(g.score,0);assert.equal(g.last.moduleBonus,0);assert.equal(g.last.bonus,0);assert.equal(g.sequences.length,0);
});
test('bonus conditions are optional: one legal trick can be banked without a minimum or all three types',()=>{
 const g=game(8,[9,0,18]);land(g,0);assert(E.canStop(g));assert(E.stop(g));assert.equal(g.score,2);assert.equal(g.last.moduleBonus,0);assert(g.last.success);
});
test('all six modules are drawn without duplicates before the draft, in their allowed rounds, across 2000 seeds',()=>{
 const seen=new Set(),signatures=new Set();
 for(let seed=1;seed<=2000;seed++){let state=seed;const rng=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);const route=E.drawModuleRoute(6,rng);assert(validModuleRoute(route,MODULES));assert.equal(route.length,6);assert.deepEqual(route.map(id=>MODULES[id].pv),[2,2,3,3,4,4]);route.forEach((id,i)=>{seen.add(id);assert(MODULES[id].rounds.includes(i+1));});signatures.add(route.join(','));}
 assert.equal(seen.size,12);assert(signatures.size>400);
 const m=M.newMatch({seed:42}),route=[...m.route];assert.equal(m.phase,'initial');assert(m.players.every(p=>JSON.stringify(p.game.route)===JSON.stringify(route)));
 const resumed=M.restore(JSON.parse(JSON.stringify(m)));assert.deepEqual(resumed.route,route);
 while(m.phase==='initial')assert(M.dispatch(m,{playerId:M.currentPlayer(m).id,type:'draft',cardId:M.currentPlayer(m).game.offer[0]}));assert(M.startModule(m));assert.deepEqual(m.route,route);
});
test('restore rejects duplicates, wrong stages, changed player routes and previous rules versions',()=>{
 for(const mutate of [m=>m.route[1]=m.route[0],m=>m.route[0]=11,m=>m.players[0].game.route.reverse(),m=>m.players[0].game.version--]){const m=JSON.parse(JSON.stringify(M.newMatch({seed:4})));mutate(m);assert.throws(()=>M.restore(m));}
});
test('all cards and route previews use the live data, and every module has its own artwork asset',()=>{
 for(const m of MODULES){const html=moduleCard(m);assert(html.includes(m.layers.illustration));assert(html.includes(m.condition));assert(!html.includes('MINIMUM'));assert(existsSync(new URL('../public/'+m.image,import.meta.url)),m.image);}
 const m=M.newMatch({seed:5}),html=moduleRoute(m);assert.equal((html.match(/data-action="inspect-module"/g)||[]).length,6);assert.equal((moduleCatalog().match(/data-module-id=/g)||[]).length,12);
 for(const id of m.route)assert(html.includes(MODULES[id].name.replaceAll('’','’')));
 m.phase='recap';assert(moduleRoute(m).includes(`${MODULES[m.route[0]].name}, terminée.`));assert(!moduleRoute(m).includes('aria-current="step"'));
});
