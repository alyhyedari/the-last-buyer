import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,validateState} from '../src/state.js';
import {newFrontierState} from '../src/frontier-state.js';
import {makeFrontierWorld,SIZE,canStand,moveInWorld,route} from '../src/frontier-world.js';
import {WEAPONS,shoot,actorWithHealth,enemyActors,updateThreats,updateProjectiles,vehicleStrike,recoverVehicle,hurtPlayer,recoverDrop,forestTreasure,weatherHazard,tickWeather,nightPopulation} from '../src/frontier-combat.js';
import {makeInterior,enterInterior,exitInterior} from '../src/frontier-interiors.js';
import {NIGHT_TEXT,NIGHT_ITEMS} from '../src/frontier-night-text.js';
import {adoptPet,worldActors} from '../src/frontier-life.js';
const sample=()=>{const s=newState();s.frontier=newFrontierState(91);return s;};
const empty=()=>({size:SIZE,tiles:new Uint8Array(SIZE*SIZE),colliders:[],buckets:new Map(),sprites:[],traffic:[]});
const equip=(s,w)=>{s.village.weapon=w;s.village.weapons=[w];Object.assign(s.frontier,{x:10.5,y:10.5,angle:0});};

test('classic shooting assists height, selects the closest aligned body and never crosses cover',()=>{
 for(const pitch of [-.58,0,.58]){const s=sample(),w=empty();equip(s,'pistol');s.frontier.life.pitch=pitch;const targets=[{id:'animal-1',kind:'deer',animal:true,x:14,y:10.5},{id:'animal-2',kind:'deer',animal:true,x:12,y:10.5}];const hit=shoot(s,w,targets);assert.equal(hit.target,'animal-2');assert.equal(hit.hp,26);assert.equal(shoot(s,w,targets).killed,true);assert.equal(s.frontier.life.hunted.length,1);assert.ok(validateState(s));}
 const s=sample(),w=empty();equip(s,'rifle');const deer={id:'animal-3',kind:'deer',animal:true,x:15,y:10.5};w.tiles[10*SIZE+12]=4;assert.equal(shoot(s,w,[deer]).kind,'miss');w.tiles[10*SIZE+12]=0;w.colliders.push({x:12.5,y:10.5,radius:.2});assert.equal(shoot(s,w,[deer]).kind,'miss');w.colliders=[];assert.equal(shoot(s,w,[{...deer,y:13}]).kind,'miss');
});
test('weapon ammunition, close spread and protected people have distinct outcomes',()=>{
 const s=sample(),w=empty();equip(s,'shotgun');const boar={id:'animal-9',kind:'boar',animal:true,x:13,y:10.5};assert.equal(shoot(s,w,[boar]).kind,'noAmmo');s.frontier.life.combat.shells=2;assert.ok(shoot(s,w,[boar]).hits.length>1);assert.equal(s.frontier.life.combat.shells,1);assert.ok(actorWithHealth(s.frontier,boar).hp<40);
 equip(s,'pistol');const owner={id:'owner-home-1',kind:'resident',x:12,y:10.5};assert.equal(shoot(s,w,[owner]).kind,'protectedShot');assert.equal(s.frontier.life.heat,40);assert.ok(s.frontier.life.combat.actors[owner.id].hp<100);assert.ok(validateState(s));
});
test('rockets and timed grenades move, explode, respect cover and can hurt the shooter',()=>{
 for(const gun of ['launcher','grenade']){const s=sample(),w=empty();equip(s,gun);s.frontier.life.combat[WEAPONS[gun].ammo]=2;w.tiles[10*SIZE+13]=4;const victim={id:'animal-1',kind:'boar',animal:true,x:12.3,y:10.6},behind={id:'animal-2',kind:'deer',animal:true,x:14,y:10.5};assert.equal(shoot(s,w,[victim,behind]).kind,'projectile');let events=[];for(let i=0;i<150;i++)events.push(...updateProjectiles(s,w,[victim,behind],1/60));assert.equal(w.projectiles.length,0);assert.ok(events.some(e=>e.kind==='explosion'));assert.ok(s.frontier.life.combat.actors[victim.id]);assert.equal(s.frontier.life.combat.actors[behind.id],undefined);assert.ok(s.frontier.life.health<100);}
});
test('bicycle impact damages wildlife, repeated corpse collisions cannot farm kills, recovery stays local',()=>{
 const s=sample(),w=empty();equip(s,'stick');s.village.vehicle='bike';s.village.vehicles=['bike'];s.frontier.mounted=true;const rabbit={id:'animal-8',kind:'rabbit',animal:true,x:11,y:10.5};assert.equal(vehicleStrike(s,w,rabbit,1),null);const hit=vehicleStrike(s,w,rabbit,4.6);assert.equal(hit.killed,true);assert.equal(vehicleStrike(s,w,rabbit,4.6),null);assert.equal(s.frontier.life.combat.kills,1);
 w.tiles[10*SIZE+12]=4;const p={x:11.7,y:10.5};assert.ok(recoverVehicle(w,p,{x:11,y:10.5},.29));assert.ok(Math.abs(p.x-11)<1e-8);const before={...p};assert.equal(recoverVehicle({size:SIZE,tiles:new Uint8Array(SIZE*SIZE).fill(4),buckets:new Map()},p,{x:90,y:90},.29),false);assert.deepEqual(p,before);
});
test('vehicle recovery cannot cross a tree and a newly adopted pet does not inherit an earlier injury',()=>{
 const s=sample(),w=empty(),tree={x:11,y:10.5,radius:.2};w.colliders=[tree];w.buckets.set('11,10',[tree]);
 const position={x:10.4,y:10.5};assert.ok(recoverVehicle(w,position,{x:11.6,y:10.5},.29));assert.ok(position.x<11,'must remain on this side of the trunk');assert.ok(canStand(w,position.x,position.y,.29));
 s.frontier.life.combat.actors['companion-pet']={x:10,y:10,hp:0,kind:'dog',at:480};s.frontier.life.pet=null;s.frontier.life.petBond=80;
 assert.equal(adoptPet(s,'cat'),true);assert.equal(s.frontier.life.petBond,0);const cat=worldActors(w,s.frontier,0).find(a=>a.id==='companion-pet');assert.ok(cat&&!cat.dead);assert.equal(cat.kind,'cat');assert.equal(adoptPet(s,'dog'),false);assert.ok(validateState(s));
});

