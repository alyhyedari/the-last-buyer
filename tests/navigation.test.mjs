import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,validateState,obstacles,walkable} from '../src/state.js';
import {COMMONS,enterChapter,returnToCommons,chapterEntrance,portalReturn} from '../src/open-world.js';
import {CHAPTERS} from '../src/content.js';
import {nextGuidance} from '../src/guidance.js';
import {G} from '../src/guidance-text.js';
import {ORDER} from '../src/i18n.js';
import {movementDirection} from '../src/movement.js';
test('visiting the current chapter leaves the exact position and progress untouched',()=>{
 const s=newState();enterChapter(s,2);s.position={x:424.25,y:522.75};s.puzzleProgress['2:s0']=1;
 const before=structuredClone(s);assert.equal(enterChapter(s,2),true);assert.deepEqual(s,before);
});
test('physical doors return to the matching building; map travel resumes bookmarked room positions',()=>{
 const s=newState();s.commonsPosition={x:956,y:776};
 for(let index=0;index<7;index++){
  enterChapter(s,index,{via:'door'});assert.deepEqual(s.position,chapterEntrance(index));assert.ok(walkable(s.position.x,s.position.y,obstacles(CHAPTERS[index])));
  const location={x:110+index*2,y:530};s.position={...location};returnToCommons(s);
  assert.deepEqual(s.position,portalReturn(index));assert.ok(walkable(s.position.x,s.position.y,obstacles(COMMONS)));
  assert.deepEqual(s.commonsPosition,s.position);assert.deepEqual(s.chapterPositions[index],location);
  enterChapter(s,index);assert.deepEqual(s.position,location);returnToCommons(s);
  enterChapter(s,index,{via:'door'});assert.deepEqual(s.position,chapterEntrance(index));returnToCommons(s);
 }
});
test('a room switch saves both positions and legacy saves migrate without inventing other rooms',()=>{
 const s=newState();enterChapter(s,2);s.position={x:110,y:450};enterChapter(s,4);assert.deepEqual(s.chapterPositions[2],{x:110,y:450});
 s.position={x:120,y:400};enterChapter(s,2);assert.deepEqual(s.position,{x:110,y:450});assert.deepEqual(s.chapterPositions[4],{x:120,y:400});
 const round=validateState(s);assert.equal(round.version,5);assert.deepEqual(round.chapterPositions,s.chapterPositions);
 const old=structuredClone(s);old.version=4;delete old.chapterPositions;const restored=validateState(old);assert.deepEqual(restored.chapterPositions,{2:old.position});
 for(const bad of [null,[],{8:{x:110,y:400}},{0:{x:NaN,y:400}},{0:{x:9000,y:400}},{0:{x:100,y:400,extra:1}}])assert.equal(validateState({...s,chapterPositions:bad}),null);
});
test('guide leads through a real episode, every station, decision and return without making choices',()=>{
 const s=newState();assert.equal(nextGuidance(s).target.id,'portal-0');enterChapter(s,0);
 assert.equal(nextGuidance(s).target.type,'episode');s.episodes.push(0);
 for(const e of CHAPTERS[0].entities.filter(e=>e.type==='station')){assert.equal(nextGuidance(s).target.id,e.id);s.solved.push(e.id);}
 assert.equal(nextGuidance(s).kind,'decision');s.decisions[0]=0;assert.equal(nextGuidance(s).target.type,'wayback');
 returnToCommons(s);assert.equal(nextGuidance(s).target.id,'portal-6');
 s.tracked='fuse-0';assert.equal(nextGuidance(s).kind,'optional');s.discoveries.push('fuse-0');assert.equal(nextGuidance(s).target.id,'portal-6');
 for(const locale of ORDER)for(const value of Object.values(G)){assert.ok(value[locale]?.trim());assert.deepEqual([...value[locale].matchAll(/\{\w+\}/g)].map(v=>v[0]).sort(),[...value.en.matchAll(/\{\w+\}/g)].map(v=>v[0]).sort());}
});
test('four-direction facing follows both axes and retains its last direction when idle',()=>{
 assert.equal(movementDirection(1,0),'right');assert.equal(movementDirection(-1,0),'left');
 assert.equal(movementDirection(0,-1),'up');assert.equal(movementDirection(0,1),'down');
 assert.equal(movementDirection(0,0,'up'),'up');assert.equal(movementDirection(1,-1,'right'),'right');
 assert.equal(movementDirection(1,-1,'down'),'up');
});
