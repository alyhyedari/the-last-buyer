import {mkdir,cp,readdir,stat,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','src','assets'])await cp(file,join('dist',file),{recursive:true});
let bytes=0,gzip=0;const assets=[];
async function walk(dir){for(const name of await readdir(dir)){const path=join(dir,name),s=await stat(path);if(s.isDirectory())await walk(path);else{bytes+=s.size;assets.push({file:path,bytes:s.size});}}}
await walk('dist');
for(const entry of assets){const {readFile}=await import('node:fs/promises');gzip+=gzipSync(await readFile(entry.file)).length;}
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/build-report.json',JSON.stringify({assets,bytes,gzipBytes:gzip},null,2));
console.log(`Static build ready in dist/ — ${(bytes/1024).toFixed(1)} KiB raw, ${(gzip/1024).toFixed(1)} KiB gzip estimate. No production dependencies.`);
