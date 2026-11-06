import * as E from './engine.js';
import {MODULES,TRICKS} from './data.js';
import {ODDS} from './odds.js';
import {chanceBeforeRoll,rollProbability} from './roll-probability.js';
import {closestMatch} from './npc-dice.js';
import {newModuleTrace,projectedBonus} from './module-trace.js';
import {npcGameView} from './npc-view.js';

// Bounded three-trick planning. Future roll probabilities and token consumption
// are estimates; actual faces are used only after a roll or for frozen dice.
const oddsMemo=new WeakMap();
const current=g=>MODULES[g.route[g.module]];
const upcoming=g=>(g.route||[]).slice(g.module+1).map(id=>MODULES[id]);
const startBeforeFinal=g=>(g.phase==='draft'?g.module+1:g.module)<g.route.length-1;
const clamp=p=>Math.max(0,Math.min(1,p));
function canonical(c){const base=TRICKS[c.id];return base&&['pattern','cost','threshold'].every(k=>c[k]===base[k])&&JSON.stringify(c.values)===JSON.stringify(base.values)&&JSON.stringify(c.choices)===JSON.stringify(base.choices);}
function probability(c,n,own){
 let tables=oddsMemo.get(c);if(!tables){tables=canonical(c)?ODDS.cards[c.id]:{};oddsMemo.set(c,tables);}
 if(tables.noBonus)return own?(tables.withWild?.noBonus[n]??tables.noBonus[n]):tables.noBonus[n];
 const key=n+':'+own;if(tables[key]===undefined)tables[key]=rollProbability(c,Array.from({length:n},(_,id)=>({id,color:own&&id===0?'own':'other',face:null})),own?'own':null);
 return tables[key];
}
export function tokenValue(type,g){
 const hand=g.hand||[],future=upcoming(g),stock=g.bank?.[type]||0;
 const precise=hand.filter(c=>['exact','choices'].includes(c.pattern)).length/Math.max(1,hand.length);
 const airFuture=future.filter(m=>m.needs.includes('air')).length;
 const base=type==='reroll'?3.2:type==='adjust'?2.8:2.4*(1+precise*.35+Math.min(2,airFuture)*.14);
 const horizon=future.length||g.attempt===0?1:.05;
 return base*horizon/(1+stock*(type==='freeze'?.65:.45));
}
export function chooseToken(types,g,{reserveEarned=false}={}){
 const canKeep=type=>E.canAddBonus(g,type);
 const spare=type=>reserveEarned&&E.bonusSlots(g,type)>(g.earned?.[type]||0);
 return [...types].sort((a,b)=>Number(canKeep(b))-Number(canKeep(a))||Number(spare(b))-Number(spare(a))||tokenValue(b,g)-tokenValue(a,g))[0];
}
function required(module,cards){return module.needs.length===2?module.needs.filter(t=>!cards.some(c=>c.type===t)):cards.length?[]:module.needs;}
function canBank(module,cards){return cards.length>0&&(module.needs.length!==2||required(module,cards).length===0);}

// A bounded resource estimate for drafting and public opponent forecasts. This
// never samples a roll. In particular, a spare reroll is useful to a four-die
// opening even though that card can never be played with only two dice left.
export function supportedChance(c,n,own,bank={}){
 let p=probability(c,n,own);if(!p)return 0;
 const tables=oddsMemo.get(c),raw=probability(c,n,false);
 const improved=Math.max(0,(tables?.adjustOnly?.[n]??raw)-raw);
 const adjusted=clamp(p+improved*Math.min(1,bank.adjust||0));
 return clamp(1-(1-adjusted)**(1+Math.min(3,bank.reroll||0)));
}

