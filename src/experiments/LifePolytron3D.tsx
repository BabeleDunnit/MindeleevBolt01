import {useEffect,useRef} from "react";
import * as THREE from "three";
import {polytronGeometry} from "@/polytron/polytron";
import {gradientPair} from "@/polytron/gradientPalettes";
import {canvasLocalViewport} from "@/experiments/canvasLocalViewport";
import type {GradientSelection,GradientOrder} from "@/polytron/gradientFacePalette";

/**
 * A single transparent WebGL canvas, shared by every cell and affordable-card
 * viewport. Per-cell scissor squares are deliberately narrower than the hex
 * pitch; interactive SVG/picker controls remain above/below an inert canvas.
 * Geometry and face colours are real canonical Conway/Chromatica models.
 */
export default function LifePolytron3D({row,col,order,scope,canvasClassName="ml-shared-3d"}:{
 row:number;col:number;order:GradientOrder;scope?:string;canvasClassName?:string
}){
 const node=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=node.current;if(!canvas)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});}
  catch{return;}
  renderer.setPixelRatio(Math.min(1.2,window.devicePixelRatio||1));
  renderer.setClearColor(0x000000,0);
  renderer.autoClear=false;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const selection:GradientSelection={pair:gradientPair(row,col),order};
  const group=new THREE.Group();
  const scene=new THREE.Scene();scene.add(group);
  scene.add(new THREE.HemisphereLight(0xe0faff,0x2d405b,2.9));
  const sun=new THREE.DirectionalLight(0xffffff,2.5);
  sun.position.set(4,5,9);scene.add(sun);
  const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.62,
    metalness:.06,flatShading:true,side:THREE.DoubleSide,transparent:true,opacity:1,depthWrite:true});
  const outlines=new THREE.LineBasicMaterial({color:0xdff5ef,transparent:true,opacity:.43});
  const mesh=new THREE.Mesh(new THREE.BufferGeometry(),mat);
  const edges=new THREE.LineSegments(new THREE.BufferGeometry(),outlines);
  group.add(mesh,edges);
  const camera=new THREE.PerspectiveCamera(36,1,.05,60);
  camera.position.set(3,2.5,6.4);camera.lookAt(0,0,0);
  const cache=new Map<string,{
   solid:THREE.BufferGeometry;edges:THREE.BufferGeometry;scale:number;center:THREE.Vector3
  }>();
  const MAX_CACHED=70;
  const getGeometry=(dna:string,custom:GradientSelection,key:string)=>{
   const found=cache.get(key);
   if(found){cache.delete(key);cache.set(key,found);return found;}
   const geo=polytronGeometry(dna,undefined,custom);
   geo.solid.computeBoundingSphere();
   const radius=geo.solid.boundingSphere?.radius??2;
   const value={...geo,scale:1.25/Math.max(.2,radius),
    center:geo.solid.boundingSphere?.center.clone()??new THREE.Vector3()};
   cache.set(key,value);
   if(cache.size>MAX_CACHED){
    const oldest=cache.keys().next().value;
    if(oldest!==undefined){
     const deleted=cache.get(oldest)!;cache.delete(oldest);
     deleted.solid.dispose();deleted.edges.dispose();
    }
   }
   return value;
  };
  let alive=true,raf=0,lastFrame=-200,lastW=0,lastH=0;
  const render=(time:number)=>{
   if(!alive)return;
   raf=requestAnimationFrame(render);
   if(document.hidden||time-lastFrame<66)return;
   lastFrame=time;
   // Measure the ACTUAL WebGL canvas, not window.innerHeight. On mobile
   // embedded browsers its screen origin can be below a browser toolbar.
   const canvasBox=canvas.getBoundingClientRect();
   const w=Math.round(canvasBox.width),h=Math.round(canvasBox.height);
   if(w<12||h<12)return;
   if(lastW!==w||lastH!==h){lastW=w;lastH=h;renderer.setSize(w,h,false);}
   renderer.setScissorTest(true);
   renderer.setViewport(0,0,w,h);renderer.setScissor(0,0,w,h);
   renderer.clear(true,true,true);
   // When RC01 supplies a scope, its local board canvas only paints board
   // Polytrons, and a separate sheet canvas paints the inspector model.
   // The older labs retain their original global single-canvas behaviour.
   const viewports=document.querySelectorAll<SVGGraphicsElement|HTMLElement>(
    scope?scope+" [data-life-polytron]":"[data-life-polytron]"
   );
   for(const element of viewports){
    const dna=element.getAttribute("data-life-polytron");
    if(!dna)continue;
    const box=element.getBoundingClientRect();
    if(box.right<=canvasBox.left||box.left>=canvasBox.right||
       box.bottom<=canvasBox.top||box.top>=canvasBox.bottom)continue;
    const isCard=element.getAttribute("data-life-kind")==="card";
    const scaleOverride=Number(element.getAttribute("data-life-scale"));
    const scale=Number.isFinite(scaleOverride)&&scaleOverride>0&&scaleOverride<=1.4?
      scaleOverride:(isCard?.8:.66);
    // Prior Life lab intentionally lifts polyhedra 12% above their viewport.
    // RC01 requests exact centering. Both now use the proper canvas origin.
    const preciseCenter=element.getAttribute("data-life-center")==="true";
    const lift=(preciseCenter||isCard)?0:box.height*.12;
    const viewport=canvasLocalViewport(canvasBox,box,scale,lift);
    if(!viewport)continue;
    const {x,y,width,height}=viewport;
    const customRow=Number(element.getAttribute("data-life-palette-row"));
    const customCol=Number(element.getAttribute("data-life-palette-col"));
    const hasCustom=element.hasAttribute("data-life-palette-row")&&
     element.hasAttribute("data-life-palette-col");
    const useRow=hasCustom?customRow:row,useCol=hasCustom?customCol:col;
    let geo;
    try{
     const custom=hasCustom?{pair:gradientPair(useRow,useCol),order}:selection;
     geo=getGeometry(dna,custom,dna+"|"+useRow+"|"+useCol+"|"+order);
    }catch{continue;}
    // Ghost alpha belongs to this *individual viewport*; it must not leak
    // from a spectral candidate into the next solid Polytron.
    const requested=Number(element.getAttribute("data-life-alpha")??"1");
    const alpha=Number.isFinite(requested)?Math.max(0,Math.min(1,requested)):1;
    mat.opacity=alpha;
    mat.depthWrite=alpha>=.99;
    outlines.opacity=.43*alpha;
    mesh.geometry=geo.solid;edges.geometry=geo.edges;
    // Conway polyhedra are not guaranteed to be centred on (0,0,0).
    // For the board, remove any offset BEFORE rotating; otherwise the
    // apparent model would orbit around, not sit at, the hex centre.
    if(preciseCenter){
     mesh.position.copy(geo.center).multiplyScalar(-1);
     edges.position.copy(geo.center).multiplyScalar(-1);
    }else{mesh.position.set(0,0,0);edges.position.set(0,0,0);}
    group.scale.setScalar(geo.scale);
    group.rotation.y=.65+time*.00026;
    group.rotation.x=.25+Math.sin(time*.00023)*.10;
    camera.aspect=width/height;camera.updateProjectionMatrix();
    renderer.setViewport(x,y,width,height);renderer.setScissor(x,y,width,height);
    renderer.render(scene,camera);
   }
  };
  raf=requestAnimationFrame(render);
  return ()=>{
   alive=false;cancelAnimationFrame(raf);
   for(const geo of cache.values()){geo.solid.dispose();geo.edges.dispose();}
   mesh.geometry=new THREE.BufferGeometry();
   edges.geometry=new THREE.BufferGeometry();
   mesh.geometry.dispose();edges.geometry.dispose();
   mat.dispose();outlines.dispose();renderer.dispose();
  };
 },[row,col,order,scope]);
 return <canvas ref={node} className={canvasClassName} aria-hidden="true"/>;
}
