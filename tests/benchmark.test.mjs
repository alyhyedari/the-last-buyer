import test from 'node:test';
import assert from 'node:assert/strict';
import {BENCHMARK_KEY,benchmarkProfile,readBenchmark,validateBenchmark,writeBenchmark,classifyPerformance} from '../src/benchmark.js';
import {BT} from '../src/benchmark-text.js';
import {ORDER} from '../src/i18n.js';
import {AdaptiveQuality} from '../src/quality.js';
import {BENCHMARK_FIXTURE as fixture} from '../tools/qa-fixture.mjs';

test('measured benchmark round-trips; unavailable storage is reported honestly',()=>{
 const values=new Map(),s={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 assert.equal(writeBenchmark(s,fixture),true);assert.ok(values.has(BENCHMARK_KEY));assert.deepEqual(readBenchmark(s),fixture);
 assert.equal(writeBenchmark({setItem(){throw Error('quota');}},fixture),false);
 assert.equal(readBenchmark({getItem(){throw Error('denied');}}),null);
});
test('incomplete, stale algorithms, invented grades and extra tracking fields are rejected',()=>{
 for(const patch of [{version:1},{score:82},{quality:'low'},{frameCount:0},{frameCount:1001},{durationMs:0},{p95FrameMs:0},{renderP95Ms:Infinity},{slowFrameRatio:2},{at:'invalid'},{userAgent:'extra'},{profile:{...fixture.profile,cores:999}},{profile:{...fixture.profile,viewport:{width:-1,height:900}}},{profile:{...fixture.profile,ua:'extra'}}])assert.equal(validateBenchmark({...fixture,...patch}),null,JSON.stringify(patch));
 const p=benchmarkProfile();assert.ok(p.cores===null||Number.isInteger(p.cores));assert.equal('userAgent' in p,false);
});
test('quality follows measured scene load, independent of reported hardware',()=>{
 assert.deepEqual(classifyPerformance({p95FrameMs:18,renderP95Ms:4,slowFrameRatio:0}),{score:100,quality:'high'});
 assert.deepEqual(classifyPerformance({p95FrameMs:28,renderP95Ms:12,slowFrameRatio:.1}),{score:73,quality:'auto'});
 assert.deepEqual(classifyPerformance({p95FrameMs:70,renderP95Ms:30,slowFrameRatio:.5}),{score:31,quality:'low'});
 assert.equal(validateBenchmark({...fixture,profile:{...fixture.profile,cores:null,memoryGb:null}}).score,100);
});
test('quality controller degrades sustained load and only recovers after a stable interval',()=>{
 const q=new AdaptiveQuality('high');
 const run=(ms,cost,seconds)=>{for(let t=0;t<seconds*1000;t+=ms){q.rendered(cost);q.sample(ms);}};
 run(40,15,2.1);assert.equal(q.quality,'high');run(40,15,2.1);assert.equal(q.quality,'low');
 run(16.67,2,4.1);assert.equal(q.quality,'low');run(16.67,2,6.1);assert.equal(q.quality,'high');
 q.reset('low');run(33.34,3,10);assert.equal(q.quality,'low');
 assert.ok(q.frames.length<125&&q.costs.length<125);
});
test('benchmark copy is complete in all eight supported languages',()=>{
 for(const locale of ORDER)for(const value of Object.values(BT))assert.ok(value[locale]?.trim(),locale);
});
