import * as THREE from "three";
import { generatePoly, type Poly } from "@/polyhedronisme/polyhedronisme";
import { paletteColor } from "@/polytron/palettes";
import {gradientFaceMappingForPoly,type GradientSelection} from "@/polytron/gradientFacePalette";

// A Polytron's DNA is a polyhedronisme recipe: [ops][palette][seed], e.g. "gD",
// "ak3I", "gk05D". The palette digits sit between the ops and the seed.
export type PolytronDNA = string;

export function dnaToPoly(dna: PolytronDNA): Poly {
  // Strip the palette digits so the geometry parser never sees them (it would
  // otherwise read them as operator parameters, e.g. "05D" -> k5-style arg).
  const bare = dna.replace(/(\d{2})([TOCID])$/, "$2");
  return generatePoly(bare);
}

export function dnaPalette(dna: PolytronDNA): number {
  const match = dna.match(/(\d{2})([TOCID])$/);
  return match ? Number(match[1]) : 0;
}

// Triangulate faces as fans into a flat-shaded, vertex-colored solid plus edge lines.
// paletteRemap lets a caller swap the palette set (e.g. mineral <-> neon)
// without rebuilding the underlying shape.
export function polytronGeometry(
  dna: PolytronDNA,
  paletteRemap?: (p: number) => number,
  gradient?: GradientSelection
): { solid: THREE.BufferGeometry; edges: THREE.BufferGeometry } {
  const poly = dnaToPoly(dna);
  const palette = paletteRemap ? paletteRemap(dnaPalette(dna)) : dnaPalette(dna);
  const classColors=gradient?gradientFaceMappingForPoly(poly,gradient):null;
  const positions: number[] = [];
  const colors: number[] = [];
  const edgePositions: number[] = [];
  const color = new THREE.Color();

  poly.faces.forEach((face, fi) => {
    const faceClass=poly.faceClasses[fi];
    if(faceClass===undefined)throw Error("Missing face class for face "+fi);
    if(classColors){
      const rgb=classColors.get(faceClass);
      if(!rgb)throw Error("Chromatica colour missing for face class "+faceClass);
      color.setRGB(rgb[0],rgb[1],rgb[2],THREE.SRGBColorSpace);
    }else color.setHex(paletteColor(palette,faceClass));
    const [v0, ...rest] = face;
    for (let i = 0; i + 1 < rest.length; i++) {
      for (const idx of [v0, rest[i], rest[i + 1]]) {
        const [x, y, z] = poly.vertices[idx];
        positions.push(x, y, z);
        colors.push(color.r, color.g, color.b);
      }
    }
    for (let i = 0; i < face.length; i++) {
      const a = poly.vertices[face[i]];
      const b = poly.vertices[face[(i + 1) % face.length]];
      edgePositions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    }
  });

  const solid = new THREE.BufferGeometry();
  solid.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  solid.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  solid.computeVertexNormals();

  const edges = new THREE.BufferGeometry();
  edges.setAttribute("position", new THREE.Float32BufferAttribute(edgePositions, 3));

  return { solid, edges };
}
