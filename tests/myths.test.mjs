import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,validateState} from '../src/state.js';
import {newFrontierState,earn,travelStep} from '../src/frontier-state.js';
import {makeFrontierWorld,canStand,route,moveInWorld,SIZE} from '../src/frontier-world.js';
import {MYTH_BOSSES,mythActors,updateMyths,collectGme,uvTouches,revealUvSeals,tickForestPerks,echoShock} from '../src/frontier-myth.js';
import {damageActor,shoot,hurtPlayer,actorWithHealth} from '../src/frontier-combat.js';
import {FOREST_COINS,castForestPulse,collectForestCoin,forestCoinActor} from '../src/frontier-forest.js';
import {echoRadius,echoRecharge,echoDuration,walkPower,swimPower,pickupRadius,lightRange} from '../src/frontier-perks.js';
import {tickBreath,damageCar} from '../src/frontier-expanse.js';
import {recoverFooting} from '../src/frontier-recovery.js';
import {MYTH_TEXT} from '../src/frontier-myth-text.js';
const sample=()=>{const s=newState();s.frontier=newFrontierState(91);return s;};
const empty=()=>({size:SIZE,tiles:new Uint8Array(SIZE*SIZE),buckets:new Map(),colliders:[],sprites:[],traffic:[]});
const give=(s,...n)=>s.frontier.life.forest.coins=n.map(n=>'buy-'+String(n).padStart(2,'0'));

