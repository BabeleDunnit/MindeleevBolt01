import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import React from "react";
import {renderToString} from "react-dom/server";

const temp=await mkdtemp(join(process.cwd(),".live-controls-test-"));
const load=async(entry,name,ui=false)=>{
 const path=join(temp,name+".mjs");
 await build({entryPoints:[entry],outfile:path,bundle:true,platform:"node",format:"esm",
  packages:"external",tsconfig:"tsconfig.app.json",logLevel:"warning",
  ...(ui?{define:{"import.meta.env.BASE_URL":JSON.stringify("/MindeleevBolt01/")}}:{})});
 return import(pathToFileURL(path).href);
};
const copy=p=>({...p,dynamics:{...p.dynamics},sizes:{...p.sizes},
 forceChannels:{...p.forceChannels},stationDNA:{...p.stationDNA},travelerDNA:{...p.travelerDNA}});
const close=(a,b)=>Math.abs(a-b)<1e-7;
try{
 const e=await load("src/experiments/PlanarRapierEngine.ts","engine");
 const ui=await load("src/experiments/PlanarRapierLab.tsx","ui",true);
 const html=renderToString(React.createElement(ui.default));
 assert(html.includes("Configurazione in diretta")&&html.includes("Prossima emissione"));
 assert(html.includes("Rilancia / Ripeti"));
 const source=await readFile("src/experiments/PlanarRapierLab.tsx","utf8");
 assert(source.includes("engine.updateLivePlan(plan)"));
 assert(source.includes("},[replayKey]);"),"Three/Rapier world must only reinitialize after replay");
 assert.equal((source.match(/setReplayKey\(/g)??[]).length,1,
  "Only Replay may explicitly start a new physical world");

 const engine=await e.PlanarRapierEngine.create(copy(e.DEFAULT_PLAN));
 try{
  for(let i=0;i<5;i++)engine.tick();
  const oldWorld=engine.world;
  const oldStep=engine.stepIndex,oldEvents=engine.events.length;
  const all=engine.agentsView();
  const initialTravelers=all.filter(a=>a.type==="traveler");
  const one=all.find(a=>a.id==="v1");
  const originalStation=all.find(a=>a.id==="P02").dna;
  assert.equal(originalStation,"02T");
  const changed=copy(engine.plan);
  changed.scenario="five";
  changed.count=12; changed.dna="a01C"; // Update existing DNA; NO 12-shot firing.
  changed.returnPalette=3;
  changed.dynamics.launchSpeed=8;
  changed.dynamics.planarDrag=1.26;
  changed.dynamics.restitution=.28;
  changed.dynamics.angularDamping=.71;
  changed.sizes={controller:.8,traveler:.32};
  changed.forceChannels={transformers:0,travelers:.025,source:0};
  engine.updateLivePlan(changed);
  assert.strictEqual(engine.world,oldWorld,"Rapier world replaced on control change");
  assert.equal(engine.stepIndex,oldStep,"Physics clock reset on control change");
  assert.equal(engine.agentsView().filter(a=>a.type==="traveler").length,initialTravelers.length,
   "Dropdown count fired additional travelers");
  assert.equal(engine.agentsView().find(a=>a.id==="P02").dna,"01C",
   "Six tetrahedra -> five Platonic verbs must update station P02 immediately");
  const updated=engine.agentsView().find(a=>a.id==="v1");
  assert.equal(updated.dna,"a01C","Global DNA dropdown must update the living cohort");
  for(const coordinate of ["x","y","z","vx","vy","vz"]){
   assert(close(updated[coordinate],one[coordinate]),
    "Changing sliders/dropdowns reset "+coordinate);
  }
  assert.equal(engine.plan.dynamics.planarDrag,1.26);
  assert.equal(engine.plan.forceChannels.travelers,.025);
  assert(engine.events.length>=oldEvents,"Events must not be reset");
  const bodiesBefore=engine.agentsView().filter(a=>a.type==="traveler").map(a=>a.id).sort();
  const config=copy(changed);
  config.dynamics.pairRestMin=2.2;
  config.forceChannels.travelers=0;
  engine.updateLivePlan(config);
  assert.equal(engine.stepIndex,oldStep);
  engine.tick();
  assert.equal(engine.agentsView().find(a=>a.id==="v1").forces.travelers.magnitude,0);
  assert.deepEqual(engine.agentsView().filter(a=>a.type==="traveler").map(a=>a.id).sort(),bodiesBefore);
  assert.equal(engine.stepIndex,oldStep+1);
  const overrides=copy(config);
  overrides.stationDNA.P02="k02T";
  overrides.travelerDNA.v1="01I";
  engine.updateLivePlan(overrides);
  assert.equal(engine.agentsView().find(a=>a.id==="P02").dna,"k02T");
  assert.equal(engine.agentsView().find(a=>a.id==="v1").dna,"01I");
  const unrelated=copy(overrides);
  unrelated.dynamics.pairDamping=.24;
  engine.updateLivePlan(unrelated);
  assert.equal(engine.agentsView().find(a=>a.id==="v1").dna,"01I",
   "An unrelated slider must not overwrite a manual DNA override");
  const last=copy(unrelated);
  last.scenario="color";last.stationDNA={};
  engine.updateLivePlan(last);
  assert.equal(engine.agentsView().find(a=>a.id==="P02").dna,"02T");
  assert.equal(engine.agentsView().filter(a=>a.type==="traveler").length,6);
  console.log("HOT UPDATE: clock",engine.stepIndex,"agents",engine.agentsView().length,
   "event log",engine.events.length,"scenario",engine.plan.scenario);
 }finally{engine.dispose();}
 // A true replay is a NEW engine and a new emission with the selected count.
 const fresh=copy(e.DEFAULT_PLAN);fresh.count=1;fresh.scenario="five";
 const replay=await e.PlanarRapierEngine.create(fresh);
 try{
  assert.equal(replay.stepIndex,0);
  assert.equal(replay.agentsView().filter(a=>a.type==="traveler").length,1);
  assert.equal(replay.agentsView().find(a=>a.id==="P02").dna,"01C");
 }finally{replay.dispose();}
 console.log("PASS sprint32: sliders and dropdowns live; only Replay re-emits travelers");
}finally{await rm(temp,{recursive:true,force:true});}
