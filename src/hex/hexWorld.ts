import * as THREE from "three";
import { axialToPixel, ringIdxToAxial, type Axial, type RingCoord } from "@/hex/hexGrid";

// World units: HEX_SIZE is the hexagon's circumradius (center -> corner).
export const HEX_SIZE = 10;

export function axialToWorld(axial: Axial): THREE.Vector2 {
  const { x, y } = axialToPixel(axial, HEX_SIZE);
  return new THREE.Vector2(x, y);
}

export function hexKey(coord: RingCoord): string {
  return `${coord.ring}:${coord.idx}`;
}

export function keyToCoord(key: string): RingCoord {
  const [ring, idx] = key.split(":").map(Number);
  return { ring, idx };
}

export const WORLD_EXTENT = 25; // default rings of hexes drawn around center

export function* hexesInWorld(
  maxRing: number = WORLD_EXTENT
): Generator<{ coord: RingCoord; axial: Axial; pos: THREE.Vector2 }> {
  for (let ring = 0; ring <= maxRing; ring++) {
    const count = ring === 0 ? 1 : 6 * ring;
    for (let idx = 0; idx < count; idx++) {
      const coord: RingCoord = { ring, idx };
      const axial = ringIdxToAxial(coord);
      yield { coord, axial, pos: axialToWorld(axial) };
    }
  }
}
