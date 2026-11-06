import {MODULES,makeDeck} from './data.js';
import {createTurnEngine,newTurn,sequenceScore} from './turn.js';
import {validModuleRoute} from './module-rules.js';
export {freeDice,activeCard,banked,matches,findMatch,resolveDice,wildColor,isOwnStar,sequenceScore,sequenceView,rerollableDice} from './turn.js';
export const RULESET_VERSION=17;
export const BONUS_TYPES=['adjust','reroll','freeze'];
export const BONUS_LIMIT=3;
export const bonusSlots=(s,type)=>Math.max(0,BONUS_LIMIT-(s.bank[type]||0));
export const canAddBonus=(s,type)=>BONUS_TYPES.includes(type)&&bonusSlots(s,type)>0;
export function draftBonusChoices(s,tokens){
  const available=tokens.filter(token=>canAddBonus(s,token.type));
  return available.length?available:tokens;
}
export function fitSequenceReward(s){
  const reward=s.sequenceReward;if(!reward?.pending)return;
  const slots=BONUS_TYPES.reduce((sum,type)=>sum+bonusSlots(s,type),0);
  reward.remaining=Math.min(reward.remaining,slots);reward.pending=reward.remaining>0;
}
const emptyEarned=()=>Object.fromEntries(BONUS_TYPES.map(type=>[type,0]));
export const shuffle=(a,rng=Math.random)=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export const currentModule=s=>MODULES[s.route[s.module]];
const turn=createTurnEngine(s=>currentModule(s).needs);
export const {eligible,options,requiredTypes,missingTypes,typeAllowed,canStop,canFall,canFreeze,chooseCard,resetPlacement,roll,place,autoPlace,bonus,canLand,continueRun}=turn;
function finishAction(action){return s=>{
  const changed=turn[action](s);
  if(changed&&s.phase==='result'){
    const cards=s.landed.map(e=>s.hand.find(c=>c.uid===e.card));
    const scored=sequenceScore(cards,currentModule(s),s);
    s.last={points:s.score,success:s.score>0,reason:s.reason,
      base:s.score?scored.base:0,bonus:s.score?scored.bonus:0,sequenceBonus:s.score?scored.sequenceBonus:0,
      cardBonus:s.score?scored.cardBonus:0,moduleBonus:s.score?scored.moduleBonus:0,
      tokenReward:null,tokenRewards:[],rewardTokens:s.score?scored.rewardTokens:0,moduleEffect:s.score?scored.moduleEffect:{points:0,tokens:0},cards:cards.map(c=>c.name),failed:s.reason==='fall'?s.hand.find(c=>c.uid===s.active)?.name||null:null,
      entries:[...s.landed.map(e=>({card:e.card,confirmed:true,bonus:s.score?scored.details.find(d=>d.card===e.card)?.points||0:0,dice:e.dice.map(id=>({...s.dice[id]}))})),...(s.reason==='fall'&&s.active?[{card:s.active,confirmed:false,bonus:0,dice:s.pending.map(id=>({...s.dice[id]}))}]:[])]};
    s.sequenceReward=s.last.rewardTokens?{pending:true,choice:null,choices:[],total:s.last.rewardTokens,remaining:s.last.rewardTokens}:null;
    fitSequenceReward(s);
    s.attempts.push({...s.last});
    if(!['fall','pass'].includes(s.reason)){
      s.sequences.push({attempt:s.attempt,points:s.score,bonus:scored.bonus,moduleBonus:scored.moduleBonus,sequenceBonus:scored.sequenceBonus,tokenRewards:[],rewardTokens:scored.rewardTokens,moduleEffect:scored.moduleEffect,
        entries:s.landed.map(e=>({card:e.card,bonus:scored.details.find(d=>d.card===e.card).points,dice:e.dice.map(id=>({id,color:s.dice[id].color,face:s.dice[id].face,wildValue:s.dice[id].wildValue}))}))});
      s.secured.push(...cards.map(c=>c.uid));
      for(const c of cards)if(c.comboBonus?.kind==='reward')s.earned[c.comboBonus.type]=(s.earned[c.comboBonus.type]||0)+1;
    }
  }
  return changed;
};}
export const land=finishAction('land'),stop=finishAction('stop'),fall=finishAction('fall'),pass=finishAction('pass');
export function drawModuleRoute(length=6,rng=Math.random){
  return [...shuffle(MODULES.filter(m=>m.stage===0),rng).slice(0,length===6?2:1),
    ...shuffle(MODULES.filter(m=>m.stage===1),rng).slice(0,length===6?3:2),
    ...shuffle(MODULES.filter(m=>m.stage===2),rng).slice(0,1)].map(m=>m.id);
}
export function newGame({name='Rider',length=6,skaterId=null,route:fixedRoute=null}={},rng=Math.random){
  if(fixedRoute&&!validModuleRoute(fixedRoute,MODULES))throw Error('Parcours de modules invalide');
  const route=fixedRoute?[...fixedRoute]:drawModuleRoute(length,rng);
  const s={...newTurn(),version:RULESET_VERSION,skaterId,name:name.trim().slice(0,24)||'Rider',route,module:0,attempt:0,
    phase:'initial',deck:shuffle(makeDeck(),rng),hand:[],offer:[],bank:{adjust:1,reroll:1,freeze:1},draftPick:0,bonusOffer:null,secured:[],sequences:[],earned:emptyEarned(),attempts:[],history:[],pv:0,created:Date.now()};
  offer(s,rng);return s;
}
export function offer(s,rng=Math.random){
  s.bonusOffer=s.phase==='initial'?null:['adjust','reroll','freeze'][Math.floor(rng()*3)];
  const type=['kick','kick','slide','slide','air','air'][s.draftPick];
  // Prefer accessible scores first, while offering three distinct tricks.
  const cap=s.draftPick===5?16:7;
  const pool=s.phase==='initial'?s.deck.filter(c=>c.type===type):s.deck;
  const shuffled=shuffle(pool,rng);
  // Prefer accessible cards, but still offer three distinct tricks when that
  // tier has too few remaining copies (notably Air in a four-player draft).
  if(s.phase==='initial')shuffled.sort((a,b)=>Number(a.points>cap)-Number(b.points>cap));
  s.offer=[...new Map(shuffled.map(c=>[c.id,c])).values()].slice(0,3).map(c=>c.uid);
}
export const choose=(s,uid,rng=Math.random)=>draftChoice(s,'card',uid,rng);
export const chooseBonus=(s,type,rng=Math.random)=>draftChoice(s,'bonus',type,rng);
export const skipDraft=(s,rng=Math.random)=>draftChoice(s,'skip',null,rng);
function draftChoice(s,kind,value,rng){
  if(!['initial','draft'].includes(s.phase))return false;
  if(s.phase==='initial'&&kind!=='card')return false;
  if(kind==='card'){
    if(!s.offer.includes(value))return false;
    const i=s.deck.findIndex(c=>c.uid===value);if(i<0)return false;
    s.hand.push(s.deck.splice(i,1)[0]);
  }else if(kind==='bonus'){
    if(value!==s.bonusOffer||!addBonus(s,value))return false;
  }else if(kind!=='skip')return false;
  s.offer=[];s.bonusOffer=null;
  if(s.phase==='initial'){
    s.draftPick++;
    if(s.draftPick<6){if(!s.deferredOffer)offer(s,rng);}else Object.assign(s,newTurn());
  }else{s.module++;s.attempt=0;s.attempts=[];s.secured=[];s.sequences=[];s.earned=emptyEarned();Object.assign(s,newTurn());}
  return true;
}
export function proceed(s){
  if(s.phase!=='result'||s.sequenceReward?.pending)return false;
  if(s.attempt===0){s.attempt=1;Object.assign(s,newTurn());return true;}
  const m=currentModule(s),best=Math.max(...s.attempts.map(a=>a.points)),qualified=best>0,pv=qualified&&!s.competitive?m.pv:0;
  s.history.push({module:m.id,best,total:s.attempts.reduce((n,a)=>n+a.points,0),attempts:structuredClone(s.attempts),sequences:structuredClone(s.sequences),pv});s.pv+=pv;
  s.trickRewards=BONUS_TYPES.flatMap(type=>Array.from({length:s.earned[type]||0},()=>({type,added:addBonus(s,type)})));
  if(s.module===s.route.length-1){s.phase='complete';return true;}
  if(s.competitive){s.reward=null;s.phase='awaiting-draft';return true;}
  s.reward='choice';s.phase='reward';return true;
}
export function nextModule(s){
  s.module++;s.attempt=0;s.attempts=[];s.secured=[];s.sequences=[];s.earned=emptyEarned();s.offer=[];s.bonusOffer=null;Object.assign(s,newTurn());
}
export function addBonus(s,type){
  if(!canAddBonus(s,type))return false;
  s.bank[type]=(s.bank[type]||0)+1;return true;
}
export function claimSequenceReward(s,type){
  if(s.phase!=='result'||!s.sequenceReward?.pending||!addBonus(s,type))return false;
  const reward=s.sequenceReward;reward.choices.push(type);reward.remaining--;fitSequenceReward(s);reward.choice=reward.choices[0];
  for(const entry of [s.last,s.attempts.at(-1),s.sequences.at(-1)]){entry.tokenReward=reward.choice;entry.tokenRewards=[...reward.choices];}
  return true;
}
export function claim(s,choice,rng=Math.random){
  if(s.phase!=='reward')return false;
  const type=s.reward==='choice'?choice:s.reward;
  if(!['adjust','reroll','freeze'].includes(type))return false;
  if(s.reward==='choice'&&!canAddBonus(s,type)&&BONUS_TYPES.some(t=>canAddBonus(s,t)))return false;
  s.rewardAdded=addBonus(s,type);s.reward=null;s.phase='draft';offer(s,rng);return true;
}
