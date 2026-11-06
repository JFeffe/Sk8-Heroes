// Isolated balance experiment: mutate the imported catalog in this process only.
// No production files, probabilities, rules or saved games are written.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import * as E from '../public/engine.js';
import * as M from '../public/match.js';
import {TRICKS,MODULES} from '../public/data.js';
import {findMatch} from '../public/combinations.js';
import {probability} from './dice-probability.mjs';
import {closestMatch,freezeChoice} from '../public/npc.js';
import {chanceBeforeRoll,rollProbability} from '../public/roll-probability.js';

const baseline=JSON.parse(readFileSync(new URL('../tests/fixtures/balance-baseline.json',import.meta.url),'utf8'));
const original=baseline.cards;
const deployed=structuredClone(TRICKS),deployedModules=structuredClone(MODULES);
const exact=(values,points)=>({pattern:'exact',values,cost:values.length,points});
const threshold=(pattern,threshold,points=3)=>({pattern,threshold,cost:2,points});
const choices=(choices,points)=>({pattern:'choices',choices,cost:choices[0].length,points});
function multisets(values,n,start=0,prefix=[],out=[]){
 if(!n){out.push(prefix);return out;}
 for(let i=start;i<values.length;i++)multisets(values,n-1,i,[...prefix,values[i]],out);
 return out;
}
const proposed=original.map(c=>({...c}));
const specs={
 0:threshold('at-least',4),1:threshold('at-least',2),2:threshold('at-most',3),
 3:{pattern:'odd-distinct',cost:2,points:4},4:exact([3,6],7),5:threshold('at-least',5,5),
 6:exact([4,4],11),7:exact([2,5,5],20),8:choices(multisets([2,4,6],3),5),
 9:threshold('at-most',5),10:threshold('at-least',3),11:{pattern:'straight',cost:2,points:3},
 12:{pattern:'even-distinct',cost:2,points:4},13:choices(multisets([1,3,5],3),5),
 14:threshold('at-most',2,5),15:exact([3,6,6],20),16:exact([2,5],7),17:exact([2,4,6],12),
 18:threshold('at-most',4),19:choices([1,2].flatMap(a=>[3,4].flatMap(b=>[5,6].map(c=>[a,b,c]))),4),
 20:choices([[1,3,5],[2,4,6]],6),21:{pattern:'straight',cost:4,points:11},
 22:choices([[4,4,5,5],[4,4,6,6],[5,5,6,6]],24),
 23:choices([1,2,3,4,5,6].map(v=>[v,v,v,v]),57)
};
for(const c of proposed){delete c.values;delete c.choices;delete c.threshold;Object.assign(c,specs[c.id]);}
const adjustedPoints=[3,2,3,4,7,5,9,12,6,2,2,3,4,6,5,12,7,10,3,6,8,10,13,16];
const adjusted=proposed.map(c=>({...c,points:adjustedPoints[c.id]}));

const sessions=Number(process.argv[2]||200);
const modes=['prudent','competitive','audacious','mixed'];
function seedFor(index){let x=index>>>0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return (x^(x>>>15))>>>0;}
const report={rulesVersion:E.RULESET_VERSION,matchVersion:M.MATCH_VERSION,sessionsPerConfiguration:sessions,players:4,lengths:[4,6],seedStart:1,seedScheme:'32-bit mixed index using 0x21f0aaad and 0x735a2d97',
 methodology:'Exact single-roll probabilities; real multiplayer engine and draft, fixed seeds; three heuristic controllers, not optimal or human players. All variants use the current rules, including skaters, owner-color wild stars, paired drafts, three-trick sequence points and persistent freeze. Historical report files describe older rules. Catalog variants exist in memory only. Draft point caps remain those of the current game and can change offers. Freeze preserves a face only when it improves the next chosen trick. Adjust planner includes choices in its cache key.',probabilities:[],runs:[]};

