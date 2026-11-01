import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createMemoryGhostStore} from '../server/ghost-store.js';
import {createGhostHub} from '../server/ghost-hub.js';
import {MAX_PEERS,MAX_ROOMS,PRESENCE_TTL,makeWelcome} from '../src/ghost-protocol.js';
import {packSnapshot,unpackSnapshot} from '../src/ghost-wire.js';
const pose={seq:1,x:100,y:200,angle:0,space:'outdoor',vehicle:'foot',model:0,tone:0,paused:false};
class Socket extends EventEmitter{constructor(){super();this.readyState=1;this.bufferedAmount=0;this.messages=[];}send(raw){this.messages.push(unpackSnapshot(JSON.parse(raw)));}close(code){if(this.readyState!==1)return;this.code=code;this.readyState=3;this.emit('close');}}
test('five global reservations reject concurrent overflow and release exactly one place',async()=>{
 const store=createMemoryGhostStore({local:true});assert.equal(MAX_PEERS,5);assert.equal(MAX_ROOMS,1);
 const assigned=await Promise.all(Array.from({length:30},(_,i)=>store.allocate('p'+i,1000)));
 assert.equal(assigned.filter(r=>r===0).length,5);assert.equal(assigned.filter(r=>r===-1).length,25);assert.deepEqual(await store.occupancy(1000),[5]);
 assert.equal(await store.allocate('p1',1000),-1);await store.remove('p0');
 assert.equal(await store.allocate('replacement',1001),0);assert.equal(await store.allocate('overflow',1001),-1);
 assert.equal(await store.write('replacement',pose,1002),true);assert.equal((await store.peers(1002,0)).length,1);
 assert.deepEqual(await store.occupancy(1003+PRESENCE_TTL),[0]);await store.close();
});
test('concurrent admissions across two hubs never exceed five and overflow is terminal',async()=>{
 const store=createMemoryGhostStore({local:true}),a=createGhostHub(store),b=createGhostHub(store),sockets=Array.from({length:20},()=>new Socket());
 try{await Promise.all(sockets.map((s,i)=>(i%2?a:b).attach(s)));
 const accepted=sockets.filter(s=>s.messages.some(m=>m.type==='welcome'));assert.equal(accepted.length,5);assert.deepEqual(await store.occupancy(Date.now()),[5]);
 for(const s of sockets.filter(s=>!accepted.includes(s)))assert.equal(s.code,4003);
 for(const s of accepted)s.emit('message',Buffer.from(JSON.stringify({type:'pose',...pose})),false);
 await new Promise(r=>setTimeout(r,240));await Promise.all([a.tick(),b.tick()]);
 for(const s of accepted){const snap=s.messages.filter(m=>m.type==='snapshot').at(-1);assert.equal(snap.peers.length,5);assert.equal(s.messages.find(m=>m.type==='welcome').shard,0);}
 accepted[0].close(1000);const replacement=new Socket();await b.attach(replacement);assert.ok(replacement.messages.some(m=>m.type==='welcome'));assert.deepEqual(await store.occupancy(Date.now()),[5]);
 }finally{await Promise.all([a.close(),b.close()]);await store.close();}
});
test('invalid room preferences cannot create extra rooms and expired leases free capacity',async()=>{
 const store=createMemoryGhostStore({local:true});assert.equal(await store.reserve('invalid',1000,1),false);
 for(let i=0;i<5;i++)assert.equal(await store.allocate('p'+i,1000,4),0);
 assert.equal(await store.allocate('overflow',1001,999),-1);assert.equal(await store.allocate('expired-replacement',1001+PRESENCE_TTL,0),0);await store.close();
});
test('a slow socket is disconnected without preventing a healthy peer snapshot',async()=>{
 const store=createMemoryGhostStore({local:true}),hub=createGhostHub(store),slow=new Socket(),fast=new Socket();
 try{await hub.attach(slow);await hub.attach(fast);slow.bufferedAmount=200000;fast.emit('message',Buffer.from(JSON.stringify({type:'pose',...pose})),false);await new Promise(r=>setTimeout(r,240));await hub.tick();assert.equal(slow.code,1013);assert.ok(fast.messages.some(m=>m.type==='snapshot'));assert.equal(hub.stats().slowClosed,1);}finally{await hub.close();await store.close();}
});
test('compact frames preserve poses and reject malformed tuple fields',()=>{
 const peers=[{id:'a',...pose,at:1000},{id:'b',...pose,space:'home:house:2',vehicle:'car',paused:true,at:990}],frame=packSnapshot(peers,1000);
 assert.deepEqual(unpackSnapshot(frame),{type:'snapshot',serverTime:1000,peers});assert.ok(JSON.stringify(frame).length<JSON.stringify({type:'snapshot',serverTime:1000,peers}).length*.65);
 for(const [index,value]of [[6,99],[6,1.5],[9,2],[10,-40000]]){const bad=structuredClone(frame);bad.peers[0][index]=value;assert.equal(unpackSnapshot(bad),null);}
 assert.equal(unpackSnapshot({...frame,admin:true}),null);assert.equal(unpackSnapshot({...frame,peers:Array(MAX_PEERS+1).fill(frame.peers[0])}),null);
});
