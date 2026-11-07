import {SPECIALTIES,specialtyActions,hasResultSpecialty} from './specialties.js';
import {parkCard} from './park-card.js';
import {skaterMat,renderDeckPiles,trophyStock,specialtyToken} from './physical-table.js';
import {thirdTrickOffer} from './module-goals.js';
import {renderTrickLayers} from './trick-layers.js';
import {TIER_NAMES} from './trick-presentation.js';
import {TRICKS,MODULES,STAGES,sortHand} from './data.js';
import * as E from './engine.js';
import * as M from './match.js';
import {matchStrip,tokenStack,tokenStock,tokenInventory,recap,finalStandings,draftStatus,draftReview,bonusName} from './match-ui.js';
import {arrangeDice,resolveDice} from './combinations.js';
import {SKATERS,getSkater,dieColor} from './skaters.js';
import {ODDS} from './odds.js';
import {typeIcon,bonusLabel} from './icons.js';
import {bindDrag} from './drag.js';
import {moduleCard,moduleRoute,moduleCatalog} from './module-cards.js';
import {cardLibrary,findCardPack,trickInspection} from './card-library.js';
import {OnlineClient,onlineApi,lastConnection,savedConnection,forgetConnection} from './online-client.js';
import {onlineLobby,onlineJoin,onlineBar} from './online-ui.js';
import {viewedPlayer,viewingOwnTable,canControlTable,syncTableView} from './table-view.js';
import {playedCardSnapshot,attemptSnapshot} from './played-card.js';
import {validDiceIds,detectRolls} from './dice-feedback.js';
import {APP_VERSION,RELEASE_NOTES} from './release-notes.js';
import {PatchNotesState} from './patch-notes-state.js';
import {UIFeedback} from './ui-feedback.js';
import {NPC_DIFFICULTIES} from './npc-difficulty.js';
const root=document.querySelector('#app'),KEY=`sk8-match-v${M.MATCH_VERSION}`;
let match=null,s=null,screen='home',picked=[],modal='',bonusMode=null,npcTimer=null,npcPaused=false,npcFast=false,animationGeneration=0;
let draftSelection={cardId:null,tokenId:null};
let viewedPlayerId=null,tableViewCursor={},inspectedPlayed=null,inspectedAttempt=null;
let rollStamps={},rollEffects={},validDice=new Set(),rollingDice=new Set(),rollElapsed=0;
let inspectedModule=0;
let inspectedTrick=0,libraryKind=null,libraryPackId=null,libraryReturnScreen='home';
let online=null,onlineView=null,onlineInfo=null,onlineConnected=false,onlineBusy=false,onlineSharing=false,onlineSetup=false,onlineJoinLobby=null,onlineError='';
const animatedRecaps=new Set(),feedback=new UIFeedback();
const patchNotes=new PatchNotesState({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)});
let patchObserver=null;
let renderedPage=null;
function closeModal(){if(modal==='patch-notes'){patchObserver?.takeRecords().filter(entry=>entry.isIntersecting).forEach(entry=>patchNotes.viewed(entry.target.dataset.releaseVersion));patchNotes.close();patchObserver?.disconnect();}modal='';}
function observePatchNotes(){patchObserver?.disconnect();if(modal!=='patch-notes'){patchNotes.close();return;}patchNotes.open();patchObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)patchNotes.viewed(entry.target.dataset.releaseVersion);},{root:root.querySelector('.patch-notes-modal'),threshold:.5});root.querySelectorAll('[data-release-version]').forEach(el=>patchObserver.observe(el));}
try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved){match=M.restore(saved);s=M.currentPlayer(match).game;}}catch{match=null;s=null;}
const isNpc=()=>!!match&&M.hasNpcTurn(match);
const localPlayer=()=>online?match?.players.find(p=>p.id===online.viewerId):match?M.human(match):null;
const myId=()=>online?.viewerId||'p0';
const ownTable=()=>!!match&&viewingOwnTable(match,viewedPlayerId,myId());
const canAct=()=>!!match&&(match.phase==='initial'?M.canInitialPick(match,myId()):M.currentPlayer(match)?.id===myId()&&(!isBoard()||canControlTable(match,viewedPlayerId,myId())))&&(!online||onlineConnected&&!onlineBusy&&onlineView?.started);
function command(type,params={}){if(type==='draft'&&M.passingDraft(match))params={draftRound:match.draftRound,...params};return online?canAct()&&networkCommand({type,...params}):canAct()&&M.dispatch(match,{playerId:M.human(match).id,type,...params});}
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(text,action,disabled=false,cls='')=>`<button class="${cls}" data-action="${action}" ${disabled?'disabled':''}>${text}</button>`;
const faces=['?','★','⚁','⚂','⚃','⚄','⚅'];
const percent=p=>new Intl.NumberFormat('fr-CA',{style:'percent',maximumFractionDigits:1}).format(p);
const brand=()=>`<a class="brand" href="#" data-action="home"><span>SK8<span class="orange">/</span></span><strong>HEROES</strong></a>`;
const isBoard=()=>screen==='play'&&match?.phase==='playing'&&s;
function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove('show'),2400);}
function save(){if(online)return;try{if(match)localStorage.setItem(KEY,JSON.stringify(match));}catch{toast('Sauvegarde locale indisponible.');}}
function header(){return `<header class="game-hud">${brand()}<span class="session-mark">${s&&screen==='play'?`${match.mode==='advanced'?'Avancé':'Base'} · ${match.players.length} riders · ${getSkater(s.skaterId)?.name||''} · ★ ${getSkater(s.skaterId)?.colorName||''}`:'LAGOON PARK'}</span><nav>${btn('Règles','help')}${btn('Cartes','library')}${screen==='cards'?btn(libraryReturnScreen==='play'?'Retour à la table':'Menu','library-close'):screen!=='home'?btn('Quitter la table','home'):''}</nav></header>`;}
function dice(ids,locked=false,records=s.dice,historical=false,assignments={},ownColor=E.wildColor(s)){return ids.map(id=>{
 const d=records.find(d=>d.id===id),frozen=!historical&&(s.frozen||[]).includes(id),visible=d.face!==null&&(historical||locked||frozen||s.reuseRoll||['rolled','decision','result'].includes(s.phase));
 const color=dieColor(d.color),own=d.color===ownColor,wild=visible&&E.isOwnStar(d,ownColor),represented=assignments[id]??d.wildValue;
 const cls=`${color?'colored':''} ${own?'own-die':''} ${visible&&d.face===1?'star':''} ${wild?'wild-die':''} ${!historical&&!locked&&validDice.has(id)?'valid-die':''} ${!historical&&!locked&&rollingDice.has(id)?'rolling-die':''}`;
 const style=`--die-color:${color?.color||'#fff8e4'};--die-ink:${color?.ink||'#214c49'};--roll-delay:-${rollElapsed}ms`;
 const content=`<span aria-hidden="true">${faces[visible?d.face:0]}</span>${wild?`<small class="wild-value">${represented?'='+represented:'J'}</small>`:''}`;
 const enabled=!locked&&canAct()&&(s.phase==='rolled'||s.phase==='decision'&&bonusMode?.type==='freeze');
 const freezeLabel='gelé jusqu’à son utilisation ou la fin de la séquence';
 const label=`Dé ${color?.name||id+1} : ${visible?(d.face===1?(wild?'étoile joker'+(represented?' représentant '+represented:''):'étoile valant 1'):d.face):'à lancer'}${locked?', bloqué':''}${frozen?', '+freezeLabel:''}`;
 if(historical)return `<span class="table-die secured ${cls}" style="${style}" role="img" aria-label="${label}">${content}</span>`;
 return `<button class="table-die ${cls} ${picked.includes(id)?'picked':''} ${locked?'secured':''} ${frozen?'frozen':''} ${bonusMode&&!locked?'bonus-target':''}" data-action="die" data-id="${id}" ${!locked&&s.phase==='rolled'&&canAct()?'data-drag="die"':''} ${enabled?'':'disabled'} aria-pressed="${picked.includes(id)}" aria-label="${label}" style="${style};--die-angle:${[-7,6,-4,9,-8,4][id]}deg">${content}</button>`;
}).join('');}
function illustration(sheet,cell,sceneOnly=false){return `<svg class="art-image ${sceneOnly?'module-scene':''}" viewBox="${sceneOnly?`${cell%2?538:35} ${cell<2?170:900} 450 335`:`${cell%2?518:18} ${cell<2?16:750} 488 724`}" preserveAspectRatio="none" aria-hidden="true"><image href="assets/${sheet}.webp" width="1024" height="1536"/></svg>`;}
function cardFace(c,{ids=[],locked=false,onTable=false,snapshot=null,snapshotBonus=0,reference=false,skaterId=s?.skaterId,status=null}={}){
 const records=snapshot||s?.dice||[],resolved=resolveDice(c,ids.map(id=>records.find(d=>d.id===id)),E.wildColor({skaterId})),arrangement=resolved?.ids;
 const assignments=Object.fromEntries((resolved?.ids||[]).map((id,i)=>[id,resolved.values[i]]));
 const positions=arrangement||arrangeDice(c,ids.map(id=>records.find(d=>d.id===id)),E.wildColor({skaterId}))||Array.from({length:c.cost},(_,i)=>ids[i]??null);
 const liveBonus=snapshot?snapshotBonus:isBoard()&&!reference?E.sequenceScore(s.landed.map(e=>s.hand.find(c=>c.uid===e.card))).details.find(d=>d.card===c.uid)?.points:0;
 return renderTrickLayers(c,{positions,renderDie:id=>dice([id],locked,records,!!snapshot||locked,assignments,E.wildColor({skaterId})),bonus:liveBonus||0,reference:reference||!isBoard()});
}

