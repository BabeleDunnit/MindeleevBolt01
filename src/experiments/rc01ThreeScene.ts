import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d-compat";
import {polytronGeometry} from "@/polytron/polytron";
import {openingCellKeyForSeal,pawnDNA,pawnPalette,rcParity,type RCPawn} from "@/polytron/rc01Game";
import {RC_HOME_ROTATION,type RCBoard,type RCCell,type RCPoint} from "@/polytron/rc01Board";
import type {RCMutatronForecastCell,RCPreviewStatus} from "@/polytron/rc01Mutatron";
import {createRC01CameraRig,type RCViewSnapshot} from "@/experiments/rc01Camera";

// The same resting height is used by the Three.js display and Rapier bodies.
// A bounding-sphere radius guarantees that even rotated convex Polytrons sit
// entirely above the 3D hex tiles (including the bevel).
export const RC_TILE_SURFACE_Z=3.25;
export const rcVisualPawnRadius=(board:RCBoard)=>
 Math.max(4,board.size*.59);
export const rcVisualPawnHeight=(board:RCBoard)=>
 rcVisualPawnRadius(board)+RC_TILE_SURFACE_Z+1.5;

/** One real Three.js mesh, with its geometry recentered before rotation.
 * Both the chessboard and the inspector use this same model constructor.
 */
