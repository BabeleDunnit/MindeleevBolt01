import {useEffect,useRef} from "react";
import * as THREE from "three";
import {polytronGeometry} from "@/polytron/polytron";
import {gradientPair} from "@/polytron/gradientPalettes";
import type {GradientSelection,GradientOrder} from "@/polytron/gradientFacePalette";

/**
 * A single transparent WebGL canvas, shared by every cell and affordable-card
 * viewport. Per-cell scissor squares are deliberately narrower than the hex
 * pitch; interactive SVG/picker controls remain above/below an inert canvas.
 * Geometry and face colours are real canonical Conway/Chromatica models.
 */
export default function LifePolytron3D({row,col,order}:{
 row:number;col:number;order:GradientOrder
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
   solid:THREE.BufferGeometry;edges:THREE.BufferGeometry;scale:number
  }>();
  const MAX_CACHED=70;
  const getGeometry=(dna:string)=>{
   const found=cache.get(dna);
   if(found){cache.delete(dna);cache.set(dna,found);return found;}
   const geo=polytronGeometry(dna,undefined,selection);
   geo.solid.computeBoundingSphere();
   const radius=geo.solid.boundingSphere?.radius??2;
   const value={...geo,scale:1.25/Math.max(.2,radius)};
   cache.set(dna,value);
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
   const w=window.innerWidth,h=window.innerHeight;
   if(lastW!==w||lastH!==h){lastW=w;lastH=h;renderer.setSize(w,h,false);}
   renderer.setScissorTest(true);
   renderer.setViewport(0,0,w,h);renderer.setScissor(0,0,w,h);
   renderer.clear(true,true,true);
   const viewports=document.querySelectorAll<SVGGraphicsElement|HTMLElement>(
    "[data-life-polytron]"
   );
   for(const element of viewports){
    const dna=element.getAttribute("data-life-polytron");
    if(!dna)continue;
    const box=element.getBoundingClientRect();
    if(box.right<0||box.left>=w||box.bottom<0||box.top>=h)continue;
    const isCard=element.getAttribute("data-life-kind")==="card";
    const size=isCard?Math.min(box.width,box.height)*.8:
      Math.min(box.width,box.height)*.66;
    const centerX=(box.left+box.right)/2;
    const centerY=(box.top+box.bottom)/2-(isCard?0:box.height*.12);
    const x=Math.max(0,Math.round(centerX-size/2));
    const y=Math.max(0,Math.round(h-centerY-size/2));
    const right=Math.min(w,Math.round(centerX+size/2));
    const top=Math.min(h,Math.round(h-centerY+size/2));
    const width=right-x,height=top-y;
    if(width<12||height<12)continue;
    let geo;
    try{geo=getGeometry(dna);}catch{continue;}
    // Ghost alpha belongs to this *individual viewport*; it must not leak
    // from a spectral candidate into the next solid Polytron.
    const requested=Number(element.getAttribute("data-life-alpha")??"1");
    const alpha=Number.isFinite(requested)?Math.max(0,Math.min(1,requested)):1;
    mat.opacity=alpha;
    mat.depthWrite=alpha>=.99;
    outlines.opacity=.43*alpha;
    mesh.geometry=geo.solid;edges.geometry=geo.edges;
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
 },[row,col,order]);
 return <canvas ref={node} className="ml-shared-3d" aria-hidden="true"/>;
}
