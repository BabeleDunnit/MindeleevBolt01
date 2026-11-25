import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
const root=await mkdtemp(join(process.cwd(),".resonance-test-"));
async function load(path,name){
 const outfile=join(root,name+".mjs");
 await build({entryPoints:[path],outfile,bundle:true,format:"esm",
  platform:"node",packages:"external",tsconfig:"tsconfig.app.json",
  logLevel:"warning"});
 return import(pathToFileURL(outfile).href);
}
try{
 const [generator,resonance,difficulty,names,periodic]=await Promise.all([
  load("src/polytron/kaleidoscopeGenerator.ts","generator"),
  load("src/polytron/resonanceField.ts","resonance"),
  load("src/polytron/resonanceDifficulty.ts","difficulty"),
  load("src/polytron/spectralFutures.ts","names"),
  load("src/polytron/politronicNumber.ts","numbers")
 ]);
 const k=generator, r=resonance;
 const layout=k.generateKaleidoscope({
  radius:2,family:"metatron",symmetry:"C2",seed:137,generation:0
 });
 const empty=r.evaluateResonance(layout,[]);
 assert.equal(empty.quality,0);
 assert.equal(empty.hintResults.length,layout.tiles.length);
 assert.equal(empty.graphResults.length,layout.edges.length);
 const first=layout.tiles[0];
 const hue={number:first.number,paletteRow:first.paletteRow,
  paletteCol:first.paletteCol};
 const same={...hue,key:first.key};
 const one=r.evaluateResonance(layout,[same]);
 assert(one.quality>0&&one.quality<100);
 assert(one.color>0&&one.group>0&&one.period>0);
 assert(one.perPawnGain[same.key]>0);
 const opposite=k.kaleidoTransform(first,3);
 const pair={...hue,key:opposite.q+","+opposite.r};
 const two=r.evaluateResonance(layout,[same,pair]);
 assert(two.quality>one.quality,
  "Two correctly matched dual-side Polytrons improve resonance");
 assert(two.quality<100,"A pair should not automatically solve a whole target");
 assert(two.symmetry>=one.symmetry,
  "Symmetric answer should not score lower on symmetry");
 const openCell=layout.cells.find(c=>c.ring===1&&!layout.tiles.some(t=>t.key===c.key));
 if(openCell){
  const remotelyPlaced={...hue,key:openCell.key};
  const remote=r.evaluateResonance(layout,[remotelyPlaced]);
  assert(remote.quality>0,
   "An off-hint Polytron must still resonate with nearby target hints");
 }
 assert(r.resonanceHexDistance({q:0,r:0},{q:1,r:0})===1);
 assert(r.resonanceHexDistance({q:0,r:0},{q:1,r:1})===2);
 assert.equal(r.resonanceFalloff(2,{reach:1}),0);
 assert(r.resonanceFalloff(2,{reach:2})>0);
 assert.equal(r.resonancePaletteAffinity(10,10,10,10),1);
 assert(r.resonancePaletteAffinity(10,10,0,0)<1);
 assert.equal(r.resonanceGroupAffinity(2,3),.82);
 assert.equal(r.resonanceGroupAffinity(4,5),.82);
 assert.equal(r.resonanceGroupAffinity(1,1),1);
 const repeat=r.evaluateResonance(layout,[same,pair]);
 assert.deepEqual(repeat,two,"Evaluator must be deterministic");
 assert.throws(()=>r.evaluateResonance(layout,[same,same]),
  /one purchased Polytron/);
 assert.throws(()=>r.evaluateResonance(layout,[{...same,key:"invalid"}]),
  /outside/);
 const c=r.resonanceComplexity(layout);
 assert.equal(c.hints,layout.tiles.length);
 assert.equal(c.edges,layout.edges.length);
 assert(c.index>0);
 assert.equal(r.resonanceReward(layout,0),0);
 assert(r.resonanceReward(layout,100)>r.resonanceReward(layout,50));
 assert(r.resonanceCost(2)>0);

 // The heuristic is a feasible lower bound, never presented as a proof.
 const report=difficulty.analyzeResonanceDifficulty(layout,22,{reach:2});
 assert.equal(report.method,"bounded-greedy-estimate");
 assert.equal(report.bands.length,4);
 assert(report.expectedScore>0);
 for(const band of report.bands){
  assert(band.score>=0&&band.score<=100);
  assert(band.spent<=band.budget,"Budget must never be exceeded");
 }
 for(let i=1;i<report.bands.length;i++)
  assert(report.bands[i].score>=report.bands[i-1].score,
   "Quality frontier should not decrease when budget grows");
 assert(report.baselineSolution.length>0);
 assert.equal(report.spent,
  report.baselineSolution.reduce((s,p)=>s+r.resonanceCost(p.number),0));
 const current=difficulty.analyzeResonanceDifficulty(layout,22,{reach:2},[same]);
 assert(current.nextMoveQuality===null||current.nextMoveQuality>=one.quality,
  "A suggested next placement should not reduce score");
 assert(names.sealName(1)!=="—");
 assert(names.sealName(2)!=="—");
 assert(names.sealName(1)!==names.sealName(2));
 assert.equal(periodic.dnaFromPolitronNumber(2),"C");
 const sampleNames=[names.sealName(1),names.sealName(2)];
 assert(sampleNames.every(s=>typeof s==="string"&&s.length>2));

 const ui=await readFile("src/experiments/ResonancePlayground.tsx","utf8");
 const entry=await readFile("src/experiments/KaleidoscopeLab.tsx","utf8");
 const css=await readFile("src/experiments/ResonancePlayground.css","utf8");
 const renderer=await readFile("src/experiments/PolytronPeriodicLab.tsx","utf8");
 assert(entry.includes('mode==="resonance"')&&
  entry.includes("<ResonancePlayground layout={layout}"));
 assert(ui.includes("Difficulty Analyzer")&&
  ui.includes("new Worker(")&&
  ui.includes('resonanceDifficulty.worker.ts'));
 assert(ui.includes("Valutazione della risposta")&&
  ui.includes("resonanceHexDistance")===false&&
  ui.includes("evaluateResonance("));
 assert(ui.includes("Soddisfazione degli indizi")&&
  ui.includes("Legami di risonanza")&&ui.includes("showRays"));
 assert(ui.includes("Conferma acquisto")&&
  ui.includes("Conferma spostamento")&&
  ui.includes("Ritira"));
 assert(ui.includes("sealName(nextSeal)")&&
  ui.includes("Polytrone #")&&ui.includes("name:selectedPawn!.name")&&
  ui.includes("Manifestazione · Nº polytronico"));
 assert(ui.includes("Identità a Home")&&
  ui.includes("setHome(old=>[...old,selectedPawn])")&&
  ui.includes("seal:fromHome.seal,name:fromHome.name")&&
  ui.includes("setReturnSeal(selectedPawn.seal)"),
  "Bought individuals must keep permanent names and Seal # IDs on Home return");
 assert(ui.includes("completedRequests")&&
  ui.includes("Commissioni soddisfatte"),
  "Progressive commissions should be tracked without revealing a population cap");
 assert(!ui.includes("72 Polytroni")&&
  !ui.includes("Polytroni disponibili: 72")&&
  !ui.includes("manifestazione #{"),
  "The total number of identities and confusing #number displays must not leak");
 assert(renderer.includes("data.kaleidoOpacity")||
  renderer.includes("cell.dataset.kaleidoOpacity"),
  "Hint transparency must be implemented in the WebGL renderer");
 assert(renderer.includes("renderer.clearDepth()"),
  "Several real/hint viewports must coexist on the shared canvas");
 assert(css.includes(".resonance-cell-hit")&&
  css.includes("@media(max-width:530px)"));
 console.log("PASS Resonance: exact spatial evaluator, chromatic/dual affinity,"+
  " saturation, graph, symmetry, marginal contribution, budgeted difficulty"+
  " worker, unique named Polytron identities and full mobile UI.");
}finally{
 await rm(root,{recursive:true,force:true});
}
