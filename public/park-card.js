import {getSkater} from './skaters.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const bestModuleAttempt=g=>Math.max(0,...(g.attempts||[]).map(a=>a.points));
export function parkScores(match){return match.players.map((p,seat)=>({id:p.id,name:p.game.name,seat:seat+1,mark:getSkater(p.skaterId)?.name[0]||String(seat+1),color:getSkater(p.skaterId)?.color||p.color,score:bestModuleAttempt(p.game)}));}
export function parkCard(match){
 const scores=parkScores(match);
 const track=(values,place)=>`<ol class="park-track park-${place}" aria-label="${place==='tens'?'Dizaines':'Unités'}">${values.map(value=>`<li data-value="${value}"><b>${place==='tens'?String(value).padStart(2,'0'):value}</b><span class="park-marker-slots">${scores.filter(p=>(place==='tens'?Math.floor(p.score/10)*10:p.score%10)===value).map(p=>`<i class="park-marker" data-player="${esc(p.id)}" data-place="${place}" style="--rider:${p.color};--seat:${p.seat}" title="${esc(p.name)} : ${p.score} points" aria-label="${esc(p.name)}, record ${p.score} points">${esc(p.mark)}</i>`).join('')}</span></li>`).join('')}</ol>`;
 return `<section class="park-card poker-landscape" role="button" tabindex="0" data-action="inspect-park" aria-label="Le Lagon, records du module"><img class="park-panorama" src="assets/parks/le-lagon-overview.webp" alt="Vue d’ensemble du skatepark Le Lagon" draggable="false"><h2>LE LAGON</h2>${track([30,20,10,0],'tens')}${track([8,9,6,7,4,5,2,3,0,1],'units')}<span class="sr-only">Deux marqueurs par joueur : dizaines à gauche, unités à droite. ${scores.map(p=>esc(p.name)+' : '+p.score).join(' ; ')}. Remise à zéro au début du prochain module.</span></section>`;
}
