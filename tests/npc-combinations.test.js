import test from 'node:test';
import assert from 'node:assert/strict';
import {closestMatch,freezeChoice} from '../public/npc.js';
import {TRICKS} from './fixtures/turn-scenarios.js';
import * as M from '../public/match.js';
const dice=faces=>faces.map((face,id)=>({id,face}));

test('NPC adjustment plans distinguish combinations with the same pattern and cost',()=>{
 const roll=dice([1,3,6]);
 assert.equal(closestMatch(TRICKS[19],roll).distance,0);
 assert.equal(closestMatch(TRICKS[20],roll).distance,1);
 assert.equal(closestMatch(TRICKS[8],roll).distance,2);
 assert.equal(closestMatch(TRICKS[13],roll).distance,1);
});

test('NPC freeze keeps a useful face for the chosen combination, not always a one',()=>{
 assert.equal(freezeChoice(TRICKS[6],dice([1,4,2,6])).face,4);
 assert.equal(freezeChoice(TRICKS[6],dice([1,2,3,6])),null);
});

test('NPC freeze plans respect dice already frozen in earlier tricks and never pay twice for them',()=>{
 const card=TRICKS[6];
 assert.equal(freezeChoice(card,dice([4,3,2]),null,[0]),null);
 assert.equal(freezeChoice(card,dice([4,4,3]),null,[0]).id,1);
 assert.equal(freezeChoice(card,dice([4,4]),null,[0,1]),null);
});

test('old saves cannot silently combine old locked dice and scores with new rules',()=>{
 const m=M.newMatch({seed:1});m.version=M.MATCH_VERSION-1;
 assert.throws(()=>M.restore(m),/incompatible/);
});
