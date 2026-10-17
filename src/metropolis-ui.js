import {h,button} from './dom.js';
import {tr} from './i18n.js';
import {CITY_DESTINATIONS,CITY_DISCOVERIES,CITY_STATIONS,CITY_PRICE,cityDistrict} from './metropolis-data.js';
import {CITY_STORIES} from './metropolis-stories.js';
import {CITY_TALES} from './metropolis-text.js';
import {cityPoint,discoverCity,buyApartment,restApartment,cityContract,rideMetro,rideLift} from './metropolis-actions.js';
import {drawCityVista,drawCityMap} from './metropolis-art.js';

export function createCityGuide({state,settings,root,outdoor,getWorld,ft,panelShow,closePanel,persist,announce,follow,walkTo,enterHome,switchWorld,drawMap,onBuy,onPlay,ambient}){
 const f=state.frontier,c=f.life.city;let transitionTimer;
 const act=(key,fn,primary=false,attrs={})=>button(ft(key),fn,primary?'btn primary':'btn secondary',attrs);
 const trigger=button('▥ '+ft('cityTitle'),show,'btn secondary city-open');
 function transition(label){root.querySelector('.city-transit')?.remove();clearTimeout(transitionTimer);const el=h('div',{class:'city-transit',role:'status'},h('small',{},'THE LAST BUYER / CITY LINE'),h('strong',{},label));root.append(el);transitionTimer=setTimeout(()=>el.remove(),settings.reducedMotion?120:700);}
 function finish(){persist();ambient.call('bell');}
 function rail(r,from){
  if(!from.station)return;
  r.append(h('h3',{},ft('cityRail')),h('p',{class:'modal-note'},ft('cityRailHelp')));
  const grid=h('div',{class:'city-route-grid'});
  for(const p of CITY_STATIONS.filter(p=>p.id!==from.id))grid.append(button(ft(p.id)+' · $'+CITY_PRICE.ticket,()=>{if(!rideMetro(state,outdoor,p.id)){announce(ft('noMoney'));return;}closePanel();switchWorld(outdoor);onBuy();transition(ft(p.id));finish();},'btn secondary',{'data-city-station':p.id,disabled:state.village.money<CITY_PRICE.ticket}));
  r.append(grid);
 }
 function contract(r,p){
  if(c.contract){r.append(h('p',{},ft('cityContract')+' → '+ft(c.contract.to)));if(c.contract.to===p.id)r.append(act('cityDeliver',()=>{const reward=cityContract(state,p.id);finish();open(p);announce(ft('complete')+' +$'+reward);},true));}
  else if(p.id==='aurora'){r.append(h('p',{class:'body-copy'},ft('cityJobBody')),act('cityAccept',()=>{cityContract(state,p.id);finish();open(p);},true));}
 }
 function open(p){
  if(!p.metro)return false;
  panelShow(ft(p.id),ft(p.id==='tether'?'cityTowerBody':p.id==='apartment'?'cityHomeBody':p.id==='aurora'?'cityJobBody':'cityVisitHelp'),r=>{
   const b=outdoor.buildings.find(b=>b.id===p.id);
   if(p.id==='apartment'&&!c.apartment)r.append(button(ft('cityBuyHome')+' · $'+CITY_PRICE.apartment,()=>{if(!buyApartment(state))return;onBuy();finish();open(p);},'btn buy-small',{disabled:state.village.money<CITY_PRICE.apartment}));
   if(b&&(p.id!=='apartment'||c.apartment))r.append(act('enterHome',()=>enterHome(b),true));
   if(p.id==='cityarcade')r.append(act('cityPlay',onPlay,true));
   contract(r,p);rail(r,p);
   r.append(h('div',{class:'frontier-panel-actions'},act('cityTitle',show),act('back',closePanel)));
  });return true;
 }
 function show(){panelShow(ft('cityTitle'),ft('cityIntro'),r=>{
  r.append(h('p',{class:'city-progress'},ft('cityFound')+' · '+c.discoveries.length+' / 6',h('progress',{max:6,value:c.discoveries.length})));
  if(c.contract)r.append(button(ft('cityContract')+' → '+ft(c.contract.to),()=>follow(c.contract.to),'btn primary'));
  const map=h('canvas',{class:'city-atlas','aria-label':ft('map')});drawCityMap(map,outdoor,f);r.append(map);
  const grid=h('div',{class:'city-route-grid'});for(const [i,p]of CITY_DESTINATIONS.entries())grid.append(button((i+1)+' · '+ft(p.id),()=>follow(p.id),'btn secondary',{'data-city-route':p.id}));r.append(grid);
  const next=CITY_DISCOVERIES.findIndex(d=>!c.discoveries.includes(d.id));
  if(next>=0)r.append(h('article',{class:'city-clue'},h('h3',{},ft('cityClue')),h('p',{},tr(CITY_TALES[next].clue))));else r.append(h('p',{},ft('cityDone')));
  for(const id of c.discoveries){const index=CITY_DISCOVERIES.findIndex(d=>d.id===id);r.append(button('✓ '+tr(CITY_TALES[index].name),()=>memory(index),'btn secondary city-memory'));}
  r.append(h('button',{class:'btn secondary city-future',disabled:true,'aria-disabled':'true'},ft('cityPrivateServer')+' · '+ft('cityFuture')),act('back',closePanel,true));
 });}
 function memory(i,reward=0){panelShow(tr(CITY_TALES[i].name),tr(CITY_STORIES[i]),r=>{r.append(h('p',{class:'city-memory'},reward?'BUY / +$'+reward:'✓ '+ft('cityFound')));if(c.discoveries.length===6)r.append(h('p',{},ft('cityDone')));r.append(act('cityTitle',show),act('back',closePanel,true));});}
 function panorama(){panelShow(ft('cityPanorama'),ft('cityPanoramaBody'),r=>{const canvas=h('canvas',{class:'city-vista','aria-label':ft('cityPanorama')});drawCityVista(canvas,f);r.append(canvas,act('back',closePanel,true));});}
 function showHome(){panelShow(ft('cityMyHome'),ft('cityHomeBody'),r=>{
  r.append(act('cityRest',()=>{if(restApartment(state,getWorld())){finish();closePanel();announce(ft('cityRested'));}},true,{disabled:f.minutes<c.lastRest+60}));
  const themes=h('div',{class:'frontier-panel-actions'});for(const [i,key]of ['cityWarm','cityMint','cityViolet'].entries())themes.append(act(key,()=>{c.theme=i;getWorld().cityTheme=i;persist();showHome();},false,{'aria-pressed':String(c.theme===i)}));r.append(h('h3',{},ft('cityTheme')),themes,act('back',closePanel));
 });}
 function interact(){
  const world=getWorld(),point=cityPoint(world,f);if(!point)return false;
  if(point.discovery){const reward=discoverCity(state,world,point.id),i=CITY_DISCOVERIES.findIndex(d=>d.id===point.id);finish();memory(i,reward);}
  else if(point.id==='lift')panelShow(ft('cityLift'),ft('cityLiftHelp'),r=>{for(const [floor,key]of [['lobby','cityLobby'],['archive','cityArchive'],['sky','citySky']])r.append(act(key,()=>{const next=rideLift(state,world,outdoor.buildings.find(b=>b.id==='tether'),floor);if(!next)return;closePanel();switchWorld(next);transition(ft(key));ambient.call('door');},false,{disabled:floor===world.cityFloor}));r.append(act('back',closePanel));});
  else if(point.id==='panorama')panorama();
  else if(point.id==='home')showHome();
  else panelShow(ft('cityLedger'),ft('cityLedgerBody'),r=>r.append(act('cityTitle',show),act('back',closePanel,true)));
  return true;
 }
 function rooms(){const world=getWorld();if(!world.city)return false;panelShow(ft(world.interior),ft(world.interior==='tether'?'cityLiftHelp':'cityVisitHelp'),r=>{const map=h('canvas',{class:'frontier-map','aria-label':ft('map')});drawMap(map);r.append(map);for(const p of world.rooms)r.append(act(p.key,()=>{closePanel();walkTo(p);}));r.append(act('exitHome',()=>{closePanel();walkTo(world.exit);},true),act('back',closePanel));});return true;}
 function update(interactBtn,name){trigger.textContent='▥ '+ft('cityTitle');const world=getWorld(),p=cityPoint(world,f);if(p){interactBtn.hidden=false;interactBtn.textContent='F · '+ft(p.key);}const district=world.city?world.interior:!world.interior?cityDistrict(f.x,f.y):null;name.textContent=ft(district||'title');root.dataset.city=district||'';root.dataset.cityFloor=world.cityFloor||'';}
 return{trigger,show,open,interact,rooms,update,showHome,dispose(){clearTimeout(transitionTimer);}};
}
