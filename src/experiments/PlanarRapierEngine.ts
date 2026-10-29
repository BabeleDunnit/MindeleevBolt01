/**
 * Sprint 27 — Planar Mutatron with actual Rapier 3D rigid bodies.
 * Translational paths are organized on horizontal XZ, with temporary hops
 * and FULL 3D rotations under real convex-hull contacts.
 * Soft vertical recovery pulls bodies to sink height (~1m) after a hop.
 *
 * Shape-DNA -> preferred separation is a deliberately authored GAME LAW.
 * Neither mutations nor the hover field are claimed mechanically conservative.
 */
import * as RAPIER from "@dimforge/rapier3d-compat";
import {dnaToPoly} from "@/polytron/polytron";
import {initialIslands,decode,encode,wrapDNA,cutDNA,affinity,randomGenerator} from "./IslandAffinityEngine";
import {cubeFusion,analyzeEncounter,type Feasibility} from "./rapierCompatibility";

export const FIXED_STEP=1/120;
export const SINK_HEIGHT=1.03,AREA_RADIUS=8.2;
export type Dynamics={period:number;dampingRatio:number;launchSpeed:number;
 restitution:number;hoverHeight:number;angularDamping:number;planarDrag:number;
 pairRestMin:number;pairRestSpread:number;pairDamping:number};
export const DEFAULT_DYNAMICS:Dynamics={period:1.25,dampingRatio:.58,launchSpeed:3.5,
 restitution:.72,hoverHeight:SINK_HEIGHT,angularDamping:.16,planarDrag:.7,
 pairRestMin:1.25,pairRestSpread:1.5,pairDamping:.95};
export const desiredPairDistance=(similarity:number,dynamics:Dynamics):number=>
 dynamics.pairRestMin+dynamics.pairRestSpread*(1-Math.max(0,Math.min(1,similarity)));
export type Scenario="color"|"five"|"quiet";
export type FamilySizes={controller:number;traveler:number};
/** Independent force strengths; zero turns the corresponding field off. */
export type ForceChannels={transformers:number;travelers:number;source:number};
export const DEFAULT_FORCE_CHANNELS:ForceChannels={transformers:.08,travelers:.85,source:.25};
export type ForceVector={x:number;z:number;magnitude:number};
export type StationForce={id:string;name:string;dna:string;distance:number;
 similarity:number;rest:number;force:ForceVector;compatibility:Feasibility};
export type PairForce={id:string;dna:string;distance:number;similarity:number;
 rest:number;force:ForceVector};
export type ForceDiagnostics={step:number;transformers:ForceVector;travelers:ForceVector;
 source:ForceVector;vertical:number;stations:StationForce[];pairs:PairForce[]};
export type BufferView={id:string;dna:string;elapsedSteps:number;remainingSteps:number};
export const DEFAULT_SIZES:FamilySizes={controller:.68,traveler:.26};
export type Plan={scenario:Scenario;count:1|6|12;dna:string;returnPalette:number;
 seed:number;dynamics:Dynamics;sizes:FamilySizes;forceChannels:ForceChannels;
 stationDNA:Record<string,string>;travelerDNA:Record<string,string>};
export const DEFAULT_PLAN:Plan={scenario:"color",count:6,dna:"01C",returnPalette:2,
 seed:47,dynamics:DEFAULT_DYNAMICS,sizes:DEFAULT_SIZES,forceChannels:DEFAULT_FORCE_CHANNELS,stationDNA:{},travelerDNA:{}};
export type AgentType="controller"|"traveler";
export type AgentView={id:string;type:AgentType;name:string;dna:string;energy:number;
 x:number;y:number;z:number;qx:number;qy:number;qz:number;qw:number;
 vx:number;vy:number;vz:number;touches:number;status:string;forces?:ForceDiagnostics;buffer?:BufferView};
