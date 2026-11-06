import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(p,'utf8')),directory='tests/build-051-balance';
const sum=o=>Object.values(o).reduce((a,b)=>a+b,0),ratio=(a,b)=>b?a/b:null;
function ci(values){const n=values.length,mean=sum(values)/n,variance=values.reduce((a,v)=>a+(v-mean)**2,0)/(n-1),margin=(n>=100?1.984:2.01)*Math.sqrt(variance/n);return {mean,low:mean-margin,high:mean+margin,seeds:n};}
function clustered(games,measure){const blocks=new Map();for(const g of games){const block=blocks.get(g.baseIndex)||[];block.push(measure(g));blocks.set(g.baseIndex,block);}return ci([...blocks.values()].map(v=>sum(v)/v.length));}
function conditionalScoreCI(games){
 const blocks=new Map();for(const g of games){const sample=g.openingCost['4'];if(!sample.attempts)continue;const b=blocks.get(g.baseIndex)||{points:0,n:0};b.points+=sample.points;b.n+=sample.attempts;blocks.set(g.baseIndex,b);}
 const rows=[...blocks.values()],n=rows.length,total=rows.reduce((a,b)=>a+b.n,0),mean=rows.reduce((a,b)=>a+b.points,0)/total;
 const margin=(n>=100?1.984:2.01)*Math.sqrt(n/(n-1)*rows.reduce((a,b)=>a+(b.points-mean*b.n)**2,0))/total;
 return {mean,low:mean-margin,high:mean+margin,seeds:n};
}
function stats(b){return {attempts:b.attempts,score:ratio(b.points,b.attempts),falls:ratio(b.falls,b.attempts),three:ratio(b.three,b.attempts)};}
function summarize(r){const t=r.tokens;return {build:r.build,games:r.completed,checks:r.invariantChecks,...stats(r.total),scoreCI:clustered(r.games,g=>g.total.points/g.total.attempts),tokens:{gained:sum(t.gained)/t.players,spent:sum(t.spent)/t.players,remaining:sum(t.remaining)/t.players,byType:Object.fromEntries(['adjust','reroll','freeze'].map(k=>[k,{gained:t.gained[k]/t.players,spent:t.spent[k]/t.players,remaining:t.remaining[k]/t.players}]))},epicDraft:{picks:r.completed*4,epics:r.trickTier.epic.drafted,rate:r.trickTier.epic.drafted/(r.completed*4)},fourDice:r.trickCost['4'],openingFour:{...stats(r.openingCost['4']),scoreCI:r.openingCost['4'].attempts?clustered(r.games.filter(g=>g.openingCost['4'].attempts),g=>g.openingCost['4'].points/g.openingCost['4'].attempts):null},order:r.moduleOrder.map(b=>({position:b.position,credit:b.winCredit/b.appearances})),attemptRounds:r.attemptRounds.map(stats),rounds:r.rounds.map(b=>({round:b.round,...stats(b)})),policies:Object.fromEntries(Object.entries(r.policies).map(([k,b])=>[k,{appearances:b.appearances,credit:b.winCredit/b.appearances,...stats(b)}]))};}
const report={build:'0.5.1',date:'2026-11-02',games:0,attempts:0,modules:0,checks:0,replayGames:400,tests:228,scenarios:{},paired:{},unchangedRules:true};
const measures={score:g=>g.total.points/g.total.attempts,falls:g=>g.total.falls/g.total.attempts,three:g=>g.total.three/g.total.attempts,remaining:g=>g.players.reduce((a,p)=>a+sum(p.remaining),0)/4};
const allowedChanges=['package.json','public/npc-strategy.js','public/release-notes.js'];
for(const name of ['normal','easy','expert','mixed']){
 const before=read('tests/build-050-balance/'+name+'.json'),after=read(directory+'/'+name+'.json');
 assert.equal(after.completed,after.plannedGames);assert(after.sourceUnchanged);assert.equal(after.completed,before.completed);
 const changed=Object.keys(after.sourceHashes).filter(k=>after.sourceHashes[k]!==before.sourceHashes[k]);assert.deepEqual(changed.sort(),[...allowedChanges].sort());
 assert.deepEqual(after.configuration.modules,before.configuration.modules);assert.equal(after.configuration.physicalCards,85);
 report.scenarios[name]={before:summarize(before),after:summarize(after)};
 report.paired[name]={};for(const [key,measure] of Object.entries(measures)){
  const blocks=new Map();for(let i=0;i<after.games.length;i++){const a=after.games[i],b=before.games[i];assert.equal(a.seed,b.seed);assert.equal(a.rotation,b.rotation);assert.deepEqual(a.route,b.route);assert.deepEqual(a.players.map(p=>p.rider),b.players.map(p=>p.rider));const block=blocks.get(a.baseIndex)||[];block.push(measure(a)-measure(b));blocks.set(a.baseIndex,block);}
  report.paired[name][key]=ci([...blocks.values()].map(v=>sum(v)/v.length));
 }
 report.games+=after.completed;report.attempts+=after.total.attempts;report.modules+=after.modulesPlayed;report.checks+=after.invariantChecks;
}
for(const {before,after} of Object.values(report.scenarios)){
 for(const s of [before,after])delete s.openingFour.scoreCI;
}
const holdout=read('tests/build-051-holdout/normal.json'),normal=read(directory+'/normal.json'),replay=read('tests/build-051-replay/normal.json');
assert(holdout.sourceUnchanged);assert.deepEqual(holdout.sourceHashes,normal.sourceHashes);assert.deepEqual(replay.sourceHashes,normal.sourceHashes);
assert.deepEqual(replay.games,normal.games);assert.deepEqual(replay.total,normal.total);assert.equal(replay.commands,normal.commands);
assert(holdout.games.every(g=>g.baseIndex>=100));assert(normal.games.every(g=>g.baseIndex<100));
report.holdout=summarize(holdout);report.holdout.openingFour.scoreCI=conditionalScoreCI(holdout.games);report.scenarios.normal.after.openingFour.scoreCI=conditionalScoreCI(normal.games);report.games+=holdout.completed;report.attempts+=holdout.total.attempts;report.modules+=holdout.modulesPlayed;report.checks+=holdout.invariantChecks;
assert.equal(report.games,1600);assert.equal(report.attempts,76800);
const testLog=readFileSync('.local-games/build051-tests.log','utf8');assert.match(testLog,/pass 228/);assert.match(testLog,/fail 0/);
report.method={pairedGames:1200,freshNormalGames:400,pilotGamesExcluded:200,seedScheme:'mix32(580500 + baseIndex), four cyclic first-player rotations; matched seeds 0–99 (50 for easy/expert), holdout 100–199',replay:'400 Normal games repeated: all recorded game statistics, decision counts and totals identical. Replays excluded from sample size.',confidence:'Approximate 95% paired confidence intervals, four rotations clustered by independent seed.',limits:['Public opponent-strength estimates are heuristic, not exact probabilities of winning.','Same seed, route, roles and initial order; later decisions and random draws diverge.','Card selection and dice-cost comparisons remain conditional on the policy.','Results describe NPCs, not win rates against humans.'],sourceChanges:allowedChanges};
writeFileSync(directory+'/comparison.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({games:report.games,attempts:report.attempts,checks:report.checks,normal:report.scenarios.normal,pairedNormal:report.paired.normal,holdout:report.holdout,mixed:report.scenarios.mixed.after.policies},null,2));
