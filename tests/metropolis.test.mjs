import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,validateState} from '../src/state.js';
import {newFrontierState} from '../src/frontier-state.js';
import {makeFrontierWorld,canStand,route,moveInWorld,trafficAt} from '../src/frontier-world.js';
import {makeInterior,enterInterior,exitInterior} from '../src/frontier-interiors.js';
import {CITY_DESTINATIONS,CITY_DISCOVERIES,CITY_BUILDINGS} from '../src/metropolis-data.js';
import {CITY_TEXT,CITY_TALES} from '../src/metropolis-text.js';
import {BATTLE_TEXT} from '../src/frontier-battle-text.js';
import {CITY_STORIES} from '../src/metropolis-stories.js';
import {buyApartment,cityContract,rideMetro,rideLift,discoverCity,restApartment} from '../src/metropolis-actions.js';
import {damageActor,actorWithHealth} from '../src/frontier-combat.js';
import {isScenery,restoreScenery,stealCar} from '../src/frontier-expanse.js';
import {ORDER} from '../src/i18n.js';
const sample=()=>{const s=newState();s.frontier=newFrontierState(91);s.village.money=2000;return s;};
const locate=(s,id)=>Object.assign(s.frontier,CITY_DESTINATIONS.find(p=>p.id===id));

test('city districts connect to the county; every hidden trace and full-width traffic lane is reachable',()=>{
 for(const seed of [1,91]){const w=makeFrontierWorld(seed),start={x:144.5,y:119.5};assert.equal(w.cityBuildings.size,27);
  for(const p of [...CITY_DESTINATIONS,...CITY_DISCOVERIES.filter(d=>!d.floor)]){assert.ok(canStand(w,p.x,p.y),p.id);assert.ok(route(w,start,p).length,p.id);}
  for(let minutes=0;minutes<150;minutes+=.3)for(const v of trafficAt(w,minutes).filter(v=>v.id.startsWith('city-')))assert.ok(canStand(w,v.x,v.y,v.radius),v.id+' '+v.x+','+v.y);
 }
});
test('all three tower floors have reachable interactions and preserve exact outdoor return on save',()=>{
 const s=sample(),f=s.frontier,w=makeFrontierWorld(91),b=w.buildings.find(b=>b.id==='tether');Object.assign(f,{...b.door,angle:.4});const original={x:f.x,y:f.y,angle:f.angle};let room=enterInterior(s,w,b);
 for(const floor of ['archive','sky','lobby']){Object.assign(f,room.entry);assert.equal(rideLift(s,room,b,floor),null,'cannot remotely call lift');Object.assign(f,room.cityPoints.find(p=>p.id==='lift'));room=rideLift(s,room,b,floor);assert.ok(room);assert.equal(room.cityFloor,floor);
  for(const p of room.rooms){assert.ok(canStand(room,p.x,p.y),floor+' point');assert.ok(route(room,room.entry,p).length,floor+' route');}
  const loaded=validateState(JSON.parse(JSON.stringify(s)));assert.ok(loaded);assert.equal(loaded.frontier.life.combat.interior.floor,floor);assert.equal(makeInterior(b,f.seed,{floor:loaded.frontier.life.combat.interior.floor}).cityFloor,floor);
 }
 assert.ok(exitInterior(s,w));assert.deepEqual({x:f.x,y:f.y,angle:f.angle},original);
});
test('rail charges exactly once, parks the owned car, rejects remote rides and returns to the station',()=>{
 const s=sample(),f=s.frontier,w=makeFrontierWorld(91);assert.equal(rideMetro(s,w,'tether'),false);locate(s,'citygate');Object.assign(s.village,{vehicle:'car',vehicles:['car']});f.mounted=true;
 const parked={x:f.x,y:f.y},money=s.village.money;assert.ok(rideMetro(s,w,'tether'));assert.equal(s.village.money,money-6);assert.equal(f.mounted,false);assert.equal(f.life.expanse.parked.x,parked.x);
 assert.equal(rideMetro(s,w,'tether'),false);assert.ok(rideMetro(s,w,'citygate'));assert.equal(f.x,parked.x);assert.equal(f.y,parked.y);assert.equal(s.village.money,money-12);assert.ok(validateState(s));
});
test('six discoveries are local, unique, reward once and unlock an affordable permanent apartment',()=>{
 const s=sample(),f=s.frontier,w=makeFrontierWorld(91);s.village.money=0;
 for(const d of CITY_DISCOVERIES){let room=w;if(d.floor){const b=w.buildings.find(b=>b.id==='tether');room=makeInterior(b,f.seed,{floor:d.floor});}Object.assign(f,{x:d.x,y:d.y});assert.ok(discoverCity(s,room,d.id));assert.equal(discoverCity(s,room,d.id),0);}
 assert.equal(s.village.money,360);assert.equal(buyApartment(s),false);locate(s,'apartment');assert.ok(buyApartment(s));assert.equal(s.village.money,40);assert.equal(buyApartment(s),false);
 const b=w.buildings.find(b=>b.id==='apartment'),room=enterInterior(s,w,b);f.life.health=50;assert.ok(restApartment(s,room));assert.equal(f.energy,100);assert.equal(f.life.health,85);assert.equal(restApartment(s,room),false);f.life.city.theme=2;
 const loaded=validateState(s);assert.ok(loaded);assert.equal(loaded.frontier.life.city.apartment,true);assert.equal(loaded.frontier.life.city.theme,2);assert.equal(loaded.frontier.life.city.discoveries.length,6);
});
test('courier contracts require actual destinations and cannot farm repeated delivery rewards',()=>{
 const s=sample();assert.equal(cityContract(s,'aurora'),false);locate(s,'aurora');assert.equal(cityContract(s,'aurora'),true);const target=s.frontier.life.city.contract.to,money=s.village.money;assert.equal(cityContract(s,target),false);locate(s,target);assert.equal(cityContract(s,target),65);assert.equal(cityContract(s,target),false);assert.equal(s.village.money,money+65);assert.ok(validateState(s));
});
test('legacy city data migrates; corrupt ownership, floor, discovery and encounter fields are rejected',()=>{
 const s=sample();delete s.frontier.life.city;delete s.frontier.life.combat.arena;delete s.frontier.life.combat.dodgeUntil;assert.ok(validateState(s));
 for(const change of [s=>s.frontier.life.city.theme=9,s=>s.frontier.life.city.discoveries=['fake'],s=>s.frontier.life.city.apartment='yes',s=>s.frontier.life.combat.arena='fake',s=>s.frontier.life.combat.interior={id:'tether',floor:'999',outside:{x:230,y:46,angle:0}}]){const bad=sample();change(bad);assert.equal(validateState(bad),null);}
});
test('metropolis and battle interfaces have complete text in all eight languages',()=>{
 for(const item of [...CITY_STORIES,...Object.values(CITY_TEXT),...Object.values(BATTLE_TEXT),...CITY_TALES.flatMap(t=>[t.name,t.clue])])for(const lang of ORDER)assert.ok(typeof item[lang]==='string'&&item[lang].length>0&&!item[lang].includes('\uFFFD'),lang);
 for(const b of CITY_BUILDINGS){assert.ok(b.height>0&&b.height<=25);assert.ok(CITY_TEXT[b.id],'translated address: '+b.id);}
});

test('damaged city props, residents, households and stolen cars remain valid across saves',()=>{
 const s=sample(),f=s.frontier,w=makeFrontierWorld(91);
 const props=w.sprites.filter(a=>a.metro&&isScenery(a));assert.ok(props.length>40);
 for(const a of props)damageActor(s,w,a,1000);
 for(const a of w.sprites.filter(a=>a.metro&&a.kind==='resident').slice(0,3))damageActor(s,w,a,10);
 for(const b of CITY_BUILDINGS){const room=makeInterior(b,91);const owner=room.sprites.find(a=>a.owner);if(owner)damageActor(s,room,owner,5);}
 const car=trafficAt(w,0).find(a=>a.id.startsWith('city-')&&a.kind==='trafficCar');Object.assign(f,{x:car.x,y:car.y});damageActor(s,w,car,30);assert.ok(stealCar(s,actorWithHealth(f,car)));
 const loaded=validateState(s);assert.ok(loaded,'all city damage IDs survive serialization');
 const rebuilt=makeFrontierWorld(91);restoreScenery(rebuilt,loaded.frontier);assert.equal(rebuilt.colliders.some(a=>props.some(p=>p.id===a.id)),false);assert.ok(loaded.frontier.life.expanse.taken.includes(car.id));
});
