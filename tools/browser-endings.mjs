import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {CHAPTERS,ENDINGS} from '../src/content.js';
import {ORDER} from '../src/i18n.js';
import {newState,obstacles,walkable,approachPath} from '../src/state.js';
import {endingJourney} from '../tests/support/ending-fixtures.mjs';
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),errors=[],missing=[],images=new Set();
let page,collection=[],endingRecords={},count=0;
async function load(state,{language='en',mobile=false}={}){
 if(page)await page.close();page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
 if(mobile)await page.setViewportSize({width:390,height:844});
 await page.addInitScript(({state,language,mobile})=>{if(sessionStorage.getItem('ending-qa'))return;sessionStorage.setItem('ending-qa','yes');localStorage.setItem('last-buyer.save.v1',JSON.stringify(state));localStorage.setItem('last-buyer.settings.v1',JSON.stringify({language,sound:false,calm:true,reducedMotion:true,textSize:mobile?1.2:1}));},{state,language,mobile});
 await page.goto('http://localhost:4173',{waitUntil:'networkidle'});await page.locator('#continue-game').click();
}
async function openOffers(state,options){const entity=CHAPTERS[7].entities.find(e=>e.type==='npc'),blocks=obstacles(CHAPTERS[7]),near={x:entity.x,y:entity.y+23};state.position=walkable(near.x,near.y,blocks)?near:approachPath(CHAPTERS[7].start,entity,blocks).at(-1);await load(state,options);await page.locator('#world').focus();await page.keyboard.press('KeyE');await page.locator('.ending-offers').waitFor();}
async function saved(){return page.evaluate(()=>JSON.parse(localStorage.getItem('last-buyer.save.v1')));}
try{
 for(const ending of ENDINGS){
  const state=endingJourney(ending.id);state.collection=[...collection];state.endingRecords=structuredClone(endingRecords);await openOffers(state);
  assert.equal(await page.locator('[data-ending]').count(),24);assert.equal(await page.locator('#ending-total').innerText(),'24');
  await page.locator(`[data-ending="${ending.id}"]`).click();await page.getByRole('button',{name:'Confirm choice',exact:true}).click();
  const frames=[];for(let shot=0;shot<3;shot++){await page.locator(`[data-ending-shot="${shot}"]`).click();frames.push(await page.locator('#ending-frame').innerText());const image=await page.locator('.ending-tableau').evaluate(c=>c.toDataURL());images.add(createHash('sha256').update(image).digest('hex'));}
  assert.equal(frames.join(' ').replace(/\s/g,''),ending.body.en.replace(/\s/g,''),ending.id);
  const result=await saved();assert.equal(result.ending,ending.id);assert.equal(result.endingRecords[ending.id].decisions[0],state.decisions[0]);collection=result.collection;endingRecords=result.endingRecords;
  // Return to the actual final choice, preserving its original narrative constraints.
  await page.locator('[data-ending-replay]').click();await page.locator('.ending-offers').waitFor();const replay=await saved();assert.equal(replay.ending,null);assert.deepEqual(replay.decisions,state.decisions);assert.deepEqual(replay.microDecisions,state.microDecisions);assert.deepEqual(replay.collection,collection);
  count++;console.log('Finale verified: '+ending.id);
 }
 assert.equal(collection.length,24);assert.equal(images.size,72);
 const archive=endingJourney('palimpsest');archive.collection=collection;archive.endingRecords=endingRecords;archive.ending='palimpsest';await load(archive);
 await page.reload({waitUntil:'networkidle'});await page.locator('#continue-game').click();assert.equal(await page.locator('.ending-shots button').count(),3);await page.getByRole('button',{name:'Atlas of endings',exact:true}).click();assert.equal(await page.locator('[data-gallery-ending]').count(),24);
 await page.locator('[data-ending-family]').selectOption('memory');assert.equal(await page.locator('[data-gallery-ending]').count(),4);await page.locator('[data-gallery-ending="palimpsest"] > summary').click();await page.locator('.gallery-card .ending-tableau').waitFor();assert.ok((await page.locator('#modal-content').innerText()).includes('Last recorded journey'));
 await page.screenshot({path:'artifacts/endings-atlas-en.png',fullPage:true});
 // New journeys preserve earned endings and their evidence without copying past decisions.
 await page.keyboard.press('Escape');await page.locator('#new-game').click();await page.locator('#modal-content .btn.primary').click();await page.locator('#modal-content .btn.primary').click();await page.locator('#modal-content .btn.primary').click();const fresh=await saved();assert.equal(fresh.collection.length,24);assert.equal(Object.keys(fresh.endingRecords).length,24);assert.deepEqual(fresh.decisions,{});
 // Locked cards reveal actionable clues, not the unseen ending's plot.
 const early=newState();early.episodes=[0];early.microDecisions={0:1};await load(early);await page.keyboard.press('Escape');await page.getByRole('button',{name:'Discovered endings',exact:true}).click();
 await page.locator('[data-gallery-ending="letters"] > summary').click();await page.locator('[data-gallery-ending="letters"] .ending-clues > summary').click();assert.ok((await page.locator('#modal-content').innerText()).includes('changing it requires a new journey'));assert.equal((await page.locator('#modal-content').innerText()).includes(ENDINGS.find(e=>e.id==='letters').body.en),false);
 // Earlier version keeps achievements while explicitly admitting the missing history.
 const legacy=endingJourney('witness');legacy.version=3;legacy.ending='witness';legacy.collection=['witness'];delete legacy.endingRecords;await load(legacy);await page.getByRole('button',{name:'Atlas of endings',exact:true}).click();await page.locator('[data-gallery-ending="witness"] > summary').click();await page.getByText('Discovered in an older version; that journey’s details were not recorded.',{exact:true}).waitFor();
 // Persian portrait finale, readable tab order and eight-language narrow layouts.
 await load(archive,{language:'fa',mobile:true});await page.locator('[data-ending-shot="1"]').click();await page.screenshot({path:'artifacts/ending-fa-mobile.png',fullPage:true});
 for(let i=0;i<40;i++){await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.activeElement.closest('#modal')));}
 await page.locator('[data-ending-shot="0"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-ending-shot="1"]').getAttribute('aria-selected'),'true');
 for(const language of ORDER){await page.keyboard.press('Escape');await page.locator('#language').selectOption(language);await page.locator('#continue-game').click();await page.setViewportSize({width:360,height:800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,language);assert.equal(await page.locator('#modal').evaluate(el=>el.scrollWidth>el.clientWidth+1),false,language);assert.equal(await page.locator('.ending-shots button').count(),3);assert.ok((await page.locator('#ending-frame').innerText()).length>20);}
 await page.keyboard.press('Escape');await page.locator('#language').selectOption('fa');await page.setViewportSize({width:1440,height:1000});await page.locator('#continue-game').click();await page.screenshot({path:'artifacts/ending-fa-desktop.png',fullPage:true});
 await page.locator('[data-ending-replay]').click();await page.locator('[data-ending-family]').selectOption('repair');await page.screenshot({path:'artifacts/ending-offers-fa.png',fullPage:true});assert.equal(await page.locator('[data-ending]').count(),4);
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 await writeFile('artifacts/browser-endings.json',JSON.stringify({passed:true,endings:count,distinctFrames:images.size,families:6,replay:true,historyAcrossNewGame:true,legacyMigration:true,spoilerSafeHints:true,eightLocalesMobile:true,focus:true,errors,missing,method:'Authored journey fixtures supply earlier decisions; all 24 final confirmations, 72 frames, saves and replays use the real browser UI.'},null,2));
 console.log('All 24 endings, 72 frames, saved histories, replay and eight-language layouts passed.');
}catch(error){if(page){await page.screenshot({path:'artifacts/endings-failure.png',fullPage:true});await writeFile('artifacts/endings-failure.txt',await page.locator('body').innerText());}throw error;}finally{await browser.close();}
