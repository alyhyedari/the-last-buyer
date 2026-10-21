import {forestCoinId} from './frontier-forest-state.js';
// Authored glades have permanent IDs and positions across seeds and save versions.
// The surrounding vegetation is seeded; the last stretch is always walkable.
export const FOREST_COINS=[
 [23.5,94.5,'deepforest','roots',false], [13.5,101.5,'deepforest','log',false],
 [42.5,96.5,'quarry','stones',false], [9.5,115.5,'ruins','arch',false],
 [67.5,138.5,'lostwoods','mushrooms',false], [87.5,137.5,'lostwoods','roots',true],
 [52.5,149.5,'lostwoods','stones',false], [103.5,153.5,'lostwoods','arch',false],
 [20.5,157.5,'starfall','log',true], [40.5,164.5,'starfall','mushrooms',false],
 [63.5,178.5,'starfall','stones',false], [110.5,179.5,'starfall','arch',true],
 [143.5,205.5,'oldgrowth','roots',false],[154.5,226.5,'oldgrowth','log',false],[187.5,203.5,'oldgrowth','mushrooms',true],
 [197.5,229.5,'oldgrowth','arch',false],[217.5,247.5,'emberpath','stones',false],[235.5,219.5,'emberpath','log',true],
 [260.5,225.5,'emberpath','arch',false],[277.5,248.5,'emberpath','mushrooms',false],[309.5,239.5,'moonfen','roots',true],
 [347.5,254.5,'moonfen','stones',false],[321.5,282.5,'moonfen','log',false],[176.5,299.5,'clockwood','arch',true],
 [219.5,302.5,'clockwood','roots',false],[247.5,320.5,'stormwood','stones',false],[274.5,296.5,'stormwood','mushrooms',true],
 [309.5,326.5,'stormwood','arch',false],[327.5,355.5,'lastsanctum','log',true],[367.5,368.5,'lastsanctum','stones',true]
].map(([x,y,trail,landmark,sealed],i)=>({id:forestCoinId(i),x,y,trail,landmark,sealed,uv:sealed&&i>=14,kind:'buyCoin',variant:i%3,number:i+1}));
export const FOREST_MILESTONES=[{at:1,reward:30,key:'award1'},{at:3,reward:70,key:'award3'},{at:6,reward:100,key:'award6'},{at:9,reward:150,key:'award9'},{at:12,reward:250,key:'award12'},{at:18,reward:300,key:'award18'},{at:24,reward:400,key:'award24'},{at:30,reward:600,key:'award30'}];
export const inDeepForest=(x,y)=>(x<57&&y>78&&y<124)||(x<129&&y>127&&y<187)||(x>130&&x<384&&y>190&&y<384);
