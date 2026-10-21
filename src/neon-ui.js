import {ACTIVITIES,companionActivity} from './companion-activities.js';
import {CYBER_COMPANIONS} from './cyber-state.js';
import {challengeFor} from './neon-challenges.js';
import {h,button} from './dom.js';
import {tr} from './i18n.js';
import {NEON_MODES} from './neon-state.js';
import {NEON_CAST,NEON_QUESTS} from './neon-data.js';
import {CAR_MODELS} from './frontier-cars.js';
import {districtMode,priceFactor,beginNeonQuest,questPoint,finishNeonStep,buySpecialCar,supplyQuote,inviteNeon,dateNeon,canMeet} from './neon-world.js';
import {activateGodPower} from './pantheon.js';
export function createNeonGuide({state,root,ft,waypoint,getWorld,getActors,panelShow,closePanel,persist,announce,walkTo,onBuy,ambient,showMyths,settings}){
 const f=state.frontier,n=f.life.neon,trigger=button('◇',show,'frontier-btn',{'aria-label':ft('neonTitle')}),tracker=button('',track,'neon-tracker');tracker.hidden=true;root.append(tracker);let fadeTimer;
 const act=(label,run,primary=false,disabled=false)=>button(label,run,primary?'btn primary':'btn secondary',{disabled});
 function route(p){closePanel();walkTo(p);}
 function track(){const p=questPoint(f);if(p)route(p);}
 function show(){panelShow(ft('neonTitle'),ft('neonIntro'),r=>{
  const status=h('div',{class:'neon-district-status'},h('strong',{},ft(districtMode(f))),h('bdi',{dir:'ltr'},'BUY ×'+priceFactor(f).toFixed(2)));r.append(status,h('p',{},ft('neonEconomy')));
  const modes=h('div',{class:'frontier-panel-actions'});for(const mode of NEON_MODES)modes.append(button(ft(mode),()=>{n.mode=mode;persist();show();},'btn secondary',{'aria-pressed':String(n.mode===mode)}));r.append(modes);
  r.append(act(ft('neonMission'),missions,true),act(ft('neonCars'),garage),act(ft('neonPantheon'),showMyths),act(ft('godPower'),powers));
  r.append(h('h3',{},ft('neonTalk')),h('p',{class:'modal-note'},ft('neonFiction')));for(const c of NEON_CAST)r.append(act(tr(c.name),()=>talk(c)));
  r.append(act(ft('back'),closePanel));
 });}
 function missions(){panelShow(ft('neonMission'),ft('neonIntro'),r=>{
  if(n.quest){const q=NEON_QUESTS.find(q=>q.id===n.quest.id),p=questPoint(f);r.append(h('article',{class:'neon-story active'},h('h3',{},tr(q.title)),h('p',{},tr(p.text)),h('bdi',{dir:'ltr'},(p.step+1)+' / '+q.steps.length),act(ft('route'),track,true),act(ft('neonLeaveStory'),()=>{n.quest=null;persist();missions();})));}
  for(const q of NEON_QUESTS){const done=n.completed.includes(q.id);r.append(h('article',{class:'neon-story'},h('h3',{},(done?'✓ ':'')+tr(q.title)),h('p',{},tr(q.intro)),h('bdi',{dir:'ltr'},'+$'+q.reward),act(ft(done?'neonJournal':'neonAccept'),()=>{if(done)panelShow(tr(q.title),q.steps.map(s=>tr(s.text)).join('\n\n'),p=>p.append(act(ft('back'),missions)));else if(beginNeonQuest(f,q.id)){persist();track();}},false,!done&&!!n.quest)));}
  r.append(act(ft('back'),show));
 });}
 function talk(c){if(!c)return;panelShow(tr(c.name),tr(c.body),r=>{r.append(act(ft('route'),()=>route(c)),act(ft('neonMission'),missions,true));if(n.companion===c.id){const fa=document.documentElement.lang==='fa';r.append(h('p',{},(fa?'خاطره‌های مشترک: ':'Shared memories: ')+f.life.cyber.memories));for(const activity of ACTIVITIES)r.append(act(fa?activity.fa:activity.en,()=>{const result=companionActivity(state,c.id,activity.id);if(result){persist();panelShow(tr(c.name),fa?result.replyFa:result.replyEn,p=>p.append(act(ft('back'),()=>talk(c))));}else announce(ft('neonUnavailable'));}));r.append(act(fa?'پایان همراهی':'Say goodbye',()=>{n.companion=null;persist();talk(c);}));}if(['mira','arin',...CYBER_COMPANIONS].includes(c.id)){r.append(h('p',{},ft('neonConsent')),
  act(ft('neonInvite'),()=>{if(inviteNeon(state,c.id)){persist();talk(c);}else announce(ft('neonUnavailable'));},false,!canMeet(f)||n.completed.length<1||Math.hypot(f.x-c.x,f.y-c.y)>3),
  act(ft('neonDate'),()=>{if(!dateNeon(state,c.id))return;persist();panelShow(ft('neonDate'),ft('neonGoodnight'),r=>r.append(act(ft('back'),closePanel,true)));const fade=h('div',{class:'neon-private-scene',role:'status'},h('p',{},ft('neonGoodnight')));root.append(fade);ambient.call('guide');fadeTimer=setTimeout(()=>fade.remove(),settings.reducedMotion?1200:2800);},false,n.companion!==c.id||n.bond<2||!canMeet(f)||Math.hypot(f.x-c.x,f.y-c.y)>3));}
  r.append(act(ft('back'),show));
 });}
 function garage(){panelShow(ft('neonCars'),ft('neonCarHelp'),r=>{const grid=h('div',{class:'loadout-grid'});for(const [i,c]of CAR_MODELS.entries()){const cost=supplyQuote(state,c.cost);grid.append(h('article',{class:'neon-car-card',style:'--car-color:'+c.color},h('div',{class:'neon-car-pixel','aria-hidden':'true'},h('i',{})),h('h3',{},c.id.toUpperCase()),h('p',{},ft('neonSpeed')),h('bdi',{dir:'ltr'},c.speed+' / '+c.grip+' / '+c.climb),act('BUY · $'+cost,()=>{if(buySpecialCar(state,i)){onBuy();ambient.call('bell');persist();garage();}},true,state.village.money<cost||f.mounted||!!f.life.combat.arena||!!f.life.combat.interior||f.life.expanse.swimming)));}r.append(grid,act(ft('back'),show));});}
 function powers(){panelShow(ft('godPower'),ft('neonPowerHelp'),r=>{if(!f.life.forest.gme.length)r.append(act(ft('neonPantheon'),showMyths,true));for(const id of f.life.forest.gme)r.append(h('article',{class:'neon-story'},h('h3',{},ft(id)),h('p',{},ft('gme_'+id)),act(ft(f.minutes>=f.life.pantheon.powerReady?'godReady':'godCooldown'),()=>{if(activateGodPower(state,getWorld(),id)){persist();closePanel();ambient.call('forestPulse');}},true,f.minutes<f.life.pantheon.powerReady||!!getWorld().interior)));r.append(act(ft('back'),show));});}
 function interact(){const p=questPoint(f);if(p&&!getWorld().interior&&Math.hypot(f.x-p.x,f.y-p.y)<2.6){if(f.mounted){announce(ft('forestDismount'));return true;}const q=NEON_QUESTS.find(q=>q.id===p.id),challenge=challengeFor(p.id,p.step);panelShow(tr(q.title),tr(p.text),r=>{const complete=answer=>{const result=finishNeonStep(state,getWorld(),answer);if(!result)return;if(result==='waitNight'){announce(ft('night'));return;}if(result==='challenge'){announce(ft('neonTryAgain'));return;}persist();ambient.call('guide');announce(ft(result==='complete'?'neonDone':'neonStage'));closePanel();};
   if(challenge){r.append(h('h3',{},tr(challenge.prompt)));if(challenge.pattern){const values=[0,0,0],nodes=h('div',{class:'frontier-panel-actions',dir:'ltr'});for(const [i,name]of challenge.options.entries()){const node=act(tr(name)+' / 0',()=>{values[i]=(values[i]+1)%4;node.textContent=tr(name)+' / '+values[i];ambient.call('bell');});nodes.append(node);}r.append(nodes,act(ft('neonConfirm'),()=>complete(values.join('')),true));}else for(const [i,label]of challenge.options.entries())r.append(act(tr(label),()=>complete(i),true));}
   else r.append(act(ft('neonStage'),()=>complete(null),true));r.append(act(ft('back'),closePanel));});return true;}
  const a=getActors().find(a=>['neonEcho','neonArchive'].includes(a.kind)&&a.id!=='neon-companion'&&Math.hypot(f.x-a.x,f.y-a.y)<1.3);if(a){talk(NEON_CAST.find(c=>c.id===a.id));return true;}return false;
 }
 function update(interactBtn){const p=questPoint(f);tracker.hidden=!p||!!getWorld().interior||!!f.life.combat.arena||f.life.expanse.swimming;waypoint.hidden=!tracker.hidden;if(p&&!tracker.hidden){const q=NEON_QUESTS.find(q=>q.id===p.id);tracker.replaceChildren('◇ '+tr(q.title)+' · ',h('bdi',{dir:'ltr'},(p.step+1)+'/3'), ' · ',h('bdi',{dir:'ltr'},Math.round(Math.hypot(f.x-p.x,f.y-p.y)*2.5)+' m'));if(Math.hypot(f.x-p.x,f.y-p.y)<2.6){interactBtn.hidden=false;interactBtn.textContent='F · '+ft(f.mounted?'forestDismount':'neonStage');}}
  root.dataset.districtMode=districtMode(f);
 }
 return{trigger,show,missions,garage,powers,interact,update,dispose(){clearTimeout(fadeTimer);root.querySelector('.neon-private-scene')?.remove();}};
}
