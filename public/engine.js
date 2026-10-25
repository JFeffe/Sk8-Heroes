import {TRICKS,MODULES,makeDeck} from './data.js';
export const shuffle=(a,rng=Math.random)=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export const difficulty=c=>Math.max(2,c.difficulty-(c.upgraded?1:0));
export const value=d=>d.face+d.boost;
export const currentModule=s=>MODULES[s.route[s.module]];
export const selectedCards=s=>s.selected.map(id=>s.hand.find(c=>c.uid===id));
export function legal(cards,m){
 if(!cards.length||cards.length>3)return false;
 if(cards.length<(m.minCards||1))return false;
 if(cards.length>1&&cards.some(c=>c.effect==='solo'))return false;
 const types=cards.map(c=>c.type);
 for(const t of m.needs){const i=types.indexOf(t);if(i<0)return false;types.splice(i,1);}
 return true;
}
export function evaluate(cards,dice,allocation,m){
 const totals=cards.map(c=>dice.reduce((n,d,i)=>n+(allocation[i]===c.uid?value(d):0),0));
 const counts=cards.map(c=>allocation.filter(id=>id===c.uid).length);
 const met=cards.map((c,i)=>counts[i]>0&&totals[i]>=difficulty(c));
 const combo=cards.length===3?6:cards.length===2?2:0;
 let points=cards.reduce((n,c)=>n+c.points,0)+combo;
 cards.forEach((c,i)=>{
  const others=cards.filter((_,j)=>i!==j);
  if(c.effect==='kick'&&others.some(x=>x.type==='kick'))points++;
  if(c.effect==='air'&&others.some(x=>x.type==='air'))points+=2;
  if(c.effect==='slide'&&others.some(x=>x.type==='slide'))points+=2;
  if(c.effect==='variety'&&new Set(cards.map(x=>x.type)).size===3)points+=2;
  if(c.effect==='exact'&&totals[i]===difficulty(c))points+=2;
  if(c.effect==='one'&&counts[i]===1)points+=2;
 });
 return {success:legal(cards,m)&&met.every(Boolean)&&points>=m.min,points,totals,counts,met,combo};
}
export function autoAssign(cards,dice,m){
 let best=null,quality=-Infinity,a=Array(dice.length).fill(null);
 function walk(i){
  if(i===dice.length){const e=evaluate(cards,dice,a,m);const q=e.success?100000+e.points:e.met.filter(Boolean).length*1000+e.totals.reduce((n,t,j)=>n+Math.min(t,difficulty(cards[j]))/difficulty(cards[j]),0);if(q>quality){quality=q;best=[...a];}return;}
  for(const c of [null,...cards]){a[i]=c?.uid||null;walk(i+1);}
 }
 walk(0);return best;
}
export function newGame({name='Rider',length=6}={},rng=Math.random){
 const route=[...shuffle(MODULES.filter(m=>m.stage===0),rng).slice(0,length===6?2:1),...shuffle(MODULES.filter(m=>m.stage===1),rng).slice(0,length===6?3:2),...shuffle(MODULES.filter(m=>m.stage===2),rng).slice(0,1)].map(m=>m.id);
 const s={version:1,name:name.trim().slice(0,24)||'Rider',route,module:0,attempt:0,phase:'initial',deck:shuffle(makeDeck(),rng),hand:[],offer:[],selected:[],locked:[],dice:[],allocation:[],bank:{boost:0,reroll:1},used:{boost:false,reroll:false},earned:{boost:false,reroll:false},attempts:[],history:[],pv:0,created:Date.now()};
 offer(s,rng);return s;
}
export function offer(s,rng=Math.random){
 const type=['kick','kick','slide','slide','air','air'][s.hand.length];
 const pool=s.phase==='initial'?s.deck.filter(c=>c.type===type&&(c.type==='air'?c.difficulty<=10:c.difficulty<=7)):s.deck;
 const different=[...new Map(shuffle(pool,rng).map(c=>[c.id,c])).values()];
 s.offer=different.slice(0,3).map(c=>c.uid);
}
export function choose(s,uid,rng=Math.random){
 if(!['initial','draft'].includes(s.phase)||!s.offer.includes(uid))return false;
 const i=s.deck.findIndex(c=>c.uid===uid);if(i<0)return false;
 s.hand.push(s.deck.splice(i,1)[0]);s.offer=[];
 if(s.phase==='initial'&&s.hand.length<6){offer(s,rng);}else if(s.phase==='draft'){s.module++;resetModule(s);}else s.phase='select';
 return true;
}
function resetModule(s){s.attempt=0;s.attempts=[];s.locked=[];s.selected=[];s.dice=[];s.allocation=[];s.earned={boost:false,reroll:false};s.used={boost:false,reroll:false};s.phase='select';}
export function toggle(s,uid){if(s.phase!=='select'||s.locked.includes(uid)||!s.hand.some(c=>c.uid===uid))return false;const i=s.selected.indexOf(uid);if(i>=0)s.selected.splice(i,1);else if(s.selected.length<3)s.selected.push(uid);return true;}
export function roll(s,rng=Math.random){if(s.phase!=='select'||!legal(selectedCards(s),currentModule(s)))return false;s.dice=Array.from({length:6},()=>({face:1+Math.floor(rng()*6),boost:0}));s.allocation=Array(6).fill(null);s.used={boost:false,reroll:false};s.phase='roll';return true;}
export function assign(s,die,uid){if(s.phase!=='roll'||die<0||die>=6||uid!==null&&!s.selected.includes(uid))return false;s.allocation[die]=uid;return true;}
export function bonus(s,type,die,rng=Math.random){if(s.phase!=='roll'||!['boost','reroll'].includes(type)||s.used[type]||s.bank[type]<=0||!s.dice[die])return false;s.bank[type]--;s.used[type]=true;if(type==='boost')s.dice[die].boost+=2;else s.dice[die].face=1+Math.floor(rng()*6);return true;}
export function resolve(s,pass=false){
 if(pass?s.phase!=='select':s.phase!=='roll')return false;
 const cards=selectedCards(s);const e=pass?{success:false,points:0}:evaluate(cards,s.dice,s.allocation,currentModule(s));
 const outcome={success:e.success,points:e.success?e.points:0,cards:cards.map(c=>c.name),pass};
 s.attempts.push(outcome);s.last=outcome;
 if(e.success){s.locked.push(...s.selected);for(const t of ['boost','reroll'])if(cards.some(c=>c.effect===t))s.earned[t]=true;}
 s.phase='result';return true;
}
export function proceed(s){
 if(s.phase!=='result')return false;
 if(s.attempt===0){s.attempt=1;s.selected=[];s.dice=[];s.allocation=[];s.phase='select';return true;}
 const m=currentModule(s),best=Math.max(...s.attempts.map(a=>a.points)),success=s.attempts.some(a=>a.success);
 s.history.push({module:m.id,best,total:s.attempts.reduce((n,a)=>n+a.points,0),attempts:JSON.parse(JSON.stringify(s.attempts)),pv:success?m.pv:0});s.pv+=success?m.pv:0;
 if(s.module===s.route.length-1){s.phase='complete';return true;}
 // Earned trick bonuses are deferred until the module is over; capacity is three.
 for(const t of ['boost','reroll'])if(s.earned[t])addBonus(s,t);
 s.reward=success?m.reward:'choice';
 if(s.reward==='upgrade'&&!s.hand.some(c=>!c.upgraded))s.reward='choice';
 s.phase='reward';return true;
}
export function addBonus(s,t){if(s.bank.boost+s.bank.reroll>=3)return false;s.bank[t]++;return true;}
export function claim(s,choice,rng=Math.random){
 if(s.phase!=='reward')return false;
 if(s.reward==='upgrade'){const c=s.hand.find(c=>c.uid===choice);if(!c||c.upgraded)return false;c.upgraded=true;}
 else {const type=s.reward==='choice'?choice:s.reward;if(!['boost','reroll'].includes(type))return false;addBonus(s,type);}
 s.reward=null;s.phase='draft';offer(s,rng);return true;
}
