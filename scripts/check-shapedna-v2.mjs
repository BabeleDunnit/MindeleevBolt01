import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const tmp=await mkdtemp(join(process.cwd(),".shape-v2-test-"));
const bundle=join(tmp,"suite.mjs");
const near=(a,b,eps=1e-8)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=eps;
const rotateFace=p=>({...p,faces:p.faces.map(f=>f.slice(1).concat(f[0]))});
const flipFace=p=>({...p,faces:p.faces.map(f=>[...f].reverse())});
const reverseVertices=p=>{
 const n=p.vertices.length;
 return {...p,vertices:[...p.vertices].reverse(),
  faces:p.faces.map(f=>f.map(i=>n-1-i))};
};
const permuteFaces=p=>({...p,faces:[...p.faces].reverse()});
const rigidTransform=p=>{
 const theta=1.134,c=Math.cos(theta),s=Math.sin(theta);
 return {...p,vertices:p.vertices.map(([x,y,z])=>
  [3.75*(c*x-s*y)+4,3.75*(s*x+c*y)-9,3.75*z+2])};
};
async function main(){
 await build({stdin:{
  contents:`import {generatePoly} from "./src/polyhedronisme/polyhedronisme.ts";
   import {surfaceShapeDNA,spectrumDistance} from "./src/experiments/surfaceShapeDNA.ts";
   import {PeriodicCatalog} from "./src/polytron/periodicCatalog.ts";
   export {generatePoly,surfaceShapeDNA,spectrumDistance,PeriodicCatalog};`,
  resolveDir:process.cwd(),sourcefile:"shape-v2-entry.ts",loader:"ts"},
  outfile:bundle,bundle:true,format:"esm",platform:"node",
  tsconfig:"tsconfig.app.json",logLevel:"warning"});
 const {generatePoly,surfaceShapeDNA,spectrumDistance,PeriodicCatalog}=
  await import(pathToFileURL(bundle).href);
 const signatures=new Map();
 for(const dna of ["T","C","O","D","I","dT","dC","dO","dD","dI",
  "aT","aC","aO","aD","aI"]){
  const poly=generatePoly(dna),spec=surfaceShapeDNA(poly,80,12);
  assert(spec&&spec.method==="cotangent-polygon-centroid-projected",
   "Missing corrected ShapeDNA for "+dna);
  assert.equal(spec.vertices,poly.vertices.length);
  assert(spec.values.length>=4&&spec.values.every(Number.isFinite));
  assert(spec.maxOffDiagonal<1e-3,"Laplacian Jacobi did not converge: "+dna);
  assert(spec.values.every(x=>x>=0));
  signatures.set(dna,spec);
  for(const [description,mutate] of [
   ["cyclic face",rotateFace],["flipped winding",flipFace],
   ["vertex IDs",reverseVertices],["face order",permuteFaces],
   ["rotation, translation and uniform scale",rigidTransform]
  ]){
   const next=surfaceShapeDNA(mutate(poly),80,12);
   assert(next,"Transformation resulted in missing ShapeDNA "+dna+" "+description);
   const delta=spectrumDistance(spec,next);
   assert(delta<2e-7,
    "ShapeDNA depends on "+description+" for "+dna+": "+delta);
  }
 }
 for(const [dna,alias] of [
  ["T","dT"],["C","dO"],["O","dC"],
  ["D","dI"],["I","dD"]
 ]){
  const d=spectrumDistance(signatures.get(dna),signatures.get(alias));
  console.log("SPECTRAL MATCH",dna,alias,d.toFixed(8));
  assert(d<.002,dna+" and "+alias+" must match without fallback: "+d);
 }
 for(const [a,b] of [["D","I"],["C","O"],["T","D"],["T","I"]]){
  const d=spectrumDistance(signatures.get(a),signatures.get(b));
  assert(d>.002,"Two distinct Platonic shapes were called spectral matches: "+a+"/"+b);
 }
 // When an isospectral counterexample occurs, geometric confirmation in the
 // catalog is essential; the spectral descriptor alone is never identity proof.
 const catalog=new PeriodicCatalog();
 catalog.appendRows(3);
 const expected=[
  ["dT",1],["dC",3],["dO",2],["dD",5],["dI",4]
 ];
 for(const [dna,predecessor] of expected){
  const row=catalog.entries.find(e=>e.dna===dna);
  assert(row,dna+" missing from canonical enumerator");
  assert.equal(row.shapeStatus,"measured",dna+" spectrum not measured");
  assert(row.equivalents.includes(predecessor),
   dna+" must report #"+predecessor+" as a previous equivalent");
 }
 for(const seed of ["T","C","O","D","I"]){
  const row=catalog.entries.find(e=>e.dna===seed);
  assert.equal(row.equivalents.length,0,
   "Platonic bases must remain distinct in the first row");
 }
 // A computed palette cannot affect the signature.
 const d=generatePoly("D"),d2=generatePoly("D");
 d2.faceClasses=[...d.faceClasses].reverse();
 assert(near(spectrumDistance(surfaceShapeDNA(d),surfaceShapeDNA(d2)),0,1e-12));
 // Deterministic output and spectral-distance symmetry.
 for(const dna of ["D","dI","C","dO"]){
  const x=signatures.get(dna),y=surfaceShapeDNA(generatePoly(dna));
  assert(near(spectrumDistance(x,y),0,1e-12));
  for(const other of ["D","I","C"])
   assert(near(spectrumDistance(x,signatures.get(other)),
    spectrumDistance(signatures.get(other),x),1e-12));
 }
 console.log("PERIODIC SHAPEDNA V2",
  JSON.stringify(expected.map(([dna,n])=>({dna,expected:n,
   actual:catalog.entries.find(e=>e.dna===dna).equivalents}))));
 console.log("PASS ShapeDNA v2: polygon-order invariance, rigid-transform and scale invariance, Platonic dual equivalence, negative tests, global catalog integration");
}
try{await main();}finally{await rm(tmp,{recursive:true,force:true});}
