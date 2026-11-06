import {newModuleTrace,recordRoll,recordLanding} from './module-trace.js';
import {matches,findMatch,resolveDice} from './combinations.js';
import {DIE_COLORS,wildColor,isOwnStar} from './skaters.js';
import {MODULES} from './data.js';
import {moduleBonusPoints,sequenceBonusPoints,sequenceTokenCount,moduleEffect} from './module-rules.js';
export {matches,findMatch,resolveDice,wildColor,isOwnStar};
export const freeDice=s=>s.dice.filter(d=>d.locked===null);
export function newTurn(){return {moduleTrace:newModuleTrace(),phase:'select',active:null,landed:[],pending:[],dice:DIE_COLORS.map((color,id)=>({id,color:color.key,face:null,locked:null,wildValue:null})),frozen:[],heldLastRoll:[],reuseRoll:false,sequenceReward:null,used:{adjust:0,reroll:0,freeze:0},rolls:0,score:null,reason:null};}
export const activeCard=s=>s.hand.find(c=>c.uid===s.active);
export function sequenceScore(cards,module=null,context=null){
  const base=cards.reduce((sum,c)=>sum+c.points,0);
  const details=cards.map((c,i)=>{
    const b=c.comboBonus;
    const active=b?.kind==='companion'?cards.some((other,j)=>j!==i&&other.type===b.type):b?.kind==='variety'&&new Set(cards.map(c=>c.type)).size===3;
    return {card:c.uid,points:active?b.points:0};
  });
  const sequenceBonus=sequenceBonusPoints(module,cards);
  const cardBonus=details.reduce((sum,d)=>sum+d.points,0),moduleBonus=moduleBonusPoints(module,cards,context);
  const bonus=cardBonus+sequenceBonus+moduleBonus;
  return {base,bonus,cardBonus,moduleBonus,sequenceBonus,points:base+bonus,details,rewardTokens:sequenceTokenCount(module,cards),moduleEffect:moduleEffect(module,cards,context)};
}
const scoringModule=s=>MODULES[s.route?.[s.module]];
export const banked=s=>sequenceScore(s.landed.map(e=>s.hand.find(c=>c.uid===e.card)),scoringModule(s),s).points;
export function sequenceView(s){
 const cards=s.landed.map(e=>s.hand.find(c=>c.uid===e.card)),active=activeCard(s);
 let previewState=s;
 if(active&&s.phase==='rolled'&&s.pending.length===active.cost&&resolveDice(active,s.pending.map(id=>s.dice[id]),wildColor(s))){
  previewState={...s,moduleTrace:structuredClone(s.moduleTrace)};recordLanding(previewState);
 }
 const confirmed=sequenceScore(cards,scoringModule(s),s),preview=sequenceScore(active?[...cards,active]:cards,scoringModule(s),previewState);
 return {confirmed,preview,hasPreview:!!active&&!['result'].includes(s.phase)};
}
export const rerollableDice=s=>freeDice(s).filter(d=>!(s.frozen||[]).includes(d.id));
export function createTurnEngine(needsFor){
  const missingTypes=s=>needsFor(s).length===2?needsFor(s).filter(type=>!s.landed.some(e=>s.hand.find(c=>c.uid===e.card)?.type===type)):[];
  const requiredTypes=s=>needsFor(s).length===2?missingTypes(s):s.landed.length?[]:needsFor(s);
  const typeAllowed=(s,c)=>!requiredTypes(s).length||requiredTypes(s).includes(c.type);
  function eligible(s,uid){
    const c=s.hand.find(c=>c.uid===uid);
    return !!c&&!(s.secured||[]).includes(uid)&&s.landed.length<3&&!s.landed.some(e=>e.card===uid)&&freeDice(s).length>=c.cost&&
      typeAllowed(s,c);
  }
  const options=s=>s.hand.filter(c=>eligible(s,c.uid));
  function chooseCard(s,uid){if(!['select','ready'].includes(s.phase)||s.active===uid||!eligible(s,uid))return false;s.active=uid;s.pending=[];s.phase=s.reuseRoll?'rolled':'ready';s.reuseRoll=false;return true;}
  function resetPlacement(s){
    if(s.phase!=='rolled'||!activeCard(s)||!s.pending.length)return false;
    s.pending=[];return true;
  }
  function roll(s,rng=Math.random){if(s.phase!=='ready')return false;for(const d of freeDice(s))if(!(s.frozen||[]).includes(d.id))d.face=1+Math.floor(rng()*6);s.heldLastRoll=[...(s.frozen||[])];s.rolls++;s.phase='rolled';recordRoll(s,true);return true;}
  function place(s,ids,target=true){
    if(s.phase!=='rolled'||!ids.length||new Set(ids).size!==ids.length||ids.some(i=>!Number.isInteger(i)||!s.dice[i]||s.dice[i].locked!==null))return false;
    const next=target?[...new Set([...s.pending,...ids])]:s.pending.filter(i=>!ids.includes(i));
    if(next.length>activeCard(s).cost)return false;s.pending=next;return true;
  }
  function autoPlace(s){if(s.phase!=='rolled')return false;const ids=findMatch(activeCard(s),freeDice(s),wildColor(s));if(!ids)return false;s.pending=ids;return true;}
  const canFreeze=s=>s.bank.freeze>0&&((s.phase==='decision'&&options(s).length>0)||s.phase==='rolled')&&freeDice(s).some(d=>Number.isInteger(d.face)&&!(s.frozen||[]).includes(d.id));
  function bonus(s,type,id,delta=0,rng=Math.random){
    if(type==='freeze'){
      if(!canFreeze(s)||!Number.isInteger(id)||!s.dice[id]||s.dice[id].locked!==null||(s.frozen||[]).includes(id))return false;
      s.bank.freeze--;s.used.freeze=(s.used.freeze||0)+1;s.frozen=[...(s.frozen||[]),id];
      // A newly frozen die is waiting for its first protected roll. It must
      // not be mistaken for a die already held during this trick's last roll.
      if(s.phase==='decision')s.phase='select';return true;
    }
    if(type==='reroll'){
      if(s.phase!=='rolled'||!(s.bank.reroll>0)||!rerollableDice(s).length)return false;
      for(const d of rerollableDice(s))d.face=1+Math.floor(rng()*6);
      s.pending=[];s.heldLastRoll=[...(s.frozen||[])];s.bank.reroll--;s.used.reroll++;recordRoll(s,false);return true;
    }
    if(s.phase!=='rolled'||type!=='adjust'||!(s.bank[type]>0)||!Number.isInteger(id)||!s.dice[id]||s.dice[id].locked!==null)return false;
    const die=s.dice[id];
    if(type==='adjust'){if(![-1,1].includes(delta)||die.face+delta<1||die.face+delta>6)return false;die.face+=delta;}
    else die.face=1+Math.floor(rng()*6);
    s.bank[type]--;s.used[type]=Number(s.used[type])+1;return true;
  }
  const canLand=s=>s.phase==='rolled'&&s.pending.length===activeCard(s)?.cost&&!!resolveDice(activeCard(s),s.pending.map(i=>s.dice[i]),wildColor(s));
  function finish(s,reason){s.phase='result';s.reason=reason;s.score=['fall','pass'].includes(reason)?0:banked(s);s.frozen=[];s.heldLastRoll=[];}
  function land(s){
    if(!canLand(s))return false;recordLanding(s);
    const resolved=resolveDice(activeCard(s),s.pending.map(i=>s.dice[i]),wildColor(s));
    for(const id of s.pending){s.dice[id].wildValue=isOwnStar(s.dice[id],wildColor(s))?resolved.values[resolved.ids.indexOf(id)]:null;s.dice[id].locked=s.active;}
    // A freeze belongs to the free die for the whole sequence. Landing another
    // card and continuing must never remove it; using that die consumes it.
    s.frozen=(s.frozen||[]).filter(id=>s.dice[id].locked===null);
    s.landed.push({card:s.active,dice:[...s.pending]});s.active=null;s.pending=[];s.heldLastRoll=[];s.reuseRoll=false;
    if(missingTypes(s).length&&!options(s).length)finish(s,'fall');
    else if(s.landed.length===3||!options(s).length)finish(s,s.landed.length===3?'three':'no-options');else s.phase='decision';
    return true;
  }
  const canStop=s=>s.phase==='decision'&&!missingTypes(s).length;
  function stop(s){if(!canStop(s))return false;finish(s,'stop');return true;}
  function continueRun(s){if(s.phase!=='decision'||!options(s).length)return false;s.phase='select';return true;}
  const canFall=s=>(s.phase==='rolled'&&!findMatch(activeCard(s),freeDice(s),wildColor(s)))||(['select','ready'].includes(s.phase)&&!options(s).length)||(s.phase==='decision'&&missingTypes(s).length>0);
  function fall(s){if(!canFall(s))return false;finish(s,'fall');return true;}
  function pass(s){if(s.phase!=='select'||s.landed.length||s.reuseRoll)return false;finish(s,options(s).length?'pass':'fall');return true;}
  return {eligible,options,requiredTypes,missingTypes,typeAllowed,canStop,canFall,canFreeze,chooseCard,resetPlacement,roll,place,autoPlace,bonus,canLand,land,stop,continueRun,fall,pass};
}
