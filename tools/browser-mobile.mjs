import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {newState} from '../src/state.js';
import {BENCHMARK_FIXTURE} from './qa-fixture.mjs';
import {createStaticServer} from '../server.mjs';
const production=process.argv.includes('--dist'),server=production?await createStaticServer({production:true}):null;
if(server)await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=server?'http://127.0.0.1:'+server.address().port:'http://localhost:4173';
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],policies=[];
let phone;
try{
 const desktop=await browser.newContext({viewport:{width:1280,height:900}}),page=await desktop.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(b=>localStorage.setItem('last-buyer.benchmark.v1',JSON.stringify(b)),BENCHMARK_FIXTURE);
 await page.goto(origin,{waitUntil:'networkidle'});assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
 await page.screenshot({path:'artifacts/title-en-desktop.png',fullPage:true});
 await page.locator('#new-game').click();await page.locator('#modal-content .btn.primary').click();await page.locator('#modal-content .btn.primary').click();
 assert.equal(await page.locator('#rotate-card').isVisible(),false);
 await page.locator('#language').selectOption('fa');await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'fa');
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 phone=await context.newPage();const cdp=await context.newCDPSession(phone);
 async function rotate(width,height){await phone.setViewportSize({width,height});await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});}
phone.on('pageerror',e=>errors.push(e.message));
 await phone.exposeFunction('qaPolicy',v=>policies.push(v));await phone.addInitScript(()=>document.addEventListener('securitypolicyviolation',e=>window.qaPolicy(e.violatedDirective)));
 const state=newState();state.zone='chapter';state.visited=[0];state.position={x:110,y:536};
 await phone.addInitScript(({state,b})=>{
  localStorage.setItem('last-buyer.save.v1',JSON.stringify(state));localStorage.setItem('last-buyer.benchmark.v1',JSON.stringify(b));
  window.qaRotationCalls=[];
  Element.prototype.requestFullscreen=()=>{window.qaRotationCalls.push('fullscreen');return Promise.reject(new DOMException('Denied by test','NotAllowedError'));};
  screen.orientation.lock=orientation=>{window.qaRotationCalls.push(orientation);return Promise.reject(new DOMException('Unsupported by test','NotSupportedError'));};
 },{state,b:BENCHMARK_FIXTURE});
 await phone.goto(origin,{waitUntil:'networkidle'});assert.equal(await phone.locator('html').getAttribute('lang'),'en');
 await phone.locator('#continue-game').tap();await phone.locator('#rotate-card').waitFor();
 assert.equal(await phone.locator('#viewport-wrap').evaluate(e=>e.inert),true);
 const time=await phone.locator('#play-clock').innerText();await phone.waitForTimeout(700);assert.equal(await phone.locator('#play-clock').innerText(),time);
 assert.deepEqual(await phone.evaluate(()=>window.qaRotationCalls),['fullscreen','landscape']);
 await phone.locator('[data-landscape-enter]').tap();await phone.waitForFunction(()=>window.qaRotationCalls.length===4);
 assert.ok((await phone.locator('.rotate-status').innerText()).includes('rotate your phone by hand'));
 await phone.screenshot({path:'artifacts/mobile-rotate-en.png',fullPage:false,scale:'css'});

 // Rotate the viewport like a device, then use actual touch coordinates in the letterboxed canvas.
 await rotate(844,390);await phone.waitForFunction(()=>document.body.classList.contains('phone-landscape'),null,{timeout:5000});
 assert.equal(await phone.locator('#rotate-card').isVisible(),false);assert.equal(await phone.locator('#viewport-wrap').evaluate(e=>e.inert),false);
 const bounds=await phone.locator('#world').boundingBox();
 assert.ok(bounds.y>=0&&bounds.y+bounds.height<=391);
 for(const selector of ['[data-dir=up]','[data-dir=right]','#touch-interact','#touch-ward','#touch-crouch','#touch-run']){
  const r=await phone.locator(selector).boundingBox();assert.ok(r&&r.width>=44&&r.height>=44&&r.x>=0&&r.y>=0&&r.x+r.width<=845&&r.y+r.height<=391,selector);
 }
 assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await phone.locator('#chapter-banner').waitFor({state:'hidden'});await phone.screenshot({path:'artifacts/mobile-landscape-en.png',fullPage:false,scale:'css'});
 const scale=Math.min(bounds.width/640,bounds.height/360),ox=(bounds.width-640*scale)/2,oy=(bounds.height-360*scale)/2;
 await phone.touchscreen.tap(bounds.x+ox+307*scale,bounds.y+oy+(542-280)*scale);
 await phone.getByText('Memory fragment · 04',{exact:true}).waitFor({timeout:10000});
 await phone.locator('#modal-content .btn.primary').tap();
 await phone.locator('#pause').tap();await phone.locator('[data-main-menu]').tap();
 const saved=await phone.evaluate(()=>JSON.parse(localStorage.getItem('last-buyer.save.v1')));
 assert.ok(saved.records.includes('0:r3'));assert.ok(saved.position.x>200);
 await phone.locator('#language').selectOption('fa');await phone.locator('#continue-game').tap();
 assert.equal(await phone.locator('html').getAttribute('dir'),'rtl');
 await phone.screenshot({path:'artifacts/mobile-landscape-fa.png',fullPage:false,scale:'css'});
 await rotate(568,320);await phone.waitForFunction(()=>document.body.classList.contains('phone-landscape'));
 assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.equal(await phone.locator('#world').evaluate(e=>e.getBoundingClientRect().bottom>innerHeight+1),false);
 await phone.screenshot({path:'artifacts/mobile-landscape-small.png',fullPage:false,scale:'css'});
 await rotate(390,844);await phone.locator('#rotate-card').waitFor();assert.ok((await phone.locator('#rotate-title').innerText()).includes('افقی'));
 await phone.locator('[data-portrait-continue]').tap();assert.equal(await phone.locator('#rotate-card').isVisible(),false);
 assert.equal(await phone.locator('#viewport-wrap').evaluate(e=>e.inert),false);
 await rotate(844,390);await phone.waitForFunction(()=>document.body.classList.contains('phone-landscape'));
 await phone.locator('#pause').tap();await phone.locator('[data-main-menu]').tap();assert.equal(await phone.locator('body').evaluate(e=>e.classList.contains('phone-landscape')),false);

 // Supported API contract is a separate stub: it does not pretend to rotate real hardware.
 await phone.evaluate(()=>{
  window.qaRotationCalls=[];window.qaFullscreen=false;
  Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>window.qaFullscreen?document.documentElement:null});
  Element.prototype.requestFullscreen=async()=>{window.qaRotationCalls.push('fullscreen');window.qaFullscreen=true;};
  document.exitFullscreen=async()=>{window.qaRotationCalls.push('exit');window.qaFullscreen=false;};
  screen.orientation.lock=async o=>{window.qaRotationCalls.push(o);};
  screen.orientation.unlock=()=>{window.qaRotationCalls.push('unlock');};
 });
 await phone.locator('#continue-game').tap();await phone.waitForFunction(()=>window.qaRotationCalls.includes('landscape'));
 await phone.locator('#pause').tap();await phone.locator('[data-main-menu]').tap();
 assert.deepEqual(await phone.evaluate(()=>window.qaRotationCalls),['fullscreen','landscape','unlock','exit']);
 assert.deepEqual(errors,[]);assert.deepEqual(policies,[]);
 await writeFile('artifacts/browser-mobile'+(production?'-release':'')+'.json',JSON.stringify({passed:true,production,englishDefault:true,savedLanguagePreserved:true,phoneDetection:true,desktopUnaffected:true,orientationDeniedHandled:true,portraitPauses:true,landscapeTouchPathfinding:true,landscapeTouchTargets44px:true,rtlLandscape:true,portraitOptOut:true,fullscreenAndLockLifecycle:'stubbed contract verified',physicalPhoneTested:false,errors,cspViolations:policies},null,2));
 console.log('Mobile display passed: English default, portrait pause, landscape touch navigation, RTL, opt-out and orientation API lifecycle.');
}catch(e){if(phone){await phone.screenshot({path:'artifacts/mobile-failure.png',fullPage:false,scale:'css'});await writeFile('artifacts/mobile-failure.txt',await phone.locator('body').innerText());}throw e;}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
