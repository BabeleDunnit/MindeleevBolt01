import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const root=await mkdtemp(join(process.cwd(),".kaleidoscope-check-"));
try{
 const outfile=join(root,"generator.mjs");
 await build({
  entryPoints:["src/polytron/kaleidoscopeGenerator.ts"],
  outfile,bundle:true,format:"esm",platform:"node",packages:"external",
  tsconfig:"tsconfig.app.json",logLevel:"warning"
 });
 const k=await import(pathToFileURL(outfile).href);
 const labels=[7,19,37,61,91];
 for(let radius=1;radius<=5;radius++){
  assert.equal(k.kaleidoCellCount(radius),labels[radius-1]);
  const cells=k.kaleidoPoints(radius);
  assert.equal(cells.length,labels[radius-1]);
  assert.equal(new Set(cells.map(c=>c.key)).size,cells.length);
  assert(cells.every(c=>c.ring<=radius));
  assert.equal(cells.filter(c=>c.ring===radius).length,6*radius);
 }
 for(const bad of [-1,0,1.5,6,NaN,Infinity])
  assert.throws(()=>k.kaleidoCellCount(bad));
 const vector={q:3,r:-1};
 let rotated=vector;
 for(let n=0;n<6;n++)rotated=k.kaleidoRotate60(rotated);
 assert.deepEqual(rotated,vector);
 assert.deepEqual(k.kaleidoReflect(k.kaleidoReflect(vector)),vector);
 for(const family of k.KALEIDOSCOPE_FAMILIES){
  for(const symmetry of k.KALEIDOSCOPE_SYMMETRIES){
   for(let radius=1;radius<=5;radius++){
    const params={radius,family,symmetry,seed:137,generation:0};
    let layout=k.generateKaleidoscope(params);
    assert.deepEqual(layout,k.generateKaleidoscope(params),
     "A seed must deterministically generate one layout");
    assert.equal(layout.cells.length,k.kaleidoCellCount(radius));
    assert(layout.tiles.length>0);
    assert(layout.tiles.length<=layout.cells.length-1);
    assert.equal(layout.params.radius,radius);
    for(const tile of layout.tiles)assert.equal(tile.dna.length>0,true);
    for(let generation=1;generation<=4;generation++){
     const next=k.generateKaleidoscope({...params,generation},layout);
     assert.equal(next.params.generation,generation);
     assert.equal(next.params.radius,radius);
     const before=layout.tiles.map(t=>t.key+"="+t.number+"="+t.paletteRow).join("|");
     const after=next.tiles.map(t=>t.key+"="+t.number+"="+t.paletteRow).join("|");
     assert.notEqual(after,before,
      "Evolve must visually change even smallest fully symmetric radius");
     layout=next;
    }
    const occupied=new Map(layout.tiles.map(t=>[t.key,t]));
    assert.equal(occupied.size,layout.tiles.length);
    const available=new Map(layout.cells.map(c=>[c.key,c]));
    const shifts=symmetry==="C2"?[0,3]:
     symmetry==="C3"?[0,2,4]:[0,1,2,3,4,5];
    const reflected=symmetry==="D6"?[false,true]:[false];
    for(const tile of layout.tiles){
     assert(tile.ring<=radius);
     assert.equal(tile.ring,Math.max(Math.abs(tile.q),Math.abs(tile.r),Math.abs(-tile.q-tile.r)));
     for(const reflection of reflected)for(const rotation of shifts){
      const target=k.kaleidoTransform(tile,rotation,reflection);
      const matching=occupied.get(target.q+","+target.r);
      assert(matching,"Symmetric partner is missing");
      assert.equal(matching.number,tile.number,"Group orbit cannot change DNA");
      assert.equal(matching.paletteRow,tile.paletteRow);
      assert.equal(matching.paletteCol,tile.paletteCol);
      assert.equal(matching.orbit,tile.orbit);
     }
    }
    const valid=new Set(layout.cells.map(c=>c.key));
    for(const edge of layout.edges){
     assert(valid.has(edge.from)&&valid.has(edge.to));
     assert(occupied.has(edge.from)||edge.from==="0,0");
     assert(occupied.has(edge.to)||edge.to==="0,0");
    }
    const energy=layout.tiles.reduce((sum,t)=>sum+
     (2+Math.floor((t.number-1)/5)+((t.number-1)%5)),0);
    assert.equal(layout.totalIntrinsicEnergy,energy);
    assert.equal(layout.usedManifestations,
     new Set(layout.tiles.map(t=>t.number)).size);
   }
  }
 }
 const app=await readFile("src/App.tsx","utf8");
 const ui=await readFile("src/experiments/KaleidoscopeLab.tsx","utf8");
 const renderer=await readFile("src/experiments/PolytronPeriodicLab.tsx","utf8");
 const css=await readFile("src/experiments/KaleidoscopeLab.css","utf8");
 assert(app.includes('experiment") === "kaleidoscope-lab"')&&
  app.includes("<KaleidoscopeLab />"),
  "The standalone experiment must be routable, not called RC02");
 assert(ui.includes("Raggio del caleidoscopio")&&
  ui.includes('type="range"')&&ui.includes('min="1" max="5"')&&
  ui.includes("kaleidoCellCount(radius)")&&
  ui.includes("generateKaleidoscope("),
  "The radius must control generation and not be a zoom-only setting");
 assert(ui.includes('data-view-kind="flat-z"')&&
  ui.includes("data-kaleido-angle")&&
  ui.includes("data-kaleido-mirror")&&
  renderer.includes('cell.dataset.kaleidoAngle')&&
  renderer.includes('cell.dataset.kaleidoMirror')&&
  renderer.includes("data-kaleido-row"),
  "The exact canonical flattened-Z geometry must render per-cell variants");
 assert(ui.includes("Evolve")&&ui.includes("Nuova origine")&&
  css.includes(".kaleido-radius-picker")&&
  css.includes("@media(max-width:530px)"),
  "Evolution and mobile-first radius controls must be visible");
 console.log("PASS Kaleidoscope Lab: 4 families × 4 symmetries × 5 radii × 5 generations,"+
  " exact orbit symmetry, deterministic lineage, real flat-Z viewports and UI");
}finally{
 await rm(root,{recursive:true,force:true});
}
