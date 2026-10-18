import {makeFrontierWorld} from './frontier-world.js';
import {makeInterior} from './frontier-interiors.js';
import {restoreScenery} from './frontier-expanse.js';
import {worldActors} from './frontier-life.js';
import {FrontierRenderer} from './frontier-renderer.js';
import {clockLabel} from './frontier-state.js';
import {mythText} from './frontier-myth-text.js';
import {h} from './dom.js';

// This is an isolated reconstruction. Rendering must never advance the save,
// consume ammunition, move its traffic, or expose the player to attacks.
export function createSavedPreview(state,settings,canvas){
 const snapshot=structuredClone(state),f=snapshot.frontier,outdoor=makeFrontierWorld(f.seed);
 restoreScenery(outdoor,f);const home=f.life.combat.interior,building=home&&outdoor.buildings.find(b=>b.id===home.id),world=building?makeInterior(building,f.seed,{floor:home.floor,theme:f.life.city.theme}):outdoor;
 const buffer=document.createElement('canvas'),renderer=new FrontierRenderer(buffer,world,{...settings,reducedMotion:true}),actors=worldActors(world,f,f.minutes/1.2);
 const label=h('p',{class:'saved-world-note'}),stats=h('div',{class:'saved-world-stats',dir:'ltr'},h('bdi',{},'$'+snapshot.village.money),h('bdi',{},'BUY '+f.life.forest.coins.length+'/30'),h('bdi',{},'GME '+f.life.forest.gme.length+'/17'),h('bdi',{},clockLabel(f)));
 const panel=h('div',{class:'saved-world-caption'},label,stats);canvas.parentElement.append(panel);
 renderer.render(snapshot,f.minutes/1.2,{actors});
 function draw(){const c=canvas.getContext('2d',{alpha:false});c.imageSmoothingEnabled=false;c.fillStyle='#0a1a24';c.fillRect(0,0,640,440);c.drawImage(buffer,0,32,640,360);c.fillStyle='#abc5ba';c.font='10px monospace';c.textAlign='left';c.fillText('VLAD / '+f.x.toFixed(1)+' : '+f.y.toFixed(1),18,20);c.fillText('BUY '+f.life.forest.coins.length+'/30  /  GME '+f.life.forest.gme.length+'/17',18,420);c.textAlign='right';c.fillText(clockLabel(f),621,420);c.textAlign='left';}
 function translate(){label.textContent=mythText('savedSceneHelp');canvas.setAttribute('aria-label',mythText('savedScene'));}
 translate();return{draw,translate,setVisible(value){panel.hidden=!value;},dispose(){panel.remove();}};
}
