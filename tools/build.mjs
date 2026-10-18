import {build} from 'esbuild';
import {mkdir,readdir,stat,lstat,readFile,writeFile,rm,realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,relative,sep,join} from 'node:path';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const root=await realpath(fileURLToPath(new URL('../',import.meta.url))),out=resolve(root,'dist');
const speedInsightsEnabled=process.env.VERCEL_ENV==='production';
// Recursive removal is limited to this project's real, non-linked dist directory.
if(relative(root,out)!=='dist'||!out.startsWith(root+sep))throw new Error('Invalid build output');
try{const info=await lstat(out);if(info.isSymbolicLink()||await realpath(out)!==out)throw new Error('Refusing linked build output');}catch(e){if(e.code!=='ENOENT')throw e;}
await rm(out,{recursive:true,force:true});await mkdir(join(out,'assets'),{recursive:true});
const result=await build({
 absWorkingDir:root,entryPoints:['src/main.js','style.css',...(speedInsightsEnabled?['src/speed-insights.js']:[])],outdir:'dist/assets',
 entryNames:'[name]-[hash]',assetNames:'[name]-[hash]',chunkNames:'chunk-[hash]',bundle:true,minify:true,splitting:true,
 charset:'utf8',format:'esm',platform:'browser',target:['es2022'],loader:{'.woff2':'file'},
 metafile:true,legalComments:'none',sourcemap:false
});
const outputs=Object.entries(result.metafile.outputs),entry=name=>outputs.find(([,v])=>v.entryPoint===name)?.[0];
const js=entry('src/main.js'),css=entry('style.css'),font=outputs.find(([k])=>k.endsWith('.woff2'))?.[0];
const insights=entry('src/speed-insights.js');
if(!js||!css||!font)throw new Error('Build entries missing');
if(speedInsightsEnabled&&!insights)throw new Error('Speed Insights entry missing');
const url=path=>'./'+relative(out,resolve(root,path)).split(sep).join('/');
const icon=await readFile(join(root,'assets/icon.svg')),iconName='icon-'+createHash('sha256').update(icon).digest('hex').slice(0,12)+'.svg';
await writeFile(join(out,'assets',iconName),icon);await writeFile(join(out,'OFL.txt'),await readFile(join(root,'assets/OFL.txt')));
let html=await readFile(join(root,'index.html'),'utf8');
html=html.replace('./src/main.js',url(js)).replace('./style.css',url(css)).replace('./assets/Vazirmatn-Regular.woff2',url(font)).replace('./assets/icon.svg','./assets/'+iconName);
if(insights)html=html.replace('</head>','  <script type="module" src="'+url(insights)+'" data-performance="vercel-speed-insights"></script>\n</head>');
await writeFile(join(out,'index.html'),html);
await writeFile(join(out,'404.html'),'<!doctype html><html lang="en" dir="ltr"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found · The Last Buyer</title><link rel="stylesheet" href="'+url(css)+'"><body><main class="error-page"><p>404 / THE LAST BUYER</p><h1>This path is missing from the archive.</h1><p>This address could not be found. Your journey and saved game are available from the home page.</p><a class="btn primary" href="/">Return to game</a></main></body></html>');
const assets=[];
async function walk(dir){for(const name of (await readdir(dir)).sort()){const path=join(dir,name),info=await stat(path);if(info.isDirectory())await walk(path);else{const data=await readFile(path);assets.push({file:relative(out,path).split(sep).join('/'),bytes:data.length,gzipBytes:gzipSync(data).length});}}}
await walk(out);
const bytes=assets.reduce((n,a)=>n+a.bytes,0),gzipBytes=assets.reduce((n,a)=>n+a.gzipBytes,0);
// Afterlight is downloaded only at the gate. The initial script budget includes
// every statically imported shared chunk, not just the small entry wrapper.
// Wild Signal adds swimming, reactive scenery, driving and eight-language guidance
// to the lazy county. The initial budget covers shared save validation and menu art.
// Six guardian encounters, 30 localized powers and saved-world preview are lazy.
// Narrator, field equipment and four real benchmark scenes load on demand.
// Cities, tower interiors and phased combat remain in the lazy county bundle.
// Preserve the initial ceiling; allow 30 KiB for the eight-language city expansion.
// Neon Pantheon adds 17 guardians, nine stories and regional scores in the lazy county.
// Initial script ceiling is unchanged; measured expansion allowance is 36 KiB gzip.
const limits={totalGzipBytes:556*1024,scriptGzipBytes:238*1024};
const script=assets.find(a=>a.file===relative(out,resolve(root,js)).split(sep).join('/'));
const initial=new Set();
function visitInitial(path){if(initial.has(path))return;initial.add(path);for(const imported of result.metafile.outputs[path]?.imports||[])if(!imported.external&&imported.kind!=='dynamic-import')visitInitial(imported.path);}
visitInitial(js);
if(insights)visitInitial(insights);
const initialScriptGzipBytes=assets.filter(a=>[...initial].some(path=>a.file===relative(out,resolve(root,path)).split(sep).join('/'))).reduce((sum,a)=>sum+a.gzipBytes,0);
await mkdir(join(root,'artifacts'),{recursive:true});
await writeFile(join(root,'artifacts/build-report.json'),JSON.stringify({assets,bytes,gzipBytes,initialScriptGzipBytes,limits,entry:script.file,speedInsights:{enabled:speedInsightsEnabled,bootstrap:insights?url(insights):null},generatedAt:new Date().toISOString()},null,2));
if(gzipBytes>limits.totalGzipBytes||initialScriptGzipBytes>limits.scriptGzipBytes)throw new Error('Production size budget exceeded: total '+(gzipBytes/1024).toFixed(1)+' KiB; initial scripts '+(initialScriptGzipBytes/1024).toFixed(1)+' KiB');
console.log('Static production build: '+(bytes/1024).toFixed(1)+' KiB raw, '+(gzipBytes/1024).toFixed(1)+' KiB gzip estimate; '+assets.length+' files. Hashed game assets.');
console.log('Initial JavaScript including shared chunks: '+(initialScriptGzipBytes/1024).toFixed(1)+' KiB gzip; Afterlight loaded at the gate.');
console.log('Vercel Speed Insights: '+(speedInsightsEnabled?'enabled for Production; same-origin collector':'disabled for local and Preview builds')+'.');
