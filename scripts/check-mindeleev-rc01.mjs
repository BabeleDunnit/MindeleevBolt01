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
 const [grid,model,physics,ui,worldModule]=await Promise.all([
  load("src/polytron/rc01Board.ts","board"),
  load("src/polytron/rc01Game.ts","game"),
  load("src/experiments/rc01RapierFlight.ts","rapier-motion"),
  load("src/experiments/MindeleevRC01.tsx","ui",true),
  load("src/experiments/rc01ThreeScene.ts","scene")
 ]);
 const board=grid.makeRCBoard(390,760);
 const nucleus=board.cells.find(c=>c.nucleus);
 assert(nucleus);
 assert.equal(nucleus.key,"0,0");
 assert.deepEqual([nucleus.q,nucleus.r,nucleus.ring,nucleus.idxInRing],[0,0,0,0]);
 const precedingRadius=390/10.9;
 assert(board.size<precedingRadius*.89&&board.size>precedingRadius*.86,
  "3D RC01 must fit more fully closed hexagons, with smaller tiles");
 const countCells=(radius)=>{
  let count=0;
  const halfWidth=Math.sqrt(3)*radius/2,maxRing=30;
  for(let k=0;k<=maxRing;k++)for(const cell of grid.rcRingCells(k)){
   const pos=grid.rcAxial(cell.q,cell.r,radius);
   const x=195+pos.x,y=760*.435+pos.y;
   if(x-halfWidth>=2&&x+halfWidth<=388&&
      y-radius>=2&&y+radius<=758)count++;
  }
  return count;
 };
 assert(board.cells.length>countCells(precedingRadius)+10,
  "Smaller hex size must create at least eleven extra complete cells");
 for(const [width,height] of [[320,560],[360,670],[390,720],[430,860],[600,900]]){
  const layout=grid.makeRCBoard(width,height);
  assert(layout.cells.length>15);
  assert.equal(new Set(layout.cells.map(c=>c.key)).size,layout.cells.length);
  const halfWidth=Math.sqrt(3)*layout.size/2;
  for(const cell of layout.cells){
   assert(cell.x-halfWidth>=2-1e-6&&cell.x+halfWidth<=width-2+1e-6);
   assert(cell.y-layout.size>=2-1e-6&&cell.y+layout.size<=height-2+1e-6);
   assert.equal(cell.ring,grid.rcRing(cell.q,cell.r));
   assert(grid.rcRingCells(cell.ring).some(x=>x.q===cell.q&&
    x.r===cell.r&&x.idxInRing===cell.idxInRing));
   assert.equal(grid.rcCellAt(layout,cell.x,cell.y)?.key,cell.key);
  }
 }
 for(let k=0;k<12;k++){
  const ring=grid.rcRingCells(k);
  assert.equal(ring.length,k?6*k:1);
  assert.equal(new Set(ring.map(p=>grid.rcKey(p.q,p.r))).size,ring.length);
 }
 // Both tile and Conway geometry are in the exact same 3D world.
 const world=worldModule.createRC3DWorld(board);
 assert.equal(world.camera.isOrthographicCamera,true);
 assert(world.scene.children.length>board.cells.length);
 assert(world.scene.children.some(x=>x.isMesh&&x.geometry?.type==="ExtrudeGeometry"),
  "Actual extruded 3D hexagons, not SVG polygons or 2D substitutes");
 for(const cell of board.cells.slice(0,14)){
  const vector=worldModule.rcScreenWorld(board,cell);
  assert.equal(vector.x,cell.x-board.width/2);
  assert.equal(vector.y,board.height/2-cell.y);
  assert.equal(world.raycastCell(cell.x,cell.y)?.key,cell.key,
   "Raycaster must select the correct 3D hexagon");
  const hit=world.raycastBoardPlane(cell.x,cell.y);
  assert(hit);
  assert(Math.abs(hit.x-cell.x)<.00001&&Math.abs(hit.y-cell.y)<.00001,
   "Drag plane raycast must reproduce exact tile centroid");
 }
 assert.equal(world.raycastCell(-50,-50),null);
 // Drag ghost is a dedicated extruded Three.js hex. It follows the finger,
 // while the actor is never moved before release.
 const proxy=world.scene.children.find(x=>x.isGroup&&x.children.some(y=>
  y.isMesh&&y.material?.opacity===.5));
 assert(proxy&&proxy.visible===false,"No pawn duplication inside drag ghost");
 world.dragPreview({x:110,y:180});
 assert(proxy.visible);
 assert.equal(proxy.position.x,110-board.width/2);
 assert.equal(proxy.position.y,board.height/2-180);
 world.dragPreview(null);
 assert.equal(proxy.visible,false);
 world.dispose();
 // Permanent cast and five individual Chromatica palettes on initial launch.
 const sceneGame=model.initialRCGame(board,()=>.37);
 assert.equal(sceneGame.pawns.length,5);
 assert.equal(sceneGame.score,100);
 assert(model.validateRCGame(sceneGame,board));
 assert.equal(new Set(sceneGame.pawns.map(p=>p.seal)).size,5);
 assert.equal(new Set(sceneGame.pawns.map(p=>p.cellKey)).size,5);
 for(const pawn of sceneGame.pawns){
  assert(model.pawnDNA(pawn).length>=1);
  assert(model.pawnPalette(pawn).name.length>=3);
  assert(model.pawnName(pawn).length>=3);
 }
 // The diagnostic fixture is retained as an optional test only, not launch.
 const diag=model.rc01CenterDiagnostic(board);
 assert.equal(diag.pawns.length,1);
 assert.equal(diag.pawns[0].cellKey,"0,0");
 assert.equal(diag.score,100);
 const source=sceneGame.pawns[0];
 const empty=board.cells.find(c=>!sceneGame.pawns.some(p=>p.cellKey===c.key));
 assert(empty);
 const moved=model.moveRCPawn(sceneGame,source.cellKey,empty.key,board);
 assert(moved);
 assert.equal(moved.game.pawns.length,5);
 assert.equal(moved.game.score,100);
 assert.equal(model.pawnAt(moved.game,source.cellKey),undefined);
 assert.equal(model.pawnAt(moved.game,empty.key)?.seal,source.seal);
 assert(model.validateRCGame(moved.game,board));
 const victim=sceneGame.pawns[1];
 const taken=model.moveRCPawn(sceneGame,source.cellKey,victim.cellKey,board);
 assert(taken);
 assert.equal(taken.game.pawns.length,4);
 assert.equal(taken.captured?.seal,victim.seal);
 assert(!taken.game.pawns.some(p=>p.seal===victim.seal));
 assert.equal(model.pawnAt(taken.game,victim.cellKey)?.seal,source.seal);
 assert.equal(taken.game.score,100);
 assert(model.validateRCGame(taken.game,board));
 assert.equal(model.moveRCPawn(sceneGame,source.cellKey,source.cellKey,board),null);
 assert.equal(model.moveRCPawn(sceneGame,source.cellKey,"99,99",board),null);
 // Physically integrate the exact same geometries, velocities, restitution
 // and collision events as the live mobile game. No proximity-script shortcuts.
 const from=board.cells.find(c=>c.key==="0,0");
 const to=board.cells.find(c=>c.key==="1,0");
 assert(from&&to);
 const actor={...sceneGame.pawns[0],cellKey:from.key,number:1};
 const opponent={...sceneGame.pawns[1],cellKey:to.key,number:2};
 const flight=await physics.RC01RapierFlight.create({
  board,from,to,attacker:actor,victim:opponent
 });
 let contacted=false,topAttacker=0,topVictim=0,topRotation=0;
 let collisionEvents=0,initialSpeed=flight.snapshot().attacker.speed;
 const departureSpeeds=[]; // tracking physical exit speed after impact
 let finished;
 try{
  for(let i=0;i<600;i++){
   const sample=flight.step();
   topAttacker=Math.max(topAttacker,sample.attacker.speed);
   topVictim=Math.max(topVictim,sample.victim?.speed??0);
   topRotation=Math.max(topRotation,sample.victim?.angularSpeed??0);
   collisionEvents=Math.max(collisionEvents,sample.contacts);
   if(sample.collided){
    contacted=true;
    if(sample.victim)departureSpeeds.push(sample.victim.speed);
   }
   if(sample.done){finished=sample;break;}
  }
  assert(contacted,"The actual Rapier collision event MUST fire");
  assert(collisionEvents>=1,"A real collider-vs-collider contact is required");
  assert(topAttacker>initialSpeed+15,
   "Engine must accelerate the attacking rigid body");
  assert(topVictim>15,"Victim must receive nonzero physical momentum");
  assert(topRotation>.01,"Rapier must rotate the struck polyhedron");
  assert(departureSpeeds.length>=20,
   "Collision must lead to a sustained physical exit, not a teleport");
  assert(departureSpeeds[0]>departureSpeeds.at(-1)*1.15,
   "Victim must visibly decelerate under drag after the impact, not cruise at constant speed");
  console.log("RC01 CAPTURE",JSON.stringify({
   time:+(finished?.time??0).toFixed(3),contacts:collisionEvents,
   attackerEndSpeed:+(finished?.attacker.speed??0).toFixed(3),
   victimOffscreen:!!finished?.victim&&
    (Math.abs(finished.victim.position.x)>board.width/2+
      physics.rcRapierPawnRadius(board)||
     Math.abs(finished.victim.position.y)>board.height/2+
      physics.rcRapierPawnRadius(board))
  }));
  assert(finished?.success,"Contact-driven physical capture must complete");
  assert(finished?.victim,"Capture keeps both bodies until the end of the dance");
  assert.equal(flight.from,from.key);
  assert.equal(flight.to,to.key);
 }finally{flight.dispose();}
 const emptyMove=await physics.RC01RapierFlight.create({
  board,from,to,attacker:actor,victim:null
 });
 try{
  let done;
  for(let i=0;i<600;i++){
   const frame=emptyMove.step();
   if(frame.done){done=frame;break;}
  }
  assert(done?.success,"Free move must settle via Rapier spring");
  assert.equal(done.victim,null);
  assert.equal(emptyMove.impactCount,0);
  assert.equal(emptyMove.to,to.key);
 }finally{emptyMove.dispose();}
 assert.equal(physics.RC_RAPIER_FIXED_STEP,1/120);
 assert(physics.rcDampingRatio(0)<.5);
 assert(physics.rcDampingRatio(.55)>.42);
 assert(physics.rcDampingRatio(1)>.6&&physics.rcDampingRatio(1)<.75);
 assert(physics.rcAttractorOmega(200)<physics.rcAttractorOmega(80));
 const physicalSource=await readFile("src/experiments/rc01RapierFlight.ts","utf8");
 for(const phrase of ["@dimforge/rapier3d-compat","new RAPIER.World",
  "RAPIER.ColliderDesc.convexHull","RAPIER.EventQueue",
  "RAPIER.ActiveEvents.COLLISION_EVENTS","this.world.step(this.queue)",
  "drainCollisionEvents","applyTorqueImpulse","addForce",
  "setRestitution","setMass","setCcdEnabled","setAngularDamping",
  "EARLY_DAMPING_RATIO","LATE_DAMPING_RATIO","rcDampingRatio",
  "REST_WINDOW","this.restSeconds","applyBystanderReturns",
  "bystandersRested","this.impacted.add",
  "this.attacker.body.resetForces(true)",
  "this.victim?.body.resetForces(true)"]){
  assert(physicalSource.includes(phrase),"Missing real rigid-body physics: "+phrase);
 }
 assert(!physicalSource.includes("startRCFlight")&&
  !physicalSource.includes("advanceRCFlight"),
  "RC01 cannot silently fall back to scripted pseudo-physics");
 // The physical environment must be free of floor and viewport boundary
 // collisions: Polytrons hover in 3D and homeward flight is one-way.
 assert(physicalSource.includes("new RAPIER.World(vec(0,0,0))"));
 assert(!physicalSource.includes("ColliderDesc.cuboid("),
  "No hidden floor or screen boundary that can bounce an escaping pawn");
 assert(!physicalSource.includes("this.succeeded=this.victim?this.collided:true"),
  "Timeout must not teleport the Polytron into the target cell");
 assert(physicalSource.includes("this.succeeded=false"),
  "Expired simulations must abort rather than snap an unsettled body");
 assert(!physicalSource.includes("applyHomeField"),
  "No continuous homeward push that yields constant exit velocity");
 assert(physicalSource.includes("applyCaptureImpulse()"),
  "A single real collision-triggered impulse replaces homeward acceleration");
 assert(physicalSource.includes("body.setLinearDamping(RC_HOME_LINEAR_DAMPING)"),
  "Victim must physically slow down after impact");
 assert(physicalSource.includes("offscreen&&rested"),
  "Captured pawn must actually be beyond the viewport before removal");
 // Sample the Rapier trajectory, not an authored easing curve. Verify a
 // velocity peak followed by a strong, smooth falloff before completion.
 const extendedTo=board.cells.find(c=>c.key==="3,0");
 assert(extendedTo,"The denser portrait board must support a distant empty target");
 const smooth=await physics.RC01RapierFlight.create({
  board,from,to:extendedTo,attacker:actor,victim:null
 });
 try{
  const samples=[];
  for(let i=0;i<600;i++){
   const sample=smooth.step();
   samples.push(sample);
   if(sample.done)break;
  }
  const last=samples.at(-1);
  const speeds=samples.map(x=>x.attacker.speed);
  const peak=Math.max(...speeds);
  const peakAt=speeds.indexOf(peak);
  const start=worldModule.rcScreenWorld(board,from);
  const destination=worldModule.rcScreenWorld(board,extendedTo);
  const dx=destination.x-start.x,dy=destination.y-start.y;
  const progressAtPeak=((samples[peakAt].attacker.position.x-start.x)*dx+
   (samples[peakAt].attacker.position.y-start.y)*dy)/(dx*dx+dy*dy);
  const progress=samples.map(frame=>
   ((frame.attacker.position.x-start.x)*dx+
    (frame.attacker.position.y-start.y)*dy)/(dx*dx+dy*dy));
  const crossed=progress.some(p=>p>1.01);
  const returned=progress.some((p,i)=>i>peakAt&&p>1.01&&
   progress.slice(i+1).some(q=>q<p-.005));
  assert(last?.done&&last.success,
   "Distant move must truly settle at the physical attractor");
  assert(peakAt>2&&peakAt<speeds.length*.6,
   "The body must accelerate before decelerating, rather than moving at constant speed");
  assert(progressAtPeak>.36&&progressAtPeak<.65,
   "Peak speed must occur near halfway along the path, not immediately after launch");
  assert(crossed&&returned,
   "Slight forward overshoot and a physical return should be visible before rest");
  assert(peak>20&&speeds.at(-1)<2.6,
   "Speed must physically decay to near zero before the move completes");
  assert(peak<395,
   "Ordinary moves must not hit Rapier's ~400m/s velocity cap; use a gentler attractor");
  const goal=worldModule.rcScreenWorld(board,extendedTo,9);
  const landed=last.attacker.position;
  assert(Math.hypot(landed.x-goal.x,landed.y-goal.y)<1.2,
   "Subpixel landing threshold removes visible teleports");
  assert(last.time<4,
   "Damped attraction should settle without oscillating for many seconds");
  console.log("RC01 ATTRACTOR",JSON.stringify({
   startSpeed:+speeds[0].toFixed(2),
   peakSpeed:+peak.toFixed(2),
   finalSpeed:+speeds.at(-1).toFixed(3),
   duration:+last.time.toFixed(3),
   progressAtPeak:+progressAtPeak.toFixed(3),
   overshoot:+(Math.max(...progress)-1).toFixed(3),
   distance:Math.hypot(
    goal.x-worldModule.rcScreenWorld(board,from).x,
    goal.y-worldModule.rcScreenWorld(board,from).y)
  }));
 }finally{smooth.dispose();}
 // Every occupied tile must become a dynamic collider. The capture target
 // alone leaves the board; two other Polytrons in the exit corridor must
 // react to real collision events and physically settle at their old homes.
 const firstNeighbor=board.cells.find(c=>c.key==="2,0");
 const secondNeighbor=board.cells.find(c=>c.key==="3,0");
 assert(firstNeighbor&&secondNeighbor);
 const others=[
  {pawn:{...sceneGame.pawns[2],cellKey:firstNeighbor.key,number:3},cell:firstNeighbor},
  {pawn:{...sceneGame.pawns[3],cellKey:secondNeighbor.key,number:4},cell:secondNeighbor}
 ];
 const chain=await physics.RC01RapierFlight.create({
  board,from,to,attacker:actor,victim:opponent,others
 });
 try{
  const moved=new Map(others.map(item=>[item.pawn.seal,0]));
  let result;
  for(let i=0;i<1080;i++){
   const frame=chain.step();
   for(const pose of frame.bystanders){
    const home=others.find(item=>item.pawn.seal===pose.seal);
    assert(home);
    const location=worldModule.rcScreenWorld(board,home.cell,9);
    const deviation=Math.hypot(
     pose.position.x-location.x,pose.position.y-location.y,pose.position.z-location.z);
    moved.set(pose.seal,Math.max(moved.get(pose.seal)??0,deviation));
   }
   if(frame.done){result=frame;break;}
  }
  assert.equal(result?.bystanders.length,2,"Both neighbors must remain simulated");
  assert(result?.impactedSeals.includes(others[0].pawn.seal),
   "The departing target must strike the first bystander");
  assert(result?.impactedSeals.includes(others[1].pawn.seal),
   "Impacts must cascade to another bystander");
  for(const [seal,excursion] of moved){
   assert(excursion>2,"Bystander "+seal+" must physically move on impact");
  }
  console.log("RC01 CASCADE DIAGNOSTIC",JSON.stringify({
   elapsed:result?.time,done:result?.done,success:result?.success,
   collided:result?.collided,contacts:result?.contacts,
   impacted:result?.impactedSeals,excursions:[...moved],
   attacker:result?.attacker&&{position:result.attacker.position,speed:result.attacker.speed},
   victim:result?.victim&&{position:result.victim.position,speed:result.victim.speed},
   others:result?.bystanders.map(p=>({seal:p.seal,position:p.position,speed:p.speed}))
  }));
  assert(result?.success,"Multibody chain must finish without teleporting actors");
  assert(result.victim&&
    (Math.abs(result.victim.position.x)>board.width/2+physics.rcRapierPawnRadius(board)||
     Math.abs(result.victim.position.y)>board.height/2+physics.rcRapierPawnRadius(board)),
   "Only captured target must exit");
  for(const pose of result.bystanders){
   const home=others.find(item=>item.pawn.seal===pose.seal);
   assert(home);
   const at=worldModule.rcScreenWorld(board,home.cell,9);
   assert(Math.hypot(pose.position.x-at.x,pose.position.y-at.y,pose.position.z-at.z)<1.4,
    "Impacted bystanders must return to their tiles before committing gameplay");
   assert(pose.speed<3.1,"Returning Polytron must settle before reset");
  }
  console.log("RC01 CASCADE",JSON.stringify({
   contacts:result.contacts,impacted:result.impactedSeals,
   excursions:[...moved],time:+result.time.toFixed(3),success:result.success
  }));
 }finally{chain.dispose();}
 const sceneSource=await readFile("src/experiments/rc01ThreeScene.ts","utf8");
 for(const phrase of ["previous.root.position.copy",
  "previous.pawn=pawn","if(active.has(seal))continue",
  "spin.rotation.y+=dt*.28","lastSpinTime"]){
  assert(sceneSource.includes(phrase),
   "Never visually recreate or rotate discontinuously at motion completion: "+phrase);
 }

 // SSR includes only WebGL canvas for the board. No hybrid SVG geometry.
 const markup=renderToString(React.createElement(ui.default));
 assert(markup.includes("RELEASE CANDIDATE 01"));
 assert(markup.includes("ENERGIA"));
 assert(markup.includes("100"));
 assert(markup.includes('class="rc01-three-board"'));
 assert(!markup.includes("<svg"),"RC01 output must not mix SVG with 3D");
 assert(!markup.includes("rc01-status"),"No visible bottom status strip");
 assert(!markup.includes("rc01-calibration-cross"),"Remove calibration decoration");
 assert(!markup.includes("ALIGN 03"),"Remove debug build decoration");
 assert(!markup.includes("rc01-footer"),"Give height back to the 3D board");
 const tsx=await readFile("src/experiments/MindeleevRC01.tsx","utf8");
 assert(tsx.includes("initialRCGame(board)"),
  "Production must restore five randomly chosen starting Polytrons");
 assert(!tsx.includes("<svg")&&!tsx.includes("<polygon"));
 assert(!tsx.includes("LifePolytron3D"));
 assert(tsx.includes("RC01ThreeBoard")&&tsx.includes("RC01ThreeInspector"));
 for(const phrase of ["aria-modal","onClick={()=>setSheet(null)}",
  "pawnPalette(selectedPawn).name","idxInRing","moveRCPawn",
  "ResizeObserver"]){
  assert(tsx.includes(phrase),"Missing UI behaviour "+phrase);
 }
 const boardCode=await readFile("src/experiments/RC01ThreeBoard.tsx","utf8");
 const dragHandler=boardCode.slice(
  boardCode.indexOf("const onPointerMove="),boardCode.indexOf("const launchPhysicalMove=")
 );
 assert(dragHandler.includes("world.dragPreview(worldPoint)"),
  "Finger must move ONLY the 3D hex ghost");
 assert(!dragHandler.includes("world.moveActor("),
  "Polytron cannot follow the finger: physical movement begins ONLY on drop");
 assert(boardCode.includes("world.dragPreview(null)"),
  "Drop/cancel must remove the 3D hex proxy");
 for(const phrase of ["createRC3DWorld","raycastCell","raycastBoardPlane",
  "physical.bystanders","running.otherSeals",
  "setPointerCapture","onPointerCancel","onPointerUp",
  "RC01RapierFlight.create","flight.step()","world.physicalPose",
  "RC_RAPIER_FIXED_STEP","rotateModels","onKeyDown"]){
  assert(boardCode.includes(phrase),"Missing native 3D board feature: "+phrase);
 }
 assert(!boardCode.includes("<svg")&&!boardCode.includes("<polygon"));
 const modelCode=await readFile("src/experiments/rc01ThreeScene.ts","utf8");
 for(const phrase of ["dragProxy","dragMaterial","opacity:.5",
  "THREE.ExtrudeGeometry","THREE.OrthographicCamera",
  "THREE.Raycaster","THREE.Plane","THREE.MeshStandardMaterial",
  "makeRC3DPolytron","polytronGeometry","pawnPalette(pawn)",
  "solid.position.copy(centre)","spin.rotation","scene.add(mesh)",
  "actorOrientation","physicalPose","spin.quaternion.identity()"]){
  assert(modelCode.includes(phrase),"Missing 3D architecture: "+phrase);
 }
 const inspector=await readFile("src/experiments/RC01ThreeInspector.tsx","utf8");
 assert(inspector.includes("THREE.PerspectiveCamera")&&
  inspector.includes("makeRC3DPolytron")&&!inspector.includes("<svg"),
  "Inspector must use real rotating 3D geometry");
 const css=await readFile("src/experiments/MindeleevRC01.css","utf8");
 assert(css.includes("height:100dvh")&&css.includes("touch-action:none"));
 assert(css.includes(".rc01-three-board")&&!css.includes(".rc01-status{"));
 const app=await readFile("src/App.tsx","utf8");
 assert(app.includes('experiment") === "mindeleev-rc01"'));
 console.log("RC01 THREE",JSON.stringify({
  initialHexes:countCells(precedingRadius),native3dHexes:board.cells.length,
  pawns:sceneGame.pawns.length,score:sceneGame.score,
  camera:"orthographic",picking:"raycasting",capture:"Rapier convex-hull restitution"
 }));
 console.log("PASS RC01: Rapier rigid-body real contact and rebound, Convex Conway colliders, 3D torque, proper free-move settling, 72 seals, native Three.js and no SVG");
}finally{await rm(temporary,{recursive:true,force:true});}
