import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,validateState,readSettings,defaultSettings} from '../src/state.js';
import {newFrontierState,VEHICLES,advanceTime,canMount} from '../src/frontier-state.js';
import {SIZE,PLACES,makeFrontierWorld,canStand,moveInWorld,nearestOpen,route,trafficAt,clearSight} from '../src/frontier-world.js';
import {driveMotion,followRoadStep,crime,restitution,trafficImpact,injure,useContraband,campNight,shootWorld,worldActors} from '../src/frontier-life.js';
const sample=()=>{const s=newState();s.frontier=newFrontierState(12345);return s;};

test('visible tree trunks, signposts and buildings block swept movement instead of being pass-through art',()=>{
 const world=makeFrontierWorld(91);
 for(const obstacle of world.colliders){assert.equal(canStand(world,obstacle.x,obstacle.y),false,obstacle.id);}
 for(const building of world.buildings)assert.equal(canStand(world,building.x,building.y),false,building.id);
 const isolated=world.colliders.find(o=>o.kind==='tree'&&canStand(world,o.x-1,o.y)&&canStand(world,o.x+1,o.y));assert.ok(isolated);
 for(const radius of [.22,.29,.48]){const p={x:isolated.x-1,y:isolated.y};moveInWorld(world,p,2,0,radius);assert.ok(p.x<isolated.x-radius);assert.ok(canStand(world,p.x,p.y,radius));}
 const restored=nearestOpen(world,isolated);assert.ok(canStand(world,restored.x,restored.y));assert.ok(Math.hypot(restored.x-isolated.x,restored.y-isolated.y)<2,'old saves relocate locally, never to the village gate');
});

test('expanded destinations and moving traffic have physically clear routes including the full car footprint',()=>{
 const world=makeFrontierWorld(5);assert.equal(SIZE,192);assert.equal(PLACES.length,35);
 for(const p of PLACES){assert.ok(canStand(world,p.x,p.y,.48),p.id);const road=route(world,{x:32.5,y:57.5},p,.48);if(p.id!=='gate')assert.ok(road.length,p.id);const vehicle={x:32.5,y:57.5};for(const step of road)moveInWorld(world,vehicle,step.x-vehicle.x,step.y-vehicle.y,.48);assert.ok(Math.hypot(vehicle.x-p.x,vehicle.y-p.y)<.01,p.id);}
 for(let minute=0;minute<100;minute+=.25)for(const car of trafficAt(world,minute))assert.ok(canStand(world,car.x,car.y,car.radius),car.id+' at '+car.x+','+car.y);
});

test('vehicle acceleration and braking are gradual and consistent across frame rates',()=>{
 const run=hz=>{const m={speed:0,phase:0,lean:0};for(let i=0;i<hz*2;i++)driveMotion(m,{vehicle:VEHICLES.car,throttle:1,dt:1/hz});return m;};
 const a=run(30),b=run(60);assert.ok(a.speed>0&&a.speed<VEHICLES.car.speed);assert.ok(Math.abs(a.speed-b.speed)<.001);assert.ok(Math.abs(a.phase-b.phase)<.11);const old=a.speed;driveMotion(a,{vehicle:VEHICLES.car,brake:true,dt:1/60});assert.ok(a.speed<old&&a.speed>0);for(let i=0;i<120;i++)driveMotion(a,{vehicle:VEHICLES.car,brake:true,dt:1/60});assert.equal(a.speed,0);
});

test('guided travel crosses waypoint boundaries without reporting a false collision',()=>{
 const world=makeFrontierWorld(5);
 for(const hz of [30,60]){const p={x:32.5,y:57.5,angle:0},m={speed:0,phase:0,lean:0,heading:0},goal=PLACES.find(p=>p.id==='garage'),path=route(world,p,goal,.29);let frames=0;while(path.length&&frames++<hz*30){const before={...p};driveMotion(m,{vehicle:VEHICLES.bike,throttle:1,dt:1/hz});const attempted=followRoadStep(world,p,m,path,{mounted:true,dt:1/hz,radius:.29}),moved=Math.hypot(p.x-before.x,p.y-before.y);assert.ok(attempted<=.003||moved>=.003,'changing waypoints must not look like a solid wall');assert.ok(canStand(world,p.x,p.y,.29));}assert.ok(Math.hypot(p.x-goal.x,p.y-goal.y)<.1,'arrives without teleporting');assert.equal(path.length,0);}
});

test('navigation joins roads from off-centre saves and supports clicks within the same tile',()=>{
 const w=makeFrontierWorld(91),goal=PLACES[0];const trunk=w.colliders.find(c=>c.kind==='tree'&&canStand(w,c.x+.45,c.y+.2,.22));assert.ok(trunk);const start={x:trunk.x+.45,y:trunk.y+.2},path=route(w,start,goal);assert.ok(path.length);const p={...start};for(const step of path)moveInWorld(w,p,step.x-p.x,step.y-p.y);assert.ok(Math.hypot(p.x-goal.x,p.y-goal.y)<.01);const close={x:32.7,y:57.6},short=route(w,goal,close);assert.deepEqual(short.at(-1),close);
});

