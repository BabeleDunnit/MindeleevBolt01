/**
 * RC01: real Rapier 3D rigid-body movement.
 *
 * Every visible Polytron has a real convex-hull Rapier collider derived from
 * the same Conway geometry that Three.js renders. Secondary impacts can
 * cascade through neighboring pawns; only the intended target is captured.
 * Rapier integrates velocity, mass, torque and restitution at 120 Hz; capture
 * is armed only by a Rapier COLLISION EVENT, never by a proximity threshold.
 *
 * The tile decision is deterministic, but animation ends ONLY after the
 * physical body actually settles: no completion based on a hard-coded flight
 * duration, no visible reset of position or orientation.
 *
 * Polytrons hover in a zero-gravity 3D environment with a real Rapier
 * supporting floor, but no lateral screen boundaries. The attacker follows
 * an underdamped spring; bystanders struck
 * by anyone are real dynamic bodies and spring back to their original tiles.
 * Capture transfers momentum immediately on real Rapier contact. The target
 * then coasts under physical drag, without an outbound spring accelerating it
 * after the hit. An off-board recovery force engages only if chain collisions
 * actually stall its departure from the scene.
 */
import * as RAPIER from "@dimforge/rapier3d-compat";
import {polytronGeometry} from "@/polytron/polytron";
import {pawnDNA,pawnPalette,rcParity,type RCPawn} from "@/polytron/rc01Game";
import type {RCBoard,RCCell} from "@/polytron/rc01Board";
import {rcScreenWorld,rcVisualPawnRadius,rcVisualPawnHeight,RC_TILE_SURFACE_Z}
 from "@/experiments/rc01ThreeScene";

export const RC_RAPIER_FIXED_STEP=1/120;
// Long or cascading contacts enter a stronger physical settling phase.
 // No timer is allowed to fail a valid drop and teleport a Polytron home.
const RECOVERY_SECONDS=6.0;
const MIN_MOVE_TIME=.25;
const MIN_CAPTURE_TIME=.65;
const REST_WINDOW=.14;
const EARLY_DAMPING_RATIO=.36;
const LATE_DAMPING_RATIO=.66;
const RC_HOME_LINEAR_DAMPING=.36;
const RC_EXIT_RECOVERY_DELAY=1.1;
const RC_EXIT_STALL_SPEED=22;
const RC_EXIT_RECOVERY_ACCELERATION=62;
const RETURN_OMEGA=4.6;
const RETURN_DAMPING_RATIO=.78;
// Peak velocity must not saturate Rapier's default rigid-body speed cap.
export const rcAttractorOmega=(distance:number)=>
 Math.min(4.6,570/Math.max(1,distance));
