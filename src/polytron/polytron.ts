import * as THREE from "three";
import { generatePoly, type Poly } from "@/polyhedronisme/polyhedronisme";

// A Polytron's DNA is a polyhedronisme recipe: [ops][seed], e.g. "gD", "ak3I".
export type PolytronDNA = string;

export function dnaToPoly(dna: PolytronDNA): Poly {
  return generatePoly(dna);
}

// One color per congruence class, cycling deterministically.
const CLASS_COLORS = [
  0x38bdf8, 0xf472b6, 0xfb923c, 0x4ade80, 0xfacc15,
  0xa78bfa, 0xf87171, 0x34d399, 0xfbbf24, 0x60a5fa,
];

function classColor(cls: number): number {
  return CLASS_COLORS[cls % CLASS_COLORS.length];
}

// Triangulate faces as fans into a flat-shaded, vertex-colored solid plus edge lines.
export function polytronGeometry(
  dna: PolytronDNA
): { solid: THREE.BufferGeometry; edges: THREE.BufferGeometry } {
  const poly = dnaToPoly(dna);
  const positions: number[] = [];
  const colors: number[] = [];
  const edgePositions: number[] = [];
  const color = new THREE.Color();

  poly.faces.forEach((face, fi) => {
    color.setHex(classColor(poly.faceClasses[fi] ?? 0));
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
