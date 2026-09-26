import { CHAPTERS, ENDINGS } from './content.js';
import { ORDER } from './i18n.js';
import { EPISODES } from './episodes.js';
import {COMMONS_START,COMMONS,DISCOVERY_IDS,PROJECT_IDS} from './open-world.js';
import {DEFAULT_PATTERN,validatePattern} from './music-score.js';
import {routeAvailable,endingSnapshot} from './ending-rules.js';
export const SAVE_KEY='last-buyer.save.v1',SETTINGS_KEY='last-buyer.settings.v1';
export const defaultSettings=()=>({language:'en',sound:true,volume:.36,musicVolume:.74,effectsVolume:.6,musicPattern:structuredClone(DEFAULT_PATTERN),quality:'auto',reducedMotion:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false,calm:false,horror:'mild',pixelVeil:true,textSize:1});
export const newState=(collection=[],endingRecords={})=>({version:4,chapter:0,unlocked:0,zone:'commons',position:{...COMMONS_START},commonsPosition:{...COMMONS_START},visited:[],discoveries:[],projects:[],bellSequence:[],tracked:'portal-0',solved:[],records:[],decisions:{},episodes:[],microDecisions:{},seenEvents:[],collection:[...collection],endingRecords:structuredClone(endingRecords),reflectionResponse:null,puzzleProgress:{},playSeconds:0,ending:null,note:'',createdAt:new Date().toISOString()});
const entities=new Set(CHAPTERS.flatMap(c=>c.entities.map(e=>e.id)));
export function validateState(input){
 if(!input||typeof input!=='object'||![1,2,3,4].includes(input.version))return null;
 if(!Number.isInteger(input.chapter)||input.chapter<0||input.chapter>7||!Number.isInteger(input.unlocked)||input.unlocked<input.chapter||input.unlocked>7)return null;
 if(!Array.isArray(input.solved)||!Array.isArray(input.records)||input.solved.length>24||input.records.length>32)return null;
 if(!input.solved.every(id=>entities.has(id)&&id.includes(':s'))||!input.records.every(id=>entities.has(id)&&id.includes(':r')))return null;
 if(new Set(input.solved).size!==input.solved.length||new Set(input.records).size!==input.records.length)return null;
 if(!input.decisions||typeof input.decisions!=='object'||Array.isArray(input.decisions))return null;
 for(const [k,v] of Object.entries(input.decisions))if(!/^[0-6]$/.test(k)||!Number.isInteger(v)||v<0||v>2)return null;
 if(input.ending!==null&&!ENDINGS.some(e=>e.id===input.ending))return null;
 const zone=input.version<3?'chapter':input.zone;if(!['commons','chapter'].includes(zone))return null;
 const position=input.position;if(!position||!Number.isFinite(position.x)||!Number.isFinite(position.y)||position.x<37||position.x>(zone==='commons'?1883:923)||position.y<78||position.y>(zone==='commons'?1246:606))return null;
 if(!Number.isFinite(input.playSeconds)||input.playSeconds<0||input.playSeconds>1e8)return null;
 const puzzleProgress={};for(const [k,v] of Object.entries(input.puzzleProgress||{})){if(entities.has(k)&&k.includes(':s')&&Number.isInteger(v)&&v>=0&&v<=3)puzzleProgress[k]=v;}
 const legacy=input.version===1,episodes=legacy?Object.keys(input.decisions).map(Number):input.episodes;
 const microDecisions=legacy?{}:input.microDecisions,seenEvents=legacy?[]:input.seenEvents,collection=legacy?(input.ending?[input.ending]:[]):input.collection,reflectionResponse=legacy?null:input.reflectionResponse;
 if(!Array.isArray(episodes)||episodes.length>8||new Set(episodes).size!==episodes.length||!episodes.every(n=>Number.isInteger(n)&&n>=0&&n<=7))return null;
 if(!microDecisions||typeof microDecisions!=='object'||Array.isArray(microDecisions))return null;
 if(!Object.entries(microDecisions).every(([k,v])=>/^[0-7]$/.test(k)&&[0,1].includes(v)&&episodes.includes(Number(k))))return null;
 if(!Array.isArray(seenEvents)||seenEvents.length>24||!seenEvents.every(v=>typeof v==='string'&&/^[0-7]:(arrival|power|receipt)$/.test(v)))return null;
 if(!Array.isArray(collection)||collection.length>ENDINGS.length||!collection.every(id=>ENDINGS.some(e=>e.id===id)))return null;
 const endingRecords=cleanEndingRecords(input.version<4?{}:input.endingRecords,collection);if(!endingRecords)return null;
 if(![null,'fits','role','unsure'].includes(reflectionResponse))return null;
 for(const k of Object.keys(puzzleProgress))puzzleProgress[k]=Math.min(2,puzzleProgress[k]);
 const commonsPosition=input.version<3?{...COMMONS_START}:input.commonsPosition,visited=input.version<3?Array.from({length:input.unlocked+1},(_,i)=>i):input.visited,discoveries=input.version<3?[]:input.discoveries,projects=input.version<3?[]:input.projects,bellSequence=input.version<3?[]:input.bellSequence,tracked=input.version<3?null:input.tracked;
 if(!commonsPosition||!Number.isFinite(commonsPosition.x)||!Number.isFinite(commonsPosition.y)||commonsPosition.x<37||commonsPosition.x>1883||commonsPosition.y<78||commonsPosition.y>1246)return null;
 if(!Array.isArray(visited)||visited.length>8||!visited.every(v=>Number.isInteger(v)&&v>=0&&v<8)||new Set(visited).size!==visited.length)return null;
 if(!Array.isArray(discoveries)||discoveries.length>6||!discoveries.every(id=>DISCOVERY_IDS.includes(id))||new Set(discoveries).size!==discoveries.length)return null;
 if(!Array.isArray(projects)||projects.length>3||!projects.every(id=>PROJECT_IDS.includes(id))||new Set(projects).size!==projects.length)return null;
 if(!Array.isArray(bellSequence)||bellSequence.length>4||!bellSequence.every(n=>[1,2,3,4].includes(n)))return null;
 if(tracked!==null&&!COMMONS.entities.some(e=>e.id===tracked))return null;
 return{version:4,chapter:input.chapter,unlocked:input.unlocked,zone,position:{x:position.x,y:position.y},commonsPosition:{x:commonsPosition.x,y:commonsPosition.y},visited:[...visited],discoveries:[...discoveries],projects:[...projects],bellSequence:[...bellSequence],tracked,solved:[...input.solved],records:[...input.records],decisions:{...input.decisions},episodes:[...episodes],microDecisions:{...microDecisions},seenEvents:[...new Set(seenEvents)],collection:[...new Set(collection)],endingRecords,reflectionResponse,puzzleProgress,playSeconds:input.playSeconds,ending:input.ending,note:typeof input.note==='string'?input.note.slice(0,2000):'',createdAt:typeof input.createdAt==='string'?input.createdAt.slice(0,40):new Date().toISOString()};
}
function cleanEndingRecords(records,collection){
 if(!records||typeof records!=='object'||Array.isArray(records)||Object.keys(records).length>ENDINGS.length)return null;
 const clean={};
 for(const [id,r]of Object.entries(records)){
  if(!collection.includes(id)||!r||typeof r!=='object'||Array.isArray(r))return null;
  if(!r.decisions||typeof r.decisions!=='object'||Array.isArray(r.decisions)||!Object.entries(r.decisions).every(([k,v])=>/^[0-6]$/.test(k)&&[0,1,2].includes(v)))return null;
  if(!Array.isArray(r.episodes)||r.episodes.length>8||new Set(r.episodes).size!==r.episodes.length||!r.episodes.every(n=>Number.isInteger(n)&&n>=0&&n<8))return null;
  if(!r.microDecisions||typeof r.microDecisions!=='object'||Array.isArray(r.microDecisions)||!Object.entries(r.microDecisions).every(([k,v])=>/^[0-7]$/.test(k)&&[0,1].includes(v)&&r.episodes.includes(Number(k))))return null;
  if(!Array.isArray(r.records)||r.records.length>32||new Set(r.records).size!==r.records.length||!r.records.every(k=>entities.has(k)&&k.includes(':r')))return null;
  if(!Array.isArray(r.solved)||r.solved.length>24||new Set(r.solved).size!==r.solved.length||!r.solved.every(k=>entities.has(k)&&k.includes(':s')))return null;
  if(!Array.isArray(r.projects)||r.projects.length>3||new Set(r.projects).size!==r.projects.length||!r.projects.every(k=>PROJECT_IDS.includes(k)))return null;
  if(!Number.isFinite(r.playSeconds)||r.playSeconds<0||r.playSeconds>1e8||typeof r.discoveredAt!=='string'||r.discoveredAt.length>40||!Number.isFinite(Date.parse(r.discoveredAt)))return null;
  if(![null,'fits','role','unsure'].includes(r.reflectionResponse)||typeof r.note!=='string'||r.note.length>2000||!routeAvailable({...r,chapter:7},id))return null;
  clean[id]=endingSnapshot(r,r.discoveredAt);
 }
 return clean;
}
export function readSave(storage){try{return validateState(JSON.parse(storage.getItem(SAVE_KEY)));}catch{return null;}}
export function writeSave(storage,state){try{const valid=validateState(state);if(!valid)return false;storage.setItem(SAVE_KEY,JSON.stringify(valid));return true;}catch{return false;}}
export function readSettings(storage){const d=defaultSettings();try{const p=JSON.parse(storage.getItem(SETTINGS_KEY));if(!p)return d;return{...d,musicVolume:Number.isFinite(p.musicVolume)?Math.max(0,Math.min(1,p.musicVolume)):d.musicVolume,effectsVolume:Number.isFinite(p.effectsVolume)?Math.max(0,Math.min(1,p.effectsVolume)):d.effectsVolume,musicPattern:validatePattern(p.musicPattern)?p.musicPattern.map(row=>[...row]):d.musicPattern,language:ORDER.includes(p.language)?p.language:'en',sound:typeof p.sound==='boolean'?p.sound:d.sound,volume:Number.isFinite(p.volume)?Math.max(0,Math.min(1,p.volume)):d.volume,quality:['auto','high','low'].includes(p.quality)?p.quality:'auto',reducedMotion:typeof p.reducedMotion==='boolean'?p.reducedMotion:d.reducedMotion,calm:typeof p.calm==='boolean'?p.calm:false,horror:p.horror==='cinematic'?'cinematic':'mild',pixelVeil:typeof p.pixelVeil==='boolean'?p.pixelVeil:true,textSize:[1,1.1,1.2].includes(p.textSize)?p.textSize:1};}catch{return d;}}
export const chapterDone=(state,index)=>state.episodes.includes(index)&&CHAPTERS[index].entities.filter(e=>e.type==='station').every(e=>state.solved.includes(e.id));
export function addDecision(state,index,option){if(!Number.isInteger(index)||!Number.isInteger(option)||index<0||index>6||option<0||option>2||state.decisions[index]!==undefined)return false;state.decisions[index]=option;return true;}
export function addEpisodeDecision(state,index,option){if(!Number.isInteger(index)||index<0||index>7||![0,1].includes(option)||state.microDecisions[index]!==undefined)return false;state.microDecisions[index]=option;if(!state.episodes.includes(index))state.episodes.push(index);return true;}
export function decisionEvents(state){const out=[];for(let i=0;i<8;i++){const micro=state.microDecisions[i],major=state.decisions[i];if(micro!==undefined)out.push({id:`scene-${i}`,chapter:i,title:EPISODES[i].title,...EPISODES[i].choices[micro]});if(major!==undefined)out.push({id:`chapter-${i}`,chapter:i,title:CHAPTERS[i].name,...CHAPTERS[i].choices[major]});}return out;}
export function reflectionCounts(state){const counts={};for(const event of decisionEvents(state))for(const tag of event.tags)counts[tag]=(counts[tag]||0)+1;return counts;}
export const canChooseEnding=routeAvailable;
export function recordEnding(state,id){if(!canChooseEnding(state,id))return false;state.ending=id;if(!state.collection.includes(id))state.collection.push(id);state.endingRecords[id]=endingSnapshot(state);return true;}
export function resumeBeforeEnding(state){if(!state?.ending)return false;state.ending=null;return true;}
export function advanceChapter(state){if(state.chapter>=7||!chapterDone(state,state.chapter)||state.decisions[state.chapter]===undefined)return false;state.chapter++;state.unlocked=Math.max(state.unlocked,state.chapter);state.position={...CHAPTERS[state.chapter].start};return true;}
export function obstacles(chapter){const a=chapter.props.filter(p=>p.solid!==false&&!['water','plant','lamp','window'].includes(p.type)).map(p=>({x:p.x-5,y:p.y-2,w:(p.w||50)+10,h:(p.h||35)+9}));for(const e of chapter.entities.filter(e=>e.type==='station'))a.push({x:e.x-30,y:e.y-30,w:60,h:53});a.bounds={width:chapter.width||960,height:chapter.height||640};return a;}
export function walkable(x,y,blocks){return x>=45&&x<=(blocks.bounds?.width||960)-45&&y>=88&&y<=(blocks.bounds?.height||640)-43&&!blocks.some(b=>x>b.x-5&&x<b.x+b.w+5&&y>b.y-4&&y<b.y+b.h+5);}
export function findPath(start,goal,blocks){
 const cell=16,cols=Math.ceil((blocks.bounds?.width||960)/cell),rows=Math.ceil((blocks.bounds?.height||640)/cell);const sx=Math.floor(start.x/cell),sy=Math.floor(start.y/cell),gx=Math.floor(goal.x/cell),gy=Math.floor(goal.y/cell);const startId=sy*cols+sx,goalId=gy*cols+gx;
 if(!walkable(gx*cell+8,gy*cell+8,blocks))return[];
 const queue=[startId],parent=new Int32Array(cols*rows).fill(-2);parent[startId]=-1;
 for(let k=0;k<queue.length;k++){const id=queue[k];if(id===goalId){const out=[];for(let n=id;n!==-1;n=parent[n])out.push({x:(n%cols)*cell+8,y:Math.floor(n/cols)*cell+8});return out.reverse().slice(1);}const x=id%cols,y=Math.floor(id/cols);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,n=yy*cols+xx;if(xx<0||xx>=cols||yy<0||yy>=rows||parent[n]!==-2||!walkable(xx*cell+8,yy*cell+8,blocks))continue;parent[n]=id;queue.push(n);}}
 return[];
}
export function approachPath(start,entity,blocks){const candidates=[];for(let y=-48;y<=48;y+=16)for(let x=-48;x<=48;x+=16){const p={x:Math.floor((entity.x+x)/16)*16+8,y:Math.floor((entity.y+y)/16)*16+8};if(Math.hypot(p.x-entity.x,p.y-entity.y)<62&&walkable(p.x,p.y,blocks))candidates.push(p);}candidates.sort((a,b)=>Math.hypot(a.x-start.x,a.y-start.y)-Math.hypot(b.x-start.x,b.y-start.y));for(const p of candidates){const path=findPath(start,p,blocks);if(path.length||Math.hypot(p.x-start.x,p.y-start.y)<18)return path;}return[];}
