import {h,button} from './dom.js';
import {tr} from './i18n.js';
import {MOBILE} from './mobile-text.js';
export function phoneDisplay({width,height,touchPoints,coarse}){
 const phone=touchPoints>0&&coarse&&Math.min(width,height)<=600;
 return {phone,landscape:width>height};
}
export function createMobileDisplay({getState,onBlock}){
 let blocked=false,portraitAccepted=false,requesting=false,ownsFullscreen=false,ownsOrientation=false,raf=0;
 const pointerQuery=matchMedia('(pointer: coarse)');
 const card=h('section',{class:'rotate-card',id:'rotate-card',hidden:true,'aria-labelledby':'rotate-title'});
 const art=h('div',{class:'rotate-phone','aria-hidden':'true'},h('i',{}),h('span',{},'↻'));
 const title=h('h2',{id:'rotate-title'}),body=h('p'),status=h('p',{class:'rotate-status','aria-live':'polite'});
 const enter=button('',requestLandscape,'btn primary',{'data-landscape-enter':'true'}),skip=button('',()=>{portraitAccepted=true;sync();document.getElementById('world').focus({preventScroll:true});},'btn secondary',{'data-portrait-continue':'true'});
 card.append(art,title,body,h('div',{class:'modal-actions'},enter,skip),status);
 document.querySelector('#game .play-layout').before(card);
 function profile(){return phoneDisplay({width:innerWidth,height:innerHeight,touchPoints:navigator.maxTouchPoints||0,coarse:pointerQuery.matches});}
 function translate(){title.textContent=tr(MOBILE.title);body.textContent=tr(MOBILE.body);enter.textContent=tr(MOBILE.enter);skip.textContent=tr(MOBILE.portrait);status.textContent=tr(requesting?MOBILE.checking:MOBILE.manual);}
 function sync(){
  const p=profile(),s=getState();
  if(p.landscape||!s.playing)portraitAccepted=false;
  document.body.classList.toggle('phone-landscape',p.phone&&p.landscape&&s.playing);
  const next=p.phone&&!p.landscape&&s.playing&&!s.modalOpen&&!s.ending&&!portraitAccepted;
  card.hidden=!next;document.getElementById('viewport-wrap').inert=next;
  if(next!==blocked){blocked=next;onBlock(next);if(next)enter.focus({preventScroll:true});}
  return p;
 }
 async function requestLandscape(){
  if(requesting||!profile().phone)return false;
  requesting=true;enter.disabled=true;translate();
  try{
   if(!document.fullscreenElement&&document.documentElement.requestFullscreen){
    try{await document.documentElement.requestFullscreen({navigationUI:'hide'});ownsFullscreen=true;}catch{}
   }
   if(screen.orientation?.lock){try{await screen.orientation.lock('landscape');ownsOrientation=true;}catch{}}
  }finally{requesting=false;enter.disabled=false;translate();sync();}
  return profile().landscape;
 }
 function leave(){
  if(ownsOrientation){try{screen.orientation?.unlock?.();}catch{}ownsOrientation=false;}
  if(ownsFullscreen&&document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});
  ownsFullscreen=false;sync();
 }
 function queueSync(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;sync();});}
 window.addEventListener('resize',queueSync);pointerQuery.addEventListener('change',queueSync);screen.orientation?.addEventListener('change',queueSync);document.addEventListener('fullscreenchange',queueSync);
 translate();sync();
 return {sync,translate,requestLandscape,leave,get blocked(){return blocked;}};
}
