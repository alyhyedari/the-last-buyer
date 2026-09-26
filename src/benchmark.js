import {character,glow} from './art.js';

// Keep the storage key stable; an older algorithm must be measured again.
export const BENCHMARK_KEY='last-buyer.benchmark.v1';
export const BENCHMARK_VERSION=2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const round=v=>Math.round(v*100)/100;
const percentile=(values,p)=>{const s=[...values].sort((a,b)=>a-b),i=(s.length-1)*p,l=Math.floor(i);return s[l]+(s[Math.ceil(i)]-s[l])*(i-l);};

export function benchmarkProfile(){
 const n=globalThis.navigator||{};
 return {
  cores:Number.isFinite(n.hardwareConcurrency)?clamp(Math.round(n.hardwareConcurrency),1,64):null,
  memoryGb:Number.isFinite(n.deviceMemory)?clamp(n.deviceMemory,.25,64):null,
  touchPoints:clamp(Math.round(n.maxTouchPoints||0),0,10),
  dpr:clamp(round(globalThis.devicePixelRatio||1),.5,4),
  viewport:{width:clamp(Math.round(globalThis.innerWidth||0),0,16384),height:clamp(Math.round(globalThis.innerHeight||0),0,16384)},
  canvas:Boolean(globalThis.HTMLCanvasElement),
  audio:Boolean(globalThis.AudioContext||globalThis.webkitAudioContext),
  reducedMotion:Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
 };
}

// A budget score for this scene, never a ranking based on core count or RAM.
export function classifyPerformance({p95FrameMs,renderP95Ms,slowFrameRatio}){
 const score=Math.round(60*Math.min(1,20/Math.max(1,p95FrameMs))+25*Math.min(1,8/Math.max(1,renderP95Ms))+15*(1-slowFrameRatio));
 const quality=p95FrameMs<=22&&renderP95Ms<=8&&slowFrameRatio<=.08?'high':p95FrameMs<=38&&renderP95Ms<=18&&slowFrameRatio<=.3?'auto':'low';
 return {score,quality};
}
export function validateBenchmark(v){
 if(!v||typeof v!=='object'||v.version!==BENCHMARK_VERSION)return null;
 const keys=['version','at','score','quality','medianFrameMs','p95FrameMs','renderP95Ms','slowFrameRatio','frameCount','durationMs','profile'];
 if(Object.keys(v).some(k=>!keys.includes(k)))return null;
 if(typeof v.at!=='string'||v.at.length>40||!Number.isFinite(Date.parse(v.at)))return null;
 for(const k of ['score','medianFrameMs','p95FrameMs','renderP95Ms','slowFrameRatio','frameCount','durationMs'])if(!Number.isFinite(v[k])||v[k]<0)return null;
 if(!Number.isInteger(v.frameCount)||v.frameCount<12||v.frameCount>1000||v.durationMs<500||v.durationMs>8000||v.medianFrameMs<=0||v.p95FrameMs<v.medianFrameMs||v.p95FrameMs>1000||v.renderP95Ms>1000||v.slowFrameRatio>1)return null;
 const p=v.profile;
 if(!p||typeof p!=='object'||Object.keys(p).some(k=>!['cores','memoryGb','touchPoints','dpr','viewport','canvas','audio','reducedMotion'].includes(k)))return null;
 if(!p.viewport||Object.keys(p.viewport).some(k=>!['width','height'].includes(k)))return null;
 for(const d of ['width','height'])if(!Number.isInteger(p.viewport[d])||p.viewport[d]<0||p.viewport[d]>16384)return null;
 if(p.cores!==null&&(!Number.isInteger(p.cores)||p.cores<1||p.cores>64))return null;
 if(p.memoryGb!==null&&(!Number.isFinite(p.memoryGb)||p.memoryGb<.25||p.memoryGb>64))return null;
 if(!Number.isInteger(p.touchPoints)||p.touchPoints<0||p.touchPoints>10||!Number.isFinite(p.dpr)||p.dpr<.5||p.dpr>4)return null;
 if(['canvas','audio','reducedMotion'].some(k=>typeof p[k]!=='boolean'))return null;
 const metrics={medianFrameMs:round(v.medianFrameMs),p95FrameMs:round(v.p95FrameMs),renderP95Ms:round(v.renderP95Ms),slowFrameRatio:round(v.slowFrameRatio)};
 const grade=classifyPerformance(metrics);
 if(v.score!==grade.score||v.quality!==grade.quality)return null;
 return {version:BENCHMARK_VERSION,at:v.at,...grade,...metrics,frameCount:v.frameCount,durationMs:Math.round(v.durationMs),profile:{...p,viewport:{...p.viewport}}};
}
export function readBenchmark(storage){try{return validateBenchmark(JSON.parse(storage?.getItem?.(BENCHMARK_KEY)||'null'));}catch{return null;}}
export function writeBenchmark(storage,value){try{const v=validateBenchmark(value);if(!v)return false;storage.setItem(BENCHMARK_KEY,JSON.stringify(v));return true;}catch{return false;}}

