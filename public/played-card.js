import {sequenceScore} from './engine.js';

export function attemptSnapshot(match,playerId,attempt,moduleIndex=null){
 const player=match.players.find(p=>p.id===playerId);if(!player||![0,1].includes(attempt))return null;
 const g=player.game,index=moduleIndex??g.module,history=g.history?.[index];
 const record=history?.attempts?.[attempt]||(index===g.module?g.attempts[attempt]:null);
 const sequence=(history?.sequences||(index===g.module?g.sequences:[])).find(s=>s.attempt===attempt);
 if(!record&&!sequence)return null;
 const points=record?.points??sequence.points,reason=record?.reason||'stop',used=new Set();
 const entries=record?.entries||sequence?.entries||(record?.cards||[]).map(name=>{const card=g.hand.find(c=>c.name===name&&!used.has(c.uid));if(card)used.add(card.uid);return card?{card:card.uid,dice:[],bonus:0,confirmed:true}:null;}).filter(Boolean);
 const cards=entries.map(e=>{const card=g.hand.find(c=>c.uid===e.card);return card?{card,dice:e.dice,ids:e.dice.map(d=>d.id),bonus:e.bonus||0,confirmed:e.confirmed!==false,status:reason==='fall'?'Chute · points perdus':e.confirmed===false?'Trick raté':'✓ Réussi'}:null;}).filter(Boolean);
 return structuredClone({playerId,playerName:g.name,skaterId:g.skaterId,attempt,moduleIndex:index,points,reason,cards});
}

// A detached snapshot keeps an enlarged card stable even if the online game
// advances, clears the table, or rolls the same physical dice again.
export function playedCardSnapshot(match,playerId,cardId,attempt=null,moduleIndex=null){
 const player=match.players.find(p=>p.id===playerId),g=player?.game,card=g?.hand.find(c=>c.uid===cardId);
 if(!card)return null;
 let dice,ids,bonus=0,confirmed=false,status;
 if(attempt!==null){
  const group=attemptSnapshot(match,playerId,attempt,moduleIndex),entry=group?.cards.find(e=>e.card.uid===cardId);if(!entry)return null;
  dice=entry.dice;ids=entry.ids;bonus=entry.bonus;confirmed=entry.confirmed;status=group.reason==='fall'?'Chute · points perdus':`Essai ${attempt+1} conservé · ${group.points} pts`;
 }else{
  const entry=g.landed.find(e=>e.card===cardId);
  if(!entry&&g.active!==cardId)return null;
  ids=entry?entry.dice:g.pending;dice=ids.map(id=>g.dice[id]);confirmed=!!entry;
  bonus=sequenceScore(g.landed.map(e=>g.hand.find(c=>c.uid===e.card))).details.find(d=>d.card===cardId)?.points||0;
  status=g.reason==='fall'?'Chute · points perdus':confirmed?'Trick réussi':g.phase==='ready'?'Carte engagée':'À valider';
 }
 return structuredClone({card,dice,ids,bonus,confirmed,status,playerName:g.name,skaterId:g.skaterId,attempt:attempt??g.attempt});
}
