import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {BENCHMARK_FIXTURE} from './qa-fixture.mjs';
import {COMMONS} from '../src/open-world.js';
import {newState,obstacles,approachPath,walkable} from '../src/state.js';
import {VILLAGE_ENTITIES} from '../src/village-content.js';

await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:960}});
const page=await context.newPage(),errors=[],requests=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('response',response=>{if(response.status()>=400)requests.push(response.url()+': '+response.status());});
let state=newState();

async function openAt(entity){
 state=JSON.parse(JSON.stringify(state));
 const blocks=obstacles(COMMONS),near={x:entity.x,y:entity.y+24};
 state.zone='commons';state.position=walkable(near.x,near.y,blocks)?near:approachPath(COMMONS.start,entity,blocks).at(-1);state.commonsPosition={...state.position};
 await page.addInitScript(({save,benchmark})=>{localStorage.setItem('last-buyer.save.v1',JSON.stringify(save));localStorage.setItem('last-buyer.benchmark.v1',JSON.stringify(benchmark));localStorage.setItem('last-buyer.settings.v1',JSON.stringify({language:'en',sound:false,reducedMotion:true,quality:'high'}));},{save:state,benchmark:BENCHMARK_FIXTURE});
 await page.goto('http://localhost:4173',{waitUntil:'networkidle'});await page.locator('#continue-game').click();await page.locator('#world').focus();await page.keyboard.press('KeyE');
}
async function capture(){state=await page.evaluate(()=>JSON.parse(localStorage.getItem('last-buyer.save.v1')));}

try{
 const shop=VILLAGE_ENTITIES.find(entity=>entity.id==='village-shop');
 await openAt(shop);assert.equal(await page.locator('[data-village-buy]').count(),6);assert.equal(await page.getByRole('button',{name:'Work a shift',exact:true}).count(),1);await page.getByRole('button',{name:'Work a shift',exact:true}).click();await page.getByRole('button',{name:'Next',exact:true}).click();await capture();assert.ok(state.village.money>120);
 await openAt(shop);await page.locator('[data-village-buy="stick"]').click();await capture();assert.equal(state.village.weapon,'stick');
 await openAt(VILLAGE_ENTITIES.find(entity=>entity.id==='village-board'));await page.locator('[data-village-project="lamps"]').click();await capture();assert.ok(state.village.projects.includes('lamps'));
 await openAt(VILLAGE_ENTITIES.find(entity=>entity.id==='village-rich-boy'));await page.getByRole('button',{name:'Help Mina choose for herself',exact:true}).click();await capture();assert.equal(state.village.story,2);
 await openAt(VILLAGE_ENTITIES.find(entity=>entity.id==='village-animal-0'));await capture();assert.ok(state.village.animals.includes('village-animal-0'));
 await openAt(VILLAGE_ENTITIES.find(entity=>entity.id==='forest-ghost'));await page.getByRole('button',{name:'Listen',exact:true}).click();await capture();assert.ok(state.village.encounters.includes('ghost-listened'));
 await openAt(VILLAGE_ENTITIES.find(entity=>entity.id==='village-gate'));await page.getByRole('button',{name:'Stay and build the village',exact:true}).click();await capture();assert.match(state.village.outcome,/^village-\d-\d$/);assert.equal(await page.locator('.modal').isVisible(),true);
 await page.screenshot({path:'artifacts/village-fate.png',fullPage:true});assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 await writeFile('artifacts/browser-village.json',JSON.stringify({passed:true,money:state.village.money,weapon:state.village.weapon,projects:state.village.projects,encounters:state.village.encounters,outcome:state.village.outcome,errors,requests},null,2));console.log('Village shop, work shift, weapon, project, Mina choice, animal, ghost and fate flow passed.');
}catch(error){await page.screenshot({path:'artifacts/village-failure.png',fullPage:true});throw error;}finally{await browser.close();}
