import {supplyQuote} from './neon-world.js';
import {MAGAZINES,magazineRounds} from './frontier-loadout-state.js';
import {WEAPONS,ammoCount} from './frontier-combat.js';
import {transact} from './frontier-state.js';
import {VILLAGE_ITEMS} from './village-content.js';
import {NIGHT_ITEMS} from './frontier-night-text.js';
import {parkCar} from './frontier-expanse.js';
export {MAGAZINES,magazineRounds};
export const EQUIPMENT=[...VILLAGE_ITEMS,...NIGHT_ITEMS];
export const SUPPLIES=[{id:'refuel',cost:15},{id:'ammoBuy',cost:12},{id:'shells',cost:18},{id:'rockets',cost:42},{id:'grenades',cost:26},{id:'food',cost:10},{id:'care',cost:24},{id:'repairCar',cost:45},{id:'campKit',cost:35},{id:'uvBuy',cost:65}];
export function supplyAvailable(state,id){const f=state.frontier,l=f.life,c=l.combat;return({refuel:f.fuel<100,ammoBuy:l.ammo<500,shells:c.shells<500,rockets:c.rockets<99,grenades:c.grenades<99,food:f.energy<100,care:l.health<100,repairCar:state.village.vehicles.includes('car')&&l.expanse.carHealth<100,campKit:!l.campKit,uvBuy:!l.forest.uvOwned})[id]===true;}
export function buySupply(state,id){const item=SUPPLIES.find(i=>i.id===id);if(!item||!supplyAvailable(state,id)||!transact(state,supplyQuote(state,item.cost)))return false;const f=state.frontier,l=f.life,c=l.combat;
 switch(id){case'refuel':f.fuel=100;break;case'ammoBuy':l.ammo=Math.min(500,l.ammo+12);break;case'shells':c.shells=Math.min(500,c.shells+8);break;case'rockets':c.rockets=Math.min(99,c.rockets+3);break;case'grenades':c.grenades=Math.min(99,c.grenades+2);break;case'food':f.energy=100;break;case'care':l.health=Math.min(100,l.health+35);break;case'repairCar':l.expanse.carHealth=100;break;case'campKit':l.campKit=true;break;case'uvBuy':l.forest.uvOwned=true;l.forest.light='uv';break;}return true;
}
export function buyEquipment(state,id){const item=EQUIPMENT.find(i=>i.id===id);if(!item)return false;const list=item.kind==='vehicle'?state.village.vehicles:state.village.weapons;if(list.includes(id)||!transact(state,item.cost))return false;list.push(id);const l=state.frontier.life;
 if(id==='shotgun')l.combat.shells=Math.min(500,l.combat.shells+8);if(id==='launcher')l.combat.rockets=Math.min(99,l.combat.rockets+3);if(id==='grenade')l.combat.grenades=Math.min(99,l.combat.grenades+3);if(['pistol','smg'].includes(id))l.ammo=Math.min(500,l.ammo+18);if(id==='car')l.expanse.carHealth=100;return true;
}
export function equipWeapon(state,id){if(id!=='none'&&!state.village.weapons.includes(id))return false;state.village.weapon=id;return true;}
export function equipVehicle(state,id){const f=state.frontier,v=state.village;if(id!=='foot'&&!v.vehicles.includes(id))return false;if(f.mounted&&v.vehicle==='car')parkCar(state);f.mounted=false;v.vehicle=id;return true;}
export class WeaponController{
 constructor(state){this.state=state;this.cancel();}
 cancel(){this.weapon=null;this.remaining=0;this.duration=0;}
 get reloading(){return this.remaining>0;}
 get progress(){return this.duration?1-this.remaining/this.duration:0;}
 reload(){const s=this.state,f=s.frontier,key=s.village.weapon,c=MAGAZINES[key];if(this.reloading)return'reloading';if(!c||f.mounted||f.life.expanse.swimming)return'cannotShoot';const total=ammoCount(f,key);if(!total)return'noAmmo';if(magazineRounds(f,key,total)>=Math.min(total,c.capacity))return'magazineFull';this.weapon=key;this.duration=this.remaining=c.seconds;return'reloading';}
 tick(dt){if(!this.reloading)return false;if(this.state.village.weapon!==this.weapon||this.state.frontier.mounted||this.state.frontier.life.expanse.swimming){this.cancel();return false;}this.remaining=Math.max(0,this.remaining-Math.max(0,Math.min(.1,dt)));if(this.remaining)return false;this.state.frontier.life.combat.magazines[this.weapon]=0;this.cancel();return true;}
 cycle(){const v=this.state.village,list=v.weapons.filter(id=>WEAPONS[id]);if(!list.length)return false;this.cancel();v.weapon=list[(list.indexOf(v.weapon)+1)%list.length];return true;}
}
