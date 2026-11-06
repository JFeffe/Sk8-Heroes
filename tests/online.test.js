import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
import {RoomStore} from '../server/rooms.mjs';
import {createGameServer} from '../server/http-server.mjs';
import * as M from '../public/match.js';
import {decide} from '../public/npc.js';
import * as E from '../public/engine.js';
import {getSkater} from '../public/skaters.js';
import {TRICKS,MODULES} from '../public/data.js';

async function fixture(t,options={}){
 const directory=await mkdtemp(path.join(tmpdir(),'sk8-online-'));
 const store=new RoomStore(directory,{npcDelay:60000,...options});
 t.after(async()=>{store.close();assert(path.resolve(directory).startsWith(path.resolve(tmpdir())+path.sep));await rm(directory,{recursive:true,force:true});});
 const host=await store.create({name:'Host',skaterId:'neo',npcCount:3});return {store,directory,host,room:await store.get(host.roomId)};
}
const send=(store,room,viewerId,action,extra={})=>store.command(room,viewerId,{action,revision:room.revision,requestId:randomUUID(),...extra});

test('Trick signature returns one card authoritatively and remains spent after duplicate requests and reconnect',async t=>{
 const {store,directory}=await fixture(t);
 const host=await store.create({name:'Jade',skaterId:'jade',mode:'advanced'}),room=await store.get(host.roomId),m=room.match;
 while(m.phase==='initial')assert(M.dispatch(m,{playerId:M.currentPlayer(m).id,type:'draft',cardId:M.currentPlayer(m).game.offer[0]}));
 assert(M.startModule(m));m.active=0;m.order=[0,1,2,3];m.position=0;m.round=1;room.started=true;room.paused=true;
 const g=m.players[0].game,card=g.hand[0],requestId=randomUUID();g.attempt=1;g.secured=[card.uid];g.attempts=[{points:4}];g.sequences=[{attempt:0,points:4,entries:[{card:card.uid,dice:[]}]}];
 const before=structuredClone(g.sequences),returned=await send(store,room,'p0',{type:'specialty',cardId:card.uid},{requestId});
 assert(returned.match.players[0].game.specialty.used);assert(!returned.match.players[0].game.secured.includes(card.uid));
 const repeated=await send(store,room,'p0',{type:'specialty',cardId:card.uid},{requestId});assert.deepEqual(repeated.match.players[0].game.specialty,returned.match.players[0].game.specialty);
 const resumed=new RoomStore(directory);t.after(()=>resumed.close());const loaded=await resumed.get(room.id),restored=loaded.match.players[0].game;
 assert.equal(loaded.match.mode,'advanced');assert(restored.specialty.used);assert.equal(restored.specialty.returnedCard,card.uid);assert.deepEqual(restored.sequences,before);assert.equal(restored.hand.length,6);
 await assert.rejects(()=>send(resumed,loaded,'p0',{type:'specialty',cardId:card.uid}));assert(restored.specialty.used);
});

function moduleRewardFixture(room,module,bank=null){
 const m=room.match;m.route=[0,1,module,4,6,8];if(module===6)m.route[4]=7;
 m.module=2;m.phase='playing';m.round=0;m.position=0;m.active=0;m.order=[0,1,2,3];room.started=true;room.paused=true;
 for(const p of m.players){p.game.route=[...m.route];p.game.module=2;p.game.phase='select';p.game.offer=[];}
 const actor=m.players[0].game,chosen=module===7?[m.deck.find(c=>c.key==='50-50-grind'),...m.deck.filter(c=>c.id===0).slice(0,2)]:m.deck.filter(c=>c.id===0).slice(0,3),ids=new Set(chosen.map(c=>c.uid));assert.equal(chosen.length,3);m.deck=m.deck.filter(c=>!ids.has(c.uid));actor.hand=chosen;if(bank)actor.bank=bank;
 Object.defineProperty(m,'randomSource',{value:()=>.3,configurable:true});
 const count=module===7?2:3;
 for(let i=0;i<count;i++){assert(M.dispatch(m,{playerId:'p0',type:'choose',cardId:actor.hand[i].uid}));assert(M.dispatch(m,{playerId:'p0',type:'roll'}));assert(M.dispatch(m,{playerId:'p0',type:'auto'}));assert(M.dispatch(m,{playerId:'p0',type:'land'}));if(i<count-1)assert(M.dispatch(m,{playerId:'p0',type:'continue'}));}
 if(module===7)assert(M.dispatch(m,{playerId:'p0',type:'stop'}));
 return actor;
}
for(const choices of [['freeze','adjust'],['freeze','freeze']])test('Embruns online choices '+choices.join('/')+' survive restart, retries and failed saves before handoff',async t=>{
 const {store,room,directory}=await fixture(t),g=moduleRewardFixture(room,10);assert.equal(g.sequenceReward.remaining,2);assert.equal(g.score,7);const stocks={...g.bank};await store.persist(room);
 const firstId=randomUUID(),firstRevision=room.revision;
 await send(store,room,'p0',{type:'claim-sequence',choice:choices[0],advance:true},{requestId:firstId,revision:firstRevision});assert.equal(room.match.active,0);assert.equal(room.match.position,0);assert.equal(g.sequenceReward.remaining,1);assert(!M.dispatch(room.match,{playerId:'p0',type:'proceed'}));
 const accepted=JSON.stringify(room.match);await send(store,room,'p0',{type:'claim-sequence',choice:choices[0],advance:true},{requestId:firstId,revision:firstRevision});assert.equal(JSON.stringify(room.match),accepted);
 store.close();const restarted=new RoomStore(directory,{npcDelay:60000});t.after(()=>restarted.close());const restored=await restarted.get(room.id),persist=restarted.persist,before=JSON.stringify(restored.match),revision=restored.revision;
 assert.equal(restored.match.players[0].game.sequenceReward.remaining,1);restarted.persist=async()=>{throw Error('reward disk unavailable');};
 await assert.rejects(send(restarted,restored,'p0',{type:'claim-sequence',choice:choices[1],advance:true}),/reward disk unavailable/);assert.equal(JSON.stringify(restored.match),before);assert.equal(restored.revision,revision);restarted.persist=persist;
 const secondId=randomUUID();await send(restarted,restored,'p0',{type:'claim-sequence',choice:choices[1],advance:true},{requestId:secondId,revision});
 const player=restored.match.players[0].game;assert.equal(restored.match.active,1);assert.equal(restored.match.position,1);assert.equal(player.sequenceReward,null);assert.deepEqual(player.attempts[0].tokenRewards,choices);assert.deepEqual(player.sequences[0].tokenRewards,choices);
 for(const type of E.BONUS_TYPES){const count=choices.filter(t=>t===type).length;assert.equal(player.bank[type],stocks[type]+count);assert.equal(restored.match.statistics.players.p0.gained[type],count);}
 const final=JSON.stringify(restored.match);await send(restarted,restored,'p0',{type:'claim-sequence',choice:choices[1],advance:true},{requestId:secondId,revision});assert.equal(JSON.stringify(restored.match),final);await assert.rejects(send(restarted,restored,'p0',{type:'claim-sequence',choice:'freeze',advance:true}),e=>e.status===409);
});

