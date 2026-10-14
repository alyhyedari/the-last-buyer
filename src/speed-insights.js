import {injectSpeedInsights} from '@vercel/speed-insights';

// This entry is included only by a Vercel Production build. Keeping it out of
// main.js also lets the unbundled development server run without an import map.
const {hostname,protocol}=window.location;
const local=hostname==='localhost'||hostname.endsWith('.localhost')||hostname.endsWith('.local')||hostname==='[::1]'||/^127\./.test(hostname);

if(protocol==='https:'&&!local){
 injectSpeedInsights({
  scriptSrc:'/_vercel/speed-insights/script.js',
  endpoint:'/_vercel/speed-insights/vitals',
  route:'/',
  beforeSend(event){
   try{
    const url=new URL(event.url);
    url.search='';url.hash='';url.username='';url.password='';
    return {...event,url:url.href};
   }catch{return null;}
  }
 });
}
