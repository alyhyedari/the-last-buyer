import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,validateState} from '../src/state.js';
import {newFrontierState} from '../src/frontier-state.js';
import {SIZE,makeFrontierWorld,canStand,moveInWorld} from '../src/frontier-world.js';
import {hostileHit,hurtPlayer,damageActor,dodgeStep,vehicleStrike,enemyActors,updateThreats,actorWithHealth} from '../src/frontier-combat.js';
import {pursuitLevel} from '../src/frontier-night-director.js';
import {MYTH_BOSSES,mythActors,updateMyths} from '../src/frontier-myth.js';
import {syncArena,restoreArena,bossPhase,bossPattern,resetUnfinishedBosses} from '../src/frontier-encounters.js';
const sample=()=>{const s=newState();s.frontier=newFrontierState(91);return s;};
const empty=()=>({size:SIZE,tiles:new Uint8Array(SIZE*SIZE),colliders:[],buckets:new Map(),sprites:[],traffic:[]});

test('car hull absorbs enemy hits first, ejects at destruction, then exposes Vlad; bikes do not shield',()=>{
 const s=sample(),f=s.frontier;Object.assign(s.village,{vehicle:'car',vehicles:['car']});f.mounted=true;
 assert.equal(hostileHit(s,30,'zombie').kind,'carHit');assert.equal(f.life.expanse.carHealth,90);assert.equal(f.life.health,100);
 assert.equal(hostileHit(s,300,'brute').kind,'carBroken');assert.equal(f.mounted,false);assert.equal(f.life.expanse.carHealth,0);assert.equal(f.life.health,100);assert.ok(f.life.expanse.parked);
 assert.equal(hostileHit(s,12,'zombie').kind,'attacked');assert.equal(f.life.health,88);
 f.mounted=true;s.village.vehicle='bike';hostileHit(s,12,'zombie');assert.equal(f.life.health,76);assert.ok(validateState(s));
});
test('cars can run down zombies; a corpse cannot absorb another hit or pay again',()=>{
 const s=sample(),f=s.frontier,w=empty();Object.assign(s.village,{vehicle:'car',vehicles:['car']});f.mounted=true;const z={id:'night-1-0-0',kind:'zombie',x:f.x+.4,y:f.y,hostile:true};
 const hit=vehicleStrike(s,w,z,7);assert.ok(hit.killed);assert.equal(f.life.health,100);assert.ok(f.life.expanse.carHealth<100);const money=s.village.money;assert.equal(vehicleStrike(s,w,actorWithHealth(f,z),7),null);assert.equal(s.village.money,money);
});
test('arena seals on entry, blocks high-speed escape, survives reload and opens on victory',()=>{
 for(const b of MYTH_BOSSES){const s=sample(),f=s.frontier,w=makeFrontierWorld(91);Object.assign(f,{x:b.x,y:b.y+6.5});assert.equal(syncArena(f,w).kind,'arenaSealed');const before={x:f.x,y:f.y};moveInWorld(w,f,0,30,.48);assert.ok(Math.hypot(f.x-b.x,f.y-b.y)+.48<=9.101);assert.ok(!canStand(w,b.x,b.y+12));
  const loaded=validateState(s);assert.ok(loaded);const restored=empty();restoreArena(loaded.frontier,restored);assert.equal(restored.arena.id,b.id);
  f.life.combat.actors['boss-'+b.id]={x:b.x,y:b.y,hp:0,kind:b.kind,at:f.minutes};assert.equal(syncArena(f,w).kind,'arenaOpened');assert.equal(w.arena,null);assert.equal(f.life.combat.arena,null);assert.ok(canStand(empty(),before.x,before.y+12));
 }
});
test('all bosses have three distinct health phases, changing patterns and telegraphs before each strike',()=>{
 for(const b of MYTH_BOSSES){const s=sample(),f=s.frontier,w=empty();Object.assign(f,{x:b.x,y:b.y+5});mythActors(w,f,0);const p=w.myth.get('boss-'+b.id);assert.equal(bossPhase(b.hp,b.hp),1);
  for(const [ratio,phase]of [[.6,2],[.25,3]]){f.life.combat.actors['boss-'+b.id]={x:b.x,y:b.y,hp:b.hp*ratio,kind:b.kind,at:f.minutes};assert.equal(bossPhase(b.hp*ratio,b.hp),phase);const event=updateMyths(s,w,.1).find(e=>e.kind==='battlePhaseShift');assert.equal(event.phase,phase);assert.equal(p.windup,0);f.minutes=p.next;const warning=updateMyths(s,w,.1).find(e=>e.kind==='mythWarning');assert.ok(warning);assert.ok(p.windup>f.minutes);assert.equal(f.life.health,100);p.windup=0;}
  assert.ok(new Set([0,1,2].map(n=>bossPattern(b,3,n))).size>=2);
 }
});
test('death resets unfinished boss health and abilities while defeated guardians and collected powers remain',()=>{
 const s=sample(),f=s.frontier,w=empty(),b=MYTH_BOSSES[0],won=MYTH_BOSSES[1];Object.assign(f,{x:b.x,y:b.y+5});syncArena(f,w);mythActors(w,f,0);damageActor(s,w,{id:'boss-stag',kind:b.kind,x:b.x,y:b.y,boss:true},200);
 f.life.combat.actors['boss-'+won.id]={x:won.x,y:won.y,hp:0,kind:won.kind,at:f.minutes};f.life.forest.gme=['cinder'];f.life.forest.coins=['buy-03'];f.life.combat.dodgeUntil=f.minutes+1;assert.ok(hurtPlayer(s,1000,{ignoreGrace:true}));resetUnfinishedBosses(f,w);
 assert.equal(f.life.combat.actors['boss-stag'],undefined);assert.equal(f.life.combat.actors['boss-cinder'].hp,0);assert.equal(f.life.combat.arena,null);assert.equal(w.myth.size,0);assert.equal(f.life.combat.dodgeUntil,0);assert.deepEqual(f.life.forest.gme,['cinder']);assert.ok(validateState(s));
});
test('dodge consumes energy, respects walls and arena bounds, grants only a short evade window',()=>{
 const s=sample(),f=s.frontier,w=empty();Object.assign(f,{x:10.5,y:10.5,angle:0});const before=f.x;assert.ok(dodgeStep(s,w,{forward:1}));assert.ok(f.x>before);assert.equal(f.energy,92);assert.equal(hostileHit(s,20,'runner'),null);assert.equal(dodgeStep(s,w),false);f.minutes+=.5;assert.equal(hostileHit(s,20,'runner').kind,'attacked');f.minutes+=2;
 for(let y=1;y<SIZE;y++)w.tiles[y*SIZE+14]=4;dodgeStep(s,w,{forward:1});assert.ok(f.x<14);assert.ok(canStand(w,f.x,f.y));
});
test('city night has local zombie packs and runners; daylight is quiet and broken sight ends pursuit',()=>{
 const s=sample(),f=s.frontier,w=makeFrontierWorld(91);Object.assign(f,{x:286.5,y:90.5,minutes:720});assert.equal(enemyActors(w,f,0).length,0);f.minutes=1320;const actors=enemyActors(w,f,1);assert.ok(actors.length>=28&&actors.length<=56);assert.ok(actors.some(a=>a.kind==='runner'));assert.ok(actors.filter(a=>a.kind==='zombie').length>12);for(const p of w.hunters.values())p.alert=true;assert.ok(pursuitLevel(w,f)>0);f.minutes=720;enemyActors(w,f,2);assert.equal(pursuitLevel(w,f),0);
 const arena=empty(),z={id:'night-1-1-0',kind:'zombie',x:10.5,y:10.5,hostile:true};Object.assign(f,{x:14.5,y:10.5});arena.hunters=new Map([[z.id,{...z,path:[],repath:0,nextAttack:0,alert:false,lastSeen:0}]]);updateThreats(s,arena,[z],.1,1);assert.equal(arena.hunters.get(z.id).alert,true);for(let y=0;y<SIZE;y++)arena.tiles[y*SIZE+12]=4;updateThreats(s,arena,[z],.1,12);assert.equal(arena.hunters.get(z.id).alert,false);
});
