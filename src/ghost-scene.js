// Ephemeral, presentation-only room effects and voluntary shared vehicle seats.
export const SCENE_TTL=15000,VEHICLE_TTL=30000,SCENE_LIMIT=96;
const id=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(s);
const n=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
export function validateSceneAction(m){
 if(!m||typeof m!=='object'||m.type!=='sceneAction'||!Number.isSafeInteger(m.nonce)||m.nonce<0)return null;
 if(m.action==='effect'&&Object.keys(m).every(k=>['type','nonce','action','kind','target','x','y','angle'].includes(k))&&['shot','hit','down','break'].includes(m.kind)&&id(m.target)&&!m.target.startsWith('ghost-')&&n(m.x,0,512)&&n(m.y,0,512)&&n(m.angle,-1000,1000))return {...m};
 if(['join','take','exit','withdraw'].includes(m.action)&&Object.keys(m).every(k=>['type','nonce','action','vehicleId'].includes(k))&&id(m.vehicleId))return {...m};
 if(m.action==='vehicle'&&Object.keys(m).every(k=>['type','nonce','action','vehicleId','vehicle','model','parked','x','y','angle'].includes(k))&&id(m.vehicleId)&&['car','motorcycle'].includes(m.vehicle)&&Number.isInteger(m.model)&&n(m.model,0,13)&&typeof m.parked==='boolean'&&n(m.x,0,512)&&n(m.y,0,512)&&n(m.angle,-1000,1000))return {...m};
 return null;
}
export const emptyScene=()=>({rev:0,effects:[],vehicles:[]});
export function pruneScene(scene,peers,now){const live=new Set(peers.map(p=>p.id));scene.effects=scene.effects.filter(e=>e.until>now);scene.vehicles=scene.vehicles.filter(v=>v.until>now&&live.has(v.owner));for(const v of scene.vehicles){v.riders=v.riders.filter(i=>live.has(i));if(v.driver&&!live.has(v.driver))v.driver=null;}return scene;}
export function reduceScene(input,peers,who,m,now){
 const scene=pruneScene(structuredClone(input||emptyScene()),peers,now),p=peers.find(p=>p.id===who),deny=reason=>({scene,ok:false,reason});if(!p||p.paused)return deny('not_ready');
 const near=(q,r=4)=>q.space===p.space&&Math.hypot(q.x-p.x,q.y-p.y)<=r;
 if(m.action==='effect'){if(!near({...m,space:p.space},65))return deny('too_far');scene.effects.push({id:who+'-'+m.nonce,owner:who,kind:m.kind,target:m.target,x:m.x,y:m.y,angle:m.angle,space:p.space,at:now,until:now+(m.kind==='shot'?900:SCENE_TTL)});scene.effects=scene.effects.slice(-SCENE_LIMIT);}
 else if(m.action==='vehicle'){
  let v=scene.vehicles.find(v=>v.id===m.vehicleId);if(v&&v.owner!==who)return deny('not_owner');if(!near({...m,space:p.space},8))return deny('too_far');if(!m.parked&&(p.vehicle!==m.vehicle||p.model!==m.model))return deny('pose_mismatch');
  if(!v){if(m.vehicleId!==who||scene.vehicles.some(v=>v.owner===who))return deny('vehicle_limit');v={id:m.vehicleId,owner:who,riders:[]};scene.vehicles.push(v);}
  Object.assign(v,{vehicle:m.vehicle,model:m.model,x:m.x,y:m.y,angle:m.angle,space:p.space,driver:m.parked?null:who,until:now+VEHICLE_TTL});if(m.parked)v.riders=[];
 }else{
  const v=scene.vehicles.find(v=>v.id===m.vehicleId);if(!v)return deny('expired');const driver=peers.find(p=>p.id===v.driver),location=driver||v;
  if(m.action==='exit'){v.riders=v.riders.filter(i=>i!==who);}
  else if(m.action==='withdraw'){if(v.owner!==who)return deny('not_owner');scene.vehicles=scene.vehicles.filter(x=>x!==v);}
  else if(!near(location))return deny('too_far');
  else if(m.action==='join'){if(!v.driver||v.owner===who||p.vehicle!=='foot'||scene.vehicles.some(x=>x.riders.includes(who)))return deny('not_available');if(v.riders.length>=(v.vehicle==='car'?3:1))return deny('full');v.riders.push(who);}
  else if(m.action==='take'){if(v.driver||v.riders.length||v.owner===who||p.vehicle!=='foot')return deny('occupied');scene.vehicles=scene.vehicles.filter(x=>x.owner!==who);v.owner=who;v.driver=who;v.until=now+VEHICLE_TTL;}
 }
 scene.rev++;return {scene,ok:true};
}
// Strict server-frame validation; never deserialize arbitrary gameplay state.
export function validScene(s,now){return !!s&&Number.isSafeInteger(s.rev)&&s.rev>=0&&Array.isArray(s.effects)&&s.effects.length<=SCENE_LIMIT&&Array.isArray(s.vehicles)&&s.vehicles.length<=200&&s.effects.every(e=>id(e.owner)&&typeof e.id==='string'&&e.id.length<90&&['shot','hit','down','break'].includes(e.kind)&&id(e.target)&&n(e.x,0,512)&&n(e.y,0,512)&&n(e.angle,-1000,1000)&&n(e.until,now-30000,now+SCENE_TTL)&&typeof e.space==='string')&&s.vehicles.every(v=>id(v.id)&&id(v.owner)&&(v.driver===null||id(v.driver))&&['car','motorcycle'].includes(v.vehicle)&&Number.isInteger(v.model)&&n(v.model,0,13)&&n(v.x,0,512)&&n(v.y,0,512)&&n(v.angle,-1000,1000)&&n(v.until,now-30000,now+VEHICLE_TTL)&&Array.isArray(v.riders)&&v.riders.length<=(v.vehicle==='car'?3:1)&&new Set(v.riders).size===v.riders.length&&v.riders.every(id)&&typeof v.space==='string');}
