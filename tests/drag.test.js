import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../public/engine.js';
import {TRICKS} from '../public/data.js';
function ready(){const s=E.newGame();s.phase='select';s.route=[0];s.hand=[{...TRICKS[0],pattern:'exact',values:[1,1],uid:'kick'}];return s;}
test('dragging dice is atomic: invalid groups never partially place, capacity is exact',()=>{
 const s=ready();E.chooseCard(s,'kick');E.roll(s,()=>0);
 const faces=s.dice.map(d=>d.face);
 assert(!E.place(s,[0,6]));assert(!E.place(s,[0,0]));assert(!E.place(s,[.5]));assert(!E.place(s,[0,1,2]));assert.deepEqual(s.pending,[]);
 assert(E.place(s,[0,1]));assert(!E.place(s,[2]));assert.deepEqual(s.pending,[0,1]);assert(E.place(s,[0],false));assert.deepEqual(s.pending,[1]);assert.deepEqual(s.dice.map(d=>d.face),faces);
});
test('committed cards and validated dice cannot be dragged back into a later trick',()=>{
 const s=ready();E.chooseCard(s,'kick');assert(!E.chooseCard(s,'kick'));E.roll(s,()=>0);E.place(s,[0,1]);E.land(s);
 assert(!E.place(s,[0],false));assert(!E.chooseCard(s,'kick'));assert.equal(s.dice[0].locked,'kick');
});
