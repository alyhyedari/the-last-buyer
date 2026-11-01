import {validAvatar,DEFAULT_AVATAR} from './avatar-schema.js';
export {validAvatar,DEFAULT_AVATAR,AVATAR_LIMITS} from './avatar-schema.js';
export const avatarOf=p=>validAvatar(p?.avatar)?p.avatar:DEFAULT_AVATAR;
export const avatarMass=p=>{const a=avatarOf(p);return Math.round(45+a[2]*9+a[3]*15+(a[0]===2?28:0));};
export function loadedVehicle(vehicle,player,passengers=0,pet=false){const mass=avatarMass(player)+Math.max(0,Math.min(3,passengers))*70+(pet?18:0),base=vehicle.engine?.cabin==='bike'?220:1250,factor=base/(base+Math.max(0,mass-80));return{...vehicle,accel:vehicle.accel*Math.max(.65,factor),speed:vehicle.speed*(.96+.04*factor)};}
export const SKIN=['#f2c8a1','#dca879','#bb815b','#85553e','#553c34','#8fcab1'];
export const HAIR=['#30282e','#70472f','#c89755','#dad3c8','#bd62a6','#65c9d0'];
export const CLOTH=['#356779','#6c4f8d','#b86948','#50835d','#d1bc86','#303740'];
