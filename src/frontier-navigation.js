import {routeSearch} from './frontier-world.js';

// A player route yields between bounded search batches. Movement, new goals,
// leaving the scene and opening a panel cancel work without publishing a stale path.
export class RoutePlanner{
 constructor(){this.serial=0;this.pending=false;}
 cancel(){this.serial++;this.pending=false;}
 async find(world,start,target,radius=.22){
  const serial=++this.serial;this.pending=true;
  const search=routeSearch(world,{x:start.x,y:start.y},{x:target.x,y:target.y},radius);
  try{while(serial===this.serial){const step=search.next();if(step.done)return step.value;await new Promise(resolve=>setTimeout(resolve,0));}return null;}
  finally{search.return();if(serial===this.serial)this.pending=false;}
 }
}
