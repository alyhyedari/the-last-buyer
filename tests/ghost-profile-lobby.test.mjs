import test from 'node:test';
import assert from 'node:assert/strict';
import {ghostProfileKey,readGhostProfile,writeGhostProfile} from '../src/ghost-profile.js';
import {mountGhostLobby} from '../src/ghost-lobby.js';
import {GHOST_MANIFEST,roomInfo,makeWelcome} from '../src/ghost-protocol.js';
import {SAVE_KEY,newState,validateState} from '../src/state.js';
import {setLanguage} from '../src/i18n.js';
import {GT} from '../src/ghost-text.js';

function store(initial=[]){const data=new Map(initial),reads=[],writes=[];return{data,reads,writes,getItem(key){reads.push(key);return data.get(key)??null;},setItem(key,value){writes.push(key);data.set(key,value);}};}
test('echo progress has an independent namespace and never reads, writes or mutates the solo save',()=>{
 const solo=newState();solo.village.money=777;const raw=JSON.stringify(solo),storage=store([[SAVE_KEY,raw]]),state=readGhostProfile(storage,GHOST_MANIFEST),key=ghostProfileKey(GHOST_MANIFEST);
 assert.notEqual(key,SAVE_KEY);assert.deepEqual(storage.reads,[key]);assert.equal(state.frontier.seed,GHOST_MANIFEST.seed);assert.equal(state.frontier.active,true);assert.equal(state.village.vehicle,'bike');assert.equal(state.village.money,180);assert.ok(validateState(state));
 state.village.money=234;state.frontier.worldMinutes=999999;state.frontier.ghosts=[{id:'other'}];const before=structuredClone(state);assert.ok(writeGhostProfile(storage,GHOST_MANIFEST,state));assert.deepEqual(state,before);assert.deepEqual(storage.writes,[key]);assert.equal(storage.data.get(SAVE_KEY),raw);
 const loaded=readGhostProfile(storage,GHOST_MANIFEST);assert.equal(loaded.village.money,234);assert.equal('worldMinutes'in loaded.frontier,false);assert.equal('ghosts'in loaded.frontier,false);assert.equal(storage.data.get(SAVE_KEY),raw);
});

test('invalid room profiles fail closed without overwriting stored data',()=>{
 const storage=store(),key=ghostProfileKey(GHOST_MANIFEST),state=readGhostProfile(storage,GHOST_MANIFEST);assert.ok(writeGhostProfile(storage,GHOST_MANIFEST,state));const saved=storage.data.get(key);
 for(const changes of [{seed:GHOST_MANIFEST.seed+1},{seed:GHOST_MANIFEST.seed+.2},{seed:NaN}]){const bad=structuredClone(state);Object.assign(bad.frontier,changes);assert.equal(writeGhostProfile(storage,GHOST_MANIFEST,bad),false);assert.equal(storage.data.get(key),saved);}
 const invalid=structuredClone(state);invalid.solved=['foreign'];assert.equal(writeGhostProfile(storage,GHOST_MANIFEST,invalid),false);assert.equal(storage.data.get(key),saved);
 for(const manifest of [{...GHOST_MANIFEST,room:SAVE_KEY},{...GHOST_MANIFEST,worldVersion:'other'},{...GHOST_MANIFEST,v:GHOST_MANIFEST.v+1}]){assert.throws(()=>ghostProfileKey(manifest));assert.equal(writeGhostProfile(storage,manifest,state),false);}
 for(const raw of ['{',JSON.stringify({...state,frontier:{...state.frontier,seed:GHOST_MANIFEST.seed+.1}}),'x'.repeat(2_000_000)]){storage.data.set(key,raw);const fresh=readGhostProfile(storage,GHOST_MANIFEST);assert.equal(fresh.frontier.seed,GHOST_MANIFEST.seed);assert.equal(fresh.village.money,180);assert.equal(storage.data.get(key),raw);}
 const blocked={getItem(){throw Error('unavailable');},setItem(){throw Error('quota');}};assert.ok(validateState(readGhostProfile(blocked,GHOST_MANIFEST)));assert.equal(writeGhostProfile(blocked,GHOST_MANIFEST,state),false);
});

