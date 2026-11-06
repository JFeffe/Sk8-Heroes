import {findMatch} from './combinations.js';

// Highlight every die participating in a complete legal match, constrained by
// dice already placed. A personal star uses the same resolver as validation.
export function validDiceIds(card,dice,ownColor=null,pending=[]){
 const result=new Set();if(!card||dice.length<card.cost)return result;
 function choose(start,subset){
  if(subset.length===card.cost){if(pending.every(id=>subset.some(d=>d.id===id))&&findMatch(card,subset,ownColor))subset.forEach(d=>result.add(d.id));return;}
  for(let i=start;i<dice.length;i++)choose(i+1,[...subset,dice[i]]);
 }
 choose(0,[]);return result;
}
export function detectRolls(match,previous={}){
 const stamps={},rolled={};
 for(const p of match.players){
  const g=p.game,stamp={turn:`${g.module}:${g.attempt}`,rolls:g.rolls||0,rerolls:g.used.reroll||0},old=previous[p.id];stamps[p.id]=stamp;
  if(old&&g.phase==='rolled'&&(old.turn!==stamp.turn?stamp.rolls>0:stamp.rolls>old.rolls||stamp.rerolls>old.rerolls))rolled[p.id]=g.dice.filter(d=>d.locked===null&&!g.heldLastRoll.includes(d.id)).map(d=>d.id);
 }
 return {stamps,rolled};
}
