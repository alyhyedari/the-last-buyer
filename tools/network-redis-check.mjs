// Explicit integration gate: requires a disposable staging Redis, never a fake.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createRedisGhostStore} from '../server/ghost-store.js';
import {MAX_PEERS,MAX_ROOMS,PRESENCE_TTL} from '../src/ghost-protocol.js';
if(!process.env.TEST_REDIS_URL)throw Error('Set TEST_REDIS_URL to a staging TCP Redis URL. No Redis integration check was run.');
const namespace='check-'+randomUUID(),stores=[],ids=[];
try{
 for(let i=0;i<2;i++)stores.push(await createRedisGhostStore(process.env.TEST_REDIS_URL,{namespace}));
 const now=Date.now(),events=[];stores[1].subscribe(room=>events.push(room));
 const rooms=await Promise.all(Array.from({length:MAX_PEERS*MAX_ROOMS},(_,i)=>{const id='qa-'+i;ids.push(id);return stores[i%2].allocate(id,now);}));
 assert.equal(rooms.filter(r=>r>=0).length,MAX_PEERS*MAX_ROOMS);
 assert.deepEqual(await stores[1].occupancy(now),Array(MAX_ROOMS).fill(MAX_PEERS));
 assert.equal(await stores[0].allocate('overflow',now),-1);
 assert.equal(await stores[1].allocate(ids[0],now),-1);
 const pose={seq:1,x:100,y:200,angle:0,space:'outdoor',vehicle:'car',model:10,tone:0,paused:false};
 assert.equal(await stores[0].write(ids[0],pose,now),true);
 assert.equal((await stores[1].peers(now,rooms[0]))[0].id,ids[0]);
 assert.equal((await stores[1].peers(now,(rooms[0]+1)%MAX_ROOMS)).length,0);
 const deadline=Date.now()+3000;while(!events.includes(rooms[0])&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));
 assert.ok(events.includes(rooms[0]),'Cross-process Pub/Sub absent');
 const riders=ids.map((id,i)=>({id,i})).filter(r=>r.i>0&&rooms[r.i]===rooms[0]).slice(0,2);
 for(const r of riders)assert.ok(await stores[r.i%2].write(r.id,{...pose,vehicle:'foot'},now));
 const vehicle={type:'sceneAction',nonce:1,action:'vehicle',vehicleId:ids[0],vehicle:'car',model:10,parked:false,x:100,y:200,angle:0};
 assert.ok((await stores[0].action(ids[0],vehicle,now)).ok);
 assert.ok((await stores[riders[0].i%2].action(riders[0].id,{type:'sceneAction',nonce:2,action:'join',vehicleId:ids[0]},now)).ok);
 assert.equal((await stores[riders[1].i%2].action(riders[1].id,{type:'sceneAction',nonce:3,action:'take',vehicleId:ids[0]},now)).reason,'occupied');
 assert.ok((await stores[0].action(ids[0],{...vehicle,parked:true},now)).ok);
 const contenders=await Promise.all(riders.map(r=>stores[r.i%2].action(r.id,{type:'sceneAction',nonce:4,action:'take',vehicleId:ids[0]},now)));
 assert.equal(contenders.filter(r=>r.ok).length,1,'Vehicle handoff must have exactly one winner');
 assert.equal((await stores[1].scene(now,rooms[0])).vehicles[0].model,10);
 await stores[0].remove(ids[0]);assert.equal(await stores[0].allocate(ids[0],now,rooms[0]),rooms[0]);
 assert.equal(await stores[0].write(ids[0],pose,now+PRESENCE_TTL+1),false);
 assert.deepEqual(await stores[1].occupancy(now+PRESENCE_TTL+1),Array(MAX_ROOMS).fill(0));
 console.log(JSON.stringify({ok:true,namespace,clients:MAX_PEERS*MAX_ROOMS,rooms:MAX_ROOMS,checks:['atomic admission across two connections','overflow','duplicate identity','room isolation','Pub/Sub','shared seat','occupied theft denied','atomic scene handoff','preferred reconnect','lease expiry']}));
}catch{console.error('Redis integration failed. Check staging credentials, TCP/TLS, Lua and Pub/Sub permissions.');process.exitCode=1;}
finally{await Promise.allSettled(ids.map((id,i)=>stores[i%2]?.remove(id)));await Promise.allSettled(stores.map(s=>s.close()));}
