/**
 * Small spring-and-impulse movement solver for the RC01 game feel.
 * Physics is integrated in screen-space (semi-implicit Euler): the attacker
 * is pulled to the destination by a damped spring. In a capture, contact
 * gives the other Polytron a single outward impulse, after which it flies
 * beyond the visible board and returns to its (offscreen) home.
 * The game state is committed only after the flight completes.
 */
export type RCVec={x:number;y:number};
export type RCBody=RCVec&{vx:number;vy:number};
export type RCFlight={
 kind:"move"|"capture";sourceKey:string;targetKey:string;
 attackerSeal:number;victimSeal:number|null;
 target:RCVec;start:RCVec;attacker:RCBody;victim:RCBody|null;
 impacted:boolean;elapsed:number;size:number;
};
export const RC_FLIGHT_SECONDS=1.28;
export function startRCFlight(args:{
 kind:"move"|"capture";sourceKey:string;targetKey:string;
 attackerSeal:number;victimSeal:number|null;
 from:RCVec;to:RCVec;size:number;
}):RCFlight{
 const {from,to,...details}=args;
 return {...details,start:from,target:to,impacted:false,elapsed:0,
  attacker:{...from,vx:0,vy:0},
  victim:args.victimSeal===null?null:{...to,vx:0,vy:0}};
}
export function advanceRCFlight(f:RCFlight,dtSeconds:number):RCFlight{
 const dt=Math.max(0,Math.min(.04,dtSeconds));
 const elapsed=f.elapsed+dt;
 const attacker={...f.attacker};
 // Damped spring: it can accelerate, overshoot and settle.
 const stiffness=260,damping=24;
 attacker.vx+=(stiffness*(f.target.x-attacker.x)-damping*attacker.vx)*dt;
 attacker.vy+=(stiffness*(f.target.y-attacker.y)-damping*attacker.vy)*dt;
 attacker.x+=attacker.vx*dt;attacker.y+=attacker.vy*dt;
 let victim=f.victim?{...f.victim}:null;
 let impacted=f.impacted;
 if(f.kind==="capture"&&victim&&!impacted&&
    Math.hypot(attacker.x-f.target.x,attacker.y-f.target.y)<=f.size*.6){
  impacted=true;
  const len=Math.max(1,Math.hypot(f.target.x-f.start.x,f.target.y-f.start.y));
  const ux=(f.target.x-f.start.x)/len,uy=(f.target.y-f.start.y)/len;
  // Same movement direction as the incoming attacker, with an upward lift.
  victim.vx=ux*570-uy*85;
  victim.vy=uy*570+ux*85-205;
 }
 if(victim&&impacted){
  victim.vy+=250*dt; // screen-space gravity
  victim.vx*=Math.pow(.984,dt*60);
  victim.x+=victim.vx*dt;victim.y+=victim.vy*dt;
 }
 return {...f,attacker,victim,impacted,elapsed};
}
export const finishedRCFlight=(f:RCFlight)=>
 f.elapsed>=RC_FLIGHT_SECONDS;
