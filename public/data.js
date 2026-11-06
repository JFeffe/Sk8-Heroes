import {MODULE_DEFINITIONS} from './module-catalog.js';
import {TRICKS} from './trick-catalog.js';
import {MODULE_CARD_ASSETS} from './module-card-assets.js';
export {TRICKS} from './trick-catalog.js';
export const MODULES=MODULE_DEFINITIONS.map(m=>({...m,park:'Le Lagon',rounds:m.stage===0?[1,2]:m.stage===1?[3,4]:[5,6],image: 'assets/modules/lagoon/'+m.key+'.webp',layers:MODULE_CARD_ASSETS[m.key]}));
export const STAGES=['Découverte','Enchaînement','Finale'];
export const makeDeck=()=>TRICKS.flatMap(t=>Array.from({length:t.copies},(_,n)=>({...t,uid:`${t.id}-${n}`})));

export const sortHand=cards=>[...cards].sort((a,b)=>({kick:0,slide:1,air:2}[a.type]-{kick:0,slide:1,air:2}[b.type])||a.points-b.points||Number(a.comboBonus?.kind==='companion')-Number(b.comboBonus?.kind==='companion')||a.id-b.id||String(a.uid??'').localeCompare(String(b.uid??'')));