test('Embruns online with one available slot accepts only that type and hands over after one choice',async t=>{
 const {store,room}=await fixture(t),g=moduleRewardFixture(room,10,{adjust:3,reroll:3,freeze:2});
 assert.equal(g.sequenceReward.total,2);assert.equal(g.sequenceReward.remaining,1);
 const requestId=randomUUID(),revision=room.revision;
 await assert.rejects(send(store,room,'p0',{type:'claim-sequence',choice:'reroll',advance:true}),e=>e.status===409);
 const action={type:'claim-sequence',choice:'freeze',advance:true};
 const view=await send(store,room,'p0',action,{requestId,revision});
 assert.equal(view.match.active,1);assert.deepEqual(view.match.players[0].game.bank,{adjust:3,reroll:3,freeze:3});
 assert.deepEqual(view.match.players[0].game.attempts[0].tokenRewards,['freeze']);
 assert.equal(view.match.statistics.players.p0.gained.freeze,1);
 const retry=await send(store,room,'p0',action,{requestId,revision});assert.deepEqual(retry.match,view.match);
});

test('Double Quai recovery offers one token after two banked tricks and hands over only after the choice',async t=>{
 const {store,room}=await fixture(t),g=moduleRewardFixture(room,7),stock=g.bank.reroll;assert.equal(g.last.rewardTokens,1);assert.equal(g.bank.reroll,stock);assert(!M.dispatch(room.match,{playerId:'p0',type:'proceed'}));
 const copy=M.restore(JSON.parse(JSON.stringify(room.match)));assert.equal(copy.players[0].game.sequenceReward.remaining,1);await store.persist(room);
 await send(store,room,'p0',{type:'claim-sequence',choice:'reroll',advance:true});assert.equal(room.match.active,1);assert.equal(g.bank.reroll,stock+1);assert.deepEqual(g.attempts[0].tokenRewards,['reroll']);assert.equal(room.match.statistics.players.p0.gained.reroll,1);
});

test('older module rules return a clear conflict without modifying the saved online room',async t=>{
 const {store,room,directory}=await fixture(t);store.close();const file=path.join(directory,room.id+'.json'),saved=JSON.parse(await readFile(file,'utf8'));saved.match.version--;
 const original=JSON.stringify(saved);await writeFile(file,original);const next=new RoomStore(directory);t.after(()=>next.close());
 await assert.rejects(next.get(room.id),e=>e.status===409&&e.message.includes('anciennes règles des modules'));assert.equal(await readFile(file,'utf8'),original);assert(!next.rooms.has(room.id));
});

async function readyPlayers(store,room){for(const p of room.match.players)if(p.kind==='human'&&!store.view(room,p.id).riderChoices[p.id])await send(store,room,p.id,{type:'select-rider',skaterId:p.skaterId});}

