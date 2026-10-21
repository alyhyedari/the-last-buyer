import test from 'node:test';
import assert from 'node:assert/strict';
import {once,EventEmitter} from 'node:events';
import {WebSocket} from 'ws';
import {GHOST_MANIFEST,MAX_PEERS,PRESENCE_TTL,parseClientMessage,validatePose,makeWelcome,sharedWorldMinutes} from '../src/ghost-protocol.js';
import {createMemoryGhostStore,createRedisGhostStore} from '../server/ghost-store.js';
import {allowedGhostOrigin,createRateGate} from '../server/ghost-security.js';
import {createGhostHttpServer,ghostRoomResponse} from '../server/ghost-http.js';
import {createGhostHub} from '../server/ghost-hub.js';
import {unpackSnapshot} from '../src/ghost-wire.js';

const pose=(changes={})=>({type:'pose',seq:1,x:74.5,y:194.5,angle:0,space:'outdoor',vehicle:'car',model:4,tone:2,paused:false,...changes});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function fixture(t,options={}){
 const store=createMemoryGhostStore({local:true}),server=createGhostHttpServer({getStore:async()=>store,local:true,matchmaking:false,...options}),clients=[];
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const origin='http://127.0.0.1:'+server.address().port,url=origin.replace('http:','ws:')+'/api/ghost-socket';
 function connect(overrideOrigin=origin){
  const socket=new WebSocket(url,{origin:overrideOrigin}),messages=[],waiting=[];
  clients.push(socket);socket.on('error',()=>{});
  socket.on('message',data=>{const value=unpackSnapshot(JSON.parse(data.toString()));messages.push(value);for(const waiter of [...waiting])if(waiter.predicate(value)){clearTimeout(waiter.timer);waiting.splice(waiting.indexOf(waiter),1);waiter.resolve(value);}});
  const closed=new Promise(resolve=>socket.once('close',(code,reason)=>resolve({code,reason:reason.toString()})));
  function wait(predicate,timeout=2500){
   const existing=messages.find(predicate);if(existing)return Promise.resolve(existing);
   return new Promise((resolve,reject)=>{const waiter={predicate,resolve,timer:null};waiter.timer=setTimeout(()=>{waiting.splice(waiting.indexOf(waiter),1);reject(Error('Timed out waiting for ghost message'));},timeout);waiting.push(waiter);});
  }
  return {socket,wait,closed,messages,send:value=>socket.send(JSON.stringify(value))};
 }
 t.after(async()=>{for(const socket of clients)socket.terminate();await new Promise(resolve=>server.close(resolve));await store.close();});
 return {store,server,origin,url,connect};
}

test('ghost protocol accepts only bounded poses and never authority over gameplay',()=>{
 assert.deepEqual(validatePose(pose()),{seq:1,x:74.5,y:194.5,angle:0,space:'outdoor',vehicle:'car',model:4,tone:2,paused:false});
 for(const changes of [{money:999},{seed:1},{damage:10},{id:'someone-else'},{x:Infinity},{x:-1},{y:513},{seq:-1},{seq:2**31},{model:14},{tone:4},{space:'home:../secret:0'},{space:'home:cabin:100'},{vehicle:'tank'},{paused:1}])assert.equal(validatePose(pose(changes)),null,JSON.stringify(changes));
 assert.equal(validatePose(pose({space:'home:aurora_2:12',angle:Math.PI*5})).space,'home:aurora_2:12');
 assert.ok(Math.abs(validatePose(pose({angle:Math.PI*5})).angle)<=Math.PI+.0001);
 for(const raw of ['null','[]','{}','{"type":"shoot"}','x'.repeat(2049),'not-json','{"type":"ping","nonce":-1}','{"type":"ping","nonce":1,"save":{}}'])assert.equal(parseClientMessage(raw),null);
 assert.deepEqual(parseClientMessage('{"type":"ping","nonce":7}'),{type:'ping',nonce:7});
 assert.deepEqual(parseClientMessage('{"type":"bye"}'),{type:'bye'});
});

test('shared room has a fixed world seed and server anchored clock',()=>{
 const welcome=makeWelcome('server-id',GHOST_MANIFEST.epochMs+10000);
 assert.equal(welcome.seed,20261018);assert.equal(welcome.room,'afterlight');assert.equal(welcome.worldVersion,'coast-1');assert.equal(welcome.maxPeers,32);
 assert.equal(sharedWorldMinutes(welcome.serverTime),492);assert.equal(sharedWorldMinutes(GHOST_MANIFEST.epochMs-1000),480);
 assert.equal(welcome.type,'welcome');assert.equal(welcome.id,'server-id');
});

