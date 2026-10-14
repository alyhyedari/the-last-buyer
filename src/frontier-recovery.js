import {canStand,moveInWorld,nearestOpen} from './frontier-world.js';
// Recovery uses a position already occupied safely. It never rewinds save progress.
export function recoverFooting(world,f,lastSafe,radius=.22){
 if(lastSafe&&Math.hypot(lastSafe.x-f.x,lastSafe.y-f.y)<8&&canStand(world,lastSafe.x,lastSafe.y,radius)){
  const trial={x:f.x,y:f.y};moveInWorld(world,trial,lastSafe.x-f.x,lastSafe.y-f.y,radius);
  if(Math.hypot(trial.x-lastSafe.x,trial.y-lastSafe.y)<.05||!canStand(world,f.x,f.y,radius)){f.x=lastSafe.x;f.y=lastSafe.y;return true;}
 }
 // A penetrated collider can occur after loading older geometry. A local repair
 // is allowed only in that case, not to hop through walls while freely standing.
 if(!canStand(world,f.x,f.y,radius)){const p=nearestOpen(world,f,radius);if(Math.hypot(p.x-f.x,p.y-f.y)<8&&canStand(world,p.x,p.y,radius)){Object.assign(f,p);return true;}}
 for(let i=0;i<16;i++){const p={x:f.x,y:f.y},a=f.angle+Math.PI+i*Math.PI/8;moveInWorld(world,p,Math.cos(a)*.9,Math.sin(a)*.9,radius);if(Math.hypot(p.x-f.x,p.y-f.y)>.25){Object.assign(f,p);return true;}}return false;
}
