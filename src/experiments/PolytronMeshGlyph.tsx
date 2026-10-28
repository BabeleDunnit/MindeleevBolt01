import {memo} from "react";
import {dnaToPoly,dnaPalette} from "@/polytron/polytron";
import {paletteColor} from "@/polytron/palettes";
import type {Vec3} from "@/polyhedronisme/polyhedronisme";

/**
 * Canonical non-rotating projection of the ACTUAL Conway-generated mesh:
 * every displayed polygon corresponds to a face of dnaToPoly(dna), with
 * polyhedronisme face classes and mineral palette colors. No icon substitutes.
 * Orthographic camera = fixed yaw+pitch; depth-sorted surfaces with outward
 * backface culling. This is a lightweight study visualization, not an optical
 * or mechanically accurate scattering surface.
 */
export type FaceGlyph={points:string;fill:string;normalZ:number;depth:number};
export type GlyphModel={dna:string;faces:FaceGlyph[];vertices:number;facets:number;warning?:string};
const CACHE=new Map<string,GlyphModel>();
function convert(v:Vec3):{x:number;y:number;z:number}{
 const yaw=0.56,pitch=-0.32;
 const x=v[0]*Math.cos(yaw)+v[2]*Math.sin(yaw);
 const z=-v[0]*Math.sin(yaw)+v[2]*Math.cos(yaw);
 return {x,y:v[1]*Math.cos(pitch)-z*Math.sin(pitch),z:v[1]*Math.sin(pitch)+z*Math.cos(pitch)};
}
const diff=(a:{x:number;y:number;z:number},b:{x:number;y:number;z:number})=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const cross=(a:{x:number;y:number;z:number},b:{x:number;y:number;z:number})=>({
 x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x
});
export function glyphModel(dna:string):GlyphModel{
 const hit=CACHE.get(dna);if(hit)return hit;
 try{
  const poly=dnaToPoly(dna);
  if(poly.vertices.length>500||poly.faces.length>800)return {dna,faces:[],vertices:poly.vertices.length,facets:poly.faces.length,warning:"Mesh troppo complessa"};
  const vertices=poly.vertices.map(convert);
  const center=vertices.reduce((sum,p)=>({x:sum.x+p.x,y:sum.y+p.y,z:sum.z+p.z}),{x:0,y:0,z:0});
  center.x/=vertices.length;center.y/=vertices.length;center.z/=vertices.length;
  const palette=dnaPalette(dna);
  const faces:FaceGlyph[]=poly.faces.map((face,i)=>{
   const vs=face.map(j=>vertices[j]);
   let n={x:0,y:0,z:0};
   for(let k=0;k<vs.length;k++){
    const a=vs[k],b=vs[(k+1)%vs.length];
    n.x+=(a.y-b.y)*(a.z+b.z);
    n.y+=(a.z-b.z)*(a.x+b.x);
    n.z+=(a.x-b.x)*(a.y+b.y);
   }
   const fc=vs.reduce((sum,p)=>({x:sum.x+p.x,y:sum.y+p.y,z:sum.z+p.z}),{x:0,y:0,z:0});
   fc.x/=vs.length;fc.y/=vs.length;fc.z/=vs.length;
   if(n.x*(fc.x-center.x)+n.y*(fc.y-center.y)+n.z*(fc.z-center.z)<0)
    n={x:-n.x,y:-n.y,z:-n.z};
   const mag=Math.hypot(n.x,n.y,n.z)||1;
   const outward={x:n.x/mag,y:n.y/mag,z:n.z/mag};
   const light=Math.max(0,outward.x*.4+outward.y*.5+outward.z*.75);
   const shade=.54+.43*light;
   const color=paletteColor(palette,poly.faceClasses[i]??0);
   const rgb=[(color>>16)&255,(color>>8)&255,color&255].map(n=>Math.max(0,Math.min(255,Math.round(n*shade))));
   return {points:vs.map(p=>p.x.toFixed(5)+","+(-p.y).toFixed(5)).join(" "),fill:"rgb("+rgb.join(",")+")",normalZ:outward.z,depth:fc.z};
  }).filter(f=>f.normalZ>1e-5).sort((a,b)=>a.depth-b.depth);
  const model={dna,faces,vertices:poly.vertices.length,facets:poly.faces.length};
  CACHE.set(dna,model);
  return model;
 }catch(e){return {dna,faces:[],vertices:0,facets:0,warning:String(e)};}
}
export type GlyphProps={dna:string;x:number;y:number;size?:number;opacity?:number;outline?:string};
export const PolytronGlyph=memo(function PolytronGlyph({dna,x,y,size=22,opacity=1,outline="#d7edfa"}:GlyphProps){
 const model=glyphModel(dna);
 return <g transform={"translate("+x+" "+y+") scale("+size+")"} opacity={opacity} aria-label={"Poliedro "+dna} role="img">
  {model.faces.length?model.faces.map((f,i)=><polygon key={i} points={f.points} fill={f.fill} stroke={outline} strokeOpacity=".58" strokeWidth=".035" strokeLinejoin="round"/>):
   <circle r="0.8" fill="#647a8f" stroke="#d0e4f3" strokeWidth=".1"/>}
 </g>;
});
