import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
const temp=await mkdtemp(join(process.cwd(),".planar-rapier-test-"));
try{
 const outfile=join(temp,"test-engine.mjs");
 await build({entryPoints:["src/experiments/PlanarRapierEngine.ts"],outfile,platform:"node",format:"esm",
  bundle:true,packages:"external",tsconfig:"tsconfig.app.json",logLevel:"warning"});
 const e=await import(pathToFileURL(outfile).href);
 const mass=1,period=2.5,z=.3,coef=e.springCoefficients(mass,period,z);
 assert(Math.abs(coef.stiffness-(2*Math.PI/period)**2)<1e-9);
 assert(Math.abs(coef.damping-2*z*2*Math.PI/period)<1e-9);
 assert.equal(e.DEFAULT_PLAN.count,6);
 const start=Date.now(),runs=[];
 for(const [scenario,count] of [["color",6],["five",6],["quiet",1]]){
  const plan={...e.DEFAULT_PLAN,scenario,count};
  const engine=await e.PlanarRapierEngine.create(plan);
  try{
   let initial=engine.agentsView();
   assert.equal(initial.filter(x=>x.type==="controller").length,6,"all controllers present");
   assert.equal(initial.filter(x=>x.type==="traveler").length,count,"radial ring count");
   const nodes=initial.filter(x=>x.type==="controller");
   assert(nodes.every(n=>Math.abs(n.y-plan.dynamics.hoverHeight)<1e-6),"stations at sink plane");
   const travelers=initial.filter(x=>x.type==="traveler");
   const heading=travelers.map(t=>Math.atan2(t.vz,t.vx)).sort((a,b)=>a-b);
   if(count===6)for(let i=1;i<heading.length;i++)
    assert(Math.abs((heading[i]-heading[i-1])-2*Math.PI/6)<1e-7,"uniform radial launch");
   let finite=true;
   for(let i=0;i<1100;i++){
    engine.tick();
    if(i%100===0)for(const a of engine.agentsView()){
     finite&&=[a.x,a.y,a.z,a.qx,a.qy,a.qz,a.qw,a.vx,a.vy,a.vz].every(Number.isFinite);
    }
   }
   const summary=engine.stats();
   assert(finite,"positions/quaternions/velocities must be finite");
   assert(summary.peakSpeed>1.0,"real outward motion is present");
   assert(summary.peakHeight<5,"hover confinement; no free 3D escape");
   assert(summary.impacts>=0);
   assert(Math.abs(summary.inputEnergy-(summary.returnedEnergy+summary.escapedEnergy+
     summary.carriedEnergy))<1e-5,"carrier ENERGY transfers must balance in no-harvest model");
   assert(engine.events.every(evt=>evt.step>=0&&typeof evt.kind==="string"));
   runs.push({scenario,count,peakHeight:summary.peakHeight,impactEvents:summary.impacts,
    geneticChanges:summary.geneticChanges,returns:summary.returns,active:summary.active,
    elapsedSteps:summary.step});
  }finally{engine.dispose();}
 }
 // The Mutatron has free 3D impulse response, but a stable ~1m plane.
 const hover=await e.PlanarRapierEngine.create({...e.DEFAULT_PLAN,scenario:"quiet",count:1,
  physics:"off",dynamics:{...e.DEFAULT_PLAN.dynamics,launchSpeed:0,attraction:0,pairSpring:0}});
 try{
  hover.world.forEachRigidBody(body=>{
   if(body.isDynamic())body.setTranslation({x:.65,y:3.3,z:.35},true);
  });
  for(let i=0;i<850;i++)hover.tick();
  const lone=hover.agentsView().find(a=>a.type==="traveler");
  assert(lone,"hover test body should still be in the Mutatron");
  assert(Math.abs(lone.y-e.SINK_HEIGHT)<.12,
   "Vertical recovery must return an airborne traveler to horizontal sink plane");
 }finally{hover.dispose();}
 console.log("RADIAL DIAGNOSTICS",JSON.stringify(runs));
 assert(runs[0].impactEvents>0,"radial color demonstration must reach real 3D colliders");
 assert(runs[0].geneticChanges>0,"color station must alter genomes on actual Rapier contacts");
 console.log("PASS real Rapier 3D WASM planar constraints, radial symmetry, contacts, mutations, finite energy and stable motion");
 console.log(JSON.stringify({runs,elapsedMillis:Date.now()-start},null,2));
}finally{await rm(temp,{recursive:true,force:true});}
