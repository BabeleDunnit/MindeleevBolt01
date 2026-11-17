import {useEffect,useRef} from "react";
import * as THREE from "three";
import type {RCPawn} from "@/polytron/rc01Game";
import {makeRC3DPolytron} from "@/experiments/rc01ThreeScene";

/** Inspector: real Three.js scene, not SVG and not a screenshot of the pawn. */
export default function RC01ThreeInspector({pawn}:{pawn:RCPawn}){
 const canvasRef=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=canvasRef.current;if(!canvas)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});}
  catch{return;}
  renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xe4fff5,0x37566c,2.4));
  const sun=new THREE.DirectionalLight(0xffffff,3);
  sun.position.set(4,5,8);scene.add(sun);
  const camera=new THREE.PerspectiveCamera(35,1,.05,100);
  camera.position.set(3,2.4,7.6);camera.lookAt(0,0,0);
  let actor:ReturnType<typeof makeRC3DPolytron>|null=null;
  try{
   actor=makeRC3DPolytron(pawn,1.6);
   scene.add(actor.root);
  }catch{
   renderer.dispose();return;
  }
  let raf=0,alive=true,w=0,h=0,last=0;
  const frame=(now:number)=>{
   if(!alive)return;
   raf=requestAnimationFrame(frame);
   if(document.hidden||now-last<30)return;
   last=now;
   const rect=canvas.getBoundingClientRect();
   const nw=Math.round(rect.width),nh=Math.round(rect.height);
   if(nw<12||nh<12)return;
   if(nw!==w||nh!==h){
    w=nw;h=nh;renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();
   }
   if(actor){
    actor.spin.rotation.y=now*.00035;
    actor.spin.rotation.x=.22+Math.sin(now*.00027)*.16;
    actor.spin.rotation.z=.08;
   }
   renderer.render(scene,camera);
  };
  raf=requestAnimationFrame(frame);
  return ()=>{
   alive=false;cancelAnimationFrame(raf);
   actor?.dispose();renderer.dispose();
  };
 },[pawn.seal,pawn.number,pawn.row,pawn.col]);
 return <canvas className="rc01-three-inspector" ref={canvasRef}
  role="img" aria-label={"Rotating 3D model of Polytron number "+pawn.number}/>;
}
