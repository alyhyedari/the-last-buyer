import test from 'node:test';
import assert from 'node:assert/strict';
import {GhostClient} from '../src/ghost-client.js';
import {GHOST_MANIFEST,makeWelcome,MAX_PEERS} from '../src/ghost-protocol.js';

const view={space:'outdoor',x:10,y:10};
const base=GHOST_MANIFEST.epochMs+1000000;
const pose=(extra={})=>({x:10,y:10,angle:0,space:'outdoor',vehicle:'foot',model:0,tone:1,paused:false,...extra});
const peer=(extra={})=>({id:'other',seq:1,...pose(),at:base,...extra});
function harness(){
 let time=0,wall=base,next=0;const timers=new Map(),sockets=[],statuses=[],welcomes=[];
 class Socket{
  constructor(url){this.url=url;this.readyState=0;this.bufferedAmount=0;this.sent=[];this.closed=0;sockets.push(this);}
  open(){this.readyState=1;this.onopen?.({});}
  send(text){assert.equal(this.readyState,1);this.sent.push(JSON.parse(text));}
  close(){this.closed++;this.readyState=3;this.onclose?.({code:1000});}
  receive(value){this.onmessage?.({data:typeof value==='string'?value:JSON.stringify(value)});}
  drop(code=1006){this.readyState=3;this.onclose?.({code});}
 }
 const client=new GhostClient({url:'/api/ghost-socket',WebSocketImpl:Socket,now:()=>time,wallNow:()=>wall+time,random:()=>.5,onStatus:s=>statuses.push(s),onWelcome:m=>welcomes.push(m),setTimeoutImpl:(fn,delay)=>{const id=++next;timers.set(id,{fn,at:time+delay});return id;},clearTimeoutImpl:id=>timers.delete(id)});
 const advance=ms=>{const end=time+ms;for(let guard=0;guard<10000;guard++){const due=[...timers.entries()].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;time=due[1].at;timers.delete(due[0]);due[1].fn();}time=end;};
 const online=()=>{client.connect();const socket=sockets.at(-1);socket.open();socket.receive(makeWelcome('self',base+time));return socket;};
 const snapshot=(peers,serverTime=base+time)=>sockets.at(-1).receive({type:'snapshot',serverTime,peers});
 return {client,sockets,statuses,welcomes,timers,advance,online,snapshot,get time(){return time;},setWall:n=>{wall=n;}};
}

test('ghost transport publishes only sanitized poses at five Hz and never mutates player state',()=>{
 const h=harness(),s=h.online(),p=Object.freeze({...pose(),money:99999,inventory:['launcher'],life:{health:100}});h.client.update(p);
 assert.equal(s.url,'ws://localhost/api/ghost-socket');let sent=s.sent.filter(p=>p.type==='pose');assert.equal(sent.length,1);assert.equal(sent[0].seq,0);assert.equal('money'in sent[0],false);assert.equal('life'in sent[0],false);
 h.advance(100);h.client.update(pose({x:11}));assert.equal(s.sent.filter(p=>p.type==='pose').length,1);
 h.advance(100);h.client.update(pose({x:12}));sent=s.sent.filter(p=>p.type==='pose');assert.equal(sent.length,2);assert.equal(sent[1].x,12);
 h.advance(900);assert.equal(s.sent.filter(p=>p.type==='pose').length,2);h.advance(150);assert.equal(s.sent.filter(p=>p.type==='pose').length,3);
 assert.equal(h.client.update(pose({x:Infinity})),false);assert.equal(p.money,99999);h.client.dispose();
});

test('compatible manifest fixes world identity and a monotonic shared clock independent of wall-clock jumps',()=>{
 const h=harness();h.online();assert.equal(h.welcomes.length,1);assert.equal(h.client.roomClock,480+1000*1.2);h.advance(1000);h.setWall(0);assert.equal(h.client.roomClock,480+1001*1.2);
 const manifest=h.client.manifest;manifest.seed=1;assert.equal(h.client.manifest.seed,GHOST_MANIFEST.seed);const status=h.client.status;status.state='bad';assert.equal(h.client.status.state,'online');h.client.dispose();
 const bad=harness();bad.client.connect();bad.sockets[0].open();bad.sockets[0].receive({...makeWelcome('self',base),seed:1});assert.equal(bad.client.status.state,'unavailable');assert.equal(bad.client.status.reason,'incompatible_world');assert.equal(bad.timers.size,0);bad.client.connect();assert.equal(bad.sockets.length,1);bad.client.dispose();
});

