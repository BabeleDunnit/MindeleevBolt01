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
 const [grid,model,physics,ui,worldModule,life,mutatron,cameraRig,touchInput,webglCleanup,mneme]=await Promise.all([
  load("src/polytron/rc01Board.ts","board"),
  load("src/polytron/rc01Game.ts","game"),
  load("src/experiments/rc01RapierFlight.ts","rapier-motion"),
  load("src/experiments/MindeleevRC01.tsx","ui",true),
  load("src/experiments/rc01ThreeScene.ts","scene"),
  load("src/polytron/mindeleevLife.ts","energy"),
  load("src/polytron/rc01Mutatron.ts","mutatron"),
  load("src/experiments/rc01Camera.ts","camera"),
  load("src/experiments/rc01TouchInput.ts","touch"),
  load("src/experiments/rc01WebGLContext.ts","webgl-cleanup"),
  load("src/polytron/rc01Mneme.ts","mneme")
 ]);
 // Verify the real WebGL resource-lifetime policy, not merely code strings:
 // effect cleanup while a canvas is still mounted must NOT poison the next
 // renderer (both StrictMode and viewport resize reuse that same canvas).
 const cleanupSteps=[];
 const callbacks=[];
 const canvasLifecycle={isConnected:true};
 const mockRenderer=()=>({
  dispose:()=>cleanupSteps.push("dispose"),
  forceContextLoss:()=>cleanupSteps.push("forceLoss")
 });
 webglCleanup.releaseRC01Renderer(mockRenderer(),canvasLifecycle,
  cb=>callbacks.push(cb));
 assert.deepEqual(cleanupSteps,["dispose"],
  "Disposal must never force immediate loss of a reusable canvas");
 callbacks.shift()();
 assert.deepEqual(cleanupSteps,["dispose"],
  "StrictMode effect replay and board resize must preserve the WebGL context");
 webglCleanup.releaseRC01Renderer(mockRenderer(),canvasLifecycle,
  cb=>callbacks.push(cb));
 canvasLifecycle.isConnected=false;
 assert.deepEqual(cleanupSteps,["dispose","dispose"]);
 callbacks.shift()();
 assert.deepEqual(cleanupSteps,["dispose","dispose","forceLoss"],
  "A canvas truly removed from the DOM must release its WebGL context");
 const board=grid.makeRCBoard(390,760);
 // Mouse & pen must keep exact targets. TOUCH previews and releases use
 // the same shifted aim, even on a CSS-resized HiDPI canvas.
 const finger={x:170,y:310},offset=touchInput.rcTouchOffsetPx(760);
 assert(offset>=62&&offset<=88);
 const touchAim=touchInput.rcDragAim(finger,"touch",760,760);
 assert.deepEqual(touchAim,{x:170,y:310-offset});
 assert.deepEqual(touchInput.rcDragAim(finger,"mouse",760,760),finger);
 assert.deepEqual(touchInput.rcDragAim(finger,"pen",760,760),finger);
 assert.equal(touchInput.rcIsTouch("touch"),true);
 assert.equal(touchInput.rcIsTouch("mouse"),false);
 const scaledTouch=touchInput.rcDragAim(finger,"touch",760,380);
 assert.equal(scaledTouch.y,
  finger.y-2*touchInput.rcTouchOffsetPx(380));
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
  for(const parity of ["odd","even"]){
   const home=layout.homes[parity];
   const pointyHalfWidth=Math.sqrt(3)*layout.homeRadius/2;
   assert(home.x-pointyHalfWidth>=2-1e-6&&
    home.x+pointyHalfWidth<=width-2+1e-6,
    "The rotated, point-up Home hexagons must fit horizontally");
   assert(home.y-layout.homeRadius>=0&&
    home.y+layout.homeRadius<=height+1e-6,
    "Both rotated Homes must be completely inside the viewport");
   const center=layout.cells.find(c=>c.nucleus);
   assert(center);
   const wall=5*Math.sqrt(3)+2/Math.sqrt(3);
   const slopingClearance=(home.y-center.y+
    Math.abs(home.x-center.x)/Math.sqrt(3)-layout.homeRadius-
    wall*layout.size)*Math.sqrt(3)/2;
   assert(Math.abs(slopingClearance-
    Math.sqrt(3)*layout.size*grid.RC_HOME_GAP_ROWS)<1e-6,
    "Each Home must have exactly one cell-row clearance from the ring-5 wall");
   assert(grid.rcHomeContains(layout,parity,home));
   assert(!grid.rcHomeContains(layout,parity,{
    x:home.x,y:home.y+layout.homeRadius+1
   }));
  }
  assert(layout.homes.odd.x<width/2&&layout.homes.even.x>width/2);
  assert(Math.abs(layout.homes.odd.y-layout.homes.even.y)<1e-6);
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
 assert.equal(world.camera.isPerspectiveCamera,true);
 assert.equal(world.view.getMode(),"map");
 assert(Math.abs(world.camera.position.z-
  board.height/(2*Math.tan(35*Math.PI/180/2)))<1e-5);
 assert.equal(cameraRig.rcCameraMode(3),"area");
 assert.equal(cameraRig.rcCameraMode(8),"subjective");
 assert.equal(cameraRig.rcCameraTiltForZoom(1),0);
 assert(cameraRig.rcCameraTiltForZoom(8)>1.1);
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
  y.isMesh&&y.material?.opacity===.34&&y.material?.depthTest===true));
 assert(marker&&!marker.visible,"Target marker starts hidden");
 const targetFill=marker.children.find(x=>x.isMesh);
 assert.equal(targetFill.geometry.type,"CircleGeometry",
  "The target highlight must be a FLAT tile face, not a 3D raised prism");
 for(const overlay of marker.children){
  assert.equal(overlay.material.depthTest,true,
   "Target highlight must be occluded by real solid geometry");
  assert.equal(overlay.material.depthWrite,false);
  assert(overlay.renderOrder<0,
   "Tile highlight order must be below 3D Polytron details");
 }
 const candidates=board.cells.filter(c=>!c.nucleus).slice(0,2);
 assert.equal(candidates.length,2);
 world.hover(candidates[0].key,false,true);
 assert(marker.visible,"Valid drag targets must display a filled hexagon");
 assert(marker.position.z>worldModule.RC_TILE_SURFACE_Z&&
  marker.position.z<worldModule.RC_TILE_SURFACE_Z+.4,
  "Target highlight belongs on the TILE, not floating over the Polytron");
 const p0=marker.position.clone();
 const color0=marker.children.find(x=>x.isMesh).material.color.getHex();
 world.hover(candidates[1].key,true,true);
 assert(marker.visible&&marker.position.distanceTo(p0)>1,
  "The drag highlight must move to the new cell immediately");
 const color1=marker.children.find(x=>x.isMesh).material.color.getHex();
 assert.notEqual(color0,color1,"Occupied cells must use a capture highlight");
 world.hover(null,false);
 assert(!marker.visible,"Cancel and drop must hide the target marker");
 // A transient 3D gold ring highlights each mutation, then releases
 // geometry/material allocations; no Polytron model is scaled.
 const ringsBefore=world.scene.children.filter(x=>
  x.isMesh&&x.geometry?.type==="RingGeometry").length;
 world.pulseMutations([{seal:1,cellKey:"1,0"},{seal:2,cellKey:"0,1"}]);
 assert.equal(world.scene.children.filter(x=>
  x.isMesh&&x.geometry?.type==="RingGeometry").length,ringsBefore+2);
 for(const halo of world.scene.children.filter(x=>
  x.isMesh&&x.material?.color?.getHex()===0xe0a433)){
  assert.equal(halo.material.depthTest,true);
  assert.equal(halo.material.depthWrite,false);
  assert(halo.position.z<worldModule.RC_TILE_SURFACE_Z+.4);
  assert(halo.renderOrder<0);
 }
 world.stepMutationHalos(1);
 world.stepMutationHalos(1);
 assert.equal(world.scene.children.filter(x=>
  x.isMesh&&x.geometry?.type==="RingGeometry").length,ringsBefore,
  "Temporary evolution halos must disappear after fading");
 const previewSource=model.initialRCGame(board);
 const forecast=mutatron.forecastRCMutatron(previewSource,board);
 assert(forecast.cells.some(c=>c.axes===0&&c.status==="charge"),
  "Basic resonance must allow zero balanced local axes");
 assert(forecast.cells.some(c=>c.status==="charge"));
 world.setEvolutionPreview(forecast.cells);
 assert.equal(world.scene.children.filter(x=>
  x.isMesh&&x.geometry?.type==="RingGeometry").length,
  ringsBefore+forecast.cells.length,
  "Each forecasting hex must be overlaid IN the 3D board scene");
 const forecastOverlays=world.scene.children.filter(x=>
  x.isMesh&&x.renderOrder<0);
 assert.equal(forecastOverlays.length,forecast.cells.length*2);
 for(const mesh of forecastOverlays){
  assert.equal(mesh.material.depthTest,true,
   "Cell forecast color must be hidden by an intervening 3D Polytron");
  assert.equal(mesh.material.depthWrite,false);
  assert(mesh.position.z>worldModule.RC_TILE_SURFACE_Z&&
   mesh.position.z<worldModule.RC_TILE_SURFACE_Z+.4,
   "Forecast highlights stay immediately above the tile face");
 }
 // Resonant outlines retain the original teal but their width represents
 // charge, monotonically from 0 to 6.
 assert(worldModule.rcResonanceHighlightWidth(6)>
  worldModule.rcResonanceHighlightWidth(1));
 world.setEvolutionPreview([{...forecast.cells[0],status:"charge",charge:1}]);
 const previewRingWidth=()=>{
  const ring=world.scene.children.find(x=>x.isMesh&&
   x.geometry?.type==="RingGeometry"&&x.material?.color?.getHex()===0x31aaa2);
  assert(ring);
  return ring.geometry.parameters.outerRadius-ring.geometry.parameters.innerRadius;
 };
 const thinWidth=previewRingWidth();
 world.setEvolutionPreview([{...forecast.cells[0],status:"charge",charge:6}]);
 assert(previewRingWidth()>thinWidth,
  "A charge-6 resonance highlight must be thicker than charge-1");
 const starvedSource={...previewSource,mutatron:{
  ...previewSource.mutatron,energyReserve:0
 }};
 const starvedForecast=mutatron.forecastRCMutatron(starvedSource,board);
 assert(starvedForecast.cells.some(c=>c.status==="energy"));
 world.setEvolutionPreview(starvedForecast.cells);
 assert(world.scene.children.some(x=>x.isMesh&&
  x.geometry?.type==="RingGeometry"&&x.material?.color?.getHex()===0xd7773d),
  "Energy-insufficient cells must be orange in the actual Three scene");
 world.setEvolutionPreview([]);
 assert.equal(world.scene.children.filter(x=>
  x.isMesh&&x.geometry?.type==="RingGeometry").length,ringsBefore,
  "Preview must be cleared cleanly without leaving stale hex highlights");
 assert.equal(typeof world.setReentryTargets,"undefined",
 "Manual Home target overlays are removed");
 // A selected touch Polytron highlights its real opening tile, and the
 // selection can be moved/cleared WITHOUT opening the inspector.
 const one=model.initialRCGame(board).pawns.find(p=>p.cellKey==="1,0");
 assert(one);
 // CI is headless; use the same one-canvas stub as the existing Rapier
 // Home stress test. The actual THREE.Mesh and Raycaster stay real.
 const priorDOM=globalThis.document;
 globalThis.document={createElement:tag=>tag==="canvas"?{
  width:128,height:64,getContext:()=>null
 }:{}};
 world.setPawns([one]);
 const oneCell=board.cells.find(c=>c.key===one.cellKey);
 assert(oneCell);
 const oneNdc=worldModule.rcScreenWorld(board,oneCell,
  worldModule.rcVisualPawnHeight(board)).project(world.camera);
 const oneHit=world.raycastPawn(
  (oneNdc.x+1)*board.width/2,(1-oneNdc.y)*board.height/2);
 assert.equal(oneHit?.pawn.seal,one.seal,
  "Select the visible elevated 3D mesh before the tile behind it");
 world.setSelectedCell(one.cellKey);
 const selectedMarker=world.scene.children.find(x=>x.isGroup&&
  x.children.some(y=>y.isMesh&&y.material?.color?.getHex()===0x398ac9));
 assert(selectedMarker?.visible,
  "Touch selection must be a persistent blue hexagon");
 assert(selectedMarker.children.every(x=>x.material?.depthTest===true&&
  x.material?.depthWrite===false&&x.renderOrder<0));
 assert.equal(selectedMarker.children.find(x=>x.isMesh)?.geometry.type,
  "CircleGeometry","Selection highlight must be flat, not raised");
 const oldSelected=selectedMarker.position.clone();
 world.setSelectedCell("2,0");
 assert(selectedMarker.position.distanceTo(oldSelected)>board.size);
 world.setSelectedCell(null);
 assert(!selectedMarker.visible);
 world.setPawns([]);
 if(priorDOM===undefined)delete globalThis.document;
 else globalThis.document=priorDOM;
 // Tactical perspective must still raycast accurately after camera motion.
 const focus=board.cells.find(c=>c.key==="2,0");
 assert(focus);
 world.view.focusOnCell(focus,"area");
 for(let i=0;i<120;i++)world.view.step(1/60);
 assert.equal(world.view.getMode(),"area");
 assert.equal(world.view.snapshot().zoom,3.2);
 const focusPx=(worldModule.rcScreenWorld(board,focus).project(world.camera).x+1)*board.width/2;
 const focusPy=(1-worldModule.rcScreenWorld(board,focus).project(world.camera).y)*board.height/2;
 assert(Math.hypot(focusPx-board.width/2,focusPy-board.height/2)<.005,
  "Tactical mode centers the selected cell");
 assert.equal(world.raycastCell(focusPx,focusPy)?.key,focus.key,
  "Raycasting must follow the tactical perspective camera");
 world.view.panWorld(board.size*2,-board.size);
 for(let i=0;i<120;i++)world.view.step(1/60);
 const afterPan=world.view.snapshot();
 assert(Math.abs(afterPan.focusQ-(focus.x-board.width/2)/board.size-2)<1e-6,
  "Touch panning moves the camera pivot, never a board cell");
 world.view.zoomAt(1.25);
 assert(world.view.getTargetZoom()>3.9);
 world.view.focusOnCell(focus,"subjective");
 for(let i=0;i<120;i++)world.view.step(1/60);
 assert.equal(world.view.getMode(),"subjective");
 assert(world.view.getTargetTilt()>1.1);
 assert(world.camera.up.z>.999&&Math.abs(world.camera.up.y)<.001,
  "Subjective orbit must have Z-up horizon, never Y-up camera roll");
 const beforeOrbit=world.camera.position.clone();
 world.view.orbit(35,-12);
 for(let i=0;i<120;i++)world.view.step(1/60);
 assert(beforeOrbit.distanceTo(world.camera.position)>board.size,
  "A subjective view must genuinely orbit around the selected Polytron");
 assert(world.camera.up.z>.999,
  "Yawing and pitching cannot roll the subjective view horizon");
 const subjectiveSnapshot=world.view.snapshot();
 const resizedWorld=worldModule.createRC3DWorld(
  grid.makeRCBoard(360,680),subjectiveSnapshot);
 assert(Math.abs(resizedWorld.view.snapshot().focusQ-
  subjectiveSnapshot.focusQ)<1e-6,
  "A mobile viewport resize must preserve the selected camera region");
 assert.equal(resizedWorld.view.getMode(),"subjective");
 resizedWorld.dispose();
 world.view.overview();
 for(let i=0;i<120;i++)world.view.step(1/60);
 assert.equal(world.view.getMode(),"map");
 assert.equal(world.raycastCell(nucleus.x,nucleus.y)?.key,"0,0",
  "Overview restores exact original raycasting");
 world.dispose();
 // All 72 permanent identities: 1..6 at ring 1, 7..18 at ring 2,
 // 19..42 at ring 4, 43..72 at ring 5. Ring 3 and Nucleus stay empty.
 const sceneGame=model.initialRCGame(board,()=>.37);
 // Exactly one reward per completed (period, Latin, Greek) for each Seal.
 const manifests=(numbers,row=2,col=4)=>numbers.map(number=>({number,row,col}));
 assert.deepEqual(mneme.rcCompletedMnemes(manifests([1,2,3,4,5])),[
  {period:1,row:2,col:4,completedAt:4}]);
 assert.deepEqual(mneme.rcCompletedMnemes(manifests([1,2,3,4,5,6,7,8,9,10])),[
  {period:1,row:2,col:4,completedAt:4},
  {period:2,row:2,col:4,completedAt:9}
 ]);
 assert.deepEqual(mneme.rcCompletedMnemes([
  ...manifests([1,2,3,4]),{number:5,row:4,col:4}]),[],
  "Mixed palettes cannot complete a Mneme");
 assert.deepEqual(mneme.rcCompletedMnemes([
  ...manifests([1,2,3,4,5]),...manifests([1,2,3,4,5])]),[
  {period:1,row:2,col:4,completedAt:4}],
  "Repeating completed forms must not duplicate a Mneme");
 const basePawn=sceneGame.pawns[0];
 const mnemeBeforePawn={...basePawn,number:4,row:2,col:4,
  manifestations:manifests([1,2,3,4])};
 const mnemeAfterPawn={...mnemeBeforePawn,number:5,
  manifestations:manifests([1,2,3,4,5])};
 const mnemeBefore={...sceneGame,pawns:sceneGame.pawns.map(p=>
  p.seal===basePawn.seal?mnemeBeforePawn:p)};
 const mnemeCandidate={...mnemeBefore,
  pawns:mnemeBefore.pawns.map(p=>p.seal===basePawn.seal?mnemeAfterPawn:p),
  mutatron:{...mnemeBefore.mutatron,energyReserve:47}};
 const mnemeAfter=mneme.rcAwardMnemes(mnemeBefore,mnemeCandidate);
 assert.equal(mneme.rcNewMnemeEnergy(mnemeBefore,mnemeCandidate),1);
 assert.equal(mnemeAfter.mutatron.mnemeGeneratedEnergy,1);
 assert.equal(mnemeAfter.mutatron.energyReserve,48,
  "Completing period 1 mints 1 FIELD E, in addition to intrinsic transfers");
 assert.equal(model.rcTotalEnergy(mnemeBefore),model.rcTotalEnergy(mnemeAfter),
  "Generated E is recorded separately from transferable E");
 assert.equal(mneme.rcAwardMnemes(mnemeAfter,mnemeAfter).mutatron.energyReserve,48,
  "An already-completed Mneme cannot mint E repeatedly");
 const period2BeforePawn={...basePawn,number:9,row:2,col:4,
  manifestations:manifests([6,7,8,9])};
 const period2AfterPawn={...period2BeforePawn,number:10,
  manifestations:manifests([6,7,8,9,10])};
 const period2Before={...sceneGame,pawns:sceneGame.pawns.map(p=>
  p.seal===basePawn.seal?period2BeforePawn:p)};
 const period2Candidate={...period2Before,
  pawns:period2Before.pawns.map(p=>p.seal===basePawn.seal?period2AfterPawn:p),
  mutatron:{...period2Before.mutatron,energyReserve:47}};
 const period2Rewarded=mneme.rcAwardMnemes(period2Before,period2Candidate);
 assert.equal(period2Rewarded.mutatron.energyReserve,49,
  "Completing period 2 must grant +2 Field E");
 assert.equal(period2Rewarded.mutatron.mnemeGeneratedEnergy,2);
 assert.equal(model.rcTotalEnergy(period2Rewarded),model.rcTotalEnergy(period2Before));
 assert.deepEqual(sceneGame,model.initialRCGame(board,()=>.92),
  "The opening is deterministic, regardless of RNG");
 assert.equal(model.RC01_OPENING_COUNT,72);
 assert.deepEqual(model.RC01_OPENING_RINGS,[1,2,4,5]);
 assert.equal(sceneGame.pawns.length,72);
 assert.equal(sceneGame.home.length,0);
 assert.equal(sceneGame.mutatron.mnemeGeneratedEnergy,0);
 assert.equal(sceneGame.fusions,0);
 assert.equal(sceneGame.score,100);
 assert.deepEqual(sceneGame.pawns.map(p=>p.seal),
  Array.from({length:72},(_,i)=>i+1));
 assert.equal(new Set(sceneGame.pawns.map(p=>p.cellKey)).size,72);
 assert.deepEqual([...new Set(sceneGame.pawns.map(p=>p.number))].sort(),
  [1,2,3],"The hand-drawn opening contains exactly the three first-period solids");
 // Independent north-first clockwise opening seed specification.
 const diagonalSeeds=[
  [5,0,1,"Albus Leukos"],[5,5,2,"Ruber Erythros"],
  [5,10,3,"Fulvus Pyrrhos"],[5,15,0,"Niger Melas"],
  [5,20,4,"Aureus Chrysos"],[5,25,5,"Flavus Xanthos"],
  [4,0,6,"Viridis Chloros"],[4,4,7,"Caesius Glaukos"],
  [4,8,8,"Caeruleus Kyanos"],[4,12,9,"Purpureus Porphyra"],
  [4,16,10,"Roseus Rhodon"],[4,20,11,"Canus Phaios"]
 ];
 assert.equal(diagonalSeeds.length,12);
 assert.equal(new Set(diagonalSeeds.map(x=>x[2])).size,12);
 for(const [ring,index,palette,name] of diagonalSeeds){
  const cell=board.cells.find(c=>c.ring===ring&&c.idxInRing===index);
  assert(cell,"Expected a vertex at ring "+ring+" index "+index);
  const pawn=model.pawnAt(sceneGame,cell.key);
  assert(pawn);
  assert.deepEqual([pawn.row,pawn.col],[palette,palette]);
  assert.equal(model.pawnPalette(pawn).name,name);
 }
 assert.equal(sceneGame.pawns.filter(p=>p.row===p.col).length,12,
  "Only the 12 specified opening vertices have diagonal palettes");
 assert(sceneGame.pawns.filter(p=>p.row!==p.col).every(p=>
  p.row===model.RC01_OPENING_PALETTE.row&&
  p.col===model.RC01_OPENING_PALETTE.col),
  "Non-vertex Polytrons keep their previous RC01 opening palette");
 assert(sceneGame.pawns.every(p=>p.manifestations.length===1&&
  p.manifestations[0].number===p.number&&
  p.manifestations[0].row===p.row&&p.manifestations[0].col===p.col));
 assert(!sceneGame.pawns.some(p=>p.cellKey==="0,0"));
 assert(!sceneGame.pawns.some(p=>board.cells.find(c=>c.key===p.cellKey)?.ring===3));
 const ring1=sceneGame.pawns.slice(0,6);
 const ring2=sceneGame.pawns.slice(6,18);
 const ring4=sceneGame.pawns.slice(18,42);
 const ring5=sceneGame.pawns.slice(42,72);
 // Independent expected ordering transcribed from the original
 // handwritten pattern, after rotating it into the north-first board.
 // Index 0 is the northernmost position in BOTH rings (a cube).
 const sketchRing1=[2,3,2,3,2,3];
 const sketchRing2=[2,1,3,1,2,1,3,1,2,1,3,1];
 assert.deepEqual(ring1.map(p=>p.number),sketchRing1,
  "Ring 1 must be C O C O C O clockwise");
 assert.deepEqual(ring2.map(p=>p.number),sketchRing2,
  "Ring 2 must be C T O T C T O T C T O T clockwise");
 assert.equal(ring1[0].number,2);
 assert.equal(ring2[0].number,2);
 assert.equal(ring1[0].seal,1);
 assert.equal(ring2[0].seal,7);
 // These are the axial coordinates of all eighteen handwritten letters.
 const sketchByAxial=[
  ["1,0",2],["0,1",3],["-1,1",2],["-1,0",3],
  ["0,-1",2],["1,-1",3],
  ["2,0",2],["1,1",1],["0,2",3],["-1,2",1],
  ["-2,2",2],["-2,1",1],["-2,0",3],["-1,-1",1],
  ["0,-2",2],["1,-2",1],["2,-2",3],["2,-1",1]
 ];
 for(const [key,n] of sketchByAxial)
  assert.equal(model.pawnAt(sceneGame,key)?.number,n,
   "Incorrect handwritten T/C/O mapping at axial cell "+key);
 for(const [ring,pawns] of [[1,ring1],[2,ring2],[4,ring4],[5,ring5]]){
  assert.equal(pawns.length,ring*6);
  const coords=grid.rcRingCells(ring);
  for(let i=0;i<pawns.length;i++){
   assert.equal(pawns[i].cellKey,grid.rcKey(coords[i].q,coords[i].r));
   assert.equal(model.openingCellKeyForSeal(pawns[i].seal),pawns[i].cellKey);
   assert.equal(board.cells.find(c=>c.key===pawns[i].cellKey)?.ring,ring);
   assert.equal(board.cells.find(c=>c.key===pawns[i].cellKey)?.idxInRing,i);
   const expected=ring===1?sketchRing1[i]:
    ring===2?sketchRing2[i]:1;
   assert.equal(pawns[i].number,expected,
    "Exact opening pattern from the hand-drawn board must be preserved");
   assert.equal(model.rcOpeningNumber(ring,i),expected);
   assert.deepEqual(pawns[i].manifestations,[{
    number:expected,row:pawns[i].row,col:pawns[i].col}]);
  }
 }
 assert.equal(board.cells.filter(c=>!sceneGame.pawns.some(p=>p.cellKey===c.key)).length,19);
 assert.deepEqual(sceneGame.pawns.reduce((acc,p)=>{
  acc[p.number]=(acc[p.number]??0)+1;return acc;
 },{}),{"1":60,"2":6,"3":6});
 for(const pawn of sceneGame.pawns){
  assert.equal(model.pawnDNA(pawn),pawn.number===1?"T":pawn.number===2?"C":"O");
  assert(model.pawnPalette(pawn).name.length>=3);
  assert(model.pawnName(pawn).length>=3);
 }
 assert(model.validateRCGame(sceneGame,board));
 // The very same immutable forecast drives the visual preview and tick.
 assert.equal(sceneGame.mutatron.generation,0);
 assert.equal(sceneGame.mutatron.energyReserve,48);
 assert.equal(mutatron.mutatronSymmetry(sceneGame,board),73,
  "Unique vertex palettes break six previously matched opposite pairs");
 assert.deepEqual(mutatron.mutatronCounts(sceneGame),[60,6,6,0,0]);
 const startingPositions=new Map(sceneGame.pawns.map(p=>[p.seal,p.cellKey]));
 const startingBudget=mutatron.mutatronEnergyTotal(sceneGame);
 let growing=sceneGame;
 const observed=[];
 for(let generation=1;generation<=45;generation++){
  const previous=growing;
  const forecast=mutatron.forecastRCMutatron(previous,board);
  const next=mutatron.evolveRCMutatron(previous,board);
  assert.deepEqual(forecast.next,next,"Preview must equal actual evolution");
  assert.deepEqual(forecast.transforms,next.mutatron.changes);
  assert(model.validateRCGame(next,board));
  const invoked=previous.mutatron.energyReserve>=mutatron.MUTATRON_INVOCATION_COST;
  assert.equal(next.mutatron.generation,
   previous.mutatron.generation+(invoked?1:0));
  assert.equal(next.mutatron.dissipatedEnergy,
   previous.mutatron.dissipatedEnergy+(invoked?1:0),
   "Each actual invocation dissipates 1 E, even without mutation");
  const earnedMneme=mneme.rcNewMnemeEnergy(previous,next);
  assert.equal(next.mutatron.mnemeGeneratedEnergy,
   previous.mutatron.mnemeGeneratedEnergy+earnedMneme);
  assert.equal(previous.mutatron.energyReserve-next.mutatron.energyReserve,
   forecast.cost+forecast.invocationCost-earnedMneme,
   "Preview accounts for intrinsic, invocation and Mneme-generated energy");
  assert.equal(next.pawns.length,72);
  assert.equal(next.home.length,0);
  assert.equal(next.moves,0);
  assert.equal(next.homeCycles,next.mutatron.generation);
  assert.equal(next.fusions,0);
  assert.equal(next.score,100);
  assert(next.pawns.every(p=>startingPositions.get(p.seal)===p.cellKey));
  assert(next.pawns.every(p=>p.manifestations.at(-1)?.number===p.number&&
   p.manifestations.at(-1)?.row===p.row&&
   p.manifestations.at(-1)?.col===p.col));
  assert.deepEqual(next.pawns.map(p=>[p.seal,p.row,p.col]),
   previous.pawns.map(p=>[p.seal,p.row,p.col]),
   "Mutatron must never modify a Polytron's Chromatica palette");
  assert(next.mutatron.changes.every(change=>change.from!==change.to),
   "Every transformation must change the number, not just the palette");
  assert.equal(mutatron.mutatronEnergyTotal(next),startingBudget,
   "Intrinsic + Field + dissipated heat must be conserved at every tick");
  assert(next.mutatron.changes.length<=2);
  assert(next.mutatron.symmetry>=previous.mutatron.symmetry);
  assert.deepEqual(new Set(forecast.cells.filter(p=>p.status==="evolve").map(p=>p.key)),
   new Set(next.mutatron.changes.map(m=>m.cellKey)));
  for(const change of next.mutatron.changes){
   const pawn=next.pawns.find(p=>p.seal===change.seal);
   const old=previous.pawns.find(p=>p.seal===change.seal);
   assert.equal(change.from,old.number);
   assert.equal(change.to,pawn.number);
   const cell=board.cells.find(c=>c.key===pawn.cellKey);
   const opposite=model.pawnAt(next,grid.rcKey(-cell.q,-cell.r));
   assert(opposite&&opposite.number===pawn.number,
    "Mutatron harmonizes numbers without overwriting opposite palettes");
   assert.deepEqual([pawn.row,pawn.col],[old.row,old.col]);
   const groupStep=Math.abs((pawn.number-1)%5-(old.number-1)%5);
   const periodStep=Math.abs(Math.floor((pawn.number-1)/5)-
    Math.floor((old.number-1)/5));
   assert(groupStep+periodStep<=1,
    "Only one adjacent group OR one adjacent period jump per tick");
  }
  const counts=mutatron.mutatronCounts(next);
  observed.push({gen:generation,groups:counts,
   max:Math.max(...next.pawns.map(p=>p.number)),
   E:next.mutatron.energyReserve,sym:next.mutatron.symmetry,
   changes:next.mutatron.changes.map(m=>m.seal)});
  growing=next;
 }
 console.log("RC01 MUTATRON ENERGY-GROWTH",JSON.stringify(observed));
 assert(observed[0].changes.length===0,"Resonance must accumulate");
 assert(observed.some(x=>x.groups[3]>=2),"Dodecahedral seeds must emerge");
 assert(observed.some(x=>x.groups[4]>=2),"Icosahedral seeds must emerge");
 assert(observed.some(x=>x.max>5),"Numbers beyond the first period must emerge");
 assert(observed.some(x=>x.sym>sceneGame.mutatron.symmetry));
 let twice=sceneGame;
 for(let i=0;i<45;i++)twice=mutatron.evolveRCMutatron(twice,board);
 assert.deepEqual(growing,twice,"No randomness or mutation order dependency");
 const uniform={...sceneGame,pawns:sceneGame.pawns.map(p=>({
  ...p,number:1,manifestations:[{number:1,row:p.row,col:p.col}]}))};
 let quiet=uniform;
 for(let i=0;i<12;i++)quiet=mutatron.evolveRCMutatron(quiet,board);
 assert.deepEqual(mutatron.mutatronCounts(quiet),[72,0,0,0,0]);
 assert.deepEqual(quiet.mutatron.changes,[],
  "Without diverse neighbours, no spontaneous mutations");
 const starved={...sceneGame,mutatron:{...sceneGame.mutatron,energyReserve:0}};
 const energyPreview=mutatron.forecastRCMutatron(starved,board);
 assert(energyPreview.cells.some(x=>x.status==="energy"),
  "Energy-starved candidate cells must be visibly orange");
 assert.equal(mutatron.mutatronEnergyTotal(energyPreview.next),
  mutatron.mutatronEnergyTotal(starved));
 const isolated=mutatron.evolveRCMutatron(
  model.rc01CenterDiagnostic(board),board);
 assert.equal(isolated.pawns[0].number,1);
 assert.equal(isolated.mutatron.symmetry,100);
 const evolvedSource=growing.pawns.find(p=>p.number===4);
 assert(evolvedSource);
 const funded={...growing,mutatron:{
  ...growing.mutatron,energyReserve:Math.max(30,growing.mutatron.energyReserve)
 }};
 const targetPawn=funded.pawns.find(p=>p.seal!==evolvedSource.seal&&
  model.assessRCMove(funded,evolvedSource.cellKey,p.cellKey,board).allowed);
 assert(targetPawn);
 const captureAfterEvolution=model.moveRCPawn(funded,
  evolvedSource.cellKey,targetPawn.cellKey,board);
 assert(captureAfterEvolution&&model.validateRCGame(captureAfterEvolution.game,board));
 assert.equal(captureAfterEvolution.game.mutatron.generation,
  growing.mutatron.generation);
 assert.equal(captureAfterEvolution.game.home.length,1);
 for(const [n,expected] of [[1,1],[2,1],[5,4],[6,1],[7,1],[13,7],[18,12]])
  assert.equal(model.rcHomeRegression(n),expected);
 const diag=model.rc01CenterDiagnostic(board);
 assert.equal(diag.pawns.length,1);
 assert.equal(diag.pawns[0].cellKey,"0,0");
 assert.deepEqual(diag.pawns[0].manifestations,[{number:1,row:2,col:4}]);
 const source=ring1[0],victim=ring1[1];
 const mnemeCapture={...sceneGame,pawns:sceneGame.pawns.map(p=>
  p.seal===source.seal?{...p,number:4,row:2,col:4,
   manifestations:manifests([1,2,3,4])}:
  p.seal===victim.seal?{...p,number:5,row:2,col:4,
   manifestations:manifests([5])}:p)};
 assert(model.validateRCGame(mnemeCapture,board));
 const mnemeFusion=model.moveRCPawn(mnemeCapture,source.cellKey,victim.cellKey,board);
 assert(mnemeFusion);
 assert.equal(mnemeFusion.game.mutatron.mnemeGeneratedEnergy,1,
  "Capture must automatically complete a Mneme when it manifests the fifth group");
 assert.equal(mnemeFusion.game.mutatron.energyReserve,49);
 assert.equal(model.rcTotalEnergy(mnemeCapture),
  model.rcTotalEnergy(mnemeFusion.game));
 const empty=board.cells.find(c=>c.nucleus);
 assert(empty);
 // The nucleus is a dissociation sink, not a normal empty tile.
 const moved=model.moveRCPawn(sceneGame,source.cellKey,empty.key,board);
 assert(moved&&model.validateRCGame(moved.game,board));
 assert.equal(moved.game.pawns.length,71);
 assert.equal(moved.game.home.length,1);
 assert.equal(model.pawnAt(moved.game,empty.key),undefined);
 assert.equal(moved.game.home[0].seal,source.seal);
 assert.equal(moved.game.home[0].number,1);
 assert.equal(moved.game.mutatron.energyReserve,49);
 assert.equal(model.rcTotalEnergy(moved.game),model.rcTotalEnergy(sceneGame));
 assert.equal(model.rcHomeCooldown(moved.game,source.seal),2);
 assert.equal(moved.game.homeCycles,1);
 assert.equal(model.assessRCMove(sceneGame,ring2[1].cellKey,empty.key,board).allowed,false);
 assert.equal(model.rcNucleusRegression(1),null);
 assert.equal(model.rcNucleusRegression(6),1);
 assert.equal(model.rcNucleusRecovery(6),1);
 // Opening captures now demonstrate immediate #2 -> #3 inheritance
 // and defender Home regression from #3 to #2.
 const taken=model.moveRCPawn(sceneGame,source.cellKey,victim.cellKey,board);
 assert(taken&&model.validateRCGame(taken.game,board));
 assert.equal(taken.game.pawns.length,71);
 assert.equal(taken.game.home.length,1);
 assert.equal(taken.game.fusions,1);
 assert.equal(model.pawnAt(taken.game,victim.cellKey)?.number,3);
 const selectedPalette=model.rcSelectCapturedPalette(sceneGame,source,victim,board);
 assert.deepEqual([selectedPalette.row,selectedPalette.col],
  [model.pawnAt(taken.game,victim.cellKey)?.row,
   model.pawnAt(taken.game,victim.cellKey)?.col],
  "Capture recombines Latin/Greek alleles and selects one");
 const parentOptions=[
  [source.row,victim.col],[victim.row,source.col]
 ];
 assert(parentOptions.some(([row,col])=>row===selectedPalette.row&&col===selectedPalette.col));
 assert.deepEqual(model.pawnAt(taken.game,victim.cellKey)?.manifestations.map(m=>m.number),[2,3]);
 assert.equal(taken.game.home[0].seal,victim.seal);
 assert.equal(taken.game.home[0].number,2);
 assert.deepEqual(taken.game.home[0].manifestations.at(-1),
  {number:2,row:taken.game.home[0].row,col:taken.game.home[0].col});
 const inherited=model.pawnAt(taken.game,victim.cellKey);
 assert.deepEqual(inherited.manifestations.at(-1),
  {number:inherited.number,row:inherited.row,col:inherited.col});
 assert.equal(model.rcHomeCooldown(taken.game,victim.seal),2);
 assert.deepEqual(taken.game.home[0].manifestations.map(m=>m.number),[3,2]);
 // A field with no spendable energy must reject expensive captures.
 const broke={...sceneGame,
  pawns:sceneGame.pawns.map(p=>p.seal===source.seal?
   {...p,number:1,manifestations:[{number:1,row:p.row,col:p.col}]}:
   p.seal===victim.seal?{...p,number:5,manifestations:[{number:5,row:p.row,col:p.col}]}:p),
  mutatron:{...sceneGame.mutatron,energyReserve:0}
 };
 const priced=model.assessRCMove(broke,source.cellKey,victim.cellKey,board);
 assert.equal(priced.allowed,false);
 assert.equal(model.moveRCPawn(broke,source.cellKey,victim.cellKey,board),null);
 assert.match(priced.reason,/needs 3 E/i);
 const justFunded={...broke,mutatron:{...broke.mutatron,energyReserve:3}};
 const fundedCapture=model.moveRCPawn(justFunded,
  source.cellKey,victim.cellKey,board);
 assert(fundedCapture);
 assert.equal(fundedCapture.game.mutatron.energyReserve,0);
 assert.equal(model.rcTotalEnergy(fundedCapture.game),model.rcTotalEnergy(justFunded));
 // Low-energy inheritance by a powerful attacker gives its energy surplus
 // back to the shared field instead of creating or destroying energy.
 const harvest={...sceneGame,pawns:sceneGame.pawns.map(p=>
  p.seal===source.seal?{...p,number:5,manifestations:[{number:5,row:p.row,col:p.col}]}:
  p.seal===victim.seal?{...p,number:1,manifestations:[{number:1,row:p.row,col:p.col}]}:p)};
 const release=model.moveRCPawn(harvest,source.cellKey,victim.cellKey,board);
 assert(release);
 assert.equal(release.game.mutatron.energyReserve,52);
 assert.equal(model.rcTotalEnergy(release.game),model.rcTotalEnergy(harvest));
 assert.equal(model.moveRCPawn(sceneGame,ring2[1].cellKey,"0,0",board),
  null,"Current #1 cannot be used to farm Field E");
 // Distinct later manifestations must still transfer with persistent history.
 const changed=sceneGame.pawns.map(p=>p.seal===victim.seal?
  {...p,number:13,manifestations:[{number:13,row:p.row,col:p.col}]}:p.seal===ring1[2].seal?
  {...p,number:18,manifestations:[{number:18,row:p.row,col:p.col}]}:p);
 const varied={...sceneGame,pawns:changed};
 const stolen=model.moveRCPawn(varied,source.cellKey,victim.cellKey,board);
 assert(stolen&&model.validateRCGame(stolen.game,board));
 assert.equal(model.pawnAt(stolen.game,victim.cellKey)?.number,13);
 assert.deepEqual(model.pawnAt(stolen.game,victim.cellKey)?.manifestations.map(m=>m.number),[2,13]);
 assert.equal(stolen.game.home[0].number,7);
 assert.deepEqual(stolen.game.home[0].manifestations.map(m=>m.number),[13,7]);
 const second=model.moveRCPawn(stolen.game,victim.cellKey,ring1[2].cellKey,board);
 assert(second&&model.validateRCGame(second.game,board));
 assert.equal(second.game.pawns.length,70);
 assert.equal(second.game.home.length,2);
 assert.equal(second.game.fusions,2);
 assert.equal(model.pawnAt(second.game,ring1[2].cellKey)?.number,18);
 assert.deepEqual(model.pawnAt(second.game,ring1[2].cellKey)?.manifestations.map(m=>m.number),[2,13,18]);
 assert.equal(second.game.home[1].number,12);
 assert.equal(model.moveRCPawn(sceneGame,source.cellKey,source.cellKey,board),null);
 assert.equal(model.moveRCPawn(sceneGame,source.cellKey,"99,99",board),null);
 assert.equal(model.canRCReenter(moved.game,source.seal,"0,0",board),false);
 assert.equal(model.canRCReenter(moved.game,source.seal,source.cellKey,board),false);
 const stepOne=model.moveRCPawn(moved.game,victim.cellKey,source.cellKey,board);
 assert(stepOne);
 assert.equal(model.rcHomeCooldown(stepOne.game,source.seal),1);
 assert.equal(model.returnRCPawnToCell(stepOne.game,source.seal,source.cellKey,board),null);
 const stepTwo=model.moveRCPawn(stepOne.game,source.cellKey,victim.cellKey,board);
 assert(stepTwo);
 assert.equal(model.rcHomeCooldown(stepTwo.game,source.seal),0);
 const ring3Free=board.cells.find(c=>c.ring===3);
 assert(ring3Free);
 const reentry=model.returnRCPawnToCell(stepTwo.game,source.seal,ring3Free.key,board);
 assert(reentry&&model.validateRCGame(reentry.game,board));
 assert.equal(model.pawnAt(reentry.game,ring3Free.key)?.seal,source.seal);
 assert.equal(model.rcTotalEnergy(reentry.game),model.rcTotalEnergy(stepTwo.game));
 assert(!model.canRCReenter(reentry.game,source.seal,source.cellKey,board),
  "Already-reentered Polytrons cannot be returned twice");
 console.log("RC01 FULL OPENING",JSON.stringify({
  onBoard:sceneGame.pawns.length,home:sceneGame.home.length,
  rings:[6,12,0,24,30],nucleus:"empty",
  openingNumbers:{tetrahedron:60,cube:6,octahedron:6},
  ring1:ring1.map(p=>p.number),ring2:ring2.map(p=>p.number),
  palette:model.RC01_OPENING_PALETTE,
  inherited:stolen.game.pawns.find(p=>p.seal===source.seal)?.number,
  regressed:stolen.game.home[0].number
 }));
 // Diagnostic recall uses the same cooldown and auto-targets.
 const recalledOdd=model.recallRCParity(sceneGame,"odd",board);
 assert.equal(recalledOdd.pawns.length,36);
 assert.equal(recalledOdd.home.length,36);
 assert.equal(model.rcAutomaticHomeDestinations(recalledOdd,board).length,0);
 assert(recalledOdd.home.every(p=>model.rcHomeCooldown(recalledOdd,p.seal)===2));
 const invokedOnce=mutatron.evolveRCMutatron(recalledOdd,board);
 assert.equal(invokedOnce.homeCycles,recalledOdd.homeCycles+1);
 assert.equal(model.rcAutomaticHomeDestinations(invokedOnce,board).length,0);
 const invokedTwice=mutatron.evolveRCMutatron(invokedOnce,board);
 assert.equal(invokedTwice.homeCycles,recalledOdd.homeCycles+2);
 const scheduled=model.rcAutomaticHomeDestinations(invokedTwice,board);
 assert.equal(scheduled.length,36);
 assert.equal(new Set(scheduled.map(x=>x.target)).size,36);
 assert(scheduled.every(x=>x.target!=="0,0"&&!model.pawnAt(invokedTwice,x.target)));
 const sortedCells=scheduled.map(item=>board.cells.find(c=>c.key===item.target));
 assert(sortedCells.every(Boolean));
 for(let i=1;i<sortedCells.length;i++){
  assert(sortedCells[i-1].ring>=sortedCells[i].ring);
  if(sortedCells[i-1].ring===sortedCells[i].ring)
   assert(sortedCells[i-1].idxInRing<sortedCells[i].idxInRing);
 }
 const reserved=model.rcAutomaticHomeDestinations(invokedTwice,board,
  scheduled.slice(0,5).map(x=>x.target),
  scheduled.slice(0,5).map(x=>x.seal));
 assert.equal(reserved.length,31);
 assert(!reserved.some(x=>scheduled.slice(0,5).some(y=>y.target===x.target)));
 let restored=invokedTwice;
 for(const {seal,target} of scheduled){
  const arrival=model.returnRCPawnToCell(restored,seal,target,board);
  assert(arrival&&arrival.captured===null);
  restored=arrival.game;
  assert(model.validateRCGame(restored,board));
 }
 assert.equal(restored.pawns.length,72);
 assert.equal(restored.home.length,0);
 assert.equal(restored.fusions,0);
 assert.equal(restored.homeCycles,invokedTwice.homeCycles,
  "Automatic returns do not consume another action cycle");
 assert.equal(model.rcTotalEnergy(restored),model.rcTotalEnergy(invokedTwice));
 console.log("RC01 AUTO HOME",JSON.stringify({
  recalled:36,returned:scheduled.length,first:scheduled[0].target,
  last:scheduled.at(-1).target,cycles:2
 }));
 // HOME STRESS TEST: 36 odd + 36 even with full-size Rapier bodies.
 // Node CI has no HTML Canvas. This is a headless scene test, not a
 // screenshot test; text textures are placeholders while genuine Three.js
 // meshes, Rapier colliders and all dynamics remain unchanged.
 const savedDocument=globalThis.document;
 globalThis.document={createElement:tag=>tag==="canvas"?{
  width:128,height:64,getContext:()=>null
 }:{}};
 const homeScene=worldModule.createRC3DWorld(board);
 try{
  homeScene.setPawns(sceneGame.pawns,[]);
  await homeScene.initHomePhysics();
  const odd=sceneGame.pawns.filter(p=>p.seal%2===1);
  const even=sceneGame.pawns.filter(p=>p.seal%2===0);
  const oddGame=model.recallRCParity(sceneGame,"odd",board);
  assert(model.validateRCGame(oddGame,board));
  assert.equal(oddGame.pawns.length,36);
  assert.equal(oddGame.home.length,36);
  assert.equal(oddGame.fusions,0);
  assert(oddGame.home.every(p=>p.manifestations[0].number===p.number));
  assert.equal(oddGame.home.filter(p=>p.number===2).length,6);
  assert.equal(oddGame.home.filter(p=>p.number===3).length,3);
  assert.equal(oddGame.home.filter(p=>p.number===1).length,27);
  homeScene.transferParityToHome(odd);
  homeScene.setPawns(oddGame.pawns,oddGame.home);
  assert.deepEqual(homeScene.homeStats(),
   {count:36,odd:36,even:0,physical:36});
  const average=(records,side)=>{
   const home=worldModule.rcScreenWorld(board,board.homes[side]);
   return records.reduce((sum,p)=>sum+Math.hypot(
    p.position.x-home.x,p.position.y-home.y),0)/records.length;
  };
  const start=average(homeScene.homeSnapshot(),"odd");
  for(let i=0;i<240;i++)homeScene.stepHome(1/60);
  const finish=average(homeScene.homeSnapshot(),"odd");
  assert(finish<start*.75,"Odd Polytrons must approach the left Home");
  const evenGame=model.recallRCParity(oddGame,"even",board);
  assert.equal(evenGame.pawns.length,0);
  assert.equal(evenGame.home.length,72);
  assert(model.validateRCGame(evenGame,board));
  homeScene.transferParityToHome(even);
  homeScene.setPawns(evenGame.pawns,evenGame.home);
  assert.deepEqual(homeScene.homeStats(),
   {count:72,odd:36,even:36,physical:72});
  for(let i=0;i<120;i++)homeScene.stepHome(1/60);
  assert(homeScene.homeSnapshot().every(p=>Number.isFinite(p.position.x)&&
   Number.isFinite(p.position.y)&&Number.isFinite(p.position.z)&&
   Number.isFinite(p.speed)));
  homeScene.setPawns(sceneGame.pawns,[]);
  assert.deepEqual(homeScene.homeStats(),
   {count:0,odd:0,even:0,physical:0},
   "Reset must dispose ALL Home rigid bodies");
  // Automatic Home return uses a reserved free destination and the
  // existing Rapier spring; no opening-cell capture or manual selection.
  const sent=model.moveRCPawn(sceneGame,ring1[1].cellKey,ring1[0].cellKey,board);
  assert(sent);
  const ready1=mutatron.evolveRCMutatron(sent.game,board);
  const ready2=mutatron.evolveRCMutatron(ready1,board);
  const plan=model.rcAutomaticHomeDestinations(ready2,board);
  assert.equal(plan.length,1);
  assert.equal(board.cells.find(c=>c.key===plan[0].target)?.ring,3,
   "After opening capture, the first free tile lies in ring 3");
  homeScene.setPawns(ready2.pawns,ready2.home);
  const incoming=ready2.home[0];
  homeScene.startHomeReturns([incoming],{[incoming.seal]:plan[0].target});
  let physicallyArrived=false;
  for(let i=0;i<1800;i++){
   if(homeScene.stepHome(1/60).includes(incoming.seal)){
    physicallyArrived=true;break;
   }
  }
  assert(physicallyArrived,"Rapier Home body must reach its automatic target");
  const returned=model.returnRCPawnToCell(
   ready2,incoming.seal,plan[0].target,board);
  assert(returned&&returned.captured===null);
  homeScene.setPawns(returned.game.pawns,returned.game.home);
  assert.equal(homeScene.homeStats().count,0);
  assert.equal(returned.game.fusions,1);
  assert.equal(model.pawnAt(returned.game,plan[0].target)?.seal,incoming.seal);
  console.log("RC01 PHYSICAL AUTO RETURN",JSON.stringify({
   arrived:physicallyArrived,ring:3,target:plan[0].target
  }));
  console.log("RC01 PARITY HOME",JSON.stringify({
   odd:odd.length,even:even.length,
   radius:worldModule.rcVisualPawnRadius(board),
   initialDistance:+start.toFixed(2),finalDistance:+finish.toFixed(2),
   resetClean:true
  }));
 }finally{
  homeScene.dispose();
  if(savedDocument===undefined)delete globalThis.document;
  else globalThis.document=savedDocument;
 }
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
  assert(maxImpacted>0,
   "The live 72-body opening must resolve genuine secondary Rapier collisions");
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
   "Standalone victim continues a real trajectory");
  const opening=departureSpeeds.slice(0,Math.min(24,departureSpeeds.length));
  assert(opening[0]>90,"Immediate impact impulse is still mandatory");
  assert(opening.every(Number.isFinite)&&Math.max(...opening)<390,
   "Homewards spring remains below Rapier velocity cap");
  const home=worldModule.rcScreenWorld(board,board.homes.even);
  const orig=worldModule.rcScreenWorld(board,to);
  const initialHomeDistance=Math.hypot(orig.x-home.x,orig.y-home.y);
  const finalHomeDistance=finished?.victim?Math.hypot(
   finished.victim.position.x-home.x,finished.victim.position.y-home.y):Infinity;
  console.log("RC01 DIRECT HOME",JSON.stringify({
   firstSpeed:+opening[0].toFixed(2),
   startDistance:+initialHomeDistance.toFixed(2),
   endDistance:+finalHomeDistance.toFixed(2),
   time:+(finished?.time??0).toFixed(3),contacts:collisionEvents
  }));
  assert(finalHomeDistance<initialHomeDistance,
   "The target must move towards its EVEN Home");
  assert(finished?.success,"Contact-driven physical capture must complete");
  assert(finished?.victim,"Capture keeps both bodies until the end of the dance");
  assert.equal(flight.from,from.key);
  assert.equal(flight.to,to.key);
 }finally{flight.dispose();}
 // Live hand-off happens at FIRST collision, while the target is on board.
 const handoff=await physics.RC01RapierFlight.create({
  board,from,to,attacker:actor,victim:opponent
 });
 try{
  let atImpact=null,completed=null;
  for(let i=0;i<600;i++){
   const frame=handoff.step();
   if(frame.collided&&!atImpact){
    assert(frame.victim);
    atImpact={...frame.victim.position};
    assert(handoff.detachVictimToHome());
    assert(!handoff.detachVictimToHome(),"Handoff must be idempotent");
   }
   if(frame.done){completed=frame;break;}
  }
  assert(atImpact&&completed?.success,
   "Board simulation must settle after captured body is handed to Home");
  assert(Math.abs(atImpact.x)<board.width/2&&
   Math.abs(atImpact.y)<board.height/2,
   "Capture transfers immediately, while the victim is still on-screen");
  assert(completed.time<4,
   "Home activity must not extend the board input lock");
  console.log("RC01 INSTANT TRANSFER",JSON.stringify({
   captureOnScreen:true,boardUnlock:+completed.time.toFixed(3)
  }));
 }finally{handoff.dispose();}
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
 assert(physicalSource.includes("detachVictimToHome()")&&
  physicalSource.includes("this.victim.body.setEnabled(false)"),
  "First Rapier impact detaches captured Polytron into the Home world");
 assert(physicalSource.includes("args.board.homes[rcParity(")&&
  physicalSource.includes("this.collided&&elapsed>=MIN_CAPTURE_TIME&&rested"),
  "A capture targets its Home and does NOT wait for the screen boundary");
 assert(!physicalSource.includes("offscreen&&rested"),
  "No offscreen completion gates");
 assert(physicalSource.includes("applyCaptureImpulse()")&&
  physicalSource.includes("body.setLinearDamping(RC_HOME_LINEAR_DAMPING)"),
  "One real physical impulse on impact");
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
  // The route now heads toward the EVEN Home, not along the former
  // northern offscreen corridor. Only REQUIRE motion for actual contacts.
  for(const [seal,excursion] of moved)
   if(result?.impactedSeals.includes(seal))
    assert(excursion>.05,"A contacted bystander must move physically");
  console.log("RC01 CASCADE DIAGNOSTIC",JSON.stringify({
   elapsed:result?.time,done:result?.done,success:result?.success,
   collided:result?.collided,contacts:result?.contacts,
   impacted:result?.impactedSeals,excursions:[...moved],
   attacker:result?.attacker&&{position:result.attacker.position,speed:result.attacker.speed},
   victim:result?.victim&&{position:result.victim.position,speed:result.victim.speed},
   others:result?.bystanders.map(p=>({seal:p.seal,position:p.position,speed:p.speed}))
  }));
  assert(result?.success,"Multibody chain must finish without teleporting actors");
  assert(result.victim,"Victim remains a Rapier body until its hand-off");
  assert(Number.isFinite(result.victim.position.x)&&
   Number.isFinite(result.victim.position.y),
   "Direct Home movement must stay numerically stable");
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
 assert(markup.includes("MAP")&&markup.includes("AREA")&&
  markup.includes(">3D<"),
  "Visible camera controls must provide MAP/AREA/3D");
 assert(markup.includes("Evolve Mutatron")&&
  markup.includes("GEN")&&markup.includes("SYM"),
  "A visible manual evolution control and state counters are required");
 assert(markup.includes("RING 1: C/O ×3")&&
  markup.includes("RING 2: C/T/O/T ×3")&&markup.includes("HOME"),
  "The default UI must show the full 72-Seal opening and Home zone");
 assert(markup.includes("0"),"Fusion counter starts at zero");
 assert(markup.includes('class="rc01-three-board"'));
 assert(!markup.includes("<svg"),"RC01 output must not mix SVG with 3D");
 assert(!markup.includes("rc01-status"),"No visible bottom status strip");
 assert(!markup.includes("rc01-calibration-cross"),"Remove calibration decoration");
 assert(!markup.includes("ALIGN 03"),"Remove debug build decoration");
 assert(!markup.includes("rc01-footer"),"Give height back to the 3D board");
 const tsx=await readFile("src/experiments/MindeleevRC01.tsx","utf8");
 assert(tsx.includes("initialRCGame(board)"),
  "Production must restore the fixed 72-Polytron opening");
 assert(!tsx.includes("<svg")&&!tsx.includes("<polygon"));
 assert(!tsx.includes("LifePolytron3D"));
 assert(tsx.includes("forecastRCMutatron(previous,board).next")&&
  tsx.includes("disabled={!game||physicsBusy||game.mutatron.energyReserve<1}"),
  "Mutatron evolution must be manual and must never interrupt Rapier");
 assert(tsx.includes("RC01ThreeBoard")&&tsx.includes("RC01ThreeInspector"));
 for(const phrase of ["aria-modal","onClick={()=>setSheet(null)}",
  "pawnPalette(inspectedPawn).name","idxInRing","moveRCPawn",
  "ResizeObserver"]){
  assert(tsx.includes(phrase),"Missing UI behaviour "+phrase);
 }
 const boardCode=await readFile("src/experiments/RC01ThreeBoard.tsx","utf8");
 const dragHandler=boardCode.slice(
  boardCode.indexOf("const onPointerMove="),boardCode.indexOf("const launchPhysicalMove=")
 );
 assert(dragHandler.includes("world.dragPreview(worldPoint)"),
  "Finger must move ONLY the 3D hex ghost");
 assert(dragHandler.includes("rcDragAim(point,press.pointerType,board.height"),
  "Touch drag preview and highlighted target must use offset aiming");
 const releaseHandler=boardCode.slice(boardCode.indexOf("const onPointerUp="),
  boardCode.indexOf("const onPointerCancel="));
 assert(releaseHandler.includes("rcDragAim(point,press.pointerType,board.height"),
  "Drop must use the same aim position as the highlighted target");
 assert(dragHandler.includes("touchSelectRef.current(press.pawn.seal)"),
  "Dragging a pawn must select its permanent identity");
 assert(releaseHandler.includes("rcIsTouch(press.pointerType)")&&
  releaseHandler.includes("touchSelectRef.current(press.pawn?.seal??null)"),
  "Touch tap should select instead of launching the Inspector");
 assert(releaseHandler.includes("selectRef.current(press.cell"),
  "Desktop mouse clicks must still open the Inspector");
 assert(boardCode.includes("world.raycastPawn(point.x,point.y)"),
  "Pointer down needs correct 3D-mesh picking in tilted perspective");
 assert(boardCode.includes("world.transferToHome(dissociating,physical.attacker)"),
  "Nucleus dissociation transfers the actual 3D actor to its Home");
 assert(boardCode.includes("rcAutomaticHomeDestinations")&&
  boardCode.includes("worldRef.current.startHomeReturns(pawns,")&&
  !boardCode.includes("setReentryTargets")&&
  !boardCode.includes("returningSeal"),
  "Ready Home Polytrons automatically target reserved free tiles");
 assert(!dragHandler.includes("world.moveActor("),
  "Polytron cannot follow the finger: physical movement begins ONLY on drop");
 assert(boardCode.includes("world.dragPreview(null)"),
  "Drop/cancel must remove the 3D hex proxy");
 assert(dragHandler.includes("assessRCMove(gameRef.current,press.cell.key,target.key,board)"),
  "Drag highlight must reject energy-unaffordable and invalid targets");
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
  "world.transferToHome(victim,physical.victim)",
  "flight.detachVictimToHome()","world.stepHome(dt,!isBusy())",
  "onOpenHome","onRecallParity","onReturnArrived","doubleTapRef.current",
   "world.stepMutationHalos(dt)","worldRef.current?.pulseMutations",
   "world.cancelHomeReturn(seal)",
   "world.setEvolutionPreview(previewRef.current)",
   "pointersRef.current","gestureRef.current","world.view.zoomAt",
   "world.view.orbit","panBetween","world.view.step(dt)",
   "viewSavedRef.current=world.view.snapshot()",
   "onWheel={onWheel}","cameraCommand",
  "RC_RAPIER_FIXED_STEP","rotateModels","onKeyDown"]){
  assert(boardCode.includes(phrase),"Missing native 3D board feature: "+phrase);
 }
 assert(!boardCode.includes("<svg")&&!boardCode.includes("<polygon"));
 const modelCode=await readFile("src/experiments/rc01ThreeScene.ts","utf8");
 for(const phrase of ["dragProxy","dragMaterial","opacity:.5",
   "targetMarker","targetFill","targetCaptureMaterial",
   "rcVisualPawnHeight","scene.add(shadow)",
  "THREE.ExtrudeGeometry","createRC01CameraRig",
  "THREE.Raycaster","THREE.Plane","THREE.MeshStandardMaterial",
  "makeRC3DPolytron","polytronGeometry","pawnPalette(pawn)",
  "solid.position.copy(centre)","spin.rotation","scene.add(mesh)",
  "actorOrientation","physicalPose","spin.quaternion.identity()",
  "homeShape=makeHexGeometry","homeParticles","initHomePhysics",
  "RAPIER.World","RAPIER.ColliderDesc.ball","body.addForce",
   "transferToHome","transferParityToHome","startHomeReturns",
   "cancelHomeReturns","stepHome(dt:number",
   "pulseMutations","stepMutationHalos(dt:number",
   "setEvolutionPreview","previewRingGeometry"]){
  assert(modelCode.includes(phrase),"Missing 3D architecture: "+phrase);
 }
 // RC01 inspector must use the very same canonical energy rule as the
 // periodic table: Polytronic Number 13 (period 3, group 3) has 6 E.
 assert.equal(life.intrinsicEnergy(13,0),6);
 for(const phrase of [
  '<h2>Polytron - {pawnName(selectedPawn)}</h2>',
  '<dt>Polytronic Number</dt><dd>{inspectedPawn.number}</dd>',
  '<dt>Intrinsic Energy</dt><dd>{intrinsicEnergy(inspectedPawn.number,0)} E</dd>',
  '<dt>Permanent Identity</dt>',
  'import {intrinsicEnergy} from "@/polytron/mindeleevLife"',
  '<RC01ManifestationHistory pawn={selectedPawn}',
  'game?.home.filter(p=>!sheet.parity||rcParity(p.seal)===sheet.parity)',
  'Reset fixed Metatron opening'
 ])assert(tsx.includes(phrase),
  "Inspector name heading and canonical data rows required: "+phrase);
 assert(tsx.includes('target="_blank" rel="noopener noreferrer"')&&
  tsx.includes("?experiment=polytron-periodic")&&
  tsx.includes("RC01MnemeHistory")&&
  tsx.includes("next charge {selectedForecast.charge} / 6")&&
  tsx.includes("threshold {selectedForecast.needed}")&&
  tsx.includes("MNEME +{game?.mutatron.mnemeGeneratedEnergy??0}"),
  "UI must show Mneme rewards, periodic-table shortcut and charge threshold");
 assert(tsx.includes("rcCellCoordinates(selectedCell)")&&
  tsx.includes("rcCellCoordinates(occupiedCell)")&&
  !tsx.includes("Axial coordinates")&&tsx.includes("setManifestationIndex"),
  "Inspectors show only ring/index coordinates and read-only history");
 assert.deepEqual(model.rcRecordManifestation(
  [{number:2,row:2,col:4}],{number:2,row:3,col:4}),
  [{number:2,row:2,col:4},{number:2,row:3,col:4}],
  "A new palette of an old numerical form creates a Mneme snapshot");
 assert.deepEqual(model.rcRecordManifestation(
  [{number:2,row:2,col:4}],{number:2,row:2,col:4}),
  [{number:2,row:2,col:4}],
  "Unchanged number and palette do not duplicate a snapshot");
 assert.deepEqual(model.rcRecordManifestation(
  [{number:1,row:2,col:4},{number:2,row:2,col:4}],
  {number:1,row:2,col:4}),
  [{number:1,row:2,col:4},{number:2,row:2,col:4},{number:1,row:2,col:4}],
  "Revisiting an older form is still a new event");
 const mnemeUi=await readFile("src/experiments/RC01MnemeHistory.tsx","utf8");
 assert(mnemeUi.includes("rowIndexToOps")&&
  mnemeUi.includes('ops||"∅"')&&
  mnemeUi.includes('["T","C","O","D","I"]')&&
  mnemeUi.includes("gradientCss(")&&
  mnemeUi.includes("makeRC3DPolytron")&&
  mnemeUi.includes("renderer.setScissor(")&&
  mnemeUi.includes("rcCompletedMnemes")&&
  mnemeUi.includes("releaseRC01Renderer(renderer,canvas)"),
  "Mneme list shows period, Conway operator, gradient and five real 3D groups");
 assert.equal(mnemeUi.split("new THREE.WebGLRenderer").length-1,1,
  "Mneme thumbnails must share one renderer");
 const historyUi=await readFile("src/experiments/RC01ManifestationHistory.tsx","utf8");
 assert(historyUi.includes("THREE.WebGLRenderer")&&
  historyUi.includes("renderer.setScissor(")&&
  historyUi.includes("renderer.setViewport(")&&
  historyUi.includes("makeRC3DPolytron")&&
  historyUi.includes("manifestations.length")&&
  historyUi.includes("slice().reverse()")&&
  historyUi.includes("data-mneme-index")&&
  historyUi.includes("releaseRC01Renderer(renderer,canvas)")&&
  !historyUi.includes("RC01ThreeInspector")&&
  !historyUi.includes("IntersectionObserver"),
  "Mneme history must share one scissored renderer, not spawn a context per row");
 assert.equal(historyUi.split("new THREE.WebGLRenderer").length-1,1,
  "Every Mneme history owns exactly one renderer, regardless of length");
 assert(historyUi.includes("actors.delete(index)")&&
  historyUi.includes("actor.dispose()")&&
  historyUi.includes("if(!manifestation)continue"),
  "Offscreen manifestation geometries must be released");

 assert(tsx.includes("rc01-palette-continuous")&&
  tsx.includes("gradientCss(")&&!tsx.includes("setReturningSeal"),
  "Inspector shows continuous palette and manual Home return is absent");
 assert(!tsx.includes("POLYTRONE ·")&&!tsx.includes("<h2>#{selectedPawn.number}</h2>")&&
  !tsx.includes("<h2>Polytronic Number:"),
  "The inspector should never emphasize the number in the heading");
 const inspector=await readFile("src/experiments/RC01ThreeInspector.tsx","utf8");
 assert(inspector.includes("THREE.PerspectiveCamera")&&
  inspector.includes("makeRC3DPolytron")&&!inspector.includes("<svg")&&
  inspector.includes("const updateActor=")&&
  inspector.includes("updateActorRef.current?.(pawn)")&&
  inspector.includes("releaseRC01Renderer(renderer,canvas)"),
  "Historical inspection must update only meshes and release renderer on close");
 assert.equal(inspector.split("new THREE.WebGLRenderer").length-1,1,
  "Inspector changes must not spawn more WebGL contexts");
 assert(boardCode.includes("releaseRC01Renderer(renderer,canvas)"),
  "Board cleanup must use the detached-canvas-aware context lifecycle");
 const css=await readFile("src/experiments/MindeleevRC01.css","utf8");
 assert(css.includes("height:100dvh")&&css.includes("touch-action:none"));
 assert(css.includes(".rc01-three-board")&&!css.includes(".rc01-status{"));
 assert(css.includes(".rc01-evolve-panel")&&css.includes(".rc01-evolve-button"));
 assert(css.includes(".rc01-preview-legend")&&css.includes(".rc01-legend-gold"));
 assert(css.includes(".rc01-mneme-solids")&&
  css.includes(".rc01-mneme-canvas")&&
  css.includes(".rc01-periodic-shortcut"));
 assert(css.includes(".rc01-manifestations-list")&&
  css.includes("max-height:228px")&&
  css.includes(".rc01-manifestation-thumbnail")&&
  css.includes(".rc01-manifestations-canvas")&&
  css.includes("pointer-events:none"));
 assert(css.includes(".rc01-palette-continuous")&&
  !css.includes(".rc01-reentry-instruction"));
 assert(css.includes(".rc01-touch-selection")&&
  css.includes(".rc01-touch-drag-hint")&&
  css.includes(".rc01-selection-info"),
  "Touch selected-pawn Info and offset-drag guidance are required");
 assert(tsx.includes("onTouchSelect={setSelectedSeal}")&&
  tsx.includes("Inspect Polytron ")&&
  tsx.includes("setSelectedSeal(null)"),
  "Touch selection must be distinct from the Inspector modal");
 assert(css.includes(".rc01-camera-controls")&&
  css.includes(".rc01-camera-option")&&css.includes(".rc01-inspect-3d"),
  "Mobile MAP/AREA/3D control and Polytron focus are required");
 assert(css.includes(".rc01-fusion-notice")&&css.includes(".rc01-home-button"),
  "A visible Fusion notice and Home inventory must exist");
 const app=await readFile("src/App.tsx","utf8");
 assert(app.includes('experiment") === "mindeleev-rc01"'));
 console.log("RC01 THREE",JSON.stringify({
  native3dHexes:board.cells.length,occupied:sceneGame.pawns.length,
   homeCapacity:"two parity Rapier crowds, full-size",
  pawns:sceneGame.pawns.length,score:sceneGame.score,
  camera:"smooth perspective MAP/AREA/3D",picking:"raycasting",capture:"Rapier impact with inherited manifestation and Home regression"
 }));
 console.log("PASS RC01: live 3D forecast, stepwise high-number Mutatron, intrinsic energy conservation, Home toggle and Rapier collisions");
}finally{await rm(temporary,{recursive:true,force:true});}
