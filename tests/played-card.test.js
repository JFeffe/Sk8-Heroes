import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../public/match.js';
import {TRICKS} from './fixtures/turn-scenarios.js';
import {playedCardSnapshot,attemptSnapshot} from '../public/played-card.js';
import * as E from '../public/engine.js';
function fixture(){
 const m=M.newMatch({seed:90}),p=m.players[1],g=p.game;
 g.hand=[{...TRICKS[1],uid:'pop'},{...TRICKS[6],uid:'hard'}];g.phase='rolled';g.active='hard';g.pending=[0,1];
 g.dice[0].face=4;g.dice[1].face=4;
 g.sequences=[{attempt:0,points:5,entries:[{card:'pop',bonus:1,dice:[{id:0,color:'blue',face:1,wildValue:5},{id:1,color:'red',face:2,wildValue:null}]}]}];
 return {m,p,g};
}
test('enlarging an archived card uses its original dice and bonus instead of the next attempt roll',()=>{
 const {m,p,g}=fixture(),before=JSON.stringify(m),snapshot=playedCardSnapshot(m,p.id,'pop',0);
 assert.deepEqual(snapshot.ids,[0,1]);assert.deepEqual(snapshot.dice.map(d=>d.face),[1,2]);assert.equal(snapshot.dice[0].wildValue,5);
 assert.equal(snapshot.bonus,1);assert(snapshot.confirmed);assert.equal(snapshot.skaterId,p.skaterId);assert.equal(snapshot.playerName,g.name);
 assert.equal(JSON.stringify(m),before);g.dice[0].face=6;g.sequences=[];g.hand=[];
 assert.deepEqual(snapshot.dice.map(d=>d.face),[1,2]);assert.equal(snapshot.card.name,'Pop Shuvit');
});
test('an engaged card opens read-only with its pending dice, without validating or consuming them',()=>{
 const {m,p,g}=fixture(),before=JSON.stringify(m),snapshot=playedCardSnapshot(m,p.id,'hard');
 assert.deepEqual(snapshot.dice.map(d=>d.face),[4,4]);assert(!snapshot.confirmed);assert.equal(snapshot.status,'À valider');
 assert.equal(JSON.stringify(m),before);snapshot.dice[0].face=6;assert.equal(g.dice[0].face,4);
});
test('confirmed current tricks can be inspected, while unplayed or missing cards cannot',()=>{
 const {m,p,g}=fixture();g.active=null;g.landed=[{card:'hard',dice:[0,1]}];g.phase='decision';
 assert(playedCardSnapshot(m,p.id,'hard').confirmed);
 assert.equal(playedCardSnapshot(m,p.id,'pop'),null);assert.equal(playedCardSnapshot(m,p.id,'pop',1),null);
 assert.equal(playedCardSnapshot(m,'missing','hard'),null);assert.equal(playedCardSnapshot(m,p.id,'missing'),null);
});
test('whole attempt history retains the dice of a failed trick and remains detached from later rolls',()=>{
 const {m,p,g}=fixture();g.sequences=[];g.attempts=[];g.landed=[{card:'pop',dice:[0,1]}];g.pending=[2];g.dice[0].locked='pop';g.dice[1].locked='pop';g.dice[2].face=3;
 assert(E.fall(g));const snapshot=attemptSnapshot(m,p.id,0);
 assert.equal(snapshot.points,0);assert.equal(snapshot.reason,'fall');assert.equal(snapshot.cards.length,2);assert(snapshot.cards[0].confirmed);assert(!snapshot.cards[1].confirmed);assert.deepEqual(snapshot.cards[1].dice.map(d=>d.face),[3]);
 g.dice[2].face=6;assert.equal(snapshot.cards[1].dice[0].face,3);
 g.history=[{attempts:structuredClone(g.attempts),sequences:[]}];g.module=1;g.attempts=[];
 assert.deepEqual(attemptSnapshot(m,p.id,0,0).cards,snapshot.cards);
});
test('old attempt records without dice still show full card faces rather than unreadable names',()=>{
 const {m,p,g}=fixture();g.sequences=[];g.attempts=[{points:2,reason:'stop',cards:['Pop Shuvit']}];
 const result=attemptSnapshot(m,p.id,0);assert.equal(result.cards.length,1);assert.equal(result.cards[0].card.name,'Pop Shuvit');assert.deepEqual(result.cards[0].dice,[]);
});
