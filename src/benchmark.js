
// Keep the storage key stable; an older algorithm must be measured again.
export const BENCHMARK_KEY='last-buyer.benchmark.v1';
export const BENCHMARK_VERSION=3;
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

// A budget score for the heaviest scene, never a ranking by core count or RAM.
export function classifyPerformance({p95FrameMs,renderP95Ms,slowFrameRatio}){
 const score=Math.round(60*Math.min(1,20/Math.max(1,p95FrameMs))+25*Math.min(1,8/Math.max(1,renderP95Ms))+15*(1-slowFrameRatio));
 const quality=p95FrameMs<=22&&renderP95Ms<=8&&slowFrameRatio<=.08?'high':p95FrameMs<=38&&renderP95Ms<=18&&slowFrameRatio<=.3?'auto':'low';
 return {score,quality};
}
export function validateBenchmark(v){
 if(!v||typeof v!=='object'||v.version!==BENCHMARK_VERSION)return null;
 const keys=['version','at','score','quality','medianFrameMs','p95FrameMs','renderP95Ms','slowFrameRatio','frameCount','durationMs','profile','scenes','worldBuildMs','routeMs'];
 if(Object.keys(v).some(k=>!keys.includes(k)))return null;
 if(typeof v.at!=='string'||v.at.length>40||!Number.isFinite(Date.parse(v.at)))return null;
 for(const k of ['score','medianFrameMs','p95FrameMs','renderP95Ms','slowFrameRatio','frameCount','durationMs'])if(!Number.isFinite(v[k])||v[k]<0)return null;
 if(!Number.isInteger(v.frameCount)||v.frameCount<12||v.frameCount>3000||v.durationMs<500||v.durationMs>30000||v.medianFrameMs<=0||v.p95FrameMs<v.medianFrameMs||v.p95FrameMs>1000||v.renderP95Ms>1000||v.slowFrameRatio>1)return null;
 const sceneKeys=['id','medianFrameMs','p95FrameMs','workP95Ms','simulationP95Ms','peakFrameMs','slowFrameRatio','frameCount','durationMs'];
 if(!Array.isArray(v.scenes)||v.scenes.length!==4||v.scenes.some((s,i)=>!s||typeof s!=='object'||Object.keys(s).some(k=>!sceneKeys.includes(k))||s.id!==['city','forest','boss','water'][i]||!Number.isInteger(s.frameCount)||s.frameCount<8||s.frameCount>1000||!sceneKeys.slice(1).every(k=>Number.isFinite(s[k])&&s[k]>=0)||s.medianFrameMs<=0||s.p95FrameMs<s.medianFrameMs||s.peakFrameMs<s.p95FrameMs||s.peakFrameMs>1000||s.workP95Ms>1000||s.simulationP95Ms>s.workP95Ms||s.slowFrameRatio>1||s.durationMs<500||s.durationMs>10000))return null;
 if(![v.worldBuildMs,v.routeMs].every(n=>Number.isFinite(n)&&n>=0&&n<30000)||v.frameCount!==v.scenes.reduce((n,s)=>n+s.frameCount,0))return null;
 if(v.p95FrameMs!==Math.max(...v.scenes.map(s=>s.p95FrameMs))||v.renderP95Ms!==Math.max(...v.scenes.map(s=>s.workP95Ms))||v.slowFrameRatio!==Math.max(...v.scenes.map(s=>s.slowFrameRatio)))return null;
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
 return {version:BENCHMARK_VERSION,at:v.at,...grade,...metrics,frameCount:v.frameCount,durationMs:Math.round(v.durationMs),profile:{...p,viewport:{...p.viewport}},scenes:v.scenes.map(s=>({...s})),worldBuildMs:v.worldBuildMs,routeMs:v.routeMs};
}
export function readBenchmark(storage){try{return validateBenchmark(JSON.parse(storage?.getItem?.(BENCHMARK_KEY)||'null'));}catch{return null;}}
export function writeBenchmark(storage,value){try{const v=validateBenchmark(value);if(!v)return false;storage.setItem(BENCHMARK_KEY,JSON.stringify(v));return true;}catch{return false;}}

