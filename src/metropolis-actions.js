import {CITY_DESTINATIONS,CITY_DISCOVERIES,CITY_STATIONS,CITY_PRICE} from './metropolis-data.js';
import {TOWER_FLOORS} from './metropolis-state.js';
import {advanceTime,earn,transact} from './frontier-state.js';
import {canStand,clearSight} from './frontier-world.js';
import {makeInterior} from './frontier-interiors.js';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function cityPoint(world,f){return(world.cityPoints||(!world.interior?CITY_DISCOVERIES.filter(d=>!d.floor).map(d=>({...d,key:'cityDiscover',discovery:true})):[])).find(p=>distance(f,p)<2.4&&clearSight(world,f,p))||null;}
export function discoverCity(state,world,id){
 const f=state.frontier,c=f.life.city,d=CITY_DISCOVERIES.find(d=>d.id===id);
 if(!d||c.discoveries.includes(id)||f.life.expanse.swimming||distance(f,d)>2.4||!clearSight(world,f,d))return 0;
 if(d.floor?(world.interior!=='tether'||world.cityFloor!==d.floor):!!world.interior)return 0;
 c.discoveries.push(id);const reward=earn(state,c.discoveries.length===CITY_DISCOVERIES.length?160:40);return reward;
}
export function buyApartment(state){const f=state.frontier;if(f.life.combat.interior||distance(f,cityDestination('apartment'))>3||f.life.city.apartment||!transact(state,CITY_PRICE.apartment))return false;f.life.city.apartment=true;return true;}
export function restApartment(state,world){const f=state.frontier,c=f.life.city;if(!c.apartment||world.interior!=='apartment'||f.minutes<c.lastRest+60)return false;advanceTime(f,360);f.energy=100;f.life.health=Math.min(100,f.life.health+35);c.lastRest=Math.floor(f.minutes);return true;}
export function cityContract(state,place){
 const f=state.frontier,c=f.life.city;
 const destination=cityDestination(place);if(f.life.combat.interior||!destination||distance(f,destination)>3)return false;
 if(c.contract){if(c.contract.to!==place)return 0;c.contract=null;c.deliveries++;advanceTime(f,10);return earn(state,65);}
 if(place!=='aurora')return false;
 c.contract={to:['tether','citygallery','boathouse'][c.deliveries%3],at:f.minutes};f.target=c.contract.to;return true;
}
export function rideMetro(state,world,to){
 const f=state.frontier,station=CITY_STATIONS.find(p=>p.id===to),from=CITY_STATIONS.find(p=>distance(p,f)<3);
 if(world.interior||f.life.expanse.swimming||!from||!station||from.id===to||!clearSight(world,f,from)||!canStand(world,station.x,station.y,.22))return false;
 if(!transact(state,CITY_PRICE.ticket))return false;
 if(f.mounted&&state.village.vehicle==='car')f.life.expanse.parked={x:f.x,y:f.y,angle:f.life.vehicleYaw??f.angle};
 f.mounted=false;f.x=station.x;f.y=station.y;f.angle=-Math.PI/2;f.life.pitch=0;f.target=station.id;advanceTime(f,25+distance(from,station)*.13);
 if(!f.visits.includes(station.id))f.visits.push(station.id);return true;
}
export function rideLift(state,world,building,floor){
 const f=state.frontier,inside=f.life.combat.interior,point=world.cityPoints?.find(p=>p.id==='lift');
 if(!inside||inside.id!=='tether'||building.id!=='tether'||!TOWER_FLOORS.includes(floor)||floor===world.cityFloor||!point||distance(f,point)>2.4||!clearSight(world,f,point))return null;
 inside.floor=floor;const next=makeInterior(building,f.seed,{floor,theme:f.life.city.theme});f.x=14;f.y=6.5;f.angle=Math.PI/2;f.life.pitch=0;advanceTime(f,2);return next;
}
export const cityDestination=id=>CITY_DESTINATIONS.find(p=>p.id===id);
