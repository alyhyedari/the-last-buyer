import {h,button} from './dom.js';
import {tr} from './i18n.js';
import {D} from './director-text.js';
import {decisionEvents} from './state.js';
export function renderReflection(root,{state,onSave,onBack,onSaved}){
 const events=decisionEvents(state),axes=[['evidence','evidence'],['delegation','delegate'],['consent','consent'],['accountability','accountable'],['patience','patience'],['recovery','recovery'],['risk','risk'],['selfcost','selfcost'],['transfer','transfer']];
 root.append(h('div',{class:'modal-kicker'},tr(D.profileTitle)),h('h2',{},tr('reflection')),h('p',{class:'body-copy'},tr('reflectionBody')),h('p',{class:'modal-note'},tr(D.profileNote)),h('p',{class:'evidence-count'},tr('choicesCount',{n:events.length})));
 if(!events.length)root.append(h('p',{class:'body-copy'},tr(D.noEvidence)));
 const grid=h('div',{class:'reflection-grid'});
 for(const[label,tag]of axes){
  const related=events.filter(e=>e.tags.includes(tag)),card=h('details',{class:'reflection-axis'},h('summary',{},h('span',{},tr(D[label])),h('b',{},related.length+' / '+events.length)),h('div',{class:'observation-bar','aria-hidden':'true'},h('i',{style:`width:${related.length/Math.max(1,events.length)*100}%`})),h('small',{},tr(D.observations,{n:related.length,total:events.length})));
  for(const event of related)card.append(h('blockquote',{},h('small',{},tr(event.title)),h('p',{},tr(event.text))));if(!related.length)card.append(h('p',{},tr(D.noEvidence)));grid.append(card);
 }
 root.append(grid);
 const pairs=[[0,0],[2,2],[4,4],[6,6]].map(([a,b])=>[events.find(e=>e.id===`scene-${a}`),events.find(e=>e.id===`chapter-${b}`)]).filter(pair=>pair.every(Boolean));
 if(pairs.length){root.append(h('h3',{class:'dossier-heading'},tr(D.contrast)),h('p',{class:'body-copy'},tr(D.contrastNote)));for(const pair of pairs){const row=h('div',{class:'context-pair'});pair.forEach(e=>row.append(h('div',{},h('small',{},tr(e.title)),h('p',{},tr(e.text)))));root.append(row);}}
 const trail=h('details',{class:'decision-trail'},h('summary',{},tr('decisions')+' · '+events.length));for(const event of events)trail.append(h('div',{class:'journal-entry'},h('h3',{},tr(event.title)),h('p',{},tr(event.text))));root.append(trail);
 root.append(h('h3',{class:'dossier-heading'},tr(D.response)));const reactions=h('div',{class:'reflection-responses'});for(const key of ['fits','role','unsure'])reactions.append(button(tr(D[key]),()=>{state.reflectionResponse=key;onSave();for(const b of reactions.children)b.setAttribute('aria-pressed',b.dataset.response===key?'true':'false');},'scene-button',{'data-response':key,'aria-pressed':state.reflectionResponse===key}));root.append(reactions);
 const note=h('textarea',{class:'reflection-note',rows:4,maxlength:2000,placeholder:tr('notePlaceholder'),'aria-label':tr('uncertain')});note.value=state.note;
 root.append(h('p',{class:'modal-note'},tr('uncertain')),note,h('div',{class:'modal-actions'},button(tr('noteSave'),()=>{state.note=note.value;onSave();onSaved();}),button(tr('back'),onBack,'btn primary')));
}
