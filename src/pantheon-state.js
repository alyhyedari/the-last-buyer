// Stable IDs only: the menu/save loader never imports encounter art or AI.
export const GOD_IDS=['stag','cinder','tide','clock','storm','void','iron','mirror','gravity','thorn','oracle','frost','plague','sun','moon','ledger','genesis'];
export const newPantheon=()=>({mode:'standard',trials:{},power:null,powerReady:0,slowUntil:0,hiddenUntil:0,dayUntil:0});
export function normalizePantheon(value){
 const out=newPantheon();if(value==null)return out;if(typeof value!=='object'||Array.isArray(value)||!['standard','endurance'].includes(value.mode??'standard'))return null;
 out.mode=value.mode??'standard';if(value.power!=null&&!GOD_IDS.includes(value.power))return null;out.power=value.power??null;
 if(value.powerReady!==undefined&&(!Number.isFinite(value.powerReady)||value.powerReady<0||value.powerReady>1e8))return null;out.powerReady=value.powerReady??0;
 for(const k of ['slowUntil','hiddenUntil','dayUntil']){const n=value[k]??0;if(!Number.isFinite(n)||n<0||n>1e8)return null;out[k]=n;}
 const trials=value.trials??{};if(!trials||typeof trials!=='object'||Array.isArray(trials)||Object.keys(trials).length>17)return null;
 for(const [id,t]of Object.entries(trials)){
  if(!GOD_IDS.includes(id)||!t||!['standard','endurance'].includes(t.mode)||!Number.isFinite(t.seconds)||t.seconds<0||t.seconds>1e7||!Number.isInteger(t.phase)||t.phase<1||t.phase>3||!Number.isInteger(t.turn)||t.turn<0||t.turn>1e7||!Number.isInteger(t.seals)||t.seals<0||t.seals>7||!Number.isFinite(t.supply)||t.supply<0||t.supply>1e7)return null;
  out.trials[id]={mode:t.mode,seconds:t.seconds,phase:t.phase,turn:t.turn,seals:t.seals,supply:t.supply};
 }return out;
}
