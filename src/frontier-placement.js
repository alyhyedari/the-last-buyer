import {canStand,findOpen} from './frontier-world.js';
import {VEHICLES} from './frontier-state.js';
// Repair only invalid placements; ordinary travel still uses swept collision.
export function repairPlacements(world,state,actors=[]){
 const f=state.frontier,e=f.life.expanse;let changed=false;
 const obstacles=actors.filter(a=>!a.dead&&!a.owned&&!e.taken.includes(a.id)&&a.kind?.startsWith('traffic'));
 if(!e.swimming){const radius=VEHICLES[f.mounted?state.village.vehicle:'foot'].radius;
  if(!canStand(world,f.x,f.y,radius)){const safe=findOpen(world,f,radius,{avoid:obstacles})||findOpen(world,world.exit||world.arena||{x:32.5,y:57.5},radius,{avoid:obstacles});if(safe){Object.assign(f,safe);changed=true;}}
 }
 if(!world.interior&&e.parked){const p=e.parked,avoid=[...obstacles,{x:f.x,y:f.y,radius:VEHICLES.foot.radius}];
  if(!canStand(world,p.x,p.y,VEHICLES.car.radius)||avoid.some(o=>Math.hypot(o.x-p.x,o.y-p.y)<VEHICLES.car.radius+(o.radius??.55))){
   const safe=findOpen(world,p,VEHICLES.car.radius,{avoid});if(safe){Object.assign(p,safe);changed=true;}
  }
 }
return changed;
}
