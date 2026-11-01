import {randomBytes,createHash} from 'node:crypto';
import {createRemoteJWKSet,jwtVerify} from 'jose';
const googleKeys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'),{timeoutDuration:5000});
import {validateState} from '../src/state.js';
import {GHOST_MANIFEST} from '../src/ghost-protocol.js';
import {productionAccounts} from './account-store.js';
export const SAVE_BYTES=128*1024;
const random=()=>randomBytes(32).toString('base64url');
const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=')).filter(x=>x.length===2));
export function accountConfig(env=process.env){try{const origin=new URL(env.APP_ORIGIN);if(origin.protocol!=='https:'||origin.origin!==env.APP_ORIGIN||!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET)return null;return{origin:origin.origin,id:env.GOOGLE_CLIENT_ID,secret:env.GOOGLE_CLIENT_SECRET};}catch{return null;}}
export function cloudState(input,slot){const s=validateState(input);if(!s||!s.player?.name)return null;if(slot==='echo'&&(s.frontier.seed!==GHOST_MANIFEST.seed||s.zone!=='commons'))return null;s.player.age=null;delete s.frontier.worldMinutes;return s;}
async function body(req){if(Number(req.headers['content-length'])>SAVE_BYTES+4096)throw Error('large');if(req.body!==undefined){const value=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(Buffer.byteLength(value)>SAVE_BYTES+4096)throw Error('large');return JSON.parse(value);}let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>SAVE_BYTES+4096)throw Error('large');}return JSON.parse(text);}
export function createAccountHandler({getStore=productionAccounts,config=()=>accountConfig(),fetchImpl=fetch,verify=async(idToken,id)=>{const {payload}=await jwtVerify(idToken,googleKeys,{audience:id,issuer:['https://accounts.google.com','accounts.google.com'],algorithms:['RS256'],requiredClaims:['exp','iat','sub','email','email_verified'],maxTokenAge:'10m'});return payload;}}={}){return async(req,res)=>{
 const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 const cfg=config(),url=new URL(req.url,'https://localhost'),action=url.searchParams.get('action')||'status',jar=cookies(req),cookie=(name,value,age)=>name+'='+value+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+age;
 const redirect=location=>{res.writeHead(302,{Location:location,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});res.end();};
 if(!cfg)return send(503,{error:'not_configured'});
 if(!['GET','POST'].includes(req.method))return send(405,{error:'method'});
 if(req.method==='POST'&&(req.headers.origin!==cfg.origin||!String(req.headers['content-type']||'').startsWith('application/json')))return send(403,{error:'origin'});
 try{const store=await getStore();if(!store)return send(503,{error:'not_configured'});
 if(action==='login'&&req.method==='GET'){
 const identity=req.headers['x-real-ip']||req.socket?.remoteAddress||'unknown';if(!await store.throttle('login:'+identity,30))return send(429,{error:'try_later'});
 const state=random(),verifier=random(),binding=random();await store.once(state,{verifier,binding});res.setHeader('Set-Cookie',cookie('__Host-tlb-oauth',binding,600));
 const target=new URL('https://accounts.google.com/o/oauth2/v2/auth');target.search=new URLSearchParams({client_id:cfg.id,redirect_uri:cfg.origin+'/api/account?action=callback',response_type:'code',scope:'openid email',state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256',prompt:'select_account'});return redirect(target.href);
 }
 if(action==='callback'&&req.method==='GET'){
 const state=url.searchParams.get('state'),code=url.searchParams.get('code');if(!state||state.length>128||!code||code.length>4096)return send(400,{error:'invalid_callback'});
 const flow=await store.once(state);if(!flow||flow.binding!==jar['__Host-tlb-oauth'])return send(403,{error:'invalid_state'});
 const response=await fetchImpl('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:cfg.id,client_secret:cfg.secret,redirect_uri:cfg.origin+'/api/account?action=callback',grant_type:'authorization_code',code_verifier:flow.verifier}),signal:AbortSignal.timeout(8000)});
 if(!response.ok)return send(401,{error:'google_failed'});const tokens=await response.json(),identity=await verify(tokens.id_token,cfg.id);
 if(!identity?.sub||!identity.email_verified||typeof identity.email!=='string'||!/^\d{1,64}$/.test(identity.sub))return send(401,{error:'unverified'});
 if(!await store.register(identity.sub))return send(503,{error:'account_capacity'});
 if(jar['__Host-tlb-session'])await store.logout(jar['__Host-tlb-session']);const token=random();await store.session(token,{sub:identity.sub,email:identity.email});res.setHeader('Set-Cookie',[cookie('__Host-tlb-session',token,604800),cookie('__Host-tlb-oauth','',0)]);return redirect(cfg.origin+'/?account=connected');
 }
 const token=jar['__Host-tlb-session'],session=token&&/^[A-Za-z0-9_-]{43}$/.test(token)?await store.session(token):null;
 if(action==='status'&&req.method==='GET')return send(200,{configured:true,user:session?{email:session.email}:null});
 if(!session)return send(401,{error:'sign_in'});
 if(action==='logout'&&req.method==='POST'){await store.logout(token);res.setHeader('Set-Cookie',cookie('__Host-tlb-session','',0));return send(200,{ok:true});}
 const slot=url.searchParams.get('slot');if(!['solo','echo'].includes(slot))return send(400,{error:'slot'});
 if(action==='load'&&req.method==='GET')return send(200,{save:await store.load(session.sub,slot)});
 if(action==='save'&&req.method==='POST'){
 if(!await store.throttle('save:'+session.sub+':'+slot,10))return send(429,{error:'try_later'});
 const data=await body(req);if(!Number.isSafeInteger(data.revision)||data.revision<0)return send(400,{error:'revision'});const state=cloudState(data.state,slot);if(!state||Buffer.byteLength(JSON.stringify(state))>SAVE_BYTES)return send(400,{error:'invalid_save'});
 const saved=await store.save(session.sub,slot,data.revision,state);return saved?send(200,{revision:saved.revision,updatedAt:saved.updatedAt}):send(409,{error:'save_conflict'});
 }
 return send(404,{error:'action'});
 }catch{return send(503,{error:'temporarily_unavailable'});}
};}
export const handleAccount=createAccountHandler();
