import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,validateState} from '../src/state.js';
import {newFrontierState,canMount} from '../src/frontier-state.js';
import {makeFrontierWorld,canStand,tileAt,LAKES} from '../src/frontier-world.js';
import {enemyActors,damageActor,shoot,updateProjectiles,actorWithHealth,hurtPlayer} from '../src/frontier-combat.js';
import {trafficActors,CAR_MODELS,drivingStep,damageCar,parkCar,stealCar,restoreScenery,enterWater,leaveWater,moveSwimmer,waterActors,salvageCache,tickBreath,contactAlien,crowdPosition,smoke} from '../src/frontier-expanse.js';
import {EXPANSE_TEXT} from '../src/frontier-expanse-text.js';
import {MENU_TEXT} from '../src/menu-text.js';
import {separateVehicle} from '../src/frontier-expanse.js';
const sample=()=>{const s=newState();s.frontier=newFrontierState(91);return s;};

test('old saves migrate, water saves round-trip, fractional car models are rejected',()=>{
 const s=sample();delete s.frontier.life.expanse;const old=validateState(s);assert.ok(old);assert.equal(old.frontier.life.expanse.carHealth,100);
 old.frontier.life.expanse.carModel=1.5;assert.equal(validateState(old),null);
});
test('stealing is local, transfers damage, raises consequences and cannot duplicate a car',()=>{
 const s=sample(),f=s.frontier;const car={id:'traffic-neon-1',kind:'trafficCar',x:f.x+1,y:f.y,hp:150,model:3,angle:0};
 assert.equal(stealCar(s,{...car,x:120}),false);assert.equal(stealCar(s,car),true);assert.equal(f.life.expanse.carHealth,50);assert.equal(f.life.expanse.carModel,3);assert.equal(f.x,car.x);assert.equal(f.y,car.y);assert.equal(f.life.vehicleYaw,0);assert.equal(f.life.debts,90);assert.ok(f.life.heat>0);assert.equal(stealCar(s,car),false);parkCar(s);f.mounted=false;assert.equal(stealCar(s,car),false);assert.ok(validateState(s));damageCar(s,90);assert.equal(canMount(s),false);assert.equal(f.mounted,false);assert.ok(f.life.expanse.parked);
});
test('steering, gears and wet-road slip are time based and each car has a distinct profile',()=>{
 const run=(hz,wet)=>{const m={};let angle=0;for(let i=0;i<hz*3;i++)angle+=drivingStep(m,{dt:1/hz,turn:.8,speed:9,wet,model:1});return{...m,angle};};
 const a=run(30,false),b=run(60,false),rain=run(60,true);assert.ok(Math.abs(a.angle-b.angle)<.025);assert.ok(rain.slip>b.slip+.1);assert.equal(a.gear,5);assert.ok(a.rpm>900);assert.equal(new Set(CAR_MODELS.map(c=>c.speed)).size,4);
 const stopped={};assert.equal(drivingStep(stopped,{dt:1,turn:1,speed:0}),0);assert.ok(drivingStep(stopped,{dt:.1,turn:1,speed:-3})<0);
});
test('destroyed trunks clear collision and remain destroyed after save and world reconstruction',()=>{
 const s=sample(),w=makeFrontierWorld(91),tree=w.sprites.find(a=>a.kind==='tree'&&!w.colliders.some(b=>b.id!==a.id&&Math.hypot(b.x-a.x,b.y-a.y)<1));assert.ok(tree);assert.equal(canStand(w,tree.x,tree.y),false);
 assert.equal(damageActor(s,w,tree,130).kind,'objectBroken');assert.equal(canStand(w,tree.x,tree.y),true);assert.equal(s.frontier.life.combat.kills,0);
 const loaded=validateState(s);assert.ok(loaded);const next=makeFrontierWorld(91);restoreScenery(next,loaded.frontier);assert.ok(canStand(next,tree.x,tree.y));assert.equal(actorWithHealth(loaded.frontier,tree).dead,true);
});
test('rocket blasts damage vehicles and break trees, with material rather than blood effects',()=>{
 const s=sample(),f=s.frontier;Object.assign(f,{x:10.5,y:10.5,angle:0});s.village.weapon='launcher';s.village.weapons=['launcher'];f.life.combat.rockets=3;
 const w={size:32,tiles:new Uint8Array(1024),colliders:[],buckets:new Map()},actors=[{id:'tree-14-10',kind:'tree',x:14.5,y:10.5},{id:'traffic-car',kind:'trafficCar',x:14.5,y:11.2}];shoot(s,w,actors);for(let n=0;n<80;n++)updateProjectiles(s,w,actors,.025);
 assert.equal(f.life.combat.actors['tree-14-10'].hp,0);assert.ok(f.life.combat.actors['traffic-car'].hp<300);assert.ok(w.effects.some(e=>e.kind==='sparks'));assert.ok(!w.effects.some(e=>e.kind==='blood'));assert.ok(f.life.heat>0);assert.ok(validateState(s));
});
test('both lakes support bounded swimming, oxygen recovery, exact shore return and one-time cargo',()=>{
 for(const lake of LAKES){const s=sample(),f=s.frontier,w=makeFrontierWorld(91);Object.assign(f,lake.shore);assert.equal(enterWater(s,w),true);assert.equal(tileAt(w,f.x,f.y),3);assert.equal(canMount(s),false);const e=f.life.expanse;e.depth=1;
  for(let n=0;n<1200;n++)tickBreath(f,1/60);assert.ok(Math.abs(e.oxygen-52)<.001);assert.ok(validateState(s));e.depth=0;for(let n=0;n<240;n++)tickBreath(f,1/60);assert.equal(e.oxygen,100);
  const cache=waterActors(w,f,0).find(a=>a.kind==='sunkenCache');Object.assign(f,{x:cache.x,y:cache.y});e.depth=1;const money=s.village.money;assert.equal(salvageCache(s,cache),true);assert.equal(s.village.money,money+65);assert.equal(salvageCache(s,cache),false);assert.ok(validateState(s));
  moveSwimmer(w,f,100,100);assert.equal(tileAt(w,f.x,f.y),3);Object.assign(f,lake.entry);assert.equal(leaveWater(s,w),true);assert.deepEqual({x:f.x,y:f.y},lake.shore);assert.ok(!e.swimming);
 }
});
test('drowning leaves the recovery bag on the entry shore, not in inaccessible water',()=>{
 const s=sample(),f=s.frontier,w=makeFrontierWorld(91);Object.assign(f,LAKES[1].shore);enterWater(s,w);f.life.expanse.depth=1;tickBreath(f,50);assert.equal(f.life.expanse.oxygen,0);assert.ok(hurtPlayer(s,200,{ignoreGrace:true}));assert.ok(!f.life.expanse.swimming);const bag=f.life.combat.drops[0];assert.deepEqual({x:bag.x,y:bag.y},LAKES[1].shore);assert.ok(validateState(s));
});
test('visitors remember peaceful contact and attacks; smoking consumes inventory with a health cost',()=>{
 const s=sample(),f=s.frontier,w=makeFrontierWorld(91),alien=w.sprites.find(a=>a.alien);Object.assign(f,{x:alien.x,y:alien.y+2});assert.ok(contactAlien(s,alien));assert.equal(contactAlien(s,alien),false);damageActor(s,w,alien,5);assert.ok(f.life.expanse.alienTrust<0);assert.equal(contactAlien(s,w.sprites.find(a=>a.alien&&a.id!==alien.id)),false);f.life.expanse.cigarettes=3;const health=f.life.health;assert.ok(smoke(s));assert.equal(smoke(s),false);assert.equal(f.life.health,health-2);assert.equal(f.life.expanse.cigarettes,2);assert.ok(validateState(s));
});
test('diverse crowds spawn in open space and walk without crossing buildings or trunks',()=>{
 const s=sample(),f=s.frontier,w=makeFrontierWorld(5),people=w.sprites.filter(a=>a.kind==='resident');assert.ok(people.length>=140);assert.equal(new Set(people.map(a=>a.variant)).size,12);
 for(const source of people){const a=crowdPosition(w,source,f,0);assert.ok(a&&canStand(w,a.x,a.y,.2),source.id);}
 w.panic={x:74,y:48,until:f.minutes+12};for(let n=1;n<50;n++)for(const source of people.slice(0,20)){const a=crowdPosition(w,source,f,n*.1);assert.ok(canStand(w,a.x,a.y,.2),source.id);}
 f.minutes=23*60;assert.equal(crowdPosition(w,people[0],f,10),null);
});
test('new menu and world text cover all eight locales without broken encoding',()=>{
 for(const [key,row]of Object.entries({...EXPANSE_TEXT,...MENU_TEXT}))for(const lang of ['en','fa','zh','ar','es','hi','fr','pt'])assert.ok(typeof row[lang]==='string'&&row[lang].length>0&&!row[lang].includes('\uFFFD'),key+' '+lang);
});

