import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,validateState} from '../src/state.js';
import {newFrontierState,VEHICLES} from '../src/frontier-state.js';
import {makeFrontierWorld,canStand,moveInWorld,route,LAKES} from '../src/frontier-world.js';
import {CYBER_SPOTS,COAST_CAST,CIRCUIT} from '../src/cyber-data.js';
import {buyRide,tuneRide,tunedProfile,buyCyberArm,buyAbility,useAbility,buyBlend,useBlend,relayHelp,startCircuit,tickCircuit} from '../src/cyber-systems.js';
import {shoot,hurtPlayer,dropOnDeath,updateThreats} from '../src/frontier-combat.js';
import {WeaponController} from '../src/frontier-loadout.js';
import {enterWater,leaveWater,moveSwimmer} from '../src/frontier-expanse.js';
const sample=()=>{const s=newState();s.frontier=newFrontierState(91);s.village.money=40000;return s;};
const locate=(s,id)=>Object.assign(s.frontier,CYBER_SPOTS.find(p=>p.id===id));
const empty=()=>({size:64,tiles:new Uint8Array(4096),buckets:new Map(),colliders:[],hunters:new Map()});
test('legacy saves gain bounded cyber state; coast, vehicles, upgrades and effects round trip',()=>{
 const s=sample();delete s.frontier.life.cyber;const old=validateState(s);assert.ok(old);assert.deepEqual(old.frontier.life.cyber.abilities,[]);locate(old,'coast-garage');assert.ok(buyRide(old,17));assert.ok(tuneRide(old,'engine'));assert.ok(buyAbility(old,'aegis'));assert.ok(useAbility(old,'aegis'));assert.ok(validateState(old));
 for(const corrupt of [c=>c.motor=4,c=>c.tunes={'0':{engine:4}},c=>c.active={aegis:Infinity},c=>c.blends.prism=-1,c=>c.owned=[18],c=>c.race={next:4,started:0}]){const bad=structuredClone(old);corrupt(bad.frontier.life.cyber);assert.equal(validateState(bad),null);}
});
test('eighteen rides charge once; switching retains ownership and does not repair damage for free',()=>{
 const s=sample(),f=s.frontier;assert.equal(buyRide(s,8),false);locate(s,'coast-garage');for(let id=0;id<18;id++){assert.ok(buyRide(s,id));assert.ok(validateState(s));}const money=s.village.money;assert.ok(buyRide(s,8));f.life.expanse.carHealth=40;assert.ok(buyRide(s,8));assert.equal(f.life.expanse.carHealth,40);assert.equal(s.village.money,money);assert.equal(f.life.cyber.owned.length,18);f.mounted=true;assert.equal(buyRide(s,9),false);
});
test('tuning changes handling, caps at three, costs progressively and survives death',()=>{
 const s=sample();locate(s,'coast-garage');buyRide(s,8);const stock=tunedProfile(s,VEHICLES.car);for(const key of ['engine','grip','armor','brakes']){const before=s.village.money;for(let n=0;n<3;n++)assert.ok(tuneRide(s,key));assert.equal(before-s.village.money,720);assert.equal(tuneRide(s,key),false);}const tuned=tunedProfile(s,VEHICLES.car);assert.ok(tuned.speed>stock.speed&&tuned.accel>stock.accel&&tuned.grip>stock.grip&&tuned.brake>stock.brake&&tuned.armor<stock.armor);dropOnDeath(s);assert.equal(s.frontier.life.cyber.tunes[8].engine,3);assert.ok(validateState(s));
});
test('abilities consume resources and enforce cooldowns across reload; shield reduces damage and ghost masks sight',()=>{
 const s=sample(),f=s.frontier;for(const id of ['overdrive','aegis','ghost'])assert.ok(buyAbility(s,id));assert.equal(useAbility(s,'overdrive'),false);s.village.vehicle='motorcycle';s.village.vehicles=['motorcycle'];f.mounted=true;const fuel=f.fuel;assert.ok(useAbility(s,'overdrive'));assert.equal(f.fuel,fuel-12);assert.ok(tunedProfile(s,VEHICLES.motorcycle).speed>16);assert.equal(useAbility(validateState(s),'overdrive'),false);f.mounted=false;assert.ok(useAbility(s,'aegis'));hurtPlayer(s,20,{ignoreGrace:true});assert.equal(f.life.health,91);assert.ok(useAbility(s,'ghost'));
 Object.assign(f,{x:10,y:10});const w=empty();w.hunters.set('enemy',{x:11,y:10,alert:false,path:[],repath:0,nextAttack:0});updateThreats(s,w,[{id:'enemy',kind:'zombie',hostile:true,x:11,y:10}],.1,1);assert.equal(w.hunters.get('enemy').alert,false);assert.ok(validateState(s));
});
test('sensory blends require the vendor, stock, sobriety recovery and safe on-foot use',()=>{
 const s=sample(),f=s.frontier;assert.equal(buyBlend(s,'prism'),false);locate(s,'coast-dealer');assert.ok(buyBlend(s,'prism'));f.mounted=true;assert.equal(useBlend(s,'prism'),false);f.mounted=false;assert.ok(useBlend(s,'prism'));assert.equal(f.life.cyber.blends.prism,0);assert.ok(f.life.impairedUntil>f.minutes);assert.ok(buyBlend(s,'velvet'));assert.equal(useBlend(s,'velvet'),false);f.minutes=f.life.cyber.crashUntil;assert.ok(useBlend(s,'velvet'));assert.ok(validateState(s));
});
test('relay help is contextual, reproducible, non-repeating and cannot be farmed by reload',()=>{
 const a=sample(),b=sample();assert.equal(relayHelp(a),relayHelp(b));assert.equal(relayHelp(validateState(a)),null);const last=a.frontier.life.cyber.helperLast;a.frontier.minutes=a.frontier.life.cyber.helperAt;assert.ok(relayHelp(a));assert.notEqual(a.frontier.life.cyber.helperLast,last);assert.ok(validateState(a));
});
test('specialist weapons hit differently, spend and reload rounds, stop at cover and survive saves',()=>{
 const s=sample(),f=s.frontier,w=empty();Object.assign(f,{x:10,y:10,angle:0});const actors=[{id:'enemy-1',kind:'zombie',hostile:true,x:14,y:10},{id:'enemy-2',kind:'zombie',hostile:true,x:16,y:10},{id:'enemy-3',kind:'zombie',hostile:true,x:15,y:12}];for(const a of actors)w.hunters.set(a.id,{...a,path:[],repath:0,nextAttack:0});buyCyberArm(s,'arc');const ammo=f.life.ammo,result=shoot(s,w,actors);assert.equal(result.hits.length,3);assert.equal(f.life.ammo,ammo-1);assert.ok(w.hunters.get('enemy-2').stunnedUntil>f.minutes);assert.equal(validateState(s).village.weapon,'arc');
 f.life.combat.actors={};buyCyberArm(s,'rail');const rail=shoot(s,w,actors);assert.equal(rail.hits.length,2);f.life.combat.actors={};for(let y=0;y<64;y++)w.tiles[y*64+12]=4;assert.equal(shoot(s,w,actors).hits?.some(h=>h.target?.startsWith('enemy')),undefined);
 buyCyberArm(s,'pulse');const controller=new WeaponController(s);f.life.combat.magazines.pulse=18;assert.equal(shoot(s,w,actors).kind,'reloadNeeded');assert.equal(controller.reload(),'reloading');for(let n=0;n<20;n++)controller.tick(.1);assert.equal(f.life.combat.magazines.pulse,0);buyCyberArm(s,'monoblade');const before=f.life.ammo;shoot(s,w,[]);assert.equal(f.life.ammo,before);assert.ok(validateState(s));
});
test('coast is connected, full-size vehicles fit the circuit and the ocean has a usable entry and exit',()=>{
 for(const seed of [91,2026]){const w=makeFrontierWorld(seed);assert.equal(w.size,512);for(const p of [...CYBER_SPOTS,...COAST_CAST])assert.ok(canStand(w,p.x,p.y,.48),p.id);const points=[{x:354.5,y:142.5},{x:404.5,y:142.5},{x:404.5,y:196.5},...CIRCUIT];for(let i=1;i<points.length;i++){const p={...points[i-1]},target=points[i];moveInWorld(w,p,target.x-p.x,target.y-p.y,.48);assert.ok(Math.hypot(p.x-target.x,p.y-target.y)<.1,'road segment '+i);}
 for(const spot of CYBER_SPOTS)assert.ok(route(w,{x:404.5,y:176.5},spot,.48).length,spot.id+' route');const s=sample(),lake=LAKES.find(l=>l.id==='glasswater');Object.assign(s.frontier,{x:lake.shore.x-4,y:lake.shore.y});assert.ok(enterWater(s,w));moveSwimmer(w,s.frontier,1000,0);assert.ok(s.frontier.x<510);Object.assign(s.frontier,lake.entry);assert.ok(leaveWater(s,w));assert.ok(validateState(s));}
});
test('circuit requires ordered checkpoints, cancels on dismount, pays once and saves active progress',()=>{
 const s=sample(),f=s.frontier;locate(s,'coast-start');assert.equal(startCircuit(s),false);s.village.vehicle='car';s.village.vehicles=['car'];f.mounted=true;assert.ok(startCircuit(s));Object.assign(f,CIRCUIT[2]);assert.equal(tickCircuit(s),null);assert.equal(f.life.cyber.race.next,0);const cash=s.village.money;for(const p of CIRCUIT){Object.assign(f,p);f.minutes+=20;tickCircuit(s);assert.ok(validateState(s));}assert.equal(s.village.money,cash+180);assert.equal(tickCircuit(s),null);assert.equal(f.life.cyber.best,80);assert.ok(startCircuit(s));f.mounted=false;assert.equal(tickCircuit(s),'cyberRaceCancel');
});
