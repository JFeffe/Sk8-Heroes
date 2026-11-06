import {isOwnStar} from './skaters.js';
export function matches(card, values) {
  if (!card || values.length !== card.cost || values.some(v => !Number.isInteger(v) || v < 1 || v > 6)) return false;
  const a = [...values].sort((x,y) => x-y);
  if (card.pattern === 'at-least') return a.every(v=>v>=card.threshold);
  if (card.pattern === 'at-most') return a.every(v=>v<=card.threshold);
  if (card.pattern === 'choices') return card.choices.some(choice=>a.every((v,i)=>v===choice[i]));
  if (card.pattern === 'odd-distinct') return a.every(v=>v%2===1) && a[0]!==a[1];
  if (card.pattern === 'exact') return a.every((v,i) => v === card.values[i]);
  if (card.pattern === 'parity') return a[0]%2 !== a[1]%2;
  if (card.pattern === 'even-distinct') return a.every(v => v%2 === 0) && a[0] !== a[1];
  if (card.pattern === 'ones') return a.every(v => v === 1);
  if (card.pattern === 'two-three') return a[0] === 2 && a[1] === 3;
  if (card.pattern === 'straight') return a.every((v,i) => !i || v === a[i-1]+1);
  return false;
}
// Match physical dice to the printed sockets. Partial placements keep space for
// a valid completion; e.g. a 6 goes on the right of a consecutive pair.
export function resolveDice(card, dice, ownColor=null) {
  if (!card || dice.length>card.cost || new Set(dice.map(d=>d.id)).size!==dice.length) return null;
  // The catalog enumerates unordered combinations. Printed P / I sockets
  // have a semantic order: even on the left, odd on the right, even when
  // the odd face is the smaller number (or a personal star is used).
  if(card.requirementCode==='mixed')card={...card,pattern:'parity'};
  const slots=Array(card.cost).fill(null),values=Array(card.cost).fill(null);
  function accepts(i,v){
    if(!Number.isInteger(v)||v<1||v>6)return false;
    if(card.pattern==='exact')return v===card.values[i];
    if(card.pattern==='choices')return card.choices.some(choice=>choice[i]===v);
    if(card.pattern==='ones')return v===1;
    if(card.pattern==='two-three')return v===[2,3][i];
    if(card.pattern==='at-least')return v>=card.threshold;
    if(card.pattern==='at-most')return v<=card.threshold;
    if(card.pattern==='parity')return v%2===i;
    if(card.pattern==='odd-distinct')return v%2===1;
    if(card.pattern==='even-distinct')return v%2===0;
    return true;
  }
  function completable(i=0){
    if(i===card.cost)return matches(card,values)&&(card.pattern!=='straight'||values.every((v,j)=>!j||v===values[j-1]+1))&&(card.pattern!=='choices'||card.choices.some(choice=>values.every((v,j)=>v===choice[j])));
    if(values[i]!==null)return completable(i+1);
    for(let v=1;v<=6;v++)if(accepts(i,v)){values[i]=v;const ok=completable(i+1);values[i]=null;if(ok)return true;}
    return false;
  }
  function put(n){
    if(n===dice.length)return completable()?{ids:slots.slice(),values:values.slice()}:null;
    const d=dice[n];
    const candidates=isOwnStar(d,ownColor)?[1,2,3,4,5,6]:[d.face];
    for(let i=0;i<card.cost;i++)for(const value of candidates)if(slots[i]===null&&accepts(i,value)){
      slots[i]=d.id;values[i]=value;const result=put(n+1);
      slots[i]=null;values[i]=null;if(result)return result;
    }
    return null;
  }
  return put(0);
}
export const arrangeDice=(card,dice,ownColor=null)=>resolveDice(card,dice,ownColor)?.ids||null;
export function findMatch(card, dice, ownColor=null) {
  if (!card) return null;
  const hasWild=dice.some(d=>isOwnStar(d,ownColor));
  function search(start, ids, values) {
    if (ids.length === card.cost) return (hasWild?!!resolveDice(card,ids.map(id=>dice.find(d=>d.id===id)),ownColor):matches(card, values)) ? ids : null;
    for (let i=start; i<dice.length; i++) {
      const result = search(i+1, [...ids,dice[i].id], [...values,dice[i].face]);
      if (result) return result;
    }
    return null;
  }
  return search(0, [], []);
}