test('origin checks reject cross site, missing and insecure production origins',()=>{
 assert.ok(allowedGhostOrigin('https://game.example','game.example'));
 assert.ok(allowedGhostOrigin('http://localhost:4178','localhost:4178',{local:true}));
 for(const origin of [undefined,'null','https://evil.example','https://game.example.evil','http://game.example','https://u:p@game.example','https://game.example/path'])assert.equal(allowedGhostOrigin(origin,'game.example'),false,String(origin));
});

test('rate gate bounds floods while allowing steady movement updates',()=>{
 const gate=createRateGate({rate:5,burst:3,now:1000});
 assert.ok(gate(1000));assert.ok(gate(1000));assert.ok(gate(1000));assert.equal(gate(1000),false);
 assert.equal(gate(1100),false);assert.ok(gate(1200));assert.equal(gate(1200),false);assert.ok(gate(10000));
});

test('memory store is explicitly local, bounded, expiring and returns isolated poses',async()=>{
 assert.throws(()=>createMemoryGhostStore(),/local development/);
 await assert.rejects(createRedisGhostStore('https://not-a-redis-service'),/REDIS_URL/);
 const store=createMemoryGhostStore({local:true});let changes=0;const unsubscribe=store.subscribe(()=>changes++);
 for(let i=0;i<MAX_PEERS;i++)assert.equal(await store.reserve('id'+i,1000),true);
 assert.equal(await store.reserve('overflow',1000),false);assert.equal(await store.reserve('id1',1000),false);
 assert.equal(await store.write('id1',validatePose(pose()),1001),true);
 let peers=await store.peers(1002);assert.equal(peers.length,1);peers[0].x=999;assert.equal((await store.peers(1003))[0].x,74.5);
 assert.equal(await store.write('missing',validatePose(pose()),1003),false);
 assert.equal(await store.touch('id1',10000),true);
 assert.equal((await store.peers(1001+PRESENCE_TTL)).length,1);
 assert.equal(await store.reserve('new',17000),true);
 assert.equal((await store.peers(25001)).length,0);
 assert.equal(await store.touch('id1',25001),false);
 assert.ok(changes>=33);unsubscribe();await store.close();
});

test('production room advertises unavailable without credentials or memory fallback',async()=>{
 const missing=await ghostRoomResponse(async()=>null,{now:42});assert.equal(missing.status,503);assert.equal(missing.body.enabled,false);assert.equal(missing.body.reason,'not_configured');
 const failure=await ghostRoomResponse(async()=>{throw Error('redis://secret:password@private');});assert.equal(failure.status,503);assert.equal(failure.body.reason,'unavailable');assert.equal(JSON.stringify(failure).includes('password'),false);
 const unhealthy=await ghostRoomResponse(async()=>({healthy:()=>false}));assert.equal(unhealthy.body.reason,'unavailable');
});

test('silent connections expire instead of indefinitely extending abandoned ghosts',async()=>{
 let time=10000;const store=createMemoryGhostStore({local:true}),hub=createGhostHub(store,{now:()=>time});
 class Socket extends EventEmitter{readyState=1;bufferedAmount=0;sent=[];send(raw){this.sent.push(JSON.parse(raw));}close(code,reason){this.code=code;this.reason=reason;this.readyState=3;this.emit('close');}}
 const socket=new Socket();await hub.attach(socket);socket.emit('message',Buffer.from(JSON.stringify(pose())),false);await delay(0);
 assert.equal((await store.peers(time)).length,1);
 time+=16000;await hub.tick();assert.equal(socket.code,1001);assert.equal(socket.reason,'heartbeat timeout');assert.equal((await store.peers(time)).length,0);
 await hub.close();await store.close();
});

