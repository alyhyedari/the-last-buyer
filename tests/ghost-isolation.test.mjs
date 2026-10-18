import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,defaultSettings,validateState} from '../src/state.js';
import {newFrontierState} from '../src/frontier-state.js';
import {SIZE,canStand,moveInWorld} from '../src/frontier-world.js';
import {damageActor,shoot,targetUnderCrosshair,updateProjectiles,updateThreats,vehicleStrike} from '../src/frontier-combat.js';
import {stealCar} from '../src/frontier-expanse.js';
import {FrontierRenderer} from '../src/frontier-renderer.js';

const sample=()=>{const s=newState();s.frontier=newFrontierState(91);Object.assign(s.frontier,{x:10.5,y:10.5,angle:0,minutes:720});s.village.weapon='rifle';s.village.weapons=['rifle'];s.frontier.life.ammo=100;return s;};
const empty=()=>({size:SIZE,tiles:new Uint8Array(SIZE*SIZE),sprites:[],colliders:[],buckets:new Map(),buildings:[],traffic:[],effects:[],projectiles:[]});
const echo=(extra={})=>({id:'echo-network-peer',kind:'playerGhost',x:12.5,y:10.5,angle:0,vehicle:'foot',tone:1,opacity:1,...extra});
const forged=()=>echo({animal:true,hostile:true,alien:true,owned:true,domestic:true,scenery:true,boss:true,hp:999,maxHp:999,radius:8,damage:999});

test('echoes cannot absorb crosshair hits, even if copied records contain gameplay flags',()=>{
 for(const ghost of [echo(),forged()]){
  const s=sample(),w=empty(),f=s.frontier,target={id:'night-test-zombie',kind:'zombie',hostile:true,x:15.5,y:10.5,hp:95};
  assert.equal(targetUnderCrosshair(f,w,[ghost],'rifle'),null);
  assert.equal(targetUnderCrosshair(f,w,[ghost,target],'rifle'),target);
  const result=shoot(s,w,[ghost,target]);assert.equal(result.target,target.id);assert.equal(f.life.ammo,99);
  assert.equal(f.life.combat.actors[target.id].hp,5);assert.equal(f.life.combat.actors[ghost.id],undefined);
  assert.ok(w.effects.every(effect=>effect.victim!=='playerGhost'));assert.ok(validateState(s));
 }
});

test('direct damage, vehicle strikes and car theft cannot mutate an echo or the player economy',()=>{
 for(const ghost of [echo(),forged()]){
  const s=sample(),w=empty();s.frontier.mounted=true;s.village.vehicle='car';s.village.vehicles=['car'];
  const before=structuredClone(s),appearance=structuredClone(ghost);
  assert.equal(damageActor(s,w,ghost,1000),null);assert.equal(vehicleStrike(s,w,ghost,17),null);
  assert.equal(stealCar(s,ghost),false);s.frontier.mounted=false;assert.equal(stealCar(s,ghost),false);s.frontier.mounted=true;
  assert.deepEqual(s,before);assert.deepEqual(ghost,appearance);assert.deepEqual(w.effects,[]);
 }
});

test('rockets pass through echoes and blasts have exactly the same outcome as an empty echo layer',()=>{
 const initial=sample();
 const run=withEcho=>{
  const s=structuredClone(initial),w=empty(),ghost=forged();ghost.x=14.8;
  const target={id:'night-blast-target',kind:'zombie',hostile:true,x:16.8,y:10.5,hp:95};
  const actors=withEcho?[ghost,target]:[target];
  w.projectiles.push({id:1,kind:'rocket',x:13.5,y:10.5,angle:0,age:0,speed:16,ttl:10,blast:3.3,damage:135,height:.55,z:.55,vz:0});
  assert.deepEqual(updateProjectiles(s,w,actors,.15),[],'an echo must not detonate a passing rocket');
  assert.equal(w.projectiles.length,1);assert.ok(w.projectiles[0].x>ghost.x);
  w.projectiles[0].ttl=.15;const events=updateProjectiles(s,w,actors,.01);
  assert.ok(events.some(event=>event.target===target.id));assert.ok(events.every(event=>event.target!==ghost.id));
  assert.equal(s.frontier.life.combat.actors[ghost.id],undefined);
  return {state:s,effects:w.effects,events};
 };
 assert.deepEqual(run(true),run(false));
});

test('hostile-looking echo records cannot initiate attacks or create navigation obstacles',()=>{
 const s=sample(),w=empty(),ghost=forged();ghost.x=10.7;
 w.hunters=new Map([[ghost.id,{...ghost,alert:true,nextAttack:0,windup:1,lastSeen:2,path:[],repath:0}]]);
 const before=structuredClone(s),hunter=structuredClone(w.hunters.get(ghost.id));
 assert.deepEqual(updateThreats(s,w,[ghost],.1,2),[]);assert.deepEqual(s,before);assert.deepEqual(w.hunters.get(ghost.id),hunter);
 for(const radius of [.22,.29,.48]){const p={x:10.5,y:10.5};assert.ok(canStand(w,ghost.x,ghost.y,radius));moveInWorld(w,p,2,0,radius);assert.ok(Math.abs(p.x-12.5)<1e-8);}
});

function drawingSurface(){
 const images=[],rects=[],gradient={addColorStop(){}};
 const context=new Proxy({images,rects,globalAlpha:1,fillRect(...args){rects.push(args);},drawImage(...args){images.push({args,alpha:this.globalAlpha});},createLinearGradient(){return gradient;},createRadialGradient(){return gradient;}},{get(object,key){return key in object?object[key]:()=>{};}});
 return{width:0,height:0,dataset:{},getContext(){return context;},context};
}

test('renderer accepts bounded visual echoes without inserting them into actor or collision collections',()=>{
 const original=globalThis.document;globalThis.document={createElement:()=>drawingSurface()};
 try{
  const state=sample(),world=empty(),canvas=drawingSurface(),renderer=new FrontierRenderer(canvas,world,{...defaultSettings(),reducedMotion:true}),actors=[];
  const ghosts=Object.freeze(Array.from({length:40},(_,i)=>Object.freeze({...forged(),id:'peer-'+i,x:13.5+i*.01,dead:true,opacity:.8})));
  const saved=structuredClone(state),before=structuredClone(ghosts);
  renderer.render(state,1,{actors,ghosts});
  assert.equal(canvas.dataset.ghosts,'24');assert.equal(actors.length,0);assert.equal(world.sprites.length,0);assert.equal(world.colliders.length,0);assert.equal(world.buckets.size,0);
  assert.deepEqual(state,saved);assert.deepEqual(ghosts,before);assert.ok(canvas.context.images.length>0,'echo sprites are rendered');
  assert.ok(canvas.context.images.every(call=>call.alpha>0&&call.alpha<=.8*.56),'rendered echoes retain bounded translucency');
  assert.ok(canvas.context.images.every(call=>call.args.slice(1).every(Number.isFinite)));
  renderer.render(state,2,{actors,ghosts:[null,{x:NaN,y:10},{x:10,y:Infinity}]});assert.equal(canvas.dataset.ghosts,'0');
  const p={x:10.5,y:10.5};moveInWorld(world,p,5,0,.48);assert.ok(Math.abs(p.x-15.5)<1e-8,'rendering cannot add a collision footprint');
 }finally{if(original===undefined)delete globalThis.document;else globalThis.document=original;}
});