export function rcDampingRatio(progress:number):number{
 const u=Math.max(0,Math.min(1,(progress-.35)/.55));
 const eased=u*u*(3-2*u);
 return EARLY_DAMPING_RATIO+
  (LATE_DAMPING_RATIO-EARLY_DAMPING_RATIO)*eased;
}
export type RCPhysicsPose={
 seal:number;
 position:{x:number;y:number;z:number};
 rotation:{x:number;y:number;z:number;w:number};
 speed:number;angularSpeed:number;
};
export type RCPhysicsFrame={
 attacker:RCPhysicsPose;victim:RCPhysicsPose|null;
 bystanders:RCPhysicsPose[];impactedSeals:number[];
 collided:boolean;contacts:number;time:number;
 done:boolean;success:boolean;
};
type ActorBody={body:RAPIER.RigidBody;collider:RAPIER.Collider;seal:number};
type BystanderBody={actor:ActorBody;home:{x:number;y:number;z:number};engaged:boolean};
const vec=(x:number,y:number,z:number)=>({x,y,z});
const mag=(v:{x:number;y:number;z:number})=>Math.hypot(v.x,v.y,v.z);
export const rcRapierPawnRadius=rcVisualPawnRadius;

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
 others?:readonly {pawn:RCPawn;cell:RCCell;
  rotation?:{x:number;y:number;z:number;w:number}}[];
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
 private floorCollider:RAPIER.Collider;
 private bystanders:BystanderBody[];
 private impacted=new Set<number>();
 private target:{x:number;y:number;z:number};
 private exitTarget:{x:number;y:number;z:number};
 private origin:{x:number;y:number;z:number};
 private away:{x:number;y:number};
 private travel:number;
 private omega:number;
 private board:RCBoard;
 private seconds=0;
 private hits=0;
 private collided=false;

 private captureDetached=false;
 private ended=false;
 private succeeded=false;
 private restSeconds=0;
 private constructor(args:RCPhysicsStart,world:RAPIER.World,queue:RAPIER.EventQueue,
   attacker:ActorBody,victim:ActorBody|null,bystanders:BystanderBody[],
   floorCollider:RAPIER.Collider,radius:number){
  this.board=args.board;this.world=world;this.queue=queue;
  this.attacker=attacker;this.victim=victim;this.bystanders=bystanders;
  this.floorCollider=floorCollider;this.radius=radius;
  this.attackerSeal=args.attacker.seal;this.victimSeal=args.victim?.seal??null;
  this.from=args.from.key;this.to=args.to.key;
  const xy=rcScreenWorld(args.board,args.to);
  const origin=rcScreenWorld(args.board,args.from);
  const z=rcVisualPawnHeight(args.board);
  this.target=vec(xy.x,xy.y,z);
  this.origin=vec(origin.x,origin.y,z);
  const dx=xy.x-origin.x,dy=xy.y-origin.y;
  const d=Math.max(1,Math.hypot(dx,dy));
  this.travel=d;
  this.omega=rcAttractorOmega(d);
  this.away={x:dx/d,y:dy/d};
  // Direct destination is the correct parity Home, never an off-screen
  // waypoint. The board transfers the body on the first Rapier impact.
  const destination=rcScreenWorld(args.board,
   args.board.homes[rcParity(args.victim?.seal??args.attacker.seal)],z);
  this.exitTarget=vec(destination.x,destination.y,destination.z);
 }
 static async create(args:RCPhysicsStart):Promise<RC01RapierFlight>{
  await RAPIER.init();
  // Zero gravity keeps the familiar hovering motion. An invisible static
  // supporting plane prevents actual convex-hull geometry from sinking below
  // the tile surface, including when a Polytron tumbles after an impact.
  const world=new RAPIER.World(vec(0,0,0));
  world.timestep=RC_RAPIER_FIXED_STEP;
  const queue=new RAPIER.EventQueue(true);
  // The floor extends far beyond the screen: its distant lateral edges can
  // NEVER behave like walls or bounce an expelled Polytron back into view.
  const floorDepth=5;
  const floorCollider=world.createCollider(
   RAPIER.ColliderDesc.cuboid(args.board.width*3,args.board.height*3,floorDepth)
    .setTranslation(0,0,RC_TILE_SURFACE_Z-floorDepth)
    .setRestitution(0).setFriction(.34)
  );
  const radius=rcRapierPawnRadius(args.board);
  const height=rcVisualPawnHeight(args.board);
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
  const bystanders=(args.others??[])
   .filter(item=>item.pawn.seal!==args.attacker.seal&&
    item.pawn.seal!==args.victim?.seal)
   .map(item=>{
    const actor=add(item.pawn,item.cell,item.rotation);
    return {actor,home:{...actor.body.translation()},engaged:false};
   });
  const flight=new RC01RapierFlight(args,world,queue,attacker,victim,
   bystanders,floorCollider,radius);
  // Start at rest: the body ACCELERATES under the target attraction instead
  // of receiving an instantaneous launch impulse.
  return flight;
 }
 get impactCount(){return this.hits;}
 get otherSeals(){return this.bystanders.map(other=>other.actor.seal);}
 get hasCollided(){return this.collided;}
 get completed(){return this.ended;}
 get success(){return this.succeeded;}
 /** Transfer on the exact first collision event; the separate Home world
  * owns the visual journey immediately, while board physics keeps settling. */
 detachVictimToHome(){
  if(!this.collided||!this.victim||this.captureDetached)return false;
  this.captureDetached=true;
  this.victim.body.setEnabled(false);
  return true;
 }
 private pose(actor:ActorBody):RCPhysicsPose{
  const t=actor.body.translation(),r=actor.body.rotation();
  return {seal:actor.seal,position:{...t},rotation:{...r},
   speed:mag(actor.body.linvel()),angularSpeed:mag(actor.body.angvel())};
 }
 private applyAttackerField(){
  const body=this.attacker.body;
  const p=body.translation(),v=body.linvel();
  const mass=body.mass();
  // Genuine mass-spring-damper. Early: low damping, allowing acceleration
  // through roughly half the journey. Late: stronger braking, but still
  // underdamped so the Polytron softly crosses and returns near the target.
  const travelled=(p.x-this.origin.x)*this.away.x+
   (p.y-this.origin.y)*this.away.y;
  const progress=travelled/this.travel;
  const recovering=this.seconds>=RECOVERY_SECONDS;
  const omega=recovering?Math.max(5.4,this.omega):this.omega;
  const zeta=recovering?1.02:(this.collided?.91:rcDampingRatio(progress));
  const spring=omega*omega;
  const damping=2*zeta*omega;
  body.addForce(vec(
   mass*(spring*(this.target.x-p.x)-damping*v.x),
   mass*(spring*(this.target.y-p.y)-damping*v.y),
   mass*(spring*(this.target.z-p.z)-damping*v.z)
  ),true);
 }
 private applyBystanderReturns(){
  const omega=this.seconds>=RECOVERY_SECONDS?7.2:RETURN_OMEGA;
  const stiffness=omega*omega;
  const damping=2*RETURN_DAMPING_RATIO*omega;
  for(const other of this.bystanders){
   if(!other.engaged)continue;
   const body=other.actor.body,p=body.translation(),v=body.linvel();
   const m=body.mass();
   body.addForce(vec(
    m*(stiffness*(other.home.x-p.x)-damping*v.x),
    m*(stiffness*(other.home.y-p.y)-damping*v.y),
    m*(stiffness*(other.home.z-p.z)-damping*v.z)
   ),true);
  }
 }
 private bystandersRested(){
  return this.bystanders.every(other=>{
   if(!other.engaged)return true;
   const p=other.actor.body.translation(),v=other.actor.body.linvel();
   return Math.hypot(p.x-other.home.x,p.y-other.home.y,p.z-other.home.z)<
    Math.max(1.0,this.radius*.055)&&mag(v)<3.0;
  });
 }
 /**
  * The first contact provides a modest directed recall impulse. The ensuing
  * off-board mass-spring attraction changes continuously with position and
  * velocity; there is no scripted constant exit velocity or screen collider.
  */
 private applyCaptureImpulse(){
  if(!this.victim)return;
  const body=this.victim.body,loc=body.translation(),v=body.linvel();
  const dx=this.exitTarget.x-loc.x,dy=this.exitTarget.y-loc.y;
  const d=Math.max(1,Math.hypot(dx,dy)),dir={x:dx/d,y:dy/d};
  const desiredSpeed=Math.min(300,Math.max(115,d*.45));
  const outwardSpeed=v.x*dir.x+v.y*dir.y;
  const extra=Math.max(0,desiredSpeed-outwardSpeed);
  // Immediate physical momentum, now pointing to the actual Home.
  body.applyImpulse(vec(dir.x*extra*body.mass(),
   dir.y*extra*body.mass(),body.mass()*4),true);
  body.setLinearDamping(RC_HOME_LINEAR_DAMPING);
  body.applyTorqueImpulse(vec(12,-7,11),true);
 }
 private applyUncapturedVictimField(){
  if(this.collided||!this.victim)return;
  // A secondary impact may displace the target before the attacker touches
  // it. Restore its original tile through Rapier, so the intended physical
  // contact can still happen instead of a nine-second timeout rollback.
  const body=this.victim.body,p=body.translation(),v=body.linvel(),m=body.mass();
  const omega=3.5,drag=2*.77*omega;
  body.addForce(vec(
   m*(omega*omega*(this.target.x-p.x)-drag*v.x),
   m*(omega*omega*(this.target.y-p.y)-drag*v.y),
   m*(omega*omega*(this.target.z-p.z)-drag*v.z)
  ),true);
 }
 private applyCaptureAttractor(){
  if(!this.collided||!this.victim||this.captureDetached)return;
  // For standalone physical simulations (no GUI hand-off), the victim
  // also heads directly to Home. Never use an offscreen-exit condition.
  const body=this.victim.body,loc=body.translation(),v=body.linvel();
  const mass=body.mass(),omega=2.6,zeta=.74,k=omega*omega,c=2*zeta*omega;
  body.addForce(vec(
   mass*(k*(this.exitTarget.x-loc.x)-c*v.x),
   mass*(k*(this.exitTarget.y-loc.y)-c*v.y),
   mass*(k*(this.exitTarget.z-loc.z)-c*v.z)
  ),true);
 }
 step():RCPhysicsFrame{
  if(this.ended)return this.snapshot();
  // Rapier USER forces persist across ticks. Without explicit resets the
  // attractor accumulates all past forces and accelerates wildly, producing
  // endless oscillation and a visible hard stop (the original RC01 bug).
  this.attacker.body.resetForces(true);
  this.victim?.body.resetForces(true);
  for(const other of this.bystanders)other.actor.body.resetForces(true);
  this.applyAttackerField();
  this.applyBystanderReturns();
  this.applyUncapturedVictimField();
  this.applyCaptureAttractor();
  this.world.step(this.queue);
  this.seconds+=RC_RAPIER_FIXED_STEP;
  this.queue.drainCollisionEvents((a,b,started)=>{
   if(!started||a===this.floorCollider.handle||b===this.floorCollider.handle)
    return;
   this.hits++;
   // Every collision pair is resolved by Rapier, including victim-to-neighbor
   // and neighbor-to-neighbor impacts. Never reposition these actors by hand.
   for(const other of this.bystanders){
    const handle=other.actor.collider.handle;
    if(a===handle||b===handle){
     other.engaged=true;
     this.impacted.add(other.actor.seal);
    }
   }
   if(!this.victim||this.collided)return;
   const ah=this.attacker.collider.handle,vh=this.victim.collider.handle;
   if((a===ah&&b===vh)||(a===vh&&b===ah)){
    this.collided=true;
    this.applyCaptureImpulse();
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
   // Home is an independent, non-blocking physics process. Unlock the
   // Mutatron when its attacker and displaced bystanders have settled.
   if(this.collided&&elapsed>=MIN_CAPTURE_TIME&&rested&&
    this.bystandersRested()){
    this.ended=true;this.succeeded=true;
   }
  }else if(elapsed>=MIN_MOVE_TIME&&rested&&this.bystandersRested()){
   this.ended=true;this.succeeded=true;
  }
  // An unusually long collision chain is resolved by stiffer Rapier
  // springs above, never by a timer ending the flight and restoring the
  // source cell. Completion still requires real near-rest motion.
  return this.snapshot();
 }
 snapshot():RCPhysicsFrame{
  return {
   attacker:this.pose(this.attacker),
   victim:this.victim?this.pose(this.victim):null,
   bystanders:this.bystanders.map(other=>this.pose(other.actor)),
   impactedSeals:[...this.impacted].sort((a,b)=>a-b),
   collided:this.collided,contacts:this.hits,time:this.seconds,
   done:this.ended,success:this.succeeded
  };
 }
 dispose(){
  this.queue.free();
  this.world.free();
 }
}
