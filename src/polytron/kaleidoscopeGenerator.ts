/**
 * Kaleidoscope Laboratory — standalone GENERATIVE experiment, not RC02 gameplay.
 * Finite, deterministic hex patterns built by symmetry orbits.
 * All rules respect the real axial coordinates of the Mutatron.
 *
 * The radius is a hard generation boundary, not a camera zoom:
 * 1, 2, 3, 4, 5 rings allow respectively 7, 19, 37, 61, 91 cells.
 * Four artistic grammars use the same symmetry-preserving orbit engine.
 * Evolution modifies an inherited occupancy pattern, not a random screenshot.
 */
import {rcKey,rcRing,rcRingCells} from "@/polytron/rc01Board";
import {dnaFromPolitronNumber} from "@/polytron/politronicNumber";
import {intrinsicEnergy} from "@/polytron/mindeleevLife";

export const KALEIDOSCOPE_MAX_RADIUS=5;
export const KALEIDOSCOPE_FAMILIES=[
 "metatron","crystal","rosette","roots"
] as const;
export type KaleidoFamily=(typeof KALEIDOSCOPE_FAMILIES)[number];
export const KALEIDOSCOPE_SYMMETRIES=["D6","C6","C3","C2"] as const;
export type KaleidoSymmetry=(typeof KALEIDOSCOPE_SYMMETRIES)[number];
export type KaleidoParams={
 radius:number;family:KaleidoFamily;symmetry:KaleidoSymmetry;
 seed:number;generation:number
};
export type KaleidoPoint={q:number;r:number;key:string;ring:number;idx:number};
export type KaleidoTile=KaleidoPoint&{
 orbit:string;number:number;dna:string;
 paletteRow:number;paletteCol:number;angle:number;mirrored:boolean;
};
export type KaleidoEdge={from:string;to:string;kind:"lattice"|"spoke"|"star"};
export type KaleidoLayout={
 params:KaleidoParams;cells:KaleidoPoint[];
 tiles:KaleidoTile[];edges:KaleidoEdge[];
 symmetryOrbits:number;usedManifestations:number;
 totalIntrinsicEnergy:number
};
export type KaleidoOrbit={id:string;cells:KaleidoPoint[];transforms:Map<string,{
 rotation:number;mirrored:boolean
}>;ring:number;idx:number};
type Axial={q:number;r:number};
const DIRS:readonly Axial[]=[
 {q:1,r:0},{q:1,r:-1},{q:0,r:-1},
 {q:-1,r:0},{q:-1,r:1},{q:0,r:1}
];
const FAMILY_NUMBERS:Record<KaleidoFamily,readonly number[]>={
 metatron:[2,3,4,5,7,8,9,12,13,14,17,18,19,22,23],
 crystal:[1,2,3,5,6,7,8,9,10,11,12,13,14,15,17,18],
 rosette:[2,3,4,5,9,10,12,13,14,15,18,19,20,23,24],
 roots:[1,2,3,4,5,7,8,10,12,13,15,17,18,20,22,25]
};
const PALETTES:readonly (readonly [number,number])[]=[
 [2,4],[8,8],[6,6],[7,7],[4,4],[9,9],
 [3,3],[5,5],[1,1],[10,10],[0,0],[11,11]
];
/** 32-bit deterministic mixing: no Math.random and no hidden time source. */
function hash(...values:number[]):number{
 let h=2166136261;
 for(const input of values){
  h=Math.imul(h^(Math.trunc(input)>>>0),16777619);
  h^=h>>>13;
 }
 return (h^(h>>>16))>>>0;
}
const numberHash=(key:string)=>key.split("").reduce((h,c)=>
 Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261);
