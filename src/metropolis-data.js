export const CITY_BOUNDS={left:198,top:20,right:374,bottom:174};
export const inCity=(x,y)=>x>=198&&x<=374&&y>=20&&y<=174;
export const cityDistrict=(x,y)=>!inCity(x,y)?null:y>119?'waterfront':x<258?'aurora':x<314?'copper':'heights';
// The architecture and inhabitants are fictional. No real address or private home.
export const CITY_DESTINATIONS=[
 {id:'citygate',x:144.5,y:119.5,station:true,color:'#9af1d0'},
 {id:'tether',x:230.5,y:46.5,station:true,color:'#50e7bc'},
 {id:'aurora',x:230.5,y:108.5,station:true,color:'#8bd7f5'},
 {id:'copper',x:286.5,y:108.5,station:true,color:'#e8b785'},
 {id:'heights',x:342.5,y:108.5,station:true,color:'#d5c1fa'},
 {id:'canalpark',x:286.5,y:154.5,station:true,color:'#9ce4ba'},
 {id:'cityarcade',x:242.5,y:142.5,color:'#e9a0d9'},
 {id:'apartment',x:218.5,y:142.5,color:'#eed995'},
 {id:'citygallery',x:330.5,y:142.5,color:'#c8d2ee'},
 {id:'boathouse',x:354.5,y:154.5,color:'#94cbdc'}
].map(p=>({...p,kind:'city',metro:true}));
export const CITY_DISCOVERIES=[
 {id:'last-umbrella',x:276.5,y:55.5,district:'copper',kind:'metroUmbrella'},
 {id:'quiet-frequency',x:250.5,y:87.5,district:'aurora',kind:'metroRadio'},
 {id:'garden-key',x:346.5,y:66.5,district:'heights',kind:'metroGarden'},
 {id:'blue-hour',x:294.5,y:163.5,district:'waterfront',kind:'metroTelescope'},
 {id:'paper-stars',x:302.5,y:31.5,district:'copper',kind:'metroLantern'},
 {id:'first-light',floor:'sky',x:7.5,y:5.5,district:'tether',kind:'metroTelescope'}
];
export const CITY_STATIONS=CITY_DESTINATIONS.filter(p=>p.station);
export const CITY_PRICE={ticket:6,apartment:320};
export const CITY_BUILDINGS=[
 {id:'tether',left:223,top:27,width:14,depth:17,kind:'office',height:25,style:'glass',floors:60},
 ...[[207,63,8,12,8],[238,63,12,17,12],[210,87,10,14,6],[239,94,10,8,4]].map(([left,top,width,depth,height],i)=>({id:'aurora-office-'+i,left,top,width,depth,height,kind:'office',style:'glass',floors:Math.round(height*2)})),
 ...Array.from({length:12},(_,i)=>({id:'copper-home-'+i,left:264+(i%3)*15,top:28+Math.floor(i/3)*20,width:8,depth:11,height:2.4+i%3*.5,kind:'house',style:'brick',floors:2+i%2})),
 ...Array.from({length:6},(_,i)=>({id:'heights-manor-'+i,left:320+(i%2)*25,top:28+Math.floor(i/2)*25,width:13,depth:13,height:3+i%2,kind:'manor',style:'stone',floors:3})),
 {id:'apartment',left:214,top:129,width:9,depth:11,height:6,kind:'house',style:'brick',floors:8},
 {id:'cityarcade',left:236,top:129,width:13,depth:11,height:3,kind:'arcade',style:'glass',floors:3},
 {id:'citygallery',left:324,top:127,width:13,depth:13,height:4,kind:'gallery',style:'stone',floors:4},
 {id:'boathouse',left:350,top:143,width:9,depth:9,height:2,kind:'house',style:'brick',floors:2}
].map(b=>({...b,metro:true,x:b.left+b.width/2,y:b.top+b.depth/2,door:{x:b.left+Math.floor(b.width/2)+.5,y:b.top+b.depth+.7}}));