function archives(){const sequences=s.sequences.filter(seq=>seq.attempt!==s.attempt||!s.landed.length);return sequences.length?`<section class="archive-tray" aria-label="Séquences conservées sur le module">${sequences.map(seq=>`<div class="archived-sequence"><small><button class="archive-attempt-link" data-action="inspect-attempt" data-player="${viewedPlayer(match,viewedPlayerId,myId()).id}" data-attempt="${seq.attempt}">Essai ${seq.attempt+1} · <b>${seq.points} pts</b> · Agrandir</button></small><div class="archive-cards">${seq.entries.map(entry=>{const c=s.hand.find(c=>c.uid===entry.card);if(s.specialty?.returnedCard===c.uid&&seq.attempt===0)return `<button class="signature-returned" data-action="inspect-played" data-card="${c.uid}" data-player="${viewedPlayer(match,viewedPlayerId,myId()).id}" data-attempt="0"><strong>${esc(c.name)}</strong><span>↩ Trick signature</span><small>Carte reprise · score conservé</small></button>`;return `<div class="trick-card archived-card inspectable-card" role="button" tabindex="0" data-action="inspect-played" data-card="${c.uid}" data-player="${viewedPlayer(match,viewedPlayerId,myId()).id}" data-attempt="${seq.attempt}" aria-label="Agrandir ${esc(c.name)}, essai ${seq.attempt+1} conservé">${cardFace(c,{ids:entry.dice.map(d=>d.id),locked:true,onTable:true,snapshot:entry.dice,snapshotBonus:entry.bonus||0})}</div>`;}).join('')}</div></div>`).join('')}</section>`:'';}
function bonusHint(){
 const ready=s.phase==='rolled'&&canAct(),freeze=canAct()&&E.canFreeze(s);
 const spent=E.BONUS_TYPES.filter(type=>s.used[type]>0).map(type=>`${type==='adjust'?'±1':type==='reroll'?'↻':'❄'} ×${s.used[type]}`).join(' · ');
 return `<small class="bonus-hint">${bonusMode?`${bonusMode.type==='freeze'?(s.phase==='decision'?'Choisis un dé libre : tu continues':'Choisis le dé à conserver au prochain lancer'):'Choisis un dé'} · ${btn('Annuler','cancel-bonus')}`:s.frozen?.length?'❄ Gel conservé entre les tricks':freeze?(s.phase==='decision'?'❄ Geler un dé = continuer':'❄ Geler avant une relance'):ready?'1 jeton = 1 utilisation':'★ '+(getSkater(s.skaterId)?.colorName||'personnelle')+' = joker · autres ★ = 1'}</small>${spent?`<small class="spent-bonuses" aria-label="Jetons dépensés pendant cet essai">Utilisés : ${spent}</small>`:''}`;
}
function bonusControls(){
 const ready=s.phase==='rolled'&&canAct(),adjust=ready&&s.bank.adjust>0,reroll=ready&&s.bank.reroll>0&&E.rerollableDice(s).length>0,freeze=canAct()&&E.canFreeze(s);
 return `<div class="bonus-tools"><div class="token-reserve" aria-label="Réserve de jetons"><div class="adjust-tokens" aria-label="${tokenStock(s.bank.adjust,E.bonusLimit(s,'adjust'))} jetons ±1">${tokenStack('adjust',s.bank.adjust,{stock:true,limit:E.bonusLimit(s,'adjust')})}<div>${btn('−1','minus',!adjust,'chip')}${btn('+1','plus',!adjust,'chip')}</div></div><button class="reroll-tokens" data-action="reroll" ${reroll?'':'disabled'} aria-label="Relancer les dés libres non gelés, ${tokenStock(s.bank.reroll,E.bonusLimit(s,'reroll'))} jetons">${tokenStack('reroll',s.bank.reroll,{stock:true,limit:E.bonusLimit(s,'reroll')})}</button><button class="freeze-tokens" data-action="freeze" ${freeze?'':'disabled'} aria-label="Geler un dé${s.phase==='decision'?' et continuer':''}, ${tokenStock(s.bank.freeze,E.bonusLimit(s,'freeze'))} jetons">${tokenStack('freeze',s.bank.freeze,{stock:true,limit:E.bonusLimit(s,'freeze')})}</button></div></div>`;
}

