/**
 * Translate screen-space DOM rectangles to a canvas-local WebGL scissor.
 *
 * A fixed canvas does not necessarily begin at viewport (0,0), especially in
 * mobile in-app browsers with an embedded toolbar / dynamic safe area. Using
 * window.innerHeight minus the DOM target's absolute Y offsets the 3D shape
 * downward by the canvas's own page-origin displacement.
 *
 * WebGL's Y axis starts at the BOTTOM of the canvas; DOM Y starts at the TOP.
 */
export type ScreenRect={
 left:number;right:number;top:number;bottom:number;width:number;height:number;
};
export type GLViewport={x:number;y:number;width:number;height:number};
export function canvasLocalViewport(
 canvas:ScreenRect,target:ScreenRect,scale:number,lift=0
):GLViewport|null{
 if(!(canvas.width>0&&canvas.height>0&&target.width>0&&target.height>0&&
      Number.isFinite(scale)&&scale>0&&Number.isFinite(lift)))return null;
 const size=Math.min(target.width,target.height)*scale;
 const centerX=(target.left+target.right)/2-canvas.left;
 const centerY=(target.top+target.bottom)/2-canvas.top-lift;
 const x=Math.max(0,Math.round(centerX-size/2));
 const right=Math.min(Math.round(canvas.width),Math.round(centerX+size/2));
 const y=Math.max(0,Math.round(canvas.height-centerY-size/2));
 const top=Math.min(Math.round(canvas.height),Math.round(canvas.height-centerY+size/2));
 if(right-x<12||top-y<12)return null;
 return {x,y,width:right-x,height:top-y};
}
