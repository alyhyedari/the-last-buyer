import {h,button} from './dom.js';
import {tr} from './i18n.js';
import {GT} from './ghost-text.js';

export const ghostSpace=f=>f.life.combat.interior?'home:'+f.life.combat.interior.id+':'+(f.life.combat.interior.floor??f.life.combat.interior.level??0):'outdoor';
export function createGhostOverlay({client,state,settings,root,header,panelShow,closePanel,onLeave}){
 const f=state.frontier,text=key=>tr(GT[key]);let lastStatus='',nextStatus=0,closed=false,metricBox=null;
 const chip=button('',show,'frontier-btn ghost-status',{'aria-label':text('title')});header.querySelector('nav').append(chip);
 const visibility=()=>client.setVisible(!document.hidden);document.addEventListener('visibilitychange',visibility);visibility();
 function updateMetrics(s){if(!metricBox)return;
  const metrics=metricBox;metrics.replaceChildren(h('p',{},text('ping'),' ',h('bdi',{dir:'ltr'},s.pingMs==null?'—':Math.round(s.pingMs)+' ms')),h('p',{},text('players'),' ',h('bdi',{dir:'ltr'},s.peers)));
  const fa=document.documentElement.lang==='fa';metrics.append(h('p',{},fa?'پینگ از سمت سرور: ':'Server measured ping: ',h('bdi',{dir:'ltr'},s.serverPingMs==null?'—':Math.round(s.serverPingMs)+' ms')),h('p',{},fa?'نرخ هماهنگی: ':'Update rate: ',h('bdi',{dir:'ltr'},(1000/(s.intervalMs||200)).toFixed(1)+' Hz')),h('p',{},fa?(s.networkMode==='normal'?'شبکه در حالت عادی':s.networkMode==='balanced'?'شبکه در حال کاهش بار':'شبکه در حال بازیابی'):'Network: '+s.networkMode));
 }
 function show(){const s=client.status;panelShow(text('title'),text('intro'),r=>{
  const metrics=metricBox=h('div',{class:'ghost-metrics'});updateMetrics(s);
  const roster=client.sample({space:ghostSpace(f),x:f.x,y:f.y});r.append(h('details',{},h('summary',{},document.documentElement.lang==='fa'?'نام پژواک‌ها':'Echo names'),...roster.map(p=>h('p',{},p.name))));
  r.append(h('p',{},(document.documentElement.lang==='fa'?'اتاق ':'Room ')+(Number.isInteger(s.shard)?s.shard+1:'—')+' / 1 · '+(document.documentElement.lang==='fa'?'ظرفیت کل: ۵ نفر':'5 players total')),h('p',{class:'ghost-status'},text(s.reason==='room_full'?'roomFull':s.state)),metrics,h('p',{},text('ownProgress')),h('p',{class:'ghost-help'},text('latencyHelp')),button(text('leave'),onLeave,'btn secondary'),button(tr('close'),closePanel,'btn primary'));
 });}
 function sync(paused,now=performance.now()){
  if(closed)return;const minutes=client.roomClock;if(Number.isFinite(minutes))f.worldMinutes=minutes;
  client.update({x:f.x,y:f.y,angle:f.angle,space:ghostSpace(f),vehicle:f.life.expanse.swimming?'swim':f.mounted?state.village.vehicle:'foot',model:f.life.expanse.carModel,name:state.player?.name||'',tone:Math.max(0,['classic','ember','ocean','mono'].indexOf(settings.avatarTone)),paused:paused||document.hidden});
  if(now<nextStatus)return;nextStatus=now+500;const s=client.status,signature=[s.state,s.pingMs==null?'—':Math.round(s.pingMs),s.peers,s.serverPingMs,s.intervalMs,s.networkMode].join('|');if(signature===lastStatus)return;lastStatus=signature;if(metricBox?.isConnected)updateMetrics(s);else metricBox=null;
  chip.replaceChildren('◌ ',text(s.reason==='room_full'?'roomFull':s.state),' · ',h('bdi',{dir:'ltr'},s.pingMs==null?'—':Math.round(s.pingMs)+' ms'),' · ',h('bdi',{dir:'ltr'},s.peers));chip.dataset.connection=s.state;chip.dataset.status=s.state;
  root.dataset.serverPing=s.serverPingMs==null?'':String(s.serverPingMs);root.dataset.networkMode=s.networkMode;root.dataset.networkInterval=String(s.intervalMs);root.dataset.ghostRoom=String(s.shard??'');root.dataset.ghostConnection=s.state;root.dataset.ghostPeers=String(s.peers);root.dataset.ghostPing=s.pingMs==null?'':String(Math.round(s.pingMs));
 }
 return{sync,actors(){return client.sample({space:ghostSpace(f),x:f.x,y:f.y});},dispose(){closed=true;document.removeEventListener('visibilitychange',visibility);client.dispose();delete f.worldMinutes;chip.remove();}};
}
