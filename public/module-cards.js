import {moduleCardFace} from './module-layers.js';
import {MODULES} from './data.js';
import {moduleGoalPresentation} from './module-goals.js';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function moduleConditionHtml(m){
 const goal=moduleGoalPresentation(m);
 return `${esc(goal.title)}<small>${esc(goal.caption)}</small>`;
}
export const moduleCard=moduleCardFace;
export function moduleRoute(m){
 const currentFinished=['recap','recovery','complete'].includes(m.phase)||(m.phase==='draft-summary'&&m.draftKind==='recovery');
 return `<section class="session-route" aria-label="Les ${m.route.length} modules tirés au début de la partie"><div class="session-route-label"><strong>LE LAGON</strong><span>${m.route.length} modules tirés</span><small>Manche ${Math.min(m.module+1,m.route.length)} / ${m.route.length}</small></div><ol class="module-route-list">${m.route.map((id,i)=>{const module=MODULES[id],done=i<m.module||m.phase==='complete'||(i===m.module&&currentFinished),current=i===m.module&&!done;return `<li class="${done?'done':''} ${current?'current':''}" ${current?'aria-current="step"':''}><span class="module-route-number">${done?'✓':i+1}${current?' · EN COURS':''}</span><button type="button" class="module-route-button" data-action="inspect-module" data-id="${id}" aria-label="Manche ${i+1}, ${esc(module.name)}, ${done?'terminée':current?'en cours':'à venir'}. Agrandir la carte.">${moduleCard(module,{lazy:false})}</button><div class="module-route-peek" aria-hidden="true">${moduleCard(module)}</div></li>`;}).join('')}</ol></section>`;
}
export const moduleCatalog=()=>`<div class="module-catalog-heading"><h2>LES 12 MODULES DU LAGON</h2><p>2 modules parmi les 4 de manches 1–2 · 3 parmi les 6 de manches 3–5 · 1 finale parmi les 2 de manche 6.</p><p>Les effets du module s’appliquent à chaque essai conservé. Le troisième emplacement indique la récompense de trois tricks selon le module.</p></div><div class="lagoon-module-gallery">${[...MODULES].sort((a,b)=>a.stage-b.stage||a.id-b.id).map(m=>moduleCard(m)).join('')}</div>`;
