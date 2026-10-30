import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import React from "react";
import {renderToString} from "react-dom/server";

const root=await mkdtemp(join(process.cwd(),".geometry-verification-test-"));
async function load(entry,name,ui=false){
 const outfile=join(root,name+".mjs");
 await build({entryPoints:[entry],outfile,bundle:true,format:"esm",platform:"node",
  packages:"external",tsconfig:"tsconfig.app.json",logLevel:"warning",
  ...(ui?{define:{"import.meta.env.BASE_URL":JSON.stringify("/MindeleevBolt01/")}}:{})});
 return import(pathToFileURL(outfile).href);
}
try{
 const [geo,poly,table,ui]=await Promise.all([
  load("src/polytron/geometryEquivalence.ts","geometry"),
  load("src/polyhedronisme/polyhedronisme.ts","poly"),
  load("src/polytron/periodicCatalog.ts","catalog"),
  load("src/experiments/PolytronPeriodicLab.tsx","ui",true)
 ]);
 const original=poly.generatePoly("D");
 const transformed={...original,
  vertices:[...original.vertices].reverse().map(([x,y,z])=>[
   3*(-y)+4,3*x-7,3*z+1]),
  faces:original.faces.map(f=>f.map(i=>original.vertices.length-1-i)).reverse()};
 const fa=geo.geometryFingerprint(original);
 const fb=geo.geometryFingerprint(transformed);
 assert(geo.plausibleSameGeometry(fa,fb),"Rigid-transformed/reindexed solid must pass cheap filter");
 assert(geo.sameFullGeometry(geo.fullGeometrySignature(original),
  geo.fullGeometrySignature(transformed)),"Rigid-transformed/reindexed solid must pass full test");
 const dI=poly.generatePoly("dI"),dO=poly.generatePoly("dO");
 assert(geo.plausibleSameGeometry(fa,geo.geometryFingerprint(dI)));
 assert(geo.sameFullGeometry(geo.fullGeometrySignature(original),
  geo.fullGeometrySignature(dI)),"D and dI must match in geometry even if spectrum unavailable");
 assert(!geo.plausibleSameGeometry(fa,geo.geometryFingerprint(dO)),
  "Non-equivalent Platonic solids should fail prefilter");
 const c=poly.generatePoly("C");
 assert(geo.sameFullGeometry(geo.fullGeometrySignature(c),
  geo.fullGeometrySignature(dO)));
 const catalog=new table.PeriodicCatalog();
 catalog.appendRows(21); // All 20 single Conway operators and the seed row.
 assert.equal(catalog.entries.length,105);
 for(const [dna,n] of [["dT",1],["dC",3],["dO",2],["dD",5],["dI",4]]){
  const entry=catalog.entries.find(e=>e.dna===dna);
  assert(entry&&entry.equivalents.includes(n),"Missing original equivalent for "+dna);
 }
 const large=catalog.entries.filter(e=>e.vertices>table.MAX_SHAPE_VERTICES &&
  e.vertices<=table.MAX_VERIFY_VERTICES && e.faces<=table.MAX_VERIFY_FACES);
 assert(large.length,"Need a real >80 vertex Conway polyhedron in the tests");
 assert(large.some(e=>e.verification==="verified"&&e.shapeStatus==="unmeasured"),
  "A large polyhedron must participate in geometry without spectral FEM");
 for(const e of catalog.entries){
  if(e.verification==="verified"){
   assert(e.equivalents.every(p=>p<e.number),
    "Equivalence must reference previous politronic numbers");
  }
  if(e.verification==="incomplete")assert(e.error,
   "Every incomplete verification needs an explicit reason");
 }
 const largeDNA=large[0].dna,largePoly=poly.generatePoly(largeDNA);
 const reordered={...largePoly,vertices:[...largePoly.vertices].reverse(),
  faces:largePoly.faces.map(f=>f.map(i=>largePoly.vertices.length-1-i))};
 assert(geo.plausibleSameGeometry(geo.geometryFingerprint(largePoly),
  geo.geometryFingerprint(reordered)),"Large equivalent mesh must pass prefilter");
 assert(geo.sameFullGeometry(geo.fullGeometrySignature(largePoly),
  geo.fullGeometrySignature(reordered)),"Large equivalent mesh must pass full check");
 const html=renderToString(React.createElement(ui.default));
 for(const text of ["Riga","Geometrie verificate","Spettro non calcolato",
  "Verifiche incomplete","Tavola periodica dei Polytroni"]){
  assert(html.includes(text),"Missing new UI copy: "+text);
 }
 const src=await readFile("src/experiments/PolytronPeriodicLab.tsx","utf8");
 for(const term of ['new Worker(new URL("../polytron/periodicCatalog.worker.ts"',
  "entry.row+1",'gridTemplateColumns:"76px repeat(5,minmax(0,1fr))"',
  'entry.verification==="incomplete"','entry.renderable']){
  assert(src.includes(term),"Missing UI/worker feature "+term);
 }
 assert.equal((src.match(/gridTemplateColumns:"76px repeat\(5,minmax\(0,1fr\)\)"/g)??[]).length,2,
  "Header and body must both have a row-number gutter");
 const worker=await readFile("src/polytron/periodicCatalog.worker.ts","utf8");
 assert(worker.includes("new PeriodicCatalog()")&&worker.includes('kind:"rows"'));
 console.log("LARGE GEOMETRY SAMPLE",JSON.stringify({
  dna:largeDNA,vertices:largePoly.vertices.length,faces:largePoly.faces.length,
  largeCount:large.length,verified:catalog.entries.filter(e=>e.verification==="verified").length,
  incomplete:catalog.unresolvedCount}));
 console.log("PASS Sprint36: shape equivalence independent of spectral FEM, large meshes, UI row labels and real worker");
}finally{await rm(root,{recursive:true,force:true});}
