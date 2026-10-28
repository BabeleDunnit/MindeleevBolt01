/**
 * Screen-space picking and world-space outline helpers for the planar Mutatron.
 * Pure functions: safe to test without a WebGL renderer or browser events.
 */
export type PickPoint={x:number;y:number};
export type PickCandidate={
 id:string;x:number;y:number;radiusPx:number;depth:number;kind:"controller"|"traveler";
};
const near=(a:PickPoint,b:PickPoint)=>Math.hypot(a.x-b.x,a.y-b.y);
/**
 * Prefer true mesh hits (front-to-back Rapier/Three geometry), but enlarge the
 * target of tiny projected carrier meshes. Include overlapping candidates so
 * repeated clicks at the same pixel can cycle through them.
 */
export function rankPickCandidates(
 candidates:PickCandidate[],point:PickPoint,meshHitIds:string[]
):string[]{
 const direct=[...new Set(meshHitIds)].filter(id=>candidates.some(c=>c.id===id));
 const nearCandidates=candidates
  .filter(c=>Number.isFinite(c.x)&&Number.isFinite(c.y)&&Number.isFinite(c.radiusPx))
  .map(c=>({...c,distance:near(c,point)}))
  .filter(c=>c.distance<=Math.max(c.kind==="traveler"?19:18,c.radiusPx*1.12))
  .sort((a,b)=>{
   // Prefer pointing closer to the projected centre, then the frontmost body.
   const aScore=a.distance/Math.max(19,a.radiusPx);
   const bScore=b.distance/Math.max(19,b.radiusPx);
   return aScore-bScore||a.depth-b.depth||a.id.localeCompare(b.id);
  }).map(c=>c.id);
 return [...new Set([...direct,...nearCandidates])];
}
/** Repeating a click within 13 px cycles through overlapping individuals. */
export function nextPick(
 ids:string[],pointer:PickPoint,
 previous:{point:PickPoint;ids:string[];index:number}|null
):{chosen:string|null;state:{point:PickPoint;ids:string[];index:number}|null}{
 if(!ids.length)return {chosen:null,state:null};
 const same=!!previous&&near(pointer,previous.point)<=13&&
   previous.ids.length===ids.length&&previous.ids.every((id,i)=>ids[i]===id);
 const index=same?(previous!.index+1)%ids.length:0;
 return {chosen:ids[index],state:{point:{...pointer},ids:[...ids],index}};
}
/** Conservative outer sphere in the XZ camera footprint, independent of rotation. */
export function outlineRadius(vertices:number[][],scale:number,kind:"controller"|"traveler"){
 if(!Number.isFinite(scale)||scale<=0)throw Error("Invalid collider scale");
 const bound=vertices.reduce((max,v)=>Math.max(max,Math.hypot(v[0]??0,v[1]??0,v[2]??0)),0)*scale;
 return Math.max(kind==="controller"?.9:.36,bound+(kind==="controller"?.27:.16));
}
