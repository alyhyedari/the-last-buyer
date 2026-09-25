import {character,rng} from './art.js';
import {ENDING_ROUTES} from './ending-rules.js';
const palettes={repair:['#172824','#cbb38b','#91baa0'],commons:['#142b30','#cbd7a0','#6bab96'],power:['#20232c','#b4b6a3','#73808c'],ruin:['#2c2026','#d8b58b','#b66c5f'],escape:['#14242e','#d0c5aa','#72a4b5'],memory:['#202938','#c4c6a5','#9d9cba']};
export function drawFinale(c,id,shot=0){
 const route=ENDING_ROUTES[id];if(!route)return;
 const [night,paper,accent]=palettes[route.family],W=320,H=160;
 const box=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const line=(color,x,y,xx,yy)=>{c.strokeStyle=color;c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();};
 const person=(x,y,mina=false,scale=1.2)=>character(c,x,y,{kind:mina?'mina':undefined,scale,facing:mina?-1:1});
 const page=(x,y,w=24,h=30)=>{box(paper,x,y,w,h);for(let i=6;i<h-4;i+=5)box(night,x+4,y+i,w-8,1);};
 const lamp=(x,y,on=true)=>{box('#516459',x,y,2,36);box(accent,x-4,y-3,10,3);box(on?paper:'#3c4945',x-3,y,8,7);if(on){c.fillStyle=paper+'13';c.beginPath();c.arc(x+1,y+3,24,0,7);c.fill();}};
 const key=(x,y)=>{c.strokeStyle=paper;c.strokeRect(x,y,7,7);box(paper,x+6,y+3,14,2);box(paper,x+15,y+4,2,5);};
 const door=(x,y,open=true)=>{box(accent,x,y,28,47);box(open?'#b8bc8a':'#0b1b20',x+3,y+3,22,44);if(open)box(night,x+4,y+3,6,43);else box(paper,x+21,y+25,2,2);};
 const screen=(x,y,w=54,h=38,on=true)=>{box(accent,x,y,w,h);box('#102126',x+4,y+4,w-8,h-8);box(on?paper:'#374641',x+12,y+12,w-24,8);box(accent,x+w/2-2,y+h,4,9);};
 const plant=(x,y,bloom=false)=>{box('#927956',x,y,3,28);for(let i=0;i<6;i++)box(bloom?paper:accent,x-12+(i%3)*8,y-9+Math.floor(i/3)*7,11,10);};
 const cat=(x,y)=>{box(paper,x,y,15,8);box(paper,x+12,y-4,7,10);box(paper,x+12,y-7,2,4);box(paper,x+17,y-7,2,4);box(night,x+17,y,1,2);box(paper,x-4,y-5,4,8);box(paper,x+2,y+8,2,3);box(paper,x+11,y+8,2,3);};
 c.save();c.setTransform(c.canvas.width/W,0,0,c.canvas.height/H,0,0);c.imageSmoothingEnabled=false;
 box(night,0,0,W,H);const random=rng(407+id.length*13);
 for(let i=0;i<50;i++)box(paper+'46',Math.floor(random()*W),Math.floor(random()*76),1,1);
 for(let x=0;x<W;x+=26){const hh=20+Math.floor(random()*38);box('#0b1721',x,116-hh,23,hh);for(let y=121-hh;y<113;y+=9)if(random()>.35)box(accent+'58',x+5,y,3,4);}
 box('#33463f',0,121,W,39);box(accent,0,122,W,1);box(night,0,146,W,14);
 const scene=route.scene;
 if(scene==='calendar'){
  box(accent,39,22,75,86);page(44,29,65,73);for(let i=0;i<12;i++){const x=51+i%4*13,y=40+Math.floor(i/4)*18;box(night,x,y,8,9);if(i<(shot+1)*4)line(paper,x,y+4,x+7,y+4);}
  box('#716c53',128,106,136,5);person(159,104);if(shot>0)person(233,106,true);page(192,83,23,21);
 }else if(scene==='workshop'){
  box(accent,46,101,225,8);[57,246].forEach(x=>box('#706650',x,109,7,24));lamp(100,61,shot>0);lamp(222,61,shot===2);person(140,102);if(shot>0)person(184,102,true);for(let i=0;i<5;i++)box(paper,51+i*8,42,3,18-i*2);
 }else if(scene==='train'){
  for(const x of [29,188]){box(accent,x,51,96,70);door(x+32,74,true);box(paper,x+12,64,12,17);}
  for(let y=105;y<139;y+=8)box('#88927b',138,y,39,2);person(74,128);if(shot>0)person(234,128,true);page(151,38,24,17);
 }else if(scene==='letters'){
  plant(237,85,shot===2);box(accent,56,80,38,24);box(paper,60,85,30,3);box('#687c67',72,104,5,24);for(let i=0;i<3;i++){page(124+i*28,44+(i%2)*5,24,34);box(accent,128+i*28,51+(i%2)*5,16,12);}person(108,132);if(shot>0)person(209,132,true);
 }else if(scene==='council'){
  lamp(34,62);lamp(283,62);box(paper,81,98,158,7);box(accent,88,105,5,21);box(accent,230,105,5,21);[66,120,195,255].forEach((x,i)=>person(x,i%2?97:127,i===2));page(137,79,22,18);page(169,82,22,16);
 }else if(scene==='seeds'){
  box(accent,26,68,75,56);box('#b1a173',22,65,82,5);for(let i=0;i<16;i++)box(paper,34+i%4*16,77+Math.floor(i/4)*10,10,5);
  for(let i=0;i<3;i++){box('#8b7550',131+i*51,103,34,17);key(139+i*51,88);}person(164,79);if(shot>0)person(216,80,true);
 }else if(scene==='doors'){
  [54,144,234].forEach((x,i)=>{door(x,72,shot!==1||i!==1);key(x+4,41);});person(99+shot*30,137);if(shot>0)person(218,135,true);line(accent,39,134,292,134);
 }else if(scene==='tower'){
  box(accent,120,23,81,102);for(let y=31;y<110;y+=14){box(night,127,y,66,10);box(paper,183,y+3,4,3);}door(147,87,false);key(143,5);person(161,83);for(let i=0;i<5-shot;i++)person(213+i*18,137,i===0,.8);box('#4b5553',101,123,116,5);
 }else if(scene==='blackout'){
  for(let i=0;i<4;i++)screen(18+i*77,49,53,35,false);person(91,129);person(225,129,true);lamp(231,85,shot>0);for(let i=0;i<3;i++)page(115+i*24,104,18,22);
 }else if(scene==='flood'){
  for(let i=0;i<3;i++){box(accent,31+i*99,74,63,49);door(48+i*99,83,false);}box('#477485',0,shot===0?126:shot===1?108:90,W,56);for(let x=5;x<320;x+=21)box('#a5c3b570',x,115+(x%3)*5,12,1);person(174,81);if(shot>0){box('#8a784c',229,111,45,7);person(250,109,true,.85);}
 }else if(scene==='gold'){
  for(let i=0;i<6;i++){const h=15+i*11;box('#998443',55+i*36,122-h,23,h);box('#dec989',58+i*36,122-h,17,3);}person(153,139);box(night,30,110,31,28);box(paper,38,116,14,6);line(accent,38,131,48,127);if(shot>0){box(accent,260,54,4,39);box(accent,262,54,26,4);}
 }else if(scene==='ferry'){
  box('#325766',0,91,W,55);for(let x=0;x<320;x+=24)box('#8fb1a040',x,108+x%19,16,1);box('#8a7855',74+shot*18,115,112,9);box(paper,77+shot*18,122,105,3);person(125+shot*18,114);box(accent,176+shot*18,88,3,28);box(paper,180+shot*18,89,17,13);if(shot===0)person(41,106,true);
 }else if(scene==='chairs'){
  box(paper,118,90,84,5);for(const x of [73,223]){box(accent,x,82,5,44);box(accent,x,107,25,5);box(accent,x+20,112,5,14);}if(shot===0){person(86,108);person(237,108,true);}else if(shot===1){person(260,136,true);person(215,136);}door(275,67,true);
 }else if(scene==='lantern'){
  lamp(79,55);lamp(239,55,shot>0);plant(30,94,shot===2);person(148,129);cat(181,124);box('#8d7754',123,119,14,10);if(shot===1)person(285,128,true);if(shot===2)box('#d4c193',0,22,320,2);
 }else if(scene==='radio'){
  box(accent,74,82,168,35);for(let i=0;i<14;i++)box(night,84+i*5,89,2,19);c.strokeStyle=paper;c.beginPath();c.arc(212,98,10,0,7);c.stroke();line(paper,93,80,78,26);person(54,131);if(shot===1)person(262,130,true);for(let i=0;i<3+shot;i++){c.strokeStyle=accent+'77';c.beginPath();c.arc(79,31,10+i*12,-1.4,.65);c.stroke();}
 }else if(scene==='margins'){
  page(58,39,103,76);page(163,39,103,76);box(accent,161,40,2,75);for(let i=0;i<4+shot;i++)box(accent,242,51+i*9,17,2);person(106,137);if(shot>0)person(220,138,true);if(shot===2)box(paper,68,87,80,20);
 }else if(scene==='desk'){
  screen(168,48);box(accent,45,100,230,7);page(70,72,46,27);person(147,96);if(shot===0)person(45,136,true);for(let i=0;i<shot+1;i++)box(paper,250,70+i*8,20,4);
 }else if(scene==='glass'){
  screen(43,69);person(98,134);person(224,112,shot===0);box('#afc0b357',159,19,5,122);for(let i=0;i<4;i++)line('#adc5b13a',143+i*10,20,178+i*10,140);door(266,72,false);
 }else if(scene==='fire'){
  box('#4c4239',41,55,237,69);for(let i=0;i<21;i++){const x=38+i*12,hh=14+(i*17)%37;box(i%2?'#aa6146':'#c49c60',x,122-hh,7,hh);}person(95,141);if(shot>0)person(220,141,true);page(178,104,22,27);box(night,179,115,9,16);
 }else if(scene==='keys'){
  [45,138,231].forEach(x=>{screen(x,60,40,30,shot!==1||x!==138);key(x+6,39);});[80,163,250].forEach((x,i)=>person(x,131,i===1));line(accent,65,99,250,99);
 }else if(scene==='door'){
  door(147,66,true);person(121+shot*4,132);person(203-shot*8,132,true);box('#9f936c',132,101,62,29);line(night,162,101,162,130);
 }else if(scene==='puppet'){
  person(165,138);screen(120,22,79,37);for(let i=-1;i<=1;i++)line(accent,160+i*19,61,164+i*8,112);if(shot>0)person(239,135,true);box(paper,229,105,20,4);
 }else if(scene==='copies'){
  [61,143,225].forEach(x=>page(x,51,36,45));person(93,139);person(211,139,true);line(accent,95,98,220,98);if(shot===2)page(148,104,29,25);
 }else if(scene==='loop'){
  screen(126,58,66,42);person(162,134);for(let i=0;i<3+shot;i++){c.strokeStyle=accent+(i%2?'58':'a0');c.strokeRect(96-i*13,37-i*5,127+i*26,91+i*10);}if(shot>0)person(224,113,true);page(40,105,28,26);
 }
 // Three still frames rather than flicker; no rapid motion or surprise audio.
 for(let y=0;y<H;y+=3)box('#000b1415',0,y,W,1);
 for(let i=0;i<3;i++)box(i===shot?paper:accent+'4a',143+i*13,151,8,2);
 c.restore();
}
