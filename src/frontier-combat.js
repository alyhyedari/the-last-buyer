import {hitBuilding} from './building-access.js';
import {activeCyber} from './cyber-systems.js';
import {bossMaxHp,breakTrialSeal} from './pantheon.js';
import {terrainSight,terrainHeight,terrainSlope} from './frontier-terrain.js';
import {MYTH_BOSSES} from './frontier-myth-data.js';
import {resetUnfinishedBosses} from './frontier-encounters.js';
import {nightSchedule,nightKind} from './frontier-night-director.js';
import {magazineRounds,spendMagazine} from './frontier-loadout-state.js';
import {hasBuy,hasGme} from './frontier-perks.js';
import {uvTouches} from './frontier-myth.js';
import {forestWard} from './frontier-forest-state.js';
import {isScenery,restoreScenery,damageCar,parkCar} from './frontier-expanse.js';
import {gameDay,isNight,hash,earn,advanceTime,worldTime} from './frontier-state.js';
import {canStand,moveInWorld,clearSight,nearestOpen,localRoute,tileAt} from './frontier-world.js';

export const WEAPONS={
 arc:{damage:38,range:18,delay:.8,spread:.025,ammo:'ammo',chain:2,stun:2,sound:'shot'},
 rail:{damage:150,range:58,delay:1.4,spread:.008,ammo:'ammo',pierce:3,sound:'shot'},
 pulse:{damage:23,range:32,delay:.14,spread:.02,ammo:'ammo',automatic:true,sound:'pistol'},
 monoblade:{damage:44,range:2.2,delay:.3,spread:.06,ammo:null,sound:'bump'},
 stick:{damage:26,range:1.9,delay:.46,spread:.08,ammo:null,sound:'bump'},
 bow:{damage:65,range:25,delay:.8,spread:.014,ammo:'ammo',sound:'bow'},
 pistol:{damage:34,range:30,delay:.29,spread:.024,ammo:'ammo',sound:'pistol'},
 rifle:{damage:90,range:42,delay:.65,spread:.014,ammo:'ammo',sound:'shot'},
 shotgun:{damage:24,range:16,delay:.85,spread:.16,ammo:'shells',pellets:5,sound:'shotgun'},
 smg:{damage:19,range:26,delay:.115,spread:.035,ammo:'ammo',automatic:true,sound:'pistol'},
 launcher:{damage:135,range:36,delay:1.2,ammo:'rockets',projectile:'rocket',blast:3.3,sound:'launch'},
 grenade:{damage:105,range:12,delay:1,ammo:'grenades',projectile:'grenade',blast:2.8,sound:'bow'}
};
export const HOSTILES={"zombie":{"hp":95,"speed":0.7,"damage":12,"reach":1,"delay":1.4,"notice":12},"jinn":{"hp":72,"speed":1.45,"damage":10,"reach":1.1,"delay":1.25,"notice":14},"vampire":{"hp":150,"speed":2.1,"damage":19,"reach":1,"delay":1.7,"notice":15},"watcher":{"hp":210,"speed":0.52,"damage":26,"reach":1.4,"delay":2.1,"notice":11},"robber":{"hp":85,"speed":1.35,"damage":9,"reach":1,"delay":1.2,"notice":9},"sentinel":{"hp":170,"speed":1.1,"damage":14,"reach":1.4,"delay":1.8,"notice":15},"ufoEnemy":{"hp":240,"speed":0.8,"damage":15,"reach":9,"delay":2.6,"notice":20}};
Object.assign(HOSTILES,{runner:{hp:115,speed:2.9,damage:13,reach:1.1,delay:1.6,notice:22},brute:{hp:290,speed:.65,damage:30,reach:1.6,delay:2.6,notice:15}});
for(const b of MYTH_BOSSES)HOSTILES[b.kind]={hp:b.hp,speed:b.speed,damage:b.damage,reach:2,delay:3,notice:24};Object.assign(HOSTILES,{shade:{hp:110,speed:2.5,damage:14,reach:1.2,delay:1.9,notice:18},spore:{hp:145,speed:.5,damage:17,reach:5,delay:2.8,notice:14},wisp:{hp:85,speed:1.8,damage:12,reach:1.3,delay:1.4,notice:14},briar:{hp:180,speed:.8,damage:21,reach:1.5,delay:2,notice:12},moth:{hp:65,speed:2.2,damage:8,reach:1.2,delay:1.2,notice:17}});
export const actorMaxHealth=s=>HOSTILES[s.kind]?.hp||({tree:110,trafficCar:300,trafficBike:90,trafficMotor:140,bench:55,streetlamp:55,sign:50,laundry:30,crystal:160,relic:240,ufoFriend:240,mossling:90,rabbit:22,fox:40,owl:26,heron:30,bird:16,deer:60,boar:115,horse:150,dog:60,cat:35}[s.kind]||100);
export const ammoCount=(f,weapon)=>{const key=WEAPONS[weapon]?.ammo;return key==='ammo'?f.life.ammo:key?f.life.combat[key]:Infinity;};
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function bulletSight(world,a,b){if(!clearSight(world,a,b)||!terrainSight(world,a,b))return false;const d=distance(a,b);if(!d)return true;const rx=(b.x-a.x)/d,ry=(b.y-a.y)/d,blocked=c=>{const dx=c.x-a.x,dy=c.y-a.y,depth=dx*rx+dy*ry;return depth>.15&&depth<d-.36&&Math.abs(dx*ry-dy*rx)<c.radius;};
 if(!world.spatialCollision)return !(world.colliders||[]).some(blocked);
 const visited=new Set();for(let n=0;n<=Math.ceil(d);n++){const x=Math.floor(a.x+rx*Math.min(n,d)),y=Math.floor(a.y+ry*Math.min(n,d));for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+1;xx++){const key=xx+','+yy;if(visited.has(key))continue;visited.add(key);if((world.buckets.get(key)||[]).some(blocked))return false;}}return true;
}
export function targetUnderCrosshair(f,world,actors,weapon='pistol',angle=f.angle){
 const config=WEAPONS[weapon]||WEAPONS.pistol,ray={x:Math.cos(angle),y:Math.sin(angle)};
 // Classic vertical assistance: horizontal alignment and real cover decide hits.
 return actors.filter(s=>s.kind!=='playerGhost'&&!s.dead&&(s.animal||isScenery(s)||s.alien||HOSTILES[s.kind]||['resident','companion','target','trialSeal'].includes(s.kind))).map(s=>{const dx=s.x-f.x,dy=s.y-f.y;return{s,depth:dx*ray.x+dy*ray.y,side:Math.abs(dx*ray.y-dy*ray.x)};}).filter(o=>o.depth>0&&o.depth<config.range&&o.side<(o.s.kind==='target'?.4:o.s.kind==='rabbit'?.24:.34)+o.depth*Math.min(.034,config.spread||.014)&&bulletSight(world,f,o.s)).sort((a,b)=>a.depth-b.depth)[0]?.s||null;
}
function remember(f,s,hp){const records=f.life.combat.actors;if(Object.keys(records).length>=480&&!records[s.id]){for(const [id,a]of Object.entries(records)){if(id.startsWith('night-')&&f.minutes-a.at>1440)delete records[id];}}
 records[s.id]={x:s.x,y:s.y,hp:Math.max(0,hp),kind:s.kind,at:f.minutes};
}
export function actorWithHealth(f,s){if(s.owned)return{...s,hp:f.life.expanse.carHealth*3,maxHp:300,dead:f.life.expanse.carHealth<=0,scenery:true};const boss=MYTH_BOSSES.find(b=>'boss-'+b.id===s.id),max=boss?bossMaxHp(f,boss):actorMaxHealth(s),record=f.life.combat.actors[s.id],hp=record?.hp??max;return{...s,...(hp<=0&&record?{x:record.x,y:record.y}:{}),hp,maxHp:max,dead:hp<=0,scenery:isScenery(s)};}
export function damageActor(state,world,s,damage,{crime=true}={}){
 // Network echoes never enter combat, even if a future caller passes visual records.
 if(s.kind==='playerGhost')return null;
 if(s.kind==='trialSeal')return breakTrialSeal(state,world,s);if(s.peaceful||s.kind==='child')return null;const f=state.frontier,l=f.life,current=s.owned?l.expanse.carHealth*3:l.combat.actors[s.id]?.hp??s.hp??actorMaxHealth(s);if(current<=0||damage<=0)return null;
 if(s.boss||s.id?.startsWith('boss-')){const t=f.life.pantheon.trials[s.id.slice(5)];damage*=t?.mode==='endurance'?(t.seals===7?(uvTouches(f,world,s)?1.6:1):.12):(uvTouches(f,world,s)?1.3:.65);}const hp=Math.max(0,current-damage),killed=hp===0;remember(f,s,hp);
 if(s.owned)l.expanse.carHealth=hp/3;const scenery=isScenery(s);if(s.alien){l.expanse.alienTrust=Math.max(-12,l.expanse.alienTrust-2);world.alienAlertUntil=f.minutes+30;}
 const protectedTarget=s.domestic||['resident','companion'].includes(s.kind);
 if(protectedTarget&&crime){l.heat=Math.min(100,l.heat+40);l.debts=Math.min(99999,l.debts+60);state.village.reputation=Math.max(-9,state.village.reputation-2);f.trust=Math.max(0,f.trust-1);l.companion=false;}
 if(killed&&scenery)restoreScenery(world,f);if(scenery&&!s.owned&&s.kind.startsWith('traffic')&&crime){l.heat=Math.min(100,l.heat+12);l.debts=Math.min(99999,l.debts+25);}
 if(killed&&!scenery){l.combat.kills++;if(s.id?.startsWith('animal-')&&!l.hunted.includes(s.id)){l.hunted.push(s.id);f.energy=Math.min(100,f.energy+8);}if(s.id==='companion-pet')l.pet=null;if(s.kind==='robber')l.robberDay=gameDay(f);if(HOSTILES[s.kind]){earn(state,(6+Math.floor(actorMaxHealth(s)/15))*(hasBuy(f,28)?1.25:1));if(hasBuy(f,7))l.ammo=Math.min(500,l.ammo+1);if(hasBuy(f,23))l.health=Math.min(100,l.health+3);}l.skills=Math.min(100,l.skills+2);}
 const effect={kind:scenery||s.alien||['sentinel','ufoEnemy'].includes(s.kind)?'sparks':'blood',x:s.x,y:s.y,age:0,ttl:killed?1.1:.65,seed:l.combat.kills+Math.round(f.minutes),victim:s.kind};(world.effects??=[]).push(effect);if(world.effects.length>32)world.effects.shift();
 if(world.hunters?.has(s.id))world.hunters.get(s.id).alert=true;
 return{kind:scenery?(killed?'objectBroken':'objectHit'):s.alien?'alienAngered':protectedTarget?'protectedShot':killed?(s.animal?'huntResult':'enemyDown'):'enemyHit',target:s.id,victim:s.kind,killed,hp,maxHp:actorMaxHealth(s),close:distance(f,s)<2.5,damage:current-hp,x:s.x,y:s.y};
}
export function shoot(state,world,actors,{aiming=false}={}){
 const f=state.frontier,l=f.life,weapon=state.village.weapon,c=WEAPONS[weapon];if(l.expanse.swimming||f.mounted||!c||f.minutes<Math.max(l.impairedUntil,f.soberAt))return{kind:'cannotShoot'};if(ammoCount(f,weapon)<=0)return{kind:'noAmmo'};if(magazineRounds(f,weapon,ammoCount(f,weapon))<=0)return{kind:'reloadNeeded'};
 l.forest.shots++;const damagePower=(aiming&&hasBuy(f,5)?1.2:1)*(hasBuy(f,16)&&l.forest.shots%5===0?1.6:1)*(hasGme(f,'storm')?1.25:1);if(!(hasBuy(f,20)&&l.forest.shots%4===0)){if(c.ammo==='ammo')l.ammo--;else if(c.ammo)l.combat[c.ammo]--;spendMagazine(f,weapon);}
 if(c.projectile){const p={id:(world.shotSerial=(world.shotSerial||0)+1),kind:c.projectile,x:f.x,y:f.y,angle:f.angle,age:0,speed:c.projectile==='rocket'?16:8,ttl:c.projectile==='rocket'?2.2:1.25,blast:c.blast,damage:c.damage*damagePower,height:.55,z:world.interior?.55:terrainHeight(f.x,f.y)+.55,vz:world.interior?0:terrainSlope(f.x,f.y,f.angle)};const target=targetUnderCrosshair(f,world,actors,weapon);if(target&&!world.interior)p.vz=(terrainHeight(target.x,target.y)+.65-p.z)/Math.max(1,distance(f,target));(world.projectiles??=[]).push(p);return{kind:'projectile',weapon};}
 const hits=[],penalized=new Set();for(let n=0;n<(c.pellets||1);n++){const offset=c.pellets?(n-2)*c.spread/4:0,s=targetUnderCrosshair(f,world,actors,weapon,f.angle+offset);if(!s)continue;if(s.kind==='target'){l.skills=Math.min(100,l.skills+1);hits.push({kind:'targetHit',target:s.id,victim:'target',hp:100,maxHp:100});continue;}
  const damage=damageActor(state,world,s,c.damage*damagePower*(c.pellets?Math.max(.3,1-distance(f,s)/24):1),{crime:!penalized.has(s.id)});penalized.add(s.id);if(damage)hits.push(damage);
  if(c.stun&&world.hunters?.has(s.id))world.hunters.get(s.id).stunnedUntil=f.minutes+c.stun;
  if(c.chain||c.pierce){const extra=actors.filter(a=>a.id!==s.id&&!a.dead&&a.hostile&&bulletSight(world,f,a)&&(c.chain?distance(s,a)<4:distance(f,a)<c.range&&Math.abs(Math.atan2(Math.sin(Math.atan2(a.y-f.y,a.x-f.x)-f.angle),Math.cos(Math.atan2(a.y-f.y,a.x-f.x)-f.angle)))<.025)).sort((a,b)=>distance(f,a)-distance(f,b)).slice(0,c.chain||c.pierce-1);for(const a of extra){const hit=damageActor(state,world,a,c.damage*damagePower*(c.chain?.6:.75),{crime:false});if(hit)hits.push(hit);if(c.stun&&world.hunters?.has(a.id))world.hunters.get(a.id).stunnedUntil=f.minutes+c.stun;}}
 }
 if(!hits.length){const hit=shootFacade(state,world,c.range,c.damage);if(hit)hits.push(hit);}const best=hits.find(s=>s.killed)||hits[0];return best?{...best,hits,weapon}:{kind:'miss',weapon};
}
export function dropOnDeath(state){
 const f=state.frontier,l=f.life,c=l.combat,v=state.village,where=c.interior?.outside||(l.expanse.swimming?l.expanse.shore:null)||f;
 if(f.mounted&&v.vehicle==='car')parkCar(state);const drop={id:++c.serial,x:where.x,y:where.y,money:v.money-(hasBuy(f,29)?Math.floor(v.money*.2):0),weapons:[...v.weapons],ammo:l.ammo,shells:c.shells,rockets:c.rockets,grenades:c.grenades,campKit:l.campKit,contraband:l.contraband};
 // Keep every possession recoverable even after repeated deaths: merge the oldest satchel.
 const occupied=drop.money||drop.weapons.length||drop.ammo||drop.shells||drop.rockets||drop.grenades||drop.campKit||drop.contraband;
 if(occupied){if(c.drops.length>=8){const oldest=c.drops.shift();for(const key of ['money','ammo','shells','rockets','grenades','contraband'])drop[key]+=oldest[key];drop.weapons=[...new Set([...oldest.weapons,...drop.weapons])];drop.campKit||=oldest.campKit;}c.drops.push(drop);}c.deaths++;v.money=hasBuy(f,29)?Math.floor(v.money*.2):0;v.weapons=[];v.weapon='none';l.ammo=0;c.shells=0;c.rockets=0;c.grenades=0;l.campKit=false;l.contraband=0;c.interior=null;
 resetUnfinishedBosses(f);l.forest.pulseUntil=0;l.forest.readyAt=0;
 l.cyber.passengers=[];l.expanse.swimming=false;l.expanse.depth=0;l.expanse.oxygen=100;f.x=32.5;f.y=57.5;f.angle=-Math.PI/2;f.mounted=false;l.health=100;l.companion=false;advanceTime(f,60);f.energy=100;c.graceUntil=f.minutes+60;return drop;
}
export function hurtPlayer(state,amount,{ignoreGrace=false,bypassVehicle=false}={}){
 const f=state.frontier;if(!Number.isFinite(amount)||amount<=0)return false;
 if(!ignoreGrace&&(f.minutes<f.life.combat.graceUntil||f.minutes<(f.life.combat.dodgeUntil||0)))return false;
 // Car condition represents a 300-point hull. A hit which destroys it ejects
 // the driver; subsequent hits reach Vlad. Bikes and horses have no cabin.
 if(!bypassVehicle&&f.mounted&&state.village.vehicle==='car'&&f.life.expanse.carHealth>0){damageCar(state,amount/3*(activeCyber(f,'aegis')?.45:1));return false;}
 f.life.health=Math.max(0,f.life.health-amount*(activeCyber(f,'aegis')?.45:1)/(1+(f.mounted&&state.village.vehicle==='motorcycle'?(f.life.cyber.tunes[14+f.life.cyber.motor]?.armor||0)*.22:0))*(hasBuy(f,14)?.88:1)*(hasGme(f,'cinder')?.85:1));if(f.life.health>0)return false;dropOnDeath(state);return true;
}
export function hostileHit(state,amount,victim){
 const f=state.frontier,hp=f.life.health,hull=f.life.expanse.carHealth,died=hurtPlayer(state,amount);
 if(died)return{kind:'died',victim};
 if(f.life.expanse.carHealth<hull)return{kind:f.life.expanse.carHealth<=0?'carBroken':'carHit',victim};
 return f.life.health<hp?{kind:'attacked',victim}:null;
}
export function dodgeStep(state,world,{forward=0,strafe=0}={}){
 const f=state.frontier;if(f.mounted||f.life.expanse.swimming||f.energy<8||f.minutes<(world.dodgeReadyAt||0))return false;
 const angle=forward||strafe?f.angle+Math.atan2(strafe,forward):f.angle+Math.PI,before={x:f.x,y:f.y};
 moveInWorld(world,f,Math.cos(angle)*2.1,Math.sin(angle)*2.1,.22);if(distance(before,f)<.15)return false;
 f.energy-=8;f.life.combat.dodgeUntil=f.minutes+.34;world.dodgeReadyAt=f.minutes+1.9;return true;
}
export function recoverDrop(state,id){const f=state.frontier,c=f.life.combat,index=c.drops.findIndex(d=>d.id===id);if(index<0||c.interior||distance(f,c.drops[index])>1.7)return false;const d=c.drops[index],v=state.village;let changed=false;
 const transfer=(key,to,max)=>{const count=Math.min(d[key],max-to[key]);to[key]+=count;d[key]-=count;changed||=count>0;};transfer('money',v,999999);transfer('ammo',f.life,500);transfer('contraband',f.life,30);for(const key of ['shells','rockets','grenades'])transfer(key,c,key==='shells'?500:99);
 if(d.weapons.length){v.weapons=[...new Set([...v.weapons,...d.weapons])];if(v.weapon==='none')v.weapon=d.weapons.find(w=>WEAPONS[w])||d.weapons[0]||'none';d.weapons=[];changed=true;}if(d.campKit){f.life.campKit=true;d.campKit=false;changed=true;}
 if(!d.money&&!d.ammo&&!d.shells&&!d.rockets&&!d.grenades&&!d.contraband)c.drops.splice(index,1);return changed;
}
export function vehicleStrike(state,world,actor,speed){if(actor.kind==='playerGhost')return null;if(!state.frontier.mounted||Math.abs(speed)<1.9||actor.dead)return null;const mass={bike:8,horse:11,motorcycle:17,car:28}[state.village.vehicle]||8,result=damageActor(state,world,actor,Math.max(4,(Math.abs(speed)-1)*mass));if(result){const hit=hostileHit(state,Math.min(28,Math.abs(speed)*2),actor.kind);return{...result,playerDied:hit?.kind==='died',hullHit:hit?.kind==='carHit'||hit?.kind==='carBroken'};}return null;}
export function recoverVehicle(world,position,lastSafe,radius){
 // A recovery never crosses a wall or teleports to a distant default spawn.
 for(const candidate of [lastSafe,...Array.from({length:16},(_,i)=>({x:position.x+Math.cos(i*Math.PI/8)*.7,y:position.y+Math.sin(i*Math.PI/8)*.7}))])if(candidate&&distance(position,candidate)<2&&canStand(world,candidate.x,candidate.y,radius)&&clearSight(world,position,candidate)){const trial={x:position.x,y:position.y};moveInWorld(world,trial,candidate.x-position.x,candidate.y-position.y,radius);if(distance(trial,candidate)>.03)continue;Object.assign(position,trial);return true;}return false;
}
export function nightPopulation(f){const h=Math.floor(f.minutes/60)%24;return h>=7&&h<18&&f.life.heat<40?1:h>=18&&h<21&&f.life.heat<40?.35:0;}
export function enemyActors(world,f,time){
 if(world.interior||world.arena)return[];
 const hunters=world.hunters??=new Map(),day=gameDay(f),night=isNight(f),list=[];
 for(const zone of nightSchedule(f,night))for(let n=0;n<zone.count;n++){
  const id='night-'+day+'-'+zone.index+'-'+n,kind=nightKind(zone,n,day,night);
  if(kind==='robber'&&f.life.robberDay===day)continue;
  let p=hunters.get(id);
  if(!p){
   const a=hash(f.seed,zone.index*9+n+day)*6.28,r=3+n%4*1.3,start=nearestOpen(world,{x:zone.x+Math.cos(a)*r,y:zone.y+Math.sin(a)*r},.25),saved=f.life.combat.actors[id];
   p={...(saved&&canStand(world,saved.x,saved.y,.25)?saved:start),id,kind,homeX:start.x,homeY:start.y,at:time,path:[],repath:0,nextAttack:0,alert:false,lastSeen:0};hunters.set(id,p);
  }
  list.push(actorWithHealth(f,{id,kind,x:p.x,y:p.y,hostile:true,height:kind==='ufoEnemy'?2:0,phase:zone.index+n,variant:n%3,winding:!!p.windup}));
 }
 const active=new Set(list.map(a=>a.id));for(const [id,p]of hunters)if(id.startsWith('night-')&&!active.has(id)){p.alert=false;p.windup=0;p.path=[];}
 for(const [id,p]of hunters)if(id.startsWith('night-')&&(!id.startsWith('night-'+day+'-')||Math.hypot(p.x-f.x,p.y-f.y)>70))hunters.delete(id);
 return list;
}
export function updateThreats(state,world,actors,dt,time){
 const f=state.frontier,events=[];if(world.interior||f.life.expanse.swimming)return events;
 for(const s of actors.filter(s=>s.kind!=='playerGhost'&&s.hostile&&!s.boss&&!s.dead).sort((a,b)=>distance(f,a)-distance(f,b)).slice(0,12)){
  const rule=HOSTILES[s.kind],p=world.hunters?.get(s.id);if(!rule||!p)continue;
  if(f.minutes<(p.stunnedUntil||0)){p.windup=0;continue;}
  if(forestWard(f,p)){p.windup=0;p.path=[];p.repath=0;continue;}
  const d=distance(f,p);if(d>32){p.alert=false;p.windup=0;continue;}
  const visible=!activeCyber(f,'ghost')&&f.minutes>=(world.godHiddenUntil||0)&&d<rule.notice*(hasBuy(f,4)?.8:1)&&bulletSight(world,p,f),noise=world.panic&&world.panic.until>f.minutes&&distance(p,world.panic)<rule.notice*1.25;
  if(visible||noise){p.alert=true;p.lastSeen=time;p.lastKnown=visible?{x:f.x,y:f.y}:{x:world.panic.x,y:world.panic.y};}
  if(p.alert&&time-p.lastSeen>9){p.alert=false;p.windup=0;p.path=[];p.lastKnown=null;}
  if(!p.alert)continue;
  if(d<rule.reach+.2&&visible&&time>=p.nextAttack){
   if(!p.windup){p.windup=time+(s.kind==='spore'||s.kind==='brute'?1.15:s.kind==='shade'?.9:s.kind==='runner'?.5:.65);events.push({kind:'windup',victim:s.kind});}
   if(time<p.windup)continue;
   p.windup=0;p.nextAttack=time+rule.delay;
   const hit=hostileHit(state,rule.damage,s.kind);if(hit){if(s.kind==='vampire'&&hit.kind==='attacked')remember(f,s,Math.min(rule.hp,s.hp+12));events.push(hit);if(hit.kind==='died')return events;}continue;
  }
  p.windup=0;
  if(d>rule.reach){
   const known=p.lastKnown||p;
   if(time>=p.repath){const flank=visible&&['jinn','shade','runner'].includes(s.kind)&&d>2?{x:known.x+Math.sin(time+s.phase)*1.3,y:known.y+Math.cos(time+s.phase)*1.3}:known;
    const nextPath=localRoute(world,p,canStand(world,flank.x,flank.y,.25)?flank:known,.25);
    if(nextPath!==null){p.path=nextPath;p.repath=time+.8+hash(f.seed,s.id.length)*.5;}
   }
   while(p.path.length&&distance(p,p.path[0])<.15)p.path.shift();const goal=p.path[0];
   if(goal){const a=Math.atan2(goal.y-p.y,goal.x-p.x),speed=rule.speed*(f.minutes<(world.godSlowUntil||0)?.5:1)*(s.kind==='vampire'&&Math.sin(time*1.7)>.65?1.6:1);moveInWorld(world,p,Math.cos(a)*dt*speed,Math.sin(a)*dt*speed,.25);const saved=f.life.combat.actors[s.id];if(saved&&saved.hp>0){saved.x=p.x;saved.y=p.y;}}
  }
 }
 return events;
}
export function updateProjectiles(state,world,actors,dt){
 const events=[],f=state.frontier;for(const p of world.projectiles||[]){p.age+=dt;let blocked=false;const steps=Math.max(1,Math.ceil(p.speed*dt/.1));for(let i=0;i<steps;i++){const old={x:p.x,y:p.y},move=p.speed*dt/steps;moveInWorld(world,p,Math.cos(p.angle)*move,Math.sin(p.angle)*move,.07);if(p.kind==='rocket'){p.z=(p.z??(terrainHeight(old.x,old.y)+.55))+(p.vz||0)*move;p.height=p.z-(world.interior?0:terrainHeight(p.x,p.y));if(p.height<.08){blocked=true;break;}}if(distance(old,p)<move*.5){blocked=true;break;}if(p.age>.07&&actors.some(a=>a.kind!=='playerGhost'&&!a.dead&&(a.animal||isScenery(a)||a.alien||HOSTILES[a.kind]||['resident','trialSeal'].includes(a.kind))&&distance(p,a)<.4)){blocked=true;break;}}
  if(p.kind==='grenade'){p.speed=Math.max(0,p.speed-dt*6);p.height=Math.max(.12,Math.sin(p.age/1.25*Math.PI)*.9);if(blocked){p.angle+=Math.PI*.7;p.speed*=.4;}}
  if(p.age>=p.ttl||blocked&&p.kind==='rocket'){p.done=true;(world.effects??=[]).push({kind:'explosion',x:p.x,y:p.y,age:0,ttl:.65,seed:p.id});events.push({kind:'explosion'});world.panic={x:p.x,y:p.y,until:f.minutes+12};blastFacades(state,world,p);for(const a of actors){const d=distance(p,a);if(a.kind!=='playerGhost'&&d<p.blast&&!a.dead&&(a.animal||isScenery(a)||a.alien||HOSTILES[a.kind]||['resident','companion','trialSeal'].includes(a.kind))&&bulletSight(world,p,a)){const hit=damageActor(state,world,a,p.damage*Math.max(.2,1-d/p.blast));if(hit)events.push(hit);}}
   if(distance(p,f)<p.blast&&bulletSight(world,p,f)){const hit=hostileHit(state,p.damage*.6*(1-distance(p,f)/p.blast),'explosion');if(hit)events.push(hit);}
  }
 }world.projectiles=(world.projectiles||[]).filter(p=>!p.done);return events;
}
export function forestTreasure(state,world,cache){const f=state.frontier,c=f.life.combat;if(world.interior||distance(f,cache)>1.8||c.treasures.includes(cache.id))return false;c.treasures.push(cache.id);const reward=45+Math.floor(hash(f.seed,Number(cache.id.slice(6))+950)*90);earn(state,reward);f.life.ammo=Math.min(500,f.life.ammo+6);if(Number(cache.id.slice(6))%4===0)c.grenades=Math.min(99,c.grenades+1);return reward;}
export function weatherHazard(f){const skyTime=worldTime(f),block=Math.floor(skyTime/180),storm=hash(f.seed,block+7721)<.22,local=skyTime%180,phase=local%42,thunder=storm&&phase<3,warning=storm&&phase>37,index=block*7+Math.floor(local/42)+(warning?1:0),strike=storm?{x:9+hash(f.seed,index+552)*44,y:77+hash(f.seed,index+553)*43}:null;const tornado=storm&&hash(f.seed,block+918)<.27&&local>70&&local<140?{x:15+local*.25,y:78+Math.sin(local*.04)*14}:null;return{storm,thunder,warning,tornado,strike,index};}
export function tickWeather(state,world,dt,time){const f=state.frontier,h=weatherHazard(f),events=[];if(world.interior)return events;if(h.thunder&&world.thunderBlock!==h.index){world.thunderBlock=h.index;events.push({kind:'thunder'});if(distance(f,h.strike)<1.5){const hit=hostileHit(state,38,'thunder');if(hit){events.push(hit);if(hit.kind==='died')return events;}}}if(h.tornado&&distance(f,h.tornado)<3&&time>(world.windDamageAt||0)){world.windDamageAt=time+1;const hit=hostileHit(state,16,'tornado');if(hit)events.push(hit);if(hit?.kind!=='died'){const a=Math.atan2(f.y-h.tornado.y,f.x-h.tornado.x);moveInWorld(world,f,Math.cos(a)*.6,Math.sin(a)*.6,.22);}}return events;}

