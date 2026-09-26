import {build} from 'esbuild';
import {mkdir,readdir,stat,lstat,readFile,writeFile,rm,realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,relative,sep,join} from 'node:path';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const root=await realpath(fileURLToPath(new URL('../',import.meta.url))),out=resolve(root,'dist');
// Recursive removal is limited to this project's real, non-linked dist directory.
if(relative(root,out)!=='dist'||!out.startsWith(root+sep))throw new Error('Invalid build output');
try{const info=await lstat(out);if(info.isSymbolicLink()||await realpath(out)!==out)throw new Error('Refusing linked build output');}catch(e){if(e.code!=='ENOENT')throw e;}
await rm(out,{recursive:true,force:true});await mkdir(join(out,'assets'),{recursive:true});
const result=await build({
 absWorkingDir:root,entryPoints:['src/main.js','style.css'],outdir:'dist/assets',
 entryNames:'[name]-[hash]',assetNames:'[name]-[hash]',bundle:true,minify:true,
 charset:'utf8',format:'esm',platform:'browser',target:['es2022'],loader:{'.woff2':'file'},
 metafile:true,legalComments:'none',sourcemap:false
});
const outputs=Object.entries(result.metafile.outputs),entry=name=>outputs.find(([,v])=>v.entryPoint===name)?.[0];
const js=entry('src/main.js'),css=entry('style.css'),font=outputs.find(([k])=>k.endsWith('.woff2'))?.[0];
if(!js||!css||!font)throw new Error('Build entries missing');
const url=path=>'./'+relative(out,resolve(root,path)).split(sep).join('/');
const icon=await readFile(join(root,'assets/icon.svg')),iconName='icon-'+createHash('sha256').update(icon).digest('hex').slice(0,12)+'.svg';
await writeFile(join(out,'assets',iconName),icon);await writeFile(join(out,'OFL.txt'),await readFile(join(root,'assets/OFL.txt')));
let html=await readFile(join(root,'index.html'),'utf8');
html=html.replace('./src/main.js',url(js)).replace('./style.css',url(css)).replace('./assets/Vazirmatn-Regular.woff2',url(font)).replace('./assets/icon.svg','./assets/'+iconName);
await writeFile(join(out,'index.html'),html);
await writeFile(join(out,'404.html'),'<!doctype html><html lang="en" dir="ltr"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found · The Last Buyer</title><link rel="stylesheet" href="'+url(css)+'"><body><main class="error-page"><p>404 / THE LAST BUYER</p><h1>This path is missing from the archive.</h1><p>This address could not be found. Your journey and saved game are available from the home page.</p><a class="btn primary" href="/">Return to game</a></main></body></html>');
const assets=[];
async function walk(dir){for(const name of (await readdir(dir)).sort()){const path=join(dir,name),info=await stat(path);if(info.isDirectory())await walk(path);else{const data=await readFile(path);assets.push({file:relative(out,path).split(sep).join('/'),bytes:data.length,gzipBytes:gzipSync(data).length});}}}
await walk(out);
const bytes=assets.reduce((n,a)=>n+a.bytes,0),gzipBytes=assets.reduce((n,a)=>n+a.gzipBytes,0);
const limits={totalGzipBytes:350*1024,scriptGzipBytes:220*1024};
const script=assets.find(a=>a.file===relative(out,resolve(root,js)).split(sep).join('/'));
if(gzipBytes>limits.totalGzipBytes||script.gzipBytes>limits.scriptGzipBytes)throw new Error('Production size budget exceeded');
await mkdir(join(root,'artifacts'),{recursive:true});
await writeFile(join(root,'artifacts/build-report.json'),JSON.stringify({assets,bytes,gzipBytes,limits,entry:script.file,generatedAt:new Date().toISOString()},null,2));
console.log('Static production build: '+(bytes/1024).toFixed(1)+' KiB raw, '+(gzipBytes/1024).toFixed(1)+' KiB gzip estimate; '+assets.length+' files. Hashed assets; no runtime dependencies.');
