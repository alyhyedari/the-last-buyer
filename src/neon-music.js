import {synthNote} from './audio-synth.js';
import {districtMode} from './neon-world.js';
import {gameHour} from './frontier-state.js';
import {terrainHeight} from './frontier-terrain.js';
// Original motifs. No network requests, decoded music files or unbounded voices.
export const REGION_SCORES={
 city:{bpm:108,root:50,chords:[[0,3,7,10],[5,9,12,14],[3,7,10,14],[-2,2,5,9]],motif:[12,null,19,22,19,17,null,15,14,null,17,21,19,15,null,12],drums:.42},
 waterfront:{bpm:84,root:53,chords:[[0,4,7,11],[5,9,12,16],[-3,0,4,7],[7,11,14,17]],motif:[16,null,19,null,23,19,16,null,14,null,11,12,16,null,14,null],drums:.2},
 forest:{bpm:76,root:50,chords:[[0,3,7,14],[-2,2,5,12],[5,9,12,16],[0,3,7,10]],motif:[12,null,null,19,15,null,14,null,7,null,12,null,15,14,null,null],drums:.12},
 mountain:{bpm:68,root:48,chords:[[0,7,12,16],[5,12,16,19],[-3,4,7,12],[0,7,14,16]],motif:[24,null,19,null,null,16,null,12,19,null,null,24,23,null,19,null],drums:.08},
 night:{bpm:94,root:47,chords:[[0,3,7,10],[-1,3,6,10],[-4,0,3,7],[-2,2,5,9]],motif:[12,19,null,15,14,null,10,null,7,12,null,14,10,null,7,null],drums:.3},
 driving:{bpm:124,root:45,chords:[[0,3,7,10],[5,8,12,15],[3,7,10,14],[-2,2,5,9]],motif:[12,19,22,19,17,15,14,null,12,19,24,22,19,17,15,null],drums:.65},
 underwater:{bpm:62,root:55,chords:[[0,4,7,14],[-3,0,4,11],[5,9,12,16],[0,7,11,14]],motif:[24,null,null,19,null,16,null,null,14,null,12,null,19,null,null,null],drums:0},
 indoor:{bpm:78,root:48,chords:[[0,4,7,11],[-3,0,4,7],[5,9,12,16],[7,11,14,17]],motif:[16,null,19,null,12,null,11,null,7,null,12,16,14,null,12,null],drums:.1},
 battle:{bpm:138,root:38,chords:[[0,3,7,10],[1,4,7,11],[-2,2,5,8],[0,3,6,10]],motif:[12,12,19,null,18,15,14,12,12,19,24,22,18,15,14,null],drums:.8},
 conflict:{bpm:118,root:41,chords:[[0,3,6,10],[-2,1,5,8],[1,4,7,11],[0,3,7,10]],motif:[12,null,12,19,18,null,15,14,12,null,10,7,10,14,12,null],drums:.62}
};
export function musicRegion(state,actors=[],speed=0){const f=state.frontier,boss=actors.find(a=>a.boss&&!a.dead&&Math.hypot(a.x-f.x,a.y-f.y)<22);if(boss&&f.life.combat.arena)return{key:'battle',phase:boss.phase||1,voice:boss.variant||0};if(f.life.expanse.swimming&&f.life.expanse.depth>.45)return{key:'underwater'};if(f.life.combat.interior)return{key:'indoor'};if(districtMode(f)==='conflict')return{key:'conflict'};if(f.mounted&&speed>3)return{key:'driving'};if(terrainHeight(f.x,f.y)>5)return{key:'mountain'};if(gameHour(f)<6||gameHour(f)>=19)return{key:'night'};if(f.x>198)return{key:f.y>119?'waterfront':'city'};return{key:'forest'};}
export function regionalStep(region,step){const score=REGION_SCORES[region.key]||REGION_SCORES.forest,phase=region.phase||1,beat=step%16,bar=Math.floor(step/16),root=score.root+(region.voice||0)%4,chord=score.chords[Math.floor(bar/2)%4],events=[];
 const add=(kind,note,velocity,duration,pan=0)=>events.push({kind,note,velocity,duration,pan,offset:0});
 if(beat===0)chord.forEach((n,i)=>add('pad',root+n,.11,4.2,(i-1.5)*.28));
 if(score.drums&&[0,8,...(phase>=2?[6,14]:[])].includes(beat))add('kick',0,score.drums,.25);
 if(score.drums&&[4,12].includes(beat))add(region.key==='battle'?'snare':'rim',0,score.drums*.55,.16,.1);
 if(score.drums>.25&&beat%2===0)add('hat',0,.08+score.drums*.1,.07,beat%4?-.35:.35);
 if([0,6,8,14].includes(beat))add('bass',root-12+chord[beat===14?2:0],.21,beat===14?.4:1.2);
 const note=score.motif[(beat+bar%2*8)%16];if(note!==null&&(score.drums>.4||beat%2===0))add(region.key==='battle'?'pulse':'keys',root+note,region.key==='battle'?.12:.17,.8,Math.sin(bar*.7)*.35);
 if(phase===3&&beat%4===2)add('pluck',root+24+chord[Math.floor(beat/4)],.12,.5,beat%8?-.6:.6);
 return{events,bpm:score.bpm+(region.key==='battle'?(phase-1)*8:0)};
}
export class RegionalScore{
 constructor(audio){this.audio=audio;this.ctx=audio.ctx;this.bus=this.ctx.createGain();this.bus.gain.value=0;this.bus.connect(audio.graph.music);this.step=0;this.next=0;this.region=null;this.lastChange=-10;this.scheduled=0;}
 update(state,actors,speed,paused){const a=this.audio,c=this.ctx,now=c.currentTime,enabled=a.on&&!a.mutedByPause&&!a.trackPinned&&!a.studio;a.regionalOwner=enabled?this:null;this.bus.gain.setTargetAtTime(enabled?.62:0,now,.25);if(!enabled||c.state!=='running')return;
  const wanted=paused&&this.region?this.region:musicRegion(state,actors,speed);if(!this.region){this.region=wanted;this.next=now+.04;}else if((wanted.key!==this.region.key||wanted.phase!==this.region.phase||wanted.voice!==this.region.voice)&&now-this.lastChange>3)this.pending=wanted;else this.pending=null;
  if(this.next<now-.2)this.next=now+.04;let count=0;while(this.next<now+.12&&count++<4){if(this.pending&&this.step%16===0){this.region=this.pending;this.pending=null;this.lastChange=now;}
   const {events,bpm}=regionalStep(this.region,this.step++),beat=60/bpm;for(const event of events){const stem=['kick','snare','hat','rim'].includes(event.kind)?'drums':['bass','pulse'].includes(event.kind)?'bass':event.kind==='pad'?'harmony':event.kind==='keys'?'lead':'texture';if(a.stems[stem]===false)continue;synthNote(c,a.graph,event,this.next,beat,this.bus);this.scheduled++;}this.next+=beat/4;
  }
 }
 dispose(){if(this.audio.regionalOwner===this)this.audio.regionalOwner=null;this.bus.disconnect();}
}
