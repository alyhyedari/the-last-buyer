import {startDelivery,completeDelivery,catchFish,talk} from '../src/frontier-actions.js';
import {selectFrontierEnding,finishFrontier} from '../src/frontier-endings.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,validateState,writeSave,readSave} from '../src/state.js';
import {newFrontierState,normalizeFrontier,hash,advanceTime,clockLabel,weatherAt,gameDay,transact,earn,toggleMount,travelStep,FRONTIER_ENDINGS} from '../src/frontier-state.js';
import {makeFrontierWorld,PLACES,route,canStand,moveInWorld,SIZE} from '../src/frontier-world.js';
import {F} from '../src/frontier-text.js';
import {STORIES,EPILOGUES} from '../src/frontier-story.js';
import {ORDER} from '../src/i18n.js';
import {VILLAGE_ITEMS} from '../src/village-content.js';
const sample=()=>{const s=newState();s.frontier=newFrontierState(12345);return s;};

test('legacy saves gain a reproducible life simulation without losing rooms or previously owned equipment',()=>{
 const old=sample();delete old.frontier;delete old.village.vehicles;delete old.village.weapons;old.village.vehicle='car';old.village.weapon='bow';old.chapterPositions={0:{x:112,y:200}};
 const migrated=validateState(old);assert.ok(migrated);assert.deepEqual(migrated.village.vehicles,['car']);assert.deepEqual(migrated.village.weapons,['bow']);assert.deepEqual(migrated.chapterPositions,old.chapterPositions);assert.equal(migrated.frontier.active,false);
 const s=sample();s.village.vehicles=['bike','car'];s.village.vehicle='car';s.frontier.active=true;s.frontier.x=26.5;s.frontier.y=38.5;s.frontier.minutes=2800;s.frontier.receipts=['pond'];startDelivery(s);
 let saved;const storage={setItem:(key,value)=>{saved=value;},getItem:()=>saved};assert.ok(writeSave(storage,s));assert.deepEqual(readSave(storage),s);assert.equal(weatherAt(readSave(storage).frontier),weatherAt(s.frontier));
 for(const corrupted of [{x:NaN},{seed:Infinity},{visits:['bank-vault']},{photos:['dragon']},{evidence:'fabricate'},{ending:'invented'},{job:{type:'delivery',destination:'elsewhere',reward:5}}])assert.equal(normalizeFrontier({...s.frontier,...corrupted}),null);
});

test('every county destination has a collision-safe connected route across different world seeds',()=>{
 for(const seed of [0,1,17,12345,4294967295]){const world=makeFrontierWorld(seed);assert.deepEqual(world,makeFrontierWorld(seed));for(const place of PLACES){assert.ok(canStand(world,place.x,place.y),place.id);const points=route(world,{x:32.5,y:57.5},place);if(place.id!=='gate')assert.ok(points.length,place.id);for(const point of points)assert.ok(canStand(world,point.x,point.y),place.id);const traveller={x:32.5,y:57.5};for(const point of points)moveInWorld(world,traveller,point.x-traveller.x,point.y-traveller.y);assert.ok(Math.hypot(traveller.x-place.x,traveller.y-place.y)<.01,place.id);}
  const player={x:32.5,y:57.5};moveInWorld(world,player,0,100);assert.ok(canStand(world,player.x,player.y));assert.ok(player.y<SIZE-2);
 }
 assert.notDeepEqual(makeFrontierWorld(1).sprites,makeFrontierWorld(2).sprites);
});

test('time, weather and economy survive reload and reject invalid or duplicate payments and rewards',()=>{
 const s=sample(),f=s.frontier;advanceTime(f,960);assert.equal(clockLabel(f),'00:00');assert.equal(gameDay(f),2);const before=f.minutes;advanceTime(f,-60);advanceTime(f,NaN);assert.equal(f.minutes,before);
 const weather=new Set();for(let n=0;n<20;n++){advanceTime(f,180);weather.add(weatherAt(f));assert.equal(weatherAt(f),weatherAt(normalizeFrontier(f)));}assert.ok(weather.size>=3);
 assert.equal(transact(s,121),false);assert.equal(transact(s,NaN),false);assert.equal(transact(s,-1),false);assert.equal(transact(s,60),true);assert.equal(s.village.money,60);assert.equal(f.purchases,1);assert.equal(f.spent,60);assert.equal(s.village.buyPresses,1);
 earn(s,40);assert.equal(s.village.money,100);assert.equal(f.earned,40);
 s.village.vehicle='car';assert.ok(startDelivery(s));assert.equal(startDelivery(s),false);const job=structuredClone(f.job);assert.equal(completeDelivery(s,job.destination==='club'?'inn':'club'),0);assert.equal(f.job.reward,job.reward);assert.equal(completeDelivery(s,job.destination),job.reward);assert.equal(completeDelivery(s,job.destination),0);assert.equal(f.deliveries,1);
});

