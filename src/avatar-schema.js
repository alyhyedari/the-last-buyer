// Compact cosmetic schema shared by saves, the editor and echo packets.
export const AVATAR_LIMITS=[3,2,4,4,5,5,5,5,4,4];
export const DEFAULT_AVATAR=[0,0,2,2,1,0,0,0,0,0];
// species, presentation, height, build, skin, hair, hairColour, outfit, tattoo, face
export function validAvatar(a){return Array.isArray(a)&&a.length===10&&a.every((v,i)=>Number.isInteger(v)&&v>=0&&v<=AVATAR_LIMITS[i]);}
