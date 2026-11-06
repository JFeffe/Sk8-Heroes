import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../public/match.js';
import {viewedPlayer,viewingOwnTable,canControlTable,syncTableView} from '../public/table-view.js';
import {scoreRack} from '../public/match-ui.js';

test('every player can be inspected without changing the active player, hands or table',()=>{
 const m=M.newMatch({seed:71});m.phase='playing';m.active=0;const before=JSON.stringify(m);
 for(const p of m.players){assert.strictEqual(viewedPlayer(m,p.id),p);assert.equal(viewingOwnTable(m,p.id),p.id==='p0');}
 assert.equal(JSON.stringify(m),before);assert.strictEqual(viewedPlayer(m,'gone'),m.players[0]);
});
test('playing requires both the own table and own active turn, including a guest replacing an NPC',()=>{
 const m=M.newMatch({seed:72});m.phase='playing';m.active=0;
 assert(canControlTable(m,null));assert(!canControlTable(m,'p1'));assert(canControlTable(m,'p0'));
 m.active=1;assert(!canControlTable(m,'p0'));m.viewerId='p1';assert(canControlTable(m,null));assert(!canControlTable(m,'p0'));
 m.phase='recap';assert(!canControlTable(m,'p1'));
});
test('scoreboard offers accessible buttons with independent active-turn and viewed-table markers',()=>{
 const m=M.newMatch({seed:73});m.phase='playing';m.active=0;
 const html=scoreRack(m,{viewedPlayerId:'p1'});
 assert.equal((html.match(/data-action="view-player"/g)||[]).length,4);
 assert.match(html,/class="player-score active\s*"[^>]*data-id="p0"[^>]*aria-pressed="false"/);
 assert.match(html,/class="player-score\s+viewed"[^>]*data-id="p1"[^>]*aria-pressed="true"/);
 assert.match(html,/aria-label="Voir la main et la table de/);
});
test('normal play follows each active player and returns automatically to the local turn',()=>{
 const m=M.newMatch({seed:74});m.phase='playing';m.active=1;
 assert.equal(viewedPlayer(m,null).id,'p1');assert(!canControlTable(m,null));
 m.active=2;assert.equal(viewedPlayer(m,null).id,'p2');
 m.active=0;assert.equal(viewedPlayer(m,null).id,'p0');assert(canControlTable(m,null));
});
test('manual inspection stays pinned while paused, including online updates, and stays pinned on resume',()=>{
 const m=M.newMatch({seed:75});m.phase='playing';m.active=1;
 let view=syncTableView(m,{},true);view=syncTableView(m,{...view,playerId:'p2'},true);
 m.active=3;m.revision++;view=syncTableView(m,view,true);
 assert.equal(view.displayedId,'p2');assert.equal(view.playerId,'p2');
 view=syncTableView(m,view,false);assert.equal(view.playerId,'p2');assert.equal(view.displayedId,'p2');
 view=syncTableView(m,{...view,playerId:null},false);assert.equal(view.displayedId,'p3');
});
test('a live inspection survives unchanged polling and remains pinned through subsequent game actions',()=>{
 const m=M.newMatch({seed:76});m.phase='playing';m.active=1;
 let view=syncTableView(m);view=syncTableView(m,{...view,playerId:'p2'});
 assert.equal(syncTableView(m,view).displayedId,'p2');
 m.revision++;view=syncTableView(m,view);assert.equal(view.playerId,'p2');assert.equal(view.displayedId,'p2');
 view=syncTableView(m,{...view,playerId:null});assert.equal(view.displayedId,'p1');
});
