import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as M from '../public/match.js';
import * as E from '../public/engine.js';
import {MODULES,TRICKS,makeDeck} from '../public/data.js';
import {SKATERS,getSkater} from '../public/skaters.js';
import {decide} from '../public/npc.js';
import {npcContext,draftValue} from '../public/npc-strategy.js';
import {npcGameView} from '../public/npc-view.js';
import {auditObjectiveSpend} from './npc-objective-invariants.mjs';
import {decide as referenceDecide} from '../tests/fixtures/npc-052/npc.js';
import {npcDifficulty} from '../public/npc-difficulty.js';

const scenario=process.argv[2]||'normal',bases=Number(process.argv[3]||100);
assert(['easy','normal','expert','mixed','control','epic-offers','epic-open','reference'].includes(scenario));assert(Number.isInteger(bases)&&bases>0);
const directory=process.argv[4]||'tests/build-050-balance';mkdirSync(directory,{recursive:true});
const baseOffset=Number(process.argv[5]||0);assert(Number.isInteger(baseOffset)&&baseOffset>=0);
const hashes=()=>Object.fromEntries(['package.json',...readdirSync('public').filter(n=>n.endsWith('.js')).sort().map(n=>'public/'+n)].map(file=>[file,createHash('sha256').update(readFileSync(file)).digest('hex')]));
const originalHashes=hashes(),originalModules=structuredClone(MODULES),size=makeDeck().length;
const objectiveAudit=['0.5.2','0.5.3'].includes(JSON.parse(readFileSync('package.json','utf8')).version);
if(scenario==='control')for(const module of MODULES)module.bonus={kind:'none'};
const mix=index=>{let x=index>>>0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return(x^(x>>>15))>>>0;};
const stock=()=>({adjust:0,reroll:0,freeze:0});
const bucket=()=>({attempts:0,points:0,base:0,cardBonus:0,moduleBonus:0,sequenceBonus:0,extraPoints:0,extraTokens:0,banked:0,falls:0,passes:0,three:0,one:0,two:0,high18:0,high20:0,effectHits:0,histogram:{}});
const bankBucket=()=>({players:0,starting:stock(),gained:stock(),spent:stock(),remaining:stock(),remainingHistogram:{}});
const addStock=(a,b)=>{for(const type of E.BONUS_TYPES)a[type]+=b[type]||0;};
function addAttempt(b,a,g){
 b.attempts++;for(const key of ['points','base','cardBonus','moduleBonus','sequenceBonus'])b[key]+=a[key]||0;
 b.extraPoints+=a.moduleEffect.points;b.extraTokens+=a.moduleEffect.tokens;b.banked+=Number(a.success);b.falls+=Number(a.reason==='fall');b.passes+=Number(a.reason==='pass');
 b.three+=Number(a.success&&g.landed.length===3);b.two+=Number(a.success&&g.landed.length===2);b.one+=Number(a.success&&g.landed.length===1);
 b.high18+=Number(a.points>=18);b.high20+=Number(a.points>=20);b.effectHits+=Number(a.moduleEffect.points>0||a.moduleEffect.tokens>0);b.histogram[a.points]=(b.histogram[a.points]||0)+1;
}
const trickBucket=()=>({rolled:0,landed:0,banked:0,printedBanked:0,pointsBanked:0,drafted:0});
const playerBucket=()=>({appearances:0,winCredit:0,outright:0,winOrShare:0,pv:0,...bucket()});
const report={build:JSON.parse(readFileSync('package.json','utf8')).version,rulesVersion:E.RULESET_VERSION,saveVersion:M.MATCH_VERSION,date:'2026-11-02',scenario,bases,plannedGames:bases*4,completed:0,modulesPlayed:0,commands:0,draws:[0,0,0,0,0,0],epicDraft:{picks:0,pickedEpic:0,pickedLower:0},forcedOpenings:0,invariantChecks:0,sourceHashes:originalHashes,sourceUnchanged:null,
 configuration:{players:4,rounds:6,physicalCards:size,effects:scenario!=='control',modules:originalModules.map(({id,name,stage,needs,bonus,pv})=>({id,name,stage,needs,bonus,pv})),cautionBySeat:[1,1.12,1,.9],seedScheme:'mix32(580500 + base index); four cyclic first-player rotations per seed; rider choice cycles through six skaters',mixedPolicies:['normal','normal','easy','expert']},
 total:bucket(),attemptRounds:[bucket(),bucket()],tokenSpendByAttempt:[stock(),stock()],policies:{},modules:MODULES.map(m=>({id:m.id,name:m.name,kind:m.bonus.kind,...bucket(),attemptRounds:[bucket(),bucket()],appearances:0,bestSum:0,tied:0,unawarded:0,changedWinnerSets:0,winningWithPointEffect:0,winningSeats:0,marginSum:0})),rounds:Array.from({length:6},(_,i)=>({round:i+1,...bucket(),startStocks:stock(),endStocks:stock(),stockSamples:0})),
 openingCost:Object.fromEntries([2,3,4].map(n=>[n,bucket()])),trickCost:Object.fromEntries([2,3,4].map(n=>[n,trickBucket()])),trickTier:Object.fromEntries(['base','advanced','epic'].map(t=>[t,trickBucket()])),trickType:Object.fromEntries(['kick','slide','air'].map(t=>[t,trickBucket()])),cards:TRICKS.map(c=>({id:c.id,name:c.name,type:c.type,tier:c.tier,cost:c.cost,points:c.points,p6:c.p6,...trickBucket()})),
 seats:Array.from({length:4},(_,i)=>({seat:i,...playerBucket()})),firstPositions:Array.from({length:4},(_,i)=>({position:i+1,...playerBucket()})),riders:SKATERS.map(s=>({id:s.id,name:s.name,...playerBucket()})),moduleOrder:Array.from({length:4},(_,i)=>({position:i+1,appearances:0,pv:0,winCredit:0,...bucket()})),tokens:bankBucket(),tokensByPolicy:{},tokenSources:{draft:stock(),card:stock(),three:stock(),recovery:stock(),extraThree:stock()},games:[]};
