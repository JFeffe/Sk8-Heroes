import {getSkater} from './skaters.js';
import {MODULES,STAGES} from './data.js';
import {banked,BONUS_LIMIT} from './engine.js';
import {standings} from './match.js';
import {matchSummary,formatDuration} from './match-statistics.js';
import {npcDifficulty} from './npc-difficulty.js';
import {passingDraft,waitingForPick} from './initial-draft.js';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>new Intl.NumberFormat('fr-CA',{maximumFractionDigits:2}).format(n);
export function skaterAvatar(p,order=null){const c=getSkater(p.skaterId);return `<span class="rider-avatar" title="${c?c.name+' · '+c.colorName:esc(p.name||p.game?.name||'')}" >${order!==null?'<small>'+order+'</small>':''}${c?'<img src="'+c.image+'" alt="'+c.name+'" draggable="false">':esc((p.name||p.game?.name||'?')[0])}</span>`;}
export function scoreRack(m,{viewedPlayerId=m.viewerId||'p0'}={}){return `<div class="player-scores" aria-label="Ordre de jeu et scores">${m.order.map((seat,i)=>{
 const p=m.players[seat],g=p.game,active=m.active===seat&&m.phase==='playing';
 const live=active?(g.phase==='result'?g.score:banked(g)):0;
 const best=Math.max(0,live,...g.attempts.map(a=>a.points));
 const attempts=[0,1].map(j=>g.attempts[j]?.points??(active&&m.round===j?live+'*':'—'));
 return `<button type="button" class="player-score ${active?'active':''} ${p.id===viewedPlayerId?'viewed':''}" style="--rider:${p.color}" data-action="view-player" data-id="${p.id}" aria-pressed="${p.id===viewedPlayerId}" aria-label="Voir la main et la table de ${esc(g.name)}">${skaterAvatar(p,i+1)}<span class="rider-name">${esc(g.name)}<small>${p.kind==='npc'?'NPC '+npcDifficulty(m.npcDifficulty).label:p.id===(m.viewerId||'p0')?'TOI':'JOUEUR'} · ${getSkater(p.skaterId)?.name||''}</small></span><strong>${num(g.pv)}<small> PV</small></strong><div class="round-score">Manche <b>${best}</b><span>E1 ${attempts[0]} · E2 ${attempts[1]}</span></div></button>`;
 }).join('')}</div>`;}
