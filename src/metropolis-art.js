import {CITY_BUILDINGS,CITY_DESTINATIONS,cityDistrict} from './metropolis-data.js';
const AVENUES_X=[204,254,260,310,316,366],AVENUES_Y=[46,106,116,166];

export function drawCitySprite(c,kind,variant=0){
 if(!kind.startsWith('metro'))return false;
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const text=(value,x,y,size=7,color='#baf6db')=>{c.fillStyle=color;c.font=size+'px monospace';c.textAlign='center';c.fillText(value,x,y);};
 r(5,61,38,3,'#091c2944');
 if(kind==='metroSign'||kind==='metroLogo'){
  r(22,32,4,32,'#5c7d7b');r(2,7,44,30,'#172e3c');r(3,8,42,2,'#64ddbd');r(5,11,38,23,'#204d4d');
  text(variant===0?'TETHER':variant===1?'METRO':'BUY',24,25,variant===0?7:9);r(5,30,38,2,'#8ce1c2');
 }else if(kind==='metroMonument'){
  r(10,55,28,7,'#648b88');r(14,49,20,7,'#284959');r(22,31,4,20,'#88b9b7');r(9,7,30,26,'#52cfad');r(13,3,22,4,'#b2ffe2');r(13,11,22,18,'#1b665c');text('BUY',24,23,9,'#d7ffb7');r(9,34,30,2,'#568d89');
 }else if(kind==='metroFountain'){
  r(2,47,44,14,'#91b9b7');r(5,47,38,7,'#3c99b1');r(19,26,10,25,'#86b2b5');r(11,26,27,5,'#c2d9d0');r(23,8,3,20,'#b1ece1');for(let i=0;i<6;i++)r(7+i*6,30+i%3*4,2,16-i%3*4,'#7bd6d9');
 }else if(kind==='metroPlanter'||kind==='metroGarden'){
  r(11,48,27,14,'#85775c');r(9,45,31,5,'#bfad89');r(22,24,3,22,'#77805a');r(8,28,31,12,'#326b59');r(14,18,22,14,'#4a9173');r(19,11,10,14,'#71b38b');if(kind==='metroGarden'){r(7,35,7,5,'#e5b68c');r(32,25,6,6,'#d799b8');}
 }else if(kind==='metroUmbrella'){
  r(23,19,2,42,'#8d9f99');r(5,13,38,7,'#c17d73');r(10,7,28,8,'#e3ac88');r(19,3,10,5,'#efc395');r(5,20,38,2,'#764a57');r(22,60,10,2,'#acba9f');
 }else if(kind==='metroRadio'){
  r(8,37,32,23,'#ad8e69');r(11,40,18,16,'#354454');r(31,42,6,4,'#e4c795');r(32,51,4,4,'#bce5ad');r(12,30,2,8,'#b8c5b1');r(14,15,1,18,'#bec8b9');for(let i=0;i<5;i++)r(13,42+i*3,13,1,'#657b83');
 }else if(kind==='metroTelescope'){
  r(23,28,3,22,'#a4b7af');r(14,50,3,13,'#789d9f');r(33,50,3,13,'#789d9f');r(17,45,17,4,'#72918c');r(8,18,27,12,'#87b6bf');r(5,16,7,16,'#c5d4bd');r(33,21,10,7,'#d3b688');r(7,19,3,10,'#316873');
 }else if(kind==='metroLantern'){
  r(23,3,2,59,'#66585e');r(15,13,18,3,'#bda288');r(13,18,23,24,['#deb17e','#c29bd7','#87cabd'][variant%3]);r(18,21,13,17,'#f5e3ac');r(13,43,23,3,'#816b60');r(23,46,2,5,'#e2bc8b');
 }else if(kind==='metroBike'){
  for(const x of [10,35]){c.strokeStyle='#1a2f3c';c.lineWidth=3;c.strokeRect(x-7,46,14,15);}c.strokeStyle='#c7b987';c.lineWidth=2;c.beginPath();c.moveTo(10,54);c.lineTo(21,41);c.lineTo(25,55);c.lineTo(10,54);c.moveTo(25,55);c.lineTo(31,37);c.lineTo(35,54);c.stroke();r(16,38,10,3,'#394e53');
 }else if(kind==='metroLift'){
  r(3,3,42,60,'#4b6d77');r(7,9,34,53,'#89b3b4');r(23,9,2,53,'#254f5e');r(9,11,12,48,'#b2c7bc');r(28,11,10,48,'#719f9f');r(16,1,17,6,'#132e3b');text('▲',24,7,7);r(43,29,4,7,'#94e5c2');
 }else if(kind==='metroDesk'){
  r(3,34,42,7,'#b5b89c');r(6,41,36,20,'#3c626b');r(12,24,13,11,'#18323f');r(14,26,9,6,'#79ceb9');r(30,31,9,3,'#f1d29b');
 }else if(kind==='metroScreen'||kind==='metroArcade'){
  r(10,7,29,55,'#274756');r(6,4,36,6,'#d59bca');r(13,14,23,24,'#0c2536');for(let i=0;i<5;i++)r(16,18+i*4,12+(i%2)*5,1,'#66d0b2');r(9,41,32,7,'#527f86');r(16,43,4,2,'#e4adbd');r(29,42,5,4,'#b3efbb');text('BUY',25,58,6,'#8ab7b5');
 }else if(kind==='metroArchive'){
  r(5,3,38,60,'#58777e');for(let row=0;row<5;row++){r(8,7+row*10,32,8,'#b0bca4');r(19,10+row*10,11,2,'#607b7c');r(10,8+row*10,5,3,'#edcf96');}
 }else if(kind==='metroArt'){
  r(3,4,42,42,'#c0b087');r(6,7,36,36,'#24445c');r(9,26,30,13,'#568981');r(11,20,11,8,'#a2c2a2');r(26,12,9,9,['#efc58c','#b69cda','#8ed5ca'][variant%3]);r(21,46,5,16,'#8b9d91');
 }else return false;
 return true;
}