function markFacade(state,world,b,damage,point){const f=state.frontier,{id,hp,maxHp,old}=hitBuilding(state,world,b,damage,point);if(old>hp){f.life.heat=Math.min(100,f.life.heat+4);f.life.debts=Math.min(99999,f.life.debts+2);}(world.effects??=[]).push({kind:'sparks',x:point.x,y:point.y,age:0,ttl:.5,seed:old});return{kind:'objectHit',target:id,hp,maxHp,victim:'facade'};}
function shootFacade(state,world,range,damage){const f=state.frontier;for(let d=.3;d<range;d+=.12){const x=f.x+Math.cos(f.angle)*d,y=f.y+Math.sin(f.angle)*d,t=tileAt(world,x,y);if(t<4)continue;const b=world.buildings?.find(b=>x>=b.left&&x<b.left+b.width&&y>=b.top&&y<b.top+b.depth);return b?markFacade(state,world,b,damage,{x:x-Math.cos(f.angle)*.15,y:y-Math.sin(f.angle)*.15}):null;}return null;}
function blastFacades(state,world,p){for(const b of world.buildings||[]){const x=Math.max(b.left-.1,Math.min(b.left+b.width+.1,p.x)),y=Math.max(b.top-.1,Math.min(b.top+b.depth+.1,p.y)),d=Math.hypot(x-p.x,y-p.y);if(d<p.blast&&clearSight(world,p,{x,y}))markFacade(state,world,b,p.damage*(1-d/p.blast),{x,y});}}



