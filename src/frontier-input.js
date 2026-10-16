export const MOVEMENT_KEYS=['KeyW','KeyS','KeyA','KeyD','KeyI','KeyK','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'];
export function movementInput(keys,mounted,{throttle=0,steer=0}={}){return{
 forward:Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))+throttle,
 turn:Number(keys.has('ArrowRight')||mounted&&keys.has('KeyD'))-Number(keys.has('ArrowLeft')||mounted&&keys.has('KeyA'))+steer,
 strafe:mounted?0:Number(keys.has('KeyD'))-Number(keys.has('KeyA')),
 brake:mounted&&keys.has('Space')
};}
export const equipmentAction=code=>({KeyQ:'cycle',KeyZ:'cycle',KeyE:'reload',KeyB:'shop'})[code]||null;
