import {MAX_PEERS,MAX_ROOMS,PRESENCE_TTL,GHOST_MANIFEST} from '../src/ghost-protocol.js';
const validRoom=n=>Number.isInteger(n)&&n>=0&&n<MAX_ROOMS;
const roomOrder=preferred=>[...(validRoom(preferred)?[preferred]:[]),...Array.from({length:MAX_ROOMS},(_,i)=>i).filter(i=>i!==preferred)];

// Local-only implementation with the same bounded room and lease contract as Redis.
export function createMemoryGhostStore({local=false}={}){
 if(!local)throw Error('Memory presence is local development only');
 const rooms=Array.from({length:MAX_ROOMS},()=>new Map()),membership=new Map(),listeners=new Set();
 const notify=room=>{for(const listener of listeners)listener(room);};
 const prune=(room,now)=>{for(const[id,row]of rooms[room])if(row.expires<=now){rooms[room].delete(id);membership.delete(id);}};
 function allocate(id,now,preferred=null,strict=false){
  if(membership.has(id))prune(membership.get(id),now);if(membership.has(id))return -1;
  for(const room of strict?[preferred]:roomOrder(preferred)){if(!validRoom(room))return -1;prune(room,now);if(rooms[room].size>=MAX_PEERS)continue;rooms[room].set(id,{expires:now+PRESENCE_TTL,pose:null});membership.set(id,room);notify(room);return room;}return -1;
 }
 return {
  kind:'local-memory',healthy:()=>true,
  async allocate(id,now,preferred=null){return allocate(id,now,preferred);},
  async reserve(id,now,room=0){return allocate(id,now,room,true)>=0;},
  async write(id,pose,now){const room=membership.get(id);if(room===undefined)return false;prune(room,now);const row=rooms[room].get(id);if(!row)return false;row.pose={id,...pose,at:now};row.expires=now+PRESENCE_TTL;notify(room);return true;},
  async touch(id,now){const room=membership.get(id);if(room===undefined)return false;prune(room,now);const row=rooms[room].get(id);if(!row)return false;row.expires=now+PRESENCE_TTL;return true;},
  async remove(id){const room=membership.get(id);if(room===undefined)return;rooms[room].delete(id);membership.delete(id);notify(room);},
  async peers(now,room=0){if(!validRoom(room))return[];prune(room,now);return [...rooms[room].values()].filter(row=>row.pose).map(row=>({...row.pose}));},
  async occupancy(now){return rooms.map((rows,room)=>{prune(room,now);return rows.size;});},
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
  async close(){for(const room of rooms)room.clear();membership.clear();listeners.clear();}
 };
}

// Admission is one atomic Lua operation. All keys share a Redis hash tag.
// High-frequency writes use only the assigned room's four keys.
const allocationScript=`
local function prune(room)
 local leases=KEYS[3+room*2]; local poses=KEYS[4+room*2]
 local stale=redis.call('ZRANGEBYSCORE',leases,'-inf',ARGV[1])
 for _,id in ipairs(stale) do redis.call('HDEL',poses,id); redis.call('HDEL',KEYS[1],id) end
 redis.call('ZREMRANGEBYSCORE',leases,'-inf',ARGV[1])
 return redis.call('ZCARD',leases)
end
local previous=redis.call('HGET',KEYS[1],ARGV[2])
if previous then prune(tonumber(previous)); if redis.call('HEXISTS',KEYS[1],ARGV[2])==1 then return -1 end end
local preferred=tonumber(ARGV[5]); local order={}
if preferred>=0 then table.insert(order,preferred) end
if ARGV[6]~='1' then for room=0,tonumber(ARGV[7])-1 do if room~=preferred then table.insert(order,room) end end end
for _,room in ipairs(order) do
 if prune(room)<tonumber(ARGV[4]) then
  local leases=KEYS[3+room*2]; local poses=KEYS[4+room*2]
  redis.call('ZADD',leases,ARGV[3],ARGV[2]); redis.call('HSET',poses,ARGV[2],'null'); redis.call('HSET',KEYS[1],ARGV[2],room)
  redis.call('EXPIRE',leases,60); redis.call('EXPIRE',poses,60); redis.call('EXPIRE',KEYS[1],60); redis.call('PUBLISH',KEYS[2],room); return room
 end
end
return -1`;
const pruneScript="local stale=redis.call('ZRANGEBYSCORE',KEYS[1],'-inf',ARGV[1]); for _,id in ipairs(stale) do redis.call('HDEL',KEYS[2],id); redis.call('HDEL',KEYS[4],id) end; redis.call('ZREMRANGEBYSCORE',KEYS[1],'-inf',ARGV[1]); ";
const writeScript="local lease=redis.call('ZSCORE',KEYS[1],ARGV[2]); if not lease or tonumber(lease)<=tonumber(ARGV[1]) then return 0 end; redis.call('ZADD',KEYS[1],ARGV[3],ARGV[2]); redis.call('HSET',KEYS[2],ARGV[2],ARGV[4]); redis.call('EXPIRE',KEYS[1],60); redis.call('EXPIRE',KEYS[2],60); redis.call('EXPIRE',KEYS[4],60); redis.call('PUBLISH',KEYS[3],ARGV[5]); return 1";
const touchScript="local lease=redis.call('ZSCORE',KEYS[1],ARGV[2]); if not lease or tonumber(lease)<=tonumber(ARGV[1]) then return 0 end; redis.call('ZADD',KEYS[1],ARGV[3],ARGV[2]); redis.call('EXPIRE',KEYS[1],60); redis.call('EXPIRE',KEYS[2],60); redis.call('EXPIRE',KEYS[4],60); return 1";
const removeScript="redis.call('ZREM',KEYS[1],ARGV[1]); redis.call('HDEL',KEYS[2],ARGV[1]); redis.call('HDEL',KEYS[4],ARGV[1]); redis.call('PUBLISH',KEYS[3],ARGV[2]); return 1";

