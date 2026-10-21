import {createServer} from 'node:http';
import {WebSocketServer} from 'ws';
import {MAX_PAYLOAD,MAX_ROOMS,roomInfo} from '../src/ghost-protocol.js';
import {allowedGhostOrigin} from './ghost-security.js';
import {createGhostHub} from './ghost-hub.js';

export const JSON_HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function ghostRoomResponse(getStore,{now=Date.now()}={}){
 try{const store=await getStore(),enabled=Boolean(store?.healthy());return {status:enabled?200:503,body:roomInfo({enabled,reason:enabled?undefined:store?'unavailable':'not_configured',now})};}
 catch{return {status:503,body:roomInfo({enabled:false,reason:'unavailable',now})};}
}
export async function handleGhostRoom(req,res,getStore,{local=false}={}){
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{...JSON_HEADERS,Allow:'GET, HEAD'});res.end();return;}
 if(req.headers.origin&&!allowedGhostOrigin(req.headers.origin,req.headers.host,{local})){res.writeHead(403,JSON_HEADERS);res.end(JSON.stringify({error:'origin'}));return;}
 const {status,body}=await ghostRoomResponse(getStore);if(local)body.localOnly=true;res.writeHead(status,JSON_HEADERS);res.end(req.method==='HEAD'?undefined:JSON.stringify(body));
}
export function attachGhostWebSockets(server,{getStore,local=false,rotationMs=240000,matchmaking=true}={}){
 const wss=new WebSocketServer({noServer:true,maxPayload:MAX_PAYLOAD,perMessageDeflate:false,clientTracking:false});
 let currentStore=null,hub=null,pending=0,setup=Promise.resolve();
 const ensureHub=store=>{const result=setup.then(async()=>{if(currentStore!==store){if(hub)await hub.close();currentStore=store;hub=createGhostHub(store,{rotationMs,matchmaking});}return hub;});setup=result.catch(()=>{});return result;};
 server.on('upgrade',async(req,socket,head)=>{
  socket.on('error',()=>{});
  const reject=(code,message)=>{if(!socket.destroyed){socket.end(`HTTP/1.1 ${code} ${message}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);}};
  let path,preferredRoom=null;try{const url=new URL(req.url,'http://localhost');path=url.pathname;if(url.searchParams.has('room')){const raw=url.searchParams.get('room');if(!/^(0|[1-9]\d?)$/.test(raw)||Number(raw)>=MAX_ROOMS){reject(400,'Bad Request');return;}preferredRoom=Number(raw);}}catch{reject(400,'Bad Request');return;}
  if(path!=='/api/ghost-socket'){reject(404,'Not Found');return;}
  if(!allowedGhostOrigin(req.headers.origin,req.headers.host,{local})){reject(403,'Forbidden');return;}
  if(pending>=40){reject(503,'Service Unavailable');return;}pending++;
  try{
   const store=await getStore();
   if(!store?.healthy()){reject(503,'Service Unavailable');return;}
   const target=await ensureHub(store);
   if(socket.destroyed)return;
   wss.handleUpgrade(req,socket,head,ws=>{void target.attach(ws,{preferredRoom});});
  }catch{reject(503,'Service Unavailable');}
  finally{pending--;}
 });
 return {stats(){return hub?.stats()||{connections:0,rooms:0};},async close(){await setup;await hub?.close();wss.close();}};
}
export function createGhostHttpServer({getStore,local=false,rotationMs,matchmaking}={}){
 const server=createServer((req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/api/ghost-room'){void handleGhostRoom(req,res,getStore,{local});return;}
  res.writeHead(426,{...JSON_HEADERS,Upgrade:'websocket'});res.end(JSON.stringify({error:'WebSocket upgrade required'}));
 });
 const ghosts=attachGhostWebSockets(server,{getStore,local,rotationMs,matchmaking});
 server.on('close',()=>{void ghosts.close();});
 return server;
}
