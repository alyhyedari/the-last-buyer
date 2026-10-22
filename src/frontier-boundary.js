import {h,button} from './dom.js';
import {terrainHeight} from './frontier-terrain.js';
export function unfinishedZone(world,f){
 if(world.interior||f.life.expanse.swimming||f.life.combat.arena)return false;
 const size=world.size||512;
 // The northern hill is the nearest height field to the original spawn.
 return (f.y<32&&f.x>58&&f.x<106&&terrainHeight(f.x,f.y)>1.5)||Math.min(f.x,f.y,size-f.x,size-f.y)<7;
}
export const BOUNDARY_JOKES=[
 ['به سازنده گفتم این تپه زمین ندارد. گفت: فعلاً با دید مثبت نگاه کن. مثبت نگاه کردم، هنوز زمین ندارد.','I told the developer this hill has no floor. He said stay positive. Still no floor.'],
 ['چهارده مدل ماشین ساخته، برای این سه متر خاک مرخصی گرفته.','Fourteen cars built. Three metres of dirt? Apparently that needs a holiday.'],
 ['اینجا منظره ابدی است؛ چون سازنده گفته فردا درستش می‌کنم.','An eternal view. The developer promised to fix it tomorrow.'],
 ['این باگ نیست؛ زمین دورکاری می‌کند. امروز نیامده دفتر.','The ground works remotely. It did not come in today.'],
 ['هنوز اینجایی؟ سازنده هم همین‌قدر روی این تکه وقت می‌گذاشت، الان فرودگاه بود.','Still here? If the developer spent this long here, we would have an airport.'],
 ['زمین دارد استعفا می‌دهد. لطفاً قبل از منابع انسانی برگرد جاده.','The ground is resigning. Get back to the road before HR arrives.'],
 ['این لرزش موتور نیست؛ سازنده دارد مسئولیت را از سر خودش می‌تکاند.','That is not your engine. The developer is shaking off responsibility.'],
 ['قول داده در آپدیت بعدی درست کند. شماره آپدیت را به باستان‌شناس سپرده.','Fixed next update, he said. An archaeologist is finding the version number.']
];
export class BoundaryDirector{
 constructor(){this.seconds=0;this.next=0;this.line=0;this.quiet=false;}
 step(inside,dt,paused=false){if(paused)return{active:false,shake:0,glitch:false};if(!inside){this.seconds=0;this.next=0;this.quiet=false;return{active:false,shake:0,glitch:false};}
  this.seconds+=Math.min(.1,Math.max(0,Number.isFinite(dt)?dt:0));let joke=null;
  if(!this.quiet&&this.seconds>=this.next){joke=this.line++%BOUNDARY_JOKES.length;this.next=this.seconds+7;}
  const phase=(this.seconds-18)%12,pulse=this.seconds>=18&&phase<2.2;
  return{active:true,joke,shake:pulse?Math.min(3,1+(this.seconds-18)/30):0,glitch:this.seconds>=10&&this.seconds%9<1.3,stage:this.seconds<10?'jokes':this.seconds<18?'glitch':'quake'};
 }
}
export function createBoundaryWarning({root,settings}){
 const director=new BoundaryDirector(),copy=h('p'),label=h('strong'),dismiss=button('',()=>{director.quiet=true;card.hidden=true;},'text-btn'),card=h('aside',{class:'boundary-warning',hidden:true,'aria-live':'polite'},label,copy,dismiss);root.append(card);
 return{update(world,f,dt,time,paused){const event=director.step(unfinishedZone(world,f),dt,paused),fa=document.documentElement.lang==='fa';
  root.dataset.boundary=event.active?event.stage:'off';root.dataset.boundaryGlitch=String(event.active&&event.glitch&&!settings.reducedMotion);root.dataset.boundaryReduced=String(!!settings.reducedMotion);
  root.style.setProperty('--boundary-x',(!settings.reducedMotion?Math.sin(time*23)*event.shake:0)+'px');root.style.setProperty('--boundary-y',(!settings.reducedMotion?Math.cos(time*19)*event.shake:0)+'px');
  if(!event.active||director.quiet){card.hidden=true;return;}label.textContent=fa?'رله / واحد پیگیریِ فردا درستش می‌کنم':'RELAY / TOMORROW DEPARTMENT';dismiss.textContent=fa?'باشه، ساکت!':'Enough, hush!';
  if(event.joke!==null&&event.joke!==undefined)copy.textContent=BOUNDARY_JOKES[event.joke][fa?0:1];card.hidden=false;
 },dispose(){card.remove();}};
}
