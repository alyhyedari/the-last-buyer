import {CYBER_SPOTS} from './cyber-data.js';
export function buildCoast({tiles,size,sprites,buildings}){
 const paint=(x,y,t)=>{if(x>1&&y>1&&x<size-2&&y<size-2)tiles[Math.floor(y)*size+Math.floor(x)]=t;};
 const road=(ax,ay,bx,by,width=4)=>{const n=Math.ceil(Math.hypot(bx-ax,by-ay)*2);for(let i=0;i<=n;i++){const x=Math.floor(ax+(bx-ax)*i/n),y=Math.floor(ay+(by-ay)*i/n);for(let dy=-width;dy<=width;dy++)for(let dx=-width;dx<=width;dx++)paint(x+dx,y+dy,2);}};
 for(let y=130;y<500;y++)for(let x=390;x<510;x++)paint(x,y,x>=475?3:0);
 road(354,142,404,142,2);road(404,142,404,420);road(404,190,454,190);road(454,190,454,420);road(404,420,454,420);road(404,154,450,154,2);road(404,164,450,164,2);road(404,176,450,176,2);road(454,260,472,260,2);road(429,420,429,488,2);for(let y=446;y<=482;y+=18)road(403,y,453,y,2);
 // Clear inherited trees before creating coast scenery; the old world is untouched.
 for(let i=sprites.length-1;i>=0;i--)if(sprites[i].x>=390&&sprites[i].y>=130)sprites.splice(i,1);
 for(let i=0;i<8;i++){const left=414+i%4*11,top=134+Math.floor(i/4)*47,width=7,depth=7;for(let y=top;y<top+depth;y++)for(let x=left;x<left+width;x++)paint(x,y,7);buildings.push({id:'coast-tower-'+i,x:left+3.5,y:top+3.5,left,top,width,depth,kind:'house',height:3.5+i%4*1.7,floors:8+i%4*5,style:i%2?'glass':'brick',door:{x:left+3.5,y:top+depth+.7}});sprites.push({id:'coast-neon-'+i,kind:'neonSign',x:left+3.5,y:top+depth+.3,variant:i%3});}
 for(let y=210;y<=450;y+=12){sprites.push({id:'coast-palm-'+y,kind:'coastPalm',x:470.5,y:y+.5,radius:.22},{id:'coast-parasol-'+y,kind:'coastParasol',x:465.5,y:y+4.5},{id:'coast-seat-'+y,kind:'bench',x:461.5,y:y+3.5,radius:.4});}
 for(let y=205;y<=405;y+=16)for(const x of [398.5,460.5])sprites.push({id:'coast-lamp-'+x+'-'+y,kind:'streetlamp',x,y,radius:.12});
 for(let i=0;i<60;i++)sprites.push({id:'coast-adult-'+i,kind:'resident',x:463.5+(i%3),y:210.5+i*3.7,homeX:463.5+(i%3),homeY:210.5+i*3.7,variant:i%12,phase:i*.27});
 sprites.push({id:'coast-war-gate',kind:'neonBeacon',x:429.5,y:432.5,peaceful:true});
 for(const p of CYBER_SPOTS)sprites.push({id:p.id,kind:'neonBeacon',x:p.x,y:p.y,peaceful:true});
 for(let i=0;i<22;i++)sprites.push({id:'war-cover-'+i,kind:'warSandbag',x:404+(i%11)*4.5,y:449+Math.floor(i/11)*26,radius:.48});
 const traffic=[];for(let i=0;i<12;i++)traffic.push({id:'coast-traffic-'+i,kind:i%4===0?'trafficMotor':'trafficCar',model:i%14,phase:i*39,speed:4+i%3,radius:i%4===0?.34:.55,corners:[[402.5,194.5],[402.5,414.5],[452.5,414.5],[452.5,194.5]]});return traffic;
}
export function coastGround(x,y,tile,night,time=0){
 if(x<390||y<130)return null;
 if(tile===3)return Math.sin(y*2+x*.7+time)>.86?(night?'#567e91':'#d1ede0'):(night?'#173e54':'#3e9ca9');
 if(tile===0&&x>=460)return night?'#76757e':(Math.floor(x*5+y*7)%3?'#d5c5a3':'#e4d6b7');
 if(tile!==2)return null;
 const lane=((Math.abs(x-404.5)<.08||Math.abs(x-454.5)<.08)&&y>=190)||(Math.abs(y-190.5)<.08||Math.abs(y-420.5)<.08)&&x>=400;
 const edge=y>190&&(Math.abs(x-400)<.12||Math.abs(x-459)<.12);
 return edge?'#35e2d2':lane&&Math.floor((x+y)/3)%2===0?'#e1bc6d':night?'#222c40':'#454b60';
}