const forecastMemo=new WeakMap();
function publicStrength(g,module){
 const cards=g.hand.filter(c=>!g.secured.includes(c.uid)),key=JSON.stringify([module.id,cards.map(c=>[c.uid,c.points,c.pattern,c.cost,c.threshold,c.values,c.choices]),g.bank,g.skaterId]);
 const cached=forecastMemo.get(g);if(cached?.key===key)return cached.value;
 const own=!!g.skaterId;let best=0;
 const score=cards=>E.sequenceScore(cards,module).points+(projectedBonus(module,cards,{skaterId:g.skaterId})||0);
 // Only public cards and resource counts enter this forecast. Faces of dice
 // waiting to be rerolled and the hidden deck are deliberately excluded.
 for(const a of cards){
  if(module.needs.length&&!module.needs.includes(a.type))continue;
  const pa=supportedChance(a,6,own,g.bank);
  if(canBank(module,[a]))best=Math.max(best,pa*score([a]));
  for(const b of cards){
   if(a.uid===b.uid||a.cost+b.cost>6||!canBank(module,[a,b]))continue;
   const personal=own*(6-a.cost)/6,bank={adjust:Math.min(1,g.bank.adjust),reroll:Math.min(1,g.bank.reroll)};
   const pb=personal*supportedChance(b,6-a.cost,true,bank)+(1-personal)*supportedChance(b,6-a.cost,false,bank);
   best=Math.max(best,pa*pb*score([a,b]));
   if(a.cost+b.cost>4)continue;
   for(const c of cards)if(c.uid!==a.uid&&c.uid!==b.uid&&a.cost+b.cost+c.cost<=6){
    const pc=probability(c,6-a.cost-b.cost,false);
    best=Math.max(best,pa*pb*pc*score([a,b,c]));
   }
  }
 }
 forecastMemo.set(g,{key,value:best});return best;
}

