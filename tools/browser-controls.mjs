import {chromium} from 'playwright-core';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {newState,validateState} from '../src/state.js';
import {BENCHMARK_FIXTURE,denyAutomaticOrientation} from './qa-fixture.mjs';
function roomState(){const s=newState();s.zone='chapter';s.position={x:110,y:536};s.visited=[0];return s;}
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(({state,benchmark})=>{if(!localStorage.getItem('last-buyer.save.v1'))localStorage.setItem('last-buyer.save.v1',JSON.stringify(state));if(!localStorage.getItem('last-buyer.settings.v1'))localStorage.setItem('last-buyer.settings.v1',JSON.stringify({language:'en',sound:false,quality:'high',calm:false,reducedMotion:false,textSize:1}));localStorage.setItem('last-buyer.benchmark.v1',JSON.stringify(benchmark));},{state:roomState(),benchmark:BENCHMARK_FIXTURE});
const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('last-buyer.save.v1')));
try{
 await page.goto('http://localhost:4173',{waitUntil:'networkidle'});await page.locator('#continue-game').click();
 const bounds=await page.locator('#world').boundingBox(),scale=Math.min(bounds.width/640,bounds.height/360),offsetY=(bounds.height-360*scale)/2,offsetX=(bounds.width-640*scale)/2;
 // Actual canvas click: the engine must find a path and open the record itself.
 await page.mouse.click(bounds.x+offsetX+307*scale,bounds.y+offsetY+(542-280)*scale);
 await page.getByText('Memory fragment · 04',{exact:true}).waitFor({timeout:8000});
 await page.locator('#modal-content .btn.primary').click();
 let save=await snapshot();assert.ok(save.records.includes('0:r3'));assert.ok(save.position.x>200);
 const x=save.position.x;
 await page.locator('#world').focus();await page.keyboard.down('KeyD');await page.waitForTimeout(1100);await page.keyboard.up('KeyD');
 await page.keyboard.press('Escape');await page.keyboard.press('Escape');
 save=await snapshot();assert.ok(save.position.x-x>70&&save.position.x-x<125,`Keyboard displacement: ${save.position.x-x}`);
 const before=save;
 await page.keyboard.press('Escape');await page.waitForTimeout(1100);await page.keyboard.press('Escape');
 save=await snapshot();assert.deepEqual(save.position,before.position);assert.ok(save.playSeconds-before.playSeconds<.65);
 // Frame timing samples cover a running scene, not a frozen dialog.
 const timings=await page.evaluate(()=>new Promise(resolve=>{const samples=[];let last=performance.now();function measure(now){samples.push(now-last);last=now;if(samples.length<180)requestAnimationFrame(measure);else resolve(samples.slice(10));}requestAnimationFrame(measure);}));
 const sorted=timings.toSorted((a,b)=>a-b),perf={medianMs:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],over33ms:timings.filter(n=>n>33.4).length,total:timings.length};
 await page.locator('#settings').click();await page.getByRole('combobox',{name:'Visual quality'}).selectOption('low');await page.keyboard.press('Escape');
 await page.locator('#world').focus();await page.keyboard.down('KeyD');await page.waitForTimeout(1100);await page.keyboard.up('KeyD');await page.keyboard.press('Escape');await page.keyboard.press('Escape');
 const low=await snapshot();assert.ok(low.position.x-save.position.x>70&&low.position.x-save.position.x<125,'Low quality must not alter walking speed.');
 await page.locator('#settings').click();const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export save',exact:true}).click();const download=await downloadPromise;await download.saveAs('artifacts/test-save-export.json');assert.ok(validateState(JSON.parse(await readFile('artifacts/test-save-export.json','utf8'))));
 const invalid=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Import save',exact:true}).click();await(await invalid).setFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":999}')});await page.getByText('This is not a valid game save.',{exact:true}).waitFor();
 await page.keyboard.press('Escape');await page.reload({waitUntil:'networkidle'});await page.locator('#continue-game').click();assert.equal((await snapshot()).records.includes('0:r3'),true);
 // All locales must fit at the smallest supported portrait viewport.
 await page.setViewportSize({width:360,height:800});
 for(const locale of ['fa','zh','en','ar','es','hi','fr','pt']){await page.locator('#language').selectOption(locale);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow in ${locale}`);}
 await page.locator('#language').selectOption('fa');await page.locator('#settings').click();await page.getByRole('combobox',{name:'اندازهٔ متن'}).selectOption('1.2');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'artifacts/text-size-fa-mobile.png',fullPage:true});
 // Touch a destination in a genuine mobile-emulated context.
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const phone=await mobile.newPage();await phone.addInitScript(denyAutomaticOrientation);await phone.addInitScript(({state,benchmark})=>{localStorage.setItem('last-buyer.save.v1',JSON.stringify(state));localStorage.setItem('last-buyer.settings.v1',JSON.stringify({language:'en',sound:false,quality:'low'}));localStorage.setItem('last-buyer.benchmark.v1',JSON.stringify(benchmark));},{state:roomState(),benchmark:BENCHMARK_FIXTURE});await phone.goto('http://localhost:4173',{waitUntil:'networkidle'});await phone.locator('#continue-game').tap();await phone.locator('[data-portrait-continue]').tap();const r=await phone.locator('#world').boundingBox(),s=Math.min(r.width/640,r.height/360),oy=(r.height-360*s)/2;await phone.touchscreen.tap(r.x+307*s,r.y+oy+(542-280)*s);await phone.getByText('Memory fragment · 04',{exact:true}).waitFor({timeout:8000});await mobile.close();
 assert.deepEqual(errors,[]);await writeFile('artifacts/browser-controls.json',JSON.stringify({passed:true,clickPathfinding:true,keyboard:true,touchPathfinding:true,pause:true,saveExport:true,corruptImportRejected:true,eightLocaleOverflowChecks:true,lowPowerMovementParity:true,frameTimingDesktop:perf,limitations:'Headless Edge on this machine; not a physical mobile performance benchmark.'},null,2));console.log('Control, pause, persistence, 8-locale overflow and touch tests passed.',JSON.stringify(perf));
}catch(e){await page.screenshot({path:'artifacts/controls-failure.png',fullPage:true});throw e;}finally{await browser.close();}
