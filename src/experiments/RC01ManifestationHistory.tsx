import {useEffect,useRef} from "react";
import * as THREE from "three";
import type {RCPawn} from "@/polytron/rc01Game";
import {gradientPair,gradientCss} from "@/polytron/gradientPalettes";
import {makeRC3DPolytron} from "@/experiments/rc01ThreeScene";
import {releaseRC01Renderer} from "@/experiments/rc01WebGLContext";

/** A single shared WebGL context paints every visible historical 3D preview.
 * Each row supplies a scissor/viewport rectangle on the overlay canvas:
 * the number of browser WebGL contexts is independent of history length.
 * Meshes exist only while their rows intersect the scroll window.
 */
export default function RC01ManifestationHistory({pawn,selectedIndex,onSelect}:{
 pawn:RCPawn;selectedIndex:number|null;
 onSelect:(index:number|null)=>void
}){
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const windowRef=useRef<HTMLDivElement>(null);
 const currentPawn=useRef(pawn);
 currentPawn.current=pawn;
 useEffect(()=>{
  const canvas=canvasRef.current,viewport=windowRef.current;
  if(!canvas||!viewport)return;
  let renderer:THREE.WebGLRenderer;
  try{
   renderer=new THREE.WebGLRenderer({
    canvas,alpha:true,antialias:true,powerPreference:"low-power"
   });
  }catch{return;}
  renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.autoClear=false;
  const scene=new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xe4fff5,0x37566c,2.4));
  const sun=new THREE.DirectionalLight(0xffffff,3);
  sun.position.set(4,5,8);scene.add(sun);
  const camera=new THREE.PerspectiveCamera(35,1,.05,100);
  camera.position.set(3,2.4,7.6);camera.lookAt(0,0,0);
  const actors=new Map<number,ReturnType<typeof makeRC3DPolytron>>();
  let raf=0,alive=true,last=0,w=0,h=0;
  const frame=(now:number)=>{
   if(!alive)return;
   raf=requestAnimationFrame(frame);
   if(document.hidden||now-last<40)return;
   last=now;
   const area=viewport.getBoundingClientRect();
   const width=Math.round(area.width),height=Math.round(area.height);
   if(width<12||height<12)return;
   if(width!==w||height!==h){
    w=width;h=height;renderer.setSize(w,h,false);
   }
   renderer.setScissorTest(false);
   renderer.setViewport(0,0,w,h);
   renderer.clear(true,true,true);
   renderer.setScissorTest(true);
   const visible=new Set<number>();
   // HTML carries only inert placeholders: never a renderer per row.
   const thumbnails=viewport.querySelectorAll<HTMLElement>("[data-mneme-index]");
   for(const tile of thumbnails){
    const rect=tile.getBoundingClientRect();
    const left=Math.max(rect.left,area.left);
    const right=Math.min(rect.right,area.right);
    const top=Math.max(rect.top,area.top);
    const bottom=Math.min(rect.bottom,area.bottom);
    if(right-left<2||bottom-top<2)continue;
    const index=Number(tile.dataset.mnemeIndex);
    const manifestation=currentPawn.current.manifestations[index];
    if(!manifestation)continue;
    let actor=actors.get(index);
    if(!actor){
     try{
      actor=makeRC3DPolytron({...currentPawn.current,...manifestation},1.6);
     }catch{continue;}
     actor.root.visible=false;
     scene.add(actor.root);
     actors.set(index,actor);
    }
    visible.add(index);
    // Viewport retains the original tile geometry when a row is partly
    // scrolled offscreen. Scissor clips exactly to the visible intersection.
    renderer.setViewport(
     Math.round(rect.left-area.left),Math.round(area.bottom-rect.bottom),
     Math.round(rect.width),Math.round(rect.height));
    renderer.setScissor(
     Math.round(left-area.left),Math.round(area.bottom-bottom),
     Math.round(right-left),Math.round(bottom-top));
    actor.spin.rotation.y=now*.00035;
    actor.spin.rotation.x=.22+Math.sin(now*.00027)*.16;
    actor.spin.rotation.z=.08;
    actor.root.visible=true;
    renderer.render(scene,camera);
    actor.root.visible=false;
   }
   for(const [index,actor] of actors){
    if(visible.has(index))continue;
    scene.remove(actor.root);actor.dispose();actors.delete(index);
   }
  };
  raf=requestAnimationFrame(frame);
  return ()=>{
   alive=false;cancelAnimationFrame(raf);
   for(const actor of actors.values()){
    scene.remove(actor.root);actor.dispose();
   }
   actors.clear();
   renderer.setScissorTest(false);
   releaseRC01Renderer(renderer,canvas);
  };
 },[pawn.seal]);
 const mostRecent=pawn.manifestations.length-1;
 const entries=pawn.manifestations.map((manifestation,index)=>({
  manifestation,index
 })).slice().reverse();
 return <section className="rc01-manifestations" aria-label="Manifestation history">
  <div className="rc01-manifestations-head">
   <h3>Manifestations</h3>
   <span className="rc01-manifestations-count"
    aria-label={pawn.manifestations.length+" manifestations"}>
    {pawn.manifestations.length}
   </span>
  </div>
  <div className="rc01-manifestations-window" ref={windowRef}>
   <div className="rc01-manifestations-list" role="list"
    aria-label="Most recent manifestation first">
    {entries.map(({manifestation,index})=>{
     const palette=gradientPair(manifestation.row,manifestation.col);
     const active=selectedIndex===index||
      (selectedIndex===null&&index===mostRecent);
     return <div className="rc01-manifestation-entry" role="listitem" key={index}>
      <button type="button" className="rc01-manifestation-button"
       aria-pressed={active}
       aria-label={"Inspect manifestation "+manifestation.number+
        " with palette "+palette.name}
       onClick={()=>onSelect(index===mostRecent?null:index)}>
       <span className="rc01-manifestation-thumbnail" data-mneme-index={index}/>
       <span className="rc01-manifestation-number">{manifestation.number}</span>
       <span className="rc01-manifestation-meta">
        <span>{index===mostRecent?"Present":"Past"}</span>
        <span className="rc01-manifestation-swatch" role="img"
         aria-label={palette.name}
         style={{background:gradientCss(
          palette.primary.hex,palette.secondary.hex)}}/>
       </span>
      </button>
     </div>;
    })}
   </div>
   <canvas className="rc01-manifestations-canvas" ref={canvasRef}
    aria-hidden="true"/>
  </div>
 </section>;
}
