/** Releasing GPU resources is different from forcibly losing WebGL.
 * React may replay effects (StrictMode) or rebuild the board on viewport
 * resize while keeping the *same* HTMLCanvasElement. Calling
 * forceContextLoss() during cleanup poisons that canvas for its next
 * WebGLRenderer and can produce "Cannot read properties of null (precision)".
 *
 * Dispose now, then lose the context only if the canvas has actually been
 * detached before the next animation frame. A still-connected canvas must
 * retain its functioning WebGL context for any immediate remount.
 */
export type RC01DisposableRenderer={
 dispose:()=>void;
 forceContextLoss:()=>void;
};

export function releaseRC01Renderer(
 renderer:RC01DisposableRenderer,
 canvas:Pick<HTMLCanvasElement,"isConnected">,
 schedule:(callback:()=>void)=>void=(callback)=>{requestAnimationFrame(callback);}
):void{
 renderer.dispose();
 schedule(()=>{
  if(!canvas.isConnected)renderer.forceContextLoss();
 });
}
