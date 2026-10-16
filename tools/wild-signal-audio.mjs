// Local, user-visible Web Audio verification; never included in the production build.
import {createStaticServer} from '../server.mjs';
const server=await createStaticServer();
const handle=server.listeners('request')[0];server.removeAllListeners('request');
server.on('request',(req,res)=>{if(req.url!=='/audio-check'){handle(req,res);return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Wild Signal audio check</title><style>body{background:#13252d;color:#e1dfc5;font:16px system-ui;max-width:850px;margin:3em auto;padding:1em}button{padding:1em;background:#d1f17f;color:#13252d;border:0}pre{white-space:pre-wrap}</style><h1>Wild Signal · audio verification</h1><p>Renders the actual county sound module offline. Checks finite samples, signal, stereo panning, clipping and the pause fade. This is a numerical check, not a listening review.</p><button id="run">Render and verify</button><pre id="report" role="status">Ready.</pre><script type="module">
import {CountyAudio} from '/src/frontier-audio.js';
import {newState} from '/src/state.js';
const report=document.querySelector('#report'),run=document.querySelector('#run');
run.addEventListener('click',async()=>{run.disabled=true;report.textContent='Rendering…';try{const results=[];
 for(const kind of ['reload','guide','shade','spore','mythWarning','mythStag','mythCinder','mythTide','mythClock','mythStorm','mythVoid','wisp','briar','moth','forestCoin','forestAward','forestChime','forestPulse','ufoFriend','ufoEnemy','sentinel','mossling','dive','bubble','inhale','skid','crowd','deer','fox','rabbit','boar','heron','bird','owl','dog','cat','horse','hoof','step','wheel','horn','water','insect','bell','shot','bow','bump','pistol','shotgun','launch','explosion','hurt','thunder','door','zombie','jinn','vampire','watcher','town-motor','paused']){
  const ctx=new OfflineAudioContext(2,22050*2,22050),effects=ctx.createGain();effects.gain.value=.6;effects.connect(ctx.destination);const engine={ctx,graph:{effects},on:true,mutedByPause:false},audio=new CountyAudio(engine,44),state=newState();state.frontier.x=75;state.frontier.y=44;state.village.vehicle='motorcycle';state.frontier.mounted=true;
  if(kind==='town-motor'||kind==='paused')audio.update(state,1,{speed:6,paused:kind==='paused'});else audio.call(kind,.65,.8);
  const buffer=await ctx.startRendering(),left=buffer.getChannelData(0),right=buffer.getChannelData(1);let invalid=0,peak=0,power=0,stereo=0,tail=0;for(let i=0;i<left.length;i++){if(!Number.isFinite(left[i])||!Number.isFinite(right[i]))invalid++;peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));power+=left[i]**2+right[i]**2;stereo+=Math.abs(left[i]-right[i]);if(i>left.length*.75)tail=Math.max(tail,Math.abs(left[i]),Math.abs(right[i]));}const rms=Math.sqrt(power/(2*left.length)),ok=!invalid&&peak<.98&&(kind==='paused'?tail<.00001:peak>.0005&&rms>.00001)&&(kind==='town-motor'||kind==='paused'||stereo>0);audio.dispose();results.push({kind,ok,peak,rms,invalid,stereo:stereo/left.length,tail});
 }
 report.textContent=JSON.stringify({passed:results.every(r=>r.ok),sampleRate:22050,secondsPerCase:2,results},null,2);report.dataset.done='true';
 }catch(error){report.textContent=JSON.stringify({passed:false,error:String(error)});report.dataset.done='true';}finally{run.disabled=false;}});
</script></html>`);});
server.listen(4184,'127.0.0.1',()=>console.log('Audio verification: http://localhost:4184/audio-check'));