test('interpolation wraps angles and returns isolated render-only actors',()=>{
 const h=harness();h.online();const first=peer({angle:3.05});h.snapshot([first,peer({id:'self'})]);h.advance(200);h.snapshot([peer({seq:2,x:12,angle:-3.05,at:base+200})]);
 const actors=h.client.sample(view);assert.equal(actors.length,1);assert.equal(actors[0].kind,'playerGhost');assert.equal(actors[0].id,'ghost-other');assert.equal(actors[0].x,11);assert.ok(Math.abs(Math.abs(actors[0].angle)-Math.PI)<.001);assert.equal('health'in actors[0],false);assert.equal('animal'in actors[0],false);
 actors[0].x=300;assert.equal(h.client.sample(view)[0].x,11);assert.equal(first.x,10);h.client.dispose();
});

test('teleports and room/floor changes never interpolate through the intervening world',()=>{
 const h=harness();h.online();h.snapshot([peer()]);h.advance(200);h.snapshot([peer({seq:2,x:60,at:base+200})]);assert.equal(h.client.sample(view)[0].x,60);
 h.advance(200);h.snapshot([peer({seq:3,x:3,space:'home:rowan-7:1',at:base+400})]);assert.equal(h.client.sample(view).length,0);assert.equal(h.client.sample({space:'home:rowan-7:0',x:3,y:10}).length,0);assert.equal(h.client.sample({space:'home:rowan-7:1',x:3,y:10})[0].x,3);h.client.dispose();
});

test('packet loss permits only 250ms bounded extrapolation, then freezes, fades and expires',()=>{
 const h=harness();h.online();h.snapshot([peer()]);h.advance(200);h.snapshot([peer({seq:2,x:12,at:base+200})]);h.advance(1000);
 const frozen=h.client.sample(view)[0];assert.equal(frozen.x,14.5);h.advance(2000);const faded=h.client.sample(view)[0];assert.equal(faded.x,14.5);assert.ok(faded.opacity<frozen.opacity);h.advance(5001);assert.deepEqual(h.client.sample(view),[]);assert.equal(h.client.status.peers,0);h.client.dispose();
});

test('invalid, malicious, stale and oversized snapshots are rejected before storage',()=>{
 const h=harness(),socket=h.online();h.snapshot([peer()]);
 const invalid=[{...peer(),x:NaN},{...peer(),x:-1},{...peer(),space:'home:<script>:1'},{...peer(),model:14},{...peer(),at:base+9000},{...peer(),id:'<img src=x>'},{...peer(),money:100}];
 for(const p of invalid){h.snapshot([peer({id:'allowed',x:200}),p]);assert.equal(h.client.status.peers,1);}
 h.snapshot([peer({id:'same'}),peer({id:'same'})]);h.snapshot(Array.from({length:MAX_PEERS+1},(_,i)=>peer({id:'peer-'+i})));socket.receive('x'.repeat(20000));socket.receive('[');socket.receive({type:'snapshot',serverTime:base,peers:[],money:9});assert.equal(h.client.status.peers,1);
 h.advance(200);h.snapshot([peer({seq:2,x:11,at:base+200})]);h.snapshot([peer({seq:3,x:80,at:base+100})],base+100);h.snapshot([peer({seq:1,x:90,at:base+200})]);h.advance(100);assert.ok(h.client.sample(view)[0].x<12);h.client.dispose();
});

test('peer memory is bounded and only the nearest twenty-four ghosts are rendered',()=>{
 const h=harness();h.online();h.snapshot(Array.from({length:MAX_PEERS},(_,i)=>peer({id:'peer-'+i,x:10+i})));const actors=h.client.sample(view);assert.equal(h.client.status.peers,32);assert.equal(actors.length,24);assert.equal(actors[0].x,10);assert.equal(actors.at(-1).x,33);h.client.dispose();
});

