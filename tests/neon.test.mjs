import {challengeFor} from '../src/neon-challenges.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,validateState} from '../src/state.js';
import {newFrontierState} from '../src/frontier-state.js';
import {MYTH_BOSSES} from '../src/frontier-myth-data.js';
import {GOD_IDS} from '../src/pantheon-state.js';
import {bossMaxHp,startTrial,tickTrial,trialSeals,breakTrialSeal,activateGodPower,setTrialMode} from '../src/pantheon.js';
import {syncArena,resetUnfinishedBosses,bossPattern} from '../src/frontier-encounters.js';
import {actorWithHealth,damageActor,bulletSight,shoot,updateProjectiles} from '../src/frontier-combat.js';
import {mythActors,updateMyths} from '../src/frontier-myth.js';
import {makeFrontierWorld,canStand,route,moveInWorld,SIZE} from '../src/frontier-world.js';
import {districtMode,priceFactor,supplyQuote,beginNeonQuest,finishNeonStep,questPoint,neonActors,buySpecialCar,inviteNeon,dateNeon} from '../src/neon-world.js';
import {NEON_QUESTS,NEON_CAST} from '../src/neon-data.js';
import {CAR_MODELS} from '../src/frontier-cars.js';
import {terrainHeight,terrainSlope,terrainTravel,terrainSight,PEAKS} from '../src/frontier-terrain.js';
import {musicRegion,regionalStep,REGION_SCORES} from '../src/neon-music.js';
import {buySupply} from '../src/frontier-loadout.js';
const sample=()=>{const s=newState();s.frontier=newFrontierState(91);return s;};
const empty=()=>({size:SIZE,tiles:new Uint8Array(SIZE*SIZE),buckets:new Map(),sprites:[],colliders:[],traffic:[]});