// Independent reference predicates verify all proposed requirements on all 6^6
// ordered rolls, rather than merely trusting the production combination matcher.
function independent(c,f){
 const count=v=>f.filter(x=>x===v).length;
 if(c.pattern==='at-least')return f.filter(v=>v>=c.threshold).length>=c.cost;
 if(c.pattern==='at-most')return f.filter(v=>v<=c.threshold).length>=c.cost;
 if(c.pattern==='odd-distinct')return new Set(f.filter(v=>v%2)).size>=2;
 if(c.pattern==='even-distinct')return new Set(f.filter(v=>v%2===0)).size>=2;
 const contains=a=>[...new Set(a)].every(v=>count(v)>=a.filter(x=>x===v).length);
 if(c.pattern==='exact')return contains(c.values);
 if(c.pattern==='choices')return c.choices.some(contains);
 if(c.pattern==='straight')return Array.from({length:7-c.cost},(_,i)=>Array.from({length:c.cost},(_,j)=>i+j+1)).some(contains);
 throw Error(c.pattern);
}
for(const c of proposed){
 const row={id:c.id,name:c.name,type:c.type,cost:c.cost,points:c.points,combination:specs[c.id],p:{}};
 for(let n=0;n<=6;n++)row.p[n]=probability(c,n);
 row.p6WithOneAdjust=probability(c,6,1,0);
 row.p6WithOneFullReroll=1-(1-row.p[6])**2;
 row.p6WithOneAdjustAndOneFullReroll=1-(1-row.p6WithOneAdjust)**2;
 let successes=0;
 for(let code=0;code<46656;code++){
  let x=code;const f=[];for(let i=0;i<6;i++){f.push(x%6+1);x=Math.floor(x/6);}
  const expected=independent(c,f),actual=!!findMatch(c,f.map((face,id)=>({id,face})));
  assert.equal(actual,expected,`independent matcher: ${c.name} ${f}`);successes+=expected;
 }
 assert(Math.abs(row.p[6]-successes/46656)<1e-10);
 if(c.type!=='air')assert(row.p[6]>=.1);
 report.probabilities.push(row);
}
console.log('Exact probabilities independently verified for 24 cards and 46,656 rolls each.');

