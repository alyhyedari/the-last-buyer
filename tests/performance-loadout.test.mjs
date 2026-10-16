import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,validateState} from '../src/state.js';
import {newFrontierState,hash} from '../src/frontier-state.js';
import {makeFrontierWorld,localRoute,route,canStand,SIZE} from '../src/frontier-world.js';
import {RoutePlanner} from '../src/frontier-navigation.js';
import {AdaptiveQuality} from '../src/quality.js';
import {bulletSight,shoot,damageActor,HOSTILES} from '../src/frontier-combat.js';
import {WeaponController,magazineRounds,buySupply,buyEquipment,equipVehicle,equipWeapon} from '../src/frontier-loadout.js';
import {worldActors} from '../src/frontier-life.js';
import {childPosition} from '../src/frontier-residents.js';
import {narrationFor} from '../src/frontier-narrator.js';
import {NARRATOR_TEXT} from '../src/frontier-narrator-text.js';
import {LOADOUT_TEXT} from '../src/frontier-loadout-text.js';
import {PT} from '../src/performance-text.js';
import {movementInput,equipmentAction} from '../src/frontier-input.js';
import {mythActors,updateMyths,MYTH_BOSSES} from '../src/frontier-myth.js';
import {ORDER} from '../src/i18n.js';
import {validateBenchmark,classifyPerformance} from '../src/benchmark.js';
import {BENCHMARK_FIXTURE} from '../tools/qa-fixture.mjs';
const sample=()=>{const s=newState();s.frontier=newFrontierState(91);Object.assign(s.frontier,{x:10.5,y:10.5,angle:0,minutes:540});return s;};
const empty=()=>({size:SIZE,tiles:new Uint8Array(SIZE*SIZE),buckets:new Map(),colliders:[],sprites:[],traffic:[]});

test('Q and E only control equipment; A/D strafe on foot and steer while mounted',()=>{
 assert.equal(equipmentAction('KeyQ'),'cycle');assert.equal(equipmentAction('KeyE'),'reload');assert.equal(equipmentAction('KeyB'),'shop');
 assert.deepEqual(movementInput(new Set(['KeyQ','KeyE']),false),{forward:0,turn:0,strafe:0,brake:false});assert.equal(movementInput(new Set(['KeyA']),false).strafe,-1);assert.equal(movementInput(new Set(['KeyA']),true).turn,-1);assert.equal(movementInput(new Set(['Space']),true).brake,true);
});

