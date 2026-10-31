/**
 * Face type / effective palette usage diagnostics.
 *
 * Polyhedronisme's paintPolyhedron() assigns a faceClass index to each
 * polygon, using sorted edge lengths AND corner angles with a tolerance.
 * The renderer's polytronGeometry() maps class index to paletteColor(index)
 * modulo the palette length. Always follow exactly that mapping here.
 *
 * Geometry is palette-independent; palette changes never regenerate the
 * classification and never change the Polytronic number.
 */
import type {Poly} from "@/polyhedronisme/polyhedronisme";
import {paletteColor} from "@/polytron/palettes";

export function polyFaceClasses(poly:Pick<Poly,"faces"|"faceClasses">):number[]{
 if(poly.faceClasses.length!==poly.faces.length)
  throw new Error("Face classification unavailable or incomplete");
 const indices=new Set<number>();
 for(const id of poly.faceClasses){
  if(!Number.isInteger(id)||id<0)throw new Error("Invalid face class "+id);
  indices.add(id);
 }
 return [...indices].sort((a,b)=>a-b);
}

/** Actual unique visible RGB values, not the size of the selected palette. */
export function usedFaceColors(faceClassIds:readonly number[],paletteIndex:number):number[]{
 const colors=new Set<number>();
 for(const faceClass of faceClassIds){
  if(!Number.isInteger(faceClass)||faceClass<0)
   throw new Error("Invalid face class "+faceClass);
  colors.add(paletteColor(paletteIndex,faceClass));
 }
 return [...colors];
}

export function faceColorUsage(faceClassIds:readonly number[],paletteIndex:number){
 const colors=usedFaceColors(faceClassIds,paletteIndex);
 return {faceTypes:new Set(faceClassIds).size,colorsUsed:colors.length,colors};
}
