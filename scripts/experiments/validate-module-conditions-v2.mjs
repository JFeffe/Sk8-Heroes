import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {productionHashes} from './theory85-runtime.mjs';
import * as E from '../../.local-games/theory85-modules-v2-runtime/engine.js';
import {MODULES,TRICKS} from '../../.local-games/theory85-modules-v2-runtime/data.js';
import {moduleBonusPoints} from '../../.local-games/theory85-modules-v2-runtime/module-rules.js';
import {bestPlacement} from '../../.local-games/theory85-modules-v2-runtime/npc-strategy.js';
import {npcGameView} from '../../.local-games/theory85-modules-v2-runtime/npc-view.js';
import {projectedBonus} from '../../.local-games/theory85-modules-v2-runtime/module-trace.js';
const before=await productionHashes(),checks=[];
const check=(label,run)=>{run();checks.push(label);};
function game(module,names){
 const g=E.newGame({skaterId:'neo'},()=>.4);g.route=[module];g.module=0;g.phase='select';
 g.hand=names.map((name,i)=>{const c=TRICKS.find(c=>c.name===name);assert(c,name);return {...c,uid:'c'+i};});return g;
}
function choose(g,index){assert(E.chooseCard(g,g.hand[index].uid));}
function roll(g,faces,reroll=false){let i=0;const rng=()=>{assert(i<faces.length,'Missing scripted die face');return(faces[i++]-.5)/6;};assert(reroll?E.bonus(g,'reroll',null,0,rng):E.roll(g,rng));assert.equal(i,faces.length);}
function placeLand(g,ids){assert(E.place(g,ids,true));assert(E.canLand(g));assert(E.land(g));}
function land(g,index,faces,ids){choose(g,index);roll(g,faces);placeLand(g,ids);}
function stop(g){if(g.phase==='decision')assert(E.stop(g));assert.equal(g.phase,'result');assert.equal(E.sequenceView(g).confirmed.points,g.score);assert.equal(g.last.points,g.score);assert.equal(g.attempts.at(-1).moduleBonus,g.last.moduleBonus);}
function next(g){assert(E.continueRun(g));}

