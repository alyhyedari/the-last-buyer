import {EXTRA_WEAPONS} from './frontier-combat-state.js';
import {VILLAGE_ITEMS,VILLAGE_PROJECTS,VILLAGE_OUTCOME_IDS} from './village-content.js';

export const VILLAGE_VEHICLES=['foot','bike','motorcycle','car','horse'];
export const VILLAGE_WEAPONS=['none',...EXTRA_WEAPONS,...VILLAGE_ITEMS.filter(item=>item.kind==='weapon').map(item=>item.id)];
export const VILLAGE_PROJECT_IDS=VILLAGE_PROJECTS.map(project=>project.id);
export const VILLAGE_ENCOUNTER_IDS=['thief-won','thief-fled','ghost-lit','ghost-listened','ghost-ran'];

export const newVillageState=()=>({money:120,reputation:0,bond:0,growth:0,vehicle:'foot',weapon:'none',vehicles:[],weapons:[],loveChoice:null,projects:[],encounters:[],animals:[],buyPresses:0,story:0,plan:null,outcome:null});

export function normalizeVillageState(input){
 const d=newVillageState();if(input===undefined||input===null)return d;const v=typeof input==='object'&&!Array.isArray(input)?input:null;if(!v)return null;
 const number=(key,min,max)=>Number.isFinite(v[key])?Math.max(min,Math.min(max,Math.round(v[key]))):d[key];
 const projects=Array.isArray(v.projects)&&v.projects.length<=VILLAGE_PROJECT_IDS.length&&v.projects.every(id=>VILLAGE_PROJECT_IDS.includes(id))?[...new Set(v.projects)]:null;
 const encounters=Array.isArray(v.encounters)&&v.encounters.length<=VILLAGE_ENCOUNTER_IDS.length&&v.encounters.every(id=>VILLAGE_ENCOUNTER_IDS.includes(id))?[...new Set(v.encounters)]:null;
 const animals=Array.isArray(v.animals)&&v.animals.length<=4&&v.animals.every(id=>/^village-animal-[0-3]$/.test(id))?[...new Set(v.animals)]:null;
 if(!projects||!encounters||!animals)return null;
 if(v.vehicle!==undefined&&!VILLAGE_VEHICLES.includes(v.vehicle))return null;
 if(v.weapon!==undefined&&!VILLAGE_WEAPONS.includes(v.weapon))return null;
 if(v.plan!==undefined&&v.plan!==null&&!['leave','stay','listen'].includes(v.plan))return null;
 if(v.outcome!==undefined&&v.outcome!==null&&!VILLAGE_OUTCOME_IDS.includes(v.outcome))return null;
 const vehicles=v.vehicles??(v.vehicle&&v.vehicle!=='foot'?[v.vehicle]:[]),weapons=v.weapons??(v.weapon&&v.weapon!=='none'?[v.weapon]:[]);
 if(!Array.isArray(vehicles)||vehicles.length>4||!vehicles.every(id=>VILLAGE_VEHICLES.includes(id)&&id!=='foot')||!Array.isArray(weapons)||weapons.length>VILLAGE_WEAPONS.length||!weapons.every(id=>VILLAGE_WEAPONS.includes(id)&&id!=='none'))return null;
 if(![null,'listen','leave','stay'].includes(v.loveChoice??null))return null;
 return{money:number('money',0,999999),reputation:number('reputation',-9,99),bond:number('bond',-9,99),growth:number('growth',0,VILLAGE_PROJECT_IDS.length),vehicle:v.vehicle||d.vehicle,weapon:v.weapon||d.weapon,vehicles:[...new Set([...vehicles,...(v.vehicle&&v.vehicle!=='foot'?[v.vehicle]:[])])],weapons:[...new Set([...weapons,...(v.weapon&&v.weapon!=='none'?[v.weapon]:[])])],loveChoice:v.loveChoice??null,projects,encounters,animals,buyPresses:number('buyPresses',0,999999),story:number('story',0,4),plan:v.plan??null,outcome:v.outcome??null};
}

export function recordVillageEncounter(village,id){if(!VILLAGE_ENCOUNTER_IDS.includes(id)||village.encounters.includes(id))return false;village.encounters.push(id);return true;}
export function villageItem(id){return VILLAGE_ITEMS.find(item=>item.id===id)||null;}
export function villageProject(id){return VILLAGE_PROJECTS.find(project=>project.id===id)||null;}
