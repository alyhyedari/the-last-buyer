import {CHAPTERS} from './content.js';
import {W} from './world-text.js';
export const COMMONS_START={x:956,y:776};
export const DISCOVERY_IDS=['fuse-0','fuse-1','fuse-2','postcard-0','postcard-1','postcard-2'];
export const PROJECT_IDS=['lights','letters','melody'];
export const BELL_MELODY=[2,4,1,3];
const portals=[[350,351],[230,875],[660,238],[1370,339],[1675,620],[1280,1012],[710,1053],[1035,205]];
const buildings=[[211,232,275,78],[540,115,232,85],[862,65,330,90],[1240,205,270,83],[1570,464,214,105],[593,900,234,110],[1170,881,225,85]];
export const COMMONS={index:0,world:'commons',outdoor:true,width:1920,height:1280,name:W.title,intro:W.intro,era:'∞ · THE COMMONS',start:COMMONS_START,hideZones:[],records:[],choices:[],props:[
 ...buildings.map(([x,y,w,h],i)=>({type:'building',x,y,w,h,variant:i})),{type:'pond',x:1215,y:532,w:250,h:190},{type:'monument',x:910,y:484,w:84,h:80},
 ...[[160,515],[165,640],[368,720],[490,480],[554,820],[855,1030],[1082,390],[1580,340],[1780,788],[1030,1140],[1360,1150],[381,1054],[1630,1130],[140,1045]].map(([x,y])=>({type:'tree',x,y,w:22,h:18})),
 {type:'bench',x:515,y:690,w:95,h:18},{type:'bench',x:1050,y:840,w:95,h:18},{type:'bench',x:1500,y:760,w:95,h:18}
 ],entities:[
 ...portals.map(([x,y],i)=>({id:`portal-${i}`,type:'portal',chapterIndex:i,x,y})),
 {id:'notice',type:'notice',x:938,y:665},{id:'workshop',type:'workshop',x:573,y:595},{id:'mailbox',type:'mailbox',x:788,y:613},{id:'music',type:'music',x:1110,y:672},
 ...[[189,191],[1740,1050],[1655,207]].map(([x,y],i)=>({id:`fuse-${i}`,type:'discovery',item:'fuse',slot:i,x,y})),
 ...[[291,1130],[1155,1131],[1700,844]].map(([x,y],i)=>({id:`postcard-${i}`,type:'discovery',item:'postcard',slot:i,x,y})),
 ...[[1210,802],[1270,835],[1340,839],[1410,802]].map(([x,y],i)=>({id:`bell-${i+1}`,type:'bell',note:i+1,x,y})),
 {id:'pond-clue',type:'pondClue',x:1510,y:650}
 ]};
export function settledChapters(state){return CHAPTERS.filter(ch=>ch.index<7&&state.decisions[ch.index]!==undefined&&state.episodes.includes(ch.index)&&ch.entities.filter(e=>e.type==='station').every(e=>state.solved.includes(e.id))).map(ch=>ch.index);}
export function canVisitChapter(state,index){if(!Number.isInteger(index)||index<0||index>7)return false;if(index<7)return true;const done=settledChapters(state);return done.includes(0)&&done.includes(6)&&done.length>=4;}
export function enterChapter(state,index){if(!canVisitChapter(state,index))return false;state.zone='chapter';state.chapter=index;state.unlocked=Math.max(state.unlocked,index);if(!state.visited.includes(index))state.visited.push(index);state.position={...CHAPTERS[index].start};state.ending=null;return true;}
export function returnToCommons(state){if(state.zone==='commons')return;state.zone='commons';state.position={...state.commonsPosition};}
export function discover(state,id){if(!DISCOVERY_IDS.includes(id)||state.discoveries.includes(id))return false;state.discoveries.push(id);return true;}
export function projectCount(state,item){return state.discoveries.filter(id=>id.startsWith(item+'-')).length;}
export function finishProject(state,id){if(!['lights','letters'].includes(id)||state.projects.includes(id))return false;if(projectCount(state,id==='lights'?'fuse':'postcard')<3)return false;state.projects.push(id);return true;}
export function ringBell(state,note){if(![1,2,3,4].includes(note)||state.projects.includes('melody'))return false;const index=state.bellSequence.length;if(BELL_MELODY[index]===note)state.bellSequence.push(note);else state.bellSequence=note===BELL_MELODY[0]?[note]:[];if(state.bellSequence.length===4){state.projects.push('melody');return true;}return false;}