class Element{
 constructor(tag='',text=''){this.tag=tag;this._text=text;this.children=[];this.listeners={};this.attrs={};this.disabled=false;this.hidden=false;this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c)};}
 append(...children){this.children.push(...children);}
 addEventListener(name,fn){this.listeners[name]=fn;}
 setAttribute(name,value){this.attrs[name]=value;if(name==='disabled')this.disabled=true;if(name==='hidden')this.hidden=true;}
 set textContent(value){this._text=value;this.children=[];}
 get textContent(){return this._text+this.children.map(c=>c.textContent??String(c)).join('');}
 click(){if(!this.disabled&&!this.hidden)return this.listeners.click?.({});}
 all(){return[this,...this.children.flatMap(c=>c instanceof Element?c.all():[])];}
}
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
async function withLobby(run){
 const previous={document:globalThis.document,Node:globalThis.Node,location:globalThis.location};globalThis.document={createElement:t=>new Element(t),createTextNode:t=>new Element('',t)};globalThis.Node=Element;globalThis.location=new URL('https://example.test/game');setLanguage('en');
 let time=0,next=0;const timers=new Map(),requests=[],clients=[],joined=[];let closed=0;
 class Client{constructor(options){Object.assign(this,options);this.disposed=0;clients.push(this);}connect(){this.onStatus?.({state:'connecting'});}dispose(){this.disposed++;this.onStatus?.({state:'offline'});}welcome(){this.onWelcome?.(makeWelcome('test'));}fail(reason){this.onStatus?.({state:'unavailable',reason});}}
 const root=new Element('main');const lobby=mountGhostLobby(root,{onJoin:c=>joined.push(c),onClose:()=>closed++,Client,fetchImpl:(_url,options)=>new Promise((resolve,reject)=>requests.push({resolve,reject,signal:options.signal})),setTimeoutImpl:(fn,delay)=>{const id=++next;timers.set(id,{fn,at:time+delay});return id;},clearTimeoutImpl:id=>timers.delete(id)});
 const advance=ms=>{time+=ms;for(const [id,t]of timers)if(t.at<=time){timers.delete(id);t.fn();}};
 const respond=async(info=roomInfo(),index=requests.length-1)=>{requests[index].resolve({ok:true,text:async()=>JSON.stringify(info)});await flush();};
 const button=key=>root.all().find(e=>e.tag==='button'&&e.textContent===GT[key].en),status=()=>root.all().find(e=>e.attrs.role==='status').textContent;
 try{await run({lobby,root,requests,clients,joined,timers,advance,respond,button,status,get closed(){return closed;}});}finally{lobby.dispose();for(const key of Object.keys(previous)){if(previous[key]===undefined)delete globalThis[key];else globalThis[key]=previous[key];}}
}

test('lobby validates the room before connecting and transfers client ownership exactly once',async()=>withLobby(async h=>{
 assert.equal(h.button('join').disabled,true);await h.respond();assert.equal(h.button('join').disabled,false);h.button('join').click();assert.equal(h.clients.length,1);assert.equal(h.clients[0].url,'wss://example.test/api/ghost-socket');h.button('join').click();assert.equal(h.clients.length,1);
 h.clients[0].welcome();assert.equal(h.joined.length,1);assert.equal(h.timers.size,0);h.lobby.dispose();assert.equal(h.clients[0].disposed,0);h.clients[0].welcome();assert.equal(h.joined.length,1);
}));

test('lobby failures dispose the failed socket and allow a clean retry immediately',async()=>withLobby(async h=>{
 await h.respond();h.button('join').click();h.clients[0].fail('room_full');assert.equal(h.clients[0].disposed,1);assert.equal(h.status(),GT.roomFull.en);assert.equal(h.button('retry').hidden,false);assert.equal(h.timers.size,0);
 h.button('retry').click();await h.respond();h.button('join').click();assert.equal(h.clients.length,2);h.clients[1].welcome();assert.equal(h.joined[0].client,h.clients[1]);
}));

test('lobby request timeout aborts stale fetches, and closing disposes an in-flight connection',async()=>withLobby(async h=>{
 h.advance(8000);assert.equal(h.requests[0].signal.aborted,true);assert.equal(h.status(),GT.connectionFailed.en);h.button('retry').click();await h.respond();await h.respond(roomInfo(),0);assert.equal(h.button('join').disabled,false);h.button('join').click();h.button('returnSolo').click();assert.equal(h.closed,1);assert.equal(h.clients[0].disposed,1);assert.equal(h.timers.size,0);h.clients[0].welcome();assert.equal(h.joined.length,0);
}));

test('lobby rejects mismatched worlds and cross-origin socket redirection',async()=>{
 for(const info of [{...roomInfo(),seed:1},{...roomInfo(),socket:'wss://elsewhere.invalid/socket'},{...roomInfo(),enabled:'true'},roomInfo({enabled:false,reason:'not_configured'})])await withLobby(async h=>{await h.respond(info);assert.equal(h.button('join').disabled,true);assert.equal(h.button('retry').hidden,false);assert.equal(h.clients.length,0);assert.equal(h.timers.size,0);});
});

test('lobby connection deadline releases a stalled client without leaving a hidden retry loop',async()=>withLobby(async h=>{
 await h.respond();h.button('join').click();h.advance(15000);assert.equal(h.clients[0].disposed,1);assert.equal(h.button('retry').hidden,false);assert.equal(h.timers.size,0);h.lobby.dispose();h.advance(60000);assert.equal(h.clients.length,1);
}));
