export function allowedGhostOrigin(origin,host,{local=false}={}){
 if(typeof origin!=='string'||typeof host!=='string'||host.length>255)return false;
 try{const url=new URL(origin);return url.host.toLowerCase()===host.toLowerCase()&&url.pathname==='/'&&!url.search&&!url.hash&&!url.username&&!url.password&&(url.protocol==='https:'||local&&url.protocol==='http:');}catch{return false;}
}
export function createRateGate({rate=16,burst=24,now=Date.now()}={}){
 let tokens=burst,at=now;
 return time=>{tokens=Math.min(burst,tokens+Math.max(0,time-at)*rate/1000);at=time;if(tokens<1)return false;tokens--;return true;};
}
