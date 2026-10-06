// polyHédronisme core, ported to TypeScript from the original JavaScript.
// Original (c) 2019 Anselm Levskaya, MIT License.
// https://levskaya.github.io/polyhedronisme/ https://github.com/levskaya/polyhedronisme
//
// Ported faithfully; only jQuery/underscore/PEG.js usages were replaced with
// plain TypeScript. Only the Platonic seeds and the operators needed for
// symmetrical forms are included.

export type Vec3 = [number, number, number];

export interface Poly {
  vertices: Vec3[];
  faces: number[][]; // oriented, clockwise seen from outside
  faceClasses: number[]; // per-face color class (same class = congruent face)
  name: string;
}

// ---------- small vector helpers (from geo.js) ----------

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const mag = (v: Vec3): number => Math.sqrt(dot(v, v));
const mag2 = (v: Vec3): number => dot(v, v);
const mult = (c: number, v: Vec3): Vec3 => [c * v[0], c * v[1], c * v[2]];
const unit = (v: Vec3): Vec3 => mult(1 / (mag(v) || 1), v);
const midpoint = (a: Vec3, b: Vec3): Vec3 => mult(0.5, add(a, b));
const tween = (a: Vec3, b: Vec3, t: number): Vec3 => [
  (1 - t) * a[0] + t * b[0],
  (1 - t) * a[1] + t * b[1],
  (1 - t) * a[2] + t * b[2],
];
const oneThird = (a: Vec3, b: Vec3): Vec3 => tween(a, b, 1 / 3);
const reciprocal = (v: Vec3): Vec3 => mult(1 / (mag2(v) || 1), v);

// point where line a...b is tangent to an origin sphere
const tangentPoint = (a: Vec3, b: Vec3): Vec3 => {
  const d = sub(b, a);
  return sub(a, mult(dot(d, a) / (mag2(d) || 1), d));
};
const edgeDist = (a: Vec3, b: Vec3): number => mag(tangentPoint(a, b));

const orthogonal = (a: Vec3, b: Vec3, c: Vec3): Vec3 => cross(sub(b, a), sub(c, b));

const calcCentroid = (vs: Vec3[]): Vec3 => {
  let c: Vec3 = [0, 0, 0];
  for (const v of vs) c = add(c, v);
  return mult(1 / vs.length, c);
};

// average normal of a (possibly non-planar) face
const normal = (vs: Vec3[]): Vec3 => {
  let n: Vec3 = [0, 0, 0];
  let [v1, v2] = vs.slice(-2);
  for (const v3 of vs) {
    n = add(n, orthogonal(v1, v2, v3));
    v1 = v2;
    v2 = v3;
  }
  return unit(n);
};

const planararea = (vs: Vec3[]): number => {
  let vsum: Vec3 = [0, 0, 0];
  let [v1, v2] = vs.slice(-2);
  for (const v3 of vs) {
    vsum = add(vsum, cross(v1, v2));
    v1 = v2;
    v2 = v3;
  }
  return Math.abs(dot(normal(vs), vsum) / 2);
};

// ---------- polyhedron class (from polyhedron.js) ----------

export function faceToEdges(face: number[]): Array<[number, number]> {
  const edges: Array<[number, number]> = [];
  let v1 = face[face.length - 1];
  for (const v2 of face) {
    edges.push([v1, v2]);
    v1 = v2;
  }
  return edges;
}

export function edgesOf(poly: Poly): Array<[number, number]> {
  const uniq = new Map<string, [number, number]>();
  for (const face of poly.faces) {
    for (const [a, b] of faceToEdges(face)) {
      const key = a < b ? `${a}~${b}` : `${b}~${a}`;
      uniq.set(key, [a, b]);
    }
  }
  return [...uniq.values()];
}

export function faceCenters(poly: Poly): Vec3[] {
  const centers: Vec3[] = [];
  for (const face of poly.faces) {
    let c: Vec3 = [0, 0, 0];
    for (const vidx of face) c = add(c, poly.vertices[vidx]);
    centers.push(mult(1 / face.length, c));
  }
  return centers;
}

export function faceNormals(poly: Poly): Vec3[] {
  return poly.faces.map((f) => normal(f.map((vidx) => poly.vertices[vidx])));
}

// recenters such that center of mass is at origin, then rescales max radius to 1
export function recenterAndRescale(poly: Poly): Poly {
  const edges = edgesOf(poly);
  const edgecenters = edges.map(([a, b]) => tangentPoint(poly.vertices[a], poly.vertices[b]));
  let center: Vec3 = [0, 0, 0];
  for (const c of edgecenters) center = add(center, c);
  center = mult(1 / (edgecenters.length || 1), center);
  let vertices = poly.vertices.map((v) => sub(v, center));
  const maxExtent = Math.max(1e-12, ...vertices.map((v) => mag(v)));
  const s = 1 / maxExtent;
  vertices = vertices.map((v) => mult(s, v));
  return { ...poly, vertices };
}

