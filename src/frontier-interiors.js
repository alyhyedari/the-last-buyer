import {decorateFloors,floorCount} from './building-access.js';
import {makeCityInterior} from './metropolis-interiors.js';
import {hash} from './frontier-state.js';
import {canStand,nearestOpen} from './frontier-world.js';
export function makeInterior(building,seed,options={}){
 const city=makeCityInterior(building,seed,options);if(city)return decorateFloors(city,building,options);
 const size=20,tiles=new Uint8Array(size*size).fill(8),sprites=[],colliders=[],buckets=new Map(),wealth=building.kind==='manor',wall=wealth?10:9;
 for(let y=1;y<19;y++)for(let x=1;x<19;x++)tiles[y*size+x]=2;
 // Four connected rooms; actual walls and furniture share the collision system.
 for(let y=1;y<14;y++)if(y!==5&&y!==6&&y!==12)tiles[y*size+10]=wall;
 for(let x=1;x<19;x++)if(![4,5,14,15].includes(x))tiles[9*size+x]=wall;
 const put=(kind,x,y,radius=.45)=>{const id=`inside-${building.id}-${kind}`,s={id,kind,x,y,radius,variant:wealth?1:0};sprites.push(s);if(radius)colliders.push({x,y,radius,id});};
 put('bed',4,4,.9);put('wardrobe',2.2,7,.5);put('stove',16.5,3,.5);put('fridge',18,5,.5);put('table',14,6,.8);put('chair',14,7.5,.35);put('sofa',5,12,.9);put('shelf',2.5,14,.4);put('basin',17,12,.4);put('bathtub',16,15,.8);put('rug',6,14,0);put('indoorLamp',8,3,.15);put('indoorLamp',12,16,.15);
 sprites.push({id:'door-'+building.id,kind:'doorway',x:10,y:18.4},{id:'owner-'+building.id,kind:'resident',x:7.5,y:7.5,homeX:7.5,homeY:7.5,phase:hash(seed,building.id.length)*6.28,owner:true});
 for(const c of colliders){const key=Math.floor(c.x)+','+Math.floor(c.y);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(c);}
 return decorateFloors({size,tiles,sprites,colliders,buckets,buildings:[],traffic:[],treasures:[],seed,interior:building.id,wealth,entry:{x:10,y:17},exit:{x:10,y:18.4}},building,options);
}
export function enterInterior(state,outdoor,building){const f=state.frontier;if(f.life.combat.interior)return null;const world=makeInterior(building,f.seed,{theme:f.life.city.theme});f.life.combat.interior={id:building.id,level:0,outside:{x:f.x,y:f.y,angle:f.angle}};if(building.id==='tether')f.life.combat.interior.floor='lobby';f.x=world.entry.x;f.y=world.entry.y;f.angle=-Math.PI*.69;f.life.pitch=0;f.mounted=false;return world;}
export function exitInterior(state,outdoor){const f=state.frontier,i=f.life.combat.interior;if(!i)return false;const building=outdoor.buildings.find(b=>b.id===i.id),candidate=canStand(outdoor,i.outside.x,i.outside.y,.22)?i.outside:nearestOpen(outdoor,building?.door||i.outside);f.x=candidate.x;f.y=candidate.y;f.angle=i.outside.angle;f.life.pitch=0;f.life.combat.interior=null;f.mounted=false;return true;}

export function changeInteriorFloor(state,outdoor,direction){const f=state.frontier,i=f.life.combat.interior,b=outdoor.buildings.find(b=>b.id===i?.id);if(!b||b.id==='tether'||![1,-1].includes(direction))return null;const current=makeInterior(b,f.seed,{level:i.level||0,theme:f.life.city.theme}),point=direction>0?current.stairs.up:current.stairs.down;if(!point||Math.hypot(f.x-point.x,f.y-point.y)>2.4)return null;const level=(i.level||0)+direction;if(level<0||level>=floorCount(b))return null;i.level=level;const world=makeInterior(b,f.seed,{level,theme:f.life.city.theme});f.x=world.entry.x;f.y=world.entry.y;return world;}
