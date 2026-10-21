import {GHOST_VEHICLES,MAX_PEERS} from './ghost-protocol.js';
// Version 2 compact frames omit repeated field names. Validation stays in the
// client after decoding, so compact input never bypasses pose checks.
export function packSnapshot(peers,serverTime){return{type:'frame',serverTime,peers:peers.map(p=>[p.id,p.seq,p.x,p.y,p.angle,p.space==='outdoor'?0:p.space,GHOST_VEHICLES.indexOf(p.vehicle),p.model,p.tone,p.paused?1:0,p.at-serverTime])};}
export function unpackSnapshot(message){
 if(message?.type!=='frame')return message;
 if(Object.keys(message).some(k=>!['type','serverTime','peers'].includes(k))||!Array.isArray(message.peers)||message.peers.length>MAX_PEERS)return null;
 const peers=[];for(const p of message.peers){if(!Array.isArray(p)||p.length!==11||!Number.isInteger(p[6])||p[6]<0||p[6]>=GHOST_VEHICLES.length||![0,1].includes(p[9])||!Number.isFinite(p[10])||p[10]<-30000||p[10]>1000)return null;peers.push({id:p[0],seq:p[1],x:p[2],y:p[3],angle:p[4],space:p[5]===0?'outdoor':p[5],vehicle:GHOST_VEHICLES[p[6]],model:p[7],tone:p[8],paused:p[9]===1,at:message.serverTime+p[10]});}
 return{type:'snapshot',serverTime:message.serverTime,peers};
}
