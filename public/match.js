import * as E from './engine.js';
import {TRICKS,MODULES} from './data.js';
import {decide} from './npc.js';
import {npcContext} from './npc-strategy.js';
import {SKATERS,getSkater} from './skaters.js';
import {SECOND_PLACE_PV,validModuleRoute} from './module-rules.js';
import * as Stats from './match-statistics.js';
import {npcDifficulty as difficultyPolicy} from './npc-difficulty.js';
import {npcGameView} from './npc-view.js';
import {TIER_ORDER,lowerTierCards,recoveryTier} from './trick-presentation.js';
import {passingDraft,canInitialPick,concurrentInitialChoice,initializePassingDraft,chooseInitial,validatePassingDraft,waitingForPick} from './initial-draft.js';
export {passingDraft,canInitialPick,concurrentInitialChoice,waitingForPick} from './initial-draft.js';
export {matchSummary,checkpointClock,setClockRunning,clockState,restoreClockState} from './match-statistics.js';
export const MATCH_VERSION=12;
const npcCaution=[1.12,1,.9];
export const currentPlayer=m=>m.players[m.active];
export const human=m=>m.players[0];
export const standings=m=>[...m.players].sort((a,b)=>b.game.pv-a.game.pv||a.seat-b.seat);
export function random(m){if(typeof m.randomSource==='function')return m.randomSource();m.rngState=(Math.imul(m.rngState,1664525)+1013904223)>>>0;return m.rngState/2**32;}
function bindDeck(m){for(const p of m.players){Object.defineProperty(p.game,'deck',{get:()=>m.deck,enumerable:false,configurable:true});Object.defineProperty(p.game,'draftCards',{get:()=>[...m.market.cards,...(m.market.reserve||[])],enumerable:false,configurable:true});Object.defineProperty(p.game,'draftTokens',{get:()=>m.market.tokens,enumerable:false,configurable:true});}return m;}
export function restore(raw){
 if(raw?.version!==MATCH_VERSION||!Array.isArray(raw.players)||raw.players.length<2||!raw.deck||!Array.isArray(raw.market?.tokens))throw Error('Sauvegarde de partie incompatible');
 if(!validModuleRoute(raw.route,MODULES)||raw.players.some(p=>p.game.version!==E.RULESET_VERSION||JSON.stringify(p.game.route)!==JSON.stringify(raw.route)))throw Error('Parcours de modules incompatible');
 if(raw.players.some(p=>!getSkater(p.skaterId)||p.game.skaterId!==p.skaterId)||new Set(raw.players.map(p=>p.skaterId)).size!==raw.players.length)throw Error('Skaters incompatibles');
 raw.deck=raw.deck.map(c=>({...TRICKS[c.id],uid:c.uid}));
 for(const p of raw.players)p.game.hand=p.game.hand.map(c=>({...TRICKS[c.id],uid:c.uid}));
 // Legacy draft snapshots may still contain the former two-card offers. Keep
 // one offer per remaining pick and return the surplus without losing cards.
 if(raw.phase==='recovery'&&raw.market.cardsPerPlayer!==1){
  if(raw.market.cards.length>raw.market.tokens.length)raw.deck.push(...raw.market.cards.splice(raw.market.tokens.length));
  raw.market.cardsPerPlayer=1;
  raw.revision++;
 }
 raw.npcDifficulty=difficultyPolicy(raw.npcDifficulty).id;
 Stats.initializeStatistics(raw,{legacy:true});
 for(const p of raw.players){Stats.limitSavedStock(raw,p);E.fitSequenceReward(p.game);}
 validatePassingDraft(raw);
 return bindDeck(raw);
}
export function newMatch({name='Rider',length=6,npcCount=3,npcDifficulty='normal',skaterId='neo',seed=Date.now(),tieMode='full',randomSource=null}={}){
 const selected=getSkater(skaterId);if(!selected)throw Error('Skater inconnu');
 const m={version:MATCH_VERSION,rngState:seed>>>0,phase:'initial',module:0,round:0,position:0,order:[],draftKind:'initial',draftRound:0,draftLog:[],draftOrder:[],market:{cards:[],tokens:[]},discard:[],discardedBonuses:[],leftover:null,active:0,players:[],deck:[],route:[],recaps:[],revision:0,lastEvent:'Choisis tes six cartes.',tieMode};
 m.npcDifficulty=difficultyPolicy(npcDifficulty).id;
 if(randomSource)Object.defineProperty(m,'randomSource',{value:randomSource,enumerable:false,configurable:true});
 const rng=()=>random(m),first=E.newGame({name,length,skaterId},rng);m.route=first.route;m.deck=first.deck;
 const count=Math.max(1,Math.min(3,Math.trunc(npcCount)||3));
 const available=E.shuffle(SKATERS.filter(s=>s.id!==skaterId),rng);
 for(let seat=0;seat<=count;seat++){
  const character=seat===0?selected:available[seat-1];
  const game=seat===0?first:E.newGame({name:character.name,length,skaterId:character.id,route:m.route},rng);
  game.route=[...m.route];game.competitive=true;game.deferredOffer=true;game.offer=[];
  m.players.push({id:`p${seat}`,seat,skaterId:character.id,kind:seat?'npc':'human',color:character.color,caution:seat?npcCaution[seat-1]:1,game});
 }
 Stats.initializeStatistics(m);bindDeck(m);m.order=E.shuffle(m.players.map(p=>p.seat),rng);initializePassingDraft(m,rng);return m;
}
function apply(g,c,rng){
 switch(c.type){
  case 'draft':return E.choose(g,c.cardId,rng);
  case 'draft-bonus':return E.chooseBonus(g,c.choice,rng);
  case 'draft-skip':return E.skipDraft(g,rng);
  case 'choose':return E.chooseCard(g,c.cardId);
  case 'roll':return E.roll(g,rng);
  case 'place':return E.place(g,c.ids,c.target);
  case 'auto':return E.autoPlace(g);
  case 'reset-placement':return E.resetPlacement(g);
  case 'bonus':return E.bonus(g,c.bonusType,c.id,c.delta,rng);
  case 'land':return E.land(g);
  case 'stop':return E.stop(g);
  case 'continue':return E.continueRun(g);
  case 'fall':return E.fall(g);
  case 'pass':return E.pass(g);
  case 'proceed':return E.proceed(g);
  case 'claim':return E.claim(g,c.choice,rng);
  case 'claim-sequence':return E.claimSequenceReward(g,c.choice);
  default:return false;
 }
}
export function settleModule(m){
 if(m.recaps.length!==m.module||!m.players.every(p=>p.game.history.length===m.module+1))return false;
 const module=MODULES[m.route[m.module]];
 const rows=m.players.map(p=>{const h=p.game.history[m.module];return {id:p.id,name:p.game.name,color:p.color,skaterId:p.skaterId,attempts:h.attempts.map(a=>({points:a.points,reason:a.reason,cards:a.cards,moduleBonus:a.moduleBonus||0,sequenceBonus:a.sequenceBonus||0,tokenReward:a.tokenReward||null,tokenRewards:[...(a.tokenRewards||[])],rewardTokens:a.rewardTokens||0,moduleEffect:{...(a.moduleEffect||{points:0,tokens:0})}})),best:h.best,before:p.game.pv,gain:0,after:p.game.pv};});
 rows.sort((a,b)=>b.best-a.best||a.id.localeCompare(b.id));
 const [first,second]=new Set(rows.filter(row=>row.best>0).map(row=>row.best));
 const winners=rows.filter(row=>row.best===first),runnersUp=rows.filter(row=>row.best===second);
 for(const [group,prize] of [[winners,module.pv],[runnersUp,SECOND_PLACE_PV]]){
  const gain=m.tieMode==='split'?prize/Math.max(1,group.length):prize;
  for(const row of group){
   row.gain=gain;row.after=row.before+gain;
   const player=m.players.find(p=>p.id===row.id);
   player.game.pv=row.after;player.game.history[m.module].pv=gain;
  }
 }
 m.recaps.push({module:module.id,index:m.module,pv:module.pv,secondPv:SECOND_PLACE_PV,rows,winners:winners.map(r=>r.id),runnersUp:runnersUp.map(r=>r.id)});
 if(m.module===m.route.length-1)Stats.finishClock(m);
 m.phase='recap';m.active=0;m.lastEvent=winners.length?'Résultats du module':'Aucun essai conservé : aucun PV attribué.';return true;
}
function describe(g,c,card){
 const name=g.name;
 if(c.type==='choose')return `${name} engage ${card}.`;
 if(c.type==='roll')return `${name} lance ${E.freeDice(g).length-(g.heldLastRoll?.length||0)} dés${g.heldLastRoll?.length?' et conserve son dé gelé':''}.`;
 if(c.type==='land')return `${name} réussit son trick · ${E.banked(g)} pts.`;
 if(c.type==='bonus')return `${name} dépense un jeton ${c.bonusType==='freeze'?'❄':c.bonusType==='reroll'?'↻':c.delta===1?'+1':'−1'}.`;
 if(c.type==='stop')return `${name} conserve ${g.score} pts.`;
 if(c.type==='fall')return `${name} chute · 0 pt.`;
 if(c.type==='continue')return `${name} poursuit sa séquence.`;
 if(c.type==='claim-sequence')return `${name} gagne un jeton ${c.choice==='freeze'?'❄':c.choice==='reroll'?'↻':'±1'}.`;
 if(c.type==='pass')return `${name} passe cet essai.`;
 return null;
}
// All controllers submit the same serializable commands. An authoritative
// transport can later call this boundary; no network or remote trust is implied.
function nextDraftSeat(m){
 m.position++;
 if(m.position===m.order.length){m.position=0;m.draftRound++;if(m.draftRound===6){m.phase='draft-summary';m.active=0;return;}}
 m.active=m.order[m.position];E.offer(currentPlayer(m).game,()=>random(m));
}
function sharedChoice(m,c){
 const player=currentPlayer(m),g=player.game,before={...g.bank};
 if(c.type!=='draft-pair')return false;
 const cardIndex=m.market.cards.findIndex(card=>card.uid===c.cardId),tokenIndex=m.market.tokens.findIndex(token=>token.id===c.tokenId);
 const reserveIndex=(m.market.reserve||[]).findIndex(card=>card.uid===c.cardId),deckIndex=m.deck.findIndex(card=>card.uid===c.cardId);
 if(cardIndex<0&&(reserveIndex<0||deckIndex<0)||tokenIndex<0)return false;
 const token=m.market.tokens[tokenIndex];
 if(!E.BONUS_TYPES.includes(token.type)||!E.draftBonusChoices(g,m.market.tokens).includes(token))return false;
 // Validate both choices before removing either item or moving to the next seat.
 const card=cardIndex>=0?m.market.cards.splice(cardIndex,1)[0]:m.deck.splice(deckIndex,1)[0];if(reserveIndex>=0)m.market.reserve.splice(reserveIndex,1);m.market.tokens.splice(tokenIndex,1);g.hand.push(card);const added=E.addBonus(g,token.type);
 Stats.recordTokenChanges(m,player,before);Stats.checkpointClock(m);
 m.draftLog.push({module:m.module,kind:'recovery',playerId:c.playerId,action:c.type,name:card.name,bonus:token.type,tokenId:token.id,...(added?{}:{bonusDiscarded:true})});
 m.lastEvent=added?`${g.name} prend ${card.name} et un jeton bonus.`:`${g.name} prend ${card.name}. Jeton remis à la banque.`;
 m.revision++;m.position++;
 if(m.position===m.draftOrder.length){
  m.deck.push(...m.market.cards);m.market.cards=[];m.market.reserve=[];
  m.phase='draft-summary';m.active=0;
 }else m.active=m.draftOrder[m.position];
 return true;
}
export function dispatch(m,command){
 if(!command||!['initial','playing','recovery'].includes(m.phase))return false;
 if(m.phase==='initial'&&passingDraft(m)){
  if(command.type!=='draft'||command.revision!==undefined&&command.revision!==m.revision&&!concurrentInitialChoice(m,command))return false;
  const changed=chooseInitial(m,command,()=>random(m));if(changed)Stats.checkpointClock(m);return changed;
 }
 if(command.playerId!==currentPlayer(m)?.id)return false;
 if(command.revision!==undefined&&command.revision!==m.revision)return false;
 if(command.type==='place'&&!Array.isArray(command.ids))return false;
 const p=currentPlayer(m),g=p.game,c=command,rng=()=>random(m),draftActions=['draft','draft-bonus','draft-skip','draft-pair'];
 if(m.phase==='initial'&&c.type!=='draft')return false;
 if(m.phase==='recovery')return sharedChoice(m,c);
 if(m.phase==='playing'&&[...draftActions,'claim'].includes(c.type))return false;
 const card=g.hand.find(t=>t.uid===c.cardId)?.name;
 const offered=g.offer.map(uid=>g.deck.find(c=>c.uid===uid)?.name),chosen=g.deck.find(x=>x.uid===c.cardId)?.name,offeredBonus=g.bonusOffer,reward=g.reward;
 const previousPhase=g.phase,before={...g.bank};
 if(!apply(g,c,rng))return false;
 // Clicked falls and sequence rewards hand over atomically, including online.
 // Plain commands still expose the result for controllers and saved games.
 const advanceResult=['fall','claim-sequence'].includes(c.type)&&c.advance===true&&!g.sequenceReward?.pending;
 if(advanceResult)E.proceed(g);
 Stats.recordTokenChanges(m,p,before);Stats.checkpointClock(m);
 m.revision++;m.lastEvent=describe(g,c,card)||m.lastEvent;
 if(['initial','recovery'].includes(m.phase)){
  m.draftLog.push({module:m.module,kind:m.draftKind,round:m.draftRound,playerId:p.id,action:c.type,name:chosen||null,bonus:c.type==='claim'?(reward==='choice'?c.choice:reward):c.type==='draft-bonus'?c.choice:null,offered,offeredBonus});
  if(draftActions.includes(c.type))nextDraftSeat(m);
 }else if(m.phase==='playing'&&(advanceResult||c.type==='proceed'&&previousPhase==='result')){
  m.position++;
  if(m.position===m.order.length){
   m.position=0;m.round++;
   if(m.round===2){settleModule(m);return true;}
  }
  m.active=m.order[m.position];m.lastEvent=`Essai ${m.round+1} · au tour de ${currentPlayer(m).game.name}.`;
 }
 return true;
}
export function startModule(m){
 if(m.phase!=='draft-summary')return false;
 Stats.checkpointClock(m);
 if(m.draftKind==='recovery'){m.order.push(m.order.shift());m.module++;for(const p of m.players)E.nextModule(p.game);}
 m.round=0;m.position=0;m.active=m.order[0];m.phase='playing';m.revision++;
 m.lastEvent=`Essai 1 · ${currentPlayer(m).game.name} commence.`;return true;
}
export function advance(m){
 if(m.phase!=='recap')return false;
 Stats.checkpointClock(m);
 m.revision++;
 if(m.module===m.route.length-1){m.phase='complete';return true;}
 const rows=m.recaps.at(-1).rows;
 m.draftOrder=[...m.order].sort((a,b)=>rows.find(r=>r.id===m.players[a].id).best-rows.find(r=>r.id===m.players[b].id).best||m.order.indexOf(a)-m.order.indexOf(b));
 const tier=recoveryTier(m.module),level=TIER_ORDER[tier];
 const drawn=E.shuffle(m.deck.filter(c=>c.tier===tier),()=>random(m)).slice(0,m.players.length);
 if(drawn.length!==m.players.length)throw Error('Pioche insuffisante pour ce niveau de draft.');
 const ids=new Set(drawn.map(c=>c.uid));m.deck=m.deck.filter(c=>!ids.has(c.uid));
 m.market={cardsPerPlayer:1,tier,level,cards:drawn,reserve:lowerTierCards(m.deck,level),tokens:Array.from({length:m.players.length},(_,i)=>({id:`m${m.module}-token${i}`,type:['adjust','reroll','freeze'][Math.floor(random(m)*3)]}))};m.leftover=null;
 for(const p of m.players){p.game.phase='draft';p.game.offer=[];p.game.bonusOffer=null;}
 m.position=0;m.active=m.draftOrder[0];m.draftKind='recovery';m.draftRound=0;m.phase='recovery';return true;
}
export function pendingNpc(m){
 if(!['initial','playing','recovery'].includes(m.phase))return null;
 if(m.phase==='initial'&&passingDraft(m))return m.order.map(seat=>m.players[seat]).find(p=>p.kind==='npc'&&waitingForPick(m,p.id))||null;
 return currentPlayer(m)?.kind==='npc'?currentPlayer(m):null;
}
export const hasNpcTurn=m=>!!pendingNpc(m);
export function npcStep(m){
 const p=pendingNpc(m);if(!p)return false;
 const action=decide(npcGameView(p.game),npcContext(m,p));
 return action?dispatch(m,{playerId:p.id,...action}):false;
}
