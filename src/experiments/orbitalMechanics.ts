/**
 * Sprint 34 Orbital Mutatron.
 * A deliberately game-sized, stationary-center gravity model on XZ.
 * Not an astronomical n-body simulation: transformer positions are fixed,
 * the axial hex grid is not used to discretize traveler motion, and physical
 * contacts are still solved by Rapier 3D.
 */
export type MotionLaw="springs"|"gravity";
export type ReactionTrigger="collision"|"dwell"|"orbits";
export type OrbitalConfig={
 motion:MotionLaw;trigger:ReactionTrigger;
 gravity:number;softening:number;influenceRadius:number;
 dwellSeconds:number;revolutions:number;launchRadius:number;
};
export const DEFAULT_ORBITAL:OrbitalConfig={
 motion:"springs",trigger:"collision",gravity:3,softening:.4,
 influenceRadius:2.4,dwellSeconds:1.6,revolutions:1,launchRadius:1.7
};
export type OrbitalTrack={inside:boolean;seconds:number;angle:number;
 revolutions:number;lastAngle:number|null;activated:boolean};
export const EMPTY_ORBITAL_TRACK:OrbitalTrack={
 inside:false,seconds:0,angle:0,revolutions:0,lastAngle:null,activated:false
};
export const TWO_PI=2*Math.PI;
const finitePositive=(x:number)=>Number.isFinite(x)?Math.max(0,x):0;
/** Softened inverse-square acceleration with finite center acceleration. */
export function orbitalAcceleration(dx:number,dz:number,mu:number,softening:number){
 const soft=Math.max(.01,finitePositive(softening));
 const r2=dx*dx+dz*dz+soft*soft;
 const weight=finitePositive(mu)/Math.pow(r2,1.5);
 return {x:dx*weight,z:dz*weight};
}
/** Balance radial acceleration with centripetal acceleration: v^2/r. */
export function circularOrbitSpeed(radius:number,mu:number,softening:number){
 const r=Math.max(.01,radius);
 const eps=Math.max(.01,finitePositive(softening));
 return Math.sqrt(finitePositive(mu)*r*r/Math.pow(r*r+eps*eps,1.5));
}
/** Geometric similarity controls the effective transformer gravitational mass. */
export const shapeGravityFactor=(similarity:number)=>.6+.8*Math.max(0,Math.min(1,similarity));
/**
 * Time and SIGNED angular revolution within a stationary transformer field.
 * Entry starts a fresh continuous encounter; leaving resets the counter.
 * No transformation repeats while the same passage remains inside the field.
 */
export function orbitTrackStep(previous:OrbitalTrack,x:number,z:number,
 centerX:number,centerZ:number,radius:number,dt:number):OrbitalTrack{
 const dx=x-centerX,dz=z-centerZ;
 const inside=Math.hypot(dx,dz)<=Math.max(.01,radius);
 if(!inside)return {...EMPTY_ORBITAL_TRACK};
 const angle=Math.atan2(dz,dx);
 if(!previous.inside)return {inside:true,seconds:Math.max(0,dt),
  angle:0,revolutions:0,lastAngle:angle,activated:false};
 const prior=previous.lastAngle??angle;
 const delta=Math.atan2(Math.sin(angle-prior),Math.cos(angle-prior));
 const sum=previous.angle+delta;
 return {inside:true,seconds:previous.seconds+Math.max(0,dt),
  angle:sum,revolutions:Math.abs(sum)/TWO_PI,
  lastAngle:angle,activated:previous.activated};
}
export function encounterReady(track:OrbitalTrack,config:OrbitalConfig):boolean{
 if(!track.inside||track.activated)return false;
 if(config.trigger==="dwell")return track.seconds>=Math.max(.01,config.dwellSeconds);
 if(config.trigger==="orbits")return track.revolutions+1e-8>=Math.max(.05,config.revolutions);
 return false;
}
