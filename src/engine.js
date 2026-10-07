import {movementDirection} from './movement.js';
import {AdaptiveQuality} from './quality.js';
import {makeRoom,PALETTES,entityArt,character,glow,rng} from './art.js';
import {obstacles,walkable,findPath,approachPath,chapterDone} from './state.js';
import {HorrorDirector,ShadowAgent,sheltered} from './horror.js';
import {mosaic} from './scene-art.js';
import {makeCommons,worldEntityArt,drawCommonsLife,drawCat} from './world-art.js';
import {canVisitChapter} from './open-world.js';
import {drawAmbientDetails,detailEntityArt} from './detail-art.js';
export class Engine{
 constructor(canvas,{onInteract,onHud,onCaught,onShadow,onEvent,onStep,getBeat,settings}){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.ctx.imageSmoothingEnabled=false;this.onInteract=onInteract;this.onHud=onHud;this.onCaught=onCaught;this.onShadow=onShadow;this.settings=settings;this.keys=new Set();this.active=false;this.paused=true;this.path=[];this.camera={x:0,y:0};this.time=0;this.last=0;this.accumulator=0;this.hudClock=0;this.composure=100;this.wardTime=0;this.wardCooldown=0;this.hurtCooldown=0;this.facing=1;this.direction='down';this.locationRevision=0;this.guideTarget=null;this.guidePath=[];this.walk=0;this.qualityController=new AdaptiveQuality();this.effectiveQuality='high';this.renderBudget=0;this.shadowNotified=false;this.interactionTarget=null;
  this.onEvent=onEvent;this.onStep=onStep;this.getBeat=getBeat;this.footClock=0;this.crouching=false;this.hidden=false;this.analog={x:0,y:0};this.lightMask=document.createElement('canvas');this.lightMask.width=640;this.lightMask.height=360;this.maskCtx=this.lightMask.getContext('2d');
  this.loop=this.loop.bind(this);this.frame=requestAnimationFrame(this.loop);
  canvas.addEventListener('pointerdown',e=>this.pointer(e));
  window.addEventListener('keydown',e=>{if(!this.active||this.paused||e.target.matches('input,select,textarea,button'))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Space','KeyE','KeyC'].includes(e.code)){e.preventDefault();if(!e.repeat&&e.code==='KeyE')this.interact();else if(!e.repeat&&e.code==='KeyC')this.toggleCrouch();else if(!e.repeat&&e.code==='Space')this.ward();else this.keys.add(e.code);}});
  window.addEventListener('keyup',e=>this.keys.delete(e.code));window.addEventListener('blur',()=>this.clearInput());
 }
 capturePosition(){if(!this.active||!this.player||!this.state)return;const zone=this.chapter.outdoor?'commons':'chapter';if(this.state.zone!==zone||(!this.chapter.outdoor&&this.state.chapter!==this.chapter.index))return;this.state.position={...this.player};if(this.chapter.outdoor)this.state.commonsPosition={...this.player};else{this.state.chapterPositions??={};this.state.chapterPositions[this.chapter.index]={...this.player};}}
 load(chapter,state){this.locationRevision++;this.last=0;this.accumulator=0;this.renderBudget=0;this.guideTarget=null;this.guidePath=[];this.guideKey='';this.direction='down';this.canvas.dataset.facing='down';this.canvas.dataset.zone=chapter.outdoor?'commons':'chapter';this.canvas.dataset.chapter=String(chapter.index);this.chapter=chapter;this.state=state;this.worldWidth=chapter.width||960;this.worldHeight=chapter.height||640;this.refreshScenery();this.blocks=obstacles(chapter);this.player={...state.position};if(!walkable(this.player.x,this.player.y,this.blocks))this.player={...chapter.start};state.position={...this.player};this.agent=new ShadowAgent(chapter,this.blocks);this.director=new HorrorDirector(chapter,state,this.onEvent);this.shadow=this.agent.position;this.crouching=false;this.hidden=false;this.threat='quiet';this.shadowNotified=false;this.composure=100;this.wardTime=0;this.wardCooldown=0;this.hurtCooldown=0;this.clearInput();this.camera.x=Math.max(0,Math.min(this.worldWidth-640,this.player.x-320));this.camera.y=Math.max(0,Math.min(this.worldHeight-360,this.player.y-180));this.active=true;this.hudClock=1;this.render();}
 refreshScenery(){this.background=this.chapter.outdoor?makeCommons(this.chapter,this.state):makeRoom(this.chapter);this.pausedDrawn=false;}
 visibleEntities(){return[...(this.chapter.entities||[]),...(this.chapter.detailEntities||[])].filter(e=>e.type!=='discovery'||!this.state.discoveries.includes(e.id));}
 toggleCrouch(){if(this.paused)return;this.crouching=!this.crouching;this.onHud?.(this);}
 get hasShadow(){return !this.chapter.outdoor&&[2,3,4,6].includes(this.chapter.index)&&!this.settings.calm;}
 clearInput(){this.keys.clear();this.path=[];this.interactionTarget=null;this.analog={x:0,y:0};}
 setAnalog(x=0,y=0){const dx=Number.isFinite(Number(x))?Number(x):0,dy=Number.isFinite(Number(y))?Number(y):0;const length=Math.hypot(dx,dy);this.analog=length>1?{x:dx/length,y:dy/length}:{x:dx,y:dy};}
 recommend(quality){this.qualityController.reset(quality);this.effectiveQuality=this.settings.quality==='auto'?this.qualityController.quality:this.settings.quality;}
 setPaused(value){this.paused=value;this.pausedDrawn=false;this.clearInput();this.accumulator=0;this.last=0;}
 touch(dir,pressed){const codes={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};if(pressed)this.keys.add(codes[dir]);else this.keys.delete(codes[dir]);}
 screenPoint(e){const r=this.canvas.getBoundingClientRect(),scale=Math.min(r.width/640,r.height/360),ox=(r.width-640*scale)/2,oy=(r.height-360*scale)/2;const x=(e.clientX-r.left-ox)/scale,y=(e.clientY-r.top-oy)/scale;if(x<0||x>640||y<0||y>360)return null;return{x:x+this.camera.x,y:y+this.camera.y};}
 navigateTo(entity){
   if(!entity||this.paused||!this.active||!this.visibleEntities().some(e=>e.id===entity.id))return false;
  if(Math.hypot(this.player.x-entity.x,this.player.y-entity.y)<62){this.onInteract(entity);return true;}
  const path=approachPath(this.player,entity,this.blocks);
  if(!path.length)return false;
  this.path=path;this.interactionTarget=entity;this.canvas.focus({preventScroll:true});return true;
 }
 setGuide(entity){
  this.guideTarget=entity||null;
  if(!entity){this.guidePath=[];this.guideKey='';return;}
  const key=entity.id+':'+Math.floor(this.player.x/32)+':'+Math.floor(this.player.y/32);
  if(key===this.guideKey)return;this.guideKey=key;
  this.guidePath=Math.hypot(this.player.x-entity.x,this.player.y-entity.y)<62?[]:approachPath(this.player,entity,this.blocks);
 }
 pointer(e){
  if(!this.active||this.paused||e.button>0)return;
  if((e.pointerType==='touch'||e.pointerType==='pen')&&this.settings.inputMode==='joystick')return;
  this.canvas.focus({preventScroll:true});const p=this.screenPoint(e);if(!p)return;
  const near=this.visibleEntities().map(ent=>({ent,d:Math.hypot(p.x-ent.x,p.y-(ent.y-(ent.type==='portal'?28:10)))})).sort((a,b)=>a.d-b.d)[0];
  if(near&&near.d<(near.ent.type==='portal'?43:32)){this.navigateTo(near.ent);return;}
  this.path=findPath(this.player,p,this.blocks);this.interactionTarget=null;
 }

 nearest(){let best=null,distance=64;if(!this.chapter)return null;for(const e of this.visibleEntities()){const d=Math.hypot(this.player.x-e.x,this.player.y-e.y);if(d<distance){best=e;distance=d;}}return best;}
 interact(){if(this.paused||!this.active)return;const e=this.nearest();if(e)this.onInteract(e);}
 ward(){if(this.paused||this.wardCooldown>0)return false;this.wardTime=2.5;this.wardCooldown=5;this.onShadow?.('ward');return true;}
 loop(now){
  this.frame=requestAnimationFrame(this.loop);
  if(document.hidden||!this.active){this.last=0;return;}
  if(this.paused){if(!this.pausedDrawn){this.render();this.pausedDrawn=true;}this.last=0;return;}
  const raw=this.last?(now-this.last)/1000:1/60;this.last=now;
  this.effectiveQuality=this.settings.quality==='auto'?this.qualityController.sample(raw*1000):this.settings.quality;
  const before=performance.now();
  this.accumulator+=Math.min(raw,.1);let n=0;
  while(this.accumulator>=1/60&&n++<6){const revision=this.locationRevision;this.update(1/60);if(revision!==this.locationRevision||this.paused){this.accumulator=0;break;}this.accumulator-=1/60;}
  this.hudClock+=raw;if(this.hudClock>.17){this.onHud?.(this);this.hudClock=0;}
  const budget=this.effectiveQuality==='low'?1000/30:1000/60;
  this.renderBudget=Math.min(100,this.renderBudget+raw*1000);
  if(this.renderBudget+.4<budget)return;
  this.renderBudget=Math.max(0,this.renderBudget-budget);
  this.render();if(this.settings.quality==='auto')this.qualityController.rendered(performance.now()-before);
 }
 update(dt){
  this.time+=dt;this.wardTime=Math.max(0,this.wardTime-dt);this.wardCooldown=Math.max(0,this.wardCooldown-dt);this.hurtCooldown=Math.max(0,this.hurtCooldown-dt);
  let dx=Number(this.keys.has('KeyD')||this.keys.has('ArrowRight'))-Number(this.keys.has('KeyA')||this.keys.has('ArrowLeft')),dy=Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'))-Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'));
  if(this.analog.x||this.analog.y){dx=this.analog.x;dy=this.analog.y;}
  if(dx||dy){this.path=[];this.interactionTarget=null;}else if(this.path.length){const target=this.path[0],dist=Math.hypot(target.x-this.player.x,target.y-this.player.y);if(dist<3)this.path.shift();else{dx=(target.x-this.player.x)/dist;dy=(target.y-this.player.y)/dist;}}
  if(this.interactionTarget&&Math.hypot(this.interactionTarget.x-this.player.x,this.interactionTarget.y-this.player.y)<62){const e=this.interactionTarget;this.clearInput();this.onInteract(e);return;}
  const mag=Math.hypot(dx,dy),sprint=!this.crouching&&(this.keys.has('ShiftLeft')||this.keys.has('ShiftRight'))&&this.composure>12;const speed=this.crouching?52:this.chapter.outdoor?(sprint?205:145):sprint?136:91;
  if(mag>0){dx=dx/mag*speed*dt;dy=dy/mag*speed*dt;const x=this.player.x+dx,y=this.player.y+dy,before={...this.player};if(walkable(x,this.player.y,this.blocks))this.player.x=x;if(walkable(this.player.x,y,this.blocks))this.player.y=y;this.walk+=dt*(sprint?15:10);this.direction=movementDirection(dx,dy,this.direction);this.canvas.dataset.facing=this.direction;if(dx)this.facing=dx>0?1:-1;if(before.x!==this.player.x||before.y!==this.player.y){this.footClock+=dt;if(this.footClock>(this.crouching?.54:sprint?.26:.37)){this.footClock=0;this.onStep?.(this.crouching);}}}else this.walk=0;
  this.composure=this.chapter.outdoor?100:Math.max(0,Math.min(100,this.composure+(sprint&&mag?-9:this.threat==='hunted'?0:5)*dt));
  this.hidden=sheltered(this.player,this.chapter,this.crouching);this.threat=this.hidden?'hidden':'quiet';this.director.update(dt,this.settings);
  if(this.hasShadow){
   const contact=this.agent.update(dt,{player:this.player,running:sprint&&mag>0,hidden:this.hidden,ward:this.wardTime>0,cinematic:this.settings.horror==='cinematic'});
   this.threat=this.hidden?'hidden':this.agent.mode==='chase'?'hunted':['search','investigate'].includes(this.agent.mode)?'searched':'quiet';
   if(this.agent.mode==='chase'&&!this.shadowNotified){this.shadowNotified=true;this.onShadow?.('near');}else if(this.agent.mode==='patrol')this.shadowNotified=false;
   if(contact&&this.hurtCooldown===0){this.composure=Math.max(0,this.composure-38);this.hurtCooldown=3;this.agent.grace=3;if(this.composure<=0){this.player={...this.chapter.start};this.composure=100;this.agent=new ShadowAgent(this.chapter,this.blocks);this.shadow=this.agent.position;this.clearInput();this.onCaught?.();}}
  }
  const tx=Math.max(0,Math.min(this.worldWidth-640,this.player.x-320)),ty=Math.max(0,Math.min(this.worldHeight-360,this.player.y-180));const smoothing=this.settings.reducedMotion?1:Math.min(1,dt*7);this.camera.x+=(tx-this.camera.x)*smoothing;this.camera.y+=(ty-this.camera.y)*smoothing;this.state.position={...this.player};if(this.chapter.outdoor)this.state.commonsPosition={...this.player};
 }
 render(){if(!this.background)return;const c=this.ctx,p=PALETTES[this.chapter.index],cx=Math.round(this.camera.x),cy=Math.round(this.camera.y);c.clearRect(0,0,640,360);c.drawImage(this.background,cx,cy,640,360,0,0,640,360);c.save();c.translate(-cx,-cy);
   drawAmbientDetails(c,this.chapter,this.settings.reducedMotion?0:this.time,this.state,this.settings.reducedMotion,this.effectiveQuality);
   if(this.guideTarget){c.fillStyle='#d5d59288';for(let i=0;i<this.guidePath.length;i+=2){const point=this.guidePath[i];if(point.x>=cx&&point.x<cx+640&&point.y>=cy&&point.y<cy+360)c.fillRect(point.x-1,point.y-1,3,3);}const target=this.guideTarget;c.strokeStyle='#ead89a';c.lineWidth=1;c.strokeRect(target.x-26,target.y-41,52,54);c.fillStyle='#ead89a';c.beginPath();c.moveTo(target.x-4,target.y-47);c.lineTo(target.x+4,target.y-47);c.lineTo(target.x,target.y-43);c.fill();}
  if(this.path.length&&!this.settings.reducedMotion){const end=this.path.at(-1);c.strokeStyle='#b7f57866';c.lineWidth=1;c.strokeRect(end.x-5,end.y-5,10,10);}
  if(this.chapter.outdoor){drawCommonsLife(c,this.time,this.state,this.settings.reducedMotion);const beat=this.getBeat?.();if(beat?.playing&&!this.settings.reducedMotion){c.strokeStyle='#b5c78c33';c.lineWidth=1;for(let i=0;i<3;i++){c.beginPath();c.ellipse(1338,624,24+i*19+(1-beat.pulse)*12,10+i*7+(1-beat.pulse)*4,0,0,7);c.stroke();}c.fillStyle='#c0d68b';for(let i=0;i<5;i++)c.fillRect(1087+i*10,654-Math.round(beat.pulse*(5+i%2*3)),4,2);}}
  const things=this.visibleEntities().map(e=>({...e,renderEntity:true}));things.push({x:this.player.x,y:this.player.y,type:'player'});if(this.hasShadow)things.push({...this.shadow,type:'shadow'});things.sort((a,b)=>a.y-b.y);
   for(const e of things){if(e.x<cx-100||e.x>cx+740||e.y<cy-60||e.y>cy+430)continue;if(e.type==='player')character(c,e.x,e.y,{walk:this.walk,facing:this.facing,direction:this.direction,style:this.settings.avatarTone,scale:this.crouching?.8:1,alpha:this.hidden?.55:1});else if(e.type==='shadow'){character(c,e.x,e.y,{kind:'shadow',walk:this.settings.reducedMotion?0:this.time,alpha:.8});if(this.settings.pixelVeil)mosaic(c,e.x-8,e.y-30,18,12,Math.floor(e.x/30));}else if(e.type==='detail')detailEntityArt(c,e,this.settings.reducedMotion?0:this.time,this.state.detailNotes.includes(e.id),this.chapter.index,this.chapter.outdoor,this.effectiveQuality);else if(this.chapter.outdoor)worldEntityArt(c,e,this.state,this.settings.reducedMotion?0:this.time);else entityArt(c,e,this.settings.reducedMotion?0:this.time,e.type==='exit'?chapterDone(this.state,this.chapter.index):e.type==='episode'?this.state.episodes.includes(this.chapter.index):this.state.solved.includes(e.id)||this.state.records.includes(e.id),p,this.chapter.index);}
  if(this.state.projects.includes('melody')){const x=this.player.x-25,y=this.player.y+11;drawCat(c,walkable(x,y,this.blocks)?x:this.player.x,y,this.settings.reducedMotion?0:this.walk);}
  if(this.effectiveQuality==='high'){for(const e of this.chapter.entities.filter(e=>e.type==='station'))glow(c,e.x,e.y-23,p.light,70,.13);glow(c,this.player.x,this.player.y-12,p.light,125,.09);}
  if(this.wardTime>0){glow(c,this.player.x,this.player.y-12,'#c9ef98',125,.35);c.strokeStyle='#c6ed9277';c.lineWidth=2;c.beginPath();c.arc(this.player.x,this.player.y-10,85+Math.sin(this.wardTime*3)*14,0,Math.PI*2);c.stroke();}
  const nearest=this.nearest();if(nearest&&!this.paused){c.strokeStyle='#daefb3';c.lineWidth=1;c.strokeRect(nearest.x-22,nearest.y-37,44,48);}
  if(!this.settings.reducedMotion&&this.effectiveQuality==='high'){const random=rng(189);for(let i=0;i<17;i++){const x=cx+(random()*640+Math.sin(this.time*.3+i)*8)%640,y=cy+(random()*360+this.time*(2+i%3))%360;c.fillStyle=i%2?'#e7dca244':'#c4e5a522';c.fillRect(Math.round(x),Math.round(y),1,1);}}
   c.restore();this.renderAtmosphere(cx,cy);this.renderGlitch();
 }
  renderAtmosphere(cx,cy){
  if(this.chapter.outdoor)return;
  const c=this.ctx,m=this.maskCtx,dim=this.settings.calm?.03:this.settings.horror==='cinematic'?.28:.12,power=this.director.darkness;
  m.globalCompositeOperation='source-over';m.clearRect(0,0,640,360);m.fillStyle=`rgba(4,12,15,${dim+power*.5})`;m.fillRect(0,0,640,360);m.globalCompositeOperation='destination-out';
  const x=this.player.x-cx,y=this.player.y-cy-10,radius=this.wardTime>0?220:power>0?145:205,g=m.createRadialGradient(x,y,15,x,y,radius);g.addColorStop(0,'#000');g.addColorStop(1,'transparent');m.fillStyle=g;m.fillRect(x-radius,y-radius,radius*2,radius*2);m.globalCompositeOperation='source-over';c.drawImage(this.lightMask,0,0);
  if(!this.settings.calm&&this.director.event==='arrival'){const alpha=Math.min(.45,(8-this.director.remaining)/3,this.director.remaining/3);character(c,552,185,{kind:'shadow',scale:2.2,alpha});if(this.settings.pixelVeil){c.save();c.globalAlpha=alpha;mosaic(c,535,119,36,24,this.chapter.index);c.restore();}}
   if(!this.settings.calm&&this.director.event==='receipt'){c.save();c.globalAlpha=Math.min(.65,this.director.remaining/3);c.fillStyle='#b2baa1';for(let i=0;i<5;i++){c.fillRect(482+i*19,28+i*8,14,28);c.fillStyle='#4b6357';c.fillRect(485+i*19,34+i*8,8,2);c.fillStyle='#b2baa1';}c.restore();}
  }
  renderGlitch(){
   if(this.settings.reducedMotion||this.settings.calm)return;
   const area=this.chapter?.outdoor?8:this.chapter?.index??0,phase=Math.floor(this.time*2.4+area*11)%31;
   if(phase!==7&&phase!==8)return;
   const c=this.ctx,seed=rng(7000+area+Math.floor(this.time*2.4));
   c.save();c.globalCompositeOperation='screen';c.globalAlpha=this.chapter?.outdoor?.08:.11;
   const y=12+Math.floor(seed()*330);c.fillStyle=area===6?'#e1c987':'#b7d7ad';c.fillRect(0,y,640,1);
   c.globalAlpha=this.chapter?.outdoor?.06:.08;
   const blocks=this.settings.pixelVeil?9:3;
   for(let i=0;i<blocks;i++){const x=Math.floor(seed()*620),h=1+Math.floor(seed()*4);c.fillStyle=i%2?'#d5e6a4':'#7ab4a0';c.fillRect(x,y+(i%3)-1,4+Math.floor(seed()*18),h);}
   c.globalCompositeOperation='source-over';c.globalAlpha=.28;c.fillStyle=area===6?'#e2c78a':'#9fbea2';c.font='7px monospace';c.textAlign='left';c.fillText(area===6?'BUY? / PAUSED':'SIGNAL / 00:00',8,y-4);
   c.restore();
  }
  drawMinimap(canvas){if(!this.chapter)return;const c=canvas.getContext('2d'),s=canvas.width/this.worldWidth,out=this.chapter.outdoor,k=out?2:1;c.clearRect(0,0,canvas.width,canvas.height);c.save();c.scale(s,s);c.fillStyle='#0c1a1c';c.fillRect(0,0,this.worldWidth,this.worldHeight);c.strokeStyle='#536e51';c.lineWidth=7;c.strokeRect(37,78,this.worldWidth-74,this.worldHeight-110);c.fillStyle='#364c3e';for(const b of this.blocks)c.fillRect(b.x,b.y,b.w,b.h);for(const z of this.chapter.hideZones){c.fillStyle='#548b88';c.fillRect(z.x-12,z.y-12,24,24);}for(const e of this.visibleEntities()){const done=e.type==='episode'?this.state.episodes.includes(this.chapter.index):e.type==='detail'?this.state.detailNotes.includes(e.id):this.state.solved.includes(e.id)||this.state.records.includes(e.id);c.fillStyle=e.type==='detail'?(done?'#66765f':'#d4bf80'):done?'#53674d':e.type==='portal'?canVisitChapter(this.state,e.chapterIndex)?'#97c1a3':'#566657':e.type==='episode'||e.type==='discovery'?'#e4c884':e.type==='exit'||e.type==='wayback'?'#a5d88a':'#8eae97';if(e.type==='episode'||e.type==='portal'){c.beginPath();c.arc(e.x,e.y,19*k,0,7);c.fill();if(out){c.font='24px monospace';c.textAlign='center';c.fillStyle='#10271e';c.fillText(e.chapterIndex+1,e.x,e.y+8);}}else if(e.type==='detail'){c.fillRect(e.x-5*k,e.y-5*k,10*k,10*k);}else c.fillRect(e.x-10*k,e.y-10*k,20*k,20*k);if(this.guideTarget?.id===e.id){c.strokeStyle='#e5d7a1';c.lineWidth=8;c.strokeRect(e.x-44,e.y-44,88,88);}}if(this.hasShadow&&this.threat==='hunted'){c.fillStyle='#d39987';c.fillRect(this.shadow.x-13,this.shadow.y-13,26,26);}c.strokeStyle='#a6bd7c55';c.lineWidth=5;c.strokeRect(this.camera.x,this.camera.y,640,360);c.fillStyle='#edfac9';c.beginPath();c.arc(this.player.x,this.player.y,15*k,0,7);c.fill();c.restore();}
}
