import * as THREE from "three";
import { generatePoly, type Poly } from "@/polyhedronisme/polyhedronisme";
import { paletteColor } from "@/polytron/palettes";

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
export function polytronGeometry(
  dna: PolytronDNA
): { solid: THREE.BufferGeometry; edges: THREE.BufferGeometry } {
  const poly = dnaToPoly(dna);
  const palette = dnaPalette(dna);
  const positions: number[] = [];
  const colors: number[] = [];
  const edgePositions: number[] = [];
  const color = new THREE.Color();

  poly.faces.forEach((face, fi) => {
    color.setHex(paletteColor(palette, poly.faceClasses[fi] ?? 0));
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