export function cityGround(x,y,night,rain){
 const district=cityDistrict(x,y);if(!district)return null;
 let avenue=false,stripe=false;for(const n of AVENUES_X){const d=Math.abs(x-n);if(d<2)avenue=true;if(d<.07&&Math.floor(y)%5<3)stripe=true;}for(const n of AVENUES_Y){const d=Math.abs(y-n);if(d<2)avenue=true;if(d<.07&&Math.floor(x)%5<3)stripe=true;}
 if(avenue)return stripe?(night?'#789889':'#d7d2af'):night?'#263d48':rain?'#4b6370':'#566773';
 const seam=x%1<.045||y%1<.045;
 return district==='copper'?(seam?'#716659':night?'#4b484c':'#aa9c86'):district==='heights'?(seam?'#81918a':night?'#4f5d5d':'#b7c1ad'):district==='waterfront'?(seam?'#576e75':night?'#344e59':'#8ca8ad'):(seam?'#647d82':night?'#354e5a':rain?'#6f929c':'#93afb1');
}

export function drawCityFacade(c,b,{x,top,base,height,columns,wallX,night}){
 const glass=b.style==='glass';c.fillStyle=glass?(night?'#163d4b':'#57868e'):b.style==='brick'?(night?'#5c4545':'#b58b70'):(night?'#4b525e':'#bbc2b3');c.fillRect(x,top,columns,height);
 const rows=Math.min(24,b.floors),rh=height/rows;
 for(let row=Math.max(0,Math.floor(-top/rh));row<Math.min(rows,Math.ceil(((c.canvas?.height||270)-top)/rh));row++){
  const y=top+row*rh;c.fillStyle=glass?'#b5e0d12b':'#233b432b';c.fillRect(x,y,columns,Math.max(1,rh*.07));
  if(wallX>.12&&wallX<.82){c.fillStyle=night?((row+Math.floor(b.x)+Math.floor(wallX*9))%4?'#a3d7be':'#213f50'):(glass?'#a0c7c2':'#405f70');c.fillRect(x,y+rh*.22,columns,rh*.53);if(glass&&wallX>.56)c.fillStyle='#6f9d9d';}
 }
 c.fillStyle=b.id==='tether'?'#66e2bb':glass?'#8dced2':'#d5c19c';c.fillRect(x,top,columns,Math.max(2,height*.008));
 if(wallX<.1){c.fillStyle=glass?'#244855':'#6c736c';c.fillRect(x,top,columns,height);}
 c.fillStyle='#29404c';c.fillRect(x,base-height*.018,columns,Math.max(2,height*.018));
}

