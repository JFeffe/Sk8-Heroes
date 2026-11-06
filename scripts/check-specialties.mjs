import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createGameServer} from '../server/http-server.mjs';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/jeanf/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {server,tunnel}=createGameServer({root:fileURLToPath(new URL('../public/',import.meta.url)),directory:fileURLToPath(new URL('../tmp/specialties-browser/',import.meta.url))});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const fixture=sessionStorage.getItem('power-fixture');if(fixture){localStorage.setItem('sk8-match-v'+JSON.parse(fixture).version,fixture);sessionStorage.removeItem('power-fixture');}});
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.locator('[data-action="create"]').first().click();assert.equal(await page.locator('[name="mode"]').inputValue(),'base');
 assert.equal(await page.locator('.setup-power:visible').count(),0);
 await page.locator('[name="mode"]').selectOption('advanced');assert.equal(await page.locator('.setup-power:visible').count(),6);
 await page.locator('[name="skaterId"][value="neo"]').check();await page.locator('#setup button[type="submit"]').click();
 assert.equal(await page.evaluate(async()=>{const M=await import('/match.js');return JSON.parse(localStorage.getItem('sk8-match-v'+M.MATCH_VERSION)).mode;}),'advanced');
 for(const skater of ['neo','ruby','jade','sol','milo','iris']){
  await page.evaluate(async skater=>{
   const M=await import('/match.js'),m=M.newMatch({skaterId:skater,mode:'advanced',seed:601});m.players.forEach(p=>p.kind='human');
   while(m.phase==='initial')M.dispatch(m,{playerId:M.currentPlayer(m).id,type:'draft',cardId:M.currentPlayer(m).game.offer[0]});
   M.startModule(m);m.order=[0,1,2,3];m.position=0;m.active=0;const g=m.players[0].game;
   if(['ruby','sol'].includes(skater)){g.phase='rolled';g.rolls=1;g.active=g.hand[0].uid;g.dice.forEach(d=>d.face=4);}
   if(skater==='sol')g.bank={adjust:4,reroll:3,freeze:3};
   if(skater==='jade'){g.attempt=1;m.round=1;g.secured=[g.hand[0].uid];g.attempts=[{points:4,cards:[g.hand[0].name],reason:'stop'}];g.sequences=[{attempt:0,points:4,entries:[{card:g.hand[0].uid,dice:[],bonus:0}]}];}
   if(skater==='milo'){g.phase='result';g.score=8;g.reason='stop';g.last={success:true,points:8};g.attempts=[g.last];g.landed=[{card:g.hand[0].uid,dice:[0,1]},{card:g.hand.find(c=>c.type!==g.hand[0].type).uid,dice:[2,3]}];}
   if(skater==='iris'){g.phase='result';g.score=0;g.reason='fall';g.last={success:false,points:0};g.attempts=[g.last];g.used.freeze=1;g.bank.freeze=0;}
   sessionStorage.setItem('power-fixture',JSON.stringify(m));
  },skater);
  await page.reload();await page.getByRole('button',{name:'Reprendre',exact:true}).click();
  assert.equal(await page.locator('.advanced-skater').count(),1);assert.equal(await page.locator('.specialty-token:not(.is-used)').count(),1);
  const layout=await page.locator('.skater-specialty').evaluate(el=>({height:el.clientHeight,content:el.scrollHeight,bottom:el.getBoundingClientRect().bottom,slots:el.parentElement.querySelector('.skater-bonus-area').getBoundingClientRect().top}));
  assert(layout.content<=layout.height+1&&layout.bottom<=layout.slots,skater+' power layout: '+JSON.stringify(layout));
  if(['jade','sol'].includes(skater)){
   await page.mouse.move(0,0);await page.screenshot({path:'tests/screenshots/advanced-skater-'+skater+'.png',fullPage:true});
   const sizing=await page.locator('.skater-specialty').evaluate(el=>({height:el.clientHeight,content:el.scrollHeight}));assert(sizing.content<=sizing.height+1,'Power text overflows: '+JSON.stringify(sizing));
   await page.setViewportSize({width:390,height:844});await page.screenshot({path:'tests/screenshots/advanced-skater-'+skater+'-mobile.png',fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width:1366,height:900});
  }
  if(skater==='sol'){
   assert.equal(await page.locator('.passive-specialty').count(),1);assert.equal(await page.locator('button.specialty-token').count(),0);
   assert((await page.locator('.adjust-tokens').innerText()).includes('4/4'));assert((await page.locator('.skater-specialty').innerText()).includes('Passif'));
   await page.locator('[data-action="plus"]').click();await page.locator('[data-action="die"]').first().click();
   const state=await page.evaluate(async()=>{const M=await import('/match.js');return JSON.parse(localStorage.getItem('sk8-match-v'+M.MATCH_VERSION)).players[0].game;});
   assert.equal(state.bank.adjust,3);assert.equal(state.used.adjust,1);assert((await page.locator('.adjust-tokens').innerText()).includes('3/4'));console.log('sol: passive 4/4 reserve and paid adjustment verified');continue;
  }
  await page.locator('.specialty-token').click();await page.locator('[data-action="use-specialty"]').first().click();
  if(skater==='jade'){assert.equal(await page.locator('.signature-returned').count(),1);await page.screenshot({path:'tests/screenshots/jade-signature-returned.png',fullPage:true});}
  assert.equal(await page.locator('.specialty-token.is-used').count(),1);assert.equal(await page.locator('.specialty-modal').count(),0);
  const used=await page.evaluate(async()=>{const M=await import('/match.js');return JSON.parse(localStorage.getItem('sk8-match-v'+M.MATCH_VERSION)).players[0].game.specialty.used;});assert(used);console.log(skater+': power used through UI');

 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();tunnel.stop();await new Promise(resolve=>server.close(resolve));}
