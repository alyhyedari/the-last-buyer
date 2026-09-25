// Hand-authored topology. Visual walls and collision share the same rectangles.
const wall=(x,y,w,h)=>({type:'partition',x,y,w,h});
const prop=(type,x,y,w=44,h=38)=>({type,x,y,w,h});
export const LAYOUTS=[
 {episode:[650,535],hide:[[93,291],[610,513]],walls:[]},
 {stations:[[196,168],[736,179],[635,472]],records:[[112,339],[828,460],[434,128],[330,530]],npc:[460,320],exit:[851,113],episode:[270,382],hide:[[125,470],[823,271]],
  props:[prop('rock',369,220,105,42),prop('rock',541,350,47,86),prop('rock',75,148,47,53),prop('crate',707,366,38,30),prop('plant',894,526)],walls:[]},
 {stations:[[186,161],[481,354],[808,462]],records:[[94,268],[751,558],[776,119],[433,520]],npc:[720,207],exit:[857,112],episode:[276,453],hide:[[232,234],[705,510]],
  props:[prop('shelf',72,90,64,54),prop('shelf',388,95,78,54),prop('server',661,290,37,96),prop('crate',786,320,47,37)],
  walls:[wall(311,77,19,200),wall(311,372,19,168),wall(603,170,18,165),wall(603,440,18,167)]},
 {stations:[[171,176],[737,198],[744,483]],records:[[103,325],[830,382],[464,137],[305,543]],npc:[463,325],exit:[858,114],episode:[440,465],hide:[[113,419],[791,298]],
  props:[prop('table',402,203,96,36),prop('shelf',74,91,54,46),prop('crate',683,303,49,36),prop('plant',269,242),prop('water',45,556,869,34)],
  walls:[wall(330,80,18,214),wall(330,393,18,116),wall(610,160,18,143),wall(610,412,18,165),wall(350,371,151,14)]},
 {stations:[[179,155],[775,162],[780,492]],records:[[102,321],[695,558],[485,126],[297,552]],npc:[460,277],exit:[862,110],episode:[483,446],hide:[[119,443],[833,331]],
  props:[prop('server',285,117,44,152),prop('server',285,365,44,149),prop('server',630,117,44,152),prop('server',630,365,44,149),prop('server',398,292,54,46),prop('server',504,292,54,46)],walls:[]},
 {stations:[[186,163],[758,192],[756,456]],records:[[109,350],[825,550],[451,130],[312,546]],npc:[475,276],exit:[864,111],episode:[375,406],hide:[[138,436],[681,547]],
  props:[prop('table',381,225,196,40),prop('shelf',84,93,53,48),prop('plant',604,339),prop('crate',805,319,46,40),prop('table',565,471,67,34)],walls:[wall(320,96,15,168),wall(320,455,15,51)]},
 {stations:[[158,180],[487,165],[808,361]],records:[[97,339],[783,542],[778,120],[296,544]],npc:[475,327],exit:[864,110],episode:[435,469],hide:[[215,266],[716,460]],
  props:[prop('shelf',56,95,49,47),prop('table',369,267,203,30),prop('server',819,448,38,66),prop('crate',655,144,52,38)],walls:[wall(290,78,19,231),wall(290,408,19,83),wall(651,274,18,137)]},
 {stations:[[182,181],[786,184],[791,468]],records:[[106,343],[821,554],[503,123],[296,547]],npc:[485,264],exit:[858,112],episode:[479,460],hide:[[176,466],[730,304]],
  props:[prop('pillar',319,220,30,59),prop('pillar',611,220,30,59),prop('pillar',319,386,30,59),prop('pillar',611,386,30,59)],walls:[]}
];
export function applyLayout(chapter){
 const layout=LAYOUTS[chapter.index];
 if(layout.props)chapter.props=layout.props;
 if(layout.stations)for(const e of chapter.entities){const point=e.type==='station'?layout.stations[e.slot]:e.type==='record'?layout.records[e.slot]:e.type==='npc'?layout.npc:layout.exit;if(point)[e.x,e.y]=point;}
 chapter.props.push(...layout.walls);chapter.hideZones=layout.hide.map(([x,y])=>({x,y,radius:31}));
 chapter.entities.push({id:`${chapter.index}:episode`,type:'episode',x:layout.episode[0],y:layout.episode[1]});
 chapter.entities.push({id:`${chapter.index}:wayback`,type:'wayback',x:180,y:577});
 for(const e of chapter.entities)if(e.type==='station')e.rounds=2;
 return chapter;
}
