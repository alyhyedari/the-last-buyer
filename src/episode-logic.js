// Puzzle actions describe mechanics only. They are never psychological evidence.
export const EDGES={A:['B','C'],B:['A','F'],C:['A','D'],D:['C','E'],E:['D','F'],F:['B','E']};
export function episodeInitial(type){
 const values={tape:{frequency:0,bands:[]},ration:{portions:[9,0,0]},flood:{portions:[6,0,0]},dispatch:{route:['A'],tampered:false},consensus:{selected:[]},silence:{playing:[true,true,true]},timeline:{order:[2021,2008,2010,2009]},council:{heard:[],accepted:[]}};
 return structuredClone(values[type]);
}
export function episodeAction(type,data,action){
 const s=structuredClone(data),i=action.index;
 if(type==='tape'&&action.type==='tune'&&Number.isFinite(action.value)){s.frequency=Math.max(0,Math.min(100,action.value));[18,47,81].forEach((n,i)=>{if(Math.abs(s.frequency-n)<=2&&!s.bands.includes(i))s.bands.push(i);});}
 if(['ration','flood'].includes(type)&&action.type==='transfer'){const{from,to}=action;if([0,1,2].includes(from)&&[0,1,2].includes(to)&&from!==to&&s.portions[from]>0){s.portions[from]--;s.portions[to]++;}}
 if(type==='dispatch'&&action.type==='node'&&EDGES[s.route.at(-1)].includes(action.node)){s.route.push(action.node);if(action.node==='B')s.tampered=true;}
 if(type==='consensus'&&action.type==='select'&&[0,1,2,3,4].includes(i))s.selected=s.selected.includes(i)?s.selected.filter(n=>n!==i):[...s.selected,i];
 if(type==='silence'&&action.type==='toggle'&&[0,1,2].includes(i))s.playing[i]=!s.playing[i];
 if(type==='timeline'&&action.type==='move'&&Number.isInteger(i)&&[1,-1].includes(action.delta)&&i>=0&&i<4){const j=i+action.delta;if(j>=0&&j<4)[s.order[i],s.order[j]]=[s.order[j],s.order[i]];}
 if(type==='council'&&[0,1,2].includes(i)){if(action.type==='listen'&&!s.heard.includes(i))s.heard.push(i);if(action.type==='accept'&&s.heard.includes(i))s.accepted=s.accepted.includes(i)?s.accepted.filter(n=>n!==i):[...s.accepted,i];}
 return s;
}
export function episodeSolved(type,s){
 return type==='tape'?s.bands.length===3:type==='ration'?s.portions.join()==='4,3,2':type==='flood'?s.portions.join()==='2,2,2':type==='dispatch'?s.route.at(-1)==='F'&&!s.tampered:type==='consensus'?s.selected.slice().sort().join()==='0,2,4':type==='silence'?s.playing.every(v=>!v):type==='timeline'?s.order.join()==='2008,2009,2010,2021':type==='council'?s.heard.length===3&&s.accepted.length===3:false;
}
export function assistEpisode(type){const s=episodeInitial(type);if(type==='tape')s.bands=[0,1,2];if(type==='ration')s.portions=[4,3,2];if(type==='flood')s.portions=[2,2,2];if(type==='dispatch')s.route=['A','C','D','E','F'];if(type==='consensus')s.selected=[0,2,4];if(type==='silence')s.playing=[false,false,false];if(type==='timeline')s.order=[2008,2009,2010,2021];if(type==='council'){s.heard=[0,1,2];s.accepted=[0,1,2];}return s;}