function scenery(){
 const base=document.createElement('canvas');base.width=960;base.height=640;
 const c=base.getContext('2d',{alpha:false});
 c.fillStyle='#102521';c.fillRect(0,0,960,640);
 for(let y=0;y<640;y+=16)for(let x=0;x<960;x+=16){c.fillStyle=(x*7+y*3)%48?'#182f28':'#233c2c';c.fillRect(x,y,15,15);}
 for(let i=0;i<18;i++){const x=i*137%850,y=i*89%520;c.fillStyle='#0a191b';c.fillRect(x,y,86,70);c.fillStyle='#36503c';c.fillRect(x,y,86,7);for(let j=0;j<4;j++){c.fillStyle=j%2?'#819858':'#293f33';c.fillRect(x+8+j*18,y+20,9,15);}}
 c.fillStyle='#495040';c.fillRect(0,280,960,56);c.fillStyle='#b7b478';for(let x=0;x<960;x+=36)c.fillRect(x,306,12,2);
 return base;
}
function draw(c,base,step,reduced){
 const t=reduced?0:step/60,x=80+Math.sin(t*.5)*70,y=100+Math.cos(t*.4)*55;
 c.drawImage(base,x,y,640,360,0,0,640,360);
 for(let i=0;i<16;i++)character(c,24+i*43%600,90+i*59%244,{kind:i%3?'sam':'mina',walk:reduced?0:t*4+i,facing:i%2?1:-1});
 for(let i=0;i<96;i++){c.fillStyle=i%4?'#62816b':'#c4d5a0';c.fillRect((i*71+t*17)%640,(i*41+t*9)%360,2,2);}
 for(let i=0;i<4;i++)glow(c,85+i*149,95+i%2*150,'#c8d397',72,.15);
}

export function runBenchmark({canvas,onPhase=()=>{},signal}={}){
 return new Promise((resolve,reject)=>{
  let id,timer,finished=false;
  const clean=()=>{cancelAnimationFrame(id);clearTimeout(timer);document.removeEventListener('visibilitychange',visibility);signal?.removeEventListener('abort',abort);};
  const fail=code=>{if(finished)return;finished=true;clean();reject(new Error(code));};
  const abort=()=>fail('cancelled'),visibility=()=>{if(document.hidden)fail('interrupted');};
  if(signal?.aborted){fail('cancelled');return;}
  if(document.hidden){fail('interrupted');return;}
  const ctx=canvas?.getContext('2d',{alpha:false});
  if(!ctx){fail('unavailable');return;}
  signal?.addEventListener('abort',abort,{once:true});document.addEventListener('visibilitychange',visibility);
  canvas.width=640;canvas.height=360;ctx.imageSmoothingEnabled=false;
  const profile=benchmarkProfile(),base=scenery(),started=performance.now(),times=[],costs=[];
  let last=0,step=0,announced=-1;
  onPhase({id:'prepare',progress:0});
  timer=setTimeout(()=>fail('insufficient'),7500);
  const tick=now=>{
   if(finished)return;
   try{
    const elapsed=now-started;
    if(last&&elapsed>350){const interval=now-last;if(interval>1000){fail('interrupted');return;}if(interval>0)times.push(interval);}
    last=now;const before=performance.now();draw(ctx,base,step++,profile.reducedMotion);if(elapsed>350)costs.push(performance.now()-before);
    const mark=Math.floor(elapsed/150);
    if(mark!==announced){announced=mark;onPhase({id:elapsed<350?'prepare':elapsed<1300?'render':'measure',progress:Math.min(.98,elapsed/2200)});}
    if(elapsed<2200){id=requestAnimationFrame(tick);return;}
    if(times.length<12){fail('insufficient');return;}
    const metrics={medianFrameMs:round(percentile(times,.5)),p95FrameMs:round(percentile(times,.95)),renderP95Ms:round(percentile(costs,.95)),slowFrameRatio:round(times.filter(t=>t>34).length/times.length)};
    const record=validateBenchmark({version:BENCHMARK_VERSION,at:new Date().toISOString(),...classifyPerformance(metrics),...metrics,frameCount:times.length,durationMs:Math.round(performance.now()-started),profile});
    if(!record){fail('insufficient');return;}
    finished=true;clean();onPhase({id:'finish',progress:1});resolve(record);
   }catch{fail('unavailable');}
  };
  id=requestAnimationFrame(tick);
 });
}