test('vehicle differences affect cargo, fuel and movement without stranding the player',()=>{
 const car=sample();car.village.vehicle='car';car.village.vehicles=['car','bike'];assert.ok(toggleMount(car));const fuel=car.frontier.fuel;travelStep(car,10);assert.ok(car.frontier.fuel<fuel);car.frontier.fuel=0;travelStep(car,1);assert.equal(car.frontier.mounted,false);assert.equal(toggleMount(car),false);
 car.village.vehicle='bike';assert.ok(toggleMount(car));travelStep(car,100);assert.equal(car.frontier.fuel,0);assert.equal(car.frontier.mounted,true);toggleMount(car);car.frontier.soberAt=car.frontier.minutes+60;assert.equal(toggleMount(car),false);advanceTime(car.frontier,61);assert.ok(toggleMount(car));
 const a=sample(),b=sample();a.village.vehicle='bike';b.village.vehicle='car';startDelivery(a);startDelivery(b);assert.ok(b.frontier.job.reward>a.frontier.job.reward);
});

test('relationships require separate days and cannot be bought or farmed by repeating dialogue',()=>{
 const s=sample(),f=s.frontier;assert.equal(talk(s,'listen'),true);assert.equal(talk(s,'listen'),false);assert.equal(f.trust,1);transact(s,30);assert.equal(f.trust,1);advanceTime(f,1440);assert.equal(talk(s,'boast'),true);assert.equal(f.trust,0);catchFish(s,true);assert.equal(f.released,1);assert.equal(f.fish,0);
});

const fixtures={
 'homeward':s=>{Object.assign(s.village,{growth:3,vehicle:'car'});Object.assign(s.frontier,{donated:60,deliveries:2});},
 'lighthouse':s=>Object.assign(s.frontier,{receipts:['pond','club','tower'],evidence:'publish',donated:60}),
 'two-tickets':s=>Object.assign(s.frontier,{romance:true,trust:4,events:['stranger-helped']}),
 'night-radio':s=>Object.assign(s.frontier,{concerts:3,trust:2}),
 'river-keeper':s=>Object.assign(s.frontier,{released:3,photos:['deer','owl','heron']}),
 'last-delivery':s=>Object.assign(s.frontier,{job:{type:'delivery',destination:'clinic',reward:33,acceptedAt:480},events:['ghost-heard']}),
 'paper-king':s=>{s.frontier.evidence='sell';},
 'borrowed-dawn':s=>Object.assign(s.frontier,{drinks:3,company:1,restCount:2}),
 'unbought':s=>Object.assign(s.frontier,{receipts:['pond','club','tower'],evidence:'keep'}),
 'the-witness':s=>Object.assign(s.frontier,{rangeScore:80,events:['stranger-helped']}),
 'open-road':s=>Object.assign(s.frontier,{visits:PLACES.slice(0,9).map(p=>p.id),distance:100}),
 'small-hours':()=>{}
};
test('all twelve authored epilogues are reachable, saved once and stable while viewed',()=>{
 assert.equal(FRONTIER_ENDINGS.length,12);assert.deepEqual(new Set(EPILOGUES.map(e=>e.id)),new Set(FRONTIER_ENDINGS));
 for(const id of FRONTIER_ENDINGS){const s=sample();fixtures[id](s);assert.equal(selectFrontierEnding(s),id);assert.equal(finishFrontier(s),id);assert.deepEqual(s.frontier.endingHistory,[id]);const saved=validateState(s);assert.ok(saved,id);assert.equal(selectFrontierEnding(saved),id);s.frontier.evidence='sell';assert.equal(finishFrontier(s),id,'opening again must not reroll');assert.equal(s.frontier.endingHistory.length,1);}
 const s=sample();fixtures['homeward'](s);fixtures.lighthouse(s);assert.equal(finishFrontier(s),'lighthouse');
});

test('new UI, narrative and equipment have eight nonempty, uncorrupted locales',()=>{
 const values=[...Object.values(F),...Object.values(STORIES),...EPILOGUES.flatMap(e=>[e.title,e.body]),...VILLAGE_ITEMS.flatMap(i=>[i.name,i.body])];
 for(const value of values)for(const locale of ORDER){assert.ok(value[locale]?.trim(),locale);assert.doesNotMatch(value[locale],/\?{3}|\uFFFD/);}
 assert.equal(new Set(EPILOGUES.map(e=>e.body.en)).size,12);assert.equal(new Set(EPILOGUES.map(e=>e.body.fa)).size,12);assert.ok(hash(1,7)>=0&&hash(1,7)<1);
});
