// Small save schema: imported before the optional world renderer is downloaded.
export const WORLD_SIZE=512;
export const MOTOR_IDS=['needle','ronin','nomad','spectre'];
export const ABILITY_IDS=['overdrive','aegis','ghost'];
export const BLEND_IDS=['prism','velvet','static'];
export const CYBER_COMPANIONS=['nova','roxie','leila','jade','selene','yasmin'];
export const newCyber=()=>({war:null,warMedals:0,socialReady:0,memories:0,lowRange:false,owned:[],tunes:{},motor:0,abilities:[],ready:{},active:{},blends:{prism:0,velvet:0,static:0},blend:null,blendUntil:0,crashUntil:0,helperAt:0,helperSerial:0,helperLast:null,race:null,best:0,wins:0});
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const finite=(v,lo=0,hi=1e8)=>Number.isFinite(v)&&v>=lo&&v<=hi;
export function normalizeCyber(value){
 const out=newCyber();if(value==null)return out;if(!object(value))return null;
 if(value.lowRange!=null&&typeof value.lowRange!=='boolean')return null;out.lowRange=value.lowRange??false;
 for(const key of ['warMedals','socialReady','memories']){const n=value[key]??0;if(!finite(n)||key!=='socialReady'&&!Number.isInteger(n))return null;out[key]=n;}if(value.war!=null){const w=value.war;if(!object(w)||!['ww1','ww2'].includes(w.era)||!Number.isInteger(w.rescued)||w.rescued<0||w.rescued>2||!finite(w.started)||!Number.isInteger(w.lastStrike)||w.lastStrike< -1||w.lastStrike>1e8)return null;out.war={era:w.era,rescued:w.rescued,started:w.started,lastStrike:w.lastStrike};}
 const owned=value.owned??[];if(!Array.isArray(owned)||owned.length>18||owned.some(v=>!Number.isInteger(v)||v<0||v>17))return null;out.owned=[...new Set(owned)];
 const tunes=value.tunes??{};if(!object(tunes)||Object.keys(tunes).length>18)return null;
 for(const [id,t]of Object.entries(tunes)){if(!/^(?:[0-9]|1[0-7])$/.test(id)||!object(t))return null;out.tunes[id]={};for(const k of ['engine','grip','armor','brakes']){const n=t[k]??0;if(!Number.isInteger(n)||n<0||n>3)return null;out.tunes[id][k]=n;}}
 const abilities=value.abilities??[];if(!Array.isArray(abilities)||abilities.length>3||abilities.some(id=>!ABILITY_IDS.includes(id)))return null;out.abilities=[...new Set(abilities)];
 for(const key of ['ready','active']){const obj=value[key]??{};if(!object(obj)||Object.keys(obj).some(id=>!ABILITY_IDS.includes(id)))return null;out[key]={};for(const [id,n]of Object.entries(obj)){if(!finite(n))return null;out[key][id]=n;}}
 for(const key of ['motor','blendUntil','crashUntil','helperAt','helperSerial','best','wins']){const n=value[key]??out[key];if(!finite(n,0,key==='motor'?3:1e8)||(['motor','helperSerial','wins'].includes(key)&&!Number.isInteger(n)))return null;out[key]=n;}
 const blends=value.blends??out.blends;if(!object(blends))return null;for(const id of BLEND_IDS){const n=blends[id]??0;if(!Number.isInteger(n)||n<0||n>9)return null;out.blends[id]=n;}
 if(value.blend!=null&&!BLEND_IDS.includes(value.blend)||value.helperLast!=null&&!['fuel','shield','repair','energy'].includes(value.helperLast))return null;out.blend=value.blend??null;out.helperLast=value.helperLast??null;
 if(value.race!=null){const r=value.race;if(!object(r)||!Number.isInteger(r.next)||r.next<0||r.next>3||!finite(r.started))return null;out.race={next:r.next,started:r.started};}return out;
}
