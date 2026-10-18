import {newState,validateState} from './state.js';
import {newFrontierState} from './frontier-state.js';
import {GHOST_MANIFEST} from './ghost-protocol.js';

// Server progress has its own namespace. Never pass the solo SAVE_KEY here.
export function ghostProfileKey(manifest){
 if(!['v','room','worldVersion','seed'].every(key=>manifest?.[key]===GHOST_MANIFEST[key]))throw new Error('Unsupported shared world');
 return 'tlb-echo:'+manifest.worldVersion+':'+manifest.room+':'+manifest.seed;
}
export function readGhostProfile(storage,manifest){
 const key=ghostProfileKey(manifest);let saved;
 try{const raw=storage.getItem(key);if(typeof raw==='string'&&raw.length<2_000_000){const parsed=JSON.parse(raw);if(parsed?.frontier?.seed===manifest.seed&&parsed.zone==='commons')saved=validateState(parsed);}}catch{}
 if(saved&&saved.frontier.seed===manifest.seed&&saved.zone==='commons')return saved;
 const state=newState();state.frontier=newFrontierState(manifest.seed);state.frontier.active=true;
 state.village.vehicle='bike';state.village.vehicles=['bike'];state.village.money=Math.max(180,state.village.money);
 return state;
}
export function writeGhostProfile(storage,manifest,state){
 try{const key=ghostProfileKey(manifest);if(state?.frontier?.seed!==manifest.seed||state.zone!=='commons')return false;const valid=validateState(state);if(!valid||valid.frontier.seed!==manifest.seed||valid.zone!=='commons')return false;const text=JSON.stringify(valid);if(text.length>2_000_000)return false;storage.setItem(key,text);return true;}catch{return false;}
}
