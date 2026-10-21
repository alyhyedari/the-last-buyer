import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
import {createStaticServer} from '../server.mjs';
import {createMemoryGhostStore,getProductionGhostStore} from './ghost-store.js';
import {attachGhostWebSockets,handleGhostRoom,JSON_HEADERS} from './ghost-http.js';
export async function createNetworkServer({local=false,production=!local,getStore,rotationMs}={}){
 const memory=local&&!getStore?createMemoryGhostStore({local:true}):null,storeProvider=getStore||(memory?async()=>memory:getProductionGhostStore),staticServer=await createStaticServer({production});
 const server=createServer((req,res)=>{let pathname;try{pathname=new URL(req.url,'http://localhost').pathname;}catch{res.writeHead(400);res.end();return;}
  if(pathname==='/api/ghost-room'){void handleGhostRoom(req,res,storeProvider,{local});return;}
  if(pathname==='/healthz'){if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}void Promise.resolve().then(storeProvider).then(store=>{const healthy=!!store?.healthy();res.writeHead(healthy?200:503,JSON_HEADERS);res.end(req.method==='HEAD'?undefined:JSON.stringify({ok:healthy,service:'neon-coast-presence',mode:local?'local':'production'}));}).catch(()=>{res.writeHead(503,JSON_HEADERS);res.end(JSON.stringify({ok:false}));});return;}
  staticServer.emit('request',req,res);
 });
 const sockets=attachGhostWebSockets(server,{getStore:storeProvider,local,rotationMs});let closing=null;
 return{server,stats:()=>sockets.stats(),async occupancy(){const store=await storeProvider();return store?.occupancy(Date.now())||[];},async close(){if(closing)return closing;closing=(async()=>{await sockets.close();await memory?.close();await new Promise(resolve=>{server.close(resolve);server.closeIdleConnections?.();});})();return closing;}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const local=process.argv.includes('--local'),production=process.argv.includes('--dist')||!local;
 if(!local&&!process.env.REDIS_URL){console.error('REDIS_URL is required. Use npm run dev:network for isolated local testing.');process.exitCode=1;}
 else{const app=await createNetworkServer({local,production}),port=Number(process.env.PORT||4178),host=process.env.HOST||'127.0.0.1';if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid PORT');app.server.listen(port,host,()=>console.log('Neon Coast '+(local?'local test':'production')+' server listening on '+host+':'+port));let closing=false;const close=async()=>{if(closing)return;closing=true;await app.close();if(!local){const store=await getProductionGhostStore().catch(()=>null);await store?.close();}};process.on('SIGINT',()=>void close());process.on('SIGTERM',()=>void close());}
}
