import {hash} from './frontier-state.js';
import {FOREST_COINS,inDeepForest} from './frontier-forest-data.js';
export function growForest(sprites,tiles,size,seed){
 // Ground cover is walk-through; solid logs and stones sit only in authored glades.
 // Small plants have a shorter draw distance than trunks to bound rendering cost.
 for(let y=80;y<size-4;y+=2)for(let x=4;x<size-4;x+=2){
  if((y>190&&(x+y)%6!==0)||!inDeepForest(x,y)||tiles[y*size+x]!==0||hash(seed,21000+x+y*size)>.7||FOREST_COINS.some(c=>Math.hypot(c.x-x,c.y-y)<3.2))continue;
  const n=x+y*size,kind=['fern','fern','forestGrass','forestFlowers','forestLog'][Math.floor(hash(seed,25000+n)*5)];
  sprites.push({id:'understory-'+n,kind,x:x+.2+hash(seed,n+2100)*.6,y:y+.3,variant:n%3,understory:true});
 }
 for(const coin of FOREST_COINS){
  sprites.push({...coin});
  // A ring with an open southern approach. No decorative piece overlaps the coin.
  const kind=coin.landmark==='log'?'forestLog':coin.landmark==='stones'||coin.landmark==='arch'?'forestStone':coin.landmark==='mushrooms'?'forestMushrooms':'fern';
  for(let i=0;i<5;i++){const a=Math.PI+i*Math.PI/4,x=coin.x+Math.cos(a)*2.2,y=coin.y+Math.sin(a)*2.2;if(tiles[Math.floor(y)*size+Math.floor(x)]!==0)continue;sprites.push({id:coin.id+'-glade-'+i,kind,x,y,variant:i%3,understory:true,radius:kind==='forestStone'?.25:0});}
  for(const side of [-1,1]){const x=coin.x+side*2.6,y=coin.y-1.5;if(tiles[Math.floor(y)*size+Math.floor(x)]===0)sprites.push({id:coin.id+'-elder-'+side,kind:'tree',x,y,variant:coin.landmark==='arch'?7:6,glade:true});}
 }
}
export const outsideCoinGlade=s=>s.glade||s.id?.includes('-glade-')||!['tree','crystal','mushroom'].includes(s.kind)||!FOREST_COINS.some(c=>Math.hypot(c.x-s.x,c.y-s.y)<2.5);
