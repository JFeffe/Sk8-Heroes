import assert from 'node:assert/strict';
import {MODULES} from '../public/data.js';

// Independent necessary-condition audit, without the NPC planner or its odds:
// a bonus needs a legal potential scoring sequence or a strictly positive
// token balance. Unknown dice-dependent points use conservative upper bounds.
export function auditObjectiveSpend(g,context,action){
 if(action.type!=='bonus')return null;
 const module=MODULES[g.route[g.module]],ownBest=Math.max(0,...g.attempts.map(a=>a.points)),leader=context.leader||0;
 const spent=Object.values(g.used||{}).reduce((a,b)=>a+b,0)+1+(action.bonusType==='freeze'&&g.phase==='rolled'?1:0);
 const landed=g.landed.map(e=>g.hand.find(c=>c.uid===e.card));
 const available=g.hand.filter(c=>!g.secured.includes(c.uid)&&!landed.some(x=>x.uid===c.uid));
 const committed=g.phase==='rolled'?g.active:null;
 let scoring=false,profitable=false,paths=0;
 function walk(cards,remaining,dice,root){
  const needs=module.needs.length===2?module.needs.filter(t=>!cards.some(c=>c.type===t)):cards.length?[]:module.needs;
  if(!root&&cards.length&&(module.needs.length!==2||needs.length===0)){
   paths++;let points=cards.reduce((n,c)=>n+c.points,0),tokens=0;
   for(const [i,c]of cards.entries()){
    const b=c.comboBonus;
    if(b?.kind==='reward')tokens++;
    if(b?.kind==='companion'&&cards.some((x,j)=>i!==j&&x.type===b.type))points+=b.points;
    if(b?.kind==='variety'&&new Set(cards.map(x=>x.type)).size===3)points+=b.points;
   }
   const b=module.bonus;
   if(b.kind==='base')points+=cards.filter(c=>c.tier==='base').length*b.points;
   if(b.kind==='favored')points+=cards.filter(c=>c.type===b.type).length*b.points;
   if(b.kind==='amplitude')points+=cards.filter(c=>c.cost>=b.minimumDice).length*b.points;
   if(b.kind==='signature')points+=b.points;
   if(b.kind==='stars')points+=cards.reduce((n,c)=>n+c.cost,0)*b.points;
   if(cards.length===3){points+=b.kind==='three-score'?b.points:1;tokens+=b.kind==='three-tokens'?b.tokens:1;}
   if(cards.length===2&&b.kind==='recovery')tokens+=b.tokens;
   scoring||=points>ownBest&&points>=leader;
   profitable||=tokens>spent;
  }
  if(cards.length===3||scoring&&profitable)return;
  const seen=new Set();
  for(const c of remaining){
   if(c.cost>dice||needs.length&&!needs.includes(c.type)||root&&committed&&c.uid!==committed||seen.has(c.id))continue;
   seen.add(c.id);walk([...cards,c],remaining.filter(x=>x.uid!==c.uid),dice-c.cost,false);
  }
 }
 walk(landed,available,6-landed.reduce((n,c)=>n+c.cost,0),true);
 assert(scoring||profitable,'Pointless bonus: '+JSON.stringify({attempt:g.attempt,leader,ownBest,spent,action,hand:g.hand.map(c=>c.name)}));
 return {scoring,profitable,paths};
}
