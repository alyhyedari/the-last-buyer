// Reproduce Vercel's Production-only build path without credentials or deployment.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,relative,sep} from 'node:path';
import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';
const root=fileURLToPath(new URL('../',import.meta.url)),out=resolve(root,'dist'),reports=[];
for(const mode of ['development','preview','production']){
 console.log('\nChecking Vercel build mode: '+mode);
 execFileSync(process.execPath,['tools/build.mjs'],{cwd:root,env:{...process.env,VERCEL_ENV:mode},stdio:'inherit'});
 const report=JSON.parse(await readFile(resolve(root,'artifacts/build-report.json'),'utf8')),html=await readFile(resolve(out,'index.html'),'utf8');
 const enabled=mode==='production';assert.equal(report.speedInsights.enabled,enabled);
 assert.equal((html.match(/data-performance="vercel-speed-insights"/g)||[]).length,enabled?1:0);
 assert.ok(report.gameScriptGzipBytes<=report.limits.scriptGzipBytes);
 assert.ok(report.speedInsights.gzipBytes<=report.limits.speedInsightsGzipBytes);
 assert.equal(report.initialScriptGzipBytes,report.gameScriptGzipBytes+report.speedInsights.gzipBytes);
 assert.equal(report.speedInsights.gzipBytes>0,enabled);
 assert.doesNotMatch(html,/(?:src|href)="\.\/src\//);
 for(const [,ref] of html.matchAll(/(?:src|href)="(\.\/assets\/[^"?#]+)"/g))assert.ok((await stat(resolve(out,ref))).size>0,'Missing HTML asset: '+ref);
 let actualGzip=0;for(const asset of report.assets){const file=resolve(out,asset.file);assert.ok(!relative(out,file).startsWith('..'+sep));const data=await readFile(file);assert.equal(data.length,asset.bytes);actualGzip+=gzipSync(data).length;}
 assert.equal(actualGzip,report.gzipBytes);assert.ok(actualGzip<=report.limits.totalGzipBytes);
 reports.push({mode,totalGzipBytes:actualGzip,initialScriptGzipBytes:report.initialScriptGzipBytes,gameScriptGzipBytes:report.gameScriptGzipBytes,speedInsightsGzipBytes:report.speedInsights.gzipBytes,assets:report.assets.length});
}
// Trace each deployed function's local imports and check the real API exports.
await build({absWorkingDir:root,entryPoints:['api/ghost-room.js','api/ghost-socket.js'],outdir:'unused',bundle:true,write:false,platform:'node',target:'node24',format:'esm',packages:'external',logLevel:'warning'});
execFileSync(process.execPath,['--test','tests/vercel-adapters.test.mjs'],{cwd:root,env:{...process.env,REDIS_URL:''},stdio:'inherit'});
await writeFile(resolve(root,'artifacts/vercel-verification.json'),JSON.stringify({ok:true,scope:'local build and API contract checks; not a cloud deployment',reports},null,2));
console.log('\nVercel local verification passed: development, Preview, Production, assets and API adapters.');
