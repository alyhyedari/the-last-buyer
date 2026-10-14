// Compact predicates shared by save-safe simulation; content and art stay lazy.
export const hasBuy=(f,n)=>f.life.forest?.coins.includes('buy-'+String(n).padStart(2,'0'))||false;
export const hasGme=(f,id)=>f.life.forest?.gme?.includes(id)||false;
export const echoUnlocked=f=>hasBuy(f,3)||f.life.forest.coins.length>=3;
export const wardUnlocked=f=>hasBuy(f,6)||f.life.forest.coins.length>=6;
export const healingEcho=f=>hasBuy(f,12)||f.life.forest.coins.length>=12;
export const echoRadius=f=>hasBuy(f,13)?42:28;
export const echoDuration=f=>hasGme(f,'stag')?14.4:9.6;
export const echoRecharge=f=>(hasBuy(f,27)?18:hasBuy(f,9)||f.life.forest.coins.length>=9?24:36)*(hasGme(f,'clock')?.75:1);
export const pickupRadius=f=>hasBuy(f,26)?3:1.7;
export const walkPower=f=>(hasBuy(f,8)?1.1:1)*(hasGme(f,'stag')?1.18:1);
export const lightRange=f=>f.life.forest.light==='uv'?(hasBuy(f,15)?22:14):(hasBuy(f,25)?18:11);
export const swimPower=f=>hasGme(f,'tide')?1.4:1;
