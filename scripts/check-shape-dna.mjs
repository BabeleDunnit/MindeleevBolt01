import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {pathToFileURL} from "node:url";

const dir=await mkdtemp(join(tmpdir(),"mindeleev-shape-dna-"));
try{
 await build({entryPoints:["src/experiments/surfaceShapeDNA.ts","src/polytron/polytron.ts"],outdir:dir,
  entryNames:"[name]",bundle:true,platform:"node",format:"esm",tsconfig:"tsconfig.app.json",logLevel:"warning"});
 const {surfaceShapeDNA,spectrumDistance}=await import(pathToFileURL(join(dir,"surfaceShapeDNA.mjs")).href);
 const {dnaToPoly}=await import(pathToFileURL(join(dir,"polytron.mjs")).href);
 const close=(a,b,rel=.018)=>Math.abs(a-b)<=rel*Math.max(1,Math.abs(a),Math.abs(b));
 for(const dna of ["T","C","O","D","I","aC","dC","aaC"]){
  const poly=dnaToPoly(dna),s=surfaceShapeDNA(poly);
  assert(s,dna+": surface spectrum unavailable");
  assert(s.values.length>=4,dna+": eigenvalues missing");
  assert(s.values.every(Number.isFinite),dna+": non-finite eigenvalue");
  assert(s.values.every((x,i)=>i===0||x>=s.values[i-1]-1e-5),dna+": unordered");
  assert(s.values[0]<.005,dna+": constant mode not near zero");
  assert(s.values[1]>.001,dna+": unexpected disconnected surface");
  const transformed=[
   {...poly,vertices:poly.vertices.map(([x,y,z])=>[x*3.7,y*3.7,z*3.7])},
   {...poly,vertices:poly.vertices.map(([x,y,z])=>[x+4.2,y-10,z+2.8])},
   {...poly,vertices:poly.vertices.map(([x,y,z])=>[Math.cos(.827)*x-Math.sin(.827)*y,Math.sin(.827)*x+Math.cos(.827)*y,z])}
  ];
  for(const [index,shape] of transformed.entries()){
   const result=surfaceShapeDNA(shape);
   assert(result,dna+": transformed surface spectrum unavailable "+index);
   assert(s.values.every((v,i)=>close(v,result.values[i])),dna+": rigid/scale invariance failed "+index);
  }
 }
 const a=surfaceShapeDNA(dnaToPoly("aC")),b=surfaceShapeDNA(dnaToPoly("a05C"));
 assert(a&&b&&spectrumDistance(a,b)<1e-7,"Palette must not change surface spectrum");
 const c=surfaceShapeDNA(dnaToPoly("C")),d=surfaceShapeDNA(dnaToPoly("O"));
 assert(c&&d&&Number.isFinite(spectrumDistance(c,d)),"Comparison metric unavailable");
 console.log("PASS: 8 shapes, surface spectrum sanity, rigid/scale invariance, palette invariance and spectral comparison.");
}finally{await rm(dir,{recursive:true,force:true});}
