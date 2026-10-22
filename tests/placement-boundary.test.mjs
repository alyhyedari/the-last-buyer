import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,validateState} from '../src/state.js';
import {newFrontierState,VEHICLES} from '../src/frontier-state.js';
import {findOpen,canStand,makeFrontierWorld,trafficAt} from '../src/frontier-world.js';
import {repairPlacements} from '../src/frontier-placement.js';
import {buyRide} from '../src/cyber-systems.js';
import {buySpecialCar} from '../src/neon-world.js';
import {stealCar,restoreScenery,trafficActors} from '../src/frontier-expanse.js';
import {BoundaryDirector,unfinishedZone,BOUNDARY_JOKES} from '../src/frontier-boundary.js';
const sample=()=>{const s=newState();s.frontier=newFrontierState(91);s.village.money=50000;return s;};
const empty=()=>({size:40,tiles:new Uint8Array(1600),buckets:new Map()});
test('overlapping car and player are repaired beside the obstacle, including loaded saves',()=>{
 const s=sample(),w=empty(),f=s.frontier;Object.assign(f,{x:20,y:20,mounted:true});s.village.vehicle='car';s.village.vehicles=['car'];
 for(let y=18;y<23;y++)for(let x=18;x<23;x++)w.tiles[y*40+x]=4;
 f.life.expanse.parked={x:20,y:20,angle:0};assert.ok(repairPlacements(w,s));assert.ok(canStand(w,f.x,f.y,.48));const p=f.life.expanse.parked;assert.ok(canStand(w,p.x,p.y,.48));assert.ok(Math.hypot(f.x-p.x,f.y-p.y)>.85);assert.ok(Math.hypot(f.x-20,f.y-20)<5);assert.ok(validateState(s));
});
test('safe parking avoids other vehicles; impossible maps return no placement',()=>{
 const w=empty(),p={x:20,y:20};const q=findOpen(w,p,.48,{avoid:[{...p,radius:.6}]});assert.ok(Math.hypot(q.x-p.x,q.y-p.y)>1.08);
 w.tiles.fill(4);assert.equal(findOpen(w,p,.48,{maxDistance:4}),null);
});
test('all fourteen coast car purchases fit beside BUY signs without overlapping the buyer',()=>{
 const w=makeFrontierWorld(91);
 for(let id=0;id<14;id++){const s=sample(),f=s.frontier;Object.assign(f,{x:420.5,y:176.5});assert.ok(buyRide(s,id,w));const p=f.life.expanse.parked;assert.ok(canStand(w,p.x,p.y,.48));assert.ok(Math.hypot(p.x-f.x,p.y-f.y)>.85);assert.ok(validateState(s));}
 const s=sample();Object.assign(s.frontier,{x:420.5,y:176.5});assert.ok(buySpecialCar(s,10,w));assert.ok(canStand(w,s.frontier.life.expanse.parked.x,s.frontier.life.expanse.parked.y,.48));
});
test('failed parking does not charge money or grant ownership',()=>{
 const s=sample(),w={size:512,tiles:new Uint8Array(512*512).fill(4)};Object.assign(s.frontier,{x:420.5,y:176.5});const before=JSON.stringify(s);assert.equal(buyRide(s,8,w),false);assert.equal(JSON.stringify(s),before);assert.equal(buySpecialCar(s,8,w),false);assert.equal(JSON.stringify(s),before);
});
test('every generated car is stealable, including stationary cars and after 64 thefts',()=>{
 const w=makeFrontierWorld(91),cars=[...w.sprites.filter(a=>a.kind==='trafficCar'),...trafficAt(w,480).filter(a=>a.kind==='trafficCar')];assert.ok(cars.length>20);
 const s=sample(),f=s.frontier;f.life.expanse.taken=Array.from({length:64},(_,i)=>'earlier-car-'+i);
 for(const car of cars){f.mounted=false;Object.assign(f,{x:car.x+.8,y:car.y});assert.equal(stealCar(s,car,w),true,car.id);restoreScenery(w,f);assert.ok(canStand(w,f.x,f.y,VEHICLES.car.radius),car.id);}
 assert.equal(f.life.expanse.taken.length,cars.length+64);assert.ok(validateState(s));
});
test('damaged parked cars remain stealable and duplicate theft is rejected',()=>{
 const s=sample(),w=empty(),f=s.frontier;Object.assign(f,{x:20,y:20});const car={id:'wreck-test',kind:'trafficCar',x:21,y:20,dead:true,hp:0,model:10};assert.ok(stealCar(s,car,w));assert.equal(f.life.expanse.carHealth,8);f.mounted=false;assert.equal(stealCar(s,car,w),false);
});
test('traffic emerges clear of an obstructed road',()=>{
 const w=empty(),s=sample();Object.assign(s.frontier,{x:20,y:20});w.traffic=[{id:'test-car',kind:'trafficCar',speed:0,phase:0,radius:.55,corners:[[20,20],[30,20],[30,30],[20,30]]}];w.tiles[20*40+20]=4;const cars=trafficActors(w,s.frontier);assert.equal(cars.length,1);assert.ok(canStand(w,cars[0].x,cars[0].y,.55));
});
test('hill dialogue escalates, cycles, pauses and resets after leaving',()=>{
 const s=sample(),f=s.frontier,w=empty();w.size=512;Object.assign(f,{x:82,y:15});assert.ok(unfinishedZone(w,f));Object.assign(f,{x:32.5,y:57.5});assert.equal(unfinishedZone(w,f),false);
 const d=new BoundaryDirector(),lines=[];let tremor=false,glitch=false;
 for(let i=0;i<700;i++){const e=d.step(true,.1);if(e.joke!==null)lines.push(e.joke);tremor ||= e.shake>0;glitch ||= e.glitch;assert.ok(e.shake<=3);}
 assert.ok(tremor&&glitch);assert.ok(lines.length>BOUNDARY_JOKES.length);const before=d.seconds;assert.equal(d.step(true,10,true).active,false);assert.equal(d.seconds,before);
 d.quiet=true;assert.equal(d.step(true,.1).joke,null);d.step(false,.1);assert.equal(d.seconds,0);assert.equal(d.quiet,false);assert.equal(d.step(true,.1).stage,'jokes');
});
