import {avatarOf,SKIN,HAIR,CLOTH} from './avatar.js';
const cache=new Map();
export function drawAvatar(c,avatar,face=0){
 c.clearRect(0,0,48,64);const a=avatarOf({avatar}),skin=a[0]===1?'#74c5ad':a[0]===2?'#9393ad':a[0]===3?'#b0c7d2':SKIN[a[4]],hair=HAIR[a[6]],cloth=CLOTH[a[7]],side=face%2===1;
 const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};c.save();c.translate(24,62);c.scale(.82+a[3]*.085,.82+a[2]*.07);c.translate(-24,-62);if(face===3){c.translate(48,0);c.scale(-1,1);}
 r(15,46,7,16,'#253343');r(27,46,7,16,'#253343');r(13,60,11,3,'#99b4b8');r(27,60,11,3,'#99b4b8');
 r(side?18:13,26,side?15:24,23,cloth);r(10,29,5,17,skin);r(35,29,5,17,skin);r(14,45,22,3,'#27333c');
 if(a[1]===1){r(14,28,22,3,'#dfaec2');r(16,41,18,2,'#27333c');}if(a[1]===2)r(18,28,13,3,'#8df1dc');
 r(16,10,17,17,skin);r(18,24,13,4,skin);if(a[9]===1)r(14,15,4,9,skin);if(a[9]===2)r(30,14,5,10,skin);if(a[9]===3)r(17,23,15,3,'#4b3734');
 if(face!==0){r(19,17,3,2,'#182c38');r(28,17,3,2,'#182c38');r(22,23,7,1,'#805660');}else r(17,11,15,8,hair);
 if(a[5]!==5){r(15,7,19,6,hair);if(a[5]===1)r(22,2,6,8,hair);if(a[5]===2){r(13,10,5,24,hair);r(32,10,5,24,hair);}if(a[5]===3){for(let i=0;i<4;i++)r(14+i*6,5,4,9,hair);}if(a[5]===4){r(30,9,7,24,hair);r(33,27,6,9,hair);}}
 if(a[0]===1){r(11,12,6,5,skin);r(33,12,6,5,skin);}if(a[0]===2){r(12,1,5,13,'#e2cfa5');r(32,1,5,13,'#e2cfa5');}if(a[0]===3){r(16,16,17,3,'#73fff0');r(24,29,3,12,'#73fff0');}
 if(a[8]){const col=['','#235568','#bb4558','#4b3b73','#18847d'][a[8]];r(10,33,4,2,col);r(11,35,2,7,col);r(35,32,4,2,col);r(36,34,2,8,col);}if(a[9]===4){r(18,16,14,4,'#182c38');r(19,17,5,1,'#88d9eb');}c.restore();
}
export function avatarSprite(avatar,face=0){const a=avatarOf({avatar}),key=a.join(',')+':'+face;if(cache.has(key))return cache.get(key);const cv=document.createElement('canvas');cv.width=48;cv.height=64;drawAvatar(cv.getContext('2d'),a,face);if(cache.size>=32)cache.delete(cache.keys().next().value);cache.set(key,cv);return cv;}
