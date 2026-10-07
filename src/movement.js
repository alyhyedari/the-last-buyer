export function movementDirection(dx,dy,previous='down'){
 if(Math.abs(dx)<.001&&Math.abs(dy)<.001)return previous;
 if(Math.abs(dx)>Math.abs(dy)+.001)return dx>0?'right':'left';
 if(Math.abs(dy)>Math.abs(dx)+.001)return dy>0?'down':'up';
 if(previous==='left'||previous==='right')return dx>0?'right':'left';
 return dy>0?'down':'up';
}
