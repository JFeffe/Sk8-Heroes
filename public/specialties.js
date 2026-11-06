import {wildColor,dieColor} from './skaters.js';
export const SPECIALTIES={
 neo:{short:'Échange un jeton contre un autre type, sans dépasser la limite de réserve.',name:'Troc',text:'Échange un jeton contre un jeton d’un autre type, dans la limite de ta réserve.'},
 ruby:{short:'Relance gratuitement ton dé personnel après un lancer, s’il est libre et non gelé.',name:'Dé porte-bonheur',text:'Après un lancer, relance uniquement ton dé personnel disponible et non gelé, sans dépenser de jeton.'},
 jade:{short:'Au deuxième essai, reprends une carte du premier essai encaissé pour pouvoir la rejouer.',name:'Trick signature',text:'Pendant ton deuxième essai, reprends une carte utilisée dans ton premier essai encaissé. Elle redevient disponible pour être jouée, selon les règles habituelles.'},
 sol:{passive:true,short:'Peut conserver 4 jetons ±1 au lieu de 3.',name:'Réserve renforcée',text:'Peut conserver 4 jetons de type ±1 au lieu de 3. Les réserves de relance et de gel restent limitées à 3.'},
 milo:{short:'Encaisse exactement 2 tricks de types différents : gagne un jeton supplémentaire au choix.',name:'Bon rythme',text:'Après avoir encaissé exactement deux tricks de types différents, gagne un jeton supplémentaire au choix.'},
 iris:{short:'Après une chute, récupère un jeton dépensé dans cet essai, si ta réserve le permet.',name:'Rebond',text:'Après une chute, récupère un jeton dépensé pendant cet essai, dans la limite de ta réserve.'}
};
export const newSpecialty=()=>({used:false});
export const specialtyReady=g=>g.mode==='advanced'&&!!SPECIALTIES[g.skaterId]&&!SPECIALTIES[g.skaterId].passive&&!g.specialty?.used;
const types=['adjust','reroll','freeze'],label={adjust:'±1',reroll:'Relance',freeze:'Gel'};
export function specialtyActions(g){
 if(g.mode!=='advanced')return [];
 if(!specialtyReady(g))return [];
 const room=t=>(g.bank[t]||0)<3,action=(data,text)=>({type:'specialty',...data,label:text});
 if(g.skaterId==='neo'&&['select','ready','rolled','decision','result'].includes(g.phase))return types.flatMap(from=>g.bank[from]>0?types.filter(to=>to!==from&&room(to)).map(to=>action({bonusType:from,choice:to},label[from]+' → '+label[to])):[]);
 if(g.skaterId==='ruby'&&g.phase==='rolled'){
  const d=g.dice.find(d=>d.color===wildColor(g)&&d.locked===null&&!(g.frozen||[]).includes(d.id));
  return d?[action({id:d.id},'Relancer mon dé personnel')]:[];
 }
 if(g.skaterId==='jade'&&g.attempt===1&&['select','ready','rolled','decision'].includes(g.phase)){
  const first=g.sequences.find(seq=>seq.attempt===0);
  return (first?.entries||[]).filter(e=>g.secured.includes(e.card)&&g.hand.some(c=>c.uid===e.card)).map(e=>action({cardId:e.card},'Reprendre '+g.hand.find(c=>c.uid===e.card).name));
 }
 if(g.skaterId==='milo'&&!g.sequenceReward?.pending&&g.phase==='result'&&g.score>0&&g.landed.length===2&&new Set(g.landed.map(e=>g.hand.find(c=>c.uid===e.card)?.type)).size===2)return types.filter(room).map(choice=>action({choice},'Gagner '+label[choice]));
 if(g.skaterId==='iris'&&g.phase==='result'&&g.reason==='fall')return types.filter(t=>g.used[t]>0&&room(t)).map(choice=>action({choice},'Récupérer '+label[choice]));
 return [];
}
export const hasResultSpecialty=g=>g.phase==='result'&&['milo','iris'].includes(g.skaterId)&&specialtyActions(g).length>0;
export function applySpecialty(g,c,rng){
 if(c.type!=='specialty'||!specialtyActions(g).some(a=>['type','id','delta','choice','bonusType','cardId'].every(k=>a[k]===c[k])))return false;
 if(g.skaterId==='neo'){g.bank[c.bonusType]--;g.bank[c.choice]++;}
 if(g.skaterId==='ruby'){g.specialty.rolledDie=c.id;g.specialty.personalRolls=(g.specialty.personalRolls||0)+1;g.dice[c.id].face=1+Math.floor(rng()*6);g.pending=[];g.dice[c.id].wildValue=null;}
 if(g.skaterId==='jade'){g.secured=g.secured.filter(uid=>uid!==c.cardId);g.specialty.returnedCard=c.cardId;}
 if(['milo','iris'].includes(g.skaterId)){g.bank[c.choice]++;if(g.last)g.last.specialtyReward=c.choice;if(g.attempts.at(-1))g.attempts.at(-1).specialtyReward=c.choice;}
 g.specialty.used=true;return true;
}
export function specialtyIcon(id){
 const shapes={neo:'<path d="M6 10h20l-5-5m5 17H6l5 5"/>',ruby:'<rect x="5" y="5" width="22" height="22" rx="5"/><path d="m16 9 2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1Z"/>',jade:'<rect x="8" y="3" width="18" height="25" rx="3"/><path d="m17 7 2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1Z"/><path d="M8 12a8 8 0 0 0 0 16M3 9l5 3-3 5"/>',sol:'<path d="M5 8h10M10 3v10M5 18h10M24 4l-7 13h12M25 12v16"/>',milo:'<circle cx="10" cy="16" r="7"/><circle cx="23" cy="16" r="7"/><path d="m9 15 3 3 8-9"/>',iris:'<path d="M8 10a11 11 0 1 1-1 14M4 4v10h10"/>'};
 return `<svg class="specialty-icon" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${shapes[id]||''}</svg>`;
}
