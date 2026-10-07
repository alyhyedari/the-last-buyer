import test from 'node:test';
import assert from 'node:assert/strict';
import {EPISODES,EXTRA_ENDINGS} from '../src/episodes.js';
import {D} from '../src/director-text.js';
import {ORDER} from '../src/i18n.js';
import {CHAPTERS} from '../src/content.js';
import {newState,validateState,addEpisodeDecision,decisionEvents,reflectionCounts,obstacles,walkable,readSettings} from '../src/state.js';
import {episodeInitial,episodeAction,episodeSolved,assistEpisode} from '../src/episode-logic.js';
import {HorrorDirector,ShadowAgent,lineOfSight,sheltered} from '../src/horror.js';

test('all new narrative and interface text exists in all eight languages',()=>{
 let count=0;function visit(v){if(!v||typeof v!=='object')return;if('fa'in v){count++;for(const lang of ORDER){assert.ok(typeof v[lang]==='string'&&v[lang].trim(),`${lang}: ${v.fa}`);assert.deepEqual([...v[lang].matchAll(/\{\w+\}/g)].map(x=>x[0]).sort(),[...v.fa.matchAll(/\{\w+\}/g)].map(x=>x[0]).sort());}return;}Object.values(v).forEach(visit);}visit([D,EPISODES,EXTRA_ENDINGS]);assert.ok(count>100);
});
test('all bespoke scenes start unsolved, provide assistance and retain explicit choices',()=>{
 for(const e of EPISODES){assert.equal(episodeSolved(e.type,episodeInitial(e.type)),false);assert.equal(episodeSolved(e.type,assistEpisode(e.type)),true);const s=newState();assert.equal(addEpisodeDecision(s,e.id,0),true);assert.equal(addEpisodeDecision(s,e.id,1),false);assert.equal(decisionEvents(s).length,1);assert.equal(s.microDecisions[e.id],0);assert.ok(validateState(s));}
});
test('transfers conserve resources under arbitrary actions and cannot produce negative values',()=>{
 for(const type of ['ration','flood']){let s=episodeInitial(type),sum=s.portions.reduce((a,b)=>a+b);for(let n=0;n<500;n++){s=episodeAction(type,s,{type:'transfer',from:(n*7)%3,to:(n*11+1)%3});assert.equal(s.portions.reduce((a,b)=>a+b),sum);assert.ok(s.portions.every(v=>Number.isInteger(v)&&v>=0));}const before=structuredClone(s);s=episodeAction(type,s,{type:'transfer',from:-1,to:3});assert.deepEqual(s,before);}
});
test('a compromised short route and unchecked signatures cannot masquerade as originals',()=>{
 let s=episodeInitial('dispatch');for(const node of ['B','F'])s=episodeAction('dispatch',s,{type:'node',node});assert.equal(episodeSolved('dispatch',s),false);s=episodeInitial('dispatch');for(const node of ['C','D','E','F'])s=episodeAction('dispatch',s,{type:'node',node});assert.equal(episodeSolved('dispatch',s),true);
 s=episodeInitial('consensus');for(const index of [0,1,2])s=episodeAction('consensus',s,{type:'select',index});assert.equal(episodeSolved('consensus',s),false);
 s=episodeInitial('council');for(const index of [0,1,2])s=episodeAction('council',s,{type:'accept',index});assert.equal(episodeSolved('council',s),false);assert.deepEqual(s.accepted,[]);for(const index of [0,1,2]){s=episodeAction('council',s,{type:'listen',index});s=episodeAction('council',s,{type:'accept',index});}assert.equal(episodeSolved('council',s),true);
});
test('old saves migrate without inventing evidence or losing the current chapter',()=>{
 const s=newState();s.version=1;s.position={...CHAPTERS[0].start};s.chapter=s.unlocked=3;s.decisions={0:0,1:1,2:2};s.solved=['0:s0'];s.puzzleProgress={'0:s0':3};const migrated=validateState(s);assert.equal(migrated.version,5);assert.equal(migrated.chapter,3);assert.deepEqual(migrated.episodes,[0,1,2]);assert.deepEqual(migrated.microDecisions,{});assert.equal(decisionEvents(migrated).length,3);assert.equal(migrated.puzzleProgress['0:s0'],2);assert.ok(validateState(migrated));for(const patch of [{episodes:[8]},{episodes:[0,0]},{microDecisions:{0:1}},{microDecisions:[]},{seenEvents:['0:unknown']},{collection:['fake']},{reflectionResponse:'diagnosis'}])assert.equal(validateState({...newState(),...patch}),null);
});
test('encounters fire once per chapter and calm mode never fires one',()=>{
 const state=newState(),events=[],director=new HorrorDirector(CHAPTERS[2],state,event=>events.push(event));for(let i=0;i<20;i++)director.update(1,{calm:true});assert.equal(events.length,0);for(let i=0;i<9;i++)director.update(1,{calm:false});assert.deepEqual(events,['arrival']);state.solved.push('2:s0');for(let i=0;i<40;i++)director.update(1,{calm:false});assert.deepEqual(events,['arrival','power']);const reloaded=new HorrorDirector(CHAPTERS[2],state,event=>events.push(event));for(let i=0;i<55;i++)reloaded.update(1,{calm:false});assert.deepEqual(events,['arrival','power']);assert.equal(readSettings({getItem:()=>JSON.stringify({})}).pixelVeil,true);
});
test('walls block sight, crouching creates shelter, and each shadow respects room collision',()=>{
 assert.equal(lineOfSight({x:70,y:100},{x:190,y:100},[{x:120,y:90,w:20,h:40}]),false);assert.equal(lineOfSight({x:70,y:70},{x:190,y:70},[{x:120,y:90,w:20,h:40}]),true);
 for(const index of [2,3,4,6]){const ch=CHAPTERS[index],blocks=obstacles(ch),agent=new ShadowAgent(ch,blocks);assert.ok(walkable(agent.position.x,agent.position.y,blocks));const shelter=ch.hideZones[0];assert.equal(sheltered(shelter,ch,true),true);assert.equal(sheltered(shelter,ch,false),false);for(let i=0;i<2400;i++){const player=i<1200?ch.start:shelter;agent.update(1/60,{player,running:i<1200,hidden:i>=1200});assert.ok(walkable(agent.position.x,agent.position.y,blocks),`Shadow crossed obstacle in ${index}`);}}
});
test('reflections depend only on confirmed choices, never horror, movement or assistance',()=>{
 const s=newState();addEpisodeDecision(s,0,1);addEpisodeDecision(s,7,0);const before=reflectionCounts(s);s.seenEvents=['0:arrival'];s.records=['0:r0'];s.playSeconds=999;s.puzzleProgress={'0:s0':2};s.reflectionResponse='role';assert.deepEqual(reflectionCounts(s),before);assert.equal(before.conceal,1);assert.equal(before.consent,1);assert.equal(decisionEvents(s).length,2);
});
