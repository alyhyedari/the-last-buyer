import {WORLD_SIZE} from './cyber-state.js';
import {GOD_IDS} from './pantheon-state.js';
import {echoUnlocked,wardUnlocked} from './frontier-perks.js';
// Small save schema: forest content and artwork stay in the lazy county bundle.
export const forestCoinId=n=>'buy-'+String(n+1).padStart(2,'0');
export const FOREST_IDS=Array.from({length:30},(_,i)=>forestCoinId(i));
export const newForestState=()=>({coins:[],opened:[],tracked:null,hint:0,pulseUntil:0,readyAt:0,pulseX:0,pulseY:0,casts:0,gme:[],uvOwned:false,light:'off',shots:0,regenAt:0});
export function normalizeForest(value){
 const out=newForestState();if(value==null)return out;if(typeof value!=='object'||Array.isArray(value))return null;
 for(const key of ['coins','opened']){const list=value[key]??[];if(!Array.isArray(list)||list.length>30||list.some(id=>!FOREST_IDS.includes(id)))return null;out[key]=[...new Set(list)];}
 if(value.tracked!=null&&!FOREST_IDS.includes(value.tracked))return null;out.tracked=value.tracked??null;
 for(const [key,max]of [['hint',2],['pulseUntil',1e8],['readyAt',1e8],['pulseX',WORLD_SIZE-1],['pulseY',WORLD_SIZE-1],['casts',1e7],['shots',1e9],['regenAt',1e8]]){const n=value[key]??out[key];if(!Number.isFinite(n)||n<0||n>max)return null;out[key]=n;}
 if(!Number.isInteger(out.hint)||!Number.isInteger(out.casts))return null;
 if(out.coins.length<3&&!out.coins.includes('buy-03')){out.pulseUntil=0;out.readyAt=0;out.casts=0;}
 if(value.uvOwned!==undefined&&typeof value.uvOwned!=='boolean')return null;out.uvOwned=value.uvOwned??false;if(!['off','lantern','uv'].includes(value.light??'off'))return null;out.light=value.light??'off';if(out.light==='uv'&&!out.uvOwned)out.light='off';const g=value.gme??[];if(!Array.isArray(g)||g.length>GOD_IDS.length||g.some(id=>!GOD_IDS.includes(id)))return null;out.gme=[...new Set(g)];if(!Number.isInteger(out.shots))return null;
 return out;
}
export const forestPulseActive=f=>!!f.life.forest&&(echoUnlocked(f)||f.life.forest.gme.includes('oracle'))&&f.minutes<f.life.forest.pulseUntil;
export const forestWard=(f,s)=>forestPulseActive(f)&&wardUnlocked(f)&&Math.hypot(s.x-f.life.forest.pulseX,s.y-f.life.forest.pulseY)<(f.life.forest.coins.length>=9?10:7);
