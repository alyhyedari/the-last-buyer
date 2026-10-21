// Magazine usage is saved; the reload animation is transient. Ammo totals retain
// the existing save format, so upgrading a save neither creates nor loses rounds.
export const MAGAZINES={arc:{capacity:6,seconds:1.6},rail:{capacity:3,seconds:2.1},pulse:{capacity:18,seconds:1.2},pistol:{capacity:12,seconds:1.05},rifle:{capacity:8,seconds:1.45},shotgun:{capacity:6,seconds:1.65},smg:{capacity:30,seconds:1.25},launcher:{capacity:1,seconds:1.8}};
export function normalizeMagazines(value){
 if(value==null)return{};if(typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!MAGAZINES[k]))return null;
 const out={};for(const [key,spent]of Object.entries(value)){if(!Number.isInteger(spent)||spent<0||spent>MAGAZINES[key].capacity)return null;out[key]=spent;}return out;
}
export function magazineRounds(f,weapon,total){const config=MAGAZINES[weapon];return config?Math.min(total,config.capacity-(f.life.combat.magazines[weapon]||0)):total;}
export function spendMagazine(f,weapon){if(MAGAZINES[weapon])f.life.combat.magazines[weapon]=Math.min(MAGAZINES[weapon].capacity,(f.life.combat.magazines[weapon]||0)+1);}
