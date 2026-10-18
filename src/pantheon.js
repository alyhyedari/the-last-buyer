import {MYTH_BOSSES} from './frontier-myth-data.js';
import {hasGme} from './frontier-perks.js';
import {clearSight} from './frontier-world.js';
export const bossMaxHp=(f,b)=>(f.life.pantheon.trials[b.id]?.mode??(f.life.combat.actors['boss-'+b.id]?'standard':f.life.pantheon.mode))==='endurance'?90000+b.variant*3000:b.hp;
export function startTrial(f,b){return f.life.pantheon.trials[b.id]??=({mode:f.life.combat.actors['boss-'+b.id]?'standard':f.life.pantheon.mode,seconds:0,phase:1,turn:0,seals:0,supply:0});}
export function trialSeals(f,world){const b=MYTH_BOSSES.find(b=>b.id===world.arena?.id),t=b&&f.life.pantheon.trials[b.id];if(!t||t.mode!=='endurance')return[];return [0,1,2].filter(i=>!(t.seals&(1<<i))).map(i=>{const a=i*Math.PI*2/3+t.phase*.45;return{id:'trial-seal-'+b.id+'-'+i,kind:'trialSeal',x:b.x+Math.cos(a)*5.7,y:b.y+Math.sin(a)*5.7,seal:i,bossId:b.id,variant:i,scenery:true,hp:1,maxHp:1};});}
export function breakTrialSeal(state,world,actor){const f=state.frontier,t=f.life.pantheon.trials[actor.bossId];if(!t||t.mode!=='endurance'||world.arena?.id!==actor.bossId||!Number.isInteger(actor.seal)||actor.seal<0||actor.seal>2||t.seals&(1<<actor.seal)||!clearSight(world,f,actor))return null;
 t.seals|=1<<actor.seal;f.life.health=Math.min(100,f.life.health+12);f.energy=Math.min(100,f.energy+25);f.life.ammo=Math.min(500,f.life.ammo+24);f.life.combat.shells=Math.min(500,f.life.combat.shells+6);return{kind:'enemyHit',target:actor.id,victim:'trialSeal',damage:1,hp:0,maxHp:1,killed:true};
}
export function tickTrial(state,b,phase,dt){const f=state.frontier,t=startTrial(f,b);t.seconds=Math.min(1e7,t.seconds+Math.max(0,Math.min(.1,dt)));if(t.phase!==phase){t.phase=phase;t.seals=0;}
 if(t.mode==='endurance'&&t.seconds-t.supply>=45){t.supply=t.seconds;f.life.ammo=Math.min(500,f.life.ammo+30);f.life.combat.shells=Math.min(500,f.life.combat.shells+8);f.life.combat.rockets=Math.min(99,f.life.combat.rockets+2);f.energy=Math.min(100,f.energy+25);}
 return t;
}
export function setTrialMode(f,mode){if(!['standard','endurance'].includes(mode)||f.life.combat.arena)return false;f.life.pantheon.mode=mode;return true;}
export function activateGodPower(state,world,id){const f=state.frontier,p=f.life.pantheon;if(!hasGme(f,id)||f.minutes<p.powerReady||world.interior)return false;
 p.power=id;p.powerReady=f.minutes+90;
 if(id==='iron')f.life.expanse.carHealth=Math.min(100,f.life.expanse.carHealth+45);
 else if(id==='mirror'){f.life.combat.dodgeUntil=f.minutes+5;}
 else if(id==='gravity'||id==='frost')p.slowUntil=world.godSlowUntil=f.minutes+(id==='frost'?18:12);
 else if(id==='thorn')f.life.health=Math.min(100,f.life.health+45);
 else if(id==='oracle'){f.life.forest.pulseUntil=f.minutes+22;f.life.forest.pulseX=f.x;f.life.forest.pulseY=f.y;}
 else if(id==='plague'){f.life.impairedUntil=0;f.soberAt=0;f.life.health=Math.min(100,f.life.health+20);}
 else if(id==='sun')p.dayUntil=world.daylightUntil=f.minutes+120;
 else if(id==='moon')p.hiddenUntil=world.godHiddenUntil=f.minutes+18;
 else if(id==='ledger'){f.life.debts=Math.max(0,f.life.debts-120);f.life.heat=Math.max(0,f.life.heat-25);}
 else if(id==='genesis'){f.life.neon.reliefUntil=f.minutes+1440;f.life.neon.stability=Math.min(9,f.life.neon.stability+2);}
 else {f.energy=100;f.life.health=Math.min(100,f.life.health+15);}
 return true;
}
