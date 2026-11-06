import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {SKATERS,DIE_COLORS,getSkater} from '../public/skaters.js';
import {matches,findMatch,arrangeDice,resolveDice} from '../public/combinations.js';
import {rollProbability,chanceBeforeRoll} from '../public/roll-probability.js';
import {TRICKS} from '../public/data.js';
import {ODDS} from '../public/odds.js';
import {closestMatch,freezeChoice} from '../public/npc.js';
import * as E from '../public/engine.js';
import {newTurn} from '../public/turn.js';
import * as M from '../public/match.js';
const near=(a,b)=>assert(Math.abs(a-b)<1e-10,`${a} != ${b}`);
const dice=faces=>faces.map((face,id)=>({id,color:DIE_COLORS[id].key,face,locked:null}));
const exact=values=>({pattern:'exact',values,cost:values.length,points:5,id:6,uid:'test'});
function turn(card=exact([4,4])){const g=E.newGame({skaterId:'neo'},()=>.3);g.phase='select';g.route=[3];g.hand=[card];E.chooseCard(g,card.uid);return g;}
function cast(g,faces){let i=0;assert(E.roll(g,()=>((faces[i++]??3)-.5)/6));}

test('six distinct skaters own six fixed die colors and complete illustration assets',()=>{
 assert.equal(SKATERS.length,6);assert.equal(new Set(SKATERS.map(c=>c.id)).size,6);assert.equal(new Set(SKATERS.map(c=>c.color)).size,6);
 assert.deepEqual(DIE_COLORS.map(c=>c.key),['blue','red','green','yellow','orange','purple']);
 for(const c of SKATERS){assert(existsSync(new URL('../public/'+c.image,import.meta.url)));assert.deepEqual(newTurn().dice.map(d=>d.color),DIE_COLORS.map(c=>c.key));}
});

test('the chosen skater, NPC choices and player colors are unique and persist deterministically',()=>{
 const picked=new Set();
 for(const skater of SKATERS)for(let seed=1;seed<=8;seed++){
  const m=M.newMatch({skaterId:skater.id,seed});assert.equal(m.players[0].skaterId,skater.id);assert.equal(new Set(m.players.map(p=>p.skaterId)).size,4);
  for(const p of m.players){picked.add(p.skaterId);assert.equal(p.color,getSkater(p.skaterId).color);assert.equal(p.game.skaterId,p.skaterId);}
  const restored=M.restore(JSON.parse(JSON.stringify(m)));assert.deepEqual(restored.players.map(p=>[p.skaterId,p.color,p.game.dice]),m.players.map(p=>[p.skaterId,p.color,p.game.dice]));
 }
 assert.equal(picked.size,6);assert.throws(()=>M.newMatch({skaterId:'missing'}),/inconnu/);
 const m=M.newMatch();m.players[1].skaterId=m.players[0].skaterId;assert.throws(()=>M.restore(m),/incompatibles/);
});

test('only a physical star in the active skater color is wild, including exact, parity and sequence constraints',()=>{
 const card=exact([4,6]),pool=dice([1,4]);assert(findMatch(card,pool,'blue'));assert.equal(findMatch(card,pool,'red'),null);
 for(const c of SKATERS){const pool=[{id:0,color:c.colorKey,face:1},{id:1,color:'neutral',face:4}];assert(findMatch(card,pool,c.colorKey));}
 assert.equal(findMatch(card,dice([2,4]),'blue'),null);
 for(const c of TRICKS){
  // Independent exhaustive reference replaces only the owner's physical 1.
  for(let code=0;code<6**c.cost;code++){
   let k=code;const values=Array.from({length:c.cost},()=>{const v=k%6+1;k=Math.floor(k/6);return v;});
   const expected=values[0]===1?[1,2,3,4,5,6].some(v=>matches(c,[v,...values.slice(1)])):matches(c,values);
   const pool=dice(values);assert.equal(!!findMatch(c,pool,'blue'),expected,`${c.name}: ${values}`);assert.equal(!!arrangeDice(c,pool,'blue'),expected,`${c.name} sockets ${values}`);
  }
 }
});

