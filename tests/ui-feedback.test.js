import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../public/match.js';
import * as E from '../public/engine.js';
import {feedbackSnapshot,feedbackChanges,feedbackNumber,UIFeedback} from '../public/ui-feedback.js';
import {TRICKS} from '../public/data.js';
function fixture(){const m=M.newMatch({seed:742}),g=m.players[0].game;m.phase='playing';m.active=0;g.phase='rolled';g.hand=[{...TRICKS[1],uid:'card'}];g.active='card';g.dice.forEach(d=>d.face=3);return {m,g};}
test('presentation snapshots and effect detection never mutate game state or consume randomness',t=>{
 const {m}=fixture(),before=JSON.stringify(m);t.mock.method(Math,'random',()=>{throw Error('UI consumed randomness');});
 const a=feedbackSnapshot(m),b=feedbackSnapshot(m);assert.deepEqual(feedbackChanges(a,b),[]);assert.equal(JSON.stringify(m),before);
 assert.deepEqual(feedbackChanges(null,a),[]);assert.deepEqual(feedbackChanges(a,null),[]);assert.equal(feedbackSnapshot(null),null);
});
test('placement and dice return have distinct feedback and repeated polling never replays it',()=>{
 const {m,g}=fixture(),a=feedbackSnapshot(m);assert(E.autoPlace(g));const b=feedbackSnapshot(m);
 assert(feedbackChanges(a,b).some(e=>e.kind==='place'&&e.card==='card'));assert(E.resetPlacement(g));const c=feedbackSnapshot(m);
 assert(feedbackChanges(b,c).some(e=>e.kind==='return'));assert.deepEqual(feedbackChanges(c,feedbackSnapshot(structuredClone(m))),[]);
});
test('a successful trick, banking, falling and token spending are derived from accepted state changes',()=>{
 const {m,g}=fixture();E.autoPlace(g);const a=feedbackSnapshot(m);assert(E.land(g));const b=feedbackSnapshot(m),events=feedbackChanges(a,b);
 assert(events.some(e=>e.kind==='land'));assert(events.some(e=>e.kind==='bank'));assert(events.some(e=>e.kind==='points'&&e.to===g.score));
 const old=feedbackSnapshot(m);g.bank.freeze--;g.reason='fall';g.phase='rolled';const beforeFall=feedbackSnapshot(m);g.phase='result';g.score=0;
 assert(feedbackChanges(beforeFall,feedbackSnapshot(m)).some(e=>e.kind==='fall'));assert(feedbackChanges(old,beforeFall).some(e=>e.kind==='token-spent'&&e.token==='freeze'));
});
test('turn resets cannot trigger false success or score animations, and rider reservations stay per player',()=>{
 const {m,g}=fixture(),a=feedbackSnapshot(m,{p0:null});g.attempt++;g.landed=[];g.pending=[];
 const b=feedbackSnapshot(m,{p0:'iris'}),events=feedbackChanges(a,b);assert.deepEqual(events,[{kind:'reserved',player:'p0',card:'iris'}]);
 m.active=1;assert(feedbackChanges(b,feedbackSnapshot(m)).some(e=>e.kind==='turn'&&e.player==='p1'));
});
test('score interpolation is bounded and ends at the authoritative value',()=>{
 assert.equal(feedbackNumber(0,12,0),0);assert.equal(feedbackNumber(0,12,420),12);assert.equal(feedbackNumber(12,0,800),0);
 for(let t=0;t<=420;t+=10){const n=feedbackNumber(12,0,t);assert(n>=0&&n<=12);}
});
test('starting the next attempt immediately cancels all old scoring effects',()=>{
 const {m,g}=fixture(),feedback=new UIFeedback();feedback.update(m);E.autoPlace(g);E.land(g);feedback.update(m);
 assert([...feedback.effects.values()].some(e=>e.kind==='points'));assert(E.proceed(g));feedback.update(m);
 assert(![...feedback.effects.values()].some(e=>e.player==='p0'&&['points','bank','land'].includes(e.kind)));
});
