import {h,button} from './dom.js';
import {SUPPLIES,buySupply} from './frontier-loadout.js';
import {supplyQuote} from './neon-world.js';
import {attackDirection,urgentSupplies,woundLevel} from './frontier-feedback.js';
export function createComfortHUD({root,header,combat,tools,state,ft,settings,persist,onBuy,announce,extras,mapBtn,gearBtn,hint,caption,reloadStatus}){
 root.classList.add('comfort-hud');const nav=header.querySelector('nav');nav.classList.add('hud-drawer');nav.hidden=true;
 const menu=button('☰',()=>{nav.hidden=!nav.hidden;root.dataset.toolsOpen=String(!nav.hidden);menu.setAttribute('aria-expanded',String(!nav.hidden));},'frontier-btn hud-menu',{'aria-label':document.documentElement.lang==='fa'?'ابزارها و امکانات':'Tools and activities','aria-expanded':'false'});
 header.append(h('div',{class:'hud-main-actions'},mapBtn,menu,gearBtn));for(const item of extras)nav.append(item);
 nav.addEventListener('click',event=>{if(event.target.closest('button'))closeMenu();});
 const vitals=tools.querySelector('.frontier-vitals');header.append(vitals);nav.append(header.querySelector('.frontier-clock'));header.append(root.querySelector('.frontier-waypoint'));
 const rail=h('div',{class:'hud-message-rail'});for(const item of [caption,root.querySelector('.boundary-warning'),root.querySelector('.narrator-card'),hint,reloadStatus])if(item)rail.append(item);header.append(rail);
 const needs=h('div',{class:'hud-needs','aria-label':document.documentElement.lang==='fa'?'خرید سریع ضروریات':'Quick supplies'});header.append(needs);
 const chips=new Map();for(const item of ['care','refuel','repairCar','food'].map(id=>SUPPLIES.find(s=>s.id===id))){const chip=button('',()=>{if(buySupply(state,item.id)){onBuy();persist();update();announce(ft('complete'));}else announce(ft('noMoney'));},'frontier-btn',{'data-urgent':item.id});chips.set(item.id,chip);needs.append(chip);}
 const directions=h('div',{class:'hud-damage-direction','aria-live':'polite'}),arrows=Array.from({length:4},()=>h('span',{class:'hud-hit',hidden:true,'aria-hidden':'true'},'▲'));directions.append(...arrows);root.append(directions);let hits=[],serial=0,needsKey='';
 function closeMenu(){nav.hidden=true;root.dataset.toolsOpen='false';menu.setAttribute('aria-expanded','false');}
 function hit(result,time){if(!result.source)return;hits.push({source:{...result.source},until:time+2.1,hull:result.kind!=='attacked',id:serial++});hits=hits.slice(-4);}
 function update(time=0,paused=false){
  const f=state.frontier;root.dataset.wounds=woundLevel(f.life.health).toFixed(2);const urgent=urgentSupplies(state);
  const nextKey=[f.life.health,f.fuel,f.life.expanse.carHealth,f.energy,state.village.money,state.village.vehicle].map(v=>typeof v==='number'?Math.ceil(v):v).join('|');if(nextKey!==needsKey){needsKey=nextKey;for(const [id,chip]of chips){chip.hidden=!urgent.includes(id);const cost=supplyQuote(state,SUPPLIES.find(s=>s.id===id).cost),value=id==='refuel'?f.fuel:id==='care'?f.life.health:id==='repairCar'?f.life.expanse.carHealth:f.energy;chip.replaceChildren(h('span',{},(document.documentElement.lang==='fa'?{care:'درمان',refuel:'بنزین کم',repairCar:'تعمیر',food:'انرژی'}[id]:{care:'Heal',refuel:'Low fuel',repairCar:'Repair',food:'Energy'}[id])+' · '+Math.ceil(value)+'%'),h('bdi',{dir:'ltr'},'$'+cost));chip.disabled=state.village.money<cost;}}
  needs.hidden=!urgent.length||paused;
  // Modals pause the encounter and hide all transient screen feedback.
  if(paused)closeMenu();hits=hits.filter(e=>time<e.until);
  for(let i=0;i<arrows.length;i++){const arrow=arrows[i],entry=hits[i],d=entry&&attackDirection(f,entry.source);arrow.hidden=paused||!d;if(!d)continue;arrow.style.left=(50+Math.sin(d.angle)*43)+'%';arrow.style.top=(50-Math.cos(d.angle)*40)+'%';arrow.style.rotate=d.angle+'rad';arrow.dataset.hull=String(entry.hull);arrow.style.opacity=String(Math.min(1,(entry.until-time)*2));}
  directions.dataset.active=String(paused?0:hits.length);rail.hidden=paused;
 }
 return{update,hit,closeMenu,get open(){return !nav.hidden;},dispose(){rail.remove();needs.remove();directions.remove();}};
}
