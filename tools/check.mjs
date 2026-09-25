import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
const files=['server.mjs'];
for(const dir of ['src','tools','tests']){try{for(const f of await readdir(dir))if(/\.(m?js)$/.test(f))files.push(join(dir,f));}catch{}}
let failures=0;
for(const file of files){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status){failures++;console.error(file,r.stderr);}const text=await readFile(file,'utf8');if(text.includes('\uFFFD')){failures++;console.error('Invalid Unicode in',file);}}
console.log(`${files.length} JavaScript files checked; ${failures} problems.`);process.exitCode=failures?1:0;
