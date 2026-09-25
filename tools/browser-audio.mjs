import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('artifacts',{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage();
try{
 await page.goto('http://localhost:4173',{waitUntil:'networkidle'});
 const reports=[];
 for(let index=0;index<9;index++){
  const report=await page.evaluate(async index=>{
   const{TRACKS,scoreStep}=await import('/src/music-score.js'),{createAudioGraph,synthNote}=await import('/src/audio-synth.js'),track=TRACKS[index],sr=22050,beat=60/track.bpm,seconds=16*4*beat+2,ctx=new OfflineAudioContext(2,Math.ceil(seconds*sr),sr),graph=createAudioGraph(ctx);
   graph.master.gain.value=.36;let events=0;
   for(let step=0;step<16*16;step++){const score=scoreStep(track,step,{discovery:3});for(const event of score.events){synthNote(ctx,graph,event,.02+step*beat/4+event.offset*beat/4,beat);events++;}}
   const buffer=await ctx.startRendering(),left=buffer.getChannelData(0),right=buffer.getChannelData(1);let peak=0,sum=0,stereo=0,invalid=0;
   for(let i=0;i<left.length;i++){if(!Number.isFinite(left[i])||!Number.isFinite(right[i]))invalid++;peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));sum+=left[i]**2+right[i]**2;stereo+=Math.abs(left[i]-right[i]);}
   let wav=null;if(index===8){const length=buffer.length,bytes=new ArrayBuffer(44+length*4),v=new DataView(bytes),str=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};str(0,'RIFF');v.setUint32(4,36+length*4,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,sr,true);v.setUint32(28,sr*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,length*4,true);for(let i=0;i<length;i++){v.setInt16(44+i*4,Math.max(-32767,Math.min(32767,left[i]*32767)),true);v.setInt16(46+i*4,Math.max(-32767,Math.min(32767,right[i]*32767)),true);}const u8=new Uint8Array(bytes);let s='';for(let i=0;i<u8.length;i+=16384)s+=String.fromCharCode(...u8.subarray(i,i+16384));wav=btoa(s);}
   return{index,id:track.id,bpm:track.bpm,seconds,events,peak,rms:Math.sqrt(sum/(left.length*2)),stereoDifference:stereo/left.length,invalid,wav};
  },index);
  assert.equal(report.invalid,0);assert.ok(report.peak<.99,`Clipping ${report.id}`);assert.ok(report.rms>.003,`Silent ${report.id}`);assert.ok(report.stereoDifference>.0001);if(report.wav)await writeFile('artifacts/tomorrow-radio-preview.wav',Buffer.from(report.wav,'base64'));delete report.wav;reports.push(report);console.log(`Rendered ${report.id}: ${report.events} notes, peak ${report.peak.toFixed(3)}, RMS ${report.rms.toFixed(3)}.`);
 }
 const realtime=await page.evaluate(async()=>{const{Soundscape}=await import('/src/audio.js');const a=new Soundscape();a.start();await new Promise(r=>setTimeout(r,850));const started=a.scheduled;a.set(false);const muted=a.ctx.state;a.set(true);await new Promise(r=>setTimeout(r,400));a.suspend(true);await new Promise(r=>setTimeout(r,100));const hidden=a.ctx.state;a.suspend(false);a.setStudio(true);a.customBpm=112;a.selectTrack(4);await new Promise(r=>setTimeout(r,400));const transport=a.transport(),scheduled=a.scheduled;await a.dispose();return{started,muted,hidden,transport,scheduled};});
 assert.ok(realtime.started>0);assert.equal(realtime.hidden,'suspended');assert.equal(realtime.transport.bpm,112);assert.ok(realtime.scheduled>realtime.started);await writeFile('artifacts/browser-audio.json',JSON.stringify({passed:true,reports,realtime,limitation:'Numerical rendering and scheduler checks, not a human listening or mastering review.'},null,2));console.log('Nine original tracks rendered; clipping, silence, stereo, transport and suspension checks passed.');
}finally{await browser.close();}
