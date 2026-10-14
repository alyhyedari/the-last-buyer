import {hasBuy,echoUnlocked,wardUnlocked,healingEcho,echoDuration,echoRecharge,pickupRadius} from './frontier-perks.js';
import {earn} from './frontier-state.js';
import {clearSight} from './frontier-world.js';
import {FOREST_COINS,FOREST_MILESTONES} from './frontier-forest-data.js';
import {forestPulseActive} from './frontier-forest-state.js';
export {FOREST_COINS,FOREST_MILESTONES,forestPulseActive};
export const forestCoinOpen=(f,coin)=>!coin.sealed||f.life.forest.opened.includes(coin.id);
export const remainingCoins=f=>FOREST_COINS.filter(c=>!f.life.forest.coins.includes(c.id));
export const nearestForestCoin=(world,f,range=pickupRadius(f))=>world.interior||f.life.expanse.swimming?null:remainingCoins(f).filter(c=>Math.hypot(c.x-f.x,c.y-f.y)<range&&clearSight(world,f,c)).sort((a,b)=>Math.hypot(a.x-f.x,a.y-f.y)-Math.hypot(b.x-f.x,b.y-f.y))[0]||null;
export function collectForestCoin(state,world,id){
 const f=state.frontier,q=f.life.forest,coin=FOREST_COINS.find(c=>c.id===id);
 if(!coin||world.interior||f.mounted||f.life.expanse.swimming||q.coins.includes(id)||Math.hypot(coin.x-f.x,coin.y-f.y)>=pickupRadius(f)||!clearSight(world,f,coin)||!forestCoinOpen(f,coin))return null;
 q.coins.push(id);const milestone=FOREST_MILESTONES.find(m=>m.at===q.coins.length),reward=earn(state,18+(milestone?.reward||0));if(hasBuy(f,2))f.life.health=Math.min(100,f.life.health+6);f.energy=Math.min(100,f.energy+8);
 if(q.tracked===id){q.tracked=null;q.hint=0;}
 return{coin,milestone,reward,count:q.coins.length};
}
export function castForestPulse(state,world){
 const f=state.frontier,q=f.life.forest;
 if(world.interior||f.mounted||f.life.expanse.swimming||!echoUnlocked(f)||f.minutes<q.readyAt)return null;
 q.pulseX=f.x;q.pulseY=f.y;q.pulseUntil=f.minutes+echoDuration(f);q.readyAt=f.minutes+echoRecharge(f);q.casts++;
 const opened=[];for(const coin of remainingCoins(f))if(coin.sealed&&!coin.uv&&!q.opened.includes(coin.id)&&Math.hypot(coin.x-f.x,coin.y-f.y)<4&&clearSight(world,f,coin)){q.opened.push(coin.id);opened.push(coin.id);}
 if(healingEcho(f)){f.life.health=Math.min(100,f.life.health+12);f.energy=Math.min(100,f.energy+12);}
 return{opened,ward:wardUnlocked(f)};
}
export const forestCooldown=f=>Math.max(0,Math.ceil((f.life.forest.readyAt-f.minutes)/1.2));
export function forestCoinActor(f,s,time){
 if(f.life.forest.coins.includes(s.id))return null;
 return{...s,kind:s.uv&&!forestCoinOpen(f,s)?'uvRune':s.kind,variant:forestCoinOpen(f,s)?0:1,height:.18+Math.sin(time*2+s.number)*.04};
}
