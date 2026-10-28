import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import * as THREE from "three";

const tmp=await mkdtemp(join(process.cwd(),".rapier-picking-"));
try{
 const outfile=join(tmp,"pick.mjs");
 await build({entryPoints:["src/experiments/rapierPicking.ts"],outfile,
  format:"esm",platform:"node",bundle:true,logLevel:"warning"});
 const p=await import(pathToFileURL(outfile).href);
 const at={x:100,y:120};
 const set=[
  {id:"P01",kind:"controller",x:102,y:117,radiusPx:29,depth:.15},
  {id:"v1",kind:"traveler",x:102,y:118,radiusPx:4,depth:.1},
  {id:"P02",kind:"controller",x:240,y:210,radiusPx:29,depth:.15}
 ];
 assert.deepEqual(p.rankPickCandidates(set,at,["v1","P01"]),["v1","P01"],
  "true raycast hits must take precedence and preserve front-to-back order");
 assert.deepEqual(p.rankPickCandidates(set,at,[]),["P01","v1"],
  "tiny traveler with 4px projected radius must be selectable by screen-space fallback");
 assert.deepEqual(p.rankPickCandidates(set,{x:0,y:0},[]),[],
  "distant clicks cannot select an unrelated body");
 assert.deepEqual(p.rankPickCandidates(set,{x:241,y:208},[]),["P02"]);
 const order=p.rankPickCandidates(set,at,["v1","P01"]);
 let prev=null;
 for(const expected of ["v1","P01","v1"]){
  const r=p.nextPick(order,at,prev);assert.equal(r.chosen,expected);
  prev=r.state;
 }
 assert.equal(p.nextPick(order,{x:140,y:120},prev).chosen,"v1",
  "new click region resets overlap cycling");
 assert.equal(p.nextPick([],at,prev).chosen,null);
 const tetra=[[1,0,0],[-1,0,0],[0,2,0],[0,0,1]];
 const controller=p.outlineRadius(tetra,.68,"controller");
 const traveler=p.outlineRadius(tetra,.26,"traveler");
 assert(controller>traveler*1.5);
 for(const v of tetra)assert(controller>Math.hypot(...v)*.68,
  "controller ground outline must surround its full rotation-independent 3D footprint");
 assert(p.outlineRadius([[0,0,0]],.5,"controller")>=.9,
  "even tiny transformer geometry deserves a visible halo");
 assert.throws(()=>p.outlineRadius(tetra,0,"controller"),/Invalid/);
 // Perspective and overhead projections both have finite, positive extent.
 const origin=new THREE.Vector3(0,1,0),right=new THREE.Vector3();
 const cameras=[
  new THREE.OrthographicCamera(-9.3,9.3,9.3,-9.3,.1,90),
  new THREE.PerspectiveCamera(42,1,.1,90)
 ];
 cameras[0].position.set(0,28,.001);cameras[0].up.set(0,0,-1);cameras[0].lookAt(0,0,0);
 cameras[1].position.set(0,11,15);cameras[1].lookAt(0,.8,0);
 for(const c of cameras){
  c.updateMatrixWorld(true);
  right.setFromMatrixColumn(c.matrixWorld,0).normalize();
  const centre=origin.clone().project(c);
  const edge=origin.clone().addScaledVector(right,controller).project(c);
  const pxRadius=Math.abs(edge.x-centre.x)*500/2;
  assert(pxRadius>2&&Number.isFinite(pxRadius),"screen-space pick tolerance must work in each camera");
 }
 console.log(JSON.stringify({passed:true,controllerHalo:controller,travelerHalo:traveler,
  checks:["raycast exact","small-target fallback","click cycling","bounded selection","rotation-safe halo",
   "top/prospective camera projection"]},null,2));
}finally{await rm(tmp,{recursive:true,force:true});}
