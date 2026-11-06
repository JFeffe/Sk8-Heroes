import * as E from './engine.js';
import {rollProbability} from './roll-probability.js';
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
