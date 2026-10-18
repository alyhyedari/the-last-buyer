import {GHOST_MANIFEST,MAX_PEERS,validatePose,validSpace} from './ghost-protocol.js';

const BUFFER_LIMIT=6,RENDER_LIMIT=24,PACKET_LIMIT=MAX_PEERS*512+1024,EXPIRE_MS=8000;
const ownKeys=(value,allowed)=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(k=>allowed.includes(k));
const stamp=n=>Number.isSafeInteger(n)&&n>=0&&n<=8640000000000000;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const peerKeys=['id','seq','x','y','angle','space','vehicle','model','tone','paused','at'];
const manifestKeys=Object.keys(GHOST_MANIFEST);
const newer=(a,b)=>{const d=(a-b+2147483648)%2147483648;return d>0&&d<1073741824;};
const changed=(a,b)=>!b||Math.hypot(a.x-b.x,a.y-b.y)>.02||Math.abs(wrap(a.angle-b.angle))>.01||['space','vehicle','model','tone','paused'].some(k=>a[k]!==b[k]);
const safeCall=(fn,value)=>{try{fn?.(value);}catch{/* Host UI callbacks must not stop transport cleanup. */}};

/** Presence only. Remote poses never enter inventory, collision, combat or saves. */
export class GhostClient{
 constructor({url,WebSocketImpl=globalThis.WebSocket,now=()=>globalThis.performance.now(),wallNow=Date.now,onStatus,onWelcome,random=Math.random,setTimeoutImpl=globalThis.setTimeout,clearTimeoutImpl=globalThis.clearTimeout}={}){
  Object.assign(this,{url,WebSocketImpl,now,wallNow,onStatus,onWelcome,random,setTimeoutImpl,clearTimeoutImpl});
  this._status={state:'offline',pingMs:null,jitterMs:0,peers:0,room:GHOST_MANIFEST.room,reason:null};
  this._peers=new Map();this._pings=new Map();this._visible=true;this._disposed=false;this._terminal=false;this._started=false;this._socket=null;this._timer=null;this._manifest=null;this._id=null;this._seq=0;this._nonce=0;this._attempt=0;this._retryAt=Infinity;this._pose=null;this._sentPose=null;this._sentAt=-Infinity;this._pingAt=-Infinity;this._lastPacket=0;this._lastSnapshot=-Infinity;this._serverAt=0;this._serverMono=0;this._lastClock=null;this._lastRtt=null;this._arrival=null;this._serverArrival=null;
 }
 get status(){return {...this._status};}
 get manifest(){return this._manifest?{...this._manifest}:null;}
 get interpolationMs(){return clamp(100+this._status.jitterMs*2,100,350);}
 get roomClock(){
  if(!this._manifest)return null;
  const m=this._manifest,value=m.baseMinutes+Math.max(0,this._serverNow()-m.epochMs)/1000*m.clockRate;
  this._lastClock=Math.max(this._lastClock??value,value);return this._lastClock;
 }
 _serverNow(at=this.now()){return this._serverAt+Math.max(0,at-this._serverMono);}
 _setStatus(patch){
  if(Object.keys(patch).every(k=>patch[k]===this._status[k]))return;
  Object.assign(this._status,patch);safeCall(this.onStatus,this.status);
 }
 connect(){
  if(this._disposed||this._terminal||this._started)return this;
  this._started=true;
  if(typeof this.WebSocketImpl!=='function'){this._terminal=true;this._setStatus({state:'unavailable',reason:'unsupported'});return this;}
  try{const u=new URL(this.url,globalThis.location?.href??'http://localhost');if(u.protocol==='http:')u.protocol='ws:';if(u.protocol==='https:')u.protocol='wss:';if(!['ws:','wss:'].includes(u.protocol)||u.username||u.password)throw Error();this._url=u.href;}catch{this._terminal=true;this._setStatus({state:'unavailable',reason:'invalid_url'});return this;}
  this._open();this._schedule();return this;
 }
 _schedule(){
  if(this._disposed||this._terminal||this._timer!==null)return;
  this._timer=this.setTimeoutImpl(()=>{this._timer=null;this._tick();this._schedule();},this._visible?250:1000);
  this._timer?.unref?.();
 }
 _open(){
  if(this._disposed||this._terminal||!this._visible)return;
  const now=this.now();this._openedAt=now;this._lastPacket=now;this._retryAt=Infinity;this._sentAt=-Infinity;this._sentPose=null;this._seq=0;this._pingAt=-Infinity;this._pings.clear();this._lastSnapshot=-Infinity;this._lastRtt=null;this._arrival=null;this._serverArrival=null;
  this._setStatus({state:this._manifest?'reconnecting':'connecting',reason:null});
  if(this._disposed||this._terminal)return;
  let socket;try{socket=new this.WebSocketImpl(this._url);}catch{this._retry('connection_failed');return;}this._socket=socket;
  socket.onopen=()=>{if(this._socket!==socket||this._disposed)return;this._openedAt=this.now();};
  socket.onmessage=event=>{if(this._socket===socket&&!this._disposed)this._receive(event.data);};
  socket.onerror=()=>{if(this._socket===socket&&!this._disposed)this._retry('connection_lost');};
  socket.onclose=event=>{if(this._socket!==socket||this._disposed)return;if([4003,4004,1003,1008,1009].includes(event.code)){this._fail(event.code===4003?'room_full':event.code===4004?'incompatible_world':'protocol_rejected');return;}this._retry('connection_lost');};
 }
 _closeSocket(){
  const socket=this._socket;this._socket=null;if(!socket)return;
  socket.onopen=socket.onmessage=socket.onerror=socket.onclose=null;
  try{socket.close();}catch{/* Already closed. */}
 }
 _retry(reason,retryAfter){
  this._closeSocket();this._pings.clear();
  if(this._disposed||this._terminal)return;
  const delay=retryAfter??Math.min(15000,500*2**Math.min(5,this._attempt++))*(.8+clamp(this.random(),0,1)*.4);
  this._retryAt=this.now()+Math.min(15000,Math.max(250,delay));this._setStatus({state:'reconnecting',reason,pingMs:null});
 }
 _fail(reason){this._terminal=true;this._closeSocket();this._peers.clear();this._pings.clear();if(this._timer!==null)this.clearTimeoutImpl(this._timer);this._timer=null;this._setStatus({state:'unavailable',reason,peers:0,pingMs:null});}
 _send(packet){
  if(!this._socket||this._socket.readyState!==1||this._socket.bufferedAmount>16384)return false;
  try{this._socket.send(JSON.stringify(packet));return true;}catch{this._retry('connection_lost');return false;}
 }
 _tick(){
  if(this._disposed||this._terminal)return;const now=this.now();this._expire(now);
  if(!this._socket){if(this._visible&&now>=this._retryAt)this._open();return;}
  if(this._status.state!=='online'){if(now-this._openedAt>8000)this._retry('welcome_timeout');return;}
  if(this._visible&&now-this._lastPacket>20000){this._retry('connection_timeout');return;}
  for(const [nonce,sent]of this._pings)if(now-sent>15000)this._pings.delete(nonce);
  if(this._visible&&now-this._pingAt>=5000&&this._pings.size<3){const nonce=++this._nonce;if(this._send({type:'ping',nonce})){this._pings.set(nonce,now);this._pingAt=now;}}
  this._publish(now);
 }
 update(pose){
  if(this._disposed||this._terminal||!pose)return false;
  const clean=validatePose({type:'pose',seq:this._seq,x:pose.x,y:pose.y,angle:Number.isFinite(pose.angle)?wrap(pose.angle):pose.angle,space:pose.space,vehicle:pose.vehicle??'foot',model:pose.model??0,tone:pose.tone??0,paused:!!pose.paused});
  if(!clean)return false;this._pose=clean;this._publish(this.now());return true;
 }
 _publish(now){
  if(!this._pose||this._status.state!=='online'||now-this._sentAt<200)return;
  const pose={...this._pose,paused:!this._visible||this._pose.paused,seq:this._seq};
  const heartbeat=this._visible?1000:5000;
  if(!this._visible&&this._sentPose?.paused&&now-this._sentAt<heartbeat)return;
  if(!changed(pose,this._sentPose)&&now-this._sentAt<heartbeat)return;
  if(this._send({type:'pose',...pose})){this._sentAt=now;this._sentPose=pose;this._seq=(this._seq+1)%2147483648;}
 }
 setVisible(visible){
  if(this._disposed||this._terminal)return;const value=!!visible;if(value===this._visible)return;this._visible=value;
  if(this._timer!==null)this.clearTimeoutImpl(this._timer);this._timer=null;
  if(value){this._arrival=null;this._serverArrival=null;this._pingAt=-Infinity;if(!this._socket)this._retryAt=this.now();}
  this._tick();this._schedule();
 }
 _receive(raw){
  if(typeof raw!=='string'||raw.length>PACKET_LIMIT)return;
  let message;try{message=JSON.parse(raw);}catch{return;}
  if(!message||typeof message!=='object'||Array.isArray(message))return;
  const now=this.now();
  if(message.type==='welcome'){
   if(!ownKeys(message,['type','id','serverTime',...manifestKeys])||!stamp(message.serverTime)||typeof message.id!=='string'||!(/^[A-Za-z0-9_-]{1,64}$/).test(message.id)||!manifestKeys.every(k=>message[k]===GHOST_MANIFEST[k])){this._fail('incompatible_world');return;}
   if(this._manifest&&!manifestKeys.every(k=>message[k]===this._manifest[k])){this._fail('incompatible_world');return;}
   if(this._status.state==='online')return;
   this._manifest=Object.fromEntries(manifestKeys.map(k=>[k,message[k]]));this._id=message.id;this._serverAt=message.serverTime;this._serverMono=now;this._lastPacket=now;this._attempt=0;this._peers.clear();this._setStatus({state:'online',reason:null,peers:0,room:message.room});if(this._disposed||this._terminal)return;safeCall(this.onWelcome,{...message});this._tick();return;
  }
  if(this._status.state!=='online')return;
  if(message.type==='pong'){
   if(!ownKeys(message,['type','nonce','serverTime'])||!Number.isSafeInteger(message.nonce)||!stamp(message.serverTime)||Math.abs(message.serverTime-this._serverNow(now))>30000||!this._pings.has(message.nonce))return;
   const rtt=now-this._pings.get(message.nonce);this._pings.delete(message.nonce);if(rtt<0||rtt>15000)return;
   const first=this._lastRtt===null,jitter=first?this._status.jitterMs:this._status.jitterMs*.8+Math.abs(rtt-this._lastRtt)*.2;this._lastRtt=rtt;
   this._setStatus({pingMs:Math.round(rtt),jitterMs:Math.round(clamp(jitter,0,1000))});
   const target=message.serverTime+rtt/2,current=this._serverNow(now);this._serverAt=first?target:current+clamp(target-current,-250,250)*.2;this._serverMono=now;this._lastPacket=now;return;
  }
  if(message.type==='reconnect'){
   if(!ownKeys(message,['type','retryAfter'])||!Number.isInteger(message.retryAfter)||message.retryAfter<100||message.retryAfter>15000)return;
   this._lastPacket=now;this._retry('server_rotation',message.retryAfter);return;
  }
  if(message.type!=='snapshot'||!ownKeys(message,['type','serverTime','peers'])||!stamp(message.serverTime)||!Array.isArray(message.peers)||message.peers.length>MAX_PEERS||message.serverTime<this._lastSnapshot||Math.abs(message.serverTime-this._serverNow(now))>30000)return;
  const clean=[],ids=new Set();
  for(const p of message.peers){
   if(!ownKeys(p,peerKeys)||typeof p.id!=='string'||!(/^[A-Za-z0-9_-]{1,64}$/).test(p.id)||ids.has(p.id)||!stamp(p.at)||p.at>message.serverTime+1000||message.serverTime-p.at>30000)return;
   const pose=validatePose({type:'pose',seq:p.seq,x:p.x,y:p.y,angle:p.angle,space:p.space,vehicle:p.vehicle,model:p.model,tone:p.tone,paused:p.paused});if(!pose)return;
   ids.add(p.id);if(p.id!==this._id)clean.push({id:p.id,...pose,at:now+p.at-this._serverNow(now)});
  }
  if(this._arrival!==null){const variation=Math.abs((now-this._arrival)-(message.serverTime-this._serverArrival));this._setStatus({jitterMs:Math.round(clamp(this._status.jitterMs*.9+variation*.1,0,1000))});}
  this._arrival=now;this._serverArrival=message.serverTime;this._lastSnapshot=message.serverTime;this._lastPacket=now;
  // Snapshots are complete room membership. Remove a closed session before its
  // replacement UUID arrives; the expiry timer handles missing snapshots.
  for(const id of this._peers.keys())if(!ids.has(id))this._peers.delete(id);
  for(const p of clean){
   if(now-p.at>EXPIRE_MS)continue;
   let record=this._peers.get(p.id);const previous=record?.samples.at(-1);
   if(previous&&(!newer(p.seq,previous.seq)||p.at<previous.at))continue;
   if(!record){if(this._peers.size>=MAX_PEERS)continue;record={samples:[]};this._peers.set(p.id,record);}
   if(previous&&(p.space!==previous.space||Math.hypot(p.x-previous.x,p.y-previous.y)>12))record.samples.length=0;
   record.samples.push(p);if(record.samples.length>BUFFER_LIMIT)record.samples.shift();
  }
  this._expire(now);this._setStatus({peers:this._peers.size});
 }
 _expire(now){for(const [id,record]of this._peers)if(now-record.samples.at(-1).at>EXPIRE_MS)this._peers.delete(id);this._setStatus({peers:this._peers.size});}
 sample(view,at=this.now()){
  if(this._disposed||this._terminal||!this._visible||!view||!validSpace(view.space)||!Number.isFinite(view.x)||!Number.isFinite(view.y)||!Number.isFinite(at))return [];
  this._expire(at);const target=at-this.interpolationMs,actors=[];
  for(const [id,record]of this._peers){
   const samples=record.samples,last=samples.at(-1);if(last.space!==view.space)continue;
   let x=last.x,y=last.y,angle=last.angle;
   if(target<samples[0].at){x=samples[0].x;y=samples[0].y;angle=samples[0].angle;}
   else{
    let between=false;
    for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i];if(target>b.at)continue;const t=clamp((target-a.at)/Math.max(1,b.at-a.at),0,1);x=a.x+(b.x-a.x)*t;y=a.y+(b.y-a.y)*t;angle=wrap(a.angle+wrap(b.angle-a.angle)*t);between=true;break;}
    if(!between&&samples.length>1&&!last.paused){const previous=samples.at(-2),elapsed=(last.at-previous.at)/1000;if(elapsed>.02){const vx=(last.x-previous.x)/elapsed,vy=(last.y-previous.y)/elapsed,scale=Math.min(1,32/(Math.hypot(vx,vy)||1)),seconds=clamp((target-last.at)/1000,0,.25);x=clamp(last.x+vx*scale*seconds,0,384);y=clamp(last.y+vy*scale*seconds,0,384);}}
   }
   const age=Math.max(0,at-last.at),fadeAt=last.paused?6000:1500,opacity=(last.paused?.68:1)*(1-clamp((age-fadeAt)/(EXPIRE_MS-fadeAt),0,1));
   actors.push({kind:'playerGhost',id:'ghost-'+id,x,y,angle,vehicle:last.vehicle,model:last.model,tone:last.tone,paused:last.paused,opacity,variant:last.tone,distance:Math.hypot(x-view.x,y-view.y)});
  }
  actors.sort((a,b)=>a.distance-b.distance);return actors.slice(0,RENDER_LIMIT).map(({distance,...actor})=>actor);
 }
 disconnect(){
  if(this._disposed)return;this._disposed=true;
  if(this._timer!==null)this.clearTimeoutImpl(this._timer);this._timer=null;
  this._send({type:'bye'});this._closeSocket();this._peers.clear();this._pings.clear();this._setStatus({state:'offline',reason:null,peers:0,pingMs:null});
 }
 dispose(){this.disconnect();}
}
