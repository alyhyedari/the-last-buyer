import {G} from './guidance-text.js';
import {nextGuidance,guideComplete} from './guidance.js';
import {createMobileDisplay} from './mobile.js';
import {LANGUAGES,UI,tr,setLanguage,getLanguage,direction} from './i18n.js';
import {CHAPTERS,ENDINGS,SOURCES,AFTERMATH} from './content.js';
import {newState,readSave,writeSave,readSettings,validateState,SETTINGS_KEY,chapterDone,addDecision,addEpisodeDecision,decisionEvents,reflectionCounts,canChooseEnding,recordEnding,resumeBeforeEnding,collectDetail} from './state.js';
import {Engine} from './engine.js';
import {drawTitle,character} from './art.js';
import {Soundscape} from './audio.js';
import {PuzzleUI,puzzleName} from './puzzle-ui.js';
import {h,button} from './dom.js';
import {EPISODES} from './episodes.js';
import {D} from './director-text.js';
import {EpisodeUI} from './episode-ui.js';
import {renderEndingOffers,renderFinale,renderEndingGallery} from './ending-ui.js';
import {ET} from './ending-text.js';
import {ENDING_ROUTES} from './ending-rules.js';
import {readBenchmark,writeBenchmark} from './benchmark.js';
import {mountBenchmark} from './benchmark-ui.js';
import {BT} from './benchmark-text.js';
import {renderReflection} from './reflection-ui.js';
import {COMMONS,canVisitChapter,enterChapter,returnToCommons,discover,projectCount,finishProject,ringBell,settledChapters} from './open-world.js';
import {W,POSTCARDS} from './world-text.js';
import {renderAtlas,renderRoomMap} from './world-ui.js';
import {MusicUI} from './music-ui.js';
import {MT,TRACK_NAMES} from './music-text.js';
import {INPUT} from './input-text.js';
import {mountDynamicJoystick} from './joystick.js';
import {DETAIL_UI,detailFor,DETAIL_IDS} from './detail-content.js';
import {V,VILLAGE_ITEMS,VILLAGE_PROJECTS,VILLAGE_OUTCOMES} from './village-content.js';
import {recordVillageEncounter,villageItem,villageProject} from './village-state.js';
const $=id=>document.getElementById(id);
let storage;try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw new Error('Storage disabled');}};}
let settings=readSettings(storage),state=readSave(storage),benchmark=readBenchmark(storage),playing=false,modalOpen=false,clockPaused=false,puzzle=null,episodeUI=null,musicUI=null,benchmarkUI=null,modalBuilder=null,previousFocus=null,saveOK=true,toastTimer,titleLast=0,session=0,hudSignature='',bannerTimer;
const audio=new Soundscape();audio.on=settings.sound;audio.volume=settings.volume;audio.mix(settings.musicVolume,settings.effectsVolume);audio.setPattern(settings.musicPattern);
const engine=new Engine($('world'),{settings,onInteract:interact,onHud:updateHUD,onCaught:()=>toast(tr('caught')),onShadow:kind=>{if(kind==='near')toast(tr(D.hideHelp));else audio.tone('ward');},onEvent:kind=>{toast(tr(D[kind+'Cue']));audio.tone('paper');save();},onStep:quiet=>audio.step(quiet),getBeat:()=>audio.transport()});
const joystick=mountDynamicJoystick({surface:$('world'),root:$('dynamic-stick'),onVector:vector=>engine.setAnalog(vector.x,vector.y),onEnd:()=>engine.setAnalog(0,0)});
let benchmarkSkipped=false,displayBlocked=false,manualGuide=null;
const mobileDisplay=createMobileDisplay({
 getState:()=>({playing,modalOpen,ending:state?.ending}),
 onBlock:blocked=>{displayBlocked=blocked;engine.setPaused(blocked||modalOpen||!playing||document.hidden);syncInputMode();if(blocked)save();}
});
engine.recommend(benchmark?.quality);
function tnode(tag,key,cls){return h(tag,{class:cls||''},tr(key));}
function storeSettings(){try{storage.setItem(SETTINGS_KEY,JSON.stringify(settings));}catch{}}
function save(){if(!state)return;saveOK=writeSave(storage,state);$('save-label').textContent=tr(saveOK?'saved':'savingError');$('save-indicator').style.background=saveOK?'':'#ee8d7f';$('continue-game').hidden=!state;}
function applyTheme(){
 const themes={green:{green:'#b7f578',gold:'#dba765'},amber:{green:'#ffd089',gold:'#efaa72'},blue:{green:'#8ed9e5',gold:'#b9c7ff'},violet:{green:'#d2a6ff',gold:'#f0b6d0'}};
 const theme=themes[settings.accent]||themes.green;
 for(const [name,value] of Object.entries(theme))document.documentElement.style.setProperty('--'+name,value);
 document.body.dataset.accent=settings.accent;
}
function syncInputMode(){
 const mode=['hybrid','click','joystick'].includes(settings.inputMode)?settings.inputMode:'hybrid';
 settings.inputMode=mode;document.body.dataset.inputMode=mode;
 joystick.setScale(settings.joystickScale);joystick.setEnabled(mode==='joystick'&&playing&&!modalOpen&&!displayBlocked);
 const label=tr(INPUT[mode]);$('input-mode-label').textContent=label;$('input-mode').dataset.mode=mode;$('input-mode').setAttribute('aria-label',tr(INPUT.inputMode)+' ? '+label);$('input-mode').title=tr(INPUT.inputMode)+' ? '+label;
}
function cycleInputMode(){
 const modes=['hybrid','click','joystick'],index=modes.indexOf(settings.inputMode),mode=modes[(index+1)%modes.length];
 settings.inputMode=mode;storeSettings();syncInputMode();toast(tr(INPUT[mode]));
}
function translate(){
 setLanguage(settings.language);document.documentElement.lang=getLanguage()==='zh'?'zh-Hans':getLanguage();document.documentElement.dir=direction();document.title=tr('titleA')+' '+tr('titleB')+' ? THE LAST BUYER';document.body.classList.toggle('reduced-motion',settings.reducedMotion);document.documentElement.style.setProperty('--text-scale',settings.textSize);document.querySelectorAll('[data-t]').forEach(el=>el.textContent=tr(el.dataset.t));
 $('gallery').textContent=tr(ET.title);$('ending-total').textContent=String(ENDINGS.length).padStart(2,'0');$('music-room').textContent=tr(MT.title);$('benchmark-menu').textContent=tr(BT.menu);$('benchmark-menu').setAttribute('aria-label',tr(BT.menu));$('music-hud').setAttribute('aria-label',tr(MT.title));$('focus-mode').setAttribute('aria-label',tr(D.focus));$('focus-mode').title=tr(D.focus);$('objective-toggle').setAttribute('aria-label',tr(W.tasks));$('journal').setAttribute('aria-label',tr('journal'));$('map-btn').setAttribute('aria-label',tr(W.atlas));$('return-commons').setAttribute('aria-label',tr(W.return));$('floating-map-button').setAttribute('aria-label',tr(W.atlas));$('crouch-label').textContent=tr(D.crouch);$('language').value=settings.language;$('language').setAttribute('aria-label',tr('language'));$('sound').setAttribute('aria-label',tr('sound'));$('settings').setAttribute('aria-label',tr('settings'));$('pause').setAttribute('aria-label',tr('pauseTitle'));$('modal-close').setAttribute('aria-label',tr('close'));$('world').setAttribute('aria-label',tr('move')+' ? '+tr('interact'));$('touch-interact').setAttribute('aria-label',tr('interact'));document.querySelector('.mission-panel').dir=direction();$('sound').textContent=settings.sound?'?':'?';$('sound').setAttribute('aria-pressed',settings.sound);applyTheme();syncInputMode();mobileDisplay.translate();if(playing)updateHUD();
}
for(const lang of LANGUAGES)$('language').append(h('option',{value:lang.id},lang.name));
$('language').addEventListener('change',()=>{settings.language=$('language').value;storeSettings();translate();});
$('sound').addEventListener('click',()=>{settings.sound=!settings.sound;audio.set(settings.sound,settings.volume);storeSettings();translate();});
$('input-mode').addEventListener('click',cycleInputMode);$('settings').addEventListener('click',showSettings);$('pause').addEventListener('click',showPause);$('journal').addEventListener('click',()=>showJournal());$('map-btn').addEventListener('click',showMap);$('hint').addEventListener('click',showGuidance);$('guide-open').addEventListener('click',showGuidance);$('guide-walk').addEventListener('click',walkToGuide);
$('about').addEventListener('click',()=>openModal(root=>{root.append(tnode('div','edition','modal-kicker'),tnode('h2','about'),tnode('p','aboutBody','body-copy'));for(const source of SOURCES)root.append(h('div',{class:'journal-entry'},h('a',{href:source.url,target:'_blank',rel:'noopener noreferrer'},source.title)));}));
$('brand').addEventListener('click',e=>{e.preventDefault();if(playing)showPause();});
$('new-game').addEventListener('click',()=>{if(state)openModal(root=>root.append(tnode('h2','newGame'),tnode('p','overwrite','body-copy'),h('div',{class:'modal-actions'},button(tr('export'),exportSave),button(tr('cancel'),closeModal),button(tr('newGame'),beginNew,'btn primary'))));else beginNew();});
$('continue-game').addEventListener('click',()=>{if(!state)return;ensureBenchmark(()=>{audio.start();enterGame();loadChapter(false);if(state.ending)showEnding(state.ending);});});
function beginNew(){ensureBenchmark(beginNewAfterBenchmark);}
function beginNewAfterBenchmark(){closeModal();session++;state=newState(state?.collection||[],state?.endingRecords||{});save();enterGame();loadChapter(false);openModal(root=>{root.append(tnode('div','edition','modal-kicker'),tnode('h2','startTitle'),tnode('p','startBody','body-copy'),h('div',{class:'onboarding-keys'},h('span',{},h('kbd',{},'W A S D'),tr('move')),h('span',{},h('kbd',{},'E'),tr('interact')),h('span',{},h('kbd',{},'SPACE'),tr('ward'))),tnode('p','startNote','modal-note'),h('div',{class:'modal-actions'},button(tr('settings'),showSettings),button(tr('newGame'),()=>{closeModal();showChapterIntro();},'btn primary')));},{clock:true});}
function enterGame(){playing=true;document.body.classList.add('playing');$('menu').hidden=true;$('game').hidden=false;engine.active=true;audio.set(settings.sound,settings.volume);syncInputMode();window.scrollTo({top:0,behavior:'instant'});mobileDisplay.sync();void mobileDisplay.requestLandscape();}
function loadChapter(intro=true){const location=state.zone==='commons'?COMMONS:CHAPTERS[state.chapter];manualGuide=null;engine.load(location,state);document.body.classList.toggle('in-commons',state.zone==='commons');audio.chapter(state.zone==='commons'?8:state.chapter);engine.setPaused(displayBlocked||document.hidden);hudSignature='';updateHUD();save();$('world').focus({preventScroll:true});clearTimeout(bannerTimer);$('chapter-banner').textContent=state.zone==='commons'?tr(W.title):tr(D.level)+' '+(state.chapter+1)+' · '+tr(CHAPTERS[state.chapter].name);$('chapter-banner').hidden=false;bannerTimer=setTimeout(()=>{$('chapter-banner').hidden=true;},4200);if(intro)showChapterIntro();}
function showChapterIntro(){const outdoors=state.zone==='commons',chapter=outdoors?COMMONS:CHAPTERS[state.chapter];openModal(root=>{root.append(h('div',{class:'modal-kicker',dir:'ltr'},outdoors?chapter.era:`${String(chapter.index+1).padStart(2,'0')} / 08 · ${chapter.era}`),h('h2',{},tr(chapter.name)),h('p',{class:'body-copy'},tr(chapter.intro)),h('div',{class:'modal-actions'},button(tr('next'),closeModal,'btn primary')));},{clock:false});}
function titleScreen(){document.body.classList.remove('immersive','playing','objectives-open');$('focus-mode').setAttribute('aria-pressed','false');closeModal();playing=false;engine.active=false;engine.setPaused(true);mobileDisplay.leave();save();$('menu').hidden=false;$('game').hidden=true;$('continue-game').hidden=!state;audio.suspend(false);$('continue-game').focus();}
function openModal(builder,{clock=true}={}){if(!modalOpen)previousFocus=document.activeElement;puzzle?.dispose();puzzle=null;episodeUI?.dispose();episodeUI=null;musicUI?.dispose();musicUI=null;benchmarkUI?.dispose();benchmarkUI=null;modalBuilder=builder;modalOpen=true;clockPaused=clock;engine.setPaused(true);syncInputMode();$('interaction-prompt').hidden=true;$('modal-backdrop').hidden=false;$('app').inert=true;$('modal-content').replaceChildren();builder($('modal-content'));$('modal').focus({preventScroll:true});mobileDisplay.sync();}
function closeModal({resume=true}={}){puzzle?.dispose();puzzle=null;episodeUI?.dispose();episodeUI=null;musicUI?.dispose();musicUI=null;benchmarkUI?.dispose();benchmarkUI=null;modalBuilder=null;modalOpen=false;clockPaused=false;$('modal-backdrop').hidden=true;$('app').inert=false;engine.setPaused(!resume||!playing||document.hidden||displayBlocked);syncInputMode();if(resume)save();if(playing&&resume){$('world').focus({preventScroll:true});updateHUD();}else if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});mobileDisplay.sync();}
function dismissModal(){if(playing&&state?.ending)titleScreen();else closeModal();}
$('modal-close').addEventListener('click',dismissModal);
function ensureBenchmark(after=()=>{}){if(benchmark||benchmarkSkipped)after();else showBenchmark(after);}
function showBenchmark(after=()=>{}){
 openModal(root=>{benchmarkUI=mountBenchmark(root,{
  existing:benchmark,
  onSaved:result=>{benchmark=result;engine.recommend(result.quality);return writeBenchmark(storage,result);},
  onContinue:()=>{closeModal();after();},
  onSkip:()=>{benchmarkSkipped=true;if(!benchmark)engine.recommend('low');closeModal();after();},
  onClose:closeModal
 });},{clock:true});
}
$('benchmark-menu').addEventListener('click',()=>showBenchmark());
document.addEventListener('keydown',e=>{if(modalOpen){if(e.code==='Escape'){e.preventDefault();dismissModal();return;}if(e.code==='Tab'){const nodes=[...$('modal').querySelectorAll('button:not(:disabled),a[href],input,select,textarea,summary,[tabindex="0"]')].filter(el=>!el.hidden&&el.getClientRects().length);if(!nodes.length){e.preventDefault();return;}const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===$('modal'))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===$('modal'))){e.preventDefault();first.focus();}}return;}if(!playing||e.target.matches('input,select,textarea'))return;if(e.code==='Escape'){e.preventDefault();showPause();}if(e.code==='KeyJ'){e.preventDefault();showJournal();}if(e.code==='KeyM'){e.preventDefault();showMap();}if(e.code==='KeyH'){e.preventDefault();showGuidance();}});
document.addEventListener('visibilitychange',()=>{engine.setPaused(document.hidden||modalOpen||!playing||displayBlocked);audio.suspend(document.hidden);if(document.hidden)save();});
window.addEventListener('pagehide',save);
for(const b of document.querySelectorAll('[data-dir]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);engine.touch(b.dataset.dir,true);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>engine.touch(b.dataset.dir,false));}
$('touch-interact').addEventListener('click',()=>engine.interact());
$('touch-crouch').addEventListener('click',()=>engine.toggleCrouch());
$('gallery').addEventListener('click',showGallery);$('music-room').addEventListener('click',showMusic);$('music-hud').addEventListener('click',showMusic);$('return-commons').addEventListener('click',goCommons);$('floating-map-button').addEventListener('click',showMap);$('objective-toggle').addEventListener('click',()=>{const open=document.body.classList.toggle('objectives-open');$('objective-toggle').setAttribute('aria-expanded',String(open));});$('focus-mode').addEventListener('click',()=>{if(document.body.classList.contains('phone-landscape')){void mobileDisplay.requestLandscape();return;}const active=document.body.classList.toggle('immersive');$('focus-mode').setAttribute('aria-pressed',String(active));$('world').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});});
$('touch-ward').addEventListener('click',()=>{engine.ward();updateHUD();});
$('touch-run').addEventListener('pointerdown',e=>{e.preventDefault();$('touch-run').setPointerCapture(e.pointerId);engine.keys.add('ShiftLeft');});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('touch-run').addEventListener(event,()=>engine.keys.delete('ShiftLeft'));
function toast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>{$('toast').hidden=true;},4200);}
function updateHUD(){
 if(!state||!playing)return;
 const ch=state.zone==='commons'?COMMONS:CHAPTERS[state.chapter],villageSig=state.village?JSON.stringify(state.village):'',signature=[state.zone,ch.index,getLanguage(),state.solved.join(','),state.records.join(','),state.episodes.join(','),state.discoveries.join(','),state.detailNotes.join(','),state.projects.join(','),state.tracked,villageSig,Object.keys(state.decisions).join(','),saveOK].join('|');
 // Narrative DOM changes only when the data changes, independently of render FPS.
 if(signature!==hudSignature){
  hudSignature=signature;
  $('chapter-no').textContent=String(ch.index+1).padStart(2,'0');$('chapter-era').textContent=ch.era;
  $('chapter-name').textContent=tr(ch.name);$('location').textContent=tr(ch.name);$('objective-title').textContent=tr(ch.name);
  $('objective-desc').textContent=chapterDone(state,ch.index)?tr(ch.index===7?'decision':'exit'):state.episodes.includes(ch.index)?tr('locked'):tr(D.episodeFirst);
  $('objective-list').replaceChildren(h('li',{class:'scene-objective '+(state.episodes.includes(ch.index)?'done':'')},'◉ '+tr(EPISODES[ch.index].title)),...ch.entities.filter(e=>e.type==='station').map(e=>h('li',{class:state.solved.includes(e.id)?'done':''},ch.index===7?tr('consent')+' '+(e.slot+1):puzzleName(e.puzzle))));
  const tasks=ch.entities.filter(e=>e.type==='station'&&state.solved.includes(e.id)).length+Number(state.episodes.includes(ch.index));$('level-progress').style.width=tasks*25+'%';$('level-progress-label').textContent=tasks+' / 4';$('minimap-label').textContent=tr(D.investigate)+' ◉';
   $('receipt-count').textContent=state.records.length+'/32'+(state.zone==='commons'&&state.village?' · $'+state.village.money:'');
  $('inventory-icons').replaceChildren(...Array.from({length:4},(_,i)=>h('span',{class:'inventory-item '+(state.records.includes(`${ch.index}:r${i}`)?'':'empty'),'aria-label':tr('echo')+' '+(i+1)},state.records.includes(`${ch.index}:r${i}`)?'▤':'·')));
  $('save-label').textContent=tr(saveOK?'saved':'savingError');
  if(state.zone==='commons'){const done=settledChapters(state),village=state.village;$('chapter-no').textContent='∞';$('objective-desc').textContent=tr(W.explore)+' · '+tr(V.growth)+' '+(village?.growth||0)+'/4';$('objective-list').replaceChildren(...[[W.workshop,'lights','fuse'],[W.mailbox,'letters','postcard'],[W.melody,'melody',null]].map(([label,id,item])=>h('li',{class:state.projects.includes(id)?'done':''},tr(label)+' · '+(item?projectCount(state,item)+'/3':state.projects.includes(id)?'4/4':state.bellSequence.length+'/4'))),...(village?[h('li',{class:village.growth>=4?'done':''},tr(V.board)+' · '+village.growth+'/4'),h('li',{class:village.bond>=2?'done':''},tr(V.bond)+' · '+village.bond),h('li',{class:village.vehicle!=='foot'?'done':''},tr(V.vehicle)+' · '+village.vehicle)]:[]));$('level-progress').style.width=Math.max(done.length/7*100,(village?.growth||0)/4*100)+'%';$('level-progress-label').textContent=done.length+' / 7';$('minimap-label').textContent=tr(W.atlas);}
 }
 audio.updateWorld({intensity:engine.threat==='hunted'?1:0,discovery:state.projects.length});$('music-track-name').textContent=tr(TRACK_NAMES[audio.trackIndex]);$('music-hud').classList.toggle('muted',!audio.on);
 $('composure-num').textContent=Math.round(engine.composure)+'%';$('composure-meter').style.width=Math.round(engine.composure)+'%';
 $('threat-label').textContent=tr(D[engine.threat||'quiet']);$('threat-label').dataset.threat=engine.threat||'quiet';$('touch-crouch').setAttribute('aria-pressed',String(engine.crouching));$('touch-crouch').setAttribute('aria-label',tr(D.crouch));$('crouch-label').textContent=tr(D.crouch);engine.drawMinimap($('minimap'));engine.drawMinimap($('floating-minimap'));$('return-commons').hidden=state.zone==='commons';updateGuidance();
 $('touch-ward').disabled=engine.wardCooldown>0;$('touch-ward').textContent=engine.wardCooldown>0?String(Math.ceil(engine.wardCooldown)):'✦';
 $('touch-ward').setAttribute('aria-label',tr('ward'));$('touch-run').setAttribute('aria-label',tr('run'));
 const sec=Math.floor(state.playSeconds);$('play-clock').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
 const near=engine.nearest();$('interaction-prompt').hidden=modalOpen||!near;
 if(near)$('interaction-prompt').querySelector('span').textContent=entityName(near);
}
function entityName(e){if(e.type==='detail'){const note=detailFor(e.id);return note?tr(note.title):tr(DETAIL_UI.kicker);}if(e.type==='villageShop')return tr(V.shop);if(e.type==='villageMina')return tr(V.mina);if(e.type==='richBoy')return tr(V.richBoy);if(e.type==='villageBoard')return tr(V.board);if(e.type==='buyKiosk')return tr(V.buy);if(e.type==='vehicleYard')return tr(V.yard);if(e.type==='weaponShop')return tr(V.weaponShop);if(e.type==='villageGate')return tr(V.gate);if(e.type==='forestShrine')return tr(V.forest);if(e.type==='ghost')return tr(V.ghost);if(e.type==='thief')return tr(V.thief);if(e.type==='animal')return tr(V.animal);if(e.type==='music')return tr(MT.studio);if(e.type==='wayback')return tr(W.return);if(e.type==='portal')return tr(CHAPTERS[e.chapterIndex].name);if(e.type==='discovery')return tr(W[e.item]);if(e.type==='bell')return tr(W.bell)+' '+e.note;if(['workshop','mailbox'].includes(e.type))return tr(W[e.type]);if(e.type==='pondClue')return tr(W.melody);if(e.type==='notice')return tr(W.title);if(e.type==='episode')return tr(EPISODES[state.chapter].title);if(e.type==='station')return state.chapter===7?tr('consent')+' '+(e.slot+1):puzzleName(e.puzzle);if(e.type==='record')return tr('echo')+' · '+String(e.slot+1);if(e.type==='exit')return tr(state.chapter===7?'decision':'exit');return state.chapter===7?tr('decision'):tr('interact');}
function showDetail(entity){const note=detailFor(entity.id);if(!note)return;const fresh=collectDetail(state,entity.id);if(fresh){save();audio.tone('success');}openModal(root=>{root.append(h('div',{class:'modal-kicker'},tr(DETAIL_UI.kicker)),h('h2',{},tr(note.title)),h('p',{class:'body-copy'},tr(note.body)),h('p',{class:'modal-note'},tr(DETAIL_UI.found)+' · '+tr(DETAIL_UI.count,{n:state.detailNotes.length,total:DETAIL_IDS.length})),h('div',{class:'modal-actions'},button(tr('next'),closeModal,'btn primary'),button(tr(DETAIL_UI.archive),()=>showJournal('details'),'btn secondary')));},{clock:false});updateHUD();}
function villageStat(){return state.village||{money:0,reputation:0,bond:0,growth:0,vehicle:'foot',weapon:'none',projects:[],encounters:[],animals:[],buyPresses:0,story:0,plan:null,outcome:null};}
function villageToast(){save();hudSignature='';updateHUD();}
function villageItemLabel(item){return tr(item.name)+' · $'+item.cost;}
function buyVillageItem(id){
 const village=villageStat(),item=villageItem(id);if(!item)return;
 if(village.money<item.cost){toast(tr(V.needMoney));return;}
 village.money-=item.cost;village.buyPresses++;
 if(item.kind==='weapon')village.weapon=id;
 if(item.kind==='vehicle')village.vehicle=id;
 village.reputation+=item.kind==='vehicle'?1:0;
 villageToast();audio.tone('success');toast(tr(V.purchased));closeModal();
}
function showVillageShop(filter='all'){
 const items=VILLAGE_ITEMS.filter(item=>filter==='all'||item.kind===filter);
 openModal(root=>{
  const village=villageStat();root.append(h('div',{class:'modal-kicker'},tr(V.buy)),h('h2',{},tr(V.shop)),h('p',{class:'body-copy'},tr(V.workBody)),h('p',{class:'village-wallet'},tr(V.money)+' · $'+village.money));
  const list=h('div',{class:'village-shop-list'});
  for(const item of items){const owned=item.kind==='weapon'?village.weapon===item.id:village.vehicle===item.id;list.append(h('article',{class:'village-shop-card '+(owned?'owned':'')},h('div',{},h('h3',{},tr(item.name)),h('p',{},tr(item.body))),button(owned?'✓ '+tr(V.purchased):village.money>=item.cost?villageItemLabel(item):'× '+villageItemLabel(item),()=>{if(!owned)buyVillageItem(item.id);},'choice',{disabled:owned||village.money<item.cost,'data-village-buy':item.id})));}
  root.append(list,h('div',{class:'modal-actions'},filter==='all'?button(tr(V.work),workVillageShift,'btn secondary'):null,button(tr('next'),closeModal,'btn primary')));
 },{clock:false});
}
function workVillageShift(){
 const village=villageStat(),earned=28+village.reputation*4+(village.vehicle==='bike'?4:village.vehicle==='motorcycle'?8:village.vehicle==='car'?12:0);
 village.money+=earned;village.reputation++;village.bond=Math.min(9,village.bond+1);village.story=Math.max(1,village.story);village.buyPresses++;villageToast();audio.tone('success');
 openModal(root=>root.append(h('div',{class:'modal-kicker'},tr(V.work)),h('h2',{},tr(V.mina)),h('p',{class:'body-copy'},tr(V.workBody)),h('p',{class:'village-wallet'},' +$'+earned+' · '+tr(V.money)+' $'+village.money),h('div',{class:'modal-actions'},button(tr(V.next),closeModal,'btn primary'))),{clock:false});
}
function buyVillageProject(id){
 const village=villageStat(),project=villageProject(id);if(!project||village.projects.includes(id))return;
 if(village.money<project.cost){toast(tr(V.needMoney));return;}
 village.money-=project.cost;village.projects.push(id);village.growth++;village.reputation++;village.buyPresses++;villageToast();audio.tone('success');toast(tr(V.completed));showVillageBoard();
}
function showVillageBoard(){
 openModal(root=>{
  const village=villageStat();root.append(h('div',{class:'modal-kicker'},tr(V.board)),h('h2',{},tr(V.title)),h('p',{class:'body-copy'},tr(V.boardBody)),h('p',{class:'village-wallet'},tr(V.money)+' · $'+village.money+' · '+tr(V.growth)+' '+village.growth+'/4'));
  const list=h('div',{class:'village-project-list'});
  for(const project of VILLAGE_PROJECTS){const done=village.projects.includes(project.id);list.append(h('article',{class:'village-project '+(done?'done':'')},h('h3',{},(done?'✓ ':'')+tr(project.name)),h('p',{},tr(project.body)),done?null:button(village.money>=project.cost?tr(V.buy)+' · $'+project.cost:tr(V.needMoney),()=>buyVillageProject(project.id),'choice',{disabled:village.money<project.cost,'data-village-project':project.id})));}
  root.append(list,h('div',{class:'modal-actions'},button(tr('next'),closeModal,'btn primary')));
 },{clock:false});
}
function showVillageLoveScene(){
 const village=villageStat();village.story=Math.max(1,village.story);
 openModal(root=>{
  root.append(h('div',{class:'modal-kicker'},tr(V.richBoy)),h('h2',{},tr(V.mina)),h('p',{class:'body-copy'},tr(V.richBody)),h('p',{class:'modal-note'},tr(V.planBody)));
  const list=h('div',{class:'choice-list'});
  list.append(button(tr(V.helpMina),()=>{village.bond+=2;village.reputation++;village.story=2;village.plan='listen';villageToast();closeModal();toast(tr(V.completed));}),button(tr(V.acceptOffer),()=>{if(village.money<80){toast(tr(V.needMoney));return;}village.money-=80;village.buyPresses++;village.story=2;village.plan='leave';villageToast();closeModal();toast(tr(V.purchased));}),button(tr(V.defendShop),()=>{village.reputation+=2;village.story=2;village.plan='stay';villageToast();closeModal();showVillageEncounter('thief');}));
  root.append(list);
 },{clock:false});
}
function finishVillageEncounter(result){
 const village=villageStat();recordVillageEncounter(village,result);
 if(result==='thief-won'){village.money+=35;village.reputation+=2;village.growth=Math.min(4,village.growth+1);village.story=Math.max(2,village.story);}
 if(result==='thief-fled'){village.money=Math.max(0,village.money-10);village.reputation=Math.max(-9,village.reputation-1);}
 if(result==='ghost-lit'){village.reputation++;village.growth=Math.min(4,village.growth+1);}
 if(result==='ghost-listened'){village.bond++;village.story=Math.max(3,village.story);}
 villageToast();audio.tone(result==='thief-won'||result==='ghost-lit'?'success':'paper');closeModal();toast(tr(result==='thief-won'||result==='ghost-lit'?V.completed:V.next));
}
function showVillageEncounter(kind){
 let moves=0;
 openModal(root=>{
  const draw=()=>{
   const village=villageStat();root.replaceChildren(h('div',{class:'modal-kicker'},tr(kind==='ghost'?V.ghost:V.thief)),h('h2',{},tr(kind==='ghost'?V.forest:V.protect)),h('p',{class:'body-copy'},tr(kind==='ghost'?V.ghostBody:kind==='thief'?V.thiefBody:V.encounterBody)),h('div',{class:'encounter-meter'},h('span',{},tr(V.weapon)+' · '+village.weapon),h('b',{},kind==='ghost'?moves+'/1':moves+'/3')));
   const actions=h('div',{class:'modal-actions'});
   if(kind==='ghost'){
    if(['lantern','bow'].includes(village.weapon))actions.append(button(tr(V.light),()=>{moves=1;finishVillageEncounter('ghost-lit');},'btn primary'));
    actions.append(button(tr(V.listen),()=>{moves=1;finishVillageEncounter('ghost-listened');},'btn secondary'),button(tr(V.run),()=>finishVillageEncounter('ghost-ran'),'text-btn'));
   }else if(village.weapon==='none')actions.append(button(tr(V.run),()=>finishVillageEncounter('thief-fled'),'btn primary'));
   else{
    actions.append(button(tr(V.strike),()=>{moves++;if(moves>=3)finishVillageEncounter('thief-won');else draw();},'btn primary'),button(tr(V.run),()=>finishVillageEncounter('thief-fled'),'btn secondary'));
   }
   root.append(actions);
  };draw();
 },{clock:false});
}
function villageOutcomeId(){
 const village=villageStat();if(village.outcome)return village.outcome;
 let family=6;
 if(village.plan==='leave'&&village.growth>=3&&village.bond>=2&&village.vehicle==='car'&&village.reputation>=2)family=0;
 else if(village.plan==='stay'&&village.growth>=3)family=1;
 else if(village.encounters.includes('ghost-listened'))family=2;
 else if(village.encounters.includes('thief-won'))family=3;
 else if(village.plan==='leave')family=4;
 else if(village.encounters.includes('ghost-ran'))family=5;
 const variant=family===0?0:Math.abs(village.buyPresses+village.animals.length+village.reputation+village.growth)%4;return `village-${family}-${variant}`;
}
function showVillageOutcome(){
 const village=villageStat(),id=villageOutcomeId(),outcome=VILLAGE_OUTCOMES.find(item=>item.id===id)||VILLAGE_OUTCOMES[0];village.outcome=id;villageToast();
 openModal(root=>{root.append(h('div',{class:'modal-kicker'},tr(V.outcome)),h('h2',{},tr(outcome.name)),h('p',{class:'body-copy'},tr(outcome.body)),h('p',{class:'modal-note'},tr(V.outcomeCount,{n:VILLAGE_OUTCOMES.indexOf(outcome)+1})),h('div',{class:'modal-actions'},button(tr(V.next),closeModal,'btn primary'),button(tr(V.chooseAgain),()=>{village.outcome=null;showVillageGate();},'btn secondary')));},{clock:false});
}
function showVillageGate(){
 const village=villageStat();if(village.outcome){showVillageOutcome();return;}
 openModal(root=>root.append(h('div',{class:'modal-kicker'},tr(V.gate)),h('h2',{},tr(V.choose)),h('p',{class:'body-copy'},tr(V.planBody)),h('div',{class:'choice-list'},button(tr(V.leave),()=>{village.plan='leave';showVillageOutcome();}),button(tr(V.stay),()=>{village.plan='stay';showVillageOutcome();}),button(tr(V.listen),()=>{village.plan='listen';showVillageOutcome();}))),{clock:false});
}
function interactVillage(entity){
 if(entity.type==='villageShop'){showVillageShop();return;}
 if(entity.type==='villageMina'){showVillageLoveScene();return;}
 if(entity.type==='richBoy'){showVillageLoveScene();return;}
 if(entity.type==='villageBoard'){showVillageBoard();return;}
 if(entity.type==='buyKiosk'){showVillageShop();return;}
 if(entity.type==='vehicleYard'){showVillageShop('vehicle');return;}
 if(entity.type==='weaponShop'){showVillageShop('weapon');return;}
 if(entity.type==='villageGate'){showVillageGate();return;}
 if(entity.type==='forestShrine'||entity.type==='ghost'){showVillageEncounter('ghost');return;}
 if(entity.type==='thief'){showVillageEncounter('thief');return;}
 if(entity.type==='animal'){
  const village=villageStat();if(village.animals.includes(entity.id)){toast(tr(V.completed));return;}
  if(village.money<5){toast(tr(V.needMoney));return;}village.money-=5;village.animals.push(entity.id);village.bond++;villageToast();audio.tone('success');toast(tr(V.feed));return;
 }
}
function interact(entity){if(modalOpen||!playing)return;if(entity.type==='detail'){showDetail(entity);return;}if(state.zone==='commons'){interactCommons(entity);return;}if(entity.type==='wayback'){goCommons();return;}const ch=CHAPTERS[state.chapter];audio.tone('paper');if(entity.type==='record'){if(!state.records.includes(entity.id)){state.records.push(entity.id);save();}const note=ch.records[entity.slot];openModal(root=>{root.append(h('div',{class:'modal-kicker'},tr('echo')+' · '+String(entity.slot+1).padStart(2,'0')),h('span',{class:'source-tag'},tr(note.source?'sourceLabel':'fictionLabel')),h('h2',{},tr(ch.name)),h('p',{class:'body-copy'},tr(note.body)));if(note.source){const s=SOURCES.find(s=>s.id===note.source);root.append(h('a',{href:s.url,target:'_blank',rel:'noopener noreferrer',class:'text-btn'},s.title));}root.append(h('div',{class:'modal-actions'},button(tr('next'),closeModal,'btn primary')));},{clock:false});return;}
 if(entity.type==='episode'){showEpisode();return;}
 if(entity.type==='station'){if(state.solved.includes(entity.id)){toast(tr('resolved'));return;}showPuzzle(entity);return;}
 if(entity.type==='npc'){if(ch.index===7)showEndingChoices();else{openModal(root=>{const portrait=h('canvas',{width:46,height:52,class:'portrait','aria-hidden':'true'}),c=portrait.getContext('2d');character(c,23,45,{kind:entity.kind,scale:1.3});root.append(h('div',{class:'speaker'},portrait,h('span',{},ch.index===0||ch.index===5?'MINA':ch.index===4?'SATOSHI · FICTION':'ARCHIVE')),h('h2',{},tr(ch.name)),h('p',{class:'body-copy'},tr(ch.intro)),h('div',{class:'modal-actions'},button(tr('next'),closeModal,'btn primary')));},{clock:false});}return;}
 if(entity.type==='exit'){if(ch.index===7){showEndingChoices();return;}if(!chapterDone(state,ch.index)){goCommons();return;}if(state.decisions[ch.index]===undefined)showDecision();else goCommons();}
}
function showPuzzle(station){const captured=state;openModal(root=>{if((captured.puzzleProgress[station.id]||0)>=(station.rounds||2)){completeStation(station);return;}puzzle=new PuzzleUI({state:captured,station,container:root,audio,onSave:save,onComplete:()=>{if(captured===state)completeStation(station);}});puzzle.render();},{clock:false});}
function completeStation(station){if(!state.solved.includes(station.id))state.solved.push(station.id);state.puzzleProgress[station.id]=station.rounds||2;save();const chapter=CHAPTERS[state.chapter];openModal(root=>{root.append(h('div',{class:'success-mark'},'✓'),tnode('div','completed','modal-kicker'),h('h2',{},state.chapter===7?tr('consent'):puzzleName(station.puzzle)),h('p',{class:'body-copy'},tr(chapter.records[station.slot].body)));if(state.chapter===7)root.append(h('p',{class:'modal-note'},tr('consent')));root.append(h('div',{class:'modal-actions'},button(tr('next'),closeModal,'btn primary')));},{clock:false});audio.tone('success');}
function showDecision(){const ch=CHAPTERS[state.chapter];openModal(root=>{root.append(tnode('div','decision','modal-kicker'),h('h2',{},tr(ch.name)),tnode('p','choiceNote','body-copy'));const list=h('div',{class:'choice-list'});ch.choices.forEach((choice,index)=>list.append(button('',()=>confirmDecision(ch,index),'choice',{'data-choice':index})));[...list.children].forEach((el,i)=>el.append(h('strong',{},h('span',{},tr(ch.choices[i].text)),h('span',{class:'choice-no'},String(i+1).padStart(2,'0')))));root.append(list);},{clock:false});}
function confirmDecision(ch,index){openModal(root=>root.append(tnode('div','decision','modal-kicker'),h('h2',{},tr(ch.name)),h('p',{class:'body-copy'},tr(ch.choices[index].text)),h('div',{class:'modal-actions'},button(tr('back'),showDecision),button(tr('confirm'),()=>{if(state.chapter!==ch.index)return;addDecision(state,ch.index,index);save();closeModal();goCommons();toast(tr(W.completed));},'btn primary'))),{clock:false});}
function showEndingChoices(){openModal(root=>renderEndingOffers(root,{state,onChoose:confirmEnding,onExplore:closeModal,onGallery:showGallery}),{clock:false});}
function confirmEnding(ending){openModal(root=>root.append(tnode('div','decision','modal-kicker'),h('h2',{},tr(ending.name)),h('p',{class:'body-copy'},tr(ending.offer)),h('div',{class:'modal-actions'},button(tr('back'),()=>state.chapter===7?showEndingChoices():showPause()),button(tr('confirm'),()=>{if(!recordEnding(state,ending.id))return;save();showEnding(ending.id);},'btn primary'))),{clock:false});}
function showEnding(id){const ending=ENDINGS.find(e=>e.id===id);if(!ending)return;const counts=reflectionCounts(state),afterword=id==='repayment'?tr(AFTERMATH[state.decisions[0]===0||state.microDecisions[0]===0?'acknowledged':'unanswered']):id==='fire'?tr(AFTERMATH[(counts.evidence||0)>=2?'copies':'missing']):null;openModal(root=>renderFinale(root,{ending,state,afterword,onReflection:showReflection,onReplay:replayFinalChoice,onMenu:titleScreen,onGallery:showGallery}),{clock:true});audio.chapter(ENDING_ROUTES[id].music);}
function replayFinalChoice(){if(!resumeBeforeEnding(state))return;save();closeModal();loadChapter(false);if(state.chapter===7&&state.zone==='chapter')showEndingChoices();}
function showReflection(){openModal(root=>renderReflection(root,{state,onSave:save,onBack:()=>showEnding(state.ending),onSaved:()=>toast(tr('reflectionSaved'))}),{clock:true});}
function showGallery(){openModal(root=>renderEndingGallery(root,{state}));}

