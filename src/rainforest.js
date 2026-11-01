// Deterministic southern reserve. Only actors in existing spatial buckets run AI.
export const inRainforest=(x,y)=>x>=145&&x<=370&&y>=392&&y<=498;
export const RAIN_PLACES=[{id:'amazon',x:170.5,y:402.5,color:'#65cc94',kind:'grove'},{id:'amazonRiver',x:256.5,y:446.5,color:'#65cacc',kind:'pond'},{id:'amazonCanopy',x:330.5,y:474.5,color:'#bfdb69',kind:'grove'}];
export function buildRainforest({tiles,size,sprites,road,seed,hash}){
 for(let i=sprites.length-1;i>=0;i--)if(inRainforest(sprites[i].x,sprites[i].y)&&['tree','flowers','mushroom'].includes(sprites[i].kind))sprites.splice(i,1);
 for(let y=408;y<492;y++)for(let x=260;x<275;x++)if(Math.abs(x-(267+Math.sin(y*.09)*3))<5)tiles[y*size+x]=3;
 road(170,374,170,402);road(170,402,245,402);road(245,402,256,446);road(256,446,330,446);road(330,446,330,474);road(330,474,369,474);road(369,474,404,420);
 for(let i=0;i<520;i++){const x=148+hash(seed,24000+i)*218,y=394+hash(seed,25000+i)*101;if(tiles[Math.floor(y)*size+Math.floor(x)]!==0||RAIN_PLACES.some(p=>Math.hypot(p.x-x,p.y-y)<4))continue;sprites.push({id:'amazon-growth-'+i,kind:i%3?'rainPalm':'rainFern',x,y,variant:i%4,...(i%3?{radius:.18}:{understory:true})});}
 for(let i=0;i<36;i++){const kind=i%3===0?'crocodile':i%3===1?'anaconda':'venomSnake',x=i%3===0?255+(i%2)*23:180+hash(seed,26000+i)*170,y=412+hash(seed,27000+i)*73;if(tiles[Math.floor(y)*size+Math.floor(x)]!==0)continue;sprites.push({id:'rain-animal-'+i,kind,x,y,homeX:x,homeY:y,animal:true,hostile:true,phase:i*.7,rain:true});}
 for(let i=0;i<12;i++)sprites.push({id:'rain-parrot-'+i,kind:'rainParrot',x:177+i*13,y:415+i%4*16,airborne:true,phase:i,animal:true});
}
export function drawRainSprite(c,kind,variant=0){const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
 if(kind==='rainPalm'){r(23,16,5,48,'#66513b');for(let i=0;i<5;i++){r(4+i*7,8+Math.abs(i-2)*4,8,20,'#205b43');r(2+i*8,14+Math.abs(i-2)*4,9,8,'#3c8961');}r(12,16,25,6,'#69ab67');r(25,32,2,29,'#81a85d');}
 else if(kind==='rainFern'){for(let i=0;i<6;i++){r(7+i*6,44+Math.abs(i-3)*2,5,12,'#398764');r(9+i*5,51,5,9,'#83b05c');}r(22,48,2,16,'#aac777');}
 else if(['anaconda','venomSnake'].includes(kind)){const col=kind==='anaconda'?'#72944d':'#bea859';for(let i=0;i<10;i++){const y=48+Math.sin(i*.9+variant)*5;r(3+i*4,y,6,5,col);if(i%2)r(4+i*4,y+1,2,3,'#354937');}r(35,44,10,6,col);r(41,45,2,1,'#eddf9f');r(45,48,3,1,'#c96770');}
 else if(kind==='crocodile'){r(6,43,28,12,'#436e56');r(29,46,17,7,'#5b8461');r(1,47,12,4,'#54744b');for(let i=0;i<6;i++)r(9+i*4,41,2,4,'#abc07b');r(10,54,5,6,'#3e664e');r(28,54,5,6,'#3e664e');r(35,45,2,2,'#dfca77');for(let i=0;i<4;i++)r(31+i*4,52,2,2,'#dad4af');}
 else if(kind==='rainParrot'){r(19,31,10,20,'#ba5850');r(14,34,7,12,'#4e81c3');r(28,34,7,12,'#599a71');r(21,26,10,8,'#d9a75a');r(30,30,6,3,'#e6cda1');r(24,27,2,2,'#162a34');r(21,48,3,10,'#4ba1b0');}
 else return false;return true;
}
