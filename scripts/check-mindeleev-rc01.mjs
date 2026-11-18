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
 const [grid,model,physics,ui,worldModule,life]=await Promise.all([
  load("src/polytron/rc01Board.ts","board"),
  load("src/polytron/rc01Game.ts","game"),
  load("src/experiments/rc01RapierFlight.ts","rapier-motion"),
  load("src/experiments/MindeleevRC01.tsx","ui",true),
  load("src/experiments/rc01ThreeScene.ts","scene"),
  load("src/polytron/mindeleevLife.ts","energy")
 ]);
 const board=grid.makeRCBoard(390,760);
 const nucleus=board.cells.find(c=>c.nucleus);
 assert(nucleus);
 assert.equal(nucleus.key,"0,0");
 assert.deepEqual([nucleus.q,nucleus.r,nucleus.ring,nucleus.idxInRing],[0,0,0,0]);
 // The axial axis (1,0) is due north, with clockwise ring indices.
 assert.equal(board.cells.length,91,"All five rings and Nucleus are present");
 const northern=board.cells.find(c=>c.key==="1,0");
 assert(northern&&Math.abs(northern.x-nucleus.x)<1e-7&&northern.y<nucleus.y);
 for(const [width,height] of [[320,560],[360,670],[390,720],[430,860],[600,900],[390,430]]){
  const layout=grid.makeRCBoard(width,height);
  assert.equal(layout.cells.length,91,"No ring 5 tile can be cropped on mobile");
  assert.equal(new Set(layout.cells.map(c=>c.key)).size,91);
  const halfH=Math.sqrt(3)*layout.size/2;
  for(const cell of layout.cells){
   assert(cell.x-layout.size>=2-1e-6&&cell.x+layout.size<=width-2+1e-6);
   assert(cell.y-halfH>=-1e-6&&cell.y+halfH<=height-layout.homeRadius);
   assert.equal(cell.ring,grid.rcRing(cell.q,cell.r));
   assert(grid.rcRingCells(cell.ring).some(v=>
    v.q===cell.q&&v.r===cell.r&&v.idxInRing===cell.idxInRing));
   assert.equal(grid.rcCellAt(layout,cell.x,cell.y)?.key,cell.key);
  }
  const outer=layout.cells.filter(c=>c.ring===5);
  assert.equal(outer.length,30);
  assert(layout.homeCenter.y-layout.homeRadius>
   Math.max(...outer.map(c=>c.y+halfH)),
   "Home must be lower than the last row of tiles");
  if(height>=560&&width<=430)
   assert((width-17*layout.size)/width<.12,
    "Five rings should maximize their mobile width");
 }
 for(let ring=0;ring<=5;ring++){
  const cells=grid.rcRingCells(ring);
  assert.equal(cells.length,ring?ring*6:1);
  assert.equal(new Set(cells.map(c=>grid.rcKey(c.q,c.r))).size,cells.length);
  if(ring){
   assert.deepEqual([cells[0].q,cells[0].r],[ring,0]);
   const a=grid.rcAxial(cells[0].q,cells[0].r,1);
   const b=grid.rcAxial(cells[1].q,cells[1].r,1);
   assert(b.x>a.x&&b.y>a.y,"Ring indexing must be clockwise from north");
  }
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
 const marker=world.scene.children.find(x=>x.isGroup&&x.children.some(y=>
  y.isMesh&&y.material?.opacity===.34&&y.material?.depthTest===false));
 assert(marker&&!marker.visible,"Target marker starts hidden");
 const candidates=board.cells.filter(c=>!c.nucleus).slice(0,2);
 assert.equal(candidates.length,2);
 world.hover(candidates[0].key,false,true);
 assert(marker.visible,"Valid drag targets must display a filled hexagon");
 const p0=marker.position.clone();
 const color0=marker.children.find(x=>x.isMesh).material.color.getHex();
 world.hover(candidates[1].key,true,true);
 assert(marker.visible&&marker.position.distanceTo(p0)>1,
  "The drag highlight must move to the new cell immediately");
 const color1=marker.children.find(x=>x.isMesh).material.color.getHex();
 assert.notEqual(color0,color1,"Occupied cells must use a capture highlight");
 world.hover(null,false);
 assert(!marker.visible,"Cancel and drop must hide the target marker");
 world.dispose();
 // All 72 permanent identities: 1..6 at ring 1, 7..18 at ring 2,
 // 19..42 at ring 4, 43..72 at ring 5. Ring 3 and Nucleus stay empty.
 const sceneGame=model.initialRCGame(board,()=>.37);
 assert.deepEqual(sceneGame,model.initialRCGame(board,()=>.92),
  "The opening is deterministic, regardless of RNG");
 assert.equal(model.RC01_OPENING_COUNT,72);
 assert.deepEqual(model.RC01_OPENING_RINGS,[1,2,4,5]);
 assert.equal(sceneGame.pawns.length,72);
 assert.equal(sceneGame.home.length,0);
 assert.equal(sceneGame.fusions,0);
 assert.equal(sceneGame.score,100);
 assert.deepEqual(sceneGame.pawns.map(p=>p.seal),
  Array.from({length:72},(_,i)=>i+1));
 assert.equal(new Set(sceneGame.pawns.map(p=>p.cellKey)).size,72);
 assert.deepEqual([...new Set(sceneGame.pawns.map(p=>p.number))],[1],
  "Every initial Polytron must be a #1 tetrahedron");
 assert.deepEqual([...new Set(sceneGame.pawns.map(p=>p.row+','+p.col))],
  [model.RC01_OPENING_PALETTE.row+','+model.RC01_OPENING_PALETTE.col],
  "All 72 tetrahedra must have the same Chromatica palette");
 assert(sceneGame.pawns.every(p=>p.manifestations.length===1&&
  p.manifestations[0]===1));
 assert(!sceneGame.pawns.some(p=>p.cellKey==="0,0"));
 assert(!sceneGame.pawns.some(p=>board.cells.find(c=>c.key===p.cellKey)?.ring===3));
 const ring1=sceneGame.pawns.slice(0,6);
 const ring2=sceneGame.pawns.slice(6,18);
 const ring4=sceneGame.pawns.slice(18,42);
 const ring5=sceneGame.pawns.slice(42,72);
 for(const [ring,pawns] of [[1,ring1],[2,ring2],[4,ring4],[5,ring5]]){
  assert.equal(pawns.length,ring*6);
  const coords=grid.rcRingCells(ring);
  for(let i=0;i<pawns.length;i++){
   assert.equal(pawns[i].cellKey,grid.rcKey(coords[i].q,coords[i].r));
   assert.equal(board.cells.find(c=>c.key===pawns[i].cellKey)?.ring,ring);
   assert.equal(board.cells.find(c=>c.key===pawns[i].cellKey)?.idxInRing,i);
  }
 }
 assert.equal(board.cells.filter(c=>!sceneGame.pawns.some(p=>p.cellKey===c.key)).length,19);
 for(const pawn of sceneGame.pawns){
  assert.equal(model.pawnDNA(pawn),"T");
  assert(model.pawnPalette(pawn).name.length>=3);
  assert(model.pawnName(pawn).length>=3);
 }
 assert(model.validateRCGame(sceneGame,board));
 for(const [n,expected] of [[1,1],[2,1],[5,4],[6,1],[7,1],[13,7],[18,12]])
  assert.equal(model.rcHomeRegression(n),expected);
 const diag=model.rc01CenterDiagnostic(board);
 assert.equal(diag.pawns.length,1);
 assert.equal(diag.pawns[0].cellKey,"0,0");
 assert.deepEqual(diag.pawns[0].manifestations,[1]);
 const source=ring1[0],victim=ring1[1];
 const empty=board.cells.find(c=>c.nucleus);
 assert(empty);
 const moved=model.moveRCPawn(sceneGame,source.cellKey,empty.key,board);
 assert(moved&&model.validateRCGame(moved.game,board));
 assert.equal(moved.game.pawns.length,72);
 assert.equal(moved.game.home.length,0);
 assert.equal(model.pawnAt(moved.game,empty.key)?.seal,source.seal);
 // Identical tetrahedral captures intentionally do not invent a new number:
 // inheritance is #1 and the defender returns Home at the #1 floor.
 const taken=model.moveRCPawn(sceneGame,source.cellKey,victim.cellKey,board);
 assert(taken&&model.validateRCGame(taken.game,board));
 assert.equal(taken.game.pawns.length,71);
 assert.equal(taken.game.home.length,1);
 assert.equal(taken.game.fusions,1);
 assert.equal(model.pawnAt(taken.game,victim.cellKey)?.number,1);
 assert.deepEqual(model.pawnAt(taken.game,victim.cellKey)?.manifestations,[1]);
 assert.equal(taken.game.home[0].seal,victim.seal);
 assert.equal(taken.game.home[0].number,1);
 assert.deepEqual(taken.game.home[0].manifestations,[1]);
 // Distinct later manifestations must still transfer with persistent history.
 const changed=sceneGame.pawns.map(p=>p.seal===victim.seal?
  {...p,number:13,manifestations:[13]}:p.seal===ring1[2].seal?
  {...p,number:18,manifestations:[18]}:p);
 const varied={...sceneGame,pawns:changed};
 const stolen=model.moveRCPawn(varied,source.cellKey,victim.cellKey,board);
 assert(stolen&&model.validateRCGame(stolen.game,board));
 assert.equal(model.pawnAt(stolen.game,victim.cellKey)?.number,13);
 assert.deepEqual(model.pawnAt(stolen.game,victim.cellKey)?.manifestations,[1,13]);
 assert.equal(stolen.game.home[0].number,7);
 assert.deepEqual(stolen.game.home[0].manifestations,[13,7]);
 const second=model.moveRCPawn(stolen.game,victim.cellKey,ring1[2].cellKey,board);
 assert(second&&model.validateRCGame(second.game,board));
 assert.equal(second.game.pawns.length,70);
 assert.equal(second.game.home.length,2);
 assert.equal(second.game.fusions,2);
 assert.equal(model.pawnAt(second.game,ring1[2].cellKey)?.number,18);
 assert.deepEqual(model.pawnAt(second.game,ring1[2].cellKey)?.manifestations,[1,13,18]);
 assert.equal(second.game.home[1].number,12);
 assert.equal(model.moveRCPawn(sceneGame,source.cellKey,source.cellKey,board),null);
 assert.equal(model.moveRCPawn(sceneGame,source.cellKey,"99,99",board),null);
 console.log("RC01 FULL OPENING",JSON.stringify({
  onBoard:sceneGame.pawns.length,home:sceneGame.home.length,
  rings:[6,12,0,24,30],nucleus:"empty",
  seed:"T",number:1,palette:model.RC01_OPENING_PALETTE,
  inherited:stolen.game.pawns.find(p=>p.seal===source.seal)?.number,
  regressed:stolen.game.home[0].number
 }));
 // Realistic crowded opening: all 72 Conway bodies must participate
 // in the SAME Rapier simulation. Verify one adjacent first-ring fusion
 // and the offscreen return of its victim without losing other identities.
 const denseSource=ring1[0],denseVictim=ring1[1];
 const denseFrom=board.cells.find(c=>c.key===denseSource.cellKey);
 const denseTo=board.cells.find(c=>c.key===denseVictim.cellKey);
 assert(denseFrom&&denseTo);
 const denseOthers=sceneGame.pawns.filter(p=>
  p.seal!==denseSource.seal&&p.seal!==denseVictim.seal)
  .map(p=>({pawn:p,cell:board.cells.find(c=>c.key===p.cellKey)}));
 assert(denseOthers.every(o=>o.cell));
 const crowded=await physics.RC01RapierFlight.create({
  board,from:denseFrom,to:denseTo,
  attacker:denseSource,victim:denseVictim,others:denseOthers
 });
 let crowdedFinished=null,crowdedHit=false,maxImpacted=0;
 try{
  assert.equal(crowded.snapshot().bystanders.length,70);
  for(let i=0;i<3600;i++){
   const f=crowded.step();
   crowdedHit ||= f.collided;
   maxImpacted=Math.max(maxImpacted,f.impactedSeals.length);
   if(f.done){crowdedFinished=f;break;}
  }
  console.log("RC01 72-BODY FUSION",JSON.stringify({
   contacted:crowdedHit,done:!!crowdedFinished,
   success:crowdedFinished?.success??false,
   duration:crowdedFinished?.time??crowded.snapshot().time,
   secondaryImpacts:maxImpacted,contacts:crowded.snapshot().contacts
  }));
  assert(crowdedHit,"An adjacent fusion must trigger real Rapier contact");
  assert(crowdedFinished?.success,
   "The full 72-body opening must allow a capture to finish physically");
 }finally{crowded.dispose();}
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
  // The first 200ms after an impact must not contain a second acceleration.
  const opening=departureSpeeds.slice(0,Math.min(24,departureSpeeds.length));
  const earlyPeak=Math.max(...opening),earlyPeakAt=opening.indexOf(earlyPeak);
  assert(opening[0]>90,
   "Target must receive an immediate, clearly visible impact impulse");
  assert(earlyPeak<=opening[0]*1.08,
   "Target must not accelerate significantly AFTER its first collision");
  assert(opening.at(-1)<opening[0],
   "The first departure frames should dissipate impact momentum");
  console.log("RC01 IMPACT SPEED",JSON.stringify({
   first:+opening[0].toFixed(2),peak:+earlyPeak.toFixed(2),
   peakStep:earlyPeakAt,lastOpening:+opening.at(-1).toFixed(2),
   firstSamples:opening.slice(0,8).map(v=>+v.toFixed(2))
  }));
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
 // The Rapier floor is wide and has no viewport walls. It stops sinking
 // without reflecting an expelled Polytron at the screen boundary.
 assert(physicalSource.includes("new RAPIER.World(vec(0,0,0))"));
 assert(physicalSource.includes("RAPIER.ColliderDesc.cuboid(args.board.width*3,args.board.height*3,floorDepth)"),
  "A real wide Rapier floor must support the board without lateral walls");
 assert(physicalSource.includes("a===this.floorCollider.handle"),
  "Floor contacts must not count as Polytron collisions");
 assert(!physicalSource.includes("this.succeeded=this.victim?this.collided:true"),
  "Timeout must not teleport the Polytron into the target cell");
 assert(!physicalSource.includes("MAX_SECONDS"),
  "The old timeout must not snap a valid move back to the source");
 assert(physicalSource.includes("RECOVERY_SECONDS"),
  "Long movements must settle by physically increasing damping");
 assert(physicalSource.includes("RC_EXIT_RECOVERY_DELAY")&&
  physicalSource.includes("RC_EXIT_STALL_SPEED")&&
  physicalSource.includes("this.captureAt=this.seconds"),
  "Any later outward force must require a detected, delayed stall");
 assert(physicalSource.includes("this.exitRecovery&&!offscreen"),
  "Normal capture should coast after the initial impact");
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
  const goal=worldModule.rcScreenWorld(board,extendedTo,
  worldModule.rcVisualPawnHeight(board));
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
    const location=worldModule.rcScreenWorld(board,home.cell,
      worldModule.rcVisualPawnHeight(board));
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
   const at=worldModule.rcScreenWorld(board,home.cell,
     worldModule.rcVisualPawnHeight(board));
   assert(Math.hypot(pose.position.x-at.x,pose.position.y-at.y,pose.position.z-at.z)<1.4,
    "Impacted bystanders must return to their tiles before committing gameplay");
   assert(pose.speed<3.1,"Returning Polytron must settle before reset");
  }
  console.log("RC01 CASCADE",JSON.stringify({
   contacts:result.contacts,impacted:result.impactedSeals,
   excursions:[...moved],time:+result.time.toFixed(3),success:result.success
  }));
 }finally{chain.dispose();}
 // The floor must resist a downward Rapier impulse, not just clamp meshes.
 const grounding=await physics.RC01RapierFlight.create({
  board,from,to:extendedTo,attacker:actor,victim:null
 });
 try{
  let body=null;
  grounding.world.bodies.forEach(b=>{if(b.isDynamic()&&!body)body=b;});
  assert(body);
  body.applyImpulse({x:0,y:0,z:-body.mass()*125},true);
  let minimumZ=Infinity;
  for(let i=0;i<360;i++)minimumZ=Math.min(minimumZ,
   grounding.step().attacker.position.z);
  assert(minimumZ>worldModule.RC_TILE_SURFACE_Z+
   physics.rcRapierPawnRadius(board)*.4,
   "A Polytron must not sink below the supporting Rapier floor");
  console.log("RC01 FLOOR",JSON.stringify({minCenterZ:+minimumZ.toFixed(2),
   tileSurfaceZ:worldModule.RC_TILE_SURFACE_Z}));
 }finally{grounding.dispose();}
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
 assert(markup.includes("FUSIONS"));
 assert(markup.includes("0"),"Fusion counter starts at zero");
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
 assert(dragHandler.includes("target.key!==press.cell.key"),
  "Drag must highlight a real destination, not the source cell");
 const finishHandler=boardCode.slice(boardCode.indexOf("if(physical.done){"),
  boardCode.indexOf("accumulator=0;",boardCode.indexOf("if(physical.done){")));
 assert(!finishHandler.includes("world.setPawns("),
  "Finishing a flight may not snap the Polytron back to its source");
 const parentCode=await readFile("src/experiments/MindeleevRC01.tsx","utf8");
 assert(parentCode.includes("if(physicsBusyRef.current)return"),
  "Resizing browser chrome must not re-create the scene mid-flight");
 assert(parentCode.includes("if(!busy)requestAnimationFrame("),
  "Resize should be reconciled after committing the move");
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
   "targetMarker","targetFill","targetCaptureMaterial",
   "rcVisualPawnHeight","scene.add(shadow)",
  "THREE.ExtrudeGeometry","THREE.OrthographicCamera",
  "THREE.Raycaster","THREE.Plane","THREE.MeshStandardMaterial",
  "makeRC3DPolytron","polytronGeometry","pawnPalette(pawn)",
  "solid.position.copy(centre)","spin.rotation","scene.add(mesh)",
  "actorOrientation","physicalPose","spin.quaternion.identity()"]){
  assert(modelCode.includes(phrase),"Missing 3D architecture: "+phrase);
 }
 // RC01 inspector must use the very same canonical energy rule as the
 // periodic table: Polytronic Number 13 (period 3, group 3) has 6 E.
 assert.equal(life.intrinsicEnergy(13,0),6);
 for(const phrase of [
  '<h2>Polytron - {pawnName(selectedPawn)}</h2>',
  '<dt>Polytronic Number</dt><dd>{selectedPawn.number}</dd>',
  '<dt>Intrinsic Energy</dt><dd>{intrinsicEnergy(selectedPawn.number,0)} E</dd>',
  '<dt>Permanent Identity</dt>',
  'import {intrinsicEnergy} from "@/polytron/mindeleevLife"',
  '<dt>Manifestations</dt>',
  'game?.home.map(p=>',
  'Reset fixed Metatron opening'
 ])assert(tsx.includes(phrase),
  "Inspector name heading and canonical data rows required: "+phrase);
 assert(!tsx.includes("POLYTRONE ·")&&!tsx.includes("<h2>#{selectedPawn.number}</h2>")&&
  !tsx.includes("<h2>Polytronic Number:"),
  "The inspector should never emphasize the number in the heading");
 const inspector=await readFile("src/experiments/RC01ThreeInspector.tsx","utf8");
 assert(inspector.includes("THREE.PerspectiveCamera")&&
  inspector.includes("makeRC3DPolytron")&&!inspector.includes("<svg"),
  "Inspector must use real rotating 3D geometry");
 const css=await readFile("src/experiments/MindeleevRC01.css","utf8");
 assert(css.includes("height:100dvh")&&css.includes("touch-action:none"));
 assert(css.includes(".rc01-three-board")&&!css.includes(".rc01-status{"));
 assert(css.includes(".rc01-fusion-notice")&&css.includes(".rc01-home-button"),
  "A visible Fusion notice and Home inventory must exist");
 const app=await readFile("src/App.tsx","utf8");
 assert(app.includes('experiment") === "mindeleev-rc01"'));
 console.log("RC01 THREE",JSON.stringify({
  initialHexes:countCells(precedingRadius),native3dHexes:board.cells.length,
  pawns:sceneGame.pawns.length,score:sceneGame.score,
  camera:"orthographic",picking:"raycasting",capture:"Rapier impact with inherited manifestation and Home regression"
 }));
 console.log("PASS RC01: fixed 18-Polytron opening, fusion inheritance, Home regression, shared Conway geometry and Rapier multi-body collisions");
}finally{await rm(temporary,{recursive:true,force:true});}
