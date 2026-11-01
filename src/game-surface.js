// Suppress accidental selection/callouts on the game surface, not input editing.
const installed=new WeakMap();
export const editableTarget=target=>!!target?.closest?.('input,textarea,[contenteditable=""],[contenteditable="true"]');
export function installGameSurface(doc){
 if(installed.has(doc))return installed.get(doc);
 const prevent=e=>e.preventDefault(),selection=e=>{if(!editableTarget(e.target))e.preventDefault();};
 const key=e=>{if((e.ctrlKey||e.metaKey)&&['a','c','x'].includes(e.key?.toLowerCase())&&!editableTarget(e.target))e.preventDefault();};
 const handlers={contextmenu:prevent,copy:prevent,cut:prevent,dragstart:prevent,selectstart:selection,keydown:key};
 for(const [name,fn]of Object.entries(handlers))doc.addEventListener(name,fn,{capture:true});
 const dispose=()=>{for(const [name,fn]of Object.entries(handlers))doc.removeEventListener(name,fn,{capture:true});installed.delete(doc);};
 installed.set(doc,dispose);return dispose;
}
