// Vercel Node.js WebSockets: export the HTTP server without calling listen().
// https://vercel.com/docs/functions/websockets (verified 2026-10-21)
// Redis shares presence across instances; clients reconnect before maxDuration.
import {createGhostHttpServer} from '../server/ghost-http.js';
import {getProductionGhostStore} from '../server/ghost-store.js';

export default createGhostHttpServer({getStore:getProductionGhostStore});