test('online podium credits both tied ranks once, for host and guest and after restart',async t=>{
 const {store,room,directory}=await fixture(t);
 const guest=await store.join(room,{name:'Guest',seatId:'p1'});
 await readyPlayers(store,room);await send(store,room,'p0',{type:'start'});
 const m=room.match;room.paused=true;
 while(m.phase==='initial'){const p=M.currentPlayer(m);assert(M.dispatch(m,{playerId:p.id,type:'draft',cardId:p.game.offer[0]}));}
 assert(M.startModule(m));m.order=[1,2,3,0];m.round=1;m.position=3;m.active=0;
 for(const [i,p] of m.players.entries()){
  const score=i<2?15:12,g=p.game;
  g.attempt=1;g.phase='result';g.attempts=[{points:score,cards:[],reason:'stop'},{points:0,cards:[],reason:'pass'}];
  if(i)assert(E.proceed(g));
 }
 const action={type:'proceed'},requestId=randomUUID(),revision=room.revision;
 const view=await send(store,room,'p0',action,{requestId,revision}),award=MODULES[m.route[0]].pv;
 const totals=snapshot=>snapshot.players.map(p=>p.game.pv);
 assert.equal(view.match.phase,'recap');
 assert.deepEqual(view.match.recaps[0].runnersUp,['p2','p3']);
 assert.deepEqual(totals(view.match),[award,award,1,1]);
 assert.deepEqual(totals(store.view(room,guest.viewerId).match),totals(view.match));
 assert.deepEqual(totals((await send(store,room,'p0',action,{requestId,revision})).match),totals(view.match));
 store.close();
 const restarted=new RoomStore(directory,{npcDelay:60000});t.after(()=>restarted.close());
 const restored=await restarted.get(room.id);
 assert.deepEqual(restored.match.recaps,view.match.recaps);
 assert.deepEqual(totals(restored.match),totals(view.match));
});

test('a clicked fall and turn handoff persist atomically and retries never advance twice',async t=>{
 const {store,room}=await fixture(t);await readyPlayers(store,room);await send(store,room,'p0',{type:'start'});
 while(room.match.phase==='initial'){const p=M.currentPlayer(room.match);assert(M.dispatch(room.match,{playerId:p.id,type:'draft',cardId:p.game.offer[0]}));}
 assert(M.startModule(room.match));room.paused=true;room.match.order=[0,1,2,3];room.match.position=0;room.match.active=0;
 const g=room.match.players[0].game;g.secured=g.hand.map(c=>c.uid);assert(E.canFall(g));
 const action={type:'fall',advance:true},requestId=randomUUID(),revision=room.revision,before=JSON.stringify(room.match),persist=store.persist;
 store.persist=async()=>{throw Error('disk unavailable');};
 await assert.rejects(send(store,room,'p0',action,{requestId,revision}),/disk unavailable/);
 assert.equal(JSON.stringify(room.match),before);assert.equal(room.revision,revision);store.persist=persist;
 const view=await send(store,room,'p0',action,{requestId,revision});
 assert.equal(view.match.active,1);assert.equal(view.match.position,1);assert.equal(view.match.players[0].game.attempts[0].points,0);
 assert.equal(view.match.players[0].game.attempts[0].reason,'fall');const accepted=JSON.stringify(room.match);
 await send(store,room,'p0',action,{requestId,revision});assert.equal(JSON.stringify(room.match),accepted);
 await assert.rejects(send(store,room,'p0',action),e=>e.status===409);assert.equal(JSON.stringify(room.match),accepted);
});

