import {tunedProfile} from './cyber-systems.js';
import {VEHICLES} from './frontier-state.js';
import {districtMode} from './neon-world.js';
import {hasBuy,hasGme} from './frontier-perks.js';
import {hash,gameHour,earn,advanceTime} from './frontier-state.js';
import {LAKES,canStand,moveInWorld,tileAt,localRoute,nearestOpen,trafficAt} from './frontier-world.js';

import {CAR_MODELS} from './frontier-cars.js';
export {CAR_MODELS};
export const isScenery=s=>['warSandbag','tree','trafficCar','trafficBike','trafficMotor','bench','streetlamp','sign','laundry','crystal','relic'].includes(s.kind);
export function restoreScenery(world,f){restoreBuildingAccess(world,f);const destroyed=new Set(Object.entries(f.life.combat.actors).filter(([,a])=>a.hp===0).map(([id])=>id).concat(f.life.expanse.taken));world.colliders=(world.colliders||[]).filter(c=>!destroyed.has(c.id));world.buckets=new Map();for(const c of world.colliders){const k=Math.floor(c.x)+','+Math.floor(c.y);if(!world.buckets.has(k))world.buckets.set(k,[]);world.buckets.get(k).push(c);}world.routeEdges?.clear();world.spatialCollision=true;}
export function drivingStep(motion,{dt,turn=0,speed=0,wet=false,model=0,health=100,brake=false,profile:customProfile=null}){const profile=customProfile||CAR_MODELS[model]||CAR_MODELS[0],grip=profile.grip*(wet?.63:1)*(.65+health*.0035),rate=dt*(brake?5:3.7);motion.steering=(motion.steering||0)+(turn-(motion.steering||0))*Math.min(1,rate);const understeer=1/(1+Math.abs(speed)*.055);motion.slip=(motion.slip||0)+((1-grip)*motion.steering*Math.abs(speed)*.12-(motion.slip||0))*Math.min(1,dt*2);if(!profile.engine){motion.gear=speed<-.1?-1:Math.max(1,Math.min(5,1+Math.floor(Math.abs(speed)/2.1)));motion.rpm=900+Math.abs(speed)*310/(Math.max(1,motion.gear)*.6)+Math.abs(turn)*150;}return motion.steering*dt*1.65*Math.min(1,Math.abs(speed)/1.5)*Math.sign(speed)*understeer;}
export function damageCar(state,amount){const f=state.frontier,e=f.life.expanse;e.carHealth=Math.max(0,e.carHealth-Math.max(0,amount)*tunedProfile(state,VEHICLES.car).armor*(hasBuy(f,21)?.75:1));if(e.carHealth===0){f.mounted=false;e.parked={x:f.x,y:f.y,angle:f.angle};}return e.carHealth;}
export function parkCar(state,heading){const f=state.frontier;f.life.expanse.parked={x:f.x,y:f.y,angle:heading??f.life.vehicleYaw??f.angle};}
// Separate touching bodies through the same swept collision path as walking.
// Never search for an open tile across a wall when traffic touches the player.
export function separateVehicle(world,position,car,radius){
 const dx=position.x-car.x,dy=position.y-car.y,d=Math.hypot(dx,dy),overlap=radius+(car.radius||.55)+.05-d;
 if(overlap<=0)return 0;
 const a=d>.001?Math.atan2(dy,dx):(car.angle||0)+Math.PI/2,step=Math.min(.5,overlap);
 return moveInWorld(world,position,Math.cos(a)*step,Math.sin(a)*step,radius);
}
export function stealCar(state,actor){const f=state.frontier,e=f.life.expanse;if(f.mounted||e.swimming||actor.kind!=='trafficCar'||actor.dead||actor.id==='parked-car'||!actor.id||e.taken.includes(actor.id)||e.taken.length>=64||Math.hypot(f.x-actor.x,f.y-actor.y)>2.6)return false;
 e.taken.push(actor.id);e.carModel=(actor.model||0)%CAR_MODELS.length;e.carHealth=Math.max(8,(actor.hp??300)/300*100);e.parked=null;state.village.vehicle='car';if(!state.village.vehicles.includes('car'))state.village.vehicles.push('car');f.mounted=true;f.x=actor.x;f.y=actor.y;f.angle=actor.angle??f.angle;f.life.vehicleYaw=f.angle;f.life.crimes++;f.life.heat=Math.min(100,f.life.heat+38);f.life.debts=Math.min(99999,f.life.debts+90);state.village.reputation=Math.max(-9,state.village.reputation-2);return true;
}
export function crowdPosition(world,s,f,time){const mood=districtMode(f,s.x,s.y),population=(mood==='conflict'?.25:mood==='inflation'?.7:1)*(gameHour(f)>=21||gameHour(f)<6?0:gameHour(f)>=18?.4:1);if(!world.interior&&(!population||population<1&&s.phase>Math.PI*2*population))return null;const people=world.people??=new Map();let p=people.get(s.id);if(!p){p={...nearestOpen(world,s,.2),at:time,next:0,path:[]};people.set(s.id,p);}const dt=Math.min(.1,Math.max(0,time-p.at));p.at=time;const panic=world.panic&&world.panic.until>f.minutes&&Math.hypot(p.x-world.panic.x,p.y-world.panic.y)<16;
 if(time>p.next||panic&&!p.panic){const a=panic?Math.atan2(p.y-world.panic.y,p.x-world.panic.x):hash(f.seed,Math.floor(time/14)+Math.round(s.phase*60))*Math.PI*2;const radius=world.interior?1.1:panic?5:2.5;let goal={x:(s.homeX??s.x)+Math.cos(a)*radius,y:(s.homeY??s.y)+Math.sin(a)*radius};if(panic)goal={x:p.x+Math.cos(a)*radius,y:p.y+Math.sin(a)*radius};const nextPath=localRoute(world,p,goal,.2);if(nextPath!==null){p.path=nextPath;p.next=time+(panic?1.5:8+s.phase);}}
 p.panic=!!panic;while(p.path.length&&Math.hypot(p.x-p.path[0].x,p.y-p.path[0].y)<.1)p.path.shift();const next=p.path[0];if(next&&dt){const d=Math.hypot(next.x-p.x,next.y-p.y),step=Math.min(d,dt*(panic?2.2:.45+(s.variant||0)%3*.13));moveInWorld(world,p,(next.x-p.x)/d*step,(next.y-p.y)/d*step,.2);}return{...s,x:p.x,y:p.y,panic:!!panic,variant:(s.variant||0)%12};
}
export function enterWater(state,world){const f=state.frontier,e=f.life.expanse;if(f.mounted||world.interior||e.swimming)return false;const lake=LAKES.find(l=>Math.hypot(f.x-l.shore.x,f.y-l.shore.y)<5||l.id==='mirrorwater'&&Math.hypot(f.x-47.5,f.y-23.5)<3);if(!lake)return false;e.shore={x:f.x,y:f.y};e.swimming=true;e.depth=0;e.oxygen=100;const entry=lake.id==='mirrorwater'&&f.x<50?{x:47.5,y:21.5}:lake.entry;f.x=entry.x;f.y=entry.y;f.life.pitch=0;return true;}
export function leaveWater(state,world){const f=state.frontier,e=f.life.expanse;if(!e.swimming||!e.shore)return false;const lake=LAKES.find(l=>tileAt(world,f.x,f.y)===3&&Math.hypot((f.x-l.x)/l.rx,(f.y-l.y)/l.ry)<1.3);if(lake&&Math.hypot(f.x-e.shore.x,f.y-e.shore.y)>Math.max(9,Math.hypot(lake.entry.x-e.shore.x,lake.entry.y-e.shore.y)+.5))return false;Object.assign(f,e.shore);e.swimming=false;e.depth=0;e.oxygen=100;return true;}
export function moveSwimmer(world,f,dx,dy){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.1));for(let i=0;i<steps;i++){for(const axis of ['x','y']){const nx=f.x+(axis==='x'?dx/steps:0),ny=f.y+(axis==='y'?dy/steps:0),tile=tileAt(world,nx,ny);if(tile===3)f[axis]=axis==='x'?nx:ny;}}}
export function waterActors(world,f,time){if(!f.life.expanse.swimming)return[];const lake=LAKES.find(l=>Math.hypot((f.x-l.x)/l.rx,(f.y-l.y)/l.ry)<1.5);if(!lake)return[];const list=[];for(let i=0;i<50;i++){const a=hash(f.seed,i+9301)*6.28,r=.25+hash(f.seed,i+9340)*.6,x=lake.x+Math.cos(a+time*.025)*lake.rx*r,y=lake.y+Math.sin(a+time*.025)*lake.ry*r;if(tileAt(world,x,y)===3)list.push({id:'fish-'+i,kind:i%9===0?'jellyfish':i%4===0?'turtle':'fish',x,y,height:.2+hash(f.seed,i+9410)*.8,variant:i%5});}
 for(let i=0;i<24;i++){const a=i*2.4,x=lake.x+Math.cos(a)*lake.rx*(.15+i/35),y=lake.y+Math.sin(a)*lake.ry*(.15+i/35);if(tileAt(world,x,y)===3)list.push({kind:i%3?'kelp':'coral',x,y,variant:i%3,height:-.2});}
 for(let i=0;i<4;i++){const id='dive-'+lake.id+'-'+i,a=i*1.5;list.push({id,kind:'sunkenCache',x:lake.x+Math.cos(a)*lake.rx*.4,y:lake.y+Math.sin(a)*lake.ry*.4,hidden:f.life.expanse.salvage.includes(id)});}return list.filter(s=>!s.hidden);
}
export function salvageCache(state,actor){const f=state.frontier,e=f.life.expanse;if(!e.swimming||e.depth<.45||actor.kind!=='sunkenCache'||e.salvage.includes(actor.id)||Math.hypot(f.x-actor.x,f.y-actor.y)>2)return false;e.salvage.push(actor.id);earn(state,65);return true;}
export function contactAlien(state,actor){const f=state.frontier,e=f.life.expanse;if(actor.dead||f.life.combat.actors[actor.id]?.hp===0||!['ufoFriend','mossling'].includes(actor.kind)||e.alienTrust<0||e.contacts.includes(actor.id)||Math.hypot(f.x-actor.x,f.y-actor.y)>4)return false;e.contacts.push(actor.id);e.alienTrust=Math.min(12,e.alienTrust+1);f.life.health=Math.min(100,f.life.health+15);earn(state,24);return true;}
export function smoke(state){const f=state.frontier,e=f.life.expanse;if(!e.cigarettes||e.swimming||f.mounted||f.minutes<e.smokeUntil)return false;e.cigarettes--;e.smoked++;e.smokeUntil=f.minutes+8;f.life.health=Math.max(1,f.life.health-2);return true;}
export function expanseActors(world,f,time){if(world.interior)return[];const e=f.life.expanse,list=[];if(e.parked)list.push({id:'parked-car',kind:'trafficCar',...e.parked,model:e.carModel,hp:e.carHealth*3,owned:true,dead:e.carHealth===0});return [...list,...waterActors(world,f,time)];}

