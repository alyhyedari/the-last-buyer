export const NEON_MODES=['auto','prosperity','inflation','conflict'];
export const NEON_QUEST_IDS=['umbrella','silentfilm','relativity','halt','merge','blackout','summit','evacuation','orchard'];
export const newNeon=()=>({mode:'auto',completed:[],quest:null,stability:0,reliefUntil:0,companion:null,bond:0,dateDay:-1,raids:0});
export function normalizeNeon(value){
 const out=newNeon();if(value==null)return out;if(typeof value!=='object'||Array.isArray(value))return null;
 if(!NEON_MODES.includes(value.mode??'auto')||![null,'mira','arin'].includes(value.companion??null))return null;
 out.mode=value.mode??'auto';out.companion=value.companion??null;
 for(const [k,lo,hi]of [['stability',-9,9],['reliefUntil',0,1e8],['bond',0,6],['dateDay',-1,1e7],['raids',0,1e7]]){const n=value[k]??out[k];if(!Number.isFinite(n)||n<lo||n>hi)return null;out[k]=n;}
 const a=value.completed??[];if(!Array.isArray(a)||a.length>NEON_QUEST_IDS.length||a.some(id=>!NEON_QUEST_IDS.includes(id)))return null;out.completed=[...new Set(a)];
 if(value.quest!=null){const q=value.quest;if(!q||!NEON_QUEST_IDS.includes(q.id)||!Number.isInteger(q.step)||q.step<0||q.step>=3||out.completed.includes(q.id))return null;out.quest={id:q.id,step:q.step};}return out;
}
