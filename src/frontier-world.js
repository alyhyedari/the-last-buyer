import {CITY_DESTINATIONS} from './metropolis-data.js';
import {buildMetropolis} from './metropolis-world.js';
import {familyResidents} from './frontier-residents.js';
import {hash} from './frontier-state.js';
import {growForest,outsideCoinGlade} from './frontier-forest-world.js';
import {inDeepForest} from './frontier-forest-data.js';
import {MYTH_BOSSES,MYTH_TRAILS} from './frontier-myth-data.js';
export const SIZE=384;
export const LAKES=[{id:'mirrorwater',x:54,y:19,rx:12,ry:9,shore:{x:61.5,y:29.5},entry:{x:58.5,y:24.5}},{id:'bluebasin',x:150,y:164,rx:18,ry:14,shore:{x:149.5,y:181.5},entry:{x:149.5,y:173.5}}];
export const PLACES=[...MYTH_TRAILS,...CITY_DESTINATIONS,
 {id:'gate',x:32.5,y:57.5,color:'#c8e397',kind:'gate'},
 {id:'garage',x:28.5,y:49.5,color:'#dba05f',kind:'garage'},
 {id:'market',x:36.5,y:43.5,color:'#bddc83',kind:'market'},
 {id:'workshop',x:26.5,y:38.5,color:'#d1936e',kind:'garage'},
 {id:'club',x:39.5,y:31.5,color:'#ec8bc5',kind:'club'},
 {id:'inn',x:27.5,y:28.5,color:'#efcf95',kind:'inn'},
 {id:'pond',x:47.5,y:23.5,color:'#8bcec7',kind:'pond'},
 {id:'range',x:16.5,y:37.5,color:'#e1a87a',kind:'range'},
 {id:'grove',x:15.5,y:18.5,color:'#83b59a',kind:'grove'},
 {id:'tower',x:32.5,y:12.5,color:'#ccbcff',kind:'tower'},
 {id:'clinic',x:43.5,y:42.5,color:'#e4d8c4',kind:'clinic'},
 {id:'overlook',x:48.5,y:9.5,color:'#efcb8b',kind:'overlook'},
 {id:'square',x:73.5,y:43.5,color:'#e4bd81',kind:'market'},
 {id:'homes',x:66.5,y:56.5,color:'#c69877',kind:'house'},
 {id:'manor',x:84.5,y:32.5,color:'#d0c5a1',kind:'manor'},
 {id:'stable',x:59.5,y:68.5,color:'#cda578',kind:'stable'},
 {id:'shelter',x:78.5,y:70.5,color:'#b3c891',kind:'house'},
 {id:'camp',x:66.5,y:20.5,color:'#e2ae78',kind:'camp'},
 {id:'summit',x:81.5,y:8.5,color:'#d7e0c6',kind:'summit'},
 {id:'nightmarket',x:89.5,y:56.5,color:'#b596cc',kind:'market'},
 {id:'oldquarter',x:102.5,y:82.5,color:'#cbab87',kind:'house'},
 {id:'boulevard',x:91.5,y:94.5,color:'#e2be83',kind:'market'},
 {id:'armory',x:109.5,y:65.5,color:'#b4bea3',kind:'garage'},
 {id:'deepforest',x:25.5,y:91.5,color:'#609c80',kind:'grove'},
 {id:'ruins',x:14.5,y:113.5,color:'#aa92b7',kind:'tower'},
 {id:'ranger',x:49.5,y:77.5,color:'#97b780',kind:'house'},
 {id:'weatherstation',x:53.5,y:111.5,color:'#a7d4d1',kind:'tower'},
 {id:'quarry',x:38.5,y:104.5,color:'#cba68a',kind:'range'},
 {id:'lakeshore',x:61.5,y:29.5,color:'#9ddcda',kind:'pond'},
 {id:'neonquarter',x:135.5,y:89.5,color:'#be9dec',kind:'market'},
 {id:'lostwoods',x:72.5,y:147.5,color:'#96ccb0',kind:'grove'},
 {id:'observatory',x:150.5,y:130.5,color:'#cedaac',kind:'tower'},
 {id:'starfall',x:30.5,y:173.5,color:'#c7adf0',kind:'grove'},
 {id:'quietcliff',x:171.5,y:148.5,color:'#e5be9f',kind:'overlook'},
 {id:'bluebasin',x:149.5,y:181.5,color:'#81c4d6',kind:'pond'}
];
export const placeById=id=>PLACES.find(p=>p.id===id);
export function makeFrontierWorld(seed){
 const tiles=new Uint8Array(SIZE*SIZE),sprites=[],colliders=[],buildings=[],treasures=[];
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const edge=x<2||y<2||x>SIZE-3||y>SIZE-3;tiles[y*SIZE+x]=edge?1:0;
  if(!edge&&hash(seed,x+y*(x<192&&y<192?192:SIZE))<(inDeepForest(x,y)?(y>190?.2:.24)+.055*Math.sin(x*.13)*Math.cos(y*.11):y>125?.19:x<57&&y>72?.12:.07))sprites.push({id:'tree-'+x+'-'+y,x:x+.5,y:y+.5,kind:'tree',variant:Math.floor(hash(seed,x*y+401)*(inDeepForest(x,y)?5:3))+(inDeepForest(x,y)?3:0)});
 }
 // One connected trunk, with broad branches to every destination. Roads are walkable.
 const road=(ax,ay,bx,by)=>{const steps=Math.ceil(Math.hypot(bx-ax,by-ay)*2);for(let n=0;n<=steps;n++){const x=Math.floor(ax+(bx-ax)*n/steps),y=Math.floor(ay+(by-ay)*n/steps);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(x+dx>1&&x+dx<SIZE-2&&y+dy>1&&y+dy<SIZE-2)tiles[(y+dy)*SIZE+x+dx]=2;}};
 road(32,184,32,10);for(const p of PLACES.filter(p=>p.x<55))road(32,p.y,p.x,p.y);
 road(32,43,74,43);road(74,43,74,72);road(74,43,85,43);road(85,43,85,58);road(85,58,74,58);road(74,43,74,20);road(74,20,81,20);road(81,20,81,8);
 for(const p of PLACES.filter(p=>!p.metro&&p.x>=55&&p.y<192))road(74,p.y,p.x,p.y);
 road(74,70,74,184);road(74,81,144,81);road(114,81,114,130);road(114,108,74,108);road(106,65,106,116);road(32,77,74,77);road(144,81,144,116);road(114,116,144,116);
 for(const lake of LAKES)for(let y=Math.floor(lake.y-lake.ry);y<=lake.y+lake.ry;y++)for(let x=Math.floor(lake.x-lake.rx);x<=lake.x+lake.rx;x++)if(((x-lake.x)/lake.rx)**2+((y-lake.y)/lake.ry)**2<1)tiles[y*SIZE+x]=3;
 road(32,23,47,23);
 road(74,181,150,196);road(150,196,234,238);road(234,238,318,262);road(234,238,192,312);road(192,312,280,334);road(280,334,336,374);
 for(const b of MYTH_BOSSES){for(let y=Math.floor(b.y)-9;y<=b.y+9;y++)for(let x=Math.floor(b.x)-9;x<=b.x+9;x++)if(Math.hypot(x+.5-b.x,y+.5-b.y)<9)tiles[y*SIZE+x]=0;}
 const addBuilding=(x,y,kind,id,width=5,depth=4)=>{const left=Math.floor(x-width/2),top=Math.floor(y-depth),style=kind==='manor'?5:kind==='house'?4:kind==='clinic'?6:7;for(let yy=top;yy<Math.floor(y);yy++)for(let xx=left;xx<left+width;xx++)tiles[yy*SIZE+xx]=style;buildings.push({id,x:left+width/2,y:top+depth/2,left,top,width,depth,kind,door:{x:left+Math.floor(width/2)+.5,y:top+depth+.7}});};
 for(const p of PLACES.filter(p=>!p.metro)){
  // Clear approach; facades sit behind the interactable doorstep.
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)tiles[(Math.floor(p.y)+dy)*SIZE+Math.floor(p.x)+dx]=2;
  if(!['pond','grove','overlook','gate','range','camp','summit'].includes(p.kind))addBuilding(p.x,p.y-1.5,p.kind,p.id,p.kind==='manor'?7:5);
  sprites.push({...p,x:p.x+(p.id==='square'?-1.02:1.02),kind:'sign',radius:.1});
  if(['pond','range','camp'].includes(p.kind))sprites.push({...p,x:p.x,y:p.y-2,kind:p.kind,landmark:true,radius:p.kind==='camp'?.8:.6});
 }
 // Homes have solid footprints, lit windows and an unobstructed front path.
 for(const [x,y,kind]of [[63,48,'house'],[65,64,'house'],[82,65,'house'],[88,39,'manor'],[79,26,'manor'],[67,35,'house']]){road(74,y+2,x,y+2);addBuilding(x,y,kind,'home-'+x+'-'+y,kind==='manor'?7:4);sprites.push({x,y:y+1.1,kind:'resident',id:'resident-'+x,homeX:x,homeY:y+1.1,phase:hash(seed,x)*6.28});}
 for(const [x,y,kind]of [[82,80,'house'],[92,80,'house'],[119,91,'manor'],[101,92,'house'],[83,103,'house'],[96,105,'house'],[119,111,'manor'],[83,115,'house'],[96,116,'house'],[112,77,'manor'],[61,87,'house'],[63,105,'house']]){road(74,y+2,x,y+2);addBuilding(x,y,kind,'home-'+x+'-'+y,kind==='manor'?6:4);sprites.push({x,y:y+1.1,kind:'resident',id:'resident-'+x+'-'+y,homeX:x,homeY:y+1.1,phase:hash(seed,x+y)*6.28});}
 for(let i=0;i<24;i++){const x=75.5+(i%6)*5,y=85.8+Math.floor(i/6)*7;road(74,y,x,y);sprites.push({x,y,homeX:x,homeY:y,kind:'resident',id:'pedestrian-'+i,phase:hash(seed,i+891)*6.28});}
 for(let i=0;i<12;i++){const x=122+(i%3)*9,y=94+Math.floor(i/3)*7;road(114,y+2,x,y+2);addBuilding(x,y,i%4===0?'manor':'house','neon-home-'+i,4,4);}
 for(let i=0;i<108;i++){const district=i<48?0:i<78?1:2,j=i<48?i:i<78?i-48:i-78,x=district===0?70.7+(j%4)*4:district===1?77.5+(j%5)*5:116.5+(j%5)*5,y=district===0?44.3+Math.floor(j/4)*2.4:district===1?86.5+Math.floor(j/5)*4:85.5+Math.floor(j/5)*5;sprites.push({id:'citizen-'+i,kind:'resident',x,y,homeX:x,homeY:y,variant:i%12,phase:hash(seed,i+4391)*6.28});}
 // A later driveway must never carve through an existing neighbour's house.
 for(const b of buildings)for(let y=b.top;y<b.top+b.depth;y++)for(let x=b.left;x<b.left+b.width;x++)tiles[y*SIZE+x]=b.kind==='manor'?5:b.kind==='house'?4:b.kind==='clinic'?6:7;
 for(let y=45;y<73;y+=6)for(const x of [71.5,77.5])if(tiles[Math.floor(y)*SIZE+Math.floor(x)]===0&&!PLACES.some(p=>Math.hypot(p.x-x,p.y-y)<2))sprites.push({x,y:y+.5,kind:'streetlamp',radius:.12});
 for(const [x,y,kind,radius]of [[65.5,57.7,'laundry',.12],[69.5,47.5,'bench',.5],[81.5,46.5,'bench',.5],[70.5,60.5,'trafficCar',.55],[87.5,44.5,'trafficCar',.55]])if(tiles[Math.floor(y)*SIZE+Math.floor(x)]===0)sprites.push({x,y,kind,radius,variant:1});
 for(let i=0;i<52;i++){const x=61+hash(seed,2000+i)*30,y=30+hash(seed,2100+i)*44;if(tiles[Math.floor(y)*SIZE+Math.floor(x)]===0)sprites.push({x,y,kind:'flowers',variant:i%3});}
 const animals=['deer','fox','rabbit','boar','owl','heron'];
 for(let i=0;i<650;i++){const kind=animals[i%6],x=i>=350?134+hash(seed,801+i)*243:kind==='heron'&&i<150?41+hash(seed,700+i)*2:i<72?5+hash(seed,801+i)*84:i<150?5+hash(seed,801+i)*49:5+hash(seed,801+i)*123,y=i>=350?194+hash(seed,1001+i)*183:kind==='heron'&&i<150?17+hash(seed,900+i)*6:i<72?5+hash(seed,1001+i)*77:i<150?72+hash(seed,1001+i)*46:125+hash(seed,1001+i)*60;if(tiles[Math.floor(y)*SIZE+Math.floor(x)]===0)sprites.push({id:'animal-'+i,kind,x,y,animal:true,phase:hash(seed,1200+i)*6.28});}
 for(let i=0;i<16;i++){const x=9.5+(i%4)*12,y=79.5+Math.floor(i/4)*11;tiles[Math.floor(y)*SIZE+Math.floor(x)]=0;const cache={id:'cache-'+i,kind:'treasure',x,y};treasures.push(cache);sprites.push(cache);}
 for(let i=16;i<40;i++){const x=11.5+((i-16)%6)*21,y=132.5+Math.floor((i-16)/6)*15;const cache={id:'cache-'+i,kind:'treasure',x,y};treasures.push(cache);sprites.push(cache);}
 for(let i=0;i<180;i++){const x=6+hash(seed,7200+i)*123,y=127+hash(seed,7420+i)*59;if(tiles[Math.floor(y)*SIZE+Math.floor(x)]===0)sprites.push({id:'growth-'+i,kind:i%7===0?'crystal':'mushroom',x,y,variant:i%3,radius:i%7===0?.3:0});}
 for(const [id,kind,x,y]of [['visitor-north','ufoFriend',71,142],['visitor-stars','ufoFriend',28,170],['moss-east','mossling',92,157],['moss-west','mossling',16,146]]){for(let yy=Math.floor(y)-2;yy<=y+2;yy++)for(let xx=Math.floor(x)-2;xx<=x+2;xx++)tiles[yy*SIZE+xx]=2;sprites.push({id,kind,x,y,height:kind==='ufoFriend'?2:0,alien:true});}
 for(let i=0;i<7;i++)sprites.push({id:'neon-'+i,kind:'neonSign',x:115+i*4,y:83.2,radius:.12,variant:i%3});
 for(const [kind,x,y]of [['dog',77,69],['cat',67,56],['horse',60,68]])sprites.push({id:kind+'-local',kind,x,y,animal:true,domestic:true,phase:0});
 for(let i=0;i<6;i++)sprites.push({id:'bird-'+i,kind:'bird',x:58+i*4,y:36+i%3,airborne:true,phase:i*1.9});
 sprites.push({id:'paper-target',kind:'target',x:17.5,y:35.5,radius:.25});
 sprites.push({x:30.4,y:45.5,kind:'stranger',id:'stranger'},{x:14.5,y:17.5,kind:'ghost',id:'ghost'});
 const city=buildMetropolis({tiles,size:SIZE,sprites,buildings,road,seed,hash});
 growForest(sprites,tiles,SIZE,seed);
 // Wide, open ritual grounds; pillars frame the arena without sealing exits.
 for(const b of MYTH_BOSSES)for(let i=0;i<8;i++){const a=i*Math.PI/4,x=b.x+Math.cos(a)*8.5,y=b.y+Math.sin(a)*8.5;sprites.push({id:'pillar-'+b.id+'-'+i,kind:'mythPillar',x,y,variant:b.variant,radius:.3});}
 sprites.push(...familyResidents(buildings,seed));
 const filtered=sprites.filter(s=>!MYTH_BOSSES.some(b=>Math.hypot(s.x-b.x,s.y-b.y)<8)&&outsideCoinGlade(s)).filter(s=>s.kind!=='tree'||tiles[Math.floor(s.y)*SIZE+Math.floor(s.x)]===0&&!PLACES.some(p=>Math.hypot(p.x-s.x,p.y-s.y)<4)&&!buildings.some(b=>Math.hypot(b.door.x-s.x,b.door.y-s.y)<1.4)&&!treasures.some(t=>Math.hypot(t.x-s.x,t.y-s.y)<1.3));
 for(const s of filtered){if(!s.id&&['trafficCar','bench','streetlamp','sign','laundry'].includes(s.kind))s.id=s.kind.toLowerCase()+'-'+Math.round(s.x*10)+'-'+Math.round(s.y*10);if(s.kind==='resident'){s.variant??=Math.floor(hash(seed,Math.round(s.x*50+s.y))*12);if(!canStand({size:SIZE,tiles},s.x,s.y,.2)){s.x=s.homeX=Math.floor(s.x)+.5;s.y=s.homeY=Math.floor(s.y)+1.5;}}}
 for(const s of filtered)if(s.kind==='tree'||s.radius)colliders.push({x:s.x,y:s.y,radius:s.kind==='tree'?.2:s.radius,id:s.id||s.kind,kind:s.kind});
 const buckets=new Map();for(const o of colliders){const key=Math.floor(o.x)+','+Math.floor(o.y);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);}
 const traffic=[{id:'traffic-car',kind:'trafficCar',phase:0,speed:2.4,radius:.62,model:0},{id:'traffic-bike',kind:'trafficBike',phase:17,speed:1.8,radius:.35},{id:'traffic-motor',kind:'trafficMotor',phase:39,speed:2.9,radius:.4}];
 for(let i=0;i<9;i++)traffic.push({id:'traffic-neon-'+i,kind:i%4===3?'trafficMotor':'trafficCar',phase:i*11,speed:1.7+(i%3)*.25,radius:i%4===3?.4:.62,model:i%4,corners:[[114.15,81.85],[144.15,81.85],[144.15,116.85],[114.15,116.85]]});
 traffic.push(...city.traffic);
 const spriteBuckets=new Map();for(const s of filtered){const k=Math.floor(s.x/8)+','+Math.floor(s.y/8);if(!spriteBuckets.has(k))spriteBuckets.set(k,[]);spriteBuckets.get(k).push(s);}
 const playTiles=new Set();for(const child of filtered.filter(s=>s.kind==='child'&&s.id.endsWith('-0')))for(let dy=0;dy<3;dy++)for(let dx=0;dx<2;dx++){const x=Math.floor(child.x)+dx,y=Math.floor(child.y)+dy;if([0,2].includes(tiles[y*SIZE+x]))playTiles.add(y*SIZE+x);}
 const facadeTiles=new Map();for(const b of buildings)for(let y=b.top;y<b.top+b.depth;y++)for(let x=b.left;x<b.left+b.width;x++)facadeTiles.set(y*SIZE+x,b.id);return{spatialCollision:true,playTiles,size:SIZE,tiles,sprites:filtered,seed,colliders,buckets,buildings,traffic,treasures,facadeTiles,spriteBuckets,cityBuildings:city.buildings};
}
export const tileAt=(world,x,y)=>{const size=world.size||SIZE;return x<0||y<0||x>=size||y>=size?1:world.tiles[Math.floor(y)*size+Math.floor(x)];};
export const solid=(world,x,y)=>{const t=tileAt(world,x,y);return t!==0&&t!==2;};
export function canStand(world,x,y,radius=.22){if(!Number.isFinite(x)||!Number.isFinite(y))return false;if(world.arena&&Math.hypot(x-world.arena.x,y-world.arena.y)+radius>world.arena.radius)return false;for(let yy=Math.floor(y-radius);yy<=Math.floor(y+radius);yy++)for(let xx=Math.floor(x-radius);xx<=Math.floor(x+radius);xx++)if(solid(world,xx,yy)&&Math.hypot(x-Math.max(xx,Math.min(xx+1,x)),y-Math.max(yy,Math.min(yy+1,y)))<radius)return false;for(let yy=Math.floor(y)-2;yy<=Math.floor(y)+2;yy++)for(let xx=Math.floor(x)-2;xx<=Math.floor(x)+2;xx++)for(const o of world.buckets?.get(xx+','+yy)||[])if(Math.hypot(x-o.x,y-o.y)<radius+o.radius)return false;return true;}
export function moveInWorld(world,f,dx,dy,radius=.22){const before={x:f.x,y:f.y},steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.12));for(let i=0;i<steps;i++){if(canStand(world,f.x+dx/steps,f.y,radius))f.x+=dx/steps;if(canStand(world,f.x,f.y+dy/steps,radius))f.y+=dy/steps;}return Math.hypot(f.x-before.x,f.y-before.y);}
export function clearSight(world,a,b){const d=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.ceil(d/.1);for(let i=1;i<steps;i++)if(solid(world,a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps))return false;return true;}
export function nearestOpen(world,point,radius=.22){if(canStand(world,point.x,point.y,radius))return{x:point.x,y:point.y};for(let r=.3;r<8;r+=.3)for(let a=0;a<Math.PI*2;a+=.3){const x=point.x+Math.cos(a)*r,y=point.y+Math.sin(a)*r;if(canStand(world,x,y,radius))return{x,y};}return{x:32.5,y:57.5};}
export function elevationAt(x,y){return Math.max(0,1-Math.hypot((x-82)/17,(y-6)/20))*12;}
export function trafficAt(world,minutes){return(world.traffic||[]).map(v=>{const corners=v.corners||[[74.15,43.85],[85.15,43.85],[85.15,58.85],[74.15,58.85]],lengths=corners.map((a,i)=>Math.hypot(a[0]-corners[(i+1)%corners.length][0],a[1]-corners[(i+1)%corners.length][1])),total=lengths.reduce((a,b)=>a+b,0);let d=((minutes*1.1*v.speed+v.phase)%total+total)%total,i=0;while(d>lengths[i])d-=lengths[i++];const a=corners[i],b=corners[(i+1)%corners.length],t=d/lengths[i];return{...v,x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,angle:Math.atan2(b[1]-a[1],b[0]-a[0])};});}
export function* routeSearch(world,start,target,radius=.22,{maxNodes=12000,bounds=null}={}){
 const size=world.size||SIZE;
 const reachable=(a,b)=>{
  const count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.1));
  for(let i=0;i<=count;i++)if(!canStand(world,a.x+(b.x-a.x)*i/count,a.y+(b.y-a.y)*i/count,radius))return false;
  return true;
 };
 if(!canStand(world,start.x,start.y,radius)||!canStand(world,target.x,target.y,radius))return[];

 // Join from the actual position: a tree may occupy the cell centre.
 const joins=[];
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
  const p={x:Math.floor(start.x)+dx+.5,y:Math.floor(start.y)+dy+.5};
  joins.push({...p,d:Math.hypot(p.x-start.x,p.y-start.y)});
 }
 const join=joins.sort((a,b)=>a.d-b.d).find(p=>reachable(start,p));
 if(!join)return[];

 const caches=world.routeEdges??=new Map();
 if(!caches.has(radius)){
  if(caches.size>=8)caches.delete(caches.keys().next().value);
  caches.set(radius,new Int8Array(size*size*4));
 }
 const edges=caches.get(radius);
 const sx=Math.floor(join.x),sy=Math.floor(join.y),gx=Math.floor(target.x),gy=Math.floor(target.y);
 const from=sy*size+sx,to=gy*size+gx;

 // Local NPC searches touch at most a few hundred cells. Allocating and filling
 // three county-sized arrays for each of them creates unnecessary GC pressure.
 // Long, infrequent player routes keep dense arrays; concurrent searches own
 // their scratch data, so cancellation cannot corrupt another route.
 const sparse=maxNodes<=256;
 const parents=sparse?new Map():new Int32Array(size*size).fill(-2);
 const cost=sparse?new Map():new Int32Array(size*size).fill(2147483647);
 const closed=sparse?new Set():new Uint8Array(size*size);
 const parentAt=id=>sparse?parents.get(id):parents[id];
 const costAt=id=>sparse?(cost.get(id)??Infinity):cost[id];
 const visited=id=>sparse?closed.has(id):closed[id]===1;
 const remember=(id,parent,value)=>{
  if(sparse){parents.set(id,parent);cost.set(id,value);}
  else{parents[id]=parent;cost[id]=value;}
 };
 remember(from,-1,0);

 const heap=[];
 const push=(id,score)=>{
  const entry={id,score};let i=heap.length;heap.push(entry);
  while(i){const p=(i-1)>>1;if(heap[p].score<=score)break;heap[i]=heap[p];i=p;}
  heap[i]=entry;
 };
 const pop=()=>{
  const first=heap[0],last=heap.pop();
  if(heap.length){
   let i=0;
   while(i*2+1<heap.length){let j=i*2+1;if(j+1<heap.length&&heap[j+1].score<heap[j].score)j++;if(heap[j].score>=last.score)break;heap[i]=heap[j];i=j;}
   heap[i]=last;
  }
  return first.id;
 };
 push(from,Math.abs(gx-sx)+Math.abs(gy-sy));

 let expanded=0;
 while(heap.length&&expanded<maxNodes){
  const id=pop();if(visited(id))continue;
  expanded++;if(expanded%96===0)yield expanded;
  if(sparse)closed.add(id);else closed[id]=1;
  if(id===to){
   const points=[];
   for(let n=to;n!==from;n=parentAt(n))points.push({x:n%size+.5,y:Math.floor(n/size)+.5});
   points.push({x:join.x,y:join.y});points.reverse();
   if(reachable(points.at(-1),target))points.push({x:target.x,y:target.y});
   world.lastRoute={expanded,limited:false};return points;
  }
  const x=id%size,y=Math.floor(id/size),nextCost=costAt(id)+1;
  let direction=0;
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
   const edge=id*4+direction++,xx=x+dx,yy=y+dy,n=yy*size+xx;
   if(xx<1||yy<1||xx>=size-1||yy>=size-1)continue;
   if(bounds&&(xx<bounds.left||xx>bounds.right||yy<bounds.top||yy>bounds.bottom))continue;
   if(visited(n)||costAt(n)<=nextCost||edges[edge]===-1)continue;
   if(!edges[edge]){
    const middle={x:x+.5,y:y+.5};moveInWorld(world,middle,dx,dy,radius);
    edges[edge]=canStand(world,xx+.5,yy+.5,radius)&&Math.hypot(middle.x-xx-.5,middle.y-yy-.5)<.02?1:-1;
   }
   if(edges[edge]!==1)continue;
   remember(n,id,nextCost);
   push(n,nextCost+1.3*(Math.abs(gx-xx)+Math.abs(gy-yy)));
  }
 }
 world.lastRoute={expanded,limited:expanded>=maxNodes};return[];
}
export function route(...args){const search=routeSearch(...args);let step;do{step=search.next();}while(!step.done);return step.value;}
// NPCs share a small planning budget. A blocked sidewalk must never cause every
// resident to search the entire county on the same frame. null means deferred.
export function localRoute(world,start,target,radius=.25){
 if(world.aiRouteBudget!==undefined){if(world.aiRouteBudget<=0)return null;world.aiRouteBudget--;}
 if(!canStand(world,target.x,target.y,radius))return[];
 const d=Math.hypot(target.x-start.x,target.y-start.y),n=Math.ceil(d/.12);let direct=d<32;
 for(let i=1;direct&&i<=n;i++)if(!canStand(world,start.x+(target.x-start.x)*i/n,start.y+(target.y-start.y)*i/n,radius))direct=false;
 if(direct)return[{x:target.x,y:target.y}];
 return route(world,start,target,radius,{maxNodes:160,bounds:{left:Math.min(start.x,target.x)-4,right:Math.max(start.x,target.x)+4,top:Math.min(start.y,target.y)-4,bottom:Math.max(start.y,target.y)+4}});
}
