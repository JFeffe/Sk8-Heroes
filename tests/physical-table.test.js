import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sequenceScore} from '../public/turn.js';
import {TRICKS,MODULES} from '../public/data.js';
import * as M from '../public/match.js';
import {RoomStore} from '../server/rooms.mjs';
import {printedOdds,printedPercent,bestModuleAttempt,deckInventory,skaterMat,trophyStock,SCORE_TRACK_MAX} from '../public/physical-table.js';
import {parkCard,parkScores} from '../public/park-card.js';
import {POKER,cardLeft,cardWidth,CARD_SIDE,CARD_VIEW_WIDTH} from '../public/card-format.js';
import {renderTrickLayers} from '../public/trick-layers.js';

test('printed odds cover every reachable pool and do not change with the turn',()=>{
 for(const card of TRICKS){
  const rows=printedOdds(card);assert.deepEqual(rows.map(r=>r.dice),card.cost===2?[6,4,3,2]:card.cost===3?[6,4,3]:[6,4]);
  const source=readFileSync(new URL('../artwork/cards/tricks/deck-v1/'+card.key+'/03-textes-symboles.svg',import.meta.url),'utf8');
  for(const row of rows)assert(source.includes(printedPercent(row.probability).replace('>','&gt;').replace('<','&lt;')));
  assert.equal(renderTrickLayers(card,{chance:'12 %'}),renderTrickLayers(card,{chance:'92 %',landed:true}));
 }
 assert.equal(printedPercent(.9999),'>99,9 %');assert.equal(printedPercent(1),'100,0 %');
});
test('shared park markers keep the best banked attempt, without counting a live score',()=>{
 const player={id:'p0',skaterId:'neo',game:{name:'Rider',bank:{},attempts:[{points:17}],score:25,phase:'decision'}};
 assert.equal(bestModuleAttempt(player.game),17);
 player.game.attempts.push({points:0});assert.equal(bestModuleAttempt(player.game),17);
 player.game.attempts[1].points=21;assert.equal(bestModuleAttempt(player.game),21);
 assert.equal((parkCard({players:[player]}).match(/class="park-marker"/g)||[]).length,2);
 assert(!skaterMat(player).includes('mat-score-track'));assert(!skaterMat(player).includes('RECORD'));
 player.game.attempts=[];assert.equal(bestModuleAttempt(player.game),0);
 // Bound all legal sequences, including module effects and the two-Epic draft limit.
 let maximum=0;
 for(const module of MODULES){
  const pool=TRICKS.filter(c=>module.stage===2||c.tier!=='epic');
  function visit(cards,cost){
   const needs=module.needs,types=cards.map(c=>c.type);
   if(cards.length&&(!needs.length||(needs.includes(types[0])&&(needs.length!==2||(needs.includes(types[1])&&types[0]!==types[1]))))){
    const physical=cards.map((c,i)=>({...c,uid:String(i)}));
    // Six stars overestimates the stars module; it still cannot beat the real 32-point maximum.
    const context={moduleTrace:{ownColor:'blue',entries:physical.map(c=>({card:c.uid,dice:Array.from({length:c.cost},()=>({face:1,color:'blue'}))}))}};
    maximum=Math.max(maximum,sequenceScore(physical,module,context).points);
   }
   if(cards.length===3)return;
   for(const c of pool)if(cost+c.cost<=6&&cards.filter(x=>x.id===c.id).length<c.copies&&!(c.tier==='epic'&&cards.filter(x=>x.tier==='epic').length>=2))visit([...cards,c],cost+c.cost);
  }
  visit([],0);
 }
 assert.equal(maximum,32);assert(maximum<=SCORE_TRACK_MAX);
 const html=parkCard({players:[player]});
 assert.deepEqual([...html.matchAll(/<li data-value="(\d+)"/g)].map(m=>Number(m[1])),[30,20,10,0,8,9,6,7,4,5,2,3,0,1]);

});
test('physical piles exclude initial packets and publish only aggregate counts online',()=>{
 const m=M.newMatch({seed:999});const packets=Object.values(m.initialPackets).flat().length;
 assert.equal(deckInventory(m).reduce((n,p)=>n+p.draw,0),m.deck.length-packets);
 while(m.phase==='initial'){const p=M.currentPlayer(m);assert(M.dispatch(m,{playerId:p.id,type:'draft',cardId:p.game.offer[0],draftRound:m.draftRound}));}
 assert.equal(deckInventory(m).reduce((n,p)=>n+p.draw,0)+m.players.reduce((n,p)=>n+p.game.hand.length,0),85);
 const room={match:m,members:{p0:{host:true}},seen:Object.fromEntries(m.players.map(p=>[p.id,Date.now()])),revision:0};
 const store=new RoomStore('unused');try{
  const view=store.view(room,'p0');assert.deepEqual(view.match.deckCounts,deckInventory(m));assert.deepEqual(view.match.deck,[]);
  assert.deepEqual(deckInventory(view.match),deckInventory(m));
 }finally{store.close();}
});

