export const BENCHMARK_FIXTURE={version:3,at:'2026-09-26T00:00:00.000Z',score:100,quality:'high',medianFrameMs:16.67,p95FrameMs:18,renderP95Ms:4,slowFrameRatio:0,frameCount:120,durationMs:6800,worldBuildMs:80,routeMs:35,scenes:['city','forest','boss','water'].map(id=>({id,medianFrameMs:16.67,p95FrameMs:18,peakFrameMs:22,workP95Ms:4,simulationP95Ms:2,slowFrameRatio:0,frameCount:30,durationMs:1650})),profile:{cores:8,memoryGb:8,touchPoints:0,dpr:1,viewport:{width:1440,height:900},canvas:true,audio:true,reducedMotion:false}};

export function denyAutomaticOrientation(){
 Element.prototype.requestFullscreen=()=>Promise.reject(new DOMException('Test denied fullscreen','NotAllowedError'));
 if(screen.orientation)screen.orientation.lock=()=>Promise.reject(new DOMException('Test unsupported rotation','NotSupportedError'));
}
