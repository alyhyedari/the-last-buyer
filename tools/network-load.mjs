// Isolated local load only: never send a thousand connections to an arbitrary URL.
import {fork} from 'node:child_process';
import {once} from 'node:events';
import {mkdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {WebSocket} from 'ws';
import {GhostClient} from '../src/ghost-client.js';
import {unpackSnapshot} from '../src/ghost-wire.js';
import {MAX_PEERS,MAX_ROOMS} from '../src/ghost-protocol.js';
const option=(name,fallback)=>Number(process.argv.find(a=>a.startsWith('--'+name+'='))?.split('=')[1]??fallback);
const count=option('clients',1000),duration=option('seconds',40);
assert.ok(Number.isInteger(count)&&count>=2&&count<=MAX_ROOMS*MAX_PEERS);assert.ok(duration>=15&&duration<=3600);
if(process.argv.some(a=>a.startsWith('--url=')))throw Error('This load tool only targets its own isolated local server. Use a staging load generator for public deployments.');
const child=fork(new URL('./network-load-server.mjs',import.meta.url),process.argv.includes('--dist')?['--dist']:[],{stdio:['ignore','inherit','inherit','ipc'],env:{...process.env,LOAD_NAMESPACE:'load-'+randomUUID(),LOAD_ROTATION_MS:'12000'}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const wait=async(fn,ms=30000)=>{const start=performance.now();while(!fn()){if(performance.now()-start>ms)throw Error('Timed out during load check');await sleep(100);}};
let childFailure=null,ready=null,metrics=null,serverExited=false;
child.on('message',m=>{if(m.type==='ready')ready=m;if(m.type==='stats')metrics=m;if(m.type==='error')childFailure=m.message;});
child.on('exit',()=>{serverExited=true;});child.on('error',()=>{childFailure='Could not start isolated load server';});
const clients=[],sockets=new Set(),pings=[],snapshotAges=[],failures=[],seenRooms=new Set(),idRooms=new Map();let receivedBytes=0,snapshots=0,crossRoom=0,welcomeCount=0,updates=null,poseTick=0,phase='ramp',maxSnapshotPeers=0,minimumOnline=count;
try{
 await wait(()=>ready||childFailure||serverExited,10000);assert.ok(ready,childFailure||'Load server stopped');
 const origin='http://127.0.0.1:'+ready.port,url=origin.replace('http:','ws:')+'/api/ghost-socket';
 class BrowserSocket extends WebSocket{constructor(address){super(address,{origin});sockets.add(this);let shard=null;this.on('close',()=>sockets.delete(this));this.on('message',data=>{receivedBytes+=data.length;const m=unpackSnapshot(JSON.parse(data));if(m.type==='welcome'){shard=m.shard;idRooms.set(m.id,shard);seenRooms.add(shard);welcomeCount++;}if(m.type==='snapshot'){snapshots++;maxSnapshotPeers=Math.max(maxSnapshotPeers,m.peers.length);if(phase==='steady')snapshotAges.push(Math.max(0,Date.now()-m.serverTime));for(const p of m.peers)if(idRooms.has(p.id)&&idRooms.get(p.id)!==shard)crossRoom++;}});}}
 for(let i=0;i<count;i++){const c=new GhostClient({url,WebSocketImpl:BrowserSocket,onStatus:s=>{if(s.state==='unavailable')failures.push({client:i,reason:s.reason});if(s.state==='online'&&s.pingMs!==null&&phase==='steady')pings.push(s.pingMs);}});clients.push(c);c.connect();c.update({x:100+i%16,y:200+Math.floor(i/16)%16,angle:0,space:'outdoor',vehicle:'car',model:10,tone:i%4,paused:false});if(i%25===24)await sleep(100);}
 await wait(()=>clients.every(c=>c.status.state==='online')||failures.length,60000);assert.equal(failures.length,0);assert.equal(clients.filter(c=>c.status.state==='online').length,count);
 console.log('Connected '+count+' real GhostClients across '+seenRooms.size+' rooms; testing movement and periodic reconnects.');
 phase='steady';const started=performance.now();updates=setInterval(()=>{poseTick++;for(let i=0;i<clients.length;i++)clients[i].update({x:100+i%16+Math.sin(poseTick*.1)*2,y:200+Math.floor(i/16)%16,angle:poseTick*.02,space:i%8===0?'home:coast-tower-0:1':'outdoor',vehicle:'car',model:10,tone:i%4,paused:false});},200);
 while(performance.now()-started<duration*1000){await sleep(1000);minimumOnline=Math.min(minimumOnline,clients.filter(c=>c.status.state==='online').length);if(childFailure)throw Error(childFailure);if(Math.floor((performance.now()-started)/1000)%10===0)console.log('Load '+Math.round((performance.now()-started)/1000)+'s: '+clients.filter(c=>c.status.state==='online').length+' online; '+welcomeCount+' sessions including reconnects.');}
 clearInterval(updates);updates=null;await wait(()=>clients.every(c=>c.status.state==='online'),10000);child.send('stats');await wait(()=>metrics);
 assert.equal(failures.length,0);assert.equal(crossRoom,0);assert.ok(maxSnapshotPeers<=MAX_PEERS);assert.ok(metrics.occupancy.every(n=>n<=MAX_PEERS));assert.equal(metrics.occupancy.reduce((a,b)=>a+b,0),count);assert.ok(welcomeCount>count,'Periodic reconnect did not run');assert.ok(pings.length>0);
 const pct=(values,p)=>{const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))]??null;};
 const statsBefore=metrics;phase='cleanup';clients.forEach(c=>c.dispose());await sleep(2000);metrics=null;child.send('stats');await wait(()=>metrics);assert.equal(metrics.connections,0);assert.equal(metrics.occupancy.reduce((a,b)=>a+b,0),0);
 const report={ok:true,scope:ready.store==='redis'?'local loopback, Redis, separate server process':'local loopback, in-memory store, separate server process',clients:count,seconds:duration,rooms:seenRooms.size,maxRoomPopulation:Math.max(...statsBefore.occupancy),maxSnapshotPeers,crossRoomLeaks:crossRoom,terminalFailures:failures.length,sessions:welcomeCount,minimumOnlineDuringRotation:minimumOnline,pingMs:{p50:pct(pings,.5),p95:pct(pings,.95),p99:pct(pings,.99)},snapshotAgeMs:{p95:pct(snapshotAges,.95),p99:pct(snapshotAges,.99)},receivedMiB:receivedBytes/1048576,snapshots,server:statsBefore,cleanup:{connections:metrics.connections,occupancy:metrics.occupancy.reduce((a,b)=>a+b,0)},limitations:['No public Internet, TLS, Vercel instance recycling or real-player rendering test','Memory mode does not validate Redis Lua, durability or cross-process admission']};
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/network-load-'+count+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{clearInterval(updates);clients.forEach(c=>c.dispose());for(const socket of sockets)socket.terminate();if(!serverExited){const exited=once(child,'exit');child.send('stop');const timer=setTimeout(()=>child.kill(),5000);await exited;clearTimeout(timer);}}