test('sequence reward and handoff save together and a retried choice never duplicates the token',async t=>{
 const {store,room}=await fixture(t);await readyPlayers(store,room);await send(store,room,'p0',{type:'start'});
 room.match=M.newMatch({seed:1});room.paused=true;
 while(room.match.phase==='initial'){const p=M.currentPlayer(room.match);assert(M.dispatch(room.match,{playerId:p.id,type:'draft',cardId:p.game.offer[0]}));}
 assert(M.startModule(room.match));room.match.order=[0,1,2,3];room.match.active=0;
 // A deterministic three-trick turn isolates atomic reward persistence from
 // the NPC's changing draft preferences and the stochastic new catalog.
 const actor=room.match.players[0].game;
 actor.hand=[0,1,2].map((id,i)=>({...TRICKS[id],uid:'online-sequence-'+i}));
 let sample=0;Object.defineProperty(room.match,'randomSource',{value:()=>((sample++%2?3:2)-.5)/6,configurable:true});
 for(let i=0;i<3;i++){assert(M.dispatch(room.match,{playerId:'p0',type:'choose',cardId:actor.hand[i].uid}));assert(M.dispatch(room.match,{playerId:'p0',type:'roll'}));assert(M.dispatch(room.match,{playerId:'p0',type:'auto'}));assert(M.dispatch(room.match,{playerId:'p0',type:'land'}));if(i<2)assert(M.dispatch(room.match,{playerId:'p0',type:'continue'}));}
 const g=room.match.players[0].game;assert.equal(room.match.position,0);
 assert(g.sequenceReward.pending);const stock=g.bank.freeze,score=g.score;
 const action={type:'claim-sequence',choice:'freeze',advance:true},requestId=randomUUID(),revision=room.revision,before=JSON.stringify(room.match),persist=store.persist;
 store.persist=async()=>{throw Error('disk unavailable');};await assert.rejects(send(store,room,'p0',action,{requestId,revision}),/disk unavailable/);
 assert.equal(JSON.stringify(room.match),before);assert.equal(room.revision,revision);store.persist=persist;
 const view=await send(store,room,'p0',action,{requestId,revision}),player=view.match.players[0].game;
 assert.equal(view.match.active,1);assert.equal(view.match.position,1);assert.equal(player.bank.freeze,stock+1);
 assert.equal(player.attempts[0].points,score);assert.equal(player.attempts[0].tokenReward,'freeze');assert.equal(player.sequences[0].tokenReward,'freeze');
 assert.equal(view.match.statistics.players.p0.gained.freeze,1);const accepted=JSON.stringify(room.match);
 await send(store,room,'p0',action,{requestId,revision});assert.equal(JSON.stringify(room.match),accepted);
 await assert.rejects(send(store,room,'p0',action),e=>e.status===409);assert.equal(JSON.stringify(room.match),accepted);
});
test('lobby rider choice is simultaneous, atomic, unique and required before starting',async t=>{
 const {store}=await fixture(t),created=await store.create({name:'New host'}),room=await store.get(created.roomId);
 assert.deepEqual(created.riderChoices,{p0:null});assert(!created.ready);
 for(let i=1;i<=3;i++){const joined=await store.join(room,{name:'Guest '+i});assert.equal(joined.viewerId,'p'+i);assert.equal(joined.riderChoices[joined.viewerId],null);}
 await assert.rejects(send(store,room,'p0',{type:'start'}),e=>e.status===409);
 const revision=room.revision;
 const race=await Promise.allSettled(['p0','p1'].map(id=>send(store,room,id,{type:'select-rider',skaterId:'iris'},{revision})));
 assert.equal(race.filter(r=>r.status==='fulfilled').length,1);assert.equal(Object.values(room.riderChoices).filter(id=>id==='iris').length,1);
 const unchosen=['p0','p1'].find(id=>!room.riderChoices[id]);
 for(const [id,skaterId] of [[unchosen,'jade'],['p2','ruby'],['p3','sol']])await send(store,room,id,{type:'select-rider',skaterId,color:'#000000'},{revision});
 assert(store.view(room,'p0').ready);assert.equal(new Set(room.match.players.map(p=>p.skaterId)).size,4);
 for(const p of room.match.players){assert.equal(p.skaterId,room.riderChoices[p.id]);assert.equal(p.game.skaterId,p.skaterId);assert.equal(p.color,getSkater(p.skaterId).color);}
 await send(store,room,'p0',{type:'start'});const before=JSON.stringify(room.match);
 await assert.rejects(send(store,room,'p0',{type:'select-rider',skaterId:'neo'}),e=>e.status===409);assert.equal(JSON.stringify(room.match),before);
});
test('changing rider releases the old reservation and NPCs use the remaining colors at launch',async t=>{
 const {store}=await fixture(t),created=await store.create({name:'Host'}),room=await store.get(created.roomId);
 await store.join(room,{name:'Guest'});await send(store,room,'p0',{type:'select-rider',skaterId:'neo'});
 await send(store,room,'p0',{type:'select-rider',skaterId:'iris'});await send(store,room,'p1',{type:'select-rider',skaterId:'neo'});
 await assert.rejects(send(store,room,'p1',{type:'select-rider',skaterId:'iris',playerId:'p0'}),e=>e.status===409);
 await send(store,room,'p0',{type:'start'});assert.equal(new Set(room.match.players.map(p=>p.skaterId)).size,4);
 assert(room.match.players.filter(p=>p.kind==='npc').every(p=>!['iris','neo'].includes(p.skaterId)));
});
test('rider reservations survive restart, duplicate requests and failed persistence without stealing a choice',async t=>{
 const {store,directory}=await fixture(t),created=await store.create({name:'Host'}),room=await store.get(created.roomId);
 await store.join(room,{name:'Guest'});const before=JSON.stringify([room.riderChoices,room.match]),persist=store.persist;
 store.persist=async()=>{throw Error('disk unavailable');};await assert.rejects(send(store,room,'p0',{type:'select-rider',skaterId:'ruby'}),/disk unavailable/);
 assert.equal(JSON.stringify([room.riderChoices,room.match]),before);store.persist=persist;
 const requestId=randomUUID(),revision=room.revision,action={type:'select-rider',skaterId:'ruby'};await send(store,room,'p0',action,{requestId,revision});const accepted=room.revision;
 await send(store,room,'p0',action,{requestId,revision});assert.equal(room.revision,accepted);store.close();
 const restarted=new RoomStore(directory,{npcDelay:60000});t.after(()=>restarted.close());const restored=await restarted.get(room.id);
 assert.deepEqual(restored.riderChoices,{p0:'ruby',p1:null});assert.equal(restored.match.players[0].color,getSkater('ruby').color);assert(!restarted.view(restored,'p1').ready);
});
test('simultaneous human picks accept one shared revision and keep commitments private until the barrier',async t=>{
 const {store,room}=await fixture(t);for(const seatId of ['p1','p2','p3'])await store.join(room,{name:seatId,seatId});
 await readyPlayers(store,room);await send(store,room,'p0',{type:'start'});const revision=room.revision;
 const choices=Object.fromEntries(room.match.players.map(p=>[p.id,p.game.offer[0]]));
 const first={type:'draft',cardId:choices.p0,draftRound:0},requestId=randomUUID();
 await send(store,room,'p0',first,{revision,requestId});
 const guest=store.view(room,'p1').match;
 assert.equal(guest.players[0].game.hand.length,0);assert.equal(guest.initialSelections.p0,true);assert.deepEqual(Object.keys(guest.initialPackets),['p1']);assert.equal(guest.draftLog.length,0);
 await send(store,room,'p0',first,{revision,requestId});assert.equal(room.match.players[0].game.hand.length,1);
 const results=await Promise.allSettled(['p3','p1','p2'].map(id=>send(store,room,id,{type:'draft',cardId:choices[id],draftRound:0},{revision})));
 assert(results.every(r=>r.status==='fulfilled'));assert.equal(room.match.draftRound,1);
 assert.equal(store.view(room,'p1').match.players[0].game.hand.length,1);assert.equal(room.match.draftLog.length,4);
 await assert.rejects(send(store,room,'p0',{type:'draft',cardId:room.match.players[0].game.offer[0],draftRound:0},{revision}),e=>e.status===409);
});

