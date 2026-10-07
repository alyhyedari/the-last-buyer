const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

/**
 * A touch joystick that appears under the player’s thumb, like a modern
 * twin-stick control. The canvas keeps receiving the pointer so the scene
 * remains the only large touch target; the visual base is only a guide.
 */
export function mountDynamicJoystick({surface,root,onVector=()=>{},onActive=()=>{},onEnd=()=>{}}){
 if(!surface||!root)return{setEnabled:()=>{},setScale:()=>{},destroy:()=>{}};
 const knob=root.querySelector('.dynamic-stick-knob');
 let enabled=false,pointerId=null,radius=46,scale=1;
 const isTouch=e=>e.pointerType==='touch'||e.pointerType==='pen';
 const local=e=>{const rect=surface.getBoundingClientRect();return{x:e.clientX-rect.left,y:e.clientY-rect.top};};
 const paint=(x,y)=>{
  const length=Math.hypot(x,y),factor=length>radius?radius/length:1;
  const dx=x*factor,dy=y*factor;
  if(knob)knob.style.transform=`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  onVector({x:dx/radius,y:dy/radius});
 };
 const clear=()=>{
  if(pointerId!==null){try{surface.releasePointerCapture(pointerId);}catch{}}
  pointerId=null;root.hidden=true;root.classList.remove('is-active');
  if(knob)knob.style.transform='translate(-50%,-50%)';
  onVector({x:0,y:0});onEnd();
 };
 const down=e=>{
  if(!enabled||pointerId!==null||!isTouch(e))return;
  e.preventDefault();pointerId=e.pointerId;
  const point=local(e);root.style.left=`${point.x}px`;root.style.top=`${point.y}px`;root.hidden=false;root.classList.add('is-active');
  try{surface.setPointerCapture(pointerId);}catch{}
  paint(0,0);onActive();
 };
 const move=e=>{if(pointerId===e.pointerId){e.preventDefault();const point=local(e);const origin={x:parseFloat(root.style.left)||point.x,y:parseFloat(root.style.top)||point.y};paint(point.x-origin.x,point.y-origin.y);}};
 const end=e=>{if(pointerId===e.pointerId)clear();};
 surface.addEventListener('pointerdown',down,{passive:false});
 surface.addEventListener('pointermove',move,{passive:false});
 surface.addEventListener('pointerup',end);surface.addEventListener('pointercancel',end);surface.addEventListener('lostpointercapture',end);
 return{
  setEnabled(value){enabled=Boolean(value);surface.dataset.joystickEnabled=String(enabled);if(!enabled)clear();},
  setScale(value){scale=clamp(Number(value)||1,.78,1.4);radius=46;root.style.setProperty('--stick-scale',String(scale));},
  destroy(){clear();surface.removeEventListener('pointerdown',down);surface.removeEventListener('pointermove',move);surface.removeEventListener('pointerup',end);surface.removeEventListener('pointercancel',end);surface.removeEventListener('lostpointercapture',end);}
 };
}
