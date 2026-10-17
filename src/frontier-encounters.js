import {MYTH_BOSSES} from './frontier-myth-data.js';

export const bossPhase=(hp,max)=>hp<=max/3?3:hp<=max*2/3?2:1;
export const bossPattern=(boss,phase,turn)=>phase===1?boss.attack:({stag:['charge','ring','charge'],cinder:['ring','fan','ring'],tide:['fan','mark','eclipse'],clock:['mark','charge','mark'],storm:['thunderfall','ring','thunderfall'],void:['eclipse','fan','ring']}[boss.id])[(turn+(phase===3?1:0))%3];
export function releaseArena(f,world){f.life.combat.arena=null;if(world.arena){world.arena=null;world.routeEdges?.clear();}}
export function restoreArena(f,world){
 const id=f.life.combat.arena,b=MYTH_BOSSES.find(b=>b.id===id);if(!b||f.life.combat.actors['boss-'+id]?.hp===0){releaseArena(f,world);return;}
 world.arena={id:b.id,x:b.x,y:b.y,radius:9.1};world.routeEdges?.clear();
 if(Math.hypot(f.x-b.x,f.y-b.y)>8.5){f.x=b.x;f.y=b.y+6.5;f.angle=-Math.PI/2;}
}
export function syncArena(f,world){
 if(world.interior||f.life.expanse.swimming)return null;
 if(f.life.combat.arena){if(f.life.combat.actors['boss-'+f.life.combat.arena]?.hp===0){releaseArena(f,world);return{kind:'arenaOpened'};}if(!world.arena)restoreArena(f,world);return null;}
 const boss=MYTH_BOSSES.find(b=>f.life.combat.actors['boss-'+b.id]?.hp!==0&&Math.hypot(f.x-b.x,f.y-b.y)<7.4);
 if(!boss)return null;f.life.combat.arena=boss.id;world.arena={id:boss.id,x:boss.x,y:boss.y,radius:9.1};world.routeEdges?.clear();return{kind:'arenaSealed',boss:boss.id};
}
export function resetUnfinishedBosses(f,world){
 for(const b of MYTH_BOSSES){const id='boss-'+b.id;if((f.life.combat.actors[id]?.hp??0)>0)delete f.life.combat.actors[id];}
 f.life.combat.arena=null;f.life.combat.dodgeUntil=0;
 if(world){world.myth?.clear();world.arena=null;world.routeEdges?.clear();world.effects=[];world.projectiles=[];}
}
export function arenaActors(world){const a=world.arena;if(!a)return[];return Array.from({length:28},(_,i)=>{const angle=i*Math.PI/14;return{id:'arena-gate-'+i,kind:'fogGate',x:a.x+Math.cos(angle)*a.radius,y:a.y+Math.sin(angle)*a.radius,variant:i%3};});}

// Marks use the attack's actual geometry, so the player can learn safe spaces.
export function drawEncounterGround(renderer,f,horizon){
 const world=renderer.world,c=renderer.c,w=renderer.w,h=renderer.h,ca=Math.cos(f.angle),sa=Math.sin(f.angle);
 const project=p=>{const dx=p.x-f.x,dy=p.y-f.y,depth=dx*ca+dy*sa;return depth>.18?{x:w/2+(-dx*sa+dy*ca)/depth*w/1.4,y:horizon+h*.53/depth}:null;};
 const line=(points,color,closed=false)=>{c.strokeStyle=color;c.lineWidth=2;c.beginPath();let started=false;for(const p of points){const s=project(p);if(!s){started=false;continue;}if(started)c.lineTo(s.x,s.y);else c.moveTo(s.x,s.y);started=true;}if(closed&&points.every(p=>project(p)))c.closePath();c.stroke();};
 const circle=(x,y,r,color)=>line(Array.from({length:49},(_,i)=>({x:x+Math.cos(i*Math.PI/24)*r,y:y+Math.sin(i*Math.PI/24)*r})),color);
 if(world.arena)circle(world.arena.x,world.arena.y,8.9,'#93cabb88');
 for(const [id,p]of world.myth||[]){if(!p.windup)continue;const b=MYTH_BOSSES.find(b=>'boss-'+b.id===id),attack=p.attack||b.attack,color=p.phase===3?'#ef987eb8':'#d6c797a8';
  if(attack==='ring'){circle(p.x,p.y,2,color);circle(p.x,p.y,6,color);}
  else if(attack==='eclipse'){circle(p.x,p.y,3,color);circle(p.x,p.y,6,color);circle(p.x,p.y,10,color);}
  else if(attack==='thunderfall'){for(const dx of [-4,0,4])circle(p.tx+dx,p.ty,2.2,color);}
  else if(attack==='fan'){const a=Math.atan2(p.ty-p.y,p.tx-p.x);line([{x:p.x+Math.cos(a-.45)*13,y:p.y+Math.sin(a-.45)*13},p,{x:p.x+Math.cos(a+.45)*13,y:p.y+Math.sin(a+.45)*13}],color);}
  else{circle(p.tx,p.ty,attack==='charge'?2.2:2.8,color);if(attack==='charge')line([p,{x:p.tx,y:p.ty}],color);}
 }
}