// Older score variants can be compared under TODAY'S rules, not replayed as
// historical rules. Keep reports versioned so earlier measurements stay intact.
for(const [version,catalog] of [['current',original],['proposed',proposed],['adjusted',adjusted],['challenging',adjusted],['balanced',adjusted],['live',deployed]]){
 if((process.argv[3]||'live')!=='all'&&version!==(process.argv[3]||'live'))continue;
 TRICKS.splice(0,TRICKS.length,...structuredClone(catalog));
 MODULES.splice(0,MODULES.length,...structuredClone(deployedModules));
 for(const mode of modes){
  let policy=mode;
  const r={version,mode,sessions,configuration:{points:catalog.map(c=>c.points),modules:MODULES.map(({key,rounds,pv,condition})=>({key,rounds,pv,condition}))},completed:0,commands:0,modules:0,attempts:0,falls:0,banked:0,points:0,threeTricks:0,unawarded:0,ties:0,
   bonusUses:{adjust:0,reroll:0,freeze:0},modulesById:{},cards:Object.fromEntries(catalog.map(c=>[c.id,{name:c.name,drafted:0,selected:0,landed:0,banked:0,winningAttempts:0}]))};
  const forced=new WeakMap();
  function rank(g,cards){
   const n=E.freeDice(g).length,landed=g.landed.map(e=>g.hand.find(c=>c.uid===e.card));
   let allowed=cards;
   if(!g.landed.length&&E.currentModule(g).needs.length===2){
    const feasible=cards.filter(c=>E.options(g).some(d=>d.type!==c.type&&d.cost+c.cost<=n));
    if(feasible.length)allowed=feasible;
   }
   const score=c=>chanceBeforeRoll(g,c)**(policy==='audacious'?.65:1)*E.sequenceScore([...landed,c],E.currentModule(g)).points;
   return [...allowed].sort((a,b)=>score(b)-score(a)||a.id-b.id);
  }
  function decide(g,leader){
   if(['initial','draft'].includes(g.phase)){
    const cards=g.phase==='draft'?[...g.draftCards]:g.offer.map(id=>g.deck.find(c=>c.uid===id));
    const value=c=>rollProbability(c,Array.from({length:policy==='audacious'?6:4},(_,id)=>({id,color:id===0?E.wildColor(g):'other',face:null})),E.wildColor(g))**(policy==='audacious'?.65:1)*c.points;
    cards.sort((a,b)=>value(b)-value(a)||a.id-b.id);
    if(g.phase==='draft'){
     const token=[...g.draftTokens].sort((a,b)=>g.bank[a.type]-g.bank[b.type])[0];
     return {type:'draft-pair',cardId:cards[0].uid,tokenId:token.id};
    }
    if(g.phase==='draft'&&g.bonusOffer&&(!cards.length||value(cards[0])<3))return {type:'draft-bonus',choice:g.bonusOffer};
    return {type:'draft',cardId:cards[0].uid};
   }
   if(g.phase==='select'){
    const c=E.options(g).find(c=>c.uid===forced.get(g))||rank(g,E.options(g))[0];forced.delete(g);
    return c?{type:'choose',cardId:c.uid}:{type:'fall'};
   }
   if(g.phase==='ready')return {type:'roll'};
   if(g.phase==='rolled'){
    if(E.canLand(g))return {type:'land'};
    if(findMatch(E.activeCard(g),E.freeDice(g),E.wildColor(g)))return {type:'auto'};
    if(g.bank.adjust){const plan=closestMatch(E.activeCard(g),E.freeDice(g),E.wildColor(g));if(plan.step&&plan.distance<=g.bank.adjust)return {type:'bonus',bonusType:'adjust',...plan.step};}
    if(g.bank.reroll)return {type:'bonus',bonusType:'reroll'};
    return {type:'fall'};
   }
   if(g.phase==='decision'){
    const next=rank(g,E.options(g))[0],points=E.banked(g);
    const goal=policy==='prudent'?0:leader;
    const expected=next?chanceBeforeRoll(g,next)*E.sequenceScore([...g.landed.map(e=>g.hand.find(c=>c.uid===e.card)),next],E.currentModule(g)).points:0;
    const continuing=next&&(!E.canStop(g)||points<goal||expected>points*(policy==='audacious'?.8:1.1));
    if(continuing&&g.bank.freeze){
     const die=freezeChoice(next,E.freeDice(g),E.wildColor(g),g.frozen||[]);
     if(die){forced.set(g,next.uid);return {type:'bonus',bonusType:'freeze',id:die.id};}
    }
    return {type:continuing?'continue':'stop'};
   }
   if(g.phase==='result')return g.sequenceReward?.pending?{type:'claim-sequence',choice:[...E.BONUS_TYPES].sort((a,b)=>g.bank[a]-g.bank[b])[0]}:{type:'proceed'};
   throw Error(`Unexpected phase ${g.phase}`);
  }
  for(let seed=1;seed<=sessions;seed++){
   const m=M.newMatch({seed:seedFor(seed),npcCount:3,length:seed%2?6:4});let steps=0;
   while(m.phase!=='complete'){
    assert(++steps<3000,'Deadlock');
    if(m.phase==='recap')assert(M.advance(m));
    else if(m.phase==='draft-summary')assert(M.startModule(m));
    else{
     const p=M.currentPlayer(m),g=p.game;
     policy=mode==='mixed'?['prudent','competitive','competitive','audacious'][p.seat]:mode;
     const leader=Math.max(0,...m.players.flatMap(p=>p.game.attempts.map(a=>a.points)));
     const c=decide(g,leader),cardId=c.type==='land'?E.activeCard(g)?.id:g.hand.find(x=>x.uid===c.cardId)?.id;
     if(['draft','draft-pair'].includes(c.type)){const card=[...m.deck,...m.market.cards].find(x=>x.uid===c.cardId);r.cards[card.id].drafted++;}
     if(c.type==='choose')r.cards[cardId].selected++;
     if(c.type==='land')r.cards[cardId].landed++;
     if(c.type==='bonus')r.bonusUses[c.bonusType]++;
     assert(M.dispatch(m,{playerId:p.id,...c}),JSON.stringify({phase:g.phase,c}));
    }
   }
   const inventory=[...m.deck,...m.market.cards,...m.discard,...m.players.flatMap(p=>p.game.hand)];
   assert.equal(inventory.length,72);assert.equal(new Set(inventory.map(c=>c.uid)).size,72);
   for(const p of m.players){assert.equal(p.game.pv,p.game.history.reduce((s,h)=>s+h.pv,0));assert(Object.values(p.game.bank).every(n=>n>=0));}
   r.completed++;r.commands+=steps;
   for(const recap of m.recaps){
    const a=r.modulesById[recap.module]??={name:MODULES[recap.module].name,count:0,unawarded:0,ties:0,attempts:0,qualifiedAttempts:0,falls:0,points:0,best:0};
    a.count++;r.modules++;if(!recap.winners.length){a.unawarded++;r.unawarded++;}if(recap.winners.length>1){a.ties++;r.ties++;}
    a.best+=recap.rows[0].best;
    for(const row of recap.rows)for(const attempt of row.attempts){
     r.attempts++;a.attempts++;r.points+=attempt.points;a.points+=attempt.points;
     if(attempt.points>0)a.qualifiedAttempts++;
     if(attempt.reason==='fall'){r.falls++;a.falls++;}else if(attempt.points>0){
      r.banked++;if(attempt.cards.length===3)r.threeTricks++;
      for(const card of attempt.cards){
       const id=typeof card==='string'?catalog.find(c=>c.name===card)?.id:card.id;
       assert(r.cards[id],JSON.stringify(attempt));r.cards[id].banked++;
       if(recap.winners.includes(row.id)&&attempt.points===row.best)r.cards[id].winningAttempts++;
      }
     }
    }
   }
  }
  report.runs.push(r);
  console.log(JSON.stringify({version,mode,completed:r.completed,falls:r.falls/r.attempts,unawarded:r.unawarded/r.modules,meanScore:r.points/r.attempts,ties:r.ties/r.modules}));
 }
}
TRICKS.splice(0,TRICKS.length,...deployed);
MODULES.splice(0,MODULES.length,...deployedModules);
assert.deepEqual(MODULES,deployedModules);
const resultFile=`${process.argv[3]||'live'}-rules${E.RULESET_VERSION}-balance-results.json`;
writeFileSync(new URL('../tests/'+resultFile,import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(`Saved tests/${resultFile}; production files unchanged.`);
