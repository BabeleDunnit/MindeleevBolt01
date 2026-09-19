export interface Axial {
  q: number;
  r: number;
}

export interface RingCoord {
  ring: number;
  idx: number;
}

const SQRT3 = Math.sqrt(3);

// Clockwise neighbor directions in axial coords, starting from the side that
// leaves the north corner toward the northeast corner (flat-top orientation).
const DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [0, -1],
  [1, -1],
];

// Corner hex of each side for ring N; side s starts here and takes N steps
// along DIRS[s]. Side 0 starts at the north corner (0, -N).
function sideStart(ring: number, side: number): Axial {
  const start: Axial = { q: 0, r: -ring };
  for (let s = 0; s < side; s++) {
    start.q += ring * DIRS[s][0];
    start.r += ring * DIRS[s][1];
  }
  return start;
}

export function axialToPixel(axial: Axial, size: number): { x: number; y: number } {
  return {
    x: size * 1.5 * axial.q,
    y: size * SQRT3 * (axial.r + axial.q / 2),
  };
}

export function hexDistance(axial: Axial): number {
  return (Math.abs(axial.q) + Math.abs(axial.r) + Math.abs(axial.q + axial.r)) / 2;
}

export function pixelToAxial(x: number, y: number, size: number): Axial {
  const qf = ((2 / 3) * x) / size;
  const rf = (-x / 3 + (SQRT3 / 3) * y) / size;
  const xf = qf;
  const zf = rf;
  const yf = -xf - zf;

  let q = Math.round(xf);
  let r = Math.round(zf);
  const s = Math.round(yf);
  const dq = Math.abs(q - xf);
  const dr = Math.abs(r - zf);
  const ds = Math.abs(s - yf);
  if (dq > dr && dq > ds) {
    q = -r - s;
  } else if (dr > ds) {
    r = -q - s;
  }
  return { q, r };
}

export function axialToRingIdx(axial: Axial): RingCoord {
  const ring = hexDistance(axial);
  if (ring === 0) return { ring: 0, idx: 0 };
  for (let side = 0; side < 6; side++) {
    const [dq, dr] = DIRS[side];
    const start = sideStart(ring, side);
    let k: number;
    if (dq !== 0) {
      if ((axial.q - start.q) % dq !== 0) continue;
      k = (axial.q - start.q) / dq;
    } else {
      if ((axial.r - start.r) % dr !== 0) continue;
      k = (axial.r - start.r) / dr;
    }
    if (
      Number.isInteger(k) &&
      k >= 0 &&
      k < ring &&
      start.q + k * dq === axial.q &&
      start.r + k * dr === axial.r
    ) {
      return { ring, idx: side * ring + k };
    }
  }
  // Unreachable for valid axial coords on a ring.
  return { ring, idx: 0 };
}

export function ringIdxToAxial(coord: RingCoord): Axial {
  if (coord.ring === 0) return { q: 0, r: 0 };
  const total = 6 * coord.ring;
  const idx = ((coord.idx % total) + total) % total;
  const side = Math.floor(idx / coord.ring);
  const k = idx - side * coord.ring;
  const [dq, dr] = DIRS[side];
  const start = sideStart(coord.ring, side);
  return { q: start.q + k * dq, r: start.r + k * dr };
}

export function hexCorners(cx: number, cy: number, size: number): Array<[number, number]> {
  const corners: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    corners.push([cx + size * Math.cos(angle), cy + size * Math.sin(angle)]);
  }
  return corners;
}

export function* hexesUpToRing(maxRing: number): Generator<RingCoord & { axial: Axial }> {
  for (let ring = 0; ring <= maxRing; ring++) {
    const count = ring === 0 ? 1 : 6 * ring;
    for (let idx = 0; idx < count; idx++) {
      const axial = ringIdxToAxial({ ring, idx });
      yield { ring, idx, axial };
    }
  }
}
