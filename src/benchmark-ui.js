import {tr} from './i18n.js';
import {h,button} from './dom.js';
import {BT} from './benchmark-text.js';
import {runBenchmark,validateBenchmark} from './benchmark.js';
const text=value=>tr(value),number=(v,d=1)=>Number.isFinite(v)?v.toFixed(d):'—';
const metric=(label,value)=>h('div',{class:'benchmark-metric'},h('small',{},text(label)),h('strong',{},value));
function resultDetails(r){
 const p=r.profile;
 return h('div',{class:'benchmark-result-grid'},
  metric(BT.score,r.score+'/100'),metric(BT.quality,text(BT[r.quality])),
  metric(BT.median,number(r.medianFrameMs)+' ms'),metric(BT.p95,number(r.p95FrameMs)+' ms'),
  metric(BT.renderCost,number(r.renderP95Ms)+' ms'),metric(BT.slow,number(r.slowFrameRatio*100)+'%'),
  metric(BT.samples,String(r.frameCount)),metric(BT.duration,number(r.durationMs/1000)+' s'),
  metric(BT.hardware,p.cores===null?'—':String(p.cores)),metric(BT.memory,p.memoryGb===null?'—':number(p.memoryGb)+' GB'),
  metric(BT.touch,String(p.touchPoints)),metric(BT.viewport,p.viewport.width+' × '+p.viewport.height)
 );
}
function exportResult(result){
 const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'})),a=document.createElement('a');
 a.href=url;a.download='last-buyer-device-check.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function mountBenchmark(root,{existing=null,onSaved=()=>false,onContinue=()=>{},onClose=()=>{},onSkip=onContinue}={}){
 let current=validateBenchmark(existing),running=false,disposed=false,controller=null,stored=Boolean(current),parts=null;
 const render=()=>{
  if(disposed)return;
  root.replaceChildren(h('div',{class:'modal-kicker'},text(BT.kicker)),h('h2',{},text(BT.title)),h('p',{class:'body-copy'},text(BT.intro)));
  if(current){
   root.append(h('div',{class:'benchmark-complete',role:'status'},h('span',{class:'success-mark','aria-hidden':'true'},'✓'),h('strong',{},text(BT.passed)),h('small',{},text(stored?BT.saved:BT.notStored))));
   root.append(resultDetails(current),h('p',{class:'benchmark-note'},text(BT[current.quality==='high'?'deviceHigh':current.quality==='low'?'deviceLow':'deviceAuto'])),h('p',{class:'modal-note'},text(BT.local)),h('p',{class:'benchmark-privacy'},text(BT.privacy)));
   root.append(h('div',{class:'modal-actions'},button(text(BT.rerun),run,'btn secondary',{'data-benchmark-run':'true'}),button(text(BT.export),()=>exportResult(current),'btn secondary',{'data-benchmark-export':'true'}),button(text(BT.continue),onContinue,'btn primary',{'data-benchmark-continue':'true'})));
  }else{
   const canvas=h('canvas',{class:'benchmark-canvas',width:640,height:360,'aria-label':text(BT.title)}),status=h('p',{class:'benchmark-status','aria-live':'polite'},text(BT.run)),bar=h('div',{class:'benchmark-progress',role:'progressbar','aria-label':text(BT.title),'aria-valuemin':0,'aria-valuemax':100,'aria-valuenow':0},h('i',{}));
   root.append(canvas,bar,status,h('p',{class:'benchmark-privacy'},text(BT.privacy)),h('div',{class:'modal-actions'},button(text(BT.run),run,'btn primary',{'data-benchmark-run':'true'}),button(text(BT.skip),onSkip,'btn secondary',{'data-benchmark-skip':'true'}),button(tr('cancel'),onClose,'btn secondary')));
   parts={canvas,status,bar};
  }
 };
 const run=async()=>{
  if(running||disposed)return;
  running=true;current=null;render();controller=new AbortController();
  const activeParts=parts,action=root.querySelector('[data-benchmark-run]');action.disabled=true;root.setAttribute('aria-busy','true');
  try{
   const result=await runBenchmark({canvas:activeParts.canvas,signal:controller.signal,onPhase:phase=>{
    if(disposed)return;
    activeParts.status.textContent=text(BT[phase.id]||BT.measure);
    const percent=Math.round(phase.progress*100);activeParts.bar.firstElementChild.style.width=percent+'%';activeParts.bar.setAttribute('aria-valuenow',String(percent));
   }});
   if(disposed)return;
   current=result;stored=onSaved(result)===true;render();root.querySelector('[data-benchmark-continue]')?.focus({preventScroll:true});
  }catch(error){
   if(!disposed){activeParts.status.textContent=text(BT[error.message]||BT.unavailable);action.disabled=false;action.focus({preventScroll:true});}
  }finally{running=false;root.removeAttribute('aria-busy');}
 };
 render();
 return {dispose(){disposed=true;controller?.abort();root.removeAttribute('aria-busy');}};
}