test('wild placements lock the physical star and archive its assigned number and color',()=>{
 const g=turn();cast(g,[1,4,2,3,5,6]);assert(E.place(g,[0,1]));assert(E.canLand(g));assert(E.land(g));
 assert.equal(g.dice[0].face,1);assert.equal(g.dice[0].wildValue,4);assert.equal(g.dice[0].locked,'test');
 assert.equal(g.score,7);assert.equal(g.last.moduleBonus,2);assert.deepEqual(g.sequences[0].entries[0].dice[0],{id:0,color:'blue',face:1,wildValue:4});
 const saved=JSON.parse(JSON.stringify(g));assert.equal(saved.sequences[0].entries[0].dice[0].wildValue,4);
 const resolved=resolveDice(exact([2,6]),dice([1,2]),'blue');assert.deepEqual(resolved.values,[2,6]);
});

test('minus one changes an owner two to a wild star, plus one restores an ordinary two; other stars stay one',()=>{
 const g=turn();g.bank.adjust=3;cast(g,[2,4,3,3,3,3]);E.place(g,[0,1]);assert(!E.canLand(g));
 assert(E.bonus(g,'adjust',0,-1));assert.equal(g.dice[0].face,1);assert(E.canLand(g));
 assert(!E.bonus(g,'adjust',0,-1));assert(E.bonus(g,'adjust',0,1));assert.equal(g.dice[0].face,2);assert(!E.canLand(g));
 const other=turn();cast(other,[3,2,4,3,3,3]);E.place(other,[1,2]);assert(E.bonus(other,'adjust',1,-1));assert(!E.canLand(other));
});

test('a frozen owner star survives rerolls and dice reset on the committed card',()=>{
 const g=turn(exact([4,6]));g.hand.push({...exact([2,4]),uid:'second'});cast(g,[1,4,3,3,3,3]);
 assert(E.bonus(g,'freeze',0));assert(E.bonus(g,'reroll',undefined,0,()=>.6));assert.equal(g.dice[0].face,1);assert(E.autoPlace(g));
 assert(E.resetPlacement(g));assert(!E.chooseCard(g,'second'));assert.equal(g.phase,'rolled');assert(E.autoPlace(g));assert(E.land(g));
 assert.equal(g.dice[0].wildValue,6);assert.equal(g.dice[0].face,1);assert.equal(g.bank.freeze,0);
});

test('NPCs recognize the joker and can deliberately turn their two into a star',()=>{
 const c=exact([4,6]),pool=dice([2,4]);assert.deepEqual(closestMatch(c,pool,'blue'),{distance:1,step:{id:0,delta:-1}});
 assert.equal(closestMatch(c,dice([1,4]),'blue').distance,0);assert.equal(freezeChoice(c,dice([1,3,4,5]),'blue').id,0);
});

test('exact probabilities distinguish a personal star, another color star, held stars and a spent owner die',()=>{
 const c=exact([6,6]),pool=dice([null,null]);near(rollProbability(c,pool),1/36);near(rollProbability(c,pool,'blue'),2/36);
 near(rollProbability(c,dice([1,null]),'blue',[0]),1/6);near(rollProbability(c,dice([null,1]),'blue',[1]),0);
 const g=turn(c);g.dice=dice([null,null,null]);g.dice[0].locked='previous';near(chanceBeforeRoll(g,c),1/36);
 g.dice[1].face=6;g.frozen=[1];near(chanceBeforeRoll(g,c),1/6);
 for(const c of TRICKS)for(let n=0;n<=6;n++)near(rollProbability(c,Array.from({length:n},(_,id)=>({id,color:id===0?'own':'other',face:null})),'own'),ODDS.cards[c.id].withWild.noBonus[n]);
});
