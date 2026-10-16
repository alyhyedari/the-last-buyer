import {isNight} from './frontier-state.js';
import {inDeepForest} from './frontier-forest-data.js';
import {lightRange} from './frontier-perks.js';
export function drawMythSprite(c,kind,v=0){
 const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);},colors=['#b8d49a','#d38c60','#7fc4cc','#b8a1cf','#d8cc80','#99c9ad'],col=colors[v%6],dark=['#36573b','#744639','#305766','#54415f','#5d6040','#284d47'][v%6];
 if(kind==='gmeCoin'){r(15,11,18,39,'#d8c45f');r(8,19,32,24,'#f2df8b');r(12,15,24,33,'#e2b943');r(14,18,20,27,'#233c39');c.font='bold 9px monospace';c.textAlign='center';c.fillStyle='#ddf3b8';c.fillText('GME',24,35);c.textAlign='start';r(19,13,11,2,'#ffffbf');return true;}
 if(kind==='mythOmen'){for(let x=3;x<45;x+=5){r(x,56,3,2,col);r(x,63,3,1,col);}r(3,58,3,4,col);r(42,58,3,4,col);r(23,56,2,8,col);return true;}
 if(kind==='uvRune'){r(15,49,19,14,'#3d514b');r(20,51,2,9,'#717e88');r(20,51,8,2,'#717e88');r(26,55,2,5,'#717e88');return true;}
 if(kind==='mythPillar'){r(12,59,25,5,'#233631');r(17,10,15,52,dark);r(20,6,10,54,'#687463');r(19,16,12,2,col);r(23,18,3,11,col);r(20,27,9,2,col);r(18,42,6,2,'#283e39');r(28,36,4,2,'#283e39');r(14,53,4,8,col);return true;}
 if(['wisp','briar','moth','shade','spore'].includes(kind)){
  if(kind==='shade'){r(17,8,16,14,'#4c4667');r(12,22,25,31,'#3f3d5a');r(8,34,6,23,'#736387');r(34,34,6,23,'#736387');r(14,53,8,11,'#323747');r(28,53,8,11,'#323747');r(18,15,13,7,'#172937');r(20,17,3,2,'#bfcae5');r(28,17,2,2,'#bfcae5');r(22,28,5,14,'#9386ac');}
  if(kind==='spore'){r(16,38,19,22,'#849a72');r(12,54,9,10,'#4e6e56');r(31,54,8,10,'#4e6e56');r(6,21,36,18,'#715870');r(13,14,23,9,'#9f7287');r(4,35,40,6,'#ba9c9e');r(12,24,7,4,'#d8c8a3');r(30,19,5,4,'#d8c8a3');r(25,29,7,4,'#d8c8a3');r(18,43,4,3,'#1e3e40');r(28,43,4,3,'#1e3e40');}
  if(kind==='wisp'){r(16,27,17,26,'#6faeb291');r(21,23,8,32,'#b2ded5');r(21,35,3,3,'#183c40');r(28,35,2,3,'#183c40');r(18,54,4,7,'#63b5a6');}
  if(kind==='briar'){r(16,20,18,32,'#526949');r(12,14,25,12,'#6e8c53');r(13,49,6,15,'#47583c');r(31,49,6,15,'#47583c');for(let i=0;i<5;i++){r(4+i*8,18-i%2*7,3,18,'#5f7844');}r(17,25,5,2,'#d6c478');r(28,25,5,2,'#d6c478');}
  if(kind==='moth'){for(const side of [3,29]){r(side,20,17,27,'#ad9bc7');r(side+3,24,10,17,'#6b5c91');r(side+6,28,4,5,'#dccb9d');}r(21,25,7,31,'#685d85');r(19,21,3,9,'#dfd4b0');r(28,21,3,9,'#dfd4b0');}return true;
 }
 if(!kind.startsWith('myth'))return false;
 r(7,61,35,3,'#0e252880');r(13,20,24,30,dark);r(17,17,16,29,col);r(10,29,7,23,col);r(33,29,7,23,col);r(13,48,8,15,dark);r(28,48,8,15,dark);r(18,10,14,15,dark);r(19,15,5,3,'#f3edbd');r(27,15,4,3,'#f3edbd');r(22,29,6,8,'#d4f4b3');r(24,27,2,12,'#ebffd1');
 if(v===0){r(10,2,4,17,col);r(33,2,4,17,col);r(4,5,8,3,col);r(35,5,9,3,col);r(5,1,3,7,col);r(41,0,3,8,col);r(14,8,5,3,col);r(31,8,6,3,col);}
 if(v===1){for(let i=0;i<5;i++)r(9+i*7,7-i%2*6,4,17,'#e4aa61');r(4,42,8,15,'#b7664c');r(36,42,8,15,'#b7664c');}
 if(v===2){r(5,5,5,22,col);r(37,5,5,22,col);r(9,23,30,5,col);r(10,48,29,9,'#4e8692');r(2,53,20,4,col);r(27,57,20,4,col);}
 if(v===3){r(7,4,34,3,col);r(7,4,3,28,col);r(38,4,3,28,col);r(7,30,34,3,col);r(23,5,2,13,'#eee0ab');r(24,16,12,2,'#eee0ab');r(3,40,6,21,'#a08a75');}
 if(v===4){for(const x of [3,39]){r(x,5,5,35,col);r(x-2,16,9,3,'#eee3a7');r(x,29,7,3,'#eee3a7');}r(15,5,21,4,col);}
 if(v===5){r(10,2,28,3,col);r(6,5,3,17,col);r(39,5,3,17,col);r(10,23,28,3,col);r(21,10,8,11,'#091d26');r(5,37,5,24,col);r(39,37,5,24,col);}
 return true;
}
export function drawNightLight(renderer,f,horizon){
 if(renderer.world.interior||f.life.expanse.swimming||!isNight(f)||!inDeepForest(f.x,f.y))return;const c=renderer.c,w=renderer.w,h=renderer.h,q=f.life.forest,lit=q.light!=='off',uv=q.light==='uv',radius=lit?lightRange(f)*12:28;
 const shade=c.createRadialGradient(w/2,horizon+32,3,w/2,horizon+32,radius);shade.addColorStop(0,lit?'#02081218':renderer.settings.calm?'#02081299':'#020812dc');shade.addColorStop(.7,lit?'#02081266':'#020812ee');shade.addColorStop(1,renderer.settings.calm?'#020812ce':'#020812f5');c.fillStyle=shade;c.fillRect(0,0,w,h);
 if(uv){c.fillStyle='#8362c819';c.beginPath();c.moveTo(w/2,h);c.lineTo(w/2-95,horizon-40);c.lineTo(w/2+95,horizon-40);c.fill();}
}
