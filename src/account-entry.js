import {createCloudAccount} from './account-ui.js';
import {newState,validateState,writeSave} from './state.js';
import {GHOST_MANIFEST} from './ghost-protocol.js';
import {readGhostProfile,writeGhostProfile} from './ghost-profile.js';
export function mountAccount({getState,setState,storage,getSession,isPlaying,showPanel}){return createCloudAccount({showPanel,getSave:async slot=>slot==='solo'?(getSession()?.offlineState??getState()):(getSession()?getState():readGhostProfile(storage,GHOST_MANIFEST)),restore:async(slot,input)=>{if(isPlaying())throw Error('temporarily_unavailable');const next=validateState(input);if(!next)throw Error('invalid_save');if(slot==='solo'){next.player.age=getState()?.player?.age??null;if(!writeSave(storage,next))throw Error('temporarily_unavailable');setState(next);}else if(!writeGhostProfile(storage,GHOST_MANIFEST,next))throw Error('invalid_save');}});}
