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
 homes:{odd:RCPoint;even:RCPoint};homeRadius:number;
};
export const RC_RING_COUNT=5;
/** Point-up Home hexagons: 30° relative to the board's flat-top tiles. */
export const RC_HOME_ROTATION=Math.PI/6;
/** Clearance normal to the lower sloping outer walls: one hex-row. */
export const RC_HOME_GAP_ROWS=1;
export const rcKey=(q:number,r:number)=>q+","+r;
/** Public cell notation: (ring, clockwise index). Axial q/r are internal. */
export const rcCellCoordinates=(cell:Pick<RCCell,"ring"|"idxInRing">)=>
 "("+cell.ring+", "+cell.idxInRing+")";
export function rcCellCoordinatesForKey(board:RCBoard,key:string):string{
 const cell=board.cells.find(c=>c.key===key);
 if(!cell)throw Error("Invalid cell key");
 return rcCellCoordinates(cell);
}
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
 * Fit all 91 board tiles PLUS the two rotated Home hexagons.
 * Home coordinates derive exclusively from the 5th-ring geometry;
 * extra viewport height centers the composition instead of anchoring
 * the Homes to the bottom edge. Width-first until height becomes limiting.
 */
export function makeRCBoard(width:number,height:number):RCBoard{
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)
  throw Error("Invalid board viewport");
 const margin=Math.min(10,Math.max(3,width*.022));
 const topReserve=Math.min(34,Math.max(10,height*.075));
 const bottomMargin=Math.min(12,Math.max(6,height*.012));
 // Geometry of the outermost tile hull; sloping bottom edge is
 // y + abs(x-x0)/sqrt(3) = hullWall * size, relative to the nucleus.
 const hullHalfHeight=5.5*Math.sqrt(3);
 const hullWall=5*Math.sqrt(3)+2/Math.sqrt(3);
 const homeRadiusInCells=3.1;
 const homeOffsetInCells=5.4;
 const homeGapInCells=2*RC_HOME_GAP_ROWS;
 const totalHeightInCells=hullHalfHeight+hullWall-
  homeOffsetInCells/Math.sqrt(3)+
  2*homeRadiusInCells+homeGapInCells;
 const size=Math.max(.1,Math.min(
  (width-2*margin)/17,
  (height-topReserve-bottomMargin)/totalHeightInCells
 ));
 // Center the complete board+Homes ensemble in unused vertical space.
 const top=Math.max(topReserve,(height-totalHeightInCells*size)/2);
 const x0=width/2,y0=top+hullHalfHeight*size;
 const cells:RCCell[]=[];
 for(let k=0;k<=RC_RING_COUNT;k++)for(const v of rcRingCells(k)){
  const p=rcAxial(v.q,v.r,size);
  cells.push({...v,key:rcKey(v.q,v.r),x:x0+p.x,y:y0+p.y,
   ring:k,nucleus:k===0});
 }
 // The point-up Home hexagons follow the TWO lower oblique walls.
 // The gap is measured perpendicular to each wall and equals the
 // distance between consecutive rows of Mutatron tile centers.
 const homeRadius=homeRadiusInCells*size;
 const homeOffset=homeOffsetInCells*size;
 const homeY=y0+(hullWall-homeOffsetInCells/Math.sqrt(3)+
  homeRadiusInCells+homeGapInCells)*size;
 const homes={
  odd:{x:x0-homeOffset,y:homeY},
  even:{x:x0+homeOffset,y:homeY}
 };
 return {width,height,size,cells,homes,homeRadius};
}
export function rcCellAt(board:RCBoard,x:number,y:number):RCCell|null{
 let nearest:RCCell|null=null,dist=Infinity;
 for(const cell of board.cells){
  const d=Math.hypot(x-cell.x,y-cell.y);
  if(d<dist){dist=d;nearest=cell;}
 }
 return dist<=board.size*.99?nearest:null;
}

/** Geometric hit test for rotated, point-up Home hexagons. */
export function rcHomeContains(board:RCBoard,parity:"odd"|"even",point:RCPoint):boolean{
 const center=board.homes[parity],radius=board.homeRadius;
 const dx=Math.abs(point.x-center.x),dy=Math.abs(point.y-center.y);
 return dx<=Math.sqrt(3)*radius/2&&
  dy+dx/Math.sqrt(3)<=radius;
}
