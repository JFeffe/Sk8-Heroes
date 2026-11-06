import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import * as E from '../../.local-games/theory85-runtime/engine.js';
import {MODULES,TRICKS} from '../../.local-games/theory85-runtime/data.js';
import {moduleBonusPoints} from '../../.local-games/theory85-runtime/module-rules.js';
const proposal=JSON.parse(await readFile(new URL('../../tests/fixtures/theory85-modules-v1.json',import.meta.url),'utf8'));
for(const m of proposal.modules)Object.assign(MODULES[m.id],m);
const fake=(type,cost=2,name=type)=>({type,cost,name});
const checks=[];
assert.equal(proposal.modules.filter(m=>m.stage===0).length,4);assert.equal(proposal.modules.filter(m=>m.stage===1).length,6);assert.equal(proposal.modules.filter(m=>m.stage===2).length,2);
assert(proposal.modules.every(m=>m.pv===[2,3,4][m.stage]&&m.bonusPoints===2));
checks.push('Four early, six middle and two final modules; PV 2/3/4 and optional sequence bonus +2 preserved.');
for(const costs of [[2,2,2],[3,3],[4,2],[2,4]])assert.equal(moduleBonusPoints(MODULES[11],costs.map((cost,i)=>fake(i?'kick':'air',cost))),2);
for(const costs of [[4],[3],[2,2],[3,2]])assert.equal(moduleBonusPoints(MODULES[11],costs.map((cost,i)=>fake(i?'kick':'air',cost))),0);
checks.push('Grande Vague grants +2 for 2+2+2, 3+3, 4+2 and 2+4 dice; never for one 4-die Air or only five dice.');
assert.equal(moduleBonusPoints(MODULES[10],[fake('air',3),fake('kick',3)]),2);
assert.equal(moduleBonusPoints(MODULES[10],[fake('air',3),fake('kick',2)]),0);
assert.equal(moduleBonusPoints(MODULES[10],[fake('air',3)]),0);
assert.equal(moduleBonusPoints(MODULES[1],[fake('slide'),fake('kick')]),2);
assert.equal(moduleBonusPoints(MODULES[1],[fake('slide'),fake('slide')]),0);
assert.equal(moduleBonusPoints(MODULES[5],[fake('kick'),fake('air')]),2);
assert.equal(moduleBonusPoints(MODULES[5],[fake('air'),fake('kick')]),0);
checks.push('Embruns requires two separate 3-die cards; Quai bas and Tour de l’Îlot require their printed order for the optional bonus.');

const physical=name=>({...TRICKS.find(c=>c.name===name),uid:name});
function game(module,names){const g=E.newGame({skaterId:'neo',route:[3,2,4,5,6,11]},()=>.4);g.module=module;g.phase='select';g.hand=names.map(physical);return g;}
function land(g,name,faces){assert(E.chooseCard(g,name));let i=0;assert(E.roll(g,()=>((faces[i++]??6)-.5)/6));assert(E.autoPlace(g));assert(E.land(g));}
let g=game(5,['900°','Ollie']);land(g,'900°',[4,4,5,5,3,6]);assert.equal(E.sequenceView(g).confirmed.moduleBonus,0);assert(E.continueRun(g));land(g,'Ollie',[6,6]);assert.equal(g.last.moduleBonus,2);assert.equal(g.landed.length,2);assert(!g.sequenceReward);
g=game(5,['360°','Ollie','50-50 Grind']);land(g,'360°',[1,4,6,6,6,6]);assert(E.continueRun(g));land(g,'Ollie',[6,6,6,6]);assert.equal(E.sequenceView(g).confirmed.moduleBonus,0);assert(E.continueRun(g));land(g,'50-50 Grind',[4,4]);assert.equal(g.last.moduleBonus,2);assert.equal(g.last.sequenceBonus,1);assert(g.sequenceReward.pending);
checks.push('Real-engine Grande Vague: 900° alone gets no module bonus; 900°+Ollie gets +2; three 2-die cards get module +2 and their separate third-trick point/token.');

g=game(2,['Feeble Grind','Backside Flip','180°']);
assert(!E.chooseCard(g,'180°'));land(g,'Feeble Grind',[1,3,5,2,4,6]);assert(!E.canStop(g));assert(!E.stop(g));assert(!E.chooseCard(g,'180°'));assert.deepEqual(E.requiredTypes(g),['kick']);assert(E.continueRun(g));land(g,'Backside Flip',[2,4,6]);assert.equal(g.last.moduleBonus,2);
checks.push('Two-type mandatory opening remains enforced: missing type cannot be skipped or banked; third card stays free when dice permit.');
const result={theoretical:true,passed:true,checks:checks.length,details:checks};await writeFile(new URL('../../tests/theory85-module-validation-results.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
