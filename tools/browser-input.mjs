import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {newState} from '../src/state.js';
import {BENCHMARK_FIXTURE,denyAutomaticOrientation} from './qa-fixture.mjs';

const roomState=()=>{const state=newState();state.zone='chapter';state.visited=[0];state.position={x:110,y:536};return state;};
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.addInitScript(denyAutomaticOrientation);
await page.addInitScript(({state,benchmark})=>{localStorage.setItem('last-buyer.save.v1',JSON.stringify(state));localStorage.setItem('last-buyer.settings.v1',JSON.stringify({language:'en',sound:false,quality:'high',inputMode:'click'}));localStorage.setItem('last-buyer.benchmark.v1',JSON.stringify(benchmark));},{state:roomState(),benchmark:BENCHMARK_FIXTURE});
try{
 await page.goto('http://localhost:4173',{waitUntil:'networkidle'});await page.locator('#continue-game').click();await page.locator('#chapter-banner').waitFor({state:'hidden'});
 assert.equal(await page.locator('body').getAttribute('data-input-mode'),'click');
 assert.equal(await page.locator('.dpad').evaluate(element=>getComputedStyle(element).display),'none');

 await page.locator('#input-mode').click();
 assert.equal(await page.locator('body').getAttribute('data-input-mode'),'joystick');assert.equal(await page.locator('.dpad').evaluate(element=>getComputedStyle(element).display),'none');

 const bounds=await page.locator('#world').boundingBox(),point={x:bounds.x+bounds.width*.42,y:bounds.y+bounds.height*.55};
 await page.evaluate(({point})=>{const canvas=document.getElementById('world');const event=(type,x,y,buttons)=>new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:47,pointerType:'touch',clientX:x,clientY:y,buttons});canvas.dispatchEvent(event('pointerdown',point.x,point.y,1));canvas.dispatchEvent(event('pointermove',point.x+55,point.y-18,1));}, {point});
 await page.locator('#dynamic-stick').waitFor({state:'visible'});assert.match(await page.locator('.dynamic-stick-knob').getAttribute('style'),/translate/);await page.evaluate(()=>document.getElementById('world').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:47,pointerType:'touch',clientX:0,clientY:0,buttons:0})));await page.locator('#dynamic-stick').waitFor({state:'hidden'});

 await page.locator('#input-mode').click();assert.equal(await page.locator('body').getAttribute('data-input-mode'),'hybrid');await page.locator('#input-mode').click();assert.equal(await page.locator('body').getAttribute('data-input-mode'),'click');
 const scale=Math.min(bounds.width/640,bounds.height/360),offsetX=(bounds.width-640*scale)/2,offsetY=(bounds.height-360*scale)/2;await page.touchscreen.tap(bounds.x+offsetX+307*scale,bounds.y+offsetY+(542-280)*scale);await page.locator('#modal-content .source-tag').waitFor({timeout:8000});
 await page.screenshot({path:'artifacts/browser-input-modes.png',fullPage:false});assert.deepEqual(errors,[]);
 await writeFile('artifacts/browser-input.json',JSON.stringify({passed:true,clickModeHidesDpad:true,joystickModeHidesDpad:true,dynamicJoystickAppears:true,clickToMoveTouchPath:true,errors},null,2));console.log('Input modes passed: click-to-move, dynamic joystick, d-pad visibility and touch pathfinding.');
}finally{await browser.close();}
