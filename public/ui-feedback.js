import {banked} from './engine.js';

// Read-only presentation snapshots. Effects never dispatch game commands or
// consume randomness, and repeated network snapshots do not replay them.
export function feedbackSnapshot(match,choices={}){
 if(!match)return null;
 return {route:match.route.join(','),phase:match.phase,active:match.players[match.active]?.id,round:match.round,module:match.module,choices:{...choices},players:Object.fromEntries(match.players.map(p=>{
  const g=p.game;
  return [p.id,{turn:`${g.module}:${g.attempt}`,phase:g.phase,reason:g.reason,active:g.active,landed:g.landed.map(e=>e.card),pending:[...g.pending],hand:g.hand.map(c=>c.uid),bank:{...g.bank},points:g.phase==='result'?g.score:banked(g)}];
 }))};
}
export function feedbackChanges(before,after){
 const events=[];if(!before||!after||before.route!==after.route)return events;
 if(after.phase==='playing'&&(before.active!==after.active||before.round!==after.round||before.module!==after.module))events.push({kind:'turn',player:after.active});
 for(const [player,next] of Object.entries(after.players)){
  const old=before.players[player];if(!old)continue;
  if(after.choices[player]&&before.choices[player]!==after.choices[player])events.push({kind:'reserved',player,card:after.choices[player]});
  for(const type of ['adjust','reroll','freeze'])if(next.bank[type]!==old.bank[type])events.push({kind:next.bank[type]>old.bank[type]?'token-gain':'token-spent',player,token:type});
  for(const card of next.hand)if(!old.hand.includes(card))events.push({kind:'card-gain',player,card});
  if(old.turn!==next.turn)continue;
  for(const card of next.landed)if(!old.landed.includes(card))events.push({kind:'land',player,card});
  if(next.landed.length===3&&old.landed.length<3)events.push({kind:'three',player});
  if(next.phase==='rolled'&&old.phase==='rolled'&&next.active===old.active){
   if(next.pending.some(id=>!old.pending.includes(id)))events.push({kind:'place',player,card:next.active});
   else if(old.pending.length&&!next.pending.length)events.push({kind:'return',player});
  }
  if(next.phase==='result'&&old.phase!=='result')events.push({kind:next.reason==='fall'?'fall':'bank',player});
  if(next.points!==old.points)events.push({kind:'points',player,from:old.points,to:next.points});
 }
 return events.map(event=>['land','place','return','fall','bank','points','three'].includes(event.kind)?{...event,turn:after.players[event.player].turn}:event);
}
export const feedbackNumber=(from,to,elapsed,duration=420)=>elapsed>=duration?to:Math.round(from+(to-from)*(1-(1-Math.max(0,elapsed)/duration)**3));

export class UIFeedback{
 constructor(){this.reset();}
 reset(){this.previous=null;this.effects=new Map();this.generation=(this.generation||0)+1;}
 update(match,choices){
  const next=feedbackSnapshot(match,choices),now=performance.now();
  for(const event of feedbackChanges(this.previous,next))this.effects.set([event.player,event.kind,event.card||event.token||''].join(':'),{...event,at:now});
  this.previous=next;
  for(const [key,event] of this.effects)if(now-event.at>850||event.turn&&event.turn!==next?.players[event.player]?.turn)this.effects.delete(key);
 }
 decorate(root,viewerId){
  const generation=++this.generation,now=performance.now(),displayed=root.querySelector('.play-world')?.dataset.viewedPlayer;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mark=(el,name,elapsed)=>{if(!el)return;el.classList.add('fx-'+name);el.style.setProperty('--fx-delay',`-${elapsed}ms`);};
  for(const event of this.effects.values()){
   const elapsed=now-event.at;if(elapsed>800)continue;
   const score=[...root.querySelectorAll('.player-score')].find(el=>el.dataset.id===event.player);
   if(['land','turn','bank'].includes(event.kind))mark(score,'turn',elapsed);
   if(event.kind==='reserved')mark([...root.querySelectorAll('.lobby-rider')].find(el=>el.dataset.id===event.card),'reserved',elapsed);
   if(event.kind==='card-gain'&&event.player===viewerId)mark([...root.querySelectorAll('.draft-hand [data-card]')].find(el=>el.dataset.card===event.card),'draw',elapsed);
   if(event.token){
    if(event.player===displayed)root.querySelectorAll(`.bonus-tools .token-stack.${event.token}`).forEach(el=>mark(el,event.kind,elapsed));
    if(event.player===viewerId)root.querySelectorAll(`.choice-token-stock .token-stack.${event.token}`).forEach(el=>mark(el,event.kind,elapsed));
    mark([...root.querySelectorAll('.draft-player')].find(el=>el.dataset.player===event.player)?.querySelector('.profile-token-counts'),event.kind,elapsed);
   }
   if(event.player!==displayed)continue;
   const world=root.querySelector('.play-world'),card=[...root.querySelectorAll('.trick-space [data-card]')].find(el=>el.dataset.card===event.card);
   if(event.kind==='land')mark(card?.closest('.trick-space'),'land',elapsed);
   if(event.kind==='place')mark(card,'place',elapsed);
   if(event.kind==='return')mark(root.querySelector('.loose-dice'),'return',elapsed);
   if(event.kind==='fall')mark(world?.querySelector('.play-table'),'fall',elapsed);
   if(event.kind==='three')mark(world?.querySelector('.trick-row'),'three',elapsed);
   if(event.kind==='bank')mark(world?.querySelector('.score-token'),'bank',elapsed);
   if(event.kind==='points'){
    mark(world?.querySelector('.live-sequence'),'points',elapsed);
    const node=world?.querySelector('.score-token [data-live-points]');
    if(node&&!reduced&&elapsed<420){
     const tick=()=>{if(generation!==this.generation)return;const t=performance.now()-event.at;node.textContent=String(feedbackNumber(event.from,event.to,t));if(t<420)requestAnimationFrame(tick);};tick();
    }
   }
  }
 }
 reject(element){if(!element)return;element.classList.remove('fx-refused');void element.offsetWidth;element.classList.add('fx-refused');element.addEventListener('animationend',()=>element.classList.remove('fx-refused'),{once:true});}
}
