import {h,button} from './dom.js';
import {tr} from './i18n.js';
import {GT} from './ghost-text.js';
import {GhostClient} from './ghost-client.js';
import {GHOST_MANIFEST} from './ghost-protocol.js';

export function mountGhostLobby(root,{onJoin,onClose,nickname='',onNickname=()=>{},fetchImpl=globalThis.fetch,Client=GhostClient,setTimeoutImpl=globalThis.setTimeout,clearTimeoutImpl=globalThis.clearTimeout}){
 let alive=true,client=null,request=null,timer=null,generation=0,url=null;const text=key=>tr(GT[key]);
 const fa=document.documentElement.lang==='fa',name=h('input',{type:'text',value:nickname,maxlength:24,required:true,autocomplete:'nickname','aria-label':fa?'نام مستعار لازم است':'Nickname required'});
 const status=h('p',{class:'ghost-status',role:'status'},text('loading'));
 const join=button(text('join'),connect,'btn primary',{disabled:true}),retry=button(text('retry'),load,'btn secondary',{hidden:true});
 root.classList.add('ghost-lobby');root.append(h('h2',{},text('title')),h('p',{class:'body-copy'},text('intro')),
 h('article',{class:'ghost-card'},h('strong',{},text('sharedWorld')),h('p',{},text('ownProgress')),h('p',{class:'ghost-help'},text('latencyHelp'))),
 h('label',{},fa?'نام مستعار':'Nickname',name),status,h('p',{class:'ghost-privacy'},text('privacy')),h('div',{class:'ghost-actions'},join,retry,button(text('returnSolo'),()=>{dispose();onClose();},'btn secondary')));
 function clearTimer(){if(timer!==null)clearTimeoutImpl(timer);timer=null;}
 function releaseClient(){const previous=client;client=null;if(previous){previous.onStatus=null;previous.onWelcome=null;previous.dispose();}}
 function unavailable(reason='connectionFailed'){
  if(!alive)return;clearTimer();request?.abort();request=null;releaseClient();status.textContent=text(reason);join.disabled=true;retry.hidden=false;
 }
 async function load(){
  if(!alive)return;const token=++generation;clearTimer();request?.abort();releaseClient();const abort=new AbortController();request=abort;url=null;join.disabled=true;retry.hidden=true;status.textContent=text('loading');
  timer=setTimeoutImpl(()=>{if(alive&&token===generation){generation++;unavailable('connectionFailed');}},8000);
  try{
   const response=await fetchImpl('/api/ghost-room',{cache:'no-store',signal:abort.signal});if(!alive||token!==generation)return;
   const raw=await response.text();if(!alive||token!==generation)return;if(raw.length>4096)throw Error('Oversized room response');const info=JSON.parse(raw);
   clearTimer();request=null;if(!response.ok||info?.enabled!==true){unavailable(info?.reason==='not_configured'?'disabledHelp':'connectionFailed');return;}
   if(!Object.keys(GHOST_MANIFEST).every(key=>info[key]===GHOST_MANIFEST[key])){unavailable('incompatibleWorld');return;}
   // A discovered room cannot redirect presence to an arbitrary third-party host.
   if(info.socket!=='/api/ghost-socket')throw Error('Unexpected endpoint');
   if(info.full===true){unavailable('roomFull');return;}
   url=new URL(info.socket,globalThis.location.href);url.protocol=globalThis.location.protocol==='https:'?'wss:':'ws:';
   status.textContent=text(info.localOnly?'localOnly':'sharedWorld')+(Number.isInteger(info.online)?` · ${info.online}/${GHOST_MANIFEST.maxPeers}`:'');join.disabled=false;
  }catch{if(alive&&token===generation)unavailable('connectionFailed');}
 }
 function connect(){
  if(!url||client||!alive)return;const nick=name.value.replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g,'').trim().slice(0,24);if(!nick){status.textContent=fa?'برای ورود یک نام مستعار بنویس.':'Enter a nickname to join.';name.focus();return;}onNickname(nick);join.disabled=true;retry.hidden=true;status.textContent=text('connecting');
  client=new Client({url:url.href,onStatus:s=>{
   if(!alive)return;if(s.state==='unavailable'){const key=s.reason==='room_full'?'roomFull':s.reason==='incompatible_world'?'incompatibleWorld':s.reason==='protocol_rejected'?'protocolRejected':'connectionFailed';unavailable(key);return;}
   status.textContent=text(GT[s.state]?s.state:'connecting');
  },onWelcome:manifest=>{
   if(!alive||!client)return;clearTimer();request?.abort();request=null;const connected=client;client=null;alive=false;connected.onStatus=null;connected.onWelcome=null;onJoin({client:connected,manifest});
  }});
  timer=setTimeoutImpl(()=>{if(alive)unavailable('connectionFailed');},15000);client.connect();
 }
 function dispose(){if(!alive&&!client){root.classList.remove('ghost-lobby');return;}alive=false;generation++;clearTimer();request?.abort();request=null;releaseClient();root.classList.remove('ghost-lobby');}
 void load();return {dispose};
}