function handCard(c,i,n){
 const allowed=canAct()&&['select','ready'].includes(s.phase)&&E.eligible(s,c.uid),offset=i-(n-1)/2;
 return `<button class="trick-card hand-card ${allowed?'playable':'unavailable'} ${!E.typeAllowed(s,c)?'type-blocked':''}" data-action="choose" data-id="${c.uid}" ${allowed?'data-drag="card"':''} aria-disabled="${!allowed}" style="--offset:${offset};--angle:${offset*2};--lift:${Math.abs(offset)**2*.6};--order:${i+1}" aria-label="${c.name}, ${c.rule}, ${c.points} points${allowed?'':', indisponible'}">${cardFace(c)}</button>`;
}
function slots(){return Array.from({length:3},(_,i)=>{
 const landed=s.landed[i],current=i===s.landed.length,c=landed?s.hand.find(c=>c.uid===landed.card):current?E.activeCard(s):null;
 const reward=thirdTrickOffer(E.currentModule(s));
 const third=i===2?`<small class="third-trick-bonus ${landed?'earned':''}">${'+'+reward.points+' pt'+(reward.points>1?'s':'')+' · '+reward.tokens+' jeton'+(reward.tokens>1?'s':'')+(landed?(s.sequenceReward?.pending?' à choisir':' gagné'+(reward.tokens>1?'s':'')):' si réussi')}</small>`:'';
 if(!c)return `<section class="trick-space empty ${current&&s.phase==='select'?'next':''}" ${current&&s.phase==='select'?'data-drop="combo"':''} aria-label="Emplacement de trick ${i+1}"><span class="space-number">0${i+1}</span><span>${current&&s.phase==='select'?'Pose un trick':''}</span>${third}</section>`;
 return `<section class="trick-space ${landed?'landed':s.reason==='fall'?'fallen':'engaged'}" ${!landed&&s.phase==='rolled'?'data-drop="trick"':''} aria-label="Trick ${i+1} : ${c.name}"><div class="trick-card table-card inspectable-card" role="button" tabindex="0" data-action="inspect-played" data-card="${c.uid}" data-player="${viewedPlayer(match,viewedPlayerId,myId()).id}" aria-label="Agrandir ${esc(c.name)}">${cardFace(c,{ids:landed?landed.dice:s.pending,locked:!!landed,onTable:true})}</div><small class="space-state">${landed?'RÉUSSI':s.reason==='fall'?'CHUTE':s.phase==='ready'?'ENGAGÉ':'EN JEU'}</small>${third}</section>`;
}).join('');}
function liveSequence(){
 const {confirmed,preview,hasPreview}=E.sequenceView(s),lost=s.phase==='result'&&['fall','pass'].includes(s.reason);
 return `<div class="live-sequence" aria-live="polite" aria-label="Score de la séquence"><strong>Séquence : <span data-live-points="${lost?0:confirmed.points}">${lost?0:confirmed.points}</span> pts</strong><span>${lost?'Essai terminé':confirmed.base+' de cartes + '+confirmed.bonus+' de bonus'+(confirmed.moduleBonus?' · +'+confirmed.moduleBonus+' du module inclus':'')+(confirmed.moduleEffect.tokens?' · '+confirmed.rewardTokens+' jeton'+(confirmed.rewardTokens>1?'s':'')+(s.phase==='result'?'':' si encaissé'):'')}</span>${hasPreview?`<b class="projected-score">→ ${preview.points} pts si ce trick réussit${preview.sequenceBonus?' · +'+preview.sequenceBonus+' troisième trick inclus':''}</b>`:''}</div>`;
}
function instructions(){
 if(!ownTable())return viewedPlayerId?'Table de '+esc(s.name)+' · consultation.':esc(match.lastEvent||('Au tour de '+s.name+'.'));
 if(!canAct())return onlineBusy?'Action en cours…':'Au tour de '+esc(M.currentPlayer(match).game.name)+'.';
 if(isNpc())return esc(match.lastEvent);
 if(s.phase==='select'&&s.reuseRoll)return 'Choisis une carte pour les mêmes dés.';
 if(s.phase==='select'&&s.frozen?.length)return '❄ Dé gelé : choisis ton prochain trick.';
 if(s.phase==='select')return !E.options(s).length?'Aucune carte jouable du type requis : chute.':E.requiredTypes(s).length?`Type requis : ${E.requiredTypes(s).map(typeIcon).join(' / ')}`:'Ton prochain trick ?';
 if(s.phase==='ready')return 'Change de carte ou lance les dés.';
 if(s.phase==='rolled')return E.canLand(s)?'Prêt à réussir !':E.findMatch(E.activeCard(s),E.freeDice(s),E.wildColor(s))?'Place tes dés sur la carte.':'Un bonus… ou la chute.';
 if(s.phase==='decision')return E.canStop(s)?'On encaisse ou on continue ?':`Encore ${E.missingTypes(s).map(typeIcon).join('')} obligatoire avant d’encaisser.`;
 if(s.sequenceReward?.pending){const {choices,remaining}=s.sequenceReward,total=choices.length+remaining;return 'Choisis ton jeton'+(total>1?' · '+(choices.length+1)+'/'+total:'.');}
 if(hasResultSpecialty(s))return esc(SPECIALTIES[s.skaterId].name)+' disponible : choisis ton jeton avant de passer au joueur suivant.';
 if(s.sequenceReward?.choice)return `Jeton ${bonusName(s.sequenceReward.choice)} gagné !`;
 if(s.reason==='fall')return 'Chute. Tous les points de cet essai sont perdus.';
 if(s.reason==='pass')return 'Essai passé.';
 return s.last.success?'Essai conservé !':'Essai terminé.';
}
function focusControls(){return viewedPlayerId!==null?btn('Retour au suivi auto','view-follow',false,'follow-button')+(!ownTable()?btn('Ma table','view-self',false,'quiet-button'):''):'';}
function centralActions(){
 if(!canAct()||!ownTable())return '';
 if(s.phase==='ready')return btn('Lancer les dés · '+(E.freeDice(s).length-(s.frozen?.length||0))+(s.frozen?.length?' + '+s.frozen.length+' gelé(s)':''),'roll',false,'primary roll-button');
 if(s.phase==='rolled')return E.findMatch(E.activeCard(s),E.freeDice(s),E.wildColor(s))?btn(E.canLand(s)?'✓ Réussir le trick':'Place les dés pour réussir','land',!E.canLand(s),'primary land-button '+(E.canLand(s)?'ready-to-land':'')):btn('Chuter','fall',false,'danger');
 if(s.phase==='decision')return (E.canStop(s)?btn('Garder '+E.banked(s)+' pts','stop',false,'primary'):btn('Chuter','fall',false,'danger'))+btn(E.canStop(s)?'Continuer →':'Jouer le type manquant →','continue',false,'risk-button');
 if(s.phase==='result')return s.sequenceReward?.pending?'<div class="sequence-reward-choices" role="group" aria-label="Choisir les jetons de la séquence">'+E.BONUS_TYPES.map(type=>'<button data-action="claim-sequence" data-id="'+type+'" aria-label="Gagner un jeton '+bonusName(type)+', '+tokenStock(s.bank[type],E.bonusLimit(s,type))+' en réserve" '+(E.canAddBonus(s,type)?'':'disabled')+'>'+tokenStack(type,1,{showCount:false})+'</button>').join('')+'</div>':(hasResultSpecialty(s)?btn('Activer '+SPECIALTIES[s.skaterId].name,'inspect-specialty',false,'secondary'): '')+btn(match.position<match.order.length-1?'Joueur suivant →':match.round===0?'Deuxième essai →':'Résultats du module →','proceed',false,'primary');
 if(s.phase==='select'&&E.canFall(s))return btn('Chuter','fall',false,'danger');
 return '';
}
function actions(){
 const focus=focusControls();
 if(!canAct()||!ownTable())return focus+npcControls();
 if(s.phase==='rolled')return focus+btn('Auto','auto',!E.findMatch(E.activeCard(s),E.freeDice(s),E.wildColor(s)),'quiet-button')+btn('Reprendre les dés','reset-placement',!s.pending.length,'quiet-button');
 return focus+(s.phase==='select'&&!E.canFall(s)&&!s.landed.length&&!s.reuseRoll?btn('Passer','pass',false,'quiet-button'):'');
}
function board(){
 const m=E.currentModule(s),saved=archives();
 const handState=s;
 const hand=sortHand(handState.hand).filter(c=>!handState.secured.includes(c.uid)&&handState.active!==c.uid&&!handState.landed.some(e=>e.card===c.uid));
 const reserve=E.freeDice(s).filter(d=>!s.pending.includes(d.id));
 reserve.sort((a,b)=>Number(a.color===E.wildColor(s))-Number(b.color===E.wildColor(s)));
 return `<main class="play-world" data-viewed-player="${viewedPlayer(match,viewedPlayerId,myId()).id}">${matchStrip(match,{viewedPlayerId:viewedPlayer(match,viewedPlayerId,myId()).id})}<div class="table-rim"><section class="play-table" ${['select','ready'].includes(s.phase)?'data-drop="combo"':''} aria-label="Table de ${esc(viewedPlayer(match,viewedPlayerId,myId()).game.name)}">
 <div class="table-lettering" aria-hidden="true">LAGOON<br><span>SKATE CLUB</span></div>
 <aside class="module-area ${saved?'has-archive':''}"><button class="current-module-button" data-action="inspect-module" data-id="${m.id}" aria-label="Agrandir ${esc(m.name)}">${moduleCard(m,{earned:s.reason==='fall'||s.reason==='pass'?false:E.sequenceView(s).confirmed.moduleEffect,lazy:false})}</button><small class="module-attempt-label">Essai ${s.attempt+1}/2${s.attempt?` · précédent : ${s.attempts[0].points} pts`:''}</small>${saved}${renderDeckPiles(match)}</aside>
 <div class="table-center"><div class="dice-zone" data-drop="dice" aria-label="Réserve de dés"><div class="loose-dice">${dice(reserve.map(d=>d.id))||'<small>Dés posés</small>'}</div><div class="dice-bonus-note">${bonusHint()}</div></div><div class="trick-row">${slots()}</div><div class="central-actions" aria-live="polite">${centralActions()}</div>${liveSequence()}<div class="table-controls"><p role="status">${instructions()}</p><div class="table-actions">${actions()}</div></div></div>
 <aside class="physical-table-side">${skaterMat(viewedPlayer(match,viewedPlayerId,myId()),bonusControls())}${specialtyToken(viewedPlayer(match,viewedPlayerId,myId()),canAct()&&ownTable())}${trophyStock(viewedPlayer(match,viewedPlayerId,myId()))}</aside>
 <div class="score-token" aria-label="${s.phase==='result'?s.score:E.banked(s)} points ${s.phase==='result'?'conservés':'en jeu'}"><strong data-live-points="${s.phase==='result'?s.score:E.banked(s)}">${s.phase==='result'?s.score:E.banked(s)}</strong><small>${s.phase==='result'?'gardés':'en jeu'}</small></div>
 </section></div><section class="player-hand" aria-label="Main de ${esc(viewedPlayer(match,viewedPlayerId,myId()).game.name)}" style="--count:${hand.length};--intervals:${Math.max(1,hand.length-1)}"><span class="hand-label">${ownTable()?'TA MAIN':esc(s.name)+' · MAIN'} <small>${hand.length}</small></span><div class="hand-fan">${hand.map((c,i)=>handCard(c,i,hand.length)).join('')}</div></section></main>`;
}
function home(){return `<main class="home"><div class="home-copy"><div class="eyebrow">UNE SESSION AU BORD DE L’EAU</div><h1>TA LIGNE.<br>TES TRICKS.<br><em>TON MOMENT.</em></h1><p>Choisis ton trick. Lance les dés.<br>Arrête ou risque tout sur la suite.</p><div class="home-actions">${btn('Nouvelle session','create',false,'primary')}${onlineInfo?.canHost?btn('Créer une partie en ligne','create-online',false,'secondary'):btn('Multijoueur entre amis','multiplayer-help',false,'secondary')}${onlineInfo?.online&&lastConnection()?btn('Reprendre en ligne','resume-online',false,'secondary'):''}${match?btn(match.phase==='complete'?'Voir le bilan':'Reprendre','resume',false,'secondary'):''}${btn('Voir les cartes','library',false,'secondary')}</div><div class="home-version"><span>VERSION ${APP_VERSION}</span>${btn('Notes de mise à jour','patch-notes',false,'quiet-button '+(RELEASE_NOTES.some(r=>patchNotes.unread(r.version))?'unread-patch':''))}</div><div class="home-meta"><span>6 dés</span><span>41 tricks · 85 cartes</span><span>Toi + 1 à 3 NPC</span></div></div><div class="home-art"><div class="hero-crop"></div><div class="hero-tag"><span>01 / LAGOON PARK</span><strong>RIDE THE WAVE.</strong></div></div></main>`;}
function setup(){return `<main class="setup-page skater-setup"><div class="eyebrow">${onlineSetup?'PARTIE EN LIGNE · HÔTE':'NOUVELLE SESSION'}</div><h1>${onlineSetup?'CRÉE TON LOBBY.':'CHOISIS TON SKATER.'}</h1><p>${onlineSetup?'Invite tes amis. Chacun choisira ensuite son rider dans le lobby.':'Six styles, six couleurs. L’étoile de ton dé est ton joker.'}</p><form id="setup"><input type="hidden" name="online" value="${onlineSetup?'yes':'no'}"><div class="setup-options"><label>Ton nom<input name="name" value="Rider" maxlength="24" required></label><label>Skatepark<input value="Le Lagon · 6 manches" readonly><input type="hidden" name="length" value="6"></label><label>${onlineSetup?'Places adversaires':'Adversaires NPC'}<select name="npcCount"><option value="3">3 NPC · 4 joueurs</option><option value="2">2 NPC · 3 joueurs</option><option value="1">1 NPC · duel</option></select></label><label>Mode de jeu<select name="mode"><option value="base">Base · sans spécialité</option><option value="advanced">Avancé · spécialités des skaters</option></select></label><label>Niveau des NPC<select name="npcDifficulty">${NPC_DIFFICULTIES.map(level=>`<option value="${level.id}" ${level.id==='normal'?'selected':''}>${level.label}</option>`).join('')}</select></label></div><p class="npc-difficulty-note">Détente : plus prudent · Normal : carte engagée avant le jet · Expert : prévoit trois tricks et optimise ses dés et jetons. Mêmes dés et jetons pour tous.</p>${onlineSetup?'':`<fieldset class="skater-selection"><legend>Un skater par joueur · les NPC choisissent parmi les autres</legend><div class="skater-grid">${SKATERS.map(c=>`<label class="skater-choice" style="--skater-color:${c.color}"><input type="radio" name="skaterId" value="${c.id}" required aria-label="${c.name}, ${c.colorName}, ${c.look}"><img src="${c.image}" alt="${c.look}" draggable="false"><span class="skater-choice-caption"><strong>${c.name}</strong><b>${c.colorName}</b><small>${c.look}</small><small class="setup-power"><b>${SPECIALTIES[c.id].name}</b> · ${SPECIALTIES[c.id].text} ${SPECIALTIES[c.id].passive?"Passif pendant toute la partie.":"Une fois par module."}</small></span><span class="skater-choice-check" aria-hidden="true">✓</span></label>`).join('')}</div></fieldset>`}<div class="skater-setup-footer"><p>★ sur ton dé = valeur de 1 à 6.<br>Les autres étoiles valent 1. Le −1 peut transformer ton 2 en ★.</p><button class="primary" type="submit">${onlineSetup?'Créer le salon →':'Choisir mes cartes →'}</button></div></form>${!onlineSetup&&match&&match.phase!=='complete'?'<p class="replace-note">Démarrer remplacera la session en cours.</p>':''}</main>`;}