export function sequencePlanner(g,{leader=0,parScore=7,caution=1,searchDepth=3,rewardSearchDepth=searchDepth,maxBonusSpend=Infinity,opposition=null}={}, {forcedCard=null,freshRoll=false}={}){
 const module=current(g),landed=g.landed.map(e=>g.hand.find(c=>c.uid===e.card));
 const ownBest=Math.max(0,...g.attempts.map(a=>a.points));
 leader=Math.max(leader,...(opposition||[]).map(o=>o.best));
 const goal=g.attempt===0?Math.max(leader+1,parScore):Math.max(1,leader+1,ownBest+1);
 const award=module.pv*8,resources={adjust:g.bank.adjust||0,reroll:g.bank.reroll||0};
 const free=E.freeDice(g),own=!!free.find(d=>d.color===E.wildColor(g)&&E.wildColor(g));
 const horizon=upcoming(g).length>0;
 const spent=E.BONUS_TYPES.reduce((n,type)=>n+(g.used?.[type]||0),0);
 const slots=Object.fromEntries(E.BONUS_TYPES.map(type=>[type,E.bonusSlots(g,type)]));
 const totalSlots=Object.values(slots).reduce((sum,n)=>sum+n,0);
 const tokenUnit=Math.max(0,...E.BONUS_TYPES.filter(type=>slots[type]).map(type=>tokenValue(type,g)));
 let farmingBudget=null;
 function standing(score){
  const best=Math.max(ownBest,score);
  if(best<leader)return 0;
  if(opposition){
   if(!best)return 0;
   // Expected module PV, including ties (which receive the full award). A
   // smooth public forecast keeps the first player aiming above a fixed par,
   // without forcing a late player to risk everything for one more point.
   return award*opposition.reduce((chance,o)=>{
    if(best<o.best)return 0;
    const cdf=.12+.88/(1+Math.exp((o.strength-best-.5)/2.4));
    return chance*cdf**o.remaining;
   },1);
  }
  return best>=goal?award:best>0&&best===goal-1?award*.8:award*.1*Math.min(1,best/goal);
 }
 const fallValue=standing(0);
 function estimatedScore(cards){const real=E.sequenceScore(cards,module,g);return real.points-real.moduleBonus+(projectedBonus(module,cards,g)??real.moduleBonus);}
 function value(cards,bank=resources){
  const score=estimatedScore(cards);
  const improves=score>ownBest&&score>=leader;
  let reward=0,count=0,remainingSlots=totalSlots;
  if(horizon)for(const type of E.BONUS_TYPES){
   const pending=Math.min(slots[type],g.earned?.[type]||0);
   const tokens=Math.min(slots[type]-pending,cards.filter(c=>c.comboBonus?.kind==='reward'&&c.comboBonus.type===type).length);
   remainingSlots-=pending+tokens;reward+=tokens*tokenValue(type,g);count+=tokens;
  }
  if(horizon||g.attempt===0){const tokens=Math.min(remainingSlots,E.sequenceScore(cards,module,g).rewardTokens);reward+=tokens*tokenUnit;count+=tokens;}
  // A sub-target score has no independent value, on either attempt. Reward
  // farming needs more tokens back than the whole attempt is expected to use.
  // Already landed rewards may still be banked to recover sunk expenditure.
  const salvage=cards.length===landed.length;
  // The longer reward search is only for profitable collections. It must not
  // silently restore three-card scoring optimization on the lower levels.
  if(rewardSearchDepth>searchDepth&&farmingBudget!==null&&!salvage&&count<=spent+farmingBudget)return fallValue;
  if(!improves&&!salvage&&(farmingBudget===null||count<=spent+farmingBudget))reward=0;
  const scoreGain=!improves?0:g.attempt===1?Math.max(0,score-ownBest)*.2:4.2*Math.sqrt(score);
  let opportunity=0;
  if(g.attempt===0){
   opportunity=cards.reduce((sum,c)=>sum+probability(c,6,!!g.skaterId)*c.points*.08,0);
   const remaining=g.hand.filter(c=>!g.secured.includes(c.uid)&&!cards.some(p=>p.uid===c.uid));
   if(module.needs.some(t=>!remaining.some(c=>c.type===t)))opportunity+=1.2;
  }
  return standing(score)+scoreGain+reward-opportunity;
 }
 function rollChance(c,n,personal,bank,root){
  // Populate odds for every state, including cards recreated by save/restore.
  // Cache warmth must never change an NPC decision.
  probability(c,n,false);
  let p=root?freshRoll?chanceBeforeRoll(g,c):g.reuseRoll?Number(!!E.findMatch(c,free,E.wildColor(g))):chanceBeforeRoll(g,c):personal*probability(c,n,true)+(1-personal)*probability(c,n,false);
  const raw=p;
  const tables=oddsMemo.get(c);
  const adjustRate=tables?.adjustOnly&&tables.noBonus[n]<1?(tables.adjustOnly[n]-tables.noBonus[n])/(1-tables.noBonus[n]):0;
  const known=root&&g.reuseRoll&&!freshRoll,distance=known&&p===0?closestMatch(c,free,E.wildColor(g)).distance:0;
  const adjustUse=known?(distance>0&&distance<=Math.min(bank.adjust,bank.budget)?distance:0):Math.min(bank.budget,Math.min(1,bank.adjust)*(1-p)*Math.max(0,adjustRate));
  p=known&&adjustUse?1:p+adjustUse;
  const rerollUse=Math.min(Math.max(0,bank.budget-adjustUse),Math.min(1,bank.reroll)*(1-p));
  const fresh=personal*probability(c,n,true)+(1-personal)*probability(c,n,false);
  p+=rerollUse*(root&&g.reuseRoll&&!freshRoll?fresh:p);
  const cost=(adjustUse*tokenValue('adjust',g)+rerollUse*tokenValue('reroll',g))*.6;
  return {p:clamp(p),cost,bank:{adjust:Math.max(0,bank.adjust-adjustUse),reroll:Math.max(0,bank.reroll-rerollUse),budget:Math.max(0,bank.budget-adjustUse-rerollUse)},raw};
 }
 const available=g.hand.filter(c=>!g.secured.includes(c.uid)&&!landed.some(p=>p.uid===c.uid));
 let nodes=0;
 function solve(cards,remaining,n,personal,bank,root=false,depth=0){
  const stop=canBank(module,cards)&&(!root||g.phase==='decision'&&!forcedCard)?value(cards,bank):root&&g.phase==='select'&&!cards.length&&!forcedCard&&!g.reuseRoll?fallValue:-Infinity;
  if(cards.length===3||depth>=(farmingBudget===null?searchDepth:rewardSearchDepth))return {utility:stop,card:null,path:[],points:estimatedScore(cards)};
  const needs=required(module,cards),seen=new Set();
  let best={utility:stop,card:null,path:[],points:cards.length?estimatedScore(cards):0};
  for(const c of remaining){
   if(c.cost>n||needs.length&&!needs.includes(c.type)||root&&forcedCard&&c.uid!==forcedCard.uid||seen.has(c.id))continue;
   seen.add(c.id);
   const nextCards=[...cards,c],rest=remaining.filter(x=>x.uid!==c.uid),roll=rollChance(c,n,personal,bank,root);
   let after;
   if(++nodes>1600)after={utility:canBank(module,nextCards)?value(nextCards,roll.bank):fallValue,path:[],points:estimatedScore(nextCards)};
   else after=solve(nextCards,rest,n-c.cost,personal*(n-c.cost)/Math.max(1,n),roll.bank,false,depth+1);
   const success=Number.isFinite(after.utility)?after.utility:fallValue;
   const utility=roll.p*success+(1-roll.p)*fallValue-roll.cost-.015-(1-roll.p)*Math.max(0,caution-1)*Math.max(0,success-fallValue)*.2;
   const points=roll.p*after.points;
   if(utility>best.utility+1e-8||Math.abs(utility-best.utility)<1e-8&&points>best.points)best={utility,card:c,path:[c,...after.path],points,p:roll.p};
  }
  return best;
 }
 // Selection commits to another trick; only a decision phase permits banking.
 const cardRewards=horizon?landed.filter(c=>c.comboBonus?.kind==='reward').length+Math.min(3-landed.length,available.filter(c=>c.comboBonus?.kind==='reward').length):0;
 const sequenceRewards=horizon||g.attempt===0?(module.bonus.kind==='three-tokens'?module.bonus.tokens:1):0;
 const bonusBudget=Math.max(0,maxBonusSpend-spent);
 const maxBudget=Math.min(resources.adjust+resources.reroll,Math.min(totalSlots,cardRewards+sequenceRewards)-1-spent,bonusBudget);
 let plan=null;
 // A separate zero-token plan prevents one free reward from being forecast as
 // dependent on a "cheap" rescue token. Larger farming plans reserve a strict
 // positive balance even if their entire allowed budget is spent.
 for(const budget of [null,...Array.from({length:Math.max(0,maxBudget+1)},(_,i)=>i)]){
  farmingBudget=budget;nodes=0;
  const candidate=solve(landed,available,free.length,own?1:0,{...resources,budget:budget??bonusBudget},true);
  if(!plan||candidate.utility>plan.utility+1e-8||Math.abs(candidate.utility-plan.utility)<1e-8&&candidate.points>plan.points)plan={...candidate,tokenBudget:budget};
 }
 return {...plan,stopUtility:canBank(module,landed)?value(landed):-Infinity,fallUtility:fallValue,goal};
}

