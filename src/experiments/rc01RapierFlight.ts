/**
 * RC01: real Rapier 3D rigid-body movement.
 *
 * Both Polytrons have true convex-hull colliders derived from the SAME Conway
 * geometry that Three.js renders (a sphere only if the hull is degenerate).
 * Rapier integrates velocity, mass, torque and restitution at 120 Hz; capture
 * is armed only by a Rapier COLLISION EVENT, never by a proximity threshold.
 *
 * The player's tile decision remains deterministic: a damped spring pulls the
 * attacker toward the nominated tile and its final logical position snaps to
 * that tile only after the physical performance has completed. On an actual
 * collision, a directed "return home" field assists the departing opponent.
 * That field is a GAME LAW, not an assertion of purely passive mechanics.
 */
import * as RAPIER from "@dimforge/rapier3d-compat";
import {polytronGeometry} from "@/polytron/polytron";
import {pawnDNA,pawnPalette,type RCPawn} from "@/polytron/rc01Game";
import type {RCBoard,RCPoint} from "@/polytron/rc01Board";
import {rcScreenWorld} from "@/experiments/rc01ThreeScene";

export const RC_RAPIER_FIXED_STEP=1/120;
const MAX_SECONDS=4.0;
const MIN_MOVE_TIME=.45;
const MIN_CAPTURE_TIME=.95;
export type RCPhysicsPose={
 seal:number;
 position:{x:number;y:number;z:number};
 rotation:{x:number;y:number;z:number;w:number};
 speed:number;angularSpeed:number;
};
export type RCPhysicsFrame={
 attacker:RCPhysicsPose;victim:RCPhysicsPose|null;
 collided:boolean;contacts:number;time:number;
 done:boolean;success:boolean;
};
type ActorBody={body:RAPIER.RigidBody;collider:RAPIER.Collider;seal:number};
const vec=(x:number,y:number,z:number)=>({x,y,z});
const mag=(v:{x:number;y:number;z:number})=>Math.hypot(v.x,v.y,v.z);
export const rcRapierPawnRadius=(board:RCBoard)=>
 Math.max(23,Math.min(31,board.width/14.4))*.88;

