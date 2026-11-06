import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../public/match.js';
import {TRICKS,MODULES} from '../public/data.js';
import {draftValue,npcContext,sequencePlanner,supportedChance} from '../public/npc-strategy.js';
import {decide} from '../public/npc.js';
import {npcGameView} from '../public/npc-view.js';

function fixture(){
 const m=M.newMatch({seed:901,npcCount:3});m.phase='playing';m.route=[3,0,4,5,7,11];
 for(const p of m.players){const g=p.game;g.route=[...m.route];g.phase='select';g.hand=[0,5,16,21,32,37].map((id,i)=>({...TRICKS[id],uid:p.id+'-'+i}));}
 return m;
}
test('draft values an achievable four-die Epic with resources instead of always preferring a small Advanced',()=>{
 const m=fixture(),g=m.players[0].game;g.phase='draft';g.module=4;g.bank={adjust:3,reroll:3,freeze:2};
 const epic=TRICKS.find(c=>c.name==='900°'),advanced=TRICKS.find(c=>c.name==='Stalefish');
 assert(draftValue(epic,g)>draftValue(advanced,g));
 const equipped=draftValue(epic,g);g.bank={adjust:0,reroll:0,freeze:0};assert(draftValue(epic,g)<equipped);
 assert.equal(supportedChance(epic,2,true,{reroll:20}),0);
});
test('initial draft retains a two-die option when its first card of that type costs three dice',()=>{
 const g=fixture().players[0].game;g.phase='initial';g.hand=[{...TRICKS.find(c=>c.type==='air'&&c.cost===3),uid:'air-3'}];
 const small=TRICKS.find(c=>c.type==='air'&&c.cost===2),large=TRICKS.find(c=>c.type==='air'&&c.cost===3);
 const smallWithGap=draftValue(small,g),largeWithGap=draftValue(large,g);g.hand=[];
 assert(smallWithGap-draftValue(small,g)>largeWithGap-draftValue(large,g));
});
test('public forecast respects remaining attempts, protected scores, and opponent card strength',()=>{
 const m=fixture(),p=m.players[0],c=npcContext(m,p);assert.equal(c.opposition.length,3);assert(c.opposition.every(o=>o.remaining===2&&o.strength>0));
 m.players[1].game.attempts=[{points:12}];let next=npcContext(m,p);assert.equal(next.opposition[0].best,12);assert.equal(next.opposition[0].remaining,1);
 m.players[1].game.attempts.push({points:7});next=npcContext(m,p);assert.equal(next.opposition[0].remaining,0);
 const weaker=structuredClone(m.players[2].game.hand);m.players[2].game.hand=m.players[2].game.hand.map(c=>({...c,points:1}));
 assert(npcContext(m,p).opposition[1].strength<c.opposition[1].strength);m.players[2].game.hand=weaker;
});
test('finished opponents with an equal score receive the same full-award standing as beaten opponents',()=>{
 const m=fixture(),g=m.players[0].game;g.phase='decision';g.attempt=1;g.attempts=[{points:20}];
 const equal=sequencePlanner(g,{opposition:[{best:20,remaining:0,strength:30}]}),beaten=sequencePlanner(g,{opposition:[{best:19,remaining:0,strength:30}]});
 assert.equal(equal.fallUtility,beaten.fallUtility);assert.equal(equal.fallUtility,MODULES[3].pv*8);
});
test('unplayed opponents create score pressure even with no observed leader, independently of seat order',()=>{
 const m=fixture(),p=m.players[0],g=p.game;const before=npcContext(m,p),plan=sequencePlanner(npcGameView(g),before);
 const weaker=sequencePlanner(npcGameView(g),{...before,opposition:before.opposition.map(o=>({...o,strength:0}))});
 assert(plan.utility<weaker.utility);m.order.reverse();assert.deepEqual(npcContext(m,p),before);
});
test('public forecasts and decisions are deterministic after restore and ignore hidden or unrolled information',()=>{
 const m=fixture(),p=m.players[0],before=JSON.stringify(m),context=npcContext(m,p),action=decide(npcGameView(p.game),context);
 const copy=M.restore(JSON.parse(before)),q=copy.players[0];assert.deepEqual(npcContext(copy,q),context);assert.deepEqual(decide(npcGameView(q.game),npcContext(copy,q)),action);
 for(const state of [copy,...copy.players.map(p=>p.game)])for(const key of ['deck','rngState','randomSource'])Object.defineProperty(state,key,{get(){throw Error('Hidden state read');},configurable:true});
 for(const p of copy.players)p.game.dice.forEach(d=>d.face=6);
 assert.deepEqual(npcContext(copy,q),context);assert.deepEqual(decide(npcGameView(q.game),context),action);assert.equal(JSON.stringify(m),before);
});
