import {newState,defaultSettings} from './state.js';
import {makeFrontierWorld,placeById,route} from './frontier-world.js';
import {FrontierRenderer} from './frontier-renderer.js';
import {worldActors} from './frontier-life.js';
import {updateThreats,updateProjectiles,weatherHazard} from './frontier-combat.js';
import {updateMyths} from './frontier-myth.js';

// Isolated scenes use the shipped renderer and simulation, never the user's save.
export function createBenchmarkScenes(canvas){
 const began=performance.now(),world=makeFrontierWorld(91),worldBuildMs=performance.now()-began;
 const routeStart=performance.now();route(world,placeById('gate'),placeById('lastsanctum'),.48);const routeMs=performance.now()-routeStart;
 const settings={...defaultSettings(),quality:'high',sound:false,reducedMotion:false},renderer=new FrontierRenderer(canvas,world,settings);
 let state,stageId,time=0,step=0,baseAngle=0;
 const setup=id=>{stageId=id;state=newState();const f=state.frontier;f.seed=91;f.minutes=540;f.life.combat.graceUntil=1e7;state.village.weapon='rifle';state.village.weapons=['rifle'];world.people?.clear();world.hunters?.clear();world.myth?.clear();world.trafficMemory?.clear();world.effects=[];world.projectiles=[];time=0;step=0;
  const point=id==='city'?[74.2,47,1.5]:id==='forest'?[154.5,226.5,1.3]:id==='boss'?[173.5,220.5,-Math.PI/2]:[149.5,167.5,-1.2];[f.x,f.y,baseAngle]=point;f.angle=baseAngle;
  if(id==='forest'){f.minutes=1320;Object.assign(f.life.forest,{uvOwned:true,light:'uv'});}
  if(id==='boss'){for(let m=540;m<14400;m+=5){f.minutes=m;if(weatherHazard(f).storm)break;}Object.assign(f.life.forest,{uvOwned:true,light:'uv'});}
  if(id==='water'){Object.assign(f.life.expanse,{swimming:true,depth:1,shore:{x:149.5,y:181.5}});}
 };
 function draw(dt){const f=state.frontier,start=performance.now();time+=dt;f.minutes+=dt*1.2;f.angle=baseAngle+Math.sin(time*.8)*.6;const actors=worldActors(world,f,f.minutes/1.2);updateThreats(state,world,actors,dt,time);updateMyths(state,world,dt);
  if(stageId==='boss'&&step++%35===0)world.projectiles.push({id:step,kind:'rocket',x:f.x,y:f.y,angle:f.angle,age:0,speed:16,ttl:2.2,blast:3.3,damage:135,height:.55});
  updateProjectiles(state,world,actors,dt);for(const e of world.effects)e.age+=dt;world.effects=world.effects.filter(e=>e.age<e.ttl);
  if(stageId==='boss'){const guardian=world.myth.get('boss-stag');if(guardian&&step===1){guardian.next=f.minutes;guardian.windup=f.minutes+.4;guardian.tx=f.x;guardian.ty=f.y;}}
  const simulationMs=performance.now()-start;renderer.render(state,time,{actors,speed:0});const workMs=performance.now()-start;canvas.dataset.benchmarkScene=stageId;canvas.dataset.benchmarkWorkMs=workMs.toFixed(2);canvas.dataset.benchmarkSimulationMs=simulationMs.toFixed(2);canvas.dataset.benchmarkActors=String(actors.length);return{simulationMs,workMs,actors:actors.length};
 }
 return{setup,draw,worldBuildMs,routeMs};
}
