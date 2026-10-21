import {premiumCockpit} from './vehicle-cockpit.js';
import {CAR_MODELS,isScenery} from './frontier-expanse.js';
const pixel=c=>(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
export function drawExpanseSprite(c,kind,v=0){
 const r=pixel(c);
 if(kind==='floorStairs'){for(let i=0;i<6;i++){r(6+i*4,58-i*6,36-i*4,6,i%2?'#809fa4':'#56737f');}r(6,17,3,38,'#e4c58f');c.fillStyle='#c8f3ed';c.font='12px monospace';c.fillText('↑',19,15);return true;}
 if(kind==='trafficCar'){
  const color=CAR_MODELS[Math.floor(v/4)%CAR_MODELS.length].color,side=v%4===1||v%4===3,front=v%4===0;
  r(1,61,46,3,'#101b2588');r(4,49,9,14,'#111d28');r(35,49,9,14,'#111d28');
  r(2,43,44,14,color);r(9,32,30,13,color);r(12,34,24,10,'#1e3448');
  r(14,35,20,2,'#9fbab9');r(2,46,44,2,'#d5decd66');r(4,55,40,4,'#303d44');
  if(side){r(24,33,2,12,color);r(5,54,9,9,'#18232d');r(34,54,9,9,'#18232d');r(7,57,5,4,'#889692');r(36,57,5,4,'#889692');r(27,47,5,1,'#d8ded3');r(23,47,1,8,'#253f4a');r(v%4===1?2:43,48,3,4,'#f1dab2');}
  else{r(3,48,9,4,front?'#f4d99b':'#c55868');r(36,48,9,4,front?'#f4d99b':'#c55868');r(16,50,16,5,'#162935');r(19,57,10,3,'#d7d6bb');r(13,37,3,6,'#6c898d');}
  if(Math.floor(v/4)===2){r(20,28,12,4,'#ebd180');r(10,50,5,3,'#242c37');r(31,50,5,3,'#242c37');}
  const model=Math.floor(v/4);if(model>=8){r(3,48,42,2,model%2?'#a9fff1':'#ff9bd0');r(7,29,34,3,color);if(model===8||model===11)r(1,37,7,4,color);if(model===10||model===13){r(3,38,7,20,'#3c4e60');r(38,38,7,20,'#3c4e60');}if(model===12)r(0,32,10,3,color);if(model===10){r(7,27,34,5,'#e9e4cf');r(11,33,26,10,'#183644');r(6,47,7,7,'#fff0b4');r(35,47,7,7,'#fff0b4');r(16,48,16,5,'#24383c');r(4,57,40,4,'#d4d6c1');}}if(model===4){r(0,48,48,5,color);r(3,30,7,3,color);r(38,30,7,3,color);r(12,34,24,6,'#173b47');r(0,56,48,3,'#182c32');}if(model===5){r(1,54,11,10,'#13262b');r(36,54,11,10,'#13262b');r(6,28,37,4,'#d2c3a3');r(9,27,7,4,'#f2d79c');r(32,27,7,4,'#f2d79c');}if(model===6){r(1,34,7,23,'#465c65');r(40,34,7,23,'#465c65');r(13,36,23,3,'#0f2939');r(8,52,32,6,'#263d49');}if(model===7){r(4,48,40,2,'#b7f0ed');r(22,33,3,12,'#dae8cf');}
  return true;
 }
 if(kind==='resident'){
  const skin=['#d3b08b','#b98767','#8e6352','#e2c4a0'][v%4],coat=['#739fa4','#c79079','#978fc1','#c1b273','#567b81','#9aac89','#7387b1','#b36a72','#b6ae9b','#6d918d','#ba9a71','#8088a3'][v%12],hat=v%3===0;
  r(11,62,29,2,'#091c2666');r(16,45,7,17,'#243a4a');r(28,45,7,17,'#304252');r(14,59,10,4,'#172331');r(29,59,10,4,'#172331');
  r(15,25,20,26,coat);r(10,27,5,20,coat);r(35,27,5,20,coat);r(11,46,4,5,skin);r(35,46,4,5,skin);r(18,13,15,14,skin);r(17,10,17,7,v%2?'#423835':'#303a48');r(20,20,2,2,'#182839');r(28,20,2,2,'#182839');r(23,25,6,4,skin);r(25,29,1,19,'#e0d6b177');
  if(hat){r(15,9,22,4,coat);r(19,4,14,7,coat);}if(v%4===1){r(12,36,8,18,'#88664f');r(14,33,4,4,'#c7ac7c');}if(v%4===2){r(19,18,13,4,'#86c5c5');r(24,18,2,4,'#283747');}if(v===7){r(16,11,4,20,'#514344');r(31,11,5,20,'#514344');}return true;
 }
 if(['ufoFriend','ufoEnemy'].includes(kind)){const hostile=kind==='ufoEnemy',glow=hostile?'#ef8da1':'#97e6d5';r(8,24,32,7,'#586e88');r(15,17,19,9,'#acc2cd');r(19,14,11,5,'#6eafbf');r(3,30,42,8,'#7c92a4');r(0,33,48,3,'#c6d6d1');r(7,39,34,4,'#344c6a');for(let i=0;i<5;i++)r(7+i*8,38,3,3,glow);r(18,44,14,4,glow+'99');r(21,50,8,8,glow+'33');return true;}
 if(kind==='sentinel'){r(15,16,20,25,'#445974');r(18,7,15,13,'#899ba6');r(19,13,13,3,'#eb8c9f');r(11,23,6,28,'#526d80');r(34,23,6,28,'#526d80');r(17,40,6,23,'#334758');r(29,40,6,23,'#334758');r(22,25,6,10,'#f29b9f');r(15,60,10,4,'#7b94a5');r(27,60,10,4,'#7b94a5');return true;}
 if(kind==='mossling'){r(14,29,23,26,'#638e72');r(10,20,30,17,'#78ae88');r(15,17,20,6,'#a5c89b');r(14,53,7,10,'#3b6664');r(31,53,7,10,'#3b6664');r(16,28,5,5,'#a9eee0');r(30,28,5,5,'#a9eee0');r(11,12,3,12,'#8db392');r(36,11,3,14,'#8db392');r(9,10,6,4,'#d6e5b0');r(35,9,6,4,'#d6e5b0');return true;}
 if(kind==='crystal'){for(let i=0;i<3;i++){const x=8+i*11,y=24+i%2*9;r(x,y,9,38-i%2*9,'#476f96');r(x+1,y+2,3,33-i%2*9,'#82cddd');r(x+3,y-5,3,8,'#b6e4da');}r(4,60,41,4,'#344b66');return true;}
 if(kind==='mushroom'){for(let i=0;i<3;i++){const x=6+i*14,y=41+i%2*7;r(x+4,y+5,4,18-i%2*7,'#adbaaa');r(x,y,14,8,['#977db0','#87b8a5','#c2a497'][v%3]);r(x+3,y-3,8,4,'#bcd2c4');r(x+3,y+2,2,2,'#edf0c8');}return true;}
 if(kind==='neonSign'){r(22,8,4,56,'#495e72');r(1,12,46,31,'#28364f');r(3,14,42,27,['#ae89c5','#75bcb1','#d29b89'][v%3]);r(5,16,38,23,'#1a2e42');c.fillStyle=['#ceacee','#b2efe0','#f4c7a4'][v%3];c.font='bold 12px monospace';c.textAlign='center';c.fillText(['BUY','LIVE','?'][v%3],24,32);return true;}
 if(kind==='fish'){const color=['#efc991','#87dbcf','#bbb1e1','#dc998a','#a1cc9b'][v%5];r(14,27,25,13,color);r(5,25,8,17,color);r(11,29,6,9,color);r(20,24,9,3,color);r(20,32,14,2,'#e9edc277');r(34,30,3,3,'#193e4d');return true;}
 if(kind==='turtle'){r(11,30,27,20,'#518c87');r(17,26,15,4,'#83b6a1');r(17,32,15,13,'#75ada0');r(36,33,10,7,'#acd2b5');r(8,27,9,6,'#7fbcad');r(8,48,9,5,'#7fbcad');r(28,48,7,6,'#7fbcad');r(41,34,2,2,'#163642');return true;}
 if(kind==='jellyfish'){r(15,17,20,6,'#b6bcde99');r(9,23,32,12,'#adcbe3aa');r(13,29,24,9,'#d5e5e299');for(let i=0;i<5;i++){r(12+i*6,37,2,13+i%3*5,'#b7e2dd88');r(14+i*6,45+i%3*4,2,9,'#adc9df66');}return true;}
 if(kind==='kelp'){for(let i=0;i<4;i++){r(7+i*10,16+i%2*14,3,48-i%2*14,'#438d86');r(2+i*10,20+i%2*14,7,4,'#62aa98');r(10+i*10,30+i%2*12,6,4,'#75bba1');}return true;}
 if(kind==='coral'){for(let i=0;i<6;i++){const x=3+i*7,y=35+i%3*5;r(x,y,4,29-i%3*5,['#c695b6','#d5b49e','#87b8b9'][v%3]);r(x-2,y+5,9,3,'#ab8fa6');}return true;}
 if(kind==='sunkenCache'){r(3,44,42,19,'#716e65');r(5,42,38,5,'#a6ae91');r(9,46,4,17,'#c9b57e');r(36,46,4,17,'#c9b57e');r(22,48,6,8,'#96dbd6');r(0,59,12,4,'#5a9f96');return true;}
 return false;
}
export function drawWreck(c,kind){const r=pixel(c);if(kind==='tree'){r(14,52,22,12,'#614e3d');r(12,50,26,5,'#af9263');r(17,51,16,2,'#6d614a');r(2,60,11,3,'#53765d');}
 else if(kind==='trafficCar'){r(2,51,44,10,'#3a454a');r(10,42,28,12,'#566064');r(15,45,15,5,'#1e2f3e');r(4,58,9,6,'#152630');r(35,58,9,6,'#152630');r(8,52,15,3,'#977c65');r(26,55,14,2,'#b39a77');}
 else{r(4,58,19,4,'#738778');r(26,55,15,5,'#9a9e86');r(13,51,5,9,'#4c6e70');}return true;}
export const drawCarCockpit=premiumCockpit;
export function drawWaterView(c,f,time,speed,reduced){
 const e=f.life.expanse,r=pixel(c);if(!e.swimming)return;
 if(e.depth>.45){c.fillStyle='#08698733';c.fillRect(0,0,480,270);for(let i=0;i<5;i++){c.fillStyle='#b1e7c509';c.beginPath();c.moveTo(i*110-20,0);c.lineTo(i*110+10,0);c.lineTo(i*110+110,270);c.lineTo(i*110+40,270);c.fill();}for(let i=0;i<22;i++){const x=(i*83+Math.sin(time*.5+i)*4)%480,y=(i*53-(reduced?0:time*17)%270+540)%270;r(x,y,2,2,'#9de2d977');}}
 else{r(0,127,480,1,'#bce0d577');for(let i=0;i<13;i++)r((i*39+(reduced?0:time*6))%480,132+i%4*2,20,1,'#c6e1d144');}
 const stroke=reduced?0:Math.sin(time*(speed>.2?3:1))*14;
 for(const side of [-1,1]){c.save();c.translate(side<0?98:380,249+stroke*side);c.rotate(side*(.3+stroke*.012));r(-14,-10,28,41,'#c79974');r(-17,-24,31,23,'#d8b08b');for(let j=0;j<4;j++)r(-16+j*8,-37-(j%3)*2,6,18,'#e2bc94');r(side<0?13:-23,-12,10,14,'#c79974');c.restore();}
}
export function drawSmoke(c,f,time,reduced){if(f.minutes>=f.life.expanse.smokeUntil||f.mounted||f.life.expanse.swimming)return;const r=pixel(c);r(348,232,34,38,'#365765');r(351,215,26,21,'#d0a580');r(350,215,5,15,'#e2bf95');r(359,212,5,18,'#e2bf95');r(345,205,31,4,'#e8dcc0');r(342,205,4,4,'#d38e6e');for(let i=0;i<9;i++){const t=((reduced?0:time)*.6+i/9)%1;r(342+Math.sin(t*7)*13,205-t*95,3+t*7,2+t*6,'#b1ced226');}}
export {isScenery};
