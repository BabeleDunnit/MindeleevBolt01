import * as THREE from "three";
import type {RCBoard,RCCell,RCPoint} from "@/polytron/rc01Board";

/**
 * A single perspective camera makes strategic -> tactical -> subjective
 * continuous. At the opening distance it is visually close to the old
 * overhead orthographic projection, without projection-mode jump cuts.
 */
export type RCViewMode="map"|"area"|"subjective";
export type RCViewSnapshot={
 zoom:number;focusQ:number;focusR:number;azimuth:number;tilt:number
};
type Pose={zoom:number;x:number;y:number;azimuth:number;tilt:number};
const FOV=35;
const DEG=Math.PI/180;
export const RC_CAMERA_ZOOM_MIN=1;
export const RC_CAMERA_ZOOM_MAX=13;
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const lerp=(a:number,b:number,k:number)=>a+(b-a)*k;
const angleDelta=(a:number,b:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function rcCameraTiltForZoom(zoom:number){
 // No noticeable tilt in the overview; then a gradual descent to a
 // near-ground view. Clamp to preserve a stable board-plane intersection.
 if(zoom<=2)return 0;
 if(zoom<=4)return lerp(0,27*DEG,(zoom-2)/2);
 if(zoom<=8)return lerp(27*DEG,69*DEG,(zoom-4)/4);
 return lerp(69*DEG,78*DEG,clamp((zoom-8)/5,0,1));
}
export function rcCameraMode(zoom:number):RCViewMode{
 return zoom<1.4?"map":zoom<5.5?"area":"subjective";
}
export function createRC01CameraRig(board:RCBoard,saved?:RCViewSnapshot){
 const camera=new THREE.PerspectiveCamera(
  FOV,board.width/board.height,.1,Math.max(6000,board.height*24));
 camera.up.set(0,1,0);
 const overviewDistance=board.height/(2*Math.tan(FOV*DEG/2))*1.015;
 const start:Pose={
  zoom:clamp(saved?.zoom??1,RC_CAMERA_ZOOM_MIN,RC_CAMERA_ZOOM_MAX),
  x:clamp((saved?.focusQ??0)*board.size,-board.width*.58,board.width*.58),
  y:clamp((saved?.focusR??0)*board.size,-board.height*.58,board.height*.58),
  tilt:clamp(saved?.tilt??0,0,78*DEG),
  azimuth:saved?.azimuth??-Math.PI/2
 };
 const current={...start},target={...start};
 const pivot=new THREE.Vector3();
 function applyCamera(){
  const distance=overviewDistance/current.zoom;
  const radial=distance*Math.sin(current.tilt);
  pivot.set(current.x,current.y,0);
  camera.position.set(
   current.x+radial*Math.cos(current.azimuth),
   current.y+radial*Math.sin(current.azimuth),
   distance*Math.cos(current.tilt)
  );
  camera.lookAt(pivot);
  camera.updateMatrixWorld(true);
 }
 applyCamera();
 function step(dt:number){
  const t=clamp(1-Math.exp(-Math.max(0,dt)*9.5),0,1);
  current.zoom=Math.exp(lerp(Math.log(current.zoom),Math.log(target.zoom),t));
  current.x=lerp(current.x,target.x,t);
  current.y=lerp(current.y,target.y,t);
  current.tilt=lerp(current.tilt,target.tilt,t);
  current.azimuth+=angleDelta(current.azimuth,target.azimuth)*t;
  applyCamera();
 }
 function focus(x:number,y:number){
  target.x=clamp(x,-board.width*.58,board.width*.58);
  target.y=clamp(y,-board.height*.58,board.height*.58);
 }
 function focusOnCell(cell:RCCell,mode:"area"|"subjective"="area"){
  focus(cell.x-board.width/2,board.height/2-cell.y);
  target.zoom=mode==="subjective"?8.2:3.2;
  target.tilt=mode==="subjective"?71*DEG:rcCameraTiltForZoom(target.zoom);
  if(mode==="subjective")target.azimuth=-Math.PI/2;
 }
 function overview(){
  target.zoom=1;target.x=0;target.y=0;target.tilt=0;
  target.azimuth=-Math.PI/2;
 }
 function zoomAt(factor:number,around?:RCPoint){
  const old=target.zoom;
  target.zoom=clamp(old*factor,RC_CAMERA_ZOOM_MIN,RC_CAMERA_ZOOM_MAX);
  const actualFactor=target.zoom/old;
  if(around&&actualFactor!==1){
   const ax=around.x-board.width/2;
   const ay=board.height/2-around.y;
   // Keep the point under a two-finger gesture approximately stationary.
   focus(target.x+(ax-target.x)*(1-1/actualFactor),
    target.y+(ay-target.y)*(1-1/actualFactor));
  }
  target.tilt=rcCameraTiltForZoom(target.zoom);
 }
 function panWorld(dx:number,dy:number){
  focus(target.x+dx,target.y+dy);
 }
 function orbit(dxPixels:number,dyPixels:number){
  target.azimuth+=dxPixels*.007;
  target.tilt=clamp(target.tilt+dyPixels*.005,20*DEG,78*DEG);
 }
 function snapshot():RCViewSnapshot{
  return {zoom:target.zoom,focusQ:target.x/board.size,
   focusR:target.y/board.size,tilt:target.tilt,
   azimuth:target.azimuth};
 }
 return {
  camera,step,focus,focusOnCell,overview,zoomAt,panWorld,orbit,snapshot,
  getMode:()=>rcCameraMode(target.zoom),
  getTargetZoom:()=>target.zoom,
  getActualZoom:()=>current.zoom,
  getTargetTilt:()=>target.tilt
 };
}