test('death preserves progress, drops carried goods, survives reload and recovery is exact once',()=>{
 const s=sample();equip(s,'launcher');Object.assign(s.frontier,{x:49.5,y:77.5,receipts:['pond']});s.village.vehicles=['car'];s.village.vehicle='car';s.village.money=375;s.frontier.life.ammo=33;s.frontier.life.combat.rockets=6;s.frontier.life.campKit=true;assert.ok(hurtPlayer(s,200));assert.equal(s.frontier.x,32.5);assert.equal(s.frontier.life.health,100);assert.equal(s.village.money,0);assert.deepEqual(s.village.weapons,[]);assert.deepEqual(s.frontier.receipts,['pond']);assert.deepEqual(s.village.vehicles,['car']);const reload=validateState(s);assert.ok(reload);const d=reload.frontier.life.combat.drops[0];assert.equal(recoverDrop(reload,d.id),false);Object.assign(reload.frontier,{x:d.x,y:d.y});assert.equal(recoverDrop(reload,d.id),true);assert.equal(reload.village.money,375);assert.deepEqual(reload.village.weapons,['launcher']);assert.equal(reload.frontier.life.ammo,33);assert.equal(reload.frontier.life.combat.rockets,6);assert.equal(recoverDrop(reload,d.id),false);assert.ok(validateState(reload));
});
test('repeated deaths retain all dropped goods and partial recovery never deletes overflow',()=>{
 let s=sample();
 for(let i=0;i<18;i++){
  s.village.money=999999;s.frontier.life.ammo=500;s.frontier.life.combat.rockets=99;
  assert.equal(hurtPlayer(s,200,{ignoreGrace:true}),true);s=validateState(s);assert.ok(s,'save after death '+i);
 }
 const c=s.frontier.life.combat;
 assert.equal(c.drops.length,8);assert.equal(c.drops.reduce((n,d)=>n+d.money,0),18*999999);
 assert.equal(c.drops.reduce((n,d)=>n+d.ammo,0),9000);assert.equal(c.drops.reduce((n,d)=>n+d.rockets,0),18*99);
 const bag=c.drops.find(d=>d.ammo>500),before={...bag};Object.assign(s.frontier,{x:bag.x,y:bag.y});
 assert.equal(recoverDrop(s,bag.id),true);assert.equal(s.frontier.life.ammo,500);assert.equal(bag.ammo,before.ammo-500);
 assert.equal(bag.money,before.money-999999);assert.equal(bag.rockets,before.rockets-99);
 assert.equal(recoverDrop(s,bag.id),false);assert.ok(c.drops.includes(bag));assert.ok(validateState(s));
});

test('lightning warns at the strike location, strikes once, and respawn grace prevents repeated damage',()=>{
 const s=sample(),w=empty(),f=s.frontier;let warning;
 for(let m=38;m<20000;m++){f.minutes=m;const h=weatherHazard(f);if(h.warning&&m%180<167){warning=h;break;}}
 assert.ok(warning);while(!weatherHazard(f).thunder)f.minutes++;
 const strike=weatherHazard(f);assert.deepEqual(strike.strike,warning.strike);assert.equal(strike.index,warning.index);
 Object.assign(f,strike.strike);assert.ok(tickWeather(s,w,.1,2).some(e=>e.kind==='attacked'));assert.equal(f.life.health,62);
 assert.deepEqual(tickWeather(s,w,.1,3),[]);assert.equal(f.life.health,62);
 assert.equal(hurtPlayer(s,200),true);assert.equal(hurtPlayer(s,200),false);assert.equal(f.life.combat.deaths,1);assert.equal(f.life.health,100);
});