// A fixed number of authored silhouettes, independent of population. Nearby
// geometry is rendered by the same solid raycast as the rest of the county.
export function drawCitySkyline(c,f,w,h,horizon,night,extra=[]){
 const ca=Math.cos(f.angle),sa=Math.sin(f.angle);
 const distant=[...CITY_BUILDINGS,...extra].map(b=>{const dx=b.x-f.x,dy=b.y-f.y;return{b,depth:dx*ca+dy*sa,side:-dx*sa+dy*ca};}).filter(a=>a.depth>44&&a.depth<280).sort((a,b)=>b.depth-a.depth);
 for(const {b,depth,side}of distant){const sx=w*.5*(1+side/(depth*.7)),bw=Math.max(2,w*.5*(b.width+b.depth*.35)/(depth*.7)),height=h*b.height/depth,base=horizon+h*.53/depth,top=base-height;if(sx+bw<0||sx-bw>w)continue;c.fillStyle=night?'#244451':b.style==='brick'?'#7b8f90':'#5f8b94';c.fillRect(Math.round(sx-bw/2),Math.round(top),Math.ceil(bw),Math.ceil(height));c.fillStyle=b.id==='tether'?'#6de4bc':night?'#8bb0a8':'#a7c3bb';c.fillRect(sx-bw/2,top,bw,1);if(bw>5)for(let y=Math.max(0,top+4);y<base;y+=5){c.fillStyle=night?'#acdbbd55':'#a9ccc54d';c.fillRect(sx-bw/2+2,y,Math.max(1,bw-4),1);}if(b.id==='tether'){c.fillStyle='#7fe9c0';c.fillRect(sx-1,top-7,2,7);if(bw>30){c.save();c.fillStyle='#caebd6';c.font='6px monospace';c.textAlign='center';c.fillText('TETHER',sx,top+10);c.restore();}}}
}

export function drawCityMap(canvas,world,f){
 const left=136,top=16,right=378,bottom=178,unit=2.5;canvas.width=(right-left)*unit;canvas.height=(bottom-top)*unit;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){const t=world.tiles[y*world.size+x];c.fillStyle=t===3?'#427e8d':t>3?'#ad9d8a':t===2?(x<198?'#738575':x<258?'#50747b':x<314?'#796b59':'#78847a'):'#203b34';c.fillRect((x-left)*unit,(y-top)*unit,unit+1,unit+1);}
  c.font='bold 12px monospace';c.textAlign='center';c.textBaseline='middle';
  for(const [i,p]of CITY_DESTINATIONS.entries()){const x=(p.x-left)*unit,y=(p.y-top)*unit;c.fillStyle='#102b37';c.fillRect(x-9,y-9,18,18);c.strokeStyle=p.color;c.strokeRect(x-9,y-9,18,18);c.fillStyle='#eef4cf';c.fillText(i+1,x,y);}
  const player=f.life.combat.interior?.outside||f;if(player.x>=left&&player.x<right&&player.y>=top&&player.y<bottom){c.save();c.translate((player.x-left)*unit,(player.y-top)*unit);c.rotate(player.angle||0);c.fillStyle='#f3df83';c.beginPath();c.moveTo(7,0);c.lineTo(-4,-4);c.lineTo(-3,4);c.fill();c.restore();}
}

export function drawCityVista(canvas,f){
 canvas.width=640;canvas.height=260;const c=canvas.getContext('2d'),hour=Math.floor(f.minutes/60)%24,night=hour<6||hour>=19; c.imageSmoothingEnabled=false;
 const sky=c.createLinearGradient(0,0,0,260);sky.addColorStop(0,night?'#102637':'#527c97');sky.addColorStop(1,night?'#827473':'#efcda4');c.fillStyle=sky;c.fillRect(0,0,640,260);
 c.fillStyle=night?'#d7e6c4':'#ffe2b0';c.fillRect(480,34,24,24);c.fillRect(476,38,32,16);
 for(let layer=0;layer<3;layer++)for(let i=0;i<30;i++){const x=i*25+layer*7,y=80+layer*38-((i*37+layer*11)%59),height=260-y;c.fillStyle=['#4d6d7a','#355566','#213d50'][layer];c.fillRect(x,y,19,height);c.fillStyle=night?'#d9d49a':'#87b4b7';for(let row=y+6;row<240;row+=9)for(let col=x+3;col<x+17;col+=6)if((row+col+i)%3)c.fillRect(col,row,2,3);}
 c.fillStyle='#254a60';c.fillRect(0,207,640,53);for(let i=0;i<35;i++){c.fillStyle=i%3?'#78b2b4':'#d8bd95';c.fillRect(i*19,220+(i%4)*6,9,1);}c.fillStyle='#142e3c';c.fillRect(0,245,640,15);c.fillRect(12,0,8,260);c.fillRect(620,0,8,260);c.fillRect(0,0,640,7);c.fillStyle='#9dc9b0';c.font='10px monospace';c.fillText('TETHER / 60     '+String(hour).padStart(2,'0')+':'+String(Math.floor(f.minutes)%60).padStart(2,'0'),30,240);
}
