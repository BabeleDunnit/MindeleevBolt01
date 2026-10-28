import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {pathToFileURL} from "node:url";
const folder=await mkdtemp(join(tmpdir(),"mindeleev-return-"));
try{
 const entry=join(folder,"return.mjs");
 await build({entryPoints:["src/experiments/musicalReturnEngine.ts"],outfile:entry,
  tsconfig:"tsconfig.app.json",bundle:true,platform:"node",format:"esm",logLevel:"warning"});
 const {simulate,makeSetup,shapeResponse,euclideanEmissions,centerKey,siteByKey}=await import(pathToFileURL(entry).href);
 const zero=makeSetup(0);
 assert(zero.stations.length===3&&new Set(zero.stations.map(x=>x.id)).size===3);
 assert(zero.stations.every(s=>s.name.length>2&&s.dna.length>0));
 assert.deepEqual(euclideanEmissions(2),[0,4]);
 assert.deepEqual(euclideanEmissions(3),[0,3,6]);
 assert.equal(shapeResponse("C").turn,2);
 assert.equal(shapeResponse("T").turn,1);
 assert.equal(shapeResponse("aC").turn,1);
 assert.notEqual(zero.stations[0].sink,centerKey());
 const base=simulate(zero,"M0");
 assert(base.summary.returned>0,"M0 must demonstrate a returning carrier");
 assert(base.events.some(e=>e.kind==="return"),"M0 return event absent");
 assert(!base.events.some(e=>e.kind==="mutate"),"M0 must keep station DNA unchanged");
 assert(base.frames.at(-1).stations.every((s,i)=>s.dna===zero.stations[i].dna),"M0 station mutated");
 const mutation=simulate(zero,"M1");
 assert(mutation.events.some(e=>e.kind==="mutate"),"M1 requires mutation events");
 assert(mutation.frames.at(-1).stations.some(s=>s.dna==="aC"),"M1 must change geometry");
 assert(mutation.events.some(e=>e.kind==="encounter"&&e.before==="aC"),"second carrier must encounter mutated station");
 assert.deepEqual(mutation,simulate(zero,"M1"),"M1 must be deterministic");
 const music=simulate(zero,"M2");
 assert.deepEqual(music.frames,mutation.frames,"M1 and M2 must have identical physics");
 assert.deepEqual(music.events,mutation.events,"M2 audio must consume same event log");
 const photo=simulate(zero,"PHOTON");
 assert(photo.frames.at(-1).stations.every((s,i)=>s.dna===zero.stations[i].dna),"photons mutate stationary DNA");
 assert(photo.frames.some(f=>f.travelers.some(v=>v.kind==="photon")),"photon not emitted");
 assert(photo.events.some(e=>e.kind==="travel"),"photon continuous path missing");
 for(const pulse of [2,3])for(const mode of ["M0","M1","M2","PHOTON"]){
  const scenario={...zero,pulses:pulse};
  const run=simulate(scenario,mode);
  assert.equal(run.events.filter(e=>e.kind==="emit").length,pulse);
  assert(run.frames.every(f=>Math.abs(f.ledger.balance)<1e-6),mode+" broke conserved energy");
  assert(run.summary.unusedReserve>=-1e-9);
  assert(run.summary.returned<=run.summary.input+run.summary.fromReserve+1e-7);
  assert(run.summary.inFlight<1e-8,"simulation must settle");
  assert(run.summary.walletAfter<=12+run.summary.fromReserve+1e-8);
 }
 const moved={...zero,stations:zero.stations.map(s=>({...s}))};
 moved.stations[0].sink=siteByKey(moved.stations[2].sink).key;
 // Occupied cell must be rejected
 assert.throws(()=>simulate(moved,"M0"),/stesso sink/);
 const changed=makeSetup(1),other=simulate(changed,"M0");
 assert.notDeepEqual(base.events.map(x=>[x.kind,x.x,x.y]),other.events.map(x=>[x.kind,x.x,x.y]),
  "station DNA must change path");
 assert.equal(zero.stations[0].dna,"C","preview mutated source config");
 assert.throws(()=>simulate({...zero,injection:4},"M0"),/Iniezione/);
 console.log(JSON.stringify({ok:true,tests:["M0-return","M1-mutation-sequence","M2-identical-physics",
  "photon-continuous-control","euclidean-emit","geometry-turns","energy-conservation",
  "determinism","bounded-injection","station-identity","input-immutability"],results:{
    M0:base.summary,M1:mutation.summary,PHOTON:photo.summary,
    M1Mutations:mutation.events.filter(e=>e.kind==="mutate").length
  }},null,2));
}finally{await rm(folder,{recursive:true,force:true});}
