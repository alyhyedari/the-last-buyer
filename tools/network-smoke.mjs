import {WebSocket} from 'ws';
import {GhostClient} from '../src/ghost-client.js';
import {createNetworkServer} from '../server/network-server.mjs';
import {once} from 'node:events';
import assert from 'node:assert/strict';
const target=process.argv.find(x=>x.startsWith('--url='))?.slice(6);let app;
if(!target){app=await createNetworkServer({local:true,production:process.argv.includes('--dist')});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');}
const origin=target||'http://127.0.0.1:'+app.server.address().port,url=new URL('/api/ghost-socket',origin);url.protocol=url.protocol==='https:'?'wss:':'ws:';
class BrowserSocket extends WebSocket{constructor(address){super(address,{origin:new URL(origin).origin});}}
const clients=[0,1].map(()=>new GhostClient({url:url.href,WebSocketImpl:BrowserSocket}));
const wait=async(predicate,limit=10000)=>{const start=Date.now();while(!predicate()){if(Date.now()-start>limit)throw Error('Timed out waiting for live network state');await new Promise(r=>setTimeout(r,50));}};
try{
 const home=await fetch(origin),health=await fetch(new URL('/healthz',origin)),room=await fetch(new URL('/api/ghost-room',origin));assert.equal(home.status,200);assert.equal(health.status,200);assert.equal((await room.json()).enabled,true);
 clients.forEach(c=>c.connect());await wait(()=>clients.every(c=>c.status.state==='online'));
 clients.forEach((c,i)=>c.update({x:420+i*2,y:176,angle:0,space:'outdoor',vehicle:'car',model:10,tone:i,paused:false}));await wait(()=>clients.every(c=>c.status.peers===1&&c.status.pingMs!==null));
 assert.equal(clients[0].sample({space:'outdoor',x:420,y:176}).length,1);
 clients[1].update({x:10,y:17,angle:0,space:'home:coast-tower-0:1',vehicle:'foot',model:10,tone:1,paused:false});await wait(()=>clients[0].sample({space:'outdoor',x:420,y:176}).length===0);
 clients[1].dispose();await wait(()=>clients[0].status.peers===0);
 console.log(JSON.stringify({ok:true,checks:['home','health','room','two-live-clients','shared-poses','ping','floor-isolation','disconnect-cleanup'],pingMs:clients[0].status.pingMs,scope:target?'specified-server':'local-loopback'},null,2));
}finally{clients.forEach(c=>c.dispose());await app?.close();}
