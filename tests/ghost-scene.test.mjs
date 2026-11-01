import test from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryGhostStore} from '../server/ghost-store.js';
import {parseClientMessage,validatePose} from '../src/ghost-protocol.js';
import {reduceScene,emptyScene,pruneScene,validateSceneAction,validScene} from '../src/ghost-scene.js';
const pose=(id,extra={})=>({id,seq:1,x:10,y:10,angle:0,vehicle:'foot',space:'outdoor',model:4,tone:0,paused:false,...extra});
const register={type:'sceneAction',nonce:1,action:'vehicle',vehicleId:'driver',vehicle:'car',model:4,parked:false,x:10,y:10,angle:0};
const request=(action,vehicleId='driver')=>({type:'sceneAction',nonce:2,action,vehicleId});
test('scene protocol rejects player damage, money, age, script targets and unbounded actions',()=>{for(const m of [{...register,damage:5},{...register,money:4},{...register,model:14},{...request('join'),health:0},{type:'sceneAction',nonce:3,action:'effect',kind:'damage',target:'ghost-driver',x:10,y:10,angle:0}])assert.equal(validateSceneAction(m),null);assert.equal(validatePose({...pose('x'),type:'pose',age:3}),null);assert.ok(validateSceneAction(register));});
test('names are bounded Unicode text and age is never a presence field',()=>{const {id,...p}=pose('name');assert.equal(validatePose({type:'pose',...p,name:'آرین'}).name,'آرین');assert.equal(validatePose({type:'pose',...p,name:'x'.repeat(25)}),null);assert.equal(validatePose({type:'pose',...p,name:'x\u202e'}),null);assert.equal(parseClientMessage(JSON.stringify({type:'pose',...p,age:10})),null);});
test('shared car has three passenger seats; occupied theft is denied; parked theft has one winner',async()=>{const store=createMemoryGhostStore({local:true});for(const id of ['driver','a','b','c','d']){await store.allocate(id,1000);await store.write(id,pose(id,{vehicle:id==='driver'?'car':'foot'}),1000);}assert.ok((await store.action('driver',register,1000)).ok);for(const id of ['a','b','c'])assert.ok((await store.action(id,request('join'),1001)).ok);assert.equal((await store.action('d',request('join'),1002)).reason,'full');assert.equal((await store.action('d',request('take'),1002)).reason,'occupied');assert.ok((await store.action('driver',{...register,parked:true},1003)).ok);const attempts=await Promise.all(['a','b'].map(id=>store.action(id,request('take'),1004)));assert.equal(attempts.filter(r=>r.ok).length,1);const scene=await store.scene(1005,0);assert.equal(scene.vehicles[0].owner,'a');assert.deepEqual(scene.vehicles[0].riders,[]);assert.equal((await store.action('driver',register,1005)).reason,'not_owner');await store.close();});
test('motorcycle admits exactly one passenger and disconnect releases that seat',()=>{const peers=[pose('driver',{vehicle:'motorcycle'}),pose('a'),pose('b')];let s=reduceScene(emptyScene(),peers,'driver',{...register,vehicle:'motorcycle'},1000).scene;s=reduceScene(s,peers,'a',request('join'),1001).scene;assert.equal(reduceScene(s,peers,'b',request('join'),1002).reason,'full');s=pruneScene(s,peers.filter(p=>p.id!=='a'),1003);assert.ok(reduceScene(s,peers,'b',request('join'),1004).ok);});
test('distance, floor, paused states and authority prevent remote vehicle hijacking',()=>{const peers=[pose('driver',{vehicle:'car'}),pose('near'),pose('far',{x:90}),pose('inside',{space:'home:test:0'}),pose('paused',{paused:true})],s=reduceScene(emptyScene(),peers,'driver',register,1000).scene;for(const id of ['far','inside','paused'])assert.equal(reduceScene(s,peers,id,request('join'),1001).ok,false);assert.equal(reduceScene(s,peers,'near',register,1001).ok,false);});
test('effects are capped, expire and never contain health or inventory changes',()=>{const peers=[pose('a')];let s=emptyScene();for(let i=0;i<300;i++)s=reduceScene(s,peers,'a',{type:'sceneAction',action:'effect',nonce:i,kind:'down',target:'night-npc',x:11,y:10,angle:0},1000).scene;assert.equal(s.effects.length,96);assert.ok(validScene(s,1000));assert.ok(s.effects.every(e=>e.health===undefined&&e.money===undefined));assert.equal(pruneScene(s,peers,17000).effects.length,0);});

import {packScene,unpackScene} from '../src/ghost-wire.js';
test('scene deltas reconstruct additions, removals, revision-only changes and a reset',()=>{
 const peers=[pose('driver',{vehicle:'car'})],first=reduceScene(emptyScene(),peers,'driver',register,1000).scene;
 let decoded=unpackScene(packScene(first,1000),emptyScene());assert.deepEqual(decoded,first);
 const next=reduceScene(first,peers,'driver',{type:'sceneAction',action:'effect',nonce:8,kind:'down',victim:'zombie',target:'npc',x:11,y:10,angle:0},1100).scene;
 decoded=unpackScene(packScene(next,1100,first),decoded);assert.deepEqual(decoded,next);
 const revision={...next,rev:next.rev+1};decoded=unpackScene(packScene(revision,1200,next),decoded);assert.deepEqual(decoded,revision);
 const expired=pruneScene(structuredClone(revision),peers,17000);decoded=unpackScene(packScene(expired,17000,revision),decoded);assert.deepEqual(decoded,expired);
 assert.equal(unpackScene(packScene(next,1100,first),decoded),null);
 assert.deepEqual(unpackScene(packScene(emptyScene(),18000),decoded),emptyScene());
});
