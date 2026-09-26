export const BENCHMARK_FIXTURE={version:2,at:'2026-09-26T00:00:00.000Z',score:100,quality:'high',medianFrameMs:16.67,p95FrameMs:18,renderP95Ms:4,slowFrameRatio:0,frameCount:110,durationMs:2200,profile:{cores:8,memoryGb:8,touchPoints:0,dpr:1,viewport:{width:1440,height:900},canvas:true,audio:true,reducedMotion:false}};

export function denyAutomaticOrientation(){
 Element.prototype.requestFullscreen=()=>Promise.reject(new DOMException('Test denied fullscreen','NotAllowedError'));
 if(screen.orientation)screen.orientation.lock=()=>Promise.reject(new DOMException('Test unsupported rotation','NotSupportedError'));
}
