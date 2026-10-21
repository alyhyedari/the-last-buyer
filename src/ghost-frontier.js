import {h,button} from './dom.js';
import {tr} from './i18n.js';
import {GT} from './ghost-text.js';

export const ghostSpace=f=>f.life.combat.interior?'home:'+f.life.combat.interior.id+':'+(f.life.combat.interior.floor??f.life.combat.interior.level??0):'outdoor';
export function createGhostOverlay({client,state,settings,root,header,panelShow,closePanel,onLeave}){
 const f=state.frontier,text=key=>tr(GT[key]);let lastStatus='',nextStatus=0,closed=false;
 const chip=button('',show,'frontier-btn ghost-status',{'aria-label':text('title')});header.querySelector('nav').append(chip);
 const visibility=()=>client.setVisible(!document.hidden);document.addEventListener('visibilitychange',visibility);visibility();
 function show(){const s=client.status;panelShow(text('title'),text('intro'),r=>{
  const metrics=h('div',{class:'ghost-metrics'});metrics.append(h('p',{},text('ping'),' ',h('bdi',{dir:'ltr'},s.pingMs==null?'—':Math.round(s.pingMs)+' ms')),h('p',{},text('players'),' ',h('bdi',{dir:'ltr'},s.peers)));
  r.append(h('p',{},(document.documentElement.lang==='fa'?'اتاق ':'Room ')+(Number.isInteger(s.shard)?s.shard+1:'—')+' / 32 · '+(document.documentElement.lang==='fa'?'ظرفیت هر اتاق: ۳۲':'32 seats per room')),h('p',{class:'ghost-status'},text(s.state)),metrics,h('p',{},text('ownProgress')),h('p',{class:'ghost-help'},text('latencyHelp')),button(text('leave'),onLeave,'btn secondary'),button(tr('close'),closePanel,'btn primary'));
 });}
 function sync(paused,now=performance.now()){
  if(closed)return;const minutes=client.roomClock;if(Number.isFinite(minutes))f.worldMinutes=minutes;
  client.update({x:f.x,y:f.y,angle:f.angle,space:ghostSpace(f),vehicle:f.life.expanse.swimming?'swim':f.mounted?state.village.vehicle:'foot',model:f.life.expanse.carModel,tone:Math.max(0,['classic','ember','ocean','mono'].indexOf(settings.avatarTone)),paused:paused||document.hidden});
  if(now<nextStatus)return;nextStatus=now+500;const s=client.status,signature=[s.state,s.pingMs==null?'—':Math.round(s.pingMs),s.peers].join('|');if(signature===lastStatus)return;lastStatus=signature;
  chip.replaceChildren('◌ ',text(s.state),' · ',h('bdi',{dir:'ltr'},s.pingMs==null?'—':Math.round(s.pingMs)+' ms'),' · ',h('bdi',{dir:'ltr'},s.peers));chip.dataset.connection=s.state;chip.dataset.status=s.state;
  root.dataset.ghostRoom=String(s.shard??'');root.dataset.ghostConnection=s.state;root.dataset.ghostPeers=String(s.peers);root.dataset.ghostPing=s.pingMs==null?'':String(Math.round(s.pingMs));
 }
 return{sync,actors(){return client.sample({space:ghostSpace(f),x:f.x,y:f.y});},dispose(){closed=true;document.removeEventListener('visibilitychange',visibility);client.dispose();delete f.worldMinutes;chip.remove();}};
}
