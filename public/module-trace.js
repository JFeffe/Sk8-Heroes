import {matches} from './combinations.js';
import {wildColor} from './skaters.js';
export const newModuleTrace=()=>({entries:[],ownColor:null});
export function recordRoll(state){state.moduleTrace.ownColor=wildColor(state);}
export function recordLanding(state){state.moduleTrace.entries.push({card:state.active,dice:state.pending.map(id=>({id,color:state.dice[id].color,face:state.dice[id].face}))});}
// Only NPC planning uses estimates; they never enter awarded scores.
const starsCache=new Map();
function expectedStars(card){
 const key=JSON.stringify([card.pattern,card.cost,card.threshold,card.values,card.choices]);
 if(!starsCache.has(key)){let count=0,total=0;function walk(values){if(values.length===card.cost){if(matches(card,values)){count++;total+=values.filter(v=>v===1).length;}return;}for(let face=1;face<=6;face++)walk([...values,face]);}walk([]);starsCache.set(key,count?total/count:0);}
 return starsCache.get(key);
}
export function projectedBonus(module,cards,state){
 const entries=state.moduleTrace?.entries||[],known=cards.map(c=>entries.find(e=>e.card===c.uid)),unknown=cards.filter((_,i)=>!known[i]);if(!unknown.length)return null;
 if(module.bonus.kind==='signature'){const color=state.moduleTrace?.ownColor||wildColor(state);if(!color)return 0;if(known.some(e=>e?.dice.some(d=>d.color===color)))return module.bonus.points;const available=6-known.reduce((n,e)=>n+(e?.dice.length||0),0);return module.bonus.points*Math.min(1,unknown.reduce((n,c)=>n+c.cost,0)/Math.max(1,available));}
 if(module.bonus.kind==='stars')return module.bonus.points*(known.reduce((n,e)=>n+(e?.dice.filter(d=>d.face===1).length||0),0)+unknown.reduce((n,c)=>n+expectedStars(c),0));
 return null;
}
