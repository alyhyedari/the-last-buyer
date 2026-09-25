import {h,button} from './dom.js';
import {tr,direction} from './i18n.js';
import {CHAPTERS} from './content.js';
import {COMMONS,canVisitChapter,settledChapters,projectCount} from './open-world.js';
import {W} from './world-text.js';
import {makeCommons} from './world-art.js';
export function renderAtlas(root,{state,onVisit,onTrack,onReturn}){
 const complete=settledChapters(state);root.append(h('div',{class:'modal-kicker'},tr(W.subtitle)),h('h2',{},tr(W.atlas)),h('p',{class:'atlas-intro'},tr(W.explore)));
 const map=h('div',{class:'world-atlas',dir:'ltr'}),canvas=h('canvas',{width:960,height:640,'aria-hidden':'true'}),c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(makeCommons(COMMONS,state),0,0,960,640);map.append(canvas);
 for(const e of COMMONS.entities.filter(e=>e.type==='portal')){const ch=CHAPTERS[e.chapterIndex],available=canVisitChapter(state,ch.index);map.append(button('',()=>onVisit(ch.index),`atlas-pin ${complete.includes(ch.index)?'complete':''} ${available?'':'locked'}`,{'data-visit':ch.index,style:`left:${e.x/1920*100}%;top:${e.y/1280*100}%`,'aria-label':tr(ch.name),'aria-disabled':!available,dir:direction()}));map.lastChild.append(h('b',{},complete.includes(ch.index)?'✓':String(ch.index+1)),h('span',{},tr(ch.name)));}
 map.append(h('div',{class:'atlas-you',style:`left:${state.commonsPosition.x/1920*100}%;top:${state.commonsPosition.y/1280*100}%`,'aria-hidden':'true'},'●'));root.append(map,h('p',{class:'modal-note'},tr(canVisitChapter(state,7)?W.completed:W.finalLock)));
 const list=h('div',{class:'atlas-directory'});for(const ch of CHAPTERS){const available=canVisitChapter(state,ch.index);list.append(h('div',{class:'atlas-district'},button(`${String(ch.index+1).padStart(2,'0')} · ${tr(ch.name)}`,()=>onVisit(ch.index),'district-link',{'data-travel':ch.index,'aria-disabled':!available}),h('small',{},complete.includes(ch.index)?tr(W.completed):state.visited.includes(ch.index)?ch.era:tr(W.unvisited)),button(tr(W.follow),()=>onTrack(`portal-${ch.index}`),'text-btn',{'data-track':`portal-${ch.index}`})));}root.append(list,h('h3',{class:'dossier-heading'},tr(W.optional)));
 for(const[id,title,body,track,item]of [['lights',W.workshop,W.workshopNeed,'workshop','fuse'],['letters',W.mailbox,W.mailboxNeed,'mailbox','postcard'],['melody',W.melody,W.bellHint,'pond-clue',null]]){
  const done=state.projects.includes(id);root.append(h('div',{class:'project-card'},h('div',{},h('h3',{},tr(title)),h('b',{},done?'✓':item?projectCount(state,item)+'/3':state.bellSequence.length+'/4')),h('p',{},tr(body)),button(tr(W.follow),()=>onTrack(track),'text-btn',{'data-track':track})));
 }
 root.append(h('p',{class:'modal-note'},tr(W.freeNote)),h('div',{class:'modal-actions'},button(tr(W.return),onReturn,'btn primary')));
}