export function makeRC3DPolytron(pawn:RCPawn,radius:number){
 const geo=polytronGeometry(pawnDNA(pawn),undefined,{
  pair:pawnPalette(pawn),order:"contrast"
 });
 geo.solid.computeBoundingSphere();
 const sphere=geo.solid.boundingSphere;
 const centre=sphere?.center??new THREE.Vector3();
 const geometryRadius=Math.max(.01,sphere?.radius??1);
 const root=new THREE.Group(),spin=new THREE.Group();
 const solidMaterial=new THREE.MeshStandardMaterial({
  vertexColors:true,roughness:.53,metalness:.13,flatShading:true,
  side:THREE.DoubleSide
 });
 const edgeMaterial=new THREE.LineBasicMaterial({color:0xcfe6e3,transparent:true,opacity:.56});
 const solid=new THREE.Mesh(geo.solid,solidMaterial);
 const edges=new THREE.LineSegments(geo.edges,edgeMaterial);
 solid.position.copy(centre).multiplyScalar(-1);
 edges.position.copy(centre).multiplyScalar(-1);
 spin.add(solid,edges);
 spin.scale.setScalar(radius/geometryRadius);
 root.add(spin);
 return {
  root,spin,
  dispose(){
   geo.solid.dispose();geo.edges.dispose();
   solidMaterial.dispose();edgeMaterial.dispose();
  }
 };
}
export type RCWorldModel=ReturnType<typeof makeRC3DPolytron>&{
 pawn:RCPawn;shadow:THREE.Mesh;label:THREE.Sprite;
};
export function rcScreenWorld(board:RCBoard,point:RCPoint,z=0):THREE.Vector3{
 return new THREE.Vector3(point.x-board.width/2,board.height/2-point.y,z);
}
function makeTextSprite(text:string):THREE.Sprite{
 const canvas=document.createElement("canvas");canvas.width=128;canvas.height=64;
 const ctx=canvas.getContext("2d");
 if(ctx){
  ctx.clearRect(0,0,128,64);
  ctx.font="bold 31px system-ui, sans-serif";
  ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.lineWidth=6;ctx.strokeStyle="#f6faf7";ctx.strokeText(text,64,31);
  ctx.fillStyle="#294d45";ctx.fillText(text,64,31);
 }
 const texture=new THREE.CanvasTexture(canvas);
 texture.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false});
 const sprite=new THREE.Sprite(material);sprite.scale.set(27,13.5,1);
 sprite.renderOrder=20;
 return sprite;
}
function makeHexGeometry(radius:number){
 const shape=new THREE.Shape();
 for(let i=0;i<6;i++){
  const theta=i*Math.PI/3;
  const x=Math.cos(theta)*radius,y=Math.sin(theta)*radius;
  if(!i)shape.moveTo(x,y);else shape.lineTo(x,y);
 }
 shape.closePath();
 const tile=new THREE.ExtrudeGeometry(shape,{
  depth:2.8,steps:1,bevelEnabled:true,bevelSegments:1,
  bevelThickness:.45,bevelSize:.45
 });
 const positions:number[]=[];
 for(let i=0;i<6;i++){
  const a=i*Math.PI/3;
  positions.push(Math.cos(a)*radius,Math.sin(a)*radius,0);
 }
 const line=new THREE.BufferGeometry();
 line.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
 return {tile,line};
}
export function createRC3DWorld(board:RCBoard,priorView?:RCViewSnapshot){
 const scene=new THREE.Scene();
 scene.background=new THREE.Color("#edf0ee");
 // One perspective projection, from near-orthographic strategic framing to
 // a ground-hugging subjective view. Raycasting follows this SAME camera.
 const view=createRC01CameraRig(board,priorView);
 const camera=view.camera;
 scene.add(new THREE.HemisphereLight(0xf8fff7,0x7e969a,2.0));
 const sun=new THREE.DirectionalLight(0xffffff,2.7);
 sun.position.set(-160,260,530);scene.add(sun);
 const rim=new THREE.DirectionalLight(0xa7d8ef,.65);
 rim.position.set(240,-120,350);scene.add(rim);
 const shape=makeHexGeometry(board.size-1.65);
 const tileMaterial=new THREE.MeshStandardMaterial({color:"#f2f4f1",roughness:.96,metalness:0});
 const nucleusMaterial=new THREE.MeshStandardMaterial({
  color:"#d2e9dd",roughness:.79,metalness:.07
 });
 const tileEdgeMaterial=new THREE.LineBasicMaterial({color:"#70817a",linewidth:2});
 const nucleusEdgeMaterial=new THREE.LineBasicMaterial({color:"#318662",linewidth:2});
 const hoverEdgeMaterial=new THREE.LineBasicMaterial({color:"#3b9e7d"});
 const captureEdgeMaterial=new THREE.LineBasicMaterial({color:"#ba7155"});
 // An independently positioned hex marker is rendered over the pawn, too:
 // changing a thin WebGL line (often forced to 1px) was not readable.
 const targetFreeMaterial=new THREE.MeshBasicMaterial({
  color:0x25b587,transparent:true,opacity:.34,depthTest:false,
  depthWrite:false,side:THREE.DoubleSide
 });
 const targetCaptureMaterial=new THREE.MeshBasicMaterial({
  color:0xe28b53,transparent:true,opacity:.39,depthTest:false,
  depthWrite:false,side:THREE.DoubleSide
 });
 const targetFreeBorder=new THREE.LineBasicMaterial({
  color:0x0a875f,depthTest:false,depthWrite:false
 });
 const targetCaptureBorder=new THREE.LineBasicMaterial({
  color:0xbb4b2a,depthTest:false,depthWrite:false
 });
 const targetMarker=new THREE.Group();
 const targetFill=new THREE.Mesh(shape.tile,targetFreeMaterial);
 targetFill.renderOrder=80;
 const targetOutline=new THREE.LineLoop(shape.line,targetFreeBorder);
 targetOutline.position.z=3.85;
 targetOutline.renderOrder=81;
 targetMarker.add(targetFill,targetOutline);
 targetMarker.visible=false;
 scene.add(targetMarker);
 // Touch selection persists independently of both drag target and inspector.
 const selectedFillMaterial=new THREE.MeshBasicMaterial({
  color:0x398ac9,transparent:true,opacity:.24,
  depthTest:false,depthWrite:false,side:THREE.DoubleSide
 });
 const selectedBorderMaterial=new THREE.LineBasicMaterial({
  color:0x196aaf,depthTest:false,depthWrite:false
 });
 const selectedMarker=new THREE.Group();
 const selectedFill=new THREE.Mesh(shape.tile,selectedFillMaterial);
 selectedFill.renderOrder=65;
 const selectedBorder=new THREE.LineLoop(shape.line,selectedBorderMaterial);
 selectedBorder.position.z=4.1;selectedBorder.renderOrder=66;
 selectedMarker.add(selectedFill,selectedBorder);
 selectedMarker.visible=false;
 scene.add(selectedMarker);
 function setSelectedCell(key:string|null){
  const cell=key?cellsByKey.get(key):null;
  selectedMarker.visible=!!cell;
  if(cell)selectedMarker.position.copy(
   rcScreenWorld(board,cell,RC_TILE_SURFACE_Z+.45));
 }
 // Only THIS translucent hex follows the finger. The pawn and the original
 // tile remain exactly where they were until pointer-up starts Rapier.
 const dragMaterial=new THREE.MeshStandardMaterial({
  color:"#66c3a7",transparent:true,opacity:.5,depthWrite:false,
  side:THREE.DoubleSide,roughness:.55
 });
 const dragOutlineMaterial=new THREE.LineBasicMaterial({
  color:"#208b69",transparent:true,opacity:1,depthTest:false
 });
 const dragProxy=new THREE.Group();
 const dragTile=new THREE.Mesh(shape.tile,dragMaterial);
 const dragOutline=new THREE.LineLoop(shape.line,dragOutlineMaterial);
 dragOutline.position.z=3.8;
 dragProxy.add(dragTile,dragOutline);
 dragProxy.visible=false;
 dragProxy.renderOrder=15;
 scene.add(dragProxy);
 const tiles:THREE.Mesh[]=[];
 const lines=new Map<string,THREE.LineLoop>();
 const cellsByKey=new Map<string,RCCell>(board.cells.map(c=>[c.key,c]));
 for(const cell of board.cells){
  const xy=rcScreenWorld(board,cell);
  const material=cell.nucleus?nucleusMaterial:tileMaterial;
  const mesh=new THREE.Mesh(shape.tile,material);
  mesh.position.set(xy.x,xy.y,0);
  mesh.userData.cellKey=cell.key;
  mesh.userData.isTile=true;
  scene.add(mesh);tiles.push(mesh);
  const outline=new THREE.LineLoop(
   shape.line,cell.nucleus?nucleusEdgeMaterial:tileEdgeMaterial
  );
  outline.position.set(xy.x,xy.y,3.5);
  scene.add(outline);lines.set(cell.key,outline);
 }
 const ringGeometry=new THREE.RingGeometry(
  board.size*.74,board.size*.79,48
 );
 const ringMaterial=new THREE.MeshBasicMaterial({
  color:0x7bbfa2,transparent:true,opacity:.5,side:THREE.DoubleSide
 });
 const ring=new THREE.Mesh(ringGeometry,ringMaterial);
 const core=cellsByKey.get("0,0");
 if(core){
  const loc=rcScreenWorld(board,core,4.2);
  ring.position.copy(loc);scene.add(ring);
 }
 // Colored 3D overlays are rendered directly on the hex cells, not in
 // screen-space CSS. They have no collider and never enter picking.
 const previewGeometry=new THREE.CircleGeometry(board.size*.80,6);
 const previewRingGeometry=new THREE.RingGeometry(
  board.size*.76,board.size*.90,6);
 const forecastColors:Record<RCPreviewStatus,number>={
  evolve:0xe5ae29,charge:0x31aaa2,energy:0xd7773d,blocked:0x8e97a0
 };
 const previewMaterials={} as Record<RCPreviewStatus,THREE.MeshBasicMaterial>;
 const previewRingMaterials={} as Record<RCPreviewStatus,THREE.MeshBasicMaterial>;
 for(const kind of ["evolve","charge","energy","blocked"] as const){
  previewMaterials[kind]=new THREE.MeshBasicMaterial({
   color:forecastColors[kind],transparent:true,opacity:.15,
   depthTest:false,depthWrite:false,side:THREE.DoubleSide
  });
  previewRingMaterials[kind]=new THREE.MeshBasicMaterial({
   color:forecastColors[kind],transparent:true,opacity:.82,
   depthTest:false,depthWrite:false,side:THREE.DoubleSide
  });
 }
 const forecastMeshes:THREE.Mesh[]=[];
 function setEvolutionPreview(cells:readonly RCMutatronForecastCell[]){
  for(const mesh of forecastMeshes)scene.remove(mesh);
  forecastMeshes.length=0;
  for(const state of cells){
   const cell=cellsByKey.get(state.key);if(!cell)continue;
   for(const [geometry,material,order] of [
    [previewGeometry,previewMaterials[state.status],18],
    [previewRingGeometry,previewRingMaterials[state.status],28]
   ] as const){
    const mesh=new THREE.Mesh(geometry,material);
    mesh.position.copy(rcScreenWorld(board,cell,RC_TILE_SURFACE_Z+1.2));
    mesh.renderOrder=order;
    scene.add(mesh);forecastMeshes.push(mesh);
   }
  }
 }
 // Tiles must be pickable immediately, even before the first render frame.
 scene.updateMatrixWorld(true);
 const shadowGeometry=new THREE.CircleGeometry(board.size*.58,36);
 const shadowMaterial=new THREE.MeshBasicMaterial({
  color:0x254e41,transparent:true,opacity:.10,depthWrite:false
 });
 // Homes turn 30° to align with the outer Mutatron's lower slopes.
 const homeShape=makeHexGeometry(board.homeRadius);
 const homeMaterials=[
  new THREE.MeshBasicMaterial({
   color:0xb8dacb,transparent:true,opacity:.54,side:THREE.DoubleSide
  }),
  new THREE.MeshBasicMaterial({
   color:0xb8d8e3,transparent:true,opacity:.54,side:THREE.DoubleSide
  })
 ];
 const homeEdgeMaterials=[
  new THREE.LineBasicMaterial({color:0x3b886c,transparent:true,opacity:.9}),
  new THREE.LineBasicMaterial({color:0x467b97,transparent:true,opacity:.9})
 ];
 for(const [index,center] of [board.homes.odd,board.homes.even].entries()){
  const mesh=new THREE.Mesh(homeShape.tile,homeMaterials[index]);
  mesh.position.copy(rcScreenWorld(board,center,0));
  mesh.rotation.z=RC_HOME_ROTATION;
  const border=new THREE.LineLoop(homeShape.line,homeEdgeMaterials[index]);
  border.position.copy(rcScreenWorld(board,center,4));
  border.rotation.z=RC_HOME_ROTATION;
  scene.add(mesh,border);
 }
 type HomeParticle={
  pawn:RCPawn;model:ReturnType<typeof makeRC3DPolytron>;
  body:RAPIER.RigidBody|null;
  returnTarget:THREE.Vector3|null;arrivalReported:boolean
 };
 const homeParticles=new Map<number,HomeParticle>();
 // Transferred on collision before the React game state commits; keep
 // these bodies alive until the state confirms the Home reservation.
 const pendingHome=new Set<number>();
 const homeRadius=rcVisualPawnRadius(board); // NEVER scaled for Home
 let homeWorld:RAPIER.World|null=null;
 let homeAccumulator=0;
 let homeDisposed=false;
 const fixedStep=1/120;
 // Home is a SECOND, independent Rapier world. Captures and diagnostic
 // recalls cannot lock the board's drag/drop after the attacking move ends.
 function createHomeBody(p:HomeParticle){
  if(!homeWorld||p.body)return;
  const xyz=p.model.root.position;
  const body=homeWorld.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
   .setTranslation(xyz.x,xyz.y,xyz.z)
   .setRotation(p.model.root.quaternion)
   .setLinearDamping(.15).setAngularDamping(1.6)
   .setCanSleep(false).setCcdEnabled(true));
  homeWorld.createCollider(RAPIER.ColliderDesc.ball(homeRadius*.79)
   .setMass(1.2).setRestitution(.32).setFriction(.26),body);
  p.body=body;
 }
 async function initHomePhysics(){
  await RAPIER.init();
  if(homeDisposed)return;
  homeWorld=new RAPIER.World({x:0,y:0,z:0});
  homeWorld.timestep=fixedStep;
  const depth=6;
  homeWorld.createCollider(RAPIER.ColliderDesc.cuboid(
   board.width*4,board.height*4,depth)
   .setTranslation(0,0,RC_TILE_SURFACE_Z-depth)
   .setRestitution(0).setFriction(.35));
  for(const particle of homeParticles.values())createHomeBody(particle);
 }
 function newHomeParticle(pawn:RCPawn,origin?:{
  position:{x:number;y:number;z:number};
  rotation?:{x:number;y:number;z:number;w:number};
 }){
  if(homeParticles.has(pawn.seal))return;
  const actor=actors.get(pawn.seal);
  let model:ReturnType<typeof makeRC3DPolytron>;
  if(actor){
   // Physically transfer the SAME visible mesh: no miniaturisation and
   // no jump to an off-screen exit or a fresh pose.
   actors.delete(pawn.seal);
   scene.remove(actor.shadow);
   actor.root.remove(actor.label);
   (actor.label.material as THREE.SpriteMaterial).map?.dispose();
   actor.label.material.dispose();
   model=actor;
  }else model=makeRC3DPolytron(pawn,homeRadius);
  const center=board.homes[rcParity(pawn.seal)];
  if(origin){
   model.root.position.set(origin.position.x,origin.position.y,origin.position.z);
   if(origin.rotation)model.root.quaternion.set(
    origin.rotation.x,origin.rotation.y,origin.rotation.z,origin.rotation.w);
  }else if(!actor)
   model.root.position.copy(rcScreenWorld(board,center,rcVisualPawnHeight(board)));
  if(!scene.children.includes(model.root))scene.add(model.root);
  const particle:HomeParticle={
   pawn,model,body:null,returnTarget:null,arrivalReported:false
  };
  homeParticles.set(pawn.seal,particle);
  createHomeBody(particle);
 }
 function transferToHome(pawn:RCPawn,pose?:{
  position:{x:number;y:number;z:number};
  rotation?:{x:number;y:number;z:number;w:number}
 }){
  pendingHome.add(pawn.seal);
  newHomeParticle(pawn,pose);
 }
 function transferParityToHome(pawns:readonly RCPawn[]){
  for(const pawn of pawns){
   pendingHome.add(pawn.seal);
   newHomeParticle(pawn);
  }
 }
 /**
  * After the second double tap, actual (unscaled) Rapier bodies fly from
  * Home to their unique opening hex. The caller resolves occupancy and
  * inheritance ONLY upon physical arrival. There is no scene teleport.
  */
 function startHomeReturns(pawns:readonly RCPawn[]){
  for(const pawn of pawns){
   if(!homeParticles.has(pawn.seal))newHomeParticle(pawn);
   const particle=homeParticles.get(pawn.seal);
   const cell=cellsByKey.get(openingCellKeyForSeal(pawn.seal));
   if(!particle||!cell)continue;
   particle.returnTarget=rcScreenWorld(board,cell,rcVisualPawnHeight(board));
   particle.arrivalReported=false;
  }
 }
 /** Cancel unfinished returns when the next double-tap recalls this parity. */
 function cancelHomeReturns(parity:"odd"|"even"){
  for(const [seal,p] of homeParticles)if(rcParity(seal)===parity){
   p.returnTarget=null;
   p.arrivalReported=false;
  }
 }
 function updateHome(home:readonly RCPawn[]){
  const active=new Set(home.map(p=>p.seal));
  for(const seal of active)pendingHome.delete(seal);
  // Remove obsolete Home occupants, including when a new game starts.
  // Pending captures are protected until their game state is committed.
  for(const [seal,p] of homeParticles){
   if(!active.has(seal)&&!pendingHome.has(seal)){
    if(homeWorld&&p.body)homeWorld.removeRigidBody(p.body);
    scene.remove(p.model.root);p.model.dispose();
    homeParticles.delete(seal);
   }
  }
  for(const pawn of home){
   const existing=homeParticles.get(pawn.seal);
   if(!existing)newHomeParticle(pawn);
   else if(existing.pawn.number!==pawn.number){
    existing.pawn=pawn;
    // The #1 opening does not change geometries on capture; if it ever
    // does, update the Home mesh but retain the physical rigid body.
    const replacement=makeRC3DPolytron(pawn,homeRadius);
    replacement.root.position.copy(existing.model.root.position);
    replacement.root.quaternion.copy(existing.model.root.quaternion);
    scene.remove(existing.model.root);existing.model.dispose();
    scene.add(replacement.root);existing.model=replacement;
   }
  }
 }
 function stepHome(dt:number,allowArrivals=true):number[]{
  if(!homeWorld||!homeParticles.size||dt<=0)return [];
  homeAccumulator=Math.min(.06,homeAccumulator+dt);
  let ticks=0;
  while(homeAccumulator>=fixedStep&&ticks++<8){
   for(const p of homeParticles.values()){
    const body=p.body;if(!body)continue;
    body.resetForces(true);
    const target=p.returnTarget??rcScreenWorld(
     board,board.homes[rcParity(p.pawn.seal)],rcVisualPawnHeight(board));
    const loc=body.translation(),velocity=body.linvel();
    // Mass-spring attractor plus genuine Rapier 3D rigid-body collisions.
    // Moderate damping allows wobble and piling without script-based slots.
    const omega=p.returnTarget?3.4:3.4;
    const zeta=p.returnTarget?.82:.66,m=body.mass();
    const fx=m*(omega*omega*(target.x-loc.x)-2*zeta*omega*velocity.x);
    const fy=m*(omega*omega*(target.y-loc.y)-2*zeta*omega*velocity.y);
    const fz=m*(omega*omega*(target.z-loc.z)-2*zeta*omega*velocity.z);
    const magnitude=Math.hypot(fx,fy,fz);
    const cap=850*m;
    const scale=magnitude>cap?cap/magnitude:1;
    body.addForce({x:fx*scale,y:fy*scale,z:fz*scale},true);
   }
   homeWorld.step();
   homeAccumulator-=fixedStep;
  }
  const arrived:number[]=[];
  for(const [seal,p] of homeParticles){
   if(!p.body)continue;
   p.model.root.position.copy(p.body.translation());
   p.model.root.quaternion.copy(p.body.rotation());
   if(!allowArrivals||!p.returnTarget||p.arrivalReported)continue;
   const loc=p.body.translation(),v=p.body.linvel();
   if(Math.hypot(loc.x-p.returnTarget.x,loc.y-p.returnTarget.y,
     loc.z-p.returnTarget.z)<Math.max(1.5,homeRadius*.58)&&
    Math.hypot(v.x,v.y,v.z)<Math.max(50,homeRadius*5)){
    p.arrivalReported=true;
    arrived.push(seal);
   }
  }
  return arrived;
 }
 function homeStats(){
  return {count:homeParticles.size,
   odd:[...homeParticles.keys()].filter(seal=>seal%2===1).length,
   even:[...homeParticles.keys()].filter(seal=>seal%2===0).length,
   physical:[...homeParticles.values()].filter(p=>p.body!==null).length};
 }
 function homeSnapshot(){
  return [...homeParticles.entries()].map(([seal,p])=>({
   seal,
   position:{...p.model.root.position},
   speed:p.body?Math.hypot(...Object.values(p.body.linvel())):0
  }));
 }

 // Temporary gold rings show exactly which cells were transmuted.
 // They fade without affecting full-size 3D actors or Rapier physics.
 const mutationHaloGeometry=new THREE.RingGeometry(
  board.size*.65,board.size*.91,6);
 const mutationHalos=new Map<number,{mesh:THREE.Mesh;age:number}>();
 function clearMutationHalo(seal:number){
  const halo=mutationHalos.get(seal);if(!halo)return;
  scene.remove(halo.mesh);
  (halo.mesh.material as THREE.MeshBasicMaterial).dispose();
  mutationHalos.delete(seal);
 }
 function pulseMutations(changes:readonly {seal:number;cellKey:string}[]){
  for(const change of changes){
   const cell=cellsByKey.get(change.cellKey);if(!cell)continue;
   clearMutationHalo(change.seal);
   const material=new THREE.MeshBasicMaterial({
    color:0xe0a433,transparent:true,opacity:.82,
    depthTest:false,depthWrite:false,side:THREE.DoubleSide
   });
   const mesh=new THREE.Mesh(mutationHaloGeometry,material);
   mesh.position.copy(rcScreenWorld(board,cell,RC_TILE_SURFACE_Z+1.4));
   mesh.renderOrder=75;
   scene.add(mesh);
   mutationHalos.set(change.seal,{mesh,age:0});
  }
 }
 function stepMutationHalos(dt:number){
  for(const [seal,halo] of mutationHalos){
   halo.age+=Math.max(0,dt);
   if(halo.age>=1.7){clearMutationHalo(seal);continue;}
   const t=halo.age/1.7;
   (halo.mesh.material as THREE.MeshBasicMaterial).opacity=
    .82*(1-t)*(0.82+0.18*Math.cos(t*Math.PI*8));
   halo.mesh.scale.setScalar(1+.15*t);
  }
 }

 let actors=new Map<number,RCWorldModel>();
 const selection=new THREE.Raycaster(),mouse=new THREE.Vector2();
 const pointerRay=(x:number,y:number)=>{
  mouse.set(x/board.width*2-1,1-y/board.height*2);
  selection.setFromCamera(mouse,camera);
 };
 function raycastCell(x:number,y:number):RCCell|null{
  pointerRay(x,y);
  const hit=selection.intersectObjects(tiles,false)[0];
  return hit?cellsByKey.get(hit.object.userData.cellKey as string)??null:null;
 }
 function raycastPawn(x:number,y:number):{pawn:RCPawn;cell:RCCell}|null{
  // Click/touch the actual elevated mesh: under a tilted camera the
  // Polytron projects to different pixels than the tile it sits on.
  pointerRay(x,y);
  let closest:{pawn:RCPawn;cell:RCCell;distance:number}|null=null;
  for(const actor of actors.values()){
   // Newly created/moved Polytrons can be picked before the next render
   // frame. Force the hierarchical world matrix up to date for Raycaster.
   actor.root.updateWorldMatrix(true,true);
   const hit=selection.intersectObject(actor.spin,true)[0];
   if(!hit||closest&&hit.distance>=closest.distance)continue;
   const cell=cellsByKey.get(actor.pawn.cellKey);
   if(cell)closest={pawn:actor.pawn,cell,distance:hit.distance};
  }
  return closest?{pawn:closest.pawn,cell:closest.cell}:null;
 }
 const plane=new THREE.Plane(new THREE.Vector3(0,0,1),0);
 function raycastBoardPlane(x:number,y:number):RCPoint|null{
  pointerRay(x,y);
  const hit=new THREE.Vector3();
  if(!selection.ray.intersectPlane(plane,hit))return null;
  return {x:hit.x+board.width/2,y:board.height/2-hit.y};
 }
 function disposeActor(actor:RCWorldModel){
  scene.remove(actor.root,actor.shadow);
  actor.dispose();
  (actor.label.material as THREE.SpriteMaterial).map?.dispose();
  actor.label.material.dispose();
 }
 function clearActors(){
  for(const actor of actors.values())disposeActor(actor);
  actors.clear();
 }
 /**
  * At the end of a Home return, hand over the SAME mesh and quaternion
  * to the board. The last few pixels are settled onto the exact tile,
  * without creating a second model or resetting its rotation.
  */
 function finishHomeReturnModels(pawns:readonly RCPawn[]){
  for(const pawn of pawns){
   const p=homeParticles.get(pawn.seal);
   if(!p?.arrivalReported||!p.returnTarget)continue;
   if(homeWorld&&p.body)homeWorld.removeRigidBody(p.body);
   homeParticles.delete(pawn.seal);pendingHome.delete(pawn.seal);
   const shadow=new THREE.Mesh(shadowGeometry,shadowMaterial);
   const label=makeTextSprite("#"+pawn.number);
   label.scale.set(Math.max(9,board.size*.75),
    Math.max(5,board.size*.375),1);
   label.position.set(0,-board.size*.72,4.5);
   p.model.root.add(label);
   scene.add(p.model.root,shadow);
   actors.set(pawn.seal,{...p.model,pawn,shadow,label});
  }
 }
 function setPawns(pawns:readonly RCPawn[],home:readonly RCPawn[]=[]){
  if(home.length===0&&pawns.length===72)pendingHome.clear();
  finishHomeReturnModels(pawns);
  updateHome(home);
  const updated=new Map<number,RCWorldModel>();
  const idleZ=rcVisualPawnHeight(board);
  for(const pawn of pawns){
   const cell=cellsByKey.get(pawn.cellKey);
   if(!cell)continue;
   const previous=actors.get(pawn.seal);
   // Keep the SAME Three.js object when a pawn moves. Recreating it after
   // every physics step would reset the quaternion and look like a jump cut.
   const reusable=previous&&previous.pawn.number===pawn.number&&
    previous.pawn.row===pawn.row&&previous.pawn.col===pawn.col;
   if(reusable){
    previous.pawn=pawn;
    previous.root.position.copy(rcScreenWorld(board,cell,idleZ));
    previous.shadow.position.copy(rcScreenWorld(board,cell,RC_TILE_SURFACE_Z+.05));
    updated.set(pawn.seal,previous);
    continue;
   }
   if(previous)disposeActor(previous);
   let actor:ReturnType<typeof makeRC3DPolytron>;
   try{actor=makeRC3DPolytron(pawn,rcVisualPawnRadius(board));}
   catch{continue;}
   const shadow=new THREE.Mesh(shadowGeometry,shadowMaterial);
   // A separate, planar shadow stays on the tile even as the rigid body
   // lifts or tumbles during real 3D impacts.
   shadow.position.copy(rcScreenWorld(board,cell,RC_TILE_SURFACE_Z+.05));
   scene.add(shadow);
   const label=makeTextSprite("#"+pawn.number);
   label.scale.set(Math.max(9,board.size*.75),Math.max(5,board.size*.375),1);
   label.position.set(0,-board.size*.72,4.5);
   actor.root.add(label);
   actor.root.position.copy(rcScreenWorld(board,cell,idleZ));
   scene.add(actor.root);
   updated.set(pawn.seal,{...actor,pawn,shadow,label});
  }
  for(const [seal,actor] of actors){
   if(!updated.has(seal)&&scene.children.includes(actor.root))
    disposeActor(actor);
  }
  actors=updated;
 }
 function moveActor(seal:number,point:RCPoint,z=rcVisualPawnHeight(board)){
  const actor=actors.get(seal);if(!actor)return;
  actor.root.position.copy(rcScreenWorld(board,point,z));
  actor.shadow.position.copy(rcScreenWorld(board,point,RC_TILE_SURFACE_Z+.05));
 }
 function actorOrientation(seal:number){
  const actor=actors.get(seal);
  if(!actor)return undefined;
  // Idle geometry lives on spin; once in physics, the entire rigid body
  // follows the Rapier quaternion with no additional visual tween.
  const q=actor.root.quaternion.clone().multiply(actor.spin.quaternion);
  return {x:q.x,y:q.y,z:q.z,w:q.w};
 }
 function physicalPose(seal:number,pose:{
  position:{x:number;y:number;z:number};
  rotation:{x:number;y:number;z:number;w:number}
 }){
  const actor=actors.get(seal);if(!actor)return;
  actor.root.position.set(pose.position.x,pose.position.y,pose.position.z);
  actor.root.quaternion.set(
   pose.rotation.x,pose.rotation.y,pose.rotation.z,pose.rotation.w
  );
  actor.spin.quaternion.identity();
  actor.shadow.position.set(pose.position.x,pose.position.y,RC_TILE_SURFACE_Z+.05);
 }
 function dragPreview(point:RCPoint|null){
  dragProxy.visible=point!==null;
  // The previous z=48 displaced the ghost relative to the target tile
  // as soon as the perspective camera was tilted.
  if(point)dragProxy.position.copy(
   rcScreenWorld(board,point,RC_TILE_SURFACE_Z+5));
 }
 let lastHoverKey:string|null=null,lastHoverOccupied=false;
 function hover(key:string|null,occupied:boolean,dragTarget=false){
  if(lastHoverKey!==key||lastHoverOccupied!==occupied){
   if(lastHoverKey!==null){
    const cell=cellsByKey.get(lastHoverKey);
    const outline=lines.get(lastHoverKey);
    if(cell&&outline)
     outline.material=cell.nucleus?nucleusEdgeMaterial:tileEdgeMaterial;
   }
   if(key!==null){
    const outline=lines.get(key);
    if(outline)outline.material=occupied?captureEdgeMaterial:hoverEdgeMaterial;
   }
   lastHoverKey=key;
   lastHoverOccupied=occupied;
  }
  const target=dragTarget&&key!==null?cellsByKey.get(key):null;
  targetMarker.visible=!!target;
  if(target){
   const p=rcScreenWorld(board,target,RC_TILE_SURFACE_Z+.7);
   targetMarker.position.copy(p);
   targetFill.material=occupied?targetCaptureMaterial:targetFreeMaterial;
   targetOutline.material=occupied?targetCaptureBorder:targetFreeBorder;
  }
 }
 let lastSpinTime:number|null=null;
 function rotateModels(time:number,active:ReadonlySet<number>=new Set()){
  const dt=lastSpinTime===null?0:Math.max(0,Math.min(.05,(time-lastSpinTime)/1000));
  lastSpinTime=time;
  for(const [seal,{spin}] of actors){
   if(active.has(seal))continue; // Rapier owns the 3D orientation in flight.
   // Incremental rotation: no absolute clock angle jump when returning from
   // a physical flight. Root quaternion retains its physical landing pose.
   spin.rotation.y+=dt*.28;
   spin.rotation.x+=dt*.06;
  }
 }
 function dispose(){
  setEvolutionPreview([]);
  previewGeometry.dispose();previewRingGeometry.dispose();
  for(const material of [...Object.values(previewMaterials),
   ...Object.values(previewRingMaterials)])material.dispose();
  for(const seal of [...mutationHalos.keys()])clearMutationHalo(seal);
  mutationHaloGeometry.dispose();
  clearActors();
  shape.tile.dispose();shape.line.dispose();
  tileMaterial.dispose();nucleusMaterial.dispose();
  tileEdgeMaterial.dispose();nucleusEdgeMaterial.dispose();
  hoverEdgeMaterial.dispose();captureEdgeMaterial.dispose();
  targetFreeMaterial.dispose();targetCaptureMaterial.dispose();
  targetFreeBorder.dispose();targetCaptureBorder.dispose();
  selectedFillMaterial.dispose();selectedBorderMaterial.dispose();
  dragMaterial.dispose();dragOutlineMaterial.dispose();
  ringGeometry.dispose();ringMaterial.dispose();
  shadowGeometry.dispose();shadowMaterial.dispose();
  homeDisposed=true;
  for(const particle of homeParticles.values()){
   scene.remove(particle.model.root);particle.model.dispose();
  }
  homeParticles.clear();pendingHome.clear();
  homeWorld?.free();homeWorld=null;
  homeShape.tile.dispose();homeShape.line.dispose();
  for(const material of [...homeMaterials,...homeEdgeMaterials])material.dispose();
 }
 return {scene,camera,view,cellsByKey,raycastCell,raycastPawn,
  raycastBoardPlane,setSelectedCell,
  setPawns,moveActor,actorOrientation,physicalPose,dragPreview,
  initHomePhysics,stepHome,transferToHome,transferParityToHome,
   startHomeReturns,cancelHomeReturns,homeStats,homeSnapshot,
  hover,rotateModels,setEvolutionPreview,
  pulseMutations,stepMutationHalos,dispose};
}
