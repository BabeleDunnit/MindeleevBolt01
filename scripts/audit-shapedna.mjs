import {build} from "esbuild";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
const tmp=await mkdtemp(join(process.cwd(),".shape-audit-"));
const outfile=join(tmp,"all.mjs");
function distances(p){
 const d=[];
 for(let i=0;i<p.vertices.length;i++)for(let j=i+1;j<p.vertices.length;j++)
  d.push(p.vertices[i].reduce((s,v,k)=>s+(v-p.vertices[j][k])**2,0));
 const avg=d.reduce((a,b)=>a+b,0)/d.length;
 return d.map(v=>v/avg).sort((a,b)=>a-b);
}
function rms(a,b){if(a.length!==b.length)return NaN;
 return Math.sqrt(a.reduce((s,x,i)=>s+(x-b[i])**2,0)/a.length);}
const rotateFaces=p=>({...p,faces:p.faces.map(f=>f.slice(1).concat(f[0]))});
const reverseFaceOrder=p=>({...p,faces:p.faces.map(f=>[...f].reverse())});
try{
 await build({stdin:{contents:`
  import {generatePoly} from "./src/polyhedronisme/polyhedronisme.ts";
  import {surfaceShapeDNA,spectrumDistance} from "./src/experiments/surfaceShapeDNA.ts";
  export {generatePoly,surfaceShapeDNA,spectrumDistance};`,
  resolveDir:process.cwd(),sourcefile:"diag-entry.ts",loader:"ts"},
  outfile,bundle:true,platform:"node",format:"esm",
  tsconfig:"tsconfig.app.json",logLevel:"warning"});
 const {generatePoly,surfaceShapeDNA,spectrumDistance}=await import(pathToFileURL(outfile).href);
 const shapes=Object.fromEntries(["T","C","O","D","I","dT","dC","dO","dD","dI"].map(dna=>[dna,generatePoly(dna)]));
 const stats={};
 for(const [dna,p] of Object.entries(shapes)){
  const spec=surfaceShapeDNA(p,80,12);
  const cyc=surfaceShapeDNA(rotateFaces(p),80,12);
  const rev=surfaceShapeDNA(reverseFaceOrder(p),80,12);
  const range=spec.values.map((v,i)=>Number(v.toFixed(6)));
  stats[dna]={V:p.vertices.length,F:p.faces.length,
    area:spec.area,triangles:spec.triangles,
    maxOff:spec.maxOffDiagonal,firstSix:range.slice(1,7),
    shiftedSix:cyc.values.slice(1,7).map(v=>Number(v.toFixed(6))),
    flipDistance:spectrumDistance(spec,rev),
    cyclicDistance:spectrumDistance(spec,cyc),
    sameGeometryRMS:rms(distances(p),distances(rotateFaces(p)))};
 }
 console.log("SHAPEDNA-AUDIT-DETAIL",JSON.stringify(stats));
 for(const [a,b] of [["D","dI"],["I","dD"],["C","dO"],["O","dC"],
  ["D","I"],["T","dT"],["D","D"]]){
  const p=shapes[a],q=shapes[b],one=surfaceShapeDNA(p,80,12),two=surfaceShapeDNA(q,80,12);
  const distance=rms(distances(p),distances(q));
  const sp=spectrumDistance(one,two);
  console.log("SHAPEDNA-AUDIT-PAIR",JSON.stringify({a,b,euclideanPairwiseRMS:distance,
   shapeDNALogDistance:sp,
   spectraA:one.values.slice(1,7).map(v=>Number(v.toFixed(5))),
   spectraB:two.values.slice(1,7).map(v=>Number(v.toFixed(5))),
   oldMatcher:distance<.002&&(sp<.002||distance<.0003)}));
 }
 // Idempotent test: cyclic start-point rotation of polygon changes no physical
 // surface whatsoever, but current algorithm may assign different spectra.
 const d=shapes.D;
 const sp=surfaceShapeDNA(d,80,12),rot=surfaceShapeDNA(rotateFaces(d),80,12);
 if(spectrumDistance(sp,rot)<1e-8)console.log("CYCLIC-INVARIANT-SPECTRUM");
 else console.log("BUG: CYCLE OF THE SAME FACES CHANGES SHAPEDNA BY",spectrumDistance(sp,rot));
}finally{await rm(tmp,{recursive:true,force:true});}