export function rescaleOnly(poly: Poly): Poly {
  const maxExtent = Math.max(1e-12, ...poly.vertices.map((v) => mag(v)));
  const s = 1 / maxExtent;
  return { ...poly, vertices: poly.vertices.map((v) => mult(s, v)) };
}

// ---------- coloring ----------

// Feature vector of a face: sorted edge lengths + sorted corner angles.
// Congruent faces share the same features up to floating-point noise.
function faceFeatures(vs: Vec3[]): { edges: number[]; angles: number[] } {
  const n = vs.length;
  const edges: number[] = [];
  const angles: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = vs[(i + n - 1) % n];
    const b = vs[i];
    const c = vs[(i + 1) % n];
    edges.push(mag(sub(c, b)));
    const d1 = unit(sub(b, a));
    const d2 = unit(sub(c, b));
    angles.push(Math.acos(Math.max(-1, Math.min(1, dot(d1, d2)))));
  }
  edges.sort((x, y) => x - y);
  angles.sort((x, y) => x - y);
  return { edges, angles };
}

// Tolerances sized for the seed imprecision in polyhedronisme's Platonic seeds
// (the icosahedron seed has ~0.12% edge-length spread) while still separating
// genuinely different shapes (e.g. the snub cube's equilateral vs scalene
// triangles differ in edge length by ~13%).
const FEAT_EPS = 0.02;

function featuresMatch(a: { edges: number[]; angles: number[] }, b: { edges: number[]; angles: number[] }): boolean {
  if (a.edges.length !== b.edges.length) return false;
  // relative tolerance for lengths, absolute for angles
  for (let i = 0; i < a.edges.length; i++) {
    const scale = Math.max(1, a.edges[i], b.edges[i]);
    if (Math.abs(a.edges[i] - b.edges[i]) > FEAT_EPS * scale) return false;
  }
  for (let i = 0; i < a.angles.length; i++) {
    if (Math.abs(a.angles[i] - b.angles[i]) > FEAT_EPS * 10) return false;
  }
  return true;
}

// Assign each face a class: same class = congruent face (matching within tolerance).
export function paintPolyhedron(poly: Poly): Poly {
  const features = poly.faces.map((f) => faceFeatures(f.map((v) => poly.vertices[v])));
  const classReps: Array<{ edges: number[]; angles: number[] }> = [];
  poly.faceClasses = features.map((feat) => {
    for (let c = 0; c < classReps.length; c++) {
      if (featuresMatch(feat, classReps[c])) return c;
    }
    classReps.push(feat);
    return classReps.length - 1;
  });
  return poly;
}

// ---------- polyflag: symbolic flag machinery (from topo_operators.js) ----------
// A flag is a triple (face, vertex, next vertex) describing an oriented edge of a face.

const MAX_FACE_SIDEDNESS = 1000;

class PolyFlag {
  private flags = new Map<string, Map<string, string>>();
  private vertidxs = new Map<string, number>();
  private vertexPos = new Map<string, Vec3>();

  newV(name: string, coords: Vec3): void {
    if (!this.vertidxs.has(name)) {
      this.vertidxs.set(name, 0);
      this.vertexPos.set(name, coords);
    }
  }

  newFlag(face: string, from: string, to: string): void {
    let f = this.flags.get(face);
    if (!f) {
      f = new Map();
      this.flags.set(face, f);
    }
    f.set(from, to);
  }

  topoly(): { vertices: Vec3[]; faces: number[][] } {
    const vertices: Vec3[] = [];
    let ctr = 0;
    for (const [name] of this.vertidxs) {
      vertices.push(this.vertexPos.get(name)!);
      this.vertidxs.set(name, ctr++);
    }
    const faces: number[][] = [];
    for (const [faceName, orbit] of this.flags) {
      let v0: string | undefined;
      for (const key of orbit.keys()) {
        v0 = key;
        break;
      }
      if (v0 === undefined) continue;
      const face: number[] = [this.vertidxs.get(v0)!];
      let v = orbit.get(v0);
      let guard = 0;
      while (v !== undefined && v !== v0 && guard++ < MAX_FACE_SIDEDNESS) {
        face.push(this.vertidxs.get(v)!);
        v = orbit.get(v);
      }
      faces.push(face);
    }
    return { vertices, faces };
  }
}

const midName = (a: number | string, b: number | string): string =>
  `${a}` < `${b}` ? `${a}_${b}` : `${b}_${a}`;

type OpPoly = { vertices: Vec3[]; faces: number[][]; name: string };

// ---------- topological operators (from topo_operators.js) ----------

