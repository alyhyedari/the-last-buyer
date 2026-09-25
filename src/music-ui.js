import {h,button} from './dom.js';
import {tr} from './i18n.js';
import {MT,TRACK_NAMES} from './music-text.js';
import {TRACKS,STEMS,DEFAULT_PATTERN} from './music-score.js';
export class MusicUI{
 constructor({container,audio,settings,onSettings,onToggle,onSaved}){Object.assign(this,{container,audio,settings,onSettings,onToggle,onSaved});this.lastFrame=0;this.spectrum=new Uint8Array(64);this.render();this.loop=this.loop.bind(this);this.frame=requestAnimationFrame(this.loop);}
 dispose(){this.disposed=true;cancelAnimationFrame(this.frame);}
 render(){
  const root=this.container,a=this.audio;root.append(h('div',{class:'modal-kicker'},tr(MT.original)),h('h2',{},tr(MT.title)),h('p',{class:'body-copy'},tr(MT.body)));
  this.canvas=h('canvas',{class:'radio-visual',width:480,height:168,'aria-hidden':'true'});this.caption=h('div',{class:'radio-caption'});root.append(this.canvas,this.caption);
  const select=h('select',{'aria-label':tr(MT.track),'data-music':'track',onChange:()=>{a.selectTrack(Number(select.value));this.followButton.setAttribute('aria-pressed','false');}});TRACK_NAMES.forEach((name,i)=>select.append(h('option',{value:i},`${String(i+1).padStart(2,'0')} · ${tr(name)} · ${TRACKS[i].bpm}`)));select.value=a.trackIndex;
  this.playButton=button(tr(a.on?MT.pause:MT.play),()=>{this.onToggle();this.playButton.textContent=tr(a.on?MT.pause:MT.play);},'btn primary',{'data-music':'play'});
  this.followButton=button(tr(MT.score),()=>{a.followWorld();select.value=a.trackIndex;this.followButton.setAttribute('aria-pressed','true');},'scene-button',{'data-music':'follow','aria-pressed':!a.trackPinned});root.append(h('div',{class:'radio-controls'},select,this.playButton,this.followButton));
  const stems=h('div',{class:'music-stems'});for(const key of STEMS)stems.append(button(tr(MT[key]),event=>{a.stems[key]=!a.stems[key];event.currentTarget.setAttribute('aria-pressed',String(a.stems[key]));},'scene-button',{'aria-pressed':a.stems[key],'data-stem':key}));root.append(h('h3',{class:'dossier-heading'},tr(MT.mixer)),stems);
  for(const[key,label]of [['musicVolume',MT.music],['effectsVolume',MT.effects]]){const range=h('input',{type:'range',min:0,max:1,step:.01,value:a[key],'aria-label':tr(label),'data-music':key,onInput:()=>{this.settings[key]=Number(range.value);a.mix(this.settings.musicVolume,this.settings.effectsVolume);this.onSettings();}});root.append(h('label',{class:'settings-row'},h('span',{},tr(label)),range));}
  root.append(h('h3',{class:'dossier-heading'},tr(MT.studio)),h('p',{class:'body-copy'},tr(MT.studioHelp)));
  const enable=h('input',{type:'checkbox',checked:a.studio,'data-music':'studio',onChange:()=>{a.setStudio(enable.checked);}});root.append(h('label',{class:'settings-row'},h('span',{},tr(MT.enable)),enable));
  const tempoValue=h('output',{dir:'ltr'},a.bpm+' BPM'),tempo=h('input',{type:'range',min:60,max:132,step:1,value:a.bpm,'aria-label':tr(MT.tempo),'data-music':'tempo',onInput:()=>{a.customBpm=Number(tempo.value);tempoValue.textContent=tempo.value+' BPM';a.setStudio(true);enable.checked=true;}});this.tempoValue=tempoValue;this.tempo=tempo;root.append(h('label',{class:'settings-row'},h('span',{},tr(MT.tempo),' · ',tempoValue),tempo));
  this.sequence=h('div',{class:'beat-sequencer',dir:'ltr'});root.append(this.sequence);this.drawPattern();
  root.append(h('div',{class:'modal-actions'},button(tr(MT.reset),()=>{a.setPattern(DEFAULT_PATTERN);this.drawPattern();},'btn secondary',{'data-music':'reset'}),button(tr(MT.clear),()=>{a.setPattern(Array.from({length:4},()=>Array(16).fill(0)));this.drawPattern();},'btn secondary',{'data-music':'clear'}),button(tr(MT.save),()=>{this.settings.musicPattern=a.pattern.map(row=>[...row]);this.onSettings();this.onSaved();},'btn primary',{'data-music':'save'})));
 }
 drawPattern(){const a=this.audio;this.sequence.replaceChildren();for(let row=0;row<4;row++){const label=tr(MT[['kick','snare','hat','notes'][row]]),part=h('div',{class:'beat-row'},h('small',{dir:'auto'},label)),cells=h('div',{class:'beat-cells'});for(let col=0;col<16;col++)cells.append(button(col%4===0?String(col/4+1):'·',event=>{a.pattern[row][col]=a.pattern[row][col]?0:1;event.currentTarget.setAttribute('aria-pressed',String(Boolean(a.pattern[row][col])));},'beat-cell',{'aria-pressed':Boolean(a.pattern[row][col]),'aria-label':`${label} ${col+1}`,'data-step':col,'data-row':row}));part.append(cells);this.sequence.append(part);}}
 loop(now){if(this.disposed)return;this.frame=requestAnimationFrame(this.loop);if(document.hidden||now-this.lastFrame<(this.settings.reducedMotion?250:50))return;this.lastFrame=now;const a=this.audio,t=a.transport(),c=this.canvas.getContext('2d');
  if(a.analyser)a.analyser.getByteFrequencyData(this.spectrum);else this.spectrum.fill(0);
  c.imageSmoothingEnabled=false;c.fillStyle='#0c211d';c.fillRect(0,0,480,168);c.fillStyle='#819b6e';c.font='8px monospace';c.textAlign='left';c.fillText('TOMORROW RADIO / ORIGINAL SCORE',15,18);c.textAlign='right';c.fillStyle='#c8dda6';c.fillText(`${t.bpm} BPM / ${String(a.trackIndex+1).padStart(2,'0')}`,465,18);
  // A slowly rotating spindle and a skyline from the actual audio spectrum.
  c.save();c.translate(94,88);c.fillStyle='#294f3b';c.beginPath();c.arc(0,0,50,0,7);c.fill();for(let i=0;i<5;i++){c.strokeStyle='#6a885544';c.beginPath();c.arc(0,0,17+i*7,0,7);c.stroke();}c.fillStyle='#becda0';c.beginPath();c.arc(0,0,14,0,7);c.fill();if(!this.settings.reducedMotion)c.rotate(a.ctx?.currentTime*.42||0);c.fillStyle='#6d8154';c.fillRect(-2,-8,4,11);c.restore();c.fillStyle='#a9b99a';c.fillRect(133,43,39,4);c.fillRect(133,46,4,31);
  for(let i=0;i<30;i++){const value=t.playing?this.spectrum[Math.min(63,i*2)]:0,height=this.settings.reducedMotion?17:value/255*79+2;c.fillStyle=i%4===0?'#bdcc8b':'#648c73';c.fillRect(200+i*8,129-height,5,height);c.fillStyle='#375f48';c.fillRect(200+i*8,132,5,2);}
  for(let i=0;i<16;i++){c.fillStyle=t.playing&&i===t.step?'#dac58d':'#36513d';c.fillRect(191+i*16,147,11,3);}
  this.caption.textContent=tr(TRACK_NAMES[a.trackIndex])+' · '+tr(MT.section).split(' / ')[t.section||0]+' · '+tr(MT.bar,{n:(t.bar%64)+1});this.tempoValue.textContent=t.bpm+' BPM';if(document.activeElement!==this.tempo)this.tempo.value=t.bpm;
  for(const cell of this.sequence.querySelectorAll('.beat-cell'))cell.classList.toggle('on-beat',t.playing&&Number(cell.dataset.step)===t.step);
 }
}
