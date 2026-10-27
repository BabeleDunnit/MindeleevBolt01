/**
 * Research implementation: a triangular-surface FEM approximation to Shape-DNA.
 * Source: a real polyhedron mesh, never its DNA tokens or palette.
 *
 * Cotangent stiffness K and (lumped) surface area mass M.
 * Solve Kf = lambda M f by diagonalizing M^-1/2 K M^-1/2.
 *
 * This is an approximation to Laplace-Beltrami spectra, NOT the continuous
 * spectral solution or the polygon Laplacian of Bunge et al. Polygons are
 * triangulated as fans, and non-planar / concave faces need a better method.
 */
import type {Poly,Vec3} from "@/polyhedronisme/polyhedronisme";

const EPS=1e-12;
const minus=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a:Vec3,b:Vec3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const len=(v:Vec3)=>Math.hypot(...v);

export type SurfaceSpectrum={
 values:number[];area:number;vertices:number;triangles:number;
 degenerateTriangles:number;maxOffDiagonal:number;
 method:"cotangent-fem-lumped";normalized:true;
};

/** Eigenvalues of a real symmetric matrix via cyclic Jacobi sweeps. */
function symmetricEigenvalues(input:number[][],maxSweeps=32){
 const n=input.length, a=input.map(row=>[...row]);
 let last=Infinity;
 for(let sweep=0;sweep<maxSweeps;sweep++){
  let maxOff=0;
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
   const off=a[i][j];maxOff=Math.max(maxOff,Math.abs(off));
   if(Math.abs(off)<1e-11)continue;
   // stable tan(2theta) Jacobi implementation, compatible with row/column updates
   const tau=(a[j][j]-a[i][i])/(2*off);
   const t=(tau>=0?1:-1)/(Math.abs(tau)+Math.sqrt(1+tau*tau));
   const c=1/Math.sqrt(1+t*t),s=t*c;
   const app=a[i][i],aqq=a[j][j];
   a[i][i]=app-t*off;a[j][j]=aqq+t*off;
   a[i][j]=a[j][i]=0;
   for(let k=0;k<n;k++)if(k!==i&&k!==j){
    const aik=a[k][i],akj=a[k][j];
    a[k][i]=a[i][k]=c*aik-s*akj;
    a[k][j]=a[j][k]=s*aik+c*akj;
   }
  }
  last=maxOff;
  if(last<1e-9)break;
 }
 return {eigenvalues:a.map((row,i)=>row[i]).sort((x,y)=>x-y),maxOffDiagonal:last};
}
export function surfaceShapeDNA(poly:Poly,limit=80,count=12):SurfaceSpectrum|null{
 const n=poly.vertices.length;
 if(n<4||n>limit)return null;
 const K:number[][]=Array.from({length:n},()=>new Array<number>(n).fill(0));
 const M=new Array<number>(n).fill(0);
 let totalArea=0,triangles=0,degenerateTriangles=0;
 const connect=(i:number,j:number,weight:number)=>{
   if(i===j)return;
   K[i][i]+=weight;K[j][j]+=weight;
   K[i][j]-=weight;K[j][i]-=weight;
 };
 for(const face of poly.faces){
  if(face.length<3)continue;
  // Fan triangulation is a documented numerical approximation for polygons.
  for(let j=1;j+1<face.length;j++){
   const ids=[face[0],face[j],face[j+1]];
   const [a,b,c]=ids.map(i=>poly.vertices[i]);
   const u=minus(b,a),v=minus(c,a),crossMag=len(cross(u,v));
   if(crossMag<EPS){degenerateTriangles++;continue;}
   const area=crossMag/2;totalArea+=area;triangles++;
   for(const id of ids)M[id]+=area/3;
   // w_ij = 0.5 cot(angle opposite edge ij)
   const cotAtA=dot(minus(b,a),minus(c,a))/crossMag;
   const cotAtB=dot(minus(a,b),minus(c,b))/crossMag;
   const cotAtC=dot(minus(a,c),minus(b,c))/crossMag;
   connect(ids[1],ids[2],cotAtA/2);
   connect(ids[0],ids[2],cotAtB/2);
   connect(ids[0],ids[1],cotAtC/2);
  }
 }
 if(totalArea<EPS||M.some(v=>v<EPS))return null;
 const B:number[][]=K.map((row,i)=>row.map((value,j)=>value/Math.sqrt(M[i]*M[j])));
 const spectrum=symmetricEigenvalues(B);
 // lambda ~ 1 / length²; multiply by area to remove uniform scaling.
 const values=spectrum.eigenvalues.slice(0,count).map(x=>Math.max(0,x)*totalArea);
 return {
  values,area:totalArea,vertices:n,triangles,degenerateTriangles,
  maxOffDiagonal:spectrum.maxOffDiagonal,
  method:"cotangent-fem-lumped",normalized:true
 };
}
export function spectrumDistance(a:SurfaceSpectrum,b:SurfaceSpectrum):number{
 const n=Math.min(a.values.length,b.values.length);
 if(n<2)return NaN;
 // First eigenvalue is theoretically zero; compare positive modes in log-space.
 let sum=0,used=0;
 for(let i=1;i<n;i++){
  const x=a.values[i],y=b.values[i];
  if(x<=1e-8||y<=1e-8)continue;
  sum+=Math.log(x/y)**2;used++;
 }
 return used?Math.sqrt(sum/used):NaN;
}
