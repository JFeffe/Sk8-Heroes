import * as E from '../public/combinations.js';

// Exhaustive probabilities for fair independent d6, not measured player skill.
const memo=new Map(), distributions=new Map();
const sorted=faces=>[...faces].sort((a,b)=>a-b);
const diceOf=faces=>faces.map((face,id)=>({id,face}));
export function rescue(card, values, adjust, reroll) {
  const faces=sorted(values),key=`${card.pattern}:${card.cost}:${JSON.stringify(card.values||card.choices||card.threshold||[])}:${faces.join('')}:${adjust}:${reroll}`;
  if(memo.has(key))return memo.get(key);
  if(E.findMatch(card,diceOf(faces))){const won={p:1,action:null};memo.set(key,won);return won;}
  let best={p:0,action:null};
  if(adjust)for(let i=0;i<faces.length;i++)for(const delta of [-1,1]){
    if(faces[i]+delta<1||faces[i]+delta>6)continue;
    const next=[...faces];next[i]+=delta;
    const p=rescue(card,next,0,reroll).p;
    if(p>best.p)best={p,action:{type:'adjust',index:i,delta}};
  }
  if(reroll)for(let i=0;i<faces.length;i++){
    let p=0;
    for(let face=1;face<=6;face++){const next=[...faces];next[i]=face;p+=rescue(card,next,adjust,0).p/6;}
    if(p>best.p+1e-12)best={p,action:{type:'reroll',index:i,delta:0}};
  }
  memo.set(key,best);return best;
}
function distribution(n){
  if(distributions.has(n))return distributions.get(n);
  const map=new Map();
  function walk(faces){
    if(faces.length===n){const key=sorted(faces).join('');map.set(key,(map.get(key)||0)+1);return;}
    for(let v=1;v<=6;v++)walk([...faces,v]);
  }
  walk([]);const result=[...map].map(([key,count])=>({faces:[...key].map(Number),weight:count/6**n}));
  distributions.set(n,result);return result;
}
const probabilityMemo=new Map();
export function probability(card,n,adjust=0,reroll=0){
  if(n<card.cost)return 0;
  const key=`${card.pattern}:${card.cost}:${JSON.stringify(card.values||card.choices||card.threshold||[])}:${n}:${adjust}:${reroll}`;
  if(!probabilityMemo.has(key))probabilityMemo.set(key,distribution(n).reduce((sum,roll)=>sum+roll.weight*rescue(card,roll.faces,adjust,reroll).p,0));
  return probabilityMemo.get(key);
}