// kis: turn each n-sided face (n=0: all) into a pyramid
const kisN = (poly: Poly, n: number, apexdist = 0.1): OpPoly => {
  if (!n) n = 0;
  const flag = new PolyFlag();
  poly.vertices.forEach((p, i) => flag.newV(`v${i}`, p));
  const normals = faceNormals(poly);
  const centers = faceCenters(poly);
  for (let fi = 0; fi < poly.faces.length; fi++) {
    const f = poly.faces[fi];
    let v1 = `v${f[f.length - 1]}`;
    for (const v of f) {
      const v2 = `v${v}`;
      if (f.length === n || n === 0) {
        const apex = `apex${fi}`;
        const fname = `${fi}${v1}`;
        flag.newV(apex, add(centers[fi], mult(apexdist, normals[fi])));
        flag.newFlag(fname, v1, v2);
        flag.newFlag(fname, v2, apex);
        flag.newFlag(fname, apex, v1);
      } else {
        flag.newFlag(`${fi}`, v1, v2);
      }
      v1 = v2;
    }
  }
  const { vertices, faces } = flag.topoly();
  return { vertices, faces, name: `k${n === 0 ? "" : n}${poly.name}` };
};

// ambo (rectify): midpoints of edges; topology is self-dual
const ambo = (poly: Poly): OpPoly => {
  const flag = new PolyFlag();
  for (let i = 0; i < poly.faces.length; i++) {
    const f = poly.faces[i];
    let [v1, v2] = f.slice(-2);
    for (const v3 of f) {
      if (v1 < v2) {
        flag.newV(midName(v1, v2), midpoint(poly.vertices[v1], poly.vertices[v2]));
      }
      flag.newFlag(`orig${i}`, midName(v1, v2), midName(v2, v3));
      flag.newFlag(`dual${v2}`, midName(v2, v3), midName(v1, v2));
      v1 = v2;
      v2 = v3;
    }
  }
  const { vertices, faces } = flag.topoly();
  return { vertices, faces, name: `a${poly.name}` };
};

// gyro: dual of snub
const gyro = (poly: Poly): OpPoly => {
  const flag = new PolyFlag();
  poly.vertices.forEach((p, i) => flag.newV(`v${i}`, unit(p)));
  const centers = faceCenters(poly);
  poly.faces.forEach((_, i) => flag.newV(`center${i}`, unit(centers[i])));
  for (let i = 0; i < poly.faces.length; i++) {
    const f = poly.faces[i];
    let [v1, v2] = f.slice(-2);
    for (const v3 of f) {
      flag.newV(`${v1}~${v2}`, oneThird(poly.vertices[v1], poly.vertices[v2]));
      const fname = `${i}f${v1}`;
      flag.newFlag(fname, `center${i}`, `${v1}~${v2}`);
      flag.newFlag(fname, `${v1}~${v2}`, `${v2}~${v1}`);
      flag.newFlag(fname, `${v2}~${v1}`, `v${v2}`);
      flag.newFlag(fname, `v${v2}`, `${v2}~${v3}`);
      flag.newFlag(fname, `${v2}~${v3}`, `center${i}`);
      v1 = v2;
      v2 = v3;
    }
  }
  const { vertices, faces } = flag.topoly();
  return { vertices, faces, name: `g${poly.name}` };
};

// propellor: skew faces from 1/3-edge points
const propellor = (poly: Poly): OpPoly => {
  const flag = new PolyFlag();
  poly.vertices.forEach((p, i) => flag.newV(`v${i}`, unit(p)));
  for (let i = 0; i < poly.faces.length; i++) {
    const f = poly.faces[i];
    let [v1, v2] = f.slice(-2);
    for (const v3 of f) {
      flag.newV(`${v1}~${v2}`, oneThird(poly.vertices[v1], poly.vertices[v2]));
      const fname = `${i}f${v2}`;
      flag.newFlag(`v${i}`, `${v1}~${v2}`, `${v2}~${v3}`);
      flag.newFlag(fname, `${v1}~${v2}`, `${v2}~${v1}`);
      flag.newFlag(fname, `${v2}~${v1}`, `v${v2}`);
      flag.newFlag(fname, `v${v2}`, `${v2}~${v3}`);
      flag.newFlag(fname, `${v2}~${v3}`, `${v1}~${v2}`);
      v1 = v2;
      v2 = v3;
    }
  }
  const { vertices, faces } = flag.topoly();
  return { vertices, faces, name: `p${poly.name}` };
};

// reflect through origin
const reflect = (poly: Poly): OpPoly => {
  return {
    vertices: poly.vertices.map((v) => mult(-1, v)),
    faces: poly.faces.map((f) => [...f].reverse()),
    name: `r${poly.name}`,
  };
};

// find the single vertex index shared by three faces (for dual face ordering)
const intersect3 = (set1: number[], set2: number[], set3: number[]): number => {
  for (const s1 of set1) {
    for (const s2 of set2) {
      if (s1 === s2) {
        for (const s3 of set3) {
          if (s1 === s3) return s1;
        }
      }
    }
  }
  return 0;
};

