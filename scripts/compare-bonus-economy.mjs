// Run before and after a rules change with the same seeds and controllers.
// node scripts/compare-bonus-economy.mjs before 250
// node scripts/compare-bonus-economy.mjs after 250
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as M from '../public/match.js';
import * as E from '../public/engine.js';
import {decide} from '../public/npc.js';
import {SKATERS, getSkater} from '../public/skaters.js';
const label=process.argv[2]||'after',sessions=Number(process.argv[3]||250);
assert(['before','after'].includes(label)&&Number.isInteger(sessions)&&sessions>0);
assert(label!=='before'||E.RULESET_VERSION===12,'The before report was captured on rules v12; run this mode on that source revision, before applying v13.');
const types=['adjust','reroll','freeze'],stock=g=>types.reduce((sum,t)=>sum+g.bank[t],0);
const seedFor=i=>{let x=i>>>0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return (x^(x>>>15))>>>0;};
const report={label,freezePersistence:'sequence',rulesVersion:E.RULESET_VERSION,sessionsPerProfile:sessions,players:4,lengths:[4,6],
 methodology:'Same mixed seed indices, rotating human skater, lengths and public heuristic controllers before/after. Four risk profiles; identical card-combination and point rules. Every seat uses legal production commands and visible state only. Random streams diverge after different actions. This measures these policies, not optimal or human play.',runs:[]};
for(const profile of ['prudent','competitive','audacious','mixed']){
 const r={profile,completed:0,attempts:0,modules:0,points:0,falls:0,threeTricks:0,unawarded:0,ties:0,
  tokenUses:Object.fromEntries(types.map(t=>[t,0])),tokenGains:{draft:0,cards:0,sequence:0},
  moduleEndStock:0,moduleEndPlayers:0,emptyModuleEnd:0,maxStock:3,finalStocks:[],
  colors:Object.fromEntries(SKATERS.map(s=>[s.colorKey,{pv:0,modules:0}]))};
 for(let index=1;index<=sessions;index++){
  const m=M.newMatch({seed:seedFor(index),npcCount:3,length:index%2?6:4,skaterId:SKATERS[(index-1)%6].id});let steps=0;
  while(m.phase!=='complete'){
   assert(++steps<3000,`deadlock ${profile}/${index}`);
   if(m.phase==='recap'){
    for(const p of m.players){const n=stock(p.game);r.moduleEndStock+=n;r.moduleEndPlayers++;r.emptyModuleEnd+=n===0;const c=r.colors[getSkater(p.skaterId).colorKey];c.pv+=m.recaps.at(-1).rows.find(row=>row.id===p.id).gain;c.modules++;}
    assert(M.advance(m));
   }else if(m.phase==='draft-summary')assert(M.startModule(m));
   else{
    const p=M.currentPlayer(m),g=p.game,kind=profile==='mixed'?['prudent','competitive','competitive','audacious'][p.seat]:profile;
    const caution={prudent:1.4,competitive:1.05,audacious:.75}[kind];
    const leader=kind==='prudent'?0:Math.max(0,...m.players.flatMap(p=>p.game.attempts.map(a=>a.points)));
    const command=decide(g,{leader,caution}),before=stock(g);
    assert(command,`no command ${g.phase}`);
    if(command.type==='bonus')r.tokenUses[command.bonusType]++;
    assert(M.dispatch(m,{playerId:p.id,...command}),JSON.stringify({phase:g.phase,command}));
    const gained=stock(g)-before;
    if(gained>0){const source=command.type==='draft-pair'?'draft':command.type==='claim-sequence'?'sequence':'cards';r.tokenGains[source]+=gained;}
   }
   for(const p of m.players){assert(types.every(t=>Number.isInteger(p.game.bank[t])&&p.game.bank[t]>=0));r.maxStock=Math.max(r.maxStock,stock(p.game));}
  }
  const inventory=[...m.deck,...m.market.cards,...m.discard,...m.players.flatMap(p=>p.game.hand)];
  assert.equal(inventory.length,72);assert.equal(new Set(inventory.map(c=>c.uid)).size,72);
  r.completed++;r.modules+=m.recaps.length;
  for(const p of m.players){assert.equal(p.game.pv,p.game.history.reduce((sum,h)=>sum+h.pv,0));r.finalStocks.push(stock(p.game));}
  for(const recap of m.recaps){r.unawarded+=!recap.winners.length;r.ties+=recap.winners.length>1;for(const row of recap.rows)for(const a of row.attempts){r.attempts++;r.points+=a.points;r.falls+=a.reason==='fall';r.threeTricks+=a.reason==='three';}}
 }
 r.finalStocks.sort((a,b)=>a-b);
 r.summary={fallRate:r.falls/r.attempts,meanAttempt:r.points/r.attempts,threeTrickRate:r.threeTricks/r.attempts,unawardedRate:r.unawarded/r.modules,tieRate:r.ties/r.modules,
  tokensUsedPerPlayerModule:Object.values(r.tokenUses).reduce((a,b)=>a+b,0)/(r.modules*4),tokensGainedPerPlayerModule:Object.values(r.tokenGains).reduce((a,b)=>a+b,0)/(r.modules*4),
  meanModuleEndStock:r.moduleEndStock/r.moduleEndPlayers,emptyModuleEndRate:r.emptyModuleEnd/r.moduleEndPlayers,
  finalStockMedian:r.finalStocks[Math.floor(r.finalStocks.length*.5)],finalStockP95:r.finalStocks[Math.floor(r.finalStocks.length*.95)],maxStock:r.maxStock};
 delete r.finalStocks;report.runs.push(r);console.log(JSON.stringify({profile,...r.summary}));
}
const file=new URL(`../tests/bonus-economy-${label}.json`,import.meta.url);
writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log('Saved '+file.pathname);
