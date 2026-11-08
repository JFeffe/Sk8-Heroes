import {cardText} from './card-text.js';
import {SPECIALTIES,specialtyIcon} from './specialties.js';
import {getSkater} from './skaters.js';
import {tokenStack} from './match-ui.js';
import {trophyIcon} from './icons.js';
export {bestModuleAttempt} from './park-card.js';
import {bonusLimit} from './engine.js';
import {ODDS} from './odds.js';

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const TIERS=['base','advanced','epic'];
export const LEVEL_LABELS={base:'Base',advanced:'Avancé',epic:'Épique'};
export const SCORE_TRACK_MAX=39;
export const printedOdds=card=>[6,4,3,2].filter(n=>n>=card.cost).map(dice=>({dice,probability:ODDS.cards[card.id].noBonus[dice]}));
// Never print 100% for a roll which can fail, or 0% for a possible roll.
export function printedPercent(p){if(p>0.9995&&p<1-1e-10)return '>99,9 %';if(p>0&&p<.0005)return '<0,1 %';return (Math.min(1,Math.max(0,p))*100).toFixed(1).replace('.',',')+' %';}
export function deckInventory(m){
 if(m.deckCounts)return m.deckCounts;
 const offered=new Set(m.phase==='initial'?Object.values(m.initialPackets||{}).flat():[]);
 return TIERS.map(tier=>({tier,draw:(m.deck||[]).filter(c=>c.tier===tier&&!offered.has(c.uid)).length,discard:(m.discard||[]).filter(c=>c.tier===tier).length}));
}
export function renderDeckPiles(m){return `<section class="physical-piles" aria-label="Pioches et défausses"><h3>PIOCHES / DÉFAUSSES</h3><div>${deckInventory(m).map(({tier,draw,discard})=>`<section class="pile-pair ${tier}"><strong>${LEVEL_LABELS[tier]}</strong><div><span class="physical-pile ${draw?'':'is-empty'}" aria-label="Pioche ${LEVEL_LABELS[tier]} : ${draw} cartes"><b>${draw}</b><small>Pioche</small></span><span class="physical-pile discard ${discard?'':'is-empty'}" aria-label="Défausse ${LEVEL_LABELS[tier]} : ${discard} cartes"><b>${discard}</b><small>Défausse</small></span></div></section>`).join('')}</div><p>Les cartes non choisies retournent à la pioche. Les tricks conservés restent chez leur joueur.</p></section>`;}
export function skaterMat(player,controls=null){
 const g=player.game,skater=getSkater(player.skaterId);
 const stock=controls??`<div class="mat-token-slots">${['adjust','reroll','freeze'].map(t=>`<div>${tokenStack(t,g.bank[t]||0,{stock:true,limit:bonusLimit(g,t)})}<small>${{adjust:'±1',reroll:'Relance',freeze:'Gel'}[t]}</small></div>`).join('')}</div>`;
 const power=g.mode==='advanced'?SPECIALTIES[player.skaterId]:null;
 return `<section class="skater-mat poker-card ${power?'advanced-skater':''}" style="--rider:${skater?.color||player.color}" aria-label="Carte skater de ${esc(g.name)}"><img class="skater-portrait" src="${skater.image}" alt="${esc(skater.name)}" draggable="false"><h2>${esc(skater.name)}</h2>${power?`<div class="skater-specialty"><strong>${specialtyIcon(player.skaterId)}${esc(power.name)}</strong><p>${cardText(power.short||power.text)}</p><small>${power.passive?'Passif · toute la partie':'1 fois par module · 2 essais'}</small></div>`:''}<div class="skater-bonus-area">${stock}</div></section>`;
}
export function trophyStock(player){
 const count=player.game.pv||0;
 return `<section class="trophy-stock" aria-label="${esc(player.game.name)} : ${count} jetons trophée, ${count} points de victoire"><span class="trophy-stack ${count?'':'empty'}" aria-hidden="true">${Array.from({length:Math.max(1,Math.min(count,5))},(_,i)=>`<i class="trophy-token" style="--layer:${i}">${trophyIcon()}</i>`).join('')}</span><strong>${count}</strong><span>trophée${count===1?'':'s'}<small>1 jeton = 1 PV</small></span></section>`;
}

export function specialtyToken(player,enabled=false){
 if(player.game.mode!=='advanced')return '';
 const power=SPECIALTIES[player.skaterId],used=player.game.specialty?.used;
 if(power.passive)return `<span class="specialty-token passive-specialty" style="--rider:${getSkater(player.skaterId).color}" aria-label="${esc(power.name)} : toujours actif">${specialtyIcon(player.skaterId)}<span>Passif<small>Réserve ±1 : 4 max.</small></span></span>`;
 return `<button class="specialty-token ${used?'is-used':''}" style="--rider:${getSkater(player.skaterId).color}" data-action="inspect-specialty" aria-label="${esc(power.name)} : ${used?'utilisé':'disponible'}" ${enabled&&!used?'':'disabled'}>${specialtyIcon(player.skaterId)}<span>${used?'Utilisé':'Disponible'}<small>Spécialité · 1/module</small></span></button>`;
}