test('theft cannot mint endless money; restitution, traffic injuries and recovery persist',()=>{
 const s=sample(),l=s.frontier.life;assert.ok(['caught','stolen'].includes(crime(s)));const money=s.village.money,debt=l.debts;assert.ok(debt>0&&l.heat>0);assert.equal(crime(s),null);assert.equal(s.village.money,money);assert.ok(restitution(s));assert.ok(l.debts<debt);trafficImpact(s,{});const health=l.health;assert.ok(health<100);assert.equal(trafficImpact(s,{}),null);assert.equal(l.health,health);assert.ok(injure(s,200));assert.equal(s.frontier.x,32.5);assert.equal(l.health,100);assert.equal(l.combat.drops.length,1);assert.ok(validateState(s));
});

test('camping, adoption and impairing fictional items retain meaningful restrictions across a save',()=>{
 const s=sample(),f=s.frontier,l=f.life;assert.equal(campNight(s),false);l.campKit=true;l.pet='dog';l.health=40;assert.ok(campNight(s));assert.equal(campNight(s),false);assert.ok(l.health>40&&l.petBond>0);l.contraband=1;assert.equal(useContraband(s,true),false);assert.equal(l.contraband,1);l.companion=true;f.trust=4;assert.ok(useContraband(s,true));assert.equal(l.companion,false);assert.equal(f.trust,3);s.village.vehicle='horse';s.village.vehicles=['horse'];assert.equal(canMount(s),false);assert.equal(useContraband(s),false);advanceTime(f,181);assert.ok(canMount(s));const roundtrip=validateState(s);assert.ok(roundtrip);assert.deepEqual(roundtrip.frontier.life,l);
});

test('world shooting uses ammunition, line of sight and the visible crosshair; animals cannot be collected twice',()=>{
 const s=sample(),f=s.frontier;s.village.weapon='rifle';s.village.weapons=['rifle'];Object.assign(f,{x:10.5,y:10.5,angle:0});const world={tiles:new Uint8Array(SIZE*SIZE),colliders:[],buckets:new Map()},target={id:'animal-4',kind:'deer',animal:true,x:13.5,y:10.5};f.life.pitch=(135-108-143.1/3+95/3*.4)/150;
 const before=f.life.ammo;assert.equal(shootWorld(s,world,[target],{aiming:true}).kind,'huntResult');assert.equal(f.life.ammo,before-1);assert.equal(f.life.hunted.length,1);shootWorld(s,world,[target],{aiming:true});assert.equal(f.life.hunted.length,1);
 world.tiles[10*SIZE+12]=4;assert.equal(clearSight(world,f,target),false);assert.equal(shootWorld(s,world,[{...target,id:'animal-5'}],{aiming:true}).kind,'miss');assert.equal(f.life.hunted.length,1);f.life.ammo=0;assert.equal(shootWorld(s,world,[target]).kind,'noAmmo');f.mounted=true;assert.equal(shootWorld(s,world,[target]).kind,'cannotShoot');
});

test('daylight has no invisible robber, saved hunting removes its animal, and camera settings remain bounded',()=>{
 const s=sample(),w=makeFrontierWorld(12);s.frontier.life.hunted=['animal-0'];const actors=worldActors(w,s.frontier,0);assert.ok(actors.every(a=>a.kind!=='robber'&&a.id!=='animal-0'));s.frontier.minutes=22*60;assert.ok(worldActors(w,s.frontier,0).some(a=>a.kind==='robber'));const settings=readSettings({getItem:()=>JSON.stringify({...defaultSettings(),lookSensitivity:99,invertLook:true})});assert.equal(settings.lookSensitivity,2);assert.equal(settings.invertLook,true);assert.equal(validateState({...s,frontier:{...s.frontier,life:{...s.frontier.life,ammo:NaN}}}),null);
});

test('companions occupy the world instead of orbiting the camera and follow collision-safe paths',()=>{
 const s=sample(),f=s.frontier,w=makeFrontierWorld(12);f.life.pet='dog';f.life.companion=true;const first=worldActors(w,f,0).filter(a=>a.following);assert.equal(first.length,2);assert.ok(first.find(a=>a.kind==='dog').animal);f.angle+=Math.PI;const turned=worldActors(w,f,.01).filter(a=>a.following);for(let i=0;i<2;i++){assert.equal(turned[i].x,first[i].x);assert.equal(turned[i].y,first[i].y);}
 f.y-=5;let previous=turned;for(let frame=1;frame<240;frame++){const next=worldActors(w,f,frame/60).filter(a=>a.following);for(let i=0;i<2;i++){assert.ok(canStand(w,next[i].x,next[i].y,.18));assert.ok(Math.hypot(next[i].x-previous[i].x,next[i].y-previous[i].y)<.09,'no follower teleport');}previous=next;}assert.ok(previous.every(a=>Math.hypot(a.x-f.x,a.y-f.y)<2.5));
});
