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
 const [k,r,d,names,numbers]=await Promise.all([
  load("src/polytron/kaleidoscopeGenerator.ts","generator"),
  load("src/polytron/resonanceField.ts","resonance"),
  load("src/polytron/resonanceDifficulty.ts","difficulty"),
  load("src/polytron/spectralFutures.ts","names"),
  load("src/polytron/politronicNumber.ts","numbers")
 ]);
 const layout=k.generateKaleidoscope({
  radius:2,family:"metatron",symmetry:"C2",seed:137,generation:0
 });
 const zero=r.evaluateResonance(layout,[]);
 assert.equal(zero.quality,0);
 assert.equal(zero.local,0);
 assert.equal(zero.structural,0);
 assert.equal(zero.graphResults.length,0,
  "Structural graph has actual Polytron links, not target lines");
 assert.equal(zero.hintResults.length,layout.tiles.length);
 const hint=layout.tiles[0];
 const same={key:hint.key,number:hint.number,
  paletteRow:hint.paletteRow,paletteCol:hint.paletteCol};
 const counterpart=k.kaleidoTransform(hint,3);
 const pair={...same,key:counterpart.q+","+counterpart.r};
 const one=r.evaluateResonance(layout,[same]);
 const two=r.evaluateResonance(layout,[same,pair]);
 assert(one.quality>0&&one.quality<100);
 assert(two.symmetry>one.symmetry);
 assert(two.quality>one.quality);
 assert.equal(r.resonancePaletteAffinity(10,10,10,10),1);
 assert.equal(r.resonanceGroupAffinity(2,3),.82);
 assert.equal(r.resonanceGroupAffinity(4,5),.82);
 assert.equal(r.resonanceFalloff(2,{reach:1}),0);
 assert(r.resonanceFalloff(2,{reach:2})>0);
 const recolored=[same,pair].map(p=>({...p,number:1,
  paletteRow:0,paletteCol:0}));
 const altered=r.evaluateResonance(layout,recolored);
 assert.equal(altered.graph,two.graph);
 assert.equal(altered.symmetry,two.symmetry);
 assert.notEqual(altered.local,two.local,
  "Geometry must no longer double-count saturation/Chromatica");
 const other=layout.cells.find(c=>c.ring>0&&
  c.key!==same.key&&c.key!==pair.key);
 assert(other);
 assert(r.evaluateResonance(layout,
  [...recolored,{...recolored[0],key:other.key}]).symmetry<
  altered.symmetry,"Asymmetric extra pawn disrupts structural harmony");
 assert.throws(()=>r.evaluateResonance(layout,[same,same]),/one Polytron per cell/);
 assert.throws(()=>r.evaluateResonance(layout,[{...same,key:"invalid"}]),
  /outside/);
 assert.deepEqual(two,r.evaluateResonance(layout,[same,pair]));
 assert.equal(two.totalEnergy,
  r.resonanceEnergy(same.number)+r.resonanceEnergy(pair.number));
 assert(r.resonanceEnergy(1)>0);
 assert.equal(r.resonanceReward(layout,0),0);
 assert(r.resonanceReward(layout,100)>r.resonanceReward(layout,50));
 const economics=r.resonanceEconomics(layout,[same,pair]);
 assert.deepEqual(Object.keys(economics).sort(),
  ["efficiency","energy","pieces","quality","reward"].sort(),
  "No spent/upkeep/net fields may masquerade as an economic loss");
 assert.equal(economics.energy,two.totalEnergy);
 assert.equal(economics.reward,r.resonanceReward(layout,two.quality));
 assert.equal(economics.efficiency,economics.reward/economics.energy);
 assert.equal(r.resonanceEconomics(layout,[]).reward,0);
 assert.equal(r.resonanceEconomics(layout,[]).energy,0);
 assert.equal(r.resonanceEconomics(layout,[]).efficiency,null);

 const report=d.analyzeResonanceDifficulty(layout,22,{reach:2});
 assert.equal(report.method,"bounded-greedy-estimate");
 assert.equal(report.bands.length,4);
 assert(report.baselineSolution.length>0);
 assert.equal(report.energy,report.baselineSolution.reduce(
  (total,p)=>total+r.resonanceEnergy(p.number),0));
 assert.deepEqual(report.scenarios.map(x=>x.id),
  ["quality","efficient","literal","unplanned","incompatible"]);
 for(const scenario of report.scenarios){
  assert(scenario.energy<=scenario.budget,"Capacity is a hard boundary");
  assert.equal(scenario.energy,scenario.placements.reduce(
   (total,p)=>total+r.resonanceEnergy(p.number),0));
  const exact=r.evaluateResonance(layout,scenario.placements,{reach:2});
  assert(Math.abs(scenario.quality-exact.quality)<1e-9);
  assert.equal(scenario.reward,r.resonanceReward(layout,scenario.quality));
  assert.equal(scenario.efficiency,
   scenario.energy?scenario.reward/scenario.energy:null);
  assert(!("spent" in scenario)&&!("upkeep" in scenario)&&
   !("net" in scenario),"Costs are not part of the current game");
 }
 for(let i=0;i<report.bands.length;i++){
  const band=report.bands[i];
  assert(band.energy<=band.budget);
  assert(band.score>=0&&band.score<=100);
  assert.equal(band.reward,r.resonanceReward(layout,band.score));
  assert.equal(band.efficiency,
   band.energy?band.reward/band.energy:null);
  if(i)assert(band.score>=report.bands[i-1].score,
   "Increasing capacity must not lower the best feasible frontier");
 }
 const risk=report.placementRisk;
 assert(risk.placementsSampled>0);
 assert(risk.lowYieldPlacements>=0&&
  risk.lowYieldPlacements<=risk.placementsSampled);
 assert(risk.worseningPlacements>=0&&
  risk.worseningPlacements<=risk.placementsSampled);
 assert.equal(risk.relocationsSampled,0,"Empty board has no relocation");
 const withPawns=d.analyzeResonanceDifficulty(layout,22,{reach:2},[same,pair]);
 assert(withPawns.placementRisk.relocationsSampled>0);
 if(withPawns.nextMove){
  assert.equal(withPawns.nextMoveEnergy,
   r.resonanceEnergy(withPawns.nextMove.number));
  assert.equal(withPawns.nextMoveYield,
   withPawns.nextMoveRewardGain/withPawns.nextMoveEnergy);
 }
 assert(names.sealName(1)!=="—"&&names.sealName(2)!=="—");
 assert.notEqual(names.sealName(1),names.sealName(2));
 assert.equal(numbers.dnaFromPolitronNumber(2),"C");

 const ui=await readFile("src/experiments/ResonancePlayground.tsx","utf8");
 const entry=await readFile("src/experiments/KaleidoscopeLab.tsx","utf8");
 const css=await readFile("src/experiments/ResonancePlayground.css","utf8");
 const analyzer=await readFile("src/experiments/ResonanceEconomicsPanel.tsx","utf8");
 const renderer=await readFile("src/experiments/PolytronPeriodicLab.tsx","utf8");
 assert(entry.includes("<ResonancePlayground layout={layout}"));
 assert(ui.includes("new Worker(")&&ui.includes("resonanceDifficulty.worker.ts"));
 assert(ui.includes("Risonanza locale")&&ui.includes("Armonia strutturale")&&
  ui.includes("Regole di risonanza")&&ui.includes("visual.graphResults.map"));
 assert(ui.includes("activeHint=candidate?tileByKey.get(candidate.key):undefined")&&
  ui.includes("Tile richiesto dal Mutatron")&&ui.includes("Numero polytronico")&&
  ui.includes("GROUP_LABELS[groupOf(activeHint.number)-1]"));
 assert(ui.includes("sealName(nextSeal)")&&ui.includes("name:selectedPawn!.name")&&
  ui.includes("seal:fromHome.seal,name:fromHome.name")&&
  ui.includes("Identità a Home")&&!ui.includes("72 Polytroni"));
 assert(ui.includes("Conferma piazzamento")&&ui.includes("Cancella piazzamento")&&
  ui.includes("Annulla spostamento")&&ui.includes("Annulla richiamo"));
 const cancel=ui.slice(ui.indexOf("const cancelPending=()=>"),
  ui.indexOf("const commit=()=>"));
 assert(!cancel.includes("setTreasury")&&!cancel.includes("setPawns"));
 const commit=ui.slice(ui.indexOf("const commit=()=>"),
  ui.indexOf("const sell=()=>"));
 const sell=ui.slice(ui.indexOf("const sell=()=>"),
  ui.indexOf("const reset=()=>"));
 const advance=ui.slice(ui.indexOf("const advance=(submit:boolean)=>"),
  ui.indexOf("const claim=()=>"));
 const reset=ui.slice(ui.indexOf("const reset=()=>"),
  ui.indexOf("const setBudget="));
 assert(!commit.includes("setTreasury"),
  "Manifestation/placement is free: no purchase debit");
 assert(!sell.includes("setTreasury"),
  "Home preserves energy without refund or loss");
 assert(!reset.includes("setTreasury"),
  "Moving all Polytrons Home does not mint energy");
 assert(advance.includes("const reward=submit?currentReward:0")&&
  advance.includes("if(reward)setTreasury(old=>old+reward)")&&
  !advance.includes("upkeep")&&!advance.includes("resonanceEnergy")&&
  !advance.includes("setTreasury(old=>old-")&&
  advance.includes("onEvolve()"),
  "Mutatron evolution is free; only an awarded commission earns energy");
 assert(ui.includes("occupiedEnergy+candidateEnergy<=treasury")&&
  ui.includes("freeEnergy=treasury-occupiedEnergy")&&
  ui.includes("Evolve senza presentare · gratuito"),
  "Energy must be reserved while deployed, never spent");
 assert(!ui.includes("Saldo del primo ciclo")&&
  !ui.includes("Costo obbligatorio ad ogni evoluzione")&&
  !ui.includes("Conferma acquisto"));
 assert(analyzer.includes("Energia impegnata")&&
  analyzer.includes("Ricompensa")&&analyzer.includes("Resa")&&
  analyzer.includes("lowYieldPlacements")&&
  analyzer.includes("worseningPlacements")&&
  !analyzer.includes("Acquisti iniziali")&&
  !analyzer.includes("Costo ogni Evolve"));
 assert(css.includes(".resonance-purchase-actions")&&
  css.includes(".resonance-cancel-purchase")&&
  css.includes("@media(max-width:530px)"));
 assert(renderer.includes("cell.dataset.kaleidoOpacity")&&
  renderer.includes("renderer.clearDepth()"));
 console.log("PASS Resonance conservation: no buy/move/evolve debits, "+
  "intrinsic E is reusable capacity, 5 budgeted strategies, "+
  "independent structural score, preserved Seal names, UI & worker.");
}finally{
 await rm(root,{recursive:true,force:true});
}