test('17 gods retain old IDs, diverse repeatable attack sequences, three phases and safe destinations',()=>{
 assert.deepEqual(MYTH_BOSSES.map(b=>b.id),GOD_IDS);assert.equal(new Set(MYTH_BOSSES.map(b=>b.kind)).size,17);
 for(const b of MYTH_BOSSES){for(const phase of [1,2,3]){const seq=Array.from({length:12},(_,n)=>bossPattern(b,phase,n,91));assert.ok(new Set(seq).size>=2);assert.deepEqual(seq,Array.from({length:12},(_,n)=>bossPattern(b,phase,n,91)));}assert.notDeepEqual(Array.from({length:15},(_,n)=>bossPattern(b,3,n,91)),Array.from({length:15},(_,n)=>bossPattern(b,3,n,7)));}
});
test('endurance health, seals, supplies and active time save; victory remains possible and death resets',()=>{
 const s=sample(),f=s.frontier,w=empty(),b=MYTH_BOSSES[16];setTrialMode(f,'endurance');Object.assign(f,{x:b.x,y:b.y+6});syncArena(f,w);const t=startTrial(f,b);assert.equal(setTrialMode(f,'standard'),false);assert.equal(bossMaxHp(f,b),138000);
 const actor=mythActors(w,f,0).find(a=>a.id==='boss-genesis'),shielded=damageActor(s,w,actor,100).damage;assert.ok(Math.abs(shielded-12)<.01);
 for(const seal of trialSeals(f,w)){assert.ok(breakTrialSeal(s,w,seal));assert.equal(breakTrialSeal(s,w,seal),null);}assert.equal(t.seals,7);assert.equal(trialSeals(f,w).length,0);assert.equal(damageActor(s,w,actor,100).damage,100);
 f.life.ammo=0;for(let i=0;i<451;i++)tickTrial(s,b,1,.1);assert.ok(f.life.ammo>=30);assert.ok(t.seconds>=45);const before=t.seconds;tickTrial(s,b,1,0);assert.equal(t.seconds,before);assert.ok(validateState(s));
 const loaded=validateState(s);assert.equal(bossMaxHp(loaded.frontier,b),138000);assert.equal(loaded.frontier.life.pantheon.trials.genesis.seals,7);tickTrial(s,b,2,.1);assert.equal(t.seals,0);
 resetUnfinishedBosses(f,w);assert.equal(f.life.pantheon.trials.genesis,undefined);assert.equal(f.life.combat.actors['boss-genesis'],undefined);
});
test('legacy wounded bosses keep standard maximum after a mode change; invalid trial data is rejected',()=>{
 const s=sample(),f=s.frontier,b=MYTH_BOSSES[0];f.life.combat.actors['boss-stag']={x:b.x,y:b.y,hp:300,kind:b.kind,at:f.minutes};setTrialMode(f,'endurance');assert.equal(bossMaxHp(f,b),720);assert.equal(startTrial(f,b).mode,'standard');assert.ok(validateState(s));
 f.life.pantheon.trials.stag.seals=8;assert.equal(validateState(s),null);f.life.pantheon.trials.stag.seals=0;f.life.forest.gme=[...GOD_IDS];assert.ok(validateState(s));f.life.forest.gme.push('fake');assert.equal(validateState(s),null);
});
test('every earned power has an actual bounded effect, a shared cooldown and a valid save',()=>{
 for(const id of GOD_IDS){const s=sample(),f=s.frontier,w=empty();f.life.forest.gme=[id];f.life.expanse.carHealth=20;f.life.health=30;f.life.debts=200;f.life.heat=50;f.life.impairedUntil=f.minutes+200;assert.ok(activateGodPower(s,w,id),id);assert.equal(activateGodPower(s,w,id),false);assert.ok(validateState(s),id);
  if(id==='iron')assert.equal(f.life.expanse.carHealth,65);if(id==='thorn')assert.equal(f.life.health,75);if(id==='ledger')assert.equal(f.life.debts,80);if(id==='genesis')assert.equal(districtMode(f),'prosperity');if(id==='plague')assert.equal(f.life.impairedUntil,0);if(id==='moon')assert.ok(w.godHiddenUntil>f.minutes);
 }
});
test('quests require local, visible, on-foot actions; nine stories reward exactly once and survive reload',()=>{
 const s=sample(),f=s.frontier,w=makeFrontierWorld(91);for(const q of NEON_QUESTS){assert.ok(beginNeonQuest(f,q.id));assert.equal(beginNeonQuest(f,q.id),false);for(const [i,p]of q.steps.entries()){Object.assign(f,{x:32.5,y:57.5});assert.equal(finishNeonStep(s,w),null);assert.ok(canStand(w,p.x,p.y,.22),q.id+' '+i);Object.assign(f,{x:p.x,y:p.y,minutes:p.condition==='night'?1320:720});f.mounted=true;assert.equal(finishNeonStep(s,w),null);f.mounted=false;if(challengeFor(q.id,i))assert.equal(finishNeonStep(s,w,'wrong'),'challenge');assert.equal(finishNeonStep(s,w,challengeFor(q.id,i)?.answer??null),i===2?'complete':'next');assert.ok(validateState(s),q.id+' save');}assert.equal(beginNeonQuest(f,q.id),false);assert.equal(finishNeonStep(s,w),null);}assert.equal(f.life.neon.completed.length,9);
});
test('district modes change supply charges and local raids; relief overrides war and prices stay honest',()=>{
 const s=sample(),f=s.frontier,w=makeFrontierWorld(91);Object.assign(f,{x:286.5,y:90.5,minutes:720});s.village.money=1000;f.fuel=10;f.life.neon.mode='inflation';assert.equal(priceFactor(f),1.35);const cost=supplyQuote(s,15);assert.ok(buySupply(s,'refuel'));assert.equal(s.village.money,1000-cost);assert.equal(buySupply(s,'refuel'),false);
 f.life.neon.mode='conflict';assert.equal(neonActors(w,f,0).filter(a=>a.raid).length,6);f.life.neon.reliefUntil=f.minutes+1440;assert.equal(priceFactor(f),1);assert.equal(neonActors(w,f,1).filter(a=>a.raid).length,0);assert.ok(validateState(s));
});
test('adult companionship requires earned trust, proximity and sobriety; repeated invites cannot farm bond',()=>{
 const s=sample(),f=s.frontier,c=NEON_CAST.find(c=>c.id==='mira');Object.assign(f,c);f.minutes=720;assert.equal(inviteNeon(s,'mira'),false);f.life.neon.completed=['umbrella'];assert.ok(inviteNeon(s,'mira'));inviteNeon(s,'mira');assert.equal(f.life.neon.bond,1);assert.equal(dateNeon(s,'mira'),false);f.life.neon.completed.push('orchard');inviteNeon(s,'mira');f.life.impairedUntil=f.minutes+20;assert.equal(dateNeon(s,'mira'),false);f.life.impairedUntil=0;assert.ok(dateNeon(s,'mira'));assert.equal(dateNeon(s,'mira'),false);assert.ok(validateState(s));
});
test('mountain height, uphill traction and bullet sight share one field; rockets climb the firing slope',()=>{
 const w=empty();for(const p of PEAKS)assert.ok(terrainHeight(p.x,p.y)>=p.height-.01);const f={x:84,y:296,angle:0};assert.ok(terrainSlope(f.x,f.y,0)>0);assert.ok(terrainTravel(f,CAR_MODELS[5],0)>terrainTravel(f,CAR_MODELS[4],0));
 assert.equal(terrainSight(w,{x:55,y:298},{x:128,y:298}),false);assert.equal(bulletSight(w,{x:55,y:298},{x:128,y:298}),false);assert.equal(terrainSight(w,{x:84,y:296},{x:88,y:296}),true);
 const s=sample();Object.assign(s.frontier,f);s.village.weapon='launcher';s.village.weapons=['launcher'];s.frontier.life.combat.rockets=3;shoot(s,w,[]);const p=w.projectiles[0],z=p.z;updateProjectiles(s,w,[],.1);assert.ok(p.z>z);assert.ok(p.height>.05);
});
test('eight car models can be purchased without free replacement, with protected terrain roles',()=>{
 const s=sample(),f=s.frontier;s.village.money=9000;for(let i=0;i<CAR_MODELS.length;i++){assert.ok(buySpecialCar(s,i));assert.equal(f.life.expanse.carModel,i);assert.ok(validateState(s));}f.mounted=true;assert.equal(buySpecialCar(s,4),false);assert.ok(CAR_MODELS[4].speed>CAR_MODELS[5].speed);assert.ok(CAR_MODELS[5].climb>CAR_MODELS[4].climb);assert.ok(CAR_MODELS[6].armor<1);
});
test('western highway and summit approaches remain traversable across seeds with no jump across obstacles',()=>{
 for(const seed of [1,91,2026]){const w=makeFrontierWorld(seed);for(const target of [{x:34.5,y:244.5},{x:92.5,y:298.5},{x:44.5,y:353.5}]){
  const start={x:74.5,y:194.5},path=route(w,start,target,.48);assert.ok(path.length,seed+' '+target.x);for(const step of path)moveInWorld(w,start,step.x-start.x,step.y-start.y,.48);assert.ok(Math.hypot(start.x-target.x,start.y-target.y)<.05);}
 }
});
test('original regional scores change with place and boss phase while keeping event counts bounded',()=>{
 const s=sample(),f=s.frontier;Object.assign(f,{x:230,y:100,minutes:720});f.life.neon.mode='prosperity';assert.equal(musicRegion(s).key,'city');f.y=150;assert.equal(musicRegion(s).key,'waterfront');f.life.combat.arena='iron';assert.equal(musicRegion(s,[{boss:true,x:f.x,y:f.y,phase:3,variant:6}]).key,'battle');
 for(const key of Object.keys(REGION_SCORES))for(let i=0;i<256;i++){const score=regionalStep({key,phase:3,voice:16},i);assert.ok(score.events.length<=10);assert.ok(score.bpm>=60&&score.bpm<=160);for(const e of score.events)assert.ok(Number.isFinite(e.note)&&e.velocity>0&&e.velocity<=1);}
 assert.ok(regionalStep({key:'battle',phase:3},0).bpm>regionalStep({key:'battle',phase:1},0).bpm);
});

test('invalid completed or out-of-range active quest cannot enter a saved game',()=>{
 const s=sample();s.frontier.life.neon.quest={id:'relativity',step:3};assert.equal(validateState(s),null);s.frontier.life.neon.quest.step=2;s.frontier.life.neon.completed=['relativity'];assert.equal(validateState(s),null);s.frontier.life.neon.completed=[];assert.ok(validateState(s));
});