export function kaleidoCellCount(radius:number):number{
 if(!Number.isInteger(radius)||radius<1||radius>KALEIDOSCOPE_MAX_RADIUS)
  throw Error("Kaleidoscope radius must be an integer between 1 and 5");
 return 1+3*radius*(radius+1);
}
export const kaleidoRotate60=({q,r}:Axial):Axial=>({q:-r,r:q+r});
/** Mirror around the Mutatron's vertical axis, through (1,0). */
export const kaleidoReflect=({q,r}:Axial):Axial=>({q:q+r,r:-r});
export function kaleidoTransform(
 point:Axial,rotation:number,mirrored=false
):Axial{
 let v=mirrored?kaleidoReflect(point):point;
 for(let i=0;i<((rotation%6)+6)%6;i++)v=kaleidoRotate60(v);
 return v;
}
const SYMMETRY_ROTATIONS:Record<KaleidoSymmetry,number[]>={
 D6:[0,1,2,3,4,5],C6:[0,1,2,3,4,5],
 C3:[0,2,4],C2:[0,3]
};
function transforms(symmetry:KaleidoSymmetry){
 const rotations=SYMMETRY_ROTATIONS[symmetry];
 return (symmetry==="D6"?[false,true]:[false]).flatMap(mirrored=>
  rotations.map(rotation=>({rotation,mirrored})));
}
export function kaleidoPoints(radius:number):KaleidoPoint[]{
 kaleidoCellCount(radius);
 const cells:KaleidoPoint[]=[];
 for(let ring=0;ring<=radius;ring++)for(const {q,r,idxInRing} of rcRingCells(ring))
  cells.push({q,r,key:rcKey(q,r),ring,idx:idxInRing});
 return cells;
}
/** All cells in an orbit have the same occupation, DNA and palette. */
export function kaleidoOrbits(
 points:KaleidoPoint[],symmetry:KaleidoSymmetry
):KaleidoOrbit[]{
 const available=new Map(points.map(p=>[p.key,p]));
 const unseen=new Set(points.map(p=>p.key));
 const result:KaleidoOrbit[]=[];
 const group=transforms(symmetry);
 while(unseen.size){
  const id=[...unseen].sort()[0];
  const base=available.get(id)!;
  const transformed=new Map<string,{rotation:number;mirrored:boolean}>();
  for(const t of group){
   const v=kaleidoTransform(base,t.rotation,t.mirrored);
   const k=rcKey(v.q,v.r);
   if(!available.has(k))throw Error("Kaleidoscope symmetry escapes its radius");
   if(!transformed.has(k))transformed.set(k,t);
  }
  const members=[...transformed.keys()].sort().map(k=>available.get(k)!);
  for(const cell of members)unseen.delete(cell.key);
  result.push({id,cells:members,transforms:transformed,
   ring:base.ring,idx:base.idx});
 }
 return result.sort((a,b)=>a.ring-b.ring||a.idx-b.idx||a.id.localeCompare(b.id));
}
function validateParams(params:KaleidoParams){
 kaleidoCellCount(params.radius);
 if(!KALEIDOSCOPE_FAMILIES.includes(params.family))throw Error("Unknown grammar");
 if(!KALEIDOSCOPE_SYMMETRIES.includes(params.symmetry))throw Error("Unknown symmetry");
 if(!Number.isSafeInteger(params.seed)||params.seed<0)throw Error("Invalid seed");
 if(!Number.isSafeInteger(params.generation)||params.generation<0)
  throw Error("Invalid evolution index");
}
function motifBase(orbit:KaleidoOrbit,params:KaleidoParams):boolean{
 const {family,seed,radius}=params;
 const r=orbit.ring,index=orbit.idx;
 if(r===0)return false; // Nucleus is a diagrammatic focal point.
 const vertex=index%r===0;
 const corner=index%r===Math.floor(r/2);
 const noise=hash(seed,r,index,17)%100;
 switch(family){
  case "metatron":
   return vertex||(r<=2&&noise<76)||(r>=3&&(corner||noise<38));
  case "crystal":
   return vertex||noise<(r%2===0?64:40)||
    (r===radius&&noise<57);
  case "rosette":
   return r%2===1?noise<79:vertex||corner||noise<25;
  case "roots":
   return vertex||noise<(r%3===0?70:46);
 }
}
function orbitKeySet(layout:KaleidoLayout|undefined){
 return new Set(layout?.tiles.map(t=>t.key)??[]);
}
function classifyEdge(
 a:KaleidoPoint,b:KaleidoPoint,family:KaleidoFamily
):KaleidoEdge["kind"]|null{
 const dist=rcRing(a.q-b.q,a.r-b.r);
 if(dist===1)return "lattice";
 if(a.ring===0||b.ring===0){
  const other=a.ring===0?b:a;
  return other.idx%other.ring===0?"spoke":null;
 }
 if(family==="metatron"||family==="roots"){
  if(a.ring===b.ring&&a.idx%a.ring===0&&b.idx%b.ring===0){
   const delta=Math.abs(a.idx/a.ring-b.idx/b.ring);
   if(delta===2||delta===4)return "star";
  }
  if(a.ring!==b.ring&&a.idx%a.ring===0&&b.idx%b.ring===0){
   const diff=Math.abs(a.idx/a.ring-b.idx/b.ring);
   if(diff===0)return "spoke";
  }
 }
 return null;
}
function makeEdges(
 points:KaleidoPoint[],tiles:KaleidoTile[],family:KaleidoFamily
):KaleidoEdge[]{
 const active=new Map(tiles.map(t=>[t.key,t]));
 const focal=points.find(p=>p.ring===0)!;
 const selected=[focal,...points.filter(p=>active.has(p.key))];
 const edges:KaleidoEdge[]=[];
 for(let i=0;i<selected.length;i++)for(let j=i+1;j<selected.length;j++){
  const kind=classifyEdge(selected[i],selected[j],family);
  if(kind)edges.push({from:selected[i].key,to:selected[j].key,kind});
 }
 return edges;
}
/**
 * Evolve changes one or more entire symmetry orbits. The recipe/seed remains
 * stable, and mutation affects occupied tiles and links together.
 */
