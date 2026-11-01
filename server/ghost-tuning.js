// Hysteresis prevents the update rate oscillating on a single slow tick.
export function createNetworkGovernor(baseMs=200){
 let level=0,bad=0,healthySince=null,lastChange=-Infinity,cost=0;
 return {
  get interval(){return Math.min(1000,baseMs*(level+1));},
  get mode(){return ['normal','balanced','recovery'][level];},
  get workMs(){return Math.round(cost*10)/10;},
  observe({now,workMs,lagMs=0,pressure=0}){
   cost=cost*.8+Math.max(0,workMs)*.2;
   const stressed=workMs>baseMs*.6||lagMs>baseMs*.6||pressure>.2;
   if(stressed){healthySince=null;bad++;if(bad>=3&&level<2&&now-lastChange>=2000){level++;lastChange=now;bad=0;}}
   else{bad=0;if(workMs<baseMs*.25&&lagMs<baseMs*.25&&pressure<.05){healthySince??=now;if(level>0&&now-healthySince>=10000){level--;lastChange=now;healthySince=now;}}else healthySince=null;}
  }
 };
}
