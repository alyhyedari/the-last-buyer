import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createNetworkGovernor} from '../server/ghost-tuning.js';
import {createGhostHub} from '../server/ghost-hub.js';
import {createMemoryGhostStore} from '../server/ghost-store.js';
import {installGameSurface} from '../src/game-surface.js';
const settle=()=>new Promise(r=>setImmediate(r));
class Socket extends EventEmitter{readyState=1;bufferedAmount=0;sent=[];pings=[];send(raw){this.sent.push(JSON.parse(raw));}ping(token){this.pings.push(token);}close(code,reason){this.code=code;this.reason=reason;this.readyState=3;this.emit('close');}terminate(){this.close(1006,'terminated');}}
const pose={seq:1,x:10,y:10,angle:0,vehicle:'foot',model:0,tone:0,space:'outdoor',paused:false};
test('adaptive cadence tolerates one spike, reduces sustained load and recovers gradually',()=>{
 const g=createNetworkGovernor();g.observe({now:0,workMs:400});assert.equal(g.interval,200);
 for(let now=200;now<=2400;now+=200)g.observe({now,workMs:150});assert.equal(g.interval,600);
 for(let now=2600;now<=12600;now+=200)g.observe({now,workMs:5});assert.equal(g.interval,400);
 for(let now=12800;now<=22600;now+=200)g.observe({now,workMs:5});assert.equal(g.interval,200);
 for(let now=23000;now<=24800;now+=200)g.observe({now,workMs:5,pressure:.3});assert.equal(g.mode,'balanced');
});
test('server probes WebSocket latency, ignores unrelated pong and closes an unresponsive transport',async()=>{
 let time=10000;const store=createMemoryGhostStore({local:true}),hub=createGhostHub(store,{now:()=>time}),s=new Socket();
 try{await hub.attach(s);await settle();while(!s.pings.length){time+=1000;s.emit('message',Buffer.from('{"type":"ping","nonce":1}'),false);await hub.tick();}assert.equal(s.pings.length,1);
 time+=80;s.emit('pong',Buffer.from('wrong'));assert.equal(hub.stats().serverPongs,0);s.emit('pong',Buffer.from(s.pings[0]));assert.equal(hub.stats().serverPongs,1);assert.equal(s.sent.filter(m=>m.type==='network').at(-1).serverPingMs,80);
 while(s.pings.length<2){time+=1000;s.emit('message',Buffer.from('{"type":"ping","nonce":2}'),false);await hub.tick();}assert.equal(s.pings.length,2);time+=10001;s.emit('message',Buffer.from('{"type":"ping","nonce":3}'),false);await hub.tick();assert.equal(s.readyState,3);
 }finally{await hub.close();await store.close();}
});
test('backpressure skips old frames and recovers with a complete scene base',async()=>{
 let time=10000;const store=createMemoryGhostStore({local:true}),hub=createGhostHub(store,{now:()=>time}),s=new Socket();s.ping=undefined;
 try{const id=await hub.attach(s);await settle();await store.write(id,pose,time);time+=600;await hub.tick();const before=s.sent.length;
 s.bufferedAmount=40000;time+=600;await store.action(id,{action:'effect',nonce:1,kind:'down',victim:'zombie',target:'npc',x:11,y:10,angle:0},time);await hub.tick();assert.equal(s.sent.length,before);assert.ok(hub.stats().skippedFrames>=2);assert.equal(s.readyState,1);
 s.bufferedAmount=0;time+=600;await hub.tick();const full=s.sent.filter(m=>m.type==='sceneDelta').at(-1);assert.equal(full.base,null);assert.equal(full.effects.length,1);
 s.bufferedAmount=140000;time+=600;await store.write(id,{...pose,seq:2},time);await hub.tick();assert.equal(s.code,1013);
 }finally{await hub.close();await store.close();}
});
test('game surface blocks copy/callouts without breaking input editing or touch events',()=>{
 const doc=new EventTarget(),dispose=installGameSurface(doc);assert.equal(installGameSurface(doc),dispose);
 const dispatch=(type,extra={})=>{const event=new Event(type,{cancelable:true});for(const [key,value]of Object.entries(extra))Object.defineProperty(event,key,{value});doc.dispatchEvent(event);return event.defaultPrevented;};
 for(const type of ['copy','cut','contextmenu','dragstart','selectstart'])assert.equal(dispatch(type),true);
 assert.equal(dispatch('pointerdown'),false);assert.equal(dispatch('selectstart',{target:{closest:()=>({})}}),false);
 assert.equal(dispatch('keydown',{key:'a',ctrlKey:true}),true);assert.equal(dispatch('keydown',{key:'a',ctrlKey:true,target:{closest:()=>({})}}),false);
 dispose();assert.equal(dispatch('copy'),false);
});
