// Check the actual 3D geometry is used for all SVG Polytron previews.
// This is a rendering integration check, not a judgment of aesthetic quality.
import assert from "node:assert/strict";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {build} from "esbuild";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {pathToFileURL} from "node:url";
const dir=await mkdtemp(join(tmpdir(),"mindeleev-mesh-vis-"));
try{
 const output=join(dir,"glyph.mjs");
 await build({entryPoints:["src/experiments/PolytronMeshGlyph.tsx"],outfile:output,
  bundle:true,format:"esm",platform:"node",packages:"external",
  tsconfig:"tsconfig.app.json",logLevel:"warning"});
 const {glyphModel,PolytronGlyph}=await import(pathToFileURL(output).href);
 for(const [dna,V,F] of [["T",4,4],["C",8,6],["O",6,8],["aC",12,14],["dC",6,8],["D",20,12],["I",12,20]]){
  const data=glyphModel(dna);
  assert.equal(data.vertices,V,dna+" vertices must come from mesh");
  assert.equal(data.facets,F,dna+" faces must come from mesh");
  assert(data.faces.length>0&&data.faces.length<=F,dna+" invisible/all-backfacing mesh");
  assert(data.faces.every(f=>f.points.split(" ").length>=3),dna+" face not a real polygon");
  assert(data.faces.every(f=>/^rgb\(/.test(f.fill)),dna+" palette not applied");
  assert.deepEqual(glyphModel(dna),glyphModel(dna),"canonical rendering must be reproducible");
  const html=renderToStaticMarkup(React.createElement("svg",null,React.createElement(PolytronGlyph,{dna,x:0,y:0,size:20})));
  assert(html.includes("<polygon")&&html.includes(dna),"SVG fails to expose real faces");
 }
 const complex=glyphModel("aaC");
 assert(complex.faces.length>8,"refined Conway mesh not actually visible");
 const palette=glyphModel("a05C");
 assert(palette.facets===glyphModel("aC").facets,"palette altered mesh");
 // Different palettes can change color, not face/vertex coordinates.
 assert(palette.faces.map(f=>f.points).join()===glyphModel("aC").faces.map(f=>f.points).join());
 console.log("PASS visible Conway geometry: seven Platonic/Conway shapes, fixed 3D projection, mesh face polygons, palette, complex forms and SSR SVG.");
}finally{await rm(dir,{recursive:true,force:true});}
