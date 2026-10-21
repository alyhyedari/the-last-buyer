const p95=values=>{const s=[...values].sort((a,b)=>a-b);return s[Math.min(s.length-1,Math.floor(s.length*.95))]||0;};
export class AdaptiveQuality{
 constructor(recommendation='high'){this.reset(recommendation);}
 reset(recommendation='high'){this.quality=recommendation==='low'?'low':'high';this.detail=this.quality==='low'?1:0;this.elapsed=0;this.frames=[];this.costs=[];this.good=0;this.bad=0;this.stalls=0;this.draws=0;this.pressure=0;this.hot=0;this.report={fps:0,frameP95:0,workP95:0,peak:0,samples:0};}
 lighten(detail=1){this.quality='low';this.detail=Math.max(this.detail,detail);this.good=0;this.bad=0;}
 rendered(ms){if(Number.isFinite(ms)&&ms>=0){this.costs.push(ms);if(this.costs.length>240)this.costs.shift();this.hot=ms>18?(this.hot||0)+1:0;if(ms>=50)this.lighten(2);else if(this.hot>=3)this.lighten();}}
 presented(){this.draws++;}
 sample(ms){
  if(!Number.isFinite(ms)||ms<=0)return this.quality;
  if(ms>=250)this.lighten(2);
  if(ms>100){if(++this.stalls>=2){this.lighten(2);this.stalls=0;}}else this.stalls=Math.max(0,this.stalls-.1);
  this.frames.push(ms);if(this.frames.length>240)this.frames.shift();this.elapsed+=ms;
  if(this.elapsed<2000)return this.quality;
  if(this.frames.length&&this.costs.length){
   const interval=p95(this.frames),cost=p95(this.costs);
   this.report={fps:Math.round(this.draws*1000/this.elapsed),frameP95:interval,workP95:cost,peak:Math.max(...this.frames),samples:this.frames.length};
   if(this.quality==='high'){this.bad=interval>30||cost>10?this.bad+1:0;if(this.bad>=2){this.quality='low';this.detail=1;this.bad=0;this.good=0;}}
   else{this.pressure=interval>48||cost>18?this.pressure+1:0;if(this.pressure>=2){this.detail=2;this.good=0;}this.good=interval<=21&&cost<=5?this.good+1:0;if(this.good>=4){if(this.detail===2)this.detail=1;else{this.quality='high';this.detail=0;}this.good=0;this.bad=0;this.pressure=0;}}
  }
  this.frames=[];this.costs=[];this.elapsed=0;this.draws=0;return this.quality;
 }
}