export async function runBenchmark({canvas,onPhase=()=>{},signal}={}){
 onPhase({id:'prepare',progress:0});if(signal?.aborted)throw new Error('cancelled');if(document.hidden)throw new Error('interrupted');
 const {createBenchmarkScenes}=await import('./benchmark-scenes.js');if(signal?.aborted)throw new Error('cancelled');
 if(!canvas?.getContext('2d',{alpha:false}))throw new Error('unavailable');const suite=createBenchmarkScenes(canvas),profile=benchmarkProfile();
 return new Promise((resolve,reject)=>{
  let id,timer,finished=false,index=0,stageStart=0,last=0,announced=-1;const started=performance.now(),scenes=[],allFrames=[];let frames=[],costs=[],simulation=[];
  const clean=()=>{cancelAnimationFrame(id);clearTimeout(timer);document.removeEventListener('visibilitychange',visibility);signal?.removeEventListener('abort',abort);};
  const fail=code=>{if(finished)return;finished=true;clean();reject(new Error(code));};const abort=()=>fail('cancelled'),visibility=()=>{if(document.hidden)fail('interrupted');};
  if(signal?.aborted){fail('cancelled');return;}if(document.hidden){fail('interrupted');return;}
  signal?.addEventListener('abort',abort,{once:true});document.addEventListener('visibilitychange',visibility);timer=setTimeout(()=>fail('insufficient'),25000);
  const ids=['city','forest','boss','water'];try{suite.setup(ids[0]);}catch{fail('unavailable');return;}
  const tick=now=>{if(finished)return;try{
   if(!stageStart)stageStart=now;const elapsed=now-stageStart,interval=last?now-last:16.67;last=now;if(interval>1000){fail('interrupted');return;}
   const work=suite.draw(Math.min(.06,interval/1000));if(elapsed>180){frames.push(interval);costs.push(work.workMs);simulation.push(work.simulationMs);allFrames.push(interval);}
   const mark=Math.floor(elapsed/150);if(mark!==announced){announced=mark;onPhase({id:ids[index],progress:(index+Math.min(1,elapsed/1650))/4});}
   if(elapsed>=1650){if(frames.length<8){fail('insufficient');return;}scenes.push({id:ids[index],medianFrameMs:round(percentile(frames,.5)),p95FrameMs:round(percentile(frames,.95)),peakFrameMs:round(Math.max(...frames)),workP95Ms:round(percentile(costs,.95)),simulationP95Ms:round(percentile(simulation,.95)),slowFrameRatio:round(frames.filter(n=>n>34).length/frames.length),frameCount:frames.length,durationMs:Math.round(elapsed)});
    if(++index<4){frames=[];costs=[];simulation=[];stageStart=0;last=0;announced=-1;suite.setup(ids[index]);}else{
     const metrics={medianFrameMs:round(percentile(allFrames,.5)),p95FrameMs:Math.max(...scenes.map(s=>s.p95FrameMs)),renderP95Ms:Math.max(...scenes.map(s=>s.workP95Ms)),slowFrameRatio:Math.max(...scenes.map(s=>s.slowFrameRatio))};
     const record=validateBenchmark({version:BENCHMARK_VERSION,at:new Date().toISOString(),...classifyPerformance(metrics),...metrics,scenes,worldBuildMs:round(suite.worldBuildMs),routeMs:round(suite.routeMs),frameCount:allFrames.length,durationMs:Math.round(performance.now()-started),profile});
     if(!record){fail('insufficient');return;}finished=true;clean();onPhase({id:'finish',progress:1});resolve(record);return;
    }
   }id=requestAnimationFrame(tick);
  }catch{fail('unavailable');}};id=requestAnimationFrame(tick);
 });
}
