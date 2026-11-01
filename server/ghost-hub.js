import {randomBytes} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {createNetworkGovernor} from './ghost-tuning.js';
import {packSnapshot,packScene} from '../src/ghost-wire.js';
import {parseClientMessage,makeWelcome,MAX_PAYLOAD,MAX_PEERS,MAX_ROOMS} from '../src/ghost-protocol.js';
import {createRateGate} from './ghost-security.js';

// A hub owns this function instance's sockets only. Redis owns global occupancy
// and pub/sub marks every instance dirty, so a cold start is never a new room.
export function createGhostHub(store,{now=Date.now,rotationMs=240000,snapshotMs=200,matchmaking=true}={}){
 const clients=new Map(),dirty=new Set(),lastSnapshot=new Map(),lastScene=new Map(),sceneBases=new Map();let ticking=false,timer=null,lastTouch=0,lastTick=null;const governor=createNetworkGovernor(snapshotMs);
 const metrics={accepted:0,closed:0,roomFull:0,slowClosed:0,rateRejected:0,bytesSent:0,snapshots:0,peakConnections:0,skippedFrames:0,serverPings:0,serverPongs:0};
 const unsubscribe=store.subscribe(room=>{if(Number.isInteger(room))dirty.add(room);else for(const row of clients.values())dirty.add(row.shard);});
 const encode=data=>{const wire=JSON.stringify(data);return {wire,bytes:Buffer.byteLength(wire)};};
 const send=(socket,data,volatile=false)=>{
  if(socket.readyState!==1)return false;
  if(socket.bufferedAmount>131072){metrics.slowClosed++;socket.close(1013,'slow connection');return false;}
  if(volatile&&socket.bufferedAmount>32768){metrics.skippedFrames++;return false;}
  const packet=data.wire!==undefined?data:encode(data);
  try{socket.send(packet.wire);metrics.bytesSent+=packet.bytes;return true;}catch{socket.close(1013,'send failed');return false;}
 };
 const fail=socket=>{if(socket.readyState<2)socket.close(1013,'presence unavailable');};
 function heartbeat(row,time){
  if(typeof row.socket.ping!=='function')return;
  if(row.pingToken&&time-row.pingAt>10000){row.socket.terminate?.();if(row.socket.readyState===1)row.socket.close(1001,'pong timeout');return;}
  if(row.pingToken||time<row.nextPing||row.socket.bufferedAmount>32768)return;
  row.pingToken=randomBytes(6).toString('hex');row.pingAt=time;row.nextPing=time+15000;
  try{row.socket.ping(row.pingToken);metrics.serverPings++;}catch{fail(row.socket);}
 }
 async function tick(){
  if(ticking||!clients.size)return;ticking=true;const started=performance.now(),time=now(),lag=lastTick===null?0:Math.max(0,time-lastTick-snapshotMs);lastTick=time;let pressure=0;
  try{
   const live=[...clients.values()].filter(row=>row.ready&&row.socket.readyState===1);
   pressure=live.filter(row=>row.socket.bufferedAmount>32768).length/Math.max(1,live.length);
   for(const row of live)heartbeat(row,time);
   if(time-lastTouch>=5000){lastTouch=time;await Promise.all(live.map(async row=>{if(time-row.lastInput>15000){row.socket.close(1001,'heartbeat timeout');return;}if(!await store.touch(row.id,time))fail(row.socket);}));}
   const groups=new Map();for(const row of live){if(!groups.has(row.shard))groups.set(row.shard,[]);groups.get(row.shard).push(row);}
   await Promise.all([...groups].map(async([shard,rows])=>{
    const elapsed=time-(lastSnapshot.get(shard)||0);if(elapsed<governor.interval||!dirty.has(shard)&&elapsed<2000&&!rows.some(row=>!row.sceneReady))return;
    dirty.delete(shard);lastSnapshot.set(shard,time);const peers=await store.peers(time,shard),packet=encode(packSnapshot(peers,time));metrics.snapshots++;
    for(const row of rows){const interval=row.rtt>700?Math.max(400,governor.interval):governor.interval;if(time-row.frameAt<interval)continue;if(send(row.socket,packet,true))row.frameAt=time;}
    if(store.scene&&time-(lastScene.get(shard)||0)>=Math.max(500,governor.interval)){
     lastScene.set(shard,time);const scene=await store.scene(time,shard,peers),prior=sceneBases.get(shard),previous=prior&&scene.rev>=prior.rev?prior:null,delta=packScene(scene,time,previous),changed=!previous||previous.rev!==scene.rev||delta.effects.length||delta.vehicles.length||delta.removeEffects.length||delta.removeVehicles.length,scenePacket=changed?encode(delta):null;
     let full=null;for(const row of rows){if(!row.sceneReady){full??=encode(packScene(scene,time));row.sceneReady=send(row.socket,full,true);}else if(scenePacket&&!send(row.socket,scenePacket,true))row.sceneReady=false;}
     sceneBases.set(shard,structuredClone(scene));
    }
   }));
  }catch{for(const row of clients.values())fail(row.socket);}
  finally{const before=governor.interval;governor.observe({now:time,workMs:performance.now()-started,lagMs:lag,pressure});if(before!==governor.interval)for(const row of clients.values())if(row.ready)send(row.socket,{type:'network',serverPingMs:row.rtt===null?null:Math.round(row.rtt),intervalMs:Math.max(governor.interval,row.rtt>700?400:0),mode:governor.mode});ticking=false;}
 }
 async function attach(socket,{preferredRoom=null}={}){
  if(clients.size>=MAX_PEERS*MAX_ROOMS){socket.close(1013,'instance capacity');return null;}
  const id=randomBytes(12).toString('base64url'),time=now();
  const row={id,socket,shard:0,ready:false,closed:false,lastInput:time,seq:-1,pending:0,queue:Promise.resolve(),rate:createRateGate({now:time}),actions:createRateGate({rate:4,burst:8,now:time}),actionNonce:-1,poses:createRateGate({rate:12,burst:18,now:time}),rotation:null,rtt:null,pingToken:null,pingAt:0,nextPing:time+5000+Math.floor(Math.random()*10000),frameAt:-Infinity};
  clients.set(id,row);
  socket.on('error',()=>{});
  socket.on('pong',data=>{if(!row.pingToken||data?.length>32||String(data)!==row.pingToken)return;const rtt=Math.max(0,now()-row.pingAt);row.rtt=row.rtt===null?rtt:row.rtt*.7+rtt*.3;row.pingToken=null;metrics.serverPongs++;send(socket,{type:'network',serverPingMs:Math.round(row.rtt),intervalMs:Math.max(governor.interval,row.rtt>700?400:0),mode:governor.mode});});
  socket.on('close',()=>{
   row.closed=true;clearTimeout(row.rotation);clients.delete(id);metrics.closed++;void store.remove(id).catch(()=>{});
   if(!clients.size){clearInterval(timer);timer=null;lastTick=null;sceneBases.clear();lastScene.clear();lastSnapshot.clear();}
  });
  socket.on('message',(data,binary)=>{
   if(row.closed||socket.readyState!==1)return;
   if(binary||data.byteLength>MAX_PAYLOAD){socket.close(binary?1003:1009,'text presence only');return;}
   if(!row.ready||!row.rate(now())||row.pending>=16){metrics.rateRejected++;socket.close(1008,'presence rate limit');return;}
   const message=parseClientMessage(data.toString('utf8'));
   if(!message){socket.close(1008,'invalid presence message');return;}
   row.lastInput=now();
   if(message.type==='bye'){socket.close(1000,'leaving');return;}
   if(message.type==='ping'){send(socket,{type:'pong',nonce:message.nonce,serverTime:now()});return;}
   if(message.type==='sceneAction'){if(message.nonce<=row.actionNonce)return;row.actionNonce=message.nonce;if(!row.actions(now())){send(socket,{type:'sceneResult',nonce:message.nonce,ok:false,reason:'rate_limit'});return;}row.pending++;row.queue=row.queue.then(async()=>{if(row.closed)return;const result=await store.action(id,message,now());send(socket,{type:'sceneResult',nonce:message.nonce,...result});}).catch(()=>fail(socket)).finally(()=>row.pending--);return;}
   if(!row.poses(now())){metrics.rateRejected++;socket.close(1008,'pose rate limit');return;}
   if(message.seq<=row.seq)return;
   row.seq=message.seq;row.pending++;
   const {type,...pose}=message;
   row.queue=row.queue.then(async()=>{if(row.closed)return;if(!await store.write(id,pose,now()))fail(socket);}).catch(()=>fail(socket)).finally(()=>{row.pending--;});
  });
  try{
   const shard=matchmaking&&store.allocate?await store.allocate(id,time,preferredRoom):await store.reserve(id,time)?0:-1;
   if(shard<0){metrics.roomFull++;socket.close(4003,'room full');return null;}
   row.shard=shard;
   if(row.closed){await store.remove(id);return null;}
   row.ready=true;metrics.accepted++;metrics.peakConnections=Math.max(metrics.peakConnections,clients.size);send(socket,makeWelcome(id,now(),shard));dirty.add(shard);
   row.rotation=setTimeout(()=>{send(socket,{type:'reconnect',retryAfter:500+Math.floor(Math.random()*1000)});socket.close(1012,'connection rotation');},rotationMs*(.9+Math.random()*.1));row.rotation.unref?.();
   if(!timer){timer=setInterval(()=>{void tick();},snapshotMs);timer.unref?.();}
   void tick();return id;
  }catch{fail(socket);return null;}
 }
 return {attach,tick,get size(){return clients.size;},stats(){return {...metrics,intervalMs:governor.interval,networkMode:governor.mode,workMs:governor.workMs,connections:clients.size,rooms:new Set([...clients.values()].filter(row=>row.ready).map(row=>row.shard)).size};},async close(){unsubscribe();clearInterval(timer);await Promise.all([...clients.values()].map(async row=>{row.closed=true;clearTimeout(row.rotation);row.socket.close(1001,'server shutdown');const forced=setTimeout(()=>row.socket.terminate?.(),1500);forced.unref?.();row.socket.once?.('close',()=>clearTimeout(forced));await store.remove(row.id).catch(()=>{});}));clients.clear();dirty.clear();lastSnapshot.clear();}};
}
