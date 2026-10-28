import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
const dir=await mkdtemp(join(process.cwd(),".island-check-"));
try{
 const outfile=join(dir,"engine.mjs");
 await build({entryPoints:["src/experiments/IslandAffinityEngine.ts"],outfile,
  tsconfig:"tsconfig.app.json",bundle:true,format:"esm",platform:"node",packages:"external",logLevel:"warning"});
 const e=await import(pathToFileURL(outfile).href);
 assert.deepEqual(e.VERBS,{T:"colora",C:"combina",O:"scinde",D:"clona",I:"seleziona"});
 assert.equal(e.decode("k02T").ops,"k");
 assert.throws(()=>e.decode("i02T"),/non valido/);
 assert.equal(e.wrapDNA("01C","a"),"a01C");
 assert.equal(e.wrapDNA("01C","k"),"k01C");
 assert.notEqual(e.wrapDNA("01C","a"),e.wrapDNA("01C","k"),"T operators must produce different DNA");
 assert.equal(e.cutDNA("01C",.5),null);
 assert.equal(e.cutDNA("a01C",.5),null);
 assert.deepEqual(e.cutDNA("ad01C",.45),["a01C","d01C"]);
 assert.deepEqual(e.cutDNA("adk01C",.1),["a01C","dk01C"]);
 assert.deepEqual(e.cutDNA("adk01C",.9),["ad01C","k01C"]);
 const rng=e.randomGenerator(2913),rng2=e.randomGenerator(2913);
 assert.deepEqual(Array.from({length:8},()=>rng()),Array.from({length:8},()=>rng2()));
 const ca=e.affinity("01C","01C"),cb=e.affinity("01C","01O");
 assert(ca.distance<1e-8&&ca.similarity>.999);
 assert(cb.distance>0.00001);
 assert.equal(e.affinity("01C","01O").distance,e.affinity("01O","01C").distance);
 const trial=e.initialIslands("R0");
 assert.equal(trial.nodes.length,6);
 assert.equal(new Set(trial.nodes.map(n=>n.id)).size,6);
 assert(trial.nodes.every(n=>n.known.includes(n.dna)));
 const results={};
 for(const scenario of ["R0","R1","R2","R3","R4"]){
  const setup=e.initialIslands(scenario);
  const modes=scenario==="R1"?["party","boids","hybrid"]:["party"];
  for(const mode of modes){
   setup.physics=mode;
   const run=e.runIslands(setup);
   assert(run.frames.length===241);
   assert(run.frames.every(f=>Math.abs(f.ledger.balance)<1e-6));
   assert.equal(run.frames[0].events.filter(x=>x.kind==="emit").length,setup.wave==="probe"?1:setup.count);
   assert(run.peak<=36);
   assert(run.events.every(ev=>Number.isFinite(ev.x)&&Number.isFinite(ev.y)));
   assert(run.frames.every(f=>f.walkers.every(w=>Number.isFinite(w.x)&&Number.isFinite(w.y)&&w.energy>=-1e-8)));
   assert(run.frames.every(f=>f.nodes.every(n=>n.dna===setup.nodes.find(x=>x.id===n.id).dna)));
   assert(run.summary.harvested<=setup.nodes.reduce((sum,n)=>sum+n.reserve,0)+1e-8);
   if(mode==="party")results[scenario]={peak:run.peak,returns:run.returnedCount,events:run.events.length,harvested:run.summary.harvested};
  }
 }
 const once=e.runIslands({...trial,wave:"probe",count:1});
 const radial=e.runIslands(trial);
 assert.equal(once.events.filter(x=>x.kind==="emit").length,1);
 assert.equal(radial.events.filter(x=>x.kind==="emit").length,6);
 const copy=e.runIslands(trial);
 assert.deepEqual(radial.events,copy.events,"identical experiment seed => identical history");
 // Force a close encounter with a named island, checking identity/repertoire.
 const base=e.initialIslands("R4");
 const close={...base,nodes:[{...base.nodes[0],dna:"a02T",x:54,y:31}],wave:"probe",emission:"01C"};
 const colored=e.runIslands(close);
 assert(colored.events.some(x=>x.kind==="color"),"T must alter phenotype/colour on contact");
 assert(colored.events.some(x=>x.kind==="learn"),"controller must learn without mutating its visible body");
 const change=e.runIslands({...close,nodes:[{...close.nodes[0],dna:"k02T"}]});
 assert(change.events.some(x=>x.kind==="color"));
 assert.notDeepEqual(colored.events.filter(x=>x.kind==="color").map(x=>x.after),
  change.events.filter(x=>x.kind==="color").map(x=>x.after),"T wrappers should affect DNA");
 const inert=e.runIslands({...close,nodes:[{...close.nodes[0],dna:"02O"}],emission:"01C"});
 assert(inert.events.some(x=>x.kind==="null"&&x.note.includes("Scissione impossibile")),"naked C split should be null");
 const split=e.runIslands({...close,nodes:[{...close.nodes[0],dna:"02O"}],emission:"ad01C"});
 assert(split.events.some(x=>x.kind==="split"),"O must truly split Conway ops");
 const clone=e.runIslands({...close,nodes:[{...close.nodes[0],dna:"02D"}]});
 assert(clone.events.some(x=>x.kind==="clone"),"D must clone carriers");
 const filter=e.runIslands({...close,nodes:[{...close.nodes[0],dna:"01I"}]});
 assert(filter.events.some(x=>x.kind==="filter"),"I must filter");
 console.log(JSON.stringify({passed:true,results,closeReturn:colored.returnedCount,
  closeEvents:colored.events.filter(x=>["color","return","learn"].includes(x.kind)).map(x=>x.kind)},null,2));
}finally{await rm(dir,{recursive:true,force:true});}
