import {getProductionGhostStore} from '../server/ghost-store.js';
import {handleGhostRoom} from '../server/ghost-http.js';

export default function handler(req,res){return handleGhostRoom(req,res,getProductionGhostStore);}
