import * as THREE from "three";
import {polytronGeometry} from "@/polytron/polytron";
import {pawnDNA,pawnPalette,type RCPawn} from "@/polytron/rc01Game";
import type {RCBoard,RCCell,RCPoint} from "@/polytron/rc01Board";

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
  const theta=(i*60-90)*Math.PI/180;
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
  const a=(i*60-90)*Math.PI/180;
  positions.push(Math.cos(a)*radius,Math.sin(a)*radius,0);
 }
 const line=new THREE.BufferGeometry();
 line.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
 return {tile,line};
}
export function createRC3DWorld(board:RCBoard){
 const scene=new THREE.Scene();
 scene.background=new THREE.Color("#edf0ee");
 const camera=new THREE.OrthographicCamera(
  -board.width/2,board.width/2,board.height/2,-board.height/2,.1,2600
 );
 camera.position.set(0,0,1200);camera.lookAt(0,0,0);
 camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 // The camera is an explicit Three.js camera: a future zoom-to-3D view can
 // animate its pose instead of replacing a flat SVG layer.
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
 // Tiles must be pickable immediately, even before the first render frame.
 scene.updateMatrixWorld(true);
 const shadowGeometry=new THREE.CircleGeometry(board.size*.58,36);
 const shadowMaterial=new THREE.MeshBasicMaterial({
  color:0x254e41,transparent:true,opacity:.10,depthWrite:false
 });
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
 const plane=new THREE.Plane(new THREE.Vector3(0,0,1),0);
 function raycastBoardPlane(x:number,y:number):RCPoint|null{
  pointerRay(x,y);
  const hit=new THREE.Vector3();
  if(!selection.ray.intersectPlane(plane,hit))return null;
  return {x:hit.x+board.width/2,y:board.height/2-hit.y};
 }
 function clearActors(){
  for(const actor of actors.values()){
   scene.remove(actor.root);
   actor.dispose();
   (actor.label.material as THREE.SpriteMaterial).map?.dispose();
   actor.label.material.dispose();
  }
  actors.clear();
 }
 function setPawns(pawns:readonly RCPawn[]){
  clearActors();
  const next=new Map<number,RCWorldModel>();
  for(const pawn of pawns){
   const cell=cellsByKey.get(pawn.cellKey);if(!cell)continue;
   let actor:ReturnType<typeof makeRC3DPolytron>;
   try{actor=makeRC3DPolytron(pawn,Math.max(23,Math.min(31,board.width/14.4))*.88);}
   catch{continue;}
   const shadow=new THREE.Mesh(shadowGeometry,shadowMaterial);
   shadow.position.z=-5;
   actor.root.add(shadow);
   const label=makeTextSprite("#"+pawn.number);
   label.position.set(0,-board.size*.76,4.5);
   actor.root.add(label);
   const xy=rcScreenWorld(board,cell,9);
   actor.root.position.copy(xy);
   scene.add(actor.root);
   next.set(pawn.seal,{...actor,pawn,shadow,label});
  }
  actors=next;
 }
 function moveActor(seal:number,point:RCPoint,z=9){
  const actor=actors.get(seal);if(!actor)return;
  actor.root.position.copy(rcScreenWorld(board,point,z));
 }
 function hover(key:string|null,occupied:boolean){
  for(const [cellKey,line] of lines){
   const cell=cellsByKey.get(cellKey)!;
   line.material=cellKey!==key?
    (cell.nucleus?nucleusEdgeMaterial:tileEdgeMaterial):
    (occupied?captureEdgeMaterial:hoverEdgeMaterial);
  }
 }
 function rotateModels(time:number){
  for(const {spin} of actors.values()){
   spin.rotation.y=.68+time*.00028;
   spin.rotation.x=.25+Math.sin(time*.00021)*.11;
   spin.rotation.z=Math.sin(time*.00013)*.09;
  }
 }
 function dispose(){
  clearActors();
  shape.tile.dispose();shape.line.dispose();
  tileMaterial.dispose();nucleusMaterial.dispose();
  tileEdgeMaterial.dispose();nucleusEdgeMaterial.dispose();
  hoverEdgeMaterial.dispose();captureEdgeMaterial.dispose();
  ringGeometry.dispose();ringMaterial.dispose();
  shadowGeometry.dispose();shadowMaterial.dispose();
 }
 return {scene,camera,cellsByKey,raycastCell,raycastBoardPlane,
  setPawns,moveActor,hover,rotateModels,dispose};
}