// Evaluate the proposed spend before issuing it. Trial copies contain only
// public information; hypothetical rerolls never consume a random number.
export function bonusPlan(g,context,type,id,delta=0){
 const trial=npcGameView(g),card=E.activeCard(trial),decision=g.phase==='decision';
 const requiredSpends=type==='freeze'&&!decision?2:1;
 if(E.BONUS_TYPES.reduce((n,t)=>n+(trial.used?.[t]||0),0)+requiredSpends>(context.maxBonusSpend??Infinity))return null;
 if(type==='reroll'){
  if(!(trial.bank.reroll>0)||!E.rerollableDice(trial).length)return null;
  trial.bank.reroll--;trial.used.reroll=(trial.used.reroll||0)+1;
 }else if(!E.bonus(trial,type,id,delta))return null;
 if(type==='freeze'&&!decision){
  if(!(trial.bank.reroll>0))return null;
  trial.bank.reroll--;trial.used.reroll=(trial.used.reroll||0)+1;
 }
 if(type==='adjust')trial.reuseRoll=true;
 const plan=sequencePlanner(trial,context,decision?{}:{forcedCard:card,freshRoll:type!=='adjust'});
 return plan.card&&plan.utility>plan.fallUtility+1e-8?plan:null;
}

export function draftValue(c,g,policy={}){
 const own=!!g.skaterId,hand=g.hand||[];
 const bank={...g.bank};
 if(g.phase==='draft'&&g.draftTokens?.length){const type=chooseToken(g.draftTokens.map(t=>t.type),g);if(E.canAddBonus(g,type))bank[type]=(bank[type]||0)+1;}
 if(Number.isFinite(policy.maxBonusSpend)){
  bank.adjust=Math.min(bank.adjust||0,1,policy.maxBonusSpend);
  bank.reroll=Math.min(bank.reroll||0,Math.max(0,policy.maxBonusSpend-bank.adjust));
 }
 // Early resources must serve several cards and two attempts. Retain reliable
 // small tricks instead of pricing every starting card with the whole bank.
 if(startBeforeFinal(g)){bank.adjust=Math.min(1,(bank.adjust||0)*.5);bank.reroll=Math.min(2,(bank.reroll||0)*.5);}
 const weights=g.phase==='initial'?[.35,.65,.5]:[.85,.25,.2];
 let value=c.points*([6,4,2].reduce((v,n,i)=>v+supportedChance(c,n,own,bank)*weights[i],0))-(c.cost-2)*.2;
 const sameType=hand.filter(x=>x.type===c.type);
 if(g.phase==='initial'&&sameType.length&&!sameType.some(x=>x.cost===2))value+=c.cost===2?2:-2;
 if(c.comboBonus?.kind==='reward'&&startBeforeFinal(g))value+=tokenValue(c.comboBonus.type,g)*.45;
 if(c.comboBonus?.kind==='companion'&&hand.some(x=>x.type===c.comboBonus.type))value+=c.comboBonus.points*.5;
 const start=g.phase==='draft'?g.module+1:0;
 for(const [i,id]of(g.route||[]).slice(start,start+(policy.draftHorizon??Infinity)).entries()){
  const m=MODULES[id],weight=1/(1+i*.65),count=hand.filter(x=>x.type===c.type).length;
  // A costly card still needs a legal partner when the module requires two
  // types. Do not promote an Epic that cannot complete this visible route.
  if(m.needs.length===2&&(!m.needs.includes(c.type)||!hand.some(x=>x.type!==c.type&&m.needs.includes(x.type)&&x.cost+c.cost<=6))&&c.cost>2)value-=weight*2;
  if(m.needs.includes(c.type))value+=weight*(count? .2:1.3);
  if(m.needs.length===2){const other=m.needs.find(t=>t!==c.type);if(other&&m.needs.includes(c.type)&&hand.some(x=>x.type===other&&x.cost+c.cost<=6))value+=weight*.55;}
  if(m.bonus.kind==='base'&&c.tier==='base')value+=weight*.5;
  if(m.bonus.kind==='favored'&&c.type===m.bonus.type)value+=weight*.6;
  if(m.bonus.kind==='amplitude'&&c.cost>=3)value+=weight*.7;
  if(['three-score','three-tokens'].includes(m.bonus.kind)&&c.cost===2)value+=weight*.35;
  if(m.bonus.kind==='recovery'&&c.cost<=3)value+=weight*.2;
  if(m.bonus.kind==='stars')value+=weight*(projectedBonus(m,[c],g)||0)*.25;
 }
 if(hand.filter(x=>x.type===c.type).every(x=>x.cost>2)&&c.cost===2)value+=.4;
 return value;
}

