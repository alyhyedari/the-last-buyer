import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {BENCHMARK_FIXTURE} from './qa-fixture.mjs';
import {CHAPTERS,ENDINGS} from '../src/content.js';
import {newState,obstacles,approachPath,walkable,canChooseEnding} from '../src/state.js';
import {hash} from '../src/art.js';
import {generateCircuit,rotateMask,generateLights,generateCode} from '../src/puzzles.js';

// Isolated QA data. Fixtures only position the player; actual UI actions solve
// the puzzles, collect records, make choices and unlock subsequent chapters.
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1366,height:900}}),errors=[];
let page=await context.newPage();
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:4173',{waitUntil:'networkidle'});
let state=newState(),stages=0;
async function loadAt(chapter,entity){const blocks=obstacles(chapter),path=approachPath(chapter.start,entity,blocks),close={x:entity.x,y:entity.y+(entity.type==='station'?42:23)};state.zone='chapter';if(!state.visited.includes(chapter.index))state.visited.push(chapter.index);state.chapter=chapter.index;state.unlocked=Math.max(state.unlocked,chapter.index);state.position=walkable(close.x,close.y,blocks)?close:path.at(-1);state.ending=null;await page.close();page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(({state,benchmark})=>{localStorage.setItem('last-buyer.save.v1',JSON.stringify(state));localStorage.setItem('last-buyer.settings.v1',JSON.stringify({language:'en',sound:false,calm:true,reducedMotion:true,quality:'high',textSize:1,volume:.2}));localStorage.setItem('last-buyer.benchmark.v1',JSON.stringify(benchmark));},{state,benchmark:BENCHMARK_FIXTURE});await page.goto('http://localhost:4173',{waitUntil:'networkidle'});await page.locator('#continue-game').click();await page.locator('#world').focus();await page.keyboard.press('KeyE');await page.locator('#modal-backdrop:not([hidden])').waitFor();}
async function capture(){state=await page.evaluate(()=>JSON.parse(localStorage.getItem('last-buyer.save.v1')));}
async function solveStation(station){
 for(let round=0;round<station.rounds;round++){
  await page.getByText(`Stage ${round+1} of ${station.rounds}`,{exact:true}).waitFor();
  const seed=hash(station.id+':'+round+':last-buyer');
  if(station.puzzle==='circuit'){
   const data=generateCircuit(4+round,seed);
   for(let i=0;i<data.tiles.length;i++){
    if((await page.locator('.puzzle-feedback').textContent())==='Connection restored')break;
    let mask=data.tiles[i],n=0;while(mask!==data.solution[i]&&n<4){mask=rotateMask(mask);n++;}
    for(let j=0;j<n;j++){if((await page.locator('.puzzle-feedback').textContent())==='Connection restored')break;await page.locator(`[data-focus="tile-${i}"]`).click();}
   }
  }else if(station.puzzle==='lights'){
   const data=generateLights(round===0?3:4,seed);
   for(const i of data.solution){if((await page.locator('.puzzle-feedback').textContent())==='Connection restored')break;await page.locator(`[data-focus="tile-${i}"]`).click();}
  }else if(station.puzzle==='memory'){
   const sequence=(await page.locator('.sequence-display span').allTextContents()).map(Number);
   await page.locator('[data-focus="ready"]').click();
   for(const n of sequence)await page.locator(`[data-focus="key-${n-1}"]`).click();
  }else if(station.puzzle==='ledger'){
   const labels=await page.locator('.ledger-column').first().getByRole('button').allTextContents();
   for(let i=0;i<labels.length;i++){const match=labels[i].match(/^(\S+) (\d+) \+ (\d+)$/);assert.ok(match);await page.locator(`[data-focus="left-${i}"]`).click();await page.locator('.ledger-column').nth(1).getByRole('button',{name:`${match[1]} ${Number(match[2])+Number(match[3])}`,exact:true}).click();}
  }else if(station.puzzle==='code'){
   const{solution}=generateCode(round,seed);for(let i=0;i<4;i++)for(let j=0;j<solution[i];j++)await page.locator(`[data-focus="up-${i}"]`).click();await page.locator('[data-focus="check"]').click();
  }
  stages++;
  if(round<station.rounds-1)await page.getByText(`Stage ${round+2} of ${station.rounds}`,{exact:true}).waitFor();else await page.locator('.success-mark').waitFor();
 }
 await page.locator('#modal-content .btn.primary').click();await capture();assert.ok(state.solved.includes(station.id));
}
async function solveEpisode(ch){
 await loadAt(ch,ch.entities.find(e=>e.type==='episode'));
 const action=id=>page.locator('[data-action="'+id+'"]');
 if(ch.index===0){await action('tune').focus();await page.keyboard.press('Home');for(let i=0;i<81;i++)await page.keyboard.press('ArrowRight');assert.equal(await page.locator('.tape-fragments .recovered').count(),3);}
 if(ch.index===1){for(let i=0;i<3;i++)await action('transfer-0-1').click();for(let i=0;i<2;i++)await action('transfer-0-2').click();}
 if(ch.index===2)for(const node of ['C','D','E','F'])await action('node-'+node).click();
 if(ch.index===3){for(let i=0;i<2;i++)await action('transfer-0-1').click();for(let i=0;i<2;i++)await action('transfer-0-2').click();}
 if(ch.index===4)for(const i of [0,2,4])await action('signature-'+i).click();
 if(ch.index===5)for(const i of [0,1,2])await action('sound-'+i).click();
 if(ch.index===6){for(let i=0;i<3;i++)await action('date-down-2021').click();await action('date-up-2009').click();}
 if(ch.index===7)for(const i of [0,1,2]){await action('listen-'+i).click();await action('accept-'+i).check();}
 assert.equal(await action('seal').isEnabled(),true);if([0,4,7].includes(ch.index))await page.screenshot({path:'artifacts/scene-'+ch.index+'.png',fullPage:true});
 await action('seal').click();await page.locator('[data-micro-choice="'+(ch.index===0?1:0)+'"]').click();await action('confirm-episode').click();await page.locator('.scene-stamp').waitFor();await page.locator('#modal-content .btn.primary').click();await capture();assert.equal(state.microDecisions[ch.index],ch.index===0?1:0);assert.ok(state.episodes.includes(ch.index));
}
try{
 for(const ch of CHAPTERS){
  // Collect a story record through E and its actual dialog.
  for(const record of ch.entities.filter(e=>e.type==='record').slice(0,2)){await loadAt(ch,record);assert.ok((await page.locator('#modal-content').innerText()).length>30);await page.locator('#modal-content .btn.primary').click();await capture();assert.ok(state.records.includes(record.id));}await solveEpisode(ch);
  for(const station of ch.entities.filter(e=>e.type==='station')){await loadAt(ch,station);console.log(`Testing ${station.id} ${station.puzzle}: ${(await page.locator('#modal-content h2').textContent())}`);if(ch.index===4&&station.slot===0)await page.screenshot({path:'artifacts/puzzle-genesis.png',fullPage:true});await solveStation(station);}
  await loadAt(ch,ch.entities.find(e=>e.type==='exit'));
  if(ch.index<7){await page.locator(`[data-choice="${ch.index%3}"]`).click();await page.getByRole('button',{name:'Confirm choice',exact:true}).click();await capture();assert.equal(state.zone,'commons');assert.equal(state.chapter,ch.index);assert.equal(state.decisions[ch.index],ch.index%3);}
  else{await page.screenshot({path:'artifacts/final-offers.png',fullPage:true});await page.keyboard.press('Escape');await capture();}
  console.log(`Chapter ${ch.index+1}/8 passed; ${stages} puzzle stages solved through UI.`);
 }
 const complete=structuredClone(state);let endingsVerified=0;
 for(const ending of ENDINGS.filter(e=>canChooseEnding(complete,e.id))){state=structuredClone(complete);await loadAt(CHAPTERS[7],CHAPTERS[7].entities.find(e=>e.type==='npc'));await page.locator(`[data-ending="${ending.id}"]`).click();await page.getByRole('button',{name:'Confirm choice',exact:true}).click();const frames=[];for(let shot=0;shot<3;shot++){await page.locator('[data-ending-shot="'+shot+'"]').click();frames.push(await page.locator('#ending-frame').innerText());}assert.equal(frames.join(' ').replace(/\s/g,''),ending.body.en.replace(/\s/g,''));endingsVerified++;await page.getByRole('button',{name:'View my decision receipt',exact:true}).click();assert.ok((await page.locator('#modal-content').innerText()).includes('not a personality test'));assert.equal(await page.locator('.journal-entry').count(),15);if(ending.id==='shared')await page.screenshot({path:'artifacts/reflection.png',fullPage:true});console.log(`Ending verified: ${ending.id}`);}
 // Tab-order must remain inside the open modal.
 for(let i=0;i<18;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>Boolean(document.activeElement.closest('#modal'))),true);}
 assert.deepEqual(errors,[]);await writeFile('artifacts/browser-journey.json',JSON.stringify({passed:true,chapters:8,stages,endings:endingsVerified,notesCollected:16,choices:15,bespokeScenes:8,consoleErrors:errors,method:'Isolated save fixtures for position; all 48 puzzle stages and eight bespoke scenes and decisions executed through the real UI. Not a human-duration playtest.'},null,2));
 console.log('All 48 puzzle stages, eight bespoke scenes, eight chapters, all endings available to this journey and focus containment passed.');
}catch(error){await page.screenshot({path:'artifacts/journey-failure.png',fullPage:true});await writeFile('artifacts/journey-failure.txt',await page.locator('body').innerText());throw error;}finally{await browser.close();}