const policyBucket=level=>report.policies[level]??=( {...playerBucket()} );
report.objectiveSpends={checked:0,scoringPossible:0,profitableTokensPossible:0,paths:0};
const tokenPolicy=level=>report.tokensByPolicy[level]??=bankBucket();
function independentScore(g,module){
 const cards=g.landed.map(e=>g.hand.find(c=>c.uid===e.card)),b=module.bonus,success=!['fall','pass'].includes(g.reason);
 if(!success)return{points:0,base:0,cardBonus:0,moduleBonus:0,sequenceBonus:0,rewardTokens:0,effect:{points:0,tokens:0},cardEffects:[]};
 const own=getSkater(g.skaterId).colorKey;
 const cardEffects=cards.map((c,i)=>{
  const intrinsic=c.comboBonus?.kind==='companion'&&cards.some((d,j)=>i!==j&&d.type===c.comboBonus.type)?c.comboBonus.points:0;
  const dice=g.landed[i].dice.map(id=>g.dice[id]);let extra=0;
  if(b.kind==='base'&&c.tier==='base')extra=b.points;
  if(b.kind==='favored'&&c.type===b.type)extra=b.points;
  if(b.kind==='amplitude'&&(c.cost===3||c.cost===4))extra=b.points;
  if(b.kind==='signature'&&dice.some(d=>d.color===own))extra=b.points;
  if(b.kind==='stars')extra=dice.filter(d=>d.face===1).length*b.points;
  return{intrinsic,extra};
 });
 const base=cards.reduce((n,c)=>n+c.points,0),cardBonus=cardEffects.reduce((n,c)=>n+c.intrinsic,0),moduleBonus=cardEffects.reduce((n,c)=>n+c.extra,0),sequenceBonus=cards.length===3?(b.kind==='three-score'?2:1):0;
 const rewardTokens=cards.length===3?(b.kind==='three-tokens'?2:1):cards.length===2&&b.kind==='recovery'?1:0;
 return {points:base+cardBonus+moduleBonus+sequenceBonus,base,cardBonus,moduleBonus,sequenceBonus,rewardTokens,effect:{points:moduleBonus+Math.max(0,sequenceBonus-(cards.length===3?1:0)),tokens:Math.max(0,rewardTokens-(cards.length===3?1:0))},cardEffects};
}
function checkInventory(m){const all=[...m.deck,...m.market.cards,...m.discard,...m.players.flatMap(p=>p.game.hand)];assert.equal(all.length,size);assert.equal(new Set(all.map(c=>c.uid)).size,size);report.invariantChecks++;}
const started=Date.now();
for(let baseIndex=baseOffset;baseIndex<baseOffset+bases;baseIndex++)for(let rotation=0;rotation<4;rotation++){
 const seed=mix(580500+baseIndex),level=scenario==='easy'||scenario==='expert'?scenario:'normal';
 const m=M.newMatch({seed,npcCount:3,npcDifficulty:level,skaterId:SKATERS[baseIndex%6].id});
 const cut=m.order.indexOf(rotation);m.order=[...m.order.slice(cut),...m.order.slice(0,cut)];m.active=m.order[0];m.position=0;
 const startingOrder=[...m.order],policy=m.players.map(p=>scenario==='reference'&&p.seat===baseIndex%4?'reference':scenario==='mixed'?report.configuration.mixedPolicies[(p.seat+baseIndex)%4]:level);
 const game={baseIndex,rotation,seed,route:[...m.route],total:bucket(),attemptRounds:[bucket(),bucket()],modules:{},players:m.players.map(p=>({seat:p.seat,rider:p.skaterId,policy:policy[p.seat],firstPosition:startingOrder.indexOf(p.seat)+1,...bucket(),gained:stock(),spent:stock(),remaining:stock(),pv:0,winCredit:0,modulesWon:0,soleModulesWon:0})),openingCost:Object.fromEntries([2,3,4].map(n=>[n,bucket()]))};
 let steps=0;
 const stockStart=()=>{const round=report.rounds[m.module];for(const p of m.players){addStock(round.startStocks,p.game.bank);round.stockSamples++;}};
 while(m.phase!=='complete'){
  assert(++steps<2400,'Deadlock '+scenario+' '+baseIndex+' '+rotation);
  if(m.phase==='recap'){assert(M.advance(m));continue;}
  if(m.phase==='draft-summary'){assert(M.startModule(m));stockStart();checkInventory(m);continue;}
  const p=M.currentPlayer(m),g=p.game,level=policy[p.seat],view=npcGameView(g),context={...npcContext(m,p),difficulty:level==='reference'?'normal':level};
  let action=(level==='reference'?referenceDecide:decide)(view,context);assert(action,'No action');
  if(action.type==='bonus'&&level!=='reference')assert(Object.values(g.used).reduce((a,b)=>a+b,0)+1<=(npcDifficulty(level).maxBonusSpend??Infinity),'NPC exceeded its strategic bonus budget');
  if(scenario.startsWith('epic-')&&g.phase==='draft'&&m.market.tier==='epic'){
   const offered=view.draftCards.filter(c=>c.tier==='epic').sort((a,b)=>draftValue(b,view)-draftValue(a,view)||a.id-b.id);
   if(offered.length)action={...action,cardId:offered[0].uid};
  }
  if(scenario==='epic-open'&&g.phase==='select'&&!g.landed.length&&m.module===5){
   const choices=E.options(view).filter(c=>c.cost===4).sort((a,b)=>draftValue(b,view)-draftValue(a,view)||a.id-b.id);
   if(choices.length){action={type:'choose',cardId:choices[0].uid};report.forcedOpenings++;}
  }
  if(objectiveAudit){const verified=auditObjectiveSpend(view,context,action);if(verified){report.objectiveSpends.checked++;report.objectiveSpends.scoringPossible+=Number(verified.scoring);report.objectiveSpends.profitableTokensPossible+=Number(verified.profitable);report.objectiveSpends.paths+=verified.paths;}}
  const beforePhase=g.phase,beforeBank={...g.bank},beforeChoice=g.sequenceReward?.choices.length||0,card=E.activeCard(g),module=MODULES[g.route[g.module]],round=g.module,position=m.order.indexOf(p.seat),sample=game.players[p.seat];
  const rolling=action.type==='roll'||action.type==='bonus'&&action.bonusType==='reroll'?E.rerollableDice(g).map(d=>d.id):[];
  const protectedDice=rolling.length?g.dice.filter(d=>!rolling.includes(d.id)).map(d=>({id:d.id,face:d.face})):[];
  const draftCard=action.type==='draft'?m.deck.find(c=>c.uid===action.cardId):action.type==='draft-pair'?[...m.market.cards,...(m.market.reserve||[])].find(c=>c.uid===action.cardId):null;
  if(action.type==='draft-pair'&&m.market.tier==='epic'){report.epicDraft.picks++;if(draftCard.tier==='epic')report.epicDraft.pickedEpic++;else report.epicDraft.pickedLower++;}
  assert(M.dispatch(m,{playerId:p.id,...action}),'Illegal '+JSON.stringify(action));report.commands++;
  for(const type of E.BONUS_TYPES){
   const delta=g.bank[type]-beforeBank[type];assert(g.bank[type]>=0);
   if(delta<0){assert.equal(action.type,'bonus');assert.equal(delta,-1);sample.spent[type]-=delta;report.tokenSpendByAttempt[g.attempt][type]-=delta;}
   if(delta>0){sample.gained[type]+=delta;let source=action.type==='draft-pair'?'draft':action.type==='proceed'?'card':action.type==='claim-sequence'?(module.bonus.kind==='recovery'?'recovery':module.bonus.kind==='three-tokens'&&beforeChoice===1?'extraThree':'three'):null;assert(source,'Unexpected gain');report.tokenSources[source][type]+=delta;}
  }
  for(const id of rolling){const face=g.dice[id].face;assert(Number.isInteger(face)&&face>=1&&face<=6);report.draws[face-1]++;}
  for(const die of protectedDice)assert.equal(g.dice[die.id].face,die.face,'Protected die changed');
  if(draftCard)for(const row of [report.cards[draftCard.id],report.trickCost[draftCard.cost],report.trickTier[draftCard.tier],report.trickType[draftCard.type]])row.drafted++;
  if(action.type==='roll')for(const row of [report.cards[card.id],report.trickCost[card.cost],report.trickTier[card.tier],report.trickType[card.type]])row.rolled++;
  if(action.type==='land'){
   const allIds=g.landed.flatMap(e=>e.dice);assert.equal(allIds.length,new Set(allIds).size);assert(allIds.length<=6);assert(g.landed.length<=3);
   for(const entry of g.landed){const c=g.hand.find(c=>c.uid===entry.card);assert.equal(entry.dice.length,c.cost);assert(E.findMatch(c,entry.dice.map(id=>g.dice[id]),E.wildColor(g)));}
   for(const row of [report.cards[card.id],report.trickCost[card.cost],report.trickTier[card.tier],report.trickType[card.type]])row.landed++;
   report.invariantChecks++;
  }
  if(beforePhase!=='result'&&g.phase==='result'){
   const a=g.last,expected=independentScore(g,module);for(const key of ['points','base','cardBonus','moduleBonus','sequenceBonus','rewardTokens'])assert.equal(a[key],expected[key],module.name+' '+key);assert.deepEqual(a.moduleEffect,expected.effect);report.invariantChecks++;
   const mod=report.modules[module.id],local=game.modules[module.id]??={...bucket(),attemptRounds:[bucket(),bucket()],bestSum:0,changedWinnerSets:0,tied:0,margin:0};
   for(const row of [report.total,policyBucket(level),mod,report.rounds[round],report.seats[p.seat],report.firstPositions[sample.firstPosition-1],report.riders.find(r=>r.id===p.skaterId),report.moduleOrder[position],game.total,sample,local,report.attemptRounds[g.attempt],mod.attemptRounds[g.attempt],game.attemptRounds[g.attempt],local.attemptRounds[g.attempt]])addAttempt(row,a,g);
   const opening=g.hand.find(c=>c.uid===(g.landed[0]?.card||g.active));
   if(opening)for(const row of [report.openingCost[opening.cost],game.openingCost[opening.cost]])addAttempt(row,a,g);
   if(a.success)g.landed.forEach((entry,i)=>{const c=g.hand.find(c=>c.uid===entry.card);for(const row of [report.cards[c.id],report.trickCost[c.cost],report.trickTier[c.tier],report.trickType[c.type]]){row.banked++;row.printedBanked+=c.points;row.pointsBanked+=c.points+expected.cardEffects[i].intrinsic+expected.cardEffects[i].extra;}});
  }
  if(m.phase==='recap'){
   report.modulesPlayed++;checkInventory(m);const recap=m.recaps.at(-1),mod=report.modules[recap.module],local=game.modules[recap.module];mod.appearances++;
   const stripped=recap.rows.map(r=>({id:r.id,score:Math.max(...r.attempts.map(a=>a.points-a.moduleEffect.points))})),top=Math.max(...stripped.map(r=>r.score)),winners=top>0?stripped.filter(r=>r.score===top).map(r=>r.id).sort():[];
   const changed=Number(JSON.stringify([...recap.winners].sort())!==JSON.stringify(winners));mod.changedWinnerSets+=changed;local.changedWinnerSets=changed;mod.tied+=Number(recap.winners.length>1);local.tied=Number(recap.winners.length>1);mod.unawarded+=Number(!recap.winners.length);
   const scores=recap.rows.map(r=>r.best).sort((a,b)=>b-a);mod.marginSum+=scores[0]-scores[1];local.margin=scores[0]-scores[1];
   for(const row of recap.rows){mod.bestSum+=row.best;local.bestSum+=row.best;const seat=m.players.find(p=>p.id===row.id).seat,pos=m.order.indexOf(seat),won=recap.winners.includes(row.id);report.moduleOrder[pos].appearances++;report.moduleOrder[pos].pv+=row.gain;report.moduleOrder[pos].winCredit+=won?1/recap.winners.length:0;if(won){game.players[seat].modulesWon++;game.players[seat].soleModulesWon+=Number(recap.winners.length===1);mod.winningSeats++;mod.winningWithPointEffect+=Number(row.attempts.some(a=>a.points===row.best&&a.moduleEffect.points>0));}}
   for(const q of m.players)addStock(report.rounds[round].endStocks,q.game.bank);
  }
 }
 const top=Math.max(...m.players.map(p=>p.game.pv)),winners=m.players.filter(p=>p.game.pv===top),summary=M.matchSummary(m);
 for(const p of m.players){
  const sample=game.players[p.seat],row=summary.players.find(r=>r.id===p.id);sample.pv=p.game.pv;sample.winCredit=winners.includes(p)?1/winners.length:0;sample.outright=Number(winners.length===1&&winners.includes(p));sample.winOrShare=Number(winners.includes(p));sample.remaining={...p.game.bank};
  assert.equal(sample.attempts,12);assert.equal(sample.falls,row.falls);assert.equal(sample.three,row.threeTrickSequences);assert.deepEqual(sample.gained,row.tokens.gained);assert.deepEqual(sample.spent,row.tokens.spent);
  for(const type of E.BONUS_TYPES)assert.equal(1+sample.gained[type]-sample.spent[type],sample.remaining[type]);
  for(const b of [report.seats[p.seat],report.firstPositions[sample.firstPosition-1],report.riders.find(r=>r.id===p.skaterId),policyBucket(sample.policy)]){b.appearances++;b.pv+=sample.pv;b.winCredit+=sample.winCredit;b.outright+=sample.outright;b.winOrShare+=sample.winOrShare;}
  for(const b of [report.tokens,tokenPolicy(sample.policy)]){b.players++;addStock(b.starting,{adjust:1,reroll:1,freeze:1});addStock(b.gained,sample.gained);addStock(b.spent,sample.spent);addStock(b.remaining,sample.remaining);const total=Object.values(sample.remaining).reduce((a,b)=>a+b,0);b.remainingHistogram[total]=(b.remainingHistogram[total]||0)+1;}
 }
 game.maxPV=top;game.tiedWinner=winners.length>1;const pv=m.players.map(p=>p.game.pv).sort((a,b)=>b-a);game.winnerLead=pv[0]-pv[1];game.sweep=m.players.some(p=>game.players[p.seat].modulesWon===6);game.soleSweep=m.players.some(p=>game.players[p.seat].soleModulesWon===6);report.games.push(game);report.completed++;
 if(report.completed%20===0){const progress={scenario,completed:report.completed,total:report.plannedGames,elapsedSeconds:+((Date.now()-started)/1000).toFixed(1)};writeFileSync(directory+'/'+scenario+'-progress.json',JSON.stringify(progress));console.log(JSON.stringify(progress));}
}
report.elapsedSeconds=(Date.now()-started)/1000;report.sourceUnchanged=JSON.stringify(hashes())===JSON.stringify(originalHashes);assert(report.sourceUnchanged,'Production source changed during audit');
writeFileSync(directory+'/'+scenario+'.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({done:scenario,games:report.completed,seconds:report.elapsedSeconds,attempts:report.total.attempts,checks:report.invariantChecks}));