export function generateKaleidoscope(
 params:KaleidoParams,previous?:KaleidoLayout
):KaleidoLayout{
 validateParams(params);
 const points=kaleidoPoints(params.radius);
 const orbits=kaleidoOrbits(points,params.symmetry).filter(o=>o.ring>0);
 const inheriting=!!previous&&previous.params.seed===params.seed&&
  previous.params.family===params.family&&
  previous.params.symmetry===params.symmetry&&
  previous.params.radius===params.radius&&
  previous.params.generation+1===params.generation;
 const previousOccupied=orbitKeySet(inheriting?previous:undefined);
 const occupiedOrbits=new Set<string>();
 for(const orbit of orbits){
  let occupied=inheriting?previousOccupied.has(orbit.cells[0].key):
   motifBase(orbit,params);
  // Symmetric whole-orbit mutations. Prefer local continuity to a redraw.
  if(inheriting){
   const turn=hash(params.seed,params.generation,orbits.length)%orbits.length;
   const index=orbits.indexOf(orbit);
   const additional=orbits.length>5&&hash(params.seed,params.generation,index)%9===0;
   if(index===turn||additional)occupied=!occupied;
  }
  if(occupied)occupiedOrbits.add(orbit.id);
 }
 // Avoid generating empty scenes; small radii have only a few D6 orbits.
 if(!occupiedOrbits.size&&orbits.length)
  occupiedOrbits.add(orbits[hash(params.seed,params.generation)%orbits.length].id);
 const tiles:KaleidoTile[]=[];
 const catalogue=FAMILY_NUMBERS[params.family];
 for(const orbit of orbits){
  if(!occupiedOrbits.has(orbit.id))continue;
  const h=numberHash(orbit.id);
  const number=catalogue[(hash(params.seed,h)%catalogue.length+
   params.generation*(1+hash(params.seed,h,99)%3))%catalogue.length];
  const paletteIndex=(hash(Math.floor(params.seed/3),orbit.ring)%
   PALETTES.length+Math.floor(params.generation/3))%PALETTES.length;
  const [paletteRow,paletteCol]=PALETTES[paletteIndex];
  for(const cell of orbit.cells){
   const t=orbit.transforms.get(cell.key)!;
   tiles.push({...cell,orbit:orbit.id,number,
    dna:dnaFromPolitronNumber(number),paletteRow,paletteCol,
    angle:-t.rotation*Math.PI/3,mirrored:t.mirrored});
  }
 }
 tiles.sort((a,b)=>a.ring-b.ring||a.idx-b.idx);
 return {
  params:{...params},cells:points,tiles,
  edges:makeEdges(points,tiles,params.family),
  symmetryOrbits:orbits.length,
  usedManifestations:new Set(tiles.map(t=>t.number)).size,
  totalIntrinsicEnergy:tiles.reduce((sum,t)=>sum+intrinsicEnergy(t.number,0),0)
 };
}
