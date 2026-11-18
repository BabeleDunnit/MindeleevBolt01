/**
 * Mobile-first Mutatron: five complete flat-top hexagonal rings.
 * (q,r)=(1,0) is directly NORTH of (0,0). Clockwise ring indices
 * start there and never depend on clipping or device dimensions.
 * The third ring is intentionally empty in the initial 72-Seal opening.
 */
export type RCPoint={x:number;y:number};
export type RCCell=RCPoint&{
 key:string;q:number;r:number;ring:number;idxInRing:number;nucleus:boolean
};
export type RCBoard={
 width:number;height:number;size:number;cells:RCCell[];
 homeCenter:RCPoint;homeRadius:number;
};
export const RC_RING_COUNT=5;
export const rcKey=(q:number,r:number)=>q+","+r;
export const rcRing=(q:number,r:number)=>
 Math.max(Math.abs(q),Math.abs(r),Math.abs(-q-r));

/** Rotated axial frame; hex (1,0) lies directly above the nucleus. */
export const rcAxial=(q:number,r:number,size:number):RCPoint=>({
 x:1.5*size*r,
 y:-Math.sqrt(3)*size*(q+r/2)
});
// From the northernmost cell, each step moves CLOCKWISE around the ring.
const clockwise=[
 {q:-1,r:1},{q:-1,r:0},{q:0,r:-1},
 {q:1,r:-1},{q:1,r:0},{q:0,r:1}
] as const;
export function rcRingCells(k:number):{q:number;r:number;idxInRing:number}[]{
 if(!Number.isInteger(k)||k<0)throw Error("Invalid ring");
 if(!k)return [{q:0,r:0,idxInRing:0}];
 let q=k,r=0;
 const result:{q:number;r:number;idxInRing:number}[]=[];
 for(const dir of clockwise)for(let step=0;step<k;step++){
  result.push({q,r,idxInRing:result.length});
  q+=dir.q;r+=dir.r;
 }
 return result;
}
export function rcPolygon(x:number,y:number,size:number):string{
 return Array.from({length:6},(_,i)=>{
  const a=i*Math.PI/3; // flat-top regular hexagon
  return (x+Math.cos(a)*size).toFixed(2)+","+
   (y+Math.sin(a)*size).toFixed(2);
 }).join(" ");
}
/**
 * Fit ALL 91 tiles (nucleus + rings 1..5), exactly and without cropping.
 * Horizontal bounds are 17 radii wide in this frame; vertical bounds
 * are 11 sqrt(3) radii. Preserve space for the home attractor below.
 */
export function makeRCBoard(width:number,height:number):RCBoard{
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)
  throw Error("Invalid board viewport");
 const margin=Math.min(10,Math.max(3,width*.022));
 const topReserve=Math.min(34,Math.max(10,height*.075));
 const bottomReserve=Math.min(110,Math.max(55,height*.17));
 const size=Math.max(.1,Math.min(
  (width-2*margin)/17,
  (height-topReserve-bottomReserve)/(11*Math.sqrt(3))
 ));
 const x0=width/2,y0=(topReserve+height-bottomReserve)/2;
 const cells:RCCell[]=[];
 for(let k=0;k<=RC_RING_COUNT;k++)for(const v of rcRingCells(k)){
  const p=rcAxial(v.q,v.r,size);
  cells.push({...v,key:rcKey(v.q,v.r),x:x0+p.x,y:y0+p.y,
   ring:k,nucleus:k===0});
 }
 // A single shared basin for all captured Polytrons.
 const homeRadius=Math.max(8,Math.min(size*2.25,bottomReserve*.45));
 const homeCenter={x:x0,y:height-bottomReserve*.51};
 return {width,height,size,cells,homeCenter,homeRadius};
}
export function rcCellAt(board:RCBoard,x:number,y:number):RCCell|null{
 let nearest:RCCell|null=null,dist=Infinity;
 for(const cell of board.cells){
  const d=Math.hypot(x-cell.x,y-cell.y);
  if(d<dist){dist=d;nearest=cell;}
 }
 return dist<=board.size*.99?nearest:null;
}
