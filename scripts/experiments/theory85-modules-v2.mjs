import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {root,buildRuntime,generateOdds,productionHashes} from './theory85-runtime.mjs';

export const directory=path.join(root,'.local-games/theory85-modules-v2-runtime');
export const definitions=[
 ['no-token','Conserver au moins deux tricks sans dépenser de jeton.'],
 ['shared-face','Une même face physique sur deux cartes différentes.'],
 ['base-advanced','Une Base immédiatement suivie d’une Avancée.'],
 ['increasing-points','Points imprimés strictement croissants.'],
 ['own-die-last','Utiliser le dé de sa couleur sur le dernier trick.'],
 ['carried-freeze','Utiliser un dé gelé ayant été conservé lors d’un jet entre deux tricks.'],
 ['reroll-rescue','Réussir après une relance un trick dont le premier jet était insuffisant.'],
 ['two-pairs','Une paire sur chacune de deux cartes différentes.'],
 ['last-epic','Terminer par une Épique.'],
 ['two-card-effects','Activer les bonus de points de deux cartes différentes.'],
 ['two-unused','Conserver exactement deux tricks et laisser deux dés inutilisés.'],
 ['all-dice','Poser les six dés sur les cartes réussies.']
];
export async function proposal(){
 const v1=JSON.parse(await readFile(path.join(root,'tests/fixtures/theory85-modules-v1.json'),'utf8'));
 return {...v1,version:2,minimumTricks:2,physicalFaces:true,modules:v1.modules.map(m=>({...m,needs:m.id===8?[]:m.needs,bonus:{kind:definitions[m.id][0],minimumTricks:2},condition:definitions[m.id][1]}))};
}
function replace(s,a,b){assert(s.includes(a),'V2 patch missing: '+a.slice(0,110));return s.replace(a,b);}

