import {specialtyActions} from './specialties.js';
import * as E from './engine.js';
import {sequencePlanner,draftValue,chooseToken,tokenValue,bestPlacement,bonusPlan,signatureChoice} from './npc-strategy.js';
import {chanceBeforeRoll,rollProbability} from './roll-probability.js';
// A controller chooses commands from the visible state. It never changes a die,
// awards points, reads the random stream, or bypasses the rules engine.
import {closestMatch,freezeChoice} from './npc-dice.js';
import {npcDifficulty} from './npc-difficulty.js';
import {chooseNearBest} from './npc-choice.js';
export {closestMatch,freezeChoice} from './npc-dice.js';
export function decide(g,context={}){
 const policy=npcDifficulty(context.difficulty);
 const power=specialtyActions(g);
 if(power.length){
  if(['milo','iris'].includes(g.skaterId)){const type=chooseToken(power.map(a=>a.choice),g);return power.find(a=>a.choice===type);}
  if(g.skaterId==='neo'){const trades=power.filter(a=>g.bank[a.bonusType]>1&&tokenValue(a.choice,g)>tokenValue(a.bonusType,g)*1.25);if(trades.length)return trades[0];}
  if(g.phase==='rolled'&&!E.findMatch(E.activeCard(g),E.freeDice(g),E.wildColor(g))){
   if(g.skaterId==='ruby')return power[0];
  }
 }
 const openingPair=!g.landed.length&&E.currentModule(g).needs.length===2;
 const protectedScore=Math.max(context.leader||0,...(context.opposition||[]).map(o=>o.best),...g.attempts.map(a=>a.points));
 context={...context,caution:(context.caution||1)*policy.caution,searchDepth:Math.max(policy.searchDepth,openingPair?2:1),rewardSearchDepth:Math.max(policy.searchDepth,openingPair?2:1,protectedScore>0?3:1),maxBonusSpend:policy.maxBonusSpend??Infinity,parScore:Math.min(context.parScore??7,policy.parScoreCap),chaseFirst:policy.chaseFirst};
 if(power.length){const action=signatureChoice(g,context);if(action)return action;}
 if(['initial','draft'].includes(g.phase)){
  const cards=g.competitive&&g.phase==='draft'?[...g.draftCards]:g.offer.map(id=>g.deck.find(c=>c.uid===id)).filter(Boolean);
  const ranked=cards.map(card=>({card,value:draftValue(card,g,policy)})).sort((a,b)=>b.value-a.value||a.card.id-b.card.id);
  const chosen=chooseNearBest(g,ranked,policy,'draft')?.card;
  if(g.competitive&&g.phase==='draft'){
   const type=chooseToken(g.draftTokens.map(t=>t.type),g),token=g.draftTokens.find(t=>t.type===type);
   return chosen&&token?{type:'draft-pair',cardId:chosen.uid,tokenId:token.id}:null;
  }
  if(!cards.length)return E.canAddBonus(g,g.bonusOffer)?{type:'draft-bonus',choice:g.bonusOffer}:g.phase==='draft'?{type:'draft-skip'}:null;
  if(g.phase==='draft'&&E.canAddBonus(g,g.bonusOffer)&&tokenValue(g.bonusOffer,g)>draftValue(chosen,g,policy))return {type:'draft-bonus',choice:g.bonusOffer};
  return {type:'draft',cardId:chosen.uid};
 }
 if(g.phase==='reward')return {type:'claim',choice:chooseToken(E.BONUS_TYPES,g)};
 if(g.phase==='select'){
  const plan=sequencePlanner(g,context);if(!plan.card)return {type:E.options(g).length&&!g.landed.length&&!g.reuseRoll?'pass':'fall'};
  if(!policy.variety||g.skaterId==='jade'&&g.specialty?.returnedCard&&plan.path.some(c=>c.uid===g.specialty.returnedCard))return {type:'choose',cardId:plan.card.uid};
  const floor=Math.max(plan.fallUtility,plan.stopUtility);
  const ranked=[...new Map(E.options(g).map(c=>[c.id,c])).values()].map(card=>({card,value:sequencePlanner(g,context,{forcedCard:card}).utility})).filter(c=>c.value>floor).sort((a,b)=>b.value-a.value);
  const chosen=chooseNearBest(g,ranked,policy);
  return {type:'choose',cardId:chosen?.card.uid||plan.card.uid};
 }
 if(g.phase==='ready')return {type:'roll'};
 if(g.phase==='rolled'){
  const card=E.activeCard(g),dice=E.freeDice(g),own=E.wildColor(g);
  // Every difficulty commits to the selected card once the dice are rolled.
  if(E.canLand(g))return {type:'land'};
  if(E.findMatch(card,dice,own)){
   const priority=d=>Number(E.isOwnStar(d,own))*2+Number(g.frozen?.includes(d.id));
   const ordered=policy.preserveDice?[...dice].sort((a,b)=>priority(a)-priority(b)):dice;
   const ids=policy.optimizePlacement?bestPlacement(g,context):E.findMatch(card,ordered,own);
   if(g.pending.length)return {type:'place',ids:[...g.pending],target:false};
   return {type:'place',ids,target:true};
  }
  const adjustment=closestMatch(card,dice,own);
  const retry=sequencePlanner({...g,bank:{...g.bank,reroll:0}},context,{forcedCard:card,freshRoll:true});
  const benefit=Math.max(0,retry.utility-retry.fallUtility);
  const canAdjust=g.bank.adjust>0&&adjustment.distance<=g.bank.adjust&&adjustment.step&&bonusPlan(g,context,'adjust',adjustment.step.id,adjustment.step.delta);
  const canReroll=g.bank.reroll>0&&E.rerollableDice(g).length&&bonusPlan(g,context,'reroll');
  if(canAdjust&&(!canReroll||adjustment.distance*tokenValue('adjust',g)<=tokenValue('reroll',g)+benefit*(1-chanceBeforeRoll(g,card))))return {type:'bonus',bonusType:'adjust',...adjustment.step};
  if(canReroll){
   const die=E.canFreeze(g)?freezeChoice(card,dice,own,g.frozen||[]):null;
   const gain=die?rollProbability(card,dice,own,[...(g.frozen||[]),die.id])-chanceBeforeRoll(g,card):0;
   if(die&&gain*Math.max(benefit,card.points)>tokenValue('freeze',g)*.45&&bonusPlan(g,context,'freeze',die.id))return {type:'bonus',bonusType:'freeze',id:die.id};
   if(benefit>tokenValue('reroll',g)*.45||!E.banked(g)&&g.attempt===0)return {type:'bonus',bonusType:'reroll'};
  }
  if(canAdjust)return {type:'bonus',bonusType:'adjust',...adjustment.step};
  return {type:'fall'};
 }
 if(g.phase==='decision'){
  const plan=sequencePlanner(g,context);
  if(!plan.card)return {type:E.canStop(g)?'stop':'fall'};
  const die=E.canFreeze(g)?freezeChoice(plan.card,E.freeDice(g),E.wildColor(g),g.frozen||[]):null;
  if(die){
   const protectedPlan=bonusPlan(g,context,'freeze',die.id);
   if(protectedPlan&&protectedPlan.utility-plan.utility>tokenValue('freeze',g)*.45)return {type:'bonus',bonusType:'freeze',id:die.id};
  }
  return {type:'continue'};
 }
 if(g.phase==='result')return g.sequenceReward?.pending?{type:'claim-sequence',choice:chooseToken(E.BONUS_TYPES,g,{reserveEarned:true})}:{type:'proceed'};
 return null;
}