test('six original guardians have separate patterns and reachable clear arenas',()=>{
 assert.equal(new Set(MYTH_BOSSES.map(b=>b.attack)).size,6);
 for(const seed of [1,91,2026]){const w=makeFrontierWorld(seed);for(const b of MYTH_BOSSES){
  assert.ok(canStand(w,b.x,b.y,.4));const start={x:b.x,y:b.y+7};assert.ok(canStand(w,start.x,start.y));const path=route(w,start,b),p={...start};assert.ok(path.length);
  for(const step of path)moveInWorld(w,p,step.x-p.x,step.y-p.y);assert.ok(Math.hypot(p.x-b.x,p.y-b.y)<.02);
 }}
});
test('every boss telegraphs before damage, its marked strike can be evaded, and time pauses naturally',()=>{
 for(const b of MYTH_BOSSES){const s=sample(),f=s.frontier,w=empty();Object.assign(f,{x:b.x,y:b.y+5});mythActors(w,f,0);f.minutes+=3;
  assert.equal(updateMyths(s,w,.1)[0].kind,'mythWarning');const p=w.myth.get('boss-'+b.id),due=p.windup;assert.ok(due>f.minutes);assert.equal(f.life.health,100);
  updateMyths(s,w,.1);assert.equal(p.windup,due);assert.equal(f.life.health,100);
  f.x=b.x+18;f.y=b.y+2;f.minutes=due;updateMyths(s,w,.1);assert.equal(f.life.health,100,b.id+' dodge');
 }
 const b=MYTH_BOSSES[0],s=sample(),f=s.frontier,w=empty();Object.assign(f,{x:b.x,y:b.y+4});mythActors(w,f,0);f.minutes+=3;updateMyths(s,w,.1);f.minutes=w.myth.get('boss-stag').windup;assert.equal(updateMyths(s,w,.1)[0].kind,'attacked');assert.equal(f.life.health,82);
});
test('GME requires a defeated guardian and local collection; each reward survives reload exactly once',()=>{
 for(const b of MYTH_BOSSES){const s=sample(),f=s.frontier,w=empty();Object.assign(f,{x:b.x,y:b.y+2,angle:-Math.PI/2});const actor=mythActors(w,f,0).find(a=>a.id==='boss-'+b.id);
  assert.equal(collectGme(s,w,{boss:b.id}),false);damageActor(s,w,actor,80);assert.ok(validateState(s));const loaded=validateState(s);assert.ok(loaded.frontier.life.combat.actors[actor.id].hp<b.hp);
  damageActor(s,w,actor,10000);const coin=mythActors(w,f,0).find(a=>a.kind==='gmeCoin');assert.ok(coin);f.x+=6;assert.equal(collectGme(s,w,coin),false);f.x=b.x;
  assert.ok(collectGme(s,w,coin));const money=s.village.money;assert.equal(collectGme(s,w,coin),false);assert.equal(s.village.money,money);
  assert.deepEqual(validateState(s).frontier.life.forest.gme,[b.id]);assert.ok(!mythActors(w,f,0).some(a=>a.id===coin.id));
 }
});
test('UV uses the facing cone, respects walls and trunks, doubles armored boss damage and reveals permanent seals',()=>{
 const s=sample(),f=s.frontier,w=empty(),b=MYTH_BOSSES[0];Object.assign(f,{x:b.x,y:b.y+4,angle:-Math.PI/2});const actor=mythActors(w,f,0).find(a=>a.boss===true),normal=damageActor(s,w,actor,100).damage;
 Object.assign(f.life.forest,{uvOwned:true,light:'uv'});assert.ok(uvTouches(f,w,b));assert.equal(damageActor(s,w,actor,100).damage,normal*2);
 f.angle=0;assert.ok(!uvTouches(f,w,b));f.angle=-Math.PI/2;w.colliders.push({x:f.x,y:f.y-2,radius:.4});assert.ok(!uvTouches(f,w,b));w.colliders=[];
 const coin=FOREST_COINS[14];Object.assign(f,{x:coin.x,y:coin.y+1,angle:-Math.PI/2});assert.equal(forestCoinActor(f,coin,0).kind,'uvRune');assert.equal(collectForestCoin(s,w,coin.id),null);
 w.tiles[Math.floor(coin.y+.5)*SIZE+Math.floor(coin.x)]=4;assert.deepEqual(revealUvSeals(f,w),[]);w.tiles.fill(0);assert.deepEqual(revealUvSeals(f,w),[coin.id]);assert.deepEqual(revealUvSeals(f,w),[]);
 const restored=validateState(s);assert.ok(restored);restored.frontier.life.forest.light='off';assert.equal(forestCoinActor(restored.frontier,coin,0).kind,'buyCoin');assert.ok(collectForestCoin(restored,w,coin.id));
});
test('out-of-order signature coins unlock Echo, ward and healing without requiring a particular route',()=>{
 const s=sample(),w=empty(),f=s.frontier;give(s,3,12);f.life.health=60;assert.ok(castForestPulse(s,w));assert.equal(f.life.health,72);assert.ok(validateState(s).frontier.life.forest.pulseUntil>0);
});
test('combat perks change actual aimed damage, fifth shots, ammo usage, bounties and healing',()=>{
 const s=sample(),f=s.frontier,w=empty();Object.assign(f,{x:10.5,y:10.5,angle:0});s.village.weapon='rifle';s.village.weapons=['rifle'];f.life.ammo=20;give(s,5,7,16,20,23,28);f.life.forest.gme=['storm'];f.life.health=50;
 const make=id=>({id,kind:'watcher',hostile:true,x:14,y:10.5});const initial=shoot(s,w,[make('night-1')],{aiming:true});assert.equal(initial.damage,135);
 shoot(s,w,[]);shoot(s,w,[]);const ammo=f.life.ammo;shoot(s,w,[]);assert.equal(f.life.ammo,ammo);
 const fifth=shoot(s,w,[make('night-2')],{aiming:true});assert.equal(fifth.killed,true);assert.equal(f.life.health,53);assert.equal(f.life.ammo,ammo);assert.equal(s.village.money,145);
});
test('travel, water and protection rewards stack with GME and remain bounded',()=>{
 const s=sample(),f=s.frontier;give(s,8,10,11,13,14,15,17,21,22,25,26,27);f.life.forest.gme=['stag','cinder','tide','clock'];assert.equal(earn(s,100),110);
 assert.equal(echoRadius(f),42);assert.equal(pickupRadius(f),3);assert.equal(echoRecharge(f),13.5);assert.equal(echoDuration(f),14.4);assert.ok(walkPower(f)>1.29);assert.equal(swimPower(f),1.4);
 f.life.forest.light='uv';assert.equal(lightRange(f),22);f.life.forest.light='lantern';assert.equal(lightRange(f),18);
 f.life.expanse.swimming=true;f.life.expanse.depth=1;tickBreath(f,10);assert.equal(f.life.expanse.oxygen,91);f.life.expanse.swimming=false;
 f.mounted=true;s.village.vehicle='car';s.village.vehicles=['car'];const fuel=f.fuel;travelStep(s,10);assert.ok(f.fuel<fuel);assert.ok(f.energy>99.94);damageCar(s,20);assert.equal(f.life.expanse.carHealth,85);
 hurtPlayer(s,20,{ignoreGrace:true});assert.equal(f.life.health,100);assert.ok(f.life.expanse.carHealth<85);f.mounted=false;hurtPlayer(s,20,{ignoreGrace:true});assert.ok(Math.abs(f.life.health-85.04)<.001);
});
test('safe regeneration is suspended by nearby danger; final Echo shock respects cover and bosses',()=>{
 const s=sample(),f=s.frontier,w=empty();Object.assign(f,{x:10.5,y:10.5});give(s,3,19,30);f.life.forest.gme=['void'];f.life.health=50;
 const enemy={id:'myth-1',kind:'wisp',hostile:true,x:14,y:10.5},boss={id:'boss-stag',kind:'mythStag',hostile:true,boss:true,x:12,y:10.5};tickForestPerks(s,w,[enemy]);assert.equal(f.life.health,50);f.minutes+=15;tickForestPerks(s,w,[]);assert.equal(f.life.health,54);
 w.tiles[10*SIZE+12]=4;echoShock(s,w,[enemy,boss]);assert.equal(f.life.combat.actors[enemy.id],undefined);w.tiles.fill(0);echoShock(s,w,[enemy,boss]);assert.equal(actorWithHealth(f,enemy).hp,25);assert.equal(f.life.combat.actors[boss.id],undefined);
});
test('fast collision and recovery remain local and never jump across a dividing wall',()=>{
 const w={size:24,tiles:new Uint8Array(576),buckets:new Map(),colliders:[]};for(let y=0;y<24;y++)w.tiles[y*24+12]=4;
 for(const radius of [.22,.29,.48]){const f={x:9.5,y:10.5,angle:0},safe={...f};moveInWorld(w,f,40,0,radius);assert.ok(f.x<12-radius);assert.ok(recoverFooting(w,f,safe,radius));assert.ok(f.x<12-radius);assert.ok(canStand(w,f.x,f.y,radius));
  recoverFooting(w,f,{x:13.5,y:10.5},radius);assert.ok(f.x<12-radius);
 }
 const invalid={x:12.5,y:10.5,angle:0};assert.ok(recoverFooting(w,invalid,{x:11,y:10.5},.48));assert.ok(canStand(w,invalid.x,invalid.y,.48));
 const sealed={size:24,tiles:new Uint8Array(576).fill(4),buckets:new Map()},p={x:10,y:10,angle:0};assert.equal(recoverFooting(sealed,p,null),false);
});
test('new saved powers reject invalid IDs and all thirty have distinct translated descriptions',()=>{
 for(const bad of [{gme:['fake']},{light:'laser'},{uvOwned:1},{shots:.5},{coins:['buy-31']}]){const s=sample();Object.assign(s.frontier.life.forest,bad);assert.equal(validateState(s),null);}
 for(const lang of ['en','fa','zh','ar','es','hi','fr','pt']){const text=Array.from({length:30},(_,i)=>MYTH_TEXT['perk'+(i+1)][lang]);assert.equal(new Set(text).size,30);assert.ok(text.every(t=>t&&!t.includes('\uFFFD')));}
});