test('all players share the park at zero and keep both colored markers when their scores coincide',()=>{
 const m=M.newMatch({seed:1707});
 for(const p of m.players){p.game.attempts=[{points:27},{points:12}];p.game.score=31;}
 assert(m.players.every(p=>parkScores(m).find(s=>s.id===p.id).score===27));
 const html=parkCard(m);assert.equal((html.match(/class="park-marker"/g)||[]).length,8);
 for(const p of m.players)assert.equal((html.match(new RegExp('data-player="'+p.id+'"','g'))||[]).length,2);
 for(const p of m.players)p.game.attempts=[];
 assert(parkScores(m).every(p=>p.score===0));
});
test('trophy tokens derive from awarded victory points and keep the exact count above five',()=>{
 const m=M.newMatch({seed:1708}),p=m.players[0];
 for(const pv of [0,1,4,9,17]){p.game.pv=pv;const html=trophyStock(p);assert(html.includes('<strong>'+pv+'</strong>'));assert(html.includes(pv+' points de victoire'));assert.equal((html.match(/class="trophy-token"/g)||[]).length,Math.max(1,Math.min(pv,5)));}
 const restored=M.restore(JSON.parse(JSON.stringify(m)));assert.equal(trophyStock(restored.players[0]),trophyStock(p));
});
test('poker exports have exact trim proportions and dice sockets retain their reference positions',()=>{
 assert.equal(POKER.widthPx/POKER.heightPx,63/88);
 const manifest=JSON.parse(readFileSync(new URL('../artwork/cards/tricks/deck-v1/manifest.json',import.meta.url),'utf8'));
 assert.deepEqual(manifest.trimMm,[63,88]);assert.deepEqual(manifest.rasterSize,[1008,1408]);
 for(const x of [0,150,321,900])assert(Math.abs(cardLeft(x)/100*CARD_VIEW_WIDTH-CARD_SIDE-x)<1e-10);
 assert(Math.abs(cardWidth(128)/100*CARD_VIEW_WIDTH-128)<1e-10);
});

test('park records persist through the recap and draft, reset at module start, while trophies stay awarded',()=>{
 const m=M.newMatch({seed:1709});
 while(m.phase==='initial'){const p=M.currentPlayer(m);assert(M.dispatch(m,{playerId:p.id,type:'draft',cardId:p.game.offer[0],draftRound:m.draftRound}));}
 assert(M.startModule(m));
 for(const [i,p] of m.players.entries()){
  p.game.attempts=[{points:i<2?15:12,cards:[],reason:'stop'},{points:0,cards:[],reason:'fall'}];
  p.game.history=[{best:p.game.attempts[0].points,attempts:structuredClone(p.game.attempts),pv:0}];
 }
 assert(M.settleModule(m));const records=parkScores(m),trophies=m.players.map(p=>p.game.pv);
 assert.deepEqual(trophies,[MODULES[m.route[0]].pv,MODULES[m.route[0]].pv,1,1]);assert(!M.settleModule(m));
 assert(M.advance(m));assert.deepEqual(parkScores(m),records);
 while(m.phase==='recovery')assert(M.dispatch(m,{playerId:M.currentPlayer(m).id,type:'draft-pair',cardId:m.market.cards[0].uid,tokenId:m.market.tokens[0].id}));
 assert.deepEqual(parkScores(m),records);assert(M.startModule(m));
 assert(parkScores(m).every(p=>p.score===0));assert.deepEqual(m.players.map(p=>p.game.pv),trophies);
});