check('12 distinct goals, four early/six middle/two final modules; PV 2/3/4; bonus +2 and two-trick minimum.',()=>{
 assert.deepEqual([0,1,2].map(stage=>MODULES.filter(m=>m.stage===stage).length),[4,6,2]);
 assert.equal(new Set(MODULES.map(m=>m.bonus.kind)).size,12);
 for(const m of MODULES){assert.equal(m.pv,[2,3,4][m.stage]);assert.equal(m.bonusPoints,2);assert.equal(m.bonus.minimumTricks,2);}
 assert.deepEqual(MODULES[8].needs,[]);
});
check('Every goal rejects an empty sequence and a single card, including one expensive Epic.',()=>{
 const c={...TRICKS.find(c=>c.name==='900°'),uid:'one'};
 for(const m of MODULES)for(const cards of [[],[c]])assert.equal(moduleBonusPoints(m,cards,{used:{adjust:0,reroll:0,freeze:0},moduleTrace:{ownColor:'blue',entries:[{card:'one',dice:[{face:4,color:'blue'},{face:4},{face:5},{face:5}],carriedFrozen:[0],initialPossible:false,rerolls:1}]}}),0);
});
check('Îlot: two legal tricks without tokens earn +2; spending a token on an unused die removes the bonus.',()=>{
 for(const spend of [false,true]){
  const g=game(0,['Ollie','50-50 Grind','180°']);choose(g,0);roll(g,[2,3,4,5,6,6]);if(spend)assert(E.bonus(g,'adjust',5,-1));placeLand(g,[0,1]);next(g);land(g,1,[4,5,6,6],[2,3]);stop(g);assert.equal(g.last.moduleBonus,spend?0:2);
 }
});
check('Quai bas: same face across different cards earns +2; two different pairs without a shared face do not.',()=>{
 for(const shared of [true,false]){
  const g=game(1,['50-50 Grind','Ollie','180°']);land(g,0,[2,3,6,6,6,6],[0,1]);next(g);land(g,1,[shared?3:4,5,6,6],[2,3]);stop(g);assert.equal(g.last.moduleBonus,shared?2:0);
 }
});
check('Stars keep their physical value 1 for module goals, even when the personal joker resolves as 3.',()=>{
 const g=game(1,['Noseslide','Ollie','180°']);land(g,0,[1,3,6,6,6,6],[0,1]);assert.equal(g.dice[0].wildValue,3);next(g);land(g,1,[2,4,6,6],[2,3]);stop(g);assert.equal(g.last.moduleBonus,0);assert.deepEqual(g.moduleTrace.entries[0].dice.map(d=>d.face),[1,3]);
});
check('Petite Vague: Base immediately followed by Advanced earns +2, including a three-die Advanced.',()=>{
 const g=game(2,['180°','Backside Flip','Ollie']);land(g,0,[2,3,6,6,6,6],[0,1]);next(g);land(g,1,[1,3,5,6],[2,3,4]);stop(g);assert.equal(g.last.moduleBonus,2);
 assert.equal(moduleBonusPoints(MODULES[2],[g.hand[1],g.hand[0]]),0);
});
check('Rail des Palmiers: strict printed score order; equal or descending scores fail, conditional effects do not change ordering.',()=>{
 for(const [a,b,bonus] of [['Ollie','Kickflip',2],['Kickflip','Ollie',0],['Ollie','50-50 Grind',0]]){
  const cards=[a,b].map((n,i)=>({...TRICKS.find(c=>c.name===n),uid:'x'+i}));assert.equal(moduleBonusPoints(MODULES[3],cards),bonus);
 }
});
check('Retour du Rail: preserve own-color die for the last trick; mandatory two types remain enforced.',()=>{
 for(const ownLast of [true,false]){
  const g=game(4,['50-50 Grind','Ollie','180°']);land(g,0,[6,2,3,6,6,6],[1,2]);assert(!E.canStop(g));assert(!E.stop(g));assert(!E.chooseCard(g,g.hand[2].uid));next(g);
  land(g,1,[3,4,5,6],ownLast?[0,3]:[3,4]);stop(g);assert.equal(g.last.moduleBonus,ownLast?2:0);
 }
});
check('Tour de l’Îlot: freeze during one trick persists through Continue and the next roll; using that retained die earns +2.',()=>{
 const g=game(5,['180°','Kickflip','50-50 Grind']);choose(g,0);roll(g,[1,2,3,6,6,6]);assert(E.bonus(g,'freeze',0));placeLand(g,[1,2]);assert.deepEqual(g.frozen,[0]);next(g);assert.deepEqual(g.frozen,[0]);choose(g,1);roll(g,[4,5,6]);assert.equal(g.dice[0].face,1);placeLand(g,[0,3]);stop(g);assert.equal(g.last.moduleBonus,2);assert.deepEqual(g.moduleTrace.entries[1].carriedFrozen,[0]);
});
check('Freeze triggered at the decision commits continuation and can protect against a reroll in the following trick.',()=>{
 const g=game(5,['180°','Kickflip','50-50 Grind']);land(g,0,[1,2,3,6,6,6],[1,2]);assert(E.bonus(g,'freeze',0));assert.equal(g.phase,'select');assert(!E.stop(g));choose(g,1);roll(g,[4,5,6]);roll(g,[4,5,6],true);assert.equal(g.dice[0].face,1);placeLand(g,[0,3]);stop(g);assert.equal(g.last.moduleBonus,2);
});
check('Freeze immediately used, or only protected by a reroll within the same trick, does not count as a cross-trick freeze.',()=>{
 const g=game(5,['180°','Kickflip','50-50 Grind']);land(g,0,[2,3,6,6,6,6],[0,1]);next(g);choose(g,1);roll(g,[4,4,5,6]);assert(E.bonus(g,'freeze',2));roll(g,[4,5,6],true);placeLand(g,[2,3]);stop(g);assert.equal(g.last.moduleBonus,0);assert.deepEqual(g.moduleTrace.entries[1].carriedFrozen,[]);
});
check('Coping Bleu: failed first roll plus real reroll and landed trick earns +2; rerolling an already possible trick earns nothing.',()=>{
 for(const initiallyPossible of [false,true]){
  const g=game(6,['180°','50-50 Grind','Ollie']);choose(g,0);roll(g,initiallyPossible?[2,3,6,6,6,6]:[6,6,6,6,6,6]);roll(g,[2,3,6,6,6,6],true);placeLand(g,[0,1]);next(g);land(g,1,[4,5,6,6],[2,3]);stop(g);assert.equal(g.last.moduleBonus,initiallyPossible?0:2);
 }
});
check('A player cannot manufacture an initially failed roll using ±1 and then claim the rescue bonus.',()=>{
 const g=game(6,['180°','50-50 Grind','Ollie']);choose(g,0);roll(g,[4,4,6,6,6,6]);assert(E.bonus(g,'adjust',0,1));assert(!E.findMatch(E.activeCard(g),E.freeDice(g),E.wildColor(g)));roll(g,[2,3,6,6,6,6],true);placeLand(g,[0,1]);next(g);land(g,1,[4,5,6,6],[2,3]);stop(g);assert.equal(g.last.moduleBonus,0);
});
check('Double Quai: two within-card pairs qualify even without a shared face; a pair plus unequal dice fails.',()=>{
 for(const pair of [true,false]){
  const g=game(7,['Noseslide','Ollie','180°']);land(g,0,[3,3,6,6,6,6],[0,1]);next(g);land(g,1,[4,pair?4:5,6,6],[2,3]);stop(g);assert.equal(g.last.moduleBonus,pair?2:0);
 }
});
check('Double Quai also accepts repeated physical faces inside three-die cards; it does not require two-die tricks.',()=>{
 const g=game(7,['Smith Grind','Varial Heelflip']);land(g,0,[1,1,3,6,6,6],[0,1,2]);next(g);land(g,1,[2,2,4],[3,4,5]);stop(g);assert.equal(g.last.moduleBonus,2);
});
check('Marches: both physical Pop Shuvit copies activate independently; module +2, card +2 and third-trick +1 are separate.',()=>{
 const g=game(9,['Pop Shuvit','Boardslide','Pop Shuvit']);land(g,0,[2,3,6,6,6,6],[0,1]);next(g);land(g,1,[2,3,6,6],[2,3]);assert.equal(E.sequenceView(g).confirmed.moduleBonus,0);next(g);land(g,2,[2,3],[4,5]);stop(g);assert.equal(g.last.moduleBonus,2);assert.equal(g.last.cardBonus,2);assert.equal(g.last.sequenceBonus,1);assert.equal(g.score,11);assert(g.sequenceReward.pending);
});
check('Token rewards and the third-trick reward cannot masquerade as two card point effects.',()=>{
 const cards=['Nollie','Lipslide','180°'].map((name,i)=>({...TRICKS.find(c=>c.name===name),uid:'x'+i}));assert.equal(moduleBonusPoints(MODULES[9],cards),0);
});
check('Embruns: exactly two two-die cards earn +2; a third card removes that bonus while earning its own third-trick point.',()=>{
 const g=game(10,['Ollie','50-50 Grind','180°']);land(g,0,[2,3,6,6,6,6],[0,1]);next(g);land(g,1,[4,5,6,6],[2,3]);assert.equal(E.sequenceView(g).confirmed.moduleBonus,2);next(g);land(g,2,[2,3],[4,5]);stop(g);assert.equal(g.last.moduleBonus,0);assert.equal(g.last.sequenceBonus,1);
});
check('Embruns rewards an automatically banked two-card sequence when no card remains playable.',()=>{
 const g=game(10,['Ollie','50-50 Grind']);land(g,0,[2,3,6,6,6,6],[0,1]);next(g);land(g,1,[4,5,6,6],[2,3]);assert.equal(g.phase,'result');assert.equal(g.reason,'no-options');assert.equal(g.last.moduleBonus,2);
});
check('Boucle du Lagon: a four-die Epic can finish after a Base; an Epic followed by a Base does not qualify.',()=>{
 for(const epicLast of [true,false]){
  const g=game(8,epicLast?['Ollie','900°','180°']:['900°','Ollie','180°']);
  if(epicLast){land(g,0,[2,3,6,6,6,6],[0,1]);next(g);land(g,1,[4,4,5,5],[2,3,4,5]);}
  else{land(g,0,[4,4,5,5,6,6],[0,1,2,3]);next(g);land(g,1,[2,3],[4,5]);}
  stop(g);assert.equal(g.last.moduleBonus,epicLast?2:0);
 }
});
check('Grande Vague: 2+2+2, 3+3, 4+2 and 2+4 all qualify; one card or only five dice does not.',()=>{
 for(const costs of [[2,2,2],[3,3],[4,2],[2,4],[4],[3,2]])assert.equal(moduleBonusPoints(MODULES[11],costs.map((cost,i)=>({cost,uid:'x'+i}))),costs.length>=2&&costs.reduce((a,b)=>a+b,0)===6?2:0);
 const g=game(11,['900°','Ollie','180°']);land(g,0,[4,4,5,5,6,6],[0,1,2,3]);assert.equal(E.sequenceView(g).confirmed.moduleBonus,0);next(g);land(g,1,[2,3],[4,5]);stop(g);assert.equal(g.last.moduleBonus,2);
});
check('A fall cancels the entire attempt and module bonus; an impossible second mandatory type forces a fall.',()=>{
 const g=game(6,['180°','Overcrook']);land(g,0,[2,3,6,6,6,6],[0,1]);next(g);choose(g,1);roll(g,[6,6,6,6]);assert(E.fall(g));assert.equal(g.score,0);assert.equal(g.last.moduleBonus,0);assert.equal(g.last.bonus,0);assert.equal(g.secured.length,0);
 const h=game(4,['50-50 Grind','180°']);land(h,0,[2,3,6,6,6,6],[0,1]);assert.equal(h.reason,'fall');assert.equal(h.score,0);
});
check('Save/restore between frozen tricks preserves evidence; speculative NPC placements cannot mutate actual history.',()=>{
 let g=game(5,['180°','Kickflip','50-50 Grind']);land(g,0,[1,2,3,6,6,6],[1,2]);assert(E.bonus(g,'freeze',0));g=JSON.parse(JSON.stringify(g));choose(g,1);roll(g,[4,5,6]);
 const before=JSON.stringify(g),view=npcGameView(g),viewBefore=JSON.stringify(view);assert(bestPlacement(view,{evaluation:'score',difficulty:'expert'}));assert.equal(JSON.stringify(g),before);assert.equal(JSON.stringify(view),viewBefore);
 placeLand(g,[0,3]);stop(g);assert.equal(g.last.moduleBonus,2);
});
check('The two-trick minimum rejects otherwise matching historical evidence from a different attempt.',()=>{
 const g=game(1,['50-50 Grind','Ollie','180°']);land(g,0,[2,3,6,6,6,6],[0,1]);next(g);land(g,1,[3,4,6,6],[2,3]);stop(g);assert(E.proceed(g));assert.deepEqual(g.moduleTrace.entries,[]);assert.equal(g.used.reroll,0);assert.equal(E.sequenceView(g).confirmed.moduleBonus,0);
});
check('A promising pair forecast informs planning but awards no actual module points without landed physical dice.',()=>{
 const g=game(7,['Smith Grind','Varial Heelflip']);assert(projectedBonus(MODULES[7],g.hand,g)>0);assert.equal(E.sequenceScore(g.hand,MODULES[7],g).moduleBonus,0);
});
assert.deepEqual(await productionHashes(),before);
const report={theoretical:true,version:2,passed:true,groups:checks.length,checks,productionUnchanged:true};await writeFile(new URL('../../tests/theory85-module-v2-validation-results.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
