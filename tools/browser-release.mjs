import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createStaticServer} from '../server.mjs';
import {endingJourney} from '../tests/support/ending-fixtures.mjs';
import {recordEnding} from '../src/state.js';
import {ORDER} from '../src/i18n.js';
import {validateBenchmark} from '../src/benchmark.js';
await mkdir('artifacts',{recursive:true});
const server=await createStaticServer({production:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage(),errors=[],violations=[],badResponses=[],external=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)badResponses.push(r.url());});page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))external.push(r.url());});
await page.exposeFunction('reportPolicyViolation',v=>violations.push(v));
await page.addInitScript(()=>document.addEventListener('securitypolicyviolation',e=>window.reportPolicyViolation({directive:e.violatedDirective,blocked:e.blockedURI})));
try{
 const report=JSON.parse(await readFile('artifacts/build-report.json','utf8'));
 const html=await fetch(origin);assert.equal(html.status,200);assert.ok(html.headers.get('cache-control').includes('must-revalidate'));assert.ok(html.headers.get('content-security-policy').includes("script-src 'self'"));
 assert.equal(report.assets.some(a=>a.file.startsWith('src/')||a.file.startsWith('tests/')),false);
 for(const asset of report.assets.filter(a=>a.file.startsWith('assets/'))){assert.match(asset.file,/-[A-Za-z0-9]{8,}\./);const r=await fetch(origin+'/'+asset.file);assert.equal(r.status,200);assert.ok(r.headers.get('cache-control').includes('immutable'));assert.equal((await r.arrayBuffer()).byteLength,asset.bytes);}
 for(const path of ['/src/main.js','/tests/game.test.mjs','/.env','/package.json','/assets/missing.js','/missing-page'])assert.equal((await fetch(origin+path)).status,404,path);
 const notFound=await fetch(origin+'/unknown',{headers:{accept:'text/html'}});assert.equal(notFound.status,404);assert.ok((await notFound.text()).includes('Return to game'));
 assert.equal((await fetch(origin,{method:'HEAD'})).status,200);
 assert.equal((await fetch(origin,{method:'POST'})).status,405);
 await page.goto(origin,{waitUntil:'networkidle'});assert.equal(await page.locator('html').getAttribute('lang'),'en');
 await page.screenshot({path:'artifacts/release-title-en.png',fullPage:true});await page.locator('#language').selectOption('fa');
 await page.screenshot({path:'artifacts/release-title-fa.png',fullPage:true});
 await page.locator('#new-game').click();await page.locator('[data-benchmark-run]').click();await page.locator('.benchmark-result-grid').waitFor({timeout:10000});
 assert.ok(validateBenchmark(await page.evaluate(()=>JSON.parse(localStorage.getItem('last-buyer.benchmark.v1')))));
 await page.locator('[data-benchmark-continue]').click();await page.locator('.onboarding-keys').waitFor();
 await page.locator('#modal-content .btn.primary').click();await page.locator('#modal-content .btn.primary').click();
 await page.locator('#world').focus();await page.keyboard.down('ArrowRight');await page.waitForTimeout(400);await page.keyboard.up('ArrowRight');
 await page.locator('#journal').click();await page.keyboard.press('Escape');
 await page.locator('#settings').click();
 const selects=page.locator('#modal-content select');
 await selects.last().selectOption('1.2');await page.setViewportSize({width:360,height:800});
 for(const language of ORDER){await page.locator('#modal-content select').first().selectOption(language);assert.equal(await page.locator('#modal').evaluate(el=>el.scrollWidth>el.clientWidth+1),false,language);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,language);}
 await page.keyboard.press('Escape');
 const end=endingJourney('palimpsest');recordEnding(end,'palimpsest');
 await page.addInitScript(state=>{localStorage.setItem('last-buyer.save.v1',JSON.stringify(state));localStorage.setItem('last-buyer.settings.v1',JSON.stringify({language:'fa',sound:false,textSize:1.2}));},end);
 await page.reload({waitUntil:'networkidle'});await page.locator('#continue-game').click();await page.locator('.ending-tableau').waitFor();
 assert.equal(await page.locator('.ending-shots button').count(),3);await page.locator('[data-ending-shot="1"]').click();
 await page.screenshot({path:'artifacts/release-ending-fa-mobile.png',fullPage:true});
 assert.equal(await page.locator('#modal').evaluate(el=>el.scrollWidth>el.clientWidth+1),false);
 await page.locator('[data-ending-replay]').click();await page.locator('.ending-offers').waitFor();assert.equal(await page.locator('[data-ending]').count(),24);
 assert.deepEqual(errors,[]);assert.deepEqual(violations,[]);assert.deepEqual(badResponses,[]);assert.deepEqual(external,[]);
 await writeFile('artifacts/browser-release.json',JSON.stringify({passed:true,actualDist:true,htmlRevalidates:true,assetsHashedAndImmutable:true,missingAssets404:true,sourceFilesNotPublished:true,measuredCheck:true,eightLocalesAt360px:true,finaleAndReplay:true,cspViolations:violations,errors,badResponses,externalRequests:external,gzipBytes:report.gzipBytes,method:'Local production preview applies the committed Vercel headers; a cloud deployment is not asserted.'},null,2));
 console.log('Production bundle passed: asset hashes, cache, 404, CSP, real check, eight locales, finale and replay. No external requests.');
}catch(e){await page.screenshot({path:'artifacts/release-failure.png',fullPage:true});throw e;}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
