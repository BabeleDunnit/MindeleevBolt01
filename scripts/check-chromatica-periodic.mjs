import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import React from "react";
import {renderToString} from "react-dom/server";

const root=await mkdtemp(join(process.cwd(),".periodic-gradient-test-"));
async function load(path,name,ui=false){
 const outfile=join(root,name+".mjs");
 await build({entryPoints:[path],outfile,bundle:true,format:"esm",platform:"node",
  packages:"external",tsconfig:"tsconfig.app.json",logLevel:"warning",
  loader:{".css":"empty"},
  ...(ui?{define:{"import.meta.env.BASE_URL":JSON.stringify("/MindeleevBolt01/")}}:{})});
 return import(pathToFileURL(outfile).href);
}
const rgbKey=(v)=>v.map(n=>Math.fround(n)).join(",");
try{
 const [grad,colors,renderer,catalog,ui,picker]=await Promise.all([
  load("src/polytron/gradientPalettes.ts","grad"),
  load("src/polytron/gradientFacePalette.ts","colors"),
  load("src/polytron/polytron.ts","render"),
  load("src/polytron/periodicCatalog.ts","catalog"),
  load("src/experiments/PolytronPeriodicLab.tsx","periodic",true),
  load("src/experiments/PeriodicGradientPicker.tsx","picker",true)
 ]);
 const pairs=[grad.gradientPair(2,4),grad.gradientPair(0,0),
  grad.gradientPair(1,1),grad.gradientPair(6,7)];
 assert.equal(grad.ALL_GRADIENTS.length,144);
 assert.equal(grad.auditGradientMatrix().belowThreshold,0);
 assert.equal(colors.gradientPositions(1,"linear").length,1);
 assert.deepEqual(colors.gradientPositions(2,"linear"),[0,1]);
 assert.deepEqual(colors.gradientPositions(8,"contrast"),
  [0,1,.2,.8,.4,.6,.1,.9]);
 assert.deepEqual(colors.gradientPositions(5,"contrast"),[0,1,.2,.8,.4]);
 for(const order of ["linear","contrast"]){
  for(const n of [1,2,3,4,5,6,7,8,9,12,17,30,64,97,160,300,700]){
   const ts=colors.gradientPositions(n,order);
   assert.equal(ts.length,n);
   assert.equal(new Set(ts).size,n,"Wrapping or repeated t at "+order+" "+n);
   assert(ts.every(t=>t>=0&&t<=1&&Number.isFinite(t)));
   if(n>1){
    assert.equal(ts[0],0);assert.equal(ts[order==="linear"?n-1:1],1);
   }
   // Long palettes use a floating-point RGB triplet, not 8-bit #rrggbb
   // rounding. This is essential for distinct categories > 5 or > 8.
   for(const pair of pairs){
    const samples=colors.gradientSamples(
     pair.primary.hex,pair.secondary.hex,n,order);
    assert.equal(samples.length,n);
    assert.equal(new Set(samples.map(rgbKey)).size,n,
     "Duplicate FLOAT32 RGB samples, pair "+pair.id+" n="+n+" "+order);
   }
  }
 }
 for(const pair of grad.ALL_GRADIENTS){
  for(const order of ["linear","contrast"]){
   const selection={pair,order};
   const ids=[7,2,42,18,9,3,13,88,30,60,22,44,51];
   const mapping=colors.gradientFaceMapping(ids,selection);
   assert.equal(mapping.size,ids.length);
   assert.deepEqual([...mapping.keys()],[2,3,7,9,13,18,22,30,42,44,51,60,88]);
   assert.equal(new Set([...mapping.values()].map(rgbKey)).size,ids.length,
    "No modulo index or accidental color collisions");
   assert.equal(colors.gradientFaceUsage(ids,selection).colorsUsed,ids.length);
   assert.equal(colors.gradientFaceUsage(ids,selection).faceTypes,ids.length);
   // Endpoints are exact, and intermediate points lie on the straight sRGB
   // segment. 3/5/8 mode is derived from number of face types.
   const samples=colors.gradientSamples(pair.primary.hex,pair.secondary.hex,8,order);
   const start=[1,3,5].map(i=>parseInt(pair.primary.hex.slice(i,i+2),16)/255);
   const finish=[1,3,5].map(i=>parseInt(pair.secondary.hex.slice(i,i+2),16)/255);
   const ts=colors.gradientPositions(8,order);
   for(let k=0;k<samples.length;k++)
    for(let c=0;c<3;c++)
     assert(Math.abs(samples[k][c]-(start[c]+(finish[c]-start[c])*ts[k]))<1e-12);
  }
 }
 // The old renderer's five-color palette is still accessible unchanged.
 const legacyColor=(await load("src/polytron/palettes.ts","legacy")).paletteColor;
 assert.equal(legacyColor(2,0),legacyColor(2,5));
 const table=new catalog.PeriodicCatalog();
 table.appendRows(25);
 const eligible=table.entries.filter(e=>e.faceClassIds?.length>1&&e.renderable);
 assert(eligible.length>0,"The catalog should include multicolored meshes");
 const representative=eligible.sort((a,b)=>b.faceTypeCount-a.faceTypeCount)[0];
 const pair=grad.gradientPair(2,4);
 const summary=[];
 for(const order of ["linear","contrast"]){
  const selection={pair,order};
  const mapping=colors.gradientFaceMapping(representative.faceClassIds,selection);
  const mesh=renderer.polytronGeometry(representative.dna,()=>2,selection);
  try{
   const actual=new Set();
   const color=mesh.solid.getAttribute("color");
   // Every triangle vertex is colored with ONE RGB per original face class.
   for(let i=0;i<color.count;i++)
    actual.add([color.getX(i),color.getY(i),color.getZ(i)].join(","));
   assert.equal(actual.size,representative.faceTypeCount,
    "WebGL color attribute must have one distinct color per face category");
   assert.equal(mapping.size,representative.faceTypeCount);
   summary.push({order,dna:representative.dna,faceTypes:representative.faceTypeCount,
    colors:actual.size});
  }finally{mesh.solid.dispose();mesh.edges.dispose();}
  const cell=renderToString(React.createElement(ui.PeriodicCell,{
   entry:representative,showEquivalent:false,showSpectrum:false,palette:2,
   gradient:selection
  }));
  assert(cell.includes("Colori usati: <!-- -->"+representative.faceTypeCount)||
   cell.includes("Colori usati: "+representative.faceTypeCount),
   "Displayed color count must match actual geometric categories");
 }
 const pickerMarkup=renderToString(React.createElement(picker.default,{
  row:2,column:4,order:"contrast",onPairChange:()=>{},
  onOrderChange:()=>{},exampleFaceTypes:12
 }));
 assert.equal((pickerMarkup.match(/class="cpm-cell/g)||[]).length,144);
 for(const word of ["Ruber","Chrysos","Χρυσός","Dritta","A salti",
  "12 colori","senza ripetere indici"]){
  assert(pickerMarkup.includes(word),"Missing gradient matrix feature: "+word);
 }
 const pageMarkup=renderToString(React.createElement(ui.default));
 assert(pageMarkup.includes("Chromatica · 144 gradienti"));
 assert(pageMarkup.includes("Palette originali"));
 for(const label of ["Gruppi →","↓ Periodi","Gruppo dei tetraedri",
  "Gruppo dei cubi","Gruppo degli ottaedri","Gruppo dei dodecaedri",
  "Gruppo degli icosaedri","Periodi generati:"]){
  assert(pageMarkup.includes(label),"Missing periodic nomenclature "+label);
 }
 assert(pageMarkup.includes("cpm-matrix"),"Chromatica is default selected mode");
 const source=await readFile("src/experiments/PolytronPeriodicLab.tsx","utf8");
 assert(source.includes('setPaletteMode("legacy")'));
 assert(source.includes('polytronGeometry(dna,()=>palette,gradient)'));
 assert(source.includes('gradientFaceUsage(entry.faceClassIds,gradient)'));
 assert(source.includes('const [rows,setRows]=useState(50);'),
  "The table must enumerate 50 periods by default");
 assert(source.includes('const [rowInput,setRowInput]=useState("50");'),
  "The number input must display the actual 50-period initial target");
 assert(source.includes('const rowTarget=Math.min(rows*5,MAX_CATALOG_ROWS*5)'),
  "The number of Polytrons must remain five per period");
 assert(source.includes('instance.postMessage({kind:"target",rows})'),
  "Worker must receive initial period target");
 console.log("NO-WRAPPING 3D",JSON.stringify(summary));
 console.log("PASS sprint39: 144 gradients; exactly N float32 sRGB colors for N face classes; stable legacy mode; dynamic matrix, 3D and cell counts");
}finally{await rm(root,{recursive:true,force:true});}
