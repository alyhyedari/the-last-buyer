export function rng(seed=1){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function hash(s){let v=2166136261;for(const c of String(s)){v^=c.charCodeAt(0);v=Math.imul(v,16777619);}return v>>>0;}
export const PALETTES=[
 {floor:'#263730',tile:'#2b3c34',wall:'#172d2b',trim:'#51634a',light:'#f9be62',accent:'#b6e98b'},
 {floor:'#393d2e',tile:'#414632',wall:'#242e26',trim:'#697044',light:'#eeb35b',accent:'#d5d786'},
 {floor:'#233641',tile:'#273e48',wall:'#182933',trim:'#425e64',light:'#76d2dc',accent:'#b1ed9b'},
 {floor:'#2a3940',tile:'#2d3e46',wall:'#1c2a35',trim:'#4b6465',light:'#eab870',accent:'#a8cfb0'},
 {floor:'#233438',tile:'#263c40',wall:'#14292f',trim:'#3d6862',light:'#a3e8b4',accent:'#b7f578'},
 {floor:'#3c3631',tile:'#443d34',wall:'#2c2c2b',trim:'#726344',light:'#ffd089',accent:'#dbbb72'},
 {floor:'#2b3540',tile:'#303b44',wall:'#1a2935',trim:'#485d6c',light:'#e6bd80',accent:'#8cd6c5'},
 {floor:'#28372f',tile:'#2c3e32',wall:'#162920',trim:'#566945',light:'#dfeaa2',accent:'#b7f578'}
];
const rect=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
const VLAD_TONES={
 classic:{leg:'#263b36',boot:'#16292a',coat:'#455c51',coatLight:'#8aa08e',coatBright:'#9db398',arm:'#708975',hair:'#273730',hairLight:'#3b4938',scarf:'#b6ad72',scarfLight:'#dfcc89',skin:'#b69773',skinLight:'#d9b885',eye:'#20362c'},
 ember:{leg:'#44302f',boot:'#241d25',coat:'#6c493f',coatLight:'#b06f57',coatBright:'#d09468',arm:'#9e5f4e',hair:'#2c2027',hairLight:'#5b3835',scarf:'#d29a5e',scarfLight:'#f1c37c',skin:'#b98268',skinLight:'#e2ad83',eye:'#472d2b'},
 ocean:{leg:'#243b4a',boot:'#172a37',coat:'#355d6a',coatLight:'#75a5ad',coatBright:'#9ed0ca',arm:'#4e8591',hair:'#23333f',hairLight:'#3d5660',scarf:'#86c7cb',scarfLight:'#b9e6d1',skin:'#ad907c',skinLight:'#d9b08e',eye:'#183645'},
 mono:{leg:'#3b4148',boot:'#20262d',coat:'#586064',coatLight:'#a4abb0',coatBright:'#c5cbd0',arm:'#7d858a',hair:'#262b30',hairLight:'#535c61',scarf:'#b4b8a2',scarfLight:'#d8dab8',skin:'#a7a9a2',skinLight:'#d1c9b0',eye:'#20272d'}
};
export function character(c,x,y,{kind='vlad',walk=0,facing=1,direction=null,style='classic',scale=1,alpha=1}={}){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);c.globalAlpha=alpha;
 c.fillStyle='#07131277';c.fillRect(-7,1,14,4);
 if(kind==='shadow'){
  const sway=Math.sin(walk*3)*2;
  rect(c,'#111d22',-7,-30,14,31);rect(c,'#9ca899',-5,-28,10,7);rect(c,'#273b3d',-8,-18,16,12);
  for(let i=0;i<6;i++){rect(c,i%2?'#89917f':'#bbc0a0',-7+sway*(i%2?1:-1),-15+i*3,14,2);rect(c,'#24312b',-4,-14+i*3,8,1);}
  rect(c,'#e2d59d',-3,-25,2,1);rect(c,'#e2d59d',2,-25,2,1);rect(c,'#18292b',-5,-1,3,6);rect(c,'#18292b',3,-1,3,6);
 }else if(kind==='vlad'){
  const tone=VLAD_TONES[style]||VLAD_TONES.classic;
  const dir=direction|| (facing<0?'left':'right'),step=Math.round(Math.sin(walk)*2),side=dir==='left'||dir==='right',back=dir==='up',bob=walk?Math.abs(step)===2?1:0:0;
  c.translate(0,-bob);
  if(side){
   c.scale(dir==='left'?-1:1,1);
   rect(c,tone.leg,-4,-6,4,8-step);rect(c,tone.boot,-5,1-step,6,2);
   rect(c,tone.leg,0,-6,4,8+step);rect(c,tone.boot,0,1+step,7,2);
   rect(c,tone.coat,-6,-18,10,12);rect(c,tone.coatLight,-3,-18,8,11);rect(c,tone.coatBright,0,-17,3,9);
   rect(c,tone.scarf,-7,-15,5,11);rect(c,tone.scarfLight,-6,-13,3,3);
   rect(c,tone.arm,-1,-15-step,3,9);rect(c,tone.skinLight,-1,-7-step,3,3);
   rect(c,tone.skin,-3,-26,8,8);rect(c,tone.skinLight,3,-23,3,4);rect(c,tone.hair,-4,-28,9,5);rect(c,tone.hair,-4,-25,4,5);
   rect(c,tone.eye,4,-24,1,2);rect(c,tone.skin,4,-19,2,1);rect(c,tone.scarfLight,0,-22,2,2);
  }else{
   rect(c,tone.leg,-5,-6,4,8+step);rect(c,tone.leg,1,-6,4,8-step);
   rect(c,tone.boot,-6,1+step,5,2);rect(c,tone.boot,1,1-step,5,2);
   rect(c,tone.coat,-7,-18,14,13);rect(c,back?tone.coatLight:tone.coatBright,-5,-18,10,11);
   rect(c,tone.arm,-8,-15+step,3,8);rect(c,tone.arm,5,-15-step,3,8);rect(c,tone.skinLight,-8,-7+step,3,3);rect(c,tone.skinLight,5,-7-step,3,3);
   if(back){rect(c,tone.scarf,-4,-17,8,11);rect(c,tone.scarfLight,-3,-16,6,4);rect(c,tone.arm,-2,-11,4,1);rect(c,tone.hair,-5,-28,10,11);rect(c,tone.hairLight,-4,-26,8,3);rect(c,tone.skin,-5,-22,1,3);rect(c,tone.skin,5,-22,1,3);}
   else{rect(c,tone.skinLight,-4,-26,9,9);rect(c,tone.hair,-5,-28,10,4);rect(c,tone.hair,-5,-25,2,4);rect(c,tone.hair,4,-25,1,3);rect(c,tone.eye,-2,-23,1,2);rect(c,tone.eye,2,-23,1,2);rect(c,tone.skinLight,0,-21,2,2);rect(c,'#7f624a',-1,-18,3,1);rect(c,tone.scarfLight,-4,-16,2,10);rect(c,tone.arm,0,-17,2,3);}
  }
 }else{
  const step=Math.sin(walk)*2;
  const coat=kind==='mina'?'#c19b68':kind==='cashier'?'#c5c2a4':kind==='sage'?'#80938e':kind==='trader'?'#aa8862':'#83998b';
  const dark=kind==='mina'?'#766744':'#455c51';
  rect(c,'#283b36',-5,-5,4,7+step);rect(c,'#283b36',1,-5,4,7-step);
  rect(c,'#19292b',-6,1+step,5,2);rect(c,'#19292b',1,1-step,6,2);
  rect(c,dark,-7,-17,14,12);rect(c,coat,-5,-18,10,12);rect(c,coat,-8,-15+step,3,8);rect(c,coat,5,-15-step,3,8);
  rect(c,'#c6a379',-8,-7+step,3,3);rect(c,'#c6a379',5,-7-step,3,3);
  rect(c,'#b69773',-4,-26,9,9);rect(c,'#293532',-5,-28,10,5);rect(c,'#293532',-5,-25,2,4);
  if(kind==='mina'){rect(c,'#3e3430',3,-24,3,9);rect(c,'#3e3430',-5,-27,11,4);}
  rect(c,'#e1bc87',facing>0?1:-3,-22,3,3);rect(c,'#26352c',facing>0?3:-3,-23,1,1);
  if(kind==='vlad'){const tone=VLAD_TONES[style]||VLAD_TONES.classic;rect(c,tone.scarf,-6,-15,4,10);rect(c,tone.scarfLight,-5,-14,2,5);rect(c,tone.arm,0,-17,2,3);}
 }
 c.restore();
}
function bookcase(c,x,y,w=48,h=52){rect(c,'#152b29',x,y,w,h);rect(c,'#586144',x,y,w,4);rect(c,'#6f7350',x,y,4,h);rect(c,'#414e35',x+w-4,y,4,h);for(let row=0;row<3;row++){for(let i=0;i<(w-8)/7;i++){const colors=['#747957','#a29769','#536e65','#856d51'];rect(c,colors[(row+i)%4],x+5+i*7,y+7+row*15,5,10+((i+row)%3));}rect(c,'#576146',x+3,y+18+row*15,w-6,3);}}
function terminal(c,x,y,accent='#a7e78b'){rect(c,'#102223',x-15,y-20,34,28);rect(c,'#536752',x-16,y-24,32,24);rect(c,'#142d28',x-13,y-21,26,17);rect(c,accent,x-10,y-18,18,2);rect(c,'#618d66',x-10,y-13,11,1);rect(c,'#618d66',x-10,y-10,15,1);rect(c,'#6e7960',x-10,y+2,20,4);rect(c,'#44563f',x-16,y+7,32,6);for(let i=0;i<5;i++)rect(c,'#8a9470',x-13+i*5,y+9,3,1);}
function table(c,x,y,w=65,h=29){rect(c,'#111d1b66',x+4,y+9,w,h);rect(c,'#534c33',x+4,y+h-2,5,13);rect(c,'#534c33',x+w-9,y+h-2,5,13);rect(c,'#665d3d',x,y,w,h);rect(c,'#aaa071',x,y,w,3);rect(c,'#86794e',x+2,y+5,w-4,h-7);rect(c,'#534b33',x,y+h-4,w,4);}
function lamp(c,x,y){rect(c,'#111f1d',x-4,y-2,8,5);rect(c,'#6b7252',x,y-32,2,30);rect(c,'#bdaf66',x-5,y-34,12,5);rect(c,'#edcf7d',x-7,y-29,16,3);}
function plant(c,x,y){rect(c,'#6f6c49',x-6,y-8,13,11);rect(c,'#a49363',x-7,y-9,15,3);rect(c,'#324b33',x-2,y-25,4,17);rect(c,'#68944c',x-10,y-22,9,5);rect(c,'#8ea862',x+1,y-27,8,5);rect(c,'#547a49',x+1,y-17,10,5);rect(c,'#9dad66',x-7,y-30,7,5);}
function marketPanel(c,x,y,lines,accent='#b7d18e'){
 const rows=Array.isArray(lines)?lines:[lines],width=Math.max(146,...rows.map(v=>String(v).length*7+20));
 rect(c,'#071615',x-width/2+4,y+4,width,rows.length*14+8);
 rect(c,'#142821',x-width/2,y,width,rows.length*14+4);
 rect(c,accent,x-width/2,y,width,2);
 c.save();c.textAlign='center';c.font='8px monospace';c.fillStyle=accent;
 rows.forEach((line,i)=>c.fillText(String(line),x,y+11+i*12));
 c.restore();
}
export function drawProp(c,p,palette){const{x,y,w=50,h=35,type}=p;if(type==='shelf'){bookcase(c,x,y,w,h);return;}if(type==='table'){table(c,x,y,w,h);return;}if(type==='plant'){plant(c,x,y);return;}if(type==='lamp'){lamp(c,x,y);return;}if(type==='crate'){rect(c,'#6f6549',x,y,w,h);rect(c,'#94835a',x,y,w,3);rect(c,'#4f533a',x+4,y+5,w-8,h-9);for(let i=0;i<w;i+=8)rect(c,'#827751',x+i,y,3,h);return;}if(type==='water'){rect(c,'#315466',x,y,w,h);for(let a=0;a<w;a+=19){rect(c,'#56777c',x+a,y+(a*3%h),11,2);}return;}if(type==='server'){rect(c,'#122b2d',x,y,w,h);rect(c,'#4b6762',x,y,w,3);for(let z=7;z<h;z+=10){rect(c,'#25494b',x+3,y+z,w-6,7);rect(c,'#b6d486',x+w-8,y+z+2,3,2);rect(c,'#547c71',x+7,y+z+2,12,2);}return;}if(type==='window'){rect(c,'#4e675b',x-3,y-3,w+6,h+6);rect(c,'#152d35',x,y,w,h);rect(c,'#284e54',x+3,y+3,w-6,h-6);rect(c,'#526f5b',x+w/2-2,y,3,h);rect(c,'#526f5b',x,y+h/2-2,w,3);for(let i=0;i<6;i++)rect(c,'#849e852a',x+4+i*7,y+5,2,h-8);return;}rect(c,palette.trim,x,y,w,h);}
export function makeRoom(chapter){
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=640;const c=canvas.getContext('2d',{alpha:false});c.imageSmoothingEnabled=false;
 const p=PALETTES[chapter.index],r=rng(chapter.index*777+47);
 rect(c,'#0f1d1f',0,0,960,640);
 for(let y=40;y<610;y+=16)for(let x=32;x<928;x+=16){rect(c,r()>.47?p.floor:p.tile,x,y,16,16);if(r()>.62)rect(c,'#ffffff05',x+2,y+2,12,1);if(r()>.95)rect(c,p.trim,x+8,y+6,2,1);}
 rect(c,p.wall,24,24,912,50);rect(c,p.trim,24,70,912,4);rect(c,'#0d2020',24,74,912,4);
 for(let x=32;x<928;x+=32){rect(c,'#ffffff05',x,30,28,1);rect(c,'#00000018',x+28,25,2,43);}
 rect(c,p.wall,24,74,10,532);rect(c,p.trim,34,74,3,532);rect(c,p.wall,926,74,10,532);rect(c,p.trim,923,74,3,532);rect(c,p.trim,25,606,910,5);
 // Architecture and furnishings are cached once, not redrawn every frame.
 for(let x=95;x<900;x+=172){drawProp(c,{type:'window',x,y:29,w:60,h:34},p);rect(c,'#9ba77722',x+3,78,55,53);}
 rect(c,'#bacc9a0a',430,79,180,490);
 // Each archive has a visual identity beyond its palette.
 if(chapter.index===1){
  rect(c,'#3c4230',38,78,884,34);
  for(let i=0;i<65;i++){const x=45+r()*860,y=85+r()*500;rect(c,'#88905244',x,y,4,3);rect(c,'#101e2244',x+2,y+3,6,2);}
  c.strokeStyle='#9eab5944';c.lineWidth=2;c.beginPath();c.ellipse(463,358,140,86,0,0,Math.PI*2);c.stroke();
  for(let i=0;i<13;i++){const a=i*Math.PI*2/13;rect(c,'#8c9163',458+Math.cos(a)*143,354+Math.sin(a)*88,7,4);}
 }else if(chapter.index===2){
  for(let i=0;i<9;i++){rect(c,'#315664',50+i*99,81,69,2);rect(c,'#6e9b9d44',70+i*92,84,2,29);}
  c.strokeStyle='#53879155';c.lineWidth=2;c.strokeRect(414,243,180,132);c.setLineDash([3,7]);c.beginPath();c.moveTo(174,201);c.lineTo(410,201);c.lineTo(410,378);c.lineTo(820,378);c.stroke();c.setLineDash([]);
 }else if(chapter.index===3){
  rect(c,'#837857',190,95,38,44);rect(c,'#3b4940',194,99,30,36);rect(c,'#adb18a',202,105,14,23);rect(c,'#627565',203,111,13,18);
  for(let i=0;i<9;i++){rect(c,'#566563',408+i*7,75,4,27);rect(c,'#78918a',408+i*7,77,1,21);}
  for(let i=0;i<14;i++){const x=80+i*60;rect(c,'#183c4a77',x,565+(i%2)*8,57,16);rect(c,'#88bcc233',x+5,572+(i%2)*8,39,1);}
 }else if(chapter.index===4){
  for(let i=0;i<6;i++){drawProp(c,{type:'server',x:60+i*28,y:32,w:22,h:32},p);drawProp(c,{type:'server',x:600+i*28,y:32,w:22,h:32},p);}
  c.strokeStyle='#68b38944';c.lineWidth=1;const points=[[150,290],[457,250],[686,410],[830,210],[690,120]];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();rect(c,'#56897388',a[0]-5,a[1]-5,10,10);}
 }else if(chapter.index===5){
  rect(c,'#655139',337,158,216,88);rect(c,'#8b7150',340,161,210,82);
  for(let x=350;x<540;x+=20)for(let y=165;y<238;y+=15)rect(c,((x+y)%3)?'#b1986055':'#d1b88144',x,y,12,8);
  rect(c,'#cfbb80',402,172,31,25);rect(c,'#ddca92',405,175,25,19);rect(c,'#e0ae66',409,177,19,15);rect(c,'#a26743',413,181,4,4);rect(c,'#a26743',421,185,4,4);
  rect(c,'#bdad79',447,190,29,23);rect(c,'#d1c391',450,193,23,17);rect(c,'#303e37',469,251,4,43);rect(c,'#47717a',470,290,91,2);
 }else if(chapter.index===6){
  rect(c,'#1a2d39',391,28,181,37);rect(c,'#536f6c',395,32,173,29);rect(c,'#1e3640',398,35,167,23);c.fillStyle='#b1d0bc';c.font='9px monospace';c.textAlign='center';c.fillText('28 JAN 2021 / BUY: PAUSED',481,50);
  for(let i=0;i<7;i++){rect(c,'#94aa5b55',120+i*95,304,64,2);rect(c,'#a4b57e55',150+i*95,310,26,1);}
 }else if(chapter.index===7){
  for(let i=0;i<11;i++){const x=61+i*77;rect(c,'#52633b',x,30,47,33);rect(c,'#263f30',x+3,33,41,27);character(c,x+24,61,{kind:i%2?'mina':'trader',scale:.7,alpha:.8});}
  c.strokeStyle='#83966244';c.lineWidth=2;c.beginPath();c.ellipse(486,353,191,139,0,0,Math.PI*2);c.stroke();c.strokeStyle='#afbc7844';c.beginPath();c.ellipse(486,353,177,126,0,0,Math.PI*2);c.stroke();
 }
 for(const q of chapter.props){if(['partition','pillar','rock'].includes(q.type))drawArchitecture(c,q,p);else drawProp(c,q,p);}
 for(const z of chapter.hideZones){rect(c,'#132b29',z.x-25,z.y-30,50,48);rect(c,'#68958a',z.x-28,z.y-31,56,3);for(let a=0;a<6;a++){rect(c,a%2?'#31584d':'#396559',z.x-24+a*8,z.y-27,7,25+(a%3)*5);}rect(c,'#6c948277',z.x-26,z.y+19,52,2);rect(c,'#9ab79b',z.x-3,z.y-40,7,5);c.setLineDash([4,4]);c.strokeStyle='#91b29b77';c.lineWidth=1;c.strokeRect(z.x-30,z.y-10,60,35);c.setLineDash([]);}
 // Ground cables lead to the workstations without revealing the puzzle solutions.
 for(const e of chapter.entities.filter(e=>e.type==='station')){c.strokeStyle='#0e211f';c.lineWidth=3;c.beginPath();c.moveTo(e.x,e.y+8);c.lineTo(e.x,588);c.lineTo(100,588);c.stroke();c.strokeStyle=p.trim+'66';c.lineWidth=1;c.stroke();}
 for(let i=0;i<38;i++){const x=45+r()*865,y=90+r()*480;rect(c,r()>.5?'#aaad7925':'#0a1b1955',x,y,3+r()*8,2);}
 // Rugs, taped walkways and the exit threshold make navigation legible.
 rect(c,'#6c715d',66,511,85,49);rect(c,'#465540',70,515,77,41);for(let z=0;z<5;z++)rect(c,'#7b7e5b',76,521+z*6,64,1);
  rect(c,'#314b3b',836,74,49,24);rect(c,'#bed48a',838,74,2,25);rect(c,'#bed48a',882,74,2,25);
  if(chapter.index===1){for(let i=0;i<32;i++){const x=65+r()*830,y=110+r()*430;rect(c,'#6f7944',x,y,2,5);rect(c,'#85944d',x+2,y-2,2,5);}rect(c,'#514635',432,293,38,25);for(let i=0;i<7;i++)rect(c,'#8f8358',425+i*7,313+(i%2)*3,6,5);}
  if(chapter.index===3){for(let i=0;i<12;i++)drawProp(c,{type:'water',x:45+i*74,y:554+(i%3)*5,w:68,h:28},p);}
  const signals=[
   ['RECEIPT / MEMORY','WHO PRESSED BUY?'],
   ['LIMIT / QUEUE','TIME IS A FEE'],
   ['PRICE != VALUE','KEEP COPIES'],
   ['BID / ASK / SILENCE','THE MARKET LISTENS'],
   ['HOLD / EXIT','NO GUARANTEE'],
   ['2021 / BUY: PAUSED','BUTTON UNDER GLASS'],
   ['GENESIS / HASH 0','FIRST TRACE'],
   ['WHO OWNS THE EXIT?','ASK VLAD']
  ];
  marketPanel(c,760,39,signals[chapter.index],chapter.index===5?'#e2b47c':p.accent);
  return canvas;
}
export function entityArt(c,e,time,done,palette,chapterIndex=0){
 const x=Math.round(e.x),y=Math.round(e.y);
 if(e.type==='station'){
  if(chapterIndex===1){rect(c,'#5b6447',x-25,y-9,51,30);rect(c,'#abb080',x-27,y-12,54,6);rect(c,'#baaa71',x-13,y-26,28,20);rect(c,'#8d8153',x-10,y-23,22,14);for(let i=0;i<3;i++)rect(c,done?'#6c7452':palette.accent,x-7+i*6,y-20,3,8);}
  else if(chapterIndex===3&&e.slot===0){table(c,x-25,y-5,51,25);rect(c,'#68857a',x-20,y-20,39,7);c.strokeStyle=done?'#688173':'#d7bf77';c.lineWidth=3;c.beginPath();c.arc(x,y-20,12,0,Math.PI*2);c.stroke();rect(c,'#bea86a',x-1,y-31,3,23);rect(c,'#bea86a',x-10,y-21,23,3);}
  else if(chapterIndex===5&&e.slot===0){table(c,x-25,y-5,51,25);rect(c,'#292f2c',x-15,y-34,32,30);rect(c,'#8b835c',x-12,y-31,26,24);c.fillStyle='#303c32';c.beginPath();c.arc(x+1,y-18,9,0,Math.PI*2);c.fill();rect(c,'#bfb078',x-2,y-21,6,6);}
  else{table(c,x-25,y-5,51,25);terminal(c,x,y-12,done?'#697967':palette.accent);}
  if(!done){rect(c,palette.accent,x-1,y-55+Math.sin(time*2+e.x)*2,3,3);rect(c,palette.accent,x-3,y-53+Math.sin(time*2+e.x)*2,7,3);rect(c,palette.accent,x-1,y-50+Math.sin(time*2+e.x)*2,3,3);}
 }else if(e.type==='episode'){
  rect(c,'#162c28',x-21,y-7,43,18);rect(c,done?'#6e7e59':'#bbaa71',x-20,y-9,41,3);rect(c,'#696f4e',x-17,y-22,34,13);rect(c,'#172e26',x-12,y-19,24,6);
  if(chapterIndex===0){rect(c,'#ced39d',x-9,y-17,4,3);rect(c,'#ced39d',x+5,y-17,4,3);}else if(chapterIndex===1){for(let i=0;i<4;i++)rect(c,'#c4b56c',x-10+i*6,y-27,4,6);}else if(chapterIndex===5){rect(c,'#bcac70',x-9,y-27,19,7);}else{rect(c,'#a6bd77',x-9,y-17,18,2);}
  c.strokeStyle=done?'#65734e':'#e4c884';c.lineWidth=2;c.beginPath();c.ellipse(x,y-43,10,6,0,0,Math.PI*2);c.stroke();rect(c,done?'#65734e':'#e4c884',x-2,y-45,4,4);
 }else if(e.type==='record'){
  rect(c,'#13231dcc',x-7,y+3,17,4);rect(c,done?'#787e62':'#c7c6a0',x-6,y-7,13,13);rect(c,'#4e6450',x-3,y-4,7,1);rect(c,'#4e6450',x-3,y-1,5,1);rect(c,'#4e6450',x-3,y+2,7,1);
  if(!done){rect(c,'#cde892',x+9,y-9,1,4);rect(c,'#cde892',x+7,y-7,5,1);}
 }else if(e.type==='npc'){character(c,x,y,{kind:e.kind,walk:0,facing:-1});}
 else if(e.type==='wayback'){
  rect(c,'#233f32',x-16,y-25,32,32);rect(c,'#a5c683',x-18,y-29,36,5);rect(c,'#9fc080',x-1,y-26,3,37);c.fillStyle='#c5dca2';c.font='18px monospace';c.textAlign='center';c.fillText('↵',x,y-5);
 }else if(e.type==='exit'){
  rect(c,'#142c24',x-18,y-41,38,46);rect(c,'#4a694d',x-20,y-43,42,3);rect(c,'#6d8d54',x-20,y-40,3,45);rect(c,'#6d8d54',x+19,y-40,3,45);rect(c,done?'#b7f578':'#667969',x-11,y-38,24,29);rect(c,done?'#162918':'#293e36',x-8,y-35,18,24);rect(c,'#b9c991',x+11,y-13,3,3);if(done){rect(c,'#b7f578',x-3,y-24,10,2);rect(c,'#b7f578',x+3,y-27,2,8);}
 }
}
export function glow(c,x,y,color,radius=65,alpha=.17){const g=c.createRadialGradient(x,y,2,x,y,radius);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.save();c.globalAlpha=alpha;c.fillStyle=g;c.fillRect(x-radius,y-radius,radius*2,radius*2);c.restore();}
function drawArchitecture(c,p,palette){const{x,y,w,h,type}=p;if(type==='rock'){rect(c,'#101e2244',x+5,y+7,w,h);rect(c,'#536047',x,y+7,w,h-7);rect(c,'#7d8260',x+5,y,w-10,11);rect(c,'#65714f',x+3,y+8,w-8,h-12);rect(c,'#989473',x+9,y+3,w-21,3);return;}rect(c,'#0a1c1acc',x+7,y+8,w,h);rect(c,palette.wall,x,y,w,h);rect(c,'#7f937055',x,y,3,h);rect(c,palette.trim,x,y,w,4);for(let yy=y+19;yy<y+h;yy+=24)rect(c,'#0b232b66',x+2,yy,w-4,2);if(type==='pillar'){rect(c,'#81916b',x-3,y-4,w+6,7);rect(c,'#546c4c',x-3,y+h-4,w+6,8);}}
let titleScene='city';
export const setTitleScene=scene=>{if(['city','forest','water'].includes(scene))titleScene=scene;};
export function drawTitle(c,time=0,reduced=false){
 const r=rng(91),t=reduced?0:time,water=titleScene==='water',forest=titleScene==='forest',px=(x,y,w,h,col)=>rect(c,col,x,y,w,h);c.imageSmoothingEnabled=false;
 px(0,0,640,440,water?'#113344':'#101f32');
 for(let i=0;i<90;i++){const x=r()*640,y=r()*177;px(x,y,1,1,water?'#88bab57a':'#a3c3c17a');}
 if(!water){px(466,36,33,30,'#d6d7bc');px(474,32,23,36,'#d6d7bc');px(481,30,22,29,'#101f32');}
 if(!water&&!forest){
  for(let layer=0;layer<2;layer++)for(let i=0;i<18;i++){const x=i*39-5+layer*13,h=47+r()*130,y=217-h;px(x,y,34,h+layer*20,layer?'#26414c':'#1b303f');px(x,y,34,2,'#486273');for(let yy=y+10;yy<212;yy+=11)for(let xx=x+5;xx<x+31;xx+=8)if(r()>.32)px(xx,yy,3,4,r()>.72?'#ddb9a0':'#6b9ba28a');}
  for(const [x,y,col,label]of [[80,101,'#c498ce','BUY'],[244,81,'#8dd6c4','LIVE'],[503,125,'#e6b28a','BUY']]){px(x-2,y-2,54,24,'#101d30');px(x,y,50,20,col);px(x+2,y+2,46,16,'#233349');c.fillStyle=col;c.font='bold 13px monospace';c.textAlign='center';c.fillText(label,x+25,y+15);}
 }
 px(0,223,640,217,water?'#174e5d':'#233c43');
 if(!water){
  c.fillStyle='#66858b';c.beginPath();c.moveTo(312,219);c.lineTo(348,219);c.lineTo(521,440);c.lineTo(156,440);c.fill();
  for(let y=238;y<440;y+=22){const width=(y-210)*.015;px(327-width,y,width*2,10,'#c7c49888');}
  for(let i=0;i<62;i++){const x=r()*640,y=229+r()*211;px(x,y,5+r()*18,1,i%3?'#7dabaa44':'#d8b59644');}
  const tree=(x,y,scale,col)=>{px(x-3*scale,y-44*scale,6*scale,44*scale,'#546057');for(let j=0;j<4;j++){const width=(j+2)*9*scale;px(x-width/2,y-90*scale+j*17*scale,width,19*scale,col);}px(x-8*scale,y-82*scale,9*scale,6*scale,'#6a9e8877');};
  for(let i=0;i<(forest?35:12);i++){const x=i%2?r()*168:465+r()*175,y=249+r()*174;tree(x,y,.55+r()*.8,forest?'#2b655d':'#2a514e');}
  if(forest){for(let i=0;i<50;i++){const x=r()*640,y=140+r()*240;px(x+Math.sin(t+i)*2,y,2,2,i%3?'#afe6bf88':'#b8b2d9aa');}px(361,141,80,12,'#658994');px(374,130,53,13,'#90c4c7');px(384,123,32,9,'#acd0d0');px(355,150,91,3,'#c6e4ce');for(let i=0;i<7;i++)px(365+i*11,158,3,3,'#9bebd5');}
  else{const x=246+Math.sin(t*.09)*9;px(x,284,112,43,'#9c7771');px(x+19,257,77,30,'#c08e7d');px(x+24,262,66,21,'#355363');px(x+4,318,19,24,'#152632');px(x+92,318,18,24,'#152632');px(x+6,294,16,6,'#f5d6ab');px(x+91,294,16,6,'#f5d6ab');px(x+42,312,29,8,'#d9cbb2');}
  character(c,411,390,{walk:0,scale:2.15});
 }else{
  for(let i=0;i<48;i++){const x=r()*640,y=262+r()*177;px(x,y,12+r()*31,2,'#7bb3a133');}
  for(let i=0;i<37;i++){const x=r()*640,y=280+r()*165,height=30+r()*55;px(x,y-height,3,height,'#518c80');px(x-8,y-height+13,11,4,'#70b4a0');px(x+3,y-height+25,11,4,'#70b4a0');}
  for(let i=0;i<35;i++){const x=(r()*640+t*(i%2?4:-5)+640)%640,y=70+r()*263,col=['#d6b388','#95d2bc','#b2a6d1'][i%3];px(x,y,13,5,col);px(x-4,y-2,4,9,col);px(x+10,y+1,1,1,'#163d4b');}
  px(265,329,89,39,'#72796b');px(271,329,5,39,'#c1b481');px(342,329,5,39,'#c1b481');px(299,342,13,12,'#c1e8d6');
  for(let i=0;i<6;i++){c.fillStyle='#b1e4d20c';c.beginPath();c.moveTo(i*111,0);c.lineTo(i*111+30,0);c.lineTo(i*111+190,440);c.lineTo(i*111+90,440);c.fill();}
 }
 c.fillStyle='#091b2666';c.fillRect(0,0,640,24);c.fillRect(0,409,640,31);c.font='9px monospace';c.fillStyle='#c3d6c3';c.textAlign='left';c.fillText('WILD SIGNAL  /  '+titleScene.toUpperCase(),16,16);c.fillStyle='#96b6b3';c.fillText('BUY / LIVE / BECOME',16,429);c.textAlign='right';c.fillText('VLAD / 010',625,429);
}
