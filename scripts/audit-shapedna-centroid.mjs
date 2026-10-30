import {build} from "esbuild";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
const tmp=await mkdtemp(join(process.cwd(),".centroid-shape-"));
const file=join(tmp,"poly.mjs");
function jacobi(input){
 const n=input.length,a=input.map(row=>[...row]);
 for(let sweep=0;sweep<55;sweep++){
  let maximum=0;
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
   const off=a[i][j];maximum=Math.max(maximum,Math.abs(off));
   if(Math.abs(off)<1e-11)continue;
   const tau=(a[j][j]-a[i][i])/(2*off);
   const t=(tau>=0?1:-1)/(Math.abs(tau)+Math.sqrt(1+tau*tau));
   const c=1/Math.sqrt(1+t*t),s=t*c,app=a[i][i],aqq=a[j][j];
   a[i][i]=app-t*off;a[j][j]=aqq+t*off;
   a[i][j]=a[j][i]=0;
   for(let k=0;k<n;k++)if(k!==i&&k!==j){
    const aik=a[k][i],akj=a[k][j];
    a[k][i]=a[i][k]=c*aik-s*akj;
    a[k][j]=a[j][k]=s*aik+c*akj;
   }
  }
  if(maximum<1e-9)break;
 }
 return a.map((row,i)=>row[i]).sort((a,b)=>a-b);
}
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
function polygonFEM(poly){
 const n=poly.vertices.length;
 const K=Array.from({length:n},()=>new Array(n).fill(0));
 const M=new Array(n).fill(0);
 let areaTotal=0;
 for(const face of poly.faces){
  const center=[0,0,0];
  for(const id of face)for(let k=0;k<3;k++)center[k]+=poly.vertices[id][k]/face.length;
  const interpolation=(id)=>id===n?
   face.map(j=>({i:j,w:1/face.length})):[{i:id,w:1}];
  const connect=(v1,v2,weight)=>{
   const delta=new Map();
   for(const {i,w} of interpolation(v1))delta.set(i,(delta.get(i)??0)+w);
   for(const {i,w} of interpolation(v2))delta.set(i,(delta.get(i)??0)-w);
   for(const [i,wi] of delta)for(const [j,wj] of delta)
    K[i][j]+=weight*wi*wj;
  };
  for(let j=0;j<face.length;j++){
   const va=face[j],vb=face[(j+1)%face.length];
   const a=poly.vertices[va],b=poly.vertices[vb],c=center;
   const u=sub(b,a),v=sub(c,a),crossMag=Math.hypot(...cross(u,v));
   if(crossMag<1e-11)continue;
   const area=crossMag/2;areaTotal+=area;
   for(const id of [va,vb])M[id]+=area/3;
   for(const id of face)M[id]+=area/(3*face.length);
   const cotA=dot(sub(b,a),sub(c,a))/crossMag;
   const cotB=dot(sub(a,b),sub(c,b))/crossMag;
   const cotC=dot(sub(a,c),sub(b,c))/crossMag;
   connect(vb,n,cotA/2);
   connect(va,n,cotB/2);
   connect(va,vb,cotC/2);
  }
 }
 const B=K.map((row,i)=>row.map((val,j)=>val/Math.sqrt(M[i]*M[j])));
 return jacobi(B).map(v=>Math.max(0,v)*areaTotal).slice(0,12);
}
function logDist(a,b){
 let sum=0,used=0;
 for(let i=1;i<Math.min(a.length,b.length);i++){
  if(a[i]<=1e-8||b[i]<=1e-8)continue;
  sum+=Math.log(a[i]/b[i])**2;used++;
 }
 return Math.sqrt(sum/used);
}
try{
 await build({stdin:{contents:'import {generatePoly} from "./src/polyhedronisme/polyhedronisme.ts";export {generatePoly};',
  resolveDir:process.cwd(),sourcefile:"aud.ts",loader:"ts"},outfile:file,bundle:true,format:"esm",platform:"node",tsconfig:"tsconfig.app.json"});
 const {generatePoly}=await import(pathToFileURL(file).href);
 const rotation=p=>({...p,faces:p.faces.map(f=>f.slice(1).concat(f[0]))});
 const shapes=Object.fromEntries(["C","O","D","I","dC","dO","dD","dI"].map(d=>[d,generatePoly(d)]));
 const computed=Object.fromEntries(Object.entries(shapes).map(([k,v])=>[k,polygonFEM(v)]));
 for(const dna of ["D","dI","C","dO","I","dD"]){
  const p=shapes[dna],sig=computed[dna],cyc=polygonFEM(rotation(p));
  console.log("POLYGON-FEM-SPECTRUM",JSON.stringify({dna,values:sig.slice(1,7),
   cyclicLogDist:logDist(sig,cyc)}));
 }
 for(const [a,b] of [["D","dI"],["C","dO"],["I","dD"],["O","dC"]]){
  console.log("POLYGON-FEM-PAIR",JSON.stringify({a,b,logDist:logDist(computed[a],computed[b])}));
 }
}finally{await rm(tmp,{recursive:true,force:true});}
