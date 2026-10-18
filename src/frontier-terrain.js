// Deterministic height field in the western ranges. Coordinates remain save compatible.
export const PEAKS=[{id:'glasspeak',x:34,y:244,height:18,rx:28,ry:35},{id:'ironpeak',x:92,y:298,height:27,rx:32,ry:40},{id:'dawnpeak',x:44,y:353,height:23,rx:30,ry:27}];
export function terrainHeight(x,y){
 let z=Math.max(0,1-Math.hypot((x-82)/17,(y-6)/20))*12;
 if(x>132||y<203)return z;
 for(const p of PEAKS){const d=Math.hypot((x-p.x)/p.rx,(y-p.y)/p.ry);if(d<1)z=Math.max(z,p.height*(1-d)*(1-d*.18));}
 // Broad stone steps at the first observatory; no vertical walls to trap a body.
 if(x>40&&x<47&&y>220&&y<234)z=Math.round(z*3)/3;
 return z;
}
export function terrainSlope(x,y,angle){const d=.6;return(terrainHeight(x+Math.cos(angle)*d,y+Math.sin(angle)*d)-terrainHeight(x,y))/d;}
export function terrainTravel(f,model,heading){const slope=terrainSlope(f.x,f.y,heading),cap=model?.climb??1.7;if(slope>cap)return .08;return Math.max(.15,Math.min(1.15,1-Math.max(0,slope)*(.8/(model?.offroad||1))));}
export function terrainSight(world,a,b){if(world.interior)return true;const d=Math.hypot(b.x-a.x,b.y-a.y);if(d<.1)return true;const start=terrainHeight(a.x,a.y)+.8,end=terrainHeight(b.x,b.y)+.65;
 for(let n=.4;n<d-.3;n+=.45){const t=n/d;if(terrainHeight(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t)>start+(end-start)*t-.08)return false;}return true;
}
const TERRAIN_TONES=[
 [['#395947','#436148','#4a674d','#3d5d48'],['#4a6961','#527269','#5c766b','#46645e'],['#657b78','#6e8380','#798a83','#5e7573'],['#acb9b2','#b9c3bb','#c9cec2','#a0b0ab'],['#89968a','#939d90','#89968a','#818e85']],
 [['#1d3439','#233b3d','#29423f','#21383a'],['#253c42','#2a4347','#324b4b','#243b40'],['#2c444c','#354e55','#3e575b','#2b424b'],['#435561','#4b626b','#566c74','#3e535f'],['#394d4e','#415455','#394d4e','#354749']]
];
export function drawTerrain(renderer,f,horizon,night=false){
 renderer.terrainActive=false;
 if(renderer.world.interior||f.life.expanse.swimming||f.x>152||f.y<182)return;
 const {c,w,h}=renderer;renderer.terrainActive=true;const depth=renderer.terrainDepth??=new Float32Array(w*h);depth.fill(Infinity);const eye=terrainHeight(f.x,f.y)+.8,columns=renderer.detail===2?12:renderer.low?8:4,palette=TERRAIN_TONES[night?1:0];
 // Height-map columns are bounded; they do not allocate a mesh each frame.
 for(let x=0;x<w;x+=columns){const side=(x/w-.5)*1.4,rx=Math.cos(f.angle)-Math.sin(f.angle)*side,ry=Math.sin(f.angle)+Math.cos(f.angle)*side;let ceiling=h;
  for(let d=1;d<72;d+=d<16?.6:1.5){const wx=f.x+rx*d,wy=f.y+ry*d,z=terrainHeight(wx,wy),top=Math.floor(horizon+(eye-z)*h*.66/d);if(top>=ceiling)continue;
   const tile=renderer.world.tiles[Math.floor(wy)*renderer.world.size+Math.floor(wx)];const band=tile===2?4:z>20?3:z>13?2:z>6?1:0,grain=(Math.imul(Math.floor(wx*2),17)^Math.imul(Math.floor(wy*2),29))&3;c.fillStyle=palette[band][grain];c.globalAlpha=Math.max(.3,1-d/100);c.fillRect(x,Math.max(0,top),columns,ceiling-Math.max(0,top));for(let yy=Math.max(0,top);yy<Math.min(h,ceiling);yy++)depth.fill(d,yy*w+x,yy*w+Math.min(w,x+columns));ceiling=top;if(ceiling<0)break;
  }
 }c.globalAlpha=1;
}
