import * as E from './engine.js';

export const INITIAL_TYPES=['kick','kick','slide','slide','air','air'];
export const passingDraft=m=>m.initialDraft==='pass-right-v1';
export const waitingForPick=(m,id)=>m.phase==='initial'&&passingDraft(m)&&!Object.hasOwn(m.initialSelections,id);
export const canInitialPick=(m,id)=>m.phase==='initial'&&(passingDraft(m)?waitingForPick(m,id)&&m.players.find(p=>p.id===id)?.game.offer.length>0:m.players[m.active]?.id===id);
export const concurrentInitialChoice=(m,c)=>passingDraft(m)&&waitingForPick(m,c.playerId)&&c.type==='draft'&&c.draftRound===m.draftRound&&m.players.find(p=>p.id===c.playerId)?.game.offer.includes(c.cardId);

function refill(m,rng){
 const reserved=new Set(Object.values(m.initialPackets).flat()),type=INITIAL_TYPES[m.draftRound];
 for(const seat of m.order){
  const p=m.players[seat],packet=m.initialPackets[p.id];
  const tiers=packet.length===0?['base','base','advanced']:['advanced'];
  for(const tier of tiers){
   const pool=E.shuffle(m.deck.filter(c=>c.type===type&&c.tier===tier&&!reserved.has(c.uid)),rng);
   const existing=packet.map(uid=>m.deck.find(c=>c.uid===uid)?.id);
   const card=pool.find(c=>!existing.includes(c.id))||pool[0];
   if(!card)throw Error('Pioche insuffisante pour le draft de départ');
   packet.push(card.uid);reserved.add(card.uid);
  }
  p.game.offer=[...packet];
 }
}
export function initializePassingDraft(m,rng){
 m.initialDraft='pass-right-v1';m.initialSelections={};m.initialPackets=Object.fromEntries(m.players.map(p=>[p.id,[]]));
 refill(m,rng);m.active=m.order[0];m.lastEvent='Choix simultané : une carte parmi trois.';
}
export function chooseInitial(m,command,rng){
 const p=m.players.find(p=>p.id===command.playerId),g=p?.game;
 if(!p||!canInitialPick(m,p.id)||!g.offer.includes(command.cardId)||!m.initialPackets[p.id].includes(command.cardId))return false;
 if(command.draftRound!==undefined&&command.draftRound!==m.draftRound)return false;
 if(!E.choose(g,command.cardId,rng))return false;
 m.initialPackets[p.id]=m.initialPackets[p.id].filter(uid=>uid!==command.cardId);m.initialSelections[p.id]=command.cardId;m.revision++;
 if(m.players.some(p=>waitingForPick(m,p.id))){m.active=m.order.find(seat=>waitingForPick(m,m.players[seat].id));m.lastEvent=`${g.name} est prêt. Les autres choisissent.`;return true;}
 // Reveal in table order, after everyone has committed. Arrival order cannot
 // change the cards passed, the random refill, or the public choice history.
 for(const seat of m.order){const player=m.players[seat],card=player.game.hand.find(c=>c.uid===m.initialSelections[player.id]);m.draftLog.push({module:0,kind:'initial',round:m.draftRound,playerId:player.id,action:'draft',name:card.name,bonus:null});}
 m.draftRound++;m.initialSelections={};
 if(m.draftRound===6){m.initialPackets={};m.phase='draft-summary';m.active=0;m.lastEvent='Les six cartes de chaque joueur sont choisies.';return true;}
 if(m.draftRound%2===1){
  const previous=m.initialPackets;
  m.initialPackets=Object.fromEntries(m.order.map((seat,i)=>[m.players[seat].id,[...previous[m.players[m.order[(i-1+m.order.length)%m.order.length]].id]]]));
  m.lastEvent='Les deux cartes passent à droite. Une carte du même type est ajoutée.';
 }else{
  m.initialPackets=Object.fromEntries(m.players.map(p=>[p.id,[]]));m.lastEvent='Nouveau type : chacun reçoit trois cartes.';
 }
 refill(m,rng);m.active=m.order[0];return true;
}
export function validatePassingDraft(m){
 if(!passingDraft(m)||m.phase!=='initial')return;
 if(!Number.isInteger(m.draftRound)||m.draftRound<0||m.draftRound>5||!m.initialPackets||!m.initialSelections)throw Error('Draft de départ incompatible');
 const reserved=Object.values(m.initialPackets).flat(),deck=new Map(m.deck.map(c=>[c.uid,c]));
 if(new Set(reserved).size!==reserved.length||reserved.some(uid=>deck.get(uid)?.type!==INITIAL_TYPES[m.draftRound]))throw Error('Paquets du draft incompatibles');
 for(const p of m.players){const selected=m.initialSelections[p.id],packet=m.initialPackets[p.id];if(!packet||packet.length!==(selected?2:3)||selected&&!p.game.hand.some(c=>c.uid===selected)||p.game.hand.length!==m.draftRound+Number(!!selected)||!selected&&JSON.stringify(packet)!==JSON.stringify(p.game.offer))throw Error('Choix du draft incompatibles');}
}
