import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildV2,directory as v2Directory} from './theory85-modules-v2.mjs';
import {root,productionHashes} from './theory85-runtime.mjs';

export const directory=path.join(root,'.local-games/theory85-modules-v3-runtime');
export const changes={
 0:{kind:'no-reroll',condition:'Conserver la séquence sans utiliser de relance ; ±1 et gel permis.'},
 2:{kind:'mixed-tiers',condition:'Réussir une Base et une Avancée dans le même essai, dans n’importe quel ordre.'},
 6:{kind:'token-rescue',condition:'Réussir un trick initialement impossible après un ±1 utilisé sur la carte ou une relance.'},
 7:{kind:'one-pair',condition:'Utiliser au moins une paire physique sur une carte de la séquence.'},
 8:{kind:'distinct-faces',minDistinct:4,condition:'Utiliser au moins quatre valeurs physiques différentes dans la séquence.'},
 9:{kind:'one-card-effect',condition:'Activer le bonus de points d’au moins une carte.'},
 10:{kind:'two-tricks',condition:'Conserver exactement deux tricks, quel que soit le nombre de dés utilisés.'}
};
function replace(s,a,b){assert(s.includes(a),'V3 patch missing: '+a.slice(0,100));return s.replace(a,b);}

const forecast=`// Conditional normal-face distributions are planning estimates only.
const maskCache=new Map(),varietyCache=new Map();
const popcount=Array.from({length:64},(_,mask)=>mask.toString(2).replaceAll('0','').length);
const faceMask=dice=>dice.reduce((mask,d)=>mask|(1<<(d.face-1)),0);
function normalMasks(card){
 if(maskCache.has(card.id))return maskCache.get(card.id);
 const counts=new Map();let total=0;
 function walk(a){if(a.length===card.cost){if(matches(card,a)){const mask=a.reduce((m,v)=>m|(1<<(v-1)),0);counts.set(mask,(counts.get(mask)||0)+1);total++;}return;}for(let v=1;v<=6;v++)walk([...a,v]);}
 walk([]);const result=[...counts].map(([mask,n])=>[mask,n/total]);maskCache.set(card.id,result);return result;
}
function distinctForecast(cards,known,minimum){
 const key=minimum+':'+cards.map((c,i)=>known[i]?'k'+faceMask(known[i].dice):'u'+c.id).join(',');
 if(varietyCache.has(key))return varietyCache.get(key);
 let distribution=new Map([[0,1]]);
 for(let i=0;i<cards.length;i++){
  const options=known[i]?[[faceMask(known[i].dice),1]]:normalMasks(cards[i]),next=new Map();
  for(const [a,p]of distribution)for(const [b,q]of options)next.set(a|b,(next.get(a|b)||0)+p*q);
  distribution=next;
 }
 const probability=[...distribution].reduce((n,[mask,p])=>n+(popcount[mask]>=minimum?p:0),0);varietyCache.set(key,probability);return probability;
}
`;

