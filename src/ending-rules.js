// Route requirements describe story actions, never inferred personality traits.
// Imported independently of state.js so saves, UI and tests share one evaluator.
export const ENDING_FAMILIES=['repair','commons','power','ruin','escape','memory'];
const final=['final'];
const route=(family,scene,music,requires=[])=>({family,scene,music,requires});
export const ENDING_ROUTES={
 repayment:route('power','desk',6),
 custodian:route('power','glass',6),
 fire:route('ruin','fire',3),
 shared:route('commons','keys',7,[final,['notes',3],['micro',7,0]]),
 leave:route('escape','door',5),
 autopilot:route('power','puppet',0),
 witness:route('memory','copies',7,[final,['notes',12],['micro',6,0],['micro',7,0]]),
 loop:route('memory','loop',0,[['micro',0,1],['episode',7]]),
 installments:route('repair','calendar',5,[final,['major',0,0],['major',3,[0,2]]]),
 workshop:route('repair','workshop',5,[final,['micro',5,0],['major',5,1],['major',6,[0,2]]]),
 address:route('repair','train',8,[final,['major',0,2],['micro',5,0]]),
 letters:route('repair','letters',5,[final,['project','letters'],['micro',0,0],['micro',5,0]]),
 commons:route('commons','council',8,[final,['project','lights'],['major',3,2],['micro',7,0]]),
 reserve:route('commons','seeds',1,[final,['micro',1,0],['major',1,2],['micro',7,0]]),
 exitright:route('commons','doors',4,[final,['major',4,2],['micro',4,0],['micro',7,0],['notes',8]]),
 monopoly:route('power','tower',6,[final,['micro',1,1],['micro',4,1],['major',4,1]]),
 blackout:route('ruin','blackout',3,[final,['major',4,0],['micro',7,1]]),
 deluge:route('ruin','flood',3,[final,['major',3,1],['micro',3,1]]),
 jackpot:route('ruin','gold',6,[final,['major',0,1],['micro',5,1],['major',6,1]]),
 ferry:route('escape','ferry',2,[final,['major',5,2],['micro',7,1]]),
 quiet:route('escape','chairs',5,[final,['micro',5,0],['micro',7,1]]),
 lantern:route('escape','lantern',8,[final,['project','lights'],['project','melody'],['micro',7,1]]),
 broadcast:route('memory','radio',2,[final,['major',2,0],['micro',2,0],['micro',6,0],['notes',16]]),
 palimpsest:route('memory','margins',4,[final,['micro',0,0],['micro',6,0],['major',6,2],['notes',24]])
};
export function requirementMet(state,[kind,index,value]){
 if(kind==='final')return state.episodes.includes(7)&&[0,1,2].every(n=>state.solved.includes(`7:s${n}`));
 if(kind==='notes')return state.records.length>=index;
 if(kind==='project')return state.projects.includes(index);
 if(kind==='episode')return state.episodes.includes(index);
 const selected=(kind==='major'?state.decisions:state.microDecisions)[index];
 return Array.isArray(value)?value.includes(selected):selected===value;
}
export function routeRequirements(state,id){
 const route=ENDING_ROUTES[id];if(!route)return [];
 return route.requires.map(rule=>({rule,met:requirementMet(state,rule),fixed:['major','micro'].includes(rule[0])&&(rule[0]==='major'?state.decisions:state.microDecisions)[rule[1]]!==undefined}));
}
export function routeAvailable(state,id){
 if(!state||!ENDING_ROUTES[id])return false;
 if(id==='leave')return true;
 return state.chapter===7&&routeRequirements(state,id).every(r=>r.met);
}
export function endingSnapshot(state,date=new Date().toISOString()){
 return {decisions:{...state.decisions},microDecisions:{...state.microDecisions},records:[...state.records],projects:[...state.projects],episodes:[...state.episodes],solved:[...state.solved],village:structuredClone(state.village||{}),playSeconds:state.playSeconds,discoveredAt:date,note:state.note,reflectionResponse:state.reflectionResponse};
}
