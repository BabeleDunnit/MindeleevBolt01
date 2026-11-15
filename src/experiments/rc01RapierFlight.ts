/**
 * RC01: real Rapier 3D rigid-body movement.
 *
 * Both Polytrons have true convex-hull colliders derived from the SAME Conway
 * geometry that Three.js renders (a sphere only if the hull is degenerate).
 * Rapier integrates velocity, mass, torque and restitution at 120 Hz; capture
 * is armed only by a Rapier COLLISION EVENT, never by a proximity threshold.
 *
 * The tile decision is deterministic, but animation ends ONLY after the
 * physical body actually settles: no completion based on a hard-coded flight
 * duration, no visible reset of position or orientation.
 *
 * Polytrons hover in a zero-gravity 3D environment. There is deliberately NO
 * Rapier ground or boundary to bounce against; the target attractor supplies
 * vertical restoring forces. After a real collision, a one-way homeward field
 * carries the victim out of view without a floor/viewport bounce.
 */
import * as RAPIER from "@dimforge/rapier3d-compat";
import {polytronGeometry} from "@/polytron/polytron";
import {pawnDNA,pawnPalette,type RCPawn} from "@/polytron/rc01Game";
import type {RCBoard,RCCell} from "@/polytron/rc01Board";
import {rcScreenWorld} from "@/experiments/rc01ThreeScene";

export const RC_RAPIER_FIXED_STEP=1/120;
const MAX_SECONDS=5.0; // failure guard only: never commits an unsettled move
const MIN_MOVE_TIME=.25;
const MIN_CAPTURE_TIME=.65;
const REST_WINDOW=.14;
const ATTRACTOR_OMEGA=7.4;
const ATTRACTOR_DAMPING_RATIO=.88;
const ATTRACTOR_K=ATTRACTOR_OMEGA*ATTRACTOR_OMEGA;
const ATTRACTOR_D=2*ATTRACTOR_DAMPING_RATIO*ATTRACTOR_OMEGA;
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
 board:RCBoard;from:RCCell;to:RCCell;attacker:RCPawn;
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
 private restSeconds=0;
 private constructor(args:RCPhysicsStart,world:RAPIER.World,queue:RAPIER.EventQueue,
   attacker:ActorBody,victim:ActorBody|null,radius:number){
  this.board=args.board;this.world=world;this.queue=queue;
  this.attacker=attacker;this.victim=victim;this.radius=radius;
  this.attackerSeal=args.attacker.seal;this.victimSeal=args.victim?.seal??null;
  this.from=args.from.key;this.to=args.to.key;
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
  // Zero gravity: floating Polytrons should not continuously strike a floor.
  // Their height is maintained by the same damped attractor as x and y.
  const world=new RAPIER.World(vec(0,0,0));
  world.timestep=RC_RAPIER_FIXED_STEP;
  const queue=new RAPIER.EventQueue(true);
  // NO floor and NO lateral world boundaries: expelled bodies depart cleanly.
  // Both bodies are still real Rapier dynamic rigid bodies with 3D hulls.
  const radius=rcRapierPawnRadius(args.board);
  const height=radius+4;
  const add=(pawn:RCPawn,where:RCCell,rotation?:RCPhysicsStart["attackerRotation"]):ActorBody=>{
   const xy=rcScreenWorld(args.board,where,height);
   const desc=RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(xy.x,xy.y,xy.z)
    .setLinearDamping(.15).setAngularDamping(1.45)
    .setCanSleep(false).setCcdEnabled(true);
   if(rotation)desc.setRotation(rotation);
   const body=world.createRigidBody(desc);
   const cdesc=makeRCPhysicalCollider(pawn,radius)
    .setRestitution(.46).setFriction(.18)
    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
    .setMass(1.2+Math.min(2,pawn.number/24));
   const collider=world.createCollider(cdesc,body);
   return {body,collider,seal:pawn.seal};
  };
  const attacker=add(args.attacker,args.from,args.attackerRotation);
  const victim=args.victim?add(args.victim,args.to,args.victimRotation):null;
  const flight=new RC01RapierFlight(args,world,queue,attacker,victim,radius);
  // Start at rest: the body ACCELERATES under the target attraction instead
  // of receiving an instantaneous launch impulse.
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
  // F = m * (omega² * error - 2*zeta*omega * velocity).
  // zeta = .88 means a small, quickly fading overshoot (never endless
  // oscillation). The time constant is independent of trip distance and mass.
  const spring=ATTRACTOR_K,damping=ATTRACTOR_D;
  body.addForce(vec(
   mass*(spring*(this.target.x-p.x)-damping*v.x),
   mass*(spring*(this.target.y-p.y)-damping*v.y),
   mass*(spring*(this.target.z-p.z)-damping*v.z)
  ),true);
 }
 private applyHomeField(){
  if(!this.collided||!this.victim)return;
  const body=this.victim.body;
  const mass=body.mass(),v=body.linvel(),outward=this.away;
  // A one-way attraction to an invisible home (outside the viewport).
  // Drag acts only along the outward component. With no ground, screen wall
  // or target restoring force on this body it cannot bounce at the edge.
  const radialVelocity=v.x*outward.x+v.y*outward.y;
  const drive=Math.max(0,1500-2.4*radialVelocity);
  body.addForce(vec(
   mass*drive*outward.x,
   mass*drive*outward.y,
   mass*(170-3*v.z)
  ),true);
 }
 step():RCPhysicsFrame{
  if(this.ended)return this.snapshot();
  // Rapier USER forces persist across ticks. Without explicit resets the
  // attractor accumulates all past forces and accelerates wildly, producing
  // endless oscillation and a visible hard stop (the original RC01 bug).
  this.attacker.body.resetForces(true);
  this.victim?.body.resetForces(true);
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
  const heightError=Math.abs(p.z-this.target.z);
  const speed=Math.hypot(v.x,v.y);
  const verticalSpeed=Math.abs(v.z);
  const elapsed=this.seconds;
  const nearEnough=near<Math.max(.6,this.radius*.035)&&
   heightError<Math.max(.6,this.radius*.05)&&
   speed<2.5&&verticalSpeed<2.5;
  // A short window of actual near-rest motion eliminates false success
  // while crossing the target at high speed. The visible "snap" is <1px.
  this.restSeconds=nearEnough?this.restSeconds+RC_RAPIER_FIXED_STEP:0;
  const rested=this.restSeconds>=REST_WINDOW;
  if(this.victim){
   const vpos=this.victim.body.translation();
   // The invisible "home" is beyond the visible camera bounds, not just
   // three pawn radii away from the collision. Never cut the victim off
   // while it is still plainly visible on the Mutatron.
   const beyondX=Math.abs(vpos.x)>this.board.width/2+this.radius*1.2;
   const beyondY=Math.abs(vpos.y)>this.board.height/2+this.radius*1.2;
   const offscreen=beyondX||beyondY;
   if(this.collided&&elapsed>=MIN_CAPTURE_TIME&&offscreen&&rested){
    this.ended=true;this.succeeded=true;
   }
  }else if(elapsed>=MIN_MOVE_TIME&&rested){
   this.ended=true;this.succeeded=true;
  }
  if(elapsed>=MAX_SECONDS&&!this.ended){
   this.ended=true;
   // Timeout is an abort, NOT success: never teleport an unsettled body.
   this.succeeded=false;
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
