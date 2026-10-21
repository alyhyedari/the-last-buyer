import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer,Server} from 'node:http';
import {once} from 'node:events';
import room from '../api/ghost-room.js';
import socket from '../api/ghost-socket.js';

test('Vercel room export handles unsupported methods without loading Redis',async t=>{
 assert.equal(typeof room,'function');const server=createServer(room);server.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeIdleConnections();}));
 const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/ghost-room',{method:'POST'});
 assert.equal(response.status,405);assert.equal(response.headers.get('allow'),'GET, HEAD');
});
test('Vercel WebSocket export is an unbound HTTP server with an upgrade handler',async t=>{
 assert.ok(socket instanceof Server);assert.equal(socket.listening,false);assert.ok(socket.listenerCount('upgrade')>0);
 socket.listen(0,'127.0.0.1');await once(socket,'listening');t.after(()=>new Promise(resolve=>{socket.close(resolve);socket.closeIdleConnections();}));
 const response=await fetch('http://127.0.0.1:'+socket.address().port+'/api/ghost-socket');
 assert.equal(response.status,426);assert.equal(response.headers.get('upgrade'),'websocket');assert.deepEqual(await response.json(),{error:'WebSocket upgrade required'});
});
