import {glow,rng} from './art.js';

const rect=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};

function paperTag(c,x,y,accent,chapterIndex,discovered,time){
 const pulse=discovered?0:Math.sin(time*2.2+x*.01)*1.2;
 rect(c,'#07181788',x-8,y+4,18,5);
 rect(c,discovered?'#69755e':'#d5cc9d',x-6,y-13+pulse,13,13);
 rect(c,discovered?'#7e8c6c':'#f0e2ae',x-4,y-11+pulse,9,2);
 rect(c,discovered?'#526652':'#70866b',x-4,y-7+pulse,7,1);
 rect(c,discovered?'#526652':chapterIndex===6?'#bd9a63':'#8da37b',x-4,y-4+pulse,9,1);
 if(!discovered){rect(c,'#e7d98e',x+8,y-16+pulse,2,2);rect(c,'#e7d98e',x+6,y-14+pulse,6,2);}
}

export function detailEntityArt(c,e,time,discovered,chapterIndex=0,outdoor=false,quality='high'){
 const x=Math.round(e.x),y=Math.round(e.y);
 if(outdoor){
  const accent=discovered?'#71866b':chapterIndex%2?'#d8bd7a':'#b6d68d';
  if(!discovered&&quality==='high')glow(c,x,y-8,accent,28,.12);
  rect(c,'#10251f88',x-10,y+7,21,4);
  rect(c,discovered?'#64745f':'#afbd83',x-2,y-14,4,20);
  rect(c,accent,x-8,y-18,16,5);
  rect(c,discovered?'#53634e':'#e3d49a',x-5,y-24,10,7);
  rect(c,'#264b3f',x-3,y-22,6,2);
  if(!discovered){rect(c,accent,x-1,y-30+Math.sin(time*2+x)*2,3,3);}
  return;
 }
 if(!discovered&&quality==='high')glow(c,x,y-8,chapterIndex===6?'#e3be79':'#b7db96',26,.1);
 paperTag(c,x,y,chapterIndex===6?'#d5a675':'#afc987',chapterIndex,discovered,time);
 if(chapterIndex===4){rect(c,discovered?'#627a69':'#6fb28b',x-12,y-5,3,3);rect(c,discovered?'#627a69':'#6fb28b',x+10,y-5,3,3);}
 if(chapterIndex===6&&!discovered){rect(c,'#e2bd7e',x-2,y-21,4,1);}
}

function drawRoomAmbient(c,chapter,time,state,reduced,quality){
 const p=chapter.index,random=rng(1800+p*31),t=reduced?0:time;
 // Small, deterministic wear marks make each archive feel handled rather than tiled.
 for(let i=0;i<(quality==='low'?9:18);i++){
  const x=46+random()*866,y=84+random()*488;
  rect(c,i%3?'#aeb88920':'#0a171755',x,y,2+random()*7,1);
  if(i%5===0)rect(c,'#d1c58d28',x+4,y+2,1,3);
 }
 const accents=['#9ab87755','#d7b77a55','#83b4a455','#c3a26b55'];
 for(let i=0;i<5;i++){
  const x=83+i*181+(p%2)*13,y=103+(i%3)*121;
  rect(c,accents[(p+i)%accents.length],x,y,23,2);
  rect(c,'#0b1c1b88',x+3,y+4,2,12);
  rect(c,accents[(p+i+1)%accents.length],x+8,y+6,1,8);
 }
 // A chapter-specific marginal signal, intentionally readable only at close range.
 const labels=[['OPEN / CLOSE','08:17'],['HAND / LEDGER','WHO SIGNED?'],['CACHE / LINK','404 / AGAIN'],['PAPER / ROOF','WITNESS'],['HASH / ZERO','NO OWNER'],['TABLE / TWO','WAIT A BEAT'],['BUY / PAUSED','QUEUE 00'],['EXIT / NAME','YOUR TURN']][p];
 c.save();c.textAlign='left';c.font='7px monospace';c.fillStyle=p===6?'#cfa56a9c':'#a8bf8790';c.fillText(labels[0],45,586);c.fillStyle='#7e9d7890';c.fillText(labels[1],45,596);c.restore();
 if(p===6){
  const blink=reduced?1:(Math.sin(t*3.4)+1)/2;
  rect(c,`rgba(220,171,105,${.12+.15*blink})`,391,66,178,2);
  rect(c,'#c69a6b55',405,69,33,1);rect(c,'#c69a6b55',483,69,28,1);rect(c,'#c69a6b55',542,69,17,1);
 }
 if(p===4&&!reduced){
  for(let i=0;i<4;i++){const x=144+i*226+Math.sin(t*.4+i)*4,y=532+(i%2)*8;rect(c,'#6fb28a55',x,y,2,2);rect(c,'#9dd59b33',x+4,y-3,5,1);}
 }
 if(state.projects?.includes('melody')&&!reduced){
  const x=chapter.index===7?690:80,y=557;rect(c,'#e5d39a44',x,y,2,2);rect(c,'#e5d39a44',x+6,y-4,2,2);rect(c,'#e5d39a44',x+12,y,2,2);
 }
}

function drawCommonsAmbient(c,time,state,reduced,quality){
 const t=reduced?0:time,random=rng(9801),count=quality==='low'?10:22;
 // Market scraps drift through the open world; all positions are deterministic.
 for(let i=0;i<count;i++){
  const baseX=100+random()*1720,baseY=155+random()*930;
  const x=baseX+(reduced?0:Math.sin(t*.17+i)*5),y=baseY+(reduced?0:Math.cos(t*.13+i)*3);
  rect(c,i%4?'#d2d59a32':'#9ec49c3d',x,y,2+(i%3),1);
 }
 for(let i=0;i<5;i++){
  const x=300+i*310+Math.sin(t*.18+i)*13,y=310+(i%2)*480+Math.cos(t*.2+i)*7;
  rect(c,'#b4c88744',x,y,18,2);rect(c,'#6b8b6b55',x+4,y+4,4,1);
 }
 if(state.projects?.includes('letters')){
  rect(c,'#d4bd8055',785,597,16,2);rect(c,'#d4bd8055',799,594,2,5);
 }
 if(state.projects?.includes('lights')){
  for(let i=0;i<4;i++)rect(c,'#e9d78c55',514+i*22,664+(i%2)*3,8,2);
 }
}

export function drawAmbientDetails(c,chapter,time,state,reduced=false,quality='high'){
 if(chapter.outdoor)drawCommonsAmbient(c,time,state,reduced,quality);
 else drawRoomAmbient(c,chapter,time,state,reduced,quality);
}