test('empty magazines block shots; timed reloads conserve ammo and switching cancels them',()=>{
 const s=sample(),w=empty();s.village.weapon='pistol';s.village.weapons=['pistol','rifle'];s.frontier.life.ammo=40;const controller=new WeaponController(s);
 for(let i=0;i<12;i++)assert.equal(shoot(s,w,[]).kind,'miss');assert.equal(s.frontier.life.ammo,28);assert.equal(magazineRounds(s.frontier,'pistol',28),0);assert.equal(shoot(s,w,[]).kind,'reloadNeeded');assert.equal(s.frontier.life.ammo,28);
 assert.equal(controller.reload(),'reloading');controller.tick(.1);assert.ok(controller.reloading);controller.cycle();assert.equal(controller.reloading,false);assert.equal(s.village.weapon,'rifle');assert.equal(s.frontier.life.combat.magazines.pistol,12);
 controller.cycle();controller.reload();for(let i=0;i<70;i++)controller.tick(1/60);assert.equal(magazineRounds(s.frontier,'pistol',28),12);assert.equal(s.frontier.life.ammo,28);assert.equal(controller.reload(),'magazineFull');assert.ok(validateState(s));
});
test('field supplies and gear charge once, enforce ownership and never refill a selected damaged car for free',()=>{
 const s=sample();s.village.money=1000;s.frontier.fuel=3;assert.ok(buySupply(s,'refuel'));assert.equal(s.village.money,985);assert.equal(s.frontier.fuel,100);assert.equal(buySupply(s,'refuel'),false);assert.equal(s.village.money,985);
 assert.equal(equipWeapon(s,'launcher'),false);assert.ok(buyEquipment(s,'pistol'));const balance=s.village.money;assert.equal(buyEquipment(s,'pistol'),false);assert.equal(s.village.money,balance);assert.ok(equipWeapon(s,'pistol'));assert.ok(equipWeapon(s,'none'));
 s.village.vehicles=['car','bike'];s.village.vehicle='car';s.frontier.mounted=true;s.frontier.life.expanse.carHealth=12;assert.ok(equipVehicle(s,'bike'));const parked={...s.frontier.life.expanse.parked};assert.ok(equipVehicle(s,'car'));assert.deepEqual(s.frontier.life.expanse.parked,parked);assert.equal(s.frontier.life.expanse.carHealth,12);
 s.village.money=0;assert.equal(buySupply(s,'rockets'),false);assert.equal(s.frontier.life.combat.rockets,0);assert.equal(buySupply(s,'invalid'),false);assert.ok(validateState(s));
});
test('new magazine and narrator records migrate old saves and reject corrupt values',()=>{
 const s=sample();delete s.frontier.life.combat.magazines;delete s.frontier.life.guide;delete s.frontier.life.petFollowing;const migrated=validateState(s);assert.ok(migrated);assert.deepEqual(migrated.frontier.life.combat.magazines,{});assert.deepEqual(migrated.frontier.life.guide,{enabled:true,seen:[]});assert.equal(migrated.frontier.life.petFollowing,true);migrated.frontier.life.petFollowing=false;assert.equal(validateState(migrated).frontier.life.petFollowing,false);
 migrated.frontier.life.combat.magazines.pistol=13;assert.equal(validateState(migrated),null);migrated.frontier.life.combat.magazines={};migrated.frontier.life.guide.seen=['forged'];assert.equal(validateState(migrated),null);
});
test('local blocked AI routes have a shared budget and cannot flood the county',()=>{
 const w=empty();for(let y=1;y<SIZE-1;y++)w.tiles[y*SIZE+12]=4;w.aiRouteBudget=2;const start={x:10.5,y:10.5},target={x:14.5,y:10.5};assert.deepEqual(localRoute(w,start,target),[]);assert.ok(w.lastRoute.expanded<=160);assert.deepEqual(localRoute(w,start,target),[]);assert.equal(localRoute(w,start,target),null);assert.equal(w.aiRouteBudget,0);
 const detour=empty();for(let y=8;y<=12;y++)detour.tiles[y*SIZE+12]=4;const path=localRoute(detour,start,target);assert.ok(path.length);assert.deepEqual(path.at(-1),target);for(const p of path)assert.ok(canStand(detour,p.x,p.y,.25));assert.ok(detour.lastRoute.expanded<=160);
});
test('player routing yields, can be cancelled, and never publishes a superseded route',async()=>{
 const w=empty(),p=new RoutePlanner();let yielded=false;const request=p.find(w,{x:2.5,y:2.5},{x:350.5,y:350.5});await new Promise(r=>setTimeout(()=>{yielded=true;p.cancel();r();},0));assert.ok(yielded);assert.equal(await request,null);assert.equal(p.pending,false);
 const path=await p.find(w,{x:4.5,y:4.5},{x:7.5,y:4.5});assert.ok(path.length);assert.deepEqual(path.at(-1),{x:7.5,y:4.5});assert.deepEqual(path,route(w,{x:4.5,y:4.5},{x:7.5,y:4.5}));
});
test('spatial bullet queries match full collision scans across seeded rays',()=>{
 const w=makeFrontierWorld(91),full={...w,spatialCollision:false};for(let i=0;i<300;i++){const a={x:3+hash(13,i)*375,y:3+hash(15,i)*375},b={x:Math.max(1,Math.min(383,a.x+(hash(2,i)-.5)*70)),y:Math.max(1,Math.min(383,a.y+(hash(4,i)-.5)*70))};assert.equal(bulletSight(w,a,b),bulletSight(full,a,b),String(i));}
});
test('sustained scene load reduces detail, recovery is gradual and telemetry storage stays bounded',()=>{
 const q=new AdaptiveQuality();for(let i=0;i<3;i++){q.rendered(120);q.sample(140);}assert.equal(q.quality,'low');assert.equal(q.detail,2);
 for(let i=0;i<600;i++){q.rendered(2);q.presented();q.sample(16.67);}assert.equal(q.quality,'low');assert.equal(q.detail,1);for(let i=0;i<600;i++){q.rendered(2);q.presented();q.sample(16.67);}assert.equal(q.quality,'high');assert.ok(q.report.fps>=58&&q.report.fps<=61);
 for(let i=0;i<3000;i++)q.rendered(4);assert.ok(q.costs.length<=240);for(let i=0;i<3000;i++)q.sample(.1);assert.ok(q.frames.length<=240);
});
test('benchmark quality reflects its heaviest real scene and rejects injected scene data',()=>{
 const v=structuredClone(BENCHMARK_FIXTURE);v.scenes[2]={...v.scenes[2],p95FrameMs:70,peakFrameMs:80,workP95Ms:30,slowFrameRatio:.5};Object.assign(v,{p95FrameMs:70,renderP95Ms:30,slowFrameRatio:.5},classifyPerformance({p95FrameMs:70,renderP95Ms:30,slowFrameRatio:.5}));assert.equal(validateBenchmark(v).quality,'low');
 v.scenes[2].userAgent='tracking';assert.equal(validateBenchmark(v),null);delete v.scenes[2].userAgent;v.scenes[2].simulationP95Ms=31;assert.equal(validateBenchmark(v),null);assert.equal(validateBenchmark({...BENCHMARK_FIXTURE,scenes:[null,null,null,null]}),null);
});
test('children have households, daytime collision-safe movement and shelter during danger',()=>{
 const s=sample(),f=s.frontier,w=makeFrontierWorld(91),children=w.sprites.filter(a=>a.kind==='child');assert.equal(children.length,18);const child=children[0];assert.ok(w.buildings.some(b=>b.id===child.household));Object.assign(f,{x:child.x+2,y:child.y});w.aiRouteBudget=3;const actor=childPosition(w,child,f,0);assert.ok(actor);assert.ok(canStand(w,actor.x,actor.y,.2));assert.equal(damageActor(s,w,actor,999),null);
 f.minutes=20*60;assert.equal(childPosition(w,child,f,1),null);f.minutes=9*60;w.panic={x:child.x,y:child.y,until:f.minutes+2};assert.equal(childPosition(w,child,f,2),null);
});
test('narrator prioritizes real needs without repeating learned lessons; all new text covers eight languages',()=>{
 const s=sample();assert.equal(narrationFor(s),'arrival');s.frontier.life.guide.seen=['arrival'];s.frontier.fuel=5;assert.equal(narrationFor(s),'fuel');s.frontier.life.health=20;assert.equal(narrationFor(s),'danger');s.frontier.life.guide.seen.push('danger');assert.equal(narrationFor(s),'fuel');assert.ok(HOSTILES.shade.speed>HOSTILES.spore.speed&&HOSTILES.spore.reach>HOSTILES.shade.reach);
 for(const dict of [NARRATOR_TEXT,LOADOUT_TEXT,PT])for(const [key,entry]of Object.entries(dict))for(const locale of ORDER)assert.ok(entry[locale]?.trim(),key+' '+locale);
});