export function routeTrack(m){return `<ol class="route-track" aria-label="Étapes de la partie">${m.route.map((id,i)=>`<li class="${i<m.module?'done':i===m.module?'current':''}" ${i===m.module?'aria-current="step"':''} title="${i+1}. ${MODULES[id].name} · ${STAGES[MODULES[id].stage]}"><span>${i<m.module?'✓':i+1}</span>${i===0||MODULES[m.route[i-1]].stage!==MODULES[id].stage?`<small>${STAGES[MODULES[id].stage]}</small>`:''}</li>`).join('')}</ol>`;}
export function matchStrip(m,options){return `<div class="match-strip">${scoreRack(m,options)}<div class="round-route"><b>Essai ${m.round+1}/2</b><small>Manche ${m.module+1}/${m.route.length}</small></div></div>`;}
export const tokenStock=count=>`${count||0}/${BONUS_LIMIT}`;
export function tokenStack(type,count,{showCount=true,stock=false}={}){return `<span class="token-stack ${type}" style="--layers:${Math.min(count,BONUS_LIMIT)}" aria-hidden="true">${Array.from({length:Math.max(1,Math.min(count,BONUS_LIMIT))},(_,i)=>`<i class="bonus-token ${count?'':'empty'}" style="--layer:${i}">${type==='adjust'?'±1':type==='freeze'?'❄':'↻'}</i>`).join('')}${showCount?`<b>${stock?tokenStock(count):'×'+count}</b>`:''}</span>`;}
export function tokenInventory(g,label='Tes jetons'){
 return `<section class="choice-token-stock" aria-label="${esc(label)}"><strong>${esc(label)}</strong><div>${['adjust','reroll','freeze'].map(type=>`<span aria-label="${bonusName(type)} : ${tokenStock(g.bank[type])}">${tokenStack(type,g.bank[type]||0,{stock:true})}<small>${bonusName(type)}</small></span>`).join('')}</div></section>`;
}
export function recap(m){
 const r=m.recaps.at(-1),module=MODULES[r.module],max=Math.max(1,...r.rows.flatMap(x=>x.attempts.map(a=>a.points)));
 const scores=[...new Set(r.rows.map(row=>row.best))],runnersUp=r.runnersUp??[];
 const tied=r.winners.length>1||runnersUp.length>1;
 const noPrize=r.winners.length?'':' Personne ne gagne de PV sur ce module.';
 const tieLabel=tied?(m.tieMode==='split'?' PV partagés entre ex æquo.':' Chaque ex æquo reçoit les PV de sa place.'):'';
 return `<main class="module-recap">
  <div class="recap-top"><div><div class="eyebrow">MODULE ${r.index+1}/${m.route.length} · TERMINÉ</div><h1>${module.name}</h1></div>
   <div class="recap-prizes"><span class="prize-token" aria-label="1re place : ${r.pv} PV" title="1re place">${r.pv}<small> PV</small></span>${r.secondPv?`<span class="prize-token runner-up" aria-label="2e place : ${r.secondPv} PV" title="2e place">${r.secondPv}<small> PV</small></span>`:''}</div>
  </div>
  <p class="recap-rule">Classement au meilleur essai conservé.${noPrize}${tieLabel}</p>
  <div class="recap-chart" aria-label="Résultats des deux essais">${r.rows.map(row=>{
   const podium=r.winners.includes(row.id)?'winner':runnersUp.includes(row.id)?'runner-up':'';
   return `<section class="recap-rider ${podium}" style="--rider:${row.color}">
    <div class="recap-identity"><b class="rank">${scores.indexOf(row.best)+1}</b>${skaterAvatar(row)}<strong>${esc(row.name)}</strong><span class="best-score">${row.best}<small> meilleur essai</small></span></div>
    <div class="attempt-bars">${row.attempts.map((a,j)=>`<button type="button" class="attempt-bar" data-action="inspect-attempt" data-player="${row.id}" data-attempt="${j}" data-module="${r.index}" aria-label="Agrandir les cartes de ${esc(row.name)}, essai ${j+1}, ${a.points} points" title="${esc(a.cards.join(' + ')||'Aucun trick')}"><small>Essai ${j+1}</small><span class="bar-track"><span class="bar-fill" style="--bar:${a.points/max*100}%"></span></span><b>${a.points}</b><small>${a.reason==='fall'?'Chute':a.reason==='pass'?'Passé':attemptRewardLabel(a)}</small></button>`).join('')}</div>
    <div class="recap-total"><span>PARTIE</span><strong data-score-from="${row.before}" data-score-to="${row.after}">${num(row.after)}</strong><small>PV</small>${row.gain?`<b class="score-gain">+${num(row.gain)}</b>`:''}</div>
   </section>`;
  }).join('')}</div>
  <div class="recap-footer"><p>Les PV gagnés s’ajoutent au score de partie.</p><button class="primary" data-action="next-module">${m.module===m.route.length-1?'Classement final →':'Draft commun →'}</button></div>
 </main>`;
}
export function statisticsPanel(m){
 const summary=matchSummary(m),partial=!summary.durationComplete||summary.players.some(p=>!p.tokens.complete),timingNote=m.viewerId?'Du draft au dernier essai, hors pauses NPC et arrêt du serveur.':'Du draft au dernier essai, hors pauses, menu et interruptions entre les reprises.';
 const detail=stock=>`±1 : ${stock.adjust} · ↻ : ${stock.reroll} · ❄ : ${stock.freeze}`;
 return `<section class="match-statistics" aria-label="Statistiques de la partie"><div class="statistics-heading"><h2>LA PARTIE EN CHIFFRES</h2><div class="match-duration"><span>Durée de jeu</span><strong>${summary.durationMs!==null&&!summary.durationComplete?'≥ ':''}${formatDuration(summary.durationMs)}</strong></div></div><p class="statistics-note">${timingNote}</p><div class="statistics-table-wrap"><table class="statistics-table"><caption class="sr-only">Chutes, séquences de trois tricks et jetons de chaque joueur</caption><thead><tr><th scope="col">Joueur</th><th scope="col">Chutes</th><th scope="col">3 tricks</th><th scope="col">Jetons gagnés</th><th scope="col">Jetons dépensés</th></tr></thead><tbody>${standings(m).map(p=>{
  const row=summary.players.find(s=>s.id===p.id),tokens=row.tokens,prefix=tokens.complete?'':'≥ ';
  return `<tr data-statistics-player="${p.id}"><th scope="row">${esc(p.game.name)}</th><td>${row.falls}</td><td>${row.threeTrickSequences}</td><td><strong>${prefix}${tokens.totalGained}</strong><small>${detail(tokens.gained)}</small></td><td><strong>${prefix}${tokens.totalSpent}</strong><small>${detail(tokens.spent)}</small></td></tr>`;
 }).join('')}</tbody></table></div><p class="statistics-note">Les jetons de départ ne sont pas des gains. Les jetons dépensés restent comptés en cas de chute.</p>${partial?'<p class="statistics-partial">Ancienne sauvegarde : la durée et les jetons sont suivis depuis la mise à jour. ≥ indique un total partiel.</p>':''}</section>`;
}
export function finalStandings(m){
 const list=standings(m),top=list[0].game.pv;
 return `<main class="module-recap final-standings"><div class="eyebrow">SESSION TERMINÉE</div><h1>CLASSEMENT FINAL</h1><p>${list.filter(p=>p.game.pv===top).map(p=>esc(p.game.name)).join(' · ')} ${list.filter(p=>p.game.pv===top).length>1?'remportent':'remporte'} la partie.</p><div class="final-list">${list.map((p,i)=>`<div class="${p.game.pv===top?'champion':''}" style="--rider:${p.color}"><b>${list.findIndex(x=>x.game.pv===p.game.pv)+1}</b>${skaterAvatar(p)}<strong>${esc(p.game.name)}</strong><span>${num(p.game.pv)} PV</span></div>`).join('')}</div>${statisticsPanel(m)}<div class="module-history">${m.recaps.map(r=>`<div><span>${MODULES[r.module].name}</span><b>${r.rows.filter(x=>x.gain).map(x=>`${esc(x.name)} +${num(x.gain)}`).join(' · ')||'Aucun PV'}</b></div>`).join('')}</div><div class="recap-footer"><button class="primary" data-action="create">Nouvelle partie</button><button class="secondary" data-action="export">Exporter le bilan</button></div></main>`;
}

