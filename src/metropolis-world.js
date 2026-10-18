import {CITY_BOUNDS,CITY_BUILDINGS,CITY_DESTINATIONS,CITY_DISCOVERIES,inCity} from './metropolis-data.js';

// Stamp an authored street network into unused county land. It never touches
// existing forest trails, coins, boss arenas or the old neighbourhoods.
export function buildMetropolis({tiles,size,sprites,buildings,road,seed,hash}){
 const {left,top,right,bottom}=CITY_BOUNDS;
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)tiles[y*size+x]=2;
 // No seeded trees inside streets or homes; planted trees are placed explicitly.
 for(let i=sprites.length-1;i>=0;i--)if(inCity(sprites[i].x,sprites[i].y))sprites.splice(i,1);
 road(144,116,202,116);road(202,116,202,32);road(171,148,202,148);road(144,116,144,120);
 const put=(kind,x,y,variant=0,radius=0,id)=>sprites.push({id:id||'city-'+kind.toLowerCase()+'-'+Math.round(x*10)+'-'+Math.round(y*10),kind,x,y,variant,radius,metro:true});
 // A real canal and pedestrian bridges; houses never overwrite a crossing.
 for(let y=147;y<=161;y++)for(let x=260;x<=310;x++)if(![274,275,276,286,287,288,300,301,302].includes(x))tiles[y*size+x]=3;
 for(const b of CITY_BUILDINGS){buildings.push({...b,door:{...b.door}});for(let y=b.top;y<b.top+b.depth;y++)for(let x=b.left;x<b.left+b.width;x++)tiles[y*size+x]=b.kind==='manor'?5:b.style==='brick'?4:7;}
 for(const p of CITY_DESTINATIONS){road(p.x,p.y,p.x,p.y+3);put('metroSign',p.x+1.4,p.y+2.2,p.id==='tether'?0:p.station?1:2,.1,'city-sign-'+p.id);}
 put('metroMonument',230.5,55.5,0,.65);put('metroFountain',230.5,115.5,0,.75);
 for(const x of [201.5,257.5,313.5,371.5])for(let y=26.5;y<169;y+=12){put('streetlamp',x,y,0,.12);put('metroPlanter',x+1.1,y+2.8,0,.45);}
 for(const y of [49.5,109.5,165.5])for(let x=209.5;x<368;x+=12){if([204.15,254.15,260.15,310.15,316.15,366.15].some(n=>Math.abs(n-x)<1))continue;put('streetlamp',x,y,0,.12);if(y===165.5)put('metroPlanter',x,y+3,1,.5);}
 for(const b of CITY_BUILDINGS){
  if(b.kind==='house'){put('laundry',b.left+1.1,b.top+b.depth+1.2,0,.12);put('metroBike',b.left+b.width-1,b.top+b.depth+.9,0,.3);}
  if(b.kind==='manor'){put('metroGarden',b.left+1,b.top+b.depth+2.8,0,.5);put('metroPlanter',b.left+b.width-1,b.top+b.depth+2.8,1,.45);}
  put('resident',b.door.x+2,b.door.y+1,(b.left+b.top)%12,0,'city-resident-'+b.id);
 }
 // Locally queried residents keep distant districts dormant.
 for(let i=0;i<84;i++){const col=i%3,row=Math.floor(i/3),x=208.5+col*56+(row%4)*9,y=51.5+Math.floor(row/4)*13;if(tiles[Math.floor(y)*size+Math.floor(x)]===2)put('resident',x,y,i%12,0,'city-citizen-'+i);}
 for(const s of sprites.filter(s=>s.metro&&s.kind==='resident'))Object.assign(s,{homeX:s.x,homeY:s.y,phase:hash(seed,Math.round(s.x*31+s.y))*6.28});
 for(const d of CITY_DISCOVERIES.filter(d=>!d.floor))put(d.kind,d.x,d.y,0,0,'city-secret-'+d.id);
 for(let i=0;i<8;i++){put('bench',266.5+i*6,144.5,0,.5);put('metroLantern',266.5+i*6,162.7,i%3,.1);}
 for(let i=0;i<8;i++)sprites.push({id:'city-bird-'+i,kind:'bird',x:210+i*20,y:118,airborne:true,phase:i,metro:true});
 const traffic=[];for(let district=0;district<3;district++)for(let i=0;i<6;i++)traffic.push({id:'city-traffic-'+district+'-'+i,kind:i%3===2?'trafficMotor':'trafficCar',phase:i*31,speed:1.6+i%3*.3,radius:i%3===2?.4:.62,model:(i+district)%8,corners:[[204.15+district*56,46.85],[254.15+district*56,46.85],[254.15+district*56,106.85],[204.15+district*56,106.85]]});
 return{traffic,buildings:new Map(CITY_BUILDINGS.map(b=>[b.id,b]))};
}
