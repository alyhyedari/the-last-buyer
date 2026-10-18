import {supplyQuote} from './neon-world.js';
import {h,button} from './dom.js';
import {tr} from './i18n.js';
import {EQUIPMENT,SUPPLIES,buySupply,supplyAvailable,buyEquipment,equipWeapon,equipVehicle} from './frontier-loadout.js';
export function createLoadoutPanel({state,ft,panelShow,closePanel,persist,onBuy,onChange,announce}){
 let category='supplies';const trigger=button('▦ BUY',()=>show(),'frontier-btn quick-shop',{'aria-label':ft('quickShop')});
 function show(){const f=state.frontier,v=state.village;panelShow(ft('quickShop'),ft('shopBody'),root=>{
  root.append(h('p',{class:'frontier-ledger'},h('bdi',{dir:'ltr'},'$'+v.money),' · ',ft('fuel')+' ',h('bdi',{dir:'ltr'},Math.round(f.fuel)+'%')));
  const tabs=h('div',{class:'loadout-tabs','aria-label':ft('quickShop')});for(const id of ['supplies','weapons','vehicles','utilities'])tabs.append(button(ft(id),()=>{category=id;show();},'btn secondary',{'aria-pressed':String(id===category)}));root.append(tabs);
  const grid=h('div',{class:'loadout-grid'});root.append(grid);
  const finish=(ok,paid=false)=>{if(!ok){announce(ft('noMoney'));return;}if(paid)onBuy();onChange();persist();show();};
  if(category==='supplies')for(const base of SUPPLIES){const item={...base,cost:supplyQuote(state,base.cost)},active=supplyAvailable(state,item.id);const buy=button('BUY · $'+item.cost,()=>{buy.disabled=true;finish(buySupply(state,item.id),true);},'btn buy-small',{'data-supply':item.id,disabled:!active||v.money<item.cost});grid.append(h('article',{},h('h3',{},ft(item.id==='repairCar'?'fieldRepair':item.id)),buy));}
  if(category==='weapons'||category==='vehicles')for(const item of EQUIPMENT.filter(i=>i.kind===(category==='vehicles'?'vehicle':'weapon'))){const owned=(item.kind==='vehicle'?v.vehicles:v.weapons).includes(item.id),selected=(item.kind==='vehicle'?v.vehicle:v.weapon)===item.id;
   const choice=button(owned?ft(selected?'putAway':'equip'):'BUY · $'+item.cost,()=>{choice.disabled=true;let paid=false;if(!owned){if(!buyEquipment(state,item.id)){finish(false);return;}paid=true;}const id=selected?(item.kind==='vehicle'?'foot':'none'):item.id;finish(item.kind==='vehicle'?equipVehicle(state,id):equipWeapon(state,id),paid);},owned?'btn secondary':'btn buy-small',{'data-gear':item.id,'aria-pressed':String(selected),disabled:!owned&&v.money<item.cost});grid.append(h('article',{},h('h3',{},tr(item.name)),h('p',{},tr(item.body)),choice));
  }
  if(category==='utilities'){
   const row=(label,active,run,disabled=false)=>grid.append(h('article',{},h('h3',{},label),button(ft(active?'enabled':'disabled'),()=>{run();onChange();persist();show();},'btn secondary',{'aria-pressed':String(active),disabled})));
   row(ft('uvBuy'),f.life.forest.light==='uv',()=>{f.life.forest.light=f.life.forest.light==='uv'?'off':'uv';},!f.life.forest.uvOwned);
   row(ft('lantern'),f.life.forest.light==='lantern',()=>{f.life.forest.light=f.life.forest.light==='lantern'?'off':'lantern';},!v.weapons.includes('lantern'));
   row(ft('headlights'),f.life.expanse.headlights,()=>{f.life.expanse.headlights=!f.life.expanse.headlights;},!v.vehicles.includes('car'));
   if(f.life.pet)row(ft(f.life.pet),f.life.petFollowing,()=>{f.life.petFollowing=!f.life.petFollowing;});
   row(ft('invite'),f.life.companion,()=>{f.life.companion=!f.life.companion;},!f.romance||f.trust<4||f.life.combat.actors['noora-companion']?.hp===0);
  }
  root.append(button(ft('back'),closePanel,'btn primary'));
 });}
 return{trigger,show,refresh(){trigger.setAttribute('aria-label',ft('quickShop'));}};
}
