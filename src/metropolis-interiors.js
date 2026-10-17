import {CITY_BUILDINGS,CITY_DISCOVERIES} from './metropolis-data.js';
import {TOWER_FLOORS} from './metropolis-state.js';

export function makeCityInterior(building,seed,{floor='lobby',theme=0}={}){
 if(!building.metro)return null;
 const size=28,tiles=new Uint8Array(size*size).fill(8),sprites=[],colliders=[],buckets=new Map();
 const tower=building.id==='tether',level=tower&&TOWER_FLOORS.includes(floor)?floor:'lobby';
 for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++)tiles[y*size+x]=2;
 const put=(kind,x,y,radius=.4,variant=0,id)=>{const s={id:id||'inside-'+building.id+'-'+level+'-'+kind+'-'+Math.round(x*10)+'-'+Math.round(y*10),kind,x,y,radius,variant};sprites.push(s);if(radius)colliders.push({...s});return s;};
 const points=[];
 if(tower){
  put('metroLift',14,3.4,.4);points.push({id:'lift',key:'cityLift',x:14,y:5.2});
  if(level==='lobby'){
   put('metroDesk',7,11,1);put('metroLogo',7,8,0);put('metroScreen',22,7,.4);
   for(const y of [14,20]){put('sofa',5,y,.9);put('sofa',23,y,.9);put('metroPlanter',3,y-3,.5);}
   put('metroMonument',14,15,.7);points.push({id:'archive-note',key:'cityLedger',x:21,y:8});
  }else if(level==='archive'){
   for(const x of [4,8,20,24])for(const y of [10,15,20])put('metroArchive',x,y,.6);
   put('metroDesk',14,17,1);put('metroScreen',14,15,0);points.push({id:'archive-note',key:'cityLedger',x:14,y:19});
  }else{
   put('metroTelescope',7.5,4.4,.35);put('metroGarden',22,8,.6);put('sofa',22,18,.9);put('table',20,22,.6);
   const d=CITY_DISCOVERIES.find(d=>d.floor==='sky');points.push({id:d.id,key:'cityDiscover',x:d.x,y:d.y,discovery:true});
   points.push({id:'panorama',key:'cityPanorama',x:14,y:10});
  }
 }else if(building.kind==='office'||building.id==='citygallery'||building.id==='cityarcade'){
  for(const x of [5,10,19,24])for(const y of [6,13,20])put(building.id==='cityarcade'?'metroArcade':building.id==='citygallery'?'metroArt':'metroDesk',x,y,.7,(x+y)%3);
  put('sofa',7,24,.9);put('metroPlanter',24,24,.5);
 }else{
  for(let y=1;y<19;y++)if(![7,8,16,17].includes(y))tiles[y*size+14]=9;
  for(let x=1;x<size-1;x++)if(![6,7,19,20].includes(x))tiles[14*size+x]=9;
  put('bed',5,5,1);put('wardrobe',3,11,.5);put('stove',23,4,.5);put('fridge',25,9,.5);put('table',20,10,.8);
  put('sofa',5,19,.9);put('shelf',2.5,23,.4);put('rug',8,22,0);put('bathtub',23,21,.9);put('basin',23,17,.4);
  if(building.id==='apartment')points.push({id:'home',key:'cityMyHome',x:8,y:22});
  else put('metroArt',7,2,.2,1);
 }
 put('doorway',14,26.4,0);
 if(building.id!=='apartment')sprites.push({id:'city-owner-'+building.id+'-'+level,kind:'resident',x:17,y:24,homeX:17,homeY:24,phase:0,variant:building.kind==='manor'?9:5,owner:true});
 for(const s of colliders){const key=Math.floor(s.x)+','+Math.floor(s.y);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(s);}
 const rooms=points.length?points:[{key:'livingroom',x:8,y:22},{key:'kitchen',x:20,y:7},{key:'bedroom',x:8,y:5}];
 return{size,tiles,sprites,colliders,buckets,buildings:[],traffic:[],treasures:[],seed,interior:building.id,city:true,cityFloor:level,cityTheme:theme,wealth:building.kind==='manor'||tower,entry:{x:14,y:24.5},exit:{x:14,y:26.4},cityPoints:points,rooms:[{key:'cityEntrance',x:14,y:24.5},...rooms],building:CITY_BUILDINGS.find(b=>b.id===building.id)};
}
