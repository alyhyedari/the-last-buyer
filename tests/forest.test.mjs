import test from 'node:test';
import {revealUvSeals} from '../src/frontier-myth.js';
import assert from 'node:assert/strict';
import {newState,validateState} from '../src/state.js';
import {newFrontierState} from '../src/frontier-state.js';
import {makeFrontierWorld,canStand,route,placeById,moveInWorld,tileAt} from '../src/frontier-world.js';
import {FOREST_COINS,FOREST_MILESTONES,nearestForestCoin,collectForestCoin,castForestPulse,forestCooldown,forestPulseActive} from '../src/frontier-forest.js';
import {FOREST_TEXT} from '../src/frontier-forest-text.js';
import {forestWard} from '../src/frontier-forest-state.js';
import {actorPosition,worldActors} from '../src/frontier-life.js';
import {updateThreats,hurtPlayer} from '../src/frontier-combat.js';
const sample=()=>{const s=newState();s.frontier=newFrontierState(91);return s;};
const at=(s,c)=>Object.assign(s.frontier,{x:c.x,y:c.y+.8,mounted:false});

test('all thirty glades are walkable off-road and reachable without crossing trunks across seeds',()=>{
 assert.equal(new Set(FOREST_COINS.map(c=>c.id)).size,30);
 for(const seed of [1,91,2026,4294967295]){const w=makeFrontierWorld(seed);for(const coin of FOREST_COINS){
  assert.equal(tileAt(w,coin.x,coin.y),0,coin.id);assert.ok(canStand(w,coin.x,coin.y),coin.id);
  const start=placeById(coin.trail),path=route(w,start,coin),p={...start};assert.ok(path.length,coin.id);
  for(const goal of path){moveInWorld(w,p,goal.x-p.x,goal.y-p.y);assert.ok(Math.hypot(goal.x-p.x,goal.y-p.y)<.02,seed+' '+coin.id+' swept route');}
 }}
});
test('forest is layered, seeded, and keeps ground-cover rendering local',()=>{
 const w=makeFrontierWorld(91),again=makeFrontierWorld(91);assert.equal(w.sprites.length,again.sprites.length);
 assert.ok(w.sprites.filter(s=>s.kind==='tree').length>3600);assert.ok(w.sprites.filter(s=>s.understory).length>1000);
 assert.ok(new Set(w.sprites.filter(s=>s.kind==='tree').map(s=>s.variant)).size>=8);
 const s=sample();at(s,FOREST_COINS[4]);const visible=worldActors(w,s.frontier,0);
 assert.ok(visible.filter(s=>s.understory).length<180);assert.ok(visible.filter(s=>s.understory).every(a=>Math.hypot(a.x-s.frontier.x,a.y-s.frontier.y)<15));
});
test('collection is local, on foot, line-of-sight checked, and pays each milestone once',()=>{
 const s=sample(),f=s.frontier,w=makeFrontierWorld(91),coin=FOREST_COINS[0],money=s.village.money;
 assert.equal(collectForestCoin(s,w,coin.id),null);at(s,coin);f.mounted=true;assert.equal(collectForestCoin(s,w,coin.id),null);f.mounted=false;
 assert.equal(collectForestCoin(s,{...w,interior:'house'},coin.id),null);f.life.expanse.swimming=true;assert.equal(collectForestCoin(s,w,coin.id),null);f.life.expanse.swimming=false;
 const wall=Math.floor(f.y-.4)*w.size+Math.floor(f.x),old=w.tiles[wall];w.tiles[wall]=4;assert.equal(collectForestCoin(s,w,coin.id),null);w.tiles[wall]=old;
 const result=collectForestCoin(s,w,coin.id);assert.equal(result.reward,48);assert.equal(result.milestone.at,1);assert.equal(s.village.money,money+48);
 assert.equal(collectForestCoin(s,w,coin.id),null);const loaded=validateState(s);assert.ok(loaded);assert.equal(collectForestCoin(loaded,makeFrontierWorld(91),coin.id),null);assert.equal(loaded.village.money,money+48);
 assert.equal(actorPosition(w,coin,f,0),null);assert.equal(nearestForestCoin(w,f),null);
});
test('sleeping coins require an earned local pulse; recharge and open seals survive a reload',()=>{
 const s=sample(),w=makeFrontierWorld(91),f=s.frontier,sealed=FOREST_COINS[5];at(s,sealed);assert.equal(collectForestCoin(s,w,sealed.id),null);assert.equal(castForestPulse(s,w),null);
 for(const coin of FOREST_COINS.slice(0,3)){at(s,coin);collectForestCoin(s,w,coin.id);}assert.equal(f.life.forest.coins.length,3);
 const pulse=castForestPulse(s,w);assert.deepEqual(pulse.opened,[]);assert.equal(forestCooldown(f),30);assert.ok(forestPulseActive(f));assert.equal(castForestPulse(s,w),null);
 at(s,sealed);assert.equal(collectForestCoin(s,w,sealed.id),null);f.minutes+=36;assert.deepEqual(castForestPulse(s,w).opened,[sealed.id]);
 const loaded=validateState(s);assert.ok(loaded);assert.ok(forestPulseActive(loaded.frontier));assert.equal(forestCooldown(loaded.frontier),30);loaded.frontier.minutes+=10;assert.ok(!forestPulseActive(loaded.frontier));assert.ok(collectForestCoin(loaded,w,sealed.id));
 assert.equal(castForestPulse(loaded,w),null);assert.equal(loaded.frontier.life.forest.casts,2);
});
test('all rewards are attainable, capped, idempotent and permanent through death',()=>{
 const s=sample(),w=makeFrontierWorld(91),f=s.frontier,before=s.village.money,achievements=[];let paid=0;
 for(const coin of FOREST_COINS){at(s,coin);if(coin.uv){f.life.forest.uvOwned=true;f.life.forest.light='uv';f.angle=-Math.PI/2;revealUvSeals(f,w);}else if(coin.sealed){f.minutes+=40;assert.ok(castForestPulse(s,w));}const r=collectForestCoin(s,w,coin.id);assert.ok(r,coin.id);paid+=r.reward;if(r.milestone)achievements.push(r.milestone.at);}
 assert.deepEqual(achievements,[1,3,6,9,12,18,24,30]);assert.equal(s.village.money-before,paid);
 f.minutes+=40;f.life.health=89;f.energy=94;assert.ok(castForestPulse(s,w));assert.equal(f.life.health,100);assert.equal(f.energy,100);assert.equal(forestCooldown(f),15);
 hurtPlayer(s,999,{ignoreGrace:true});assert.equal(f.life.forest.coins.length,30);assert.ok(validateState(s));assert.ok(f.life.combat.drops.length);assert.equal(s.village.money,Math.floor((before+paid)*.2));
});
test('Echo ward stops actual attacks and pursuit, then releases enemies when game time advances',()=>{
 const s=sample(),f=s.frontier;Object.assign(f,{x:10.5,y:10.5});f.life.forest.coins=FOREST_COINS.slice(0,6).map(c=>c.id);
 const p={x:11,y:10.5,alert:true,path:[],windup:1,nextAttack:0,repath:0},enemy={id:'test-enemy',kind:'zombie',x:p.x,y:p.y,hostile:true,hp:95};
 const w={size:24,tiles:new Uint8Array(576),buckets:new Map(),colliders:[],hunters:new Map([[enemy.id,p]])};
 castForestPulse(s,w);assert.ok(forestWard(f,p));assert.deepEqual(updateThreats(s,w,[enemy],.1,10),[]);assert.equal(f.life.health,100);assert.equal(p.windup,0);
 f.minutes+=10;assert.ok(!forestWard(f,p));updateThreats(s,w,[enemy],.1,11);assert.equal(updateThreats(s,w,[enemy],.1,12)[0].kind,'attacked');assert.equal(f.life.health,88);
});
test('old saves migrate and invalid forest data cannot break the save or forge a pulse before unlock',()=>{
 const s=sample();delete s.frontier.life.forest;const loaded=validateState(s);assert.ok(loaded);assert.deepEqual(loaded.frontier.life.forest.coins,[]);
 loaded.frontier.life.forest.pulseUntil=99999;assert.equal(validateState(loaded).frontier.life.forest.pulseUntil,0);
 for(const bad of [{coins:['unknown']},{hint:1.5},{casts:NaN},{coins:Array(31).fill('buy-01')},{tracked:'buy-99'},{opened:['bad-id']}]){const s=sample();Object.assign(s.frontier.life.forest,bad);assert.equal(validateState(s),null);}
});
test('forest guidance and achievements are available in all eight game languages',()=>{
 for(const [key,row]of Object.entries(FOREST_TEXT))for(const lang of ['en','fa','zh','ar','es','hi','fr','pt'])assert.ok(typeof row[lang]==='string'&&row[lang].length>0,key+'/'+lang);
});