function showEpisode(){const index=state.chapter,existing=state.microDecisions[index];openModal(root=>{episodeUI=new EpisodeUI({episode:EPISODES[index],container:root,settings,audio,existing,onComplete:option=>{if(addEpisodeDecision(state,index,option)){save();audio.tone('success');}showEpisode();}});episodeUI.render();if(existing!==undefined)root.append(h('div',{class:'modal-actions'},button(tr('next'),closeModal,'btn primary')));},{clock:false});}
function showJournal(tab='records'){openModal(root=>{root.append(tnode('div','footer','modal-kicker'),tnode('h2','journal'));const tabs=h('div',{class:'journal-tabs',role:'tablist'});for(const k of ['records','decisions','details','sources'])tabs.append(button(k==='details'?tr(DETAIL_UI.archive):tr(k),()=>showJournal(k),k===tab?'active':'',{role:'tab','aria-selected':tab===k}));root.append(tabs);if(tab==='records'){if(!state.records.length)root.append(tnode('p','emptyJournal','body-copy'));for(const id of [...state.records].sort()){const[index,n]=id.split(':r').map(Number),ch=CHAPTERS[index],note=ch.records[n];root.append(h('div',{class:'journal-entry'},h('h3',{},tr(ch.name)+' / '+(n+1)),h('p',{},tr(note.body)),h('small',{},tr(note.source?'sourceLabel':'fictionLabel'))));}}else if(tab==='decisions'){if(!decisionEvents(state).length)root.append(tnode('p','emptyJournal'));for(const event of decisionEvents(state))root.append(h('div',{class:'journal-entry'},h('h3',{},tr(event.title)),h('p',{},tr(event.text))));}else if(tab==='details'){root.append(h('p',{class:'body-copy'},tr(DETAIL_UI.archiveHelp)),h('p',{class:'modal-note'},tr(DETAIL_UI.count,{n:state.detailNotes.length,total:DETAIL_IDS.length})));if(!state.detailNotes.length)root.append(h('p',{class:'emptyJournal'},tr(DETAIL_UI.empty)));for(const id of [...state.detailNotes].sort()){const note=detailFor(id);if(note)root.append(h('div',{class:'journal-entry'},h('h3',{},tr(note.title)),h('p',{},tr(note.body)),button(tr('inspect'),()=>showDetail({id}),'text-btn')));}}else{root.append(tnode('p','aboutBody','body-copy'));for(const s of SOURCES)root.append(h('div',{class:'journal-entry'},h('a',{href:s.url,target:'_blank',rel:'noopener noreferrer'},s.title)));}},{clock:true});}
function showMap(){engine.capturePosition();if(state.zone==='commons'){showCityMap();return;}openModal(root=>renderRoomMap(root,{state,engine,name:entityName,onTrack:id=>{manualGuide=id;closeModal();toast(tr(G.walking));},onCity:showCityMap,onClose:closeModal}),{clock:true});}
function showCityMap(){openModal(root=>renderAtlas(root,{state,onVisit:visitMemory,onTrack:id=>{state.tracked=id;save();closeModal();if(state.zone==='chapter')toast(tr(G.return));else toast(tr(W.trail));},onReturn:goCommons,onClose:closeModal,onRoom:state.zone==='chapter'?showMap:null}),{clock:true});}
function activeGuide(){
 const entity=manualGuide&&engine.chapter?.entities.find(e=>e.id===manualGuide);
 if(entity&&guideComplete(state,entity))manualGuide=null;
 return nextGuidance(state,{manual:manualGuide});
}
function updateGuidance(){
 const guide=activeGuide(),target=guide.target;
 $('guide-kicker').textContent=tr(G.next)+' · '+tr(G.hint)+' [H]';$('guide-target').textContent=target?entityName(target):tr(G.title);
 $('guide-open').setAttribute('aria-label',tr(G.title));$('guide-open').title=tr(G.title);
 $('guide-walk-label').textContent=tr(G.route);$('guide-walk').setAttribute('aria-label',tr(G.route));$('guide-walk').disabled=!target||displayBlocked;
 engine.setGuide(target);
 $('trail-indicator').hidden=!target;
 if(target){$('trail-label').textContent=entityName(target);$('trail-arrow').style.transform='rotate('+((Math.atan2(target.y-engine.player.y,target.x-engine.player.x)*180/Math.PI)+90)+'deg)';}
}
function walkToGuide(){
 const guide=activeGuide();closeModal();
 if(displayBlocked||!guide.target)return;
 if(engine.navigateTo(guide.target))toast(tr(G.walking));else toast(tr(G.blocked));
}
function showGuidance(){
 if(!playing||!state)return;
 const guide=activeGuide(),target=guide.target,chapter=state.zone==='commons'?COMMONS:CHAPTERS[state.chapter];
 const explanation=tr(G[guide.kind],{target:target?entityName(target):'',round:(state.puzzleProgress[target?.id]||0)+1,total:target?.rounds||2});
 openModal(root=>{
  root.append(h('div',{class:'modal-kicker'},tr(G.next)),h('h2',{},tr(G.title)),h('p',{class:'guide-place'},tr(chapter.name)),h('h3',{class:'guide-destination'},target?entityName(target):''),h('p',{class:'body-copy'},explanation));
  if(guide.kind==='episode')root.append(h('p',{class:'modal-note'},tr(EPISODES[state.chapter].clue)));
  if(guide.kind==='station')root.append(h('p',{class:'modal-note'},tr(target.puzzle+'Help')));
  if(state.zone==='chapter')root.append(h('p',{class:'modal-note'},tr(D.hideHelp)));
  root.append(h('p',{class:'modal-note'},tr(G.walking)),h('div',{class:'modal-actions'},button(tr(G.route),walkToGuide,'btn primary',{'data-guide-route':'true'}),button(tr(state.zone==='commons'?G.cityMap:G.roomMap),showMap,'btn secondary',{'data-guide-map':'true'})));
  if(manualGuide||state.zone==='commons'&&state.tracked)root.append(button(tr(G.story),()=>{manualGuide=null;if(state.zone==='commons')state.tracked=null;save();showGuidance();},'text-btn',{'data-guide-story':'true'}));
 },{clock:true});
}
function visitMemory(index,via='map'){if(!canVisitChapter(state,index)){toast(tr(W.finalLock));return;}if(state.zone==='chapter'&&state.chapter===index){closeModal();return;}engine.capturePosition();engine.setPaused(true);if(!enterChapter(state,index,{via}))return;closeModal({resume:false});loadChapter();}
function goCommons(){if(state.zone==='commons'){closeModal();return;}engine.capturePosition();engine.setPaused(true);returnToCommons(state);closeModal({resume:false});loadChapter(false);}
function commonsMessage(title,body,action){openModal(root=>{root.append(h('div',{class:'modal-kicker'},tr(W.optional)),h('h2',{},tr(title)),h('p',{class:'body-copy'},tr(body)));if(action)root.append(h('div',{class:'modal-actions'},button(tr(action.label),action.run,'btn primary')));else root.append(h('div',{class:'modal-actions'},button(tr('next'),closeModal,'btn primary')));},{clock:false});}
function interactCommons(entity){audio.tone('paper');if(entity.type==='detail'){showDetail(entity);return;}if(['villageShop','villageMina','richBoy','villageBoard','buyKiosk','vehicleYard','weaponShop','villageGate','forestShrine','ghost','thief','animal'].includes(entity.type)){interactVillage(entity);return;}if(entity.type==='music'){showMusic();return;}if(entity.type==='portal'){visitMemory(entity.chapterIndex,'door');return;}if(entity.type==='notice'){showMap();return;}if(entity.type==='discovery'){if(discover(state,entity.id)){save();audio.tone('success');}if(entity.item==='postcard')commonsMessage(W.postcard,POSTCARDS[entity.slot]);else toast(tr(W.fuse)+' · '+projectCount(state,'fuse')+'/3');updateHUD();return;}if(entity.type==='pondClue'){commonsMessage(W.melody,W.bellHint);return;}if(entity.type==='bell'){const completed=ringBell(state,entity.note);audio.bell(entity.note);save();if(completed)commonsMessage(W.melody,W.bellDone);else toast(tr(W.melody)+' · '+state.bellSequence.length+'/4');hudSignature='';updateHUD();return;}if(entity.type==='workshop'||entity.type==='mailbox'){const lamps=entity.type==='workshop',id=lamps?'lights':'letters',done=state.projects.includes(id),ready=projectCount(state,lamps?'fuse':'postcard')===3;commonsMessage(lamps?W.workshop:W.mailbox,done?(lamps?W.workshopDone:W.mailboxDone):(lamps?W.workshopNeed:W.mailboxNeed),!done&&ready?{label:lamps?W.repair:W.deliver,run:()=>{finishProject(state,id);save();engine.refreshScenery();audio.tone('success');commonsMessage(lamps?W.workshop:W.mailbox,lamps?W.workshopDone:W.mailboxDone);}}:null);}}
function showPause(){if(!playing)return;openModal(root=>root.append(tnode('div','edition','modal-kicker'),tnode('h2','pauseTitle'),tnode('p','pauseBody','body-copy'),h('div',{class:'choice-list'},button(tr('continue'),closeModal,'btn primary'),button(tr('settings'),showSettings),button(tr(W.return),goCommons),button(tr('export'),exportSave),button(tr(D.gallery),showGallery),button(tr(DETAIL_UI.archive),()=>showJournal('details')),button(tr(MT.title),showMusic),button(tr(ENDINGS[4].name),()=>confirmEnding(ENDINGS[4])),button(tr('mainMenu'),titleScreen,'choice',{'data-main-menu':'true'}))),{clock:true});}
function settingsRow(title,desc,control){return h('label',{class:'settings-row'},h('span',{},tr(title),desc?h('small',{},tr(desc)):null),control);}
function showSettings(){
 openModal(root=>{
  root.append(tnode('div','edition','modal-kicker'),tnode('h2','settings'));
  const lang=h('select',{'aria-label':tr('language'),onChange:()=>{settings.language=lang.value;storeSettings();translate();showSettings();}});for(const l of LANGUAGES)lang.append(h('option',{value:l.id},l.name));lang.value=settings.language;root.append(settingsRow('language',null,lang));
  const sound=h('input',{type:'checkbox',checked:settings.sound,onChange:()=>{settings.sound=sound.checked;audio.set(settings.sound,settings.volume);storeSettings();translate();}});root.append(settingsRow('sound','soundDesc',sound));
  const volume=h('input',{type:'range',min:0,max:1,step:.05,value:settings.volume,'aria-label':tr('sound'),onInput:()=>{settings.volume=Number(volume.value);audio.set(settings.sound,settings.volume);storeSettings();}});root.append(settingsRow('sound',null,volume));
  const quality=h('select',{'aria-label':tr('quality'),onChange:()=>{settings.quality=quality.value;engine.recommend(benchmark?.quality);storeSettings();}});for(const value of ['auto','high','low'])quality.append(h('option',{value},tr(value)));quality.value=settings.quality;root.append(settingsRow('quality',null,quality),button(tr(BT.menu),()=>showBenchmark(showSettings),'btn secondary'));
  const mode=h('select',{'aria-label':tr(INPUT.inputMode),onChange:()=>{settings.inputMode=mode.value;storeSettings();syncInputMode();}});for(const value of ['hybrid','click','joystick'])mode.append(h('option',{value},tr(INPUT[value])));mode.value=settings.inputMode;root.append(settingsRow(INPUT.inputMode,INPUT.inputHelp,mode));
  const joystickSize=h('input',{type:'range',min:.78,max:1.4,step:.01,value:settings.joystickScale,'aria-label':tr(INPUT.joystickSize),onInput:()=>{settings.joystickScale=Number(joystickSize.value);storeSettings();syncInputMode();}});root.append(settingsRow(INPUT.joystickSize,INPUT.joystickSizeHelp,joystickSize));
  const avatar=h('select',{'aria-label':tr(INPUT.avatarTone),onChange:()=>{settings.avatarTone=avatar.value;storeSettings();engine.render();}});for(const value of ['classic','ember','ocean','mono'])avatar.append(h('option',{value},tr(INPUT[value])));avatar.value=settings.avatarTone;root.append(settingsRow(INPUT.avatarTone,INPUT.avatarHelp,avatar));
  const accent=h('select',{'aria-label':tr(INPUT.accent),onChange:()=>{settings.accent=accent.value;storeSettings();applyTheme();}});for(const value of ['green','amber','blue','violet'])accent.append(h('option',{value},tr(INPUT[value])));accent.value=settings.accent;root.append(settingsRow(INPUT.accent,INPUT.accentHelp,accent));
  const horror=h('select',{'aria-label':tr(D.horror),onChange:()=>{settings.horror=horror.value;storeSettings();}});for(const value of ['mild','cinematic'])horror.append(h('option',{value},tr(D[value])));horror.value=settings.horror;root.append(settingsRow(D.horror,D.horrorHelp,horror));
  const veil=h('input',{type:'checkbox',checked:settings.pixelVeil,onChange:()=>{settings.pixelVeil=veil.checked;storeSettings();}});root.append(settingsRow(D.mosaic,null,veil));
  for(const [key,title,desc]of [['reducedMotion','motion',null],['calm','calm','calmDesc']]){const input=h('input',{type:'checkbox',checked:settings[key],onChange:()=>{settings[key]=input.checked;storeSettings();translate();}});root.append(settingsRow(title,desc,input));}
  const size=h('select',{'aria-label':tr('textSize'),onChange:()=>{settings.textSize=Number(size.value);storeSettings();translate();}});for(const value of [1,1.1,1.2])size.append(h('option',{value},Math.round(value*100)+'%'));size.value=settings.textSize;root.append(settingsRow('textSize',null,size));
  root.append(h('div',{class:'modal-actions'},button(tr('export'),exportSave,'btn secondary',{disabled:!state}),button(tr('import'),importSave),button(tr('next'),closeModal,'btn primary')));
 },{clock:true});
}
function showMusic(){openModal(root=>{musicUI=new MusicUI({container:root,audio,settings,onSettings:storeSettings,onToggle:()=>{settings.sound=!settings.sound;audio.set(settings.sound,settings.volume);storeSettings();translate();},onSaved:()=>toast(tr(MT.saved))});},{clock:true});}
function exportSave(){if(!state)return;save();const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=h('a',{href:url,download:'last-buyer-save.json'});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function importSave(){const input=h('input',{type:'file',accept:'.json,application/json'});input.addEventListener('change',async()=>{const file=input.files?.[0];if(!file)return;if(file.size>200000){toast(tr('invalidSave'));return;}try{const candidate=validateState(JSON.parse(await file.text()));if(!candidate){toast(tr('invalidSave'));return;}openModal(root=>root.append(tnode('h2','import'),tnode('p','overwrite','body-copy'),h('div',{class:'modal-actions'},button(tr('cancel'),closeModal),button(tr('confirm'),()=>{state=candidate;session++;closeModal();save();enterGame();loadChapter(false);if(state.ending)showEnding(state.ending);toast(tr('restore'));},'btn primary'))));}catch{toast(tr('invalidSave'));}});input.click();}
let lastClock=performance.now(),saveClock=0;setInterval(()=>{const now=performance.now(),dt=Math.min(1.5,(now-lastClock)/1000);lastClock=now;if(playing&&state&&!document.hidden&&!clockPaused&&!displayBlocked){state.playSeconds+=dt;saveClock+=dt;if(saveClock>10){save();saveClock=0;}}if(playing)updateHUD();},500);
function animateTitle(now){requestAnimationFrame(animateTitle);if(playing||modalOpen||document.hidden||now-titleLast<80)return;titleLast=now;drawTitle($('title-canvas').getContext('2d',{alpha:false}),now/1000,settings.reducedMotion);}
translate();$('continue-game').hidden=!state;requestAnimationFrame(animateTitle);
