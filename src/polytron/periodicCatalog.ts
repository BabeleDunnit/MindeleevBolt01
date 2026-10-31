/**
 * Progressive periodic catalog: identity is always the Conway recipe, while
 * geometric equality does NOT depend on the availability of ShapeDNA v2.
 *
 * Polygon spectral FEM is optional metadata. Every generated mesh within a
 * documented resource budget is indexed geometrically, including >80 vertices
 * and meshes excluded from the 3D rendering budget.
 *
 * If a recipe is too costly, the cell stays numbered and marked INCOMPLETE.
 * Later cells also disclose outstanding unprocessed predecessors; they are
 * never silently presented as exhaustive negatives.
 */
import {generatePoly} from "@/polyhedronisme/polyhedronisme";
import {surfaceShapeDNA,type SurfaceSpectrum} from "@/experiments/surfaceShapeDNA";
import {geometryFingerprint,plausibleSameGeometry,fullGeometrySignature,
 sameFullGeometry,type GeometryFingerprint,type FullGeometrySignature} from "@/polytron/geometryEquivalence";
import {periodicRow,type BaseSeed} from "@/polytron/politronicNumber";
import {polyFaceClasses} from "@/polytron/faceColorUsage";

export const MAX_SHAPE_VERTICES=80;
export const MAX_DRAW_FACES=1000;
export const MAX_CATALOG_ROWS=2000;
export const MAX_VERIFY_VERTICES=1600;
export const MAX_VERIFY_FACES=9000;
const MAX_ESTIMATED_FACES=18000;
export type PeriodicEntry={
 number:number;row:number;col:number;seed:BaseSeed;ops:string;dna:string;
 status:"ready"|"too-complex"|"invalid";
 renderable:boolean;
 vertices?:number;faces?:number;shapeDNA?:number[];
 /** Actual Polyhedronisme face-color categories; palette-independent. */
 faceClassIds?:number[];faceTypeCount?:number;
 equivalents:number[];shapeStatus:"measured"|"unmeasured";
 verification:"verified"|"incomplete";
 unresolvedPrevious:number;
 error?:string;
};
type RecordedShape={number:number;dna:string;fingerprint:GeometryFingerprint};
function maybeExpensive(ops:string,seed:BaseSeed):boolean{
 if(ops.length<3)return false;
 const factors:Record<string,number>={
  d:1.6,a:2.1,k:2.7,g:3.3,p:3.3,r:1.1,c:3.4,w:4,
  q:4,n:4,x:4,l:3,u:8,e:3,b:3,o:4,m:4,t:4,j:5,s:5
 };
 let estimate=seed==="T"?4:seed==="C"?6:seed==="O"?8:seed==="D"?12:20;
 for(const op of ops){
  estimate*=factors[op]??5;
  if(estimate>MAX_ESTIMATED_FACES)return true;
 }
 return false;
}
export class PeriodicCatalog{
 readonly entries:PeriodicEntry[]=[];
 private shapes=new Map<string,RecordedShape[]>();
 private incompleteCount=0;
 private recentSignatures=new Map<string,FullGeometrySignature>();
 private signatureFor(dna:string):FullGeometrySignature{
  const cached=this.recentSignatures.get(dna);
  if(cached){this.recentSignatures.delete(dna);this.recentSignatures.set(dna,cached);return cached;}
  const signature=fullGeometrySignature(generatePoly(dna));
  this.recentSignatures.set(dna,signature);
  // A bounded cache avoids O(N * V²) residency for large catalogs.
  if(this.recentSignatures.size>6){
   const oldest=this.recentSignatures.keys().next().value;
   if(oldest!==undefined)this.recentSignatures.delete(oldest);
  }
  return signature;
 }
 /** Always append exactly five cells in canonical row order. */
 appendRow():PeriodicEntry[]{
  if(this.entries.length>=MAX_CATALOG_ROWS*5)return [];
  const row=this.entries.length/5;
  const result=periodicRow(row).map((item,col)=>{
   const number=Number(item.number);
   const base:PeriodicEntry={number,row,col,seed:item.seed,ops:item.ops,
    dna:item.dna,equivalents:[],status:"ready",renderable:true,
    shapeStatus:"unmeasured",verification:"verified",
    unresolvedPrevious:this.incompleteCount};
   const incomplete=(reason:string,status:PeriodicEntry["status"])=>{
    base.status=status;base.verification="incomplete";
    base.error=reason;this.incompleteCount++;
    return base;
   };
   if(maybeExpensive(item.ops,item.seed)){
    base.renderable=false;
    return incomplete("Stima di complessità eccessiva: verifica geometrica non eseguita",
     "too-complex");
   }
   try{
    const poly=generatePoly(item.dna);
    base.vertices=poly.vertices.length;base.faces=poly.faces.length;
    // Count types even for meshes excluded from 3D/ShapeDNA or geometric
    // matching. The classification is supplied by the actual face painter.
    base.faceClassIds=polyFaceClasses(poly);
    base.faceTypeCount=base.faceClassIds.length;
    base.renderable=poly.faces.length<=MAX_DRAW_FACES;
    if(!base.renderable)base.status="too-complex";
    if(poly.vertices.length>MAX_VERIFY_VERTICES||poly.faces.length>MAX_VERIFY_FACES){
     return incomplete("Mesh oltre il budget di verifica geometrica ("+
      MAX_VERIFY_VERTICES+" vertici / "+MAX_VERIFY_FACES+" facce)",base.status);
    }
    const finger=geometryFingerprint(poly);
    const previous=this.shapes.get(finger.topology)??[];
    // Cheap O(V+E+F) comparison first, expensive O(V²) only for candidates.
    let currentSignature:FullGeometrySignature|undefined;
    for(const older of previous){
     if(!plausibleSameGeometry(finger,older.fingerprint))continue;
     currentSignature??=this.signatureFor(item.dna);
     if(sameFullGeometry(currentSignature,this.signatureFor(older.dna)))
      base.equivalents.push(older.number);
    }
    previous.push({number,dna:item.dna,fingerprint:finger});
    this.shapes.set(finger.topology,previous);

    // Spectral measurement is optional and never gates geometry indexing.
    if(poly.vertices.length<=MAX_SHAPE_VERTICES){
     const spec:SurfaceSpectrum|null=surfaceShapeDNA(poly,MAX_SHAPE_VERTICES,
      Math.min(12,poly.vertices.length));
     if(spec&&spec.degenerateTriangles===0&&spec.maxOffDiagonal<1e-3){
      base.shapeDNA=spec.values.map(v=>Number(v.toFixed(5)));
      base.shapeStatus="measured";
     }
    }
   }catch(err){
    base.renderable=false;
    return incomplete("Errore di generazione o verifica: "+String(err),"invalid");
   }
   return base;
  });
  this.entries.push(...result);
  return result;
 }
 appendRows(count:number){
  for(let i=0;i<count;i++)this.appendRow();
  return this.entries;
 }
 get lengthRows(){return this.entries.length/5;}
 get unresolvedCount(){return this.incompleteCount;}
}