export async function buildV3(){
 const before=await productionHashes();await buildV2();await mkdir(directory,{recursive:true});
 for(const file of (await readdir(v2Directory)).filter(n=>n.endsWith('.js')))await writeFile(path.join(directory,file),await readFile(path.join(v2Directory,file)));
 const p=JSON.parse(await readFile(path.join(root,'tests/fixtures/theory85-modules-v2.json'),'utf8'));
 p.version=3;p.targetFloor=.25;p.bonusPerAttempt=true;p.modules=p.modules.map(m=>changes[m.id]?{...m,bonus:{kind:changes[m.id].kind,minimumTricks:2,...(changes[m.id].minDistinct?{minDistinct:changes[m.id].minDistinct}:{})},condition:changes[m.id].condition}:m);
 await writeFile(path.join(root,'tests/fixtures/theory85-modules-v3.json'),JSON.stringify(p,null,2));
 let data=await readFile(path.join(directory,'data.js'),'utf8');data=data.replace(/export const MODULES=.*?;\n/,`export const MODULES=${JSON.stringify(p.modules)};\n`);await writeFile(path.join(directory,'data.js'),data);
 let rules=await readFile(path.join(directory,'module-rules.js'),'utf8');
 rules=replace(rules,"case 'no-token':return !!s&&complete&&Object.values(s.used).every(n=>n===0);","case 'no-reroll':return !!s&&complete&&(s.used.reroll||0)===0;");
 rules=replace(rules,"case 'base-advanced':return cards.some((c,i)=>c.tier==='base'&&cards[i+1]?.tier==='advanced');","case 'mixed-tiers':return cards.some(c=>c.tier==='base')&&cards.some(c=>c.tier==='advanced');");
 rules=replace(rules,"case 'reroll-rescue':return entries.some(e=>e.initialPossible===false&&e.rerolls>0);","case 'token-rescue':return entries.some(e=>e.initialPossible===false&&(e.rerolls>0||e.adjustedDice?.length>0));");
 rules=replace(rules,"case 'two-pairs':return entries.filter(e=>new Set(faces(e)).size<e.dice.length).length>=2;","case 'one-pair':return entries.some(e=>new Set(faces(e)).size<e.dice.length);");
 rules=replace(rules,"case 'two-card-effects':return cards.filter((c,i)=>c.comboBonus?.kind==='companion'&&cards.some((d,j)=>i!==j&&d.type===c.comboBonus.type)).length>=2;","case 'one-card-effect':return cards.some((c,i)=>c.comboBonus?.kind==='companion'&&cards.some((d,j)=>i!==j&&d.type===c.comboBonus.type));");
 rules=replace(rules,"case 'last-epic':return cards.at(-1).tier==='epic';","case 'distinct-faces':return new Set(entries.flatMap(e=>faces(e))).size>=b.minDistinct;");
 rules=replace(rules,"case 'two-unused':return cards.length===2&&cards.reduce((n,c)=>n+c.cost,0)===4;","case 'two-tricks':return cards.length===2;");
 await writeFile(path.join(directory,'module-rules.js'),rules);
 let trace=await readFile(path.join(directory,'module-trace.js'),'utf8');
 trace=replace(trace,'rerolls:0};t.protected=[];','rerolls:0,adjusted:[]};t.protected=[];');
 trace=replace(trace,'export function recordLanding(s){',"export function recordAdjustment(s,id){if(s.moduleTrace.current&&!s.moduleTrace.current.adjusted.includes(id))s.moduleTrace.current.adjusted.push(id);}\nexport function recordLanding(s){");
 trace=replace(trace,'rerolls:t.current?.rerolls||0,carriedFrozen:', 'rerolls:t.current?.rerolls||0,adjustedDice:s.pending.filter(id=>t.current?.adjusted?.includes(id)),carriedFrozen:');
 trace=replace(trace,"case 'no-token':p=Object.values(s.used).some(n=>n>0)?0:.5;break;","case 'no-reroll':p=s.used.reroll>0?0:.65;break;");
 trace=replace(trace,"case 'reroll-rescue':p=known.some(e=>e?.initialPossible===false&&e.rerolls>0)?1:s.bank.reroll>0?.3:0;break;","case 'token-rescue':p=known.some(e=>e?.initialPossible===false&&(e.rerolls>0||e.adjustedDice?.length))?1:s.bank.reroll>0||s.bank.adjust>0?.5:0;break;");
 trace=replace(trace,"case 'two-pairs':{","case 'one-pair':{");
 trace=replace(trace,'}p=dist[2];break;','}p=dist[1]+dist[2];break;');
 trace=replace(trace,'  default:return null;',"  case 'distinct-faces':p=distinctForecast(cards,known,module.bonus.minDistinct);break;\n  default:return null;");
 trace=forecast+trace; // Imports remain top-level; function bodies run after module initialization.
 await writeFile(path.join(directory,'module-trace.js'),trace);
 let turn=await readFile(path.join(directory,'turn.js'),'utf8');turn=replace(turn,'recordFreeze,recordLanding','recordFreeze,recordLanding,recordAdjustment');
 turn=replace(turn,'s.bank[type]--;s.used[type]=Number(s.used[type])+1;return true;',"s.bank[type]--;s.used[type]=Number(s.used[type])+1;if(type==='adjust')recordAdjustment(s,id);return true;");
 await writeFile(path.join(directory,'turn.js'),turn);
 assert.deepEqual(await productionHashes(),before);return {directory,version:3,modules:p.modules};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await buildV3()));
