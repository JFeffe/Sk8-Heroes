import {TIER_NAMES,socketLayout} from './trick-presentation.js';
import {bonusLabel} from './icons.js';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderTrickLayers(card,{positions=[],renderDie=()=>'',chance=null,chanceLabel='',bonus=0,landed=false,reference=false}={}){
 const layers=card.layers;if(!layers)throw Error('Missing three-layer card assets: '+card.name);
 const slots=socketLayout(card.cost).map((s,i)=>{const id=positions[i]??null;return `<span class="die-socket ${id!==null?'filled':''}" style="left:${s.x/9}%;top:${s.y/13}%;width:${s.width/9}%;height:${s.height/13}%" aria-label="${esc(card.symbols[i])}">${id!==null?renderDie(id):''}</span>`;}).join('');
 const label=`${card.name}, ${TIER_NAMES[card.tier]}, ${card.rule}, ${card.points} points${card.comboBonus?', '+bonusLabel(card,false):''}`;
 return `<div class="trick-layer trick-layer--illustration" data-card-layer="1"><img src="${layers.illustration}" alt="" draggable="false" ${reference?'loading="lazy"':''}></div><div class="trick-layer trick-layer--graphics" data-card-layer="2"><img src="${layers.graphics}" alt="" draggable="false"></div><div class="trick-layer trick-layer--information" data-card-layer="3"><img src="${layers.information}" alt="" draggable="false" ${reference?'loading="lazy"':''}><span class="card-readable-label">${esc(label)}</span><span class="card-sockets" aria-label="${esc(card.rule)}">${slots}</span>${chance!==null?`<span class="layered-chance ${landed?'is-landed':''}" title="${esc(chanceLabel)}">${esc(chance)}</span>`:''}${bonus?`<span class="layered-score-bonus" aria-label="Bonus de carte actif : +${bonus}">+${bonus}</span>`:''}</div>`;
}
