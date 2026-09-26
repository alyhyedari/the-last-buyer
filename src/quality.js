const p95=values=>{const s=[...values].sort((a,b)=>a-b);return s[Math.min(s.length-1,Math.floor(s.length*.95))]||0;};
export class AdaptiveQuality{
 constructor(recommendation='high'){this.reset(recommendation);}
 reset(recommendation='high'){this.quality=recommendation==='low'?'low':'high';this.elapsed=0;this.frames=[];this.costs=[];this.good=0;this.bad=0;}
 rendered(ms){if(Number.isFinite(ms)&&ms>=0)this.costs.push(ms);}
 sample(ms){
  if(!Number.isFinite(ms)||ms<=0||ms>250)return this.quality;
  this.frames.push(ms);this.elapsed+=ms;
  if(this.elapsed<2000)return this.quality;
  if(this.frames.length>=20&&this.costs.length>=10){
   const interval=p95(this.frames),cost=p95(this.costs);
   if(this.quality==='high'){this.bad=interval>30||cost>10?this.bad+1:0;if(this.bad>=2){this.quality='low';this.bad=0;this.good=0;}}
   else{this.good=interval<=21&&cost<=5?this.good+1:0;if(this.good>=4){this.quality='high';this.good=0;this.bad=0;}}
  }
  this.frames=[];this.costs=[];this.elapsed=0;return this.quality;
 }
}