// dual: faces become vertices, vertices become faces
const dual = (poly: Poly): OpPoly => {
  const flag = new PolyFlag();
  // face table: for each vertex, the faces adjacent to it, indexed by next vertex
  const faceOf: Map<number, string>[] = poly.vertices.map(() => new Map());
  for (let i = 0; i < poly.faces.length; i++) {
    const f = poly.faces[i];
    let v1 = f[f.length - 1];
    for (const v2 of f) {
      faceOf[v1].set(v2, `${i}`);
      v1 = v2;
    }
  }
  const centers = faceCenters(poly);
  poly.faces.forEach((_, i) => flag.newV(`${i}`, centers[i]));
  for (let i = 0; i < poly.faces.length; i++) {
    const f = poly.faces[i];
    let v1 = f[f.length - 1];
    for (const v2 of f) {
      flag.newFlag(`${v1}`, faceOf[v2].get(v1) ?? `${i}`, `${i}`);
      v1 = v2;
    }
  }
  const dpoly = flag.topoly();
  // match F index ordering to V index ordering on the dual
  const sortF: number[][] = new Array(poly.vertices.length);
  for (const f of dpoly.faces) {
    const k = intersect3(poly.faces[f[0]], poly.faces[f[1]], poly.faces[f[2]]);
    sortF[k] = f;
  }
  const name = poly.name[0] === "d" ? poly.name.slice(1) : `d${poly.name}`;
  return { vertices: dpoly.vertices, faces: sortF.filter(Boolean), name };
};

// chamfer: new hexagonal face in place of each edge
const chamfer = (poly: Poly, dist = 0.5): OpPoly => {
  const flag = new PolyFlag();
  const normals = faceNormals(poly);
  for (let i = 0; i < poly.faces.length; i++) {
    const f = poly.faces[i];
    let v1 = f[f.length - 1];
    let v1new = `${i}_${v1}`;
    for (const v2 of f) {
      flag.newV(`${v2}`, mult(1.0 + dist, poly.vertices[v2]));
      const v2new = `${i}_${v2}`;
      flag.newV(v2new, add(poly.vertices[v2], mult(dist * 1.5, normals[i])));
      const facename = v1 < v2 ? `hex${v1}_${v2}` : `hex${v2}_${v1}`;
      flag.newFlag(`orig${i}`, v1new, v2new);
      flag.newFlag(facename, `${v2}`, v2new);
      flag.newFlag(facename, v2new, v1new);
      flag.newFlag(facename, v1new, `${v1}`);
      v1 = v2;
      v1new = v2new;
    }
  }
  const { vertices, faces } = flag.topoly();
  return { vertices, faces, name: `c${poly.name}` };
};

// whirl: gyro + truncation of face-centered vertices; two new hexagons per edge
const whirl = (poly: Poly): OpPoly => {
  const flag = new PolyFlag();
  poly.vertices.forEach((p, i) => flag.newV(`v${i}`, unit(p)));
  const centers = faceCenters(poly);
  for (let i = 0; i < poly.faces.length; i++) {
    const f = poly.faces[i];
    let [v1, v2] = f.slice(-2);
    for (const v3 of f) {
      const v1_2 = oneThird(poly.vertices[v1], poly.vertices[v2]);
      flag.newV(`${v1}~${v2}`, v1_2);
      const cv1name = `center${i}~${v1}`;
      const cv2name = `center${i}~${v2}`;
      flag.newV(cv1name, unit(oneThird(centers[i], v1_2)));
      const fname = `${i}f${v1}`;
      flag.newFlag(fname, cv1name, `${v1}~${v2}`);
      flag.newFlag(fname, `${v1}~${v2}`, `${v2}~${v1}`);
      flag.newFlag(fname, `${v2}~${v1}`, `v${v2}`);
      flag.newFlag(fname, `v${v2}`, `${v2}~${v3}`);
      flag.newFlag(fname, `${v2}~${v3}`, cv2name);
      flag.newFlag(fname, cv2name, cv1name);
      flag.newFlag(`c${i}`, cv1name, cv2name);
      v1 = v2;
      v2 = v3;
    }
  }
  const { vertices, faces } = flag.topoly();
  return { vertices, faces, name: `w${poly.name}` };
};

// quinto: pentagon per original face vertex + inset face
const quinto = (poly: Poly): OpPoly => {
  const flag = new PolyFlag();
  for (let i = 0; i < poly.faces.length; i++) {
    const f = poly.faces[i];
    const centroid = calcCentroid(f.map((idx) => poly.vertices[idx]));
    let [v1, v2] = f.slice(-2);
    for (const v3 of f) {
      const midpt = midpoint(poly.vertices[v1], poly.vertices[v2]);
      const innerpt = midpoint(midpt, centroid);
      flag.newV(midName(v1, v2), midpt);
      flag.newV(`inner_${i}_${midName(v1, v2)}`, innerpt);
      flag.newV(`${v2}`, poly.vertices[v2]);
      const fname = `f${i}_${v2}`;
      flag.newFlag(fname, `inner_${i}_${midName(v1, v2)}`, midName(v1, v2));
      flag.newFlag(fname, midName(v1, v2), `${v2}`);
      flag.newFlag(fname, `${v2}`, midName(v2, v3));
      flag.newFlag(fname, midName(v2, v3), `inner_${i}_${midName(v2, v3)}`);
      flag.newFlag(fname, `inner_${i}_${midName(v2, v3)}`, `inner_${i}_${midName(v1, v2)}`);
      flag.newFlag(`f_in_${i}`, `inner_${i}_${midName(v1, v2)}`, `inner_${i}_${midName(v2, v3)}`);
      v1 = v2;
      v2 = v3;
    }
  }
  const { vertices, faces } = flag.topoly();
  return { vertices, faces, name: `q${poly.name}` };
};

