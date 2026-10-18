// Vercel native WebSockets public beta, official docs updated August 10, 2026:
// https://vercel.com/docs/functions/websockets
// Requires Fluid Compute and a TCP Redis service in the same region. Connections
// rotate before maxDuration; shared leases/pub/sub survive function cold starts.
import {createGhostHttpServer} from '../server/ghost-http.js';
import {getProductionGhostStore} from '../server/ghost-store.js';

export default createGhostHttpServer({getStore:getProductionGhostStore});