function draftHand(){
 const hand=sortHand(localPlayer().game.hand);
 return '<section class="draft-hand" aria-label="Tes cartes complètes"><h2>TA MAIN <small>'+hand.length+' cartes</small></h2><div class="draft-hand-cards" style="--cards:'+Math.max(1,hand.length)+'">'+(hand.map(c=>'<div class="trick-card owned-card" data-card="'+c.uid+'" data-action="inspect-trick" data-id="'+c.id+'" role="button" tabindex="0" aria-label="'+esc(c.name)+', '+esc(c.rule)+', '+c.points+' points">'+cardFace(c)+'</div>').join('')||'<p>Ta première carte apparaîtra ici.</p>')+'</div></section>';
}
function draft(){
 const initial=match.phase==='initial',simultaneous=initial&&M.passingDraft(match),type=['kick','kick','slide','slide','air','air'][match.draftRound],npc=!canAct();
 const cards=initial?s.offer.map(uid=>s.deck.find(c=>c.uid===uid)).filter(Boolean):match.market.cards;
 const reserves=initial?[]:sortHand(match.market.reserve||[]),choices=[...cards,...reserves];
 const player=localPlayer().game,stock=player.bank,tokenChoices=initial?[]:E.draftBonusChoices(player,match.market.tokens);
 const selectedCard=!npc&&choices.find(c=>c.uid===draftSelection.cardId),selectedToken=!npc&&tokenChoices.find(t=>t.id===draftSelection.tokenId);
 const reserveMarkup=reserves.length?'<section class="draft-reserve" aria-label="Cartes des niveaux précédents"><h2>NIVEAUX PRÉCÉDENTS</h2><div class="reserve-card-grid">'+reserves.map(c=>'<button class="trick-card '+(selectedCard?.uid===c.uid?'selected':'')+'" data-action="select-draft-card" data-id="'+c.uid+'" '+(npc?'disabled':'')+' aria-label="Choisir '+esc(c.name)+', '+c.points+' points">'+cardFace(c)+'</button>').join('')+'</div></section>':'';
 const tokens=initial?'':`<section class="draft-token-offer" aria-label="Jetons disponibles">${match.market.tokens.map((t,i)=>{
  const fits=E.canAddBonus(player,t.type),label=bonusName(t.type),count=stock[t.type];
  const state=fits?'Stock '+tokenStock(count,E.bonusLimit(player,t.type))+' → '+tokenStock(count+1,E.bonusLimit(player,t.type)):tokenChoices.includes(t)?'À remettre · '+tokenStock(count,E.bonusLimit(player,t.type)):'Plein · '+tokenStock(count,E.bonusLimit(player,t.type));
  return `<button class="draft-bonus-choice ${selectedToken?.id===t.id?'selected':''}" data-action="select-draft-token" data-id="${t.id}" aria-pressed="${selectedToken?.id===t.id}" aria-label="Jeton ${i+1} · ${label} · ${state}" ${npc||!tokenChoices.includes(t)?'disabled':''}>${tokenStack(t.type,1)}<strong>${label}</strong><small>${state}</small></button>`;
 }).join('')}</section><div class="draft-pair-confirm"><span>${selectedCard?esc(selectedCard.name):'Choisis une carte'} + ${selectedToken?bonusName(selectedToken.type):'choisis un jeton'}</span>${btn(selectedToken&&!E.canAddBonus(player,selectedToken.type)?'Prendre la carte, remettre le jeton':'Prendre la carte et le jeton','confirm-draft',npc||!selectedCard||!selectedToken,'primary')}</div>`;
 const title=simultaneous?(npc?'Ton choix est confirmé.':'Choisis une carte.'):esc(s.name)+' choisit.';
 return '<main class="campaign-draft shared-draft '+(initial?'':'paired-draft')+'"><div class="draft-title"><div><div class="eyebrow">'+(initial?'CHOIX '+(simultaneous?'SIMULTANÉ ':'DE DÉPART ')+(match.draftRound+1)+'/6 · '+typeIcon(type):'DRAFT COMMUN · '+(TIER_NAMES[match.market.tier]||'').toUpperCase()+' · CARTE + JETON')+'</div><h1>'+title+'</h1></div>'+npcControls()+'</div><p>'+(initial?(simultaneous?'Deux choix par type : Kick, Slide, puis Air. Au premier choix : deux Base et une Avancée. Passe les deux restantes à droite, reçois celles de gauche et ajoute une Avancée du même type. Les choix sont révélés quand tout le monde est prêt.':'Choisis une carte. Six cartes obligatoires au départ.'):'Une carte ET un jeton chacun, du plus petit au plus grand score. Choix modifiables avant confirmation.')+'</p><div class="draft-layout"><div class="draft-main">'+tokenInventory(localPlayer().game)+(initial?'':draftHand())+'<section class="campaign-offer" aria-label="Cartes au centre">'+(cards.map(c=>'<button class="trick-card '+(!initial&&selectedCard?.uid===c.uid?'selected':'')+'" data-action="'+(initial?'draft':'select-draft-card')+'" data-id="'+c.uid+'" '+(npc?'disabled':'')+' aria-label="Choisir '+esc(c.name)+', '+c.points+' points">'+cardFace(c)+'</button>').join('')||'<p class="draft-waiting">✓ Carte en main. En attente des autres joueurs…</p>')+'</section>'+tokens+reserveMarkup+(initial?draftHand():'')+'</div>'+draftStatus(match)+'</div></main>';
}
function npcControls(){if(!isNpc()||online&&!online.isHost)return '';return '<div class="npc-controls">'+btn(npcPaused?'Reprendre le NPC':'Pause NPC','npc-pause',false,'quiet-button')+btn(npcFast?'Vitesse ×1':'Accélérer','npc-speed',false,'quiet-button')+'</div>';}


function complete(){return finalStandings(match);}