test('host creates a durable waiting room with six modules and private credentials',async t=>{
 const {store,directory,host,room}=await fixture(t);
 assert.equal(host.started,false);assert.equal(host.isHost,true);assert.equal(host.match.route.length,6);assert.equal(host.match.players.length,4);
 assert.equal(store.authenticate(room,host.token),'p0');assert.throws(()=>store.authenticate(room,'wrong'),e=>e.status===403);
 const raw=JSON.parse(await readFile(path.join(directory,host.roomId+'.json'),'utf8'));
 assert.equal(raw.match.deck.length,85);assert.equal(raw.members.p0.token,host.token);assert(!JSON.stringify(host.match).includes('rngState'));assert(!JSON.stringify(host.match).includes('randomSource'));
});
test('host-selected NPC difficulty is authoritative, visible and restored from disk',async t=>{
 const {store,directory}=await fixture(t),created=await store.create({name:'Difficulty test',skaterId:'neo',npcCount:1,npcDifficulty:'easy'});
 assert.equal(created.match.npcDifficulty,'easy');store.close();const restarted=new RoomStore(directory,{npcDelay:60000});t.after(()=>restarted.close());
 const room=await restarted.get(created.roomId);assert.equal(restarted.view(room,'p0').match.npcDifficulty,'easy');
});
test('an invitation claims one NPC atomically and a second claimant cannot steal it',async t=>{
 const {store,room}=await fixture(t);
 const results=await Promise.allSettled([store.join(room,{name:'Alice',seatId:'p1'}),store.join(room,{name:'Bob',seatId:'p1'})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(room.match.players[1].kind,'human');
 assert.equal(room.match.players[1].game.name,'Alice');assert.equal(store.authenticate(room,results[0].value.token),'p1');
 assert(!JSON.stringify(store.lobby(room)).includes(results[0].value.token));
});
test('skater choice swaps only NPCs before start and cannot change a human or an active color',async t=>{
 const {store,room}=await fixture(t),other=room.match.players[2].skaterId;
 const joined=await store.join(room,{name:'Alice',seatId:'p1',skaterId:other});
 assert.equal(room.match.players[1].skaterId,other);assert.equal(new Set(room.match.players.map(p=>p.skaterId)).size,4);
 await assert.rejects(store.join(room,{name:'Bob',seatId:'p2',skaterId:'neo'}),e=>e.status===409);
 await readyPlayers(store,room);await send(store,room,'p0',{type:'start'});
 await assert.rejects(store.join(room,{name:'Bob',seatId:'p2',skaterId:other}),e=>e.status===409);
 assert.equal(joined.match.viewerId,'p1');
});
test('guests cannot start, advance, control NPCs, impersonate the host or change someone else’s draft',async t=>{
 const {store,room}=await fixture(t);await store.join(room,{name:'Alice',seatId:'p1'});
 for(const type of ['start','start-module','next-module','npc-pause','npc-speed','release-seat'])await assert.rejects(send(store,room,'p1',{type}),e=>e.status===403);
 await readyPlayers(store,room);await send(store,room,'p0',{type:'start'});
 const active=M.currentPlayer(room.match),outsider=active.id==='p0'?'p1':'p0',before=JSON.stringify(room.match);
 await assert.rejects(send(store,room,outsider,{type:'draft',playerId:active.id,cardId:active.game.offer[0]}),e=>e.status===409);
 assert.equal(JSON.stringify(room.match),before);
});
test('stale commands are rejected and retrying an acknowledged command does not execute it twice',async t=>{
 const {store,room}=await fixture(t),requestId=randomUUID(),revision=room.revision;
 await send(store,room,'p0',{type:'start'},{requestId,revision});const after=JSON.stringify(room.match),rev=room.revision;
 await send(store,room,'p0',{type:'start'},{requestId,revision});assert.equal(room.revision,rev);assert.equal(JSON.stringify(room.match),after);
 await assert.rejects(send(store,room,'p0',{type:'npc-pause',paused:true},{revision}),e=>e.status===409);
});
test('redacted snapshots expose only the viewer’s offers, hide the deck and RNG, and have no seat tokens',async t=>{
 const {store,room,host}=await fixture(t);const guest=await store.join(room,{name:'Alice',seatId:'p1'});
 const active=M.currentPlayer(room.match),view=store.view(room,active.id);
 assert.deepEqual(view.match.deck,[]);assert.equal(view.match.players.find(p=>p.id===active.id).game.deck.length,3);
 for(const p of view.match.players)if(p.id!==active.id){assert.deepEqual(p.game.offer,[]);assert.deepEqual(p.game.deck,[]);}
 const text=JSON.stringify(view);assert(!text.includes(host.token));assert(!text.includes(guest.token));assert(!text.includes('rngState'));assert(!text.includes('randomSource'));
});
test('all hands and tables are public for inspection while unchosen offers and access codes stay private',async t=>{
 const {store,room}=await fixture(t);
 while(room.match.phase==='initial'){const p=M.currentPlayer(room.match);assert(M.dispatch(room.match,{playerId:p.id,type:'draft',cardId:p.game.offer[0]}));}
 assert(M.startModule(room.match));
 for(const viewerId of ['p0','p1']){
  const view=store.view(room,viewerId);
  for(const p of room.match.players){const visible=view.match.players.find(v=>v.id===p.id).game;assert.deepEqual(visible.hand,p.game.hand);assert.equal(visible.hand.length,6);assert.deepEqual(visible.dice,p.game.dice);assert.deepEqual(visible.sequences,p.game.sequences);}
  assert.deepEqual(view.match.deck,[]);assert(!JSON.stringify(view).includes('rngState'));
 }
});
test('restarting the host restores members, cards, turn order and credentials without replaying awards',async t=>{
 const {store,room,host,directory}=await fixture(t),guest=await store.join(room,{name:'Alice',seatId:'p1'});
 await send(store,room,'p0',{type:'npc-pause',paused:true});await readyPlayers(store,room);await send(store,room,'p0',{type:'start'});
 const snapshot=JSON.stringify(room.match);store.close();const restarted=new RoomStore(directory);t.after(()=>restarted.close());const restored=await restarted.get(room.id);
 assert.equal(JSON.stringify(restored.match),snapshot);assert.equal(restarted.authenticate(restored,host.token),'p0');assert.equal(restarted.authenticate(restored,guest.token),'p1');assert(restored.paused);assert.equal(typeof restored.match.randomSource,'function');
});
test('a friend replacing a NPC after start inherits its hand, dice, tokens and score',async t=>{
 const {store,room}=await fixture(t);await send(store,room,'p0',{type:'npc-pause',paused:true});await readyPlayers(store,room);await send(store,room,'p0',{type:'start'});
 const before=structuredClone(room.match.players[1].game);const guest=await store.join(room,{name:'Alice',seatId:'p1'});
 const after=room.match.players[1].game;for(const key of ['hand','dice','bank','pv','route','attempt','landed'])assert.deepEqual(after[key],before[key]);assert.equal(guest.viewerId,'p1');
});
test('a full six-module competition completes through authenticated seat commands with persisted scores',async t=>{
 const {store,room}=await fixture(t);for(const seatId of ['p1','p2','p3'])await store.join(room,{name:'Friend '+seatId,seatId});
 await readyPlayers(store,room);await send(store,room,'p0',{type:'start'});
 let steps=0;while(room.match.phase!=='complete'){
  assert(++steps<2200);
  if(room.match.phase==='recap')await send(store,room,'p0',{type:'next-module'});
  else if(room.match.phase==='draft-summary')await send(store,room,'p0',{type:'start-module'});
  else{const p=M.currentPlayer(room.match);await send(store,room,p.id,decide(p.game));}
 }
 assert.equal(room.match.recaps.length,6);assert(room.match.players.every(p=>p.game.history.length===6));
 for(const p of room.match.players)assert.equal(p.game.pv,p.game.history.reduce((sum,h)=>sum+h.pv,0));
 const cards=[...room.match.deck,...room.match.market.cards,...room.match.discard,...room.match.players.flatMap(p=>p.game.hand)];assert.equal(cards.length,85);assert.equal(new Set(cards.map(c=>c.uid)).size,85);
});

test('only content-versioned trick and module layers are cached; unversioned assets and room information remain uncached',async t=>{
 const {directory}=await fixture(t),root=fileURLToPath(new URL('../public/',import.meta.url));
 const app=createGameServer({root,directory,port:0,npcDelay:60000});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');t.after(()=>new Promise(resolve=>app.server.close(resolve)));
 const base='http://127.0.0.1:'+app.server.address().port;
 for(const card of [TRICKS[0],MODULES[0]])for(const file of Object.values(card.layers)){const r=await fetch(base+'/'+file);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'public, max-age=31536000, immutable');await r.arrayBuffer();}
 for(const url of ['/api/info','/app.js',...[TRICKS[0],MODULES[0]].map(c=>'/'+c.layers.illustration.split('?')[0])]){const r=await fetch(base+url);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');await r.arrayBuffer();}
});

test('old online recovery drafts migrate atomically once and notify polling clients with a new revision',async t=>{
 const {store,room,host,directory}=await fixture(t),m=room.match;
 const act=(type,extra={})=>M.dispatch(m,{playerId:M.currentPlayer(m).id,type,...extra});
 while(m.phase==='initial')assert(act('draft',{cardId:M.currentPlayer(m).game.offer[0]}));assert(M.startModule(m));
 for(let i=0;i<8;i++){assert(act('pass'));assert(act('proceed'));}assert(M.advance(m));
 const extra=m.deck.filter(c=>c.tier===m.market.tier).slice(0,4),ids=new Set(extra.map(c=>c.uid));
 m.deck=m.deck.filter(c=>!ids.has(c.uid));m.market.cards.push(...extra);delete m.market.cardsPerPlayer;
 assert(act('draft-pair',{cardId:m.market.cards[0].uid,tokenId:m.market.tokens[0].id}));
 room.started=true;room.paused=true;await store.persist(room);store.close();
 const file=path.join(directory,room.id+'.json'),before=await readFile(file,'utf8'),hands=structuredClone(m.players.map(p=>p.game.hand)),banks=structuredClone(m.players.map(p=>p.game.bank));
 const restarted=new RoomStore(directory,{npcDelay:60000});t.after(()=>restarted.close());const persist=restarted.persist;
 restarted.persist=async()=>{throw Error('migration disk unavailable');};
 await assert.rejects(restarted.get(room.id),/migration disk unavailable/);assert(!restarted.rooms.has(room.id));assert.equal(await readFile(file,'utf8'),before);
 restarted.persist=persist;
 const [restored,concurrent]=await Promise.all([restarted.get(room.id),restarted.get(room.id)]);assert.equal(restored,concurrent);
 assert.equal(restored.revision,room.revision+1);assert.equal(restored.match.revision,m.revision+1);assert.equal(restored.match.market.cardsPerPlayer,1);
 assert.equal(restored.match.market.cards.length,3);assert.equal(restored.match.market.tokens.length,3);
 assert.deepEqual(restored.match.players.map(p=>p.game.hand),hands);assert.deepEqual(restored.match.players.map(p=>p.game.bank),banks);
 assert.equal(restarted.authenticate(restored,host.token),'p0');assert.equal(restarted.view(restored,'p0').revision,room.revision+1);
 const inventory=[...restored.match.deck,...restored.match.discard,...restored.match.market.cards,...restored.match.players.flatMap(p=>p.game.hand)];assert.equal(inventory.length,85);assert.equal(new Set(inventory.map(c=>c.uid)).size,85);
 const persisted=JSON.parse(await readFile(file,'utf8'));assert.equal(persisted.match.market.cardsPerPlayer,1);assert.equal(persisted.revision,restored.revision);
 restarted.close();const again=new RoomStore(directory,{npcDelay:60000});t.after(()=>again.close());const second=await again.get(room.id);
 assert.equal(second.revision,restored.revision);assert.equal(second.match.revision,restored.match.revision);assert.deepEqual(second.match.market,restored.match.market);
});

test('online players can take the visible lower-tier reserve without exposing a hidden future tier',async t=>{
 const {store,room}=await fixture(t);for(const seatId of ['p1','p2','p3'])await store.join(room,{name:'Friend '+seatId,seatId});await readyPlayers(store,room);await send(store,room,'p0',{type:'start'});
 const m=room.match;
 const act=(type,extra={})=>M.dispatch(m,{playerId:M.currentPlayer(m).id,type,...extra});
 while(m.phase==='initial')assert(act('draft',{cardId:M.currentPlayer(m).game.offer[0]}));assert(M.startModule(m));
 for(let module=0;module<2;module++){
  for(let i=0;i<8;i++){assert(act('pass'));assert(act('proceed'));}assert(M.advance(m));
  if(module===0){while(m.phase==='recovery')assert(act('draft-pair',{cardId:m.market.cards[0].uid,tokenId:m.market.tokens[0].id}));assert(M.startModule(m));}
 }
 assert.equal(m.market.tier,'advanced');const actor=M.currentPlayer(m),view=store.view(room,actor.id),lower=view.match.market.reserve[0];assert(lower);
 assert.deepEqual(view.match.deck,[]);assert(view.match.market.reserve.every(c=>c.tier==='base'));assert(view.match.market.cards.every(c=>c.tier==='advanced'));
 assert.equal(view.match.players.find(p=>p.id===actor.id).game.draftCards.length,m.market.cards.length+m.market.reserve.length);
 const before=actor.game.hand.length,token=m.market.tokens[0];await send(store,room,actor.id,{type:'draft-pair',cardId:lower.uid,tokenId:token.id});
 const updated=store.view(room,actor.id);assert.equal(updated.match.players.find(p=>p.id===actor.id).game.hand.length,before+1);assert(!updated.match.market.reserve.some(c=>c.uid===lower.uid));assert(!room.match.deck.some(c=>c.uid===lower.uid));
});
test('HTTP API authenticates seats, keeps local host controls off the public tunnel and rejects cross-origin requests',async t=>{
 const {directory}=await fixture(t),root=fileURLToPath(new URL('../public/',import.meta.url));
 const app=createGameServer({root,directory,port:0,npcDelay:60000});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');t.after(()=>new Promise(resolve=>app.server.close(resolve)));
 const base='http://127.0.0.1:'+app.server.address().port;
 const info=await fetch(base+'/api/info').then(r=>r.json());assert(info.canHost);assert(info.localKey);
 const publicInfo=await fetch(base+'/api/info',{headers:{'cf-ray':'test'}}).then(r=>r.json());assert.equal(publicInfo.canHost,false);assert.equal(publicInfo.localKey,null);
 const post=(url,data,headers={})=>fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
 assert.equal((await post('/api/rooms',{skaterId:'neo'})).status,403);
 assert.equal((await post('/api/rooms',{skaterId:'neo'},{'X-Sk8-Local-Key':info.localKey,Origin:'https://other.example'})).status,403);
 const created=await post('/api/rooms',{name:'Host',skaterId:'neo'},{'X-Sk8-Local-Key':info.localKey}).then(r=>r.json());assert(created.roomId);
 assert.equal((await fetch(base+'/.local-games/'+created.roomId+'.json')).status,404);
 assert.equal((await post('/api/rooms',{name:'Intruder',skaterId:'neo'},{'X-Sk8-Local-Key':info.localKey,'cf-ray':'public-request'})).status,403);
 assert.equal((await fetch(base+'/api/rooms/'+created.roomId)).status,403);
 const guest=await post('/api/rooms/'+created.roomId+'/join',{name:'Alice',seatId:'p1'}).then(r=>r.json());assert(guest.token);
 const snapshot=await fetch(base+'/api/rooms/'+created.roomId,{headers:{Authorization:'Bearer '+guest.token}}).then(r=>r.json());assert.equal(snapshot.viewerId,'p1');assert(!JSON.stringify(snapshot).includes(created.token));
 const unchanged=await fetch(base+'/api/rooms/'+created.roomId+'?revision='+snapshot.revision,{headers:{Authorization:'Bearer '+guest.token}}).then(r=>r.json());assert.equal(unchanged.unchanged,true);assert(!('match' in unchanged));assert(unchanged.members.length===4);
 const spoof=await post('/api/rooms/'+created.roomId+'/command',{action:{type:'start',playerId:'p0'},revision:snapshot.revision,requestId:randomUUID()},{Authorization:'Bearer '+guest.token});assert.equal(spoof.status,403);
});

test('a disk write failure rolls back the command and its revision instead of acknowledging an unsaved move',async t=>{
 const {store,room}=await fixture(t),before=JSON.stringify(room.match),revision=room.revision,persist=store.persist;
 store.persist=async()=>{throw Error('disk unavailable');};await assert.rejects(send(store,room,'p0',{type:'start'}),/disk unavailable/);
 assert.equal(room.started,false);assert.equal(room.revision,revision);assert.equal(JSON.stringify(room.match),before);store.persist=persist;
 await readyPlayers(store,room);await send(store,room,'p0',{type:'start'});assert(room.started);
});
test('authoritative duration excludes lobby, pause and restart downtime and survives disk restoration',async t=>{
 let now=1000;const {store,room,directory}=await fixture(t,{now:()=>now});
 now=20000;assert.equal(M.matchSummary(room.match).durationMs,null);await readyPlayers(store,room);await send(store,room,'p0',{type:'start'});
 now=27000;await send(store,room,'p0',{type:'npc-pause',paused:true});assert.equal(M.matchSummary(room.match).durationMs,7000);
 now=57000;await send(store,room,'p0',{type:'npc-pause',paused:false});
 now=67000;await send(store,room,'p0',{type:'npc-speed',fast:true});assert.equal(M.matchSummary(room.match).durationMs,17000);
 store.close();now+=86400000;
 const restarted=new RoomStore(directory,{npcDelay:60000,now:()=>now});t.after(()=>restarted.close());const restored=await restarted.get(room.id);
 assert.equal(M.matchSummary(restored.match).durationMs,17000);
 now+=3000;await send(restarted,restored,'p0',{type:'npc-pause',paused:true});assert.equal(M.matchSummary(restored.match).durationMs,20000);
 assert(M.matchSummary(restored.match).durationComplete);assert(!JSON.stringify(restarted.view(restored,'p0')).includes('clockRuntime'));
});
test('failed persistence and duplicate requests never double-count spent tokens or elapsed time',async t=>{
 let now=1000;const {store,room}=await fixture(t,{now:()=>now});await readyPlayers(store,room);await send(store,room,'p0',{type:'start'});
 while(room.match.phase==='initial'){const p=M.currentPlayer(room.match);assert(M.dispatch(room.match,{playerId:p.id,type:'draft',cardId:p.game.offer[0]}));}
 assert(M.startModule(room.match));room.match.order=[0,1,2,3];room.match.active=0;
 const g=room.match.players[0].game;await send(store,room,'p0',{type:'choose',cardId:E.options(g)[0].uid});await send(store,room,'p0',{type:'roll'});
 const action={type:'bonus',bonusType:'adjust',id:0,delta:g.dice[0].face<6?1:-1},before=JSON.stringify(room.match),persist=store.persist;
 now=6000;store.persist=async()=>{throw Error('disk unavailable');};await assert.rejects(send(store,room,'p0',action),/disk unavailable/);assert.equal(JSON.stringify(room.match),before);
 store.persist=persist;const requestId=randomUUID(),revision=room.revision;now=10000;await send(store,room,'p0',action,{requestId,revision});
 assert.equal(M.matchSummary(room.match).players[0].tokens.spent.adjust,1);assert.equal(M.matchSummary(room.match).durationMs,9000);
 const accepted=JSON.stringify(room.match);now=20000;await send(store,room,'p0',action,{requestId,revision});assert.equal(JSON.stringify(room.match),accepted);
});
test('an automatic NPC pause after a write failure also stops the duration clock',async t=>{
 let now=1000;const {store,room}=await fixture(t,{now:()=>now,npcDelay:1});
 while(room.match.phase==='initial'){const p=M.currentPlayer(room.match);assert(M.dispatch(room.match,{playerId:p.id,type:'draft',cardId:p.game.offer[0]}));}
 assert(M.startModule(room.match));room.started=true;room.match.active=1;M.setClockRunning(room.match,true,()=>now);
 let attempted;const failure=new Promise(resolve=>attempted=resolve);t.mock.method(console,'error',()=>{});
 store.persist=async()=>{attempted();throw Error('disk unavailable');};now=2000;store.schedule(room);room.timer.ref();
 await failure;await room.queue;await new Promise(resolve=>setImmediate(resolve));
 assert(room.paused);const elapsed=M.matchSummary(room.match).durationMs;assert.equal(elapsed,1000);
 now=7000;M.checkpointClock(room.match);assert.equal(M.matchSummary(room.match).durationMs,elapsed);
});
