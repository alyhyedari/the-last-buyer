// Stable IDs are the only city content imported by the initial save loader.
export const CITY_PLACES=['citygate','tether','aurora','copper','heights','canalpark','cityarcade','apartment','citygallery','boathouse'];
export const CITY_SECRETS=['last-umbrella','quiet-frequency','garden-key','blue-hour','paper-stars','first-light'];
export const TOWER_FLOORS=['lobby','archive','sky'];
export const newCityState=()=>({discoveries:[],apartment:false,theme:0,deliveries:0,contract:null,lastRest:-1});
export function normalizeCity(value){
 const out=newCityState();if(value==null)return out;if(typeof value!=='object'||Array.isArray(value))return null;
 const found=value.discoveries??[];
 if(!Array.isArray(found)||found.length>CITY_SECRETS.length||found.some(id=>!CITY_SECRETS.includes(id)))return null;
 out.discoveries=[...new Set(found)];
 if(value.apartment!==undefined&&typeof value.apartment!=='boolean')return null;out.apartment=value.apartment??false;
 for(const [key,min,max]of [['theme',0,2],['deliveries',0,99999],['lastRest',-1,1e8]]){if(value[key]===undefined)continue;if(!Number.isInteger(value[key])||value[key]<min||value[key]>max)return null;out[key]=value[key];}
 if(value.contract!=null){const c=value.contract;if(!c||!['tether','citygallery','boathouse'].includes(c.to)||!Number.isFinite(c.at)||c.at<0||c.at>1e8)return null;out.contract={to:c.to,at:c.at};}
 return out;
}