test('ping RTT, jitter and interpolation adapt without accepting spoofed pong nonces',()=>{
 const h=harness(),socket=h.online(),first=socket.sent.find(p=>p.type==='ping');h.advance(100);socket.receive({type:'pong',nonce:first.nonce,serverTime:base+50});assert.equal(h.client.status.pingMs,100);
 h.advance(4900);const second=socket.sent.filter(p=>p.type==='ping').at(-1);h.advance(300);socket.receive({type:'pong',nonce:second.nonce,serverTime:base+5150});assert.equal(h.client.status.pingMs,300);assert.equal(h.client.status.jitterMs,40);assert.equal(h.client.interpolationMs,180);
 socket.receive({type:'pong',nonce:999,serverTime:base+5300});assert.equal(h.client.status.pingMs,300);h.advance(4700);const third=socket.sent.filter(p=>p.type==='ping').at(-1);h.advance(1200);socket.receive({type:'pong',nonce:third.nonce,serverTime:base+10600});assert.equal(h.client.interpolationMs,350);h.client.dispose();
});

test('hidden tabs announce pause, suppress rendering and use slow heartbeats without ping spam',()=>{
 const h=harness(),socket=h.online();h.client.update(pose());h.snapshot([peer()]);h.advance(200);h.client.setVisible(false);assert.equal(socket.sent.filter(p=>p.type==='pose').at(-1).paused,true);const count=socket.sent.length,pings=socket.sent.filter(p=>p.type==='ping').length;
 assert.deepEqual(h.client.sample(view),[]);for(let i=0;i<4;i++){h.advance(1000);h.client.update(pose({x:11+i}));}assert.equal(socket.sent.length,count);h.advance(1000);assert.equal(socket.sent.length,count+1);assert.equal(socket.sent.filter(p=>p.type==='ping').length,pings);h.advance(200);h.client.setVisible(true);assert.equal(socket.sent.filter(p=>p.type==='pose').at(-1).paused,false);assert.equal(h.client.sample(view).length,1);h.client.dispose();
});

test('socket backpressure drops intermediate poses instead of creating an unbounded queue',()=>{
 const h=harness(),socket=h.online();socket.bufferedAmount=20000;for(let i=0;i<50;i++){h.client.update(pose({x:i}));h.advance(20);}assert.equal(socket.sent.filter(p=>p.type==='pose').length,0);socket.bufferedAmount=0;h.client.update(pose({x:51}));assert.equal(socket.sent.filter(p=>p.type==='pose').length,1);assert.equal(socket.sent.at(-1).x,51);h.client.dispose();
});

test('connection failures and server rotation reconnect, with bounded backoff and complete disposal',()=>{
 const h=harness(),first=h.online();first.receive({type:'reconnect',retryAfter:500});assert.equal(h.client.status.state,'reconnecting');assert.equal(first.closed,1);h.advance(500);assert.equal(h.sockets.length,2);const second=h.sockets[1];second.open();second.receive(makeWelcome('new-self',base+h.time));assert.equal(h.client.status.state,'online');assert.equal(h.welcomes.length,2);
 second.drop();h.client.setVisible(false);h.advance(20000);assert.equal(h.sockets.length,2);h.client.setVisible(true);assert.equal(h.sockets.length,3);h.client.dispose();assert.equal(h.timers.size,0);h.advance(60000);h.client.connect();assert.equal(h.sockets.length,3);assert.equal(h.client.status.state,'offline');assert.deepEqual(h.client.sample(view),[]);
});

test('welcome timeout, unsupported sockets and incompatible reconnects fail safely',()=>{
 const h=harness();h.client.connect();h.sockets[0].open();h.advance(8250);assert.equal(h.client.status.reason,'welcome_timeout');h.advance(500);assert.equal(h.sockets.length,2);h.sockets[1].open();h.sockets[1].receive(makeWelcome('self',base+h.time));h.sockets[1].drop();h.advance(500);h.sockets[2].open();h.sockets[2].receive({...makeWelcome('self',base+h.time),worldVersion:'new-world'});assert.equal(h.client.status.reason,'incompatible_world');assert.equal(h.timers.size,0);h.client.dispose();
 const missing=new GhostClient({url:'/api/ghost-socket',WebSocketImpl:null});missing.connect();assert.equal(missing.status.reason,'unsupported');missing.dispose();const bad=new GhostClient({url:'javascript:alert(1)',WebSocketImpl:class{}});bad.connect();assert.equal(bad.status.reason,'invalid_url');bad.dispose();
});

