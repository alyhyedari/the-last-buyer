import {randomBytes} from 'node:crypto';
import {packSnapshot} from '../src/ghost-wire.js';
import {parseClientMessage,makeWelcome,MAX_PAYLOAD,MAX_PEERS,MAX_ROOMS} from '../src/ghost-protocol.js';
import {createRateGate} from './ghost-security.js';

// A hub owns this function instance's sockets only. Redis owns global occupancy
// and pub/sub marks every instance dirty, so a cold start is never a new room.
export function createGhostHub(store,{now=Date.now,rotationMs=240000,snapshotMs=200,matchmaking=true}={}){
 const clients=new Map(),dirty=new Set(),lastSnapshot=new Map();let ticking=false,timer=null,lastTouch=0;
 const metrics={accepted:0,closed:0,roomFull:0,slowClosed:0,rateRejected:0,bytesSent:0,snapshots:0,peakConnections:0};
 const unsubscribe=store.subscribe(room=>{if(Number.isInteger(room))dirty.add(room);else for(const row of clients.values())dirty.add(row.shard);});
 const send=(socket,data)=>{
  if(socket.readyState!==1)return;
  if(socket.bufferedAmount>131072){metrics.slowClosed++;socket.close(1013,'slow connection');return;}
  const packet=typeof data==='string'?data:JSON.stringify(data);try{socket.send(packet);metrics.bytesSent+=Buffer.byteLength(packet);}catch{socket.close(1013,'send failed');}
 };
 const fail=socket=>{if(socket.readyState<2)socket.close(1013,'presence unavailable');};
 async function tick(){
  if(ticking||!clients.size)return;ticking=true;
  try{
   const time=now();
   if(time-lastTouch>=5000){lastTouch=time;await Promise.all([...clients.values()].filter(row=>row.ready&&row.socket.readyState===1).map(async row=>{if(time-row.lastInput>15000){row.socket.close(1001,'heartbeat timeout');return;}if(!await store.touch(row.id,time))fail(row.socket);}));}
   const groups=new Map();for(const row of clients.values())if(row.ready){if(!groups.has(row.shard))groups.set(row.shard,[]);groups.get(row.shard).push(row);}
   await Promise.all([...groups].map(async([shard,rows])=>{const elapsed=time-(lastSnapshot.get(shard)||0);if(elapsed<snapshotMs||!dirty.has(shard)&&elapsed<2000)return;dirty.delete(shard);lastSnapshot.set(shard,time);const peers=await store.peers(time,shard),packet=JSON.stringify(packSnapshot(peers,time));metrics.snapshots++;for(const row of rows)send(row.socket,packet);}));
  }catch{for(const row of clients.values())fail(row.socket);}
  finally{ticking=false;}
 }
 async function attach(socket,{preferredRoom=null}={}){
  if(clients.size>=MAX_PEERS*MAX_ROOMS){socket.close(1013,'instance capacity');return null;}
  const id=randomBytes(12).toString('base64url'),time=now();
  const row={id,socket,shard:0,ready:false,closed:false,lastInput:time,seq:-1,pending:0,queue:Promise.resolve(),rate:createRateGate({now:time}),poses:createRateGate({rate:12,burst:18,now:time}),rotation:null};
  clients.set(id,row);
  socket.on('error',()=>{});
  socket.on('close',()=>{
   row.closed=true;clearTimeout(row.rotation);clients.delete(id);metrics.closed++;void store.remove(id).catch(()=>{});
   if(!clients.size){clearInterval(timer);timer=null;}
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
 return {attach,tick,get size(){return clients.size;},stats(){return {...metrics,connections:clients.size,rooms:new Set([...clients.values()].filter(row=>row.ready).map(row=>row.shard)).size};},async close(){unsubscribe();clearInterval(timer);await Promise.all([...clients.values()].map(async row=>{row.closed=true;clearTimeout(row.rotation);row.socket.close(1001,'server shutdown');const forced=setTimeout(()=>row.socket.terminate?.(),1500);forced.unref?.();row.socket.once?.('close',()=>clearTimeout(forced));await store.remove(row.id).catch(()=>{});}));clients.clear();dirty.clear();lastSnapshot.clear();}};
}
