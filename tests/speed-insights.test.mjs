import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';

// Execute the bundled, installed SDK with a minimal DOM. No network or real
// visitor events are used; this checks the actual script/queue contract.
const compiled=await build({entryPoints:['src/speed-insights.js'],bundle:true,write:false,format:'iife',platform:'browser',minify:true});
const code=compiled.outputFiles[0].text;
function page(url){
 const scripts=[],location=new URL(url),window={location},context={window,URL,console,document:{
  head:{querySelector:()=>scripts[0]||null,appendChild:script=>scripts.push(script)},
  createElement:()=>({dataset:{}})
 }};
 return {scripts,window,context,run(){runInNewContext(code,context);}};
}

test('production SDK loads once, deferred, from the same origin allowed by the existing CSP',async()=>{
 const p=page('https://game.example/');p.run();p.run();
 assert.equal(p.scripts.length,1);const script=p.scripts[0];
 assert.equal(script.src,'/_vercel/speed-insights/script.js');
 assert.equal(script.dataset.endpoint,'/_vercel/speed-insights/vitals');
 assert.equal(script.defer,true);assert.equal(script.dataset.sdkv,'2.0.0');
 assert.equal(script.dataset.route,'/');assert.equal(p.window.siq.length,1);
 const config=JSON.parse(await readFile('vercel.json','utf8'));
 const csp=config.headers.flatMap(rule=>rule.headers).find(h=>h.key==='Content-Security-Policy').value;
 assert.match(csp,/script-src 'self';/);assert.match(csp,/connect-src 'self';/);
});

test('local, loopback and insecure previews never request the collector, even from a production artifact',()=>{
 for(const url of ['http://localhost:4173/','https://localhost/','https://preview.localhost/','https://127.0.0.1/','https://[::1]/','https://game.local/','http://game.example/']){
  const p=page(url);p.run();assert.equal(p.scripts.length,0,url);assert.equal(p.window.si,undefined,url);
 }
});

test('the SDK beforeSend hook strips URL queries, fragments and credentials without changing metrics',()=>{
 const p=page('https://game.example/');p.run();const [kind,filter]=p.window.siq[0];assert.equal(kind,'beforeSend');
 const event={type:'vital',url:'https://user:secret@game.example/?session=private#saved-game',route:'/',value:17};
 const clean=filter(event);assert.equal(clean.url,'https://game.example/');assert.equal(clean.value,17);assert.equal(clean.route,'/');assert.equal(event.url.includes('private'),true);assert.equal(filter({url:'invalid url'}),null);
});
