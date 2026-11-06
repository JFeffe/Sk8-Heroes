export const SECOND_PLACE_PV=1;

// Real points use printed card properties and validated physical dice.
export function evidence(cards,state){const entries=(state?.moduleTrace?.entries||[]).filter(e=>cards.some(c=>c.uid===e.card));return {entries,complete:entries.length===cards.length};}
export function moduleBonusPoints(module,cards,state=null){
 const b=module?.bonus;if(!b||!cards.length)return 0;const {entries}=evidence(cards,state);
 switch(b.kind){
  case 'base':return cards.filter(c=>c.tier==='base').length*b.points;
  case 'favored':return cards.filter(c=>c.type===b.type).length*b.points;
  case 'amplitude':return cards.filter(c=>c.cost>=b.minimumDice).length*b.points;
  case 'signature':return state?.moduleTrace?.ownColor&&entries.some(e=>e.dice.some(d=>d.color===state.moduleTrace.ownColor))?b.points:0;
  case 'stars':return entries.reduce((n,e)=>n+e.dice.filter(d=>d.face===1).length,0)*b.points;
  default:return 0;
 }
}
export const sequenceBonusPoints=(module,cards)=>cards.length===3?(module?.bonus.kind==='three-score'?module.bonus.points:1):0;
export function sequenceTokenCount(module,cards){if(cards.length===3)return module?.bonus.kind==='three-tokens'?module.bonus.tokens:1;return cards.length===2&&module?.bonus.kind==='recovery'?module.bonus.tokens:0;}
export function moduleEffect(module,cards,state=null){return {points:moduleBonusPoints(module,cards,state)+Math.max(0,sequenceBonusPoints(module,cards)-(cards.length===3?1:0)),tokens:Math.max(0,sequenceTokenCount(module,cards)-(cards.length===3?1:0))};}
export function moduleBonusEarned(module,cards,state=null){const effect=moduleEffect(module,cards,state);return effect.points>0||effect.tokens>0;}
export const appearanceLabel=m=>m.rounds.length===1?'MANCHE '+m.rounds[0]:'MANCHES '+m.rounds[0]+'–'+m.rounds.at(-1);
export function routeStages(length=6){return length===4?[0,1,1,2]:[0,0,1,1,1,2];}
export function validModuleRoute(route,modules){return Array.isArray(route)&&[4,6].includes(route.length)&&new Set(route).size===route.length&&route.every((id,i)=>Number.isInteger(id)&&modules[id]?.stage===routeStages(route.length)[i]);}
