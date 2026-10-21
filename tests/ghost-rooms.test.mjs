import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createMemoryGhostStore} from '../server/ghost-store.js';
import {createGhostHub} from '../server/ghost-hub.js';
import {MAX_PEERS,MAX_ROOMS,PRESENCE_TTL,makeWelcome} from '../src/ghost-protocol.js';
import {packSnapshot,unpackSnapshot} from '../src/ghost-wire.js';
const pose={seq:1,x:100,y:200,angle:0,space:'outdoor',vehicle:'foot',model:0,tone:0,paused:false};
class Socket extends EventEmitter{constructor(){super();this.readyState=1;this.bufferedAmount=0;this.messages=[];}send(raw){this.messages.push(unpackSnapshot(JSON.parse(raw)));}close(code){if(this.readyState!==1)return;this.code=code;this.readyState=3;this.emit('close');}}
test('atomic local matchmaking holds 1024 reservations across 32 rooms and releases capacity',async()=>{
 const store=createMemoryGhostStore({local:true});const assigned=await Promise.all(Array.from({length:1024},(_,i)=>store.allocate('p'+i,1000)));
 assert.equal(assigned.length,MAX_PEERS*MAX_ROOMS);assert.deepEqual(await store.occupancy(1000),Array(MAX_ROOMS).fill(MAX_PEERS));assert.equal(await store.allocate('overflow',1000),-1);assert.equal(await store.allocate('p1',1000),-1);
 await store.remove('p50');assert.equal(await store.allocate('replacement',1001,1),1);assert.equal(await store.write('replacement',pose,1002),true);assert.equal((await store.peers(1002,1)).length,1);assert.equal((await store.peers(1002,0)).length,0);
 assert.equal((await store.occupancy(1003+PRESENCE_TTL)).reduce((a,b)=>a+b,0),0);await store.close();
});
test('separate hubs route snapshots only to assigned rooms and reuse bounded room packets',async()=>{
 const store=createMemoryGhostStore({local:true}),a=createGhostHub(store),b=createGhostHub(store),sockets=[];
 try{for(let i=0;i<34;i++){const s=new Socket();sockets.push(s);await (i%2?a:b).attach(s);s.emit('message',Buffer.from(JSON.stringify({type:'pose',...pose,x:100+i})),false);}await new Promise(r=>setTimeout(r,240));await Promise.all([a.tick(),b.tick()]);
 const ids=new Map(sockets.map(s=>{const w=s.messages.find(m=>m.type==='welcome');return[w.id,w.shard];}));assert.equal(new Set(ids.values()).size,2);
 for(const s of sockets){const w=s.messages.find(m=>m.type==='welcome'),snap=s.messages.filter(m=>m.type==='snapshot').at(-1);assert.ok(snap);assert.ok(snap.peers.length<=32);for(const p of snap.peers)assert.equal(ids.get(p.id),w.shard);}
 }finally{await Promise.all([a.close(),b.close()]);await store.close();}
});
test('preferred room survives reconnect, full preference falls back, and welcome stays bounded',async()=>{
 const store=createMemoryGhostStore({local:true});assert.equal(await store.allocate('first',1000,7),7);await store.remove('first');assert.equal(await store.allocate('again',1001,7),7);
 for(let i=1;i<MAX_PEERS;i++)assert.equal(await store.reserve('full'+i,1001,7),true);assert.equal(await store.allocate('overflow-preference',1001,7),0);assert.equal(makeWelcome('id',1001,7).shard,7);await store.close();
});
test('a slow socket is disconnected without preventing a healthy peer snapshot',async()=>{
 const store=createMemoryGhostStore({local:true}),hub=createGhostHub(store),slow=new Socket(),fast=new Socket();
 try{await hub.attach(slow);await hub.attach(fast);slow.bufferedAmount=200000;fast.emit('message',Buffer.from(JSON.stringify({type:'pose',...pose})),false);await new Promise(r=>setTimeout(r,240));await hub.tick();assert.equal(slow.code,1013);assert.ok(fast.messages.some(m=>m.type==='snapshot'));assert.equal(hub.stats().slowClosed,1);}finally{await hub.close();await store.close();}
});
test('compact frames preserve poses and reject malformed tuple fields',()=>{
 const peers=[{id:'a',...pose,at:1000},{id:'b',...pose,space:'home:house:2',vehicle:'car',paused:true,at:990}],frame=packSnapshot(peers,1000);
 assert.deepEqual(unpackSnapshot(frame),{type:'snapshot',serverTime:1000,peers});assert.ok(JSON.stringify(frame).length<JSON.stringify({type:'snapshot',serverTime:1000,peers}).length*.65);
 for(const [index,value]of [[6,99],[6,1.5],[9,2],[10,-40000]]){const bad=structuredClone(frame);bad.peers[0][index]=value;assert.equal(unpackSnapshot(bad),null);}
 assert.equal(unpackSnapshot({...frame,admin:true}),null);assert.equal(unpackSnapshot({...frame,peers:Array(33).fill(frame.peers[0])}),null);
});
