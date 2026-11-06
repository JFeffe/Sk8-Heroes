import {findMatch} from './combinations.js';
import {wildColor} from './skaters.js';

const distributions=new Map(),memo=new Map();
const factorial=n=>n<2?1:n*factorial(n-1);
function distribution(n){
 if(distributions.has(n))return distributions.get(n);
 const out=[];
 function walk(faces,start){
  if(faces.length===n){const counts=Array(7).fill(0);faces.forEach(v=>counts[v]++);out.push({faces,weight:factorial(n)/counts.reduce((p,c)=>p*factorial(c),1)/6**n});return;}
  for(let v=start;v<=6;v++)walk([...faces,v],v);
 }
 walk([],1);distributions.set(n,out);return out;
}
// Exact chances before a fresh roll. One physical die per color; held dice
// keep their current faces, all others are independent fair dice.
export function rollProbability(card,dice,ownColor=null,heldIds=[]){
 if(!card||dice.length<card.cost)return 0;
 const held=dice.filter(d=>heldIds.includes(d.id));
 const random=dice.filter(d=>!heldIds.includes(d.id));
 const own=random.find(d=>ownColor&&d.color===ownColor);
 const normal=random.filter(d=>d!==own);
 const key=JSON.stringify([card.pattern,card.cost,card.values,card.choices,card.threshold,normal.length,!!own,held.filter(d=>ownColor&&d.color===ownColor).map(d=>d.face),held.filter(d=>!ownColor||d.color!==ownColor).map(d=>d.face).sort()]);
 if(memo.has(key))return memo.get(key);
 let p=0;
 for(const roll of distribution(normal.length))for(const face of own?[1,2,3,4,5,6]:[null]){
  const pool=[...held,...normal.map((d,i)=>({...d,face:roll.faces[i]})),...(own?[{...own,face}]:[])];
  if(findMatch(card,pool,ownColor))p+=roll.weight/(own?6:1);
 }
 memo.set(key,p);return p;
}
export const chanceBeforeRoll=(s,card)=>rollProbability(card,s.dice.filter(d=>d.locked===null),wildColor(s),s.frozen||[]);