// insetN: inset each n-sided face (n=0: all), optionally popping out
const insetN = (poly: Poly, n: number, insetDist = 0.5, popoutDist = -0.2): OpPoly => {
  if (!n) n = 0;
  const flag = new PolyFlag();
  poly.vertices.forEach((p, i) => flag.newV(`v${i}`, p));
  const normals = faceNormals(poly);
  const centers = faceCenters(poly);
  for (let fi = 0; fi < poly.faces.length; fi++) {
    const f = poly.faces[fi];
    if (f.length === n || n === 0) {
      for (const v of f) {
        flag.newV(`f${fi}v${v}`, add(tween(poly.vertices[v], centers[fi], insetDist), mult(popoutDist, normals[fi])));
      }
    }
  }
  for (let fi = 0; fi < poly.faces.length; fi++) {
    const f = poly.faces[fi];
    let v1 = `v${f[f.length - 1]}`;
    for (const v of f) {
      const v2 = `v${v}`;
      if (f.length === n || n === 0) {
        const fname = `${fi}${v1}`;
        flag.newFlag(fname, v1, v2);
        flag.newFlag(fname, v2, `f${fi}${v2}`);
        flag.newFlag(fname, `f${fi}${v2}`, `f${fi}${v1}`);
        flag.newFlag(fname, `f${fi}${v1}`, v1);
        flag.newFlag(`ex${fi}`, `f${fi}${v1}`, `f${fi}${v2}`);
      } else {
        flag.newFlag(`${fi}`, v1, v2);
      }
      v1 = v2;
    }
  }
  const { vertices, faces } = flag.topoly();
  return { vertices, faces, name: `n${n === 0 ? "" : n}${poly.name}` };
};

// extrudeN: compat operator (inset with no inset distance, positive popout)
const extrudeN = (poly: Poly, n: number): OpPoly => {
  const np = insetN(poly, n, 0.0, 0.3);
  return { ...np, name: `x${n === 0 ? "" : n}${poly.name}` };
};

// loft: inset without popout
const loft = (poly: Poly, n: number, alpha: number): OpPoly => {
  const np = insetN(poly, n, alpha, 0.0);
  return { ...np, name: `l${n === 0 ? "" : n}${poly.name}` };
};

// perspectiva1: stellation from Perspectiva Corporum Regularium
const perspectiva1 = (poly: Poly): OpPoly => {
  const centers = faceCenters(poly);
  const flag = new PolyFlag();
  poly.vertices.forEach((p, i) => flag.newV(`v${i}`, p));
  for (let i = 0; i < poly.faces.length; i++) {
    const f = poly.faces[i];
    let v1 = `v${f[f.length - 2]}`;
    let v2 = `v${f[f.length - 1]}`;
    let vert1 = poly.vertices[f[f.length - 2]];
    let vert2 = poly.vertices[f[f.length - 1]];
    for (const v of f) {
      const v3 = `v${v}`;
      const v12 = `${v1}~${v2}`;
      const v21 = `${v2}~${v1}`;
      const v23 = `${v2}~${v3}`;
      flag.newV(v12, midpoint(midpoint(vert1, vert2), centers[i]));
      flag.newFlag(`in${i}`, v12, v23);
      flag.newFlag(`f${i}${v2}`, v23, v12);
      flag.newFlag(`f${i}${v2}`, v12, v2);
      flag.newFlag(`f${i}${v2}`, v2, v23);
      flag.newFlag(`f${v12}`, v1, v21);
      flag.newFlag(`f${v12}`, v21, v12);
      flag.newFlag(`f${v12}`, v12, v1);
      v1 = v2;
      v2 = v3;
      vert1 = vert2;
      vert2 = poly.vertices[v];
    }
  }
  const { vertices, faces } = flag.topoly();
  return { vertices, faces, name: `P${poly.name}` };
};