test('new forest enemies retain existing saved identities and night-only shades leave at dawn',()=>{
 const s=sample(),f=s.frontier,w=empty();f.minutes=1320;const observed=new Map();
 for(let x=145;x<375;x+=25)for(let y=201;y<376;y+=25){Object.assign(f,{x,y});for(const a of mythActors(w,f,0))if(a.id.startsWith('myth-'))observed.set(a.id,a);}
 assert.ok(observed.size>65);for(const a of observed.values()){const i=Number(a.id.slice(5));assert.equal(a.kind,i<72?['wisp','briar','moth'][i%3]:['shade','spore'][i%2]);}
 const shade=[...observed.values()].find(a=>a.kind==='shade'),spore=[...observed.values()].find(a=>a.kind==='spore');assert.ok(shade&&spore);Object.assign(f,{x:shade.x,y:shade.y,minutes:540});assert.ok(!mythActors(w,f,0).some(a=>a.kind==='shade'));
 const old=[...observed.values()].find(a=>a.id==='myth-0')||[...observed.values()].find(a=>Number(a.id.slice(5))<72);f.life.combat.actors[old.id]={x:old.x,y:old.y,hp:17,kind:old.kind,at:f.minutes};const restored=validateState(s);assert.ok(restored);Object.assign(restored.frontier,{x:old.x,y:old.y});const retained=mythActors(empty(),restored.frontier,0).find(a=>a.id===old.id);assert.equal(retained.kind,old.kind);assert.equal(retained.hp,17);
});

test('guardian strikes during respawn protection do not emit a false injury event',()=>{
 const s=sample(),f=s.frontier,w=empty(),b=MYTH_BOSSES[0];Object.assign(f,{x:b.x,y:b.y+4});f.life.combat.graceUntil=f.minutes+100;mythActors(w,f,0);f.minutes+=3;updateMyths(s,w,.1);f.minutes=w.myth.get('boss-stag').windup;assert.ok(!updateMyths(s,w,.1).some(e=>e.kind==='attacked'||e.kind==='died'));assert.equal(f.life.health,100);
});
