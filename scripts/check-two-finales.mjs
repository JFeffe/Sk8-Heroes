import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createGameServer} from '../server/http-server.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/jeanf/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {server,tunnel}=createGameServer({root:fileURLToPath(new URL('../public/',import.meta.url)),directory:fileURLToPath(new URL('../tmp/finales-browser/',import.meta.url))});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const fixture=sessionStorage.getItem('finales-fixture');if(fixture){localStorage.setItem('sk8-match-v'+JSON.parse(fixture).version,fixture);sessionStorage.removeItem('finales-fixture');}});
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.evaluate(async()=>{
  const M=await import('/match.js'),m=M.newMatch({seed:580,npcCount:3});
  m.route=[0,1,4,5,6,9];for(const p of m.players){p.kind='human';p.game.route=[...m.route];}
  const cmd=(type,extra={})=>{if(!M.dispatch(m,{playerId:M.currentPlayer(m).id,type,...extra}))throw Error('Rejected '+type);};
  while(m.phase==='initial')cmd('draft',{cardId:M.currentPlayer(m).game.offer[0]});
  M.startModule(m);
  for(let round=0;round<4;round++){
   for(let attempt=0;attempt<8;attempt++){cmd('pass');cmd('proceed');}
   M.advance(m);
   if(round<3){while(m.phase==='recovery')cmd('draft-pair',{cardId:m.market.cards[0].uid,tokenId:m.market.tokens[0].id});M.startModule(m);}
  }
  m.draftOrder=[0,1,2,3];m.position=0;m.active=0;
  sessionStorage.setItem('finales-fixture',JSON.stringify(m));
 });
 const resume=async()=>{await page.reload();await page.getByRole('button',{name:'Reprendre',exact:true}).click();};
 await resume();
 for(const round of [5,6]){
  assert.match(await page.locator('.draft-title .eyebrow').innerText(),/ÉPIQUE/);
  assert.equal(await page.locator('.campaign-offer .trick-card').count(),4);
  const stock=await page.evaluate(async()=>{const M=await import('/match.js'),m=JSON.parse(localStorage.getItem('sk8-match-v'+M.MATCH_VERSION));return {module:m.module,tier:m.market.tier,epics:m.deck.filter(c=>c.tier==='epic').length,cards:m.market.cards.map(c=>c.tier)};});
  assert.equal(stock.module,round-2);assert.equal(stock.tier,'epic');assert(stock.cards.every(t=>t==='epic'));assert.equal(stock.epics,round===5?5:1);
  await page.screenshot({path:`tests/screenshots/epic-draft-before-${round}.png`,fullPage:true});
  await page.locator('.campaign-offer [data-action="select-draft-card"]').first().click();
  await page.locator('[data-action="select-draft-token"]:not([disabled])').first().click();
  await page.locator('[data-action="confirm-draft"]').click();
  await page.evaluate(async()=>{const M=await import('/match.js'),m=M.restore(JSON.parse(localStorage.getItem('sk8-match-v'+M.MATCH_VERSION)));while(m.phase==='recovery'){if(!M.dispatch(m,{playerId:M.currentPlayer(m).id,type:'draft-pair',cardId:m.market.cards[0].uid,tokenId:m.market.tokens[0].id}))throw Error('Cannot finish draft');}sessionStorage.setItem('finales-fixture',JSON.stringify(m));});
  await resume();
  await page.locator('[data-action="start-module"]').click();
  assert.match(await page.locator('.module-route-list [aria-current="step"] .module-route-button').getAttribute('aria-label'),new RegExp('Manche '+round));
  const state=await page.evaluate(async()=>{const M=await import('/match.js'),{MODULES}=await import('/data.js'),m=JSON.parse(localStorage.getItem('sk8-match-v'+M.MATCH_VERSION));return {round:m.module+1,module:MODULES[m.route[m.module]].name,pv:MODULES[m.route[m.module]].pv,epics:m.players.map(p=>p.game.hand.filter(c=>c.tier==='epic').length)};});
  assert.equal(state.pv,4);assert(state.epics.every(n=>n===round-4));console.log(JSON.stringify(state));
  if(round===5){
   await page.evaluate(async()=>{const M=await import('/match.js'),m=M.restore(JSON.parse(localStorage.getItem('sk8-match-v'+M.MATCH_VERSION)));for(let i=0;i<8;i++){const p=M.currentPlayer(m);if(!M.dispatch(m,{playerId:p.id,type:'pass'})||!M.dispatch(m,{playerId:p.id,type:'proceed'}))throw Error('Cannot finish module 5');}M.advance(m);m.draftOrder=[0,1,2,3];m.position=0;m.active=0;sessionStorage.setItem('finales-fixture',JSON.stringify(m));});
   await resume();
  }
 }
 await page.screenshot({path:'tests/screenshots/two-finales-module-six.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('Both Epic drafts confirmed through the UI; both promoted modules award 4 trophies.');
}finally{await browser.close();tunnel.stop();await new Promise(resolve=>server.close(resolve));}
