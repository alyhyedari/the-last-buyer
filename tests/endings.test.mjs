import test from 'node:test';
import assert from 'node:assert/strict';
import {ENDINGS} from '../src/content.js';
import {ORDER,setLanguage,tr} from '../src/i18n.js';
import {ET} from '../src/ending-text.js';
import {ENDING_FAMILIES,ENDING_ROUTES,routeRequirements} from '../src/ending-rules.js';
import {endingFrames,requirementText} from '../src/ending-ui.js';
import {newState,validateState,recordEnding,resumeBeforeEnding,canChooseEnding,decisionEvents,reflectionCounts} from '../src/state.js';
import {endingJourney} from './support/ending-fixtures.mjs';

test('24 distinct endings form six four-route families and every ending has three translated frames',()=>{
 assert.equal(ENDINGS.length,24);assert.equal(new Set(ENDINGS.map(e=>e.id)).size,24);assert.deepEqual(new Set(Object.keys(ENDING_ROUTES)),new Set(ENDINGS.map(e=>e.id)));assert.equal(new Set(Object.values(ENDING_ROUTES).map(r=>r.scene)).size,24);
 for(const family of ENDING_FAMILIES)assert.equal(Object.values(ENDING_ROUTES).filter(r=>r.family===family).length,4,family);
 for(const lang of ORDER){setLanguage(lang);for(const e of ENDINGS){const frames=endingFrames(e);assert.equal(frames.length,3,e.id+' '+lang);assert.ok(frames.every(x=>x.length>8));assert.equal(frames.join(' ').replace(/\s/g,''),tr(e.body).replace(/\s/g,''),e.id+' preserves story');}for(const value of Object.values(ET)){assert.ok(value[lang]?.trim());assert.deepEqual([...value[lang].matchAll(/\{\w+\}/g)].map(x=>x[0]).sort(),[...value.fa.matchAll(/\{\w+\}/g)].map(x=>x[0]).sort());}}
 setLanguage('fa');
});
test('all authored story journeys can earn their ending and preserve a valid evidence snapshot',()=>{
 for(const e of ENDINGS){const s=endingJourney(e.id);assert.ok(validateState(s),e.id);assert.equal(canChooseEnding(s,e.id),true,e.id);assert.equal(recordEnding(s,e.id),true,e.id);assert.equal(s.ending,e.id);assert.deepEqual(s.endingRecords[e.id].decisions,s.decisions);assert.ok(validateState(s),e.id+' saved');for(const lang of ORDER){setLanguage(lang);for(const r of routeRequirements(s,e.id))assert.ok(requirementText(r.rule,s)?.length>5);}}
 setLanguage('fa');
});
test('contradictory earlier decisions lock specific routes, while uncollected evidence remains recoverable',()=>{
 const cases=[['installments','major',0,1],['workshop','micro',5,1],['address','major',0,0],['letters','project','letters'],['commons','micro',7,1],['reserve','micro',1,1],['exitright','major',4,1],['monopoly','micro',4,0],['blackout','major',4,1],['deluge','micro',3,0],['jackpot','major',6,0],['ferry','micro',7,0],['quiet','micro',5,1],['lantern','project','melody'],['broadcast','micro',6,1],['palimpsest','major',6,0]];
 for(const[id,kind,index,value]of cases){const s=endingJourney(id);if(kind==='project')s.projects=s.projects.filter(x=>x!==index);else s[kind==='major'?'decisions':'microDecisions'][index]=value;assert.equal(canChooseEnding(s,id),false,id);assert.equal(recordEnding(s,id),false);assert.equal(s.ending,null);assert.deepEqual(s.collection,[]);const missing=routeRequirements(s,id).filter(r=>!r.met);assert.ok(missing.length);assert.equal(missing.some(r=>r.fixed),kind!=='project');}
 const s=endingJourney('palimpsest');s.records=s.records.slice(0,23);assert.equal(canChooseEnding(s,'palimpsest'),false);s.records.push('7:r3');assert.equal(canChooseEnding(s,'palimpsest'),true);
 assert.equal(canChooseEnding(newState(),'leave'),true);assert.equal(canChooseEnding(newState(),'installments'),false);assert.equal(canChooseEnding(newState(),'invented'),false);
});
test('revisiting the final choice preserves story decisions and keeps independent endings across new journeys',()=>{
 const s=endingJourney('workshop'),before=decisionEvents(s),counts=reflectionCounts(s);recordEnding(s,'workshop');const saved=structuredClone(s.endingRecords.workshop);assert.equal(resumeBeforeEnding(s),true);assert.equal(s.ending,null);assert.deepEqual(decisionEvents(s),before);assert.deepEqual(reflectionCounts(s),counts);assert.equal(recordEnding(s,'repayment'),true);assert.deepEqual(s.collection,['workshop','repayment']);assert.deepEqual(s.endingRecords.workshop,saved);
 const fresh=newState(s.collection,s.endingRecords);assert.deepEqual(fresh.collection,s.collection);assert.deepEqual(fresh.decisions,{});fresh.endingRecords.workshop.decisions[0]=2;assert.equal(s.endingRecords.workshop.decisions[0],0);assert.equal(canChooseEnding(fresh,'workshop'),false);assert.equal(resumeBeforeEnding(fresh),false);
});
test('all 24 discoveries fit an import, old saves retain their endings without fabricated history',()=>{
 let collection=[],records={};for(const e of ENDINGS){const s=endingJourney(e.id);s.collection=[...collection];s.endingRecords=structuredClone(records);recordEnding(s,e.id);collection=s.collection;records=s.endingRecords;}
 const s=newState(collection,records);assert.equal(collection.length,24);assert.ok(validateState(s));assert.ok(Buffer.byteLength(JSON.stringify(s))<200000);
 const old=endingJourney('witness');old.version=3;old.ending='witness';old.collection=['witness','shared'];delete old.endingRecords;const migrated=validateState(old);assert.equal(migrated.version,5);assert.deepEqual(migrated.collection,['witness','shared']);assert.deepEqual(migrated.endingRecords,{});assert.equal(migrated.ending,'witness');
});
test('ending histories reject corrupt evidence, extra keys, invalid timestamps and unsatisfied routes',()=>{
 const s=endingJourney('palimpsest');recordEnding(s,'palimpsest');
 for(const change of [r=>r.records=['0:s0'],r=>r.microDecisions={99:0},r=>r.decisions={constructor:0},r=>r.projects=['unknown'],r=>r.discoveredAt='not-a-date',r=>r.playSeconds=NaN,r=>r.note='x'.repeat(2001),r=>r.decisions[6]=0]){const copy=structuredClone(s);change(copy.endingRecords.palimpsest);assert.equal(validateState(copy),null);}
 assert.equal(validateState({...s,endingRecords:[]}),null);assert.equal(validateState({...s,collection:[]}),null);assert.equal(validateState({...s,endingRecords:{unknown:s.endingRecords.palimpsest}}),null);
});
