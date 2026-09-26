import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {validateBenchmark} from '../src/benchmark.js';
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
await context.addInitScript(()=>{if(!localStorage.getItem('last-buyer.settings.v1'))localStorage.setItem('last-buyer.settings.v1',JSON.stringify({quality:'low',language:'fa',sound:false}));});
const page=await context.newPage(),errors=[],failed=[];
const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failed.push(r.url()+': '+r.status());});};watch(page);
try{
 await page.goto('http://localhost:4173',{waitUntil:'networkidle'});
 assert.equal(await page.locator('html').getAttribute('lang'),'fa');
 await page.locator('#new-game').click();await page.locator('.benchmark-canvas').waitFor();
 await page.locator('[data-benchmark-run]').click();await page.locator('.benchmark-result-grid').waitFor({timeout:10000});
 const result=await page.evaluate(()=>JSON.parse(localStorage.getItem('last-buyer.benchmark.v1')));
 assert.ok(validateBenchmark(result));assert.ok(result.frameCount>=12&&result.durationMs>=2200);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('last-buyer.settings.v1')).quality),'low');
 assert.ok((await page.locator('#modal-content').innerText()).includes('ثبت'));
 await page.screenshot({path:'artifacts/benchmark-fa-result.png',fullPage:true});
 const downloading=page.waitForEvent('download');await page.locator('[data-benchmark-export]').click();const download=await downloading;
 await download.saveAs('artifacts/device-check-export.json');assert.deepEqual(JSON.parse(await readFile('artifacts/device-check-export.json','utf8')),result);
 await page.locator('[data-benchmark-continue]').click();await page.locator('.onboarding-keys').waitFor();
 await page.locator('#modal-content .btn.primary').click();await page.locator('#modal-content .btn.primary').click();
 await page.keyboard.press('Escape');await page.locator('[data-main-menu]').click();
 await page.locator('#benchmark-menu').click();await page.locator('.benchmark-result-grid').waitFor();await page.keyboard.press('Escape');
 await page.reload({waitUntil:'networkidle'});await page.locator('#continue-game').click();await page.locator('#world').waitFor();
 assert.equal(await page.locator('.benchmark-canvas').count(),0);assert.equal(await page.locator('#modal-backdrop').isVisible(),false);

 // A closed test must never complete in the background or invent a saved result.
 const fresh=await browser.newContext({viewport:{width:360,height:740},reducedMotion:'reduce'}),mobile=await fresh.newPage();watch(mobile);
 await mobile.goto('http://localhost:4173');await mobile.locator('#language').selectOption('fa');await mobile.locator('#new-game').click();await mobile.screenshot({path:'artifacts/benchmark-fa-mobile.png',fullPage:true});
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await mobile.locator('[data-benchmark-run]').click();await mobile.waitForFunction(()=>Number(document.querySelector('[role=progressbar]')?.getAttribute('aria-valuenow'))>0);
 await mobile.keyboard.press('Escape');await mobile.waitForTimeout(2400);
 assert.equal(await mobile.evaluate(()=>localStorage.getItem('last-buyer.benchmark.v1')),null);
 await mobile.locator('#new-game').click();await mobile.locator('[data-benchmark-skip]').click();await mobile.locator('.onboarding-keys').waitFor();
 assert.equal(await mobile.evaluate(()=>localStorage.getItem('last-buyer.benchmark.v1')),null);

 // Unavailable drawing is recoverable, and all failure text remains localized.
 await mobile.reload();await mobile.locator('#benchmark-menu').click();
 await mobile.evaluate(()=>{window.qaOriginalContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(...args){return this.classList.contains('benchmark-canvas')?null:window.qaOriginalContext.apply(this,args);};});
 await mobile.locator('[data-benchmark-run]').click();
 await mobile.waitForFunction(()=>document.querySelector('.benchmark-status')?.textContent.includes('ممکن نشد'));
 assert.equal(await mobile.locator('[data-benchmark-run]').isDisabled(),false);await mobile.keyboard.press('Escape');
 await mobile.evaluate(()=>{HTMLCanvasElement.prototype.getContext=window.qaOriginalContext;});
 // Block storage only after loading: the measured result is usable without a false saved claim.
 await mobile.locator('#benchmark-menu').click();
 await mobile.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError');};});
 await mobile.locator('[data-benchmark-run]').click();await mobile.locator('.benchmark-result-grid').waitFor({timeout:10000});
 assert.ok((await mobile.locator('.benchmark-complete').innerText()).includes('همین جلسه'));
 await mobile.screenshot({path:'artifacts/benchmark-fa-mobile-result.png',fullPage:true});
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await fresh.close();
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 await writeFile('artifacts/browser-benchmark.json',JSON.stringify({passed:true,result,manualQualityPreserved:true,storedLocally:true,exported:true,savedCheckSkipsOnResume:true,cancelPreventsSave:true,skipDoesNotFabricateResult:true,unavailableCanvasRecoverable:true,storageFailureHonest:true,mobileOverflow:false,errors,failed},null,2));
 console.log('Device check passed: real measurement, export, resume, cancellation, skip, fallback, storage failure, manual quality and mobile.');
}catch(e){await page.screenshot({path:'artifacts/benchmark-failure.png',fullPage:true});throw e;}finally{await browser.close();}
