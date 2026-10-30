/**
 * Geometric equivalence for fixed Polytron meshes (no bending or remeshing).
 *
 * ShapeDNA v2 is informative, but NOT required: the candidate prefilter and
 * the final geometry test work even for meshes too large for spectral FEM.
 *
 * Topological incidence, normalized radial/edge/face-area distributions,
 * then a rotation/translation/scale-independent pairwise distance signature.
 * A second per-vertex distance-profile multiset prevents many homometric
 * false positives that a global pairwise histogram alone might admit.
 *
 * Numerical congruence is provisional; no claim of formal graph isomorphism.
 */
import {edgesOf,type Poly} from "@/polyhedronisme/polyhedronisme";

type V3=[number,number,number];
export type GeometryFingerprint={
 topology:string;
 radii:number[];
 edges:number[];
 areas:number[];
 vertices:number;
};
export const GEOMETRY_PREFILTER_TOLERANCE=.018;
export const GEOMETRY_MATCH_TOLERANCE=.002;
const distance2=(a:V3,b:V3)=>{
 const x=a[0]-b[0],y=a[1]-b[1],z=a[2]-b[2];
 return x*x+y*y+z*z;
};
const rms=(a:ArrayLike<number>,b:ArrayLike<number>)=>{
 if(a.length!==b.length||a.length===0)return Infinity;
 let sum=0;
 for(let i=0;i<a.length;i++)sum+=(a[i]-b[i])**2;
 return Math.sqrt(sum/a.length);
};
const frequencies=(values:number[])=>{
 const map=new Map<number,number>();
 for(const n of values)map.set(n,(map.get(n)??0)+1);
 return [...map].sort((a,b)=>a[0]-b[0]).map(([n,count])=>n+":"+count).join(",");
};
export function geometryFingerprint(poly:Poly):GeometryFingerprint{
 const n=poly.vertices.length;
 if(n<4||!poly.faces.length)throw new Error("Poliedro incompleto");
 const edgeList=edgesOf(poly);
 const centroid:V3=[0,0,0];
 for(const v of poly.vertices)for(let j=0;j<3;j++)centroid[j]+=v[j]/n;
 const radial=poly.vertices.map(v=>distance2(v,centroid));
 const norm=radial.reduce((s,x)=>s+x,0)/n;
 if(!Number.isFinite(norm)||norm<1e-12)throw new Error("Geometria degenerata");
 const valences=new Array<number>(n).fill(0);
 for(const [a,b] of edgeList){
  if(a<0||a>=n||b<0||b>=n)throw new Error("Indice spigolo fuori mesh");
  valences[a]++;valences[b]++;
 }
 const incidence:Array<number[]>=Array.from({length:n},()=>[]);
 const faceAreas:number[]=[];
 for(const face of poly.faces){
  if(face.length<3)throw new Error("Faccia degenerata");
  const middle:V3=[0,0,0];
  for(const v of face){
   if(v<0||v>=n)throw new Error("Indice faccia fuori mesh");
   incidence[v].push(face.length);
   for(let j=0;j<3;j++)middle[j]+=poly.vertices[v][j]/face.length;
  }
  let area=0;
  for(let i=0;i<face.length;i++){
   const a=poly.vertices[face[i]],b=poly.vertices[face[(i+1)%face.length]];
   const x=a[0]-middle[0],y=a[1]-middle[1],z=a[2]-middle[2];
   const u=b[0]-middle[0],v=b[1]-middle[1],w=b[2]-middle[2];
   area+=.5*Math.hypot(y*w-z*v,z*u-x*w,x*v-y*u);
  }
  faceAreas.push(area/norm);
 }
 const stars=incidence.map((items,i)=>valences[i]+"/"+items.sort((a,b)=>a-b).join(".")).sort();
 return {
  topology:[n,edgeList.length,poly.faces.length,
   frequencies(poly.faces.map(f=>f.length)),frequencies(valences),
   stars.join(";")].join("#"),
  radii:radial.map(x=>x/norm).sort((a,b)=>a-b),
  edges:edgeList.map(([a,b])=>distance2(poly.vertices[a],poly.vertices[b])/norm).sort((a,b)=>a-b),
  areas:faceAreas.sort((a,b)=>a-b),
  vertices:n
 };
}
export function plausibleSameGeometry(a:GeometryFingerprint,b:GeometryFingerprint):boolean{
 return a.topology===b.topology &&
  rms(a.radii,b.radii)<GEOMETRY_PREFILTER_TOLERANCE &&
  rms(a.edges,b.edges)<GEOMETRY_PREFILTER_TOLERANCE &&
  rms(a.areas,b.areas)<GEOMETRY_PREFILTER_TOLERANCE;
}
export type FullGeometrySignature={
 pairwise:Float64Array;
 vertexProfiles:Float64Array[];
};
export function fullGeometrySignature(poly:Poly):FullGeometrySignature{
 const n=poly.vertices.length,total=n*(n-1)/2;
 const pairs=new Float64Array(total),profiles:Array<number[]>=Array.from({length:n},()=>[]);
 let index=0,sum=0;
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
  const d=distance2(poly.vertices[i],poly.vertices[j]);
  pairs[index++]=d;sum+=d;
  profiles[i].push(d);profiles[j].push(d);
 }
 const avg=sum/Math.max(1,total);
 if(avg<1e-12||!Number.isFinite(avg))throw new Error("Geometria collassata");
 for(let i=0;i<pairs.length;i++)pairs[i]/=avg;
 pairs.sort();
 const vertexProfiles=profiles.map(dist=>{
  const a=Float64Array.from(dist.map(d=>d/avg));
  a.sort();return a;
 }).sort((a,b)=>{
  // Stable lexicographic ordering of each vertex's distance spectrum.
  for(let k=0;k<a.length;k++)if(Math.abs(a[k]-b[k])>1e-12)return a[k]-b[k];
  return 0;
 });
 return {pairwise:pairs,vertexProfiles};
}
export function sameFullGeometry(a:FullGeometrySignature,b:FullGeometrySignature):boolean{
 if(rms(a.pairwise,b.pairwise)>=GEOMETRY_MATCH_TOLERANCE)return false;
 if(a.vertexProfiles.length!==b.vertexProfiles.length)return false;
 let sum=0,n=0;
 for(let i=0;i<a.vertexProfiles.length;i++){
  const one=a.vertexProfiles[i],two=b.vertexProfiles[i];
  if(one.length!==two.length)return false;
  for(let j=0;j<one.length;j++){
   sum+=(one[j]-two[j])**2;n++;
  }
 }
 return Math.sqrt(sum/Math.max(1,n))<GEOMETRY_MATCH_TOLERANCE;
}