export async function createRedisGhostStore(url,{namespace='public'}={}){
 if(typeof url!=='string'||!/^rediss?:\/\//.test(url))throw Error('REDIS_URL is required');
 if(!/^[a-zA-Z0-9_-]{1,48}$/.test(namespace))throw Error('Invalid presence namespace');
 const {default:Redis}=await import('ioredis');
 const options={lazyConnect:true,connectTimeout:3000,commandTimeout:3000,maxRetriesPerRequest:1,enableOfflineQueue:false,retryStrategy:()=>null};
 const commands=new Redis(url,options),subscriber=new Redis(url,options),listeners=new Set(),membership=new Map();
 commands.on('error',()=>{});subscriber.on('error',()=>{});
 const base=`tlb:ghost:{${GHOST_MANIFEST.worldVersion}:${GHOST_MANIFEST.room}:v${GHOST_MANIFEST.v}:${namespace}}`,index=base+':members',events=base+':events';
 const roomKeys=room=>[base+':r'+room+':leases',base+':r'+room+':poses',events,index];
 const allocationKeys=[index,events,...Array.from({length:MAX_ROOMS},(_,i)=>roomKeys(i).slice(0,2)).flat()];
 try{await Promise.all([commands.connect(),subscriber.connect()]);await subscriber.subscribe(events);}catch(error){commands.disconnect();subscriber.disconnect();throw error;}
 subscriber.on('message',(channel,message)=>{const room=Number(message);if(channel===events&&validRoom(room))for(const listener of listeners)listener(room);});
 const run=(room,script,...args)=>commands.eval(script,4,...roomKeys(room),...args);
 async function allocate(id,now,preferred,strict){
  if(strict&&!validRoom(preferred))return -1;
  const room=await commands.eval(allocationScript,allocationKeys.length,...allocationKeys,now,id,now+PRESENCE_TTL,MAX_PEERS,validRoom(preferred)?preferred:-1,strict?1:0,MAX_ROOMS);
  if(validRoom(room))membership.set(id,room);return room;
 }
 return {
  kind:'redis',healthy:()=>commands.status==='ready'&&subscriber.status==='ready',
  async allocate(id,now,preferred=null){return allocate(id,now,preferred,false);},
  async reserve(id,now,room=0){return (await allocate(id,now,room,true))>=0;},
  async write(id,pose,now){const room=membership.get(id);return room!==undefined&&(await run(room,writeScript,now,id,now+PRESENCE_TTL,JSON.stringify({id,...pose,at:now}),room))===1;},
  async touch(id,now){const room=membership.get(id);return room!==undefined&&(await run(room,touchScript,now,id,now+PRESENCE_TTL))===1;},
  async remove(id){const room=membership.get(id);if(room===undefined)return;await run(room,removeScript,id,room);membership.delete(id);},
  async peers(now,room=0){if(!validRoom(room))return[];const rows=await run(room,pruneScript+"return redis.call('HVALS',KEYS[2])",now);return rows.map(row=>{try{return JSON.parse(row);}catch{return null;}}).filter(row=>row&&typeof row.id==='string').slice(0,MAX_PEERS);},
  async occupancy(now){return Promise.all(Array.from({length:MAX_ROOMS},(_,room)=>run(room,pruneScript+"return redis.call('ZCARD',KEYS[1])",now)));},
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
  async close(){listeners.clear();membership.clear();commands.disconnect();subscriber.disconnect();}
 };
}

let productionStore=null,productionPending=null;
export async function getProductionGhostStore(){
 const url=process.env.REDIS_URL;if(!url)return null;
 if(productionStore?.healthy())return productionStore;if(productionPending)return productionPending;
 if(productionStore){await productionStore.close();productionStore=null;}
 productionPending=createRedisGhostStore(url,{namespace:process.env.GHOST_NAMESPACE||'public'}).then(store=>(productionStore=store)).finally(()=>{productionPending=null;});return productionPending;
}