// limited Goldberg-Coxeter u_n for triangular meshes
const trisub = (poly: Poly, n = 2): OpPoly => {
  if (!n) n = 2;
  for (const f of poly.faces) {
    if (f.length !== 3) {
      return { vertices: poly.vertices, faces: poly.faces, name: poly.name };
    }
  }
  const newVs: Vec3[] = [];
  const vmap = new Map<string, number>();
  let pos = 0;
  poly.faces.forEach((f, fn) => {
    const v1 = poly.vertices[f[0]];
    const v2 = poly.vertices[f[1]];
    const v3 = poly.vertices[f[2]];
    for (let i = 0; i <= n; i++) {
      for (let j = 0; i + j <= n; j++) {
        const u = i / n;
        const w = j / n;
        newVs.push([
          (1 - u - w) * v1[0] + u * v2[0] + w * v3[0],
          (1 - u - w) * v1[1] + u * v2[1] + w * v3[1],
          (1 - u - w) * v1[2] + u * v2[2] + w * v3[2],
        ]);
        vmap.set(`v${fn}-${i}-${j}`, pos++);
      }
    }
  });
  const EPSILON_CLOSE = 1.0e-8;
  const uniqVs: Vec3[] = [];
  const uniqmap = new Map<number, number>();
  for (let i = 0; i < newVs.length; i++) {
    if (uniqmap.has(i)) continue;
    const newPos = uniqVs.length;
    uniqmap.set(i, newPos);
    uniqVs.push(newVs[i]);
    for (let j = i + 1; j < newVs.length; j++) {
      if (mag(sub(newVs[i], newVs[j])) < EPSILON_CLOSE) uniqmap.set(j, newPos);
    }
  }
  const faces: number[][] = [];
  poly.faces.forEach((_, fn) => {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j + i < n; j++) {
        faces.push([
          uniqmap.get(vmap.get(`v${fn}-${i}-${j}`)!)!,
          uniqmap.get(vmap.get(`v${fn}-${i + 1}-${j}`)!)!,
          uniqmap.get(vmap.get(`v${fn}-${i}-${j + 1}`)!)!,
        ]);
      }
    }
    for (let i = 1; i < n; i++) {
      for (let j = 0; j + i < n; j++) {
        faces.push([
          uniqmap.get(vmap.get(`v${fn}-${i}-${j}`)!)!,
          uniqmap.get(vmap.get(`v${fn}-${i}-${j + 1}`)!)!,
          uniqmap.get(vmap.get(`v${fn}-${i - 1}-${j + 1}`)!)!,
        ]);
      }
    }
  });
  return { vertices: uniqVs, faces, name: `u${n}${poly.name}` };
};

// ---------- geometric refinement operators (from geo_operators.js) ----------

// adjusts vertices on edges so each edge is tangent to an origin sphere
const tangentify = (vertices: Vec3[], edges: Array<[number, number]>): Vec3[] => {
  const STABILITY_FACTOR = 0.1;
  const newVs = vertices.map((v) => [...v] as Vec3);
  for (const [a, b] of edges) {
    const t = tangentPoint(newVs[a], newVs[b]);
    const c = mult(((STABILITY_FACTOR * 1) / 2) * (1 - mag(t)), t);
    newVs[a] = add(newVs[a], c);
    newVs[b] = add(newVs[b], c);
  }
  return newVs;
};

// recenters so the center of mass is at origin
const recenter = (vertices: Vec3[], edges: Array<[number, number]>): Vec3[] => {
  const edgecenters = edges.map(([a, b]) => tangentPoint(vertices[a], vertices[b]));
  let polycenter: Vec3 = [0, 0, 0];
  for (const c of edgecenters) polycenter = add(polycenter, c);
  polycenter = mult(1 / (edges.length || 1), polycenter);
  return vertices.map((v) => sub(v, polycenter));
};

// adjusts vertices in each face to improve planarity
const planarize = (vertices: Vec3[], poly: Poly): Vec3[] => {
  const STABILITY_FACTOR = 0.1;
  const newVs = vertices.map((v) => [...v] as Vec3);
  for (const f of poly.faces) {
    const coords = f.map((v) => vertices[v]);
    let n = normal(coords);
    const c = calcCentroid(coords);
    if (dot(n, c) < 0) n = mult(-1, n);
    for (const v of f) {
      const adjustment = mult(dot(mult(STABILITY_FACTOR, n), sub(c, vertices[v])), n);
      newVs[v] = add(newVs[v], adjustment);
    }
  }
  return newVs;
};

// slow canonicalization: tangent + recenter + planarize, iterated
const canonicalize = (poly: Poly, nIter: number): OpPoly => {
  if (!nIter) nIter = 1;
  const faces = poly.faces;
  const edges = edgesOf(poly);
  let newVs = poly.vertices;
  for (let i = 0; i <= nIter; i++) {
    const oldVs = newVs.map((v) => [...v] as Vec3);
    newVs = tangentify(newVs, edges);
    newVs = recenter(newVs, edges);
    newVs = planarize(newVs, { ...poly, vertices: newVs });
    let maxChange = 0;
    for (let j = 0; j < newVs.length; j++) {
      maxChange = Math.max(maxChange, mag(sub(newVs[j], oldVs[j])));
    }
    if (maxChange < 1e-8) break;
  }
  return { vertices: newVs, faces, name: poly.name };
};

// spherical reciprocals of face centers
const reciprocalC = (poly: Poly): Vec3[] => {
  return faceCenters(poly).map((c) => reciprocal(c));
};

