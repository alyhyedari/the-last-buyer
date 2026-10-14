import {echoUnlocked} from './frontier-perks.js';
import {h,button} from './dom.js';
import {FOREST_COINS,FOREST_MILESTONES,forestCoinOpen,remainingCoins,nearestForestCoin,collectForestCoin,castForestPulse,forestCooldown,forestPulseActive} from './frontier-forest.js';
import {inDeepForest} from './frontier-forest-data.js';
import {placeById} from './frontier-world.js';
const num=value=>h('bdi',{dir:'ltr'},String(value));
export function createForestGuide({state,root,getWorld,ft,panelShow,closePanel,persist,announce,follow,walkTo,ambient,isPaused,refresh,showMyths}){
 const f=state.frontier,q=f.life.forest;let chimeAt=f.minutes,awardTimer=0;
 const bookBtn=button(ft('forestBook'),show,'frontier-btn forest-book',{'aria-label':ft('forestBook')}),powerBtn=button('',cast,'frontier-btn forest-power',{'aria-label':ft('forestPower')}),tracker=button('',show,'forest-tracker'),award=h('aside',{class:'forest-award',hidden:true,role:'status','aria-live':'polite'});
 root.append(tracker,award);
 const actions=(...children)=>h('div',{class:'frontier-panel-actions'},...children);
 const act=(key,run,primary=false,attrs={})=>button(ft(key),run,'btn '+(primary?'primary':'secondary'),attrs);
 function bearing(from,to){const dx=to.x-from.x,dy=to.y-from.y;return ft(Math.abs(dx)>Math.abs(dy)?dx>0?'east':'west':dy>0?'south':'north');}
 function track(coin){if(q.tracked!==coin.id){q.tracked=coin.id;q.hint=0;}persist();show();}
 function show(){
  const next=FOREST_MILESTONES.find(m=>m.at>q.coins.length),selected=q.tracked||remainingCoins(f)[0]?.id;
  panelShow(ft('forestBook'),ft(q.coins.length===30?'forestDone':'forestIntro'),r=>{
   r.append(h('div',{class:'forest-journal-head'},h('strong',{dir:'ltr'},'BUY ',num(q.coins.length+' / 30')),h('progress',{max:30,value:q.coins.length,'aria-label':ft('forestCoin')})),h('p',{},ft('forestStart')));
   r.append(act('mythBook',showMyths));
   const badges=h('div',{class:'forest-badges'});for(const m of FOREST_MILESTONES)badges.append(h('article',{'data-unlocked':q.coins.length>=m.at},h('b',{},num(m.at+' / 30')),h('span',{},ft(m.key)),num('+$'+m.reward)));r.append(badges);
   if(next)r.append(h('p',{class:'forest-next'},ft('forestNext')+' · '+ft(next.key)+' · ',num(q.coins.length+' / '+next.at)));
   r.append(h('p',{class:'modal-note'},ft('forestPowerHelp')));
   if(echoUnlocked(f))r.append(act('forestPower',()=>{closePanel();cast();},true,{disabled:!canCast()}));
   const list=h('div',{class:'forest-clue-list'});
   for(const coin of FOREST_COINS){
    const found=q.coins.includes(coin.id),tracked=q.tracked===coin.id,level=tracked?q.hint:0,trail=placeById(coin.trail),row=h('details',{open:!found&&coin.id===selected,'data-forest-coin':coin.id});
    row.append(h('summary',{},num((found?'✓ ':'◇ ')+String(coin.number).padStart(2,'0')),' · '+ft(found?'forestFound':coin.landmark)),h('p',{},ft(coin.trail)+' · '+ft(coin.landmark)));
    row.append(h('p',{class:'forest-perk'},ft('activePerk')+' / '+ft('perk'+coin.number)));if(found){list.append(row);continue;}
    if(coin.sealed&&!forestCoinOpen(f,coin))row.append(h('p',{class:'forest-seal-note'},ft(coin.uv?'uvSealHelp':'forestSealedHelp')));
    if(level>=1)row.append(h('p',{class:'forest-bearing'},ft(coin.trail)+' → '+bearing(trail,coin)+' · ',num(Math.round(Math.hypot(coin.x-trail.x,coin.y-trail.y)*2.5)+' m')));
    if(level>=2)row.append(h('p',{},num('X '+coin.x+' / Y '+coin.y)),act('forestRoute',()=>walkTo(coin),true,{disabled:f.life.expanse.swimming}));
    row.append(actions(act(tracked?'forestUntrack':'forestTrack',()=>{if(tracked){q.tracked=null;q.hint=0;persist();show();}else track(coin);}),act(level>=1?'forestExact':'forestHint',()=>{if(!tracked){q.tracked=coin.id;q.hint=0;}q.hint=Math.min(2,q.hint+1);persist();show();},false,{disabled:level>=2}),act('forestTrail',()=>{if(!tracked)q.hint=0;q.tracked=coin.id;persist();follow(coin.trail);},false,{disabled:f.life.expanse.swimming})));
    list.append(row);
   }
   r.append(list,actions(act('back',closePanel,true)));
  });
 }
 function canCast(){return !getWorld().interior&&!f.mounted&&!f.life.expanse.swimming&&echoUnlocked(f)&&!forestCooldown(f);}
 function cast(){
  if(isPaused())return;
  const result=castForestPulse(state,getWorld());if(!result){announce(ft(f.mounted?'forestDismount':!echoUnlocked(f)?'forestSealedHelp':forestCooldown(f)?'forestCooldown':'forestStart'));return;}
  ambient.call('forestPulse');announce(ft(result.opened.length?'forestOpened':'forestPower'));persist();refresh();
 }
 function interact(){
  const coin=nearestForestCoin(getWorld(),f);if(!coin)return false;
  if(f.mounted){announce(ft('forestDismount'));return true;}
  if(!forestCoinOpen(f,coin)){if(q.tracked!==coin.id)q.hint=0;q.tracked=coin.id;persist();panelShow(ft('forestLocked'),ft(coin.uv?'uvSealHelp':'forestSealedHelp'),r=>r.append(actions(act('forestPower',()=>{closePanel();cast();},true,{disabled:!canCast()}),act('forestBook',show),act('back',closePanel))));return true;}
  const result=collectForestCoin(state,getWorld(),coin.id);if(!result)return false;
  ambient.call(result.milestone?'forestAward':'forestCoin');announce(ft('forestFound')+' · \u2066BUY '+result.count+'/30\u2069 · \u2066+$'+result.reward+'\u2069');
  if(result.milestone){award.replaceChildren(h('small',{},ft('forestAchievement')),h('strong',{},ft(result.milestone.key)),h('span',{},num(result.count+' / 30'),' · ',num('+$'+result.reward)));award.hidden=false;clearTimeout(awardTimer);awardTimer=setTimeout(()=>{award.hidden=true;},6500);}
  persist();update();return true;
 }
 function update(){
  const world=getWorld(),near=nearestForestCoin(world,f,q.coins.includes('buy-01')?14:9),coin=FOREST_COINS.find(c=>c.id===q.tracked),inForest=!world.interior&&inDeepForest(f.x,f.y)&&!f.life.expanse.swimming,seconds=forestCooldown(f);
  bookBtn.textContent=ft('forestBook');bookBtn.setAttribute('aria-label',ft('forestBook'));powerBtn.hidden=!echoUnlocked(f)||!!world.interior||f.mounted||f.life.expanse.swimming;powerBtn.disabled=!canCast();powerBtn.setAttribute('aria-label',ft('forestPower'));powerBtn.replaceChildren(num('G'),' · '+ft('forestPower')+' · ',seconds?num(seconds+'s'):ft('forestReady'));powerBtn.dataset.ready=String(canCast());
  tracker.hidden=!inForest&&!coin||!!world.interior||f.life.expanse.swimming;
  const target=coin&&q.hint>=2?coin:null;
  tracker.replaceChildren(h('strong',{dir:'ltr'},'BUY ',num(q.coins.length+'/30')),h('span',{},coin&&q.hint>=2?bearing(f,coin)+' · ':'' ,ft(q.coins.length===30?'forestDone':near?'forestNear':'forestFar')),...(target?[num(Math.round(Math.hypot(target.x-f.x,target.y-f.y)*2.5)+' m')]:[]));
  tracker.setAttribute('aria-label',ft('forestBook')+' · '+q.coins.length+'/30');
  if(!isPaused()&&inForest&&near&&f.minutes>=chimeAt){chimeAt=f.minutes+7.2;ambient.call('forestChime',Math.sin(Math.atan2(near.y-f.y,near.x-f.x)-f.angle),.3+Math.max(0,1-Math.hypot(near.x-f.x,near.y-f.y)/9)*.5);}
  root.dataset.forestCoins=String(q.coins.length);root.dataset.forestPower=forestPulseActive(f)?'active':echoUnlocked(f)?seconds?'cooldown':'ready':'locked';
 }
 return{bookBtn,powerBtn,show,interact,cast,update,dispose(){clearTimeout(awardTimer);}};
}
