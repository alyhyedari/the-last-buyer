import {CITY_PLACES} from './metropolis-state.js';
import {hasBuy} from './frontier-perks.js';
import {newLifeState,normalizeLifeState} from './frontier-life-state.js';
// Saved simulation rules. No DOM, wall clock, or rendering dependencies.
export const VEHICLES={foot:{speed:2.5,cargo:1,fuel:0,radius:.22,accel:11,brake:14},bike:{speed:4.6,cargo:2,fuel:0,radius:.29,accel:2.4,brake:6},motorcycle:{speed:7.4,cargo:3,fuel:.18,radius:.34,accel:3.6,brake:8},car:{speed:9,cargo:6,fuel:.28,radius:.48,accel:2.8,brake:7},horse:{speed:5.8,cargo:3,fuel:0,radius:.34,accel:3,brake:7}};
export const FRONTIER_PLACES=[...CITY_PLACES,'gate','garage','market','workshop','club','inn','pond','range','grove','tower','clinic','overlook','square','homes','manor','stable','shelter','camp','summit','nightmarket','oldquarter','boulevard','armory','deepforest','ruins','ranger','weatherstation','quarry','lakeshore','neonquarter','lostwoods','observatory','starfall','quietcliff','bluebasin','oldgrowth','emberpath','moonfen','clockwood','stormwood','lastsanctum'];
export const FRONTIER_ENDINGS=['homeward','lighthouse','two-tickets','night-radio','river-keeper','last-delivery','paper-king','borrowed-dawn','unbought','the-witness','open-road','small-hours'];
export const WEATHER=['clear','cloudy','rain','mist'];
export function hash(seed,n=0){let x=(seed^Math.imul(n+1,0x45d9f3b))>>>0;x=Math.imul(x^(x>>>16),0x45d9f3b);x=Math.imul(x^(x>>>16),0x45d9f3b);return ((x^(x>>>16))>>>0)/4294967296;}
export function newFrontierState(seed){if(!Number.isInteger(seed)){const values=new Uint32Array(1);globalThis.crypto?.getRandomValues?.(values);seed=values[0]||Math.floor(Math.random()*4294967295);}return{seed:seed>>>0,active:false,x:32.5,y:57.5,angle:-Math.PI/2,minutes:8*60,energy:100,fuel:100,mounted:false,visits:[],tutorial:0,tutorialHidden:false,target:'market',fish:0,released:0,deliveries:0,repairs:0,concerts:0,rangeScore:0,photos:[],trust:0,romance:false,lastTalkDay:-1,drinks:0,soberAt:0,company:0,donated:0,receipts:[],evidence:null,ending:null,endingHistory:[],job:null,jobSerial:0,restCount:0,purchases:0,spent:0,earned:0,distance:0,events:[],journal:[],life:newLifeState()};}
export function normalizeFrontier(input){
 if(input==null)return newFrontierState();if(typeof input!=='object'||Array.isArray(input))return null;
 const d=newFrontierState(Number.isInteger(input.seed)?input.seed:1),out={...d};
 const nums={seed:[0,4294967295],x:[1,383],y:[1,383],angle:[-1e6,1e6],minutes:[0,1e8],energy:[0,100],fuel:[0,100],tutorial:[0,5],fish:[0,9999],released:[0,9999],deliveries:[0,9999],repairs:[0,9999],concerts:[0,9999],rangeScore:[0,100],trust:[0,6],lastTalkDay:[-1,1e7],drinks:[0,9999],soberAt:[0,1e8],company:[0,9999],donated:[0,999999],restCount:[0,99999],purchases:[0,999999],spent:[0,99999999],earned:[0,99999999],distance:[0,1e9],jobSerial:[0,999999]};
 for(const [k,[lo,hi]]of Object.entries(nums)){if(input[k]===undefined)continue;if(!Number.isFinite(input[k]))return null;out[k]=Math.max(lo,Math.min(hi,input[k]));}out.seed=out.seed>>>0;
 for(const k of ['active','mounted','tutorialHidden','romance']){if(input[k]!==undefined&&typeof input[k]!=='boolean')return null;out[k]=input[k]??d[k];}
 for(const [k,allowed,max]of [['visits',FRONTIER_PLACES,FRONTIER_PLACES.length],['photos',['deer','fox','rabbit','boar','owl','heron'],6],['receipts',['pond','tower','club'],3],['endingHistory',FRONTIER_ENDINGS,12],['events',['stranger-helped','stranger-ignored','storm-shelter','ghost-heard'],4]]){const list=input[k]??[];if(!Array.isArray(list)||list.length>max||!list.every(v=>allowed.includes(v)))return null;out[k]=[...new Set(list)];}
 if(![null,'publish','sell','keep'].includes(input.evidence??null)||![null,...FRONTIER_ENDINGS].includes(input.ending??null)||!FRONTIER_PLACES.includes(input.target??'market'))return null;
 out.evidence=input.evidence??null;out.ending=input.ending??null;out.target=input.target??'market';
 if(input.job!=null){const j=input.job;if(!j||typeof j!=='object'||!['delivery'].includes(j.type)||!['clinic','club','inn'].includes(j.destination)||!Number.isFinite(j.reward)||j.reward<0||j.reward>200||!Number.isFinite(j.acceptedAt))return null;out.job={type:j.type,destination:j.destination,reward:Math.round(j.reward),acceptedAt:Math.max(0,j.acceptedAt)};}
 const journal=input.journal??[];if(!Array.isArray(journal)||journal.length>24||!journal.every(s=>typeof s==='string'&&s.length<=60))return null;out.journal=[...journal];out.life=normalizeLifeState(input.life);if(!out.life)return null;return out;
}
export const gameDay=f=>Math.floor(f.minutes/1440)+1;
export const gameHour=f=>Math.floor(f.minutes/60)%24;
export function clockLabel(f){const t=Math.floor(f.minutes)%1440;return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}
export const weatherAt=f=>WEATHER[Math.floor(hash(f.seed,Math.floor(f.minutes/180))*4)];
export const isNight=f=>gameHour(f)<6||gameHour(f)>=19;
export function advanceTime(f,minutes){if(!Number.isFinite(minutes)||minutes<0)return;f.minutes=Math.min(1e8,f.minutes+minutes);f.energy=Math.max(0,f.energy-minutes*.018);}
export function note(f,id){f.journal.push(id);if(f.journal.length>24)f.journal.shift();}
export function transact(state,cost){const v=state.village,f=state.frontier;if(!Number.isInteger(cost)||cost<=0||v.money<cost)return false;v.money-=cost;v.buyPresses++;f.purchases++;f.spent+=cost;return true;}
export function earn(state,amount){if(!Number.isFinite(amount)||amount<=0)return;amount=Math.round(amount*(hasBuy(state.frontier,10)?1.1:1));state.village.money=Math.min(999999,state.village.money+amount);state.frontier.earned+=amount;return amount;}
export function canMount(state){const f=state.frontier;return !f.life?.expanse?.swimming&&(state.village.vehicle!=='car'||(f.life?.expanse?.carHealth??100)>0)&&state.village.vehicle!=='foot'&&f.minutes>=Math.max(f.soberAt,f.life?.impairedUntil||0)&&(VEHICLES[state.village.vehicle]?.fuel===0||f.fuel>0);}
export function toggleMount(state){const f=state.frontier;if(f.mounted){f.mounted=false;return true;}if(!canMount(state))return false;f.mounted=true;return true;}
export function travelStep(state,distance){const f=state.frontier,v=VEHICLES[f.mounted?state.village.vehicle:'foot'];f.distance+=Math.max(0,distance);if(f.mounted&&v.fuel)f.fuel=Math.max(0,f.fuel-distance*v.fuel*(hasBuy(f,22)?.75:1));if(f.fuel<=0&&v.fuel)f.mounted=false;f.energy=Math.max(0,f.energy-distance*(f.mounted?.008:.035)*(hasBuy(f,17)?.65:1));}
