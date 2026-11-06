// Frozen pre-planner controller, used only for the head-to-head benchmark.
import * as E from '../../public/engine.js';
import {ODDS} from '../../public/odds.js';
import {chanceBeforeRoll,rollProbability} from '../../public/roll-probability.js';
// A controller chooses commands from the visible state. It never changes a die,
// awards points, reads the random stream, or bypasses the rules engine.
const targets=new Map();
function targetFaces(card){
 const key=JSON.stringify([card.pattern,card.cost,card.values,card.threshold,card.choices]);
 if(!targets.has(key)){
  const valid=[];
  function walk(a){if(a.length===card.cost){if(E.matches(card,a))valid.push(a);return;}for(let v=1;v<=6;v++)walk([...a,v]);}
  walk([]);targets.set(key,valid);
 }
 return targets.get(key);
}
export function closestMatch(card,dice,ownColor=null){
 let best={distance:Infinity,step:null};
 for(const values of targetFaces(card)){
  function assign(i,used,distance,step){
   if(distance>=best.distance)return;
   if(i===values.length){best={distance,step};return;}
   for(let j=0;j<dice.length;j++)if(!(used&(1<<j))){
    const d=dice[j],ordinary=values[i]-d.face;
    const delta=E.isOwnStar(d,ownColor)?0:ownColor&&d.color===ownColor&&d.face-1<Math.abs(ordinary)?1-d.face:ordinary;
    assign(i+1,used|(1<<j),distance+Math.abs(delta),step||(delta?{id:d.id,delta:Math.sign(delta)}:null));
   }
  }
  assign(0,0,0,null);
 }
 return best;
}
export function freezeChoice(card,dice,ownColor=null,heldIds=[]){
 if(!card||dice.length<card.cost)return null;
 const chance=d=>rollProbability(card,dice,ownColor,[...heldIds,d.id]);
 const best=dice.filter(d=>!heldIds.includes(d.id)).sort((a,b)=>chance(b)-chance(a))[0];
 return best&&chance(best)>rollProbability(card,dice,ownColor,heldIds)+1e-10?best:null;
}
function rankCards(g,cards){
 const n=E.freeDice(g).length,landed=g.landed.map(e=>g.hand.find(c=>c.uid===e.card));
 // Leave enough dice for the second required type when choosing the first trick.
 if(!g.landed.length&&E.currentModule(g).needs.length===2){
  const feasible=cards.filter(c=>cards.some(d=>d.type!==c.type&&d.cost+c.cost<=n));
  if(feasible.length)cards=feasible;
 }
 return [...cards].sort((a,b)=>{
  const value=c=>chanceBeforeRoll(g,c)*(E.sequenceScore([...landed,c],E.currentModule(g)).points);
  return value(b)-value(a)||a.id-b.id;
 });
}
export function decide(g,{leader=0,caution=1}={}){
 if(['initial','draft'].includes(g.phase)){
  const cards=g.competitive&&g.phase==='draft'?[...g.draftCards]:g.offer.map(id=>g.deck.find(c=>c.uid===id));
  // Prefer reliable cards, while keeping some higher scoring options.
  const draftValue=c=>(g.skaterId?(ODDS.cards[c.id].withWild?.noBonus[4]??ODDS.cards[c.id].noBonus[4]):ODDS.cards[c.id].noBonus[4])*c.points;
  cards.sort((a,b)=>draftValue(b)-draftValue(a));
  if(g.competitive&&g.phase==='draft'){
   const tokens=[...g.draftTokens].sort((a,b)=>g.bank[a.type]-g.bank[b.type]||['adjust','reroll','freeze'].indexOf(a.type)-['adjust','reroll','freeze'].indexOf(b.type));
   return cards.length&&tokens.length?{type:'draft-pair',cardId:cards[0].uid,tokenId:tokens[0].id}:null;
  }
  if(!cards.length)return g.bonusOffer?{type:'draft-bonus',choice:g.bonusOffer}:null;
  if(g.phase==='draft'&&g.bonusOffer&&((g.bonusOffer==='freeze'&&!g.bank.freeze)||ODDS.cards[cards[0].id].noBonus[4]*cards[0].points<3))return {type:'draft-bonus',choice:g.bonusOffer};
  return {type:'draft',cardId:cards[0].uid};
 }
 if(g.phase==='reward')return {type:'claim',choice:g.bank.adjust<=g.bank.reroll?'adjust':'reroll'};
 if(g.phase==='select'){const c=rankCards(g,E.options(g))[0];return c?{type:'choose',cardId:c.uid}:{type:'fall'};}
 if(g.phase==='ready')return {type:'roll'};
 if(g.phase==='rolled'){
  if(E.canLand(g))return {type:'land'};
  if(E.findMatch(E.activeCard(g),E.freeDice(g),E.wildColor(g)))return {type:'auto'};
  const card=E.activeCard(g),dice=E.freeDice(g),plan=closestMatch(card,dice,E.wildColor(g));
  if(g.bank.adjust>0&&plan.distance<=g.bank.adjust&&plan.step)return {type:'bonus',bonusType:'adjust',...plan.step};
  if(g.bank.reroll>0&&E.rerollableDice(g).length){
   const die=E.canFreeze(g)?freezeChoice(card,dice,E.wildColor(g),g.frozen||[]):null;
   if(die)return {type:'bonus',bonusType:'freeze',id:die.id};
   return {type:'bonus',bonusType:'reroll'};
  }
  return {type:'fall'};
 }
 if(g.phase==='decision'){
  const points=E.banked(g),next=rankCards(g,E.options(g))[0];
  const expected=next?chanceBeforeRoll(g,next)*E.sequenceScore([...g.landed.map(e=>g.hand.find(c=>c.uid===e.card)),next],E.currentModule(g)).points:0;
  const goal=Math.max(0,leader);
  const continuing=next&&(!E.canStop(g)||points<goal||expected>points*caution);
  const die=continuing&&g.bank.freeze>0?freezeChoice(next,E.freeDice(g),E.wildColor(g),g.frozen||[]):null;
  if(continuing&&die&&g.bank.freeze>0)return {type:'bonus',bonusType:'freeze',id:die.id};
  return {type:continuing?'continue':'stop'};
 }
 if(g.phase==='result')return g.sequenceReward?.pending?{type:'claim-sequence',choice:[...E.BONUS_TYPES].sort((a,b)=>g.bank[a]-g.bank[b])[0]}:{type:'proceed'};
 return null;
}