export type Impact={step:number;kind:"color"|"fuse"|"split"|"clone"|"filter"|"null"|"buffer"|"return"|"escape"|"impact"|"edit";
 subject:string;station?:string;stationId?:string;otherId?:string;successors?:string[];before?:string;after?:string;note:string};
export const isCollisionEvent=(event:Impact):boolean=>
 ["color","fuse","split","clone","filter","null","buffer","impact"].includes(event.kind);
export type Stats={step:number;impacts:number;geneticChanges:number;returns:number;escaped:number;
 peakHeight:number;peakSpeed:number;active:number;retained:number;inputEnergy:number;returnedEnergy:number;
 escapedEnergy:number;carriedEnergy:number};
type Internal={id:string;kind:AgentType;name:string;dna:string;energy:number;
 body:RAPIER.RigidBody;collider:RAPIER.Collider;touches:number;lastContact:number;
 state:"flying"|"buffered"|"returned"|"escaped"|"station";bufferId?:string;bufferStep?:number};
const MAX_AGENTS=48;

const NODE_SCENARIOS:Record<Scenario,string[]>={
 color:["02T","02T","02T","02T","02T","02T"],
 five:["a02T","01C","02O","02D","02I","02T"],
 quiet:["01I","01I","01I","01I","01I","01I"]
};
const lengthXZ=(v:{x:number;z:number})=>Math.hypot(v.x,v.z);
const radius=(v:{x:number;z:number})=>Math.max(.0001,lengthXZ(v));
export function springCoefficients(mass:number,period:number,dampingRatio:number){
 const omega=2*Math.PI/Math.max(.25,period);
 return {stiffness:mass*omega*omega,damping:2*dampingRatio*omega*mass};
}
export function polytronHull(dna:string,scale:number):Float32Array{
 const p=dnaToPoly(dna);
 return Float32Array.from(p.vertices.flatMap(v=>[v[0]*scale,v[1]*scale,v[2]*scale]));
}
const vec=(x:number,y:number,z:number)=>({x,y,z});
const forceVec=(x=0,z=0):ForceVector=>({x,z,magnitude:Math.hypot(x,z)});
const accumulate=(a:ForceVector,x:number,z:number):ForceVector=>forceVec(a.x+x,a.z+z);
export class PlanarRapierEngine{
 readonly world:RAPIER.World;
 readonly eventQueue:RAPIER.EventQueue;
 readonly plan:Plan;
 readonly events:Impact[]=[];
 private agents=new Map<string,Internal>();
 private colliders=new Map<number,string>();
 private rng:()=>number;
 private lastForces=new Map<string,ForceDiagnostics>();
 private nextId=1;
 stepIndex=0;
 impacts=0; geneticChanges=0;returns=0;escaped=0;peakHeight=SINK_HEIGHT;peakSpeed=0;
 returnedEnergy=0;escapedEnergy=0;
 private constructor(world:RAPIER.World,queue:RAPIER.EventQueue,plan:Plan){
  this.world=world;this.eventQueue=queue;this.plan=plan;this.rng=randomGenerator(plan.seed);
 }
 static async create(plan:Plan=DEFAULT_PLAN):Promise<PlanarRapierEngine>{
  await RAPIER.init();
  const world=new RAPIER.World({x:0,y:-9.81,z:0});
  world.timestep=FIXED_STEP;
  const queue=new RAPIER.EventQueue(true),engine=new PlanarRapierEngine(world,queue,plan);
  // The actual Mutatron plane, immovable. Height is not a free 3D maze.
  world.createCollider(RAPIER.ColliderDesc.cuboid(AREA_RADIUS, .08, AREA_RADIUS)
    .setTranslation(0,-.08,0).setRestitution(.35).setFriction(.4));
  const samples=initialIslands("R0").nodes;
  for(let i=0;i<6;i++){
   const layout=samples[i],dna=plan.stationDNA[layout.id]??NODE_SCENARIOS[plan.scenario][i];
   engine.makeAgent("controller",layout.id,layout.name,dna,
    layout.x/22,plan.dynamics.hoverHeight,layout.y/22,0,0,0,0);
  }
  for(let i=0;i<plan.count;i++){
   // Radial directions are aligned to the physical hexagonal island axes.
   const theta=Math.atan2(samples[0].y,samples[0].x)+i*2*Math.PI/plan.count;
   const speed=plan.dynamics.launchSpeed;
   // Spawn clear of the source and each other. For 12 carriers use two
   // interleaved concentric hex rings, not twelve overlapping hulls.
   const startRadius=plan.count===12?(i%2===0?1.1:1.8):1.07;
   const travelerId="v"+engine.nextId++;
   engine.makeAgent("traveler",travelerId,"Viaggiatore "+(i+1),plan.travelerDNA[travelerId]??plan.dna,
    startRadius*Math.cos(theta),plan.dynamics.hoverHeight,startRadius*Math.sin(theta),
    speed*Math.cos(theta),0,speed*Math.sin(theta),6/plan.count);
  }
  return engine;
 }
 private makeAgent(kind:AgentType,id:string,name:string,dna:string,
  x:number,y:number,z:number,vx:number,vy:number,vz:number,energy:number){
  decode(dna);
  const d=kind==="controller"
   ?RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z)
   :RAPIER.RigidBodyDesc.dynamic().setTranslation(x,y,z)
    .setLinvel(vx,vy,vz).setLinearDamping(this.plan.dynamics.planarDrag)
    .setAngularDamping(this.plan.dynamics.angularDamping).setCcdEnabled(true).setCanSleep(false);
  const body=this.world.createRigidBody(d);
  const shape=RAPIER.ColliderDesc.convexHull(polytronHull(dna,this.plan.sizes[kind]));
  if(!shape)throw Error("Impossibile creare convex hull: "+dna);
  shape.setRestitution(this.plan.dynamics.restitution).setFriction(.22)
   .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
  if(kind==="traveler")shape.setMass(1);
  const collider=this.world.createCollider(shape,body);
  this.agents.set(id,{kind,id,name,dna,body,collider,energy,touches:0,lastContact:-1e6,
   state:kind==="controller"?"station":"flying"});
  this.colliders.set(collider.handle,id);
 }
 private replaceDNA(agent:Internal,nextDNA:string){
  decode(nextDNA);
  // Keep translation, orientation and linear/angular velocity; Rapier recalculates
  // collider inertia after genotype changes. Strict angular-momentum conservation
  // across metamorphosis is deferred to the physical-energy research phase.
  const old=agent.collider;
  this.colliders.delete(old.handle);
  this.world.removeCollider(old,true);
  const colliderDesc=RAPIER.ColliderDesc.convexHull(polytronHull(nextDNA,this.plan.sizes[agent.kind]));
  if(!colliderDesc)throw Error("Convex hull genotipo risultante impossibile: "+nextDNA);
  colliderDesc.setRestitution(this.plan.dynamics.restitution).setFriction(.22)
   .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
  if(agent.kind==="traveler")colliderDesc.setMass(1);
  agent.collider=this.world.createCollider(colliderDesc,agent.body);
  this.colliders.set(agent.collider.handle,agent.id);
  agent.dna=nextDNA;
 }
 /** Inspector edit: rebuild the actual Rapier collider and keep the rigid body's pose.
  * The event is explicit; persisting this choice into a repeatable scenario is done
  * by the UI with stationDNA/travelerDNA and a fresh world reset. */
 editDNA(id:string,nextDNA:string):boolean{
  const agent=this.agents.get(id);
  if(!agent||(agent.state!=="station"&&agent.state!=="flying"&&agent.state!=="buffered"))return false;
  const before=agent.dna;
  if(before===nextDNA)return true;
  decode(nextDNA);
  this.replaceDNA(agent,nextDNA);
  this.events.push({step:this.stepIndex,kind:"edit",subject:id,
   before,after:nextDNA,note:"Inspector: DNA impostato esplicitamente"});
  return true;
 }
 private remove(agent:Internal,state:"returned"|"escaped"|"buffered"){
  agent.state=state;
  if(state==="buffered"){
   agent.body.setLinvel(vec(0,0,0),true);
   agent.body.setAngvel(vec(0,0,0),true);
   agent.body.setEnabled(false);
  }else{
   this.colliders.delete(agent.collider.handle);
   this.world.removeRigidBody(agent.body);
  }
 }
 private createChildren(parent:Internal,products:string[],energyShares:number[]):string[]{
  const newIds:string[]=[];
  const pos=parent.body.translation(),vel=parent.body.linvel(),ang=parent.body.angvel();
  // In the planar game, a clone/split is separated tangent to the trajectory;
  // upward impulse permits brief overpasses. Any kinetic work during splitting
  // is explicitly an UNMODELLED transformation cost at this prototype stage.
  for(let j=0;j<products.length;j++){
   const s=j===0?-1:1,rad=Math.max(.01,Math.hypot(vel.x,vel.z)),tx=-vel.z/rad,tz=vel.x/rad;
   const id="v"+this.nextId++;
   newIds.push(id);
   this.makeAgent("traveler",id,"Viaggiatore "+id,products[j],
    pos.x+s*.25*tx,pos.y+.08,pos.z+s*.25*tz,
    vel.x+s*.4*tx,.4,vel.z+s*.4*tz,energyShares[j]);
   const child=this.agents.get(id)!;child.touches=parent.touches;child.lastContact=this.stepIndex;
   child.body.setAngvel(ang,true);
  }
  this.remove(parent,"escaped");parent.state="returned"; // retired carrier, ENERGY moved to children
  parent.energy=0;
  return newIds;
 }
 private handleContact(subject:Internal,station:Internal){
  if(subject.state!=="flying"||station.kind!=="controller")return;
  if(this.stepIndex-subject.lastContact<18)return;
  subject.lastContact=this.stepIndex;subject.touches++;
  this.impacts++;
  const before=subject.dna,p=decode(station.dna),incoming=decode(before);
  let kind:Impact["kind"]="null",after=before,note="Trasformazione nulla";
  let successors:string[]|undefined;
  const wrapped=(base:string)=>wrapDNA(base,p.ops);
  try{
   if(p.seed==="T"){
    const next=wrapped(encode({...incoming,palette:p.palette}));
    if(next){if(next!==before)this.replaceDNA(subject,next);after=next;kind=next===before?"null":"color";
     note="Colora "+p.palette+(p.ops?" e applica Conway "+p.ops:"");}
   }else if(p.seed==="I"){
    if(incoming.palette===p.palette){
     const next=wrapped(before);
     if(next){if(next!==before)this.replaceDNA(subject,next);after=next;kind="filter";note="Filtro compatibile";}
    }else note="Filtro non compatibile: il viaggiatore prosegue";
   }else if(p.seed==="O"&&this.activeWalkers()<MAX_AGENTS-1){
    const parts=cutDNA(before,this.rng());
    if(parts&&subject.energy>.28){
     const dna=parts.map(x=>wrapped(x));
     if(dna.every((x):x is string=>x!==null)){
      const energy=subject.energy/2;successors=this.createChildren(subject,dna,[energy,energy]);
      after=dna.join(" + ");kind="split";note="Fissione genetica: due DNA diversi";
     }
    }
   }else if(p.seed==="D"&&this.activeWalkers()<MAX_AGENTS-1&&subject.energy>.28){
    const dna=wrapped(before);
    if(dna){
     successors=this.createChildren(subject,[dna,dna],[subject.energy/2,subject.energy/2]);
     after=dna+" ×2";kind="clone";note="Clonazione: due DNA identici";
    }
   }else if(p.seed==="C"){
    const other=station.bufferId?this.agents.get(station.bufferId):undefined;
    if(!other||other.state!=="buffered"){
     station.bufferId=subject.id;station.bufferStep=this.stepIndex;
     subject.state="buffered";subject.body.setLinvel(vec(0,0,0),true);
     subject.body.setEnabled(false);kind="buffer";note="In attesa di un secondo viaggiatore";
    }else{
     const feasibility=cubeFusion(station.dna,other.dna,before);
     const merged=feasibility.product??null;
     if(merged){this.replaceDNA(subject,merged);subject.energy+=other.energy;
      other.energy=0;this.colliders.delete(other.collider.handle);this.world.removeRigidBody(other.body);
      other.state="returned";after=merged;kind="fuse";note="Fusione con "+other.id;}
     else{other.state="flying";other.body.setEnabled(true);
      other.body.setLinvel(vec(-1.2,0,.8),true);note="Fusione impossibile: nessun DNA alterato";}
     station.bufferId=undefined;station.bufferStep=undefined;
    }
   }
  }catch(e){note="Operazione non applicabile: "+String(e);}
  if((kind==="color"||kind==="filter"||kind==="fuse")&&after!==before||
    kind==="split"||kind==="clone")this.geneticChanges++;
  this.events.push({step:this.stepIndex,kind,subject:subject.id,station:station.name,stationId:station.id,successors,before,after,note});
 }
 private activeWalkers(){return [...this.agents.values()].filter(a=>a.kind==="traveler"&&a.state==="flying").length;}
 tick(){
  this.stepIndex++;
  const {period,dampingRatio,hoverHeight}=this.plan.dynamics;
  // Controller positions are fixed near sink y≈1. Travelers briefly jump,
  // but vertical spring + gravity bring them back to the same plane.
  const travelers=[...this.agents.values()].filter(a=>a.kind==="traveler"&&a.state==="flying");
  const stations=[...this.agents.values()].filter(a=>a.kind==="controller");
  this.lastForces.clear();
  const forceNotes=new Map<string,ForceDiagnostics>();
  for(const t of travelers)forceNotes.set(t.id,{
   step:this.stepIndex,transformers:forceVec(),travelers:forceVec(),
   source:forceVec(),vertical:0,stations:[],pairs:[]
  });
  for(const t of travelers){
   // Rapier user forces persist between world steps. Without reset this is
   // cumulative acceleration, NOT a Hooke spring or a controlled 3D field.
   t.body.resetForces(true);
   const p=t.body.translation(),v=t.body.linvel(),m=Math.max(.01,t.body.mass());
   const {stiffness:k,damping:c}=springCoefficients(m,period,dampingRatio);
   // Counteracts gravity at the equilibrium height. No free vertical flight.
   const vertical=m*9.81-k*(p.y-hoverHeight)-c*v.y;
   t.body.addForce(vec(0,vertical,0),true);
   forceNotes.get(t.id)!.vertical=vertical;
   // Inspect ALL stations even when their forces are switched off:
   // genetic compatibility must not disappear from the inspector.
   for(const st of stations){
     const s=st.body.translation(),dx=s.x-p.x,dz=s.z-p.z,dist=Math.max(.0001,Math.hypot(dx,dz));
     const {similarity,rest}=affinity(t.dna,st.dna);
     const ideal=Math.max(.58,Math.min(1.7,rest/32));
     // Softened gravity-like attraction acts at long range. In contrast,
     // preferred distances influence a mild local spring; the actual
     // collision impulse comes ONLY from Rapier's convex-hull solver.
     const intensity=Math.max(0,this.plan.forceChannels.transformers);
     const grav=(4+5*similarity)/(.7+dist*dist);
     const local=(dist-ideal)*.15;
     const strength=intensity>0?
      Math.max(-12,Math.min(12,(grav+local)*intensity)):0;
     const fx=strength*dx/dist,fz=strength*dz/dist;
     t.body.addForce(vec(fx,0,fz),true);
     const d=forceNotes.get(t.id)!;
     d.transformers=accumulate(d.transformers,fx,fz);
     const candidate=st.bufferId?this.agents.get(st.bufferId):undefined;
     const waiting=candidate?.state==="buffered"?candidate.dna:undefined;
     d.stations.push({id:st.id,name:st.name,dna:st.dna,distance:dist,
      similarity,rest:ideal,force:forceVec(fx,fz),
      compatibility:analyzeEncounter(st.dna,t.dna,waiting,t.energy,travelers.length)});
   }
   const r=lengthXZ(p);
   if(this.plan.forceChannels.source>0&&t.touches>0&&decode(t.dna).palette===this.plan.returnPalette&&r>0.2){
    const pull=this.plan.forceChannels.source*(3.0+1.3*r);
    const sx=-p.x/r*pull,sz=-p.z/r*pull;
    t.body.addForce(vec(sx,0,sz),true);
    forceNotes.get(t.id)!.source=forceVec(sx,sz);
   }
  }
  // Shape-DNA sets a signed equilibrium spring: repulsive inside d0, attractive
  // beyond d0, with a short attractive tail to avoid globally contracting clumps.
  // Relative radial damping dissipates oscillations as the flock settles.
  for(let i=0;i<travelers.length;i++)for(let j=i+1;j<travelers.length;j++){
   const a=travelers[i],b=travelers[j],p=a.body.translation(),q=b.body.translation();
   const dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);
   const angle=(i*17+j*37)*2.399963229728653;
   const nx=d>1e-5?dx/d:Math.cos(angle),nz=d>1e-5?dz/d:Math.sin(angle);
   const relation=affinity(a.dna,b.dna);
   const rest=desiredPairDistance(relation.similarity,this.plan.dynamics);
   const gap=d-rest;
   const falloff=gap>0?Math.exp(-Math.pow(gap/1.1,2)):1;
   const intensity=Math.max(0,this.plan.forceChannels.travelers);
   const k=intensity*(.35+.65*relation.similarity);
   const av=a.body.linvel(),bv=b.body.linvel();
   const radialSpeed=(bv.x-av.x)*nx+(bv.z-av.z)*nz;
   const reducedMass=Math.max(.01,(a.body.mass()*b.body.mass())/(a.body.mass()+b.body.mass()));
   const damping=2*this.plan.dynamics.pairDamping*Math.sqrt(k*reducedMass);
   const magnitude=k>0?Math.max(-9,Math.min(9,(k*gap+damping*radialSpeed)*falloff)):0;
   const fx=nx*magnitude,fz=nz*magnitude;
   if(magnitude!==0){
    a.body.addForce(vec(fx,0,fz),true);
    b.body.addForce(vec(-fx,0,-fz),true);
   }
   const fa=forceNotes.get(a.id)!,fb=forceNotes.get(b.id)!;
   fa.travelers=accumulate(fa.travelers,fx,fz);
   fb.travelers=accumulate(fb.travelers,-fx,-fz);
   fa.pairs.push({id:b.id,dna:b.dna,distance:d,similarity:relation.similarity,rest,
    force:forceVec(fx,fz)});
   fb.pairs.push({id:a.id,dna:a.dna,distance:d,similarity:relation.similarity,rest,
    force:forceVec(-fx,-fz)});
  }
  for(const [id,reading] of forceNotes){
   reading.stations.sort((a,b)=>b.force.magnitude-a.force.magnitude);
   reading.pairs.sort((a,b)=>a.distance-b.distance);
   this.lastForces.set(id,reading);
  }
  this.world.step(this.eventQueue);
  const contacts:{walker:Internal;station:Internal}[]=[];
  this.eventQueue.drainCollisionEvents((h1,h2,started)=>{
   if(!started)return;
   const a=this.agents.get(this.colliders.get(h1)??""),b=this.agents.get(this.colliders.get(h2)??"");
   if(!a||!b)return;
   if(a.kind==="traveler"&&b.kind==="controller")contacts.push({walker:a,station:b});
   else if(b.kind==="traveler"&&a.kind==="controller")contacts.push({walker:b,station:a});
   else if(a.kind==="traveler"&&b.kind==="traveler"){
    this.events.push({step:this.stepIndex,kind:"impact",subject:a.id,station:b.id,otherId:b.id,
     note:"Urto reale fra convex hull: impulso e rotazione Rapier"});
    this.impacts++;
   }
  });
  contacts.sort((a,b)=>a.walker.id.localeCompare(b.walker.id)||a.station.id.localeCompare(b.station.id));
  for(const {walker,station} of contacts)this.handleContact(walker,station);
  for(const st of stations)if(st.bufferId&&this.stepIndex-(st.bufferStep??0)>360){
   const w=this.agents.get(st.bufferId);
   if(w&&w.state==="buffered"){
    w.state="flying";w.body.setEnabled(true);
    w.body.setLinvel(vec(1.2,.15,0),true);w.lastContact=this.stepIndex;
   }
   st.bufferId=undefined;st.bufferStep=undefined;
  }
  for(const a of travelers)if(a.state==="flying"){
   const pos=a.body.translation(),v=a.body.linvel(),speed=Math.hypot(v.x,v.y,v.z);
   this.peakHeight=Math.max(this.peakHeight,pos.y);this.peakSpeed=Math.max(this.peakSpeed,speed);
   if(lengthXZ(pos)>AREA_RADIUS||pos.y < -.8){
    this.remove(a,"escaped");this.escaped++;this.escapedEnergy+=a.energy;
    this.events.push({step:this.stepIndex,kind:"escape",subject:a.id,note:"Oltre il bordo del Mutatron"});
   }else if(a.touches>0&&decode(a.dna).palette===this.plan.returnPalette&&lengthXZ(pos)<.48
      &&pos.x*v.x+pos.z*v.z<0){
    this.remove(a,"returned");this.returns++;this.returnedEnergy+=a.energy;
    this.events.push({step:this.stepIndex,kind:"return",subject:a.id,note:"Riassorbito dall'Architron-Sorgente"});
   }
  }
 }
 agentsView():AgentView[]{
  return [...this.agents.values()].filter(a=>a.state==="flying"||a.state==="station"||a.state==="buffered").map(a=>{
   const p=a.body.translation(),q=a.body.rotation(),v=a.body.linvel();
   const partner=a.bufferId?this.agents.get(a.bufferId):undefined;
   const buffer=a.kind==="controller"&&partner?.state==="buffered"?{
    id:partner.id,dna:partner.dna,elapsedSteps:this.stepIndex-(a.bufferStep??this.stepIndex),
    remainingSteps:Math.max(0,361-(this.stepIndex-(a.bufferStep??this.stepIndex)))}:undefined;
   return {id:a.id,type:a.kind,name:a.name,dna:a.dna,energy:a.energy,
    x:p.x,y:p.y,z:p.z,qx:q.x,qy:q.y,qz:q.z,qw:q.w,
    vx:v.x,vy:v.y,vz:v.z,touches:a.touches,status:a.state,
    forces:this.lastForces.get(a.id),buffer};
  });
 }
 stats():Stats{
  const walkers=[...this.agents.values()].filter(a=>a.kind==="traveler");
  const carriedEnergy=walkers.filter(a=>a.state==="flying"||a.state==="buffered")
    .reduce((s,a)=>s+a.energy,0);
  return {step:this.stepIndex,impacts:this.impacts,geneticChanges:this.geneticChanges,
   returns:this.returns,escaped:this.escaped,peakHeight:this.peakHeight,peakSpeed:this.peakSpeed,
   active:walkers.filter(a=>a.state==="flying").length,
   retained:walkers.filter(a=>a.state==="buffered").length,inputEnergy:6,
   returnedEnergy:this.returnedEnergy,escapedEnergy:this.escapedEnergy,carriedEnergy};
 }
 dispose(){this.eventQueue.free();this.world.free();}
}