test('room capacity and rejected protocol close without retry storms',()=>{
 for(const [code,reason]of [[4003,'room_full'],[4004,'incompatible_world'],[1003,'protocol_rejected'],[1008,'protocol_rejected'],[1009,'protocol_rejected']]){const h=harness(),socket=h.online();socket.drop(code);assert.equal(h.client.status.state,'unavailable');assert.equal(h.client.status.reason,reason);h.advance(60000);assert.equal(h.sockets.length,1);assert.equal(h.timers.size,0);h.client.dispose();}
});

test('authoritative room snapshots remove a closed session before showing its reconnect replacement',()=>{
 const h=harness();h.online();h.snapshot([peer({id:'old-session'})]);assert.equal(h.client.sample(view).length,1);h.advance(200);h.snapshot([peer({id:'new-session',at:base+200})]);const actors=h.client.sample(view);assert.equal(actors.length,1);assert.equal(actors[0].id,'ghost-new-session');assert.equal(actors[0].opacity,1);h.snapshot([]);assert.equal(h.client.sample(view).length,0);h.client.dispose();
});

test('the first measured pong compensates welcome latency while shared time never runs backwards',()=>{
 const h=harness(),socket=h.online(),ping=socket.sent.find(p=>p.type==='ping');h.advance(600);socket.receive({type:'pong',nonce:ping.nonce,serverTime:base+600});assert.equal(h.client.roomClock,GHOST_MANIFEST.baseMinutes+1000.9*GHOST_MANIFEST.clockRate);const before=h.client.roomClock;
 h.advance(4400);const next=socket.sent.filter(p=>p.type==='ping').at(-1);h.advance(100);socket.receive({type:'pong',nonce:next.nonce,serverTime:base+4800});assert.ok(h.client.roomClock>=before);h.client.dispose();
});

test('fresh server sessions restart pose sequence and old socket callbacks cannot replay data',()=>{
 const h=harness(),first=h.online();h.client.update(pose());h.advance(200);h.client.update(pose({x:11}));const late=first.onmessage;first.drop();h.advance(500);const second=h.sockets.at(-1);second.open();second.receive(makeWelcome('fresh',base+h.time));assert.equal(second.sent.find(p=>p.type==='pose').seq,0);
 late({data:JSON.stringify({type:'snapshot',serverTime:base+h.time,peers:[peer({id:'closed-socket',at:base+h.time})]})});assert.equal(h.client.status.peers,0);h.client.dispose();
});

test('repeated handshake failures increase retry delays without exceeding fifteen seconds',()=>{
 const h=harness();h.client.connect();const waits=[];
 for(let i=0;i<8;i++){h.sockets.at(-1).drop();const count=h.sockets.length,start=h.time;while(h.sockets.length===count)h.advance(250);waits.push(h.time-start);}
 assert.deepEqual(waits,[500,1000,2000,4000,8000,15000,15000,15000]);h.client.dispose();
});

test('disposing from a status callback cannot create a socket or invoke welcome afterward',()=>{
 const h=harness();h.client.onStatus=s=>{if(s.state==='connecting')h.client.dispose();};h.client.connect();assert.equal(h.sockets.length,0);assert.equal(h.timers.size,0);
 const other=harness();other.client.onStatus=s=>{if(s.state==='online')other.client.dispose();};other.online();assert.equal(other.welcomes.length,0);assert.equal(other.timers.size,0);assert.equal(other.client.status.state,'offline');
});

test('default timers preserve the browser Window receiver',()=>{
 const originalSet=globalThis.setTimeout,originalClear=globalThis.clearTimeout;let scheduled=false,cleared=false;
 try{globalThis.setTimeout=function(fn,ms){assert.equal(this,globalThis);scheduled=true;return 17;};globalThis.clearTimeout=function(id){assert.equal(this,globalThis);assert.equal(id,17);cleared=true;};const client=new GhostClient({url:'ws://localhost/api/ghost-socket'});const handle=client.setTimeoutImpl(()=>{},20);client.clearTimeoutImpl(handle);assert.ok(scheduled&&cleared);}
 finally{globalThis.setTimeout=originalSet;globalThis.clearTimeout=originalClear;}
});
