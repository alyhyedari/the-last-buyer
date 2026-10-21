import test from 'node:test';
import assert from 'node:assert/strict';
import {driveMotion} from '../src/frontier-life.js';
import {drivingStep} from '../src/frontier-expanse.js';
import {engineFor,powertrainStep} from '../src/vehicle-dynamics.js';
import {CAR_MODELS} from '../src/frontier-cars.js';
import {VEHICLES} from '../src/frontier-state.js';
import {moveInWorld} from '../src/frontier-world.js';
import {AdaptiveQuality} from '../src/quality.js';

test('every car survives a zero-time first frame, pause, acceleration and braking',()=>{
 for(const model of CAR_MODELS){
  const vehicle={...VEHICLES.car,...model,engine:engineFor(model.id)},m={speed:0,phase:0,lean:0,heading:0};
  powertrainStep(m,{vehicle,dt:0});
  for(const dt of [0,...Array(180).fill(1/60),0,...Array(180).fill(1/30)]){
   driveMotion(m,{vehicle,throttle:1,dt});
   m.heading+=drivingStep(m,{profile:vehicle,speed:m.speed,dt,turn:.1});
   for(const [key,value] of Object.entries(m))if(typeof value==='number')assert.ok(Number.isFinite(value),model.id+' '+key);
  }
  assert.ok(m.speed>1,model.id);
  for(let i=0;i<300;i++)driveMotion(m,{vehicle,brake:true,dt:1/60});
  assert.equal(m.speed,0);
 }
});
test('tab suspension cannot cause a giant driving step or poison motion',()=>{
 const vehicle={...VEHICLES.car,engine:engineFor('sedan')},m={speed:NaN,phase:NaN,lean:Infinity,heading:0};
 driveMotion(m,{vehicle,throttle:1,dt:Infinity});assert.equal(m.speed,0);
 driveMotion(m,{vehicle,throttle:1,dt:300});assert.ok(m.speed<1);assert.ok(Number.isFinite(m.phase));
 const world={size:64,tiles:new Uint8Array(4096),buckets:new Map()},p={x:20,y:20};
 assert.equal(moveInWorld(world,p,Infinity,0),0);assert.equal(moveInWorld(world,p,NaN,0),0);
 assert.equal(moveInWorld(world,p,1e9,0),0);assert.equal(p.x,20);
});
test('expensive frames downgrade immediately; transient load cannot instantly restore quality',()=>{
 const q=new AdaptiveQuality('high');q.rendered(60);assert.equal(q.detail,2);assert.equal(q.quality,'low');
 for(let i=0;i<120;i++){q.sample(16.67);q.rendered(2);q.presented();}assert.equal(q.detail,2);
 q.reset('high');for(let i=0;i<3;i++)q.rendered(20);assert.equal(q.quality,'low');
 q.reset('high');q.sample(2500);assert.equal(q.detail,2);
});
