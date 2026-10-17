import {h,button} from './dom.js';
import {MYTH_BOSSES,uvTouches,collectGme} from './frontier-myth.js';
import {transact} from './frontier-state.js';
export function createMythGuide({state,root,ft,getWorld,getActors,panelShow,closePanel,persist,announce,walkTo,onBuy,ambient,isPaused}){
 const f=state.frontier,q=f.life.forest;let uvSelected=q.light==='uv';
 const lightBtn=button('',cycleLight,'frontier-btn myth-light'),bossBar=h('aside',{class:'myth-boss-bar',hidden:true,'aria-live':'off'});root.append(bossBar);
 function cycleLight(){if(isPaused())return;const modes=['off',...(state.village.weapons.includes('lantern')?['lantern']:[]),...(q.uvOwned?['uv']:[])];if(modes.length===1){show();return;}q.light=modes[(modes.indexOf(q.light)+1)%modes.length];uvSelected=q.light==='uv';persist();update();}
 function clickLight(){if(!uvSelected||!q.uvOwned)return false;q.light=q.light==='uv'?'off':'uv';persist();update();return true;}
 function show(){panelShow(ft('mythBook'),ft('mythIntro'),r=>{r.append(h('p',{},ft('battleArenaHelp')));
  r.append(h('p',{},ft('lightHelp')),h('p',{class:'frontier-ledger',dir:'ltr'},'GME '+q.gme.length+' / 6'));
  if(!q.uvOwned)r.append(button(ft('uvBuy'),()=>{if(!transact(state,65)){announce(ft('noMoney'));return;}q.uvOwned=true;q.light='uv';uvSelected=true;onBuy();persist();show();},'btn buy-small',{disabled:state.village.money<65}));
  for(const b of MYTH_BOSSES){const owned=q.gme.includes(b.id),dead=f.life.combat.actors['boss-'+b.id]?.hp===0,row=h('article',{class:'myth-boss-entry'},h('h3',{},(owned?'✓ ':'◇ ')+ft(b.id)),h('p',{},ft('gme_'+b.id)),h('p',{class:'modal-note'},ft(b.attack)));
   if(!owned)row.append(button(ft(dead?'mythClaim':'route'),()=>walkTo(dead?f.life.combat.actors['boss-'+b.id]:{...b,x:b.x,y:b.y+7}), 'btn secondary', {disabled:f.life.expanse.swimming}));r.append(row);
  }r.append(button(ft('back'),closePanel,'btn primary'));
 });}
 function nearbyGme(){return getActors().find(a=>a.kind==='gmeCoin'&&Math.hypot(a.x-f.x,a.y-f.y)<2.4);}
 function interact(){const a=nearbyGme();if(!a)return false;if(!collectGme(state,getWorld(),a)){announce(ft('forestDismount'));return true;}ambient.call('forestAward');announce(ft('mythReward')+' · '+ft('gme_'+a.boss));persist();update();return true;}
 function update(){
  if(q.light==='uv')uvSelected=true;else if(q.light==='lantern')uvSelected=false;
  if(q.light==='lantern'&&!state.village.weapons.includes('lantern'))q.light='off';lightBtn.textContent=ft(q.light==='uv'?'uvLight':q.light==='lantern'?'lanternLight':'lightOff');lightBtn.setAttribute('aria-label',ft('uvLight')+' / '+ft('lanternLight'));lightBtn.setAttribute('aria-pressed',String(q.light!=='off'));lightBtn.hidden=!!getWorld().interior||f.life.expanse.swimming;
  const actor=getActors().filter(a=>a.boss&&!a.dead&&Math.hypot(a.x-f.x,a.y-f.y)<24).sort((a,b)=>Math.hypot(a.x-f.x,a.y-f.y)-Math.hypot(b.x-f.x,b.y-f.y))[0],boss=actor&&MYTH_BOSSES.find(b=>'boss-'+b.id===actor.id);bossBar.hidden=!boss;
  if(boss){const p=getWorld().myth?.get(actor.id);bossBar.replaceChildren(h('strong',{},ft(boss.id)+' · '+ft('battlePhase')+' '+(actor.phase||1)+'/3'),h('progress',{max:boss.hp,value:actor.hp,'aria-label':ft('health')}),h('span',{},p?.windup?ft(p.attack||boss.attack):ft(uvTouches(f,getWorld(),actor)?'mythWeak':'mythArmored')));bossBar.dataset.phase=String(actor.phase||1);bossBar.dataset.boss=boss.id;bossBar.dataset.hp=String(Math.round(actor.hp));}
  root.dataset.light=q.light;root.dataset.gme=String(q.gme.length);
 }
 return{lightBtn,show,interact,update,clickLight,nearbyGme};
}
