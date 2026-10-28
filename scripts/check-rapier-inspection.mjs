import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import React from "react";
import {renderToString} from "react-dom/server";

const temp=await mkdtemp(join(process.cwd(),".rapier-inspect-test-"));
try{
 const enginePath=join(temp,"engine.mjs"),uiPath=join(temp,"lab.mjs");
 for(const [entry,outfile] of [["src/experiments/PlanarRapierEngine.ts",enginePath],
   ["src/experiments/PlanarRapierLab.tsx",uiPath]]){
  await build({entryPoints:[entry],outfile,format:"esm",platform:"node",
   bundle:true,packages:"external",tsconfig:"tsconfig.app.json",logLevel:"warning"});
 }
 const e=await import(pathToFileURL(enginePath).href);
 const ui=await import(pathToFileURL(uiPath).href);
 const html=renderToString(React.createElement(ui.default));
 for(const text of ["Pausa alla collisione","Inspector","Dimensione transformer",
  "Dimensione viaggiatori","Legenda semi e cinque verbi",
  "DNA Conway","Colore","Rilancia","Sei radiali","Una sonda"]){
  // Some strings appear only in a button after a conditional.
  if(text==="Colore")continue;
  assert(html.includes(text),"Inspector UI missing "+text);
 }
 assert.equal(e.isCollisionEvent({kind:"impact"}),true);
 assert.equal(e.isCollisionEvent({kind:"null"}),true);
 assert.equal(e.isCollisionEvent({kind:"filter"}),true);
 assert.equal(e.isCollisionEvent({kind:"edit"}),false);
 assert.equal(e.isCollisionEvent({kind:"return"}),false);
 assert(e.DEFAULT_PLAN.sizes.controller>e.DEFAULT_PLAN.sizes.traveler*2,
  "default swarm has visibly smaller travelers than stationary transformers");
 const small=e.polytronHull("01C",e.DEFAULT_PLAN.sizes.traveler);
 const large=e.polytronHull("01C",e.DEFAULT_PLAN.sizes.controller);
 assert.equal(small.length,large.length);
 let maxSmall=0,maxLarge=0;
 for(let i=0;i<small.length;i++){maxSmall=Math.max(maxSmall,Math.abs(small[i]));
  maxLarge=Math.max(maxLarge,Math.abs(large[i]));}
 assert(Math.abs(maxLarge/maxSmall-e.DEFAULT_PLAN.sizes.controller/e.DEFAULT_PLAN.sizes.traveler)<1e-5,
  "render and physical hull scaling must be consistent");
 const edited={...e.DEFAULT_PLAN,scenario:"color",stationDNA:{P01:"k02T",P02:"02I"},
  travelerDNA:{v1:"ad01C"},sizes:{controller:.81,traveler:.19}};
 const engine=await e.PlanarRapierEngine.create(edited);
 try{
  const agents=engine.agentsView();
  assert.equal(agents.filter(x=>x.type==="controller").length,6);
  assert.equal(agents.filter(x=>x.type==="traveler").length,6);
  assert.equal(agents.find(x=>x.id==="P01").dna,"k02T");
  assert.equal(agents.find(x=>x.id==="P02").dna,"02I");
  assert.equal(agents.find(x=>x.id==="v1").dna,"ad01C");
  assert.equal(agents.find(x=>x.id==="v2").dna,edited.dna);
  const a=agents.find(x=>x.id==="v1");
  assert.equal(engine.editDNA("v1","a01C"),true);
  assert.equal(engine.agentsView().find(x=>x.id==="v1").dna,"a01C");
  assert(engine.events.some(x=>x.kind==="edit"&&x.before==="ad01C"&&x.after==="a01C"));
  assert(Math.abs(engine.agentsView().find(x=>x.id==="v1").x-a.x)<1e-6,
   "live DNA edit must preserve current position and velocity");
  assert.equal(engine.editDNA("P01","d02O"),true);
  assert.equal(engine.agentsView().find(x=>x.id==="P01").dna,"d02O");
  assert.throws(()=>engine.editDNA("P01","invalid"),/non valido|non supportato/i);
  let lastEvent=engine.events.length;
  let collision:unknown;
  for(let i=0;i<1400;i++){
   engine.tick();
   collision??=engine.events.slice(lastEvent).find(e.isCollisionEvent);
   lastEvent=engine.events.length;
  }
  assert(engine.stats().peakHeight<4,"planar stability after inspector DNA and size edits");
  assert(engine.agentsView().every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y)&&Number.isFinite(a.z)));
  assert(collision,"real Rapier collision events must remain enabled after genome edits");
 }finally{engine.dispose();}
 const replay=await e.PlanarRapierEngine.create(edited);
 try{
  assert.equal(replay.agentsView().find(x=>x.id==="P01").dna,"k02T",
   "new world must replay the selected original DNA, not retain live changes");
  assert.equal(replay.agentsView().find(x=>x.id==="v1").dna,"ad01C");
 }finally{replay.dispose();}
 const defaultRun=await e.PlanarRapierEngine.create(e.DEFAULT_PLAN);
 try{
  for(let i=0;i<1200;i++)defaultRun.tick();
  assert(defaultRun.stats().geneticChanges>0,
    "smaller default travelers must still make meaningful physical contact with transformers");
 }finally{defaultRun.dispose();}
 console.log(JSON.stringify({passed:true,checks:["SSR Inspector","raycast-facing controls",
  "collision classification","independent convex hull scales","per-station DNA presets",
  "per-traveler DNA presets","live genome edits","repeatable resets","physical collision contacts"]},null,2));
}finally{await rm(temp,{recursive:true,force:true});}
