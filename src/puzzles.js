import {rng} from './art.js';
export const DIRS=[{dx:0,dy:-1,bit:1,opposite:4},{dx:1,dy:0,bit:2,opposite:8},{dx:0,dy:1,bit:4,opposite:1},{dx:-1,dy:0,bit:8,opposite:2}];
export const rotateMask=m=>((m<<1)&15)|((m>>3)&1);
export function shuffle(array,random){const a=[...array];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function generateCircuit(size,seed){
 const random=rng(seed),solution=Array(size*size).fill(0),seen=new Set([0]),stack=[0];
 while(stack.length){const a=stack.at(-1),x=a%size,y=Math.floor(a/size);const options=DIRS.filter(d=>x+d.dx>=0&&x+d.dx<size&&y+d.dy>=0&&y+d.dy<size&&!seen.has((y+d.dy)*size+x+d.dx));if(!options.length){stack.pop();continue;}const d=options[Math.floor(random()*options.length)],b=(y+d.dy)*size+x+d.dx;solution[a]|=d.bit;solution[b]|=d.opposite;seen.add(b);stack.push(b);}
 solution[0]|=1;solution[size*size-1]|=4;
 let tiles=solution.map(mask=>{let m=mask;for(let i=Math.floor(random()*4);i>0;i--)m=rotateMask(m);return m;});
 if(circuitStatus(tiles,size).solved){for(let i=0;i<tiles.length;i++){tiles[i]=rotateMask(tiles[i]);if(!circuitStatus(tiles,size).solved)break;}}
 return {size,tiles,solution};
}
export function circuitStatus(tiles,size){const reached=new Set();if(!(tiles[0]&1))return{reached,solved:false};const q=[0];reached.add(0);for(let i=0;i<q.length;i++){const a=q[i],x=a%size,y=Math.floor(a/size);for(const d of DIRS){const xx=x+d.dx,yy=y+d.dy;if(xx<0||xx>=size||yy<0||yy>=size)continue;const b=yy*size+xx;if(!reached.has(b)&&(tiles[a]&d.bit)&&(tiles[b]&d.opposite)){reached.add(b);q.push(b);}}}return{reached,solved:reached.has(size*size-1)&&Boolean(tiles[size*size-1]&4)};}
export function toggleLights(board,size,index){const x=index%size,y=Math.floor(index/size);board[index]^=1;for(const d of DIRS){const xx=x+d.dx,yy=y+d.dy;if(xx>=0&&xx<size&&yy>=0&&yy<size)board[yy*size+xx]^=1;}return board;}
export function generateLights(size,seed){const random=rng(seed),board=Array(size*size).fill(1);const solution=shuffle(Array.from({length:size*size},(_,i)=>i),random).slice(0,Math.floor(size*size*.6));for(const i of solution)toggleLights(board,size,i);if(board.every(Boolean)){toggleLights(board,size,0);if(solution.includes(0))solution.splice(solution.indexOf(0),1);else solution.push(0);}return{size,board,solution};}
export function generateSequence(length,seed){const random=rng(seed),seq=[];for(let i=0;i<length;i++){let n=Math.floor(random()*9);if(n===seq.at(-1))n=(n+1)%9;seq.push(n);}return seq;}
export function generateLedger(count,seed){const random=rng(seed),symbols=['◇','△','○','□','☆','⬡'];const left=Array.from({length:count},(_,i)=>{const a=2+Math.floor(random()*17),b=1+Math.floor(random()*9);return{id:i,symbol:symbols[i],a,b,value:a+b};});return{left,right:shuffle(left,random)};}
export function generateCode(round,seed){const random=rng(seed),digits=Array.from({length:4},()=>Math.floor(random()*10));let solution=round===0?[...digits].reverse():round===1?digits.map(n=>(n+1)%10):[...digits].sort((a,b)=>a-b);return{digits,solution};}
