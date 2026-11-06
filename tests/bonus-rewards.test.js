import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../public/engine.js';
import * as M from '../public/match.js';
import {TRICKS,MODULES} from '../public/data.js';
import {bonusLabel} from '../public/icons.js';
import {decide} from '../public/npc.js';
const easy=i=>({...TRICKS[0],uid:`easy-${i}`,pattern:'at-most',threshold:6,cost:2,points:3,comboBonus:null});
function game(cards=Array.from({length:6},(_,i)=>easy(i))){const g=E.newGame({},()=>.4);g.route=[3,3];g.phase='select';g.hand=cards;return g;}
function land(g,index,faces=[4,4,4,4,4,4]){assert(E.chooseCard(g,g.hand[index].uid));let i=0;assert(E.roll(g,()=>((faces[i++]??4)-.5)/6));assert(E.autoPlace(g));assert(E.land(g));}
function three(g,start=0){land(g,start);assert(E.continueRun(g));land(g,start+1);assert(E.continueRun(g));land(g,start+2);assert.equal(g.reason,'three');}

function sequenceMatch(){
 const m=M.newMatch({seed:42});m.phase='playing';m.position=0;m.active=m.order[0];
 for(const p of m.players){
  const fixture=game();delete fixture.deck;fixture.route=[...m.route];fixture.skaterId=p.skaterId;
  fixture.hand.forEach(c=>{c.uid=p.id+'-'+c.uid;c.type=MODULES[m.route[0]].needs[0]||'kick';});
  Object.assign(p.game,fixture,{competitive:true});
 }
 return m;
}

test('choosing any three-trick token hands over once and preserves the reward, score and saved attempt',()=>{
 for(const type of E.BONUS_TYPES){
  const m=sequenceMatch(),p=M.currentPlayer(m);three(p.game);
  const conventional=M.restore(JSON.parse(JSON.stringify(m))),cp=M.currentPlayer(conventional);
  assert(M.dispatch(conventional,{playerId:cp.id,type:'claim-sequence',choice:type}));
  assert(M.dispatch(conventional,{playerId:cp.id,type:'proceed'}));
  const revision=m.revision;assert(M.dispatch(m,{playerId:p.id,type:'claim-sequence',choice:type,advance:true}));
  assert.equal(m.revision,revision+1);assert.equal(m.position,1);assert.equal(m.active,m.order[1]);
  assert.equal(p.game.bank[type],2);assert.equal(p.game.attempts[0].tokenReward,type);
  assert.equal(p.game.sequences[0].tokenReward,type);assert.equal(p.game.sequenceReward,null);
  assert.equal(m.statistics.players[p.id].gained[type],1);
  const saved=M.restore(JSON.parse(JSON.stringify(m)));assert.deepEqual(saved.players,conventional.players);
  assert.deepEqual(saved.statistics,conventional.statistics);
  const after=JSON.stringify(m);assert(!M.dispatch(m,{playerId:p.id,type:'claim-sequence',choice:type,advance:true}));assert.equal(JSON.stringify(m),after);
 }
});

test('reward handoff respects both attempt rounds and opens the module recap after the last player',()=>{
 const m=sequenceMatch();
 for(let turn=0;turn<m.order.length*2;turn++){
  const p=M.currentPlayer(m),attempt=Math.floor(turn/m.order.length),type=E.BONUS_TYPES[turn%3];
  assert.equal(m.active,m.order[turn%m.order.length]);assert.equal(m.round,attempt);
  three(p.game,attempt*3);const before=JSON.stringify(m);
  assert(!M.dispatch(m,{playerId:p.id,type:'claim-sequence',choice:'invalid',advance:true}));
  assert(!M.dispatch(m,{playerId:p.id,type:'claim-sequence',choice:type,advance:true,revision:-1}));assert.equal(JSON.stringify(m),before);
  assert(M.dispatch(m,{playerId:p.id,type:'claim-sequence',choice:type,advance:true}));
  assert.equal(p.game.attempts[attempt].tokenReward,type);assert(p.game.attempts[attempt].points>0);
 }
 assert.equal(m.phase,'recap');assert.equal(m.recaps.length,1);
 for(const p of m.players){
  assert.equal(p.game.history[0].attempts.length,2);assert.equal(p.game.history[0].sequences.length,2);
  assert.equal(M.matchSummary(m).players.find(row=>row.id===p.id).tokens.totalGained,2);
 }
});

