import {CHAPTERS} from './content.js';
import {COMMONS,canVisitChapter,settledChapters} from './open-world.js';
export function nextGuidance(state,{manual=null}={}){
 if(state.zone==='commons'){
  const completed=settledChapters(state);
  let target=COMMONS.entities.find(e=>e.id===state.tracked);
  if(target?.type==='portal'&&completed.includes(target.chapterIndex))target=null;
  if(target?.type==='portal'&&!canVisitChapter(state,target.chapterIndex))target=null;
  if(target?.type==='discovery'&&state.discoveries.includes(target.id))target=null;
  if(target?.type==='workshop'&&state.projects.includes('lights')||target?.type==='mailbox'&&state.projects.includes('letters')||target?.type==='pondClue'&&state.projects.includes('melody'))target=null;
  if(!target){const index=canVisitChapter(state,7)?7:[0,6,1,2,3,4,5].find(i=>!completed.includes(i));target=COMMONS.entities.find(e=>e.id==='portal-'+index);}
  return {target,kind:target?.type==='portal'?'portal':'optional'};
 }
 const chapter=CHAPTERS[state.chapter],entities=chapter.entities;
 if(manual){const entity=entities.find(e=>e.id===manual);if(entity)return {target:entity,kind:entity.type==='record'?'optional':entity.type==='episode'?'episode':entity.type==='station'?'station':entity.type==='wayback'?'return':state.chapter===7?'ending':'decision'};}
 if(!state.episodes.includes(state.chapter))return {target:entities.find(e=>e.type==='episode'),kind:'episode'};
 const station=entities.find(e=>e.type==='station'&&!state.solved.includes(e.id));
 if(station)return {target:station,kind:'station'};
 if(state.chapter===7)return {target:entities.find(e=>e.type==='npc'),kind:'ending'};
 if(state.decisions[state.chapter]===undefined)return {target:entities.find(e=>e.type==='exit'),kind:'decision'};
 return {target:entities.find(e=>e.type==='wayback'),kind:'return'};
}
export function guideComplete(state,entity){
 if(!entity)return true;
 if(entity.type==='station')return state.solved.includes(entity.id);
 if(entity.type==='episode')return state.episodes.includes(state.chapter);
 if(entity.type==='record')return state.records.includes(entity.id);
 return false;
}
