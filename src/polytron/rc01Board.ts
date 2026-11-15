/**
 * RC01 mobile-first hex board. Pointy-top hexagons, axial coordinates.
 * We never render a hexagon unless ALL six vertices fit into the viewport.
 * Ring indices belong to the full mathematical ring, not the cropped window.
 */
export type RCPoint={x:number;y:number};
export type RCCell=RCPoint&{key:string;q:number;r:number;ring:number;idxInRing:number;nucleus:boolean};
export type RCBoard={width:number;height:number;size:number;cells:RCCell[]};
export const rcKey=(q:number,r:number)=>q+","+r;
export const rcRing=(q:number,r:number)=>Math.max(Math.abs(q),Math.abs(r),Math.abs(-q-r));
export const rcAxial=(q:number,r:number,size:number):RCPoint=>({
 x:Math.sqrt(3)*size*(q+r/2),y:1.5*size*r
});
const directions=[
 {q:1,r:0},{q:1,r:-1},{q:0,r:-1},
 {q:-1,r:0},{q:-1,r:1},{q:0,r:1}
] as const;
export function rcRingCells(k:number):{q:number;r:number;idxInRing:number}[]{
 if(!Number.isInteger(k)||k<0)throw Error("Invalid ring");
 if(!k)return [{q:0,r:0,idxInRing:0}];
 let q=-k,r=k;const result:{q:number;r:number;idxInRing:number}[]=[];
 for(let d=0;d<6;d++)for(let step=0;step<k;step++){
  result.push({q,r,idxInRing:result.length});
  q+=directions[d].q;r+=directions[d].r;
 }
 return result;
}
export function rcPolygon(x:number,y:number,size:number):string{
 return Array.from({length:6},(_,i)=>{
  const a=Math.PI*(i*60-90)/180;
  return (x+Math.cos(a)*size).toFixed(2)+","+
   (y+Math.sin(a)*size).toFixed(2);
 }).join(" ");
}
/** Full-cell clipping with deliberately vertically asymmetric framing. */
export function makeRCBoard(width:number,height:number):RCBoard{
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)
  throw Error("Invalid board viewport");
 // Around four columns at typical phone widths; figures are not tiny dots.
 const size=Math.max(41,Math.min(60,width/7.6));
 const x0=width/2,y0=height*.435; // more complete rows BELOW the nucleus
 const margin=2;
 const halfW=Math.sqrt(3)*size/2;
 const maxRing=Math.ceil(Math.max(width,height)/size)+2;
 const cells:RCCell[]=[];
 for(let k=0;k<=maxRing;k++)for(const v of rcRingCells(k)){
  const pos=rcAxial(v.q,v.r,size);
  const x=x0+pos.x,y=y0+pos.y;
  if(x-halfW<margin||x+halfW>width-margin||
     y-size<margin||y+size>height-margin)continue;
  cells.push({...v,key:rcKey(v.q,v.r),x,y,ring:k,
   nucleus:v.q===0&&v.r===0});
 }
 return {width,height,size,cells:cells.sort((a,b)=>a.y-b.y||a.x-b.x)};
}
export function rcCellAt(board:RCBoard,x:number,y:number):RCCell|null{
 let nearest:RCCell|null=null,dist=Infinity;
 for(const cell of board.cells){
  const d=Math.hypot(x-cell.x,y-cell.y);
  if(d<dist){dist=d;nearest=cell;}
 }
 return dist<=board.size*.99?nearest:null;
}