test('all buildings have reachable entrances and navigable furnished interiors with exact return positions',()=>{
 for(const seed of [1,91]){const w=makeFrontierWorld(seed);assert.ok(w.buildings.length>=30);for(const b of w.buildings){assert.ok(canStand(w,b.door.x,b.door.y),b.id+' door');assert.ok(route(w,{x:32.5,y:57.5},b.door).length,b.id+' route');const room=makeInterior(b,seed);for(const spot of room.rooms||[{x:6,y:6},{x:14,y:4},{x:7,y:14},{x:14,y:15}]){assert.ok(canStand(room,spot.x,spot.y),b.id);assert.ok(route(room,room.entry,spot).length,b.id+' room route');}}
  const s=sample(),b=w.buildings.find(b=>b.id==='homes');Object.assign(s.frontier,{...b.door,angle:.3});const original={x:s.frontier.x,y:s.frontier.y,angle:s.frontier.angle};const inside=enterInterior(s,w,b);assert.ok(inside.interior);assert.ok(validateState(s));assert.equal(enterInterior(s,w,b),null);assert.equal(exitInterior(s,w),true);assert.deepEqual({x:s.frontier.x,y:s.frontier.y,angle:s.frontier.angle},original);assert.equal(exitInterior(s,w),false);
 }
});
test('night threats pursue without crossing walls, daytime crowds thin, shelter stops attacks',()=>{
 const s=sample(),w=makeFrontierWorld(91),f=s.frontier;f.minutes=22*60;const first=enemyActors(w,f,0),enemy=first.find(e=>canStand(w,e.x+3,e.y));assert.ok(enemy);f.x=enemy.x+3;f.y=enemy.y;const before={...w.hunters.get(enemy.id)};let events=[];for(let i=0;i<100;i++){const actors=enemyActors(w,f,i*.1);events.push(...updateThreats(s,w,actors,.1,i*.1));for(const a of w.hunters.values())assert.ok(canStand(w,a.x,a.y,.25));}assert.ok(Math.hypot(w.hunters.get(enemy.id).x-before.x,w.hunters.get(enemy.id).y-before.y)>.1);assert.ok(events.some(e=>e.kind==='attacked'));assert.equal(nightPopulation(f),0);f.minutes=12*60;assert.equal(nightPopulation(f),1);assert.ok(enemyActors(w,f,11).length<first.length);const room=makeInterior(w.buildings[0],91);assert.deepEqual(updateThreats(s,room,first,.1,12),[]);assert.deepEqual(enemyActors(room,f,12),[]);
});
test('forest rewards are reachable, valuable and cannot be collected again after saving',()=>{
 const s=sample(),w=makeFrontierWorld(91);assert.equal(w.treasures.length,40);for(const t of w.treasures){assert.ok(canStand(w,t.x,t.y));assert.ok(route(w,{x:25.5,y:91.5},t).length);Object.assign(s.frontier,{x:t.x,y:t.y});assert.ok(forestTreasure(s,w,t)>=45);assert.equal(forestTreasure(s,w,t),false);}assert.equal(validateState(s).frontier.life.combat.treasures.length,40);
});
test('weather is deterministic and tornado damage stops indoors',()=>{
 const s=sample(),w=empty(),f=s.frontier;let tornado;for(let minute=0;minute<20000;minute+=1){f.minutes=minute;const h=weatherHazard(f);assert.deepEqual(h,weatherHazard(f));if(h.tornado){tornado=h.tornado;break;}}assert.ok(tornado);Object.assign(f,tornado);assert.ok(tickWeather(s,w,.1,2).some(e=>e.kind==='attacked'));const hp=f.life.health;w.interior='homes';assert.deepEqual(tickWeather(s,w,.1,4),[]);assert.equal(f.life.health,hp);
});
test('new content covers eight languages and corrupted inventory cannot invalidate a valid old save silently',()=>{
 for(const t of Object.values(NIGHT_TEXT))for(const lang of ['en','fa','zh','ar','es','hi','fr','pt']){assert.ok(t[lang]?.trim(),lang);assert.doesNotMatch(t[lang],/\uFFFD|\?{3}/);}assert.equal(NIGHT_ITEMS.length,5);const s=sample();delete s.frontier.life.combat;assert.ok(validateState(s)?.frontier.life.combat);const bad=sample();bad.frontier.life.combat.rockets=NaN;assert.equal(validateState(bad),null);
});
