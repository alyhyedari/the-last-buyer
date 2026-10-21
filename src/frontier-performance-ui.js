import {h,button} from './dom.js';
import {tr} from './i18n.js';
export function createPerformancePanel({controller,settings,ft,panelShow,closePanel,isRecovering=()=>false}){
 const trigger=button('⚡ —',show,'frontier-btn frontier-performance',{'aria-label':ft('livePerformance')});
 function show(){const r=controller.report;panelShow(ft('livePerformance'),ft('liveHelp'),root=>{
  const grid=h('div',{class:'benchmark-result-grid'});
  for(const [label,value]of [['FPS',r.fps||'—'],[ft('work'),r.workP95.toFixed(1)+' ms'],[ft('peakFrame'),r.peak.toFixed(1)+' ms'],['P95',r.frameP95.toFixed(1)+' ms']])grid.append(h('div',{class:'benchmark-metric'},h('small',{},label),h('bdi',{dir:'ltr'},String(value))));
  root.append(grid,h('p',{},tr('quality')+' · '+(isRecovering()||controller.quality==='low'&&settings.quality==='high'?ft('stabilizing'):settings.quality==='auto'?tr('auto')+' / '+(controller.detail===2?ft('stabilizing'):tr(controller.quality)):tr(settings.quality))),button(ft('back'),closePanel,'btn primary'));
 });}
 return{trigger,update(){trigger.textContent='⚡ '+(controller.report.fps||'—');trigger.setAttribute('aria-label',ft('livePerformance'));trigger.dataset.detail=String(controller.detail);}};
}
