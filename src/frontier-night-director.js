// Authored threat anchors and bounded local activation avoid simulating a whole
// metropolis on every frame. Original zone indexes keep existing kill records.
export const NIGHT_ZONES=[
 [58,43],[69,77],[96,82],[105,103],[26,85],[15,109],[42,99],[51,115],[48,137],[102,145],[38,170],[111,177],
 [224,62],[243,91],[276,51],[294,91],[334,52],[354,91],[222,152],[287,142],[344,163]
].map(([x,y],i)=>({x,y,forest:i>=4&&i<12,city:i>=12,index:i}));
export function nightSchedule(f,night){
 if(f.minutes<(f.life.neon?.reliefUntil||0))return[];
 return NIGHT_ZONES.filter(z=>(z.forest||night||f.life.heat>=55)&&Math.hypot(z.x-f.x,z.y-f.y)<46).sort((a,b)=>Math.hypot(a.x-f.x,a.y-f.y)-Math.hypot(b.x-f.x,b.y-f.y)).slice(0,4).map(z=>({...z,count:night?(z.forest?6:14):z.forest?2:2}));
}
export function nightKind(zone,n,day,night){
 if(!zone.forest&&!night)return'sentinel';
 if(n>=3)return n%7===0?'brute':n%4===0?'runner':'zombie';
 if(zone.index>=8&&zone.index<12)return n===0?'ufoEnemy':n===1?'sentinel':'zombie';
 if(zone.index===0&&n===0)return'robber';
 return ['zombie','jinn','vampire','watcher'][(zone.index+n+day)%4];
}
export function pursuitLevel(world,f){if(world.interior||world.arena)return 0;const count=[...world.hunters?.values()||[]].filter(p=>p.alert&&(f.life.combat.actors[p.id]?.hp??1)>0&&Math.hypot(p.x-f.x,p.y-f.y)<24).length;return count>=8?3:count>=4?2:count?1:0;}
