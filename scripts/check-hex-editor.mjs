import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import React from "react";
import {renderToString} from "react-dom/server";
const root=await mkdtemp(join(process.cwd(),".hex-editor-test-"));
const load=async(entry,name,ui=false)=>{
 const out=join(root,name+".mjs");
 await build({entryPoints:[entry],outfile:out,platform:"node",format:"esm",bundle:true,
  packages:"external",tsconfig:"tsconfig.app.json",logLevel:"warning",
  ...(ui?{define:{"import.meta.env.BASE_URL":JSON.stringify("/MindeleevBolt01/")}}:{})});
 return import(pathToFileURL(out).href);
};
const clone=plan=>({...plan,stationLayout:plan.stationLayout.map(x=>({...x})),
 stationDNA:{...plan.stationDNA},travelerDNA:{...plan.travelerDNA},
 dynamics:{...plan.dynamics},forceChannels:{...plan.forceChannels},sizes:{...plan.sizes}});
const similar=(a,b)=>Math.abs(a-b)<1e-6;
try{
 const [engineModule,grid,ui]=await Promise.all([
  load("src/experiments/PlanarRapierEngine.ts","engine"),
  load("src/experiments/rapierHexGrid.ts","hex"),
  load("src/experiments/PlanarRapierLab.tsx","ui",true)
 ]);
 const html=renderToString(React.createElement(ui.default));
 assert(html.includes("Editor transformer")&&html.includes("griglia esagonale"));
 assert(html.includes("Inserisci in prima cella libera"));
 const source=await readFile("src/experiments/PlanarRapierLab.tsx","utf8");
 for(const term of ["Elimina questo transformer","onPlaceStation","onAddStation","pointermove",
  "pointerup","visibleHexGrid","engine.updateLivePlan(plan)"])
  assert(source.includes(term),"Missing UI integration "+term);
 assert(source.includes("},[replayKey]);"),"Changing the grid must not remount the scene");
 assert.equal((source.match(/setReplayKey\(/g)??[]).length,1,"Only Replay can reset the Rapier world");

 const original=clone(engineModule.DEFAULT_PLAN);
 assert.equal(original.stationLayout.length,6);
 assert(original.stationLayout.every(c=>grid.isEditableCell(c)));
 for(const cell of original.stationLayout){
  const {x,z}=grid.stationWorld(cell),snapped=grid.worldStationCell(x,z);
  assert.deepEqual(snapped,{q:cell.q,r:cell.r},"Grid snap must be exact");
 }
 assert(!grid.canPlaceStation(original.stationLayout,{q:0,r:0}),"No placement on Architron");
 assert(!grid.canPlaceStation(original.stationLayout,original.stationLayout[0]),"No double occupancy");
 assert(!grid.canPlaceStation(original.stationLayout,{q:7,r:0}),"Limit to available rings");

 const world=await engineModule.PlanarRapierEngine.create(original);
 try{
  for(let i=0;i<9;i++)world.tick();
  const step=world.stepIndex,worldPointer=world.world;
  const travelers=world.agentsView().filter(a=>a.type==="traveler");
  const stations=world.agentsView().filter(a=>a.type==="controller");
  assert.equal(stations.length,6);
  const beforePositions=new Map(travelers.map(a=>[a.id,a]));
  assert(stations.every(a=>a.cell&&Number.isInteger(a.cell.q)));
  const moved=clone(original);
  const target=grid.visibleHexGrid().find(p=>grid.canPlaceStation(moved.stationLayout,p));
  assert(target,"A free grid cell must exist");
  moved.stationLayout[0]={...moved.stationLayout[0],q:target.q,r:target.r};
  world.updateLivePlan(moved);
  assert.equal(world.stepIndex,step);
  assert.strictEqual(world.world,worldPointer);
  const current=world.agentsView();
  const movedStation=current.find(a=>a.id==="P01");
  assert.equal(movedStation.cell.q,target.q);
  assert.equal(movedStation.cell.r,target.r);
  const destination=grid.stationWorld(target);
  assert(similar(movedStation.x,destination.x)&&similar(movedStation.z,destination.z));
  for(const a of current.filter(a=>a.type==="traveler")){
   const prior=beforePositions.get(a.id);
   for(const field of ["x","z","vx","vz","y","vy","energy"])
    assert(similar(a[field],prior[field]),"Editing transformer changed traveler "+field);
  }
  const added=clone(moved);const target2=grid.visibleHexGrid().find(p=>
   grid.canPlaceStation(added.stationLayout,p));
  added.stationLayout.push({id:grid.nextStationId(added.stationLayout),
   q:target2.q,r:target2.r});
  added.stationDNA.P07="k02T";
  world.updateLivePlan(added);
  assert.equal(world.agentsView().filter(a=>a.type==="controller").length,7);
  assert.equal(world.agentsView().find(a=>a.id==="P07").dna,"k02T");
  assert.equal(world.stepIndex,step);
  const removed=clone(added);removed.stationLayout=removed.stationLayout.filter(x=>x.id!=="P02");
  world.updateLivePlan(removed);
  assert.equal(world.agentsView().filter(a=>a.type==="controller").length,6);
  assert(!world.agentsView().find(a=>a.id==="P02"));
  assert.equal(world.agentsView().filter(a=>a.type==="traveler").length,6);
  assert.equal(world.stepIndex,step);
  const next=clone(removed);next.scenario="five";next.stationDNA={P07:"01C"};
  world.updateLivePlan(next);
  assert.equal(world.agentsView().find(a=>a.id==="P03").dna,"02O");
  assert.equal(world.agentsView().find(a=>a.id==="P07").dna,"01C");
  const invalid=clone(next);invalid.stationLayout[0]={...invalid.stationLayout[0],q:0,r:0};
  assert.throws(()=>world.updateLivePlan(invalid),/Cella/);
  assert.equal(world.stepIndex,step,"Invalid edit must not advance time");
  world.tick();
  assert(world.agentsView().every(a=>[a.x,a.y,a.z].every(Number.isFinite)));
  console.log("GRID EDIT TEST:",JSON.stringify({steps:world.stepIndex,
   controllerCount:world.agentsView().filter(a=>a.type==="controller").length,
   travelerCount:world.agentsView().filter(a=>a.type==="traveler").length}));
 }finally{world.dispose();}
 console.log("PASS sprint33 axial snapping, occupancy, live move/add/delete, retained traveling state");
}finally{await rm(root,{force:true,recursive:true});}
