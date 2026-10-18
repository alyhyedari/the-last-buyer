import {randomUUID} from 'node:crypto';
import {parseClientMessage,makeWelcome,MAX_PAYLOAD} from '../src/ghost-protocol.js';
import {createRateGate} from './ghost-security.js';

// A hub owns this function instance's sockets only. Redis owns global occupancy
// and pub/sub marks every instance dirty, so a cold start is never a new room.
export function createGhostHub(store,{now=Date.now,rotationMs=240000,snapshotMs=125}={}){
 const clients=new Map();let dirty=true,ticking=false,timer=null,lastSnapshot=0,lastTouch=0;
 const unsubscribe=store.subscribe(()=>{dirty=true;});
 const send=(socket,data)=>{
  if(socket.readyState!==1)return;
  if(socket.bufferedAmount>131072){socket.close(1013,'slow connection');return;}
  socket.send(JSON.stringify(data));
 };
 const fail=socket=>{if(socket.readyState<2)socket.close(1013,'presence unavailable');};
 async function tick(){
  if(ticking||!clients.size)return;ticking=true;
  try{
   const time=now();
   if(time-lastTouch>=5000){lastTouch=time;await Promise.all([...clients.values()].filter(row=>row.ready&&row.socket.readyState===1).map(async row=>{if(time-row.lastInput>15000){row.socket.close(1001,'heartbeat timeout');return;}if(!await store.touch(row.id,time))fail(row.socket);}));}
   if(dirty||time-lastSnapshot>=2000){dirty=false;lastSnapshot=time;const peers=await store.peers(time);for(const row of clients.values())if(row.ready)send(row.socket,{type:'snapshot',serverTime:time,peers});}
  }catch{for(const row of clients.values())fail(row.socket);}
  finally{ticking=false;}
 }
 async function attach(socket){
  const id=randomUUID(),time=now();
  const row={id,socket,ready:false,closed:false,lastInput:time,seq:-1,pending:0,queue:Promise.resolve(),rate:createRateGate({now:time}),poses:createRateGate({rate:12,burst:18,now:time}),rotation:null};
  clients.set(id,row);
  socket.on('error',()=>{});
  socket.on('close',()=>{
   row.closed=true;clearTimeout(row.rotation);clients.delete(id);void store.remove(id).catch(()=>{});
   if(!clients.size){clearInterval(timer);timer=null;}
  });
  socket.on('message',(data,binary)=>{
   if(row.closed||socket.readyState!==1)return;
   if(binary||data.byteLength>MAX_PAYLOAD){socket.close(binary?1003:1009,'text presence only');return;}
   if(!row.ready||!row.rate(now())||row.pending>=16){socket.close(1008,'presence rate limit');return;}
   const message=parseClientMessage(data.toString('utf8'));
   if(!message){socket.close(1008,'invalid presence message');return;}
   row.lastInput=now();
   if(message.type==='bye'){socket.close(1000,'leaving');return;}
   if(message.type==='ping'){send(socket,{type:'pong',nonce:message.nonce,serverTime:now()});return;}
   if(!row.poses(now())){socket.close(1008,'pose rate limit');return;}
   if(message.seq<=row.seq)return;
   row.seq=message.seq;row.pending++;
   const {type,...pose}=message;
   row.queue=row.queue.then(async()=>{if(row.closed)return;if(!await store.write(id,pose,now()))fail(socket);}).catch(()=>fail(socket)).finally(()=>{row.pending--;});
  });
  try{
   if(!await store.reserve(id,time)){socket.close(4003,'room full');return null;}
   if(row.closed){await store.remove(id);return null;}
   row.ready=true;send(socket,makeWelcome(id,now()));dirty=true;
   row.rotation=setTimeout(()=>{send(socket,{type:'reconnect',retryAfter:500});socket.close(1012,'connection rotation');},rotationMs);row.rotation.unref?.();
   if(!timer){timer=setInterval(()=>{void tick();},snapshotMs);timer.unref?.();}
   void tick();return id;
  }catch{fail(socket);return null;}
 }
 return {attach,tick,get size(){return clients.size;},async close(){unsubscribe();clearInterval(timer);for(const row of clients.values()){clearTimeout(row.rotation);row.socket.close(1001,'server shutdown');await store.remove(row.id).catch(()=>{});}clients.clear();}};
}