// vertices reciprocal to face planes
const reciprocalN = (poly: Poly): Vec3[] => {
  const ans: Vec3[] = [];
  for (const f of poly.faces) {
    let centroid: Vec3 = [0, 0, 0];
    let normalV: Vec3 = [0, 0, 0];
    let avgEdgeDist = 0.0;
    let [v1, v2] = f.slice(-2);
    for (const v3 of f) {
      centroid = add(centroid, poly.vertices[v3]);
      normalV = add(normalV, orthogonal(poly.vertices[v1], poly.vertices[v2], poly.vertices[v3]));
      avgEdgeDist += edgeDist(poly.vertices[v1], poly.vertices[v2]);
      v1 = v2;
      v2 = v3;
    }
    centroid = mult(1 / f.length, centroid);
    normalV = unit(normalV);
    avgEdgeDist = avgEdgeDist / f.length;
    const tmp = reciprocal(mult(dot(centroid, normalV), normalV));
    ans.push(mult((1 + avgEdgeDist) / 2, tmp));
  }
  return ans;
};

// quick canonicalization via dual reciprocation
const canonicalXYZ = (poly: Poly, nIterations: number): OpPoly => {
  if (!nIterations) nIterations = 1;
  const dpoly = dual(poly);
  const dpolyFull: Poly = { ...dpoly, faceClasses: [] };
  for (let count = 0; count < nIterations; count++) {
    dpolyFull.vertices = reciprocalN(poly);
    poly.vertices = reciprocalN(dpolyFull);
  }
  return { vertices: poly.vertices, faces: poly.faces, name: poly.name };
};

// quick planarization via dual reciprocation of face centers
const adjustXYZ = (poly: Poly, nIterations: number): OpPoly => {
  if (!nIterations) nIterations = 1;
  const dpoly = dual(poly);
  const dpolyFull: Poly = { ...dpoly, faceClasses: [] };
  for (let count = 0; count < nIterations; count++) {
    dpolyFull.vertices = reciprocalC(poly);
    poly.vertices = reciprocalC(dpolyFull);
  }
  return { vertices: poly.vertices, faces: poly.faces, name: poly.name };
};

// ---------- recipe expansion (from parser.js) ----------

// shorthand equivalences applied before parsing
const specreplacements: Array<[RegExp, string]> = [
  [/e/g, "aa"],
  [/b/g, "ta"],
  [/o/g, "jj"],
  [/m/g, "kj"],
  [/t(\d*)/g, "dk$1d"],
  [/j/g, "dad"],
  [/s/g, "dgd"],
  [/dd/g, ""],
  [/ad/g, "a"],
  [/gd/g, "g"],
  [/aO/g, "aC"],
  [/aI/g, "aD"],
  [/gO/g, "gC"],
  [/gI/g, "gD"],
];

// tokenize an operator chain: lowercase letter optionally followed by a number
const tokenize = (ops: string): Array<{ op: string; arg?: number }> => {
  const tokens: Array<{ op: string; arg?: number }> = [];
  const re = /([a-zA-Z])(\d+(?:\.\d+)?|\.\d+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(ops)) !== null) {
    tokens.push({ op: m[1], arg: m[2] !== undefined ? parseFloat(m[2]) : undefined });
  }
  return tokens;
};

function applyOp(poly: Poly, op: string, arg: number | undefined): Poly {
  const a = arg;
  const toPoly = (p: OpPoly): Poly => ({ vertices: p.vertices, faces: p.faces, faceClasses: [], name: p.name });
  switch (op) {
    case "d": return toPoly(dual(poly));
    case "a": return toPoly(ambo(poly));
    case "k": return toPoly(kisN(poly, a ?? 0));
    case "kis": return toPoly(kisN(poly, a ?? 0));
    case "g": return toPoly(gyro(poly));
    case "p": return toPoly(propellor(poly));
    case "r": return toPoly(reflect(poly));
    case "c": return toPoly(chamfer(poly, a ?? 0.5));
    case "w": return toPoly(whirl(poly));
    case "q": return toPoly(quinto(poly));
    case "n": return toPoly(insetN(poly, a ?? 0));
    case "n2": return toPoly(insetN(poly, a ?? 0));
    case "x": return toPoly(extrudeN(poly, a ?? 0));
    case "l": return toPoly(loft(poly, a ?? 0, 0.5));
    case "P": return toPoly(perspectiva1(poly));
    case "u": return toPoly(trisub(poly, a ?? 2));
    case "C": return toPoly(canonicalize(poly, a ?? 100));
    case "A": return toPoly(adjustXYZ(poly, a ?? 100));
    case "K": return toPoly(canonicalXYZ(poly, a ?? 100));
    default: throw new Error(`Unknown polyhedronisme operator: ${op}`);
  }
}

// ---------- Platonic seeds (from polyhedron.js) ----------