test('three tricks grant one explicit token choice, independently of the score point, with no duplicate claim',()=>{
 for(const type of E.BONUS_TYPES){let g=game();three(g);assert.equal(g.score,10);assert.equal(g.last.sequenceBonus,1);assert(g.sequenceReward.pending);assert.deepEqual(g.bank,{adjust:1,reroll:1,freeze:1});
  assert(!E.proceed(g));assert(!E.claimSequenceReward(g,'invalid'));g=JSON.parse(JSON.stringify(g));assert(g.sequenceReward.pending);
  assert(E.claimSequenceReward(g,type));assert.equal(g.bank[type],2);assert.equal(g.last.tokenReward,type);assert.equal(g.attempts[0].tokenReward,type);assert.equal(g.sequences[0].tokenReward,type);
  g=JSON.parse(JSON.stringify(g));assert(!E.claimSequenceReward(g,type));assert(E.proceed(g));assert.equal(g.sequenceReward,null);assert.equal(g.bank[type],2);
 }
});

test('each of two successful three-trick attempts earns its own choice, and history preserves both',()=>{
 const g=game();three(g);assert(E.claimSequenceReward(g,'freeze'));assert(E.proceed(g));three(g,3);assert(E.claimSequenceReward(g,'reroll'));assert(E.proceed(g));
 assert.equal(g.bank.freeze,2);assert.equal(g.bank.reroll,2);assert.deepEqual(g.history[0].attempts.map(a=>a.tokenReward),['freeze','reroll']);assert(!E.proceed(g));
});

test('Embruns forfeits the excess and refuses a full type, while a full reserve never blocks play',()=>{
 for(const open of [0,1]){
  const g=game();g.route=[10,3];g.bank={adjust:3,reroll:3,freeze:3-open};three(g);
  assert.equal(g.last.rewardTokens,2);assert.equal(g.sequenceReward.remaining,open);
  assert.equal(g.sequenceReward.pending,!!open);
  const before=JSON.stringify(g);
  assert(!E.claimSequenceReward(g,'reroll'));assert.equal(JSON.stringify(g),before);
  if(open){assert.equal(decide(g).choice,'freeze');assert(E.claimSequenceReward(g,'freeze'));}
  assert(!E.claimSequenceReward(g,'freeze'));assert(E.proceed(g));
  assert.deepEqual(g.attempts[0].tokenRewards,open?['freeze']:[]);assert.equal(g.bank.freeze,3);
 }
});

test('saved over-limit stocks are clipped once and obsolete pending choices cannot block resume',()=>{
 const m=sequenceMatch(),p=M.currentPlayer(m);three(p.game);
 p.game.bank={adjust:5,reroll:4,freeze:3};
 m.statistics.players[p.id].gained={adjust:4,reroll:3,freeze:2};
 const saved=M.restore(JSON.parse(JSON.stringify(m))),player=M.currentPlayer(saved),stats=saved.statistics.players[p.id];
 assert.deepEqual(player.game.bank,{adjust:3,reroll:3,freeze:3});assert.deepEqual(stats.discarded,{adjust:2,reroll:1,freeze:0});
 assert.deepEqual(stats.gained,{adjust:4,reroll:3,freeze:2});assert.equal(player.game.sequenceReward.pending,false);
 assert.equal(JSON.stringify(M.restore(JSON.parse(JSON.stringify(saved)))),JSON.stringify(saved));
 assert(M.dispatch(saved,{playerId:p.id,type:'proceed'}));
});

test('a fall on the third trick, a short banked sequence and a pass never grant a choice',()=>{
 const g=game();land(g,0);E.continueRun(g);land(g,1);E.continueRun(g);g.hand[2]={...g.hand[2],pattern:'exact',values:[6,6]};
 E.chooseCard(g,g.hand[2].uid);E.roll(g,()=>0);assert(E.fall(g));assert.equal(g.score,0);assert.equal(g.sequenceReward,null);assert(!E.claimSequenceReward(g,'freeze'));
 const short=game();land(short,0);E.stop(short);assert(!E.claimSequenceReward(short,'adjust'));
 const passed=game();E.pass(passed);assert(!E.claimSequenceReward(passed,'reroll'));
});