test('traffic yields to a stopped player, resumes when clear, and respects stolen cars and wrecks',()=>{
 const s=sample(),f=s.frontier;Object.assign(f,{x:10,y:10,minutes:0});const w={traffic:[{id:'traffic-test',kind:'trafficCar',phase:5,speed:2.4,corners:[[2,10],[28,10],[28,28],[2,28]]}]};const first=trafficActors(w,f)[0];for(let n=0;n<200;n++){f.minutes+=.05;const car=trafficActors(w,f)[0];assert.ok(car.stopped);assert.ok(Math.abs(car.x-first.x)<.001);}
 f.x=50;f.minutes+=.1;assert.ok(trafficActors(w,f)[0].x>first.x);f.life.combat.actors['traffic-test']={x:12,y:10,hp:0,kind:'trafficCar',at:0};assert.equal(trafficActors(w,f)[0].x,12);f.life.expanse.taken.push('traffic-test');assert.equal(trafficActors(w,f).length,0);
});

test('high attention attracts daytime sentinels while peaceful daytime streets stay clear',()=>{
 const s=sample(),f=s.frontier,w=makeFrontierWorld(91);f.minutes=12*60;assert.ok(enemyActors(w,f,0).every(a=>a.id.split('-')[2]>=4));f.life.heat=76;const guards=enemyActors(w,f,1).filter(a=>Number(a.id.split('-')[2])<4);assert.ok(guards.length>0&&guards.length<=8);assert.ok(guards.every(a=>Math.hypot(a.x-f.x,a.y-f.y)<54));assert.ok(guards.every(a=>a.kind==='sentinel'));
});

test('traffic contact uses short collision-safe displacement and never crosses a wall',()=>{
 const w={size:20,tiles:new Uint8Array(400),colliders:[],buckets:new Map()};
 for(let y=0;y<20;y++)w.tiles[y*20+10]=4;
 const f={x:9.6,y:5.5},car={x:9.2,y:5.5,angle:0};
 for(let n=0;n<20;n++)separateVehicle(w,f,car,.22);
 assert.ok(f.x<9.79);assert.ok(canStand(w,f.x,f.y,.22));assert.equal(f.y,5.5);
 const open={x:7,y:8},start={...open};separateVehicle(w,open,{x:6.5,y:8},.22);
 assert.ok(open.x>start.x);assert.ok(open.x-start.x<=.5);assert.ok(canStand(w,open.x,open.y));
});
