import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {TRICKS,makeDeck,sortHand} from '../public/data.js';
import * as E from '../public/engine.js';
import * as M from '../public/match.js';
import {ODDS} from '../public/odds.js';
import {renderTrickLayers} from '../public/trick-layers.js';
import {socketLayout,TIER_ORDER} from '../public/trick-presentation.js';
import {cardLibrary} from '../public/card-library.js';

const cmd=(m,type,extra={})=>M.dispatch(m,{playerId:M.currentPlayer(m).id,type,...extra});
const inventory=m=>[...m.deck,...m.market.cards,...m.discard,...m.players.flatMap(p=>p.game.hand)];
function conserved(m){const all=inventory(m);assert.equal(all.length,85);assert.equal(new Set(all.map(c=>c.uid)).size,85);}
function initial(m,advanced=false){while(m.phase==='initial'){const p=M.currentPlayer(m),cards=p.game.offer.map(uid=>m.deck.find(c=>c.uid===uid));assert(!cards.some(c=>c.tier==='epic'));const c=advanced?cards.find(c=>c.tier==='advanced'):cards[0];assert(c);assert(cmd(m,'draft',{cardId:c.uid}));conserved(m);}assert(M.startModule(m));}
function passModule(m){for(let i=0;i<m.players.length*2;i++){assert(cmd(m,'pass'));assert(cmd(m,'proceed'));}assert.equal(m.phase,'recap');}

test('the live deck has 41 distinct tricks and exactly 36 Base, 40 Advanced and 9 Epic physical cards',()=>{
 const deck=makeDeck();assert.equal(TRICKS.length,41);assert.equal(deck.length,85);
 assert.deepEqual(['base','advanced','epic'].map(t=>deck.filter(c=>c.tier===t).length),[36,40,9]);
 assert.deepEqual(['kick','slide','air'].map(type=>TRICKS.filter(c=>c.type===type).length),[16,16,9]);
 assert.equal(new Set(TRICKS.map(c=>c.key)).size,41);
 for(const c of TRICKS){assert.equal(c.id,TRICKS.indexOf(c));assert.equal(c.symbols.length,c.cost);assert(Math.abs(c.p6-ODDS.cards[c.id].noBonus[6])<1e-12);assert.equal(c.points,c.difficultyPoints+(c.cost>=3?2:0));}
});

test('every web card assembles exactly three ordered layers, with live dice inside the semantic layer',()=>{
 for(const c of TRICKS){
  const ids=Array.from({length:c.cost},(_,i)=>i),html=renderTrickLayers(c,{positions:ids,renderDie:id=>`<button data-die="${id}">★</button>`});
  assert.deepEqual([...html.matchAll(/data-card-layer="(\d)"/g)].map(m=>m[1]),['1','2','3']);
  assert.equal((html.match(/<img /g)||[]).length,3);assert.equal((html.match(/data-die=/g)||[]).length,c.cost);
  assert(html.indexOf('data-die=')>html.indexOf('data-card-layer="3"'));assert(html.includes(c.rule.replaceAll('≥','≥')));
  for(const file of Object.values(c.layers)){const url=new URL('../public/'+file,import.meta.url);assert(existsSync(url),file);assert.equal(url.searchParams.get('v'),createHash('sha256').update(readFileSync(url)).digest('hex').slice(0,12));}
  const graphics=readFileSync(new URL('../public/'+c.layers.graphics,import.meta.url),'utf8');assert(!/<text\b|<image\b/.test(graphics));
  const information=readFileSync(new URL('../artwork/cards/tricks/deck-v1/'+c.key+'/03-textes-symboles.svg',import.meta.url),'utf8');assert(!/<image\b/.test(information));assert(information.includes('id="card-score"'));assert(information.includes('id="badge-label"'));
 }
});

test('authoring and interactive dice sockets use the same normalized canvas for two, three and four dice',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../artwork/cards/tricks/deck-v1/manifest.json',import.meta.url),'utf8'));
 assert.deepEqual(manifest.canvas,[900,1300]);assert.equal(manifest.physical,85);
 for(const entry of manifest.cards){const c=TRICKS[entry.id],expected=socketLayout(c.cost);assert.deepEqual(entry.sockets.map(s=>({x:s.x,y:s.y,width:s.size,height:s.height})),expected);assert.deepEqual(entry.textResolution,[1800,2600]);for(const s of expected){assert(s.x>40&&s.x+s.width<600);assert(s.y>970&&s.y+s.height<1166);}}
});

