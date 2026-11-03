import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import React from "react";
import {renderToString} from "react-dom/server";

const temp=await mkdtemp(join(process.cwd(),".spectral-test-"));
async function load(file,name,ui=false){
 const out=join(temp,name+".mjs");
 await build({entryPoints:[file],outfile:out,bundle:true,format:"esm",platform:"node",
  packages:"external",tsconfig:"tsconfig.app.json",logLevel:"warning",
  loader:{".css":"empty"},
  ...(ui?{define:{"import.meta.env.BASE_URL":JSON.stringify("/MindeleevBolt01/")}}:{})});
 return import(pathToFileURL(out).href);
}
const key=(d)=>d.q+","+d.r;
try{
 const [s,life,ui]=await Promise.all([
  load("src/polytron/spectralFutures.ts","engine"),
  load("src/polytron/mindeleevLife.ts","life"),
  load("src/experiments/MindeleevSpectralLab.tsx","ui",true)
 ]);
 assert.equal(s.SPECTRAL_SEALS,72);
 assert.equal(s.SEAL_NAMES.length,72);
 assert.equal(new Set(s.SEAL_NAMES).size,72,"Every individual needs a distinct stable name");
 assert(s.sealName(1).length>2);
 assert(s.sealName(72).length>2);
 assert.equal(s.PATTERNS.length,9);
 for(const m of [2,3,4,6]){
  const patterns=s.PATTERNS.filter(p=>p.length===m);
  assert.equal(patterns.length,({2:3,3:2,4:3,6:1})[m]);
  for(const mask of patterns){
   const board=new Map(mask.map((i,k)=>[
    key(life.HEX_DIRECTIONS[i]),{seal:k+1,number:6}
   ]));
   const state={board,budget:100-s.boardEnergy(board),generation:0,
    discovered:new Set([6])};
   assert.equal(s.invariantTotal(state),100);
   const reactions=s.findSpectralReactions(state).filter(r=>
    r.center==="0,0"&&r.kind==="fusion"&&r.count===m);
   assert(reactions.some(r=>r.mask.join(",")===mask.join(",")),
    "Missing orientation-invariant "+m+"-fold fusion for "+mask);
   const first=reactions.find(r=>r.mask.join(",")===mask.join(","));
   const projection=s.projectSpectralFuture(state,[first]);
   assert(projection,"Every recognised fusion must project atomically");
   const expected=6+5*(m-1);
   assert.equal(first.output,expected);
   assert.equal(first.delta,m*3-life.intrinsicEnergy(expected,0));
   assert.equal(projection.budget,state.budget+first.delta);
   assert.equal(s.boardEnergy(projection.board)+projection.budget,100);
   assert.equal(projection.board.get("0,0").number,expected);
   assert.equal(projection.departures.length,m);
   assert.equal(projection.arrivals.length,1);
   assert(s.populationInvariant({...state,board:projection.board,budget:projection.budget}));
  }
 }
 const corona=s.makeSpectralPreset("corona");
 const big=s.findSpectralReactions(corona).find(r=>r.center==="0,0"&&
  r.kind==="fusion"&&r.count===6);
 assert(big);
 assert.equal(big.output,31);
 assert.equal(big.reactantEnergy,18);
 assert.equal(big.productEnergy,8);
 assert.equal(big.delta,10);
 const completed=s.commitSpectralFuture(corona,s.projectSpectralFuture(corona,[big]));
 assert.equal(completed.board.size,1);
 assert.equal(completed.generation,1);
 assert.equal(s.invariantTotal(completed),100);
 assert.equal(new Set([...completed.board.values()].map(x=>x.seal)).size,1);
 const fissions=s.findSpectralReactions(completed).filter(r=>
  r.kind==="fission"&&r.center==="0,0");
 assert.equal(fissions.filter(r=>r.count===2).length,3);
 assert.equal(fissions.filter(r=>r.count===3).length,2);
 assert.equal(fissions.filter(r=>r.count===4).length,3);
 assert.equal(fissions.filter(r=>r.count===6).length,1);
 const reverse=fissions.find(r=>r.count===6);
 assert.equal(reverse.output,6);
 assert.equal(reverse.delta,-10);
 const unfolded=s.commitSpectralFuture(completed,s.projectSpectralFuture(completed,[reverse]));
 assert.equal(unfolded.board.size,6);
 assert.equal(unfolded.budget,corona.budget);
 assert.equal(s.invariantTotal(unfolded),100);
 assert(s.populationInvariant(unfolded));
 // A seal that returns home remains one of 72; it cannot also be recalled
 // in the same generation, even if this would be convenient.
 const returned=new Set([...unfolded.board.values()].map(p=>p.seal));
 assert.equal(returned.size,6);
 assert(!returned.has(completed.board.get("0,0").seal),
  "Returned seal cannot be reused in the same atomic fission");
 const overlap=s.makeSpectralPreset("interference");
 const both=s.findSpectralReactions(overlap).filter(r=>r.kind==="fusion"&&r.count===2);
 const x=both.find(r=>r.center==="1,0"),y=both.find(r=>r.center==="0,1");
 assert(x&&y,"The centre Polytron must have two competing 2→1 fusions");
 assert(x.cells.includes("0,0")&&y.cells.includes("0,0"));
 assert.equal(s.projectSpectralFuture(overlap,[x,y]),null,
  "One Polytron cannot be consumed twice in a realised future");
 const options=s.enumerateSpectralFutures(overlap,"0,0");
 assert(options.futures.some(f=>f.reactions.some(r=>r.id===x.id)));
 assert(options.futures.some(f=>f.reactions.some(r=>r.id===y.id)));
 for(const f of options.futures){
  assert.equal(f.energyBefore+overlap.budget,f.energyAfter+f.budget);
  assert.equal(new Set([...f.board.values()].map(p=>p.seal)).size,f.board.size);
  assert(f.budget>=0);
 }
 const blank=s.makeSpectralPreset("empty");
 assert.equal(blank.board.size,0);
 assert.equal(blank.budget,100);
 assert.equal(s.enumerateSpectralFutures(blank).futures.length,0);
 const summoned=s.summon(blank,"0,0",31);
 assert(summoned);
 assert.equal(summoned.board.get("0,0").seal,1);
 assert.equal(summoned.budget,92);
 assert.equal(s.sendHome(summoned,"0,0").budget,100,
  "Manual recovery is full intrinsic energy, without old Life half-refund");
 assert.equal(s.relocate(summoned,"0,0","1,0").board.get("1,0").seal,1);
 assert.equal(s.summon(summoned,"0,0",6),null);
 assert.equal(s.summon(summoned,"1,0",500),null);
 assert.equal(s.summon(blank,"10,10",6),null);
 // Reject stale and double-spent plans even if the caller bypasses preview UI.
 assert.throws(()=>s.commitSpectralFuture(blank,
  s.projectSpectralFuture(overlap,[x])));
 // No free living Polytron can be manufactured by a reaction.
 const occupied=new Map(life.allHexes().slice(0,72).map((p,i)=>[
  life.hexKey(p.q,p.r),{seal:i+1,number:1}
 ]));
 const full={board:occupied,budget:0,generation:0,discovered:new Set([1])};
 assert.equal(s.availableSeals(full).length,0);
 assert(s.findSpectralReactions(full).every(r=>r.kind!=="fusion"&&r.kind!=="fission"));
 assert(s.populationInvariant(full));
 const html=renderToString(React.createElement(ui.default));
 for(const term of ["Mindeleev","Spectral","SPECTRAL FUTURES",
  "Seleziona un futuro","Interferenza","Corona 6","Fissione",
  "72 individui","Energia totale conservata","BUDGET DEL GIOCATORE",
  "PolytronsDance","α 0,5","INSPECTOR","Collapse"]){
  assert(html.toLowerCase().includes(term.toLowerCase()),"Missing UI term "+term);
 }
 assert.equal((html.match(/role="button"/g)??[]).length,127);
 const source=await readFile("src/experiments/MindeleevSpectralLab.tsx","utf8");
 for(const term of ["Richiama da casa","data-life-alpha","active.departures","active.arrivals",
  "setDance({future})","commitSpectralFuture","setSelectedFutureId",
  "enumerateSpectralFutures","aria-pressed","ms-future-pills",
  'role="status"']){
  assert(source.includes(term),"Missing interactive implementation "+term);
 }
 const scene=await readFile("src/experiments/LifePolytron3D.tsx","utf8");
 assert(scene.includes('data-life-alpha'),"Shared 3D renderer must support alpha");
 const app=await readFile("src/App.tsx","utf8");
 assert(app.includes('experiment") === "mindeleev-spectral"'));
 console.log("SPECTRAL CORONA",JSON.stringify({reactants:big.reactantEnergy,
  product:big.productEnergy,treasury:big.delta,reverseCost:-reverse.delta}));
 console.log("PASS Sprint43: rotation-invariant 2/3/4/6, 72 stable names and seals, no double spending, energy-conserving atomic fusion/fission, manual conservation, selectable spectral futures and one real dance");
}finally{await rm(temp,{recursive:true,force:true});}
