import {appearanceLabel,SECOND_PLACE_PV} from './module-rules.js';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={kick:'Kick',slide:'Slide',air:'Air'};
export function moduleCardFace(m,{earned=false,lazy=true}={}){
 if(!m.layers)throw Error('Missing three-layer module assets: '+m.name);
 const first=m.needs.length===2?'Deux premiers tricks : '+m.needs.map(t=>names[t]).join(' et '):m.needs.length?'Premier trick : '+m.needs.map(t=>names[t]).join(' ou '):'Premier trick libre';
 const prizes='1re place : '+m.pv+' PV · 2e place : '+SECOND_PLACE_PV+' PV';
 const active=earned===true||!!(earned?.points||earned?.tokens),label=m.name+', '+appearanceLabel(m)+', '+prizes+'. '+first+'. '+m.condition+' Effet conservé si l’essai est encaissé.'+(active?' Effet actif.':'');
 const stamp=m.bonus.kind==='three-score'?'✓ 3e +2':m.bonus.kind==='three-tokens'?'✓ 2 JETONS':earned?.tokens?'✓ +'+earned.tokens+' JETON'+(earned.tokens>1?'S':''):earned?.points?'✓ +'+earned.points+' PTS':'✓ BONUS';
 const image=(file,deferred=false)=>'<img src="'+file+'" alt="" draggable="false" '+(lazy&&deferred?'loading="lazy"':'')+'>';
 return '<article class="lagoon-module-card '+(active?'module-earned':'')+'" data-module-id="'+m.id+'" role="img" aria-label="'+esc(label)+'"><div class="module-layer module-layer--illustration" data-module-layer="1">'+image(m.layers.illustration,true)+'</div><div class="module-layer module-layer--graphics" data-module-layer="2">'+image(m.layers.graphics)+'</div><div class="module-layer module-layer--information" data-module-layer="3">'+image(m.layers.information,true)+'<span class="module-readable-label">'+esc(m.name)+' · '+appearanceLabel(m)+' · '+prizes+' · EFFET : '+esc(m.condition)+'</span>'+(active?'<span class="module-earned-stamp" aria-hidden="true">'+stamp+'</span>':'')+'</div></article>';
}
