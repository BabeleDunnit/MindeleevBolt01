import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import React from "react";
import {renderToString} from "react-dom/server";
const temp=await mkdtemp(join(process.cwd(),".multi-inspector-test-"));
const load=async(entry,name,ui=false)=>{
 const outfile=join(temp,name+".mjs");
 await build({entryPoints:[entry],outfile,bundle:true,format:"esm",platform:"node",
  packages:"external",tsconfig:"tsconfig.app.json",logLevel:"warning",
  ...(ui?{define:{"import.meta.env.BASE_URL":JSON.stringify("/MindeleevBolt01/")}}:{})});
 return import(pathToFileURL(outfile).href);
};
try{
 const [editor,core,ui]=await Promise.all([
  load("src/experiments/rapierMultiSelection.ts","editor"),
  load("src/experiments/PlanarRapierEngine.ts","engine"),
  load("src/experiments/PlanarRapierLab.tsx","ui",true)
 ]);
 assert.deepEqual(editor.chooseAgents(["P01"],"P02",true),["P01","P02"]);
 assert.deepEqual(editor.chooseAgents(["P01","P02"],"P01",true),["P02"]);
 assert.deepEqual(editor.chooseAgents(["P01","P02"],"v1",false),["v1"]);
 assert.deepEqual(editor.chooseAgents(["P01"],"",false),[]);
 const plan={...core.DEFAULT_PLAN,
  stationLayout:core.DEFAULT_PLAN.stationLayout.map(p=>({...p})),
  stationDNA:{...core.DEFAULT_PLAN.stationDNA}};
 const ids=plan.stationLayout.slice(0,2).map(s=>s.id),anchor=plan.stationLayout[0];
 const possible=[];
 for(let q=-4;q<=4;q++)for(let r=-4;r<=4;r++){
  const moved=editor.translateStations(plan.stationLayout,ids,anchor.id,{q,r});
  if(moved&&!(q===anchor.q&&r===anchor.r))possible.push(moved);
 }
 assert(possible.length>0,"At least one valid group translation must exist");
 const moved=possible[0];
 const dq=moved[0].q-anchor.q,dr=moved[0].r-anchor.r;
 for(const id of ids){
  const a=plan.stationLayout.find(p=>p.id===id),b=moved.find(p=>p.id===id);
  assert.equal(b.q-a.q,dq);assert.equal(b.r-a.r,dr);
 }
 assert.equal(editor.translateStations(plan.stationLayout,ids,anchor.id,{q:0,r:0}),null,
  "Group cannot cross the Source");
 assert.deepEqual(editor.withoutStations(plan.stationLayout,ids).length,4);
 assert.deepEqual(editor.withoutStations(plan.stationLayout,plan.stationLayout.map(s=>s.id)),[]);
 const html=renderToString(React.createElement(ui.default));
 const inspector=html.indexOf("Inspector · selezione Polytroni");
 const editorPos=html.indexOf("Editor transformer");
 assert(inspector>=0&&editorPos>=0&&inspector<editorPos,
  "Inspector should be the first right-column panel, above editor");
 for(const term of ["Multi-selezione dalla lista","Seleziona tutti i transformer",
  "Elimina selezionati","Pulisci Mutatron","Rilancia / Ripeti"]){
  assert(html.includes(term),"Missing Inspector action "+term);
 }
 const src=await readFile("src/experiments/PlanarRapierLab.tsx","utf8");
 for(const term of ["evt.shiftKey","evt.ctrlKey","evt.metaKey",
  "extraSelectionRings","translateStations(","withoutStations(","Applica DNA ai transformer selezionati"]){
  assert(src.includes(term),"Missing selection interaction "+term);
 }
 assert.equal((src.match(/setReplayKey\(/g)??[]).length,1,
  "Clearing transformers and editing selections must never replay travelers");

 const engine=await core.PlanarRapierEngine.create(plan);
 try{
  for(let i=0;i<10;i++)engine.tick();
  const first=engine.agentsView().filter(a=>a.type==="traveler");
  const step=engine.stepIndex;
  const noStations={...plan,stationLayout:[],stationDNA:{}};
  engine.updateLivePlan(noStations);
  assert.strictEqual(engine.stepIndex,step);
  assert.equal(engine.agentsView().filter(a=>a.type==="controller").length,0);
  const second=engine.agentsView().filter(a=>a.type==="traveler");
  assert.equal(second.length,first.length);
  for(let i=0;i<first.length;i++){
   assert.equal(first[i].id,second[i].id);
   for(const dim of ["x","y","z","vx","vy","vz","energy"])
    assert(Math.abs(first[i][dim]-second[i][dim])<1e-7,
     "Clear Mutatron changed live traveler "+dim);
  }
  engine.tick();
  assert.equal(engine.stepIndex,step+1);
  assert.equal(engine.agentsView().filter(a=>a.type==="controller").length,0);
 }finally{engine.dispose();}
 console.log("PASS sprint33b: Inspector top, multi-selection, group drag, bulk editing, Clear Mutatron");
}finally{await rm(temp,{recursive:true,force:true});}
