// Public, immutable room contract. No inventory, damage, identity or save data travels here.
export const MAX_PEERS=32;
export const MAX_ROOMS=32;
export const MAX_PAYLOAD=2048;
export const PRESENCE_TTL=15000;
export const GHOST_MANIFEST=Object.freeze({v:2,room:'afterlight',seed:20261018,worldVersion:'coast-1',epochMs:Date.UTC(2026,9,18),baseMinutes:480,clockRate:1.2,maxPeers:MAX_PEERS,maxRooms:MAX_ROOMS});
export const GHOST_VEHICLES=Object.freeze(['foot','bike','motorcycle','car','horse','swim']);
const poseKeys=new Set(['type','seq','x','y','angle','space','vehicle','model','tone','paused']);
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const finite=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
export function validSpace(space){return space==='outdoor'||typeof space==='string'&&/^home:[A-Za-z0-9_-]{1,48}:[0-9]{1,2}$/.test(space);}
export function validatePose(message){
 if(!object(message)||message.type!=='pose'||Object.keys(message).some(key=>!poseKeys.has(key)))return null;
 if(!integer(message.seq,0,2147483647)||!finite(message.x,0,512)||!finite(message.y,0,512)||!finite(message.angle,-1000,1000)||!validSpace(message.space)||!GHOST_VEHICLES.includes(message.vehicle)||!integer(message.model,0,13)||!integer(message.tone,0,3)||typeof message.paused!=='boolean')return null;
 return {seq:message.seq,x:Math.round(message.x*1000)/1000,y:Math.round(message.y*1000)/1000,angle:Math.round(Math.atan2(Math.sin(message.angle),Math.cos(message.angle))*10000)/10000,space:message.space,vehicle:message.vehicle,model:message.model,tone:message.tone,paused:message.paused};
}
export function parseClientMessage(raw){
 if(typeof raw!=='string'||raw.length>MAX_PAYLOAD)return null;
 let value;try{value=JSON.parse(raw);}catch{return null;}
 if(!object(value))return null;
 if(value.type==='pose'){const pose=validatePose(value);return pose?{type:'pose',...pose}:null;}
 if(value.type==='ping'&&Object.keys(value).every(k=>k==='type'||k==='nonce')&&Number.isSafeInteger(value.nonce)&&value.nonce>=0)return {type:'ping',nonce:value.nonce};
 if(value.type==='bye'&&Object.keys(value).length===1)return {type:'bye'};
 return null;
}
export function makeWelcome(id,now=Date.now(),shard=0){return {type:'welcome',...GHOST_MANIFEST,id,shard,serverTime:now};}
export function roomInfo({enabled=true,reason,now=Date.now()}={}){return {...GHOST_MANIFEST,enabled,serverTime:now,socket:'/api/ghost-socket',...(reason?{reason}: {})};}
export function sharedWorldMinutes(serverTime){return GHOST_MANIFEST.baseMinutes+Math.max(0,(serverTime-GHOST_MANIFEST.epochMs)/1000)*GHOST_MANIFEST.clockRate;}