export const bonusName=type=>({adjust:'±1',reroll:'↻ Relance',freeze:'❄ Gel'})[type]||'';
export function draftStatus(m){
 const entries=m.draftLog.filter(e=>e.module===m.module&&e.kind===m.draftKind);
 return `<section class="draft-status" aria-label="Choix des joueurs">${(m.draftKind==='recovery'?m.draftOrder:m.order).map((seat,i)=>{const p=m.players[seat],g=p.game,log=entries.filter(e=>e.playerId===p.id),simultaneous=m.phase==='initial'&&passingDraft(m),pending=simultaneous&&waitingForPick(m,p.id);return `<article data-player="${p.id}" class="draft-player ${simultaneous?pending?'active':'draft-ready':m.active===seat&&m.phase!=='draft-summary'?'active':''}" style="--rider:${p.color}"><header>${skaterAvatar(p,i+1)}<strong>${esc(g.name)}</strong><span class="draft-game-pv" aria-label="Score de partie : ${g.pv} PV"><b>${num(g.pv)}</b> PV</span></header>${simultaneous?`<p class="draft-ready-state">${pending?'Choisit…':'✓ Choix confirmé'}</p>`:''}${m.draftKind==='recovery'?`<small class="draft-order-score">Dernier module : ${m.recaps.at(-1).rows.find(r=>r.id===p.id).best} pts</small>`:''}<div class="profile-token-counts" aria-label="Jetons de ${esc(g.name)}">±1 ${tokenStock(g.bank.adjust)} · ↻ ${tokenStock(g.bank.reroll)} · ❄ ${tokenStock(g.bank.freeze)}</div><ol>${log.map(e=>`<li>${e.action==='draft-pair'?esc(e.name)+(e.bonusDiscarded?' · jeton remis à la banque':' + jeton '+bonusName(e.bonus)):e.action==='claim'?'Récompense : '+bonusName(e.bonus):e.action==='draft'?esc(e.name):e.action==='draft-bonus'?'Jeton '+bonusName(e.bonus):'Passé'}</li>`).join('')||'<li class="waiting">En attente</li>'}</ol></article>`;}).join('')}</section>`;
}
export function draftReview(m,hand=""){
 const first=m.players[m.order[m.draftKind==='recovery'?1:0]];
 return `<main class="campaign-draft draft-review"><div class="eyebrow">CHOIX DE TOUS LES JOUEURS</div><h1>Draft terminé.</h1><p>${esc(first.game.name)} commence le premier essai. Chacun jouera une fois, puis tous joueront le deuxième essai.</p>${draftStatus(m)}${m.leftover?`<p class="draft-leftover">Défaussé : ${m.leftover.kind==='card'?esc(m.leftover.name):bonusName(m.leftover.bonus)}.</p>`:''}${hand}<button class="primary" data-action="start-module">Jouer le module ${m.draftKind==='initial'?1:m.module+2} →</button></main>`;
}

export function attemptRewardLabel(attempt){
 const tokens=attempt.tokenRewards?.length?attempt.tokenRewards:attempt.tokenReward?[attempt.tokenReward]:[];
 return [attempt.moduleBonus?'+'+attempt.moduleBonus+' module':'',attempt.sequenceBonus?'+'+attempt.sequenceBonus+' pt'+(attempt.sequenceBonus>1?'s':''):'',tokens.length?'jeton'+(tokens.length>1?'s':'')+' '+tokens.map(bonusName).join(' + '):''].filter(Boolean).join(' · ')||'Voir les cartes';
}
