import {createServer} from 'node:http';
import {createStaticServer} from '../server.mjs';
import {createMemoryGhostStore} from '../server/ghost-store.js';
import {attachGhostWebSockets,handleGhostRoom} from '../server/ghost-http.js';

// Explicitly local: never exported by an API function or used in production.
const store=createMemoryGhostStore({local:true}),getStore=async()=>store;
const staticServer=await createStaticServer({production:process.argv.includes('--dist')});
const server=createServer((req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 if(path==='/api/ghost-room'){void handleGhostRoom(req,res,getStore,{local:true});return;}
 staticServer.emit('request',req,res);
});
const sockets=attachGhostWebSockets(server,{getStore,local:true});
const port=Number(process.env.PORT||4178);
server.listen(port,'127.0.0.1',()=>console.log(`The Last Buyer local shared ghosts: http://localhost:${port} (one process, test progress only)`));
let closing=false;
async function close(){if(closing)return;closing=true;await sockets.close();await store.close();server.close();}
process.on('SIGINT',()=>{void close();});process.on('SIGTERM',()=>{void close();});
