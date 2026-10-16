import test from 'node:test';
import assert from 'node:assert/strict';
import {runBenchmark} from '../src/benchmark.js';

// Tests scheduling, cancellation and full scene progression with a no-op canvas.
// It is intentionally not a graphics/FPS benchmark; browser evidence is separate.
test('real benchmark runner completes all four scenes and cleans timers/listeners',async()=>{
 const original=Object.fromEntries(['document','requestAnimationFrame','cancelAnimationFrame'].map(k=>[k,globalThis[k]]));const pending=new Map(),listeners=new Map();let serial=0,clock=0;
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:20})},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const canvas=()=>({width:480,height:270,dataset:{},getContext:()=>ctx});globalThis.document={hidden:false,createElement:canvas,addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:(k)=>listeners.delete(k)};
 globalThis.requestAnimationFrame=fn=>{const id=++serial;pending.set(id,setTimeout(()=>{pending.delete(id);clock+=16.67;fn(clock);},2));return id;};globalThis.cancelAnimationFrame=id=>{clearTimeout(pending.get(id));pending.delete(id);};
 try{
  const phases=[];const result=await runBenchmark({canvas:canvas(),onPhase:p=>phases.push(p.id)});assert.deepEqual(result.scenes.map(s=>s.id),['city','forest','boss','water']);assert.ok(result.scenes.every(s=>s.frameCount>=8));assert.equal(phases.at(-1),'finish');assert.equal(pending.size,0);assert.equal(listeners.size,0);
  const abort=new AbortController(),cancelled=runBenchmark({canvas:canvas(),signal:abort.signal});abort.abort();await assert.rejects(cancelled,/cancelled/);assert.equal(pending.size,0);
  globalThis.document.hidden=true;await assert.rejects(runBenchmark({canvas:canvas()}),/interrupted/);assert.equal(listeners.size,0);
 }finally{for(const timer of pending.values())clearTimeout(timer);for(const [key,value]of Object.entries(original))if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
});
