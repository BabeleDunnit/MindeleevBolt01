import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import React from "react";
import {renderToString} from "react-dom/server";

const temp=await mkdtemp(join(process.cwd(),".shape-equilibrium-test-"));
const load=async(entry,name,base=false)=>{
 const outfile=join(temp,name+".mjs");
 await build({entryPoints:[entry],outfile,bundle:true,format:"esm",platform:"node",
  packages:"external",tsconfig:"tsconfig.app.json",logLevel:"warning",
  ...(base?{define:{"import.meta.env.BASE_URL":JSON.stringify("/MindeleevBolt01/")}}:{})});
 return import(pathToFileURL(outfile).href);
};
const close=(a,b,tolerance=1e-6)=>Math.abs(a-b)<=tolerance;
try{
 const e=await load("src/experiments/PlanarRapierEngine.ts","engine");
 const ui=await load("src/experiments/PlanarRapierLab.tsx","ui",true);
 const html=renderToString(React.createElement(ui.default));
 for(const phrase of ["Intensità delle forze","Equilibrio Shape-DNA",
  "Viaggiatori","Distanza desiderata","Smorzamento delle molle","Solo urti"]){
  assert(html.includes(phrase),"Missing equilibrium control: "+phrase);
 }
 assert(html.includes('type="number"'),"All sliders should expose editable numeric fields");
 assert.equal(e.desiredPairDistance(1,e.DEFAULT_DYNAMICS),e.DEFAULT_DYNAMICS.pairRestMin);
 assert(e.desiredPairDistance(0,e.DEFAULT_DYNAMICS)>e.desiredPairDistance(1,e.DEFAULT_DYNAMICS));
 const none={transformers:0,travelers:0,source:0};
 const zero=await e.PlanarRapierEngine.create({...e.DEFAULT_PLAN,forceChannels:none});
 try{
  zero.tick();
  const f=zero.agentsView().find(a=>a.id==="v1").forces;
  assert.equal(f.transformers.magnitude,0);
  assert.equal(f.travelers.magnitude,0);
  assert.equal(f.source.magnitude,0);
  assert.equal(f.pairs.length,5,"Pair distances remain inspectable even if attraction is zero");
  assert(f.pairs.every(p=>Number.isFinite(p.rest)&&p.rest>0&&p.force.magnitude===0));
 }finally{zero.dispose();}
 const readings=[];
 for(const k of [0.025,0.05]){
  const run=await e.PlanarRapierEngine.create({...e.DEFAULT_PLAN,
   forceChannels:{transformers:0,travelers:k,source:0}});
  try{
   run.tick();
   const force=run.agentsView().find(a=>a.id==="v1").forces;
   readings.push({resultant:force.travelers.magnitude,spring:force.pairs[0].spring});
   assert(force.pairs.every(p=>p.rest>0&&Number.isFinite(p.similarity)));
   const nearest=force.pairs[0];
   if(nearest.distance<nearest.rest-.02)
    assert(nearest.spring<0,"Below the Shape-DNA rest length the spring must repel");
   if(nearest.distance>nearest.rest+.02)
    assert(nearest.spring>0,"Beyond rest length the spring must attract");
  }finally{run.dispose();}
 }
 assert(readings[0].resultant>0&&readings[1].resultant>0);
 assert(close(readings[1].spring,readings[0].spring*2,1e-4),
  "The signed spring is continuously tunable at 0.025 (damping scales with sqrt(k))");
 const changed=await e.PlanarRapierEngine.create({...e.DEFAULT_PLAN,
  forceChannels:{transformers:0,travelers:1,source:0}});
 try{
  changed.tick();
  const initial=changed.agentsView().find(a=>a.id==="v1").forces.pairs[0];
  assert(changed.editDNA("v1","k01C"));
  changed.tick();
  const updated=changed.agentsView().find(a=>a.id==="v1").forces.pairs
   .find(p=>p.id===initial.id);
  assert(updated.rest>initial.rest,"Distinct geometric shapes must separate farther");
 }finally{changed.dispose();}
 const equilibrium=await e.PlanarRapierEngine.create({...e.DEFAULT_PLAN,scenario:"quiet",
  forceChannels:{transformers:0,travelers:1.25,source:0},
  dynamics:{...e.DEFAULT_DYNAMICS,launchSpeed:.65,planarDrag:1.35,
   pairRestMin:1.35,pairRestSpread:1.5,pairDamping:1.1}});
 try{
  for(let t=0;t<1800;t++)equilibrium.tick();
  const travelers=equilibrium.agentsView().filter(a=>a.type==="traveler"&&a.status==="flying");
  const speeds=travelers.map(t=>Math.hypot(t.vx,t.vz));
  const meanSpeed=speeds.reduce((a,b)=>a+b,0)/Math.max(1,speeds.length);
  let minSpacing=Infinity;
  for(let i=0;i<travelers.length;i++)for(let j=i+1;j<travelers.length;j++){
   minSpacing=Math.min(minSpacing,Math.hypot(travelers[i].x-travelers[j].x,
    travelers[i].z-travelers[j].z));
  }
  console.log("SETTLING METRICS:",JSON.stringify({count:travelers.length,minSpacing,meanSpeed}));
  assert.equal(travelers.length,6,"All six travelers should remain inside the reactor");
  assert(minSpacing>.45,"Swarm should not collapse to one point");
  assert(meanSpeed<.4,"After damping, traveling Polytrons should nearly stop");
  console.log("EQUILIBRIUM:",JSON.stringify({minSpacing,meanSpeed,
   positions:travelers.map(t=>({id:t.id,x:t.x,z:t.z}))}));
 }finally{equilibrium.dispose();}
 console.log("PASS sprint31 independent force strengths, precision 0.025, Shape-DNA separation and equilibrium");
}finally{await rm(temp,{recursive:true,force:true});}