const rules=`// Experimental V2. Only landed snapshots and actual actions award points.
export function evidence(cards,s){
 const entries=(s?.moduleTrace?.entries||[]).filter(e=>cards.some(c=>c.uid===e.card));
 return {entries,complete:entries.length===cards.length};
}
export function moduleBonusEarned(module,cards,s=null){
 const b=module?.bonus;if(!b||cards.length<(b.minimumTricks||2))return false;
 const {entries,complete}=evidence(cards,s),faces=e=>e.dice.map(d=>d.face);
 switch(b.kind){
  case 'no-token':return !!s&&complete&&Object.values(s.used).every(n=>n===0);
  case 'shared-face':return entries.some((a,i)=>entries.some((b,j)=>j>i&&faces(a).some(v=>faces(b).includes(v))));
  case 'base-advanced':return cards.some((c,i)=>c.tier==='base'&&cards[i+1]?.tier==='advanced');
  case 'increasing-points':return cards.every((c,i)=>!i||c.points>cards[i-1].points);
  case 'own-die-last':{const last=entries.find(e=>e.card===cards.at(-1).uid);return !!last&&last.dice.some(d=>d.color===s?.moduleTrace?.ownColor);}
  case 'carried-freeze':return entries.some(e=>e.carriedFrozen.length>0);
  case 'reroll-rescue':return entries.some(e=>e.initialPossible===false&&e.rerolls>0);
  case 'two-pairs':return entries.filter(e=>new Set(faces(e)).size<e.dice.length).length>=2;
  case 'two-card-effects':return cards.filter((c,i)=>c.comboBonus?.kind==='companion'&&cards.some((d,j)=>i!==j&&d.type===c.comboBonus.type)).length>=2;
  case 'last-epic':return cards.at(-1).tier==='epic';
  case 'two-unused':return cards.length===2&&cards.reduce((n,c)=>n+c.cost,0)===4;
  case 'all-dice':return cards.reduce((n,c)=>n+c.cost,0)===6;
  default:return false;
 }
}
export const moduleBonusPoints=(module,cards,s=null)=>moduleBonusEarned(module,cards,s)?module.bonusPoints:0;
export const appearanceLabel=m=>m.rounds.length===1?'MANCHE '+m.rounds[0]:'MANCHES '+m.rounds[0]+'–'+m.rounds.at(-1);
export function routeStages(length=6){return length===4?[0,1,1,2]:[0,0,1,1,1,2];}
export function validModuleRoute(route,modules){return Array.isArray(route)&&[4,6].includes(route.length)&&new Set(route).size===route.length&&route.every((id,i)=>Number.isInteger(id)&&modules[id]?.stage===routeStages(route.length)[i]);}
`;
const trace=`import {findMatch,matches} from './combinations.js';
import {wildColor} from './skaters.js';
export const newModuleTrace=()=>({entries:[],current:null,origins:{},protected:[],ownColor:null});
export function recordFreeze(s,id){s.moduleTrace.origins[id]=s.landed.length-(s.active?0:1);}
export function recordRoll(s,first){
 const t=s.moduleTrace;t.ownColor=wildColor(s);
 if(first){t.current={card:s.active,initialPossible:!!findMatch(s.hand.find(c=>c.uid===s.active),s.dice.filter(d=>d.locked===null),wildColor(s)),rerolls:0};t.protected=[];}
 else if(t.current)t.current.rerolls++;
 for(const id of s.frozen||[])if(t.origins[id]<s.landed.length&&!t.protected.includes(id))t.protected.push(id);
}
export function recordLanding(s){
 const t=s.moduleTrace;
 t.entries.push({card:s.active,dice:s.pending.map(id=>({id,color:s.dice[id].color,face:s.dice[id].face})),initialPossible:t.current?.initialPossible??null,rerolls:t.current?.rerolls||0,carriedFrozen:s.pending.filter(id=>t.protected.includes(id))});
}
// Conditional face analysis informs planning; it never awards actual points.
// An ordinary pair pattern guarantees a pair on a normal matching roll, while
// distinct/parity patterns may prohibit one. Joker placement remains uncertain.
const pairCache=new Map();
function normalPairChance(card){
 const key=JSON.stringify([card.pattern,card.cost,card.threshold,card.values,card.choices]);
 if(pairCache.has(key))return pairCache.get(key);
 let total=0,pairs=0;
 function walk(a){if(a.length===card.cost){if(matches(card,a)){total++;pairs+=Number(new Set(a).size<a.length);}return;}for(let face=1;face<=6;face++)walk([...a,face]);}
 walk([]);const p=total?pairs/total:0;pairCache.set(key,p);return p;
}
// Planning estimates never enter real scoring or expose hidden rolls.
export function projectedBonus(module,cards,s){
 if(cards.length<2)return 0;
 const kind=module.bonus?.kind,entries=s.moduleTrace?.entries||[],known=cards.map(c=>entries.find(e=>e.card===c.uid)),unknown=known.filter(e=>!e).length;
 if(!unknown)return null;
 let p=0;
 switch(kind){
  case 'no-token':p=Object.values(s.used).some(n=>n>0)?0:.5;break;
  case 'shared-face':p=known.some((e,i)=>e&&known.some((f,j)=>j>i&&f&&e.dice.some(a=>f.dice.some(b=>a.face===b.face))))?1:.6;break;
  case 'own-die-last':{
   const last=known.at(-1),own=s.moduleTrace?.ownColor;
   if(last)p=last.dice.some(d=>d.color===own)?1:0;
   else{const locked=known.filter(Boolean).flatMap(e=>e.dice),available=6-locked.length;p=locked.some(d=>d.color===own)?0:Math.min(1,cards.at(-1).cost/Math.max(1,available));}break;
  }
  case 'carried-freeze':p=known.some(e=>e?.carriedFrozen.length)?1:(s.frozen?.length?.95:s.bank.freeze>0?.3:0);break;
  case 'reroll-rescue':p=known.some(e=>e?.initialPossible===false&&e.rerolls>0)?1:s.bank.reroll>0?.3:0;break;
  case 'two-pairs':{
   let dist=[1,0,0];
   for(let i=0;i<cards.length;i++){
    const e=known[i],rate=e?Number(new Set(e.dice.map(d=>d.face)).size<e.dice.length):normalPairChance(cards[i])*.95;
    const next=[0,0,0];for(let n=0;n<3;n++){next[n]+=dist[n]*(1-rate);next[Math.min(2,n+1)]+=dist[n]*rate;}dist=next;
   }p=dist[2];break;
  }
  default:return null;
 }
 return (module.bonusPoints||0)*p;
}
`;

