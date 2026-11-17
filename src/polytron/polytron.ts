import * as THREE from "three";
import { generatePoly, faceCenters, type Poly, type Vec3 } from "@/polyhedronisme/polyhedronisme";
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

/**
 * The ONE canonical tessellation of Conway faces for every WebGL renderer.
 *
 * A triangle is already unique. For any other face, connect EACH boundary
 * edge to its arithmetic face centroid (from polyhedronisme.faceCenters).
 * Unlike a fan from face[0], this triangulation is invariant under cyclic
 * reindexing and has no privileged diagonal, even for non-planar polygons.
 *
 * Source Conway vertices, face winding, perimeter edges and face classes
 * remain untouched. ShapeDNA v2 independently uses the same centroid-fan
 * surface criterion for its FEM analysis.
 */
export type ConwayTriangle=readonly [Vec3,Vec3,Vec3];
export function triangulateConwayFace(
 vertices:readonly Vec3[],face:readonly number[],centroid:Vec3
):ConwayTriangle[]{
 const n=face.length;
 if(n<3)return [];
 if(n===3)return [[vertices[face[0]],vertices[face[1]],vertices[face[2]]]];
 const triangles:ConwayTriangle[]=[];
 for(let i=0;i<n;i++)
  triangles.push([centroid,vertices[face[i]],vertices[face[(i+1)%n]]]);
 return triangles;
}

// The shared 3D/physics mesh is built solely through polytronGeometry:
// the periodic solid, flattened projections, RC01 and other 3D experiments
// never implement their own Conway surface triangulation.
// paletteRemap changes face colors without changing the underlying geometry.
export function polytronGeometry(
  dna: PolytronDNA,
  paletteRemap?: (p: number) => number,
  gradient?: GradientSelection
): { solid: THREE.BufferGeometry; edges: THREE.BufferGeometry } {
  const poly = dnaToPoly(dna);
  const palette = paletteRemap ? paletteRemap(dnaPalette(dna)) : dnaPalette(dna);
  const classColors=gradient?gradientFaceMappingForPoly(poly,gradient):null;
  const centers=faceCenters(poly);
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
    for(const triangle of triangulateConwayFace(poly.vertices,face,centers[fi])){
      for(const [x,y,z] of triangle){
        positions.push(x,y,z);
        colors.push(color.r,color.g,color.b);
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
