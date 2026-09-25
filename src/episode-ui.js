import {h,button} from './dom.js';
import {tr} from './i18n.js';
import {D} from './director-text.js';
import {episodeInitial,episodeAction,episodeSolved,assistEpisode,EDGES} from './episode-logic.js';
import {drawEpisode} from './scene-art.js';
export class EpisodeUI{
 constructor({episode,container,settings,audio,onComplete,existing}){Object.assign(this,{episode,container,settings,audio,onComplete,existing});this.data=episodeInitial(episode.type);this.page=existing===undefined?'mechanic':'record';this.help=false;if(episode.type==='silence'&&existing===undefined)audio.sceneChannels(this.data.playing);}
 dispose(){this.disposed=true;this.audio.stopScene();}
 act(action){this.data=episodeAction(this.episode.type,this.data,action);this.audio.tone('click');if(this.episode.type==='silence')this.audio.sceneChannels(this.data.playing);this.render();}
 action(label,action,id,attrs={}){return button(label,()=>this.act(action),'scene-button',{'data-action':id,...attrs});}
 render(){
  if(this.disposed)return;const root=this.container,ep=this.episode,focus=document.activeElement?.dataset.action;
  root.replaceChildren(h('div',{class:'modal-kicker'},tr(D.episode)+' / '+String(ep.id+1).padStart(2,'0')),h('h2',{},tr(ep.title)));
  const canvas=h('canvas',{width:320,height:128,class:'scene-art','aria-hidden':'true'});drawEpisode(canvas.getContext('2d'),ep.id,this.data,this.settings.pixelVeil,this.settings.calm);root.append(canvas);
  if(this.page==='record'){root.append(h('p',{class:'body-copy'},tr(ep.choices[this.existing].text)),h('div',{class:'scene-stamp'},tr(D.solved)));return;}
  if(this.page==='confirm'){root.append(h('p',{class:'body-copy'},tr(ep.choices[this.selected].text)),h('div',{class:'modal-actions'},button(tr('back'),()=>{this.page='decision';this.render();}),button(tr('confirm'),()=>{if(this.disposed)return;this.onComplete(this.selected);},'btn primary',{'data-action':'confirm-episode'})));return;}
  if(this.page==='decision'){
   root.append(h('p',{class:'modal-note'},tr('choiceNote')));const list=h('div',{class:'choice-list'});ep.choices.forEach((choice,index)=>list.append(button('',()=>{this.selected=index;this.page='confirm';this.render();},'choice',{'data-micro-choice':index}),));
   [...list.children].forEach((el,i)=>el.append(h('strong',{},tr(ep.choices[i].text)),h('small',{},String(i+1).padStart(2,'0'))));root.append(list);return;
  }
  root.append(h('p',{class:'body-copy'},tr(ep.body)));const board=h('div',{class:'episode-board','data-episode':ep.type});this.board(board);root.append(board);
  const solved=episodeSolved(ep.type,this.data);root.append(h('p',{class:'scene-feedback',role:'status'},solved?tr(D.recovered):''));
  if(this.help)root.append(h('p',{class:'modal-note'},tr(ep.clue)),button(tr('assist'),()=>{this.data=assistEpisode(ep.type);if(ep.type==='silence')this.audio.sceneChannels(this.data.playing);this.render();},'text-btn',{'data-action':'scene-assist'}));
  root.append(h('div',{class:'modal-actions'},button(tr('fullHint'),()=>{this.help=!this.help;this.render();},'text-btn',{'data-action':'scene-hint'}),button(tr(D.seal),()=>{if(!solved)return;this.page='decision';this.audio.tone('success');this.render();},'btn primary',{'data-action':'seal',disabled:!solved})));
  if(focus)root.querySelector(`[data-action="${CSS.escape(focus)}"]`)?.focus({preventScroll:true});
 }
 board(board){
  const type=this.episode.type,s=this.data;
  if(type==='tape'){
   const output=h('output',{class:'frequency',dir:'ltr'},String(s.frequency).padStart(2,'0')+' MHz'),slider=h('input',{type:'range',min:0,max:100,step:1,value:s.frequency,'aria-label':tr(D.tune),'data-action':'tune',onInput:()=>{output.textContent=slider.value+' MHz';},onChange:()=>this.act({type:'tune',value:Number(slider.value)})});board.append(h('label',{class:'tuner'},h('span',{},tr(D.tune)),output,slider));
   const fragments=h('div',{class:'tape-fragments'});this.episode.fragments.forEach((fragment,i)=>fragments.append(h('div',{class:s.bands.includes(i)?'recovered':'static'},h('small',{},tr(D.fragment,{n:i+1})),h('p',{},s.bands.includes(i)?tr(fragment):'▁ ▃ ▂ ▆ ▂ ▁ ▅ ▃'))));board.append(fragments);
  }else if(type==='ration'||type==='flood'){
   board.append(h('p',{class:'scene-label'},tr(type==='ration'?D.portions:D.water)));
   const row=h('div',{class:'resource-row',dir:'ltr'});
   s.portions.forEach((n,i)=>{
    const actions=h('div',{class:'resource-actions'});
    for(const j of [0,1,2].filter(j=>j!==i))actions.append(this.action(`→ ${j+1}`,{type:'transfer',from:i,to:j},`transfer-${i}-${j}`,{disabled:n===0,'aria-label':`${i+1} → ${j+1}`}));
    row.append(h('div',{class:'resource-bin'},h('small',{},String(i+1).padStart(2,'0')),h('strong',{},n),h('div',{class:'resource-fill',style:`--fill:${n/(type==='ration'?9:6)*100}%`}),actions));
   });board.append(row);
  }else if(type==='dispatch'){
   board.append(h('p',{class:'scene-label'},tr(D.route)),h('p',{class:'route-readout',dir:'ltr'},s.route.join(' → ')));const grid=h('div',{class:'network-nodes',dir:'ltr'});Object.keys(EDGES).forEach(node=>grid.append(this.action(node,{type:'node',node},`node-${node}`,{disabled:!EDGES[s.route.at(-1)].includes(node),'aria-current':s.route.at(-1)===node?'step':null})));board.append(grid,h('p',{class:s.tampered?'scene-error':'scene-label'},tr(s.tampered?D.tampered:D.verified)),button(tr(D.reset),()=>{this.data=episodeInitial(type);this.render();},'text-btn',{'data-action':'route-reset'}));
  }else if(type==='consensus'){
   board.append(h('p',{class:'scene-label'},tr(D.signatures)));const grid=h('div',{class:'signature-grid',dir:'ltr'});['Δ7','Δ1','Δ7','Δ9','Δ7'].forEach((signature,i)=>grid.append(this.action(`${String.fromCharCode(65+i)} · ${signature}`,{type:'select',index:i},`signature-${i}`,{'aria-pressed':s.selected.includes(i)})));board.append(grid);
  }else if(type==='silence'){
   board.append(h('p',{class:'scene-label'},tr(D.noise)));['01 · ▥','02 · ▣','03 · ♫'].forEach((label,i)=>board.append(this.action(label+' '+(s.playing[i]?'◖))':'—'),{type:'toggle',index:i},`sound-${i}`,{'aria-pressed':s.playing[i],'aria-label':tr(D.noise)+' '+(i+1)})));
  }else if(type==='timeline'){
   const list=h('div',{class:'timeline-sort',dir:'ltr'});s.order.forEach((year,i)=>list.append(h('div',{class:'date-slip'},h('span',{},String(i+1).padStart(2,'0')),h('strong',{},year),this.action('↑',{type:'move',index:i,delta:-1},`date-up-${year}`,{disabled:i===0,'aria-label':`${year} ↑`}),this.action('↓',{type:'move',index:i,delta:1},`date-down-${year}`,{disabled:i===3,'aria-label':`${year} ↓`}))));board.append(list);
  }else if(type==='council'){
   board.append(h('p',{class:'scene-label'},tr(D.voices)));[D.councilA,D.councilB,D.councilC].forEach((voice,i)=>{const heard=s.heard.includes(i),card=h('div',{class:'council-card'},this.action(`${i+1} · ${tr(D.listen)}`,{type:'listen',index:i},`listen-${i}`));if(heard)card.append(h('p',{},tr(voice)),h('label',{},h('input',{type:'checkbox',checked:s.accepted.includes(i),'data-action':`accept-${i}`,onChange:()=>this.act({type:'accept',index:i})}),tr(D.contract)));board.append(card);});
  }
 }
}
