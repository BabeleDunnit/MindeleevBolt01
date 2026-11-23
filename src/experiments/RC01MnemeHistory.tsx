import {useEffect,useRef} from "react";
import * as THREE from "three";
import type {RCPawn} from "@/polytron/rc01Game";
import {rcCompletedMnemes} from "@/polytron/rc01Mneme";
import {rowIndexToOps} from "@/polytron/politronicNumber";
import {gradientCss,gradientPair} from "@/polytron/gradientPalettes";
import {makeRC3DPolytron} from "@/experiments/rc01ThreeScene";
import {releaseRC01Renderer} from "@/experiments/rc01WebGLContext";

const GROUPS=["T","C","O","D","I"] as const;

/** Every Mneme preview (five Conway solids per period) shares ONE
 * scissored WebGL renderer. No per-cell browser contexts.
 */
export default function RC01MnemeHistory({pawn}:{pawn:RCPawn}){
 const mnemes=rcCompletedMnemes(pawn.manifestations);
 const hasMnemes=mnemes.length>0;
 const viewportRef=useRef<HTMLDivElement>(null);
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const latest=useRef({pawn,mnemes});
 latest.current={pawn,mnemes};
 useEffect(()=>{
  const canvas=canvasRef.current,viewport=viewportRef.current;
  if(!canvas||!viewport)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});}
  catch{return;}
  renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.autoClear=false;
  const scene=new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xe4fff5,0x37566c,2.4));
  const lamp=new THREE.DirectionalLight(0xffffff,3);
  lamp.position.set(4,5,8);scene.add(lamp);
  const camera=new THREE.PerspectiveCamera(35,1,.05,100);
  camera.position.set(3,2.4,7.6);camera.lookAt(0,0,0);
  const actors=new Map<string,ReturnType<typeof makeRC3DPolytron>>();
  let raf=0,alive=true,last=0,w=0,h=0;
  const frame=(time:number)=>{
   if(!alive)return;
   raf=requestAnimationFrame(frame);
   if(document.hidden||time-last<45)return;
   last=time;
   const area=viewport.getBoundingClientRect();
   const width=Math.round(area.width),height=Math.round(area.height);
   if(width<12||height<12)return;
   if(width!==w||height!==h){w=width;h=height;renderer.setSize(w,h,false);}
   renderer.setScissorTest(false);
   renderer.setViewport(0,0,w,h);
   renderer.clear(true,true,true);
   renderer.setScissorTest(true);
   const visible=new Set<string>();
   for(const tile of viewport.querySelectorAll<HTMLElement>("[data-mneme-preview]")){
    const box=tile.getBoundingClientRect();
    const left=Math.max(box.left,area.left),right=Math.min(box.right,area.right);
    const top=Math.max(box.top,area.top),bottom=Math.min(box.bottom,area.bottom);
    if(right-left<2||bottom-top<2)continue;
    const index=Number(tile.dataset.mnemeIndex);
    const group=Number(tile.dataset.mnemeGroup);
    const mneme=latest.current.mnemes[index];
    if(!mneme||!Number.isInteger(group)||group<0||group>4)continue;
    const key=index+":"+group;
    let actor=actors.get(key);
    if(!actor){
     const number=(mneme.period-1)*5+group+1;
     try{
      actor=makeRC3DPolytron({...latest.current.pawn,
       number,row:mneme.row,col:mneme.col},1.6);
     }catch{continue;}
     actor.root.visible=false;
     scene.add(actor.root);
     actors.set(key,actor);
    }
    visible.add(key);
    renderer.setViewport(
     Math.round(box.left-area.left),Math.round(area.bottom-box.bottom),
     Math.round(box.width),Math.round(box.height));
    renderer.setScissor(
     Math.round(left-area.left),Math.round(area.bottom-bottom),
     Math.round(right-left),Math.round(bottom-top));
    camera.aspect=box.width/box.height;camera.updateProjectionMatrix();
    actor.spin.rotation.y=time*.00032;
    actor.spin.rotation.x=.22+Math.sin(time*.00024)*.13;
    actor.root.visible=true;
    renderer.render(scene,camera);
    actor.root.visible=false;
   }
   for(const [key,actor] of actors){
    if(visible.has(key))continue;
    scene.remove(actor.root);actor.dispose();actors.delete(key);
   }
  };
  raf=requestAnimationFrame(frame);
  return ()=>{
   alive=false;cancelAnimationFrame(raf);
   for(const actor of actors.values()){scene.remove(actor.root);actor.dispose();}
   actors.clear();
   releaseRC01Renderer(renderer,canvas);
  };
 },[pawn.seal,hasMnemes]);
 return <section className="rc01-mneme-section" aria-label="Completed Mnemes">
  <div className="rc01-manifestations-head">
   <h3>Mneme · completed periods</h3>
   <span className="rc01-manifestations-count"
    aria-label={mnemes.length+" completed Mnemes"}>{mnemes.length}</span>
  </div>
  {!hasMnemes&&<p className="rc01-mneme-empty">
   No Mneme completed yet. Manifest all five groups of a period
   with the same palette to earn Field E equal to its period.
  </p>}
  {hasMnemes&&<div className="rc01-mneme-window" ref={viewportRef}>
   <div className="rc01-mneme-list">
    {[...mnemes].reverse().map((mneme,reverseIndex)=>{
     const index=mnemes.length-1-reverseIndex;
     const gradient=gradientPair(mneme.row,mneme.col);
     const ops=rowIndexToOps(mneme.period-1);
     return <div key={index} className="rc01-mneme-entry">
      <div className="rc01-mneme-top">
       <strong>Period {mneme.period}</strong>
       <code title="Conway operators">Conway {ops||"∅"}</code>
       <span className="rc01-mneme-energy">+{mneme.period} E</span>
      </div>
      <div className="rc01-mneme-palette">
       <span>{gradient.name}</span>
       <span className="rc01-mneme-gradient" role="img"
        aria-label={"Continuous palette "+gradient.name}
        style={{background:gradientCss(gradient.primary.hex,gradient.secondary.hex)}}/>
      </div>
      <div className="rc01-mneme-solids">
       {GROUPS.map((group,i)=><div className="rc01-mneme-solid" key={group}>
        <span className="rc01-mneme-solid-preview" data-mneme-preview=""
         data-mneme-index={index} data-mneme-group={i}/>
        <span className="rc01-mneme-solid-label">{group}</span>
       </div>)}
      </div>
     </div>;
    })}
   </div>
   <canvas ref={canvasRef} className="rc01-mneme-canvas" aria-hidden="true"/>
  </div>}
 </section>;
}
