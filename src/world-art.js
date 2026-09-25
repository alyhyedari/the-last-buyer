import {rng,character,glow} from './art.js';
import {CHAPTERS} from './content.js';
import {canVisitChapter,settledChapters} from './open-world.js';
import {tr} from './i18n.js';
const rect=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
const paths=[[[956,750],[633,615],[350,351]],[[640,610],[230,610],[230,875]],[[635,605],[659,238]],[[960,655],[1035,205]],[[1060,540],[1370,339]],[[1410,370],[1650,402],[1675,620]],[[1100,824],[1280,1012]],[[955,800],[710,1053]],[[390,960],[709,1053],[1275,1080],[1690,930],[1675,620]],[[230,340],[230,165],[690,165]],[[780,650],[1480,775],[1675,620]]];
function path(c,points,width,color){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
function tree(c,x,y,bloom=false,variant=0){
 rect(c,'#081d1c55',x-24,y+12,67,18);rect(c,'#6b6650',x+6,y-38,8,55);rect(c,'#8a805a',x+7,y-30,2,45);
 rect(c,'#264940',x-26,y-60,72,33);rect(c,'#325649',x-17,y-83,58,45);rect(c,'#416651',x-7,y-90,40,43);rect(c,'#56805b',x-10,y-67,49,16);rect(c,'#739360',x-5,y-84,27,4);
 if(bloom)for(let i=0;i<14;i++)rect(c,['#d6bf88','#c5a675','#e2dba4'][i%3],x-17+(i*29%59),y-78+(i*17%49),4,3);
 if(variant)rect(c,'#9fbe7022',x-18,y-52,52,8);
}
function building(c,p){
 const{x,y,w,h,variant}=p,colors=[['#66745b','#a4a679'],['#44656b','#97b3a1'],['#66745b','#b6b97c'],['#66736a','#b1b9a1'],['#3b6962','#96c4a4'],['#74644a','#c0a678'],['#76614c','#c4ae80']],[wall,trim]=colors[variant];
 rect(c,'#06181788',x+15,y+22,w+10,h+20);rect(c,wall,x,y,w,h);rect(c,trim,x,y,w,4);rect(c,'#293e39',x+7,y+11,w-14,h-17);
 for(let a=14;a<w-26;a+=39){rect(c,trim,x+a,y+18,28,35);rect(c,'#17332e',x+a+3,y+21,22,28);rect(c,variant===5||variant===6?'#c6ab6999':'#8cae7266',x+a+5,y+22,8,25);rect(c,'#718973',x+a+12,y+21,2,28);}
 rect(c,'#2a433c',x-9,y-27,w+18,25);rect(c,'#557163',x-5,y-32,w+10,7);for(let a=0;a<w;a+=15)rect(c,'#8ea88733',x+a,y-26,3,22);rect(c,trim,x-12,y-8,w+24,5);
 if(variant===2){rect(c,'#586b56',x+w/2-35,y-97,70,70);rect(c,'#9da576',x+w/2-39,y-102,78,7);c.fillStyle='#c5c698';c.beginPath();c.arc(x+w/2,y-63,21,0,7);c.fill();c.strokeStyle='#344c3a';c.lineWidth=3;c.beginPath();c.moveTo(x+w/2,y-80);c.lineTo(x+w/2,y-63);c.lineTo(x+w/2+12,y-59);c.stroke();}
 if(variant===4){for(let i=0;i<4;i++){rect(c,'#9ec180',x+16+i*46,y+61,24,3);rect(c,'#34594b',x+16+i*46,y+69,24,3);}}
 if(variant===6){for(let a=0;a<w;a+=20)rect(c,(a/20)%2?'#b8a169':'#597054',x+a,y+6,18,7);}
}
export function makeCommons(world,state){
 const canvas=document.createElement('canvas');canvas.width=world.width;canvas.height=world.height;const c=canvas.getContext('2d',{alpha:false}),r=rng(49270),lit=state.projects.includes('lights');c.imageSmoothingEnabled=false;
 rect(c,lit?'#233932':'#1b302d',0,0,1920,1280);
 for(let y=0;y<1280;y+=16)for(let x=0;x<1920;x+=16){const a=r();if(a>.45)rect(c,a>.85?'#59705722':'#10252244',x,y,16,16);if(a>.87)rect(c,'#85a26833',x+6,y+4,3,2);}
 // Open streets loop around districts; grass remains walkable between them.
 for(const points of paths){path(c,points,108,'#172b28');path(c,points,94,'#53604b');path(c,points,86,lit?'#3b5142':'#344a3e');}
 c.fillStyle='#526146';c.beginPath();c.ellipse(956,733,225,176,0,0,7);c.fill();c.fillStyle=lit?'#4a5d46':'#3e5140';c.beginPath();c.ellipse(956,733,216,167,0,0,7);c.fill();
 for(let i=0;i<4;i++){c.strokeStyle='#acb78322';c.lineWidth=2;c.beginPath();c.ellipse(956,733,68+i*46,44+i*37,0,0,7);c.stroke();}
 for(let y=595;y<876;y+=18)for(let x=765;x<1150;x+=24)if(((x-956)/217)**2+((y-733)/166)**2<1)rect(c,'#d1d7a712',x+(y%36?12:0),y,17,1);
 for(const points of paths){c.setLineDash([2,18]);path(c,points,2,'#a7b7862e');c.setLineDash([]);}
 // The western garden and southern promenade provide quieter, optional routes.
 for(let y=823;y<971;y+=26)for(let x=90;x<170;x+=22){rect(c,'#516541',x,y,11,13);rect(c,'#a9b773',x+2,y+2,6,3);}
 rect(c,'#233f41',49,1186,1821,65);for(let i=0;i<85;i++)rect(c,'#6b9b9233',55+i*22,1191+(i*19%48),14,1);
 rect(c,'#768566',48,1181,1824,5);for(let x=75;x<1870;x+=76){rect(c,'#6b8063',x,1165,4,20);rect(c,'#a8b98a',x-1,1162,6,3);}
 for(const p of world.props){
  if(p.type==='building')building(c,p);
  if(p.type==='tree')tree(c,p.x,p.y,false,p.x%2);
  if(p.type==='bench'){rect(c,'#10231b66',p.x+5,p.y+10,p.w,18);rect(c,'#8b8e65',p.x,p.y-11,p.w,8);rect(c,'#4b6450',p.x+5,p.y-3,4,28);rect(c,'#4b6450',p.x+p.w-10,p.y-3,4,28);rect(c,'#a2a074',p.x,p.y+6,p.w,6);}
  if(p.type==='pond'){rect(c,'#677b65',p.x-8,p.y-7,p.w+16,p.h+14);rect(c,'#183b40',p.x,p.y,p.w,p.h);rect(c,'#264f51',p.x+9,p.y+8,p.w-18,p.h-16);for(let i=0;i<42;i++)rect(c,'#83b1a442',p.x+11+r()*(p.w-40),p.y+12+r()*(p.h-29),12+r()*16,1);for(let i=0;i<12;i++){const x=p.x+28+(i*71%190),y=p.y+19+(i*43%140);rect(c,'#597b56',x,y,11,7);rect(c,'#89a66b',x+2,y+1,7,2);}}
  if(p.type==='monument'){rect(c,'#162e2888',p.x+7,p.y+16,p.w+13,p.h);rect(c,'#697b57',p.x,p.y,p.w,p.h);rect(c,'#a5ac79',p.x+5,p.y+4,p.w-10,6);rect(c,'#314f3d',p.x+13,p.y+17,p.w-26,p.h-30);rect(c,'#bbba82',p.x+31,p.y-33,22,59);rect(c,'#889a63',p.x+19,p.y-42,46,12);rect(c,'#d2cd90',p.x+25,p.y-46,34,6);}
 }
 tree(c,758,542,state.projects.includes('letters'));
 // Garlands and lanterns form visual landmarks without enclosing the square.
 for(let i=0;i<18;i++){const x=270+i*76,y=397+Math.sin(i/3)*26;c.strokeStyle='#142b26';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+35,y+20,x+76,397+Math.sin((i+1)/3)*26);c.stroke();rect(c,i%3?'#7f995c':'#b1ab75',x+33,y+13,8,11);if(lit)glow(c,x+36,y+23,'#dcc681',47,.19);}
 for(const[x,y]of [[411,415],[469,777],[845,350],[1177,447],[1537,895],[1108,989],[522,1077],[1661,348],[339,601],[1430,1018]]){rect(c,'#546a52',x,y-47,4,53);rect(c,lit?'#e9d58d':'#718b65',x-5,y-54,14,12);rect(c,'#a8b580',x-7,y-57,18,3);if(lit)glow(c,x+2,y-42,'#dfcf8a',76,.19);}
 for(let i=0;i<120;i++){const x=70+r()*1780,y=110+r()*1030;rect(c,i%4?'#9ba96b27':'#b6c98150',x,y,2,3);}
 return canvas;
}
export function worldEntityArt(c,e,state,time){
 const{x,y}=e;
 if(e.type==='portal'){
  const available=canVisitChapter(state,e.chapterIndex),done=settledChapters(state).includes(e.chapterIndex),accent=done?'#bddc86':available?'#8ac3bc':'#68796b';
  rect(c,'#08201c99',x-31,y-54,63,63);rect(c,'#698768',x-34,y-62,69,8);rect(c,'#738965',x-32,y-54,7,58);rect(c,'#738965',x+26,y-54,7,58);rect(c,'#25483d',x-24,y-49,49,49);rect(c,accent,x-20,y-44,40,3);rect(c,accent+'66',x-16,y-34,32,26);
  c.fillStyle=accent;c.font='bold 13px monospace';c.textAlign='center';c.fillText(String(e.chapterIndex+1).padStart(2,'0'),x,y-15);rect(c,'#adc7a155',x-37,y+7,74,3);
  const label=tr(CHAPTERS[e.chapterIndex].name);c.font='8px Vazirmatn, sans-serif';const w=Math.min(223,c.measureText(label).width+20);rect(c,'#112a25de',x-w/2,y+16,w,17);c.fillStyle=done?'#b4d88c':'#b1c2ac';c.fillText(label,x,y+28,w-8);
 }else if(e.type==='discovery'){
  if(state.discoveries.includes(e.id))return;
  glow(c,x,y-3,e.item==='fuse'?'#b5d886':'#d6bf8a',28,.13);rect(c,'#0c231c77',x-10,y+7,22,5);
  if(e.item==='fuse'){rect(c,'#91b59e',x-7,y-11,14,19);rect(c,'#d2d7ad',x-8,y-11,16,4);rect(c,'#d2d7ad',x-8,y+4,16,4);rect(c,'#3b6560',x-2,y-6,4,10);}else{rect(c,'#d8c99d',x-12,y-9,25,17);rect(c,'#668b79',x-9,y-6,11,10);rect(c,'#5a6551',x+5,y-5,5,1);rect(c,'#5a6551',x+5,y-1,5,1);}
  rect(c,'#d5e5a7',x-1,y-23+Math.sin(time*1.8)*2,3,3);
 }else if(e.type==='music'){
  rect(c,'#12312488',x-34,y+5,73,20);rect(c,'#718862',x-33,y-26,67,43);rect(c,'#bdd092',x-35,y-31,71,7);rect(c,'#17372c',x-27,y-21,54,21);for(let i=0;i<10;i++)rect(c,i%3?'#d1d0a2':'#5d7c5a',x-27+i*5,y+5,4,8);for(let i=0;i<5;i++)rect(c,'#87b27e',x-23+i*10,y-16,5,12);c.font='10px monospace';c.textAlign='center';c.fillStyle='#d5cf9f';c.fillText('♫',x,y-42);
 }else if(e.type==='workshop'){
  rect(c,'#172e24',x-32,y-5,65,28);rect(c,'#99a375',x-33,y-10,67,8);rect(c,'#648763',x-20,y-27,40,17);rect(c,state.projects.includes('lights')?'#cfe495':'#365a47',x-13,y-21,8,9);rect(c,'#c4bd88',x+1,y-24,18,3);rect(c,'#c4bd88',x+12,y-23,3,10);
 }else if(e.type==='mailbox'){
  rect(c,'#839563',x-3,y-8,6,22);rect(c,'#8a9d67',x-18,y-38,36,32);rect(c,'#c9c991',x-14,y-33,28,5);rect(c,'#1d3d30',x-10,y-24,20,4);if(state.projects.includes('letters'))rect(c,'#d7c298',x-8,y-14,16,4);
 }else if(e.type==='bell'){
  rect(c,'#233e3666',x-16,y+4,36,13);rect(c,'#6c8b74',x-16,y-13,32,22);rect(c,'#b9c99e',x-13,y-16,26,7);c.font='11px monospace';c.textAlign='center';c.fillStyle=state.projects.includes('melody')?'#e6dfaf':'#1c3d2e';c.fillText(String(e.note),x,y+2);
 }else if(e.type==='notice'||e.type==='pondClue'){
  rect(c,'#637750',x-18,y-4,4,21);rect(c,'#637750',x+15,y-4,4,21);rect(c,'#8b9a66',x-25,y-41,51,37);rect(c,'#c3c399',x-21,y-36,43,27);for(let i=0;i<3;i++)rect(c,'#566d51',x-16,y-30+i*6,31-(i%2)*8,2);
 }
 if(state.tracked===e.id){c.strokeStyle='#e8d79a';c.lineWidth=1;c.beginPath();c.ellipse(x,y+7,31,13,0,0,7);c.stroke();c.fillStyle='#e8d79a';c.font='12px monospace';c.textAlign='center';c.fillText('⌄',x,y-66);}
}
export function drawCommonsLife(c,time,state,reduced){
 const t=reduced?0:time;
 for(let i=0;i<4;i++){const x=1260+Math.sin(t*.22+i*1.7)*72+42,y=620+Math.cos(t*.18+i*1.9)*51;rect(c,i%2?'#c6c38988':'#d8aa8088',x,y,9,3);rect(c,'#e0d6b166',x-3,y+1,3,3);}
 for(let i=0;i<6;i++){const a=t*.025+i*1.04,x=945+Math.cos(a)*158,y=754+Math.sin(a)*119;character(c,x,y,{kind:i%2?'trader':'sage',walk:reduced?0:t*2+i,scale:.8,alpha:.52});}
 for(let i=0;i<22;i++){const x=285+(i*107)%1370+Math.sin(t*.2+i)*12,y=430+(i*83)%690+Math.cos(t*.17+i)*7;rect(c,'#c6d99166',x,y,1,1);}
}
export function drawCat(c,x,y,walk=0){rect(c,'#0c221c55',x-7,y+3,18,4);rect(c,'#aaac85',x-7,y-7,17,10);rect(c,'#c9c29a',x+5,y-13,10,11);rect(c,'#c9c29a',x+5,y-16,3,4);rect(c,'#c9c29a',x+12,y-16,3,4);rect(c,'#243e31',x+12,y-10,2,2);rect(c,'#d1c69f',x-10,y-12,4,10);rect(c,'#87977a',x-4,y+1,3,5+Math.sin(walk)*1.5);rect(c,'#87977a',x+6,y+1,3,5-Math.sin(walk)*1.5);}
