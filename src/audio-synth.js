import {rng} from './art.js';
export const frequency=midi=>440*2**((midi-69)/12);
export function createAudioGraph(ctx,destination=ctx.destination){
 const master=ctx.createGain(),compressor=ctx.createDynamicsCompressor(),music=ctx.createGain(),effects=ctx.createGain(),filter=ctx.createBiquadFilter(),reverb=ctx.createConvolver(),wet=ctx.createGain(),delay=ctx.createDelay(2),feedback=ctx.createGain(),delayWet=ctx.createGain();
 master.gain.value=.32;music.gain.value=.68;effects.gain.value=.5;compressor.threshold.value=-17;compressor.knee.value=16;compressor.ratio.value=3;compressor.attack.value=.01;compressor.release.value=.24;
 filter.type='lowpass';filter.frequency.value=11000;filter.Q.value=.25;music.connect(filter);filter.connect(master);effects.connect(master);master.connect(compressor);compressor.connect(destination);
 const impulse=ctx.createBuffer(2,Math.ceil(ctx.sampleRate*1.8),ctx.sampleRate),r=rng(17844);for(let ch=0;ch<2;ch++){const data=impulse.getChannelData(ch);for(let i=0;i<data.length;i++)data[i]=(r()*2-1)*((1-i/data.length)**3.3)*.5;}reverb.buffer=impulse;reverb.connect(wet);wet.gain.value=.18;wet.connect(music);delay.delayTime.value=.32;feedback.gain.value=.24;delayWet.gain.value=.14;delay.connect(feedback);feedback.connect(delay);delay.connect(delayWet);delayWet.connect(music);
 const noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),nd=noise.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=r()*2-1;
 return{master,compressor,music,effects,filter,reverb,wet,delay,delayWet,feedback,noise};
}
function envelope(ctx,time,attack,decay,sustain,release,velocity){const gain=ctx.createGain();gain.gain.setValueAtTime(.0001,time);gain.gain.linearRampToValueAtTime(velocity,time+attack);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,velocity*sustain),time+attack+decay);gain.gain.exponentialRampToValueAtTime(.0001,time+release);return gain;}
function cleanup(sources,nodes){let left=sources.length;for(const source of sources)source.onended=()=>{source.disconnect();if(--left===0)for(const node of nodes)node.disconnect();};}
export function synthNote(ctx,graph,event,time,beat=.65,bus=null){
 const {kind,note,velocity,duration,pan=0}=event;
 const output=bus||graph.music;
 if(['kick','snare','hat','rim'].includes(kind)){percussion(ctx,graph,kind,time,velocity,pan,output);return;}
 const release=Math.max(.07,duration*beat),pitch=frequency(note),panner=ctx.createStereoPanner(),filter=ctx.createBiquadFilter();panner.pan.value=pan;filter.type='lowpass';filter.Q.value=.45;
 const isPad=kind==='pad',bass=kind==='bass'||kind==='pulse',attack=isPad?.22:kind==='lead'?.018:.007;
 const gain=envelope(ctx,time,attack,isPad?.6:.12,isPad?.8:bass?.65:.32,release,velocity*(isPad?.24:bass?.45:.28));
 filter.frequency.setValueAtTime(isPad?1800:bass?680:kind==='keys'?3600:6200,time);if(!isPad)filter.frequency.exponentialRampToValueAtTime(bass?180:kind==='keys'?900:1700,time+release*.8);
 gain.connect(filter);filter.connect(panner);panner.connect(output);if(!bass){panner.connect(graph.reverb);if(kind==='pluck'||kind==='lead')panner.connect(graph.delay);}
 const sources=[],types=isPad?['triangle','sine']:kind==='keys'?['sine','sine']:bass?['triangle','sine']:['triangle','sine'];
 types.forEach((type,i)=>{const o=ctx.createOscillator();o.type=type;o.frequency.value=pitch*(kind==='keys'&&i===1?2:1);o.detune.value=isPad?(i===0?-5:5):kind==='lead'?(i===0?-3:3):0;const partial=ctx.createGain();partial.gain.value=i===0?.72:kind==='keys'?.19:.28;o.connect(partial);partial.connect(gain);o.start(time);o.stop(time+release+.025);sources.push(o);o._partial=partial;});cleanup(sources,[gain,filter,panner,...sources.map(o=>o._partial)]);
}
function percussion(ctx,graph,kind,time,velocity,pan,output){
 const p=ctx.createStereoPanner();p.pan.value=pan;p.connect(output);const sources=[],nodes=[p];
 if(kind==='kick'||kind==='rim'){
  const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(kind==='kick'?155:380,time);o.frequency.exponentialRampToValueAtTime(kind==='kick'?46:165,time+.08);g.gain.setValueAtTime(velocity*(kind==='kick'?.55:.24),time);g.gain.exponentialRampToValueAtTime(.0001,time+(kind==='kick'?.35:.085));o.connect(g);g.connect(p);o.start(time);o.stop(time+.38);sources.push(o);nodes.push(g);
 }else{
  const noise=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();noise.buffer=graph.noise;filter.type=kind==='hat'?'highpass':'bandpass';filter.frequency.value=kind==='hat'?7400:1700;filter.Q.value=kind==='hat'?.6:.7;g.gain.setValueAtTime(velocity*(kind==='hat'?.24:.47),time);g.gain.exponentialRampToValueAtTime(.0001,time+(kind==='hat'?.055:.18));noise.connect(filter);filter.connect(g);g.connect(p);noise.start(time,(time*.31)%Math.max(.01,graph.noise.duration-.22));noise.stop(time+.21);sources.push(noise);nodes.push(filter,g);
  if(kind==='snare'){const o=ctx.createOscillator(),body=ctx.createGain();o.type='triangle';o.frequency.value=185;body.gain.setValueAtTime(velocity*.16,time);body.gain.exponentialRampToValueAtTime(.0001,time+.1);o.connect(body);body.connect(p);o.start(time);o.stop(time+.11);sources.push(o);nodes.push(body);}
 }
 cleanup(sources,nodes);
}