function overlay(){if(modal==='multiplayer-help')return multiplayerHelp();if(modal==='specialty'&&s)return specialtyOverlay();if(modal==='park'&&match)return '<div class="backdrop"><section class="modal campaign-modal park-detail-modal" role="dialog" aria-modal="true" aria-label="Carte du parc Le Lagon">'+btn('Fermer','dismiss',false,'secondary')+parkCard(match)+'<p>Deux marqueurs de ta couleur : dizaines à gauche, unités à droite. La lettre sur les marqueurs est l’initiale de ton skater. Seul ton meilleur essai encaissé est enregistré.</p></section></div>';if(!modal)return '';if(modal==='patch-notes')return '<div class="backdrop"><section class="modal patch-notes-modal" role="dialog" aria-modal="true" aria-label="Notes de mise à jour">'+btn('Fermer','dismiss',false,'secondary')+'<h2>SK8 HEROES · '+APP_VERSION+'</h2>'+RELEASE_NOTES.map(release=>'<article class="release-note '+(patchNotes.unread(release.version)?'unread-note':'')+'"><h3 data-release-version="'+release.version+'">Version '+release.version+' <small>'+release.date+'</small></h3><ul>'+release.changes.map(change=>'<li>'+esc(change)+'</li>').join('')+'</ul></article>').join('')+'</section></div>';if(modal==='attempt'&&inspectedAttempt){const p=inspectedAttempt;return '<div class="backdrop"><section class="modal campaign-modal attempt-detail-modal" role="dialog" aria-modal="true" aria-label="Essai '+(p.attempt+1)+' de '+esc(p.playerName)+'">'+btn('Fermer','dismiss',false,'secondary')+'<h2>'+esc(p.playerName)+' · Essai '+(p.attempt+1)+' · '+p.points+' pts</h2><p>'+(p.reason==='fall'?'Chute · points de la séquence perdus':p.reason==='pass'?'Essai passé':'Séquence conservée')+'</p><div class="attempt-full-cards">'+(p.cards.map(entry=>'<div class="trick-card">'+cardFace(entry.card,{ids:entry.ids,locked:entry.confirmed,snapshot:entry.dice,snapshotBonus:entry.bonus,skaterId:p.skaterId,status:entry.status})+'</div>').join('')||'<p>Aucune carte jouée.</p>')+'</div></section></div>';}if(modal==='played-trick'&&inspectedPlayed){const p=inspectedPlayed;return '<div class="backdrop"><section class="modal campaign-modal played-trick-modal" role="dialog" aria-modal="true" aria-label="Carte jouée : '+esc(p.card.name)+'">'+btn('Fermer','dismiss',false,'secondary')+'<p class="played-inspection-caption">'+esc(p.playerName)+' · '+esc(p.status)+'</p><div class="played-trick-inspection"><div class="trick-card">'+cardFace(p.card,{ids:p.ids,locked:p.confirmed,onTable:true,snapshot:p.dice,snapshotBonus:p.bonus,skaterId:p.skaterId,status:p.confirmed?'✓ Réussi':p.status})+'</div></div></section></div>';}if(modal==='trick')return '<div class="backdrop"><section class="modal campaign-modal trick-detail-modal" role="dialog" aria-modal="true" aria-label="Carte de trick">'+btn('Fermer','dismiss',false,'secondary')+trickInspection(TRICKS[inspectedTrick],cardFace)+'</section></div>';if(modal==='modules'||modal==='module')return '<div class="backdrop"><section class="modal campaign-modal '+(modal==='module'?'module-detail-modal':'')+'" role="dialog" aria-modal="true" aria-label="'+(modal==='module'?'Carte du module':'Modules du Lagon')+'">'+btn('Fermer','dismiss',false,'secondary')+(modal==='modules'?moduleCatalog():'<div class="module-inspection">'+moduleCard(MODULES[inspectedModule],{lazy:false})+'</div><p class="module-inspection-note">'+esc(MODULES[inspectedModule].condition)+' Effet conservé si l’essai est encaissé. Les symboles indiquent les types à jouer au départ.</p>')+'</section></div>';return `<div class="backdrop"><section class="modal campaign-modal" role="dialog" aria-modal="true" aria-label="${modal==='help'?'Règles':'Toutes les cartes'}">${btn('Fermer','dismiss',false,'secondary')}${modal==='help'?`<h2>UNE CARTE, UN JET, UN CHOIX.</h2><p class="symbol-legend">${typeIcon('kick')} Kick · ${typeIcon('slide')} Slide · ${typeIcon('air')} Air</p><ol><li>Choisis une carte (modifiable tant que le jet n’a pas eu lieu) respectant <b>au moins un type</b> du module, puis lance les six dés.</li><li>Glisse les dés dans les emplacements de sa carte. Après le lancer, la carte est engagée et ne peut plus être remplacée. Reprendre les dés remet seulement les dés non confirmés dans la réserve, en conservant leurs faces, le gel et les jetons dépensés. Tu peux les replacer avant de valider le trick ; les dés sont ensuite bloqués jusqu’à la fin de l’essai.</li><li>Arrête pour conserver les points, ou engage une autre carte puis relance <b>tous les dés restants</b>. Sur un module à deux types, le deuxième trick doit être du type manquant ; impossible d’encaisser avant les deux. Le troisième est libre. Pour les modules à un ou trois types, seule la première carte doit correspondre. Sans carte jouable du type requis, c’est la chute.</li><li>Maximum trois cartes par essai. Trois tricks validés rapportent normalement +1 point de séquence et un jeton au choix. Belle sortie remplace le +1 par +2 ; Session généreuse donne deux jetons au lieu d’un. Les choix sont obligatoires avant de passer au joueur suivant. Une même carte physique ne peut être rejouée ; deux exemplaires d’un trick le peuvent.</li><li>Un trick raté fait perdre <b>tout l’essai</b>. Tu peux employer tes bonus avant de déclarer la chute.</li></ol><p><b>Bonus :</b> les jetons ±1, ↻ et ❄ restent disponibles aux modules suivants, avec un maximum de 3 par type (4 jetons ±1 pour Sol en Avancé). Les gains excédentaires retournent à la banque. Chaque utilisation consomme un jeton ; tu peux en jouer plusieurs dans un essai. Le ±1 modifie un dé non validé. Le jeton ↻ relance tous les dés non validés et non gelés en un clic, même ceux posés sur la carte en cours : ils reviennent dans la réserve. Les dés des tricks déjà réussis restent bloqués. Les valeurs restent entre 1 et 6, sans bouclage.</p><p><b>Gel ❄ :</b> pendant un jet, clique le jeton puis un dé non validé pour conserver sa face lors des relances ↻ de ce trick. Tu peux aussi le faire après un trick réussi pour le trick suivant : cela engage la continuation. Un jeton gèle un dé ; plusieurs jetons permettent de geler plusieurs dés. Le dé garde sa face et son gel pendant toute la séquence tant qu’il reste libre, même après plusieurs tricks, en cliquant Continuer et pendant les relances ↻. Le gel disparaît seulement quand ce dé est utilisé sur une carte validée, ou à la fin de la séquence (arrêt ou chute). Un ±1 peut toujours modifier sa face volontairement.</p><p><b>Ordre :</b> tiré au hasard en début de partie. Tous jouent leur premier essai, puis leur deuxième. Après chaque module, le premier passe dernier. Au départ, chacun choisit simultanément une carte parmi trois. Les deux restantes passent à droite ; chacun reçoit celles de gauche et pioche une carte du même type. On fait deux choix Kick, deux Slide, puis deux Air, soit six cartes obligatoires, sans bonus ni possibilité de passer. Ta main complète reste visible pendant les choix.</p><p><b>Parcours :</b> deux essais par module, avec six dés à chaque essai. Les cartes des séquences conservées restent sur la table, indisponibles jusqu'au module suivant. Les bonus consommés restent dépensés. Chaque joueur joue deux essais avec les mêmes règles. Le meilleur essai complet de chaque joueur compte. Le meilleur score rapporte les PV indiqués sur le module. Le deuxième score distinct rapporte 1 PV. Chaque ex æquo reçoit les PV de sa place. Un score de zéro ne rapporte aucun PV. Les six modules sont tirés au début : deux parmi les quatre de découverte, deux parmi les quatre intermédiaires et deux parmi les quatre finales. Ils restent visibles en haut de la table ; survole ou clique une carte pour l’agrandir. Après chaque module sauf le dernier, on propose une carte et un jeton par joueur. Les cartes viennent du niveau actif : Base après le module 1, Avancées après 2–3, Épiques après 4–5. Les niveaux précédents restent disponibles face visible. Les cartes proposées non prises retournent dans leur pioche. Les jetons sont tirés parmi ±1, ↻ et ❄, avec doublons possibles. Chacun doit prendre une carte ET un jeton, du plus petit au plus grand meilleur essai. Les deux choix sont confirmés ensemble. Les égalités suivent l’ordre de tour du module terminé. Les cartes restantes retournent à la pioche ; ensuite le premier joueur passe dernier. Il n’y a pas de bonus automatique de participation.</p><p><b>Bonus du module :</b> le module indique un effet simple : +1 par Base, par type favorisé ou par étoile physique utilisée ; +2 avec le dé personnel une fois par essai ; Grande amplitude ajoute +2 par trick à 3 ou 4 dés. Ces points comptent dès le premier trick et sont perdus en cas de chute. Zone de récupération donne un jeton au choix si on encaisse exactement deux tricks. Belle sortie porte le bonus de trois tricks à +2 points ; Session généreuse porte leur récompense à deux jetons au choix. Chaque essai est indépendant.</p><p><b>Carte du parc :</b> deux marqueurs par joueur indiquent son meilleur essai encaissé : dizaines à gauche, unités à droite. Les deux reviennent à zéro au début de chaque module. Un jeton trophée vaut 1 PV ; les trophées gagnés en fin de module sont conservés pour toute la partie.</p><p><b>Skaters et étoiles :</b> chaque joueur choisit un skater différent. Les six dés sont bleu, rouge, vert, jaune, orange et mauve. La face 1 est une étoile sur tous les dés. Seule l’étoile du dé de ta couleur peut représenter n’importe quelle valeur de 1 à 6 ; Auto et le placement manuel lui donnent une valeur compatible, indiquée sur la carte. Les autres étoiles valent 1. Le −1 permet de passer de 2 à ★, et le +1 de ★ à 2, même sur ton dé personnel. Le gel conserve l’étoile comme les autres faces.</p><p><b>Modes Base et Avancé :</b> Base conserve les règles sans spécialités. En Avancé, le pouvoir est inscrit sur la carte skater. Pour les pouvoirs actifs, clique le jeton pour l’activer : couleur quand disponible, noir et blanc après utilisation. Ces pouvoirs ont une seule utilisation par module, parmi les deux essais ; le jeton se réactive au début du module suivant. Les jetons gagnés ou remboursés respectent la limite de trois par type, sauf Sol qui peut conserver quatre jetons ±1 en Avancé. Son pouvoir est passif, sans correction gratuite ni activation. Trick signature permet à Jade de reprendre une carte du premier essai encaissé pour la rejouer au deuxième. Les types requis et le coût en dés restent applicables.</p><p><b>Combinaisons :</b> ≥ signifie « égal ou au-dessus », ≤ « égal ou au-dessous », pour chaque dé séparément. Un chiffre seul demande cette face exacte. Jamais de somme. P = pair ; I = impair ; ≠ = différents. Une suite demande des valeurs consécutives. Le 360° demande deux valeurs espacées de 3. Le 540° demande trois valeurs consécutives. Le 720° demande 1–3–5 ou 2–4–6. Le 900° demande deux paires distinctes parmi 4, 5 et 6 ; A et B représentent ces deux valeurs. Le 1080° demande quatre dés identiques, quelle que soit leur valeur.</p><p><b>Chances :</b> la grille imprimée indique les chances avant un jet avec 6, 4, 3 ou 2 dés ordinaires, selon le coût du trick, sans joker, gel ni jeton bonus. Elle reste identique pendant la partie. Le joker personnel et les bonus peuvent améliorer ces chances. Les bonus favorisent différemment les valeurs demandées. Les points affichés incluent un supplément de +2 pour chaque carte à trois ou quatre dés. Le bonus de séquence est ajouté seulement après trois tricks validés : +1 normalement, +2 avec Belle sortie. Les effets +1/+2 s'ajoutent dans la même séquence réussie, quel que soit l'ordre des cartes. Une chute annule aussi ces points. Les gains ±1, relance et gel des cartes sont reçus en fin de module si leur séquence est conservée : un jeton par carte physique récompensée sur les deux essais conservés, dans la limite du stock disponible. Ces gains sont distincts du jeton au choix des trois tricks.</p>`:`<h2>PROBABILITÉS DES TRICKS</h2><p>Chances exactes avant un jet, sans bonus. La colonne ★ inclut ton dé personnel parmi les six dés. Barème selon la difficulté à six dés et le nombre de dés immobilisés, hors effets de séquence. Avec trop peu de dés, la carte est indisponible.</p><div class="odds-table-wrap"><table class="odds-table"><thead><tr><th>Trick / combinaison</th><th>Base</th><th>6 dés</th><th>6 dés ★</th><th>4 dés</th><th>2 dés</th></tr></thead><tbody>${[...TRICKS].sort((a,b)=>a.points-b.points).map(c=>`<tr><th>${c.name}<small>${c.rule}</small>${c.effortBonus?'<small>+2 inclus pour 3 ou 4 dés immobilisés</small>':''}${c.comboBonus?`<small class="catalog-effect">${bonusLabel(c)}</small>`:''}</th><td>${c.points}</td><td>${percent(ODDS.cards[c.id].noBonus[6])}</td><td>${percent(ODDS.cards[c.id].withWild.noBonus[6])}</td>${[4,2].map(n=>`<td>${n<c.cost?'—':percent(ODDS.cards[c.id].noBonus[n])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}</section></div>`;}


function specialtyUnavailable(g){
 if(g.specialty?.used)return 'Spécialité déjà utilisée sur ce module. Elle sera disponible au début du prochain module.';
 if(g.skaterId==='milo'){
  if(g.phase!=='result')return 'Réussis exactement deux tricks de types différents, puis clique sur « Garder les points ». Tu pourras ensuite choisir ton jeton ici.';
  if(g.score<=0||g.landed.length!==2||new Set(g.landed.map(e=>g.hand.find(c=>c.uid===e.card)?.type)).size!==2)return 'Bon rythme demande exactement deux tricks de types différents et un essai encaissé. Une chute, un seul trick ou trois tricks ne donnent pas ce bonus.';
  if(g.sequenceReward?.pending)return 'Choisis d’abord le jeton offert par le module, puis active Bon rythme.';
  return 'Tes trois réserves sont pleines : aucun jeton supplémentaire ne peut être ajouté.';
 }
 return 'Ce pouvoir n’est pas utilisable maintenant. Vérifie les conditions sur ta carte.';
}
function specialtyOverlay(){
 const power=SPECIALTIES[s.skaterId],options=canAct()?specialtyActions(s):[],cards=s.skaterId==='jade';
 return `<div class="backdrop"><section class="modal specialty-modal" role="dialog" aria-modal="true" aria-label="${esc(power.name)}">${btn('Fermer','dismiss',false,'secondary')}<h2>${esc(power.name)}</h2><p>${esc(power.text)}</p><p><strong>1 fois par module, parmi les deux essais.</strong> Retourne le jeton après utilisation. Il redevient disponible au module suivant.</p><div class="specialty-choices ${cards?'specialty-cards':''}">${options.map((action,i)=>cards?`<button class="trick-card" data-action="use-specialty" data-index="${i}" aria-label="${esc(action.label)}">${cardFace(s.hand.find(c=>c.uid===action.cardId),{reference:true})}</button>`:`<button class="secondary" data-action="use-specialty" data-index="${i}">${esc(action.label)}</button>`).join('')||'<p class="specialty-unavailable">'+esc(specialtyUnavailable(s))+'</p>'}</div></section></div>`;
}
function multiplayerHelp(){
 return `<div class="backdrop"><section class="modal multiplayer-help" role="dialog" aria-modal="true" aria-label="Multijoueur entre amis">${btn('Fermer','dismiss',false,'secondary')}<h2>JOUE AVEC TES AMIS.</h2><p>De 2 à 4 joueurs, chacun sur son navigateur. Les places libres peuvent être jouées par des NPC, en mode Base ou Avancé.</p><h3>Tu héberges la partie</h3><ol><li>Sur ton ordinateur Windows, ouvre le dossier du jeu et double-clique sur <strong>Lancer le multijoueur.cmd</strong>.</li><li>Choisis ton nom, le nombre de places et le mode, puis crée le salon.</li><li>Clique sur <strong>Activer le lien Internet</strong>, puis <strong>Copier le lien</strong> et envoie-le à tes amis.</li><li>Chacun choisit son skater ; tu peux alors commencer la partie.</li></ol><p>Garde ton ordinateur allumé et connecté pendant la partie. Le lien est temporaire ; les parties sont sauvegardées sur ton ordinateur.</p><h3>Tu rejoins un ami</h3><p>Ouvre le lien d’invitation envoyé par l’hôte. Tu n’as rien à installer.</p><details><summary>Installer le jeu sur un autre ordinateur</summary><p>Installe <a href="https://nodejs.org/" target="_blank" rel="noopener noreferrer">Node.js 22 ou plus récent</a>, puis <a href="https://github.com/JFeffe/Sk8-Heroes/archive/refs/heads/main.zip">télécharge le jeu</a> et extrais le dossier avant de lancer le multijoueur. Le premier lancement prépare automatiquement le partage Internet.</p></details><p class="multiplayer-hint">Ce site public permet de jouer en solo. Pour une partie entre amis, utilise le jeu lancé sur l’ordinateur hôte et son lien d’invitation.</p></section></div>`;
}
function inviteLink(){
 const base=onlineView?.publicBaseUrl||onlineInfo?.publicBaseUrl;
 if(!online||!base)return null;
 return base.replace(/\/$/,'')+'/?join='+online.roomId;
}
function stopOnline(){
 feedback.reset();
 online?.stop();viewedPlayerId=null;online=null;onlineView=null;onlineBusy=false;onlineConnected=false;modal='';
 try{const saved=JSON.parse(localStorage.getItem(KEY));match=saved?M.restore(saved):null;s=match?M.currentPlayer(match).game:null;}catch{match=null;s=null;}
 history.replaceState(null,'',location.pathname);
}
async function connectOnline(connection){
 feedback.reset();
 online?.stop();viewedPlayerId=null;onlineView=null;screen=connection.started?'play':'lobby';onlineConnected=true;onlineError='';
 online=new OnlineClient(connection,{
  onState:view=>{
   const firstStart=(!onlineView||!onlineView.started)&&view.started;
   onlineView=view;npcPaused=view.paused;npcFast=view.fast;match=view.match;s=M.currentPlayer(match).game;
   if(firstStart&&screen==='lobby')screen='play';
   if(screen!=='cards')render();
  },
  onConnection:connected=>{if(onlineConnected!==connected){onlineConnected=connected;render();}}
 });
 await online.start(connection.match?connection:undefined);
}
function networkCommand(action){
 if(!online||onlineBusy||!onlineConnected)return false;
 onlineBusy=true;const connection=online;
 connection.send(action).catch(error=>toast(error.message)).finally(()=>{if(online!==connection)return;onlineBusy=false;render();});
 return true;
}
async function shareOnline(){
 if(!online?.isHost||onlineSharing)return;
 onlineSharing=true;render();
 try{const info=await onlineApi('share',{method:'POST',localKey:onlineInfo?.localKey});onlineInfo={...onlineInfo,...info};onlineView.publicBaseUrl=info.publicBaseUrl;toast('Le lien Internet est prêt.');}
 catch(error){toast(error.message);}
 finally{onlineSharing=false;render();}
}
async function bootOnline(){
 const params=new URL(location.href).searchParams,roomId=params.get('join');
 if(roomId){screen='join';render();}
 try{onlineInfo=await onlineApi('info');}catch{onlineInfo=null;}
 if(!roomId&&params.get('host')==='1'&&onlineInfo?.canHost){onlineSetup=true;screen='create';history.replaceState(null,'',location.pathname);}
 if(roomId){
  if(!/^[a-f0-9]{24}$/.test(roomId)){onlineError='Cette invitation est invalide.';render();return;}
  const saved=savedConnection(roomId);
  if(saved){try{await connectOnline(saved);return;}catch{online?.stop();online=null;onlineView=null;forgetConnection(roomId);}}
  screen='join';
  try{onlineJoinLobby=await onlineApi('rooms/'+roomId+'/lobby');}catch(error){onlineError=error.message;}
 }
 render();
}

function updateDiceFeedback(){
 if(!match)return;const detected=detectRolls(match,rollStamps),now=performance.now();rollStamps=detected.stamps;
 for(const [id,ids] of Object.entries(detected.rolled))rollEffects[id]={ids,at:now};
 const effect=rollEffects[viewedPlayer(match,viewedPlayerId,myId()).id];rollElapsed=effect?Math.max(0,now-effect.at):0;
 rollingDice=new Set(effect&&rollElapsed<650?effect.ids:[]);
 validDice=isBoard()&&s.phase==='rolled'?validDiceIds(E.activeCard(s),E.freeDice(s),E.wildColor(s),s.pending):new Set();
}
function render(){
 clearTimeout(npcTimer);animationGeneration++;cancelDrag();if(match&&!online)M.setClockRunning(match,(screen==='play'||screen==='cards'&&libraryReturnScreen==='play')&&!npcPaused);if(match){const nextView=syncTableView(match,{...tableViewCursor,playerId:viewedPlayerId},npcPaused);if(tableViewCursor.displayedId!==nextView.displayedId){picked=[];bonusMode=null;}tableViewCursor=nextView;viewedPlayerId=tableViewCursor.playerId;s=match.phase==='initial'&&M.passingDraft(match)?localPlayer().game:screen==='play'&&match.phase==='playing'?viewedPlayer(match,viewedPlayerId,myId()).game:M.currentPlayer(match).game;}save();
 updateDiceFeedback();feedback.update(match,onlineView?.riderChoices);
 root.className=isBoard()?'table-game'+(online?' online-game':''):'';root.dataset.bonusMode=bonusMode?.type||'';root.dataset.bonusDelta=bonusMode?.delta||0;document.body.classList.toggle('table-mode',!!isBoard());
 root.innerHTML=header()+(online&&['play','lobby'].includes(screen)?onlineBar(onlineView,{connected:onlineConnected,busy:onlineBusy,inviteLink:inviteLink(),sharing:onlineSharing}):'')+(screen==='play'&&match?moduleRoute(match):'')+(screen==='home'?home():screen==='create'?setup():screen==='join'?onlineJoin(onlineJoinLobby,{error:onlineError,busy:onlineBusy}):screen==='lobby'?onlineLobby(onlineView,{inviteLink:inviteLink(),busy:onlineBusy,sharing:onlineSharing,recoveryCode:online.token}):screen==='cards'?cardLibrary({kind:libraryKind,packId:libraryPackId},cardFace):match.phase==='draft-summary'?draftReview(match,draftHand()):match.phase==='recap'?recap(match):match.phase==='complete'?complete():match.phase==='initial'||match.phase==='recovery'?draft():board())+overlay();
 const page=[screen,match?.phase,match?.module,screen==='cards'?libraryPackId:''].join(':');
 if(page!==renderedPage){window.scrollTo(0,0);renderedPage=page;}
 observePatchNotes();feedback.decorate(root,myId());
 if(online)root.querySelectorAll('[data-action="start-module"],[data-action="next-module"]').forEach(button=>button.disabled=!online.isHost||onlineBusy);
 if(screen==='play'&&match.phase==='recap'&&!modal&&!animatedRecaps.has(match.module))animateScores();
 if(!online&&screen==='play'&&isNpc()&&!modal&&!npcPaused)npcTimer=setTimeout(()=>{if(M.npcStep(match)){picked=[];bonusMode=null;render();}else toast('Le NPC attend une action valide.');},npcFast?45:420);
}
function animateScores(){
 animatedRecaps.add(match.module);if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const generation=animationGeneration,start=performance.now(),nodes=[...root.querySelectorAll('[data-score-to]')];
 nodes.forEach(el=>el.textContent=el.dataset.scoreFrom);
 function tick(now){if(generation!==animationGeneration)return;const p=Math.min(1,(now-start)/1000),ease=1-(1-p)**3;for(const el of nodes){const from=Number(el.dataset.scoreFrom),to=Number(el.dataset.scoreTo);el.textContent=new Intl.NumberFormat('fr-CA',{maximumFractionDigits:2}).format(p===1?to:Math.floor(from+(to-from)*ease));}if(p<1)requestAnimationFrame(tick);}
 requestAnimationFrame(tick);
}

function useBonus(id){
 const b=bonusMode;if(!b)return;
 if(command('bonus',{bonusType:b.type,id,delta:b.delta})){bonusMode=null;picked=[];render();}
 else{picked=[];toast('Choisis un dé non bloqué, avec une valeur restant entre 1 et 6.');render();}
}
function placeDice(ids,target=true){
 if(target){const next=[...new Set([...s.pending,...ids])];if(!arrangeDice(E.activeCard(s),next.map(id=>s.dice[id]),E.wildColor(s)))return false;}
 return command('place',{ids,target});
}
const cancelDrag=bindDrag(root,{enabled:()=>!modal&&isBoard()&&canAct(),diceSelection:id=>picked.includes(id)?[...picked]:[id],onDrop:(payload,target)=>{
 const changed=payload.kind==='card'?target.drop==='combo'&&command('choose',{cardId:payload.id}):placeDice(payload.indices,target.drop==='trick');
 if(changed){picked=[];bonusMode=null;render();}else{feedback.reject(root.querySelector('[data-drop="trick"]')||root.querySelector('.dice-zone'));toast('Ces dés ne correspondent pas aux emplacements libres.');}
}});
root.addEventListener('click',e=>{
 if(e.target.classList.contains('backdrop')){closeModal();render();return;}
 const el=e.target.closest('[data-action]');if(!el||el.disabled)return;e.preventDefault();const a=el.dataset.action;let changed=false;
 if(a==='multiplayer-help'){modal='multiplayer-help';render();return;}
 if(a==='view-player'){if(!isBoard()||!match.players.some(p=>p.id===el.dataset.id))return;viewedPlayerId=el.dataset.id;picked=[];bonusMode=null;render();return;}
 if(a==='view-self'||a==='view-follow'){viewedPlayerId=a==='view-self'?myId():null;picked=[];bonusMode=null;render();return;}
 if(a==='library'){if(screen!=='cards')libraryReturnScreen=screen;screen='cards';libraryKind=null;libraryPackId=null;modal='';render();window.scrollTo(0,0);return;}
 if(a==='library-close'){screen=libraryReturnScreen==='play'&&!match?'home':libraryReturnScreen;modal='';render();window.scrollTo(0,0);return;}
 if(a==='library-root'||a==='library-packs'){if(screen!=='cards')return;libraryPackId=null;if(a==='library-root')libraryKind=null;render();window.scrollTo(0,0);return;}
 if(a==='library-kind'){if(screen!=='cards'||!['tricks','skateparks'].includes(el.dataset.id))return;libraryKind=el.dataset.id;libraryPackId=null;render();window.scrollTo(0,0);return;}
 if(a==='library-pack'){if(screen!=='cards'||!findCardPack(el.dataset.id,libraryKind))return;libraryPackId=el.dataset.id;render();window.scrollTo(0,0);return;}
 if(a==='inspect-attempt'){inspectedAttempt=attemptSnapshot(match,el.dataset.player,Number(el.dataset.attempt),el.hasAttribute('data-module')?Number(el.dataset.module):null);if(inspectedAttempt){modal='attempt';render();}return;}
 if(a==='inspect-played'){
  if(modal||!isBoard())return;
  // Clicking the active card still places selected dice; its other clicks zoom.
  if(picked.length&&canAct()&&s.phase==='rolled'&&s.active===el.dataset.card&&!el.hasAttribute('data-attempt')){if(placeDice(picked)){picked=[];render();}return;}
  inspectedPlayed=playedCardSnapshot(match,el.dataset.player,el.dataset.card,el.hasAttribute('data-attempt')?Number(el.dataset.attempt):null,el.hasAttribute('data-module')?Number(el.dataset.module):null);
  if(inspectedPlayed){modal='played-trick';render();root.querySelector('[role="dialog"] [data-action="dismiss"]')?.focus();}return;
 }
 if(a==='inspect-trick'){inspectedTrick=Number(el.dataset.id);if(!TRICKS[inspectedTrick])return;modal='trick';render();return;}
 if(a==='create-online'){if(!onlineInfo?.canHost){toast('Ouvre le jeu sur le serveur local de l’hôte.');return;}if(online)stopOnline();onlineSetup=true;screen='create';render();return;}
 if(a==='resume-online'){const saved=lastConnection();if(saved)connectOnline(saved).catch(error=>{toast(error.message);stopOnline();screen='home';render();});return;}
 if(a==='share-online'){shareOnline();return;}
 if(a==='stop-share'){if(online?.isHost)onlineApi('share',{method:'DELETE',localKey:onlineInfo?.localKey}).then(()=>{onlineView.publicBaseUrl=null;onlineInfo.publicBaseUrl=null;render();}).catch(error=>toast(error.message));return;}
 if(a==='copy-recovery'){if(online)navigator.clipboard.writeText(online.token).then(()=>toast('Code personnel copié.'));return;}
 if(a==='copy-invite'){const link=inviteLink();if(link)navigator.clipboard.writeText(link).then(()=>toast('Lien d’invitation copié.')).catch(()=>toast('Sélectionne le lien dans le salon pour le copier.'));return;}
 if(a==='online-salon'){screen='lobby';render();return;}
 if(a==='online-return'){screen='play';render();return;}
 if(a==='select-rider'){if(online&&!onlineView.started&&networkCommand({type:'select-rider',skaterId:el.dataset.id}))render();return;}
 if(a==='online-start'){if(networkCommand({type:'start'}))render();return;}
 if(['help','catalog','modules','patch-notes'].includes(a)){modal=a;render();return;}
 if(a==='inspect-park'){modal='park';render();return;}if(a==='inspect-module'){inspectedModule=Number(el.dataset.id);if(!MODULES[inspectedModule])return;modal='module';render();return;}
 if(a==='inspect-specialty'){if(canAct()){modal='specialty';render();}return;}
 if(a==='use-specialty'){if(!canAct())return;const action=specialtyActions(s)[Number(el.dataset.index)];if(action&&command(action.type,action)){modal='';picked=[];render();}return;}
 if(a==='dismiss'){closeModal();render();return;}if(modal)return;
 if(a==='home'){if(online)stopOnline();screen='home';bonusMode=null;render();return;}if(a==='create'){if(online)stopOnline();onlineSetup=false;screen='create';render();return;}if(a==='resume'){screen='play';render();return;}
 if(a==='npc-pause'){if(online){networkCommand({type:'npc-pause',paused:!onlineView.paused});render();return;}npcPaused=!npcPaused;render();return;}if(a==='npc-speed'){if(online){networkCommand({type:'npc-speed',fast:!onlineView.fast});render();return;}npcFast=!npcFast;render();return;}
 if(a==='start-module'){if(online){networkCommand({type:'start-module'});render();return;}changed=M.startModule(match);if(changed)render();return;}
 if(a==='next-module'){if(online){networkCommand({type:'next-module'});render();return;}changed=M.advance(match);if(changed)render();return;}
 if(!canAct())return;
 if(a==='select-draft-card'||a==='select-draft-token'){
  if(match.phase!=='recovery')return;
  const key=a==='select-draft-card'?'cardId':'tokenId';draftSelection[key]=draftSelection[key]===el.dataset.id?null:el.dataset.id;render();return;
 }
 if(a==='confirm-draft'){changed=command('draft-pair',draftSelection);if(changed)draftSelection={cardId:null,tokenId:null};}
 if(a==='draft')changed=command('draft',{cardId:el.dataset.id});
 if(a==='draft-bonus')changed=command('draft-bonus',{choice:el.dataset.id});
 if(a==='draft-skip')changed=command('draft-skip');
 if(a==='choose'){changed=command('choose',{cardId:el.dataset.id});if(!changed&&['select','ready'].includes(s.phase)){el.classList.remove('card-refused');void el.offsetWidth;el.classList.add('card-refused');el.addEventListener('animationend',()=>el.classList.remove('card-refused'),{once:true});toast(E.typeAllowed(s,s.hand.find(c=>c.uid===el.dataset.id))?'Carte indisponible pour cet essai.':'Ce type n’est pas autorisé maintenant.');}}
 if(a==='roll')changed=command('roll');
 if(a==='die'){const id=Number(el.dataset.id);if(bonusMode){useBonus(id);return;}picked=picked.includes(id)?picked.filter(i=>i!==id):[...picked,id];render();return;}
 if(a==='cancel-bonus'){bonusMode=null;render();return;}
 if(a==='auto')changed=command('auto');
 if(a==='reset-placement')changed=command('reset-placement');
 if(a==='land')changed=command('land');
 if(a==='fall')changed=command('fall',{advance:true});
 if(a==='stop')changed=command('stop');
 if(a==='continue')changed=command('continue');
 if(a==='pass')changed=command('pass');
 if(a==='proceed')changed=command('proceed');
 if(a==='claim')changed=command('claim',{choice:el.dataset.id});
 if(a==='claim-sequence')changed=command('claim-sequence',{choice:el.dataset.id,advance:true});
 if(a==='reroll')changed=command('bonus',{bonusType:'reroll'});
 if(['minus','plus','freeze'].includes(a)){bonusMode={type:a==='freeze'?'freeze':a==='reroll'?'reroll':'adjust',delta:a==='minus'?-1:1};if(picked.length===1)useBonus(picked[0]);else{picked=[];render();}return;}
 if(a==='export'){const url=URL.createObjectURL(new Blob([JSON.stringify({...match,summary:M.matchSummary(match)},null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='sk8-heroes-session.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 if(changed){picked=[];bonusMode=null;render();}
});
// Click/keyboard alternative to dragging: select dice, then click the active card or reserve.
root.addEventListener('click',e=>{
 if(modal||!isBoard()||!canAct()||!picked.length||e.target.closest('[data-action]'))return;
 const zone=e.target.closest('[data-drop]');if(!zone||!['trick','dice'].includes(zone.dataset.drop))return;
 if(placeDice(picked,zone.dataset.drop==='trick')){picked=[];render();}else toast('Ces dés ne correspondent pas aux emplacements libres.');
});
root.addEventListener('submit',async e=>{if(e.target.id==='online-reconnect'){e.preventDefault();const data=new FormData(e.target);onlineBusy=true;onlineError='';render();try{await connectOnline({roomId:onlineJoinLobby.roomId,token:String(data.get('code')).trim()});}catch(error){online?.stop();online=null;onlineView=null;screen='join';onlineError=error.message;}finally{onlineBusy=false;render();}return;}if(e.target.id==='online-join'){e.preventDefault();const data=new FormData(e.target);onlineBusy=true;onlineError='';render();try{const joined=await onlineApi('rooms/'+onlineJoinLobby.roomId+'/join',{method:'POST',body:{name:data.get('name'),seatId:data.get('seatId'),skaterId:data.get('skaterId')}});await connectOnline(joined);}catch(error){onlineError=error.message;onlineJoinLobby=await onlineApi('rooms/'+onlineJoinLobby.roomId+'/lobby').catch(()=>onlineJoinLobby);}finally{onlineBusy=false;render();}return;}if(e.target.id!=='setup')return;e.preventDefault();const data=new FormData(e.target);if(data.get('online')==='yes'){onlineBusy=true;e.target.querySelector('button[type="submit"]').disabled=true;try{const created=await onlineApi('rooms',{method:'POST',localKey:onlineInfo?.localKey,body:{name:data.get('name'),skaterId:data.get('skaterId'),npcCount:Number(data.get('npcCount')),npcDifficulty:data.get('npcDifficulty'),mode:data.get('mode')}});await connectOnline(created);}catch(error){toast(error.message);}finally{onlineBusy=false;render();}return;}viewedPlayerId=null;feedback.reset();match=M.newMatch({name:data.get('name'),skaterId:data.get('skaterId'),length:Number(data.get('length')),npcCount:Number(data.get('npcCount')),npcDifficulty:data.get('npcDifficulty'),mode:data.get('mode')});s=M.currentPlayer(match).game;animatedRecaps.clear();draftSelection={cardId:null,tokenId:null};npcPaused=false;screen='play';picked=[];bonusMode=null;render();});
root.addEventListener('keydown',e=>{const el=e.target.closest('[data-action]');if(['inspect-played','inspect-park'].includes(el?.dataset.action)&&['Enter',' '].includes(e.key)){e.preventDefault();el.click();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal){closeModal();render();}});
window.addEventListener('pagehide',()=>{if(match&&!online){M.setClockRunning(match,false);save();}});
window.addEventListener('pageshow',()=>{if(match&&!online)M.setClockRunning(match,(screen==='play'||screen==='cards'&&libraryReturnScreen==='play')&&!npcPaused);});
render();
bootOnline();
