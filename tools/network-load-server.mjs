import {createNetworkServer} from '../server/network-server.mjs';
import {createRedisGhostStore} from '../server/ghost-store.js';
import {monitorEventLoopDelay} from 'node:perf_hooks';
const histogram=monitorEventLoopDelay({resolution:20});histogram.enable();
const redis=process.env.LOAD_REDIS_URL?await createRedisGhostStore(process.env.LOAD_REDIS_URL,{namespace:process.env.LOAD_NAMESPACE}):null;
const app=await createNetworkServer({local:true,production:process.argv.includes('--dist'),getStore:redis?async()=>redis:undefined,rotationMs:Number(process.env.LOAD_ROTATION_MS||12000)});
app.server.listen(0,'127.0.0.1',()=>process.send?.({type:'ready',port:app.server.address().port,store:redis?'redis':'memory'}));
let closing=false;
process.on('message',async message=>{try{
 if(message==='stats')process.send?.({type:'stats',...app.stats(),occupancy:await app.occupancy(),rss:process.memoryUsage().rss,eventLoopP95Ms:histogram.percentile(95)/1e6,eventLoopMaxMs:histogram.max/1e6});
 if(message==='stop'&&!closing){closing=true;await app.close();await redis?.close();histogram.disable();process.disconnect?.();}
}catch{process.send?.({type:'error',message:'Load fixture failed'});}});
process.on('disconnect',()=>{if(!closing){closing=true;void app.close().then(()=>redis?.close());}});