test('starting offers contain two Base and one Advanced; passed packets gain an Advanced and never an Epic',()=>{
 for(const npcCount of [1,2,3]){
  const m=M.newMatch({seed:250+npcCount,npcCount});
  for(let round=0;round<6;round++){
   const packets=structuredClone(m.initialPackets),choices={};
   for(const p of m.players){const cards=p.game.offer.map(uid=>m.deck.find(c=>c.uid===uid));if(round%2===0)assert.deepEqual(cards.map(c=>c.tier),['base','base','advanced']);assert(cards.every(c=>c.tier!=='epic'));choices[p.id]=cards.find(c=>c.tier==='advanced').uid;}
   for(const p of m.players)assert(M.dispatch(m,{playerId:p.id,type:'draft',cardId:choices[p.id]}));
   if(round%2===0)for(let i=0;i<m.order.length;i++){const sender=m.players[m.order[i]],receiver=m.players[m.order[(i+1)%m.order.length]],passed=packets[sender.id].filter(uid=>uid!==choices[sender.id]),extra=receiver.game.offer.filter(uid=>!passed.includes(uid));assert.equal(extra.length,1);assert.equal(m.deck.find(c=>c.uid===extra[0]).tier,'advanced');}
   conserved(m);
  }
  assert(m.players.every(p=>p.game.hand.length===6));assert(m.players.every(p=>p.game.hand.every(c=>c.tier==='advanced')));
 }
});

test('even an all-Advanced starting draft leaves enough cards for all five markets at four players',()=>{
 let m=M.newMatch({seed:777});initial(m,true);
 for(const tier of ['base','advanced','advanced','advanced','epic']){
  passModule(m);assert(M.advance(m));assert.equal(m.market.tier,tier);assert.equal(m.market.cards.length,4);assert.equal(m.market.tokens.length,4);assert(m.market.cards.every(c=>c.tier===tier));assert(m.market.reserve.every(c=>TIER_ORDER[c.tier]<TIER_ORDER[tier]));
  while(m.phase==='recovery'){
   m=M.restore(JSON.parse(JSON.stringify(m)));
   const [token]=E.draftBonusChoices(M.currentPlayer(m).game,m.market.tokens);
   assert(cmd(m,'draft-pair',{cardId:m.market.cards[0].uid,tokenId:token.id}));conserved(m);
  }
  assert.equal(m.market.cards.length,0);assert.equal(m.market.reserve.length,0);assert(M.startModule(m));
 }
 passModule(m);assert(M.advance(m));assert.equal(m.phase,'complete');assert.equal(m.recaps.length,6);
});

test('a visible lower-tier card replaces the new offer atomically; unchosen offers return to the deck',()=>{
 const m=M.newMatch({seed:778});initial(m);passModule(m);M.advance(m);while(m.phase==='recovery')assert(cmd(m,'draft-pair',{cardId:m.market.cards[0].uid,tokenId:m.market.tokens[0].id}));M.startModule(m);passModule(m);M.advance(m);
 const offered=m.market.cards.map(c=>c.uid),lower=m.market.reserve[0],player=M.currentPlayer(m),before=JSON.stringify(m);
 assert(lower&&lower.tier==='base');assert(!cmd(m,'draft-pair',{cardId:lower.uid,tokenId:'missing'}));assert.equal(JSON.stringify(m),before);
 assert(cmd(m,'draft-pair',{cardId:lower.uid,tokenId:m.market.tokens[0].id}));assert(player.game.hand.some(c=>c.uid===lower.uid));assert(!m.deck.some(c=>c.uid===lower.uid));assert(!m.market.reserve.some(c=>c.uid===lower.uid));
 while(m.phase==='recovery')assert(cmd(m,'draft-pair',{cardId:m.market.reserve[0].uid,tokenId:m.market.tokens[0].id}));
 assert(offered.every(uid=>m.deck.some(c=>c.uid===uid)));conserved(m);
});

test('physical card rewards accumulate across both attempts, pay at module end and never pay again on retry',()=>{
 const c=TRICKS.find(c=>c.name==='Nollie'),g=E.newGame({},()=>.4);g.route=[3,0];g.phase='select';g.hand=[0,1].map(i=>({...c,uid:'reward-'+i}));
 for(let i=0;i<2;i++){assert(E.chooseCard(g,g.hand[i].uid));assert(E.roll(g,()=>.6));assert(E.autoPlace(g));assert(E.land(g));if(g.phase==='decision')assert(E.stop(g));assert.equal(g.bank.adjust,1);assert(E.proceed(g));}
 assert.equal(g.bank.adjust,3);assert.equal(g.earned.adjust,2);assert.equal(g.trickRewards.length,2);assert(!E.proceed(g));assert.equal(g.bank.adjust,3);
 E.nextModule(g);assert.equal(g.earned.adjust,0);assert.equal(g.secured.length,0);
});

test('hand and library retain Kick, Slide, Air groups with ascending scores and inspectable full cards',()=>{
 const hand=sortHand(makeDeck());assert.deepEqual([...new Set(hand.map(c=>c.type))],['kick','slide','air']);
 for(const type of ['kick','slide','air']){const group=hand.filter(c=>c.type===type);assert(group.every((c,i)=>i===0||c.points>=group[i-1].points));}
 const html=cardLibrary({kind:'tricks',packId:'tricks-base'},c=>renderTrickLayers(c));assert.equal((html.match(/data-action="inspect-trick"/g)||[]).length,41);
});
