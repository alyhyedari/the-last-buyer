import {MYTH_BOSSES} from './frontier-myth-data.js';
import {hash,earn} from './frontier-state.js';
import {canStand,moveInWorld,clearSight,nearestOpen,localRoute} from './frontier-world.js';
import {actorWithHealth,damageActor,hurtPlayer,bulletSight} from './frontier-combat.js';
import {hasBuy,hasGme,lightRange} from './frontier-perks.js';
import {FOREST_COINS} from './frontier-forest-data.js';
export {MYTH_BOSSES};
export function uvTouches(f,world,point){if(f.life.forest.light!=='uv'||!f.life.forest.uvOwned)return false;const dx=point.x-f.x,dy=point.y-f.y,a=Math.atan2(dy,dx)-f.angle;return Math.hypot(dx,dy)<lightRange(f)&&Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.55&&bulletSight(world,f,point);}
export function revealUvSeals(f,world){if(world.interior||f.life.expanse.swimming)return[];const q=f.life.forest,opened=[];for(const coin of FOREST_COINS)if(coin.uv&&!q.opened.includes(coin.id)&&uvTouches(f,world,coin)){q.opened.push(coin.id);opened.push(coin.id);}return opened;}
export function mythActors(world,f,time){
 if(world.interior)return[];const list=[],memory=world.myth??=new Map();
 for(const b of MYTH_BOSSES){if(Math.hypot(b.x-f.x,b.y-f.y)>45)continue;const id='boss-'+b.id,saved=f.life.combat.actors[id];
  if(saved?.hp===0){if(!f.life.forest.gme.includes(b.id))list.push({id:'gme-'+b.id,kind:'gmeCoin',x:saved.x,y:saved.y,height:.35,boss:b.id,variant:b.variant});continue;}
  let p=memory.get(id);if(!p){const start=saved&&canStand(world,saved.x,saved.y,.4)?saved:b;p={x:start.x,y:start.y,next:f.minutes+3,windup:0,tx:0,ty:0,pattern:0,path:[],repath:0};memory.set(id,p);}
  list.push(actorWithHealth(f,{id,kind:b.kind,x:p.x,y:p.y,variant:b.variant,boss:true,hostile:true,winding:!!p.windup,weak:uvTouches(f,world,p),height:b.id==='tide'?.3:0}));
  if(p.windup){const points=b.attack==='thunderfall'?[-4,0,4]:[0];for(const offset of points)list.push({id:'omen-'+b.id+'-'+offset,kind:'mythOmen',x:p.tx+offset,y:p.ty,variant:b.variant,height:0});}
 }
 // Persistent, seeded wildlife-like myths; only nearby packs enter the actor list.
 for(let i=0;i<72;i++){const x=140+hash(f.seed,33000+i)*233,y=196+hash(f.seed,34000+i)*179;if(Math.hypot(x-f.x,y-f.y)>30||MYTH_BOSSES.some(b=>Math.hypot(x-b.x,y-b.y)<16))continue;const id='myth-'+i,kind=['wisp','briar','moth'][i%3],hunters=world.hunters??=new Map();let p=hunters.get(id);if(!p){const saved=f.life.combat.actors[id],point=nearestOpen(world,saved||{x,y},.25);p={...point,id,kind,path:[],repath:0,nextAttack:0,alert:false};hunters.set(id,p);}list.push(actorWithHealth(f,{id,kind,x:p.x,y:p.y,hostile:true,variant:i%3,height:kind==='moth'?.6:0}));}
 return list;
}
export function updateMyths(state,world,dt){
 const f=state.frontier,out=[];if(world.interior||f.life.expanse.swimming)return out;
 for(const b of MYTH_BOSSES){const id='boss-'+b.id,p=world.myth?.get(id),hp=f.life.combat.actors[id]?.hp??b.hp;if(!p||hp<=0)continue;if(Math.hypot(f.x-p.x,f.y-p.y)<1){const a=Math.atan2(p.y-f.y,p.x-f.x)||f.angle;moveInWorld(world,p,Math.cos(a)*1.25,Math.sin(a)*1.25,.4);}const d=Math.hypot(f.x-p.x,f.y-p.y),enraged=hp<b.hp*.45;
  if(d>(hp<b.hp?42:25)){p.windup=0;continue;}
  if(p.windup){if(f.minutes<p.windup)continue;p.windup=0;p.next=f.minutes+(enraged?3.3:4.5);const targetDistance=Math.hypot(f.x-p.tx,f.y-p.ty);let hit=false;
   if(b.attack==='ring')hit=d<6&&d>2;else if(b.attack==='eclipse')hit=d<3||d>6&&d<10;else if(b.attack==='thunderfall')hit=[-4,0,4].some(offset=>Math.hypot(f.x-p.tx-offset,f.y-p.ty)<2.2);else if(b.attack==='fan'){const a=Math.atan2(f.y-p.y,f.x-p.x)-Math.atan2(p.ty-p.y,p.tx-p.x);hit=d<13&&Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.45;}else hit=targetDistance<(b.attack==='charge'?2.2:2.8);
   if(b.attack==='charge'){const dx=p.tx-p.x,dy=p.ty-p.y,length=Math.hypot(dx,dy),travel=Math.min(Math.max(0,length-1.25),5);if(length)moveInWorld(world,p,dx/length*travel,dy/length*travel,.4);}
   (world.effects??=[]).push({kind:'sparks',x:p.tx,y:p.ty,age:0,ttl:.8,seed:b.variant});if(hit&&clearSight(world,p,f)){const died=hurtPlayer(state,b.damage*(enraged?1.15:1));out.push({kind:died?'died':'attacked',victim:b.kind});if(died)break;}continue;
  }
  if(d<16&&f.minutes>=p.next&&clearSight(world,p,f)){p.windup=f.minutes+(enraged?1.15:1.65);p.tx=f.x;p.ty=f.y;p.pattern++;out.push({kind:'mythWarning',boss:b.id,attack:b.attack});continue;}
  if(d>4){if(f.minutes>=p.repath){const nextPath=localRoute(world,p,f,.4);if(nextPath!==null){p.path=nextPath;p.repath=f.minutes+2;}}while(p.path.length&&Math.hypot(p.x-p.path[0].x,p.y-p.path[0].y)<.2)p.path.shift();const goal=p.path[0];if(goal){const a=Math.atan2(goal.y-p.y,goal.x-p.x);moveInWorld(world,p,Math.cos(a)*dt*b.speed,Math.sin(a)*dt*b.speed,.4);}}
  const saved=f.life.combat.actors[id];if(saved){saved.x=p.x;saved.y=p.y;}
 }
 return out;
}
export function collectGme(state,world,actor){
 const f=state.frontier,q=f.life.forest,b=MYTH_BOSSES.find(b=>b.id===actor?.boss),record=b&&f.life.combat.actors['boss-'+b.id];
 if(!b||!record||record.hp!==0||q.gme.includes(b.id)||world.interior||f.mounted||Math.hypot(record.x-f.x,record.y-f.y)>2.4||!clearSight(world,f,record))return false;
 q.gme.push(b.id);earn(state,250+b.variant*100);f.life.health=100;f.energy=100;return true;
}
export function tickForestPerks(state,world,actors){
 const f=state.frontier,q=f.life.forest;if(f.minutes<q.regenAt||world.interior)return;q.regenAt=f.minutes+14.4;
 if((hasBuy(f,19)||hasGme(f,'void'))&&!actors.some(a=>a.hostile&&!a.dead&&Math.hypot(a.x-f.x,a.y-f.y)<15))f.life.health=Math.min(100,f.life.health+(hasGme(f,'void')?4:1));
}
export function echoShock(state,world,actors){if(!hasBuy(state.frontier,30))return;for(const actor of actors)if(actor.hostile&&!actor.dead&&!actor.boss&&Math.hypot(actor.x-state.frontier.x,actor.y-state.frontier.y)<8&&clearSight(world,state.frontier,actor))damageActor(state,world,actor,60,{crime:false});}
