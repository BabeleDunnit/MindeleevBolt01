/**
 * Chromatica -> Polytron face-colour bridge.
 *
 * ONE distinct sample for EACH distinct geometric face class; never wrap with
 * % palette.length. Samples are floating-point sRGB, deliberately NOT rounded
 * to 8-bit hex before sending to THREE.Float32BufferAttribute. Hex rounding
 * could collapse distinct classes on polyhedra with many face types.
 *
 * All colours remain exactly on the RGB segment joining the 2 selected
 * endpoints; the only distinction between modes is their ORDER.
 */
import type {GradientPair} from "@/polytron/gradientPalettes";
import {polyFaceClasses} from "@/polytron/faceColorUsage";
import type {Poly} from "@/polyhedronisme/polyhedronisme";

export type GradientOrder="linear"|"contrast";
export type GradientSelection={pair:GradientPair;order:GradientOrder};
export type SRGBColor=readonly [number,number,number];

const components=(hex:string):SRGBColor=>{
 if(!/^#[a-f\d]{6}$/i.test(hex))throw Error("Invalid RGB endpoint: "+hex);
 return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255) as unknown as SRGBColor;
};

/**
 * First 8 high-contrast samples reproduce the user-approved Chromatica order.
 * For >8 classes, repeatedly split the largest unused interval. This extends
 * the palette without recycling earlier t positions, changing the fixed
 * endpoints, or inserting colour values off the straight segment.
 */
export const HIGH_CONTRAST_PREFIX=[0,1,.2,.8,.4,.6,.1,.9] as const;
export function gradientPositions(count:number,order:GradientOrder):number[]{
 if(!Number.isInteger(count)||count<1||count>100_000)
  throw Error("Invalid number of face types: "+count);
 if(order==="linear"){
  if(count===1)return [0];
  return Array.from({length:count},(_,i)=>i/(count-1));
 }
 if(order!=="contrast")throw Error("Invalid gradient order: "+String(order));
 const result:number[]=HIGH_CONTRAST_PREFIX.slice(0,Math.min(count,8));
 while(result.length<count){
  const sorted=[...result].sort((a,b)=>a-b);
  let left=sorted[0],right=sorted[1],width=right-left;
  for(let i=1;i+1<sorted.length;i++){
   const next=sorted[i+1]-sorted[i];
   if(next>width+1e-15){
    left=sorted[i];right=sorted[i+1];width=next;
   }
  }
  const midpoint=(left+right)/2;
  if(!Number.isFinite(midpoint)||result.includes(midpoint))
   throw Error("Cannot produce unique gradient positions for "+count+" face types");
  result.push(midpoint);
 }
 return result;
}
export function gradientSamples(
 startHex:string,endHex:string,count:number,order:GradientOrder
):SRGBColor[]{
 const a=components(startHex),b=components(endHex);
 return gradientPositions(count,order).map(t=>[
  a[0]+(b[0]-a[0])*t,
  a[1]+(b[1]-a[1])*t,
  a[2]+(b[2]-a[2])*t
 ] as SRGBColor);
}
export function gradientFaceMapping(
 faceClassIds:readonly number[],selection:GradientSelection
):Map<number,SRGBColor>{
 const ids=[...new Set(faceClassIds)].sort((a,b)=>a-b);
 if(ids.some(id=>!Number.isInteger(id)||id<0))
  throw Error("Face class IDs must be nonnegative integers");
 if(ids.length===0)return new Map();
 const samples=gradientSamples(selection.pair.primary.hex,
  selection.pair.secondary.hex,ids.length,selection.order);
 const result=new Map(ids.map((id,i)=>[id,samples[i]] as const));
 if(result.size!==ids.length)throw Error("Face classes lost while generating palette");
 return result;
}
export function gradientFaceMappingForPoly(
 poly:Pick<Poly,"faces"|"faceClasses">,selection:GradientSelection
):Map<number,SRGBColor>{
 return gradientFaceMapping(polyFaceClasses(poly),selection);
}
/** CSS uses floating RGB channels too; avoid an intermediate #rrggbb step. */
export const cssSRGB=(rgb:SRGBColor):string=>
 `rgb(${(rgb[0]*255).toFixed(6)} ${(rgb[1]*255).toFixed(6)} ${(rgb[2]*255).toFixed(6)})`;
/** The count is structural; 8-bit CSS/device output can still look identical. */
export function gradientFaceUsage(faceClassIds:readonly number[],selection:GradientSelection){
 const mapping=gradientFaceMapping(faceClassIds,selection);
 return {faceTypes:mapping.size,colorsUsed:mapping.size,
  colors:[...mapping.values()].map(cssSRGB)};
}
