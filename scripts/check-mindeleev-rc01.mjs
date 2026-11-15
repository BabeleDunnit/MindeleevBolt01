import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import React from "react";
import {renderToString} from "react-dom/server";

const temporary=await mkdtemp(join(process.cwd(),".rc01-check-"));
async function load(entry,name,ui=false){
 const out=join(temporary,name+".mjs");
 await build({entryPoints:[entry],outfile:out,bundle:true,format:"esm",platform:"node",
  packages:"external",tsconfig:"tsconfig.app.json",logLevel:"warning",
  loader:{".css":"empty"},
  ...(ui?{define:{"import.meta.env.BASE_URL":JSON.stringify("/MindeleevBolt01/")}}:{})});
 return import(pathToFileURL(out).href);
}
try{
 const [grid,model,physics,ui]=await Promise.all([
  load("src/polytron/rc01Board.ts","board"),
  load("src/polytron/rc01Game.ts","game"),
  load("src/polytron/rc01Physics.ts","motion"),
  load("src/experiments/MindeleevRC01.tsx","ui",true)
 ]);
 // Hexagons are 20–22% smaller while pawns retain their previous size.
 const normalPhone=grid.makeRCBoard(390,760);
 const previousHexRadius=390/7.6;
 assert(normalPhone.size<previousHexRadius*.81&&normalPhone.size>previousHexRadius*.77,
  "New hexes must be about 21% smaller than RC01 initial layout");
 assert(Math.abs(ui.rc01PawnRadius(390)-previousHexRadius*.53)<.3,
  "Rendered Polytron viewport must retain the original pixel diameter");
 assert(ui.rc01PawnRadius(390)>normalPhone.size*.6,
  "Piece radius must be sized independently of hex radius");
 assert(ui.rc01PawnRadius(320)>=24&&ui.rc01PawnRadius(600)<=32);
 // Every hexagon is complete, even on a narrow portrait viewport.
 for(const [w,h] of [[320,560],[360,670],[390,720],[430,860],[600,900]]){
  const board=grid.makeRCBoard(w,h);
  assert(board.cells.length>5,"Usable portrait viewport must have many cells");
  assert.equal(new Set(board.cells.map(c=>c.key)).size,board.cells.length);
  const center=board.cells.find(c=>c.nucleus);
  assert(center);
  assert.deepEqual([center.q,center.r,center.ring,center.idxInRing],[0,0,0,0]);
  const halfWidth=Math.sqrt(3)*board.size/2;
  for(const cell of board.cells){
   assert(cell.x-halfWidth>=2-1e-6&&cell.x+halfWidth<=w-2+1e-6,
    "No cut-off horizontal hex at "+cell.key);
   assert(cell.y-board.size>=2-1e-6&&cell.y+board.size<=h-2+1e-6,
    "No cut-off vertical hex at "+cell.key);
   assert.equal(cell.ring,grid.rcRing(cell.q,cell.r));
   assert(grid.rcRingCells(cell.ring).some(x=>x.q===cell.q&&x.r===cell.r&&
    x.idxInRing===cell.idxInRing),"True index on full mathematical ring");
   assert.equal(grid.rcCellAt(board,cell.x,cell.y)?.key,cell.key);
   assert.equal(grid.rcPolygon(cell.x,cell.y,board.size).trim().split(" ").length,6);
  }
 }
 const board=grid.makeRCBoard(390,760);
 const nucleus=board.cells.find(x=>x.nucleus);
 assert(board.cells.filter(c=>c.y>nucleus.y).length>
  board.cells.filter(c=>c.y<nucleus.y).length,
  "Portrait crop is intentionally vertically asymmetric");
 for(let k=0;k<12;k++){
  const full=grid.rcRingCells(k);
  assert.equal(full.length,k===0?1:6*k);
  assert.equal(new Set(full.map(p=>grid.rcKey(p.q,p.r))).size,full.length);
  assert(full.every(x=>grid.rcRing(x.q,x.r)===k));
 }
 assert.equal(model.RC01_SEAL_COUNT,72);
 // Screenshot diagnostic must show exactly one *deterministic* occupant at 0,0,
 // leaving the usual five-random-Polytron fixture available for later restoration.
 const diagnostic=model.rc01CenterDiagnostic(board);
 assert.equal(diagnostic.pawns.length,1);
 assert.equal(diagnostic.pawns[0].cellKey,"0,0");
 assert.equal(diagnostic.pawns[0].number,1);
 assert.equal(diagnostic.pawns[0].seal,1);
 assert.equal(diagnostic.score,100);
 assert(model.validateRCGame(diagnostic,board));
 const draws=[()=>.19,()=>.87,Math.random];
 for(const rng of draws){
  const state=model.initialRCGame(board,rng);
  assert.equal(state.pawns.length,5,"RC01 opens with exactly five Polytrons");
  assert.equal(state.score,100);
  assert(model.validateRCGame(state,board));
  assert.equal(new Set(state.pawns.map(p=>p.seal)).size,5);
  assert.equal(new Set(state.pawns.map(p=>p.cellKey)).size,5);
  assert(state.pawns.every(p=>p.seal>=1&&p.seal<=72));
  for(const pawn of state.pawns){
   assert(model.pawnDNA(pawn).length>=1);
   assert(model.pawnPalette(pawn).name.length>=3);
   assert(model.pawnName(pawn).length>=3);
  }
 }
 const state=model.initialRCGame(board,()=>.37);
 const source=state.pawns[0];
 const blank=board.cells.find(c=>!state.pawns.some(p=>p.cellKey===c.key));
 assert(blank);
 const moved=model.moveRCPawn(state,source.cellKey,blank.key,board);
 assert(moved);
 assert.equal(moved.game.pawns.length,5);
 assert.equal(moved.game.score,100);
 assert.equal(model.pawnAt(moved.game,source.cellKey),undefined);
 assert.equal(model.pawnAt(moved.game,blank.key).seal,source.seal);
 assert.equal(moved.captured,null);
 assert.equal(state.pawns[0].cellKey,source.cellKey,"Moves may not mutate starting snapshot");
 assert(model.validateRCGame(moved.game,board));
 const victim=state.pawns[1];
 const taken=model.moveRCPawn(state,source.cellKey,victim.cellKey,board);
 assert(taken);
 assert.equal(taken.game.pawns.length,4,"Capture sends the victim home");
 assert.equal(taken.game.score,100,"Score deliberately fixed at 100");
 assert.equal(taken.captured.seal,victim.seal);
 assert(!taken.game.pawns.some(p=>p.seal===victim.seal),
  "Captured Polytron leaves board, not destroyed from 72-seal universe");
 assert.equal(model.pawnAt(taken.game,victim.cellKey).seal,source.seal);
 assert.equal(model.moveRCPawn(state,source.cellKey,source.cellKey,board),null);
 assert.equal(model.moveRCPawn(state,"99,99",blank.key,board),null);
 assert.equal(model.moveRCPawn(state,source.cellKey,"99,99",board),null);
 assert(model.validateRCGame(taken.game,board));
 // Actual semi-implicit Euler physics: spring pulls in, collides and ejects.
 const from={x:110,y:120},to={x:225,y:240};
 let flight=physics.startRCFlight({kind:"capture",sourceKey:"0,0",targetKey:"1,0",
  attackerSeal:1,victimSeal:2,from,to,size:50});
 let firstHit=false,accel=false;
 for(let i=0;i<140;i++){
  const previous=flight;
  flight=physics.advanceRCFlight(flight,1/60);
  if(flight.attacker.vx!==previous.attacker.vx)accel=true;
  if(flight.impacted)firstHit=true;
 }
 assert(accel,"A real integrated spring accelerates the attacker");
 assert(firstHit,"Collision must trigger contact impulse");
 assert(flight.victim&&Math.hypot(flight.victim.x-to.x,flight.victim.y-to.y)>180,
  "Victim must travel significantly away towards invisible home");
 assert(physics.finishedRCFlight(flight));
 assert(Math.hypot(flight.attacker.x-to.x,flight.attacker.y-to.y)<1,
  "Attacker settles into captured target cell");
 const free=physics.startRCFlight({kind:"move",sourceKey:"0,0",targetKey:"1,0",
  attackerSeal:1,victimSeal:null,from,to,size:50});
 let after=free;
 for(let i=0;i<90;i++)after=physics.advanceRCFlight(after,1/60);
 assert.equal(after.victim,null);
 assert.equal(after.impacted,false);
 assert(Math.hypot(after.attacker.x-to.x,after.attacker.y-to.y)<1);
 const markup=renderToString(React.createElement(ui.default));
 for(const phrase of ["MINDELEEV","RELEASE CANDIDATE 01","ENERGIA",
  "100","Tocca per esplorare","NUCLEO (0,0)","idxInRing"]){
  if(phrase==="idxInRing")continue; // conditional sheet, inspected in source below
  assert(markup.includes(phrase),"Missing initial RC01 UI: "+phrase);
 }
 assert(markup.includes('role="group"'));
 assert(markup.includes('role="button"'));
 const sourceTSX=await readFile("src/experiments/MindeleevRC01.tsx","utf8");
 for(const feature of ["getScreenCTM","setPointerCapture","onPointerCancel",
  "onPointerMove","onPointerUp","MIN_GESTURE","role=\"dialog\"",
  "aria-modal","rc01-scrim","pawnPalette(selectedPawn).name","idxInRing",
  "data-life-polytron","startRCFlight","advanceRCFlight","finishedRCFlight",
  "moveRCPawn","pawnAt(game,to.key)","setSheet(null)","ResizeObserver",
  "rc01CenterDiagnostic(board)", "rc01-calibration-cross",
  'data-life-center="true"', "radius={rc01PawnRadius(board.width)}"]){
  assert(sourceTSX.includes(feature),"Missing live touch/physics/inspection feature: "+feature);
 }
 const canvas=await readFile("src/experiments/LifePolytron3D.tsx","utf8");
 for(const feature of ["data-life-palette-row","data-life-palette-col",
  "data-life-scale","data-life-center", "mesh.position.copy(geo.center)",
  "edges.position.copy(geo.center)","preciseCenter||isCard",
  "polytronGeometry"]){
  assert(canvas.includes(feature),"Shared 3D must genuinely render per-individual palette: "+feature);
 }
 const css=await readFile("src/experiments/MindeleevRC01.css","utf8");
 for(const feature of ["height:100dvh","touch-action:none",".rc01-nucleus",
  ".rc01-sheet",".rc01-hero-model",".rc01-calibration-cross"]){
  assert(css.includes(feature),"Missing RC01 mobile style: "+feature);
 }
 const app=await readFile("src/App.tsx","utf8");
 assert(app.includes('experiment") === "mindeleev-rc01"'));
 console.log("RC01",JSON.stringify({visibleHexes:board.cells.length,
  ring0:nucleus.key,randomPopulation:state.pawns.length,
  score:state.score,afterCapture:taken.game.pawns.length,
  physicsImpact:firstHit}));
 console.log("PASS RC01: smaller closed portrait hexagons with original-size centred 3D Polytrons, 5 persistent actors, mobile pointer capture, spring movement and chess capture");
}finally{await rm(temporary,{recursive:true,force:true});}
