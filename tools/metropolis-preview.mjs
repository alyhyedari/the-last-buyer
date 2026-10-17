// Local QA only: ordinary visible controls, isolated in-memory progress, no player-save writes.
import {createStaticServer} from '../server.mjs';
const server=await createStaticServer(),normal=server.listeners('request')[0];server.removeAllListeners('request');
server.on('request',(req,res)=>{if(req.url!=='/city-check'){normal(req,res);return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>City and combat · isolated playtest</title><link rel="stylesheet" href="/style.css"><body><style>body:has(.frontier-dialog-backdrop:not([hidden])) .qa-city{display:none}</style>
<main id="app" style="padding:32px;max-width:900px;margin:auto"><h1>City and combat playtest</h1><p>Actual game, isolated test progress. The player's save is never changed.</p><label>Scene <select id="scene"><option value="vista">City skyline</option><option value="station">East Gate / city rail</option><option value="tether">Tether entrance</option><option value="lift">Tether elevator</option><option value="sky">Sky garden / trace</option><option value="apartment">Buy an apartment</option><option value="home">Owned apartment</option><option value="night">City at night</option><option value="car">Car armor</option><option value="boss">Guardian arena</option><option value="boss2">Guardian phase 2</option><option value="boss3">Guardian phase 3</option></select></label> <label>Language <select id="locale"><option value="en">English</option><option value="fa">فارسی</option></select></label> <label><input type="checkbox" id="qa" checked> QA controls</label><p><button class="btn primary" id="start">Start scene</button> <button class="btn secondary" id="resume" disabled>Resume test save</button></p><pre id="report" style="white-space:pre-wrap;overflow-wrap:anywhere" role="status">Ready</pre></main>
<script type="module">
import {newState,defaultSettings,validateState} from '/src/state.js';
import {newFrontierState} from '/src/frontier-state.js';
import {makeFrontierWorld} from '/src/frontier-world.js';
import {enterInterior} from '/src/frontier-interiors.js';
import {rideLift} from '/src/metropolis-actions.js';
import {MYTH_BOSSES} from '/src/frontier-myth-data.js';
import {hostileHit} from '/src/frontier-combat.js';
import {mountFrontier} from '/src/frontier-ui.js';
import {Soundscape} from '/src/audio.js';
import {createBuyAnimation} from '/src/buy-animation.js';
import {setLanguage,direction} from '/src/i18n.js';
let state,saved,ui,qaPanel,liveReport,lastHit='none',buyCount=0;const settings=defaultSettings(),audio=new Soundscape(),report=document.querySelector('#report');settings.inputMode='hybrid';
const buy=createBuyAnimation(()=>settings,()=>audio.tone('click'));
function status(){const f=state.frontier;return {valid:!!validateState(state),scene:document.querySelector('#scene').value,position:{x:+f.x.toFixed(2),y:+f.y.toFixed(2)},money:state.village.money,city:f.life.city,interior:f.life.combat.interior,arena:f.life.combat.arena,health:f.life.health,hull:f.life.expanse.carHealth,mounted:f.mounted,minutes:Math.round(f.minutes),buyCount,lastHit};}
function save(){const valid=validateState(state);if(!valid){report.textContent='INVALID SAVE';return false;}saved=JSON.stringify(valid);document.querySelector('#resume').disabled=false;report.textContent=JSON.stringify(status(),null,2);if(liveReport)liveReport.textContent=report.textContent;return true;}
function launch(resume=false){ui?.dispose();qaPanel?.remove();settings.language=document.querySelector('#locale').value;setLanguage(settings.language);document.documentElement.lang=settings.language;document.documentElement.dir=direction();audio.start();lastHit='none';
 if(resume)state=validateState(JSON.parse(saved));else{state=newState();state.frontier=newFrontierState(91);const f=state.frontier,w=makeFrontierWorld(91),scene=document.querySelector('#scene').value;f.active=true;f.visits=['gate'];f.tutorial=5;f.tutorialHidden=true;f.life.guide.enabled=false;Object.assign(f,{x:230.5,y:124.5,angle:-Math.PI/2,minutes:900});Object.assign(state.village,{money:2000,vehicle:'car',vehicles:['bike','car'],weapon:'rifle',weapons:['pistol','rifle','shotgun','smg','launcher']});f.life.ammo=200;f.life.combat.shells=50;f.life.combat.rockets=12;
 if(scene==='station')Object.assign(f,{x:144.5,y:119.5});
 if(scene==='tether')Object.assign(f,{x:230.5,y:46.5});
 if(scene==='apartment')Object.assign(f,{x:218.5,y:142.5});
 if(['lift','sky','home'].includes(scene)){const b=w.buildings.find(b=>b.id===(scene==='home'?'apartment':'tether'));Object.assign(f,b.door);f.life.city.apartment=scene==='home';let room=enterInterior(state,w,b);Object.assign(f,{x:14,y:5.2,angle:-Math.PI/2});if(scene==='sky'){room=rideLift(state,room,b,'sky');Object.assign(f,{x:7.5,y:5.5,angle:-Math.PI/2});}if(scene==='home')Object.assign(f,{x:8,y:22});}
 if(scene==='night')Object.assign(f,{x:286.5,y:90.5,minutes:1320});
 if(scene==='car'){Object.assign(f,{x:230.5,y:80.5,mounted:true});f.life.expanse.carModel=1;}
 if(scene.startsWith('boss')){f.life.combat.graceUntil=f.minutes+120;const b=MYTH_BOSSES[0];Object.assign(f,{x:b.x,y:b.y+6.8,angle:-Math.PI/2});if(scene!=='boss')f.life.combat.actors['boss-'+b.id]={x:b.x,y:b.y,hp:b.hp*(scene==='boss2'?.6:.25),kind:b.kind,at:f.minutes};}
 }
 ui=mountFrontier({state,settings,audio,onSave:save,onReturn:()=>{qaPanel?.remove();ui=null;},onSettings:()=>{setLanguage(settings.language);document.documentElement.lang=settings.language;document.documentElement.dir=direction();},onBuy:()=>{buyCount++;buy.play();}});
 if(document.querySelector('#qa').checked){qaPanel=document.createElement('aside');qaPanel.className='qa-city';qaPanel.style.cssText='position:fixed;z-index:200;top:115px;left:12px;font:10px monospace;max-width:310px;background:#112328e8;padding:5px;direction:ltr';qaPanel.setAttribute('aria-label','QA controls');const buttons=document.createElement('div');qaPanel.append(buttons);liveReport=document.createElement('pre');liveReport.id='live-report';liveReport.hidden=true;liveReport.style.cssText='white-space:pre-wrap;max-height:160px;overflow:auto';qaPanel.append(liveReport);
 const actions=[['QA status',()=>{liveReport.hidden=!liveReport.hidden;save();}],['QA reset',()=>{ui?.dispose();ui=null;qaPanel.remove();}],['QA enemy hit',()=>{lastHit=hostileHit(state,90,'zombie')?.kind||'protected';save();}],['QA break hull',()=>{lastHit=hostileHit(state,300,'brute')?.kind||'protected';save();}],['QA next phase',()=>{const f=state.frontier,b=MYTH_BOSSES[0],id='boss-'+b.id,old=f.life.combat.actors[id]?.hp??b.hp;f.life.combat.actors[id]={x:b.x,y:b.y,hp:old>b.hp*.65?b.hp*.6:old>b.hp*.3?b.hp*.25:0,kind:b.kind,at:f.minutes};save();}],['QA sunrise',()=>{state.frontier.minutes=7*60;save();}]];
 for(const [label,action] of actions){const b=document.createElement('button');b.textContent=label;b.style.cssText='font:9px monospace;margin:2px;padding:5px';b.addEventListener('click',action);buttons.append(b);}document.body.append(qaPanel);save();}
}
document.querySelector('#start').addEventListener('click',()=>{report.textContent='Loading scene…';setTimeout(()=>launch(),40);});document.querySelector('#resume').addEventListener('click',()=>setTimeout(()=>launch(true),40));
</script></body></html>`);});
server.listen(4186,'127.0.0.1',()=>console.log('City playtest: http://localhost:4186/city-check'));
