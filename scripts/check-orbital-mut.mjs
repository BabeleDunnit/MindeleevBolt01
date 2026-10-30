import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import React from "react";
import {renderToString} from "react-dom/server";
const temp=await mkdtemp(join(process.cwd(),".orbital-test-"));
async function load(entry,name,ui=false){
 const outfile=join(temp,name+".mjs");
 await build({entryPoints:[entry],outfile,bundle:true,format:"esm",platform:"node",
  packages:"external",tsconfig:"tsconfig.app.json",logLevel:"warning",
  ...(ui?{define:{"import.meta.env.BASE_URL":JSON.stringify("/MindeleevBolt01/")}}:{})});
 return import(pathToFileURL(outfile).href);
}
const approx=(a,b,t=.01)=>Math.abs(a-b)<t;
const clone=p=>({...p,stationLayout:p.stationLayout.map(x=>({...x})),
 stationDNA:{...p.stationDNA},travelerDNA:{...p.travelerDNA},
 forceChannels:{...p.forceChannels},dynamics:{...p.dynamics},sizes:{...p.sizes},orbital:{...p.orbital}});
const single=(base,trigger)=>({...clone(base),count:1,
 stationLayout:[{...base.stationLayout[0]}],
 forceChannels:{transformers:1,travelers:0,source:0},
 orbital:{...base.orbital,motion:"gravity",trigger,gravity:3,softening:.4,
  launchRadius:1.7,influenceRadius:2.4,dwellSeconds:.4,revolutions:1},
 dynamics:{...base.dynamics,planarDrag:0}});
try{
 const [m,e,ui]=await Promise.all([
  load("src/experiments/orbitalMechanics.ts","mechanics"),
  load("src/experiments/PlanarRapierEngine.ts","engine"),
  load("src/experiments/PlanarRapierLab.tsx","ui",true)
 ]);
 const html=renderToString(React.createElement(ui.default,{initialMode:"gravity"}));
 for(const term of ["Orbital Mutatron","Gravità · orbite","Permanenza nel campo",
  "Rivoluzioni attorno al transformer","Preset · orbita singola","Pulisci Mutatron"])
  assert(html.includes(term),"Orbital lab missing UI control: "+term);
 const app=await readFile("src/App.tsx","utf8");
 assert(app.includes('experiment") === "orbital-mut"'));
 const view=await readFile("src/experiments/PlanarRapierLab.tsx","utf8");
 assert(view.includes("orbitCircles")&&view.includes("orbitTrails"),"Orbit path/field visualization missing");
 assert.equal((view.match(/setReplayKey\(/g)??[]).length,1,
  "Only user replay should re-emit travelers");
 const a=m.orbitalAcceleration(2,0,3,.4);
 const b=m.orbitalAcceleration(4,0,3,.4);
 assert(a.x>b.x&&b.x>0,"inverse-square force must weaken with distance");
 assert.equal(m.orbitalAcceleration(0,0,3,.4).x,0);
 assert(approx(m.circularOrbitSpeed(1.7,3,.4)**2/1.7,
  m.orbitalAcceleration(1.7,0,3,.4).x,1e-10),
  "Tangential launch must exactly balance softened radial acceleration");
 let track={...m.EMPTY_ORBITAL_TRACK};
 for(let i=0;i<=720;i++){
  const theta=2*Math.PI*i/720;
  track=m.orbitTrackStep(track,1.7*Math.cos(theta),1.7*Math.sin(theta),0,0,2.4,1/120);
 }
 assert(approx(track.revolutions,1,.005));
 assert(m.encounterReady(track,{...m.DEFAULT_ORBITAL,trigger:"orbits",revolutions:1}));
 assert.equal(m.orbitTrackStep(track,5,0,0,0,2.4,1/120).revolutions,0,
  "Leaving gravitational influence must reset the orbital encounter");
 const collisionPlan=single(e.DEFAULT_PLAN,"collision");
 const collision=await e.PlanarRapierEngine.create(collisionPlan);
 try{
  for(let i=0;i<1200;i++)collision.tick();
  const result=collision.agentsView().filter(a=>a.type==="traveler");
  assert.equal(result.length,1);
  assert.equal(result[0].dna,"01C","No collision should occur on a stable free orbit");
  assert.equal(collision.stats().geneticChanges,0);
 }finally{collision.dispose();}
 const dwellPlan=single(e.DEFAULT_PLAN,"dwell");
 const dwell=await e.PlanarRapierEngine.create(dwellPlan);
 try{
  for(let i=0;i<330;i++)dwell.tick();
  const last=dwell.agentsView().find(a=>a.id==="v1");
  assert(last);
  assert.equal(last.dna,"02C","Residence must recolor without collision");
  const contacts=dwell.events.filter(x=>x.subject==="v1"&&x.kind==="color");
  assert.equal(contacts.length,1,"Only one activation per uninterrupted influence passage");
  assert(contacts[0].note.includes("Permanenza"));
 }finally{dwell.dispose();}
 const orbitalPlan=single(e.DEFAULT_PLAN,"orbits");
 const orbital=await e.PlanarRapierEngine.create(orbitalPlan);
 try{
  const center=e.stationWorld?e.stationWorld(orbitalPlan.stationLayout[0]):null;
  const positions=[];
  for(let i=0;i<1440;i++){
   orbital.tick();
   if(i%120===0)positions.push(orbital.agentsView().find(a=>a.id==="v1"));
  }
  const traveler=orbital.agentsView().find(a=>a.id==="v1");
  assert(traveler,"Traveler must not escape a stable single-center orbit");
  assert.equal(traveler.dna,"02C","One revolution must activate T transformer");
  const reactions=orbital.events.filter(x=>x.kind==="color");
  assert.equal(reactions.length,1,"No repeated activation inside same field");
  assert(reactions[0].note.includes("Rivoluzioni"));
  const station=orbital.agentsView().find(a=>a.id==="P01");
  const distances=positions.map(p=>Math.hypot(p.x-station.x,p.z-station.z));
  const min=Math.min(...distances),max=Math.max(...distances);
  console.log("ORBIT RADIUS:",JSON.stringify({min,max,reactions:reactions.length,
   geneticChanges:orbital.stats().geneticChanges,step:orbital.stepIndex}));
  assert(min>1.15&&max<2.25,"Single-center orbit should stay bounded and not collide");
  assert.equal(orbital.stats().geneticChanges,1);
  const before=orbital.agentsView().find(a=>a.id==="v1"),step=orbital.stepIndex,world=orbital.world;
  const modified=clone(orbitalPlan);modified.orbital.gravity=0;
  modified.stationLayout=[];
  orbital.updateLivePlan(modified);
  const after=orbital.agentsView().find(a=>a.id==="v1");
  assert.strictEqual(orbital.world,world);
  assert.equal(orbital.stepIndex,step);
  for(const field of ["x","z","vx","vz","energy"])
   assert(approx(before[field],after[field],1e-6),"Hot edit changed "+field);
  orbital.tick();
  assert.equal(orbital.agentsView().filter(a=>a.type==="controller").length,0);
 }finally{orbital.dispose();}
 console.log("PASS sprint34: orbital physics, contact-free transformations, track reset, scene and live edit");
}finally{await rm(temp,{recursive:true,force:true});}
