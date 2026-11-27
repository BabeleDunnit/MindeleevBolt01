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
 const [k,r,d,names,numbers,dance]=await Promise.all([
  load("src/polytron/kaleidoscopeGenerator.ts","generator"),
  load("src/polytron/resonanceField.ts","resonance"),
  load("src/polytron/resonanceDifficulty.ts","difficulty"),
  load("src/polytron/spectralFutures.ts","names"),
  load("src/polytron/politronicNumber.ts","numbers"),
  load("src/polytron/polytronDance.ts","dance")
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
 assert.equal(r.resonanceGroupAffinity(2,3),.07);
 assert.equal(r.resonanceGroupAffinity(4,5),.07);
 assert.equal(r.resonanceGroupAffinity(2,7),1);
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

 const dancers=[
  {...same,seal:1,name:"A"},
  {...pair,seal:2,name:"B"}
 ];
 const evolved=k.generateKaleidoscope({...layout.params,generation:1},layout);
 const danced=dance.polytronDance(evolved,dancers,{reach:2});
 const dancedAgain=dance.polytronDance(evolved,dancers,{reach:2});
 assert.deepEqual(danced,dancedAgain,"Dance must be deterministic");
 assert.equal(danced.pawns.length,dancers.length);
 assert.equal(new Set(danced.pawns.map(p=>p.key)).size,dancers.length);
 assert.deepEqual(danced.pawns.map(p=>[p.seal,p.name,p.number,p.paletteRow,p.paletteCol]).sort(),
  dancers.map(p=>[p.seal,p.name,p.number,p.paletteRow,p.paletteCol]).sort(),
  "Dance must not mutate identity, group, period or palette");
 assert.equal(r.scoreResonance(evolved,danced.pawns).totalEnergy,
  r.scoreResonance(evolved,dancers).totalEnergy);
 assert(danced.moved>=1,"Dance must visibly move at least one of two Polytrons");
 assert.deepEqual(danced.pawns.map(p=>p.seal),dancers.map(p=>p.seal));
 assert(["target","relaxed","fallback"].includes(danced.status));
 if(danced.status==="target"){
  assert(danced.afterReward-danced.beforeReward<=0);
  assert(danced.afterReward-danced.beforeReward>=-1);
  assert(danced.afterSymmetry>=danced.beforeSymmetry,
   "A safe Dance should preserve or increase symmetry");
 }
 const single=dance.polytronDance(evolved,[dancers[0]],{reach:2});
 assert.equal(single.moved,1,"A lone Polytron must also move on Evolve");
 assert.notEqual(single.pawns[0].key,dancers[0].key);
 assert.equal(single.pawns[0].number,dancers[0].number);
 assert.equal(single.pawns[0].seal,dancers[0].seal);
 assert.equal(single.pawns[0].paletteRow,dancers[0].paletteRow);
 for(const symmetry of ["D6","C6","C3","C2"]){
  const scenario=k.generateKaleidoscope({
   radius:2,family:"metatron",symmetry,seed:0,generation:1
  });
  const a=scenario.cells.find(c=>c.ring===1);
  const b=scenario.cells.find(c=>c.ring===2);
  assert(a&&b);
  const sample=[
   {...dancers[0],key:a.key},
   {...dancers[1],key:b.key}
  ];
  const result=dance.polytronDance(scenario,sample,{reach:2});
  assert(result.moved>0,"Dance must move an ordinary two-Pawn board for "+symmetry);
  assert.equal(new Set(result.pawns.map(p=>p.key)).size,2);
  assert.equal(r.scoreResonance(scenario,result.pawns).totalEnergy,
   r.scoreResonance(scenario,sample).totalEnergy);
  if(result.status==="target")
   assert(result.afterReward-result.beforeReward>=-1&&
    result.afterReward-result.beforeReward<=0);
 }
 assert.equal(dance.polytronDance(evolved,[],{reach:2}).moved,0);
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
  ui.includes("Portata di risonanza")&&ui.includes("visual.graphResults.map"));
 assert(ui.includes("activeHint=candidate?tileByKey.get(candidate.key):undefined")&&
  ui.includes("Tile richiesto dal Mutatron")&&ui.includes("Numero polytronico")&&
  ui.includes("GROUP_LABELS[groupOf(activeHint.number)-1]"));
 assert(ui.includes("sealName(nextSeal)")&&ui.includes("name:selectedPawn!.name")&&
  ui.includes("seal:fromHome.seal,name:fromHome.name")&&
  ui.includes("Identità a Home")&&!ui.includes("72 Polytroni"));
 assert(ui.includes("polytronDance(layout,pawns,settings)")&&
  ui.includes("Conferma modifica di #")&&ui.includes("editFits")&&
  ui.includes("Gruppo")&&ui.includes("Periodo")&&
  ui.includes("resonance-board-editor")&&
  ui.indexOf("resonance-board-editor")<ui.indexOf("resonance-legend"),
  "The selected Pawn editor must appear immediately beneath the board");
 assert(css.includes(".resonance-board-editor .resonance-edit-grid select"),
  "The on-board editor must style editable controls");
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
 assert(ui.includes("committedEnergy+candidateEnergy<=treasury")&&
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
 const boardHeaderOpen=ui.indexOf('<div className="resonance-stage-head">');
 const reachControl=ui.indexOf('id="resonance-reach"');
 const reachLabel=ui.indexOf('htmlFor="resonance-reach"');
 const freeMetric=ui.indexOf('<small>Energia libera</small>');
 const committedMetric=ui.indexOf('<small>Energia impegnata in plancia</small>');
 const sidebarOpen=ui.indexOf('<aside className="kaleido-controls resonance-sidebar">');
 assert(boardHeaderOpen>=0&&reachControl>boardHeaderOpen&&reachControl<sidebarOpen&&
  reachLabel>boardHeaderOpen&&reachLabel<sidebarOpen,
  "Resonance reach must be controlled from the Mutatron header");
 assert((ui.match(/id="resonance-reach"/g)||[]).length===1&&
  !ui.includes('resonance-rules'),
  "Remove the old Resonance rules panel and duplicate reach dropdown");
 assert(committedMetric>boardHeaderOpen&&committedMetric<sidebarOpen&&
  freeMetric>committedMetric&&freeMetric<sidebarOpen&&
  ui.includes('<strong>{freeEnergy} E')&&
  ui.includes('forecastScore&&<em> → {forecastFree} E</em>'),
  "Committed and free ENERGY must have equal headline status and forecasts");
 const sidebarClose=ui.indexOf('  </aside>',sidebarOpen);
 const analyzerOpen=ui.indexOf('<section className="kaleido-control-block resonance-analysis resonance-analysis-summary">');
 const strategiesOpen=ui.indexOf('resonance-analysis-strategies');
 const frontierOpen=ui.indexOf('resonance-analysis-frontier');
 const risksOpen=ui.indexOf('resonance-analysis-risks');
 const forecastOpen=ui.indexOf('<section className="kaleido-control-block resonance-forecast">');
 const metricsOpen=ui.indexOf('<section className="kaleido-control-block resonance-metrics">');
 const boardAction=ui.indexOf('className="resonance-board-action-panel"');
 const stageMarkup=ui.slice(boardHeaderOpen,sidebarOpen);
 const forecastMarkup=ui.slice(forecastOpen,metricsOpen);
 assert(boardAction>0&&boardAction<sidebarOpen&&
  stageMarkup.includes('!moveFrom&&candidate&&activePosition')&&
  stageMarkup.includes('Conferma piazzamento')&&
  !stageMarkup.includes('Conferma spostamento'),
  "Board actions are for placement/recall, not for moving a Polytron");
 assert(forecastMarkup.includes('resonance-move-actions')&&
  forecastMarkup.includes('Conferma spostamento')&&
  forecastMarkup.includes('Annulla spostamento')&&
  forecastMarkup.includes('disabled={!pinnedCandidate||!canPlace}')&&
  forecastMarkup.includes('onClick={commit}')&&
  forecastMarkup.includes('onClick={cancelPending}'),
  "Move confirm and cancel belong in the Polytron movement panel");
 assert(analyzerOpen>sidebarOpen&&analyzerOpen<sidebarClose,
  "Difficulty Analyzer must stay inside the sidebar, not under the Mutatron");
 assert(strategiesOpen>analyzerOpen&&strategiesOpen<sidebarClose&&
  frontierOpen>strategiesOpen&&risksOpen>frontierOpen&&risksOpen<sidebarClose,
  "Summary, strategies, frontier and risks must be four sidebar cards");
 assert(ui.includes('section="strategies"')&&ui.includes('section="frontier"')&&
  ui.includes('section="risks"')&&
  analyzer.includes('section==="strategies"')&&
  analyzer.includes('section==="frontier"')&&
  analyzer.includes('section==="risks"'),
  "All analyzer features must remain available, separated by panels");
 assert(!forecastMarkup.includes('Conferma piazzamento')&&
  !forecastMarkup.includes('Conferma richiamo'),
  "Forecast card must not duplicate placement or Home recall buttons");
 assert(ui.includes("const activeCell=previewKey??hoverKey;")&&
  ui.includes("pinnedCandidate")&&ui.includes("onClick={commit}")&&
  ui.includes("onClick={cancelPending}"),
  "Click must pin the drop target for reachable on-board confirm/cancel");
 assert(ui.includes("Saldo ENERGY attuale")&&
  ui.includes("Energia impegnata in plancia")&&
  ui.includes("Ricompensa se presenti")&&
  ui.includes("forecastReward")&&
  ui.includes("treasury+(forecastReward??currentReward)")&&
  ui.includes("forecastCommitted"),
  "Board header must distinguish treasury, committed capacity and predicted reward");
 assert(css.includes(".resonance-purchase-actions")&&
  css.includes(".resonance-cancel-purchase")&&
  css.includes(".resonance-head-energy")&&
  css.includes(".resonance-lab .resonance-sidebar>.resonance-analysis")&&
  !css.includes(".resonance-lab>.resonance-analysis{")&&
  css.includes("@media(max-width:530px)"));
 assert(css.includes("grid-template-columns:minmax(0,1fr)")&&
  css.includes("grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr))")&&
  css.includes("grid-column:1;width:100%;min-width:0;max-width:none")&&
  css.includes("resonance-forecast .resonance-move-actions"),
  "The Mutatron header must stretch across its full width with responsive ENERGY cards");
 assert(css.includes("column-width:270px;column-count:3")&&
  css.includes("display:inline-block;vertical-align:top")&&
  css.includes("break-inside:avoid-column")&&
  css.includes("resonance-head-reach select")&&
  !css.includes("grid-row:2 / span 2")&&
  !css.includes("grid-row:3;")&&
  !css.includes(".resonance-lab .resonance-sidebar{\n display:grid;"),
  "Sidebar cards must reflow vertically rather than reserve rigid grid rows");
 const economicsCss=await readFile("src/experiments/ResonanceEconomicsPanel.css","utf8");
 assert(economicsCss.includes(".resonance-econ-scenarios")&&
  economicsCss.includes(".resonance-econ-frontier")&&
  economicsCss.includes(".resonance-econ-risks")&&
  css.includes(".resonance-lab .resonance-sidebar .resonance-analysis .resonance-econ-scenarios"),
  "Analyzer comparisons must fit within separate compact sidebar cards");
 assert(renderer.includes("cell.dataset.kaleidoOpacity")&&
  renderer.includes("renderer.clearDepth()"));
 console.log("PASS Resonance conservation: no buy/move/evolve debits, "+
  "intrinsic E is reusable capacity, 5 budgeted strategies, "+
  "independent structural score, preserved Seal names, UI & worker.");
}finally{
 await rm(root,{recursive:true,force:true});
}
