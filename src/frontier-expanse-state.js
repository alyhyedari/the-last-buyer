export const newExpanseState=()=>({carHealth:100,carModel:0,parked:null,taken:[],headlights:true,swimming:false,depth:0,oxygen:100,shore:null,salvage:[],contacts:[],alienTrust:0,cigarettes:0,smokeUntil:0,smoked:0});
export function normalizeExpanse(value){const out=newExpanseState();if(value==null)return out;if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const finite=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b,point=p=>p&&finite(p.x,1,383)&&finite(p.y,1,383);
 for(const [key,max]of [['carHealth',100],['carModel',3],['depth',1],['oxygen',100],['cigarettes',40],['smokeUntil',1e8],['smoked',1e6],['alienTrust',12]]){const n=value[key]??out[key];if(!finite(n,key==='alienTrust'?-12:0,max))return null;out[key]=n;}
 for(const key of ['headlights','swimming']){if(value[key]!==undefined&&typeof value[key]!=='boolean')return null;out[key]=value[key]??out[key];}
 for(const [key,max]of [['taken',64],['salvage',24],['contacts',24]]){const a=value[key]??[];if(!Array.isArray(a)||a.length>max||a.some(id=>typeof id!=='string'||!/^[-a-z0-9]{1,60}$/.test(id)))return null;out[key]=[...new Set(a)];}
 if(value.parked!=null){if(!point(value.parked)||!finite(value.parked.angle,-1e6,1e6))return null;out.parked={x:value.parked.x,y:value.parked.y,angle:value.parked.angle};}
 if(value.shore!=null){if(!point(value.shore))return null;out.shore={x:value.shore.x,y:value.shore.y};}if(out.swimming&&!out.shore)return null;for(const k of ['carModel','cigarettes','smoked','alienTrust'])if(!Number.isInteger(out[k]))return null;return out;
}