test('two real websocket players share poses, server identities and ping with no game state',async t=>{
 const f=await fixture(t),a=f.connect(),b=f.connect();
 const [wa,wb]=await Promise.all([a.wait(m=>m.type==='welcome'),b.wait(m=>m.type==='welcome')]);
 assert.notEqual(wa.id,wb.id);assert.equal(wa.seed,wb.seed);assert.equal(wa.epochMs,wb.epochMs);
 a.send(pose());b.send(pose({seq:3,x:78.25,vehicle:'bike',paused:true}));
 const snapshot=await a.wait(m=>m.type==='snapshot'&&m.peers.some(p=>p.id===wb.id&&p.seq===3));
 const peer=snapshot.peers.find(p=>p.id===wb.id);assert.equal(peer.x,78.25);assert.equal(peer.paused,true);assert.equal(peer.vehicle,'bike');assert.equal(peer.money,undefined);assert.equal(peer.health,undefined);
 const nonce=Date.now();a.send({type:'ping',nonce});const pong=await a.wait(m=>m.type==='pong'&&m.nonce===nonce);assert.ok(pong.serverTime>=nonce);
 b.send(pose({seq:2,x:999}));assert.equal((await b.closed).code,1008);
 await a.wait(m=>m.type==='snapshot'&&!m.peers.some(p=>p.id===wb.id)&&m.peers.some(p=>p.id===wa.id));
 const response=await fetch(f.origin+'/api/ghost-room');assert.equal(response.status,200);assert.equal((await response.json()).socket,'/api/ghost-socket');assert.equal(response.headers.get('cache-control'),'no-store');
});

test('stale pose sequences cannot rewind another player and bye releases occupancy',async t=>{
 const f=await fixture(t),a=f.connect();const welcome=await a.wait(m=>m.type==='welcome');
 a.send(pose({seq:4,x:100}));await a.wait(m=>m.type==='snapshot'&&m.peers.some(p=>p.id===welcome.id&&p.seq===4));
 a.send(pose({seq:3,x:10}));a.send({type:'ping',nonce:11});await a.wait(m=>m.type==='pong'&&m.nonce===11);
 assert.equal((await f.store.peers(Date.now()))[0].x,100);
 a.send({type:'bye'});assert.equal((await a.closed).code,1000);await delay(20);assert.equal((await f.store.peers(Date.now())).length,0);
});

test('separate server hubs share presence through the store instead of isolated process rooms',async t=>{
 const shared=createMemoryGhostStore({local:true}),getStore=async()=>shared;
 const first=await fixture(t,{getStore}),second=await fixture(t,{getStore});
 const a=first.connect(),b=second.connect(),[wa,wb]=await Promise.all([a.wait(m=>m.type==='welcome'),b.wait(m=>m.type==='welcome')]);
 a.send(pose({x:20}));b.send(pose({x:30}));
 const seenA=await a.wait(m=>m.type==='snapshot'&&m.peers.some(p=>p.id===wb.id));
 const seenB=await b.wait(m=>m.type==='snapshot'&&m.peers.some(p=>p.id===wa.id));
 assert.equal(seenA.peers.find(p=>p.id===wb.id).x,30);assert.equal(seenB.peers.find(p=>p.id===wa.id).x,20);
 t.after(()=>shared.close());
});

test('websocket origin, payload, binary and message flood protections are enforced',async t=>{
 const f=await fixture(t),bad=f.connect('https://evil.example');
 const rejected=await new Promise(resolve=>bad.socket.once('unexpected-response',(_,res)=>{res.resume();resolve(res.statusCode);}));assert.equal(rejected,403);bad.socket.terminate();
 const hostile=await fetch(f.origin+'/api/ghost-room',{headers:{Origin:'https://evil.example'}});assert.equal(hostile.status,403);
 const binary=f.connect();await binary.wait(m=>m.type==='welcome');binary.socket.send(Buffer.from('binary'));assert.equal((await binary.closed).code,1003);
 const large=f.connect();await large.wait(m=>m.type==='welcome');large.socket.send('x'.repeat(4096));assert.equal((await large.closed).code,1009);
 const flood=f.connect();await flood.wait(m=>m.type==='welcome');for(let i=0;i<50;i++)flood.send({type:'ping',nonce:i});assert.equal((await flood.closed).code,1008);
});

test('room limit is shared by reservations and function rotation is reconnectable',async t=>{
 const f=await fixture(t,{rotationMs:150});
 for(let i=0;i<MAX_PEERS-1;i++)await f.store.reserve('occupied'+i,Date.now());
 const a=f.connect();const welcome=await a.wait(m=>m.type==='welcome');const overflow=f.connect();assert.equal((await overflow.closed).code,4003);
 const retry=(await a.wait(m=>m.type==='reconnect')).retryAfter;assert.ok(retry>=500&&retry<1500);assert.equal((await a.closed).code,1012);
 await delay(20);const next=f.connect();const resumed=await next.wait(m=>m.type==='welcome');assert.notEqual(resumed.id,welcome.id);assert.equal(resumed.seed,welcome.seed);assert.equal(resumed.epochMs,welcome.epochMs);
});
