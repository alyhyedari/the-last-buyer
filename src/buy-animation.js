// A visible physical press for every successful purchase; input stays available.
export function createBuyAnimation(getSettings=()=>({}),onPress=()=>{}){
 let canvas=null,frame=0,started=0,sounded=false;
 const dispose=()=>{cancelAnimationFrame(frame);canvas?.remove();canvas=null;};
 function play(){dispose();canvas=document.createElement('canvas');canvas.width=240;canvas.height=200;canvas.className='buy-click-animation';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);const c=canvas.getContext('2d'),still=getSettings().reducedMotion,duration=still?500:940;started=performance.now();sounded=false;c.imageSmoothingEnabled=false;
  const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h);},oval=(x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(Math.round(x),Math.round(y),rx,ry,0,0,Math.PI*2);c.fill();},smooth=t=>t*t*(3-2*t);
  const draw=now=>{let t=Math.min(1,(now-started)/duration);if(!still&&!sounded&&t>.57){t=.5;started=now-duration*.5;}const press=still?1:t<.3?smooth(t/.3):t<.57?1:1-smooth(Math.min(1,(t-.57)/.32));c.clearRect(0,0,240,200);c.globalAlpha=t>.85?(1-t)/.15:1;if(!sounded&&press>.95){sounded=true;onPress();}
   rect(29,105,183,78,'#070d13');rect(23,93,194,78,'#161d23');rect(29,87,182,88,'#252c2f');rect(35,83,170,87,'#323a3b');rect(31,92,178,73,'#2a3335');rect(35,164,170,4,'#49514e');
   for(const [x,y]of [[43,98],[195,98],[40,155],[195,155]]){oval(x,y,8,6,'#0b131a');rect(x-4,y-1,8,2,'#737c74');rect(x-1,y-3,2,6,'#737c74');}
   const by=119+Math.floor(press*7);oval(119,132,76,43,'#0b1518');oval(119,by+10,70,39,'#758911');oval(119,by,70,39,'#d9f626');oval(119,by-3,66,34,'#e1fa39');c.strokeStyle='#b7d218';c.lineWidth=2;c.beginPath();c.ellipse(119,by,70,39,0,0,Math.PI);c.stroke();rect(83,by-29,52,3,'#f2ff8a');c.fillStyle='#121807';c.font='bold 37px monospace';c.textAlign='center';c.fillText('BUY',117,by+17);
   const hx=137+(1-press)*38,hy=by-74-(1-press)*82;
   rect(hx+28,hy-23,36,47,'#152b3d');rect(hx+30,hy+15,27,8,'#446775');rect(hx+4,hy+18,48,39,'#6e4a3e');rect(hx+8,hy+17,42,35,'#d0a17b');rect(hx+10,hy+18,30,6,'#efd0a4');rect(hx+33,hy+32,14,25,'#b78463');rect(hx+20,hy+39,15,18,'#c08f6d');rect(hx+7,hy+39,15,20,'#d1a07b');rect(hx-4,hy+31,16,43,'#704c3d');rect(hx-1,hy+32,12,38,'#e1b78b');rect(hx-4,hy+63,13,10,'#e7c099');rect(hx-2,hy+62,8,6,'#f3d7b4');rect(hx+3,hy+42,5,2,'#b48768');
   if(t<1)frame=requestAnimationFrame(draw);else dispose();};draw(started);
 }
 return{play,dispose};
}
