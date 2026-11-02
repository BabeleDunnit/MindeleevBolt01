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
 const [num,cat,ui,prior,life]=await Promise.all([
  load("src/polytron/politronicNumber.ts","number"),
  load("src/polytron/periodicCatalog.ts","catalog"),
  load("src/experiments/PolytronPeriodicLab.tsx","ui",true),
  load("src/polytron/mapping.ts","existing"),
  load("src/polytron/mindeleevLife.ts","life")
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
 // Validate every cell in the default 50 periods, including entries whose
 // geometries cannot be rendered. Numeric energy is shared with Life logic.
 for(let n=1;n<=250;n++){
  const group=((n-1)%5)+1,period=Math.floor((n-1)/5)+1;
  const expected=2+(period-1)+(group-1);
  assert.equal(life.intrinsicEnergy(n,0),expected,
   "Mindeleev Life/periodic energy mismatch at #"+n);
  const entry={...first[0],number:n,row:period-1,col:group-1,
   seed:num.PERIODIC_SEEDS[group-1],
   dna:num.dnaFromPolitronNumber(n),renderable:n%17!==0,
   faceClassIds:undefined,faceTypeCount:undefined,equivalents:[]};
  const cell=renderToString(React.createElement(ui.PeriodicCell,{
   entry,showEquivalent:false,showSpectrum:false,palette:0
  }));
  assert(cell.includes('data-intrinsic-energy="'+expected+'"'),
   "Card #"+n+" must display energy "+expected);
  assert(cell.includes('Energia intrinseca'),
   "Card #"+n+" must explicitly label intrinsic energy");
  assert(cell.includes('aria-label="Energia intrinseca: '+expected+' unità"'),
   "Card #"+n+" must announce the correct energy accessibly");
 }
 for(const [n,expected] of [[1,2],[5,6],[6,3],[10,7],[11,4],[250,55],[10000,2005]]){
  assert.equal(life.intrinsicEnergy(n,0),expected,"Boundary energy #"+n);
 }
 const markup=renderToString(React.createElement(ui.default));
 for(const required of ["Tavola periodica dei Polytroni",
  "Periodi da enumerare","Chromatica · 144 gradienti","Palette originali","Rotazione 3D","Equivalenti",
  "ShapeDNA","Trova numero o ConwayDNA","Ruber","Chrysos"]){
  assert(markup.includes(required),"Missing UI "+required);
 }
 for(const required of ["Gruppi →","↓ Periodi","Gruppo dei tetraedri",
  "Gruppo dei cubi","Gruppo degli ottaedri","Gruppo dei dodecaedri",
  "Gruppo degli icosaedri","Periodi generati:",
  "Energia intrinseca di ogni Polytrone","Il contributo di Chromatica è fisso a 0"]){
  assert(markup.includes(required),"Missing periodic table terminology "+required);
 }
 const src=await readFile("src/experiments/PolytronPeriodicLab.tsx","utf8");
 for(const required of ["THREE.WebGLRenderer","data-polytron-viewport","setScissor",
  "requestAnimationFrame","PALETTE_SETS","polytronGeometry","periodicCatalog.worker.ts"]){
  assert(src.includes(required),"Missing shared 3D implementation "+required);
 }
 const app=await readFile("src/App.tsx","utf8");
 assert(app.includes('experiment") === "polytron-periodic"'));
 console.log("DUAL EQUIVALENCES",JSON.stringify({dC:dC.equivalents,dO:dO.equivalents}));
 console.log("PASS periodic: all 250 default Polytron cards display canonical intrinsic energy (including nonrenderable), matching Mindeleev Life; numbering and shared 3D unchanged");
}finally{await rm(root,{recursive:true,force:true});}
