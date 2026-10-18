import {MAX_PEERS,PRESENCE_TTL,GHOST_MANIFEST} from '../src/ghost-protocol.js';

// This store is deliberately opt-in for a single local development process only.
export function createMemoryGhostStore({local=false}={}){
 if(!local)throw Error('Memory presence is local development only');
 const records=new Map(),listeners=new Set();
 const notify=()=>{for(const listener of listeners)listener();};
 const prune=now=>{for(const [id,row] of records)if(row.expires<=now)records.delete(id);};
 return {
  kind:'local-memory',healthy:()=>true,
  async reserve(id,now){prune(now);if(records.size>=MAX_PEERS||records.has(id))return false;records.set(id,{expires:now+PRESENCE_TTL,pose:null});notify();return true;},
  async write(id,pose,now){prune(now);const row=records.get(id);if(!row)return false;row.pose={id,...pose,at:now};row.expires=now+PRESENCE_TTL;notify();return true;},
  async touch(id,now){prune(now);const row=records.get(id);if(!row)return false;row.expires=now+PRESENCE_TTL;return true;},
  async remove(id){records.delete(id);notify();},
  async peers(now){prune(now);return [...records.values()].filter(row=>row.pose).map(row=>({...row.pose}));},
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
  async close(){records.clear();listeners.clear();}
 };
}

const pruneScript="local stale=redis.call('ZRANGEBYSCORE',KEYS[1],'-inf',ARGV[1]); for _,id in ipairs(stale) do redis.call('HDEL',KEYS[2],id) end; redis.call('ZREMRANGEBYSCORE',KEYS[1],'-inf',ARGV[1]); ";
const reserveScript=pruneScript+"if redis.call('ZCARD',KEYS[1])>=tonumber(ARGV[4]) or redis.call('ZSCORE',KEYS[1],ARGV[2]) then return 0 end; redis.call('ZADD',KEYS[1],ARGV[3],ARGV[2]); redis.call('HSET',KEYS[2],ARGV[2],'null'); redis.call('EXPIRE',KEYS[1],60); redis.call('EXPIRE',KEYS[2],60); redis.call('PUBLISH',KEYS[3],'dirty'); return 1";
const writeScript="local lease=redis.call('ZSCORE',KEYS[1],ARGV[2]); if not lease or tonumber(lease)<=tonumber(ARGV[1]) then return 0 end; redis.call('ZADD',KEYS[1],ARGV[3],ARGV[2]); redis.call('HSET',KEYS[2],ARGV[2],ARGV[4]); redis.call('EXPIRE',KEYS[1],60); redis.call('EXPIRE',KEYS[2],60); redis.call('PUBLISH',KEYS[3],'dirty'); return 1";
const touchScript="local lease=redis.call('ZSCORE',KEYS[1],ARGV[2]); if not lease or tonumber(lease)<=tonumber(ARGV[1]) then return 0 end; redis.call('ZADD',KEYS[1],ARGV[3],ARGV[2]); redis.call('EXPIRE',KEYS[1],60); redis.call('EXPIRE',KEYS[2],60); return 1";
const removeScript="redis.call('ZREM',KEYS[1],ARGV[1]); redis.call('HDEL',KEYS[2],ARGV[1]); redis.call('PUBLISH',KEYS[3],'dirty'); return 1";

export async function createRedisGhostStore(url){
 if(typeof url!=='string'||!/^rediss?:\/\//.test(url))throw Error('REDIS_URL is required');
 const {default:Redis}=await import('ioredis');
 const options={lazyConnect:true,connectTimeout:3000,commandTimeout:3000,maxRetriesPerRequest:1,enableOfflineQueue:false,retryStrategy:()=>null};
 const commands=new Redis(url,options),subscriber=new Redis(url,options),listeners=new Set();
 // Handled here so connection errors cannot log credentials or crash the function.
 commands.on('error',()=>{});subscriber.on('error',()=>{});
 const base=`tlb:ghost:{${GHOST_MANIFEST.worldVersion}:${GHOST_MANIFEST.room}}`;
 const keys=[base+':leases',base+':poses',base+':events'];
 try{await Promise.all([commands.connect(),subscriber.connect()]);await subscriber.subscribe(keys[2]);}
 catch(error){commands.disconnect();subscriber.disconnect();throw error;}
 subscriber.on('message',channel=>{if(channel===keys[2])for(const listener of listeners)listener();});
 const run=(script,...args)=>commands.eval(script,keys.length,...keys,...args);
 return {
  kind:'redis',healthy:()=>commands.status==='ready'&&subscriber.status==='ready',
  async reserve(id,now){return (await run(reserveScript,now,id,now+PRESENCE_TTL,MAX_PEERS))===1;},
  async write(id,pose,now){return (await run(writeScript,now,id,now+PRESENCE_TTL,JSON.stringify({id,...pose,at:now})))===1;},
  async touch(id,now){return (await run(touchScript,now,id,now+PRESENCE_TTL))===1;},
  async remove(id){await run(removeScript,id);},
  async peers(now){const rows=await run(pruneScript+"return redis.call('HVALS',KEYS[2])",now);return rows.map(row=>{try{return JSON.parse(row);}catch{return null;}}).filter(row=>row&&typeof row.id==='string').slice(0,MAX_PEERS);},
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
  async close(){listeners.clear();commands.disconnect();subscriber.disconnect();}
 };
}

let productionStore=null,productionPending=null;
export async function getProductionGhostStore(){
 const url=process.env.REDIS_URL;
 if(!url)return null;
 if(productionStore?.healthy())return productionStore;
 if(productionPending)return productionPending;
 if(productionStore){await productionStore.close();productionStore=null;}
 productionPending=createRedisGhostStore(url).then(store=>(productionStore=store)).finally(()=>{productionPending=null;});
 return productionPending;
}
