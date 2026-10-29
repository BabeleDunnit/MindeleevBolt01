import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import React from "react";
import {renderToString} from "react-dom/server";
const temp=await mkdtemp(join(process.cwd(),".rapier-force-diag-"));
try{
 async function load(path,name){
  const outfile=join(temp,name+".mjs");
  await build({entryPoints:[path],outfile,bundle:true,format:"esm",platform:"node",
   tsconfig:"tsconfig.app.json",packages:"external",logLevel:"warning",
   define:{"import.meta.env.BASE_URL":JSON.stringify("/MindeleevBolt01/")}});
  return import(pathToFileURL(outfile).href);
 }
 const e=await load("src/experiments/PlanarRapierEngine.ts","engine");
 const c=await load("src/experiments/rapierCompatibility.ts","compatibility");
 const ui=await load("src/experiments/PlanarRapierLab.tsx","ui");
 const html=renderToString(React.createElement(ui.default));
 for(const label of ["Diagnostica delle forze","Solo transformer","Solo viaggiatori",
 "Solo Sorgente","Solo urti","Attrazione transformer","Richiamo della Sorgente",
 "Buffer Cubo","Forze istantanee sul viaggiatore","Compatibilità dei viaggiatori"]){
  assert(html.includes(label),"Missing Inspector diagnostics: "+label);
 }
 const blocked=c.cubeFusion("02C","01C","01C");
 assert.equal(blocked.state,"blocked");assert(blocked.reason.includes("nudi"));
 assert.equal(c.cubeFusion("02C","a01C","01C").product,"a01C");
 assert.equal(c.cubeFusion("02C","a01C","a02C").state,"blocked");
 assert.equal(c.cubeFusion("02C","a01C","a01T").state,"blocked");
 assert.equal(c.analyzeEncounter("02C","01C").state,"waiting");
 assert.equal(c.analyzeEncounter("02C","01C","01C").state,"blocked");
 assert.equal(c.analyzeEncounter("02O","01C").state,"blocked");
 assert.equal(c.analyzeEncounter("02T","01C").state,"ready");
 assert.equal(c.analyzeEncounter("k02T","01C").product,"k02C");
 assert.equal(c.analyzeEncounter("01I","02C").state,"blocked");
 assert.equal(c.analyzeEncounter("01I","01C").state,"pass");
 const all={transformers:true,travelers:true,source:true};
 const none={transformers:false,travelers:false,source:false};
 const presets=[
  ["all",all],["none",none],
  ["station", {...none,transformers:true}],["travelers",{...none,travelers:true}],
  ["source",{...none,source:true}]
 ];
 const results={};
 for(const [name,channels] of presets){
  const plan={...e.DEFAULT_PLAN,physics:"shape",forceChannels:channels};
  const world=await e.PlanarRapierEngine.create(plan);
  try{
   // Step 1: no reactions yet, compare force contributions under same seed.
   world.tick();
   const w=world.agentsView().find(x=>x.id==="v1");
   assert(w?.forces,"The selected traveler must expose actual applied forces");
   const d=w.forces;
   assert.equal(d.step,1);
   assert.equal(d.stations.length,6,"Even disabled station fields must remain inspectable");
   assert(d.stations.every(st=>st.compatibility.state==="ready"),
    "All 02T controllers should be able to recolor initial 01C travelers");
   assert(d.stations.every(st=>st.force.magnitude>=0));
   if(!channels.transformers){
    assert.equal(d.transformers.magnitude,0);
    assert(d.stations.every(st=>st.force.magnitude===0));
   }
   if(!channels.travelers)assert.equal(d.travelers.magnitude,0);
   if(!channels.source)assert.equal(d.source.magnitude,0);
   if(name==="all"||name==="station")assert(d.transformers.magnitude>0,
    "Station attraction should exist for the baseline");
   if(name==="all"||name==="travelers")assert(d.travelers.magnitude>0,
    "Particle pair spring should be measurable");
   results[name]={
    stations:d.transformers.magnitude,
    pairs:d.travelers.magnitude,source:d.source.magnitude,
    sampleCompatibility:d.stations[0].compatibility.state
   };
   // No force flag may modify the true collision geometry or horizontal plane.
   for(let i=0;i<240;i++)world.tick();
   assert(world.agentsView().every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y)&&Number.isFinite(a.z)));
  }finally{world.dispose();}
 }
 assert(results.none.stations===0&&results.none.pairs===0);
 assert(results.source.stations===0&&results.source.pairs===0);
 assert(results.station.pairs===0&&results.station.stations>0);
 assert(results.travelers.stations===0&&results.travelers.pairs>0);
 // physics OFF must not silently suppress the independent Source field.
 const off=await e.PlanarRapierEngine.create({...e.DEFAULT_PLAN,physics:"off",forceChannels:all});
 try{
  off.tick();const d=off.agentsView().find(x=>x.id==="v1").forces;
  assert.equal(d.transformers.magnitude,0);
  assert.equal(d.travelers.magnitude,0);
  assert.equal(d.stations.length,6);
 }finally{off.dispose();}
 // Full-Cube field gives a real buffer, not merely an aesthetic pileup.
 const everyCube=Object.fromEntries(["P01","P02","P03","P04","P05","P06"].map(id=>[id,"02C"]));
 const cube=await e.PlanarRapierEngine.create({...e.DEFAULT_PLAN,stationDNA:everyCube});
 try{
  let buffered=false;
  for(let i=0;i<950;i++){
   cube.tick();
   const stations=cube.agentsView().filter(x=>x.type==="controller"&&x.buffer);
   if(stations.length){
    buffered=true;
    for(const st of stations){
     assert(st.buffer.id.startsWith("v")&&st.buffer.remainingSteps>0);
     assert.equal(st.buffer.dna,"01C");
     assert.equal(c.analyzeEncounter(st.dna,"01C",st.buffer.dna).state,"blocked",
       "Cubo must report naked DNA as genetically incompatible despite attraction");
    }
    break;
   }
  }
  assert(buffered,"Real Rapier all-Cube setup should put a traveler into a station buffer");
 }finally{cube.dispose();}
 console.log(JSON.stringify({passed:true,forces:results,
  checks:["genetic compatibility independent of physics","three force toggles",
   "unmodified baseline","diagnostic station list while force disabled",
   "physics OFF comparison","actual Cubo buffer occupancy"]},null,2));
}finally{await rm(temp,{recursive:true,force:true});}
