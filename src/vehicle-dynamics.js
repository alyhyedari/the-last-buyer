// Fictional powertrains. The simulation uses seconds and world-units, not manufacturer data.
const profiles={
 sedan:[4,6200,.28,'classic'],coupe:[6,7400,.19,'sport'],taxi:[4,5800,.35,'classic'],utility:[4,4800,.42,'offroad'],
 vanta:[10,9000,.12,'sport'],ibex:[6,5600,.33,'offroad'],citadel:[8,4400,.5,'armored'],flux:[0,12000,.07,'electric'],
 razor:[12,9400,.11,'sport'],comet:[6,8200,.16,'sport'],atlas:[6,6000,.3,'offroad'],spectra:[0,16000,.05,'electric'],drifter:[6,7800,.24,'sport'],warden:[8,6500,.32,'luxury'],
 needle:[2,11000,.13,'bike'],ronin:[4,14000,.09,'bike'],nomad:[1,8200,.26,'bike'],spectre:[0,14000,.06,'electric']};
export function engineFor(id){const [cylinders,redline,response,cabin]=profiles[id]||profiles.sedan;return{cylinders,redline,response,cabin,id,idle:cylinders===0?0:cabin==='bike'?1300:780,gears:cylinders===0?1:cabin==='offroad'?5:6};}
const smooth=(a,b,dt,t)=>a+(b-a)*(1-Math.exp(-dt/t));
export function powertrainStep(m,{vehicle,throttle=0,brake=false,dt,maxSpeed=vehicle.speed}){
 const e=vehicle.engine;if(!e||dt<=0)return m;const previous=m.engineId;m.engineId=e.id;
 if(previous!==e.id){m.gear=1;m.rpm=e.idle;m.gas=0;m.shiftTime=0;}
 const gas=brake?0:Math.min(1,Math.abs(throttle));m.gas=smooth(m.gas||0,gas,dt,e.response);m.load=smooth(m.load||0,gas,dt,.18);
 const fraction=Math.min(1.3,Math.abs(m.speed)/Math.max(1,maxSpeed));m.shiftTime=Math.max(0,(m.shiftTime||0)-dt);
 if(throttle<0&&m.speed<.1)m.gear=-1;else if(m.gear<1)m.gear=1;
 const gears=e.gears,ratio=(g)=>gears===1?fraction: fraction*gears/(g*.78+.22);
 let ratioNow=ratio(Math.max(1,m.gear));
 if(m.gear>0&&gears>1&&m.shiftTime===0){if(ratioNow>.9&&m.gear<gears){m.gear++;m.shiftTime=.18;}else if(ratioNow<.37&&m.gear>1){m.gear--;m.shiftTime=.13;}ratioNow=ratio(m.gear);}
 const desired=e.idle+(e.redline-e.idle)*Math.min(.99,Math.max(ratioNow,gas*.2));m.rpm=smooth(m.rpm||e.idle,desired,dt,.09);
 m.torque=m.shiftTime>0?.28:Math.max(.52,1-Math.abs(m.rpm/e.redline-.58)*.6);m.boost=smooth(m.boost||0,gas>.8&&fraction>.12?1:0,dt,.6);
 m.powerThrottle=Math.sign(throttle)*m.gas;m.lowRange=!!vehicle.lowRange;return m;
}
export function engineSound(e,m){const load=Math.max(0,Math.min(1,m.load||0)),rpm=Math.max(e.idle,Math.min(e.redline,m.rpm||e.idle));return{wave:e.cylinders===0?'sine':e.cylinders<=2?'triangle':'sawtooth',frequency:e.cylinders===0?85+rpm/23:Math.max(22,rpm*e.cylinders/240),gain:.025+load*.065,filter:180+load*950+rpm*.06,harmonic:e.cylinders===0?2.01:e.cylinders>=8?1.5:2};}
