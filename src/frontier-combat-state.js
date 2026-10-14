// Small, save-safe data shared with the main game. Rendering and AI stay lazy-loaded.
export const EXTRA_WEAPONS=['pistol','shotgun','smg','launcher','grenade'];
export const newCombatState=()=>({actors:{},drops:[],treasures:[],deaths:0,kills:0,serial:0,shells:0,rockets:0,grenades:0,graceUntil:0,interior:null});
const finite=(n,lo,hi)=>Number.isFinite(n)&&n>=lo&&n<=hi;
const point=p=>p&&finite(p.x,1,191)&&finite(p.y,1,191);
const gear=['stick','lantern','bow','rifle',...EXTRA_WEAPONS];
export function normalizeCombatState(value){
 const out=newCombatState();if(value==null)return out;if(typeof value!=='object'||Array.isArray(value))return null;
 for(const key of ['deaths','kills','serial','shells','rockets','grenades','graceUntil']){if(value[key]===undefined)continue;if(!finite(value[key],0,key==='graceUntil'?1e8:key==='shells'?500:key==='rockets'||key==='grenades'?99:1e7))return null;out[key]=value[key];}
 const actors=value.actors??{};if(typeof actors!=='object'||!actors||Array.isArray(actors)||Object.keys(actors).length>8192)return null;
 for(const [id,a]of Object.entries(actors)){if(!/^[a-z0-9-]{1,60}$/.test(id)||!point(a)||!finite(a.hp,0,500)||typeof a.kind!=='string'||!/^[a-zA-Z]{1,24}$/.test(a.kind)||!finite(a.at,0,1e8))return null;out.actors[id]={x:a.x,y:a.y,hp:a.hp,kind:a.kind,at:a.at};}
 const drops=value.drops??[];if(!Array.isArray(drops)||drops.length>8)return null;
 for(const d of drops){if(!point(d)||!Number.isInteger(d.id)||d.id<1||!finite(d.money,0,1e9)||!finite(d.ammo,0,1e9)||!finite(d.shells,0,1e9)||!finite(d.rockets,0,1e9)||!finite(d.grenades,0,1e9)||!finite(d.contraband,0,1e9)||typeof d.campKit!=='boolean'||!Array.isArray(d.weapons)||d.weapons.length>gear.length||d.weapons.some(w=>!gear.includes(w)))return null;out.drops.push({...d,weapons:[...new Set(d.weapons)]});}
 const treasures=value.treasures??[];if(!Array.isArray(treasures)||treasures.length>64||treasures.some(id=>!/^cache-\d{1,2}$/.test(id)))return null;out.treasures=[...new Set(treasures)];
 if(value.interior!=null){const i=value.interior;if(!i||!/^[-a-z0-9]{1,60}$/.test(i.id)||!point(i.outside)||!finite(i.outside.angle,-1e6,1e6))return null;out.interior={id:i.id,outside:{x:i.outside.x,y:i.outside.y,angle:i.outside.angle}};}
 return out;
}