export function npcContext(match,player){
 if(match.phase==='initial')return {leader:0,parScore:7,caution:player.caution||1,difficulty:match.npcDifficulty||'normal'};
 const opponents=match.players.filter(p=>p.id!==player.id),module=current(player.game);
 const leader=Math.max(0,...opponents.flatMap(p=>p.game.attempts.map(a=>a.points)));
 const opposition=opponents.map(p=>({best:Math.max(0,...p.game.attempts.map(a=>a.points)),remaining:Math.max(0,2-p.game.attempts.length),strength:publicStrength(p.game,module)}));
 const parScore=Math.max(6,...opposition.map(o=>Math.min(16,Math.round(o.strength))));
 return {leader,parScore,opposition,caution:player.caution||1,difficulty:match.npcDifficulty||'normal'};
}

export function bestPlacement(g,context={}){
 const card=E.activeCard(g),dice=E.freeDice(g);let best=null;
 function choose(start,ids){
  if(ids.length===card.cost){
   if(!E.findMatch(card,ids.map(id=>g.dice[id]),E.wildColor(g)))return;
   const copy={...g,dice:g.dice.map(d=>({...d})),pending:[...ids],landed:g.landed.map(e=>({...e,dice:[...e.dice]})),moduleTrace:structuredClone(g.moduleTrace||newModuleTrace()),secured:[...g.secured],sequences:[...g.sequences],attempts:[...g.attempts],earned:{...g.earned},bank:{...g.bank},used:{...g.used},frozen:[...(g.frozen||[])]};
   E.land(copy);
   // Trial landing must not turn this attempt into an already protected score,
   // nor hide the reward it would earn. No trial mutation reaches the real game.
   copy.attempts=g.attempts;copy.earned=g.earned;
   const fell=copy.reason==='fall';copy.phase='decision';
   const plan=sequencePlanner(copy,context),held=copy.frozen.length*.02,personal=E.freeDice(copy).some(d=>d.color===E.wildColor(copy))?.015:0;
   const utility=(fell?plan.fallUtility:Number.isFinite(plan.utility)?plan.utility:plan.fallUtility)+held+personal;
   if(!best||utility>best.utility+1e-8)best={ids:[...ids],utility};return;
  }
  for(let i=start;i<dice.length;i++)choose(i+1,[...ids,dice[i].id]);
 }
 choose(0,[]);return best?.ids||null;
}
