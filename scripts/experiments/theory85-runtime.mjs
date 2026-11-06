import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

export const root=fileURLToPath(new URL('../../',import.meta.url));
export const fixture=JSON.parse(await readFile(path.join(root,'tests/fixtures/theory85-catalog.json'),'utf8'));
export async function productionHashes(){
 const files=(await readdir(path.join(root,'public'))).filter(f=>f.endsWith('.js')).map(f=>'public/'+f);
 const result={};for(const file of files)result[file]=createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');return result;
}
function replace(source,before,after){assert(source.includes(before),'Runtime patch target missing: '+before.slice(0,90));return source.replace(before,after);}

export async function buildRuntime(){
 const directory=path.join(root,'.local-games/theory85-runtime');await mkdir(directory,{recursive:true});
 for(const name of (await readdir(path.join(root,'public'))).filter(n=>n.endsWith('.js')))await writeFile(path.join(directory,name),await readFile(path.join(root,'public',name)));
 const original=await import(pathToFileURL(path.join(root,'public/data.js')).href);
 const catalog=fixture.cards.map((c,id)=>({id,name:c.name,type:c.type,tier:c.tier,copies:c.copies,points:c.points,difficultyPoints:c.difficultyPoints,scorePremium:c.scorePremium,...c.requirement,
  comboBonus:c.effect.startsWith('token:')?{kind:'reward',type:c.effect.split(':')[1]}:c.effect.startsWith('point:')?{kind:'companion',type:c.effect.split(':')[1],points:1}:null}));
 assert.equal(catalog.reduce((s,c)=>s+c.copies,0),85);
 await writeFile(path.join(directory,'data.js'),`export const TRICKS=${JSON.stringify(catalog)};\nexport const MODULES=${JSON.stringify(original.MODULES)};\nexport const STAGES=${JSON.stringify(original.STAGES)};\nexport const makeDeck=()=>TRICKS.flatMap(t=>Array.from({length:t.copies},(_,n)=>({...t,uid:t.id+'-'+n})));\nexport const sortHand=a=>[...a].sort((a,b)=>a.id-b.id);\n`);

 let engine=(await readFile(path.join(directory,'engine.js'),'utf8')).replace(/\r\n/g,'\n');
 engine=replace(engine,"BONUS_TYPES.map(type=>[type,false])","BONUS_TYPES.map(type=>[type,0])");
 engine=replace(engine,'s.earned[c.comboBonus.type]=true','s.earned[c.comboBonus.type]=(s.earned[c.comboBonus.type]||0)+1');
 engine=replace(engine,'BONUS_TYPES.filter(t=>s.earned[t]).map(type=>({type,added:addBonus(s,type)}))','BONUS_TYPES.flatMap(type=>Array.from({length:s.earned[type]||0},()=>({type,added:addBonus(s,type)})))');
 await writeFile(path.join(directory,'engine.js'),engine);
 let moduleRules=await readFile(path.join(directory,'module-rules.js'),'utf8');
 moduleRules=replace(moduleRules,"case 'air-four':return cards.some(c=>c.type==='air'&&c.cost===4);", "case 'air-four':return cards.some(c=>c.type==='air'&&c.cost===4);\n  case 'all-dice':return cards.reduce((sum,c)=>sum+c.cost,0)===6;");
 await writeFile(path.join(directory,'module-rules.js'),moduleRules);

 let draft=(await readFile(path.join(directory,'initial-draft.js'),'utf8')).replace(/\r\n/g,'\n');
 const a=draft.indexOf('function refill('),b=draft.indexOf('export function initializePassingDraft',a);assert(a>=0&&b>a);
 draft=draft.slice(0,a)+`function refill(m,rng){
 const reserved=new Set(Object.values(m.initialPackets).flat()),type=INITIAL_TYPES[m.draftRound];
 m.experimentalDraftDraws??=[];
 for(const seat of m.order){
  const p=m.players[seat],packet=m.initialPackets[p.id];
  const tiers=packet.length===0?['base','base','advanced']:['advanced'];
  for(const tier of tiers){
   const pool=E.shuffle(m.deck.filter(c=>c.type===type&&c.tier===tier&&!reserved.has(c.uid)),rng);
   const existing=packet.map(uid=>m.deck.find(c=>c.uid===uid)?.id);
   const card=pool.find(c=>!existing.includes(c.id))||pool[0];if(!card)throw Error('Theory85 initial deck exhausted: '+type+' '+tier);
   packet.push(card.uid);reserved.add(card.uid);m.experimentalDraftDraws.push({round:m.draftRound,player:p.id,type,tier,uid:card.uid});
  }
  p.game.offer=[...packet];
 }
}
`+draft.slice(b);
 await writeFile(path.join(directory,'initial-draft.js'),draft);

 let match=(await readFile(path.join(directory,'match.js'),'utf8')).replace(/\r\n/g,'\n');
 match=replace(match,'get:()=>m.market.cards,enumerable:false','get:()=>[...m.market.cards,...m.deck.filter(c=>({base:0,advanced:1,epic:2}[c.tier])<(m.market.level??0))],enumerable:false');
 match=replace(match,'if(cardIndex<0||tokenIndex<0)return false;',`const reserveIndex=m.deck.findIndex(card=>card.uid===c.cardId&&({base:0,advanced:1,epic:2}[card.tier])<m.market.level);
 if(cardIndex<0&&reserveIndex<0||tokenIndex<0)return false;`);
 match=replace(match,'const card=m.market.cards.splice(cardIndex,1)[0];','const card=cardIndex>=0?m.market.cards.splice(cardIndex,1)[0]:m.deck.splice(reserveIndex,1)[0];');
 match=replace(match,"if(m.position===m.draftOrder.length){\n  m.phase='draft-summary';", "if(m.position===m.draftOrder.length){\n  m.deck.push(...m.market.cards);m.market.cards=[];\n  m.phase='draft-summary';");
 match=replace(match,'const drawn=E.shuffle(m.deck,()=>random(m)).slice(0,m.players.length);',`const level=m.module===0?0:m.module===4?2:1;
 const tier=['base','advanced','epic'][level],eligible=m.deck.filter(c=>c.tier===tier);
 const drawn=E.shuffle(eligible,()=>random(m)).slice(0,m.players.length*2);
 if(drawn.length!==m.players.length*2)throw Error('Theory85 recovery deck exhausted: '+tier+' '+drawn.length);
 m.experimentalMarkets??=[];m.experimentalMarkets.push({module:m.module,tier,size:drawn.length,uids:drawn.map(c=>c.uid)});`);
 match=replace(match,'m.market={cards:drawn,tokens:', 'm.market={level,cards:drawn,tokens:');
 await writeFile(path.join(directory,'match.js'),match);

 let planner=(await readFile(path.join(directory,'npc-strategy.js'),'utf8')).replace(/\r\n/g,'\n');
 planner=replace(planner,'searchDepth=3,chaseFirst=true}={}',"searchDepth=3,chaseFirst=true,strategy='balanced',evaluation='pv'}={}");
 planner=replace(planner,"if(horizon)for(const type of ['adjust','reroll','freeze'])if(!g.earned?.[type]&&cards.some(c=>c.comboBonus?.kind==='reward'&&c.comboBonus.type===type))reward+=tokenValue(type,g);", "if(horizon)for(const c of cards)if(c.comboBonus?.kind==='reward')reward+=tokenValue(c.comboBonus.type,g);");
 planner=replace(planner,'return standing(score)+scoreGain+reward-opportunity;',"return (evaluation==='score'?score+reward*.4-opportunity:standing(score)+scoreGain+reward-opportunity)+cards.reduce((s,c)=>s+preference(c,strategy),0);");
 planner=replace(planner,'export function draftValue(c,g){',"export function draftValue(c,g,strategy='balanced'){");
 planner=replace(planner,"if(c.comboBonus?.kind==='reward'&&!hand.some(x=>x.comboBonus?.kind==='reward'&&x.comboBonus.type===c.comboBonus.type))", "if(c.comboBonus?.kind==='reward'&&(g.phase==='draft'?g.module+1:g.module)<g.route.length-1)");
 planner=replace(planner,'return value;\n}', `if(EXPERIMENT.draftModel==='sequence'&&g.phase==='draft'){
  let cache=draftPlans.get(g);
  if(!cache){
   const future={...g,module:g.module+1,attempt:0,attempts:[],phase:'select',landed:[],secured:[],active:null,pending:[],frozen:[],reuseRoll:false,dice:g.dice.map(d=>({...d,face:null,locked:null,wildValue:null}))};
   const context={strategy,evaluation:'score',searchDepth:3,caution:1};
   cache={future,context,baseline:sequencePlanner(future,context).utility};draftPlans.set(g,cache);
  }
  const next={...cache.future,hand:[...g.hand,c]};
  const withCard=sequencePlanner(next,cache.context).utility;
  const base=Number.isFinite(cache.baseline)?cache.baseline:0;
  return (Number.isFinite(withCard)?withCard-base:0)+value*.12+preference(c,strategy)*.25;
 }
 return value+preference(c,strategy);
}`);
 planner=replace(planner,'earned:{...g.earned},bank:{...g.bank}', 'earned:{...g.earned},secured:[...g.secured],attempts:structuredClone(g.attempts),sequences:structuredClone(g.sequences),bank:{...g.bank}');
 planner=`export const EXPERIMENT={draftModel:'legacy'};const draftPlans=new WeakMap();\nconst preference=(c,strategy)=>strategy==='two'?(c.cost===2?1.5:-1.5):strategy==='three'?(c.cost===3?2:0):strategy==='four'?(c.cost===4?3:0):0;\n`+planner;
 await writeFile(path.join(directory,'npc-strategy.js'),planner);
 let npc=(await readFile(path.join(directory,'npc.js'),'utf8')).replace(/\r\n/g,'\n');
 npc=replace(npc,'draftValue(card,g)','draftValue(card,g,context.strategy)');
 await writeFile(path.join(directory,'npc.js'),npc);

 // New card ids require fresh probability tables. Reusing the deployed tables
 // would silently give the new cards the odds of unrelated old cards.
 await writeFile(path.join(directory,'odds.js'),'export const ODDS={cards:{}};\n');
 return {directory,catalog,modules:original.MODULES};
}

