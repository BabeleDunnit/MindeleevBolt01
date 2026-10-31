import assert from "node:assert/strict";
import {readFile,mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import {build} from "esbuild";
import React from "react";
import {renderToString} from "react-dom/server";
const temp=await mkdtemp(join(tmpdir(),"mindeleev-gradient-test-"));
async function load(path,name,ui=false){
 const outfile=join(temp,name+".mjs");
 await build({entryPoints:[path],outfile,bundle:true,format:"esm",platform:"node",
  packages:"external",tsconfig:"tsconfig.app.json",logLevel:"warning",
  loader:{".css":"empty"},
  ...(ui?{define:{"import.meta.env.BASE_URL":JSON.stringify("/MindeleevBolt01/")}}:{})});
 return import(pathToFileURL(outfile).href);
}
try{
 const p=await load("src/polytron/gradientPalettes.ts","palette");
 assert.equal(p.LATIN_SOURCES.length,12);
 assert.equal(p.GREEK_DESTINATIONS.length,12);
 assert.equal(p.ALL_GRADIENTS.length,144);
 assert.equal(new Set(p.LATIN_SOURCES.map(c=>c.id)).size,12);
 assert.equal(new Set(p.GREEK_DESTINATIONS.map(c=>c.id)).size,12);
 assert.equal(new Set(p.ALL_GRADIENTS.map(x=>x.id)).size,144);
 for(const entry of [...p.LATIN_SOURCES,...p.GREEK_DESTINATIONS]){
  assert.match(entry.hex,/^#[0-9a-f]{6}$/i);
  assert(entry.name.length>=4);
 }
 assert(p.GREEK_DESTINATIONS.every(c=>c.script&&c.script.length>0),
  "Greek color headings should include Greek script");
 assert.equal(p.mixColors("#000000","#ffffff",0),"#000000");
 assert.equal(p.mixColors("#000000","#ffffff",1),"#ffffff");
 assert.equal(p.mixColors("#000000","#ffffff",.2),"#333333");
 assert.equal(p.mixColors("#000000","#ffffff",.8),"#cccccc");
 assert.equal(p.mixColors("#000000","#ffffff",.5),"#808080");
 assert.deepEqual(p.quantizedGradient("#000000","#ffffff",3),
  ["#000000","#808080","#ffffff"]);
 assert.deepEqual(p.flippedGradient("#000000","#ffffff",8),
  ["#000000","#ffffff","#333333","#cccccc",
   "#666666","#999999","#1a1a1a","#e6e6e6"]);
 assert.deepEqual(p.flippedGradient("#000000","#ffffff",5),
  ["#000000","#ffffff","#333333","#cccccc","#666666"]);
 assert.deepEqual(p.flippedGradient("#000000","#ffffff",3),
  ["#000000","#ffffff","#333333"]);
 assert.throws(()=>p.quantizedGradient("#000000","#ffffff",1));
 assert.throws(()=>p.mixColors("#000000","#ffffff",-1));
 assert.throws(()=>p.gradientPair(12,0));
 assert.throws(()=>p.gradientPair(0,12));
 for(let i=0;i<12;i++)for(let j=0;j<12;j++){
  const pair=p.gradientPair(i,j);
  assert.equal(pair.id,p.ALL_GRADIENTS[i*12+j].id);
  assert.equal(pair.primary,p.LATIN_SOURCES[i]);
  assert.equal(pair.secondary,p.GREEK_DESTINATIONS[j]);
  for(const steps of [3,5,8]){
   const exportEntry=p.gradientPaletteExport(pair,steps);
   for(const [count,colors] of [[3,exportEntry.steps3],[5,exportEntry.steps5],[8,exportEntry.steps8]]){
    assert.equal(colors.length,count);
    assert.equal(colors[0],pair.primary.hex);
    assert.equal(colors[count-1],pair.secondary.hex);
    assert(colors.every(c=>/^#[0-9a-f]{6}$/.test(c)));
   }
   assert.deepEqual(exportEntry.flipped.positions,p.HIGH_CONTRAST_POSITIONS.slice(0,steps));
   assert.equal(exportEntry.flipped.colors.length,steps);
   assert.equal(exportEntry.flipped.colors[0],pair.primary.hex);
   assert.equal(exportEntry.flipped.colors[1],pair.secondary.hex);
   assert.equal(exportEntry.flipped.colors[2],p.mixColors(pair.primary.hex,pair.secondary.hex,.2));
   if(steps>=5)assert.equal(exportEntry.flipped.colors[3],p.mixColors(pair.primary.hex,pair.secondary.hex,.8));
  }
 }
 const exported=p.exportGradientMatrix(8);
 assert.equal(exported.palettes.length,144);
 assert.equal(exported.sources.length,12);
 assert.equal(exported.destinations.length,12);
 assert.equal(exported.method,"sRGB channel interpolation");
 assert(exported.palettes.every(x=>x.flipped.colors.length===8));
 assert.equal(p.gradientCss("#000000","#ffffff"),
  "linear-gradient(90deg, #000000 0%, #ffffff 100%)");
 const ui=await load("src/experiments/GradientPaletteLab.tsx","lab",true);
 const markup=renderToString(React.createElement(ui.default));
 for(const term of ["Chromatica","LA MATRICE","MATERIA","EIDOS","Esporta JSON",
  "Continuo","Tre colori","Cinque colori","Otto colori","Capovolto","Chrysos","Ruber",
  "Χρυσός","Colori"]){
  assert(markup.includes(term),"Missing UI text: "+term);
 }
 assert.equal((markup.match(/class="gp-cell-button/g)||[]).length,144,
  "All 144 gradient cells must be rendered");
 assert.equal((markup.match(/class="gp-bar-label"/g)||[]).length,144*5+5,
  "Five gradient strips in each matrix cell plus five in inspector");
 const app=await readFile("src/App.tsx","utf8");
 assert(app.includes('experiment") === "gradient-palettes"'));
 const periodic=await readFile("src/experiments/PolytronPeriodicLab.tsx","utf8");
 assert(!periodic.includes("gradientPaletteExport"),
  "The research gradient lab must not be wired to the Polytron table yet");
 const examples=["ruber-chrysos","niger-melas","albus-leukos"];
 for(const id of examples)assert(exported.palettes.some(x=>x.id===id));
 console.log("GRADIENT EXAMPLE",JSON.stringify(exported.palettes.find(x=>x.id==="ruber-chrysos")));
 console.log("PASS Sprint37: 144 Latin/Greek combinations, RGB mixing, continuous/3/5/8/flipped, exported schema, isolated 144-cell UI");
}finally{await rm(temp,{recursive:true,force:true});}