/** Hull using render geometry's exact radius and centroid. */
export function makeRCPhysicalCollider(pawn:RCPawn,radius:number):RAPIER.ColliderDesc{
 const geometry=polytronGeometry(pawnDNA(pawn),undefined,{
  pair:pawnPalette(pawn),order:"contrast"
 });
 geometry.solid.computeBoundingSphere();
 const centre=geometry.solid.boundingSphere?.center;
 const sourceRadius=geometry.solid.boundingSphere?.radius??1;
 const raw=geometry.solid.getAttribute("position");
 const vertices=new Float32Array(raw.count*3);
 const multiplier=radius/Math.max(.1,sourceRadius);
 for(let i=0;i<raw.count;i++){
  vertices[i*3]=(raw.getX(i)-(centre?.x??0))*multiplier;
  vertices[i*3+1]=(raw.getY(i)-(centre?.y??0))*multiplier;
  vertices[i*3+2]=(raw.getZ(i)-(centre?.z??0))*multiplier;
 }
 geometry.solid.dispose();geometry.edges.dispose();
 // Actual hull is preferred; ball fallback is also a genuine Rapier solid.
 const hull=vertices.length>=12?RAPIER.ColliderDesc.convexHull(vertices):null;
 return hull??RAPIER.ColliderDesc.ball(radius*.78);
}
export type RCPhysicsStart={
 board:RCBoard;from:RCPoint;to:RCPoint;attacker:RCPawn;
 victim:RCPawn|null;attackerRotation?:{x:number;y:number;z:number;w:number};
 victimRotation?:{x:number;y:number;z:number;w:number};
};
export class RC01RapierFlight{
 readonly world:RAPIER.World;
 readonly queue:RAPIER.EventQueue;
 readonly from:string;
 readonly to:string;
 readonly attackerSeal:number;
 readonly victimSeal:number|null;
 readonly radius:number;
 private attacker:ActorBody;
 private victim:ActorBody|null;
 private target:{x:number;y:number;z:number};
 private origin:{x:number;y:number;z:number};
 private away:{x:number;y:number};
 private board:RCBoard;
 private seconds=0;
 private hits=0;
 private collided=false;
 private ended=false;
 private succeeded=false;
 private constructor(args:RCPhysicsStart,world:RAPIER.World,queue:RAPIER.EventQueue,
   attacker:ActorBody,victim:ActorBody|null,radius:number){
  this.board=args.board;this.world=world;this.queue=queue;
  this.attacker=attacker;this.victim=victim;this.radius=radius;
  this.attackerSeal=args.attacker.seal;this.victimSeal=args.victim?.seal??null;
  this.from=args.attacker.cellKey;this.to=args.victim?.cellKey??"";
  const xy=rcScreenWorld(args.board,args.to);
  const origin=rcScreenWorld(args.board,args.from);
  const z=radius+4;
  this.target=vec(xy.x,xy.y,z);
  this.origin=vec(origin.x,origin.y,z);
  const dx=xy.x-origin.x,dy=xy.y-origin.y;
  const d=Math.max(1,Math.hypot(dx,dy));
  this.away={x:dx/d,y:dy/d};
 }
 static async create(args:RCPhysicsStart):Promise<RC01RapierFlight>{
  await RAPIER.init();
  const world=new RAPIER.World(vec(0,0,-55));
  world.timestep=RC_RAPIER_FIXED_STEP;
  const queue=new RAPIER.EventQueue(true);
  // Common physical ground: no piece can fall through the board. Bodies are
  // fully dynamic in x, y and z, with genuine angular inertia.
  world.createCollider(
   RAPIER.ColliderDesc.cuboid(args.board.width*1.7,args.board.height*1.7,3)
    .setTranslation(0,0,0).setRestitution(.52).setFriction(.38)
  );
  const radius=rcRapierPawnRadius(args.board);
  const height=radius+4;
  const add=(pawn:RCPawn,where:RCPoint,rotation?:RCPhysicsStart["attackerRotation"]):ActorBody=>{
   const xy=rcScreenWorld(args.board,where,height);
   const desc=RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(xy.x,xy.y,xy.z)
    .setLinearDamping(.22).setAngularDamping(.58)
    .setCanSleep(false).setCcdEnabled(true);
   if(rotation)desc.setRotation(rotation);
   const body=world.createRigidBody(desc);
   const cdesc=makeRCPhysicalCollider(pawn,radius)
    .setRestitution(.80).setFriction(.25)
    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
    .setMass(1.2+Math.min(2,pawn.number/24));
   const collider=world.createCollider(cdesc,body);
   return {body,collider,seal:pawn.seal};
  };
  const attacker=add(args.attacker,args.from,args.attackerRotation);
  const victim=args.victim?add(args.victim,args.to,args.victimRotation):null;
  const flight=new RC01RapierFlight(args,world,queue,attacker,victim,radius);
  // Initial push is a physical impulse; the spring then pulls toward the
  // destination. No linear interpolation, tween, or forced path keyframes.
  const dir=flight.away;
  attacker.body.applyImpulse(vec(dir.x*7,dir.y*7,4),true);
  return flight;
 }
 get impactCount(){return this.hits;}
 get hasCollided(){return this.collided;}
 get completed(){return this.ended;}
 get success(){return this.succeeded;}
 private pose(actor:ActorBody):RCPhysicsPose{
  const t=actor.body.translation(),r=actor.body.rotation();
  return {seal:actor.seal,position:{...t},rotation:{...r},
   speed:mag(actor.body.linvel()),angularSpeed:mag(actor.body.angvel())};
 }
 private applyAttackerField(){
  const body=this.attacker.body;
  const p=body.translation(),v=body.linvel();
  const mass=body.mass();
  // Under-damped second-order controller: it accelerates into the target,
  // decelerates before arrival, and can genuinely overshoot and rebound.
  const spring=21,damping=5.2;
  body.addForce(vec(
   mass*(spring*(this.target.x-p.x)-damping*v.x),
   mass*(spring*(this.target.y-p.y)-damping*v.y),
   mass*(32*(this.target.z-p.z)-8*v.z)
  ),true);
 }
 private applyHomeField(){
  if(!this.collided||!this.victim)return;
  const body=this.victim.body,p=body.translation();
  const mass=body.mass();
  const outward=this.away;
  // Once the REAL contact occurs, the house draws the departing individual.
  // This authored field acts on the rigid body, not on its rendered mesh.
  const projection=p.x*outward.x+p.y*outward.y;
  const additional=projection<Math.max(this.board.width,this.board.height)?
   1250:0;
  body.addForce(vec(
   mass*(additional*outward.x+120*this.away.y),
   mass*(additional*outward.y-120*this.away.x),
   mass*(260-10*body.linvel().z)
  ),true);
 }
 step():RCPhysicsFrame{
  if(this.ended)return this.snapshot();
  this.applyAttackerField();
  this.applyHomeField();
  this.world.step(this.queue);
  this.seconds+=RC_RAPIER_FIXED_STEP;
  this.queue.drainCollisionEvents((a,b,started)=>{
   if(!started||!this.victim)return;
   const ah=this.attacker.collider.handle,vh=this.victim.collider.handle;
   if((a===ah&&b===vh)||(a===vh&&b===ah)){
    this.hits++;
    this.collided=true;
    // A small off-axis physical torque applied at impact makes the response
    // legible in a top-down camera. Momentum transfer itself is RAPiER's.
    this.victim.body.applyTorqueImpulse(vec(12,-7,11),true);
   }
  });
  const p=this.attacker.body.translation(),v=this.attacker.body.linvel();
  const near=Math.hypot(p.x-this.target.x,p.y-this.target.y);
  const speed=Math.hypot(v.x,v.y);
  const elapsed=this.seconds;
  if(this.victim){
   const left=this.collided&&(
    Math.hypot(this.victim.body.translation().x-this.target.x,
     this.victim.body.translation().y-this.target.y)>
       Math.max(4*this.radius,2.5*this.board.size));
   if(this.collided&&elapsed>=MIN_CAPTURE_TIME&&
     (left&&(near<this.radius*.65||elapsed>2.5))){
    this.ended=true;this.succeeded=true;
   }
  }else if(elapsed>=MIN_MOVE_TIME&&near<this.radius*.13&&speed<14){
   this.ended=true;this.succeeded=true;
  }
  if(elapsed>=MAX_SECONDS){
   this.ended=true;
   // Captures may never commit without a genuine collision.
   this.succeeded=this.victim?this.collided:true;
  }
  return this.snapshot();
 }
 snapshot():RCPhysicsFrame{
  return {
   attacker:this.pose(this.attacker),
   victim:this.victim?this.pose(this.victim):null,
   collided:this.collided,contacts:this.hits,time:this.seconds,
   done:this.ended,success:this.succeeded
  };
 }
 dispose(){
  this.queue.free();
  this.world.free();
 }
}