export async function generateOdds(directory){
 const {TRICKS}=await import(pathToFileURL(path.join(directory,'data.js')).href);
 const {rollProbability}=await import(pathToFileURL(path.join(directory,'roll-probability.js')).href);
 const {findMatch}=await import(pathToFileURL(path.join(directory,'combinations.js')).href);
 const {ODDS}=await import(pathToFileURL(path.join(directory,'odds.js')).href);
 const distribution=new Map(),fact=n=>n<2?1:n*fact(n-1);
 function dist(n){if(distribution.has(n))return distribution.get(n);const out=[];function walk(a,start){if(a.length===n){const count=Array(7).fill(0);a.forEach(v=>count[v]++);out.push({faces:a,weight:fact(n)/count.reduce((s,c)=>s*fact(c),1)/6**n});return;}for(let v=start;v<=6;v++)walk([...a,v],v);}walk([],1);distribution.set(n,out);return out;}
 const memo=new Map();
 for(const card of TRICKS){
  const key=JSON.stringify([card.pattern,card.cost,card.values,card.choices,card.threshold]);
  if(memo.has(key)){ODDS.cards[card.id]=memo.get(key);continue;}
  const table={noBonus:{},adjustOnly:{},withWild:{noBonus:{}}};
  for(let n=0;n<=6;n++){
   const pool=Array.from({length:n},(_,id)=>({id,color:id===0?'own':'other',face:null}));
   table.noBonus[n]=rollProbability(card,pool);table.withWild.noBonus[n]=rollProbability(card,pool,'own');
   if(n<card.cost){table.adjustOnly[n]=0;continue;}
   let chance=0;
   for(const {faces,weight}of dist(n)){
    const dice=faces.map((face,id)=>({id,face}));let possible=!!findMatch(card,dice);
    for(let i=0;i<n&&!possible;i++)for(const delta of [-1,1])if(faces[i]+delta>=1&&faces[i]+delta<=6){dice[i].face=faces[i]+delta;possible||=!!findMatch(card,dice);dice[i].face=faces[i];}
    if(possible)chance+=weight;
   }
   table.adjustOnly[n]=chance;
  }
  memo.set(key,table);ODDS.cards[card.id]=table;
 }
 await writeFile(path.join(directory,'odds.js'),'export const ODDS='+JSON.stringify(ODDS)+';\n');
 return ODDS;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=await buildRuntime();await generateOdds(result.directory);console.log(JSON.stringify({directory:result.directory,cards:result.catalog.length,total:85}));
}
