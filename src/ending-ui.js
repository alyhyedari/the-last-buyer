import {CHAPTERS,ENDINGS} from './content.js';
import {EPISODES} from './episodes.js';
import {tr,getLanguage} from './i18n.js';
import {h,button} from './dom.js';
import {W} from './world-text.js';
import {D} from './director-text.js';
import {ET} from './ending-text.js';
import {ENDING_FAMILIES,ENDING_ROUTES,routeRequirements,routeAvailable} from './ending-rules.js';
import {drawFinale} from './ending-art.js';

export function endingFrames(ending){
 const body=tr(ending.body),paragraphs=body.split('\n\n');if(paragraphs.length===3)return paragraphs;
 const segments=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(getLanguage(),{granularity:'sentence'}).segment(body)].map(s=>s.segment):body.match(/[^.!?。؟।]+[.!?。؟।]*/gu)||[body];
 if(segments.length<3)return [tr(ending.offer),body,tr(ending.name)];
 return Array.from({length:3},(_,i)=>segments.slice(Math.floor(i*segments.length/3),Math.floor((i+1)*segments.length/3)).join('').trim());
}
function illustration(id,shot=0){const c=h('canvas',{width:640,height:320,class:'ending-tableau','aria-hidden':'true'});drawFinale(c.getContext('2d'),id,shot);return c;}
export function requirementText([kind,index,value],state){
 if(kind==='final')return tr(ET.finalRule);
 if(kind==='notes')return tr(ET.notesRule,{n:index,have:state.records.length});
 if(kind==='project')return tr(ET.projectRule,{name:tr(W[{lights:'workshop',letters:'mailbox',melody:'melody'}[index]])});
 if(kind==='episode')return tr(ET.episodeRule,{name:tr(CHAPTERS[index].name)});
 const options=Array.isArray(value)?value:[value],source=kind==='major'?CHAPTERS[index]:EPISODES[index];
 return tr(CHAPTERS[index].name)+' · '+(options.length>1?tr(ET.either)+' ':'')+options.map(n=>tr(source.choices[n].text)).join(' / ');
}
function clues(state,id,proof=false){
 const detail=h('details',{class:'ending-clues'},h('summary',{},tr(proof?ET.proof:ET.clues))),rules=routeRequirements(state,id);
 if(!rules.length)detail.append(h('p',{},tr(ET.finalOnly)));
 else{const list=h('ul',{class:'ending-requirements'});for(const r of rules){const li=h('li',{class:r.met?'met':r.fixed?'fixed':'pending'},h('span',{'aria-hidden':'true'},r.met?'✓':r.fixed?'↺':'○'),h('div',{},h('p',{},requirementText(r.rule,state))));if(!r.met&&r.fixed)li.lastChild.append(h('small',{},tr(ET.fixed)));list.append(li);}detail.append(list);}
 return detail;
}
function familySelect(onChange){const select=h('select',{'aria-label':tr(ET.title),'data-ending-family':'',onChange:()=>onChange(select.value)});select.append(h('option',{value:'all'},tr(ET.all)));for(const family of ENDING_FAMILIES)select.append(h('option',{value:family},tr(ET[family])));return select;}
function countLine(state){return h('p',{class:'ending-count'},tr(ET.count,{found:state?.collection.length||0,total:ENDINGS.length}));}
export function renderEndingOffers(root,{state,onChoose,onExplore,onGallery}){
 root.append(h('div',{class:'modal-kicker'},tr(ET.final)),h('h2',{},tr(ET.title)),h('p',{class:'body-copy'},tr(ET.intro)),countLine(state));
 const list=h('div',{class:'ending-offers'});let family='all';
 const draw=()=>{list.replaceChildren();const endings=ENDINGS.filter(e=>family==='all'||ENDING_ROUTES[e.id].family===family).sort((a,b)=>Number(routeAvailable(state,b.id))-Number(routeAvailable(state,a.id)));
  for(const ending of endings){const available=routeAvailable(state,ending.id),detail=clues(state,ending.id),card=h('article',{class:'ending-offer '+(available?'available':'unavailable')});
   const choose=button('',()=>{if(routeAvailable(state,ending.id))onChoose(ending);else{detail.open=true;detail.scrollIntoView({block:'nearest'});}},'choice',{'data-ending':ending.id,'aria-disabled':!available});
   choose.append(h('span',{class:'ending-family'},tr(ET[ENDING_ROUTES[ending.id].family])+' · '+tr(available?ET.available:ET.locked)),h('strong',{},h('span',{},tr(ending.name)),h('span',{class:'choice-no','aria-hidden':'true'},ending.icon)),h('small',{},tr(ending.offer)));
   card.append(choose,detail);list.append(card);
  }
 };
 root.append(familySelect(value=>{family=value;draw();}),list,h('div',{class:'modal-actions'},button(tr(ET.explore),onExplore),button(tr(ET.title),onGallery)));draw();
}
export function renderFinale(root,{ending,state,afterword,onReflection,onReplay,onMenu,onGallery}){
 const frames=endingFrames(ending),number=String(ENDINGS.indexOf(ending)+1).padStart(2,'0'),route=ENDING_ROUTES[ending.id];
 root.append(h('div',{class:'ending-index'},`THE LAST BUYER / ${number} — ${ENDINGS.length}`),h('div',{class:'ending-family'},tr(ET[route.family])),h('h2',{},tr(ending.name)));
 const canvas=illustration(ending.id),tabs=h('div',{class:'ending-shots',role:'tablist','aria-label':tr(ending.name)}),text=h('p',{class:'body-copy ending-frame',id:'ending-frame',role:'tabpanel',tabindex:'0'}),status=h('span',{class:'ending-shot-count',dir:'ltr'});
 const select=index=>{for(const [i,node]of [...tabs.children].entries()){node.setAttribute('aria-selected',String(i===index));node.tabIndex=i===index?0:-1;}text.textContent=frames[index];text.setAttribute('aria-labelledby',`ending-shot-${index}`);drawFinale(canvas.getContext('2d'),ending.id,index);status.textContent=`${index+1} / ${frames.length}`;next.hidden=index===frames.length-1;next.onclick=()=>select(index+1);};
 for(let i=0;i<frames.length;i++){const tab=button(tr(ET['act'+i]),()=>select(i),'',{role:'tab',id:`ending-shot-${i}`,'data-ending-shot':i,'aria-controls':'ending-frame'});tab.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?frames.length-1:(i+(e.key==='ArrowRight'?1:-1)+frames.length)%frames.length;select(n);tabs.children[n].focus();}});tabs.append(tab);}
 const next=button(tr(ET.nextAct),()=>{},'text-btn',{'data-ending-next':''});
  root.append(canvas,tabs,text,h('div',{class:'ending-film-controls'},status,next),clues(state,ending.id,true));if(afterword)root.append(h('p',{class:'modal-note'},afterword));
  if(state?.records?.length>=12&&state.projects?.includes('melody'))root.append(h('details',{class:'ending-glitch',open:state.records.length>=24},h('summary',{},tr(ET.signalTitle)),h('p',{class:'body-copy'},tr(ET.signalBody))));
 root.append(h('p',{class:'modal-note'},tr(ET.replayNote)),h('div',{class:'modal-actions ending-actions'},button(tr('showReflection'),onReflection,'btn primary'),button(tr(ET.replay),onReplay,'btn',{'data-ending-replay':''}),button(tr(ET.title),onGallery),button(tr('mainMenu'),onMenu)));
 select(0);
}
export function renderEndingGallery(root,{state}){
 root.append(h('div',{class:'modal-kicker'},`THE LAST BUYER / ${ENDINGS.length}`),h('h2',{},tr(ET.title)),countLine(state),h('p',{class:'body-copy'},tr(ET.galleryNote)));
 const grid=h('div',{class:'ending-gallery ending-atlas'});let family='all';
 const draw=()=>{grid.replaceChildren();for(const ending of ENDINGS.filter(e=>family==='all'||ENDING_ROUTES[e.id].family===family)){
  const discovered=state?.collection.includes(ending.id)||state?.ending===ending.id,route=ENDING_ROUTES[ending.id],card=h('details',{class:'gallery-card', 'data-gallery-ending':ending.id},h('summary',{},h('span',{'aria-hidden':'true'},discovered?ending.icon:'◇'),h('div',{},h('small',{},tr(ET[route.family])),h('strong',{},discovered?tr(ending.name):tr(D.undiscovered)))));
  // Render canvas only when opened; twenty-four hidden scenes need no GPU work.
  let rendered=false;card.addEventListener('toggle',()=>{if(!card.open||rendered)return;rendered=true;if(discovered){card.append(illustration(ending.id,2),h('p',{class:'body-copy'},tr(ending.body)));const record=state.endingRecords?.[ending.id];if(record){card.append(h('h3',{},tr(ET.historic)),h('p',{class:'ending-count'},tr(ET.decisions,{n:Object.keys(record.decisions).length+Object.keys(record.microDecisions).length})),clues({...record,chapter:7},ending.id,true));const events=h('details',{class:'ending-clues'},h('summary',{},tr('decisions')));for(let i=0;i<8;i++){if(record.microDecisions[i]!==undefined)events.append(h('p',{},tr(EPISODES[i].choices[record.microDecisions[i]].text)));if(record.decisions[i]!==undefined)events.append(h('p',{},tr(CHAPTERS[i].choices[record.decisions[i]].text)));}card.append(events);}else card.append(h('p',{class:'modal-note'},tr(ET.legacy)));}
   else if(state)card.append(clues(state,ending.id));else card.append(h('p',{},tr(ET.intro)));
  });grid.append(card);
 }};
 root.append(familySelect(value=>{family=value;draw();}),grid);draw();
}
