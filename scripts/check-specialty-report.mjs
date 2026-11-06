import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('C:/Users/jeanf/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.argv[2]||'http://127.0.0.1:8001';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(base+'/reports/specialty-balance-063.html');assert.equal(response.status(),200);
 assert.equal(await page.locator('table').count(),3);assert((await page.locator('body').innerText()).includes('Sol : quatre jetons ±1 en réserve'));
 assert.equal(await page.locator('tbody tr').count(),14);
 await page.screenshot({path:'tests/screenshots/specialty-balance-063.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'tests/screenshots/specialty-balance-063-mobile.png',fullPage:true});
 const versions=await page.evaluate(async()=>{const E=await import('/engine.js'),M=await import('/match.js'),R=await import('/release-notes.js');return [E.RULESET_VERSION,M.MATCH_VERSION,R.APP_VERSION];});
 assert.deepEqual(versions,[22,17,'0.6.3']);assert.deepEqual(errors,[]);
 console.log('Report desktop/mobile and live game versions verified:',versions);
}finally{await browser.close();}
