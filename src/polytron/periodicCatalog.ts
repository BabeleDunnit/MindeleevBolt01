/**
 * Sprint 35 Periodic Catalog. Order and identity are purely DNA based;
 * form equivalence is measured from the generated geometry, independently
 * of palette and operator strings.
 *
 * ShapeDNA v2 uses the shared cyclic-invariant polygon FEM. A match also
 * requires matching face combinatorics and a normalized geometry fingerprint:
 * unlike the spectral metric alone, we want *the same shape*, not merely a
 * similar or deformable one. Numerical equivalence remains approximate.
 */
import {generatePoly,type Poly} from "@/polyhedronisme/polyhedronisme";
import {surfaceShapeDNA,spectrumDistance,type SurfaceSpectrum} from "@/experiments/surfaceShapeDNA";
import {periodicRow,type BaseSeed} from "@/polytron/politronicNumber";
import {polyFaceClasses} from "@/polytron/faceColorUsage";

export const MAX_SHAPE_VERTICES=60;
export const MAX_DRAW_FACES=1000;
export const MAX_CATALOG_ROWS=2000;
export type PeriodicEntry={
 number:number;row:number;col:number;seed:BaseSeed;ops:string;dna:string;
 status:"ready"|"too-complex"|"invalid";
 vertices?:number;faces?:number;shapeDNA?:number[];
 /** Polygon face categories used by Polyhedronisme's face-color renderer. */
 faceClassIds?:number[];faceTypeCount?:number;
 equivalents:number[];shapeStatus:"measured"|"unmeasured";
 error?:string;
};
type RecordedShape={
 number:number; spectrum:SurfaceSpectrum;
 distances:number[];topology:string;
};
const normalizedDistances=(poly:Poly)=>{
 const d:number[]=[];
 let sum=0;
 const v=poly.vertices;
 for(let i=0;i<v.length;i++)for(let j=i+1;j<v.length;j++){
  const dx=v[i][0]-v[j][0],dy=v[i][1]-v[j][1],dz=v[i][2]-v[j][2];
  const x=dx*dx+dy*dy+dz*dz;
  d.push(x);sum+=x;
 }
 const average=sum/Math.max(1,d.length);
 return d.map(x=>x/Math.max(1e-12,average)).sort((a,b)=>a-b);
};
const rms=(a:number[],b:number[])=>{
 if(a.length!==b.length)return Infinity;
 let sum=0;
 for(let i=0;i<a.length;i++)sum+=(a[i]-b[i])**2;
 return Math.sqrt(sum/Math.max(1,a.length));
};
function topologyBucket(poly:Poly):string{
 const faces=poly.faces.map(f=>f.length).sort((a,b)=>a-b);
 return poly.vertices.length+":"+poly.faces.length+":"+faces.join(",");
}
/** Conservative cost guard for long Conway programs; preserves empty cells. */
function maybeExpensive(ops:string,seed:BaseSeed):boolean{
 // Generates at most a few thousand faces in most cases, not an ironclad
 // bound. Guard especially expensive 3+ operator chains proactively.
 if(ops.length<3)return false;
 const weights:Record<string,number>={
  d:1.6,a:2.1,k:2.7,g:3.3,p:3.3,r:1.1,c:3.4,w:4,
  q:4,n:4,x:4,l:3,u:8,e:3,b:3,o:4,m:4,t:4,j:5,s:5
 };
 let estimate=seed==="T"?4:seed==="C"?6:seed==="O"?8:seed==="D"?12:20;
 for(const op of ops)estimate*=weights[op]??5;
 return estimate>900;
}
export class PeriodicCatalog{
 readonly entries:PeriodicEntry[]=[];
 private shapeBuckets=new Map<string,RecordedShape[]>();
 /** Each row always yields exactly five entries, even on a geometry failure. */
 appendRow():PeriodicEntry[]{
  if(this.entries.length>=MAX_CATALOG_ROWS*5)return [];
  const row=this.entries.length/5;
  const result=periodicRow(row).map((item,col)=>{
   const number=Number(item.number);
   const base:PeriodicEntry={number,row,col,seed:item.seed,ops:item.ops,dna:item.dna,
    equivalents:[],status:"ready",shapeStatus:"unmeasured"};
   if(maybeExpensive(item.ops,item.seed)){
    base.status="too-complex";
    base.error="Ricetta troppo complessa per il calcolo interattivo";
    return base;
   }
   try{
    const poly=generatePoly(item.dna);
    base.vertices=poly.vertices.length;base.faces=poly.faces.length;
    // Compute even when the mesh exceeds the viewer's drawing/ShapeDNA
    // budget. The value is intrinsic to geometry and never to a palette.
    base.faceClassIds=polyFaceClasses(poly);
    base.faceTypeCount=base.faceClassIds.length;
    if(poly.faces.length>MAX_DRAW_FACES){
     base.status="too-complex";
     base.error="Mesh oltre "+MAX_DRAW_FACES+" facce (limite grafico)";
     return base;
    }
    if(poly.vertices.length<=MAX_SHAPE_VERTICES){
     const spec=surfaceShapeDNA(poly,MAX_SHAPE_VERTICES,Math.min(12,poly.vertices.length));
     if(spec&&spec.degenerateTriangles===0&&spec.maxOffDiagonal<1e-3){
      base.shapeDNA=spec.values.map(v=>Number(v.toFixed(5)));
      base.shapeStatus="measured";
      const topology=topologyBucket(poly),fingerprint=normalizedDistances(poly);
      const previous=this.shapeBuckets.get(topology)??[];
      for(const older of previous){
       const spectralDistance=spectrumDistance(spec,older.spectrum);
       const geometryDistance=rms(fingerprint,older.distances);
       // Both independent signals must now agree: never bypass the corrected
       // ShapeDNA on the basis of geometry alone. This tolerance accommodates
       // Polyhedronisme's rounded Platonic seed coordinates.
       if(geometryDistance<.002&&Number.isFinite(spectralDistance)&&
         spectralDistance<.002)base.equivalents.push(older.number);
      }
      previous.push({number,spectrum:spec,distances:fingerprint,topology});
      this.shapeBuckets.set(topology,previous);
     }
    }
   }catch(e){
    base.status="invalid";
    base.error=String(e);
   }
   return base;
  });
  this.entries.push(...result);
  return result;
 }
 appendRows(n:number){
  for(let i=0;i<n;i++)this.appendRow();
  return this.entries;
 }
 get lengthRows(){return this.entries.length/5;}
}
