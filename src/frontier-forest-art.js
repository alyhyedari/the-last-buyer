import {echoRadius} from './frontier-perks.js';
import {forestPulseActive} from './frontier-forest-state.js';
import {FOREST_COINS,inDeepForest} from './frontier-forest-data.js';
const glyphs={B:['110','101','110','101','110'],U:['101','101','101','101','111'],Y:['101','101','010','010','010']};
export function drawForestSprite(c,kind,v){
 const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
 if(kind==='buyCoin'){
  const dim=v===1;r(9,54,30,3,'#082a2988');for(const [x,y,w,h]of [[16,8,16,43],[11,12,26,35],[8,17,32,25],[6,23,36,13]])r(x,y,w,h,dim?'#356e60':'#70c932');for(const [x,y,w,h]of [[17,11,14,36],[12,15,24,28],[9,22,30,14]])r(x,y,w,h,dim?'#4e8e72':'#b5ff52');r(13,19,22,21,dim?'#22544c':'#83f33b');r(16,14,15,2,dim?'#90ba8c':'#f0ffac');r(11,20,2,15,dim?'#81a580':'#dfff7c');r(34,21,2,15,'#398e40');
  for(const [i,ch]of [...'BUY'].entries())for(const [y,row]of glyphs[ch].entries())for(let x=0;x<3;x++)if(row[x]==='1')r(13+i*8+x*2,23+y*2,2,2,dim?'#8ab89d':'#133c25');
  if(dim){r(21,40,7,3,'#b7e1be');r(22,37,5,4,'#183e38');r(23,35,3,3,'#b7e1be');}else{r(2,10,2,5,'#b4fc64');r(0,12,6,1,'#d9ff97');r(43,37,2,4,'#b4fc64');}return true;
 }
 if(kind==='tree'&&v>=3){
  const birch=v===4,broad=v===5||v===6,old=v===7,trunk=birch?'#c6cab1':old?'#63563e':'#574f39';
  r(20,24,8,39,trunk);r(26,27,3,36,birch?'#8f9e85':'#343d2e');r(16,60,20,4,'#344d2b');r(17,52,5,10,'#4f6437');r(28,57,7,6,'#53653a');
  if(birch)for(let y=31;y<60;y+=8){r(20,y,5,2,'#455a4b');r(25,y+4,3,2,'#455a4b');}
  const palette=broad?['#193d31','#2e5e3d','#477b49','#699252']:birch?['#2c4c34','#497446','#669250','#94a265']:['#123c36','#225747','#376d50','#527f54'];
  if(broad){for(const [x,y,w,h]of [[5,4,36,18],[0,15,48,18],[7,30,36,13],[12,0,25,9]])r(x,y,w,h,palette[0]);for(const [x,y,w,h]of [[8,7,26,11],[3,19,25,9],[14,31,24,7]])r(x,y,w,h,palette[1]);r(12,7,15,5,palette[2]);r(4,21,13,4,palette[2]);r(16,7,7,2,palette[3]);}
  else for(let tier=0;tier<5;tier++){const y=tier*8+2,width=10+tier*9;r(24-width/2,y,width,10,palette[0]);r(25-width/2,y+1,width*.72,5,palette[1]);r(25-width/2,y+2,width*.36,2,palette[2]);}
  if(old){r(13,30,9,4,trunk);r(12,26,3,8,trunk);r(27,43,10,3,trunk);r(34,38,3,8,trunk);r(21,48,4,13,'#23392c');r(19,41,2,15,'#70a35e');}
  if(v===6){r(20,47,8,3,'#2d3727');r(21,48,6,1,'#88b959');}return true;
 }
 if(kind==='fern'||kind==='forestGrass'){
  r(23,41,2,22,'#547c46');for(let j=0;j<5;j++){const y=43+j*4,len=6+j*3;for(const side of [-1,1]){r(side<0?24-len:24,y,len,2,j%2?'#426d3d':'#648d4c');r(side<0?24-len:22+len,y-3,2,4,'#7b9c58');}}return true;
 }
 if(kind==='forestLog'){r(2,52,42,10,'#303d29');r(6,48,35,12,'#655038');r(7,50,32,2,'#8b6a40');r(11,56,30,2,'#392f25');r(1,48,9,13,'#9e8052');r(3,51,5,6,'#594831');r(4,52,3,3,'#c5a56a');r(13,47,22,3,'#5b8040');r(17,46,9,2,'#7b9d53');r(30,44,6,3,'#d4b68c');r(33,47,1,4,'#a5a476');return true;}
 if(kind==='forestStone'){r(6,45,35,18,'#4b6055');r(12,38,23,22,'#738579');r(16,35,16,5,'#91a18c');r(9,56,28,6,'#386343');r(14,57,14,3,'#698a4c');r(21,43,2,11,'#b2c7a0');r(17,47,10,2,'#b2c7a0');return true;}
 if(kind==='forestMushrooms'||kind==='forestFlowers'){
  for(let i=0;i<4;i++){const x=5+i*11,y=48+i%2*7;r(x+2,y,2,63-y,'#a8b588');r(x-1,y-4,9,5,kind==='forestMushrooms'?['#9b976b','#80c7a0','#b9c891'][v%3]:'#c1b9db');r(x+1,y-4,3,1,'#ecedd2');}return true;
 }return false;
}
export const forestSpriteSize=s=>s.kind==='buyCoin'?90:s.kind==='tree'&&s.variant>=3?(s.glade?690:560):s.kind==='forestStone'?105:s.kind==='forestLog'?95:s.understory?85:null;
export function drawForestAtmosphere(renderer,f,time,horizon,night){
 if(renderer.world.interior||!inDeepForest(f.x,f.y))return;
 const c=renderer.c,w=renderer.w,h=renderer.h,reduced=renderer.settings.reducedMotion,region=f.y<190?0:f.y<270?(f.x<210?0:f.x<295?1:2):(f.x<240?3:f.x<315?4:5),motes=['#b7ec7e77','#edb17277','#a2dbed77','#c8b5ed77','#e8dfad77','#c8efdd77'];
 // Fine canopy shade and slow motes; no flashing. Lower tier draws fewer particles.
 c.fillStyle=night?'#082a2428':['#183e3020','#703a2322','#1a536928','#45345222','#6e653422','#22473d30'][region];c.fillRect(0,0,w,h);
 // Overhead foliage is a canopy, not extra invisible ground collision.
 for(let layer=0;layer<2;layer++){c.fillStyle=layer?night?'#142e29':'#264e36':night?'#102822':'#1c3b2c';for(let i=-2;i<18;i++){const x=((i*39-f.angle*32+f.x*2+f.y)%600+600)%600-60,edge=Math.abs(x-w/2)/(w/2),depth=12+edge*24+Math.sin(i*2.8+layer)*8;c.fillRect(Math.round(x),0,42,Math.max(4,depth-layer*8));if(i%3===0)c.fillRect(Math.round(x)+18,depth-layer*8,7,7);}}
 for(let i=0;i<(renderer.low?7:18);i++){const x=((i*137-f.angle*90+(reduced?0:Math.sin(time*.22+i)*12))%w+w)%w,y=36+(i*37)%145+(reduced?0:Math.cos(time*.35+i)*3);c.fillStyle=night||f.y>190?motes[region]:'#d6e7a343';c.fillRect(Math.round(x),Math.round(y),night?2:1,1);}
}
export function drawForestPulse(renderer,f,time){
 if(renderer.world.interior||!forestPulseActive(f))return;const c=renderer.c,w=renderer.w,h=renderer.h,q=f.life.forest;
 c.strokeStyle='#b7ff7888';c.lineWidth=1;c.strokeRect(9,9,w-18,h-18);
 for(const coin of FOREST_COINS){if(q.coins.includes(coin.id)||Math.hypot(coin.x-q.pulseX,coin.y-q.pulseY)>echoRadius(f))continue;
  const a=Math.atan2(coin.y-f.y,coin.x-f.x)-f.angle,relative=Math.atan2(Math.sin(a),Math.cos(a));if(Math.abs(relative)>.64)continue;
  const x=w/2+Math.tan(relative)*w/1.4,y=h*.4;c.strokeStyle='#b4ff61';c.strokeRect(Math.round(x)-4,y-4,8,8);c.fillStyle='#c9ff98';c.font='8px monospace';c.textAlign='center';c.fillText('BUY',x,y-9);c.textAlign='start';
 }
}
