import {TRICKS,MODULES} from './data.js';
import {typeIcon,bonusLabel} from './icons.js';
import {TIER_NAMES} from './trick-presentation.js';
import {moduleCard} from './module-cards.js';

// Register future trick decks and skateparks here; browsing never changes a game.
export const CARD_PACKS=[
 {id:'tricks-base',kind:'tricks',name:'Tricks du Lagon',description:'Base, Avancés et Épiques : Kick, Slide et Air.',cards:TRICKS,cover:TRICKS[0]},
 {id:'le-lagon',kind:'skateparks',name:'Le Lagon',description:'Un skatepark au bord de l’eau, des premières lignes aux grandes finales.',cards:MODULES,cover:MODULES[8]}
];
const families={tricks:{name:'Tricks',description:'Figures, combinaisons de dés, scores et bonus.'},skateparks:{name:'Skateparks',description:'Les modules et parcours de chaque park.'}};
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const findCardPack=(id,kind)=>CARD_PACKS.find(p=>p.id===id&&(!kind||p.kind===kind));
const action=(label,name,id='')=>`<button class="library-text-button" data-action="${name}"${id?` data-id="${id}"`:''}>${label}</button>`;
const fullTrick=(card,face,classes='')=>`<div class="trick-card ${classes}">${face(card)}</div>`;
function packCount(pack){return pack.kind==='tricks'?`${pack.cards.length} tricks · ${pack.cards.reduce((n,c)=>n+c.copies,0)} cartes`:`${pack.cards.length} cartes de modules`;}
function cover(pack,face){return `<span class="library-choice-cover" aria-hidden="true">${pack.kind==='tricks'?fullTrick(pack.cover,face):moduleCard(pack.cover,{lazy:false})}</span>`;}

export function cardLibrary({kind=null,packId=null}={},face){
 const family=families[kind],pack=findCardPack(packId,kind);
 const crumbs=`<nav class="library-breadcrumbs" aria-label="Navigation des cartes">${action('Toutes les cartes','library-root')}${family?`<span>/</span>${pack?action(family.name,'library-packs'): `<strong>${family.name}</strong>`}`:''}${pack?`<span>/</span><strong>${esc(pack.name)}</strong>`:''}</nav>`;
 let content;
 if(!family){
  content=`<div class="library-heading"><div class="eyebrow">LA COLLECTION</div><h1>LES CARTES</h1><p>Choisis une famille, puis le paquet à découvrir.</p></div><div class="library-choice-grid">${Object.entries(families).map(([id,f])=>{const packs=CARD_PACKS.filter(p=>p.kind===id);return `<button class="library-choice" data-action="library-kind" data-id="${id}"><span class="library-choice-copy"><small>${packs.length} paquet${packs.length>1?'s':''}</small><strong>${f.name}</strong><span>${f.description}</span><b>Choisir un paquet →</b></span>${cover(packs[0],face)}</button>`;}).join('')}</div>`;
 }else if(!pack){
  content=`<div class="library-heading"><div class="eyebrow">${family.name}</div><h1>CHOISIS UN PAQUET</h1><p>${kind==='skateparks'?'Chaque skatepark possède son propre paquet de modules.':'Choisis le paquet de tricks dont tu veux voir les cartes.'}</p></div><div class="library-choice-grid">${CARD_PACKS.filter(p=>p.kind===kind).map(p=>`<button class="library-choice" data-action="library-pack" data-id="${p.id}"><span class="library-choice-copy"><small>${packCount(p)}</small><strong>${esc(p.name)}</strong><span>${esc(p.description)}</span><b>Voir les cartes →</b></span>${cover(p,face)}</button>`).join('')}</div>`;
 }else{
  const header=`<div class="library-heading"><div class="eyebrow">${family.name} · ${packCount(pack)}</div><h1>${esc(pack.name)}</h1><p>Les cartes complètes, avec les règles actuelles. Clique une carte pour l’agrandir.</p><div class="library-pack-actions">${action('← Changer de paquet','library-packs')}${kind==='tricks'?action('Probabilités détaillées','catalog'):''}</div></div>`;
  if(kind==='tricks'){
   content=header+['kick','slide','air'].map(type=>`<section class="library-card-section" aria-label="Tricks ${type}"><h2>${typeIcon(type)} ${type==='kick'?'Kick':type==='slide'?'Slide':'Air'}</h2><div class="library-card-grid">${pack.cards.filter(c=>c.type===type).sort((a,b)=>a.points-b.points||a.id-b.id).map(c=>`<div class="library-card-item"><button class="library-card-button" data-action="inspect-trick" data-id="${c.id}" aria-label="Agrandir ${esc(c.name)}, ${esc(c.rule)}, ${c.points} points">${fullTrick(c,face)}</button><small>${c.copies} exemplaire${c.copies>1?'s':''} dans la pioche</small></div>`).join('')}</div></section>`).join('');
  }else{
   content=header+`<p class="library-pack-note">6 modules tirés par partie : 2 de découverte, 3 intermédiaires et 1 finale. Les effets du module s’appliquent à chaque essai conservé.</p><div class="library-card-grid library-module-grid">${[...pack.cards].sort((a,b)=>a.stage-b.stage||a.id-b.id).map(c=>`<button class="library-card-button" data-action="inspect-module" data-id="${c.id}" aria-label="Agrandir ${esc(c.name)}">${moduleCard(c)}</button>`).join('')}</div>`;
  }
 }
 return `<main class="card-library">${crumbs}${content}</main>`;
}

export function trickInspection(card,face){
 return `<div class="trick-inspection">${fullTrick(card,face)}</div><div class="trick-inspection-note"><h2>${esc(card.name)}</h2><p>${esc(card.rule)} · <strong>${card.points} points</strong> · ${card.cost} dés utilisés</p><p>${bonusLabel(card,false)||'Aucun effet supplémentaire.'}</p><small>${card.copies} exemplaire${card.copies>1?'s':''} dans le paquet Tricks du Lagon · ${TIER_NAMES[card.tier]}.</small></div>`;
}
