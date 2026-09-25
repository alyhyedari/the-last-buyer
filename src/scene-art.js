import {character,rng} from './art.js';
const rect=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
export function mosaic(c,x,y,w=32,h=24,seed=12){const r=rng(seed);for(let yy=0;yy<h;yy+=6)for(let xx=0;xx<w;xx+=6)rect(c,['#667568','#a9aa7c','#2a3d38','#89927b'][Math.floor(r()*4)],x+xx,y+yy,6,6);}
export function drawEpisode(c,index,data={},veil=true,calm=false){
 c.imageSmoothingEnabled=false;const r=rng(881+index),W=c.canvas.width,H=c.canvas.height;
 rect(c,'#0c1a1c',0,0,W,H);for(let y=0;y<H;y+=8)for(let x=0;x<W;x+=8)if(r()>.7)rect(c,index===5?'#7260420e':'#7493760c',x,y,7,7);
 rect(c,'#758774',10,H-13,W-20,1);c.font='8px monospace';c.fillStyle='#6a8776';c.textAlign='left';c.fillText(`ARCHIVE / ${String(index+1).padStart(2,'0')}`,12,16);
 if(index===0){
  rect(c,'#3f574b',80,31,160,74);rect(c,'#b6b791',85,34,150,62);rect(c,'#344840',98,47,124,35);
  [120,200].forEach((x,i)=>{c.strokeStyle='#a2ac80';c.lineWidth=4;c.beginPath();c.arc(x,64,11,0,7);c.stroke();rect(c,'#cdd4a4',x-2,57,4,14);});
  rect(c,'#485644',113,89,95,8);rect(c,'#0d211e',119,90,83,5);[18,47,81].forEach((n,i)=>rect(c,data.bands?.includes(i)?'#b7f578':'#6c7958',136+i*18,41,9,3));
 }else if(index===1){
  rect(c,'#6d6546',39,49,244,47);for(let i=0;i<3;i++){rect(c,'#293d30',57+i*82,69,49,27);rect(c,'#aa9565',55+i*82,65,53,5);for(let z=0;z<(data.portions?.[i]||0);z++)rect(c,'#dec780',61+i*82+(z%5)*8,61-Math.floor(z/5)*7,5,4);}
 }else if(index===2){
  const nodes={A:[48,63],B:[156,39],C:[100,98],D:[176,98],E:[238,90],F:[278,49]};c.lineWidth=2;c.strokeStyle='#527882';for(const[a,b]of[['A','B'],['B','F'],['A','C'],['C','D'],['D','E'],['E','F']]){c.beginPath();c.moveTo(...nodes[a]);c.lineTo(...nodes[b]);c.stroke();}
  for(const[id,[x,y]]of Object.entries(nodes)){rect(c,data.route?.includes(id)?'#b7f578':'#416570',x-7,y-7,14,14);c.fillStyle='#0c1a1c';c.fillText(id,x-3,y+3);}if(!calm){rect(c,'#394846',264,83,21,14);if(veil)mosaic(c,266,84,18,12,index);}
 }else if(index===3){
  for(let i=0;i<3;i++){const x=37+i*89;rect(c,'#8e9172',x,53,60,47);c.fillStyle='#66785c';c.beginPath();c.moveTo(x-7,53);c.lineTo(x+30,31);c.lineTo(x+67,53);c.fill();const water=(data.portions?.[i]||0)*6;rect(c,'#4c809699',x+2,99-water,56,water);rect(c,'#c1c792',x+22,58,14,15);rect(c,'#203b36',x+23,83,14,17);}
 }else if(index===4){
  for(let i=0;i<5;i++){const x=23+i*58;rect(c,'#39584d',x,35,40,60);for(let y=40;y<90;y+=10){rect(c,'#142b2a',x+4,y,32,7);rect(c,(data.selected||[]).includes(i)?'#b7f578':'#719a83',x+29,y+2,4,3);}c.fillStyle='#bdcf9c';c.fillText(String.fromCharCode(65+i),x+17,107);}if(!calm){character(c,160,86,{kind:'shadow',scale:1.5,alpha:.7});if(veil)mosaic(c,148,43,24,18,4);}
 }else if(index===5){
  rect(c,'#c1a569',73,44,174,33);rect(c,'#766244',80,77,6,26);rect(c,'#766244',232,77,6,26);character(c,55,78,{kind:'mina',scale:1.5});character(c,265,79,{scale:1.5,facing:-1});rect(c,'#dbc288',130,45,54,24);c.fillStyle='#d1a258';c.beginPath();c.ellipse(157,55,22,8,0,0,7);c.fill();for(let i=0;i<3;i++)rect(c,data.playing?.[i]?'#d0a477':'#526255',138+i*18,90,11,6);
 }else if(index===6){
  rect(c,'#3f5849',21,93,278,13);for(let i=0;i<4;i++){rect(c,'#989f7c',40+i*61,35,47,58);rect(c,'#283e35',46+i*61,51,33,2);rect(c,'#5b7154',46+i*61,58,26,2);c.fillStyle='#20362f';c.fillText(String(data.order?.[i]||'----'),47+i*61,44);}rect(c,'#8d4c49',244,77,18,6);
 }else{
  c.strokeStyle='#526e4f';c.beginPath();c.ellipse(160,74,108,25,0,0,7);c.stroke();[80,160,240].forEach((x,i)=>{character(c,x,77,{kind:['mina','trader','sage'][i],scale:1.4});rect(c,data.accepted?.includes(i)?'#b7f578':'#50634c',x-6,92,12,5);});
 }
 // Static scanlines; deliberately no flashes or rapid luminance changes.
 for(let y=0;y<H;y+=3)rect(c,'#020d0b18',0,y,W,1);
}
export function drawEnding(c,id){
 const index={repayment:0,custodian:1,fire:2,shared:3,leave:4,autopilot:5,witness:6,loop:7}[id]??0;
 drawEpisode(c,index===7?0:5,{},false,true);const w=c.canvas.width;
 rect(c,'#0c1a1ce8',0,20,w,100);rect(c,'#586b48',35,106,w-70,2);
 if(['repayment','leave','witness','shared'].includes(id)){
  character(c,123,99,{scale:1.8});character(c,197,99,{kind:'mina',scale:1.8,facing:-1});rect(c,'#c6c797',144,68,32,19);rect(c,'#53604b',148,72,23,2);if(id==='witness'){rect(c,'#d0d1a4',172,72,17,17);rect(c,'#52624d',175,76,10,1);}if(id==='shared'){[53,268].forEach(x=>character(c,x,101,{kind:'trader',scale:1.2}));}
 }else{
  rect(c,'#4f6952',123,36,77,49);rect(c,'#142c25',129,42,65,33);rect(c,id==='fire'?'#d6a563':'#b7f578',144,51,34,13);character(c,159,109,{scale:1.4});
  if(id==='fire')for(let i=0;i<15;i++)rect(c,i%2?'#aa8054':'#d6b56d',112+i*7,85-(i*17%43),5,15+i%3*5);
  if(id==='loop')for(let i=0;i<3;i++){c.strokeStyle='#9aae6b66';c.strokeRect(91-i*19,29-i*5,136+i*38,75+i*10);}
  if(id==='autopilot'){rect(c,'#96b184',170,54,2,45);rect(c,'#96b184',151,53,20,2);}
 }
}
