/**
 * Phenotype Lab: measurements and a conservative *proxy* scattering model.
 * The inputs are the explicit geometric vertices/faces returned by polyhedronisme.
 * No DNA operator letters, seed name or palette enter the formulas.
 *
 * Caution: this is NOT real electromagnetic optics or a surface Laplace-Beltrami solver.
 * The angular response is a reproducible geometric hypothesis to falsify.
 */
import {dnaToPoly} from "@/polytron/polytron";
import {edgesOf,type Poly,type Vec3} from "@/polyhedronisme/polyhedronisme";

export type Feature={normal:Vec3;area:number;centroid:Vec3;sideCount:number};
export type Phenotype={
  dna:string;poly:Poly;vertices:number;edges:number;faces:number;euler:number;
  closed:boolean;edgeIncidenceHistogram:Record<number,number>;
  faceSides:Record<number,number>;vertexDegrees:Record<number,number>;
  avgEdge:number;edgeVariation:number;areaVariation:number;
  area:number;volume:number;volumeReliable:boolean;
  principalMoments:[number,number,number];
  graphSpectrum:number[]|null;shapeKey:string;features:Feature[];
};
export type Scatter={
  bins:number[];directions:number[];absorbed:number;outgoing:number;incoming:number;
  path:number[][];dominant:{angle:number;fraction:number}[];
};
const EPS=1e-12;
const add=(a:Vec3,b:Vec3):Vec3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const scale=(a:Vec3,t:number):Vec3=>[a[0]*t,a[1]*t,a[2]*t];
const dot=(a:Vec3,b:Vec3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=(a:Vec3)=>Math.sqrt(dot(a,a));
const unit=(a:Vec3)=>scale(a,1/Math.max(EPS,norm(a)));
const means=(nums:number[])=>nums.reduce((a,b)=>a+b,0)/Math.max(1,nums.length);
const cv=(nums:number[])=>{const mu=means(nums);return Math.sqrt(means(nums.map(n=>(n-mu)**2)))/Math.max(EPS,Math.abs(mu));};
const edgeKey=(a:number,b:number)=>a<b?a+":"+b:b+":"+a;
const sortedHistogram=(m:Record<number,number>)=>Object.entries(m).sort((a,b)=>Number(a[0])-Number(b[0])).map(([k,v])=>k+"×"+v).join(",");

export function faceFeatures(poly:Poly):Feature[]{
 const origin=scale(poly.vertices.reduce(add,[0,0,0] as Vec3),1/Math.max(1,poly.vertices.length));
 return poly.faces.map(face=>{
  const verts=face.map(i=>poly.vertices[i]);
  let areaVector:Vec3=[0,0,0],centroid:Vec3=[0,0,0];
  for(let i=0;i<verts.length;i++){
   areaVector=add(areaVector,cross(verts[i],verts[(i+1)%verts.length]));
   centroid=add(centroid,verts[i]);
  }
  centroid=scale(centroid,1/verts.length);
  // Original polygon winding is preferred; flip only for a clearly inward normal.
  let normal=unit(areaVector);
  if(dot(normal,sub(centroid,origin)) < -1e-7)normal=scale(normal,-1);
  return {normal,area:norm(areaVector)/2,centroid,sideCount:face.length};
 });
}
function eigenSym3(input:number[][]):[number,number,number]{
 const a=input.map(row=>[...row]);
 for(let iteration=0;iteration<64;iteration++){
  let p=0,q=1;
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)
   if(Math.abs(a[i][j])>Math.abs(a[p][q])){p=i;q=j;}
  if(Math.abs(a[p][q])<1e-12)break;
  const phi=.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]);
  const c=Math.cos(phi),s=Math.sin(phi);
  // orthogonal similarity: J^T A J
  const app=a[p][p],aqq=a[q][q],apq=a[p][q];
  a[p][p]=c*c*app-2*s*c*apq+s*s*aqq;
  a[q][q]=s*s*app+2*s*c*apq+c*c*aqq;
  a[p][q]=0;a[q][p]=0;
  for(let k=0;k<3;k++)if(k!==p&&k!==q){
    const x=a[k][p],y=a[k][q];
    a[k][p]=a[p][k]=c*x-s*y;
    a[k][q]=a[q][k]=s*x+c*y;
  }
 }
 return [a[0][0],a[1][1],a[2][2]].sort((x,y)=>x-y) as [number,number,number];
}
function graphEigen(poly:Poly,edges:Array<[number,number]>):number[]|null{
 const n=poly.vertices.length;
 if(n<3||n>90)return null;
 const d=new Array<number>(n).fill(0);
 for(const [a,b] of edges){d[a]++;d[b]++;}
 const L:number[][]=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));
 for(const [a,b] of edges){const w=-1/Math.sqrt(Math.max(1,d[a]*d[b]));L[a][b]=w;L[b][a]=w;}
 // Symmetric Jacobi, finite tolerance. Graph spectrum, NOT the surface Laplace-Beltrami spectrum.
 // Cyclic Jacobi sweeps: O(n^3) per sweep, unlike repeated global max search.
 for(let sweep=0;sweep<22;sweep++){
  let peak=0;
  for(let p=0;p<n;p++)for(let q=p+1;q<n;q++){
   const off=L[p][q];
   peak=Math.max(peak,Math.abs(off));
   if(Math.abs(off)<1e-10)continue;
   const angle=.5*Math.atan2(2*off,L[q][q]-L[p][p]);
   const c=Math.cos(angle),t=Math.sin(angle),app=L[p][p],aqq=L[q][q];
   L[p][p]=c*c*app-2*t*c*off+t*t*aqq;
   L[q][q]=t*t*app+2*t*c*off+c*c*aqq;
   L[p][q]=L[q][p]=0;
   for(let k=0;k<n;k++)if(k!==p&&k!==q){
    const x=L[k][p],y=L[k][q];L[k][p]=L[p][k]=c*x-t*y;L[k][q]=L[q][k]=t*x+c*y;
   }
  }
  if(peak<1e-8)break;
 }
 return L.map((row,i)=>Math.max(0,row[i])).sort((a,b)=>a-b).slice(0,12);
}
export function measurePoly(dna:string,withSpectrum=false):Phenotype{
 const poly=dnaToPoly(dna);
 if(poly.vertices.length>10000||poly.faces.length>15000)throw new Error("Geometria troppo complessa per il laboratorio.");
 const features=faceFeatures(poly),edges=edgesOf(poly),v=poly.vertices.length;
 const inc=new Map<string,number>(),degrees=new Array<number>(v).fill(0);
 const sides:Record<number,number>={},valences:Record<number,number>={};
 for(const face of poly.faces){
  sides[face.length]=(sides[face.length]??0)+1;
  for(let i=0;i<face.length;i++){
   const key=edgeKey(face[i],face[(i+1)%face.length]);inc.set(key,(inc.get(key)??0)+1);
  }
 }
 const edgeHistogram:Record<number,number>={};
 for(const value of inc.values())edgeHistogram[value]=(edgeHistogram[value]??0)+1;
 for(const [a,b] of edges){degrees[a]++;degrees[b]++;}
 for(const degree of degrees)valences[degree]=(valences[degree]??0)+1;
 const center=scale(poly.vertices.reduce(add,[0,0,0] as Vec3),1/Math.max(1,v));
 const cloud=poly.vertices.map(x=>sub(x,center));
 const inertia=Array.from({length:3},()=>[0,0,0]);
 for(const x of cloud)for(let i=0;i<3;i++)for(let j=0;j<3;j++)inertia[i][j]+=x[i]*x[j]/v;
 const volume=features.reduce((sum,f)=>sum+f.area*dot(f.centroid,f.normal)/3,0);
 const length=edges.map(([a,b])=>norm(sub(poly.vertices[a],poly.vertices[b])));
 const area=features.reduce((sum,f)=>sum+f.area,0);
 const closed=inc.size===edges.length&&[...inc.values()].every(k=>k===2);
 return {dna,poly,vertices:v,edges:edges.length,faces:poly.faces.length,euler:v-edges.length+poly.faces.length,
  closed,edgeIncidenceHistogram:edgeHistogram,faceSides:sides,vertexDegrees:valences,
  avgEdge:means(length),edgeVariation:cv(length),areaVariation:cv(features.map(f=>f.area)),
  area,volume:Math.abs(volume),volumeReliable:closed,principalMoments:eigenSym3(inertia),
  graphSpectrum:withSpectrum?graphEigen(poly,edges):null,
  shapeKey:sortedHistogram(sides)+"|"+sortedHistogram(valences)+"|"+v+"/"+edges.length+"/"+poly.faces.length,
  features
 };
}
const circle=(a:number)=>((a%(2*Math.PI))+2*Math.PI)%(2*Math.PI);
export function scatter(phenotype:Phenotype,incidentDeg:number,orientationDeg:number,binCount=72):Scatter{
 const angleIn=incidentDeg*Math.PI/180,rot=orientationDeg*Math.PI/180;
 const incoming:[number,number]=[Math.cos(angleIn),Math.sin(angleIn)];
 const bins=new Array<number>(binCount).fill(0);
 let all=0;
 // A deliberately simple proxy: projected face normals act as diffuse directional reflectors.
 // Absorption is zero. Every weighted contribution is normalized to exactly one incoming unit.
 for(const face of phenotype.features){
  const nx=face.normal[0]*Math.cos(rot)-face.normal[1]*Math.sin(rot);
  const ny=face.normal[0]*Math.sin(rot)+face.normal[1]*Math.cos(rot);
  const projected=Math.hypot(nx,ny);
  if(projected<1e-6||face.area<EPS)continue;
  const fx=nx/projected,fy=ny/projected;
  const incidence=Math.max(0,-(incoming[0]*fx+incoming[1]*fy));
  const weight=face.area*projected*incidence;
  if(weight<1e-9)continue;
  const reflection=[incoming[0]-2*(incoming[0]*fx+incoming[1]*fy)*fx,incoming[1]-2*(incoming[0]*fx+incoming[1]*fy)*fy];
  const theta=circle(Math.atan2(reflection[1],reflection[0]));
  const index=theta/(2*Math.PI)*binCount;
  const lo=Math.floor(index)%binCount,frac=index-Math.floor(index);
  bins[lo]+=weight*(1-frac);bins[(lo+1)%binCount]+=weight*frac;all+=weight;
 }
 if(all<EPS){
  const idx=Math.floor(circle(angleIn)/(2*Math.PI)*binCount)%binCount;bins[idx]=1;all=1;
 }
 for(let j=0;j<binCount;j++)bins[j]/=all;
 const directions=bins.map((_,j)=>j*2*Math.PI/binCount);
 const dominant=bins.map((fraction,j)=>({angle:directions[j],fraction})).sort((a,b)=>b.fraction-a.fraction).slice(0,5);
 return {incoming:1,outgoing:bins.reduce((x,y)=>x+y,0),absorbed:0,bins,directions,
  path:bins.map((fraction,j)=>[j,fraction]),dominant};
}
// A rotation invariant comparison of measured, unlabeled combinatorial *features*.
// Equality does not prove graph isomorphism or geometric congruence.
export function histogramDistance(a:Phenotype,b:Phenotype):number{
 const hist=(x:Record<number,number>,y:Record<number,number>)=>{
  const keys=new Set([...Object.keys(x),...Object.keys(y)]);
  return [...keys].reduce((sum,key)=>sum+Math.abs((x[Number(key)]||0)/a.vertices-(y[Number(key)]||0)/b.vertices),0);
 };
 return hist(a.vertexDegrees,b.vertexDegrees)+hist(a.faceSides,b.faceSides)
  +Math.abs(a.edgeVariation-b.edgeVariation)+Math.abs(a.areaVariation-b.areaVariation);
}