// Breath uses elapsed seconds, not frame count or the accelerated world clock.
export function tickBreath(f,dt){const e=f.life.expanse;if(!e.swimming)return 0;const use=(hasBuy(f,11)?.75:1)*(hasGme(f,'tide')?.5:1);e.oxygen=Math.max(0,Math.min(100,e.oxygen+(e.depth>.45?-2.4*use:17)*Math.max(0,dt)));return e.oxygen===0&&e.depth>.45?dt:0;}

// Drivers yield to visible bodies instead of endlessly pushing a stopped player.
// A sudden entry inside the braking distance can still cause an impact.
export function trafficActors(world,f){
 const memory=world.trafficMemory??=new Map(),taken=f.life.expanse.taken,result=[];
 for(const vehicle of world.traffic||[]){if(taken.includes(vehicle.id))continue;let m=memory.get(vehicle.id);if(!m){m={delay:0,last:f.minutes};memory.set(vehicle.id,m);}const dt=Math.max(0,Math.min(.15,f.minutes-m.last));m.last=f.minutes;
  let car=trafficAt({traffic:[vehicle]},f.minutes-m.delay)[0];const saved=f.life.combat.actors[car.id];if(saved?.hp===0){result.push({...car,...saved,dead:true});continue;}
  const obstacles=[...result,...(f.life.expanse.swimming?[]:[f]),...(f.life.expanse.parked?[f.life.expanse.parked]:[]),...Array.from(world.people?.values()||[])];
  const obstacle=obstacles.find(o=>{const dx=o.x-car.x,dy=o.y-car.y,ahead=dx*Math.cos(car.angle)+dy*Math.sin(car.angle),side=Math.abs(-dx*Math.sin(car.angle)+dy*Math.cos(car.angle));return ahead>0&&ahead<3.4&&side<.9;});
  if(obstacle){m.delay+=dt;car=trafficAt({traffic:[vehicle]},f.minutes-m.delay)[0];car.stopped=true;}
  result.push(car);
 }
 return result;
}

export {LAKES};

import {restoreBuildingAccess} from './building-access.js';
