import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import React from "react";
import {renderToString} from "react-dom/server";
const root=await mkdtemp(join(process.cwd(),".periodic-test-"));
async function load(path,name,ui=false){
 const outfile=join(root,name+".mjs");
 await build({entryPoints:[path],outfile,bundle:true,format:"esm",platform:"node",
  packages:"external",tsconfig:"tsconfig.app.json",logLevel:"warning",
  ...(ui?{define:{"import.meta.env.BASE_URL":JSON.stringify("/MindeleevBolt01/")}}:{})});
 return import(pathToFileURL(outfile).href);
}
try{
 const [num,cat,ui,prior]=await Promise.all([
  load("src/polytron/politronicNumber.ts","number"),
  load("src/polytron/periodicCatalog.ts","catalog"),
  load("src/experiments/PolytronPeriodicLab.tsx","ui",true),
  load("src/polytron/mapping.ts","existing")
 ]);
 assert.deepEqual([...num.PERIODIC_OPERATORS],[...prior.OPERATORS]);
 assert.deepEqual([...num.PERIODIC_SEEDS],["T","C","O","D","I"]);
 for(let n=1;n<=10000;n++){
  const dna=num.dnaFromPolitronNumber(n);
  assert.equal(num.politronNumberFromDNA(dna),BigInt(n),"roundtrip "+n);
  assert(!/\d/.test(dna),"DNA must be palette-free");
 }
 const alpha=prior.OPERATORS;
 const expected=["T","C","O","D","I",...["T","C","O","D","I"].map(seed=>alpha[0]+seed),
  ...["T","C","O","D","I"].map(seed=>alpha[1]+seed)];
 expected.forEach((dna,i)=>assert.equal(num.dnaFromPolitronNumber(i+1),dna));
 assert.equal(num.rowIndexToOps(0n),"");
 assert.equal(num.rowIndexToOps(1n),alpha[0]);
 assert.equal(num.rowIndexToOps(1n+BigInt(alpha.length)),alpha[0]+alpha[0]);
 const giant=alpha.join("").repeat(2)+"I";
 assert.equal(num.dnaFromPolitronNumber(num.politronNumberFromDNA(giant)),giant,
  "A chain longer than 4 must remain precisely reversible");
 for(const invalid of ["a02T","09I","g3O","tA","","aZ","Dk"]){
  assert.throws(()=>num.politronNumberFromDNA(invalid),"Invalid bare ConwayDNA "+invalid);
 }
 assert.throws(()=>num.dnaFromPolitronNumber(0));
 const table=new cat.PeriodicCatalog();
 table.appendRows(3);
 assert.equal(table.entries.length,15);
 for(let i=0;i<table.entries.length;i++){
  const e=table.entries[i];
  assert.equal(e.number,i+1);
  assert.equal(e.dna,num.dnaFromPolitronNumber(i+1));
  assert.equal(e.row,Math.floor(i/5));
  assert.equal(e.col,i%5);
  assert(e.equivalents.every(p=>p<e.number),"Equivalents must only refer to predecessors");
 }
 const first=table.entries.slice(0,5);
 assert(first.every(e=>e.status==="ready"));
 assert(first.every(e=>e.shapeStatus==="measured"),"All Platonic seeds must receive ShapeDNA");
 const dC=table.entries.find(e=>e.dna==="dC");
 const dO=table.entries.find(e=>e.dna==="dO");
 assert(dC&&dO);
 assert(dC.equivalents.includes(3),"Dual cube must point to previous octahedron #3");
 assert(dO.equivalents.includes(2),"Dual octahedron must point to previous cube #2");
 const before=table.entries.map(e=>({number:e.number,dna:e.dna}));
 table.appendRows(1);
 assert.deepEqual(table.entries.slice(0,15).map(e=>({number:e.number,dna:e.dna})),before);
 const markup=renderToString(React.createElement(ui.default));
 for(const required of ["Tavola periodica dei Polytroni",
  "Righe da enumerare","Famiglia di palette","Rotazione 3D","Equivalenti",
  "ShapeDNA","Trova numero o ConwayDNA","Mineral 00-09","Neon 10-19"]){
  assert(markup.includes(required),"Missing UI "+required);
 }
 const src=await readFile("src/experiments/PolytronPeriodicLab.tsx","utf8");
 for(const required of ["THREE.WebGLRenderer","data-polytron-viewport","setScissor",
  "requestAnimationFrame","PALETTE_SETS","polytronGeometry","PeriodicCatalog"]){
  assert(src.includes(required),"Missing shared 3D implementation "+required);
 }
 const app=await readFile("src/App.tsx","utf8");
 assert(app.includes('experiment") === "polytron-periodic"'));
 console.log("DUAL EQUIVALENCES",JSON.stringify({dC:dC.equivalents,dO:dO.equivalents}));
 console.log("PASS sprint35: BigInt reversible palette-free numbering, canonical operator order, ShapeDNA predecessor equivalences and shared 3D table");
}finally{await rm(root,{recursive:true,force:true});}
