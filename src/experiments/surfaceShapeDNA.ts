/**
 * Mindeleev ShapeDNA v2 — rotation/scale/face-order-invariant polygon FEM.
 *
 * Build the cotangent stiffness of a triangulation from each polygon centroid,
 * but ELIMINATE every virtual centroid analytically as a barycentric combination
 * of its actual face vertices. Assemble a projected stiffness (K) and a
 * consistently lumped area mass (M) directly on the original vertices.
 *
 * Unlike fan triangulation from face[0], cyclically reindexing a polygon's
 * vertices or reversing its winding cannot alter the discretization.
 * The virtual vertex has no independent DOF and therefore no extra eigenmodes.
 *
 * This is our *own polygon-surface spectral approximation*, not the original
 * Shape-DNA solver or the optimized polygon Laplacian of Bunge et al.
 * The spectral fingerprint is a useful similarity descriptor, NOT a proof of
 * geometric identity. For the periodic table, confirm it with geometry too.
 *
 * All distances, cotangents and masses are computed from the actual mesh
 * geometry; no DNA tokens or palette information enter this function.
 */
import type {Poly,Vec3} from "@/polyhedronisme/polyhedronisme";

const EPS=1e-12;
const minus=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a:Vec3,b:Vec3):number=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:Vec3,b:Vec3):Vec3=>[
 a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]
];
const len=(v:Vec3):number=>Math.hypot(v[0],v[1],v[2]);

export type SurfaceSpectrum={
 values:number[];area:number;vertices:number;triangles:number;
 degenerateTriangles:number;maxOffDiagonal:number;
 method:"cotangent-polygon-centroid-projected";normalized:true;
};

/** Stable symmetric Jacobi diagonalization with the usual off-diagonal check. */
function symmetricEigenvalues(input:number[][],maxSweeps=48){
 const n=input.length,a=input.map(row=>[...row]);
 let last=Infinity;
 for(let sweep=0;sweep<maxSweeps;sweep++){
  let maxOff=0;
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
   const off=a[i][j];maxOff=Math.max(maxOff,Math.abs(off));
   if(Math.abs(off)<1e-11)continue;
   const tau=(a[j][j]-a[i][i])/(2*off);
   const t=(tau>=0?1:-1)/(Math.abs(tau)+Math.sqrt(1+tau*tau));
   const c=1/Math.sqrt(1+t*t),s=t*c;
   const app=a[i][i],aqq=a[j][j];
   a[i][i]=app-t*off;a[j][j]=aqq+t*off;
   a[i][j]=a[j][i]=0;
   for(let k=0;k<n;k++)if(k!==i&&k!==j){
    const aik=a[k][i],akj=a[k][j];
    a[k][i]=a[i][k]=c*aik-s*akj;
    a[k][j]=a[j][k]=s*aik+c*y; // PLACEHOLDER
   }
  }
  last=maxOff;
  if(last<1e-9)break;
 }
 return {eigenvalues:a.map((row,i)=>row[i]).sort((x,y)=>x-y),maxOffDiagonal:last};
}

/**
 * The virtual centroid of a polygon with m vertices has interpolation weights
 * 1/m on its vertices. A cotangent edge (u,v) contributes
 * w * (phi(u)-phi(v)) (phi(u)-phi(v))^T to K.
 *
 * For a physical vertex, phi(i) is the Kronecker basis vector e_i.
 * For a virtual vertex, phi(c) is the face's equally weighted basis.
 */
export function surfaceShapeDNA(poly:Poly,limit=80,count=12):SurfaceSpectrum|null{
 const n=poly.vertices.length;
 if(n<4||n>limit)return null;
 const K:number[][]=Array.from({length:n},()=>new Array<number>(n).fill(0));
 const M=new Array<number>(n).fill(0);
 let totalArea=0,triangles=0,degenerateTriangles=0;

 for(const face of poly.faces){
  const size=face.length;
  if(size<3||new Set(face).size!==size||
   face.some(i=>!Number.isInteger(i)||i<0||i>=n))return null;
  const centroid:Vec3=[0,0,0];
  for(const id of face){
   const v=poly.vertices[id];
   centroid[0]+=v[0]/size;centroid[1]+=v[1]/size;centroid[2]+=v[2]/size;
  }
  const centerWeight=1/size;
  const virtual=n;
  const basis=(id:number):Array<[number,number]>=>id===virtual?
   face.map(vertex=>[vertex,centerWeight]):[[id,1]];

  const connect=(u:number,v:number,weight:number)=>{
   if(!Number.isFinite(weight))return;
   const delta=new Map<number,number>();
   for(const [id,w] of basis(u))delta.set(id,(delta.get(id)??0)+w);
   for(const [id,w] of basis(v))delta.set(id,(delta.get(id)??0)-w);
   for(const [i,wi] of delta)for(const [j,wj] of delta)
    K[i][j]+=weight*wi*wj;
  };

  for(let j=0;j<size;j++){
   const ia=face[j],ib=face[(j+1)%size];
   const a=poly.vertices[ia],b=poly.vertices[ib],c=centroid;
   const u=minus(b,a),v=minus(c,a);
   const area2=len(cross(u,v));
   if(area2<EPS){degenerateTriangles++;continue;}
   const area=area2/2;
   totalArea+=area;triangles++;

   // Lump each triangle's area/3 on each of its 3 vertices.
   // The virtual centroid's mass is split equally over face vertices.
   M[ia]+=area/3;M[ib]+=area/3;
   for(const id of face)M[id]+=area/(3*size);

   const cotA=dot(minus(b,a),minus(c,a))/area2;
   const cotB=dot(minus(a,b),minus(c,b))/area2;
   const cotC=dot(minus(a,c),minus(b,c))/area2;
   connect(ib,virtual,cotA/2);
   connect(ia,virtual,cotB/2);
   connect(ia,ib,cotC/2);
  }
 }

 if(totalArea<EPS||M.some(m=>m<EPS||!Number.isFinite(m)))return null;
 const B:number[][]=K.map((row,i)=>row.map((val,j)=>val/Math.sqrt(M[i]*M[j])));
 const eigen=symmetricEigenvalues(B);
 if(!Number.isFinite(eigen.maxOffDiagonal)||eigen.maxOffDiagonal>1e-3)return null;
 // Surface eigenvalues scale as inverse length². Multiplying by area
 // cancels global uniform scaling (the shape, not its physical size).
 const values=eigen.eigenvalues.slice(0,Math.max(2,count)).map(v=>Math.max(0,v)*totalArea);
 if(values.some(v=>!Number.isFinite(v)))return null;
 return {values,area:totalArea,vertices:n,triangles,
  degenerateTriangles,maxOffDiagonal:eigen.maxOffDiagonal,
  method:"cotangent-polygon-centroid-projected",normalized:true};
}

/** Proximity, not an equivalence proof: compare positive normalized modes. */
export function spectrumDistance(a:SurfaceSpectrum,b:SurfaceSpectrum):number{
 const count=Math.min(a.values.length,b.values.length);
 if(count<2)return NaN;
 let sum=0,used=0;
 for(let i=1;i<count;i++){
  const x=a.values[i],y=b.values[i];
  if(x<=1e-8||y<=1e-8)continue;
  sum+=Math.log(x/y)**2;used++;
 }
 return used?Math.sqrt(sum/used):NaN;
}
