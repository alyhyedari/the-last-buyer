import {findOpen,trafficAt} from './frontier-world.js';
import {crewActors} from './passengers.js';
import {CYBER_COMPANIONS} from './cyber-state.js';
import {challengeFor} from './neon-challenges.js';
import {gameHour,gameDay,hash,earn,transact,advanceTime} from './frontier-state.js';
import {NEON_CAST,NEON_QUESTS} from './neon-data.js';
import {canStand,clearSight,nearestOpen,localRoute,moveInWorld} from './frontier-world.js';
import {CAR_MODELS} from './frontier-cars.js';
import {actorWithHealth,damageActor} from './frontier-combat.js';
export const neonDistrict=(x,y)=>x<198?'county':y>119?'waterfront':x<258?'aurora':x<314?'copper':'heights';
export function districtMode(f,x=f.x,y=f.y){const n=f.life.neon;if(f.minutes<n.reliefUntil)return'prosperity';if(n.mode!=='auto')return n.mode;if(neonDistrict(x,y)==='county')return'prosperity';const shift={aurora:0,copper:1,heights:2,waterfront:3}[neonDistrict(x,y)],cycle=(Math.floor(f.minutes/720)+shift+(f.seed%5))%8;return n.stability>=5?'prosperity':cycle===7?'conflict':cycle>=4?'inflation':'prosperity';}
export const priceFactor=f=>({prosperity:1,inflation:1.35,conflict:1.6})[districtMode(f)];
export const supplyQuote=(state,cost)=>Math.max(1,Math.round(cost*priceFactor(state.frontier)));
export function beginNeonQuest(f,id){if(f.life.neon.quest||f.life.neon.completed.includes(id)||!NEON_QUESTS.some(q=>q.id===id))return false;f.life.neon.quest={id,step:0};return true;}
export function questPoint(f){const active=f.life.neon.quest,q=NEON_QUESTS.find(q=>q.id===active?.id);return q?{...q.steps[active.step],id:q.id,step:active.step}:null;}
export function finishNeonStep(state,world,answer=null){const f=state.frontier,n=f.life.neon,p=questPoint(f);if(!p||world.interior||f.mounted||Math.hypot(f.x-p.x,f.y-p.y)>2.6||!clearSight(world,f,p))return null;if(p.condition==='night'&&gameHour(f)>=6&&gameHour(f)<19)return'waitNight';
 const challenge=challengeFor(p.id,p.step);if(challenge&&answer!==challenge.answer)return'challenge';
 const q=NEON_QUESTS.find(q=>q.id===p.id);n.quest.step++;if(n.quest.step<q.steps.length)return'next';n.completed.push(q.id);n.quest=null;earn(state,q.reward);n.stability=Math.min(9,n.stability+1);if(q.id==='evacuation')n.reliefUntil=f.minutes+1440;return'complete';
}
export function buySpecialCar(state,index,world=null){const f=state.frontier,e=f.life.expanse,p=CAR_MODELS[index],parking=world?findOpen(world,{x:f.x+1.2*Math.cos(f.angle),y:f.y+1.2*Math.sin(f.angle)},.48,{avoid:[{x:f.x,y:f.y,radius:.22},...trafficAt(world,f.minutes).filter(a=>!e.taken.includes(a.id))]}):f;if(!parking||!p||f.mounted||e.swimming||f.life.combat.interior||f.life.combat.arena||!transact(state,supplyQuote(state,p.cost)))return false;
 if(!state.village.vehicles.includes('car'))state.village.vehicles.push('car');state.village.vehicle='car';for(const owned of [e.carModel,index])if(!f.life.cyber.owned.includes(owned))f.life.cyber.owned.push(owned);e.carModel=index;e.carHealth=100;e.parked={x:parking.x,y:parking.y,angle:f.angle};return true;
}
export function canMeet(f){return!f.mounted&&!f.life.expanse.swimming&&!f.life.combat.interior&&!f.life.combat.arena&&f.minutes>=Math.max(f.soberAt,f.life.impairedUntil)&&f.life.heat<20&&gameHour(f)>=7&&gameHour(f)<19;}
export function inviteNeon(state,id){const f=state.frontier,n=f.life.neon,p=NEON_CAST.find(c=>c.id===id);if(!['mira','arin',...CYBER_COMPANIONS].includes(id)||!p||!canMeet(f)||Math.hypot(p.x-f.x,p.y-f.y)>3||n.completed.length<1)return false;n.companion=id;n.bond=Math.max(n.bond,Math.min(6,n.completed.length));return true;}
export function dateNeon(state,id){const f=state.frontier,n=f.life.neon,p=NEON_CAST.find(c=>c.id===id);if(!p||n.companion!==id||n.bond<2||!canMeet(f)||Math.hypot(p.x-f.x,p.y-f.y)>3||n.dateDay===gameDay(f))return false;n.dateDay=gameDay(f);n.bond=Math.min(6,n.bond+1);advanceTime(f,90);f.energy=Math.min(100,f.energy+20);return true;}
export function neonActors(world,f,time){
 if(world.interior)return[];const actors=[],night=gameHour(f)<6||gameHour(f)>=19;
 for(const base of NEON_CAST){if(f.life.cyber.passengers.includes(base.id))continue;const c={...base,...f.life.cyber.dropoffs[base.id]};if(Math.hypot(c.x-f.x,c.y-f.y)>42||c.night&&!night)continue;const walk=c.kind==='neonEcho'?Math.sin(time*.6+c.variant)*.65:0;actors.push({...c,x:canStand(world,c.x+walk,c.y,.2)?c.x+walk:c.x,y:c.y,peaceful:true,variant:c.variant*2+(c.id==='chaplin'&&Math.sin(time*3)>0?1:0)});}
 const companion=f.life.neon.companion;if(companion&&!f.life.cyber.passengers.includes(companion)&&!f.mounted&&!f.life.expanse.swimming){
  const spawn=Array.from({length:8},(_,i)=>({x:f.x+Math.cos(f.angle+Math.PI+i*Math.PI/4)*1.6,y:f.y+Math.sin(f.angle+Math.PI+i*Math.PI/4)*1.6})).find(p=>canStand(world,p.x,p.y,.2)&&clearSight(world,f,p));const m=world.neonCompanion??={...(spawn||f),at:time,next:0,path:[]},dt=Math.max(0,Math.min(.1,time-m.at));m.at=time;
  if(Math.hypot(m.x-f.x,m.y-f.y)>2){if(time>=m.next){const path=localRoute(world,m,f,.2);if(path!==null){m.path=path;m.next=time+1.5;}}
   while(m.path.length&&Math.hypot(m.x-m.path[0].x,m.y-m.path[0].y)<.12)m.path.shift();const g=m.path[0];if(g){const d=Math.hypot(g.x-m.x,g.y-m.y),step=Math.min(d,dt*3.2);if(d)moveInWorld(world,m,(g.x-m.x)/d*step,(g.y-m.y)/d*step,.2);}
  }actors.push({id:'neon-companion',kind:'neonEcho',variant:(NEON_CAST.find(c=>c.id===companion)?.variant||0)*2,x:m.x,y:m.y,peaceful:true});
 }else world.neonCompanion=null;
 const p=questPoint(f);if(p&&Math.hypot(f.x-p.x,f.y-p.y)<45)actors.push({...p,id:'neon-quest',kind:'neonBeacon',peaceful:true,height:.4});
 const district=neonDistrict(f.x,f.y);if(district!=='county'&&districtMode(f)==='conflict'&&!world.arena){
  const anchor={aurora:[230.5,90.5],copper:[286.5,90.5],heights:[342.5,90.5],waterfront:[286.5,142.5]}[district],hunters=world.hunters??=new Map();
  if(Math.hypot(f.x-anchor[0],f.y-anchor[1])<48)for(let i=0;i<6;i++){const id='raid-'+gameDay(f)+'-'+district+'-'+i;let m=hunters.get(id);if(!m){const start=nearestOpen(world,{x:anchor[0]+(i%3-1)*3,y:anchor[1]+Math.floor(i/3)*4},.25);m={...start,id,kind:'sentinel',path:[],repath:0,nextAttack:0,alert:false,lastSeen:0};hunters.set(id,m);}actors.push(actorWithHealth(f,{id,kind:'sentinel',x:m.x,y:m.y,hostile:true,variant:i%3,raid:true}));}
 }
 // Never leave stale raid AI active outside its scheduled district.
 const active=new Set(actors.filter(a=>a.raid).map(a=>a.id));for(const [id,m]of world.hunters||[])if(id.startsWith('raid-')&&!active.has(id)){m.alert=false;m.windup=0;if(!id.startsWith('raid-'+gameDay(f)+'-'))world.hunters.delete(id);}
 return [...actors,...crewActors(world,f,time)];
}
export function tickStreetLife(state,world,actors,time){const f=state.frontier;if(world.interior||world.arena||time<(world.nextStreetEvent||0))return;world.nextStreetEvent=time+4;
 const mood=districtMode(f);if(mood==='prosperity')return;const adults=actors.filter(a=>a.kind==='resident'&&!a.dead&&!a.peaceful&&Math.hypot(a.x-f.x,a.y-f.y)<25);if(adults.length<2)return;
 const a=adults[Math.floor(hash(f.seed,Math.floor(f.minutes/8))*adults.length)],b=adults.find(b=>b!==a&&Math.hypot(a.x-b.x,a.y-b.y)<3);if(!b)return;
 world.panic={x:a.x,y:a.y,until:f.minutes+3};if(mood==='conflict'){damageActor(state,world,b,8,{crime:false});const e=world.effects?.at(-1);if(e)e.kind='sparks';}
 else(world.effects??=[]).push({kind:'sparks',x:a.x,y:a.y,age:0,ttl:.4,seed:2});
}
