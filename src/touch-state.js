// A pointer owns one control until that pointer ends. Cancellation is local.
export class TouchState{
 constructor(){this.pointers=new Map();}
 claim(id,role){if(this.pointers.has(id)||(['steer','look'].includes(role)&&[...this.pointers.values()].includes(role)))return false;this.pointers.set(id,role);return true;}
 has(role){return [...this.pointers.values()].includes(role);}
 release(id){const role=this.pointers.get(id);this.pointers.delete(id);return role;}
 clear(){this.pointers.clear();}
}
