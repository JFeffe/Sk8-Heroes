import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../public/match.js';
import {draftStatus,tokenInventory,tokenStack} from '../public/match-ui.js';
test('choice profiles show accumulated game PV, skater art and all three token stocks',()=>{
 const m=M.newMatch({seed:94}),p=m.players[0];m.phase='recovery';m.draftKind='recovery';m.draftOrder=[...m.order];p.game.pv=7;p.game.bank={adjust:2,reroll:0,freeze:3};
 m.recaps=[{rows:m.players.map(player=>({id:player.id,best:19}))}];
 const html=draftStatus(m);assert.match(html,/Score de partie : 7 PV/);assert.match(html,/Dernier module : 19 pts/);assert.match(html,/±1 2\/3 · ↻ 0\/3 · ❄ 3\/3/);assert.equal((html.match(/<img /g)||[]).length,4);
 const stock=tokenInventory(p.game);assert.match(stock,/±1 : 2\/3/);assert.match(stock,/Relance : 0\/3/);assert.match(stock,/Gel : 3\/3/);
});

test('reward tokens show one symbol without a stock badge while inventories keep their counts',()=>{
 for(const [type,symbol] of [['adjust','±1'],['reroll','↻'],['freeze','❄']]){
  const html=tokenStack(type,1,{showCount:false});
  assert.equal((html.match(/class="bonus-token/g)||[]).length,1);assert(html.includes('>'+symbol+'</i>'));
  assert(!html.includes('<b>'));assert(!html.includes('empty'));assert(html.includes('aria-hidden="true"'));
  assert(tokenStack(type,2,{stock:true}).includes('<b>2/3</b>'));
 }
});
