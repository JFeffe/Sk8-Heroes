import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/jeanf/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createGameServer}=await import('../server/http-server.mjs');
const {fileURLToPath}=await import('node:url');
const {server,tunnel}=createGameServer({root:fileURLToPath(new URL('../public/',import.meta.url)),directory:fileURLToPath(new URL('../tmp/physical-browser/',import.meta.url))});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe"});
const page=await browser.newPage({viewport:{width:1366,height:900}});
await page.addInitScript(()=>{const fixture=sessionStorage.getItem('physical-fixture');if(fixture){localStorage.setItem('sk8-match-v'+JSON.parse(fixture).version,fixture);sessionStorage.removeItem('physical-fixture');}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:'+server.address().port);
await page.evaluate(async()=>{
 const M=await import('/match.js');const m=M.newMatch({seed:18,npcCount:3,skaterId:'neo'});
 while(m.phase==='initial'){const p=M.currentPlayer(m);M.dispatch(m,{playerId:p.id,type:'draft',cardId:p.game.offer[0],draftRound:m.draftRound});}
 M.startModule(m);m.active=0;m.order=[0,1,2,3];m.position=0;
 localStorage.setItem('sk8-match-v'+M.MATCH_VERSION,JSON.stringify(m));
});
await page.reload();await page.getByRole('button',{name:'Reprendre',exact:true}).click();
await page.locator('.skater-mat').waitFor();
const park=await page.locator('.park-card').evaluate(el=>({markers:el.querySelectorAll('.park-marker').length,tens:[...el.querySelectorAll('.park-tens li')].map(c=>Number(c.dataset.value)),units:[...el.querySelectorAll('.park-units li')].map(c=>Number(c.dataset.value)),ratio:el.offsetWidth/el.offsetHeight}));
if(park.markers!==8||park.tens.join()!=='30,20,10,0'||park.units.join()!=='8,9,6,7,4,5,2,3,0,1')throw Error('Invalid shared park: '+JSON.stringify(park));
console.log(JSON.stringify({park}));
await page.screenshot({path:'tests/screenshots/physical-table-desktop.png',fullPage:true});
console.log(JSON.stringify({errors,mat:await page.locator('.skater-mat').count(),piles:await page.locator('.physical-pile').count(),viewport:await page.evaluate(()=>({w:innerWidth,h:innerHeight,scroll:document.documentElement.scrollWidth}))}));
await page.setViewportSize({width:390,height:844});await page.mouse.move(0,0);await page.waitForTimeout(300);await page.screenshot({path:'tests/screenshots/physical-table-mobile.png',fullPage:true});
console.log(JSON.stringify(await page.evaluate(()=>({w:innerWidth,scroll:document.documentElement.scrollWidth}))));
await page.setViewportSize({width:1366,height:768});await page.mouse.move(0,0);await page.waitForTimeout(300);
await page.locator('[data-action="choose"][aria-disabled="false"]').first().click();
await page.locator('[data-action="roll"]').click();
await page.waitForTimeout(450);
await page.screenshot({path:'tests/screenshots/physical-table-play.png',fullPage:true});
console.log(JSON.stringify({rolled:await page.locator('.table-card').count(),bonusOnMat:await page.locator('.skater-mat [data-action="plus"]:enabled').count(),dynamicChance:await page.locator('.layered-chance').count()}));
await page.locator('[data-action="view-player"][data-id="p1"]').click();
console.log(JSON.stringify({otherSkater:await page.locator('.skater-mat h2').innerText(),bonusDisabled:await page.locator('.skater-mat [data-action="plus"]:disabled').count(),errors}));
// A completed module with two tied winners exercises markers, trophy awards and reset timing.
await page.evaluate(async()=>{
 const M=await import('/match.js'),key='sk8-match-v'+M.MATCH_VERSION,m=M.restore(JSON.parse(localStorage.getItem(key)));
 for(const [i,p] of m.players.entries()){p.kind='human';p.game.attempts=[{points:i<2?27:12,cards:[],reason:'stop'},{points:0,cards:[],reason:'fall'}];p.game.history=[{best:p.game.attempts[0].points,attempts:structuredClone(p.game.attempts),pv:0}];}
 M.settleModule(m);sessionStorage.setItem('physical-fixture',JSON.stringify(m));
});
await page.reload();await page.getByRole('button',{name:'Reprendre',exact:true}).click();
await page.locator('.park-card').click();await page.locator('.park-detail-modal').waitFor();await page.waitForTimeout(300);
await page.screenshot({path:'tests/screenshots/shared-park-records.png',fullPage:true});
await page.getByRole('button',{name:'Fermer',exact:true}).click();
await page.evaluate(async()=>{
 const M=await import('/match.js'),key='sk8-match-v'+M.MATCH_VERSION,m=M.restore(JSON.parse(localStorage.getItem(key)));
 M.advance(m);
 while(m.phase==='recovery')M.dispatch(m,{playerId:M.currentPlayer(m).id,type:'draft-pair',cardId:m.market.cards[0].uid,tokenId:m.market.tokens[0].id});
 sessionStorage.setItem('physical-fixture',JSON.stringify(m));
});
await page.reload();await page.getByRole('button',{name:'Reprendre',exact:true}).click();
if(await page.locator('.park-tens [data-value="20"] .park-marker').count()!==2)throw Error('Records reset before module start');
await page.locator('[data-action="start-module"]').click();
if(await page.locator('.park-tens [data-value="0"] .park-marker').count()!==4||await page.locator('.park-units [data-value="0"] .park-marker').count()!==4)throw Error('Records not reset');
if(Number(await page.locator('.trophy-stock>strong').innerText())<=0)throw Error('Trophies lost after module reset');
await page.mouse.move(0,0);await page.waitForTimeout(300);
await page.screenshot({path:'tests/screenshots/shared-park-new-module.png',fullPage:true});
console.log(JSON.stringify({reset:true,trophies:Number(await page.locator('.trophy-stock>strong').innerText()),errors}));
if(errors.length)throw Error(errors.join('; '));
await browser.close();tunnel.stop();server.close();
