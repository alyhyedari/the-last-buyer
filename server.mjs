import {createServer} from 'node:http';
import {readFile,stat,realpath} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const project=fileURLToPath(new URL('.',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain; charset=utf-8'};
export async function createStaticServer({production=false}={}){
 const root=await realpath(resolve(project,production?'dist':'.')),config=production?JSON.parse(await readFile(resolve(project,'vercel.json'),'utf8')):null;
 return createServer(async(req,res)=>{
  const headers={'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'};
  try{
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
   const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(config)for(const rule of config.headers){if(rule.source==='/(.*)'||rule.source===path||(rule.source==='/assets/(.*)'&&path.startsWith('/assets/')))for(const h of rule.headers)headers[h.key]=h.value;}
   if(!production&&!['/','/index.html','/style.css'].includes(path)&&!/^\/(src|assets)\//.test(path))throw Error('Not found');
   const file=await realpath(resolve(root,'.'+(path==='/'?'/index.html':path)));
   if(!file.startsWith(root+sep)||!(await stat(file)).isFile()||!types[extname(file)])throw Error('Not found');
   const data=await readFile(file);res.writeHead(200,{...headers,'Content-Type':types[extname(file)],'Content-Length':data.length});res.end(req.method==='HEAD'?undefined:data);
  }catch{
   let body='Not found',type='text/plain; charset=utf-8';
   if(production&&req.headers.accept?.includes('text/html')){body=await readFile(resolve(root,'404.html'));type=types['.html'];}
   res.writeHead(404,{...headers,'Cache-Control':'no-cache','Content-Type':type});res.end(req.method==='HEAD'?undefined:body);
  }
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const production=process.argv.includes('--dist'),port=Number(process.env.PORT||4173);
 const server=await createStaticServer({production});
 server.listen(port,'127.0.0.1',()=>console.log('The Last Buyer '+(production?'production preview':'development')+': http://localhost:'+port));
}
