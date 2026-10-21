// Legacy platform adapter. The verified deployment entry is server/network-server.mjs.
// Platform-specific WebSocket hosting must be verified before deploying this adapter.
import {createGhostHttpServer} from '../server/ghost-http.js';
import {getProductionGhostStore} from '../server/ghost-store.js';

export default createGhostHttpServer({getStore:getProductionGhostStore});
