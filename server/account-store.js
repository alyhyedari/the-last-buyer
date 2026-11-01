import Redis from 'ioredis';
import {createHash} from 'node:crypto';
const digest=s=>createHash('sha256').update(s).digest('hex');
let pending;
export async function productionAccounts(){if(!process.env.REDIS_URL)return null;if(!pending)pending=(async()=>{const db=new Redis(process.env.REDIS_URL,{lazyConnect:true,maxRetriesPerRequest:1,connectTimeout:5000,commandTimeout:5000,enableOfflineQueue:false});db.on('error',()=>{});await db.connect();return accountStore(db);})().catch(e=>{pending=null;throw e;});return pending;}
export function accountStore(db){const prefix='tlb:accounts:v1:',key=s=>prefix+s;return {
 async once(token,value){if(value!==undefined)return db.set(key('oauth:'+digest(token)),JSON.stringify(value),'EX',600);const raw=await db.getdel(key('oauth:'+digest(token)));return raw?JSON.parse(raw):null;},
 async session(token,value){if(value!==undefined){await db.set(key('session:'+digest(token)),JSON.stringify(value),'EX',604800);return value;}const raw=await db.get(key('session:'+digest(token)));return raw?JSON.parse(raw):null;},
 async logout(token){await db.del(key('session:'+digest(token)));},
 async register(sub){return !!await db.eval("if redis.call('SISMEMBER',KEYS[1],ARGV[1])==1 then return 1 end; if redis.call('SCARD',KEYS[1])>=40 then return 0 end; redis.call('SADD',KEYS[1],ARGV[1]); return 1",1,key('members'),sub);},
 async load(sub,slot){const raw=await db.get(key('save:'+sub+':'+slot));return raw?JSON.parse(raw):null;},
 async save(sub,slot,revision,state){const record={revision:revision+1,updatedAt:Date.now(),state};const ok=await db.eval("local old=redis.call('GET',KEYS[1]); local rev=0; if old then rev=cjson.decode(old).revision end; if rev~=tonumber(ARGV[1]) then return 0 end; redis.call('SET',KEYS[1],ARGV[2]); return 1",1,key('save:'+sub+':'+slot),revision,JSON.stringify(record));return ok?record:null;},
 async throttle(id,seconds=10){const n=await db.eval("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n",1,key('rate:'+digest(id)),seconds);return n<=1;}
};}