export async function buildV2({informedPairs=true}={}){
 const before=await productionHashes(),base=await buildRuntime();await generateOdds(base.directory);await mkdir(directory,{recursive:true});
 for(const file of (await readdir(base.directory)).filter(n=>n.endsWith('.js')))await writeFile(path.join(directory,file),await readFile(path.join(base.directory,file)));
 const p=await proposal();await writeFile(path.join(root,'tests/fixtures/theory85-modules-v2.json'),JSON.stringify(p,null,2));
 let data=await readFile(path.join(directory,'data.js'),'utf8');data=data.replace(/export const MODULES=.*?;\n/,`export const MODULES=${JSON.stringify(p.modules)};\n`);await writeFile(path.join(directory,'data.js'),data);
 let traceSource=trace;
 if(!informedPairs){
  const a=trace.indexOf("  case 'two-pairs':{"),b=trace.indexOf('\n  default:',a);assert(a>=0&&b>a);
  traceSource=trace.slice(0,a)+"  case 'two-pairs':{const n=known.filter(e=>e&&new Set(e.dice.map(d=>d.face)).size<e.dice.length).length;p=n>=2?1:n+unknown<2?0:n===1?.3:.1;break;}"+trace.slice(b);
 }
 await writeFile(path.join(directory,'module-rules.js'),rules);await writeFile(path.join(directory,'module-trace.js'),traceSource);
 let turn=(await readFile(path.join(directory,'turn.js'),'utf8')).replace(/\r\n/g,'\n');
 turn="import {newModuleTrace,recordRoll,recordFreeze,recordLanding} from './module-trace.js';\n"+turn;
 turn=replace(turn,"return {phase:'select'","return {moduleTrace:newModuleTrace(),phase:'select'");
 turn=replace(turn,'sequenceScore(cards,module=null)','sequenceScore(cards,module=null,context=null)');
 turn=replace(turn,'moduleBonusPoints(module,cards)','moduleBonusPoints(module,cards,context)');
 turn=turn.replaceAll('scoringModule(s))','scoringModule(s),s)');
 turn=replace(turn,"s.rolls++;s.phase='rolled';return true;","s.rolls++;s.phase='rolled';recordRoll(s,true);return true;");
 turn=replace(turn,"if(s.phase==='decision')s.phase='select';return true;","recordFreeze(s,id);if(s.phase==='decision')s.phase='select';return true;");
 turn=replace(turn,'s.bank.reroll--;s.used.reroll++;return true;','s.bank.reroll--;s.used.reroll++;recordRoll(s,false);return true;');
 turn=replace(turn,'if(!canLand(s))return false;','if(!canLand(s))return false;recordLanding(s);');
 await writeFile(path.join(directory,'turn.js'),turn);
 let engine=await readFile(path.join(directory,'engine.js'),'utf8');engine=replace(engine,'sequenceScore(cards,currentModule(s))','sequenceScore(cards,currentModule(s),s)');await writeFile(path.join(directory,'engine.js'),engine);
 let view=await readFile(path.join(directory,'npc-view.js'),'utf8');view=replace(view,"'heldLastRoll'","'heldLastRoll','moduleTrace'");await writeFile(path.join(directory,'npc-view.js'),view);
 let planner=await readFile(path.join(directory,'npc-strategy.js'),'utf8');
 planner="import {projectedBonus} from './module-trace.js';\n"+planner;
 planner=replace(planner,'const score=E.sequenceScore(cards,module).points;',`const real=E.sequenceScore(cards,module,g),estimate=projectedBonus(module,cards,g);const score=real.points-real.moduleBonus+(estimate??real.moduleBonus);`);
 planner=replace(planner,'earned:{...g.earned},secured:', 'moduleTrace:structuredClone(g.moduleTrace),earned:{...g.earned},secured:');
 // A new module starts with a new trace, even during hypothetical draft planning.
 planner=replace(planner,"const future={...g,module:g.module+1", "const future={...g,moduleTrace:{entries:[],current:null,origins:{},protected:[],ownColor:g.moduleTrace?.ownColor},used:{adjust:0,reroll:0,freeze:0},module:g.module+1");
 await writeFile(path.join(directory,'npc-strategy.js'),planner);
 assert.deepEqual(await productionHashes(),before);return {directory,informedPairs,modules:p.modules};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await buildV2({informedPairs:!process.argv.includes('--simple-pairs')})));
