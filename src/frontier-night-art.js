// Hand-drawn pixel silhouettes. All effects use bounded particles and the raycaster depth buffer.
export function drawNightSprite(c,kind,variant=0){
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 if(['zombie','jinn','vampire','watcher'].includes(kind)){
  const color={zombie:'#697759',jinn:'#759fbd',vampire:'#402b45',watcher:'#676072'}[kind],skin=kind==='zombie'?'#9caa79':kind==='jinn'?'#b4ddd1':'#cebeae';
  r(7,61,34,3,'#12181b77');r(15,22,23,29,color);r(19,8,15,17,skin);r(19,6,16,6,kind==='vampire'?'#20202b':'#3a403e');r(20,16,4,3,'#bc6d63');r(29,16,4,3,'#bc6d63');r(24,23,7,2,'#3d3131');r(16,50,8,13,'#373c39');r(30,50,8,13,'#373c39');
  if(kind==='zombie'){r(5,28,13,7,color);r(34,29,12,7,color);r(5,27,5,6,skin);r(41,29,5,6,skin);r(24,36,5,9,'#4f5550');}
  if(kind==='vampire'){for(let y=25;y<62;y+=3)r(18-(y-25)*.24,y,19+(y-25)*.48,3,'#3c263f');r(15,23,25,6,'#7f3c51');r(24,25,7,27,'#c7bfa4');r(23,23,2,3,'#f1ddbe');r(30,23,2,3,'#f1ddbe');}
  if(kind==='jinn'){r(12,24,5,25,'#87bca8');r(36,24,5,25,'#87bca8');for(let i=0;i<5;i++)r(15+i*3,50+i*2,22-i*5,2,'#84acb399');r(12,17,5,2,'#c0f4d4');r(36,13,7,2,'#c0f4d4');}
  if(kind==='watcher'){r(10,25,7,31,'#655b67');r(38,25,7,31,'#655b67');r(20,2,15,9,'#898082');r(23,30,9,15,'#c7bc8a');r(25,33,5,2,'#47414c');r(25,38,5,2,'#47414c');}
 }else if(kind==='treasure'||kind==='satchel'){r(8,47,32,15,'#7c5a36');r(7,43,34,8,'#ad8b4d');r(12,42,5,20,'#484943');r(31,42,5,20,'#484943');r(22,49,5,7,kind==='satchel'?'#e7cdb1':'#c5eb83');if(kind==='satchel'){r(17,37,16,3,'#c1ab80');r(16,39,3,5,'#c1ab80');r(30,39,3,5,'#c1ab80');}else{r(22,27,4,9,'#c6e689');r(19,30,10,3,'#c6e689');}}
 else if(kind==='rocket'){r(21,26,6,19,'#bbb7a4');r(20,42,8,8,'#db9d59');r(22,48,4,8,'#f1d38b');r(23,22,2,5,'#d8d8b5');}
 else if(kind==='grenade'){r(18,38,15,19,'#657346');r(20,34,10,6,'#b7ae81');r(27,29,5,7,'#535a4f');r(20,44,11,2,'#3c523e');r(20,51,11,2,'#3c523e');}
 else if(kind==='tornado'){for(let y=2;y<62;y+=3){const w=43-y*.58,x=24-w/2+Math.sin(y*.38+variant)*3;r(x,y,w,3,['#5a6369aa','#8b999699','#b4beb777'][Math.floor(y/3)%3]);}}
 else if(kind==='lightning'){if(variant){r(21,0,4,21,'#d3ecd2');r(16,18,11,4,'#d3ecd2');r(16,22,4,13,'#e5efd1');r(17,33,15,4,'#e5efd1');r(28,36,4,13,'#e5efd1');r(23,47,8,4,'#e5efd1');r(23,49,3,14,'#e5efd1');}r(8,60,34,3,'#dbb77599');r(15,58,19,3,'#d8c87c99');}
 else if(kind==='bed'){r(4,45,39,15,'#675444');r(4,53,4,11,'#4b4034');r(39,53,4,11,'#4b4034');r(4,34,39,12,variant?'#b98b90':'#71978e');r(7,29,14,9,'#dbd5bc');r(5,44,36,5,'#c5bba0');r(3,26,3,26,'#735c45');}
 else if(kind==='table'){r(3,34,43,9,'#bd9a6a');r(7,43,4,21,'#796448');r(37,43,4,21,'#796448');r(15,28,10,6,'#d6d0b4');r(18,27,4,3,'#bc965a');r(31,26,4,8,'#afc6b5');}
 else if(kind==='chair'){r(13,25,4,33,'#847154');r(30,25,4,33,'#847154');r(13,27,21,5,'#b39a68');r(12,48,25,6,'#9f8055');r(14,54,4,10,'#736149');r(31,54,4,10,'#736149');}
 else if(kind==='sofa'){r(3,35,42,25,variant?'#8a5161':'#658073');r(1,40,9,23,'#485c57');r(38,40,9,23,'#485c57');r(11,44,26,4,'#94a398');r(22,37,2,20,'#485c57');}
 else if(kind==='wardrobe'||kind==='fridge'||kind==='shelf'){r(8,10,33,53,kind==='fridge'?'#b4c3b0':'#8d7557');r(10,12,28,49,kind==='fridge'?'#cad1b7':'#a38a60');r(23,13,2,46,'#736851');r(28,29,3,7,'#4d5d56');if(kind==='shelf')for(let y=20;y<60;y+=13){r(10,y,28,3,'#675943');for(let x=12;x<35;x+=5)r(x,y-7,4,7,['#bd8663','#728e7d','#b5ab7a'][x%3]);}}
 else if(kind==='stove'||kind==='basin'){r(6,39,37,24,'#aebbac');r(6,33,37,7,'#dde0c5');if(kind==='stove'){r(12,34,8,3,'#364846');r(28,34,8,3,'#364846');r(12,45,26,12,'#32434a');r(14,47,22,7,'#ba9163');}else{r(11,34,26,5,'#738f93');r(29,24,3,12,'#d6d7bc');r(26,23,6,3,'#d6d7bc');}}
 else if(kind==='bathtub'){r(3,44,42,17,'#c3d1c3');r(3,39,42,7,'#e4e1cc');r(8,41,32,4,'#8cb4b7');r(34,32,3,8,'#d6d7bc');}
 else if(kind==='rug'){r(0,57,48,7,variant?'#ac6266':'#ae9b6c');r(3,59,42,3,'#c8b789');for(let x=8;x<42;x+=7)r(x,60,3,1,'#725d4d');}
 else if(kind==='indoorLamp'){r(23,35,3,27,'#96744e');r(15,60,19,3,'#96744e');r(15,27,18,13,'#e8cd8f');r(18,24,12,4,'#c9b67c');}
 else if(kind==='doorway'){r(10,9,28,54,'#b19568');r(14,12,20,49,'#375759');r(17,34,14,4,'#c6e49a');r(24,29,4,14,'#c6e49a');}
 else return false;return true;
}
export function drawCombatEffects(renderer,state,time,options){const c=renderer.c,f=state.frontier,w=renderer.w,h=renderer.h,settings=renderer.settings,world=renderer.world,r=(x,y,a,b,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),a,b);};
 const project=p=>{const dx=p.x-f.x,dy=p.y-f.y,depth=dx*Math.cos(f.angle)+dy*Math.sin(f.angle),side=-dx*Math.sin(f.angle)+dy*Math.cos(f.angle);return{depth,x:w/2+side/depth*w/1.4,y:108+f.life.pitch*150+143.1/depth};};
 for(const e of world.effects||[]){const p=project(e);if(p.depth<.2||p.x<0||p.x>=w||p.depth>renderer.z[Math.floor(p.x)])continue;const explosion=e.kind==='explosion';if(e.kind==='blood'&&settings.blood==='off')continue;const fade=1-e.age/e.ttl,size=Math.min(70,(explosion?150:35)/p.depth);c.globalAlpha=fade*(explosion?1:.85);for(let i=0;i<(explosion?14:settings.blood==='low'?3:8);i++){const a=i*2.4+e.seed,spread=(e.age+.15)*size;r(p.x+Math.cos(a)*spread,p.y-size*.9+Math.sin(a)*spread,Math.max(2,size*(explosion?.22:.08)),Math.max(2,size*.1),e.kind==='sparks'?['#d2e6b6','#efc883','#80b6bd'][i%3]:explosion?['#efb363','#f5d78a','#8e664b'][i%3]:['#a3453c','#722d32','#bd6552'][i%3]);}c.globalAlpha=1;}
 const blood=options.blood||0;if(blood&&settings.blood!=='off'){c.globalAlpha=Math.min(.24,blood*.12)*(settings.blood==='low'?.4:1);r(0,0,w,12,'#922b32');r(0,h-10,w,10,'#922b32');r(0,0,13,h,'#922b32');r(w-13,0,13,h,'#922b32');c.globalAlpha=Math.min(.55,blood*.24);for(const [x,y,a,b]of [[16,35,5,13],[8,74,12,5],[w-24,46,8,5],[w-18,94,4,16],[40,h-18,7,4]])r(x,y,a,b,'#a3433b');c.globalAlpha=1;}
 if(options.hitMarker>0){c.strokeStyle=options.lastHit?.killed?'#f0bd72':'#e4f6d5';c.lineWidth=2;c.beginPath();for(const [sx,sy]of [[-1,-1],[1,-1],[-1,1],[1,1]]){c.moveTo(w/2+sx*6,h/2+sy*6);c.lineTo(w/2+sx*11,h/2+sy*11);}c.stroke();}
 const target=options.target;if(target&&!target.dead&&target.kind!=='target'){const p=project(target);if(p.depth>.1){const x=Math.max(20,Math.min(w-20,p.x)),y=Math.max(55,Math.min(185,p.y-(target.animal?75:165)/p.depth));r(x-17,y,34,3,'#122428');r(x-16,y+1,32*Math.max(0,target.hp/target.maxHp),1,target.hostile?'#dc8670':'#b4cc93');if(target.winding){r(x-2,y-10,4,5,'#f2b578');r(x-2,y-3,4,2,'#f2b578');}}}
}
export function drawFPSWeapon(c,weapon,w,h,motion,options){
 const r=(x,y,a,b,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),a,b);},reload=options.reloading?Math.sin((options.reloadProgress||0)*Math.PI):0,x=w/2+motion+reload*24,y=h-8+(options.recoil||0)*9+reload*42;
 c.save();c.translate(x,y);r(-25,-20,26,32,'#2c545b');r(9,-21,28,33,'#2c545b');r(-23,-32,27,20,'#b98e67');r(12,-30,24,20,'#d5ab7a');r(-18,-34,20,6,'#e6c398');
 if(weapon==='stick'){c.rotate((options.recoil||0)*-.6+.13);r(-5,-111,11,130,'#85694a');r(-3,-106,3,120,'#c2a46a');r(1,-93,3,13,'#695c42');}
 else if(weapon==='bow'){c.strokeStyle='#b89c6b';c.lineWidth=5;c.beginPath();c.ellipse(0,-63,27,74,0,-Math.PI/2,Math.PI/2);c.stroke();c.strokeStyle='#e0d3a3';c.lineWidth=1;c.beginPath();c.moveTo(0,-137);c.lineTo(-9,-49);c.lineTo(0,11);c.stroke();r(-2,-120,3,108,'#cab385');r(-4,-124,7,8,'#a5b4ac');}
 else if(weapon==='grenade'){r(-10,-55,24,34,'#596b43');r(-7,-57,18,5,'#899568');r(-7,-46,17,3,'#344b3c');r(-7,-35,17,3,'#344b3c');r(6,-66,5,12,'#bdc3a0');r(3,-69,12,4,'#7f8e80');}
 else if(weapon==='launcher'){r(-21,-75,43,84,'#526449');r(-19,-76,38,9,'#2a393a');r(-15,-74,30,4,'#101f27');r(-16,-61,32,46,'#7a885a');r(-18,-38,36,8,'#344d43');r(-7,-12,13,25,'#58473b');r(17,-65,8,26,'#334746');r(18,-67,5,7,'#d6caa0');r(-4,-81,8,6,'#bbc6a2');}
 else if(weapon==='pistol'){r(-7,-39,17,55,'#665143');r(-10,-64,22,34,'#364748');r(-7,-68,16,8,'#83928a');r(-8,-58,18,5,'#a5aea0');r(-6,-50,13,6,'#202e34');r(-13,-35,28,11,'#4d6060');r(-1,-73,3,7,'#cfdac1');r(-12,-30,5,14,'#9c7954');}
 else{const shotgun=weapon==='shotgun',smg=weapon==='smg';r(-11,-62,24,63,'#465958');r(-9,-26,20,42,'#8a6749');r(-7,-50,16,28,'#776550');r(-9,-48,20,5,'#aa8b61');r(-8,-72,18,18,'#72837a');r(-6,-103,5,35,'#3d5050');r(1,-103,shotgun?6:3,35,'#9eaaa0');r(-2,-109,4,7,'#cfd9bb');r(-12,-62,26,6,'#23383c');if(smg){r(10,-52,12,25,'#253b3e');r(-14,-83,28,10,'#52676a');}if(shotgun){r(-11,-31,24,8,'#bf9867');r(-10,-40,22,3,'#3d3d35');}}
 if(options.reloading){r(-43,-36-reload*18,15,35,'#475c5c');r(-48,-12-reload*18,24,12,'#d5ab7a');r(-42,-34-reload*18,4,27,'#adbaa3');}
 c.restore();
}