test('nine reward tricks cover all token types and display the proper freeze symbol',()=>{
 const rewards=TRICKS.filter(c=>c.comboBonus?.kind==='reward');assert.equal(rewards.length,9);
 assert.deepEqual(rewards.map(c=>[c.name,c.comboBonus.type]),[['Nollie','adjust'],['Heelflip','freeze'],['Backside Flip','adjust'],['Bigspin','reroll'],['Lipslide','reroll'],['Tailslide','freeze'],['Feeble Grind','reroll'],['Suski Grind','adjust'],['Stalefish','reroll']]);
 for(const type of E.BONUS_TYPES)assert(rewards.some(c=>c.comboBonus.type===type));
 assert.match(bonusLabel(rewards.find(c=>c.comboBonus.type==='freeze'),false),/❄/);
});

test('all reward cards pay only for banked sequences, at module end including the last module',()=>{
 for(const card of TRICKS.filter(c=>c.comboBonus?.kind==='reward'))for(const failed of [false,true])for(const final of [false,true]){
  const g=game([{...card,uid:'reward'},{...easy(1),pattern:'exact',values:[6,6]}]);g.competitive=true;if(final)g.route=[3];
  const values=card.values||card.choices?.[0]||(card.threshold?Array(card.cost).fill(card.threshold):Array.from({length:card.cost},(_,i)=>i+1));land(g,0,[...values,...Array(6-card.cost).fill(3)]);
  if(failed&&g.phase==='decision'){assert(E.continueRun(g));E.chooseCard(g,g.hand[1].uid);E.roll(g,()=>0);assert(E.fall(g));}else if(failed){continue;}else if(g.phase==='decision')assert(E.stop(g));
  const initial=g.bank[card.comboBonus.type];assert(E.proceed(g));assert.equal(g.bank[card.comboBonus.type],initial);E.pass(g);assert(E.proceed(g));
  assert.equal(g.bank[card.comboBonus.type],initial+(failed?0:1),card.name);assert(!E.proceed(g));
 }
});

test('two physical reward cards pay two tokens at module end and counters reset next module',()=>{
 const source=TRICKS.find(c=>c.name==='Heelflip'),g=game([0,1].map(i=>({...source,uid:'reward-'+i})));g.competitive=true;
 land(g,0,[1,2,3,4,5,6]);assert(E.continueRun(g));land(g,1,[1,2,3,4]);assert.equal(g.phase,'result');assert.equal(g.bank.freeze,1);
 E.proceed(g);E.pass(g);assert(E.proceed(g));assert.equal(g.bank.freeze,3);assert.deepEqual(g.trickRewards,[{type:'freeze',added:true},{type:'freeze',added:true}]);
 E.nextModule(g);assert.deepEqual(g.earned,{adjust:0,reroll:0,freeze:0});
});

test('module-end card tokens pay only into available slots',()=>{
 const source=TRICKS.find(c=>c.name==='Heelflip'),g=game([0,1].map(i=>({...source,uid:'capped-'+i})));g.competitive=true;g.bank.freeze=2;
 land(g,0,[1,2,3,4,5,6]);assert(E.continueRun(g));land(g,1,[1,2,3,4]);assert(E.proceed(g));assert(E.pass(g));assert(E.proceed(g));
 assert.equal(g.bank.freeze,3);assert.deepEqual(g.trickRewards,[{type:'freeze',added:true},{type:'freeze',added:false}]);
});

test('NPCs and humans claim through the same command, with actor/revision guards and deterministic resume',()=>{
 let m=M.newMatch({seed:42});m.phase='playing';m.active=0;const fixture=game();delete fixture.deck;fixture.route=[...m.route];fixture.skaterId=m.players[0].skaterId;Object.assign(m.players[0].game,fixture,{competitive:true});
 fixture.hand.forEach(c=>c.type=MODULES[m.route[0]].needs[0]||'kick');three(m.players[0].game);m=M.restore(JSON.parse(JSON.stringify(m)));
 // A legal restore refreshes card rules from the catalog; completed rewards stay pending.
 const p=M.currentPlayer(m),before=JSON.stringify(m),action=decide(p.game);assert.equal(action.type,'claim-sequence');
 assert(!M.dispatch(m,{playerId:'p1',...action}));assert(!M.dispatch(m,{playerId:p.id,...action,revision:-1}));assert.equal(JSON.stringify(m),before);
 assert(M.dispatch(m,{playerId:p.id,...action}));assert(!M.dispatch(m,{playerId:p.id,...action}));assert.equal(p.game.bank[action.choice],2);
 assert(M.dispatch(m,{playerId:p.id,type:'proceed'}));assert.equal(p.game.sequenceReward,null);
});
