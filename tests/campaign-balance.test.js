import test from 'node:test';
import assert from 'node:assert/strict';
import {TRICKS} from '../public/data.js';
import {ODDS} from '../public/odds.js';
import {findMatch} from '../public/combinations.js';
import {probability} from '../scripts/campaign-probability.mjs';
import {readFileSync} from 'node:fs';
import {MODULES} from '../public/data.js';
const near=(a,b)=>assert(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('whole-pool reroll probabilities match two independent opportunities, with the adjustment retained',()=>{
 const card={pattern:'exact',cost:2,values:[1,1]};
 near(probability(card,2,0,1),71/1296);
 near(probability(card,2,1,1),23/144);
});
// Independent matcher intentionally does not use production findMatch.
function possible(c,faces){
 const counts=Array(7).fill(0);for(const f of faces)counts[f]++;
 if(c.pattern==='at-least')return faces.filter(v=>v>=c.threshold).length>=c.cost;
 if(c.pattern==='at-most')return faces.filter(v=>v<=c.threshold).length>=c.cost;
 if(c.pattern==='exact'){const need=Array(7).fill(0);for(const f of c.values)need[f]++;return need.every((n,i)=>n<=counts[i]);}
 if(c.pattern==='choices')return c.choices.some(values=>possible({pattern:'exact',values},faces));
 if(c.pattern==='parity')return faces.some(v=>v%2===0)&&faces.some(v=>v%2===1);
 if(c.pattern==='straight')return Array.from({length:7-c.cost},(_,i)=>i+1).some(v=>Array.from({length:c.cost},(_,i)=>counts[v+i]).every(Boolean));
 return new Set(faces.filter(v=>v%2===(c.pattern==='odd-distinct'?1:0))).size>=2;
}
test('all card patterns match independent counts over every six-die outcome',()=>{
 const successes=TRICKS.map(()=>0);
 for(let roll=0;roll<6**6;roll++){
  let k=roll;const faces=Array.from({length:6},()=>{const v=k%6+1;k=Math.floor(k/6);return v;});
  const dice=faces.map((face,id)=>({face,id}));
  for(const c of TRICKS){const ok=possible(c,faces);assert.equal(!!findMatch(c,dice),ok,c.name);if(ok)successes[c.id]++;}
 }
 for(const c of TRICKS)near(successes[c.id]/6**6,ODDS.cards[c.id].noBonus[6]);
});
test('at equal dice cost, higher points do not buy an easier six-die combination',()=>{
 for(const a of TRICKS)for(const b of TRICKS)if(a.cost===b.cost&&a.points<b.points)
  assert(ODDS.cards[a.id].noBonus[6]+1e-10>=ODDS.cards[b.id].noBonus[6],`${a.name}/${b.name}`);
});

test('approved 85-card combinations and difficulty points remain fixed; three and four dice include +2',()=>{
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/theory85-catalog.json',import.meta.url),'utf8'));
 assert.equal(TRICKS.length,fixture.cards.length);
 for(const c of TRICKS){const approved=fixture.cards[c.id];assert.equal(c.name,approved.name);assert.equal(c.copies,approved.copies);assert.equal(c.tier,approved.tier);assert.equal(c.points,approved.difficultyPoints+(c.cost>=3?2:0));near(c.p6,approved.p);for(const key of ['pattern','cost','values','choices','threshold'])assert.deepEqual(c[key],approved.requirement[key],c.name+': '+key);}
 assert.deepEqual([0,1,2].map(stage=>MODULES.filter(m=>m.stage===stage).length),[4,4,4]);assert(MODULES.every(m=>!('target'in m)&&m.bonus?.kind&&!('minimumTricks'in m.bonus)));
});

test('all displayed and bonus probabilities are generated from current combinations',()=>{
 for(const c of TRICKS)for(let n=0;n<=6;n++)for(const [key,a,r] of [['noBonus',0,0],['adjustOnly',1,0],['rerollOnly',0,1],['bothBonuses',1,1]])near(ODDS.cards[c.id][key][n],probability(c,n,a,r));
});
