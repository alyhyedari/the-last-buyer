// Small cached sprites: four directions × six silhouettes × four colour tones.
// Ghosts are visual echoes only. This module never touches simulation state.
export const GHOST_VEHICLES=['foot','bike','motorcycle','car','horse','swim'];
const PALETTES=[['#71deca','#c6fff1','#347a87'],['#a9e982','#e7ffc4','#587d75'],['#85d9ec','#d5faff','#426a92'],['#b9badf','#f2e7ff','#68699b']];
export function ghostVariant(ghost,cameraAngle){
 const vehicle=Math.max(0,GHOST_VEHICLES.indexOf(ghost.vehicle)),tone=Number.isFinite(ghost.tone)?Math.max(0,Math.min(3,Math.floor(ghost.tone))):0,angle=Number.isFinite(ghost.angle)?ghost.angle:0;
 return tone*32+vehicle*4+((Math.round((angle-cameraAngle)/(Math.PI/2))%4+4)%4);
}
export function drawGhostSprite(c,variant=0){
 const value=Number.isFinite(variant)?Math.max(0,Math.min(127,Math.floor(variant))):0,tone=Math.floor(value/32),vehicle=Math.min(5,Math.floor(value%32/4)),face=value%4,side=face===1||face===3,front=face===2,[body,light,dark]=PALETTES[tone];
 const r=(x,y,w,h,color=body)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 c.save();if(face===3){c.translate(48,0);c.scale(-1,1);}
 // Quiet ground signature, drawn in the same depth-tested sprite as the body.
 r(9,62,30,1,body+'66');r(5,60,5,1,body+'44');r(38,60,5,1,body+'44');
 const head=(x,y,profile=side)=>{
  r(x,y,profile?10:14,13,body);r(x-1,y-3,profile?11:16,5,dark);r(x-2,y+1,3,10,dark);
  if(profile){r(x+9,y+4,3,5,light);r(x+7,y+3,2,2,dark);}else if(front){r(x+2,y+5,2,2,dark);r(x+10,y+5,2,2,dark);r(x+4,y+10,6,1,light);}else{r(x+1,y+1,12,5,dark);r(x+5,y+9,5,2,light);}
 };
 const rider=(y=22)=>{head(side?21:17,y-15);r(side?20:15,y,side?11:20,19,body);r(side?28:10,y+5,side?10:5,4,light);r(side?32:34,y+7,5,10,light);r(20,y+19,6,9,dark);r(29,y+19,5,10,body);};
 if(vehicle===0){
  head(side?21:17,12);r(side?20:14,26,side?12:22,25,body);r(side?20:15,28,3,17,light);r(side?27:24,29,2,18,dark);
  r(side?27:10,29,5,20,body);if(!side)r(36,29,4,20,light);r(side?20:16,51,6,9,dark);r(side?28:29,51,6,11,body);r(side?19:14,60,9,2,light);r(side?28:28,61,10,2,light);
  r(side?20:14,40,side?12:22,1,light+'77');r(side?20:14,48,side?12:22,1,dark);
 }else if(vehicle===1||vehicle===2){
  const motor=vehicle===2;
  if(side){r(3,50,12,12,dark);r(6,53,6,6,light);r(33,50,12,12,dark);r(36,53,6,6,light);r(11,50,26,3,body);r(15,42,14,motor?10:3,body);r(25,42,3,13,light);r(34,38,3,17,body);r(31,36,9,3,light);}
  else{r(14,49,8,14,dark);r(29,49,8,14,dark);r(18,43,16,motor?11:4,body);r(23,44,4,15,light);r(10,35,30,3,light);r(12,39,4,11,dark);r(35,39,4,11,dark);}
  rider(26);if(motor){r(side?20:16,9,side?12:17,6,light);r(side?28:17,13,side?5:15,3,dark);r(19,42,12,7,body);}
 }else if(vehicle===3){
  if(side){r(2,43,44,14,body);r(10,29,26,15,body);r(13,31,9,10,dark);r(25,31,8,10,dark);r(6,55,9,8,dark);r(34,55,9,8,dark);r(7,57,7,3,light);r(35,57,7,3,light);r(41,45,5,4,light);r(3,48,2,3,light);r(23,45,2,10,dark);r(11,47,8,2,light);}
  else{r(5,43,38,16,body);r(11,29,26,16,body);r(14,32,20,10,dark);r(5,55,7,8,dark);r(36,55,7,8,dark);r(5,48,8,4,light);r(35,48,8,4,light);r(17,53,15,3,dark);r(8,58,32,2,light);if(!front)r(13,36,23,2,body);}
  r(6,47,36,1,light+'66');
 }else if(vehicle===4){
  if(side){r(7,39,29,14,body);r(29,24,7,22,body);r(31,20,12,11,body);r(35,16,3,6,light);r(40,27,5,5,light);r(30,25,3,18,dark);r(9,52,4,11,body);r(29,52,4,11,light);r(4,40,3,16,dark);r(15,39,13,7,dark);}
  else{r(12,38,26,16,body);r(18,26,17,20,body);r(19,20,15,13,body);r(19,15,4,8,light);r(30,15,4,8,light);r(26,24,3,18,dark);r(14,51,5,12,body);r(31,51,5,12,light);r(17,35,19,3,dark);}
  head(side?15:17,5);r(side?15:14,19,side?12:20,18,body);r(side?23:11,24,side?11:4,4,light);r(side?17:15,36,5,15,dark);r(29,36,5,15,dark);
 }else{
  head(side?28:17,35);r(side?12:11,48,side?26:28,6,body);r(5,52,11,3,light);r(34,51,10,3,light);r(7,58,33,1,body+'aa');r(3,60,10,1,light+'66');r(36,57,9,1,light+'66');
 }
 // Interrupted scan lines make echoes distinct without flashing or animation.
 r(3,56,5,1,light+'88');r(40,35,4,1,body+'77');c.restore();return true;
}
