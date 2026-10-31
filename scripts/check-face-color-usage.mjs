/**
 * Sprint 35 — Real face types and palette RGB usage, verified against the
 * actual Polyhedronisme painter and the vertex colors emitted to WebGL.
 */
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import React from "react";
import {renderToString} from "react-dom/server";
import * as THREE from "three";
const root=await mkdtemp(join(process.cwd(),".face-color-test-"));
async function load(entry,name,ui=false){
 const outfile=join(root,name+".mjs");
 await build({entryPoints:[entry],outfile,bundle:true,format:"esm",platform:"node",
  packages:"external",tsconfig:"tsconfig.app.json",logLevel:"warning",
  ...(ui?{define:{"import.meta.env.BASE_URL":JSON.stringify("/MindeleevBolt01/")}}:{})});
 return import(pathToFileURL(outfile).href);
}
try{
 const [usage,poly,colors,catalog,ui]=await Promise.all([
  load("src/polytron/faceColorUsage.ts","face-usage"),
  load("src/polytron/polytron.ts","geometry"),
  load("src/polytron/palettes.ts","palettes"),
  load("src/polytron/periodicCatalog.ts","catalog"),
  load("src/experiments/PolytronPeriodicLab.tsx","ui",true)
 ]);
 for(const dna of ["T","C","O","D","I"]){
  const result=poly.dnaToPoly(dna),classes=usage.polyFaceClasses(result);
  assert.equal(classes.length,1,"Platonic seed "+dna+" should be monochrome");
  for(const palette of [0,2,11,19,22,39,47,59]){
   const count=usage.faceColorUsage(classes,palette);
   assert.deepEqual({types:count.faceTypes,used:count.colorsUsed},{types:1,used:1});
   assert.deepEqual(count.colors,[colors.paletteColor(palette,classes[0])]);
  }
 }
 // Classes are sorted and unique, NOT merely all the integers below
 // a maximum; the palette function receives actual class indices.
 assert.deepEqual(usage.polyFaceClasses({faces:[[0],[1],[2]],faceClasses:[7,2,7]}),[2,7]);
 assert.deepEqual(usage.faceColorUsage([4,4,0,1],0).colors,
  [colors.paletteColor(0,4),colors.paletteColor(0,0),colors.paletteColor(0,1)]);
 assert.equal(usage.faceColorUsage([0,1,2,3,4,5,6,7,8,9],2).faceTypes,10);
 assert.equal(usage.faceColorUsage([0,1,2,3,4,5,6,7,8,9],2).colorsUsed,5,
  "Ten face classes must wrap across the five colors actually available");
 assert.throws(()=>usage.polyFaceClasses({faces:[[0]],faceClasses:[]}),
  /classification/i);
 assert.throws(()=>usage.usedFaceColors([0,-1],0),/Invalid face class/);
 const t=new catalog.PeriodicCatalog();
 t.appendRows(13);
 const examples=t.entries.filter(x=>x.faceTypeCount>1&&x.status==="ready");
 assert(examples.length>0,"Must exercise non-monochrome real Conway polyhedra");
 for(const e of t.entries)if(e.faceTypeCount!==undefined){
  const p=poly.dnaToPoly(e.dna);
  const uniqueClasses=new Set(p.faceClasses);
  assert.equal(e.faceTypeCount,uniqueClasses.size,"Face type count differs from painter "+e.dna);
  assert.equal(e.faceClassIds.length,uniqueClasses.size);
  for(const palette of [0,12,22,33,47,58]){
   const effective=usage.faceColorUsage(e.faceClassIds,palette);
   const actual=new Set(p.faceClasses.map(id=>colors.paletteColor(palette,id)));
   assert.equal(effective.colorsUsed,actual.size,
    "Effective color count differs from renderer "+e.dna+" palette "+palette);
   assert.deepEqual(new Set(effective.colors),actual);
   assert(effective.colorsUsed<=effective.faceTypes);
   assert(effective.colorsUsed<=colors.PALETTES[palette].length);
  }
 }
 const multi=examples[0],mono=t.entries[0],palette=2;
 for(const entry of [mono,multi]){
  const expected=usage.faceColorUsage(entry.faceClassIds,palette);
  const markup=renderToString(React.createElement(ui.PeriodicCell,{
   entry,palette,showSpectrum:false,showEquivalent:false
  }));
  assert(markup.includes("Colori usati:"));
  assert(markup.includes("Colori usati: <!-- -->"+expected.colorsUsed)||
   markup.includes("Colori usati: "+expected.colorsUsed),
   "Displayed count must match actual RGB usage "+entry.dna);
  assert(markup.includes("Tipi facce:"));
  for(const hex of expected.colors.map(c=>c.toString(16).padStart(6,"0")))
   assert(markup.includes("#"+hex),"Missing actual used color swatch "+entry.dna+" #"+hex);
 }
 // Verify generated triangulated vertex colors, rather than relying only
 // on an identical helper used by both the catalog and the tests.
 const e=multi;
 const geom=poly.polytronGeometry(e.dna,()=>palette);
 try{
  const attr=geom.solid.getAttribute("color"),rendered=new Set();
  const c=new THREE.Color();
  for(let i=0;i<attr.count;i++){
   c.setRGB(attr.getX(i),attr.getY(i),attr.getZ(i),THREE.LinearSRGBColorSpace);
   rendered.add(c.getHex());
  }
  assert.equal(rendered.size,usage.faceColorUsage(e.faceClassIds,palette).colorsUsed,
   "Count must agree with real triangulated WebGL vertex colors");
 }finally{geom.solid.dispose();geom.edges.dispose();}
 const app=renderToString(React.createElement(ui.default));
 assert(app.includes("Colori usati (max)"));
 assert(app.includes("Tipi di facce (max)"));
 assert(app.includes("Mono-colore"));
 assert(app.includes("Multi-colore"));
 const src=await readFile("src/experiments/PolytronPeriodicLab.tsx","utf8");
 assert(src.includes("[visible,palette]"),"Changing palette must update usage summary");
 console.log("FACE COLOR EXAMPLES",
  JSON.stringify({seed:mono.dna,monoColors:1,
   multi:multi.dna,faceTypes:multi.faceTypeCount,
   actualColors:usage.faceColorUsage(multi.faceClassIds,palette).colorsUsed,
   measured:t.entries.filter(e=>e.faceTypeCount!==undefined).length}));
 console.log("PASS face colors: actual painter classification, cycle wrapping, RGB swatches, 60 palette banks, 3D mesh and UI");
}finally{await rm(root,{recursive:true,force:true});}