const seeds: Record<string, () => Poly> = {
  T: () => ({
    name: "T",
    faceClasses: [],
    faces: [[0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]],
    vertices: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]],
  }),
  C: () => ({
    name: "C",
    faceClasses: [],
    faces: [
      [3, 0, 1, 2], [3, 4, 5, 0], [0, 5, 6, 1],
      [1, 6, 7, 2], [2, 7, 4, 3], [5, 4, 7, 6],
    ],
    vertices: [
      [0.707, 0.707, 0.707], [-0.707, 0.707, 0.707], [-0.707, -0.707, 0.707], [0.707, -0.707, 0.707],
      [0.707, -0.707, -0.707], [0.707, 0.707, -0.707], [-0.707, 0.707, -0.707], [-0.707, -0.707, -0.707],
    ],
  }),
  O: () => ({
    name: "O",
    faceClasses: [],
    faces: [
      [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1],
      [1, 4, 5], [1, 5, 2], [2, 5, 3], [3, 5, 4],
    ],
    vertices: [
      [0, 0, 1.414], [1.414, 0, 0], [0, 1.414, 0],
      [-1.414, 0, 0], [0, -1.414, 0], [0, 0, -1.414],
    ],
  }),
  I: () => ({
    name: "I",
    faceClasses: [],
    faces: [
      [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 1],
      [1, 5, 7], [1, 7, 6], [1, 6, 2], [2, 6, 8], [2, 8, 3],
      [3, 8, 9], [3, 9, 4], [4, 9, 10], [4, 10, 5], [5, 10, 7],
      [6, 7, 11], [6, 11, 8], [7, 10, 11], [8, 11, 9], [9, 11, 10],
    ],
    vertices: [
      [0, 0, 1.176], [1.051, 0, 0.526], [0.324, 1.0, 0.525], [-0.851, 0.618, 0.526],
      [-0.851, -0.618, 0.526], [0.325, -1.0, 0.526], [0.851, 0.618, -0.526], [0.851, -0.618, -0.526],
      [-0.325, 1.0, -0.526], [-1.051, 0, -0.526], [-0.325, -1.0, -0.526], [0, 0, -1.176],
    ],
  }),
  D: () => ({
    name: "D",
    faceClasses: [],
    faces: [
      [0, 1, 4, 7, 2], [0, 2, 6, 9, 3], [0, 3, 8, 5, 1],
      [1, 5, 11, 10, 4], [2, 7, 13, 12, 6], [3, 9, 15, 14, 8],
      [4, 10, 16, 13, 7], [5, 8, 14, 17, 11], [6, 12, 18, 15, 9],
      [10, 11, 17, 19, 16], [12, 13, 16, 19, 18], [14, 15, 18, 19, 17],
    ],
    vertices: [
      [0, 0, 1.07047], [0.713644, 0, 0.797878], [-0.356822, 0.618, 0.797878], [-0.356822, -0.618, 0.797878],
      [0.797878, 0.618034, 0.356822], [0.797878, -0.618, 0.356822], [-0.934172, 0.381966, 0.356822],
      [0.136294, 1.0, 0.356822], [0.136294, -1.0, 0.356822], [-0.934172, -0.381966, 0.356822],
      [0.934172, 0.381966, -0.356822], [0.934172, -0.381966, -0.356822], [-0.797878, 0.618, -0.356822],
      [-0.136294, 1.0, -0.356822], [-0.136294, -1.0, -0.356822], [-0.797878, -0.618034, -0.356822],
      [0.356822, 0.618, -0.797878], [0.356822, -0.618, -0.797878], [-0.713644, 0, -0.797878],
      [0, 0, -1.07047],
    ],
  }),
};

export const SEED_NAMES = Object.keys(seeds);

// ---------- public API ----------

export interface GeneratedPolyhedron extends Poly {
  recipe: string;
}

// Create a polyhedron from a recipe like "gD", "k5k5I", "aaC", "k3jD"
export function generatePoly(recipe: string): GeneratedPolyhedron {
  let expanded = recipe;
  for (const [orig, equiv] of specreplacements) {
    expanded = expanded.replace(orig, equiv);
  }
  const seedMatch = expanded.match(/([TOCID])\s*$/);
  if (!seedMatch) {
    throw new Error(`Recipe must end with a Platonic seed (T, O, C, I, D): "${recipe}"`);
  }
  const seedName = seedMatch[1];
  const opsPart = expanded.slice(0, seedMatch.index).replace(/[^a-zA-Z0-9.]/g, "");

  let poly: Poly = seeds[seedName]();
  poly = recenterAndRescale(poly);

  // Conway notation composes right-to-left: "akD" = a(k(D)).
  const ops = tokenize(opsPart).reverse();
  for (const { op, arg } of ops) {
    poly = applyOp(poly, op, arg);
    poly = recenterAndRescale(poly);
  }

  poly = recenterAndRescale(poly);
  paintPolyhedron(poly);
  return { ...poly, recipe };
}

// Euler characteristic sanity check: V - E + F should be 2 for convex polyhedra
export function eulerCharacteristic(poly: Poly): number {
  const E = edgesOf(poly).length;
  return poly.vertices.length - E + poly.faces.length;
}
