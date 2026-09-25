// Original, authored motifs. Timing and arrangement are independent of the renderer.
export const STEMS=['drums','bass','harmony','lead','texture'];
export const DEFAULT_PATTERN=[
 [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0],
 [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
 [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
 [1,0,0,1,0,0,1,0,1,0,0,0,0,1,0,0]
];
export function validatePattern(value){return Array.isArray(value)&&value.length===4&&value.every(row=>Array.isArray(row)&&row.length===16&&row.every(n=>n===0||n===1));}
const minor=[[0,3,7,10],[-4,0,3,7],[3,7,10,14],[-2,2,5,9]],dorian=[[0,3,7,10],[5,9,12,16],[3,7,10,14],[-2,2,5,9]],warm=[[0,4,7,11],[-3,0,4,7],[5,9,12,16],[7,11,14,17]];
const track=(id,bpm,root,chords,motif,answer,groove,swing=.08)=>({id,bpm,root,chords,motif,answer,groove,swing});
export const TRACKS=[
 track('unanswered',86,50,minor,[12,null,19,17,15,null,14,10,12,null,7,10,14,15,12,null],[24,null,22,19,17,19,15,null,14,10,12,null,7,10,12,null],'dust',.11),
 track('firsthands',76,48,minor,[12,15,null,19,17,null,15,12,10,null,7,10,12,null,15,null],[19,22,19,null,17,15,12,null,15,null,10,7,12,null,null,null],'hand',.04),
 track('packetlights',106,52,dorian,[12,19,22,null,19,15,14,12,17,21,24,null,22,19,15,null],[24,22,19,15,14,null,17,19,22,null,26,24,22,19,17,null],'break',.09),
 track('paperwater',80,45,minor,[12,null,null,15,14,null,10,null,12,null,7,null,10,null,14,null],[19,null,17,15,14,null,12,null,10,null,7,10,12,null,null,null],'half',.04),
 track('genesis',108,50,dorian,[12,19,22,19,17,14,15,null,12,15,19,22,24,null,22,19],[24,26,27,null,26,24,22,19,17,19,22,null,15,14,12,null],'pulse',.02),
 track('tablefortwo',78,48,warm,[16,null,19,14,12,null,11,7,12,null,16,19,23,null,19,null],[24,null,23,19,16,14,12,null,11,12,16,null,14,null,12,null],'brush',.17),
 track('halted',98,47,minor,[12,12,null,19,17,null,15,14,12,null,10,7,10,14,12,null],[24,null,19,22,19,17,15,null,14,12,10,null,7,10,12,null],'break',.04),
 track('openreceipt',90,50,dorian,[12,null,15,19,22,null,19,17,15,null,14,12,10,12,15,null],[24,null,26,22,19,null,17,15,14,12,10,null,12,null,null,null],'pulse',.06),
 track('tomorrowcommons',94,50,dorian,[12,null,19,22,19,17,15,null,14,null,17,21,19,15,12,null],[24,22,19,null,17,19,22,26,24,null,22,19,17,15,14,null],'dust',.12)
];
export function arrangement(bar){const section=Math.floor((bar%64)/8);return{section,drums:section!==4,bass:section!==0&&section!==4,harmony:true,lead:section!==2&&section!==4,texture:section>=1,energy:[.63,.8,.84,1,.5,.77,.94,.68][section]};}
export function scoreStep(track,absoluteStep,{intensity=0,discovery=0,studio=false,pattern=DEFAULT_PATTERN}={}){
 const step=absoluteStep%16,bar=Math.floor(absoluteStep/16),a=arrangement(bar),chord=track.chords[Math.floor(bar/2)%4],events=[],swing=step%2?track.swing:0;
 const add=(kind,note,velocity,duration,pan=0,offset=swing)=>events.push({kind,note,velocity,duration,pan,offset});
 if(step===0){chord.forEach((n,i)=>add('pad',track.root+n,.16*a.energy,8.1,(i-1.5)*.32,0));if(bar%2===0)chord.forEach((n,i)=>add('keys',track.root+12+n,.16,3.6,(i-1.5)*.2,i*.06));}
 if(a.bass||studio){if([0,6,8,14].includes(step))add('bass',track.root-12+chord[step===14?2:0],step===0?.42:.3,step===14?.5:1.15,0);}
 if(a.drums||studio){
  const kick=studio?pattern[0][step]:[0,8].includes(step)||(['break','pulse'].includes(track.groove)&&step===6)||(bar%4===3&&step===14);
  const snare=studio?pattern[1][step]:track.groove==='half'?step===8:[4,12].includes(step);
  const hat=studio?pattern[2][step]:step%2===0||(a.section===3&&step%2===1)||(bar%4===3&&step===15);
  if(kick)add('kick',0,track.groove==='brush'?.52:.8,.35);
  if(snare)add(track.groove==='hand'?'rim':'snare',0,track.groove==='brush'?.32:.54,.2,.12);
  if(hat)add('hat',0,step%4===2?.31:.18,.09,step%4===0?-.4:.4);
  if(!studio&&bar%4===3&&[10,13,15].includes(step))add('rim',0,.2,.12,-.28);
 }
 if(studio){if(pattern[3][step])add('pluck',track.root+12+chord[Math.floor(step/3)%4],.23,.7,(step%3-1)*.4);}
 else if(a.lead&&step%2===0){const phrase=a.section>=3?track.answer:track.motif,n=phrase[(bar%2)*8+step/2];if(n!==null)add('lead',track.root+n,.26*a.energy,step%4===0?.82:.58,Math.sin(bar*.5)*.23);}
 if(a.texture&&(step%4===2||discovery>=2&&step%4===0))add('pluck',track.root+24+chord[Math.floor(step/4)%4],.085+discovery*.014,.9,(step%8<4?-.66:.66));
 if(intensity>.5&&step%4===0)add('pulse',track.root-12,.19,.3,0);
 return{events,bar,step,section:a.section};
}
