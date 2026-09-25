import {findPath,walkable} from './state.js';
export function lineOfSight(a,b,blocks){const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/7));for(let i=1;i<steps;i++){const x=a.x+(b.x-a.x)*i/steps,y=a.y+(b.y-a.y)*i/steps;if(blocks.some(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h))return false;}return true;}
export function sheltered(player,chapter,crouching){return crouching&&chapter.hideZones.some(p=>Math.hypot(player.x-p.x,player.y-p.y)<p.radius);}
export class HorrorDirector{
 constructor(chapter,state,onEvent){this.chapter=chapter;this.state=state;this.onEvent=onEvent;this.elapsed=0;this.event=null;this.remaining=0;this.gap=0;}
 update(dt,settings){
  if(settings.calm||this.chapter.outdoor){this.event=null;this.remaining=0;return;}
  this.elapsed+=dt;this.remaining=Math.max(0,this.remaining-dt);this.gap=Math.max(0,this.gap-dt);if(!this.remaining)this.event=null;
  if(this.event||this.gap||[1,5,7].includes(this.chapter.index))return;
  const index=this.chapter.index,has=kind=>this.state.seenEvents.includes(`${index}:${kind}`);
  let kind=null;
  if(this.elapsed>7&&!has('arrival'))kind='arrival';
  else if(this.elapsed>22&&!has('power')&&this.state.solved.some(id=>id.startsWith(`${index}:`)))kind='power';
  else if(this.elapsed>38&&!has('receipt')&&this.state.episodes.includes(index))kind='receipt';
  if(kind){this.event=kind;this.remaining=8;this.gap=24;this.state.seenEvents.push(`${index}:${kind}`);this.onEvent?.(kind);}
 }
 get darkness(){if(this.event!=='power')return 0;return Math.min(1,(8-this.remaining)/2,this.remaining/2);}
}
export class ShadowAgent{
 constructor(chapter,blocks){this.chapter=chapter;this.blocks=blocks;this.patrol=[{x:856,y:552},{x:846,y:246},{x:489,y:535},{x:454,y:121}].filter(p=>walkable(p.x,p.y,blocks));this.position={...this.patrol[0]};this.mode='patrol';this.target=0;this.path=[];this.repath=0;this.search=0;this.grace=4;this.lastSeen=null;}
 update(dt,{player,running=false,hidden=false,ward=false,cinematic=false}){
  this.grace=Math.max(0,this.grace-dt);this.repath-=dt;this.search=Math.max(0,this.search-dt);
  const d=Math.hypot(player.x-this.position.x,player.y-this.position.y),sees=!hidden&&d<(cinematic?225:185)&&lineOfSight(this.position,player,this.blocks),hears=running&&d<280;
  const previous=this.mode;let goal;
  if(ward&&d<180){this.mode='retreat';goal=this.patrol.slice().sort((a,b)=>Math.hypot(b.x-player.x,b.y-player.y)-Math.hypot(a.x-player.x,a.y-player.y))[0];this.search=0;}
  else if(sees||hears){this.mode=sees?'chase':'investigate';this.lastSeen={...player};goal=this.lastSeen;this.search=7;}
  else if(this.search>0&&this.lastSeen){this.mode='search';goal=this.lastSeen;}
  else{this.mode='patrol';goal=this.patrol[this.target];if(Math.hypot(goal.x-this.position.x,goal.y-this.position.y)<20){this.target=(this.target+1)%this.patrol.length;goal=this.patrol[this.target];}}
  if(this.mode!==previous)this.repath=0;
  if(this.repath<=0){this.path=findPath(this.position,goal,this.blocks);this.repath=.45;}
  if(this.path.length){const p=this.path[0],distance=Math.hypot(p.x-this.position.x,p.y-this.position.y);const speed=this.mode==='retreat'?94:this.mode==='chase'?(cinematic?77:64):this.mode==='patrol'?29:43;if(distance<2)this.path.shift();else{const step=Math.min(distance,speed*dt),x=this.position.x+(p.x-this.position.x)/distance*step,y=this.position.y+(p.y-this.position.y)/distance*step;if(walkable(x,this.position.y,this.blocks))this.position.x=x;if(walkable(this.position.x,y,this.blocks))this.position.y=y;}}
  return !hidden&&!ward&&this.grace===0&&d<22&&lineOfSight(this.position,player,this.blocks);
 }
}
